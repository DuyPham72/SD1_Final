const mongoose = require('mongoose');

// Define the enhanced feedback schema with better validation
const feedbackSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  // Support both old and new rating formats
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  // New detailed ratings object
  ratings: {
    overall: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 0
    },
    careQuality: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 0
    },
    staffResponsiveness: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 0
    },
    communication: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 0
    },
    cleanliness: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 0
    },
    mealQuality: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 0
    }
  },
  comment: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  room: {
    type: String
  }
});

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
  feedback: [feedbackSchema], // Add feedback array to store patient feedback
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to ensure ratings are numbers
patientSchema.pre('save', function(next) {
  // Check if feedback exists
  if (this.feedback && this.feedback.length > 0) {
    this.feedback.forEach(feedback => {
      // Ensure rating is a number
      if (feedback.rating !== undefined) {
        feedback.rating = Number(feedback.rating);
      }
      
      // Ensure ratings object properties are numbers
      if (feedback.ratings) {
        if (feedback.ratings.overall !== undefined) {
          feedback.ratings.overall = Number(feedback.ratings.overall);
        }
        if (feedback.ratings.careQuality !== undefined) {
          feedback.ratings.careQuality = Number(feedback.ratings.careQuality);
        }
        if (feedback.ratings.staffResponsiveness !== undefined) {
          feedback.ratings.staffResponsiveness = Number(feedback.ratings.staffResponsiveness);
        }
        if (feedback.ratings.communication !== undefined) {
          feedback.ratings.communication = Number(feedback.ratings.communication);
        }
        if (feedback.ratings.cleanliness !== undefined) {
          feedback.ratings.cleanliness = Number(feedback.ratings.cleanliness);
        }
        if (feedback.ratings.mealQuality !== undefined) {
          feedback.ratings.mealQuality = Number(feedback.ratings.mealQuality);
        }
      }
    });
  }
  next();
});

// Create a model from the schema
const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;