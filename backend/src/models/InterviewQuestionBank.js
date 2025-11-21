import mongoose from "mongoose";

const starGuideSchema = new mongoose.Schema(
  {
    situation: String,
    task: String,
    action: String,
    result: String,
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    category: { type: String, enum: ["Behavioral", "Technical", "Situational"], required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    linkedSkills: [{ type: String }],
    companyContext: { type: String },
    practiced: { type: Boolean, default: false },
    lastPracticedAt: { type: Date },
    starGuide: { type: starGuideSchema }, // Present for behavioral only
  },
  { _id: true }
);

const interviewQuestionBankSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    roleTitle: { type: String },
    company: { type: String },
    industry: { type: String },
    workMode: { type: String },
    questions: [questionSchema],
    stats: {
      total: { type: Number, default: 0 },
      practicedCount: { type: Number, default: 0 },
      byCategory: {
        Behavioral: { type: Number, default: 0 },
        Technical: { type: Number, default: 0 },
        Situational: { type: Number, default: 0 },
      },
      byDifficulty: {
        Easy: { type: Number, default: 0 },
        Medium: { type: Number, default: 0 },
        Hard: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true }
);

interviewQuestionBankSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const InterviewQuestionBank = mongoose.model("InterviewQuestionBank", interviewQuestionBankSchema);
