// src/shared/hooks/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Default timeout in milliseconds (5 minutes)
const DEFAULT_TIMEOUT = 5 * 60 * 1000;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [mode, setModeState] = useState(() => {
    // Initialize from localStorage if available
    return localStorage.getItem('mode') || 'patient';
  });
  const [user, setUser] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timeoutId, setTimeoutId] = useState(null);
  
  // Store nurse-selected patient ID
  const [nurseSelectedPatientId, setNurseSelectedPatientId] = useState(() => {
    return localStorage.getItem('nurseSelectedPatientId') || null;
  });
  
  // Store patient ID for patient mode
  const [patientId, setPatientId] = useState(() => {
    return localStorage.getItem('patientId') || null;
  });
  
  const navigate = useNavigate();
  
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
  
  // Function to update the nurse-selected patient
  const updateNurseSelectedPatient = (patientId) => {
    console.log('Saving nurse-selected patient:', patientId);
    setNurseSelectedPatientId(patientId);
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
    
    // Redirect to main dashboard
    navigate('/');
    
    // We don't clear nurseSelectedPatientId on logout
    // so it can be restored when they log back in
  };
  
  // Reset localStorage function for emergency recovery
  const resetLocalStorage = () => {
    console.log("Resetting local storage and app state");
    localStorage.removeItem('patientId');
    localStorage.removeItem('nurseSelectedPatientId');
    localStorage.removeItem('mode');
    localStorage.removeItem('selectedPatientId');
    
    // Reset state
    setModeState('patient');
    setUser(null);
    setNurseSelectedPatientId(null);
    setPatientId(null);
    
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
      nurseSelectedPatientId
    });
  }, [mode, user, patientId, nurseSelectedPatientId]);

  return (
    <AuthContext.Provider value={{
      mode,
      user,
      patientId,
      isAuthenticated: mode === 'staff' && user !== null,
      nurseSelectedPatientId,  // Expose the nurse-selected patient ID
      updateNurseSelectedPatient, // Expose the function to update it
      loginStaff,
      loginPatient,
      login,      // Add the generic login function
      setMode,    // Add the setMode function
      logout,
      resetActivityTimer,
      resetLocalStorage  // Add the reset function
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