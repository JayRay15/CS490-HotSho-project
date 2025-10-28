import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const employmentSchema = new mongoose.Schema({
  company: { type: String, required: true },
  position: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  current: { type: Boolean, default: false },
  description: { type: String },
  location: { type: String }
}, { timestamps: true });

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], required: true },
  category: { type: String, required: true }
}, { timestamps: true });

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  current: { type: Boolean, default: false },
  gpa: { type: Number },
  location: { type: String }
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  technologies: [{ type: String }],
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  current: { type: Boolean, default: false },
  url: { type: String },
  githubUrl: { type: String }
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
    auth0Id: { type: String, unique: true, required: true }, // Required for Auth0 integration
    email: { type: String, lowercase: true, required: true, unique: true },
    password: { type: String }, // Optional - only for non-Auth0 users
    name: { type: String, required: true },
    picture: { type: String },
    bio: { type: String },
    location: { type: String },
    phone: { type: String },
    website: { type: String },
    linkedin: { type: String },
    github: { type: String },
    employment: [employmentSchema],
    skills: [skillSchema],
    education: [educationSchema],
    projects: [projectSchema]
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
