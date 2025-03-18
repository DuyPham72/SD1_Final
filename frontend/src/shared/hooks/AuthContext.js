// src/shared/hooks/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Default timeout in milliseconds (5 minutes)
const DEFAULT_TIMEOUT = 5 * 60 * 1000;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [mode, setMode] = useState('patient'); // 'patient' or 'staff'
  const [user, setUser] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timeoutId, setTimeoutId] = useState(null);
  const navigate = useNavigate();
  
  // Function to switch to staff mode and redirect to patient info
  const loginStaff = (userData) => {
    console.log("Logging in staff:", userData);
    setUser(userData);
    setMode('staff');
    setLastActivity(Date.now());
    
    // Redirect to patient info page
    navigate('/patient-info');
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
    console.log("Auth state changed:", { mode, user, isAuthenticated: mode === 'staff' && user !== null });
  }, [mode, user]);

  return (
    <AuthContext.Provider value={{
      mode,
      user,
      isAuthenticated: mode === 'staff' && user !== null,
      loginStaff,
      logout,
      resetActivityTimer
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