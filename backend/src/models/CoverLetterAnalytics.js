import mongoose from "mongoose";

/**
 * UC-62: Cover Letter Performance Analytics Model
 * Tracks performance metrics for cover letters including response rates,
 * success patterns, template effectiveness, and A/B testing results
 */
const coverLetterAnalyticsSchema = new mongoose.Schema(
  {
    userId: { 
      type: String, 
      required: true, 
      index: true 
    },
    coverLetterId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "CoverLetter",
      required: true,
      index: true
    },
    templateId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "CoverLetterTemplate"
    },
    
    // Performance Metrics
    performanceMetrics: {
      // Total applications sent with this cover letter
      totalApplications: { type: Number, default: 0 },
      
      // Response tracking
      totalResponses: { type: Number, default: 0 },
      responseRate: { type: Number, default: 0 }, // Percentage
      avgTimeToResponse: { type: Number, default: 0 }, // Days
      
      // Interview metrics
      interviewRequests: { type: Number, default: 0 },
      interviewRate: { type: Number, default: 0 }, // Percentage
      phoneScreens: { type: Number, default: 0 },
      
      // Final outcomes
      finalRoundInterviews: { type: Number, default: 0 },
      offers: { type: Number, default: 0 },
      offerRate: { type: Number, default: 0 }, // Percentage
      rejections: { type: Number, default: 0 },
      
      // Success score (0-100) based on weighted metrics
      successScore: { type: Number, default: 0 },
      
      // Last updated timestamp for metrics calculation
      lastCalculated: { type: Date, default: Date.now }
    },
    
    // Template Effectiveness
    templateEffectiveness: {
      // Compare to other templates
      comparedToAverage: { type: String, enum: ['above', 'average', 'below', 'insufficient_data'], default: 'insufficient_data' },
      percentileRank: { type: Number, min: 0, max: 100 }, // What percentile is this template in
      
      // Style and industry performance
      stylePerformance: {
        style: String, // formal, casual, enthusiastic, etc.
        performanceVsStyle: Number // How this performs vs others in same style
      },
      industryPerformance: {
        industry: String,
        performanceVsIndustry: Number // How this performs vs others in same industry
      },
      
      // Recommendations
      recommendationScore: { type: Number, default: 0, min: 0, max: 10 },
      strengths: [String],
      improvements: [String]
    },
    
    // A/B Testing Data
    abTestingData: {
      // Group identifier for A/B tests
      testGroup: { 
        type: String, 
        enum: ['A', 'B', 'control', 'none'],
        default: 'none'
      },
      testId: String, // Identifier for the specific test
      variations: [{
        variationName: String,
        variationId: String,
        applications: Number,
        responses: Number,
        responseRate: Number,
        successRate: Number
      }],
      winningVariation: String,
      testCompleted: { type: Boolean, default: false },
      testStartDate: Date,
      testEndDate: Date,
      statisticalSignificance: Number // 0-100, confidence level
    },
    
    // Success Patterns
    successPatterns: {
      // Which characteristics correlate with success
      effectiveElements: [{
        element: String, // e.g., "opening paragraph", "call to action", "specific achievement"
        impactScore: Number, // 0-10
        frequency: Number // How often this element appears in successful letters
      }],
      
      // Timing patterns
      bestDayToSend: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', '']
      },
      bestTimeToSend: String, // e.g., "9-11 AM", "2-4 PM"
      
      // Company size patterns
      performanceByCompanySize: [{
        size: String,
        applications: Number,
        successRate: Number
      }],
      
      // Industry patterns
      performanceByIndustry: [{
        industry: String,
        applications: Number,
        responseRate: Number,
        successRate: Number
      }]
    },
    
    // Historical data for trending
    historicalMetrics: [{
      date: { type: Date, required: true },
      applications: Number,
      responses: Number,
      responseRate: Number,
      interviews: Number,
      offers: Number
    }],
    
    // Linked applications for detailed analysis
    linkedApplications: [{
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
      appliedDate: Date,
      responded: Boolean,
      responseDate: Date,
      responseType: String,
      outcome: String, // 'offer', 'interview', 'rejection', 'pending'
      companyName: String,
      industry: String,
      companySize: String
    }]
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient querying
coverLetterAnalyticsSchema.index({ userId: 1, 'performanceMetrics.successScore': -1 });
coverLetterAnalyticsSchema.index({ templateId: 1 });
coverLetterAnalyticsSchema.index({ 'performanceMetrics.responseRate': -1 });

// Methods

/**
 * Calculate and update all performance metrics
 */
coverLetterAnalyticsSchema.methods.calculateMetrics = function() {
  const { linkedApplications } = this;
  
  if (!linkedApplications || linkedApplications.length === 0) {
    return;
  }
  
  const total = linkedApplications.length;
  const responded = linkedApplications.filter(app => app.responded).length;
  const interviews = linkedApplications.filter(app => 
    app.outcome === 'interview' || app.responseType === 'interview_request'
  ).length;
  const offers = linkedApplications.filter(app => app.outcome === 'offer').length;
  const rejections = linkedApplications.filter(app => app.outcome === 'rejection').length;
  
  // Calculate average time to response
  const responseTimes = linkedApplications
    .filter(app => app.responded && app.responseDate && app.appliedDate)
    .map(app => {
      const diff = new Date(app.responseDate) - new Date(app.appliedDate);
      return Math.floor(diff / (1000 * 60 * 60 * 24)); // Convert to days
    });
  
  const avgTimeToResponse = responseTimes.length > 0
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0;
  
  // Calculate rates
  const responseRate = total > 0 ? ((responded / total) * 100).toFixed(2) : 0;
  const interviewRate = total > 0 ? ((interviews / total) * 100).toFixed(2) : 0;
  const offerRate = total > 0 ? ((offers / total) * 100).toFixed(2) : 0;
  
  // Calculate success score (weighted)
  // Response: 30%, Interview: 40%, Offer: 30%
  const successScore = Math.round(
    (parseFloat(responseRate) * 0.3) +
    (parseFloat(interviewRate) * 0.4) +
    (parseFloat(offerRate) * 0.3)
  );
  
  // Update metrics
  this.performanceMetrics = {
    totalApplications: total,
    totalResponses: responded,
    responseRate: parseFloat(responseRate),
    avgTimeToResponse: Math.round(avgTimeToResponse),
    interviewRequests: interviews,
    interviewRate: parseFloat(interviewRate),
    phoneScreens: linkedApplications.filter(app => app.responseType === 'phone_screen').length,
    finalRoundInterviews: linkedApplications.filter(app => app.outcome === 'interview').length,
    offers,
    offerRate: parseFloat(offerRate),
    rejections,
    successScore,
    lastCalculated: new Date()
  };
};

/**
 * Analyze success patterns from linked applications
 */
coverLetterAnalyticsSchema.methods.analyzeSuccessPatterns = function() {
  const { linkedApplications } = this;
  
  if (!linkedApplications || linkedApplications.length < 3) {
    return; // Need at least 3 applications for pattern analysis
  }
  
  // Analyze by company size
  const sizePerformance = {};
  linkedApplications.forEach(app => {
    if (!app.companySize) return;
    if (!sizePerformance[app.companySize]) {
      sizePerformance[app.companySize] = { applications: 0, successes: 0 };
    }
    sizePerformance[app.companySize].applications++;
    if (app.outcome === 'offer' || app.outcome === 'interview') {
      sizePerformance[app.companySize].successes++;
    }
  });
  
  const performanceByCompanySize = Object.keys(sizePerformance).map(size => ({
    size,
    applications: sizePerformance[size].applications,
    successRate: ((sizePerformance[size].successes / sizePerformance[size].applications) * 100).toFixed(2)
  }));
  
  // Analyze by industry
  const industryPerformance = {};
  linkedApplications.forEach(app => {
    if (!app.industry) return;
    if (!industryPerformance[app.industry]) {
      industryPerformance[app.industry] = { applications: 0, responses: 0, successes: 0 };
    }
    industryPerformance[app.industry].applications++;
    if (app.responded) industryPerformance[app.industry].responses++;
    if (app.outcome === 'offer' || app.outcome === 'interview') {
      industryPerformance[app.industry].successes++;
    }
  });
  
  const performanceByIndustry = Object.keys(industryPerformance).map(industry => ({
    industry,
    applications: industryPerformance[industry].applications,
    responseRate: ((industryPerformance[industry].responses / industryPerformance[industry].applications) * 100).toFixed(2),
    successRate: ((industryPerformance[industry].successes / industryPerformance[industry].applications) * 100).toFixed(2)
  }));
  
  // Analyze timing patterns
  const dayPerformance = {};
  linkedApplications.forEach(app => {
    if (!app.appliedDate) return;
    const day = new Date(app.appliedDate).toLocaleDateString('en-US', { weekday: 'long' });
    if (!dayPerformance[day]) {
      dayPerformance[day] = { applications: 0, responses: 0 };
    }
    dayPerformance[day].applications++;
    if (app.responded) dayPerformance[day].responses++;
  });
  
  // Find best day
  let bestDay = '';
  let bestDayRate = 0;
  Object.keys(dayPerformance).forEach(day => {
    const rate = dayPerformance[day].responses / dayPerformance[day].applications;
    if (rate > bestDayRate && dayPerformance[day].applications >= 2) {
      bestDayRate = rate;
      bestDay = day;
    }
  });
  
  this.successPatterns = {
    performanceByCompanySize,
    performanceByIndustry,
    bestDayToSend: bestDay || '',
    effectiveElements: this.successPatterns?.effectiveElements || []
  };
};

/**
 * Update historical metrics (called periodically)
 */
coverLetterAnalyticsSchema.methods.updateHistoricalMetrics = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if we already have an entry for today
  const existingEntry = this.historicalMetrics.find(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });
  
  if (!existingEntry) {
    this.historicalMetrics.push({
      date: today,
      applications: this.performanceMetrics.totalApplications,
      responses: this.performanceMetrics.totalResponses,
      responseRate: this.performanceMetrics.responseRate,
      interviews: this.performanceMetrics.interviewRequests,
      offers: this.performanceMetrics.offers
    });
    
    // Keep only last 90 days
    if (this.historicalMetrics.length > 90) {
      this.historicalMetrics = this.historicalMetrics.slice(-90);
    }
  }
};

// UC-62: Add virtual properties for easier access to nested metrics
coverLetterAnalyticsSchema.virtual('totalApplications').get(function() {
  return this.performanceMetrics?.totalApplications || 0;
});

coverLetterAnalyticsSchema.virtual('responseRate').get(function() {
  return this.performanceMetrics?.responseRate || 0;
});

coverLetterAnalyticsSchema.virtual('interviewCount').get(function() {
  return this.performanceMetrics?.interviewRequests || 0;
});

coverLetterAnalyticsSchema.virtual('interviewRate').get(function() {
  return this.performanceMetrics?.interviewRate || 0;
});

coverLetterAnalyticsSchema.virtual('offerCount').get(function() {
  return this.performanceMetrics?.offers || 0;
});

coverLetterAnalyticsSchema.virtual('offerRate').get(function() {
  return this.performanceMetrics?.offerRate || 0;
});

// Enable virtuals in JSON output
coverLetterAnalyticsSchema.set('toJSON', { virtuals: true });
coverLetterAnalyticsSchema.set('toObject', { virtuals: true });

export const CoverLetterAnalytics = mongoose.model("CoverLetterAnalytics", coverLetterAnalyticsSchema);
