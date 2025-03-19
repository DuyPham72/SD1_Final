// backend/seedData.js
const mongoose = require('mongoose');
const Patient = require('./models/Patient');
require('dotenv').config();

// Sample patient data
const patientData = [
  {
    patientId: 'P001',
    name: 'John Smith',
    room: '101A',
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
        notes: 'Patient on low-sodium diet. Requires assistance with positioning for eating. Monitor fluid intake.',
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
    lastUpdated: Date.now()
  },
  {
    patientId: 'P002',
    name: 'Maria Garcia',
    room: '102B',
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
        notes: 'Patient on low-sodium diet. Requires assistance with positioning for eating. Monitor fluid intake.',
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
        id: 'F001',
        patientId: 'P002',
        patientName: 'Maria Garcia',
        rating: 3,
        ratings: {
          overall: 3,
          careQuality: 3,
          staffResponsiveness: 3,
          communication: 3,
          cleanliness: 3,
          mealQuality: 3
        },
        comment: 'maria please save',
        timestamp: new Date(),
        room: '102B'
      }
    ],
    lastUpdated: Date.now()
  },
  {
    patientId: 'P003',
    name: 'Nathan Chugito',
    room: 'Unassigned',
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
        id: 'F001',
        patientId: 'P003',
        patientName: 'Nathan Chugito',
        rating: 4.2,
        ratings: {
          overall: 4.2,
          careQuality: 5.0,
          staffResponsiveness: 4.0,
          communication: 4.0,
          cleanliness: 4.0,
          mealQuality: 4.0
        },
        comment: 'The Doctor and Nurse were very nice and had a good overall experience',
        timestamp: new Date(),
        room: 'Unassigned'
      }
    ],
    lastUpdated: Date.now()
  }
];

// Connect to MongoDB and seed data
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await Patient.deleteMany({});
    console.log('Cleared existing patient data');
    
    // Insert new data
    const result = await Patient.insertMany(patientData);
    console.log(`${result.length} patients inserted successfully`);
    
    console.log('Database seeded successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();