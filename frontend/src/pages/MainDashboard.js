import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MainDashboard.css";
import "../styles/Header.css";
import {
  usePatientData,
  useTimeUpdate,
  useNavigationState,
  useKeyboardNavigation,
  Layout,
  Header,
} from "../shared";
import { useAuth } from "../shared/hooks/AuthContext";

function MainDashboard() {
  const navigate = useNavigate();
  const { 
    mode, 
    patientId, 
    nurseSelectedPatientId, 
    isDualScreen, 
    syncDataToPatientScreen 
  } = useAuth();
  
  const {
    patient,
    setPatient,
    allPatients,
    selectedPatientId,
    loading,
    handlePatientChange,
    invalidateCache,
  } = usePatientData();
  
  const currentTime = useTimeUpdate();
  const {
    isNavOpen,
    setIsNavOpen,
    sidebarFocusIndex,
    setSidebarFocusIndex,
    mainNavFocusIndex,
    setMainNavFocusIndex,
  } = useNavigationState();

  // Track the last sync timestamp to avoid redundant updates
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(0);
  const [syncCount, setSyncCount] = useState(0);

  const mainNavElementsRef = useRef({
    menuButton: null,
    patientSelector: null,
  });
  const sidebarButtonsRef = useRef([]);

  // Listen for patient changes from staff screen in dual screen mode
  // In MainDashboard.js and similar components
useEffect(() => {
  const handlePatientChanged = (event) => {
    console.log('Patient changed event received:', event.detail);
    
    // Check if cache invalidation is requested
    if (event.detail.invalidateCache) {
      console.log('Invalidating patient cache due to patient change event');
      invalidateCache(event.detail.patientId);
    }
    
    // Update the patient
    handlePatientChange(event.detail.patientId);
    
    // Force reload if necessary
    if (event.detail.forceRefresh) {
      // Give time for state updates to propagate
      setTimeout(() => {
        console.log('Forcing page reload due to patient change');
        window.location.reload();
      }, 100);
    }
  };
  
  console.log('Setting up patientChanged listener');
  window.addEventListener('patientChanged', handlePatientChanged);
  
  return () => {
    window.removeEventListener('patientChanged', handlePatientChanged);
  };
}, [handlePatientChange, invalidateCache]);

  // Listen for schedule and patient info changes
  useEffect(() => {
    const handleScheduleChanged = (event) => {
      console.log('Schedule changed event received:', event.detail);
      
      // Prevent duplicate updates
      if (event.detail.timestamp <= lastSyncTimestamp) {
        console.log('Ignoring outdated schedule update');
        return;
      }
      
      setLastSyncTimestamp(event.detail.timestamp);
      setSyncCount(prev => prev + 1);
      
      if (patient && event.detail.schedule) {
        // Create a new patient object with updated schedule
        const updatedPatient = {
          ...patient,
          schedule: event.detail.schedule
        };
        
        // Update patient data without page reload
        setPatient(updatedPatient);
        console.log("Updated schedule in real-time");
      }
    };
    
    const handlePatientInfoChanged = (event) => {
      console.log('Patient info changed event received:', event.detail);
      
      // Prevent duplicate updates
      if (event.detail.timestamp <= lastSyncTimestamp) {
        console.log('Ignoring outdated patient info update');
        return;
      }
      
      setLastSyncTimestamp(event.detail.timestamp);
      setSyncCount(prev => prev + 1);
      
      if (patient && event.detail.patientInfo) {
        // Create a new patient object with updated info
        const updatedPatient = {
          ...patient,
          ...event.detail.patientInfo
        };
        
        // Update patient data without page reload
        setPatient(updatedPatient);
        console.log("Updated patient info in real-time");
      }
    };
    
    // Set up event listeners
    window.addEventListener('scheduleChanged', handleScheduleChanged);
    window.addEventListener('patientInfoChanged', handlePatientInfoChanged);
    
    return () => {
      window.removeEventListener('scheduleChanged', handleScheduleChanged);
      window.removeEventListener('patientInfoChanged', handlePatientInfoChanged);
    };
  }, [patient, setPatient, lastSyncTimestamp]);

  // Setup a polling mechanism to check for patient changes
  useEffect(() => {
    if (mode === 'patient' && isDualScreen) {
      console.log('Setting up polling for patient changes');
      
      const pollInterval = setInterval(() => {
        const storedPatientId = localStorage.getItem('nurseSelectedPatientId');
        const changeTimestamp = localStorage.getItem('patientChangeTimestamp');
        
        // Check if there's been a change we haven't processed
        if (storedPatientId && storedPatientId !== selectedPatientId) {
          console.log('Poll detected patient change:', storedPatientId);
          
          // Force clear the cache
          invalidateCache(storedPatientId);
          
          // Update patient
          handlePatientChange(storedPatientId);
          
          // If the change is recent (last 10 seconds), force reload
          if (changeTimestamp && (Date.now() - parseInt(changeTimestamp)) < 10000) {
            setTimeout(() => window.location.reload(), 50);
          }
        }
      }, 1000); // Check every second
      
      return () => clearInterval(pollInterval);
    }
  }, [mode, isDualScreen, selectedPatientId, handlePatientChange, invalidateCache]);

  // When the selected patient changes in dual screen mode, refresh the data
  useEffect(() => {
    // In dual screen mode, prioritize nurseSelectedPatientId if in patient mode
    if (isDualScreen && mode === 'patient' && nurseSelectedPatientId) {
      console.log('MainDashboard: Using nurse-selected patient in dual screen mode:', nurseSelectedPatientId);
      
      // Check if we need to update the selection
      if (selectedPatientId !== nurseSelectedPatientId) {
        console.log('MainDashboard: Updating from nurse selection');
        
        // Force clear the cache for this patient
        invalidateCache(nurseSelectedPatientId);
        
        // Update selection
        handlePatientChange(nurseSelectedPatientId);
      }
    }
  }, [isDualScreen, mode, nurseSelectedPatientId, selectedPatientId, handlePatientChange, invalidateCache]);

  // Listen for storage events (when localStorage changes in other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'nurseSelectedPatientId' && e.newValue && e.newValue !== selectedPatientId) {
        console.log('Storage event detected patient change:', e.newValue);
        invalidateCache(e.newValue);
        handlePatientChange(e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedPatientId, handlePatientChange, invalidateCache]);

  // When the component mounts, make sure localStorage is consistent
  useEffect(() => {
    // For safety, synchronize localStorage in case there's inconsistency
    if (selectedPatientId) {
      localStorage.setItem('selectedPatientId', selectedPatientId);
      
      // Also update nurseSelectedPatientId in localStorage in patient mode
      if (mode === 'patient') {
        localStorage.setItem('nurseSelectedPatientId', selectedPatientId);
      }
    }
  }, [mode, selectedPatientId]);
  // Add this to MainDashboard.js
// Force data refresh when navigating to the same patient
useEffect(() => {
  if (selectedPatientId && !loading) {
    console.log('Ensuring patient data is fresh for ID:', selectedPatientId);
    // Store the ID explicitly to prevent navigation issues
    localStorage.setItem('selectedPatientId', selectedPatientId);
    
    if (mode === 'staff') {
      localStorage.setItem('nurseSelectedPatientId', selectedPatientId);
    }
  }
}, [selectedPatientId, loading, mode]);

  // Add this to both MainDashboard.js and PatientInfo.js
// Add localStorage polling for updates
// Consistent polling implementation for both components:
useEffect(() => {
  if (mode === 'patient' && isDualScreen) {
    const checkLocalStorageUpdates = () => {
      try {
        // Check for schedule updates
        const scheduleUpdateStr = localStorage.getItem('sync_scheduleUpdate');
        if (scheduleUpdateStr) {
          try {
            const scheduleUpdate = JSON.parse(scheduleUpdateStr);
            if (scheduleUpdate && scheduleUpdate.timestamp > lastSyncTimestamp) {
              console.log('Found schedule update in localStorage:', scheduleUpdate);
              setLastSyncTimestamp(scheduleUpdate.timestamp);
              
              if (patient && scheduleUpdate.data) {
                setPatient({
                  ...patient,
                  schedule: scheduleUpdate.data
                });
              }
            }
          } catch (e) {
            console.error('Error parsing scheduleUpdate:', e);
          }
        }
        
        // Check for patient info updates
        const patientInfoUpdateStr = localStorage.getItem('sync_patientInfoUpdate');
        if (patientInfoUpdateStr) {
          try {
            const patientInfoUpdate = JSON.parse(patientInfoUpdateStr);
            if (patientInfoUpdate && patientInfoUpdate.timestamp > lastSyncTimestamp) {
              console.log('Found patient info update in localStorage:', patientInfoUpdate);
              setLastSyncTimestamp(patientInfoUpdate.timestamp);
              
              if (patient && patientInfoUpdate.data) {
                setPatient({
                  ...patient,
                  ...patientInfoUpdate.data
                });
                
                // Important: Also invalidate the cache to ensure fresh data on next load
                if (invalidateCache && typeof invalidateCache === 'function') {
                  invalidateCache(patient.patientId);
                }
              }
            }
          } catch (e) {
            console.error('Error parsing patientInfoUpdate:', e);
          }
        }
        
        // Check for patient selection changes
        const nurseSelectedId = localStorage.getItem('nurseSelectedPatientId');
        if (nurseSelectedId && nurseSelectedId !== selectedPatientId) {
          console.log('Patient selection changed in localStorage:', nurseSelectedId);
          
          // Force clear the cache
          if (invalidateCache) invalidateCache(nurseSelectedId);
          
          // Update patient
          if (handlePatientChange) handlePatientChange(nurseSelectedId);
          
          // Check if change is recent
          const changeTimestamp = localStorage.getItem('patientChangeTimestamp');
          if (changeTimestamp && (Date.now() - parseInt(changeTimestamp)) < 5000) {
            setTimeout(() => window.location.reload(), 50);
          }
        }
      } catch (error) {
        console.error('Error checking localStorage updates:', error);
      }
    };
    
    // Check immediately
    checkLocalStorageUpdates();
    
    // Then set up interval with a shorter polling time
    const interval = setInterval(checkLocalStorageUpdates, 500); // Check every 500ms instead of 1000ms
    return () => clearInterval(interval);
  }
}, [mode, isDualScreen, patient, setPatient, lastSyncTimestamp, selectedPatientId, handlePatientChange, invalidateCache]);

  // Hook up keyboard navigation
  useKeyboardNavigation({
    isNavOpen,
    setIsNavOpen,
    sidebarFocusIndex,
    setSidebarFocusIndex,
    mainNavFocusIndex,
    setMainNavFocusIndex,
    mainNavElementsRef,
    sidebarButtonsRef,
    navigate,
    customHandlers: {
      Enter: (e) => {
        if (isNavOpen) {
          e.preventDefault();
          const selectedItem = sidebarButtonsRef.current[sidebarFocusIndex];
          if (selectedItem) {
            setIsNavOpen(false);
            setTimeout(() => {
              navigate(selectedItem.dataset.path);
            }, 10);
          }
        }
      },
    },
  });

  // Function to check if a schedule item is in the past
  const isTimeInPast = (scheduleTime) => {
    if (!scheduleTime) return false;

    const [timePart, ampm] = scheduleTime.split(" ");
    const [hourStr, minuteStr] = timePart.split(":");

    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (ampm === "PM" && hour < 12) {
      hour += 12;
    } else if (ampm === "AM" && hour === 12) {
      hour = 0;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour > hour) {
      return true;
    } else if (currentHour === hour && currentMinute > minute) {
      return true;
    }

    return false;
  };

  // Function to handle reload with invalidating cache
  const handleReloadWithCacheClear = () => {
    invalidateCache(selectedPatientId);
    setTimeout(() => {
      window.location.reload();
    }, 50);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading patient data...</div>
        <div className="loading-details">
          Patient ID: {selectedPatientId || "None"}<br />
          Mode: {mode}<br />
          Dual Screen: {isDualScreen ? "Yes" : "No"}<br />
          Selected: {selectedPatientId}<br />
          Nurse Selected: {nurseSelectedPatientId}
        </div>
      </div>
    );
  }
  
  if (!patient) {
    return (
      <div className="error-container">
        <div className="error">No patient data available</div>
        <div className="error-details">
          Patient ID: {selectedPatientId || "None"}<br />
          Mode: {mode}<br />
          Dual Screen: {isDualScreen ? "Yes" : "No"}<br />
          Selected: {selectedPatientId}<br />
          Nurse Selected: {nurseSelectedPatientId}<br />
          <button onClick={() => window.location.reload()}>Reload Page</button>
          <button onClick={handleReloadWithCacheClear}>
            Clear Cache and Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout
      patient={patient}
      isNavOpen={isNavOpen}
      onNavToggle={() => setIsNavOpen(!isNavOpen)}
      sidebarButtonsRef={sidebarButtonsRef}
    >
      <Header
        patient={patient}
        allPatients={allPatients}
        selectedPatientId={selectedPatientId}
        onPatientChange={handlePatientChange}
        currentTime={currentTime}
        isNavOpen={isNavOpen}
        onNavToggle={() => setIsNavOpen(!isNavOpen)}
        mainNavElementsRef={mainNavElementsRef}
        mainNavFocusIndex={mainNavFocusIndex}
      />

      <div className="content-container">
        {/* Left panel with patient info */}
        <div className="patient-info-panel">
          {/* Staff Info Card */}
          <div className="info-card">
            <div className="staff-item">
              <span className="staff-icon">👨‍⚕️</span>
              <span className="staff-label">
                Physician: {patient.careTeam.primaryDoctor}
              </span>
            </div>

            <div className="staff-item">
              <span className="staff-icon">👩‍⚕️</span>
              <span className="staff-label">
                Nurse: {patient.careTeam.primaryNurse}
              </span>
            </div>
          </div>

          {/* Patient Details Card */}
          <div className="info-card">
            <div className="patient-detail-item">
              <span className="detail-icon">🏠</span>
              <span className="detail-content">Room: {patient.room}</span>
            </div>

            <div className="patient-detail-item">
              <span className="detail-icon">🍽️</span>
              <span className="detail-content">
                Dietary: {patient.preferences.dietary.join(", ")}
              </span>
            </div>

            <div className="patient-detail-item">
              <span className="detail-icon">🗣️</span>
              <span className="detail-content">
                Language: {patient.preferences.language}
              </span>
            </div>
          </div>
        </div>

        {/* Right panel with schedule */}
        <div className="schedule-panel">
          <div className="info-card schedule-card">
            <h2>Today's Schedule:</h2>
            <div className="schedule-list">
              {patient.schedule && patient.schedule.length > 0 ? (
                patient.schedule.map((item, index) => (
                  <div
                    key={index}
                    className={`schedule-item ${
                      isTimeInPast(item.time) ? "past-activity" : ""
                    }`}
                  >
                    <div className="time">{item.time}</div>
                    <div className="activity">
                      {item.activity}
                      {item.notes && <div className="notes">{item.notes}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-schedule">
                  No scheduled activities for today
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug panel - only visible during development */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="debug-panel">
          <h4>Debug Info</h4>
          <div>Mode: {mode}</div>
          <div>Is Dual Screen: {isDualScreen ? 'Yes' : 'No'}</div>
          <div>Selected ID: {selectedPatientId}</div>
          <div>Nurse Selected ID: {nurseSelectedPatientId}</div>
          <div>Patient name: {patient?.name}</div>
          <div>Last Sync: {new Date(lastSyncTimestamp).toLocaleTimeString()}</div>
          <div>Sync Count: {syncCount}</div>
          <button onClick={() => window.location.reload()}>Force Reload</button>
          <button onClick={handleReloadWithCacheClear}>Clear Cache</button>
          {isDualScreen && mode === 'staff' && (
            <button onClick={() => {
              // Test sync function
              if (patient) {
                syncDataToPatientScreen('scheduleUpdate', patient.schedule || []);
                syncDataToPatientScreen('patientInfoUpdate', {
                  name: patient.name,
                  room: patient.room,
                  careTeam: patient.careTeam,
                  preferences: patient.preferences
                });
                alert('Manual sync triggered!');
              }
            }}>Test Sync</button>
          )}
        </div>
      )}
    </Layout>
  );
}

export default MainDashboard;