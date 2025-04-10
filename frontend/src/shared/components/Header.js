// src/shared/components/Header.js
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/AuthContext";
import ModeIndicator from "./ModeIndicator";
import LoginModal from "./LoginModal";
import "../../styles/Header.css";
import PatientAccessQR from "./PatientAccessQR";
import RegistrationQRGenerator from "./RegistrationQRGenerator";
import NotificationBadge from './NotificationBadge';
import FeedbackQR from "./FeedbackQR";

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
  const { mode, isAuthenticated, isDualScreen, enableDualScreen } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showRegQRCode, setShowRegQRCode] = useState(false);
  const [showFeedbackQRCode, setShowFeedbackQRCode] = useState(false);
  const [isDualScreenLogin, setIsDualScreenLogin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Create refs for our buttons
  const patientAccessBtnRef = useRef(null);
  const feedbackQRBtnRef = useRef(null);
  
  // Determine if we're in mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Register the button refs when the component mounts
  useEffect(() => {
    // Add patient access button to mainNavElementsRef if it exists
    if (patientAccessBtnRef.current && mode === "patient" && patient) {
      mainNavElementsRef.current.patientAccessBtn = patientAccessBtnRef.current;
    }
    
    // Add feedback QR button to mainNavElementsRef if it exists
    if (feedbackQRBtnRef.current && mode === "patient") {
      mainNavElementsRef.current.feedbackQRBtn = feedbackQRBtnRef.current;
    }
  }, [mainNavElementsRef, mode, patient]);

  // Handle escape key for modals
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        // Close the appropriate modal if it's open
        if (showQRCode) {
          setShowQRCode(false);
        }
        if (showFeedbackQRCode) {
          setShowFeedbackQRCode(false);
        }
        if (showRegQRCode) {
          setShowRegQRCode(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [showQRCode, showFeedbackQRCode, showRegQRCode]);

  // Handle functions
  const handleMenuToggle = () => {
    console.log("Menu button clicked - current isNavOpen:", isNavOpen);
    onNavToggle();
    console.log("Called onNavToggle - expected new state:", !isNavOpen);
    setTimeout(() => {
      console.log("After toggle - isNavOpen:", isNavOpen);
    }, 100);
  };

  const handleQRCodeClick = (e) => {
    e.preventDefault();
    setShowQRCode(true);
  };

  const handleNotificationClick = () => {
    setShowNotifications((prev) => !prev);
  };


  const handleRegQRClick = (e) => {
    e.preventDefault();
    setShowRegQRCode(true);
  };
  
  const handleFeedbackQRClick = (e) => {
    e.preventDefault();
    setShowFeedbackQRCode(true);
  };

  const handleEnableDualScreen = (e) => {
    e.preventDefault();
    console.log("Dual screen button clicked");
    
    if (typeof enableDualScreen === 'function') {
      enableDualScreen();
    } else {
      console.error("enableDualScreen is not a function");
    }
  };

  // Check if we're in patient mode on mobile
  const isPatientMobile = mode === 'patient' && isMobile;

  // Different rendering for mobile patient view vs normal view
  if (isPatientMobile) {
    // Get formatted time
    const formattedTime = currentTime ? 
      currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
    
    return (
      <div className="header-bar mobile-patient-header">
        <button
          ref={(el) => (mainNavElementsRef.current.menuButton = el)}
          className="menu-button"
          onClick={handleMenuToggle}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>

        {/* Patient name and time in a container */}
        <div className="patient-info-wrapper">
          <h1 className="patient-header">Patient Name: {patient?.name}</h1>
          <div className="mobile-time">{formattedTime}</div>
        </div>

        {/* Notification badge on the right */}
        <NotificationBadge notifications={["Patient here", "Patient", "John"]} />

        {/* Modals still needed */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => {
            setIsLoginModalOpen(false);
            setIsDualScreenLogin(false);
          }}
          isDualScreenLogin={isDualScreenLogin}
          onDualScreenEnable={enableDualScreen}
        />

        {showQRCode && (
          <PatientAccessQR
            patient={patient}
            onClose={() => setShowQRCode(false)}
            autoFocus={true}
          />
        )}

        {showRegQRCode && (
          <RegistrationQRGenerator 
            onClose={() => setShowRegQRCode(false)}
            autoFocus={true}
          />
        )}
        
        {showFeedbackQRCode && (
          <FeedbackQR
            patient={patient}
            onClose={() => setShowFeedbackQRCode(false)}
            autoFocus={true}
          />
        )}
      </div>
    );
  }

  // Normal desktop or staff view
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
        {/* Dual Screen Mode Button */}
        {mode === "staff" && !isDualScreen && (
          <button
            className="dual-screen-button"
            onClick={handleEnableDualScreen}
            title="Enable dual screen mode (staff view on this screen, patient view on second screen)"
          >
            <span className="dual-screen-icon">🖥️</span>
            <span className="dual-screen-text">Dual Screen</span>
          </button>
        )}
        
        {/* Patient Access QR - only visible in patient mode */}
        {mode === "patient" && patient && (
          <button
            ref={patientAccessBtnRef}
            className={`qr-code-button ${mainNavFocusIndex === 2 ? "focused" : ""}`}
            onClick={handleQRCodeClick}
            title="Generate patient access QR code"
          >
            <span className="qr-icon">🔗</span>
            <span className="qr-text">Patient Access</span>
          </button>
        )}
        
        {/* Feedback QR Button - only visible in patient mode */}
        {mode === "patient" && (
          <button
            ref={feedbackQRBtnRef}
            className={`feedback-qr-button ${mainNavFocusIndex === 3 ? "focused" : ""}`}
            onClick={handleFeedbackQRClick}
            title="Generate QR code for patients to submit feedback on their own device"
          >
            <span className="qr-icon">📱</span>
            <span className="qr-text">Feedback QR</span>
          </button>
        )}

        {/* Staff mode buttons */}
        {mode === "staff" && (
          <>
            {/* New Patient Registration QR */}
            <button
              className="reg-qr-button"
              onClick={handleRegQRClick}
              title="Registration QR code"
            >
              <span className="qr-icon">➕</span>
              <span className="qr-text">New Patient</span>
            </button>
          </>
        )}

        <ModeIndicator />

        {/* Notification Button */}
        {mode === "staff" && <NotificationBadge />}

        {/* Only show Staff Login button in patient mode when not in dual screen mode */}

        {/* Staff Login button in patient mode */}
        {mode === "patient" && !isDualScreen && (
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

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setIsDualScreenLogin(false);
        }}
        isDualScreenLogin={isDualScreenLogin}
        onDualScreenEnable={enableDualScreen}
      />

      {showQRCode && (
        <PatientAccessQR
          patient={patient}
          onClose={() => setShowQRCode(false)}
          autoFocus={true}
        />
      )}

      {showRegQRCode && (
        <RegistrationQRGenerator 
          onClose={() => setShowRegQRCode(false)}
          autoFocus={true}
        />
      )}
      
      {showFeedbackQRCode && (
        <FeedbackQR
          patient={patient}
          onClose={() => setShowFeedbackQRCode(false)}
          autoFocus={true}
        />
      )}
    </div>
  );
};

export default Header;