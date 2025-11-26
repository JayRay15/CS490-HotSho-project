import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema({
  activity: {
    type: String,
    required: true,
    enum: [
      'Job Search',
      'Resume Writing',
      'Cover Letter Writing',
      'Application Submission',
      'Networking',
      'Skill Development',
      'Interview Preparation',
      'Mock Interviews',
      'Company Research',
      'Portfolio Work',
      'LinkedIn Activity',
      'Follow-ups',
      'Career Planning',
      'Break',
      'Other'
    ]
  },
  customActivity: {
    type: String,
    trim: true,
    maxlength: 100
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  energyLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Peak'],
    default: 'Medium'
  },
  focusQuality: {
    type: String,
    enum: ['Poor', 'Fair', 'Good', 'Excellent'],
    default: 'Good'
  },
  distractions: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  linkedEntities: {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApplicationStatus'
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal'
    }
  },
  productivity: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  outcomes: [{
    type: {
      type: String,
      enum: ['Application Sent', 'Connection Made', 'Skill Learned', 'Interview Scheduled', 'Milestone Completed', 'Other']
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200
    }
  }]
}, { timestamps: true });

const timeTrackingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  entries: [timeEntrySchema],
  dailySummary: {
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
    averageEnergy: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Peak']
    },
    averageFocus: {
      type: String,
      enum: ['Poor', 'Fair', 'Good', 'Excellent']
    },
    averageProductivity: {
      type: Number,
      min: 1,
      max: 10
    },
    totalOutcomes: {
      type: Number,
      default: 0
    },
    activityBreakdown: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  peakPerformanceTimes: [{
    startHour: Number,
    endHour: Number,
    averageProductivity: Number
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

timeTrackingSchema.index({ userId: 1, date: 1 }, { unique: true });

timeTrackingSchema.methods.calculateDailySummary = function() {
  const completedEntries = this.entries.filter(e => e.endTime);
  
  if (completedEntries.length === 0) {
    return;
  }

  let totalMinutes = 0;
  let productiveMinutes = 0;
  let breakMinutes = 0;
  let totalEnergy = 0;
  let totalFocus = 0;
  let totalProductivity = 0;
  let totalOutcomes = 0;
  const activityBreakdown = {};

  const energyMap = { Low: 1, Medium: 2, High: 3, Peak: 4 };
  const focusMap = { Poor: 1, Fair: 2, Good: 3, Excellent: 4 };

  completedEntries.forEach(entry => {
    const duration = entry.duration || 0;
    totalMinutes += duration;

    if (entry.activity === 'Break') {
      breakMinutes += duration;
    } else {
      productiveMinutes += duration;
    }

    totalEnergy += energyMap[entry.energyLevel] || 2;
    totalFocus += focusMap[entry.focusQuality] || 3;
    totalProductivity += entry.productivity || 5;
    totalOutcomes += entry.outcomes?.length || 0;

    const activityKey = entry.activity === 'Other' && entry.customActivity 
      ? entry.customActivity 
      : entry.activity;
    activityBreakdown[activityKey] = (activityBreakdown[activityKey] || 0) + duration;
  });

  const count = completedEntries.length;
  const avgEnergy = Math.round(totalEnergy / count);
  const avgFocus = Math.round(totalFocus / count);

  const energyLabels = ['', 'Low', 'Medium', 'High', 'Peak'];
  const focusLabels = ['', 'Poor', 'Fair', 'Good', 'Excellent'];

  this.dailySummary = {
    totalHours: +(totalMinutes / 60).toFixed(2),
    productiveHours: +(productiveMinutes / 60).toFixed(2),
    breakHours: +(breakMinutes / 60).toFixed(2),
    averageEnergy: energyLabels[avgEnergy],
    averageFocus: focusLabels[avgFocus],
    averageProductivity: +(totalProductivity / count).toFixed(1),
    totalOutcomes,
    activityBreakdown: new Map(Object.entries(activityBreakdown))
  };
};

timeTrackingSchema.methods.addEntry = function(entryData) {
  const entry = entryData;
  
  if (entry.endTime && entry.startTime) {
    const duration = (new Date(entry.endTime) - new Date(entry.startTime)) / (1000 * 60);
    entry.duration = Math.round(duration);
  }

  this.entries.push(entry);
  this.calculateDailySummary();
  return this.save();
};

timeTrackingSchema.methods.updateEntry = function(entryId, updateData) {
  const entry = this.entries.id(entryId);
  if (!entry) {
    throw new Error('Entry not found');
  }

  Object.keys(updateData).forEach(key => {
    entry[key] = updateData[key];
  });

  if (entry.endTime && entry.startTime) {
    const duration = (new Date(entry.endTime) - new Date(entry.startTime)) / (1000 * 60);
    entry.duration = Math.round(duration);
  }

  this.calculateDailySummary();
  return this.save();
};

timeTrackingSchema.methods.deleteEntry = function(entryId) {
  this.entries.pull(entryId);
  this.calculateDailySummary();
  return this.save();
};

timeTrackingSchema.statics.getUserTimeStats = async function(userId, startDate, endDate) {
  const records = await this.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  let totalHours = 0;
  let productiveHours = 0;
  let totalDays = records.length;
  const activityTotals = {};
  let totalProductivity = 0;
  let totalOutcomes = 0;

  records.forEach(record => {
    if (record.dailySummary) {
      totalHours += record.dailySummary.totalHours || 0;
      productiveHours += record.dailySummary.productiveHours || 0;
      totalProductivity += (record.dailySummary.averageProductivity || 0) * (record.dailySummary.totalHours || 0);
      totalOutcomes += record.dailySummary.totalOutcomes || 0;

      if (record.dailySummary.activityBreakdown) {
        record.dailySummary.activityBreakdown.forEach((minutes, activity) => {
          activityTotals[activity] = (activityTotals[activity] || 0) + minutes;
        });
      }
    }
  });

  return {
    totalHours: +totalHours.toFixed(2),
    productiveHours: +productiveHours.toFixed(2),
    averageHoursPerDay: totalDays > 0 ? +(totalHours / totalDays).toFixed(2) : 0,
    averageProductivity: totalHours > 0 ? +(totalProductivity / totalHours).toFixed(1) : 0,
    totalOutcomes,
    activityTotals,
    daysTracked: totalDays,
    records
  };
};

const TimeTracking = mongoose.model('TimeTracking', timeTrackingSchema);

export default TimeTracking;
