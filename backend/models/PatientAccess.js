const mongoose = require('mongoose');

const PatientAccessSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true
  },
  accessToken: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Token expires after 24 hours (in seconds)
  }
});

const PatientAccess = mongoose.model('PatientAccess', PatientAccessSchema);

module.exports = PatientAccess;