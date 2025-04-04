import React, { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PatientInfo.css";
import {
  usePatientData,
  useTimeUpdate,
  useNavigationState,
  useKeyboardNavigation,
  Layout,
  Header,
} from "../shared";
import { useAuth } from "../shared/hooks/AuthContext";
import PatientFeedbackTab from "../shared/components/PatientFeedbackTab";

// Custom hook for form state management
const usePatientForm = (patient, setPatient) => {
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRefs = useRef([]);

  // Initialize form data when editing begins
  const initializeForm = useCallback(() => {
    setSaveError(null);
    setEditing(true);
    setEditedData({
      ...patient,
      schedule: patient.schedule || [
        { time: "9:00 AM", activity: "Medication", notes: "Pain relief" },
        { time: "10:00 AM", activity: "Physical Therapy", notes: null },
        { time: "12:00 PM", activity: "Lunch", notes: "Vegetarian" },
        { time: "2:00 PM", activity: "Doctor Visit", notes: "Check vitals" },
      ],
    });
  }, [patient]);

  // Handle saving the form
  const saveForm = useCallback(
    async (editingItem, setEditingItem, onSuccess) => {
      if (isSaving) return;

      // If editing a schedule item, just finish that edit
      if (editingItem !== null) {
        setEditingItem(null);
        return;
      }

      setSaveError(null);
      setIsSaving(true);

      if (!editedData || !editedData.patientId) {
        setSaveError("Invalid patient data");
        setIsSaving(false);
        return;
      }

      try {
        const API_BASE_URL =
          process.env.REACT_APP_API_URL || "http://localhost:5001";
        const response = await fetch(
          `${API_BASE_URL}/api/patients/${editedData.patientId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editedData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.message || `Server returned ${response.status}`
          );
        }

        const updatedData = await response.json();

        setPatient(updatedData);
        setEditing(false);

        if (onSuccess) onSuccess();
      } catch (error) {
        console.error("Error saving:", error);
        setSaveError(error.message || "Failed to save changes");
      } finally {
        setIsSaving(false);
      }
    },
    [editedData, setPatient, isSaving]
  );

  // Update a field in the form
  const updateField = useCallback((field, value) => {
    if (field.isArray) {
      value = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    setEditedData((prev) => {
      if (field.path.length === 2) {
        return {
          ...prev,
          [field.path[0]]: {
            ...prev[field.path[0]],
            [field.path[1]]: value,
          },
        };
      }
      return {
        ...prev,
        [field.path[0]]: value,
      };
    });
  }, []);

  // Helper to get field value
  const getFieldValue = useCallback(
    (field) => {
      if (!patient) return "";

      try {
        if (field.isArray) {
          const arr =
            field.path.length === 2
              ? patient[field.path[0]][field.path[1]]
              : patient[field.path[0]];
          return Array.isArray(arr) ? arr.join(", ") : "";
        }

        return field.path.length === 2
          ? patient[field.path[0]][field.path[1]]
          : patient[field.path[0]];
      } catch (error) {
        console.error(`Error getting field value for ${field.label}:`, error);
        return "";
      }
    },
    [patient]
  );

  return {
    editing,
    setEditing,
    editedData,
    setEditedData,
    saveError,
    isSaving,
    inputRefs,
    initializeForm,
    saveForm,
    updateField,
    getFieldValue,
  };
};

function PatientInfo() {
  const navigate = useNavigate();

  // Get auth context for mode and nurse selected patient
  const { mode, nurseSelectedPatientId, updateNurseSelectedPatient } =
    useAuth();

  const {
    patient,
    setPatient,
    allPatients,
    selectedPatientId,
    loading,
    handlePatientChange,
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

  // Navigation section state
  const [navigationSection, setNavigationSection] = useState("main");
  const [focusedInputIndex, setFocusedInputIndex] = useState(null);
  const [focusedScheduleIndex, setFocusedScheduleIndex] = useState(null);
  const [editingScheduleItem, setEditingScheduleItem] = useState(null);

  // State for save button hover
  const [isSaveButtonHovered, setIsSaveButtonHovered] = useState(false);

  // Refs
  const mainNavElementsRef = useRef({
    menuButton: null,
    patientSelector: null,
    editButton: null,
  });
  const sidebarButtonsRef = useRef([]);
  const scheduleButtonRefs = useRef([]);
  const scheduleInputRefs = useRef([]);

  // Custom form hook
  const {
    editing,
    setEditing,
    editedData,
    setEditedData,
    saveError,
    isSaving,
    inputRefs,
    initializeForm,
    saveForm,
    updateField,
    getFieldValue,
  } = usePatientForm(patient, setPatient);

  // Function to sort schedule by time
  const sortScheduleByTime = useCallback((schedule) => {
    return [...schedule].sort((a, b) => {
      // Handle empty time strings
      if (!a.time) return 1;
      if (!b.time) return -1;
      
      // Convert times to 24-hour format for proper sorting
      const getTimeValue = (timeStr) => {
        let [time, modifier] = timeStr.split(' ');
        if (!time || !modifier) return -1;
        
        let [hours, minutes] = time.split(':').map(Number);
        
        // Convert to 24 hour format
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + (minutes || 0); // Return minutes since midnight
      };
      
      return getTimeValue(a.time) - getTimeValue(b.time);
    });
  }, []);

  // Use the nurse-selected patient ONLY in staff mode
  useEffect(() => {
    // Only apply nurse selection in staff mode
    if (
      mode === "staff" &&
      nurseSelectedPatientId &&
      allPatients &&
      allPatients.length > 0
    ) {
      // Check if the nurseSelectedPatientId exists in allPatients
      const patientExists = allPatients.some(
        (p) => p.patientId === nurseSelectedPatientId
      );

      if (patientExists && selectedPatientId !== nurseSelectedPatientId) {
        console.log(
          "PatientInfo: Setting patient from nurse selection:",
          nurseSelectedPatientId
        );
        handlePatientChange(nurseSelectedPatientId);
      }
    }
  }, [
    mode,
    nurseSelectedPatientId,
    allPatients,
    selectedPatientId,
    handlePatientChange,
  ]);

  // Create a wrapped version of handlePatientChange that also updates the persisted ID
  const handlePatientChangeWithModeAwareness = (patientId) => {
    console.log(
      "PatientInfo: Patient changed in mode:",
      mode,
      "to:",
      patientId
    );

    // In staff mode, update the nurse-selected patient
    if (mode === "staff") {
      updateNurseSelectedPatient(patientId);
    }

    // Always update the current selection
    handlePatientChange(patientId);
  };

  // Handle edit button click
  const handleEdit = useCallback(() => {
    initializeForm();
    setFocusedInputIndex(0);
    setNavigationSection("info");

    // Focus first input after render
    requestAnimationFrame(() => {
      inputRefs.current[0]?.focus();
    });
  }, [initializeForm]);

  // Handle save button click - UPDATED to sort only when saving
  const handleSave = useCallback(() => {
    if (editedData && editedData.schedule) {
      // Sort schedule before saving
      setEditedData(prev => ({
        ...prev,
        schedule: sortScheduleByTime(prev.schedule)
      }));
    }

    // Wait a brief moment to ensure the sorting is applied before saving
    setTimeout(() => {
      saveForm(editingScheduleItem, setEditingScheduleItem, () => {
        // Reset navigation on successful save
        setFocusedInputIndex(null);
        setFocusedScheduleIndex(null);
        setNavigationSection("main");
        setMainNavFocusIndex(2);

        // Focus edit button after save
        requestAnimationFrame(() => {
          mainNavElementsRef.current.editButton?.focus();
        });
      });
    }, 50);
  }, [
    saveForm,
    editingScheduleItem,
    setEditingScheduleItem,
    setMainNavFocusIndex,
    editedData,
    sortScheduleByTime,
  ]);

  // Schedule item editing functions
  const handleItemEdit = useCallback((index) => {
    setEditingScheduleItem(index);
    setFocusedScheduleIndex(index);
    requestAnimationFrame(() => {
      scheduleInputRefs.current[index]?.timeInput?.focus();
    });
  }, []);

  // UPDATED to not sort when updating fields
  const handleItemUpdate = useCallback(
    (index, field, value) => {
      setEditedData((prev) => {
        const updatedSchedule = prev.schedule.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        );
        
        // Do NOT sort when updating fields
        return {
          ...prev,
          schedule: updatedSchedule,
        };
      });
    },
    [setEditedData]
  );

  // UPDATED to not sort when adding new items
  const handleAddScheduleItem = useCallback(() => {
    if (!editing || !editedData) return;

    // Create a new empty schedule item
    const newItem = {
      time: "",
      activity: "",
      notes: "",
      completed: false,
    };

    // Add to schedule array WITHOUT sorting
    setEditedData((prev) => ({
      ...prev,
      schedule: [...prev.schedule, newItem],
    }));

    // Set focus to the new item (it will be the last one)
    const newIndex = editedData.schedule.length;
    setTimeout(() => {
      setEditingScheduleItem(newIndex);
      setFocusedScheduleIndex(newIndex);
      requestAnimationFrame(() => {
        scheduleInputRefs.current[newIndex]?.timeInput?.focus();
      });
    }, 50);
  }, [editing, editedData, setEditedData]);

  // Delete schedule item
  const handleDeleteScheduleItem = useCallback(
    (index) => {
      if (!editing || !editedData) return;

      // Remove the item at the specified index
      setEditedData((prev) => ({
        ...prev,
        schedule: prev.schedule.filter((_, i) => i !== index),
      }));

      // Reset focus
      setEditingScheduleItem(null);
      setFocusedScheduleIndex(null);
    },
    [editing, editedData, setEditedData]
  );

  const handleKeyDown = useCallback(
    (e, index, field) => {
      // If hovering over save button and pressing Enter, save changes
      if (e.key === "Enter" && isSaveButtonHovered) {
        e.preventDefault();
        handleSave();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (field === "time") {
          scheduleInputRefs.current[index]?.activityInput?.focus();
        } else if (field === "activity") {
          scheduleInputRefs.current[index]?.notesInput?.focus();
        } else if (field === "notes") {
          // When pressing Enter on the last field (notes),
          // save all changes instead of just closing the edit mode
          handleSave();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setEditingScheduleItem(null);
        setFocusedScheduleIndex(index);
        scheduleButtonRefs.current[index]?.focus();
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        // Allow arrow navigation to exit editing mode and go to Save Changes button
        if (field === "notes" && e.key === "ArrowDown") {
          e.preventDefault();
          setEditingScheduleItem(null);
          setNavigationSection("main");
          setMainNavFocusIndex(2);
          requestAnimationFrame(() => {
            mainNavElementsRef.current.editButton?.focus();
          });
        }
      }
    },
    [isSaveButtonHovered, handleSave, setMainNavFocusIndex]
  );

  // Clear refs when editing status changes
  useEffect(() => {
    if (editing) {
      inputRefs.current = [];
      scheduleButtonRefs.current = [];
      scheduleInputRefs.current = [];
    }
  }, [editing]);

  // Handle the edit/save button click
  const handleButtonClick = useCallback(
    (e) => {
      e.preventDefault();
      if (isSaving) return;

      if (editing) {
        handleSave();
      } else {
        handleEdit();
      }
    },
    [editing, handleSave, handleEdit, isSaving]
  );

  // Handle keyboard navigation
  const handleKeyNavigation = useCallback(
    (e) => {
      if (!editing) return;
      if (editingScheduleItem !== null) return;

      const totalInfoInputs = inputRefs.current.filter(Boolean).length;
      const totalScheduleButtons =
        scheduleButtonRefs.current.filter(Boolean).length;

      // Navigation handling based on current section
      if (navigationSection === "main") {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          setNavigationSection("info");
          setFocusedInputIndex(0);
          setFocusedScheduleIndex(null);
          inputRefs.current[0]?.focus();
        }
      } else if (navigationSection === "info") {
        if (e.key === "ArrowDown") {
          e.preventDefault();

          if (focusedInputIndex === totalInfoInputs - 1) {
            // Move to schedule or save button
            if (totalScheduleButtons > 0) {
              setNavigationSection("schedule");
              setFocusedInputIndex(null);
              setFocusedScheduleIndex(0);
              scheduleButtonRefs.current[0]?.focus();
            } else {
              setNavigationSection("main");
              setFocusedInputIndex(null);
              setMainNavFocusIndex(2);
              mainNavElementsRef.current.editButton?.focus();
            }
          } else {
            // Move between inputs
            setFocusedInputIndex((prev) => {
              const nextIndex = Math.min(prev + 1, totalInfoInputs - 1);
              inputRefs.current[nextIndex]?.focus();
              return nextIndex;
            });
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();

          if (focusedInputIndex === 0) {
            // Move from first input to save button
            setNavigationSection("main");
            setFocusedInputIndex(null);
            setMainNavFocusIndex(2);
            mainNavElementsRef.current.editButton?.focus();
          } else {
            // Move between inputs
            setFocusedInputIndex((prev) => {
              const nextIndex = Math.max(prev - 1, 0);
              inputRefs.current[nextIndex]?.focus();
              return nextIndex;
            });
          }
        }
      } else if (navigationSection === "schedule") {
        if (e.key === "ArrowDown") {
          e.preventDefault();

          if (focusedScheduleIndex === totalScheduleButtons - 1) {
            // Move to save button
            setNavigationSection("main");
            setFocusedScheduleIndex(null);
            setMainNavFocusIndex(2);
            mainNavElementsRef.current.editButton?.focus();
          } else {
            // Move between schedule buttons
            setFocusedScheduleIndex((prev) => {
              const nextIndex = Math.min(prev + 1, totalScheduleButtons - 1);
              scheduleButtonRefs.current[nextIndex]?.focus();
              return nextIndex;
            });
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();

          if (focusedScheduleIndex === 0) {
            // Move to last info input
            setNavigationSection("info");
            setFocusedScheduleIndex(null);
            setFocusedInputIndex(totalInfoInputs - 1);
            inputRefs.current[totalInfoInputs - 1]?.focus();
          } else {
            // Move between schedule buttons
            setFocusedScheduleIndex((prev) => {
              const nextIndex = Math.max(prev - 1, 0);
              scheduleButtonRefs.current[nextIndex]?.focus();
              return nextIndex;
            });
          }
        } else if (e.key === "Enter" && focusedScheduleIndex !== null) {
          e.preventDefault();
          handleItemEdit(focusedScheduleIndex);
        }
      }

      // Global keyboard shortcuts
      if (
        e.key === "Enter" &&
        navigationSection === "main" &&
        mainNavFocusIndex === 2
      ) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setEditing(false);
        setEditedData(null);
        setFocusedInputIndex(null);
        setFocusedScheduleIndex(null);
        setNavigationSection("main");
        setMainNavFocusIndex(2);
        mainNavElementsRef.current.editButton?.focus();
      }
    },
    [
      editing,
      focusedInputIndex,
      focusedScheduleIndex,
      navigationSection,
      mainNavFocusIndex,
      setMainNavFocusIndex,
      handleSave,
      handleItemEdit,
      editingScheduleItem,
    ]
  );

  // Set up keyboard navigation
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
    customHandlers: editing
      ? {
          ArrowDown: handleKeyNavigation,
          ArrowUp: handleKeyNavigation,
          ArrowRight: handleKeyNavigation,
          ArrowLeft: handleKeyNavigation,
          Enter: handleKeyNavigation,
          Escape: handleKeyNavigation,
        }
      : {},
  });

  if (loading) return <div className="loading">Loading...</div>;
  if (!patient) return <div className="error">No patient data available</div>;

  // Field definitions for patient info
  const patientFields = [
    { label: "Physician", path: ["careTeam", "primaryDoctor"] },
    { label: "Nurse", path: ["careTeam", "primaryNurse"] },
    { label: "Room", path: ["room"] },
    { label: "Dietary", path: ["preferences", "dietary"], isArray: true },
    { label: "Language", path: ["preferences", "language"] },
    { label: "Religious", path: ["preferences", "religious"] },
  ];

  // Filter fields present in patient data
  const visibleFields = patientFields.filter((field) => {
    if (field.path.length === 2) {
      return (
        patient[field.path[0]] &&
        patient[field.path[0]][field.path[1]] !== undefined
      );
    }
    return patient[field.path[0]] !== undefined;
  });

  // Render schedule section
  const renderSchedule = () => {
    const scheduleData = editing
      ? editedData?.schedule
      : patient.schedule || [];

    return (
      <div className="schedule-section">
        {editing && (
          <div className="schedule-actions">
            <button
              type="button"
              className="add-schedule-button"
              onClick={handleAddScheduleItem}
            >
              + Add Schedule Item
            </button>
          </div>
        )}

        {scheduleData.length === 0 ? (
          <div className="no-schedule">No scheduled activities</div>
        ) : (
          <div className="schedule-list">
            {scheduleData.map((item, index) => (
              <div
                key={index}
                className={`schedule-item ${
                  editingScheduleItem === index ? "editing" : ""
                }`}
              >
                {editingScheduleItem === index ? (
                  // Editing mode for this item
                  <>
                    <input
                      ref={(el) => {
                        if (!scheduleInputRefs.current[index])
                          scheduleInputRefs.current[index] = {};
                        scheduleInputRefs.current[index].timeInput = el;
                      }}
                      type="text"
                      value={editedData.schedule[index].time}
                      onChange={(e) =>
                        handleItemUpdate(index, "time", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, index, "time")}
                      className="schedule-input time-input"
                      placeholder="Time (e.g., 9:00 AM)"
                    />
                    <input
                      ref={(el) => {
                        if (!scheduleInputRefs.current[index])
                          scheduleInputRefs.current[index] = {};
                        scheduleInputRefs.current[index].activityInput = el;
                      }}
                      type="text"
                      value={editedData.schedule[index].activity}
                      onChange={(e) =>
                        handleItemUpdate(index, "activity", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, index, "activity")}
                      className="schedule-input activity-input"
                      placeholder="Activity"
                    />
                    <input
                      ref={(el) => {
                        if (!scheduleInputRefs.current[index])
                          scheduleInputRefs.current[index] = {};
                        scheduleInputRefs.current[index].notesInput = el;
                      }}
                      type="text"
                      value={editedData.schedule[index].notes || ""}
                      placeholder="Notes (optional)"
                      onChange={(e) =>
                        handleItemUpdate(index, "notes", e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, index, "notes")}
                      className="schedule-input notes-input"
                    />
                    <button
                      type="button"
                      className="delete-item-button"
                      onClick={() => handleDeleteScheduleItem(index)}
                      title="Delete this schedule item"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  // Display mode
                  <>
                    <div className="time">{item.time}</div>
                    <div className="activity">
                      {item.activity}
                      {item.notes && (
                        <span className="notes"> - {item.notes}</span>
                      )}
                    </div>
                    {editing && (
                      <>
                        <button
                          ref={(el) => (scheduleButtonRefs.current[index] = el)}
                          className={`schedule-edit-button ${
                            navigationSection === "schedule" &&
                            focusedScheduleIndex === index
                              ? "focused"
                              : ""
                          }`}
                          onClick={() => handleItemEdit(index)}
                          onFocus={() => {
                            setNavigationSection("schedule");
                            setFocusedScheduleIndex(index);
                            setFocusedInputIndex(null);
                            setMainNavFocusIndex(null);
                          }}
                          tabIndex={editing ? 0 : -1}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteScheduleItem(index)}
                          title="Delete this schedule item"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render personal information
  const renderPatientInfo = () => {
    return (
      <div className="info-fields">
        {visibleFields.map((field, index) => (
          <div key={field.label} className="info-field">
            <label>{field.label}:</label>
            {editing ? (
              <input
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                value={
                  field.isArray
                    ? editedData[field.path[0]][field.path[1]].join(", ")
                    : field.path.length === 2
                    ? editedData[field.path[0]][field.path[1]]
                    : editedData[field.path[0]]
                }
                onChange={(e) => updateField(field, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    handleKeyNavigation(e);
                  }
                }}
                onFocus={() => {
                  setNavigationSection("info");
                  setFocusedInputIndex(index);
                  setFocusedScheduleIndex(null);
                  setMainNavFocusIndex(null);
                }}
                className={`editable-input ${
                  navigationSection === "info" && focusedInputIndex === index
                    ? "focused"
                    : ""
                }`}
                disabled={isSaving}
              />
            ) : (
              <span>{getFieldValue(field)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Header Button
  const extraHeaderContent = (
    <>
      <button
        ref={(el) => (mainNavElementsRef.current.editButton = el)}
        className={`
          ${editing ? "header-save-button" : "header-edit-button"}
          ${
            navigationSection === "main" && mainNavFocusIndex === 2
              ? "focused"
              : ""
          }
          ${isSaving ? "disabled" : ""}
        `}
        onClick={handleButtonClick}
        disabled={isSaving}
        type="button"
        onFocus={() => {
          setNavigationSection("main");
          setMainNavFocusIndex(2);
          setFocusedInputIndex(null);
          setFocusedScheduleIndex(null);
        }}
        onMouseEnter={() => setIsSaveButtonHovered(true)}
        onMouseLeave={() => setIsSaveButtonHovered(false)}
      >
        {editing
          ? isSaving
            ? "Saving..."
            : "Save Changes"
          : "Edit Information"}
      </button>

      {saveError && (
        <div className="error-message" role="alert">
          {saveError}
        </div>
      )}
    </>
  );

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
        onPatientChange={handlePatientChangeWithModeAwareness}
        currentTime={currentTime}
        isNavOpen={isNavOpen}
        onNavToggle={() => setIsNavOpen(!isNavOpen)}
        mainNavElementsRef={mainNavElementsRef}
        mainNavFocusIndex={mainNavFocusIndex}
        extraHeaderContent={extraHeaderContent}
      />

      {/* Updated layout structure with left and right columns */}
      <div className="content-container">
        {/* Left Column - Contains Personal Info and Schedule stacked vertically */}
        <div className="left-column">
          {/* Patient Information Card */}
          <div className="info-card personal-info">
            <h2>Personal Information</h2>
            {renderPatientInfo()}
          </div>

          {/* Schedule Card */}
          <div className="info-card schedule">
            <h2>Today's Schedule</h2>
            {renderSchedule()}
          </div>
        </div>

        {/* Right Column - Contains Patient Feedback */}
        <div className="right-column">
          <div className="info-card">
            <div className="feedback-container">
              <PatientFeedbackTab patient={patient} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default PatientInfo;