import mongoose from 'mongoose';

const TeamBenchmarkSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly'],
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  
  // Team Aggregate Metrics
  teamMetrics: {
    totalApplications: { type: Number, default: 0 },
    totalInterviews: { type: Number, default: 0 },
    totalOffers: { type: Number, default: 0 },
    averageResponseRate: { type: Number, default: 0 },
    averageTimeToOffer: { type: Number, default: 0 }, // days
    activeMembers: { type: Number, default: 0 },
    topPerformers: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score: Number,
      highlights: [String]
    }]
  },
  
  // Member Performance Data
  memberBenchmarks: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    metrics: {
      applications: { type: Number, default: 0 },
      interviews: { type: Number, default: 0 },
      offers: { type: Number, default: 0 },
      responseRate: { type: Number, default: 0 },
      averageInterviewScore: { type: Number, default: 0 },
      applicationsPerWeek: { type: Number, default: 0 },
      interviewConversionRate: { type: Number, default: 0 },
      offerConversionRate: { type: Number, default: 0 }
    },
    rank: Number,
    percentile: Number,
    trend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      default: 'stable'
    },
    comparison: {
      vsTeamAverage: Number, // percentage above/below team average
      vsLastPeriod: Number   // percentage change from last period
    }
  }],
  
  // Industry/Role Benchmarks (mock data for demo)
  industryBenchmarks: {
    averageApplicationsToInterview: { type: Number, default: 15 },
    averageInterviewsToOffer: { type: Number, default: 5 },
    averageTimeToOffer: { type: Number, default: 45 }, // days
    topPerformerThreshold: { type: Number, default: 90 } // percentile
  },
  
  // Insights & Recommendations
  insights: [{
    type: {
      type: String,
      enum: ['strength', 'improvement', 'trend', 'milestone'],
      required: true
    },
    title: String,
    description: String,
    metric: String,
    value: mongoose.Schema.Types.Mixed,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  
  generatedAt: {
    type: Date,
    default: Date.now
  },
  
  status: {
    type: String,
    enum: ['generating', 'complete', 'error'],
    default: 'complete'
  }
}, { 
  timestamps: true 
});

// Compound index for efficient queries
TeamBenchmarkSchema.index({ teamId: 1, period: 1, periodStart: -1 });

// Static method to generate benchmark for a period
TeamBenchmarkSchema.statics.generateBenchmark = async function(teamId, period = 'weekly') {
  const Team = mongoose.model('Team');
  const User = mongoose.model('User');
  const Job = mongoose.model('Job');
  const Application = mongoose.model('Application');
  
  // Calculate period dates
  const now = new Date();
  let periodStart, periodEnd;
  
  switch (period) {
    case 'weekly':
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
      periodEnd = now;
      break;
    case 'monthly':
      periodStart = new Date(now);
      periodStart.setMonth(now.getMonth() - 1);
      periodEnd = now;
      break;
    case 'quarterly':
      periodStart = new Date(now);
      periodStart.setMonth(now.getMonth() - 3);
      periodEnd = now;
      break;
  }
  
  // Get team members
  const team = await Team.findById(teamId).populate('members.userId');
  if (!team) throw new Error('Team not found');
  
  const memberIds = team.members
    .filter(m => m.status === 'active')
    .map(m => m.userId._id || m.userId);
  
  const memberBenchmarks = [];
  let totalApps = 0, totalInterviews = 0, totalOffers = 0;
  
  // Calculate metrics for each member
  for (const memberId of memberIds) {
    // Get jobs and calculate metrics (simplified for demo)
    const jobs = await Job.find({
      userId: memberId,
      createdAt: { $gte: periodStart, $lte: periodEnd }
    });
    
    const applications = jobs.filter(j => j.status !== 'Interested').length;
    const interviews = jobs.filter(j => ['Interview', 'Phone Screen'].includes(j.status)).length;
    const offers = jobs.filter(j => j.status === 'Offer').length;
    
    totalApps += applications;
    totalInterviews += interviews;
    totalOffers += offers;
    
    memberBenchmarks.push({
      userId: memberId,
      metrics: {
        applications,
        interviews,
        offers,
        responseRate: applications > 0 ? Math.round((interviews / applications) * 100) : 0,
        interviewConversionRate: applications > 0 ? Math.round((interviews / applications) * 100) : 0,
        offerConversionRate: interviews > 0 ? Math.round((offers / interviews) * 100) : 0,
        applicationsPerWeek: period === 'weekly' ? applications : Math.round(applications / (period === 'monthly' ? 4 : 13))
      }
    });
  }
  
  // Calculate ranks and percentiles
  memberBenchmarks.sort((a, b) => {
    const scoreA = a.metrics.applications * 1 + a.metrics.interviews * 3 + a.metrics.offers * 10;
    const scoreB = b.metrics.applications * 1 + b.metrics.interviews * 3 + b.metrics.offers * 10;
    return scoreB - scoreA;
  });
  
  memberBenchmarks.forEach((mb, idx) => {
    mb.rank = idx + 1;
    mb.percentile = Math.round(((memberBenchmarks.length - idx) / memberBenchmarks.length) * 100);
    
    const avgApps = totalApps / memberIds.length;
    mb.comparison = {
      vsTeamAverage: avgApps > 0 
        ? Math.round(((mb.metrics.applications - avgApps) / avgApps) * 100)
        : 0,
      vsLastPeriod: 0 // Would need historical data
    };
  });
  
  // Generate insights
  const insights = [];
  
  if (totalApps > 0) {
    insights.push({
      type: 'trend',
      title: 'Team Activity',
      description: `Team submitted ${totalApps} applications this ${period}`,
      metric: 'applications',
      value: totalApps,
      priority: 'medium'
    });
  }
  
  if (totalInterviews > 0) {
    insights.push({
      type: 'strength',
      title: 'Interview Progress',
      description: `${totalInterviews} interviews scheduled - great momentum!`,
      metric: 'interviews',
      value: totalInterviews,
      priority: 'high'
    });
  }
  
  if (totalOffers > 0) {
    insights.push({
      type: 'milestone',
      title: 'Offers Received',
      description: `Congratulations! ${totalOffers} offer(s) received this period`,
      metric: 'offers',
      value: totalOffers,
      priority: 'high'
    });
  }
  
  // Create or update benchmark
  const benchmark = await this.findOneAndUpdate(
    { teamId, period, periodStart: { $gte: periodStart } },
    {
      teamId,
      period,
      periodStart,
      periodEnd,
      teamMetrics: {
        totalApplications: totalApps,
        totalInterviews,
        totalOffers,
        averageResponseRate: totalApps > 0 ? Math.round((totalInterviews / totalApps) * 100) : 0,
        activeMembers: memberIds.length,
        topPerformers: memberBenchmarks.slice(0, 3).map(mb => ({
          userId: mb.userId,
          score: mb.metrics.applications + mb.metrics.interviews * 3 + mb.metrics.offers * 10,
          highlights: []
        }))
      },
      memberBenchmarks,
      insights,
      generatedAt: new Date(),
      status: 'complete'
    },
    { upsert: true, new: true }
  );
  
  return benchmark;
};

export default mongoose.model('TeamBenchmark', TeamBenchmarkSchema);
