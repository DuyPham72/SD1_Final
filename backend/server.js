// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Patient = require('./models/Patient');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',  // Your frontend URL
  credentials: true
}));

app.use(express.json());

// Test route
app.get('/test', async (req, res) => {
  res.json({ message: 'Server is running' });
});

// Get patients route
app.get('/api/patients', async (req, res) => {
  try {
    console.log('Fetching patients from database...');
    const patients = await Patient.find();
    console.log('Found patients:', patients);
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
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a patient
app.put('/api/patients/:patientId', async (req, res) => {
  try {
    const updatedPatient = await Patient.findOneAndUpdate(
      { patientId: req.params.patientId },
      req.body,
      { new: true }
    );
    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(updatedPatient);
  } catch (error) {
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

const PORT = process.env.PORT || 5000;

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