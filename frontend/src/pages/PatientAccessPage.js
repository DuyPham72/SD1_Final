import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../shared/hooks/AuthContext";
import "../styles/PatientAccessPage.css";

function PatientAccessPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login, setMode } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Validate the token on component mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError("No access token provided");
        setLoading(false);
        return;
      }

      try {
        const API_BASE_URL =
          process.env.REACT_APP_API_URL || "http://localhost:5001";
        const response = await fetch(
          `${API_BASE_URL}/api/validate-access/${token}`
        );

        const data = await response.json();

        if (!response.ok || !data.valid) {
          throw new Error(data.message || "Invalid or expired access token");
        }

        setPatientData(data);
      } catch (err) {
        console.error("Token validation error:", err);
        setError(err.message || "Failed to validate access token");
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  // Handle patient login
  const handlePatientLogin = async () => {
    if (!patientData || !patientData.patientId) return;

    try {
      setLoggingIn(true);

      // Set patient mode
      setMode("patient");

      // Login the patient
      await login("patient", patientData.patientId);

      // Navigate to main dashboard
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to log in. Please try again.");
      setLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="patient-access-page">
        <div className="access-container loading">
          <div className="spinner"></div>
          <h2>Validating your access link...</h2>
          <p>Please wait while we verify your access credentials</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patient-access-page">
        <div className="access-container error">
          <div className="error-icon">⚠️</div>
          <h2>Access Error</h2>
          <p>{error}</p>
          <div className="access-actions">
            <button
              className="back-to-login-button"
              onClick={() => navigate("/login")}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-access-page">
      <div className="access-container success">
        <div className="success-icon">✓</div>
        <h2>Welcome, {patientData.name}</h2>
        <p>Your access link has been validated successfully.</p>

        <div className="access-actions">
          <button
            className="login-button"
            onClick={handlePatientLogin}
            disabled={loggingIn}
          >
            {loggingIn ? "Logging in..." : "Access Your Dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PatientAccessPage;
