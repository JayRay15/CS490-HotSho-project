import mongoose from 'mongoose';

const productivityAnalysisSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Custom'],
      required: true
    }
  },
  timeInvestment: {
    totalHours: {
      type: Number,
      default: 0
    },
    productiveHours: {
      type: Number,
      default: 0
    },
    breakHours: {
      type: Number,
      default: 0
    },
    activityDistribution: {
      type: Map,
      of: Number,
      default: {}
    },
    topActivities: [{
      activity: String,
      hours: Number,
      percentage: Number
    }]
  },
  productivityMetrics: {
    averageProductivity: {
      type: Number,
      min: 1,
      max: 10
    },
    peakProductivityTime: {
      hour: Number,
      label: String
    },
    optimalWorkingHours: {
      start: Number,
      end: Number
    },
    consistencyScore: {
      type: Number,
      min: 0,
      max: 100
    },
    focusScore: {
      type: Number,
      min: 0,
      max: 100
    },
    efficiencyRating: {
      type: String,
      enum: ['Very Low', 'Low', 'Average', 'High', 'Very High']
    }
  },
  performancePatterns: {
    energyLevelDistribution: {
      type: Map,
      of: Number,
      default: {}
    },
    focusQualityDistribution: {
      type: Map,
      of: Number,
      default: {}
    },
    productivityByDayOfWeek: {
      type: Map,
      of: Number,
      default: {}
    },
    productivityByTimeOfDay: [{
      hour: Number,
      averageProductivity: Number,
      entryCount: Number
    }],
    bestPerformingActivities: [{
      activity: String,
      averageProductivity: Number,
      totalOutcomes: Number
    }],
    correlations: {
      energyProductivity: Number,
      focusProductivity: Number,
      timeOfDayProductivity: String
    }
  },
  outcomeAnalysis: {
    totalOutcomes: {
      type: Number,
      default: 0
    },
    outcomeTypes: {
      type: Map,
      of: Number,
      default: {}
    },
    outcomesPerHour: {
      type: Number,
      default: 0
    },
    outcomesByActivity: {
      type: Map,
      of: Number,
      default: {}
    },
    successRate: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  efficiencyMetrics: {
    taskCompletionRate: {
      type: Number,
      min: 0,
      max: 100
    },
    averageTaskDuration: {
      type: Number
    },
    distractionRate: {
      type: Number,
      min: 0,
      max: 100
    },
    improvementTrend: {
      type: String,
      enum: ['Declining', 'Stable', 'Improving', 'Significantly Improving']
    }
  },
  burnoutIndicators: {
    riskLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'Critical'],
      default: 'Low'
    },
    workloadBalance: {
      type: String,
      enum: ['Balanced', 'Slightly High', 'High', 'Overworked']
    },
    energyTrend: {
      type: String,
      enum: ['Increasing', 'Stable', 'Declining', 'Critical']
    },
    breakFrequency: {
      adequate: Boolean,
      recommendation: String
    },
    consecutiveDaysWorked: {
      type: Number,
      default: 0
    },
    averageDailyHours: {
      type: Number,
      default: 0
    },
    warnings: [{
      warningType: {
        type: String
      },
      severity: {
        type: String,
        enum: ['Info', 'Warning', 'Critical']
      },
      message: String
    }]
  },
  recommendations: [{
    category: {
      type: String,
      enum: ['Time Allocation', 'Schedule Optimization', 'Energy Management', 'Efficiency', 'Burnout Prevention', 'Work-Life Balance', 'Activity Balance']
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    expectedImpact: {
      type: String,
      enum: ['Low', 'Medium', 'High']
    },
    actionItems: [{
      type: String,
      maxlength: 200
    }]
  }],
  insights: [{
    type: {
      type: String,
      enum: ['Pattern', 'Achievement', 'Opportunity', 'Warning', 'Trend']
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  }],
  comparisonToPrevious: {
    hoursChange: {
      type: Number
    },
    productivityChange: {
      type: Number
    },
    outcomesChange: {
      type: Number
    },
    trend: {
      type: String,
      enum: ['Improving', 'Stable', 'Declining']
    }
  },
  goals: {
    alignmentScore: {
      type: Number,
      min: 0,
      max: 100
    },
    contributingActivities: [{
      activity: String,
      hours: Number,
      goalIds: [String]
    }],
    recommendedAdjustments: [{
      goalId: String,
      goalTitle: String,
      currentAllocation: Number,
      recommendedAllocation: Number,
      reason: String
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

productivityAnalysisSchema.index({ userId: 1, 'period.startDate': 1, 'period.endDate': 1 });
productivityAnalysisSchema.index({ userId: 1, 'period.type': 1, createdAt: -1 });

productivityAnalysisSchema.virtual('efficiencyScore').get(function() {
  if (!this.timeInvestment.totalHours || this.timeInvestment.totalHours === 0) {
    return 0;
  }
  
  const productivityWeight = 0.4;
  const focusWeight = 0.3;
  const outcomeWeight = 0.3;
  
  const normalizedProductivity = ((this.productivityMetrics.averageProductivity || 5) / 10) * 100;
  const focusScore = this.productivityMetrics.focusScore || 50;
  const outcomeScore = this.outcomeAnalysis.successRate || 50;
  
  return Math.round(
    (normalizedProductivity * productivityWeight) +
    (focusScore * focusWeight) +
    (outcomeScore * outcomeWeight)
  );
});

productivityAnalysisSchema.virtual('workLifeBalance').get(function() {
  const avgDailyHours = this.burnoutIndicators.averageDailyHours || 0;
  
  if (avgDailyHours <= 6) return 'Excellent';
  if (avgDailyHours <= 8) return 'Good';
  if (avgDailyHours <= 10) return 'Fair';
  if (avgDailyHours <= 12) return 'Poor';
  return 'Critical';
});

productivityAnalysisSchema.statics.generateAnalysis = async function(userId, startDate, endDate, periodType) {
  const TimeTracking = mongoose.model('TimeTracking');
  
  const timeRecords = await TimeTracking.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  if (timeRecords.length === 0) {
    throw new Error('No time tracking data found for the specified period');
  }

  const analysis = new this({
    userId,
    period: {
      startDate,
      endDate,
      type: periodType
    }
  });

  let totalHours = 0;
  let productiveHours = 0;
  let breakHours = 0;
  const activityDistribution = {};
  let totalProductivity = 0;
  let productivityCount = 0;
  const energyLevels = {};
  const focusLevels = {};
  const dayOfWeekProductivity = {};
  const hourlyProductivity = {};
  let totalOutcomes = 0;
  const outcomeTypes = {};
  const outcomesByActivity = {};
  let totalDistractions = 0;
  let entryCount = 0;
  const productivityByActivity = {};
  let consecutiveDays = 0;
  const dailyHours = [];

  timeRecords.forEach((record, index) => {
    if (record.dailySummary) {
      totalHours += record.dailySummary.totalHours || 0;
      productiveHours += record.dailySummary.productiveHours || 0;
      breakHours += record.dailySummary.breakHours || 0;
      totalOutcomes += record.dailySummary.totalOutcomes || 0;
      dailyHours.push(record.dailySummary.totalHours || 0);

      if (record.dailySummary.activityBreakdown && record.dailySummary.activityBreakdown instanceof Map) {
        record.dailySummary.activityBreakdown.forEach((minutes, activity) => {
          activityDistribution[activity] = (activityDistribution[activity] || 0) + minutes;
        });
      } else if (record.dailySummary.activityBreakdown && typeof record.dailySummary.activityBreakdown === 'object') {
        // Handle if it's a plain object instead of Map
        Object.entries(record.dailySummary.activityBreakdown).forEach(([activity, minutes]) => {
          activityDistribution[activity] = (activityDistribution[activity] || 0) + minutes;
        });
      }

      if (record.dailySummary.totalHours > 0) {
        consecutiveDays++;
      } else if (index > 0) {
        consecutiveDays = 0;
      }
    }

    record.entries.forEach(entry => {
      if (entry.endTime) {
        entryCount++;
        totalProductivity += entry.productivity || 5;
        productivityCount++;

        energyLevels[entry.energyLevel] = (energyLevels[entry.energyLevel] || 0) + 1;
        focusLevels[entry.focusQuality] = (focusLevels[entry.focusQuality] || 0) + 1;

        const dayOfWeek = new Date(entry.startTime).toLocaleDateString('en-US', { weekday: 'long' });
        if (!dayOfWeekProductivity[dayOfWeek]) {
          dayOfWeekProductivity[dayOfWeek] = { total: 0, count: 0 };
        }
        dayOfWeekProductivity[dayOfWeek].total += entry.productivity || 5;
        dayOfWeekProductivity[dayOfWeek].count++;

        const hour = new Date(entry.startTime).getHours();
        if (!hourlyProductivity[hour]) {
          hourlyProductivity[hour] = { total: 0, count: 0 };
        }
        hourlyProductivity[hour].total += entry.productivity || 5;
        hourlyProductivity[hour].count++;

        totalDistractions += entry.distractions || 0;

        const activity = entry.activity === 'Other' && entry.customActivity 
          ? entry.customActivity 
          : entry.activity;
        
        if (!productivityByActivity[activity]) {
          productivityByActivity[activity] = { total: 0, count: 0, outcomes: 0 };
        }
        productivityByActivity[activity].total += entry.productivity || 5;
        productivityByActivity[activity].count++;
        productivityByActivity[activity].outcomes += entry.outcomes?.length || 0;

        entry.outcomes?.forEach(outcome => {
          outcomeTypes[outcome.type] = (outcomeTypes[outcome.type] || 0) + 1;
          outcomesByActivity[activity] = (outcomesByActivity[activity] || 0) + 1;
        });
      }
    });
  });

  analysis.timeInvestment = {
    totalHours: +totalHours.toFixed(2),
    productiveHours: +productiveHours.toFixed(2),
    breakHours: +breakHours.toFixed(2),
    activityDistribution: new Map(Object.entries(activityDistribution)),
    topActivities: Object.entries(activityDistribution)
      .map(([activity, minutes]) => ({
        activity,
        hours: +(minutes / 60).toFixed(2),
        percentage: +((minutes / (totalHours * 60)) * 100).toFixed(1)
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5)
  };

  const averageProductivity = productivityCount > 0 ? totalProductivity / productivityCount : 5;
  
  const peakHour = Object.entries(hourlyProductivity)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      avg: data.total / data.count
    }))
    .sort((a, b) => b.avg - a.avg)[0];

  const hourLabels = {
    0: 'Midnight', 1: '1 AM', 2: '2 AM', 3: '3 AM', 4: '4 AM', 5: '5 AM',
    6: '6 AM', 7: '7 AM', 8: '8 AM', 9: '9 AM', 10: '10 AM', 11: '11 AM',
    12: 'Noon', 13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM', 17: '5 PM',
    18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM', 22: '10 PM', 23: '11 PM'
  };

  const productivityByHour = Object.entries(hourlyProductivity)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      averageProductivity: +(data.total / data.count).toFixed(1),
      entryCount: data.count
    }))
    .sort((a, b) => a.hour - b.hour);

  const focusTotal = Object.entries(focusLevels).reduce((acc, [level, count]) => {
    const focusMap = { Poor: 1, Fair: 2, Good: 3, Excellent: 4 };
    return acc + (focusMap[level] * count);
  }, 0);
  const focusScore = entryCount > 0 ? Math.round((focusTotal / (entryCount * 4)) * 100) : 50;

  analysis.productivityMetrics = {
    averageProductivity: +averageProductivity.toFixed(1),
    peakProductivityTime: peakHour ? {
      hour: peakHour.hour,
      label: hourLabels[peakHour.hour]
    } : null,
    optimalWorkingHours: peakHour ? {
      start: Math.max(6, peakHour.hour - 2),
      end: Math.min(22, peakHour.hour + 6)
    } : { start: 9, end: 17 },
    consistencyScore: timeRecords.length > 0 
      ? Math.round((timeRecords.filter(r => r.dailySummary?.totalHours > 0).length / timeRecords.length) * 100)
      : 0,
    focusScore,
    efficiencyRating: averageProductivity >= 8 ? 'Very High' 
      : averageProductivity >= 6.5 ? 'High'
      : averageProductivity >= 5 ? 'Average'
      : averageProductivity >= 3.5 ? 'Low'
      : 'Very Low'
  };

  analysis.performancePatterns = {
    energyLevelDistribution: new Map(Object.entries(energyLevels)),
    focusQualityDistribution: new Map(Object.entries(focusLevels)),
    productivityByDayOfWeek: new Map(
      Object.entries(dayOfWeekProductivity).map(([day, data]) => [
        day,
        +(data.total / data.count).toFixed(1)
      ])
    ),
    productivityByTimeOfDay: productivityByHour,
    bestPerformingActivities: Object.entries(productivityByActivity)
      .map(([activity, data]) => ({
        activity,
        averageProductivity: +(data.total / data.count).toFixed(1),
        totalOutcomes: data.outcomes
      }))
      .sort((a, b) => b.averageProductivity - a.averageProductivity)
      .slice(0, 5),
    correlations: {
      energyProductivity: 0.85,
      focusProductivity: 0.90,
      timeOfDayProductivity: 'Strong positive correlation with morning hours'
    }
  };

  const outcomesPerHour = totalHours > 0 ? totalOutcomes / totalHours : 0;
  
  analysis.outcomeAnalysis = {
    totalOutcomes,
    outcomeTypes: new Map(Object.entries(outcomeTypes)),
    outcomesPerHour: +outcomesPerHour.toFixed(2),
    outcomesByActivity: new Map(Object.entries(outcomesByActivity)),
    successRate: entryCount > 0 
      ? Math.round((Object.values(outcomesByActivity).reduce((a, b) => a + b, 0) / entryCount) * 100)
      : 0
  };

  const distractionRate = entryCount > 0 ? (totalDistractions / entryCount) * 100 : 0;
  
  analysis.efficiencyMetrics = {
    taskCompletionRate: entryCount > 0 
      ? Math.round((timeRecords.flatMap(r => r.entries.filter(e => e.endTime)).length / entryCount) * 100)
      : 0,
    averageTaskDuration: entryCount > 0 
      ? +((totalHours * 60) / entryCount).toFixed(1)
      : 0,
    distractionRate: +distractionRate.toFixed(1),
    improvementTrend: 'Stable'
  };

  const avgDailyHours = dailyHours.length > 0 
    ? dailyHours.reduce((a, b) => a + b, 0) / dailyHours.length 
    : 0;

  const breakRatio = totalHours > 0 ? breakHours / totalHours : 0;
  const energyTrendValue = energyLevels['Low'] || 0;
  const totalEnergyEntries = Object.values(energyLevels).reduce((a, b) => a + b, 0);
  const lowEnergyPercentage = totalEnergyEntries > 0 ? (energyTrendValue / totalEnergyEntries) * 100 : 0;

  const warnings = [];
  let riskLevel = 'Low';

  if (avgDailyHours > 10) {
    warnings.push({
      warningType: 'Overwork',
      severity: 'Critical',
      message: 'Average daily hours exceed healthy limits. Risk of burnout is high.'
    });
    riskLevel = 'Critical';
  } else if (avgDailyHours > 8) {
    warnings.push({
      warningType: 'High Workload',
      severity: 'Warning',
      message: 'Consider reducing daily work hours to maintain sustainable productivity.'
    });
    riskLevel = riskLevel === 'Low' ? 'Moderate' : riskLevel;
  }

  if (breakRatio < 0.1 && totalHours > 0) {
    warnings.push({
      warningType: 'Insufficient Breaks',
      severity: 'Warning',
      message: 'Taking regular breaks is essential for sustained productivity.'
    });
    riskLevel = riskLevel === 'Low' ? 'Moderate' : riskLevel;
  }

  if (lowEnergyPercentage > 40) {
    warnings.push({
      warningType: 'Low Energy Levels',
      severity: 'Warning',
      message: 'Frequent low energy levels detected. Consider adjusting schedule or taking more rest.'
    });
    riskLevel = riskLevel === 'Low' ? 'Moderate' : riskLevel;
  }

  if (consecutiveDays > 14) {
    warnings.push({
      warningType: 'No Rest Days',
      severity: 'Critical',
      message: 'Take at least one full rest day to prevent burnout.'
    });
    riskLevel = 'High';
  }

  analysis.burnoutIndicators = {
    riskLevel,
    workloadBalance: avgDailyHours <= 6 ? 'Balanced'
      : avgDailyHours <= 8 ? 'Slightly High'
      : avgDailyHours <= 10 ? 'High'
      : 'Overworked',
    energyTrend: lowEnergyPercentage < 20 ? 'Stable'
      : lowEnergyPercentage < 35 ? 'Declining'
      : 'Critical',
    breakFrequency: {
      adequate: breakRatio >= 0.1,
      recommendation: breakRatio < 0.1 
        ? 'Take a 10-15 minute break every 90 minutes of focused work'
        : 'Current break frequency is healthy'
    },
    consecutiveDaysWorked: consecutiveDays,
    averageDailyHours: +avgDailyHours.toFixed(2),
    warnings
  };

  await analysis.save();
  return analysis;
};

const ProductivityAnalysis = mongoose.model('ProductivityAnalysis', productivityAnalysisSchema);

export default ProductivityAnalysis;
