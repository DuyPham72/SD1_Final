import React, { useState, useEffect, useCallback, useRef } from "react";
import "../../styles/PatientAccessQR.css";

function PatientAccessQR({ patient, onClose, autoFocus }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Add ref for back button
  const backButtonRef = useRef(null);

  // Function to generate the QR code
  const generateQR = useCallback(async () => {
    if (!patient || !patient.patientId) return;

    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL =
        process.env.REACT_APP_API_URL || "http://localhost:5001";
      const response = await fetch(
        `${API_BASE_URL}/api/patients/${patient.patientId}/access-qr`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Server returned ${response.status}`
        );
      }

      const data = await response.json();
      setQrData(data);
    } catch (err) {
      console.error("Error generating QR code:", err);
      setError(err.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  }, [patient]);

  // Generate QR on first render
  useEffect(() => {
    generateQR();
  }, [generateQR]);

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

  // Handle link copying
  const copyLink = () => {
    if (!qrData?.accessUrl) return;

    navigator.clipboard
      .writeText(qrData.accessUrl)
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
          <h2>Patient Access QR Code</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="qr-content">
          {loading ? (
            <div className="loading-indicator">Generating QR code...</div>
          ) : error ? (
            <div className="error-message">
              <p>Error: {error}</p>
              <button className="retry-button" onClick={generateQR}>
                Try Again
              </button>
            </div>
          ) : qrData ? (
            <>
              <p className="qr-instructions">
                Scan this QR code or use the link below to access your patient
                portal
              </p>

              <div className="qr-code-display">
                <img
                  src={qrData.qrCodeDataUrl}
                  alt="Patient access QR code"
                  className="qr-code-image"
                />
              </div>

              <div className="expiry-note">
                This code will expire in {qrData.expiresIn}
              </div>

              <div className="access-link-container">
                <input
                  type="text"
                  value={qrData.accessUrl}
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
                  Share this link only with the patient. The link provides
                  direct access to patient information.
                </p>
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
            <div className="error-message">
              <p>Unable to generate QR code</p>
              <button className="retry-button" onClick={generateQR}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientAccessQR;