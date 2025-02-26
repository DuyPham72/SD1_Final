const mongoose = require('mongoose');

// Define the schedule schema
const scheduleItemSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  activity: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  }
});

// Define the patient schema
const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true
  },
  careTeam: {
    primaryDoctor: {
      type: String,
      required: true
    },
    primaryNurse: {
      type: String,
      required: true
    },
    specialists: [String]
  },
  preferences: {
    dietary: [String],
    religious: String,
    language: {
      type: String,
      default: 'English'
    },
    entertainmentPreferences: [String]
  },
  schedule: [scheduleItemSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create a model from the schema
const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;