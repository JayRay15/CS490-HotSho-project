import TeamBenchmark from '../models/TeamBenchmark.js';
import { Team, TeamMember } from '../models/Team.js';

// Get team benchmarks
const getTeamBenchmarks = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { period = 'weekly' } = req.query;
    const userId = req.auth?.userId;

    // Verify user is team member
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const isMember = team.members.some(m => 
      (m.userId?.toString() === userId || m.clerkId === userId) && m.status === 'active'
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view team benchmarks' });
    }

    // Get or generate benchmark
    let benchmark = await TeamBenchmark.findOne({
      teamId,
      period,
      generatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
    }).populate('memberBenchmarks.userId', 'firstName lastName email')
      .populate('teamMetrics.topPerformers.userId', 'firstName lastName email');

    if (!benchmark) {
      // Generate new benchmark
      benchmark = await TeamBenchmark.generateBenchmark(teamId, period);
      await benchmark.populate('memberBenchmarks.userId', 'firstName lastName email');
      await benchmark.populate('teamMetrics.topPerformers.userId', 'firstName lastName email');
    }

    res.json({ benchmark });
  } catch (error) {
    console.error('Error getting team benchmarks:', error);
    res.status(500).json({ message: 'Error getting team benchmarks', error: error.message });
  }
};

// Generate fresh benchmark
const generateBenchmark = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { period = 'weekly' } = req.body;
    const userId = req.auth?.userId;

    // Verify user is team admin/leader
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const member = team.members.find(m => 
      (m.userId?.toString() === userId || m.clerkId === userId) && m.status === 'active'
    );

    if (!member || !['admin', 'leader'].includes(member.role)) {
      return res.status(403).json({ message: 'Only team admins can generate benchmarks' });
    }

    const benchmark = await TeamBenchmark.generateBenchmark(teamId, period);
    await benchmark.populate('memberBenchmarks.userId', 'firstName lastName email');
    await benchmark.populate('teamMetrics.topPerformers.userId', 'firstName lastName email');

    res.json({ 
      message: 'Benchmark generated successfully',
      benchmark 
    });
  } catch (error) {
    console.error('Error generating benchmark:', error);
    res.status(500).json({ message: 'Error generating benchmark', error: error.message });
  }
};

// Get benchmark history
const getBenchmarkHistory = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { period = 'weekly', limit = 12 } = req.query;
    const userId = req.auth?.userId;

    // Verify user is team member
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const isMember = team.members.some(m => 
      (m.userId?.toString() === userId || m.clerkId === userId) && m.status === 'active'
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view team benchmarks' });
    }

    const benchmarks = await TeamBenchmark.find({
      teamId,
      period,
      status: 'complete'
    })
      .sort({ periodStart: -1 })
      .limit(parseInt(limit))
      .select('periodStart periodEnd teamMetrics.totalApplications teamMetrics.totalInterviews teamMetrics.totalOffers teamMetrics.activeMembers');

    res.json({ benchmarks });
  } catch (error) {
    console.error('Error getting benchmark history:', error);
    res.status(500).json({ message: 'Error getting benchmark history', error: error.message });
  }
};

// Get member's personal benchmark within team context
const getMemberBenchmark = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const { period = 'weekly' } = req.query;
    const userId = req.auth?.userId;

    // Verify user is team member
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const isMember = team.members.some(m => 
      (m.userId?.toString() === userId || m.clerkId === userId) && m.status === 'active'
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view team benchmarks' });
    }

    // Get latest benchmark
    let benchmark = await TeamBenchmark.findOne({
      teamId,
      period,
      status: 'complete'
    }).sort({ periodStart: -1 });

    if (!benchmark) {
      benchmark = await TeamBenchmark.generateBenchmark(teamId, period);
    }

    // Find member's benchmark data
    const memberBenchmark = benchmark.memberBenchmarks.find(
      mb => mb.userId.toString() === memberId
    );

    if (!memberBenchmark) {
      return res.status(404).json({ message: 'Member benchmark not found' });
    }

    res.json({
      member: memberBenchmark,
      teamAverages: {
        applications: benchmark.teamMetrics.totalApplications / benchmark.teamMetrics.activeMembers,
        interviews: benchmark.teamMetrics.totalInterviews / benchmark.teamMetrics.activeMembers,
        offers: benchmark.teamMetrics.totalOffers / benchmark.teamMetrics.activeMembers,
        responseRate: benchmark.teamMetrics.averageResponseRate
      },
      industryBenchmarks: benchmark.industryBenchmarks,
      period: benchmark.period,
      periodStart: benchmark.periodStart,
      periodEnd: benchmark.periodEnd
    });
  } catch (error) {
    console.error('Error getting member benchmark:', error);
    res.status(500).json({ message: 'Error getting member benchmark', error: error.message });
  }
};

// Get leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { period = 'weekly', metric = 'overall' } = req.query;
    const userId = req.auth?.userId;

    // Verify user is team member
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const isMember = team.members.some(m => 
      (m.userId?.toString() === userId || m.clerkId === userId) && m.status === 'active'
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view team leaderboard' });
    }

    // Get latest benchmark
    let benchmark = await TeamBenchmark.findOne({
      teamId,
      period,
      status: 'complete'
    })
      .sort({ periodStart: -1 })
      .populate('memberBenchmarks.userId', 'firstName lastName email');

    if (!benchmark) {
      benchmark = await TeamBenchmark.generateBenchmark(teamId, period);
      await benchmark.populate('memberBenchmarks.userId', 'firstName lastName email');
    }

    // Sort by requested metric
    let sortedMembers = [...benchmark.memberBenchmarks];
    
    switch (metric) {
      case 'applications':
        sortedMembers.sort((a, b) => b.metrics.applications - a.metrics.applications);
        break;
      case 'interviews':
        sortedMembers.sort((a, b) => b.metrics.interviews - a.metrics.interviews);
        break;
      case 'offers':
        sortedMembers.sort((a, b) => b.metrics.offers - a.metrics.offers);
        break;
      case 'responseRate':
        sortedMembers.sort((a, b) => b.metrics.responseRate - a.metrics.responseRate);
        break;
      default:
        // Overall score (already sorted by rank)
        break;
    }

    // Update ranks based on sort
    sortedMembers = sortedMembers.map((member, idx) => ({
      ...member.toObject(),
      rank: idx + 1
    }));

    res.json({
      leaderboard: sortedMembers,
      period: benchmark.period,
      periodStart: benchmark.periodStart,
      periodEnd: benchmark.periodEnd,
      metric
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ message: 'Error getting leaderboard', error: error.message });
  }
};

export {
  getTeamBenchmarks,
  generateBenchmark,
  getBenchmarkHistory,
  getMemberBenchmark,
  getLeaderboard
};
