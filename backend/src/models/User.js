import mongoose from "mongoose";

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
    auth0Id: { type: String, unique: true, required: true },
    email: { type: String, lowercase: true, required: true },
    name: { type: String },
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

export const User = mongoose.model("User", userSchema);
