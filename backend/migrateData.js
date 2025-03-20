// backend/migrateData.js
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

// Connect to MongoDB without enabling encryption
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for data migration'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// First, get the Patient model without encryption
// We're defining a simplified version of the schema
const PatientSchema = new mongoose.Schema({
  patientId: String,
  name: String,
  room: String,
  careTeam: {
    primaryDoctor: String,
    primaryNurse: String,
    specialists: [String]
  },
  preferences: {
    dietary: [String],
    religious: String,
    language: String,
    entertainmentPreferences: [String]
  },
  schedule: [{
    time: String,
    activity: String,
    notes: String,
    completed: Boolean
  }],
  feedback: [{
    id: String,
    patientId: String,
    patientIdentifier: String,
    rating: Number,
    ratings: {
      overall: Number,
      careQuality: Number,
      staffResponsiveness: Number,
      communication: Number,
      cleanliness: Number,
      mealQuality: Number
    },
    comment: String,
    timestamp: Date,
    room: String
  }],
  lastUpdated: Date,
  accessLog: [{
    userId: String,
    action: String,
    timestamp: Date,
    ipAddress: String
  }],
  consentStatus: {
    hasFeedbackConsent: Boolean,
    lastUpdated: Date
  }
}, { timestamps: true });

// Create the unencrypted model
const UnencryptedPatient = mongoose.model('Patient', PatientSchema, 'patients');

// Function to fetch and backup all patients
async function migrateData() {
  try {
    console.log('Starting data migration...');
    
    // Fetch all patients
    const patients = await UnencryptedPatient.find({});
    console.log(`Found ${patients.length} patients to migrate`);
    
    // Create a backup of the data
    const backupData = JSON.stringify(patients, null, 2);
    require('fs').writeFileSync('patient-data-backup.json', backupData);
    console.log('Created data backup at patient-data-backup.json');
    
    // Clear existing collection
    await UnencryptedPatient.deleteMany({});
    console.log('Cleared existing patient data');
    
    // Reinsert data (this will be unencrypted)
    for (const patient of patients) {
      const patientObj = patient.toObject();
      delete patientObj._id; // Remove _id to let MongoDB generate a new one
      
      // Clean up any fields that might have been added by previous encryption
      delete patientObj.__enc_name;
      delete patientObj.__enc_preferences;
      delete patientObj.__enc_schedule;
      delete patientObj.__enc_feedback;
      
      // Add consent for all patients
      if (!patientObj.consentStatus) {
        patientObj.consentStatus = {
          hasFeedbackConsent: true,
          lastUpdated: new Date()
        };
      }
      
      // Use patientId as identifier in feedback
      if (patientObj.feedback && patientObj.feedback.length > 0) {
        patientObj.feedback.forEach(feedback => {
          feedback.patientIdentifier = patientObj.patientId;
        });
      }
      
      await UnencryptedPatient.create(patientObj);
      console.log(`Reinserted patient: ${patientObj.patientId}`);
    }
    
    console.log('Migration completed successfully!');
    console.log('\nNow you can restart your server with encryption enabled.');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error during migration:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run the migration
migrateData();