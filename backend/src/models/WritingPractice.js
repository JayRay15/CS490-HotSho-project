import mongoose from 'mongoose';

// Schema for behavioral questions
const behavioralQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'Leadership',
      'Teamwork',
      'Problem Solving',
      'Conflict Resolution',
      'Time Management',
      'Communication',
      'Adaptability',
      'Initiative',
      'Customer Focus',
      'Achievement',
      'Technical',
      'Cultural Fit'
    ],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Entry', 'Mid-Level', 'Senior', 'Executive'],
    required: true
  },
  industry: String,
  role: String,
  starGuidance: {
    situation: String,
    task: String,
    action: String,
    result: String
  },
  tips: [String],
  commonMistakes: [String],
  idealResponseLength: {
    min: { type: Number, default: 150 }, // words
    max: { type: Number, default: 300 }
  },
  timeLimit: { type: Number, default: 15 }, // minutes
  followUpQuestions: [String]
}, { timestamps: true });

// Schema for response feedback analysis
const feedbackAnalysisSchema = new mongoose.Schema({
  overallScore: { type: Number, min: 0, max: 100, required: true },
  clarityScore: { type: Number, min: 0, max: 100 },
  professionalismScore: { type: Number, min: 0, max: 100 },
  structureScore: { type: Number, min: 0, max: 100 },
  relevanceScore: { type: Number, min: 0, max: 100 },
  impactScore: { type: Number, min: 0, max: 100 },
  starAdherence: {
    hasSituation: Boolean,
    hasTask: Boolean,
    hasAction: Boolean,
    hasResult: Boolean,
    score: { type: Number, min: 0, max: 100 }
  },
  wordCount: Number,
  estimatedSpeakingTime: Number, // seconds
  readabilityScore: Number,
  strengths: [String],
  weaknesses: [String],
  improvements: [String],
  alternativeApproaches: [String],
  languagePatterns: {
    weakPhrases: [String],
    strongPhrases: [String],
    fillerWords: [String],
    passiveVoice: Number, // percentage
    actionVerbs: [String]
  },
  communicationQuality: {
    tone: String,
    confidence: String,
    conciseness: String,
    engagement: String
  }
});

// Schema for user responses
const responseSubmissionSchema = new mongoose.Schema({
  questionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BehavioralQuestion',
    required: true 
  },
  response: { type: String, required: true },
  timeSpent: { type: Number, required: true }, // seconds
  wordCount: Number,
  completedWithinTimeLimit: Boolean,
  feedback: feedbackAnalysisSchema,
  version: { type: Number, default: 1 }, // For tracking revisions
  submittedAt: { type: Date, default: Date.now }
});

// Schema for practice sessions
const practiceSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  sessionType: {
    type: String,
    enum: ['Individual Question', 'Timed Challenge', 'Mock Interview', 'Targeted Practice'],
    default: 'Individual Question'
  },
  targetRole: String,
  targetCompany: String,
  targetIndustry: String,
  sessionGoal: String,
  responses: [responseSubmissionSchema],
  totalTimeSpent: Number, // seconds
  sessionScore: Number,
  sessionFeedback: {
    overallPerformance: String,
    keyStrengths: [String],
    areasForImprovement: [String],
    progressIndicators: [String],
    nextSteps: [String]
  },
  completed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date
}, { timestamps: true });

// Schema for performance tracking over time
const performanceTrackingSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  totalSessions: { type: Number, default: 0 },
  totalQuestionsAnswered: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 }, // seconds
  averageScore: { type: Number, default: 0 },
  categoryPerformance: [{
    category: String,
    questionsAnswered: Number,
    averageScore: Number,
    improvement: Number // percentage
  }],
  improvementTrend: [{
    date: Date,
    score: Number,
    sessionId: mongoose.Schema.Types.ObjectId
  }],
  strengthCategories: [String],
  improvementCategories: [String],
  milestones: [{
    achievement: String,
    achievedAt: Date,
    description: String
  }],
  goals: [{
    category: String,
    targetScore: Number,
    deadline: Date,
    achieved: { type: Boolean, default: false }
  }],
  nerveManagementProgress: {
    confidenceLevel: { type: Number, min: 1, max: 10, default: 5 },
    preparednessLevel: { type: Number, min: 1, max: 10, default: 5 },
    improvementNotes: [String],
    techniques: [{
      technique: String,
      effectiveness: Number,
      lastUsed: Date
    }]
  },
  lastPracticeDate: Date
}, { timestamps: true });

// Statics for BehavioralQuestion
behavioralQuestionSchema.statics.getQuestionsByCategory = async function(category, difficulty) {
  const query = { category };
  if (difficulty) query.difficulty = difficulty;
  return this.find(query);
};

behavioralQuestionSchema.statics.getQuestionsByRole = async function(role, difficulty) {
  const query = { role };
  if (difficulty) query.difficulty = difficulty;
  return this.find(query);
};

behavioralQuestionSchema.statics.getRandomQuestions = async function(count, filters = {}) {
  return this.aggregate([
    { $match: filters },
    { $sample: { size: count } }
  ]);
};

// Methods for PracticeSession
practiceSessionSchema.methods.calculateSessionScore = function() {
  if (this.responses.length === 0) return 0;
  
  const totalScore = this.responses.reduce((sum, response) => {
    return sum + (response.feedback?.overallScore || 0);
  }, 0);
  
  this.sessionScore = totalScore / this.responses.length;
  return this.sessionScore;
};

practiceSessionSchema.methods.completeSession = function() {
  this.completed = true;
  this.completedAt = new Date();
  this.calculateSessionScore();
};

// Methods for PerformanceTracking
performanceTrackingSchema.statics.getOrCreate = async function(userId) {
  let performance = await this.findOne({ userId });
  if (!performance) {
    performance = await this.create({ userId });
  }
  return performance;
};

performanceTrackingSchema.methods.updateAfterSession = async function(session) {
  this.totalSessions += 1;
  this.totalQuestionsAnswered += session.responses.length;
  this.totalTimeSpent += session.totalTimeSpent || 0;
  this.lastPracticeDate = new Date();
  
  // Update average score
  const totalScore = (this.averageScore * (this.totalSessions - 1)) + session.sessionScore;
  this.averageScore = totalScore / this.totalSessions;
  
  // Track improvement trend
  this.improvementTrend.push({
    date: new Date(),
    score: session.sessionScore,
    sessionId: session._id
  });
  
  // Keep only last 30 data points
  if (this.improvementTrend.length > 30) {
    this.improvementTrend = this.improvementTrend.slice(-30);
  }
  
  // Update category performance
  for (const response of session.responses) {
    const question = await mongoose.model('BehavioralQuestion').findById(response.questionId);
    if (question) {
      const categoryIndex = this.categoryPerformance.findIndex(
        cp => cp.category === question.category
      );
      
      if (categoryIndex === -1) {
        this.categoryPerformance.push({
          category: question.category,
          questionsAnswered: 1,
          averageScore: response.feedback?.overallScore || 0,
          improvement: 0
        });
      } else {
        const catPerf = this.categoryPerformance[categoryIndex];
        const oldAvg = catPerf.averageScore;
        const newCount = catPerf.questionsAnswered + 1;
        catPerf.averageScore = ((oldAvg * catPerf.questionsAnswered) + (response.feedback?.overallScore || 0)) / newCount;
        catPerf.questionsAnswered = newCount;
        catPerf.improvement = ((catPerf.averageScore - oldAvg) / oldAvg) * 100;
      }
    }
  }
  
  // Identify strength and improvement categories
  const sortedCategories = [...this.categoryPerformance].sort((a, b) => b.averageScore - a.averageScore);
  this.strengthCategories = sortedCategories.slice(0, 3).map(c => c.category);
  this.improvementCategories = sortedCategories.slice(-3).map(c => c.category);
  
  await this.save();
};

// Create models
const BehavioralQuestion = mongoose.model('BehavioralQuestion', behavioralQuestionSchema);
const PracticeSession = mongoose.model('PracticeSession', practiceSessionSchema);
const PerformanceTracking = mongoose.model('PerformanceTracking', performanceTrackingSchema);

export {
  BehavioralQuestion,
  PracticeSession,
  PerformanceTracking
};
