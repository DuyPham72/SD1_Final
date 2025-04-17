// Modified ModeIndicator.js
import React from "react";
import { useAuth } from "../hooks/AuthContext";
import "../../styles/ModeIndicator.css";

const ModeIndicator = () => {
  const { mode, user, logout, isDualScreen, forceReloadPatientScreen, patientWindow } = useAuth();
  
  // Function to reset both pages in dual screen mode
  const handleReset = () => {
    // If in dual screen mode, reload patient screen first
    if (isDualScreen && mode === 'staff') {
      console.log('Resetting both screens in dual screen mode at:', new Date().toLocaleTimeString());
      
      // First try to access and reload the patient window directly
      let patientWindowFound = false;
      
      try {
        // Set a flag in localStorage to track resets
        localStorage.setItem('staff_initiated_reset', 'true');
        localStorage.setItem('reset_timestamp', Date.now().toString());
        
        // Approach 1: Try to get a direct reference to the patient window
        if (patientWindow && !patientWindow.closed) {
          console.log('Found direct patient window reference, reloading...');
          // Force a full URL reload with cache-busting timestamp
          const refreshUrl = `${window.location.origin}/?mode=patient&fromStaffScreen=true&dualScreen=true&reloaded=true&t=${Date.now()}`;
          patientWindow.location.href = refreshUrl;
          patientWindowFound = true;
        }
        
        // Approach 2: Try to find by window name
        if (!patientWindowFound) {
          const windowByName = window.open('', 'patientView');
          if (windowByName && !windowByName.closed) {
            console.log('Found patient window by name, reloading...');
            const refreshUrl = `${window.location.origin}/?mode=patient&fromStaffScreen=true&dualScreen=true&reloaded=true&t=${Date.now()}`;
            windowByName.location.href = refreshUrl;
            patientWindowFound = true;
          }
        }
      } catch (error) {
        console.error('Error directly reloading patient window:', error);
      }
      
      // Approach 3: Use the helper function as a fallback
      if (!patientWindowFound) {
        console.log('Using forceReloadPatientScreen as fallback...');
        forceReloadPatientScreen();
      }
      
      // Then reload the staff screen after a short delay
      console.log('Reloading staff screen in 300ms...');
      setTimeout(() => {
        // Force a full URL reload with cache-busting and redirect to patient-info page
        window.location.href = `${window.location.origin}/patient-info?mode=staff&reloaded=true&t=${Date.now()}`;
      }, 300);
    } else {
      // Just reload this screen if not in dual screen mode
      console.log('Reloading single screen...');
      window.location.reload();
    }
  };

  // Don't render anything if in patient mode
  if (mode === "patient") {
    return null;
  }

  return (
    <div className="mode-indicator staff">
      <div className="mode-icon">👩‍⚕️</div>
      <div className="mode-info">
        <div className="mode-name">Staff Mode</div>
        <div className="user-info">
          {user && <span>{user.name}</span>}
          <button
            className="reset-button-small"
            onClick={handleReset}
            title={isDualScreen ? "Reset Both Screens" : "Reset Page"}
          >
            Reset
          </button>
          <button
            className="logout-button"
            onClick={logout}
            title="Return to Patient Mode"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeIndicator;