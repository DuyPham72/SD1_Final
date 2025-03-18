// src/shared/components/PatientFeedbackTab.js - Fixed with enhanced debugging
import React, { useEffect } from 'react';
import '../../styles/PatientFeedbackTab.css';

const PatientFeedbackTab = ({ patient }) => {
  // Check if patient has feedback
  const hasFeedback = patient && patient.feedback && patient.feedback.length > 0;
  
  // Debug patient feedback on mount
  useEffect(() => {
    if (hasFeedback) {
      console.log("Patient feedback data:", patient.feedback);
      patient.feedback.forEach((feedback, index) => {
        console.log(`Feedback #${index+1}:`, feedback);
        console.log(`Rating type: ${typeof feedback.rating}, value:`, feedback.rating);
        if (feedback.ratings) {
          console.log(`Overall rating type: ${typeof feedback.ratings.overall}, value:`, feedback.ratings.overall);
        }
      });
    } else {
      console.log("No feedback found for patient");
    }
  }, [patient, hasFeedback]);
  
  // Format date from ISO string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get star rating display
  const getStarRating = (rating) => {
    // Convert to number and ensure it's valid
    const numRating = Number(rating);
    console.log(`Converting rating ${rating} to number:`, numRating);
    
    const validRating = isNaN(numRating) ? 0 : Math.round(numRating);
    console.log(`Rounded valid rating:`, validRating);
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= validRating ? 'star filled' : 'star'}>
          {i <= validRating ? '★' : '☆'}
        </span>
      );
    }
    return stars;
  };
  
  // Calculate average overall rating if there's feedback
  const getAverageRating = () => {
    if (!hasFeedback) return 0;
    
    let totalRating = 0;
    let count = 0;
    
    // Debug log for average calculation
    console.log("Calculating average from feedback items:", patient.feedback.length);
    
    // Loop through all feedback entries
    patient.feedback.forEach((feedback, index) => {
      // Check if it's new format with ratings object
      if (feedback.ratings && typeof feedback.ratings.overall === 'number') {
        console.log(`Feedback #${index+1}: Using ratings.overall: ${feedback.ratings.overall}`);
        totalRating += feedback.ratings.overall;
        count++;
      } 
      // Check if it's old format with single rating
      else if (typeof feedback.rating === 'number') {
        console.log(`Feedback #${index+1}: Using rating: ${feedback.rating}`);
        totalRating += feedback.rating;
        count++;
      } else {
        console.log(`Feedback #${index+1}: No valid rating found`);
        if (feedback.rating !== undefined) {
          console.log(`  Invalid rating:`, feedback.rating, `type:`, typeof feedback.rating);
        }
        if (feedback.ratings) {
          console.log(`  Invalid ratings.overall:`, feedback.ratings.overall, `type:`, typeof feedback.ratings.overall);
        }
      }
    });
    
    console.log(`Total rating sum: ${totalRating}, count: ${count}`);
    
    // Avoid division by zero
    if (count === 0) {
      console.log("No valid ratings found, returning 0");
      return "0.0";
    }
    
    const average = totalRating / count;
    console.log(`Calculated average: ${average} (${average.toFixed(1)})`);
    return average.toFixed(1);
  };

  // Get category-specific average ratings
  const getCategoryRatings = () => {
    if (!hasFeedback) return null;
    
    // Initialize counters for each category
    const totals = {
      careQuality: 0,
      staffResponsiveness: 0,
      communication: 0,
      cleanliness: 0,
      mealQuality: 0,
      count: 0
    };
    
    // Check if we have any feedback with the new structure
    let hasNewFormat = false;
    
    // Sum up ratings for each category
    patient.feedback.forEach(item => {
      if (item.ratings) {
        hasNewFormat = true;
        if (typeof item.ratings.careQuality === 'number') totals.careQuality += item.ratings.careQuality;
        if (typeof item.ratings.staffResponsiveness === 'number') totals.staffResponsiveness += item.ratings.staffResponsiveness;
        if (typeof item.ratings.communication === 'number') totals.communication += item.ratings.communication;
        if (typeof item.ratings.cleanliness === 'number') totals.cleanliness += item.ratings.cleanliness;
        if (typeof item.ratings.mealQuality === 'number') totals.mealQuality += item.ratings.mealQuality;
        totals.count++;
      }
    });
    
    console.log("Category totals:", totals);
    
    // Only return category ratings if we have new format feedback
    if (!hasNewFormat || totals.count === 0) {
      console.log("No category ratings available");
      return null;
    }
    
    const categoryAverages = {
      careQuality: (totals.careQuality / totals.count).toFixed(1),
      staffResponsiveness: (totals.staffResponsiveness / totals.count).toFixed(1),
      communication: (totals.communication / totals.count).toFixed(1),
      cleanliness: (totals.cleanliness / totals.count).toFixed(1),
      mealQuality: (totals.mealQuality / totals.count).toFixed(1)
    };
    
    console.log("Category averages:", categoryAverages);
    return categoryAverages;
  };
  
  // Get rating value for display (supporting both new and old feedback structures)
  const getRatingValue = (feedback) => {
    console.log('Getting rating value for feedback:', feedback);
    
    // First check if it has the ratings object with overall property
    if (feedback.ratings && typeof feedback.ratings.overall === 'number') {
      console.log('Using new format rating (overall):', feedback.ratings.overall);
      return feedback.ratings.overall;
    }
    
    // Fall back to the old format or default to 0
    if (typeof feedback.rating === 'number') {
      console.log('Using old format rating:', feedback.rating);
      return feedback.rating;
    }
    
    // If neither format has a valid rating, provide debug info
    if (feedback.rating !== undefined) {
      console.log('Invalid rating format:', feedback.rating, typeof feedback.rating);
    } else if (feedback.ratings && feedback.ratings.overall !== undefined) {
      console.log('Invalid overall rating format:', feedback.ratings.overall, typeof feedback.ratings.overall);
    } else {
      console.log('No rating found in feedback');
    }
    
    return 0;
  };
  
  // Get detailed ratings if available
  const getDetailedRatings = (feedback) => {
    if (!feedback.ratings) return null;
    
    return (
      <div className="detailed-ratings">
        <div className="rating-detail">
          <span className="rating-label">Care Quality:</span>
          <span className="rating-value">{feedback.ratings.careQuality}</span>
        </div>
        <div className="rating-detail">
          <span className="rating-label">Staff Responsiveness:</span>
          <span className="rating-value">{feedback.ratings.staffResponsiveness}</span>
        </div>
        <div className="rating-detail">
          <span className="rating-label">Communication:</span>
          <span className="rating-value">{feedback.ratings.communication}</span>
        </div>
        <div className="rating-detail">
          <span className="rating-label">Cleanliness:</span>
          <span className="rating-value">{feedback.ratings.cleanliness}</span>
        </div>
        <div className="rating-detail">
          <span className="rating-label">Meal Quality:</span>
          <span className="rating-value">{feedback.ratings.mealQuality}</span>
        </div>
      </div>
    );
  };

  const averageRating = getAverageRating();
  const categoryRatings = getCategoryRatings();
  
  // Log the calculated values for debugging
  console.log("Final average rating:", averageRating);
  console.log("Category ratings available:", !!categoryRatings);
  
  return (
    <div className="patient-feedback-tab">
      <h3>Patient Feedback</h3>
      
      {hasFeedback ? (
        <>
          <div className="feedback-summary">
            <div className="average-rating">
              <p>Average Overall Rating</p>
              <div className="big-rating">{averageRating}</div>
              <div className="stars">{getStarRating(averageRating)}</div>
              <p className="feedback-count">{patient.feedback.length} feedback submission{patient.feedback.length !== 1 ? 's' : ''}</p>
            </div>
            
            {categoryRatings && (
              <div className="category-ratings">
                <h4>Category Ratings</h4>
                <div className="rating-categories-grid">
                  <div className="category-rating-item">
                    <div className="category-name">Care Quality</div>
                    <div className="category-stars">{getStarRating(categoryRatings.careQuality)}</div>
                    <div className="category-score">{categoryRatings.careQuality}</div>
                  </div>
                  <div className="category-rating-item">
                    <div className="category-name">Staff Responsiveness</div>
                    <div className="category-stars">{getStarRating(categoryRatings.staffResponsiveness)}</div>
                    <div className="category-score">{categoryRatings.staffResponsiveness}</div>
                  </div>
                  <div className="category-rating-item">
                    <div className="category-name">Communication</div>
                    <div className="category-stars">{getStarRating(categoryRatings.communication)}</div>
                    <div className="category-score">{categoryRatings.communication}</div>
                  </div>
                  <div className="category-rating-item">
                    <div className="category-name">Cleanliness</div>
                    <div className="category-stars">{getStarRating(categoryRatings.cleanliness)}</div>
                    <div className="category-score">{categoryRatings.cleanliness}</div>
                  </div>
                  <div className="category-rating-item">
                    <div className="category-name">Meal Quality</div>
                    <div className="category-stars">{getStarRating(categoryRatings.mealQuality)}</div>
                    <div className="category-score">{categoryRatings.mealQuality}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="feedback-list">
            <h4>Individual Feedback Submissions</h4>
            {patient.feedback.map((feedback) => (
              <div key={feedback.id} className="feedback-item">
                <div className="feedback-header">
                  <div className="rating-stars">
                    {getStarRating(getRatingValue(feedback))}
                  </div>
                  <div className="feedback-time">
                    {formatDate(feedback.timestamp)}
                  </div>
                </div>
                
                {getDetailedRatings(feedback)}
                
                {feedback.comment && (
                  <div className="feedback-comment">
                    "{feedback.comment}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="no-feedback">
          <p>No feedback has been submitted by this patient yet.</p>
        </div>
      )}
    </div>
  );
};

export default PatientFeedbackTab;