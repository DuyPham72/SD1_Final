// src/shared/components/FeedbackQR.js
// This component displays a QR code for patients to access the feedback form
import React, { useState, useEffect, useRef } from "react";
import "../../styles/PatientAccessQR.css"; // Reuse existing styles

function FeedbackQR({ patient, onClose, autoFocus }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Add ref for back button
  const backButtonRef = useRef(null);

  // Generate the QR code when component mounts
  useEffect(() => {
    generateFeedbackQR();
  }, []);
  
  // Handle escape/backspace key for closing the modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Auto-focus back button if requested
    if (autoFocus && backButtonRef.current) {
      backButtonRef.current.focus();
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, autoFocus]);

  // Function to generate the feedback QR code that patients can scan with their own devices
  const generateFeedbackQR = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
      
      // Include patient info in the feedback URL if available
      const payload = patient ? { 
        patientId: patient.patientId,
        patientName: patient.name,
        room: patient.room
      } : {};

      const response = await fetch(`${API_BASE_URL}/api/feedback/create-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Server returned ${response.status}`);
      }

      const data = await response.json();
      setQrData(data);
    } catch (err) {
      console.error("Error generating feedback QR code:", err);
      setError(err.message || "Failed to generate feedback QR code");
    } finally {
      setLoading(false);
    }
  };

  // Handle link copying
  const copyLink = () => {
    if (!qrData?.feedbackUrl) return;

    navigator.clipboard
      .writeText(qrData.feedbackUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        setError("Failed to copy link. Please try again.");
      });
  };

  return (
    <div className="patient-access-qr-container">
      <div className="qr-modal">
        <div className="qr-header">
          <h2>Patient Feedback QR</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="qr-content">
          {loading ? (
            <p className="loading-message">Generating QR code...</p>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button className="retry-button" onClick={generateFeedbackQR}>
                Try Again
              </button>
            </div>
          ) : qrData ? (
            <>
              <p className="qr-instructions">
                Patients can scan this QR code with their phone to fill out the feedback form on their own device
              </p>

              <div className="qr-code-display">
                <img
                  src={qrData.qrCodeDataUrl}
                  alt="Patient feedback QR code"
                  className="qr-code-image"
                />
              </div>

              <div className="expiry-note">
                This code will expire in {qrData.expiresIn}
              </div>

              <div className="access-link-container">
                <input
                  type="text"
                  value={qrData.feedbackUrl}
                  readOnly
                  className="access-link"
                />
                <button
                  className={`copy-button ${copied ? "copied" : ""}`}
                  onClick={copyLink}
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>

              <div className="qr-footer">
                <p className="security-note">
                  Patients can use this QR code to fill out the feedback form on their own phone or tablet.
                </p>
                {patient && (
                  <div className="feedback-summary">
                    <p>Patient: {patient.name}</p>
                    <p>Room: {patient.room}</p>
                    <p>This patient's information will be pre-filled in the form.</p>
                  </div>
                )}
              </div>
              
              {/* Add Back button */}
              <button 
                ref={backButtonRef}
                className="back-button"
                onClick={onClose}
              >
                Back
              </button>
            </>
          ) : (
            <p className="loading-message">Initializing...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default FeedbackQR;