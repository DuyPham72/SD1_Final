// src/pages/Feedback.js - Modified with automatic overall rating calculation
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Feedback.css';
import {
  usePatientData,
  useTimeUpdate,
  useNavigationState,
  useKeyboardNavigation,
  Layout,
  Header
} from '../shared';

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
            className={`rating-button ${rating === value ? 'selected' : ''}`}
            onClick={() => onChange(value)}
          >
            {value <= rating ? '★' : '☆'}
          </button>
        ))}
      </div>
    </div>
  );
};

function Feedback() {
  const navigate = useNavigate();
  const { 
    patient, 
    allPatients, 
    selectedPatientId, 
    loading, 
    handlePatientChange,
    updatePatientData
  } = usePatientData();
  const currentTime = useTimeUpdate();
  const { 
    isNavOpen, 
    setIsNavOpen, 
    sidebarFocusIndex, 
    setSidebarFocusIndex,
    mainNavFocusIndex, 
    setMainNavFocusIndex 
  } = useNavigationState();

  const mainNavElementsRef = useRef({
    menuButton: null,
    patientSelector: null
  });
  const sidebarButtonsRef = useRef([]);

  // Enhanced feedback form state with individual categories only
  const [categoryRatings, setCategoryRatings] = useState({
    careQuality: 3,
    staffResponsiveness: 3,
    communication: 3,
    cleanliness: 3,
    mealQuality: 3
  });
  // Overall rating is calculated automatically
  const [overallRating, setOverallRating] = useState(3);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Update individual rating and recalculate overall
  const updateRating = (category, value) => {
    // Convert value to number explicitly
    const numValue = Number(value);
    console.log(`Updating ${category} rating to:`, numValue);
    
    setCategoryRatings(prev => {
      const updatedRatings = {
        ...prev,
        [category]: numValue
      };
      
      // Recalculate overall rating
      calculateOverallRating(updatedRatings);
      
      return updatedRatings;
    });
  };
  
  // Calculate overall rating from category ratings
  const calculateOverallRating = (ratings = categoryRatings) => {
    const sum = Object.values(ratings).reduce((total, rating) => total + rating, 0);
    const average = sum / Object.values(ratings).length;
    const roundedAverage = Math.round(average * 10) / 10; // Round to 1 decimal place
    console.log(`Calculated overall rating: ${roundedAverage} from:`, ratings);
    setOverallRating(roundedAverage);
  };
  
  // Calculate initial overall rating on component mount
  useEffect(() => {
    calculateOverallRating();
  }, []);

  // Hook up keyboard navigation
  useKeyboardNavigation({
    isNavOpen,
    setIsNavOpen,
    sidebarFocusIndex,
    setSidebarFocusIndex,
    mainNavFocusIndex,
    setMainNavFocusIndex,
    mainNavElementsRef,
    sidebarButtonsRef,
    navigate
  });

  // Handle feedback submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Create feedback object with timestamp and patient info
    // Use calculated overall rating
    const newFeedback = {
      id: Date.now().toString(),
      patientId: patient.patientId,
      patientName: patient.name,
      // Set old-style single rating for compatibility
      rating: Number(overallRating),
      // Detailed ratings with calculated overall
      ratings: {
        overall: Number(overallRating),
        careQuality: Number(categoryRatings.careQuality),
        staffResponsiveness: Number(categoryRatings.staffResponsiveness),
        communication: Number(categoryRatings.communication),
        cleanliness: Number(categoryRatings.cleanliness),
        mealQuality: Number(categoryRatings.mealQuality)
      },
      comment: feedbackText,
      timestamp: new Date().toISOString(),
      room: patient.room
    };
    
    console.log("New feedback with calculated overall rating:", newFeedback);
    console.log("Rating value type:", typeof newFeedback.rating, "value:", newFeedback.rating);
    console.log("Overall rating value type:", typeof newFeedback.ratings.overall, "value:", newFeedback.ratings.overall);
    
    // Update patient data with new feedback
    // If patient doesn't have a feedback array yet, create one
    const updatedPatient = {
      ...patient,
      feedback: [...(patient.feedback || []), newFeedback]
    };
    
    try {
      // Save to backend
      const result = await updatePatientData(updatedPatient);
      console.log("Response from server after saving feedback:", result);
      setSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitting(false);
    }
  };

  // Reset form to submit another feedback
  const handleReset = () => {
    setCategoryRatings({
      careQuality: 3,
      staffResponsiveness: 3,
      communication: 3,
      cleanliness: 3,
      mealQuality: 3
    });
    calculateOverallRating({
      careQuality: 3,
      staffResponsiveness: 3,
      communication: 3,
      cleanliness: 3,
      mealQuality: 3
    });
    setFeedbackText('');
    setSubmitted(false);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!patient) return <div className="error">No patient data available</div>;

  const navItems = [
    { icon: '🏠', text: 'Home', path: '/' },
    { icon: '🎮', text: 'Entertainment', path: '/entertainment' },
    { icon: '📝', text: 'Patient Feedback', path: '/feedback' }
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
            Thank you for taking the time to provide feedback about your stay. Your input helps us improve our services.
          </p>
          
          {submitted ? (
            <div className="feedback-success">
              <div className="success-icon">✓</div>
              <h3>Thank You For Your Feedback</h3>
              <p>Your feedback has been submitted successfully and will help us improve our services.</p>
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
                    <span key={value} className={`star ${value <= Math.round(overallRating) ? 'filled' : ''}`}>
                      {value <= Math.round(overallRating) ? '★' : '☆'}
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
                  onChange={(value) => updateRating('careQuality', value)}
                />
                
                <RatingCategory 
                  label="Staff Responsiveness"
                  description="How quickly staff responded to your needs"
                  rating={categoryRatings.staffResponsiveness}
                  onChange={(value) => updateRating('staffResponsiveness', value)}
                />
                
                <RatingCategory 
                  label="Communication"
                  description="How well staff explained procedures and treatments"
                  rating={categoryRatings.communication}
                  onChange={(value) => updateRating('communication', value)}
                />
                
                <RatingCategory 
                  label="Room Cleanliness"
                  description="The cleanliness and maintenance of your room"
                  rating={categoryRatings.cleanliness}
                  onChange={(value) => updateRating('cleanliness', value)}
                />
                
                <RatingCategory 
                  label="Meal Quality"
                  description="The quality of meals provided during your stay"
                  rating={categoryRatings.mealQuality}
                  onChange={(value) => updateRating('mealQuality', value)}
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
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Feedback;