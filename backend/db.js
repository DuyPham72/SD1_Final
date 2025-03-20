// backend/db.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      ssl: true,
      sslValidate: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority' // Ensures writes are acknowledged by a majority of replica set members
    });
    
    console.log('MongoDB connected securely 🔒');
    
    // Configure database settings for additional security
    mongoose.connection.db.admin().command({ 
      setParameter: 1, 
      internalQueryExecMaxBlockingSortBytes: 33554432 
    }).catch(err => {
      // This is optional and may fail on some Atlas tiers, which is acceptable
      console.log('Note: Some advanced security settings could not be applied');
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;