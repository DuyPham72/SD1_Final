// src/shared/hooks/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Default timeout in milliseconds (5 minutes)
const DEFAULT_TIMEOUT = 5 * 60 * 1000;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
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
  
  const [user, setUser] = useState(null);
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
    
    if (dualScreen) {
      // This window is involved in dual screen mode
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
      } else {
        // This is the staff screen that opened the patient window
        console.log("Initializing as staff window in dual screen mode");
        setModeState('staff');
        localStorage.setItem('mode', 'staff');
        
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
  }, []);
  
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
            forceRefresh: true 
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
    }
  };
  
  // Function to update the nurse-selected patient
  const updateNurseSelectedPatient = (patientId) => {
    console.log('Saving nurse-selected patient:', patientId);
    
    // Update state
    setNurseSelectedPatientId(patientId);
    
    // Update localStorage in all cases
    localStorage.setItem('nurseSelectedPatientId', patientId);
    localStorage.setItem('selectedPatientId', patientId);
    
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
            forceReload: true
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
              forceReload: true
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
  
  // Validate that the selected patient exists
  useEffect(() => {
    const validateSelectedPatient = async () => {
      if (!nurseSelectedPatientId) return;
      
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
            if (patients && patients.length > 0) {
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
    
    // Set a flag in localStorage to indicate we're in dual screen mode
    localStorage.setItem('patientWindowOpened', 'true');
    setIsDualScreen(true);
    
    // Create the patient view window (opposite of what we had before)
    const url = `${window.location.origin}/?mode=patient&fromStaffScreen=true&dualScreen=true`;
    const newPatientWindow = window.open(url, 'patientView', 'width=1200,height=800');
    
    if (newPatientWindow) {
      console.log("Opened patient window");
      setPatientWindow(newPatientWindow);
      
      // Set up an interval to check if the window was closed
      const checkWindowInterval = setInterval(() => {
        if (newPatientWindow.closed) {
          console.log("Patient window was closed, resetting dual screen mode");
          clearInterval(checkWindowInterval);
          localStorage.removeItem('patientWindowOpened');
          
          // Update state
          setIsDualScreen(false);
        }
      }, 1000);
      
      // Store the interval ID for cleanup
      window.dualScreenCheckInterval = checkWindowInterval;
      
      // Send the current patient ID to the new window
      if (nurseSelectedPatientId) {
        setTimeout(() => {
          try {
            console.log('Sending initial patient to new window:', nurseSelectedPatientId);
            newPatientWindow.postMessage({
              type: 'patientSelect',
              patientId: nurseSelectedPatientId,
              timestamp: Date.now(),
              forceReload: true
            }, window.location.origin);
          } catch (error) {
            console.error('Error sending initial patient to new window:', error);
          }
        }, 1000); // Give the window time to initialize
      }
    } else {
      console.error("Failed to open patient window");
      localStorage.removeItem('patientWindowOpened');
      setIsDualScreen(false);
    }
  };
  
  // Function to switch to staff mode and redirect to patient info
  const loginStaff = (userData) => {
    console.log("Logging in staff:", userData);
    setUser(userData);
    setMode('staff');
    setLastActivity(Date.now());
    
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
      } else if (userType === 'staff') {
        setUser({ id: userId });
        setMode('staff');
        setLastActivity(Date.now());
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

  return (
    <AuthContext.Provider value={{
      mode,
      user,
      patientId,
      isAuthenticated: mode === 'staff' && user !== null,
      nurseSelectedPatientId,
      isDualScreen,
      updateNurseSelectedPatient,
      enableDualScreen,
      loginStaff,
      loginPatient,
      login,
      setMode,
      logout,
      resetActivityTimer,
      resetLocalStorage
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