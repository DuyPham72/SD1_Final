// backend/testDb.js
const mongoose = require('mongoose');
const Patient = require('./models/Patient');
require('dotenv').config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const patients = await Patient.find();
    console.log('Patients in database:', patients);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testConnection();