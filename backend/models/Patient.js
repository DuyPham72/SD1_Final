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
  status: {
    type: String,
    enum: ['stable', 'needs-attention', 'critical'],
    default: 'stable'
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
  feedback: [{
    id: {
      type: String,
      required: true
    },
    patientIdentifier: {
      type: String
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    ratings: {
      overall: { type: Number, min: 1, max: 5 },
      careQuality: { type: Number, min: 1, max: 5 },
      staffResponsiveness: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      cleanliness: { type: Number, min: 1, max: 5 },
      mealQuality: { type: Number, min: 1, max: 5 }
    },
    comment: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    patientId: {
      type: String,
      required: true
    },
    patientName: {
      type: String,
      required: true
    },
    room: {
      type: String,
      required: true
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create a model from the schema
const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;