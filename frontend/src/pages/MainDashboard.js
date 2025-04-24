import React, { useRef, useEffect } from "react";
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
import stethescopeIcon from "../assets/stethescope.png";

function MainDashboard() {
  const navigate = useNavigate();
  const { mode, patientId, nurseSelectedPatientId, isDualScreen } = useAuth();

  const {
    patient,
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

  const mainNavElementsRef = useRef({
    menuButton: null,
    patientSelector: null,
  });
  const sidebarButtonsRef = useRef([]);

  // Listen for patient changes from staff screen in dual screen mode
  useEffect(() => {
    const handlePatientChanged = (event) => {
      console.log(
        "Patient changed event received in MainDashboard:",
        event.detail
      );

      // Force a refresh of patient data by invalidating cache first
      invalidateCache(event.detail.patientId);

      // Update the patient
      handlePatientChange(event.detail.patientId);

      // Force reload if necessary
      if (event.detail.forceRefresh) {
        // Give time for state updates to propagate
        setTimeout(() => {
          console.log("Forcing page reload due to patient change");
          window.location.reload();
        }, 100);
      }
    };

    // Set up event listener regardless of mode to catch all updates
    console.log("Setting up patientChanged listener in MainDashboard");
    window.addEventListener("patientChanged", handlePatientChanged);

    return () => {
      window.removeEventListener("patientChanged", handlePatientChanged);
    };
  }, [handlePatientChange, invalidateCache]);

  // Setup a polling mechanism to check for patient changes
  useEffect(() => {
    if (mode === "patient" && isDualScreen) {
      console.log("Setting up polling for patient changes");

      const pollInterval = setInterval(() => {
        const storedPatientId = localStorage.getItem("nurseSelectedPatientId");
        const changeTimestamp = localStorage.getItem("patientChangeTimestamp");

        // Check if there's been a change we haven't processed
        if (storedPatientId && storedPatientId !== selectedPatientId) {
          console.log("Poll detected patient change:", storedPatientId);

          // Force clear the cache
          invalidateCache(storedPatientId);

          // Update patient
          handlePatientChange(storedPatientId);

          // If the change is recent (last 10 seconds), force reload
          if (
            changeTimestamp &&
            Date.now() - parseInt(changeTimestamp) < 10000
          ) {
            setTimeout(() => window.location.reload(), 50);
          }
        }
      }, 1000); // Check every second

      return () => clearInterval(pollInterval);
    }
  }, [
    mode,
    isDualScreen,
    selectedPatientId,
    handlePatientChange,
    invalidateCache,
  ]);

  // When the selected patient changes in dual screen mode, refresh the data
  useEffect(() => {
    // In dual screen mode, prioritize nurseSelectedPatientId if in patient mode
    if (isDualScreen && mode === "patient" && nurseSelectedPatientId) {
      console.log(
        "MainDashboard: Using nurse-selected patient in dual screen mode:",
        nurseSelectedPatientId
      );

      // Check if we need to update the selection
      if (selectedPatientId !== nurseSelectedPatientId) {
        console.log("MainDashboard: Updating from nurse selection");

        // Force clear the cache for this patient
        invalidateCache(nurseSelectedPatientId);

        // Update selection
        handlePatientChange(nurseSelectedPatientId);
      }
    }
  }, [
    isDualScreen,
    mode,
    nurseSelectedPatientId,
    selectedPatientId,
    handlePatientChange,
    invalidateCache,
  ]);

  // Listen for storage events (when localStorage changes in other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (
        e.key === "nurseSelectedPatientId" &&
        e.newValue &&
        e.newValue !== selectedPatientId
      ) {
        console.log("Storage event detected patient change:", e.newValue);
        invalidateCache(e.newValue);
        handlePatientChange(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [selectedPatientId, handlePatientChange, invalidateCache]);

  // When the component mounts, make sure localStorage is consistent
  useEffect(() => {
    // For safety, synchronize localStorage in case there's inconsistency
    if (selectedPatientId) {
      localStorage.setItem("selectedPatientId", selectedPatientId);

      // Also update nurseSelectedPatientId in localStorage in patient mode
      if (mode === "patient") {
        localStorage.setItem("nurseSelectedPatientId", selectedPatientId);
      }
    }
  }, [mode, selectedPatientId]);

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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading patient data...</div>
        <div className="loading-details">
          Patient ID: {selectedPatientId || "None"}
          <br />
          Mode: {mode}
          <br />
          Dual Screen: {isDualScreen ? "Yes" : "No"}
          <br />
          Selected: {selectedPatientId}
          <br />
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
          Patient ID: {selectedPatientId || "None"}
          <br />
          Mode: {mode}
          <br />
          Dual Screen: {isDualScreen ? "Yes" : "No"}
          <br />
          Selected: {selectedPatientId}
          <br />
          Nurse Selected: {nurseSelectedPatientId}
          <br />
          <button onClick={() => window.location.reload()}>Reload Page</button>
          <button
            onClick={() => {
              invalidateCache();
              window.location.reload();
            }}
          >
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
              <img
                src={stethescopeIcon}
                alt="Stethescope"
                className="staff-icon"
              />
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
    </Layout>
  );
}

export default MainDashboard;
