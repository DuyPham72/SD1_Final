// backend/seedData.js
const mongoose = require('mongoose');
const Patient = require('./models/Patient');
require('dotenv').config();

const testPatients = [
  {
    patientId: "P001",
    name: "John Smith",
    room: "101A",
    careTeam: {
      primaryDoctor: "Dr. Wilson",
      primaryNurse: "RN Sarah"
    },
    preferences: {
      dietary: ["Low-sodium", "Diabetic"],
      religious: "Christian",
      language: "English"
    },
    schedule: [
      {
        time: "7:30 AM",
        activity: "Morning Vitals & Medication",
        completed: false
      },
      {
        time: "9:00 AM",
        activity: "Breakfast",
        completed: false
      },
      {
        time: "10:00 AM",
        activity: "Physical Therapy",
        completed: false,
        notes: "Focus on walking exercises"
      },
      {
        time: "12:00 PM",
        activity: "Lunch",
        completed: false
      },
      {
        time: "1:00 PM",
        activity: "Doctor's Check-in",
        completed: false,
        notes: "With Dr. Wilson"
      },
      {
        time: "3:00 PM",
        activity: "Occupational Therapy",
        completed: false
      },
      {
        time: "5:30 PM",
        activity: "Dinner",
        completed: false
      },
      {
        time: "8:00 PM",
        activity: "Evening Medication",
        completed: false
      }
    ]
  },
  {
    patientId: "P002",
    name: "Maria Garcia",
    room: "102B",
    careTeam: {
      primaryDoctor: "Dr. Johnson",
      primaryNurse: "RN Michael"
    },
    preferences: {
      dietary: ["Vegetarian"],
      religious: "Catholic",
      language: "Spanish"
    },
    schedule: [
      {
        time: "8:00 AM",
        activity: "Morning Medication",
        completed: false
      },
      {
        time: "9:30 AM",
        activity: "Breakfast",
        completed: false
      },
      {
        time: "11:00 AM",
        activity: "Speech Therapy",
        completed: false
      },
      {
        time: "12:30 PM",
        activity: "Lunch",
        completed: false
      },
      {
        time: "2:00 PM",
        activity: "Family Visit",
        completed: false
      },
      {
        time: "4:00 PM",
        activity: "Doctor's Rounds",
        completed: false,
        notes: "With Dr. Johnson"
      },
      {
        time: "6:00 PM",
        activity: "Dinner",
        completed: false
      },
      {
        time: "9:00 PM",
        activity: "Evening Medication",
        completed: false
      }
    ]
  }
  
  // Add more test patients as needed
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing data
    await Patient.deleteMany({});
    
    // Insert test data
    await Patient.insertMany(testPatients);
    
    console.log('Database seeded successfully 🌱');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();