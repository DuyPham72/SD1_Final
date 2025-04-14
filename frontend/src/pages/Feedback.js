// src/pages/Feedback.js
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Feedback.css";
import {
  usePatientData,
  useTimeUpdate,
  useNavigationState,
  Layout,
  Header,
} from "../shared";
import axios from 'axios';

// Rating category component
const RatingCategory = ({ label, description, rating, onChange }) => {
  return (
    <div className="rating-category">
      <div className="rating-category-header">
        <label>{label}</label>
        {description && <p className="rating-description">{description}</p>}
      </div>
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`rating-button ${rating === value ? "selected" : ""}`}
            onClick={() => onChange(value)}
          >
            {value <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
    </div>
  );
};

function Feedback() {
  const navigate = useNavigate();
  const { token } = useParams(); // Get token from URL if present
  
  // Determine if this is QR code access or normal in-app access
  const isQRCodeAccess = !!token;
  
  // State for QR code specific functionality
  const [qrLoading, setQRLoading] = useState(isQRCodeAccess);
  const [qrError, setQRError] = useState(null);
  const [qrPatientData, setQRPatientData] = useState(null);
  
  const {
    patient,
    allPatients,
    selectedPatientId,
    loading: patientLoading,
    handlePatientChange,
    updatePatientData,
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

  const mainNavElementsRef = useRef({
    menuButton: null,
    patientSelector: null,
  });
  const sidebarButtonsRef = useRef([]);

  // Enhanced feedback form state with individual categories only
  const [categoryRatings, setCategoryRatings] = useState({
    careQuality: 3,
    staffResponsiveness: 3,
    communication: 3,
    cleanliness: 3,
    mealQuality: 3,
  });
  // Overall rating is calculated automatically
  const [overallRating, setOverallRating] = useState(3);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If accessed via QR code, validate the token and get patient data
  useEffect(() => {
    if (!isQRCodeAccess) return;
    
    async function validateToken() {
      try {
        setQRLoading(true);
        const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
        
        console.log("Validating feedback token in Feedback component:", token);
        console.log("Dual screen mode:", window.isDualScreen ? "Yes" : "No");
        console.log("Current window mode:", localStorage.getItem('mode'));
        
        const response = await fetch(`${API_BASE_URL}/api/feedback/validate/${token}`);
        const data = await response.json();
        
        console.log("Token validation response:", data);
        
        if (data.valid) {
          console.log("Setting patient data from token:", data.patientData);
          setQRPatientData(data.patientData);
        } else {
          console.error("Token validation failed:", data.message);
          setQRError("This feedback link is invalid or has expired.");
        }
      } catch (err) {
        console.error("Error validating feedback token:", err);
        setQRError("Failed to validate feedback link. Please try again.");
      } finally {
        setQRLoading(false);
      }
    }
    
    validateToken();
  }, [token, isQRCodeAccess]);

  // Update individual rating and recalculate overall
  const updateRating = (category, value) => {
    // Convert value to number explicitly
    const numValue = Number(value);
    console.log(`Updating ${category} rating to:`, numValue);

    setCategoryRatings((prev) => {
      const updatedRatings = {
        ...prev,
        [category]: numValue,
      };

      // Recalculate overall rating
      calculateOverallRating(updatedRatings);

      return updatedRatings;
    });
  };

  // Calculate overall rating from category ratings
  const calculateOverallRating = (ratings = categoryRatings) => {
    const sum = Object.values(ratings).reduce(
      (total, rating) => total + rating,
      0
    );
    const average = sum / Object.values(ratings).length;
    const roundedAverage = Math.round(average * 10) / 10; // Round to 1 decimal place
    console.log(`Calculated overall rating: ${roundedAverage} from:`, ratings);
    setOverallRating(roundedAverage);
  };

  // Calculate initial overall rating on component mount
  useEffect(() => {
    calculateOverallRating();
  }, []);

  // Handle feedback submission - supports both normal and QR code flows
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
      
      // Create feedback object with timestamp and patient info
      const newFeedback = {
        id: Date.now().toString(),
        // Set old-style single rating for compatibility
        rating: Number(overallRating),
        // Detailed ratings with calculated overall
        ratings: {
          overall: Number(overallRating),
          careQuality: Number(categoryRatings.careQuality),
          staffResponsiveness: Number(categoryRatings.staffResponsiveness),
          communication: Number(categoryRatings.communication),
          cleanliness: Number(categoryRatings.cleanliness),
          mealQuality: Number(categoryRatings.mealQuality),
        },
        comment: feedbackText,
        timestamp: new Date().toISOString(),
      };

      // Different flow for QR code access vs. in-app
      if (isQRCodeAccess) {
        // QR code flow - If patient data is available from token
        if (qrPatientData) {
          newFeedback.patientId = qrPatientData.patientId;
          newFeedback.patientName = qrPatientData.name;
          newFeedback.room = qrPatientData.room;
          
          // Submit to patient-specific endpoint
          await fetch(`${API_BASE_URL}/api/patients/${qrPatientData.patientId}/feedback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newFeedback),
          });
        } else {
          // Anonymous feedback
          await fetch(`${API_BASE_URL}/api/feedback/submit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newFeedback),
          });
        }
      } else {
        // Regular in-app flow - use patient from context
        newFeedback.patientId = patient.patientId;
        newFeedback.patientName = patient.name;
        newFeedback.room = patient.room;

        // Update patient data with new feedback
        const updatedPatient = {
          ...patient,
          feedback: [...(patient.feedback || []), newFeedback],
        };

        // Save to backend
        await updatePatientData(updatedPatient);
      }
      
      setSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (submitted) {
      // Request permission if not already granted
      if (Notification.permission === "granted") {
        new Notification("Feedback received", {
          body: "A new feedback has been submitted.",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Feedback received", {
              body: "A new feedback has been submitted.",
            });
          }
        });
      }
    }
  }, [submitted]);

  // Reset form to submit another feedback
  const handleReset = () => {
    setCategoryRatings({
      careQuality: 3,
      staffResponsiveness: 3,
      communication: 3,
      cleanliness: 3,
      mealQuality: 3,
    });
    calculateOverallRating({
      careQuality: 3,
      staffResponsiveness: 3,
      communication: 3,
      cleanliness: 3,
      mealQuality: 3,
    });
    setFeedbackText("");
    setSubmitted(false);
  };

  // Loading states
  if (isQRCodeAccess && qrLoading) {
    return (
      <div className="loading-container">
        <div className="loading">Validating feedback link...</div>
      </div>
    );
  }
  
  // Error states
  if (isQRCodeAccess && qrError) {
    return (
      <div className="error-container">
        <div className="error">{qrError}</div>
      </div>
    );
  }
  
  if (!isQRCodeAccess && patientLoading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isQRCodeAccess && !patient) {
    return <div className="error">No patient data available</div>;
  }

  // Get current patient data (either from QR code or context)
  const currentPatient = isQRCodeAccess ? qrPatientData : patient;

  // For QR code access, render a simplified version without the Layout and Header
  if (isQRCodeAccess) {
    return (
      <div className="standalone-feedback-page">
        <div className="simple-header">
          <h1>Hospital Patient Feedback</h1>
          <div className="current-time">
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </div>
        </div>

        <div className="content-container">
          <div className="feedback-container">
            <h2>Your Feedback Matters</h2>
            
            {currentPatient && (
              <div className="patient-info-box">
                <p><strong>Patient:</strong> {currentPatient.name}</p>
                <p><strong>Room:</strong> {currentPatient.room}</p>
              </div>
            )}
            
            <p className="feedback-intro">
              Thank you for taking the time to provide feedback about your stay.
              Your input helps us improve our services.
            </p>

            {/* The rest of the form is the same for both modes */}
            {renderFeedbackForm()}
          </div>
        </div>
      </div>
    );
  }

  // For regular in-app access, use the Layout and Header
  const navItems = [
    { icon: "🏠", text: "Home", path: "/" },
    { icon: "🎮", text: "Entertainment", path: "/entertainment" },
    { icon: "📝", text: "Patient Feedback", path: "/feedback" },
  ];

  return (
    <Layout
      patient={patient}
      isNavOpen={isNavOpen}
      onNavToggle={() => setIsNavOpen(!isNavOpen)}
      navItems={navItems}
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
        <div className="feedback-container">
          <h2>Your Feedback Matters</h2>
          <p className="feedback-intro">
            Thank you for taking the time to provide feedback about your stay.
            Your input helps us improve our services.
          </p>

          {/* The rest of the form is the same for both modes */}
          {renderFeedbackForm()}
        </div>
      </div>
    </Layout>
  );

  // Helper function to render the feedback form (used by both modes)
  function renderFeedbackForm() {
    return submitted ? (
      <div className="feedback-success">
        <div className="success-icon">✓</div>
        <h3>Thank You For Your Feedback</h3>
        <p>
          Your feedback has been submitted successfully and will help us
          improve our services.
        </p>
        <button onClick={handleReset} className="reset-button">
          Submit Another Feedback
        </button>
      </div>
    ) : (
      <form onSubmit={handleSubmit} className="feedback-form">
        {/* Show the calculated overall rating */}
        <div className="overall-rating-display">
          <h3>Overall Rating: {overallRating.toFixed(1)}</h3>
          <div className="overall-stars">
            {[1, 2, 3, 4, 5].map((value) => (
              <span
                key={value}
                className={`star ${
                  value <= Math.round(overallRating) ? "filled" : ""
                }`}
              >
                {value <= Math.round(overallRating) ? "★" : "☆"}
              </span>
            ))}
          </div>
          <p className="rating-note">
            (Calculated from your category ratings below)
          </p>
        </div>

        <div className="rating-categories">
          <RatingCategory
            label="Quality of Care"
            description="The medical treatments and care received"
            rating={categoryRatings.careQuality}
            onChange={(value) => updateRating("careQuality", value)}
          />

          <RatingCategory
            label="Staff Responsiveness"
            description="How quickly staff responded to your needs"
            rating={categoryRatings.staffResponsiveness}
            onChange={(value) =>
              updateRating("staffResponsiveness", value)
            }
          />

          <RatingCategory
            label="Communication"
            description="How well staff explained procedures and treatments"
            rating={categoryRatings.communication}
            onChange={(value) => updateRating("communication", value)}
          />

          <RatingCategory
            label="Room Cleanliness"
            description="The cleanliness and maintenance of your room"
            rating={categoryRatings.cleanliness}
            onChange={(value) => updateRating("cleanliness", value)}
          />

          <RatingCategory
            label="Meal Quality"
            description="The quality of meals provided during your stay"
            rating={categoryRatings.mealQuality}
            onChange={(value) => updateRating("mealQuality", value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="feedback-text">Additional Comments:</label>
          <textarea
            id="feedback-text"
            rows="5"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Please share any other thoughts about your hospital experience..."
          ></textarea>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </form>
    );
  }
}

export default Feedback;