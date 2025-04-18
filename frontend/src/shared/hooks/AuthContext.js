// src/shared/hooks/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Default timeout in milliseconds (5 minutes)
const DEFAULT_TIMEOUT = 5 * 60 * 1000;

// Debounce timeout for schedule updates (800ms)
const SCHEDULE_UPDATE_DEBOUNCE = 800;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Check if this was a forced reload
  useEffect(() => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const isReloaded = urlParams.get('reloaded') === 'true';
    const dualScreen = urlParams.get('dualScreen') === 'true';
    const fromStaffScreen = urlParams.get('fromStaffScreen') === 'true';
    
    // Check localStorage for reload flags
    const explicitReload = localStorage.getItem('explicit_reload_requested') === 'true';
    const reloadTimestamp = localStorage.getItem('reload_timestamp');
    
    if (isReloaded || explicitReload) {
      console.log('====== PAGE WAS EXPLICITLY RELOADED ======');
      console.log('URL params - reloaded:', isReloaded, 'dualScreen:', dualScreen, 'fromStaffScreen:', fromStaffScreen);
      console.log('localStorage - explicitReload:', explicitReload, 'timestamp:', reloadTimestamp ? new Date(parseInt(reloadTimestamp)).toLocaleTimeString() : 'none');
      
      // Clear the reload flags
      localStorage.removeItem('explicit_reload_requested');
      localStorage.removeItem('reload_timestamp');
    }
    
    if (dualScreen && fromStaffScreen) {
      console.log('This is the patient screen in dual screen mode');
    }
  }, []);
  
  const [mode, setModeState] = useState(() => {
    // Check URL query parameter for mode first
    const urlParams = new URLSearchParams(window.location.search);
    const urlMode = urlParams.get('mode');
    if (urlMode === 'staff' || urlMode === 'patient') {
      return urlMode;
    }
    // Otherwise initialize from localStorage if available
    return localStorage.getItem('mode') || 'patient';
  });
  
  // Initialize user state from localStorage if available
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('userData');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timeoutId, setTimeoutId] = useState(null);
  const [patientWindow, setPatientWindow] = useState(null);
  const [isDualScreen, setIsDualScreen] = useState(false);
  
  // Store nurse-selected patient ID
  const [nurseSelectedPatientId, setNurseSelectedPatientId] = useState(() => {
    return localStorage.getItem('nurseSelectedPatientId') || null;
  });
  
  // Store patient ID for patient mode
  const [patientId, setPatientId] = useState(() => {
    return localStorage.getItem('patientId') || null;
  });
  
  const navigate = useNavigate();
  
  // Initialize dual screen mode on load
  useEffect(() => {
    // Check if we should initialize dual screen mode
    const urlParams = new URLSearchParams(window.location.search);
    const dualScreen = urlParams.get('dualScreen') === 'true';
    const patientWindowOpened = localStorage.getItem('patientWindowOpened') === 'true';
    
    // Check for dual screen from either URL parameters or localStorage
    if (dualScreen || patientWindowOpened) {
      console.log("Dual screen mode detected:", dualScreen ? "from URL" : "from localStorage");
      setIsDualScreen(true);
      
      if (urlParams.get('fromStaffScreen') === 'true') {
        // This is the patient window opened from staff screen
        console.log("Initializing as patient window in dual screen mode");
        setModeState('patient');
        localStorage.setItem('mode', 'patient');
        
        // When this window closes, notify the opener (staff screen)
        window.addEventListener('beforeunload', () => {
          try {
            if (window.opener) {
              window.opener.postMessage({ type: 'patientWindowClosed' }, window.location.origin);
            }
            localStorage.removeItem('patientWindowOpened');
          } catch (e) {
            console.error("Error cleaning up on window close:", e);
          }
        });
        
        // Send a message to staff window to confirm dual screen mode
        if (window.opener) {
          try {
            window.opener.postMessage({ 
              type: 'confirmDualScreen',
              timestamp: Date.now()
            }, window.location.origin);
          } catch (e) {
            console.error("Error sending confirm message:", e);
          }
        }
      } else {
        // This is likely the staff screen
        console.log("Initializing as staff window in dual screen mode");
        
        // If mode is not already set, default to staff
        if (mode !== 'patient') {
          setModeState('staff');
          localStorage.setItem('mode', 'staff');
        }
        
        // Set patientWindowOpened to true in localStorage
        localStorage.setItem('patientWindowOpened', 'true');
        
        // Check if patient window is still open
        const checkWindowInterval = setInterval(() => {
          if (!localStorage.getItem('patientWindowOpened')) {
            console.log("Patient window is closed, resetting dual screen mode");
            clearInterval(checkWindowInterval);
            setIsDualScreen(false);
          }
        }, 1000);
        
        window.dualScreenCheckInterval = checkWindowInterval;
      }
    }
    
    // Set up message passing between windows for synchronization
    window.addEventListener('message', handleWindowMessage);
    
    // Cleanup function
    return () => {
      window.removeEventListener('message', handleWindowMessage);
      
      // Clear the interval if it exists
      if (window.dualScreenCheckInterval) {
        clearInterval(window.dualScreenCheckInterval);
        window.dualScreenCheckInterval = null;
      }
    };
  }, [mode]);
  
  // Add state to track debounced updates
  const [scheduleSyncTimeout, setScheduleSyncTimeout] = useState(null);
  const [lastScheduleData, setLastScheduleData] = useState(null);
  
  // Function to synchronize data to patient screen in dual screen mode
  const syncDataToPatientScreen = (updateType, data) => {
    console.log(`Syncing ${updateType} to patient screen:`, data);
    
    // Only proceed if in dual screen mode and this is the staff screen
    if (!isDualScreen || mode !== 'staff') {
      console.log('Not in dual screen mode or not on staff screen, skipping sync');
      return;
    }

    // For schedule updates, debounce the sync to avoid constant refreshing during typing
    if (updateType === 'scheduleUpdate') {
      // Clear any existing timeout
      if (scheduleSyncTimeout) {
        clearTimeout(scheduleSyncTimeout);
      }
      
      // Store the latest data
      setLastScheduleData(data);
      
      // Set a new timeout to sync after debounce period
      const timeoutId = setTimeout(() => {
        console.log('Debounced schedule update syncing now');
        performSync('scheduleUpdate', lastScheduleData || data);
      }, SCHEDULE_UPDATE_DEBOUNCE);
      
      setScheduleSyncTimeout(timeoutId);
      
      // Also dispatch local events immediately for responsive UI
      window.dispatchEvent(new CustomEvent('scheduleChanged', {
        detail: { schedule: data, timestamp: Date.now() }
      }));
      
      return;
    }
    
    // For other update types, sync immediately
    performSync(updateType, data);
  };
  
  // Helper function to actually perform the sync
  const performSync = (updateType, data) => {
    const timestamp = Date.now();
    
    // Try to send message to patient window
    if (patientWindow && !patientWindow.closed) {
      console.log('Sending update via window reference:', updateType, data);
      try {
        // Different message types
        if (updateType === 'scheduleUpdate') {
          patientWindow.postMessage({
            type: 'scheduleUpdate',
            schedule: data,
            timestamp
          }, window.location.origin);
        } else if (updateType === 'patientInfoUpdate') {
          // For status updates, make sure we properly format the message
          patientWindow.postMessage({
            type: 'patientInfoUpdate',
            patientInfo: data,
            timestamp
          }, window.location.origin);
          
          // For status updates (from patient to staff), make sure to update local storage
          // This ensures the status is reflected immediately in both windows
          if (data && data.status) {
            // Store updated status in localStorage for cross-window sync
            localStorage.setItem('patientStatus', data.status);
            localStorage.setItem('patientStatusTimestamp', timestamp.toString());
            
            // Dispatch a patientStatusChanged event for local components to react
            window.dispatchEvent(new CustomEvent('patientStatusChanged', {
              detail: {
                status: data.status,
                timestamp: timestamp
              }
            }));
          }
        } else if (updateType === 'forceReload') {
          // Explicit force reload message
          patientWindow.postMessage({
            type: 'forceReload',
            timestamp
          }, window.location.origin);
        } else if (updateType === 'nurseCall') {
          // Handle nurse call separately
          patientWindow.postMessage({
            type: 'nurseCall',
            data: data,
            timestamp
          }, window.location.origin);
          
          // Also update status to critical for nurse calls
          localStorage.setItem('patientStatus', 'critical');
          localStorage.setItem('patientStatusTimestamp', timestamp.toString());
          
          // Dispatch a patientStatusChanged event for local components
          window.dispatchEvent(new CustomEvent('patientStatusChanged', {
            detail: {
              status: 'critical',
              timestamp: timestamp
            }
          }));
        }
      } catch (error) {
        console.error('Error sending message to patient window:', error);
      }
    } else {
      // Try to find the window by name
      const windowByName = window.open('', 'patientView');
      if (windowByName && !windowByName.closed) {
        console.log('Sending update via window name');
        try {
          // Different message types
          if (updateType === 'scheduleUpdate') {
            windowByName.postMessage({
              type: 'scheduleUpdate',
              schedule: data,
              timestamp
            }, window.location.origin);
          } else if (updateType === 'patientInfoUpdate') {
            windowByName.postMessage({
              type: 'patientInfoUpdate',
              patientInfo: data,
              timestamp
            }, window.location.origin);
            
            // Force reload only for major patient info updates
            windowByName.postMessage({
              type: 'forceReload',
              timestamp
            }, window.location.origin);
          }
        } catch (error) {
          console.error('Error sending message to patient window:', error);
        }
      } else {
        console.warn('Could not find patient window for sync');
      }
    }
    
    // Also dispatch local events for any components that might be listening
    if (updateType === 'scheduleUpdate') {
      window.dispatchEvent(new CustomEvent('scheduleChanged', {
        detail: { schedule: data, timestamp }
      }));
    } else if (updateType === 'patientInfoUpdate') {
      // Patient info update received
      console.log('Received patient info update from window message:', data.patientInfo);
      
      // If this is a status update and we're in staff mode, capture it in localStorage too
      if (mode === 'staff' && data.patientInfo && data.patientInfo.status) {
        const timestamp = data.timestamp || Date.now();
        const status = data.patientInfo.status;
        
        console.log('Updating status in localStorage from patient window:', status);
        localStorage.setItem('patientStatus', status);
        localStorage.setItem('patientStatusTimestamp', timestamp.toString());
        
        // Also dispatch a direct status changed event for immediate UI update
        window.dispatchEvent(new CustomEvent('patientStatusChanged', {
          detail: {
            status: status,
            timestamp: timestamp
          }
        }));
      }
      
      // Dispatch event to update components
      window.dispatchEvent(new CustomEvent('patientInfoChanged', {
        detail: {
          patientInfo: data.patientInfo,
          timestamp: data.timestamp || Date.now()
        }
      }));
    } else if (updateType === 'forceReload') {
      // Force reload request received
      console.log('Received force reload request at:', new Date().toLocaleTimeString());
      
      // Only reload if in patient mode
      if (mode === 'patient') {
        console.log('Processing force reload in patient mode');
        
        // Store current status to ensure it persists through reload
        const currentStatus = localStorage.getItem('patientStatus');
        if (currentStatus) {
          console.log('Preserving patient status through reload:', currentStatus);
          localStorage.setItem('persistStatusThroughReload', currentStatus);
        }
        
        // Set a small delay before reloading to allow other state updates to complete
        setTimeout(() => {
          console.log('Executing patient window reload');
          window.location.reload();
        }, 100);
      } else {
        console.log('Ignoring force reload request in non-patient mode');
      }
    }
  };
  
  // Handle messages between windows
  const handleWindowMessage = (event) => {
    // Only accept messages from our own domain
    if (event.origin !== window.location.origin) return;
    
    console.log('Received window message:', event.data);
    
    // Handle different message types
    if (event.data.type === 'patientSelect') {
      console.log('Received patient selection update:', event.data.patientId);
      
      // Check if this is a new message with a newer timestamp
      const lastTimestamp = parseInt(localStorage.getItem('lastMessageTimestamp') || '0');
      const newTimestamp = event.data.timestamp || Date.now();
      
      if (newTimestamp <= lastTimestamp) {
        console.log('Ignoring outdated message');
        return;
      }
      
      // Update the timestamp
      localStorage.setItem('lastMessageTimestamp', newTimestamp.toString());
      
      // If cache invalidation is requested, set the flag
      if (event.data.invalidateCache) {
        localStorage.setItem('invalidateCache', 'true');
      }
      
      // Update both the state and localStorage
      setNurseSelectedPatientId(event.data.patientId);
      localStorage.setItem('nurseSelectedPatientId', event.data.patientId);
      localStorage.setItem('selectedPatientId', event.data.patientId);
      localStorage.setItem('patientChangeTimestamp', Date.now().toString());
      
      // If we're in patient mode, trigger a UI refresh
      if (mode === 'patient') {
        console.log('Patient screen updating to show:', event.data.patientId);
        
        // Dispatch a custom event to notify components
        window.dispatchEvent(new CustomEvent('patientChanged', { 
          detail: { 
            patientId: event.data.patientId,
            timestamp: newTimestamp,
            forceRefresh: true,
            invalidateCache: event.data.invalidateCache || false  // Pass along the flag
          }
        }));
        
        // Reload the page if requested and this is a recent message
        if (event.data.forceReload && (Date.now() - newTimestamp < 10000)) {
          console.log('Force reloading patient page');
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      }
    } else if (event.data.type === 'patientWindowClosed') {
      // Patient window was closed, reset dual screen mode
      console.log("Received notification that patient window was closed");
      localStorage.removeItem('patientWindowOpened');
      setIsDualScreen(false);
    } else if (event.data.type === 'confirmDualScreen') {
      // Confirmation from patient window that dual screen is active
      console.log("Received dual screen confirmation from patient window");
      setIsDualScreen(true);
      localStorage.setItem('patientWindowOpened', 'true');
      
      // Store a reference to the source window if possible
      if (event.source && !event.source.closed) {
        console.log("Storing reference to patient window");
        setPatientWindow(event.source);
      }
    } else if (event.data.type === 'scheduleUpdate') {
      // Schedule update received
      console.log('Received schedule update:', event.data.schedule);
      
      // Dispatch event to update components
      window.dispatchEvent(new CustomEvent('scheduleChanged', {
        detail: {
          schedule: event.data.schedule,
          timestamp: event.data.timestamp || Date.now()
        }
      }));
    } else if (event.data.type === 'patientInfoUpdate') {
      // Patient info update received
      console.log('Received patient info update from window message:', event.data.patientInfo);
      
      // If this is a status update and we're in staff mode, capture it in localStorage too
      if (mode === 'staff' && event.data.patientInfo && event.data.patientInfo.status) {
        const timestamp = event.data.timestamp || Date.now();
        const status = event.data.patientInfo.status;
        
        console.log('Updating status in localStorage from patient window:', status);
        localStorage.setItem('patientStatus', status);
        localStorage.setItem('patientStatusTimestamp', timestamp.toString());
        
        // Also dispatch a direct status changed event for immediate UI update
        window.dispatchEvent(new CustomEvent('patientStatusChanged', {
          detail: {
            status: status,
            timestamp: timestamp
          }
        }));
      }
      
      // Dispatch event to update components
      window.dispatchEvent(new CustomEvent('patientInfoChanged', {
        detail: {
          patientInfo: event.data.patientInfo,
          timestamp: event.data.timestamp || Date.now()
        }
      }));
    } else if (event.data.type === 'nurseCall') {
      // Handle nurse call separately
      console.log('Received nurse call from patient window:', event.data.data);
      
      // If we're in staff mode, show an alert or notification
      if (mode === 'staff') {
        // Update status to critical
        localStorage.setItem('patientStatus', 'critical');
        localStorage.setItem('patientStatusTimestamp', Date.now().toString());
        
        // Dispatch a patientStatusChanged event
        window.dispatchEvent(new CustomEvent('patientStatusChanged', {
          detail: {
            status: 'critical',
            timestamp: Date.now()
          }
        }));
        
        // Also dispatch a specific nurse call event
        window.dispatchEvent(new CustomEvent('nurseCallRequested', { 
          detail: event.data.data || { timestamp: Date.now() }
        }));
      }
    } else if (event.data.type === 'forceReload') {
      // Force reload request received
      console.log('Received force reload request at:', new Date().toLocaleTimeString());
      
      // Only reload if in patient mode
      if (mode === 'patient') {
        console.log('Processing force reload in patient mode');
        
        // Store current status to ensure it persists through reload
        const currentStatus = localStorage.getItem('patientStatus');
        if (currentStatus) {
          console.log('Preserving patient status through reload:', currentStatus);
          localStorage.setItem('persistStatusThroughReload', currentStatus);
        }
        
        // Set a small delay before reloading to allow other state updates to complete
        setTimeout(() => {
          console.log('Executing patient window reload');
          window.location.reload();
        }, 100);
      } else {
        console.log('Ignoring force reload request in non-patient mode');
      }
    }
  };

  const clearPatientSelection = () => {
    console.log("Clearing patient selection");
    
    // Clear localStorage
    localStorage.removeItem('nurseSelectedPatientId');
    localStorage.removeItem('selectedPatientId');
    localStorage.removeItem('patientChangeTimestamp');
    
    // Clear state
    setNurseSelectedPatientId(null);
  };
  
  
  // Function to update the nurse-selected patient
  // In AuthContext.js - updateNurseSelectedPatient function
const updateNurseSelectedPatient = (patientId) => {
  console.log('Saving nurse-selected patient:', patientId);
  
  // Update state
  setNurseSelectedPatientId(patientId);
  
  // Update localStorage in all cases
  localStorage.setItem('nurseSelectedPatientId', patientId);
  localStorage.setItem('selectedPatientId', patientId);
  
  // Add a flag to indicate cache should be invalidated
  localStorage.setItem('invalidateCache', 'true');
  
  // Set a timestamp to help with sync detection
  localStorage.setItem('patientChangeTimestamp', Date.now().toString());
  
  // If in dual screen mode and this is staff screen, sync with patient screen
  if (isDualScreen && mode === 'staff') {
    try {
      // Try different approaches to message the patient window
      
      // Approach 1: Use the stored window reference
      if (patientWindow && !patientWindow.closed) {
        console.log('Sending patient update via window reference:', patientId);
        patientWindow.postMessage({
          type: 'patientSelect',
          patientId: patientId,
          timestamp: Date.now(),
          forceReload: true,
          invalidateCache: true  // Add this flag
        }, window.location.origin);
      } 
      // Approach 2: Try to find the window by name
      else {
        const windowByName = window.open('', 'patientView');
        if (windowByName && !windowByName.closed) {
          console.log('Sending patient update via window name:', patientId);
          windowByName.postMessage({
            type: 'patientSelect',
            patientId: patientId,
            timestamp: Date.now(),
            forceReload: true,
            invalidateCache: true  // Add this flag
          }, window.location.origin);
        } else {
          console.warn('Could not find patient window, using localStorage only');
        }
      }
    } catch (error) {
      console.error('Error sending message to patient window:', error);
    }
  }
};
  
  // Save nurse-selected patient to localStorage when it changes
  useEffect(() => {
    if (nurseSelectedPatientId) {
      localStorage.setItem('nurseSelectedPatientId', nurseSelectedPatientId);
    }
  }, [nurseSelectedPatientId]);
  
  // Save patient ID to localStorage when it changes
  useEffect(() => {
    if (patientId) {
      localStorage.setItem('patientId', patientId);
    }
  }, [patientId]);
  
  // Save mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('mode', mode);
  }, [mode]);
  
  // Save user data to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('userData', JSON.stringify(user));
    } else {
      localStorage.removeItem('userData');
    }
  }, [user]);
  
  // Validate that the selected patient exists
  useEffect(() => {
    const validateSelectedPatient = async () => {
      if (mode !== 'patient' || !nurseSelectedPatientId) return;
      
      try {
        // Try to fetch the selected patient directly
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const response = await fetch(`${API_BASE_URL}/api/patients/${nurseSelectedPatientId}`);
        
        // If response is not OK (404 Not Found), reset to default
        if (!response.ok) {
          console.log('Selected patient no longer exists, resetting localStorage');
          localStorage.removeItem('nurseSelectedPatientId');
          setNurseSelectedPatientId(null);
          
          // Try to fetch all patients to select a new default
          const patientsResponse = await fetch(`${API_BASE_URL}/api/patients`);
          if (patientsResponse.ok) {
            const patients = await patientsResponse.json();
            // Only set a default patient in patient mode, not in staff mode
            if (mode !== 'staff' && patients && patients.length > 0) {
              console.log('Setting default patient to:', patients[0].patientId);
              setNurseSelectedPatientId(patients[0].patientId);
              localStorage.setItem('nurseSelectedPatientId', patients[0].patientId);
            }
          }
        }
      } catch (error) {
        console.error('Error validating patient:', error);
      }
    };
    
    validateSelectedPatient();
  }, [nurseSelectedPatientId]);
  
  // Function to set mode with localStorage persistence
  const setMode = (newMode) => {
    console.log('Setting mode to:', newMode);
    setModeState(newMode);
    localStorage.setItem('mode', newMode);
  };
  
  // Function to enable dual screen mode
  const enableDualScreen = () => {
    console.log("Enabling dual screen mode from staff view");
    
    // Update state first
    setIsDualScreen(true);
    
    // Set a flag in localStorage to indicate we're in dual screen mode
    localStorage.setItem('patientWindowOpened', 'true');
    
    // Create the patient view window (opposite of what we had before)
    const url = `${window.location.origin}/?mode=patient&fromStaffScreen=true&dualScreen=true&t=${Date.now()}`;
    console.log("Opening patient window with URL:", url);
    
    // Try to close any existing patient window first
    try {
      if (patientWindow && !patientWindow.closed) {
        patientWindow.close();
      }
      
      // Try by window name also
      const existingWindow = window.open('', 'patientView');
      if (existingWindow && !existingWindow.closed && existingWindow !== window) {
        existingWindow.close();
      }
    } catch (error) {
      console.warn("Error closing existing patient window:", error);
    }
    
    // Open new patient window
    const newPatientWindow = window.open(url, 'patientView', 'width=1200,height=800');
    
    if (newPatientWindow) {
      console.log("Opened patient window successfully");
      
      // Store reference to the window
      setPatientWindow(newPatientWindow);
      
      // Set up an interval to check if the window was closed
      const checkWindowInterval = setInterval(() => {
        if (newPatientWindow.closed) {
          console.log("Patient window was closed, resetting dual screen mode");
          clearInterval(checkWindowInterval);
          localStorage.removeItem('patientWindowOpened');
          
          // Update state
          setIsDualScreen(false);
          setPatientWindow(null);
        }
      }, 1000);
      
      // Store the interval ID for cleanup
      window.dualScreenCheckInterval = checkWindowInterval;
      
      // Give the new window a chance to initialize before sending data
      setTimeout(() => {
        // First, send a message to confirm dual screen mode
        try {
          console.log("Sending dual screen confirmation to patient window");
          newPatientWindow.postMessage({
            type: 'confirmDualScreen',
            timestamp: Date.now()
          }, window.location.origin);
        } catch (error) {
          console.error("Error sending dual screen confirmation:", error);
        }
        
        // Then, send the current patient ID
        if (nurseSelectedPatientId) {
          try {
            console.log('Sending initial patient to new window:', nurseSelectedPatientId);
            newPatientWindow.postMessage({
              type: 'patientSelect',
              patientId: nurseSelectedPatientId,
              timestamp: Date.now(),
              forceReload: false
            }, window.location.origin);
          } catch (error) {
            console.error('Error sending initial patient to new window:', error);
          }
        }
      }, 500);
    } else {
      console.error("Failed to open patient window");
      localStorage.removeItem('patientWindowOpened');
      setIsDualScreen(false);
    }
  };
  
  // Function to switch to staff mode and redirect to patient info
  const loginStaff = (userData) => {
    console.log("Logging in staff:", userData);
    
    // Save user data in localStorage for persistence across refreshes
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Update state
    setUser(userData);
    setMode('staff');
    setLastActivity(Date.now());
    
    // Store in localStorage for persistence
    localStorage.setItem('mode', 'staff');
    
    // Redirect to patient info page
    navigate('/patient-info');
  };
  
  // Function to log in as a patient
  const loginPatient = (patientData) => {
    console.log("Logging in patient:", patientData);
    setPatientId(patientData);
    setMode('patient');
    
    // Redirect to main dashboard
    navigate('/');
  };
  
  // Generic login function that works for both patient and staff
  const login = async (userType, userId) => {
    try {
      console.log(`Login function called with type: ${userType}, id: ${userId}`);
      
      if (userType === 'patient') {
        setPatientId(userId);
        setMode('patient');
        
        // When logging in as patient, ensure this patient is selected
        localStorage.setItem('selectedPatientId', userId);
        localStorage.setItem('nurseSelectedPatientId', userId);
        
      } else if (userType === 'staff') {
        // IMPORTANT: When logging in as staff, clear any patient selection first
        localStorage.removeItem('nurseSelectedPatientId');
        localStorage.removeItem('selectedPatientId');
        localStorage.removeItem('patientChangeTimestamp');
        
        setUser({ id: userId });
        setMode('staff');
        setLastActivity(Date.now());
        
        // Set nurse selected patient to null
        setNurseSelectedPatientId(null);
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };
  
  // Function to log out and return to patient mode
  const logout = () => {
    console.log("Logging out, returning to patient mode");
    
    // Clear user data from localStorage
    localStorage.removeItem('userData');
    
    setUser(null);
    setMode('patient');
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    // If in dual screen mode and on staff screen, close patient window
    if (isDualScreen && mode === 'staff' && patientWindow && !patientWindow.closed) {
      try {
        patientWindow.close();
      } catch (error) {
        console.error('Error closing patient window:', error);
      }
      localStorage.removeItem('patientWindowOpened');
      setIsDualScreen(false);
    }
    
    // Navigate to main dashboard
    navigate('/');
  };
  
  // Reset localStorage function for emergency recovery
  const resetLocalStorage = () => {
    console.log("Resetting local storage and app state");
    localStorage.removeItem('patientId');
    localStorage.removeItem('nurseSelectedPatientId');
    localStorage.removeItem('mode');
    localStorage.removeItem('selectedPatientId');
    localStorage.removeItem('patientWindowOpened');
    localStorage.removeItem('patientChangeTimestamp');
    localStorage.removeItem('lastMessageTimestamp');
    localStorage.removeItem('userData'); // Also clear user data
    
    // Reset state
    setModeState('patient');
    setUser(null);
    setNurseSelectedPatientId(null);
    setPatientId(null);
    setIsDualScreen(false);
    
    // Force reload the page
    window.location.reload();
  };
  
  // Reset inactivity timer when there's activity
  const resetActivityTimer = () => {
    setLastActivity(Date.now());
  };
  
  // Set up activity tracking
  useEffect(() => {
    const handleActivity = () => {
      // Only track activity in staff mode
      if (mode === 'staff') {
        resetActivityTimer();
      }
    };
    
    // Add event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [mode]);
  
  // Set up inactivity timeout
  useEffect(() => {
    if (mode === 'staff') {
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Set new timeout
      const id = setTimeout(() => {
        console.log('Inactivity timeout reached, logging out');
        logout();
      }, DEFAULT_TIMEOUT);
      
      setTimeoutId(id);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [lastActivity, mode]);

  // Debug output
  useEffect(() => {
    console.log("Auth state changed:", { 
      mode, 
      user, 
      patientId,
      isAuthenticated: mode === 'staff' && user !== null,
      nurseSelectedPatientId,
      isDualScreen
    });
  }, [mode, user, patientId, nurseSelectedPatientId, isDualScreen]);

  // Function to force reload the patient screen in dual screen mode
  const forceReloadPatientScreen = () => {
    console.log('Forcing reload of patient screen at:', new Date().toLocaleTimeString());
    
    // Only proceed if in dual screen mode and this is the staff screen
    if (!isDualScreen || mode !== 'staff') {
      console.log('Not in dual screen mode or not on staff screen, skipping reload');
      return;
    }
    
    // Set a flag in localStorage to indicate an explicit reload was requested
    localStorage.setItem('patient_reload_requested', 'true');
    localStorage.setItem('patient_reload_timestamp', Date.now().toString());
    
    // Try multiple approaches to ensure the patient window reloads
    
    // Approach 1: Direct navigation to refresh URL
    try {
      if (patientWindow && !patientWindow.closed) {
        console.log('Reloading patient screen via direct URL navigation');
        // Add timestamp to force a true reload and break cache
        const refreshUrl = `${window.location.origin}/?mode=patient&fromStaffScreen=true&dualScreen=true&reloaded=true&t=${Date.now()}`;
        patientWindow.location.href = refreshUrl;
        return; // Return early if this succeeds
      }
    } catch (error) {
      console.error('Error with direct URL navigation:', error);
    }
    
    // Approach 2: Try to reload via window reference
    try {
      if (patientWindow && !patientWindow.closed) {
        console.log('Trying reload() method on patient window');
        patientWindow.location.reload();
        return; // Return early if this succeeds
      }
    } catch (error) {
      console.error('Error reloading patient window:', error);
    }
    
    // Approach 3: Try to find the window by name
    try {
      const windowByName = window.open('', 'patientView');
      if (windowByName && !windowByName.closed) {
        console.log('Reloading patient screen via window name');
        // Add timestamp to force a true reload and break cache
        const refreshUrl = `${window.location.origin}/?mode=patient&fromStaffScreen=true&dualScreen=true&reloaded=true&t=${Date.now()}`;
        windowByName.location.href = refreshUrl;
        return; // Return early if this succeeds
      } else {
        console.warn('Could not find patient window to reload');
      }
    } catch (error) {
      console.error('Error accessing patient window:', error);
    }
    
    // Approach 4: Message passing as last resort
    console.log('Trying message passing as last resort');
    try {
      if (patientWindow && !patientWindow.closed) {
        patientWindow.postMessage({
          type: 'forceReload',
          timestamp: Date.now()
        }, window.location.origin);
      } else {
        const windowByName = window.open('', 'patientView');
        if (windowByName && !windowByName.closed) {
          windowByName.postMessage({
            type: 'forceReload',
            timestamp: Date.now()
          }, window.location.origin);
        }
      }
    } catch (error) {
      console.error('Error sending reload message:', error);
    }
  };

  // Check for dual screen mode inconsistencies after mounting
  useEffect(() => {
    const checkDualScreenStatus = () => {
      const patientWindowOpened = localStorage.getItem('patientWindowOpened') === 'true';
      const urlParams = new URLSearchParams(window.location.search);
      const dualScreenParam = urlParams.get('dualScreen') === 'true';
      
      // Log the current dual screen state for debugging
      console.log("Dual screen check - State:", isDualScreen, "localStorage:", patientWindowOpened, "URL:", dualScreenParam);
      
      // Inconsistency: localStorage says dual screen but state doesn't match
      if (patientWindowOpened && !isDualScreen) {
        console.log("Fixing dual screen inconsistency: localStorage says dual screen is active but state doesn't match");
        setIsDualScreen(true);
      }
      
      // If in staff mode with dual screen, try to retrieve the patient window reference
      if (mode === 'staff' && isDualScreen && !patientWindow) {
        try {
          console.log("Attempting to retrieve patient window reference");
          const windowByName = window.open('', 'patientView');
          if (windowByName && !windowByName.closed && windowByName !== window) {
            console.log("Found patient window by name");
            setPatientWindow(windowByName);
            
            // Send a confirmation message
            try {
              windowByName.postMessage({
                type: 'confirmDualScreen',
                timestamp: Date.now()
              }, window.location.origin);
            } catch (error) {
              console.error("Error sending confirmation to retrieved window:", error);
            }
          }
        } catch (error) {
          console.error("Error retrieving patient window:", error);
        }
      }
    };
    
    // Check immediately after mounting
    checkDualScreenStatus();
    
    // Also set up a short interval for the first few seconds to ensure dual screen recognition
    const initialCheckInterval = setInterval(checkDualScreenStatus, 1000);
    
    // Clear the interval after 5 seconds
    setTimeout(() => {
      clearInterval(initialCheckInterval);
    }, 5000);
    
    return () => {
      clearInterval(initialCheckInterval);
    };
  }, [isDualScreen, mode, patientWindow]);

  // Check for redirect needs after initialization
  useEffect(() => {
    // Redirect to patient-info if we're in staff mode but on the home page
    const isRootPath = window.location.pathname === '/' || window.location.pathname === '';
    
    if (mode === 'staff' && isRootPath) {
      console.log('In staff mode at root path, redirecting to patient-info page');
      
      // Use navigate instead of direct location change to avoid full page reload
      setTimeout(() => {
        navigate('/patient-info');
      }, 10);
    }
  }, [mode, navigate]);

  return (
    <AuthContext.Provider value={{
      mode,
      user,
      patientId,
      isAuthenticated: mode === 'staff' && user !== null,
      nurseSelectedPatientId,
      isDualScreen,
      patientWindow,
      updateNurseSelectedPatient,
      enableDualScreen,
      loginStaff,
      loginPatient,
      login,
      setMode,
      logout,
      resetActivityTimer,
      resetLocalStorage,
      syncDataToPatientScreen,
      forceReloadPatientScreen
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

