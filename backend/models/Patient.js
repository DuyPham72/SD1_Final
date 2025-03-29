// backend/models/Patient.js
require('dotenv').config();
console.log('Patient.js - ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? 'Present' : 'Missing');
console.log('Patient.js - SIGNING_KEY:', process.env.SIGNING_KEY ? 'Present' : 'Missing');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const crypto = require('crypto');

// Schemas
const ScheduleItemSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  activity: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const FeedbackSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  patientIdentifier: { // Changed from patientName to comply with HIPAA
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  ratings: {
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    careQuality: {
      type: Number,
      min: 1,
      max: 5
    },
    staffResponsiveness: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    mealQuality: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  comment: {
    type: String,
    maxLength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  room: {
    type: String
  }
}, { timestamps: true });

const CareTeamSchema = new mongoose.Schema({
  primaryDoctor: {
    type: String
  },
  primaryNurse: {
    type: String
  },
  specialists: [{
    type: String
  }]
});

const PreferencesSchema = new mongoose.Schema({
  dietary: [{
    type: String
  }],
  religious: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'English'
  },
  entertainmentPreferences: [{
    type: String
  }]
});

// Main Patient Schema
const PatientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  fullNameHash: {
    type: String,
    trim: true
  },
  room: {
    type: String,
    required: true
  },
  careTeam: CareTeamSchema,
  preferences: PreferencesSchema,
  schedule: [ScheduleItemSchema],
  feedback: [FeedbackSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // HIPAA audit fields
  accessLog: [{
    userId: String,
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }],
  consentStatus: {
    hasFeedbackConsent: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date
    }
  }
}, { timestamps: true });

// Method to record access to patient data
PatientSchema.methods.recordAccess = function(userId, action, ipAddress) {
  this.accessLog.push({
    userId,
    action,
    timestamp: new Date(),
    ipAddress
  });
  return this.save();
};

// Create a reference field for patient instead of storing full name
PatientSchema.pre('save', function(next) {
  if (this.isNew && this.feedback && this.feedback.length > 0) {
    this.feedback.forEach(feedback => {
      // Replace full patient name with identifier (e.g., initials or patient ID)
      feedback.patientIdentifier = this.patientId;
    });
  }
  next();
});

// TEMPORARY: Disable encryption while we fix the database
// We'll implement encryption properly in production
console.log('HIPAA-compliant encryption is temporarily disabled for development');
console.log('⚠️ WARNING: Patient data is not encrypted. Do not use real patient data!');

const Patient = mongoose.model('Patient', PatientSchema);

module.exports = Patient;