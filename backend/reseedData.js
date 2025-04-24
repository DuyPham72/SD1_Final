// backend/reseedData.js
require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Patient = require('./models/Patient');  // Using the model with encryption disabled
require('dotenv').config();

// Sample patient data (HIPAA compliant)
const patientData = [
  // Dr. Smith's patients (rooms starting with 1)
  {
    patientId: 'P001',
    name: 'J.S.', // Only initials, not full name
    room: '101A',
    status: 'stable',
    careTeam: {
      primaryDoctor: 'Dr. Smith',
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
    name: 'E.R.', // Only initials, not full name
    room: '102B',
    status: 'needs-attention',
    careTeam: {
      primaryDoctor: 'Dr. Smith',
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
      }
    ],
    feedback: [],
    consentStatus: {
      hasFeedbackConsent: true,
      lastUpdated: new Date()
    },
    lastUpdated: Date.now(),
    accessLog: []
  },

  // Dr. Johnson's patients (rooms starting with 2)
  {
    patientId: 'P003',
    name: 'D.T.', // Only initials, not full name
    room: '201C',
    status: 'stable',
    careTeam: {
      primaryDoctor: 'Dr. Johnson',
      primaryNurse: 'RN Sarah',
      specialists: []
    },
    preferences: {
      dietary: ['Kosher'],
      religious: 'Jewish',
      language: 'English',
      entertainmentPreferences: []
    },
    schedule: [
      {
        time: '8:00 AM',
        activity: 'Breakfast',
        notes: '',
        completed: false
      },
      {
        time: '10:00 AM',
        activity: 'Doctor Visit',
        notes: 'With Dr. Johnson',
        completed: false
      }
    ],
    feedback: [],
    consentStatus: {
      hasFeedbackConsent: true,
      lastUpdated: new Date()
    },
    lastUpdated: Date.now(),
    accessLog: []
  },
  {
    patientId: 'P004',
    name: 'A.P.', // Only initials, not full name
    room: '202A',
    status: 'critical',
    careTeam: {
      primaryDoctor: 'Dr. Johnson',
      primaryNurse: 'RN Michael',
      specialists: []
    },
    preferences: {
      dietary: ['Gluten-free'],
      religious: '',
      language: 'English',
      entertainmentPreferences: []
    },
    schedule: [
      {
        time: '8:00 AM',
        activity: 'Morning Medication',
        notes: 'Critical monitoring required',
        completed: false
      }
    ],
    feedback: [],
    consentStatus: {
      hasFeedbackConsent: true,
      lastUpdated: new Date()
    },
    lastUpdated: Date.now(),
    accessLog: []
  },

  // Dr. Williams's patients (rooms starting with 3)
  {
    patientId: 'P005',
    name: 'M.K.', // Only initials, not full name
    room: '301B',
    status: 'stable',
    careTeam: {
      primaryDoctor: 'Dr. Williams',
      primaryNurse: 'RN Taylor',
      specialists: []
    },
    preferences: {
      dietary: ['Diabetic'],
      religious: 'Christian',
      language: 'English',
      entertainmentPreferences: []
    },
    schedule: [
      {
        time: '7:30 AM',
        activity: 'Blood Sugar Check',
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
    accessLog: []
  },

  // Dr. Davis's patients (rooms starting with 4)
  {
    patientId: 'P006',
    name: 'S.C.', // Only initials, not full name
    room: '401A',
    status: 'needs-attention',
    careTeam: {
      primaryDoctor: 'Dr. Davis',
      primaryNurse: 'RN Jordan',
      specialists: []
    },
    preferences: {
      dietary: ['Halal'],
      religious: 'Muslim',
      language: 'Arabic',
      entertainmentPreferences: []
    },
    schedule: [
      {
        time: '9:00 AM',
        activity: 'Morning Assessment',
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
    accessLog: []
  },

  // Unassigned patient (all staff can see)
  {
    patientId: 'P007',
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
    feedback: [],
    consentStatus: {
      hasFeedbackConsent: true,
      lastUpdated: new Date()
    },
    lastUpdated: Date.now(),
    accessLog: []
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