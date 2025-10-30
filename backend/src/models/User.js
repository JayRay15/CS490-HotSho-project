import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

// Custom validators
const validators = {
  phone: {
    validator: function(v) {
      if (!v) return true; // Optional field
      // E.164 format or common formats: +1234567890, (123) 456-7890, 123-456-7890, 1234567890
      return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(v);
    },
    message: 'Please enter a valid phone number'
  },
  url: {
    validator: function(v) {
      if (!v) return true; // Optional field
      // Allow http://, https://, or no protocol
      return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
    },
    message: 'Please enter a valid URL'
  },
  gpa: {
    validator: function(v) {
      if (!v) return true; // Optional field
      return v >= 0 && v <= 4.0;
    },
    message: 'GPA must be between 0.0 and 4.0'
  }
};

const employmentSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  location: { type: String, trim: true },
  startDate: { type: Date, required: true },
  endDate: { 
    type: Date,
    validate: {
      validator: function(v) {
        // End date must be after start date if both exist
        if (!v || !this.startDate) return true;
        return v >= this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  isCurrentPosition: { type: Boolean, default: false },
  description: { type: String, maxlength: 1000, trim: true }
}, { timestamps: true });

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], required: true },
  category: { type: String, required: true, trim: true }
}, { timestamps: true });

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true, trim: true },
  degree: { type: String, required: true, trim: true },
  fieldOfStudy: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { 
    type: Date,
    validate: {
      validator: function(v) {
        // End date must be after start date if both exist
        if (!v || !this.startDate) return true;
        return v >= this.startDate;
      },
      message: 'Graduation date must be after start date'
    }
  },
  current: { type: Boolean, default: false },
  gpa: { 
    type: Number,
    min: [0, 'GPA must be at least 0.0'],
    max: [4.0, 'GPA must not exceed 4.0'],
    validate: validators.gpa
  },
  gpaPrivate: { type: Boolean, default: true },
  achievements: { type: String, maxlength: 1000, trim: true },
  location: { type: String, trim: true }
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  technologies: [{ type: String, trim: true, maxlength: 50 }],
  startDate: { type: Date, required: true },
  endDate: { 
    type: Date,
    validate: {
      validator: function(v) {
        // End date must be after start date if both exist
        if (!v || !this.startDate) return true;
        return v >= this.startDate;
      },
      message: 'Project end date must be after start date'
    }
  },
  current: { type: Boolean, default: false },
  // Links - URL validation
  url: { 
    type: String, 
    trim: true,
    validate: validators.url
  },
  githubUrl: { 
    type: String, 
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        // GitHub URL format validation
        return /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/.test(v) || 
               /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: 'Please enter a valid GitHub URL'
    }
  },
  projectUrl: { 
    type: String, 
    trim: true,
    validate: validators.url
  },
  // Extended fields to support current UI
  role: { type: String, trim: true, maxlength: 100 },
  teamSize: { 
    type: Number,
    min: [1, 'Team size must be at least 1'],
    max: [1000, 'Team size seems unrealistic']
  },
  collaboration: { type: String, trim: true, maxlength: 500 },
  outcomes: { type: String, trim: true, maxlength: 1000 },
  industry: { type: String, trim: true },
  status: { type: String, enum: ['Completed', 'Ongoing', 'Planned'], default: 'Completed' },
  screenshot: {
    name: { type: String, trim: true },
    data: { type: String } // base64 data - validated at application level
  }
}, { timestamps: true });

// New: Certifications schema
const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  organization: { type: String, required: true, trim: true, maxlength: 200 },
  certId: { 
    type: String, 
    trim: true,
    maxlength: 100,
    validate: {
      validator: function(v) {
        if (!v) return true;
        // Allow alphanumeric, hyphens, underscores, and spaces
        return /^[a-zA-Z0-9\s\-_]+$/.test(v);
      },
      message: 'Certification ID can only contain letters, numbers, hyphens, underscores, and spaces'
    }
  },
  dateEarned: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(v) {
        // Date earned cannot be in the future
        return v <= new Date();
      },
      message: 'Date earned cannot be in the future'
    }
  },
  doesNotExpire: { type: Boolean, default: false },
  expirationDate: { 
    type: Date,
    validate: {
      validator: function(v) {
        // If doesn't expire, expiration date should not be set
        if (this.doesNotExpire && v) return false;
        // Expiration date must be after date earned
        if (!v || !this.dateEarned) return true;
        return v >= this.dateEarned;
      },
      message: 'Expiration date must be after date earned and should not be set if certification does not expire'
    }
  },
  verification: { type: String, enum: ['Verified', 'Pending', 'Unverified'], default: 'Unverified' },
  industry: { type: String, trim: true },
  document: {
    name: { type: String, trim: true },
    data: { type: String } // base64 data URL if uploaded client-side
  },
  // Reminder fields used by frontend UI
  reminderDays: { 
    type: Number, 
    default: 30,
    min: [1, 'Reminder days must be at least 1'],
    max: [365, 'Reminder days cannot exceed 365']
  },
  reminderDismissed: { type: Boolean, default: false },
  reminderSnoozedUntil: { type: Date }
}, { timestamps: true });

const userSchema = new mongoose.Schema(
  {
    uuid: { 
      type: String, 
      unique: true, 
      default: uuidv4, // Automatically generates UUID v4 on document creation
      immutable: true, // Cannot be changed after creation
      index: true // For fast lookups
    },
    auth0Id: { type: String, unique: true, required: true, trim: true }, // Clerk user ID (stored as auth0Id for compatibility)
    email: { 
      type: String, 
      lowercase: true, 
      required: true, 
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          // Email format validation per UC-001
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
    password: { 
      type: String,
      minlength: [8, 'Password must be at least 8 characters'], // Per UC-001
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional for OAuth users
          // Must contain: 1 uppercase, 1 lowercase, 1 number (per UC-001)
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
        },
        message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number'
      }
    },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    picture: { 
      type: String, 
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional
          // Allow standard URLs OR data URL images (JPG/PNG/GIF) used for inline storage
          const isDataUrl = /^data:image\/(jpeg|jpg|png|gif);base64,[A-Za-z0-9+/=]+$/.test(v);
          return isDataUrl || validators.url.validator(v);
        },
        message: 'Please enter a valid URL or data image (data:image/*;base64,...)'
      }
    },
    headline: { type: String, trim: true, maxlength: 120 }, // Professional title/headline (per UC-021)
    bio: { type: String, maxlength: 500, trim: true }, // Brief summary (500 char limit per UC-021)
    location: { type: String, trim: true, maxlength: 100 },
    phone: { 
      type: String, 
      trim: true,
      validate: validators.phone
    },
    industry: { type: String, enum: ['Technology', 'Healthcare', 'Finance', 'Education', 'Construction', 'Real Estate'], trim: true },
    experienceLevel: { type: String, enum: ['Entry', 'Mid', 'Senior', 'Executive'], trim: true }, // Per UC-021
    website: { 
      type: String, 
      trim: true,
      validate: validators.url
    },
    linkedin: { 
      type: String, 
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          // LinkedIn URL format validation
          return /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[\w-]+\/?$/.test(v) || 
                 /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
        },
        message: 'Please enter a valid LinkedIn URL'
      }
    },
    github: { 
      type: String, 
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          // GitHub profile URL format validation
          return /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/?$/.test(v) || 
                 /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
        },
        message: 'Please enter a valid GitHub URL'
      }
    },
    employment: [employmentSchema],
    skills: [skillSchema],
    education: [educationSchema],
    projects: [projectSchema],
    certifications: [certificationSchema]
  },
  { timestamps: true }
);

// Hash password before saving (only if password exists)
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new) AND exists
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
