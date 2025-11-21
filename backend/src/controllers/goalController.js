import Goal from '../models/Goal.js';
import { User } from '../models/User.js';
import { ApplicationStatus } from '../models/ApplicationStatus.js';
import { Job } from '../models/Job.js';
import {
  generateGoalRecommendations,
  analyzeGoalProgress,
  generateAchievementCelebration,
  identifySuccessPatterns
} from '../utils/geminiService.js';

/**
 * Get all goals for a user with filtering and sorting
 * GET /api/goals
 */
export const getGoals = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const {
      status,
      category,
      type,
      priority,
      sortBy = 'createdAt',
      order = 'desc',
      includeCompleted = 'true'
    } = req.query;

    // Build filter
    const filter = { userId };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    
    // Exclude completed goals if requested
    if (includeCompleted === 'false') {
      filter.status = { $ne: 'Completed' };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'asc' ? 1 : -1;

    const goals = await Goal.find(filter)
      .sort(sort)
      .populate('relatedJobs', 'title company')
      .populate('relatedApplications', 'jobTitle company status');

    res.json({
      success: true,
      count: goals.length,
      goals
    });
  } catch (error) {
    console.error('Get Goals Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch goals',
      error: error.message
    });
  }
};

/**
 * Get a single goal by ID
 * GET /api/goals/:id
 */
export const getGoalById = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const goal = await Goal.findOne({ _id: id, userId })
      .populate('relatedJobs', 'title company description')
      .populate('relatedApplications', 'jobTitle company status appliedDate');

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.json({
      success: true,
      goal
    });
  } catch (error) {
    console.error('Get Goal By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch goal',
      error: error.message
    });
  }
};

/**
 * Create a new goal
 * POST /api/goals
 */
export const createGoal = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const goalData = {
      ...req.body,
      userId
    };

    // Validate required SMART criteria
    if (!goalData.title || !goalData.description || !goalData.specific ||
        !goalData.measurable || !goalData.achievable || !goalData.relevant ||
        !goalData.timeBound) {
      return res.status(400).json({
        success: false,
        message: 'All SMART criteria fields are required'
      });
    }

    const goal = new Goal(goalData);
    await goal.save();

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      goal
    });
  } catch (error) {
    console.error('Create Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create goal',
      error: error.message
    });
  }
};

/**
 * Update a goal
 * PUT /api/goals/:id
 */
export const updateGoal = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'userId' && key !== '_id') {
        goal[key] = req.body[key];
      }
    });

    await goal.save();

    res.json({
      success: true,
      message: 'Goal updated successfully',
      goal
    });
  } catch (error) {
    console.error('Update Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update goal',
      error: error.message
    });
  }
};

/**
 * Delete a goal
 * DELETE /api/goals/:id
 */
export const deleteGoal = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const goal = await Goal.findOneAndDelete({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete goal',
      error: error.message
    });
  }
};

/**
 * Add progress update to a goal
 * POST /api/goals/:id/progress
 */
export const addProgressUpdate = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;
    const { value, notes, metrics } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: 'Progress value is required'
      });
    }

    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    await goal.addProgressUpdate(value, notes, metrics);

    res.json({
      success: true,
      message: 'Progress updated successfully',
      goal
    });
  } catch (error) {
    console.error('Add Progress Update Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add progress update',
      error: error.message
    });
  }
};

/**
 * Complete a milestone
 * POST /api/goals/:id/milestones/:milestoneId/complete
 */
export const completeMilestone = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id, milestoneId } = req.params;

    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    await goal.completeMilestone(milestoneId);

    res.json({
      success: true,
      message: 'Milestone completed successfully',
      goal
    });
  } catch (error) {
    console.error('Complete Milestone Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete milestone',
      error: error.message
    });
  }
};

/**
 * Get user goal statistics
 * GET /api/goals/stats
 */
export const getGoalStats = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const stats = await Goal.getUserStats(userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get Goal Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch goal statistics',
      error: error.message
    });
  }
};

/**
 * Generate AI-powered goal recommendations
 * POST /api/goals/recommendations
 */
export const getGoalRecommendations = async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Fetch user profile
    const user = await User.findOne({ auth0Id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Get current goals
    const currentGoals = await Goal.find({ userId, status: { $in: ['Not Started', 'In Progress', 'On Track', 'At Risk'] } });

    // Get job search data
    const applications = await ApplicationStatus.find({ userId });
    const jobSearchData = {
      totalApplications: applications.length,
      totalInterviews: applications.filter(a => ['Interview Scheduled', 'Interview Completed'].includes(a.status)).length,
      totalOffers: applications.filter(a => a.status === 'Offer Received').length,
      responseRate: applications.length > 0 
        ? Math.round((applications.filter(a => a.status !== 'Applied' && a.status !== 'Not Applied').length / applications.length) * 100)
        : 0
    };

    const recommendations = await generateGoalRecommendations(user, currentGoals, jobSearchData);

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Get Goal Recommendations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate goal recommendations',
      error: error.message
    });
  }
};

/**
 * Analyze goal progress with AI
 * POST /api/goals/:id/analyze
 */
export const analyzeGoal = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Fetch user profile for context
    const user = await User.findOne({ auth0Id: userId });

    const analysis = await analyzeGoalProgress(goal, user);

    // Store insights in the goal
    if (analysis.progressAssessment) {
      await goal.addInsight('Progress', analysis.progressAssessment.summary);
    }
    if (analysis.riskAnalysis) {
      await goal.addInsight('Risk', `Risk Level: ${analysis.riskAnalysis.riskLevel}`, {
        risks: analysis.riskAnalysis.identifiedRisks
      });
    }

    // Add recommendations
    if (analysis.adjustments && Array.isArray(analysis.adjustments)) {
      for (const adj of analysis.adjustments.filter(a => a.priority === 'High')) {
        await goal.addRecommendation('Adjustment', adj.recommendation, adj.rationale, adj.priority);
      }
    }

    res.json({
      success: true,
      analysis,
      goal
    });
  } catch (error) {
    console.error('Analyze Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze goal',
      error: error.message
    });
  }
};

/**
 * Celebrate goal achievement
 * POST /api/goals/:id/celebrate
 */
export const celebrateGoal = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    if (goal.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Goal must be completed to celebrate'
      });
    }

    // Get user profile and all goals for context
    const user = await User.findOne({ auth0Id: userId });
    const allGoals = await Goal.find({ userId });

    const celebration = await generateAchievementCelebration(goal, user, allGoals);

    // Mark as celebrated
    goal.celebrated = true;
    goal.celebrationDate = new Date();
    await goal.save();

    res.json({
      success: true,
      celebration,
      goal
    });
  } catch (error) {
    console.error('Celebrate Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate celebration',
      error: error.message
    });
  }
};

/**
 * Identify success patterns across goals
 * GET /api/goals/patterns
 */
export const getSuccessPatterns = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const goals = await Goal.find({ userId });
    if (goals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Not enough goals to analyze patterns. Create at least 3 goals first.'
      });
    }

    const user = await User.findOne({ auth0Id: userId });
    const patterns = await identifySuccessPatterns(goals, user);

    res.json({
      success: true,
      patterns
    });
  } catch (error) {
    console.error('Get Success Patterns Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to identify success patterns',
      error: error.message
    });
  }
};

/**
 * Link goal to jobs or applications
 * POST /api/goals/:id/link
 */
export const linkGoalToEntities = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;
    const { jobIds = [], applicationIds = [] } = req.body;

    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Add unique job IDs
    if (jobIds.length > 0) {
      const uniqueJobIds = [...new Set([...goal.relatedJobs.map(j => j.toString()), ...jobIds])];
      goal.relatedJobs = uniqueJobIds;
    }

    // Add unique application IDs
    if (applicationIds.length > 0) {
      const uniqueAppIds = [...new Set([...goal.relatedApplications.map(a => a.toString()), ...applicationIds])];
      goal.relatedApplications = uniqueAppIds;
    }

    await goal.save();

    res.json({
      success: true,
      message: 'Goal linked successfully',
      goal
    });
  } catch (error) {
    console.error('Link Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link goal',
      error: error.message
    });
  }
};

/**
 * Update goal impact metrics
 * POST /api/goals/:id/impact
 */
export const updateImpactMetrics = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;
    const { impactMetrics } = req.body;

    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Update impact metrics
    if (impactMetrics) {
      Object.keys(impactMetrics).forEach(key => {
        if (goal.impactMetrics[key] !== undefined) {
          goal.impactMetrics[key] = impactMetrics[key];
        } else if (key === 'customMetrics') {
          goal.impactMetrics.customMetrics = new Map(Object.entries(impactMetrics.customMetrics));
        }
      });
    }

    await goal.save();

    res.json({
      success: true,
      message: 'Impact metrics updated successfully',
      goal
    });
  } catch (error) {
    console.error('Update Impact Metrics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update impact metrics',
      error: error.message
    });
  }
};

/**
 * Get dashboard summary
 * GET /api/goals/dashboard
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Get all goals
    const goals = await Goal.find({ userId });
    
    // Calculate statistics
    const stats = await Goal.getUserStats(userId);
    
    // Get active goals
    const activeGoals = goals.filter(g => 
      ['Not Started', 'In Progress', 'On Track', 'At Risk'].includes(g.status)
    ).slice(0, 5);
    
    // Get recently completed goals
    const recentCompletions = goals
      .filter(g => g.status === 'Completed')
      .sort((a, b) => new Date(b.timeBound.completedDate) - new Date(a.timeBound.completedDate))
      .slice(0, 5);
    
    // Get at-risk goals
    const atRiskGoals = goals.filter(g => g.status === 'At Risk');
    
    // Get upcoming milestones
    const upcomingMilestones = [];
    goals.forEach(goal => {
      goal.milestones
        .filter(m => !m.completed && new Date(m.targetDate) > new Date())
        .forEach(m => {
          upcomingMilestones.push({
            goalId: goal._id,
            goalTitle: goal.title,
            milestoneId: m._id,
            milestoneTitle: m.title,
            targetDate: m.targetDate
          });
        });
    });
    upcomingMilestones.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
    
    // Calculate aggregate impact
    const totalImpact = goals.reduce((acc, goal) => {
      acc.jobApplications += goal.impactMetrics?.jobApplications || 0;
      acc.interviewsSecured += goal.impactMetrics?.interviewsSecured || 0;
      acc.offersReceived += goal.impactMetrics?.offersReceived || 0;
      acc.skillsAcquired += goal.impactMetrics?.skillsAcquired || 0;
      acc.connectionsGained += goal.impactMetrics?.connectionsGained || 0;
      return acc;
    }, {
      jobApplications: 0,
      interviewsSecured: 0,
      offersReceived: 0,
      skillsAcquired: 0,
      connectionsGained: 0
    });

    res.json({
      success: true,
      dashboard: {
        stats,
        activeGoals,
        recentCompletions,
        atRiskGoals,
        upcomingMilestones: upcomingMilestones.slice(0, 10),
        totalImpact
      }
    });
  } catch (error) {
    console.error('Get Dashboard Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: error.message
    });
  }
};
