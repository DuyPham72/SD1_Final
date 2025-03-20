// src/shared/components/Header.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/AuthContext";
import ModeIndicator from "./ModeIndicator";
import LoginModal from "./LoginModal";
import "../../styles/Header.css";
import PatientAccessQR from "./PatientAccessQR";
import RegistrationQRGenerator from "./RegistrationQRGenerator";

export const Header = ({
  patient,
  allPatients,
  selectedPatientId,
  onPatientChange,
  currentTime,
  isNavOpen,
  onNavToggle,
  mainNavElementsRef,
  mainNavFocusIndex,
  extraHeaderContent,
}) => {
  const { mode, isAuthenticated } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showRegQRCode, setShowRegQRCode] = useState(false);

  // Log state for debugging
  useEffect(() => {
    console.log("Header render - isNavOpen:", isNavOpen);
  }, [isNavOpen]);

  // Handle hamburger button click with debug logs
  const handleMenuToggle = () => {
    console.log("Menu button clicked - current isNavOpen:", isNavOpen);

    // Call onNavToggle and log the expected new state
    onNavToggle();
    console.log("Called onNavToggle - expected new state:", !isNavOpen);

    // Check if state actually updated
    setTimeout(() => {
      console.log("After toggle - isNavOpen:", isNavOpen);
    }, 100);
  };

  // Handle QR code button click
  const handleQRCodeClick = (e) => {
    e.preventDefault();
    setShowQRCode(true);
  };

  // Handle Registration QR button click
  const handleRegQRClick = (e) => {
    e.preventDefault();
    setShowRegQRCode(true);
  };

  return (
    <div className="header-bar">
      <button
        ref={(el) => (mainNavElementsRef.current.menuButton = el)}
        className={`menu-button ${mainNavFocusIndex === 0 ? "focused" : ""}`}
        onClick={handleMenuToggle}
        aria-label="Toggle navigation menu"
      >
        ☰
      </button>

      {/* Only show patient selector for staff mode */}
      {mode === "staff" && allPatients && allPatients.length > 0 && (
        <select
          ref={(el) => (mainNavElementsRef.current.patientSelector = el)}
          className={`patient-selector ${
            mainNavFocusIndex === 1 ? "focused" : ""
          }`}
          value={selectedPatientId}
          onChange={(e) => onPatientChange(e.target.value)}
        >
          {allPatients.map((p) => (
            <option key={p.patientId} value={p.patientId}>
              {p.name} - Room {p.room}
            </option>
          ))}
        </select>
      )}

      <h1 className="patient-header">Patient Name: {patient?.name}</h1>

      <div className="header-actions">
        {/* QR Code Buttons - only visible in staff mode */}
        {mode === "staff" && (
          <>
            {/* Patient Access QR - only show when a patient is selected */}
            {patient && (
              <button
                className="qr-code-button"
                onClick={handleQRCodeClick}
                title="Generate patient access QR code"
              >
                <span className="qr-icon">🔗</span>
                <span className="qr-text">Patient Access</span>
              </button>
            )}

            {/* New Patient Registration QR */}
            <button
              className="reg-qr-button"
              onClick={handleRegQRClick}
              title="Generate registration QR code for new patients"
            >
              <span className="qr-icon">➕</span>
              <span className="qr-text">New Patient</span>
            </button>
          </>
        )}

        <ModeIndicator />

        {mode === "patient" && (
          <button
            className="staff-login-button"
            onClick={() => setIsLoginModalOpen(true)}
          >
            Staff Login
          </button>
        )}

        {mode === "staff" && extraHeaderContent}
      </div>

      <div className="current-time">
        {currentTime && (
          <>
            <div>{currentTime.toLocaleDateString()}</div>
            <div>{currentTime.toLocaleTimeString()}</div>
          </>
        )}
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* QR Code Modals */}
      {showQRCode && (
        <PatientAccessQR
          patient={patient}
          onClose={() => setShowQRCode(false)}
        />
      )}

      {/* Registration QR Code Modal */}
      {showRegQRCode && (
        <RegistrationQRGenerator onClose={() => setShowRegQRCode(false)} />
      )}
    </div>
  );
};

export default Header;
