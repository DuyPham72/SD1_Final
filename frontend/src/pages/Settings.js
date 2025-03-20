import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Settings.css";
import {
  usePatientData,
  useTimeUpdate,
  useNavigationState,
  useKeyboardNavigation,
  Layout,
  Header,
} from "../shared";

function Settings() {
  const navigate = useNavigate();
  const {
    patient,
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

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const mainNavElementsRef = useRef({
    menuButton: null,
    patientSelector: null,
    darkModeToggle: null,
  });
  const sidebarButtonsRef = useRef([]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "true");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDarkMode]);

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
  });

  if (loading) return <div className="loading">Loading...</div>;
  if (!patient) return <div className="error">No patient data available</div>;

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
        <div className="info-card">
          <h2>System Settings</h2>
          <div className="settings-section">
            <div className="setting-option">
              <label htmlFor="dark-mode-toggle">Dark Mode</label>
              <button
                ref={(el) => (mainNavElementsRef.current.darkModeToggle = el)}
                id="dark-mode-toggle"
                className={`toggle-button ${
                  mainNavFocusIndex === 2 ? "focused" : ""
                } ${isDarkMode ? "active" : ""}`}
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? "🌙 Dark" : "☀️ Light"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Settings;
