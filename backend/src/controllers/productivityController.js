import TimeTracking from '../models/TimeTracking.js';
import ProductivityAnalysis from '../models/ProductivityAnalysis.js';
import Goal from '../models/Goal.js';
import { User } from '../models/User.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI lazily to avoid errors when API key is missing
let genAI = null;
function getGenAI() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Get or create time tracking record for a specific date
 * GET /api/productivity/time-tracking/:date
 */
export const getTimeTrackingByDate = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { date } = req.params;

    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);

    let record = await TimeTracking.findOne({ userId, date: recordDate })
      .populate('entries.linkedEntities.jobId', 'title company')
      .populate('entries.linkedEntities.applicationId', 'jobTitle company')
      .populate('entries.linkedEntities.goalId', 'title');

    if (!record) {
      record = await TimeTracking.findOneAndUpdate(
        { userId, date: recordDate },
        { userId, date: recordDate, entries: [] },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json({
      success: true,
      record
    });
  } catch (error) {
    console.error('Get Time Tracking Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time tracking record',
      error: error.message
    });
  }
};

/**
 * Get time tracking records for a date range
 * GET /api/productivity/time-tracking
 */
export const getTimeTrackingRange = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const records = await TimeTracking.find({
      userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    res.json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    console.error('Get Time Tracking Range Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time tracking records',
      error: error.message
    });
  }
};

/**
 * Add a time entry to a specific date
 * POST /api/productivity/time-tracking/:date/entries
 */
export const addTimeEntry = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { date } = req.params;
    const entryData = req.body;

    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);

    let record = await TimeTracking.findOne({ userId, date: recordDate });

    if (!record) {
      record = new TimeTracking({
        userId,
        date: recordDate,
        entries: []
      });
    }

    await record.addEntry(entryData);

    res.status(201).json({
      success: true,
      message: 'Time entry added successfully',
      record
    });
  } catch (error) {
    console.error('Add Time Entry Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add time entry',
      error: error.message
    });
  }
};

/**
 * Update a time entry
 * PUT /api/productivity/time-tracking/:date/entries/:entryId
 */
export const updateTimeEntry = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { date, entryId } = req.params;
    const updateData = req.body;

    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);

    const record = await TimeTracking.findOne({ userId, date: recordDate });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Time tracking record not found'
      });
    }

    await record.updateEntry(entryId, updateData);

    res.json({
      success: true,
      message: 'Time entry updated successfully',
      record
    });
  } catch (error) {
    console.error('Update Time Entry Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update time entry',
      error: error.message
    });
  }
};

/**
 * Delete a time entry
 * DELETE /api/productivity/time-tracking/:date/entries/:entryId
 */
export const deleteTimeEntry = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { date, entryId } = req.params;

    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);

    const record = await TimeTracking.findOne({ userId, date: recordDate });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Time tracking record not found'
      });
    }

    await record.deleteEntry(entryId);

    res.json({
      success: true,
      message: 'Time entry deleted successfully',
      record
    });
  } catch (error) {
    console.error('Delete Time Entry Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete time entry',
      error: error.message
    });
  }
};

/**
 * Get time statistics for a period
 * GET /api/productivity/stats
 */
export const getTimeStats = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const stats = await TimeTracking.getUserTimeStats(userId, start, end);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get Time Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time statistics',
      error: error.message
    });
  }
};

/**
 * Generate productivity analysis for a period
 * POST /api/productivity/analysis
 */
export const generateProductivityAnalysis = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { startDate, endDate, periodType = 'Custom' } = req.body;

    console.log('Generate Analysis Request:', { userId, startDate, endDate, periodType });

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    console.log('Generating analysis for period:', start, 'to', end);

    const analysis = await ProductivityAnalysis.generateAnalysis(
      userId,
      start,
      end,
      periodType
    );

    console.log('Analysis generated successfully');

    const user = await User.findOne({ auth0Id: userId });
    const activeGoals = await Goal.find({
      userId,
      status: { $in: ['Not Started', 'In Progress', 'On Track', 'At Risk'] }
    });

    console.log('Generating AI recommendations...');

    const aiRecommendations = await generateProductivityRecommendations(
      analysis,
      user,
      activeGoals
    );

    if (aiRecommendations && aiRecommendations.length > 0) {
      analysis.recommendations = aiRecommendations;
      await analysis.save();
    }

    console.log('Analysis complete with recommendations');

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Generate Productivity Analysis Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate productivity analysis',
      error: error.message
    });
  }
};

/**
 * Get existing productivity analysis
 * GET /api/productivity/analysis/:id
 */
export const getProductivityAnalysis = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const analysis = await ProductivityAnalysis.findOne({ _id: id, userId });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Productivity analysis not found'
      });
    }

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Get Productivity Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch productivity analysis',
      error: error.message
    });
  }
};

/**
 * Get all analyses for a user
 * GET /api/productivity/analyses
 */
export const getUserAnalyses = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { periodType, limit = 10 } = req.query;

    const filter = { userId };
    if (periodType) {
      filter['period.type'] = periodType;
    }

    const analyses = await ProductivityAnalysis.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: analyses.length,
      analyses
    });
  } catch (error) {
    console.error('Get User Analyses Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analyses',
      error: error.message
    });
  }
};

/**
 * Get productivity dashboard summary
 * GET /api/productivity/dashboard
 */
export const getProductivityDashboard = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const todayRecord = await TimeTracking.findOne({ userId, date: today });

    const weekStats = await TimeTracking.getUserTimeStats(userId, weekAgo, today);

    const monthStats = await TimeTracking.getUserTimeStats(userId, monthAgo, today);

    const recentAnalyses = await ProductivityAnalysis.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3);

    const activeGoals = await Goal.find({
      userId,
      status: { $in: ['Not Started', 'In Progress', 'On Track', 'At Risk'] }
    }).select('title category progressPercentage daysRemaining');

    const currentEntry = todayRecord?.entries.find(e => !e.endTime);

    res.json({
      success: true,
      dashboard: {
        today: {
          record: todayRecord,
          currentEntry,
          hasActiveEntry: !!currentEntry
        },
        weekStats,
        monthStats,
        recentAnalyses,
        activeGoals: activeGoals.slice(0, 5),
        quickStats: {
          todayHours: todayRecord?.dailySummary?.totalHours || 0,
          weekHours: weekStats.totalHours,
          monthHours: monthStats.totalHours,
          weekProductivity: weekStats.averageProductivity,
          monthProductivity: monthStats.averageProductivity
        }
      }
    });
  } catch (error) {
    console.error('Get Productivity Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch productivity dashboard',
      error: error.message
    });
  }
};

/**
 * Get productivity insights with AI
 * POST /api/productivity/insights
 */
export const getProductivityInsights = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const stats = await TimeTracking.getUserTimeStats(userId, start, end);
    const user = await User.findOne({ auth0Id: userId });

    const insights = await generateProductivityInsights(stats, user);

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Get Productivity Insights Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate productivity insights',
      error: error.message
    });
  }
};

/**
 * Get optimal schedule recommendations
 * GET /api/productivity/optimal-schedule
 */
export const getOptimalSchedule = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const stats = await TimeTracking.getUserTimeStats(userId, thirtyDaysAgo, today);

    if (stats.records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Not enough data to generate optimal schedule. Track your time for at least a week.'
      });
    }

    const user = await User.findOne({ auth0Id: userId });
    const activeGoals = await Goal.find({
      userId,
      status: { $in: ['Not Started', 'In Progress', 'On Track', 'At Risk'] }
    });

    const schedule = await generateOptimalSchedule(stats, user, activeGoals);

    res.json({
      success: true,
      schedule
    });
  } catch (error) {
    console.error('Get Optimal Schedule Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate optimal schedule',
      error: error.message
    });
  }
};

/**
 * Compare productivity across time periods
 * POST /api/productivity/compare
 */
export const compareProductivity = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { period1Start, period1End, period2Start, period2End } = req.body;

    if (!period1Start || !period1End || !period2Start || !period2End) {
      return res.status(400).json({
        success: false,
        message: 'All period dates are required'
      });
    }

    const p1Start = new Date(period1Start);
    p1Start.setHours(0, 0, 0, 0);
    const p1End = new Date(period1End);
    p1End.setHours(23, 59, 59, 999);

    const p2Start = new Date(period2Start);
    p2Start.setHours(0, 0, 0, 0);
    const p2End = new Date(period2End);
    p2End.setHours(23, 59, 59, 999);

    const period1Stats = await TimeTracking.getUserTimeStats(userId, p1Start, p1End);
    const period2Stats = await TimeTracking.getUserTimeStats(userId, p2Start, p2End);

    const comparison = {
      period1: {
        dates: { start: p1Start, end: p1End },
        stats: period1Stats
      },
      period2: {
        dates: { start: p2Start, end: p2End },
        stats: period2Stats
      },
      changes: {
        hoursChange: +(period2Stats.totalHours - period1Stats.totalHours).toFixed(2),
        hoursChangePercentage: period1Stats.totalHours > 0
          ? +((((period2Stats.totalHours - period1Stats.totalHours) / period1Stats.totalHours) * 100).toFixed(1))
          : 0,
        productivityChange: +(period2Stats.averageProductivity - period1Stats.averageProductivity).toFixed(2),
        outcomesChange: period2Stats.totalOutcomes - period1Stats.totalOutcomes,
        outcomesChangePercentage: period1Stats.totalOutcomes > 0
          ? +((((period2Stats.totalOutcomes - period1Stats.totalOutcomes) / period1Stats.totalOutcomes) * 100).toFixed(1))
          : 0,
        trend: period2Stats.averageProductivity > period1Stats.averageProductivity
          ? 'Improving'
          : period2Stats.averageProductivity < period1Stats.averageProductivity
            ? 'Declining'
            : 'Stable'
      }
    };

    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    console.error('Compare Productivity Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare productivity',
      error: error.message
    });
  }
};

/**
 * Helper function to generate AI-powered productivity recommendations
 */
async function generateProductivityRecommendations(analysis, user, goals) {
  try {
    const ai = getGenAI();
    if (!ai) return null;
    const model = ai.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    const prompt = `You are an expert productivity coach specializing in job search optimization. Analyze the following productivity data and provide actionable recommendations.

**PRODUCTIVITY ANALYSIS:**
- Total Hours: ${analysis.timeInvestment.totalHours}
- Productive Hours: ${analysis.timeInvestment.productiveHours}
- Average Productivity: ${analysis.productivityMetrics.averageProductivity}/10
- Peak Productivity Time: ${analysis.productivityMetrics.peakProductivityTime?.label || 'Not available'}
- Efficiency Rating: ${analysis.productivityMetrics.efficiencyRating}
- Burnout Risk: ${analysis.burnoutIndicators.riskLevel}
- Average Daily Hours: ${analysis.burnoutIndicators.averageDailyHours}
- Consecutive Days Worked: ${analysis.burnoutIndicators.consecutiveDaysWorked}

**TOP ACTIVITIES:**
${analysis.timeInvestment.topActivities.map(a => `- ${a.activity}: ${a.hours} hours (${a.percentage}%)`).join('\n')}

**ACTIVE GOALS:**
${goals.map(g => `- ${g.title} (${g.category}): ${g.progressPercentage}% complete, ${g.daysRemaining} days remaining`).join('\n')}

**WARNINGS:**
${analysis.burnoutIndicators.warnings.map(w => `- [${w.severity}] ${w.message}`).join('\n') || 'None'}

Generate 5-8 specific, actionable recommendations to optimize productivity, prevent burnout, and improve job search outcomes. Focus on:
1. Time allocation optimization
2. Schedule adjustments based on peak performance times
3. Burnout prevention strategies
4. Activity balance recommendations
5. Goal alignment suggestions
6. Work-life balance improvements

Return ONLY valid JSON with this structure:
{
  "recommendations": [
    {
      "category": "Time Allocation|Schedule Optimization|Energy Management|Efficiency|Burnout Prevention|Work-Life Balance",
      "priority": "Low|Medium|High|Critical",
      "title": "Brief recommendation title",
      "description": "Detailed explanation of the recommendation",
      "expectedImpact": "Low|Medium|High",
      "actionItems": ["Specific action 1", "Specific action 2", ...]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return data.recommendations || [];
    }

    return [];
  } catch (error) {
    console.error('Generate Recommendations Error:', error);
    return [];
  }
}

/**
 * Helper function to generate productivity insights
 */
async function generateProductivityInsights(stats, user) {
  try {
    const ai = getGenAI();
    if (!ai) return null;
    const model = ai.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    const prompt = `You are an expert productivity analyst. Analyze the following time tracking data and provide key insights.

**TIME STATISTICS:**
- Total Hours: ${stats.totalHours}
- Productive Hours: ${stats.productiveHours}
- Average Hours Per Day: ${stats.averageHoursPerDay}
- Average Productivity: ${stats.averageProductivity}/10
- Total Outcomes: ${stats.totalOutcomes}
- Days Tracked: ${stats.daysTracked}

**ACTIVITY BREAKDOWN:**
${Object.entries(stats.activityTotals || {}).map(([activity, minutes]) =>
      `- ${activity}: ${(minutes / 60).toFixed(1)} hours`
    ).join('\n')}

Generate 4-6 key insights about productivity patterns, strengths, and areas for improvement.

Return ONLY valid JSON with this structure:
{
  "insights": [
    {
      "type": "Pattern|Achievement|Opportunity|Warning|Trend",
      "title": "Brief insight title",
      "description": "Detailed explanation of the insight",
      "data": {}
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return data.insights || [];
    }

    return [];
  } catch (error) {
    console.error('Generate Insights Error:', error);
    return [];
  }
}

/**
 * Helper function to generate optimal schedule
 */
async function generateOptimalSchedule(stats, user, goals) {
  try {
    const ai = getGenAI();
    if (!ai) return null;
    const model = ai.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    const activityBreakdown = Object.entries(stats.activityTotals || {})
      .map(([activity, minutes]) => `- ${activity}: ${(minutes / 60).toFixed(1)} hours`)
      .join('\n');

    const prompt = `You are an expert productivity coach. Based on the historical performance data, create an optimal daily schedule for job search activities.

**HISTORICAL DATA:**
- Total Hours: ${stats.totalHours}
- Average Hours Per Day: ${stats.averageHoursPerDay}
- Average Productivity: ${stats.averageProductivity}/10

**ACTIVITY HISTORY:**
${activityBreakdown}

**ACTIVE GOALS:**
${goals.map(g => `- ${g.title} (${g.category})`).join('\n')}

Create an optimal daily schedule that:
1. Aligns with peak productivity times
2. Balances different job search activities
3. Includes appropriate breaks
4. Supports active goals
5. Prevents burnout

Return ONLY valid JSON with this structure:
{
  "schedule": {
    "recommendedDailyHours": 6,
    "timeBlocks": [
      {
        "startTime": "09:00",
        "endTime": "10:30",
        "activity": "Resume Writing",
        "duration": 90,
        "rationale": "Why this time is optimal"
      }
    ],
    "breakSchedule": {
      "frequency": "Every 90 minutes",
      "duration": 15,
      "recommendations": ["Take a walk", "Stretch"]
    },
    "weeklyPattern": {
      "workDays": 5,
      "restDays": 2,
      "intensiveDays": ["Monday", "Wednesday"],
      "lightDays": ["Friday"]
    },
    "tips": ["Tip 1", "Tip 2"]
  }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return data.schedule || null;
    }

    return null;
  } catch (error) {
    console.error('Generate Optimal Schedule Error:', error);
    return null;
  }
}
