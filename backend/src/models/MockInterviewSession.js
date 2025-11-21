import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId }, // reference internal question _id
  answer: { type: String },
  wordCount: { type: Number },
  durationSeconds: { type: Number }, // time user spent typing/submitting
  guidanceFeedback: { type: [String], default: [] },
  submittedAt: { type: Date, default: Date.now },
}, { _id: false });

const sessionQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: String, enum: ["Behavioral", "Technical", "Case"], required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
  idealWordRange: {
    min: { type: Number },
    max: { type: Number },
  },
  pacingSeconds: { type: Number }, // recommended time to answer
}, { _id: true });

const summarySchema = new mongoose.Schema({
  totalQuestions: { type: Number },
  averageWordCount: { type: Number },
  averageDurationSeconds: { type: Number },
  byCategory: {
    Behavioral: { type: Number, default: 0 },
    Technical: { type: Number, default: 0 },
    Case: { type: Number, default: 0 },
  },
  improvementAreas: { type: [String], default: [] },
  confidenceExercises: { type: [String], default: [] },
  strengths: { type: [String], default: [] },
  analysisMetrics: {
    averageActionVerbDensity: { type: Number },
    averageFillerCount: { type: Number },
    starCompletionRate: { type: Number },
    metricsUsageRate: { type: Number },
  },
}, { _id: false });

const mockInterviewSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  roleTitle: { type: String },
  company: { type: String },
  formats: { type: [String], default: [] }, // Behavioral, Technical, Case
  questions: { type: [sessionQuestionSchema], default: [] },
  responses: { type: [responseSchema], default: [] },
  currentIndex: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "finished"], default: "active" },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
  summary: { type: summarySchema },
}, { timestamps: true });

export const MockInterviewSession = mongoose.model("MockInterviewSession", mockInterviewSessionSchema);
