// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'doctor', 'nurse', 'staff'],
    default: 'staff'
  },
  active: {
    type: Boolean,
    default: true
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  accessHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    action: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  // Add collection-level encryption in MongoDB Enterprise
  collation: { locale: 'en', strength: 2 }
});

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  const user = this;
  
  // Only hash the password if it's modified or new
  if (!user.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(12);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(user.password, salt);
    
    // Replace plain text password with hashed password
    user.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to record login attempt
UserSchema.methods.recordLoginAttempt = function(success, ipAddress, userAgent) {
  // Reset failed attempts on successful login
  if (success) {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
    this.lastLogin = new Date();
  } else {
    // Increment failed attempts
    this.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts
    if (this.failedLoginAttempts >= 5) {
      // Lock for 30 minutes
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 30);
      this.lockedUntil = lockUntil;
    }
  }
  
  // Record access history
  this.accessHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    action: success ? 'login_success' : 'login_failure'
  });
  
  return this.save();
};

// Method to check if account is locked
UserSchema.methods.isLocked = function() {
  // If there's no lock date or the lock has expired
  if (!this.lockedUntil || this.lockedUntil < new Date()) {
    return false;
  }
  return true;
};

// Static method to find active users
UserSchema.statics.findActiveUsers = function() {
  return this.find({ active: true });
};

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Create index for faster queries
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

const User = mongoose.model('User', UserSchema);

module.exports = User;