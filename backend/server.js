// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Patient = require('./models/Patient');
require('dotenv').config();
const qrcode = require('qrcode');
const crypto = require('crypto');
const app = express();
const registrationTokens = new Map();
// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',  // Your frontend URL
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
app.post('/api/patients/:patientId/feedback', async (req, res) => {
  try {
    console.log("Received feedback submission for patient:", req.params.patientId);
    console.log("Feedback data:", req.body);
    
    // Ensure numeric ratings
    if (req.body.rating !== undefined) {
      req.body.rating = Number(req.body.rating);
    }
    
    if (req.body.ratings) {
      Object.keys(req.body.ratings).forEach(key => {
        if (req.body.ratings[key] !== undefined) {
          req.body.ratings[key] = Number(req.body.ratings[key]);
        }
      });
    }
    
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Initialize feedback array if it doesn't exist
    if (!patient.feedback) {
      patient.feedback = [];
    }
    
    // Add the new feedback
    patient.feedback.push(req.body);
    patient.lastUpdated = Date.now();
    
    // Save and return the updated patient
    const updatedPatient = await patient.save();
    
    // Verify feedback was saved correctly
    if (updatedPatient.feedback && updatedPatient.feedback.length > 0) {
      const lastFeedback = updatedPatient.feedback[updatedPatient.feedback.length - 1];
      console.log("Saved feedback:", lastFeedback);
      console.log("Saved rating type:", typeof lastFeedback.rating, "value:", lastFeedback.rating);
      
      if (lastFeedback.ratings) {
        console.log("Saved ratings overall type:", typeof lastFeedback.ratings.overall, "value:", lastFeedback.ratings.overall);
      }
    }
    
    res.status(201).json(updatedPatient);
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(400).json({ message: error.message });
  }
});

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


  // Add this endpoint to your server.js file
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

// Also add this validation endpoint
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
