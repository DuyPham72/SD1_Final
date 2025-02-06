// backend/models/Patient.js
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  room: { type: String, required: true },
  careTeam: {
    primaryDoctor: String,
    primaryNurse: String
  },
  preferences: {
    dietary: [String],
    religious: String,
    language: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);