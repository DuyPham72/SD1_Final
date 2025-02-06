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

  // In backend/server.js, add this new route
app.put('/api/patients/:patientId', async (req, res) => {
  try {
    const updatedPatient = await Patient.findOneAndUpdate(
      { patientId: req.params.patientId },
      req.body,
      { new: true }
    );
    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});