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
    }
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
    }
  },
  
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