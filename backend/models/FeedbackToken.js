// models/FeedbackToken.js
const mongoose = require('mongoose');

const feedbackTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  patientInfo: {
    type: Object,
    default: null
  },
  expiry: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add an index that will automatically expire tokens
feedbackTokenSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

const FeedbackToken = mongoose.model('FeedbackToken', feedbackTokenSchema);

module.exports = FeedbackToken;