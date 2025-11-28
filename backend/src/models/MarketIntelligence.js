import mongoose from "mongoose";

const marketIntelligenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    // Industry and location preferences for tracking
    preferences: {
      industries: [
        {
          type: String,
          enum: [
            "Technology",
            "Healthcare",
            "Finance",
            "Education",
            "Manufacturing",
            "Retail",
            "Marketing",
            "Consulting",
            "Other",
          ],
        },
      ],
      locations: [String],
      jobTitles: [String],
      skillsOfInterest: [String],
    },
    // Job market trends
    jobMarketTrends: [
      {
        industry: String,
        location: String,
        trendData: [
          {
            month: Date,
            jobPostings: Number,
            averageSalary: Number,
            competitionLevel: {
              type: String,
              enum: ["Low", "Medium", "High", "Very High"],
            },
            demandScore: {
              type: Number,
              min: 0,
              max: 100,
            },
          },
        ],
        insights: String,
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Skill demand evolution
    skillDemand: [
      {
        skillName: String,
        category: {
          type: String,
          enum: [
            "Programming Language",
            "Framework",
            "Tool",
            "Soft Skill",
            "Domain Knowledge",
            "Certification",
            "Other",
          ],
        },
        demandTrend: {
          type: String,
          enum: ["Rising", "Stable", "Declining"],
        },
        growthRate: Number, // Percentage growth over last period
        currentDemand: {
          type: Number,
          min: 0,
          max: 100,
        },
        projectedDemand: {
          type: Number,
          min: 0,
          max: 100,
        },
        relatedSkills: [String],
        averageSalaryImpact: Number, // Percentage salary increase
        topIndustries: [String],
        emergingTechnology: {
          type: Boolean,
          default: false,
        },
        learningResources: [
          {
            title: String,
            type: {
              type: String,
              enum: ["Course", "Certification", "Book", "Tutorial", "Workshop"],
            },
            url: String,
            provider: String,
            estimatedTime: String,
            difficulty: {
              type: String,
              enum: ["Beginner", "Intermediate", "Advanced"],
            },
          },
        ],
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Salary trends and compensation evolution
    salaryTrends: [
      {
        jobTitle: String,
        industry: String,
        location: String,
        experienceLevel: {
          type: String,
          enum: ["Entry Level", "Mid Level", "Senior", "Lead", "Executive"],
        },
        salaryData: [
          {
            period: Date,
            min: Number,
            median: Number,
            max: Number,
            currency: {
              type: String,
              default: "USD",
            },
          },
        ],
        compensationBreakdown: {
          baseSalary: Number,
          bonus: Number,
          stockOptions: Number,
          benefits: Number,
        },
        growthRate: Number, // Year-over-year percentage change
        marketPosition: {
          type: String,
          enum: ["Below Market", "Market Rate", "Above Market", "Top Tier"],
        },
        factors: [
          {
            factor: String,
            impact: {
              type: String,
              enum: ["Negative", "Neutral", "Positive", "Significant"],
            },
            description: String,
          },
        ],
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Company growth patterns and hiring activity
    companyGrowth: [
      {
        companyName: String,
        industry: String,
        size: String,
        growthMetrics: {
          revenueGrowth: Number,
          employeeGrowth: Number,
          fundingRounds: [
            {
              round: String,
              amount: Number,
              date: Date,
              investors: [String],
            },
          ],
          marketShare: Number,
        },
        hiringActivity: {
          openPositions: Number,
          hiringTrend: {
            type: String,
            enum: ["Aggressive", "Steady", "Slow", "Frozen", "Layoffs"],
          },
          topRoles: [String],
          averageTimeToHire: Number, // Days
          competitiveness: {
            type: String,
            enum: ["Low", "Medium", "High", "Very High"],
          },
        },
        companyHealth: {
          rating: {
            type: Number,
            min: 0,
            max: 10,
          },
          indicators: [
            {
              metric: String,
              value: String,
              trend: {
                type: String,
                enum: ["Improving", "Stable", "Declining"],
              },
            },
          ],
        },
        recentNews: [
          {
            title: String,
            date: Date,
            summary: String,
            sentiment: {
              type: String,
              enum: ["Positive", "Neutral", "Negative"],
            },
          },
        ],
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Industry disruption insights
    industryInsights: [
      {
        industry: String,
        disruptionLevel: {
          type: String,
          enum: ["Low", "Medium", "High", "Critical"],
        },
        disruptors: [
          {
            type: {
              type: String,
              enum: [
                "Technology",
                "Regulation",
                "Market Shift",
                "Competition",
                "Economic",
                "Social",
              ],
            },
            description: String,
            impact: {
              type: String,
              enum: ["Minor", "Moderate", "Major", "Transformative"],
            },
            timeline: String,
          },
        ],
        emergingOpportunities: [
          {
            opportunity: String,
            description: String,
            requiredSkills: [String],
            potentialValue: {
              type: String,
              enum: ["Low", "Medium", "High", "Very High"],
            },
          },
        ],
        futureOutlook: {
          timeframe: String, // "1-2 years", "3-5 years", "5+ years"
          prediction: String,
          confidence: {
            type: String,
            enum: ["Low", "Medium", "High"],
          },
          keyFactors: [String],
        },
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Personalized recommendations
    recommendations: [
      {
        type: {
          type: String,
          enum: [
            "Skill Development",
            "Career Positioning",
            "Market Opportunity",
            "Timing Optimization",
            "Industry Shift",
            "Networking",
            "Certification",
            "Location Move",
          ],
        },
        priority: {
          type: String,
          enum: ["Low", "Medium", "High", "Critical"],
        },
        title: String,
        description: String,
        rationale: String,
        actionItems: [
          {
            action: String,
            timeframe: String,
            difficulty: {
              type: String,
              enum: ["Easy", "Moderate", "Challenging", "Difficult"],
            },
            estimatedImpact: {
              type: String,
              enum: ["Low", "Medium", "High", "Very High"],
            },
            resources: [String],
          },
        ],
        expectedOutcome: String,
        successMetrics: [String],
        deadline: Date,
        status: {
          type: String,
          enum: ["New", "In Progress", "Completed", "Dismissed"],
          default: "New",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Market opportunity tracking
    marketOpportunities: [
      {
        title: String,
        description: String,
        industry: String,
        location: String,
        opportunityType: {
          type: String,
          enum: [
            "Job Market Expansion",
            "Skill Gap",
            "Industry Growth",
            "Company Hiring Spree",
            "Emerging Technology",
            "Geographic Shift",
          ],
        },
        timing: {
          optimal: Date,
          window: String, // "Next 3 months", "Q2 2024", etc.
          urgency: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
          },
        },
        requirements: {
          skills: [String],
          experience: String,
          education: String,
          certifications: [String],
        },
        competitiveAdvantage: [String],
        estimatedValue: {
          salaryRange: {
            min: Number,
            max: Number,
          },
          growthPotential: {
            type: String,
            enum: ["Low", "Medium", "High", "Very High"],
          },
          marketDemand: {
            type: String,
            enum: ["Low", "Medium", "High", "Very High"],
          },
        },
        risks: [
          {
            risk: String,
            severity: {
              type: String,
              enum: ["Low", "Medium", "High"],
            },
            mitigation: String,
          },
        ],
        actionPlan: [String],
        tracked: {
          type: Boolean,
          default: true,
        },
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Competitive landscape analysis
    competitiveLandscape: {
      targetRoles: [
        {
          title: String,
          industry: String,
          averageApplicants: Number,
          successRate: Number, // Percentage
          differentiators: [String],
          commonRequirements: [String],
          competitiveEdge: [
            {
              factor: String,
              importance: {
                type: String,
                enum: ["Low", "Medium", "High", "Critical"],
              },
              userStrength: {
                type: String,
                enum: ["Weak", "Average", "Strong", "Excellent"],
              },
              improvementSuggestions: [String],
            },
          ],
        },
      ],
      marketPosition: {
        overallRanking: {
          type: String,
          enum: ["Bottom 25%", "Below Average", "Average", "Above Average", "Top 25%", "Top 10%"],
        },
        strengths: [String],
        weaknesses: [String],
        opportunities: [String],
        threats: [String],
      },
      benchmarking: [
        {
          metric: String,
          userValue: mongoose.Schema.Types.Mixed,
          marketAverage: mongoose.Schema.Types.Mixed,
          topPerformers: mongoose.Schema.Types.Mixed,
          gap: String,
        },
      ],
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    // Analytics and tracking
    analytics: {
      dataQuality: {
        type: String,
        enum: ["Limited", "Fair", "Good", "Excellent"],
        default: "Fair",
      },
      lastFullUpdate: Date,
      updateFrequency: {
        type: String,
        enum: ["Daily", "Weekly", "Bi-weekly", "Monthly"],
        default: "Weekly",
      },
      dataPoints: Number,
      coverage: {
        industries: Number,
        locations: Number,
        skills: Number,
        companies: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
marketIntelligenceSchema.index({ userId: 1 });
marketIntelligenceSchema.index({ "preferences.industries": 1 });
marketIntelligenceSchema.index({ "preferences.locations": 1 });
marketIntelligenceSchema.index({ "recommendations.status": 1 });
marketIntelligenceSchema.index({ "recommendations.priority": 1 });

// Method to get trending skills
marketIntelligenceSchema.methods.getTrendingSkills = function (limit = 10) {
  return this.skillDemand
    .filter((skill) => skill.demandTrend === "Rising")
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, limit);
};

// Method to get high-priority recommendations
marketIntelligenceSchema.methods.getPriorityRecommendations = function () {
  return this.recommendations
    .filter((rec) => rec.status !== "Completed" && rec.status !== "Dismissed")
    .filter((rec) => rec.priority === "High" || rec.priority === "Critical")
    .sort((a, b) => {
      const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
};

// Method to get market opportunities by urgency
marketIntelligenceSchema.methods.getUrgentOpportunities = function () {
  return this.marketOpportunities
    .filter((opp) => opp.tracked)
    .filter((opp) => opp.timing.urgency === "High" || opp.timing.urgency === "Critical")
    .sort((a, b) => {
      const urgencyOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return urgencyOrder[a.timing.urgency] - urgencyOrder[b.timing.urgency];
    });
};

// Ensure virtuals are included in JSON
marketIntelligenceSchema.set("toJSON", { virtuals: true });
marketIntelligenceSchema.set("toObject", { virtuals: true });

export const MarketIntelligence = mongoose.model("MarketIntelligence", marketIntelligenceSchema);
