// backend/reseedData.js
require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Patient = require('./models/Patient');  // Using the model with encryption disabled
require('dotenv').config();

// Sample patient data (HIPAA compliant)
const patientData = [
  {
    patientId: 'P001',
    name: 'J.S.', // Only initials, not full name
    room: '101A',
    status: 'stable',
    careTeam: {
      primaryDoctor: 'Dr. Johnson',
      primaryNurse: 'RN Sarah',
      specialists: []
    },
    preferences: {
      dietary: ['Low-sodium'],
      religious: '',
      language: 'English',
      entertainmentPreferences: []
    },
    schedule: [
      {
        time: '8:00 AM',
        activity: 'Breakfast',
        notes: 'Patient on low-sodium diet. Requires assistance with positioning.',
        completed: false
      },
      {
        time: '10:00 AM',
        activity: 'Physical Therapy',
        notes: 'Focus on gait training and balance exercises',
        completed: false
      },
      {
        time: '12:30 PM',
        activity: 'Lunch',
        notes: '',
        completed: false
      },
      {
        time: '2:00 PM',
        activity: 'Doctor Visit',
        notes: '',
        completed: false
      }
    ],
    feedback: [],
    consentStatus: {
      hasFeedbackConsent: true,
      lastUpdated: new Date()
    },
    lastUpdated: Date.now(),
    accessLog: [{
      userId: 'system',
      action: 'Created patient record',
      timestamp: new Date(),
      ipAddress: '127.0.0.1'
    }]
  },
  {
    patientId: 'P002',
    name: 'M.G.', // Only initials, not full name
    room: '102B',
    status: 'needs-attention',
    careTeam: {
      primaryDoctor: 'Dr. Johnson',
      primaryNurse: 'RN Michael',
      specialists: []
    },
    preferences: {
      dietary: ['Vegetarian'],
      religious: '',
      language: 'Spanish',
      entertainmentPreferences: []
    },
    schedule: [
      {
        time: '8:00 AM',
        activity: 'Morning Medication',
        notes: 'Patient requires assistance.',
        completed: false
      },
      {
        time: '9:30 AM',
        activity: 'Breakfast',
        notes: '',
        completed: false
      },
      {
        time: '12:30 PM',
        activity: 'Lunch',
        notes: '',
        completed: false
      },
      {
        time: '2:00 PM',
        activity: 'Family Visit',
        notes: '',
        completed: false
      },
      {
        time: '4:00 PM',
        activity: "Doctor's Rounds",
        notes: 'With Dr. Johnson',
        completed: false
      },
      {
        time: '6:00 PM',
        activity: 'Dinner',
        notes: '',
        completed: false
      }
    ],
    feedback: [
      {
        id: uuidv4(),
        patientId: 'P002',
        patientIdentifier: 'P002', // Using ID instead of name
        patientName: 'M.G.',
        rating: 3,
        ratings: {
          overall: 3,
          careQuality: 3,
          staffResponsiveness: 3,
          communication: 3,
          cleanliness: 3,
          mealQuality: 3
        },
        comment: 'Satisfactory service',
        timestamp: new Date(),
        room: '102B'
      }
    ],
    consentStatus: {
      hasFeedbackConsent: true,
      lastUpdated: new Date()
    },
    lastUpdated: Date.now(),
    accessLog: [{
      userId: 'system',
      action: 'Created patient record',
      timestamp: new Date(),
      ipAddress: '127.0.0.1'
    }]
  },
  {
    patientId: 'P003',
    name: 'N.C.', // Only initials, not full name
    room: 'Unassigned',
    status: 'critical',
    careTeam: {
      primaryDoctor: 'Dr. Johnson',
      primaryNurse: 'RN Michael',
      specialists: []
    },
    preferences: {
      dietary: ['Vegetarian'],
      religious: '',
      language: 'English',
      entertainmentPreferences: []
    },
    schedule: [],
    feedback: [
      {
        id: uuidv4(),
        patientId: 'P003',
        patientIdentifier: 'P003', // Using ID instead of name
        patientName: 'N.C.',
        rating: 4.2,
        ratings: {
          overall: 4.2,
          careQuality: 5.0,
          staffResponsiveness: 4.0,
          communication: 4.0,
          cleanliness: 4.0,
          mealQuality: 4.0
        },
        comment: 'Good overall experience',
        timestamp: new Date(),
        room: 'Unassigned'
      }
    ],
    consentStatus: {
      hasFeedbackConsent: true,
      lastUpdated: new Date()
    },
    lastUpdated: Date.now(),
    accessLog: [{
      userId: 'system',
      action: 'Created patient record',
      timestamp: new Date(),
      ipAddress: '127.0.0.1'
    }]
  }
];

// Connect to MongoDB and seed data
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await Patient.deleteMany({});
    console.log('Cleared existing patient data');
    
    // Insert patients
    const result = await Patient.insertMany(patientData);
    console.log(`${result.length} patients inserted successfully`);
    
    console.log('Database reseeded successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();