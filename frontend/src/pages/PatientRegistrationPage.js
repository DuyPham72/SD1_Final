// src/pages/PatientRegistrationPage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../shared/hooks/AuthContext";
import "../styles/PatientRegistrationPage.css";

function PatientRegistrationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validToken, setValidToken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    language: "English",
    dietary: "",
    religious: "",
    doctor: "",
    nurse: "",
    room: "",
  });

  // Validate token and get any prefilled data
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError("No registration token provided");
        setLoading(false);
        return;
      }

      try {
        const API_BASE_URL =
          process.env.REACT_APP_API_URL || "http://localhost:5001";
        const response = await fetch(
          `${API_BASE_URL}/api/registration/validate/${token}`
        );

        const data = await response.json();

        if (!response.ok || !data.valid) {
          throw new Error(
            data.message || "Invalid or expired registration link"
          );
        }

        setValidToken(true);

        // Pre-fill form with any provided data
        if (data.prefilledData) {
          setFormData((prev) => ({
            ...prev,
            ...data.prefilledData,
          }));
        }
      } catch (err) {
        console.error("Token validation error:", err);
        setError(err.message || "Failed to validate registration link");
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      setError("Name is required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const API_BASE_URL =
        process.env.REACT_APP_API_URL || "http://localhost:5001";
      const response = await fetch(
        `${API_BASE_URL}/api/registration/submit/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Registration failed");
      }

      setSuccessMessage(
        "Registration successful! Redirecting to your dashboard..."
      );

      // Log in the new patient
      setTimeout(async () => {
        try {
          // Log in the patient with their new ID
          await login("patient", result.patient.patientId);
          
          // Store the patient ID in localStorage to ensure it's available across components
          localStorage.setItem('patientId', result.patient.patientId);
          localStorage.setItem('selectedPatientId', result.patient.patientId);
          localStorage.setItem('nurseSelectedPatientId', result.patient.patientId);
          
          // Add a timestamp for the change to trigger refresh mechanisms
          localStorage.setItem('patientChangeTimestamp', Date.now().toString());
          window.dispatchEvent(new CustomEvent('patientChanged', { 
            detail: { 
              patientId: result.patient.patientId,
              timestamp: Date.now(),
              forceRefresh: true 
            }
          }));
          // Navigate to main dashboard
          navigate("/");
        } catch (error) {
          console.error("Error during login:", error);
          setError("Login failed after registration. Please try logging in manually.");
          setSubmitting(false);
        }
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to complete registration");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="registration-page">
        <div className="registration-container loading">
          <div className="spinner"></div>
          <h2>Validating registration link...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="registration-page">
        <div className="registration-container error">
          <div className="error-icon">⚠️</div>
          <h2>Registration Error</h2>
          <p>{error}</p>
          <button className="back-button" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="registration-page">
        <div className="registration-container success">
          <div className="success-icon">✓</div>
          <h2>Registration Complete</h2>
          <p>{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-container">
        <h2>New Patient Registration</h2>
        <p>Please complete your information below</p>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="name">Full Name*</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="language">Preferred Language</label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="Mandarin">Mandarin</option>
              <option value="Arabic">Arabic</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dietary">Dietary Restrictions</label>
            <input
              type="text"
              id="dietary"
              name="dietary"
              value={formData.dietary}
              onChange={handleInputChange}
              placeholder="e.g., Vegetarian, Gluten-free, No peanuts"
            />
          </div>

          <div className="form-group">
            <label htmlFor="religious">Religious Preferences</label>
            <input
              type="text"
              id="religious"
              name="religious"
              value={formData.religious}
              onChange={handleInputChange}
            />
          </div>

          {/* Read-only fields if pre-filled by staff */}
          {formData.doctor && (
            <div className="form-group">
              <label>Assigned Doctor</label>
              <input
                type="text"
                value={formData.doctor}
                readOnly
                className="readonly-field"
              />
            </div>
          )}

          {formData.nurse && (
            <div className="form-group">
              <label>Assigned Nurse</label>
              <input
                type="text"
                value={formData.nurse}
                readOnly
                className="readonly-field"
              />
            </div>
          )}

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? "Processing..." : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PatientRegistrationPage;
