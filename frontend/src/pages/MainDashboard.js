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
import stethescopeIcon from "../assets/stethescope.png";

function MainDashboard() {
  const navigate = useNavigate();
  const {
    mode,
    patientId,
    nurseSelectedPatientId,
    isDualScreen,
    syncDataToPatientScreen,
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
  const [statusNotification, setStatusNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const statusButtonRefs = useRef([]);

  // Listen for patient changes from staff screen in dual screen mode
  // In MainDashboard.js and similar components
  useEffect(() => {
    const handlePatientChanged = (event) => {
      console.log("Patient changed event received:", event.detail);

      // Check if cache invalidation is requested
      if (event.detail.invalidateCache) {
        console.log("Invalidating patient cache due to patient change event");
        invalidateCache(event.detail.patientId);
      }

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

    console.log("Setting up patientChanged listener");
    window.addEventListener("patientChanged", handlePatientChanged);

    return () => {
      window.removeEventListener("patientChanged", handlePatientChanged);
    };
  }, [handlePatientChange, invalidateCache]);

  // Listen for schedule and patient info changes
  useEffect(() => {
    const handleScheduleChanged = (event) => {
      console.log("Schedule changed event received:", event.detail);

      // Prevent duplicate updates
      if (event.detail.timestamp <= lastSyncTimestamp) {
        console.log("Ignoring outdated schedule update");
        return;
      }

      setLastSyncTimestamp(event.detail.timestamp);
      setSyncCount((prev) => prev + 1);

      if (patient && event.detail.schedule) {
        // Create a new patient object with updated schedule
        const updatedPatient = {
          ...patient,
          schedule: event.detail.schedule,
        };

        // Update patient data without page reload
        setPatient(updatedPatient);
        console.log("Updated schedule in real-time");
      }
    };

    const handlePatientInfoChanged = (event) => {
      console.log("Patient info changed event received:", event.detail);

      // Prevent duplicate updates
      if (event.detail.timestamp <= lastSyncTimestamp) {
        console.log("Ignoring outdated patient info update");
        return;
      }

      setLastSyncTimestamp(event.detail.timestamp);
      setSyncCount((prev) => prev + 1);

      if (patient && event.detail.patientInfo) {
        // Create a new patient object with updated info
        const updatedPatient = {
          ...patient,
          ...event.detail.patientInfo,
        };

        // Update patient data without page reload
        setPatient(updatedPatient);
        console.log("Updated patient info in real-time");
      }
    };

    // Add specific handler for patient status changes
    const handlePatientStatusChanged = (event) => {
      console.log("Patient status changed event received:", event.detail);

      // Make sure we have a valid patient
      if (patient) {
        // Create a new patient object with the updated status
        const updatedPatient = {
          ...patient,
          status: event.detail.status,
        };

        // Update patient data immediately without page reload
        setPatient(updatedPatient);
        console.log(
          "Updated patient status in real-time to:",
          event.detail.status
        );

        // If this is a critical status, show a notification (only in staff mode)
        if (event.detail.status === "critical" && mode === "staff") {
          setStatusNotification({
            visible: true,
            message: `URGENT: Patient ${patient.name} needs immediate assistance!`,
            type: "urgent",
          });

          // Hide notification after 8 seconds
          setTimeout(() => {
            setStatusNotification((prev) => ({
              ...prev,
              visible: false,
            }));
          }, 8000);
        }
      }
    };

    // Set up event listeners
    window.addEventListener("scheduleChanged", handleScheduleChanged);
    window.addEventListener("patientInfoChanged", handlePatientInfoChanged);
    window.addEventListener("patientStatusChanged", handlePatientStatusChanged);

    return () => {
      window.removeEventListener("scheduleChanged", handleScheduleChanged);
      window.removeEventListener(
        "patientInfoChanged",
        handlePatientInfoChanged
      );
      window.removeEventListener(
        "patientStatusChanged",
        handlePatientStatusChanged
      );
    };
  }, [patient, setPatient, lastSyncTimestamp, mode]);

  // Add polling mechanism to check status changes in localStorage
  useEffect(() => {
    // Only poll if we have a patient
    if (!patient) return;

    const statusPollInterval = setInterval(() => {
      const storedStatus = localStorage.getItem("patientStatus");
      const statusTimestamp = localStorage.getItem("patientStatusTimestamp");

      // Check if there's a recent status change (< 30 seconds old)
      if (
        storedStatus &&
        patient.status !== storedStatus &&
        statusTimestamp &&
        Date.now() - parseInt(statusTimestamp) < 30000
      ) {
        console.log(
          "Status poll detected change:",
          storedStatus,
          "Current:",
          patient.status
        );

        // Update the patient status immediately
        const updatedPatient = {
          ...patient,
          status: storedStatus,
        };
        setPatient(updatedPatient);

        console.log(
          `Patient status updated from localStorage: ${storedStatus}`
        );

        // If critical status, show notification in staff mode
        if (storedStatus === "critical" && mode === "staff") {
          setStatusNotification({
            visible: true,
            message: `URGENT: Patient ${patient.name} needs immediate assistance!`,
            type: "urgent",
          });

          // Hide notification after 8 seconds
          setTimeout(() => {
            setStatusNotification((prev) => ({
              ...prev,
              visible: false,
            }));
          }, 8000);
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(statusPollInterval);
  }, [patient, mode, setPatient]);

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

        // Add null check here
        if (invalidateCache && typeof invalidateCache === "function") {
          // Force clear the cache for this patient
          invalidateCache(nurseSelectedPatientId);
        } else {
          console.warn("invalidateCache not available in dual screen effect");
        }

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

        // Add null check here
        if (invalidateCache && typeof invalidateCache === "function") {
          invalidateCache(e.newValue);
        } else {
          console.warn(
            "invalidateCache is not available in handleStorageChange"
          );
        }

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
  // Add this to MainDashboard.js
  // Force data refresh when navigating to the same patient
  useEffect(() => {
    if (selectedPatientId && !loading) {
      console.log("Ensuring patient data is fresh for ID:", selectedPatientId);
      // Store the ID explicitly to prevent navigation issues
      localStorage.setItem("selectedPatientId", selectedPatientId);

      if (mode === "staff") {
        localStorage.setItem("nurseSelectedPatientId", selectedPatientId);
      }
    }
  }, [selectedPatientId, loading, mode]);

  // Add localStorage polling for updates
  // Consistent polling implementation for both components:
  useEffect(() => {
    if (mode === "patient" && isDualScreen) {
      const checkLocalStorageUpdates = () => {
        try {
          // Check for schedule updates
          const scheduleUpdateStr = localStorage.getItem("sync_scheduleUpdate");
          if (scheduleUpdateStr) {
            try {
              const scheduleUpdate = JSON.parse(scheduleUpdateStr);
              if (
                scheduleUpdate &&
                scheduleUpdate.timestamp > lastSyncTimestamp
              ) {
                console.log(
                  "Found schedule update in localStorage:",
                  scheduleUpdate
                );
                setLastSyncTimestamp(scheduleUpdate.timestamp);

                if (patient && scheduleUpdate.data) {
                  setPatient({
                    ...patient,
                    schedule: scheduleUpdate.data,
                  });
                }
              }
            } catch (e) {
              console.error("Error parsing scheduleUpdate:", e);
            }
          }

          // Check for patient info updates
          const patientInfoUpdateStr = localStorage.getItem(
            "sync_patientInfoUpdate"
          );
          if (patientInfoUpdateStr) {
            try {
              const patientInfoUpdate = JSON.parse(patientInfoUpdateStr);
              if (
                patientInfoUpdate &&
                patientInfoUpdate.timestamp > lastSyncTimestamp
              ) {
                console.log(
                  "Found patient info update in localStorage:",
                  patientInfoUpdate
                );
                setLastSyncTimestamp(patientInfoUpdate.timestamp);

                if (patient && patientInfoUpdate.data) {
                  setPatient({
                    ...patient,
                    ...patientInfoUpdate.data,
                  });

                  // Important: Also invalidate the cache to ensure fresh data on next load
                  if (
                    invalidateCache &&
                    typeof invalidateCache === "function"
                  ) {
                    invalidateCache(patient.patientId);
                  }
                }
              }
            } catch (e) {
              console.error("Error parsing patientInfoUpdate:", e);
            }
          }

          // Check for patient selection changes
          const nurseSelectedId = localStorage.getItem(
            "nurseSelectedPatientId"
          );
          if (nurseSelectedId && nurseSelectedId !== selectedPatientId) {
            console.log(
              "Patient selection changed in localStorage:",
              nurseSelectedId
            );

            // Force clear the cache
            if (invalidateCache) invalidateCache(nurseSelectedId);

            // Update patient
            if (handlePatientChange) handlePatientChange(nurseSelectedId);

            // Check if change is recent
            const changeTimestamp = localStorage.getItem(
              "patientChangeTimestamp"
            );
            if (
              changeTimestamp &&
              Date.now() - parseInt(changeTimestamp) < 5000
            ) {
              setTimeout(() => window.location.reload(), 50);
            }
          }
        } catch (error) {
          console.error("Error checking localStorage updates:", error);
        }
      };

      // Check immediately
      checkLocalStorageUpdates();

      // Then set up interval with a shorter polling time
      const interval = setInterval(checkLocalStorageUpdates, 500); // Check every 500ms instead of 1000ms
      return () => clearInterval(interval);
    }
  }, [
    mode,
    isDualScreen,
    patient,
    setPatient,
    lastSyncTimestamp,
    selectedPatientId,
    handlePatientChange,
    invalidateCache,
  ]);

  // Retrieve persisted status after reload
  useEffect(() => {
    const persistedStatus = localStorage.getItem("persistStatusThroughReload");
    if (persistedStatus && patient) {
      console.log("Restoring persisted status after reload:", persistedStatus);

      // Update the patient state with the persisted status
      setPatient((prev) => ({
        ...prev,
        status: persistedStatus,
      }));

      // Clear the persisted status so it doesn't affect future loads
      localStorage.removeItem("persistStatusThroughReload");
    }
  }, [patient, setPatient]);

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

  // Simple status button key handler
  const handleStatusKeyDown = (event, index) => {
    // Only handle Enter or Space for button activation
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      // Execute the appropriate action
      if (index === 0) {
        handleStatusUpdate("stable");
      } else if (index === 1) {
        handleStatusUpdate("needs-attention");
      } else if (index === 2) {
        handleStatusUpdate("critical");
      } else if (index === 3) {
        handleNurseCall();
      }
    }
  };

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

  // Add patient status update buttons to the MainDashboard component for patient mode
  const handleStatusUpdate = (status) => {
    console.log("Updating patient status to:", status);

    // Create a status mapping for UI display
    const statusDisplay = {
      stable: "I'm feeling fine",
      "needs-attention": "I need assistance",
      critical: "Urgent - Need help now",
    };

    try {
      // Update the local state immediately for responsive UI
      if (patient) {
        const updatedPatient = {
          ...patient,
          status: status,
        };

        // Update patient state with new status
        setPatient(updatedPatient);

        // For demo purposes, store in localStorage to persist between page refreshes
        // This also serves as a communication channel between windows
        localStorage.setItem("patientStatus", status);
        localStorage.setItem("patientStatusTimestamp", Date.now().toString());

        // Show success notification
        setStatusNotification({
          visible: true,
          message: `Status updated: ${statusDisplay[status] || status}`,
          type: status === "critical" ? "urgent" : "success",
        });

        // Dispatch an immediate event to notify all components of the status change
        // This helps with real-time updates across components
        window.dispatchEvent(
          new CustomEvent("patientStatusChanged", {
            detail: {
              patientId: patient.patientId,
              status: status,
              timestamp: Date.now(),
            },
          })
        );

        // Ensure we update the backend if available
        const API_BASE_URL =
          process.env.REACT_APP_API_URL || "http://localhost:5001";
        fetch(`${API_BASE_URL}/api/patients/${patient.patientId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPatient),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Server returned ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            console.log("Status update successful on server:", data);
            // Refresh any cached data
            if (invalidateCache && typeof invalidateCache === "function") {
              invalidateCache(patient.patientId);
            }
          })
          .catch((error) => {
            console.error("Backend update failed, but UI is updated:", error);
          });

        // If in dual screen mode, handle communication differently depending on which side we're on
        if (isDualScreen) {
          if (mode === "patient" && window.opener) {
            // Patient side - we're in a child window, send message to parent (staff) window
            try {
              console.log("Sending status update to staff window:", status);
              window.opener.postMessage(
                {
                  type: "patientInfoUpdate",
                  patientInfo: { status },
                  timestamp: Date.now(),
                },
                window.location.origin
              );
            } catch (error) {
              console.error("Failed to communicate with staff window:", error);
            }
          } else if (mode === "staff" && syncDataToPatientScreen) {
            // Staff side - use the sync function to update patient screen
            syncDataToPatientScreen("patientInfoUpdate", {
              status: status,
            });
          }
        }

        // Hide notification after 3 seconds
        setTimeout(() => {
          setStatusNotification((prev) => ({
            ...prev,
            visible: false,
          }));
        }, 3000);
      } else {
        throw new Error("Patient data not available");
      }
    } catch (error) {
      console.error("Error updating status:", error);

      // Show error notification
      setStatusNotification({
        visible: true,
        message: "Error updating status. Please try again.",
        type: "error",
      });

      // Hide error notification after 5 seconds
      setTimeout(() => {
        setStatusNotification((prev) => ({
          ...prev,
          visible: false,
        }));
      }, 5000);
    }
  };

  const handleNurseCall = () => {
    console.log("Calling the nurse");

    // Show notification
    setStatusNotification({
      visible: true,
      message: "Nurse has been called! Someone will assist you shortly.",
      type: "urgent",
    });

    // Also update status to critical
    if (patient) {
      const updatedPatient = {
        ...patient,
        status: "critical",
      };

      // Update state
      setPatient(updatedPatient);

      // For demo purposes, store in localStorage for cross-window communication
      localStorage.setItem("patientStatus", "critical");
      localStorage.setItem("patientStatusTimestamp", Date.now().toString());
      localStorage.setItem("nurseCallTimestamp", Date.now().toString());

      // Dispatch an immediate event to notify all components of the status change
      window.dispatchEvent(
        new CustomEvent("patientStatusChanged", {
          detail: {
            patientId: patient.patientId,
            status: "critical",
            timestamp: Date.now(),
          },
        })
      );

      // Update backend if available
      const API_BASE_URL =
        process.env.REACT_APP_API_URL || "http://localhost:5001";
      fetch(`${API_BASE_URL}/api/patients/${patient.patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPatient),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Nurse call status update successful on server:", data);
          // Refresh any cached data
          if (invalidateCache && typeof invalidateCache === "function") {
            invalidateCache(patient.patientId);
          }
        })
        .catch((error) => {
          console.error(
            "Backend update failed for nurse call, but UI is updated:",
            error
          );
        });

      // Dispatch nurse call event
      window.dispatchEvent(
        new CustomEvent("nurseCallRequested", {
          detail: {
            patientId: patient.patientId,
            timestamp: Date.now(),
          },
        })
      );

      // If in dual screen mode, handle communication differently depending on which side we're on
      if (isDualScreen) {
        if (mode === "patient" && window.opener) {
          // Patient side - we're in a child window, send message to parent (staff) window
          try {
            console.log("Sending nurse call to staff window");

            // Send both status update and nurse call messages
            window.opener.postMessage(
              {
                type: "patientInfoUpdate",
                patientInfo: { status: "critical" },
                timestamp: Date.now(),
              },
              window.location.origin
            );

            // Also send a specific nurse call event
            window.opener.postMessage(
              {
                type: "nurseCall",
                data: {
                  patientId: patient.patientId,
                  timestamp: Date.now(),
                },
              },
              window.location.origin
            );
          } catch (error) {
            console.error("Failed to communicate with staff window:", error);
          }
        } else if (mode === "staff" && syncDataToPatientScreen) {
          // Staff side - use the sync function to update patient screen
          syncDataToPatientScreen("patientInfoUpdate", {
            status: "critical",
          });

          // Then send a specific nurse call event
          syncDataToPatientScreen("nurseCall", {
            patientId: patient.patientId,
            timestamp: Date.now(),
          });
        }
      }
    }

    // Hide notification after 5 seconds
    setTimeout(() => {
      setStatusNotification((prev) => ({
        ...prev,
        visible: false,
      }));
    }, 5000);
  };

  // Add diagnostic logging for patient status
  useEffect(() => {
    if (patient && patient.status) {
      console.log("PATIENT STATUS CHANGED TO:", patient.status);
      console.log("Status change timestamp:", new Date().toLocaleTimeString());

      // Log to localStorage for debugging across components
      localStorage.setItem(
        "lastStatusChangeDebug",
        JSON.stringify({
          status: patient.status,
          timestamp: Date.now(),
          formattedTime: new Date().toLocaleTimeString(),
        })
      );

      // Match the UI class that should be active
      console.log("Active status class should be:", `status-${patient.status}`);
    }
  }, [patient?.status]);

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
      <div className="dashboard-scroll-wrapper">
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
              {/* Status Update Buttons - Only for Patient Mode */}
              {mode === "patient" && (
                <div className="status-update-container">
                  <h3>How are you feeling?</h3>
                  <div
                    className="status-buttons"
                    role="group"
                    aria-label="Status options"
                  >
                    <button
                      className={`status-button status-stable ${
                        patient.status === "stable" ? "active" : ""
                      }`}
                      onClick={() => handleStatusUpdate("stable")}
                      aria-label="I'm feeling fine"
                      tabIndex={0}
                      ref={(el) => (statusButtonRefs.current[0] = el)}
                      onKeyDown={(e) => handleStatusKeyDown(e, 0)}
                    >
                      <span>I'm feeling fine</span>
                    </button>
                    <button
                      className={`status-button status-needs-attention ${
                        patient.status === "needs-attention" ? "active" : ""
                      }`}
                      onClick={() => handleStatusUpdate("needs-attention")}
                      aria-label="I need assistance"
                      tabIndex={0}
                      ref={(el) => (statusButtonRefs.current[1] = el)}
                      onKeyDown={(e) => handleStatusKeyDown(e, 1)}
                    >
                      <span>I need assistance</span>
                    </button>
                    <button
                      className={`status-button status-critical ${
                        patient.status === "critical" ? "active" : ""
                      }`}
                      onClick={() => handleStatusUpdate("critical")}
                      aria-label="Urgent - Need help now"
                      tabIndex={0}
                      ref={(el) => (statusButtonRefs.current[2] = el)}
                      onKeyDown={(e) => handleStatusKeyDown(e, 2)}
                    >
                      <span>Urgent - Need help now</span>
                    </button>
                  </div>

                  <div className="nurse-call-section">
                    <h3>Need immediate assistance?</h3>
                    <button
                      className="nurse-call-button"
                      onClick={handleNurseCall}
                      aria-label="Call Nurse Now"
                      tabIndex={0}
                      onKeyDown={(e) => handleStatusKeyDown(e, 3)}
                      ref={(el) => (statusButtonRefs.current[3] = el)}
                    >
                      <span className="nurse-call-icon">🔔</span>
                      <span>Call Nurse Now</span>
                    </button>
                  </div>

                  <div className="keyboard-hint">
                    Use Tab key to navigate between buttons, Enter to select.
                  </div>
                </div>
              )}

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
                          {item.notes && (
                            <div className="notes">{item.notes}</div>
                          )}
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
        </div>
      </div>

      {/* Debug panel - only visible during development */}
      {process.env.NODE_ENV !== "production" && (
        <div className="debug-panel">
          <h4>Debug Info</h4>
          <div>Mode: {mode}</div>
          <div>Is Dual Screen: {isDualScreen ? "Yes" : "No"}</div>
          <div>Selected ID: {selectedPatientId}</div>
          <div>Nurse Selected ID: {nurseSelectedPatientId}</div>
          <div>Patient name: {patient?.name}</div>
          <div>
            Last Sync: {new Date(lastSyncTimestamp).toLocaleTimeString()}
          </div>
          <div>Sync Count: {syncCount}</div>
          <button onClick={() => window.location.reload()}>Force Reload</button>
          <button onClick={handleReloadWithCacheClear}>Clear Cache</button>
          {isDualScreen && mode === "staff" && (
            <button
              onClick={() => {
                // Test sync function
                if (patient) {
                  syncDataToPatientScreen(
                    "scheduleUpdate",
                    patient.schedule || []
                  );
                  syncDataToPatientScreen("patientInfoUpdate", {
                    name: patient.name,
                    room: patient.room,
                    careTeam: patient.careTeam,
                    preferences: patient.preferences,
                  });
                  alert("Manual sync triggered!");
                }
              }}
            >
              Test Sync
            </button>
          )}
        </div>
      )}

      {statusNotification.visible && (
        <div className={`status-notification ${statusNotification.type}`}>
          <div className="status-notification-content">
            <span>{statusNotification.message}</span>
            <button
              className="notification-close-btn"
              onClick={() =>
                setStatusNotification((prev) => ({ ...prev, visible: false }))
              }
            >
              ×
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default MainDashboard;
