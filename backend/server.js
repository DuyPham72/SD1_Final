// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Patient = require('./models/Patient');
const FeedbackToken = require('./models/FeedbackToken');
require('dotenv').config();
const qrcode = require('qrcode');
const crypto = require('crypto');
const app = express();
const registrationTokens = new Map();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',  // Your frontend URL
  credentials: true
}));

app.use(express.json());

app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/favicon.png', (req, res) => res.status(204).end());

// Test route
app.get('/test', async (req, res) => {
  res.json({ message: 'Server is running' });
});

// Get patients route
app.get('/api/patients', async (req, res) => {
  try {
    console.log('Fetching patients from database...');
    const patients = await Patient.find();
    console.log(`Found ${patients.length} patients`);
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific patient by ID
app.get('/api/patients/:patientId', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Debug feedback if it exists
    if (patient.feedback && patient.feedback.length > 0) {
      console.log(`Patient ${patient.patientId} has ${patient.feedback.length} feedback entries`);
      patient.feedback.forEach((feedback, index) => {
        console.log(`Feedback #${index+1} - Rating: ${feedback.rating}, Comment: ${feedback.comment?.substring(0, 30)}`);
        if (feedback.ratings) {
          console.log(`  Overall rating: ${feedback.ratings.overall}`);
        }
      });
    }
    
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ message: error.message });
  }
});

//Notifications stuff

//Patient creates a notification on feedback submission
let notifications = []; // to store the notification stuff

app.post('/api/notifications', (req, res) => {
  const { message } = req.body;
  const newNotification = {
    id: Date.now(),
    message,
    time: new Date().toLocaleTimeString(),
    read: false
  };
  notifications.push(newNotification);
  res.status(201).json({ success: true });
});

// Staff fetches all notifications
app.get('/api/notifications', (req, res) => {
  res.json(notifications.filter(n => !n.read));
});

// Mark notifications as read
app.post('/api/notifications/read', (req, res) => {
  notifications.forEach(n => n.read = true);
  res.json({ success: true });
});

// Update a patient
app.put('/api/patients/:patientId', async (req, res) => {
  try {
    console.log("Received update request for patient:", req.params.patientId);
    
    // Debug incoming data for feedback
    if (req.body.feedback && req.body.feedback.length > 0) {
      console.log("Request contains feedback entries:", req.body.feedback.length);
      
      // Check the last feedback entry (most likely the new one)
      const lastFeedback = req.body.feedback[req.body.feedback.length - 1];
      console.log("Last feedback entry:", lastFeedback);
      console.log("Rating type:", typeof lastFeedback.rating, "value:", lastFeedback.rating);
      
      if (lastFeedback.ratings) {
        console.log("Ratings object overall type:", typeof lastFeedback.ratings.overall, "value:", lastFeedback.ratings.overall);
      }
      
      // Ensure ratings are numbers before saving
      req.body.feedback.forEach(feedback => {
        if (feedback.rating !== undefined) {
          feedback.rating = Number(feedback.rating);
        }
        
        if (feedback.ratings) {
          Object.keys(feedback.ratings).forEach(key => {
            if (feedback.ratings[key] !== undefined) {
              feedback.ratings[key] = Number(feedback.ratings[key]);
            }
          });
        }
      });
    }
    
    // Make sure all fields including feedback are included
    const updatedPatient = await Patient.findOneAndUpdate(
      { patientId: req.params.patientId },
      req.body,
      { new: true }
    );
    
    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    console.log("Patient updated successfully");
    
    // Check if feedback was updated correctly
    if (updatedPatient.feedback && updatedPatient.feedback.length > 0) {
      const lastFeedback = updatedPatient.feedback[updatedPatient.feedback.length - 1];
      console.log("Last feedback in updated patient:", lastFeedback);
      console.log("Saved rating type:", typeof lastFeedback.rating, "value:", lastFeedback.rating);
      
      if (lastFeedback.ratings) {
        console.log("Saved ratings overall type:", typeof lastFeedback.ratings.overall, "value:", lastFeedback.ratings.overall);
      }
    }
    
    res.json(updatedPatient);
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add an item to patient's schedule
app.post('/api/patients/:patientId/schedule', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    patient.schedule.push(req.body);
    patient.lastUpdated = Date.now();
    
    const updatedPatient = await patient.save();
    res.status(201).json(updatedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a schedule item
app.put('/api/patients/:patientId/schedule/:itemId', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    const scheduleItem = patient.schedule.id(req.params.itemId);
    if (!scheduleItem) {
      return res.status(404).json({ message: 'Schedule item not found' });
    }
    
    // Update schedule item fields
    Object.keys(req.body).forEach(key => {
      scheduleItem[key] = req.body[key];
    });
    
    patient.lastUpdated = Date.now();
    const updatedPatient = await patient.save();
    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a schedule item
app.delete('/api/patients/:patientId/schedule/:itemId', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    patient.schedule.id(req.params.itemId).remove();
    patient.lastUpdated = Date.now();
    
    const updatedPatient = await patient.save();
    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add a dedicated endpoint for patient feedback
// ... existing code ...
// Delete a schedule item
app.delete('/api/patients/:patientId/schedule/:itemId', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    patient.schedule.id(req.params.itemId).remove();
    patient.lastUpdated = Date.now();
    
    const updatedPatient = await patient.save();
    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Submit patient feedback
app.post('/api/patients/:patientId/feedback', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    const { ratings, comment, timestamp } = req.body;
    
    if (!ratings || !ratings.overall) {
      return res.status(400).json({ message: 'Overall rating is required' });
    }
    
    if (ratings.overall < 1 || ratings.overall > 5) {
      return res.status(400).json({ message: 'Overall rating must be between 1 and 5' });
    }
    
    // Create new feedback object with detailed ratings
    const newFeedback = {
      id: req.body.id || Date.now().toString(),
      patientIdentifier: req.params.patientId,
      patientId: req.params.patientId,
      patientName: req.body.patientName || patient.name,
      room: req.body.room || patient.room,
      rating: ratings.overall,
      ratings: ratings,
      comment: comment || '',
      timestamp: timestamp || new Date().toISOString()
    };
    
    // Initialize feedback array if it doesn't exist
    if (!patient.feedback) {
      patient.feedback = [];
    }
    
    patient.feedback.push(newFeedback);
    patient.lastUpdated = Date.now();
    
    const updatedPatient = await patient.save();
    res.status(201).json(updatedPatient);
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(400).json({ message: error.message });
  }
});
// ... existing code ...

const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Registration QR code generation endpoint
app.post('/api/registration/create-qr', async (req, res) => {
  try {
    console.log("Registration QR request received with data:", req.body);
    
    // Generate a unique registration token
    const registrationToken = crypto.randomBytes(16).toString('hex');
    
    // Store any pre-filled information (optional)
    const prefilledData = req.body || {};
    
    // Save token with any pre-filled data (expires in 24 hours)
    registrationTokens.set(registrationToken, {
      data: prefilledData,
      expiry: Date.now() + (24 * 60 * 60 * 1000)
    });
    
    // Generate the registration URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const registrationUrl = `${baseUrl}/register/${registrationToken}`;
    
    console.log("Generated registration URL:", registrationUrl);
    
    // Generate QR code
    const qrCodeDataUrl = await qrcode.toDataURL(registrationUrl);
    
    // Return registration link and QR code
    res.json({
      registrationUrl,
      qrCodeDataUrl,
      expiresIn: '24 hours'
    });
  } catch (error) {
    console.error('Error generating registration QR:', error);
    res.status(500).json({ message: error.message });
  }
});

// Registration token validation endpoint
app.get('/api/registration/validate/:token', (req, res) => {
  try {
    const token = req.params.token;
    const registrationData = registrationTokens.get(token);
    
    if (!registrationData || registrationData.expiry < Date.now()) {
      registrationTokens.delete(token); // Clean up expired tokens
      return res.status(404).json({
        valid: false,
        message: 'Invalid or expired registration link'
      });
    }
    
    // Return pre-filled data if any
    res.json({
      valid: true,
      prefilledData: registrationData.data
    });
  } catch (error) {
    console.error('Error validating registration token:', error);
    res.status(500).json({ 
      valid: false, 
      message: error.message 
    });
  }
});

// Patient access QR functionality endpoint
app.get('/api/patients/:patientId/access-qr', async (req, res) => {
  try {
    // Check if patient exists
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Generate a unique access token
    const accessToken = crypto.randomBytes(16).toString('hex');
    
    // Store the token with expiration (24 hours)
    if (!global.patientAccessTokens) {
      global.patientAccessTokens = new Map();
    }
    
    global.patientAccessTokens.set(accessToken, {
      patientId: req.params.patientId,
      expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });
    
    // Generate the access URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const accessUrl = `${baseUrl}/patient-access/${accessToken}`;
    
    // Generate QR code
    const qrCodeDataUrl = await qrcode.toDataURL(accessUrl);
    
    // Return the data
    res.json({
      accessUrl,
      qrCodeDataUrl,
      expiresIn: '24 hours'
    });
  } catch (error) {
    console.error('Error generating patient access QR:', error);
    res.status(500).json({ message: error.message });
  }
});

// Patient access token validation endpoint
app.get('/api/patient-access/validate/:token', async (req, res) => {
  try {
    const token = req.params.token;
    
    if (!global.patientAccessTokens) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid or expired access token'
      });
    }
    
    const accessData = global.patientAccessTokens.get(token);
    
    if (!accessData || accessData.expiry < Date.now()) {
      global.patientAccessTokens.delete(token); // Clean up expired tokens
      return res.status(404).json({
        valid: false,
        message: 'Invalid or expired access token'
      });
    }
    
    // Find the patient data
    const patient = await Patient.findOne({ patientId: accessData.patientId });
    if (!patient) {
      return res.status(404).json({
        valid: false,
        message: 'Patient not found'
      });
    }
    
    // Return the patient data
    res.json({
      valid: true,
      patient: patient
    });
  } catch (error) {
    console.error('Error validating access token:', error);
    res.status(500).json({ 
      valid: false, 
      message: error.message 
    });
  }
});

// Registration submission endpoint
app.post('/api/registration/submit/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const registrationData = registrationTokens.get(token);
    
    if (!registrationData || registrationData.expiry < Date.now()) {
      registrationTokens.delete(token); // Clean up expired tokens
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired registration link'
      });
    }
    
    // Get form data from request body
    const formData = req.body;
    
    // Validate required fields
    if (!formData.name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }
    
    // Generate initials from the name using the function
    const initialsName = getInitialsFromName(formData.name);
    console.log(`Converting name "${formData.name}" to initials: "${initialsName}"`);
    
    // Generate a unique patient ID
    const patientId = crypto.randomBytes(8).toString('hex');
    
    // Create new patient object
    const newPatient = new Patient({
      patientId,
      name: initialsName, // Use initials instead of full name
      careTeam: {
        primaryDoctor: formData.doctor || "",
        primaryNurse: formData.nurse || ""
      },
      room: formData.room || "Unassigned", // Default value to satisfy required field
      preferences: {
        language: formData.language || "English",
        dietary: formData.dietary ? formData.dietary.split(',').map(item => item.trim()) : [],
        religious: formData.religious || ""
      },
      // Initialize empty schedule, feedback, etc.
      schedule: [],
      feedback: [],
      lastUpdated: Date.now()
    });
    
    // Log the patient object before saving
    console.log("Attempting to save new patient with data:", {
      patientId: newPatient.patientId,
      name: newPatient.name,
      room: newPatient.room,
      preferences: newPatient.preferences
    });
    
    // Save the new patient to the database
    const savedPatient = await newPatient.save();
    console.log("Patient saved successfully with ID:", savedPatient.patientId);
    
    // Remove the used token
    registrationTokens.delete(token);
    
    // Return success with the new patient data
    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient: savedPatient
    });
    
  } catch (error) {
    console.error('Error processing registration:', error);
    console.error('Full error details:', error);
    
    // Check for MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => ({
        field,
        message: error.errors[field].message
      }));
      console.error('Validation errors:', validationErrors);
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete registration'
    });
  }
});

// Utility function to get initials from name
function getInitialsFromName(fullName) {
  if (!fullName) return '';
  
  // Split the name by spaces
  const nameParts = fullName.split(' ').filter(part => part.length > 0);
  
  // Get the first letter of each part and join with periods
  const initials = nameParts.map(part => part[0].toUpperCase()).join('.');
  
  // Add periods after each letter
  return initials.length > 0 ? initials + '.' : '';
}

// Feedback QR code generation endpoint
app.post('/api/feedback/create-qr', async (req, res) => {
  try {
    console.log("Feedback QR request received with data:", req.body);
    
    // Generate a unique feedback token
    const feedbackToken = crypto.randomBytes(16).toString('hex');
    
    // Store the associated patient info if provided
    const patientInfo = req.body.patientId ? { 
      patientId: req.body.patientId,
      name: req.body.patientName,
      room: req.body.room
    } : null;
    
    // Create a new token in MongoDB with 24-hour expiration
    await FeedbackToken.create({
      token: feedbackToken,
      patientInfo: patientInfo,
      expiry: new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hours
    });
    
    // Generate the feedback URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const feedbackUrl = `${baseUrl}/feedback/${feedbackToken}`;
    
    console.log("Generated feedback URL:", feedbackUrl);
    console.log("For patient (if applicable):", patientInfo);
    
    // Generate QR code
    const qrCodeDataUrl = await qrcode.toDataURL(feedbackUrl);
    
    // Return feedback link and QR code
    res.json({
      feedbackUrl,
      qrCodeDataUrl,
      expiresIn: '24 hours'
    });
  } catch (error) {
    console.error('Error generating feedback QR:', error);
    res.status(500).json({ message: error.message });
  }
});

// Feedback token validation endpoint
app.get('/api/feedback/validate/:token', async (req, res) => {
  try {
    const token = req.params.token;
    console.log("Validating feedback token:", token);
    
    // Find token in MongoDB
    const feedbackData = await FeedbackToken.findOne({ token });
    
    if (!feedbackData || feedbackData.expiry < new Date()) {
      // Clean up expired token if it exists
      if (feedbackData) {
        await FeedbackToken.deleteOne({ token });
        console.log("Removed expired token:", token);
      }
      
      console.log("Token not found or expired:", token);
      return res.status(404).json({
        valid: false,
        message: 'Invalid or expired feedback token'
      });
    }
    
    console.log("Token is valid:", token);
    
    // If there's associated patient info, fetch the patient data
    let patientData = null;
    if (feedbackData.patientInfo && feedbackData.patientInfo.patientId) {
      const patient = await Patient.findOne({ 
        patientId: feedbackData.patientInfo.patientId 
      });
      
      if (patient) {
        patientData = {
          patientId: patient.patientId,
          name: patient.name,
          room: patient.room
        };
        console.log("Found patient data for token:", patientData);
      } else {
        console.log("Patient not found for token:", feedbackData.patientInfo.patientId);
      }
    }
    
    // Return validation result with optional patient data
    res.json({
      valid: true,
      patientData
    });
  } catch (error) {
    console.error('Error validating feedback token:', error);
    res.status(500).json({ 
      valid: false, 
      message: error.message 
    });
  }
});

// Anonymous feedback submission endpoint
app.post('/api/feedback/submit', async (req, res) => {
  try {
    console.log("Received anonymous feedback submission");
    console.log("Feedback data:", req.body);
    
    // Add notification for the submission
    if (!global.notifications) {
      global.notifications = [];
    }
    
    global.notifications.push({
      id: Date.now(),
      message: "New anonymous feedback received",
      time: new Date().toLocaleTimeString(),
      read: false
    });
    
    // For now, we'll just return success
    res.status(201).json({
      success: true,
      message: 'Anonymous feedback submitted successfully'
    });
  } catch (error) {
    console.error("Error saving anonymous feedback:", error);
    res.status(400).json({ message: error.message });
  }
});