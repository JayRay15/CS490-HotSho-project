import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: { type: mongoose.Schema.Types.Mixed, required: true },
  expectedOutput: { type: mongoose.Schema.Types.Mixed, required: true },
  isHidden: { type: Boolean, default: false },
  description: String
});

const codingChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['Easy', 'Medium', 'Hard', 'Expert'],
    required: true 
  },
  category: {
    type: String,
    enum: ['Data Structures', 'Algorithms', 'System Design', 'Database', 'API Design', 'Frontend', 'Backend', 'Full Stack'],
    required: true
  },
  techStack: [String],
  timeLimit: { type: Number, default: 45 }, // minutes
  problemStatement: { type: String, required: true },
  constraints: [String],
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  testCases: [testCaseSchema],
  starterCode: {
    javascript: String,
    python: String,
    java: String,
    cpp: String,
    typescript: String
  },
  hints: [String],
  solution: {
    code: String,
    language: String,
    explanation: String,
    timeComplexity: String,
    spaceComplexity: String
  },
  relatedConcepts: [String],
  companyTags: [String], // Companies that ask this question
  realWorldApplication: String
});

const systemDesignQuestionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  level: {
    type: String,
    enum: ['Junior', 'Mid-Level', 'Senior', 'Staff', 'Principal'],
    required: true
  },
  scenario: { type: String, required: true },
  requirements: {
    functional: [String],
    nonFunctional: [String],
    constraints: [String]
  },
  scale: {
    users: String,
    requests: String,
    storage: String
  },
  keyComponents: [String],
  considerations: [String],
  solutionFramework: {
    architecture: String,
    components: [{
      name: String,
      description: String,
      technology: String
    }],
    dataFlow: String,
    scalingStrategy: String,
    tradeTroffs: [String]
  },
  followUpQuestions: [String],
  relatedTopics: [String]
});

const caseStudySchema = new mongoose.Schema({
  title: { type: String, required: true },
  industry: { type: String, required: true },
  type: {
    type: String,
    enum: ['Business', 'Technical', 'Product', 'Consulting'],
    required: true
  },
  scenario: { type: String, required: true },
  context: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed,
  questions: [String],
  framework: {
    approach: String,
    keySteps: [String],
    analysisTools: [String]
  },
  sampleSolution: {
    approach: String,
    analysis: String,
    recommendations: [String],
    expectedOutcome: String
  }
});

const userSubmissionSchema = new mongoose.Schema({
  challengeType: {
    type: String,
    enum: ['coding', 'systemDesign', 'caseStudy'],
    required: true
  },
  challengeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  code: String,
  language: String,
  testsPassed: Number,
  totalTests: Number,
  executionTime: Number, // milliseconds
  timeSpent: Number, // minutes
  score: Number,
  feedback: String,
  hints_used: [Number],
  submittedAt: { type: Date, default: Date.now }
});

const performanceMetricsSchema = new mongoose.Schema({
  totalChallengesAttempted: { type: Number, default: 0 },
  totalChallengesCompleted: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 }, // minutes
  strengthAreas: [String],
  improvementAreas: [String],
  categoryPerformance: [{
    category: String,
    attempted: Number,
    completed: Number,
    averageScore: Number
  }],
  difficultyPerformance: [{
    difficulty: String,
    attempted: Number,
    completed: Number,
    averageScore: Number
  }]
});

const technicalPrepSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  targetRole: String,
  targetTechStack: [String],
  targetCompanies: [String],
  submissions: [userSubmissionSchema],
  performance: performanceMetricsSchema,
  bookmarkedChallenges: [{
    challengeType: String,
    challengeId: mongoose.Schema.Types.ObjectId
  }],
  notes: [{
    challengeId: mongoose.Schema.Types.ObjectId,
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  studyPlan: [{
    topic: String,
    targetDate: Date,
    completed: { type: Boolean, default: false },
    challenges: [mongoose.Schema.Types.ObjectId]
  }]
}, {
  timestamps: true
});

// Static method to get or create technical prep for user
technicalPrepSchema.statics.getOrCreate = async function(userId) {
  let prep = await this.findOne({ userId });
  if (!prep) {
    prep = await this.create({ 
      userId,
      performance: {
        totalChallengesAttempted: 0,
        totalChallengesCompleted: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        strengthAreas: [],
        improvementAreas: [],
        categoryPerformance: [],
        difficultyPerformance: []
      }
    });
  }
  return prep;
};

// Method to update performance metrics
technicalPrepSchema.methods.updatePerformance = function() {
  const submissions = this.submissions;
  
  if (submissions.length === 0) return;
  
  // Calculate overall metrics
  this.performance.totalChallengesAttempted = submissions.length;
  this.performance.totalChallengesCompleted = submissions.filter(s => s.testsPassed === s.totalTests).length;
  this.performance.averageScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length;
  this.performance.totalTimeSpent = submissions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
  
  // Calculate category performance
  const categoryMap = new Map();
  submissions.forEach(sub => {
    // Note: Would need to populate challenge to get category
    // For now, placeholder logic
  });
  
  // Identify strengths and areas for improvement
  const scores = submissions.map(s => s.score || 0);
  const avgScore = this.performance.averageScore;
  
  if (avgScore >= 80) {
    this.performance.strengthAreas = ['Problem Solving', 'Code Quality'];
  } else if (avgScore < 60) {
    this.performance.improvementAreas = ['Algorithm Optimization', 'Edge Case Handling'];
  }
};

// Create models
const CodingChallenge = mongoose.model('CodingChallenge', codingChallengeSchema);
const SystemDesignQuestion = mongoose.model('SystemDesignQuestion', systemDesignQuestionSchema);
const CaseStudy = mongoose.model('CaseStudy', caseStudySchema);
const TechnicalPrep = mongoose.model('TechnicalPrep', technicalPrepSchema);

export {
  CodingChallenge,
  SystemDesignQuestion,
  CaseStudy,
  TechnicalPrep
};
