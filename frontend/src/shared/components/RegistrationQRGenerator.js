// src/shared/components/RegistrationQRGenerator.js
import React, { useState, useCallback } from "react";
import "../../styles/PatientAccessQR.css"; // Reuse existing styles

function RegistrationQRGenerator({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    doctor: "",
    nurse: "",
    room: "",
  });

  // Available doctors with their assigned room prefixes
  const doctors = [
    { id: "dr1", name: "Dr. Johnson", roomPrefix: "10" },
    { id: "dr2", name: "Dr. Smith", roomPrefix: "20" },
    { id: "dr3", name: "Dr. Williams", roomPrefix: "30" },
    { id: "dr4", name: "Dr. Brown", roomPrefix: "40" },
  ];

  // Available nurses
  const nurses = [
    { id: "n1", name: "RN Michael" },
    { id: "n2", name: "RN Sarah" },
    { id: "n3", name: "RN David" },
    { id: "n4", name: "RN Jessica" },
  ];

  // Available rooms based on selected doctor
  const getAvailableRooms = () => {
    if (!formData.doctor) return [];

    const selectedDoctor = doctors.find((doc) => doc.name === formData.doctor);
    if (!selectedDoctor) return [];

    // Generate room numbers based on doctor's prefix
    return [
      `${selectedDoctor.roomPrefix}1A`,
      `${selectedDoctor.roomPrefix}1B`,
      `${selectedDoctor.roomPrefix}2A`,
      `${selectedDoctor.roomPrefix}2B`,
    ];
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };

      // If doctor changes, reset room
      if (name === "doctor") {
        newData.room = "";
      }

      return newData;
    });
  };

  // Function to generate the registration QR code
  const generateQR = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL =
        process.env.REACT_APP_API_URL || "http://localhost:5001";

      const response = await fetch(
        `${API_BASE_URL}/api/registration/create-qr`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
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
      console.error("Error generating registration QR code:", err);
      setError(err.message || "Failed to generate registration QR code");
    } finally {
      setLoading(false);
    }
  }, [formData]);

  // Handle link copying
  const copyLink = () => {
    if (!qrData?.registrationUrl) return;

    navigator.clipboard
      .writeText(qrData.registrationUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        setError("Failed to copy link. Please try again.");
      });
  };

  // Get available rooms based on selected doctor
  const availableRooms = getAvailableRooms();

  return (
    <div className="patient-access-qr-container">
      <div className="qr-modal">
        <div className="qr-header">
          <h2>New Patient Registration QR</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="qr-content">
          {!qrData ? (
            <div className="registration-form">
              <p>Create a registration link for a new patient</p>

              <div className="form-group">
                <label>Assign Doctor</label>
                <select
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.name}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assign Nurse</label>
                <select
                  name="nurse"
                  value={formData.nurse}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">-- Select Nurse --</option>
                  {nurses.map((nurse) => (
                    <option key={nurse.id} value={nurse.name}>
                      {nurse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assign Room</label>
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  disabled={!formData.doctor}
                  className="form-select"
                >
                  <option value="">-- Select Room --</option>
                  {availableRooms.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
                {!formData.doctor && (
                  <small className="help-text">
                    Please select a doctor first
                  </small>
                )}
              </div>

              <button
                className="generate-button"
                onClick={generateQR}
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate Registration QR"}
              </button>
              {error && <p className="error-message">{error}</p>}
            </div>
          ) : (
            <>
              <p className="qr-instructions">
                Share this QR code with the new patient to complete their
                registration
              </p>

              <div className="qr-code-display">
                <img
                  src={qrData.qrCodeDataUrl}
                  alt="Patient registration QR code"
                  className="qr-code-image"
                />
              </div>

              <div className="expiry-note">
                This code will expire in {qrData.expiresIn}
              </div>

              <div className="access-link-container">
                <input
                  type="text"
                  value={qrData.registrationUrl}
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
                  The patient will complete their registration through this
                  link.
                </p>
                {formData.doctor && formData.nurse && formData.room && (
                  <div className="registration-summary">
                    <p>
                      <strong>Pre-assigned:</strong>
                    </p>
                    <p>Doctor: {formData.doctor}</p>
                    <p>Nurse: {formData.nurse}</p>
                    <p>Room: {formData.room}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegistrationQRGenerator;
