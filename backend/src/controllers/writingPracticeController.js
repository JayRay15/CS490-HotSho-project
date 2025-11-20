import { BehavioralQuestion, PracticeSession, PerformanceTracking } from '../models/WritingPractice.js';
import { analyzeInterviewResponse, generateBehavioralQuestion } from '../utils/responseAnalysisService.js';

// Get behavioral questions with optional filters - now generates them dynamically
export const getBehavioralQuestions = async (req, res) => {
  try {
    const { category, difficulty, role, industry, limit = 1, skip = 0, random = false } = req.query;
    
    // Generate questions dynamically using AI
    const generatedQuestions = await generateBehavioralQuestion({
      category: category || 'General',
      difficulty: difficulty || 'Mid-Level',
      role: role || 'General',
      industry: industry || 'General',
      count: parseInt(limit)
    });
    
    // Optionally save generated questions to database for future reference
    const savedQuestions = [];
    for (const questionData of generatedQuestions) {
      // Check if similar question already exists
      const existing = await BehavioralQuestion.findOne({
        question: questionData.question
      });
      
      if (!existing) {
        const question = new BehavioralQuestion(questionData);
        await question.save();
        savedQuestions.push(question);
      } else {
        savedQuestions.push(existing);
      }
    }
    
    res.json({ 
      questions: savedQuestions,
      total: savedQuestions.length 
    });
  } catch (error) {
    console.error('Error generating behavioral questions:', error);
    res.status(500).json({ message: 'Failed to generate questions', error: error.message });
  }
};

// Get a specific behavioral question
export const getBehavioralQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await BehavioralQuestion.findById(id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Error fetching behavioral question:', error);
    res.status(500).json({ message: 'Failed to fetch question' });
  }
};

// Create a new practice session
export const createPracticeSession = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { sessionType, targetRole, targetCompany, targetIndustry, sessionGoal, questionIds } = req.body;
    
    const session = new PracticeSession({
      userId,
      sessionType: sessionType || 'Individual Question',
      targetRole,
      targetCompany,
      targetIndustry,
      sessionGoal,
      responses: []
    });
    
    await session.save();
    
    // Optionally populate with questions if provided
    let questions = [];
    if (questionIds && questionIds.length > 0) {
      questions = await BehavioralQuestion.find({ _id: { $in: questionIds } });
    }
    
    res.json({ 
      session,
      questions
    });
  } catch (error) {
    console.error('Error creating practice session:', error);
    res.status(500).json({ message: 'Failed to create practice session' });
  }
};

// Get user's practice sessions
export const getPracticeSessions = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { completed, limit = 20, skip = 0 } = req.query;
    
    const query = { userId };
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }
    
    const sessions = await PracticeSession.find(query)
      .populate('responses.questionId')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });
    
    const total = await PracticeSession.countDocuments(query);
    
    res.json({ sessions, total });
  } catch (error) {
    console.error('Error fetching practice sessions:', error);
    res.status(500).json({ message: 'Failed to fetch practice sessions' });
  }
};

// Get a specific practice session
export const getPracticeSession = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;
    
    const session = await PracticeSession.findOne({ _id: id, userId })
      .populate('responses.questionId');
    
    if (!session) {
      return res.status(404).json({ message: 'Practice session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching practice session:', error);
    res.status(500).json({ message: 'Failed to fetch practice session' });
  }
};

// Submit a response to a question in a session
export const submitResponse = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { sessionId, questionId } = req.params;
    const { response, timeSpent } = req.body;
    
    if (!response || response.trim().length === 0) {
      return res.status(400).json({ message: 'Response cannot be empty' });
    }
    
    if (!timeSpent) {
      return res.status(400).json({ message: 'Time spent is required' });
    }
    
    // Find session
    const session = await PracticeSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ message: 'Practice session not found' });
    }
    
    // Find question
    const question = await BehavioralQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Analyze response using AI
    const feedback = await analyzeInterviewResponse(response, question);
    
    // Calculate word count
    const wordCount = response.trim().split(/\s+/).length;
    const completedWithinTimeLimit = timeSpent <= (question.timeLimit * 60); // Convert minutes to seconds
    
    // Add response to session
    const responseSubmission = {
      questionId,
      response,
      timeSpent,
      wordCount,
      completedWithinTimeLimit,
      feedback,
      submittedAt: new Date()
    };
    
    session.responses.push(responseSubmission);
    session.totalTimeSpent = (session.totalTimeSpent || 0) + timeSpent;
    await session.save();
    
    res.json({
      responseSubmission,
      feedback,
      sessionProgress: {
        questionsAnswered: session.responses.length,
        totalTimeSpent: session.totalTimeSpent,
        averageScore: session.responses.reduce((sum, r) => sum + (r.feedback?.overallScore || 0), 0) / session.responses.length
      }
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ message: 'Failed to submit response', error: error.message });
  }
};

// Complete a practice session
export const completePracticeSession = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { sessionId } = req.params;
    
    const session = await PracticeSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ message: 'Practice session not found' });
    }
    
    if (session.completed) {
      return res.status(400).json({ message: 'Session already completed' });
    }
    
    // Calculate total time spent for session
    session.totalTimeSpent = session.responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0);

    // Complete the session
    session.completeSession();

    // Generate session feedback
    const sessionFeedback = generateSessionFeedback(session);
    session.sessionFeedback = sessionFeedback;

    await session.save();

    // Update performance tracking
    const performance = await PerformanceTracking.getOrCreate(userId);
    await performance.updateAfterSession(session);

    res.json({
      session,
      performance: {
        averageScore: performance.averageScore,
        totalSessions: performance.totalSessions,
        totalQuestionsAnswered: performance.totalQuestionsAnswered,
        totalTimeSpent: performance.totalTimeSpent,
        improvementTrend: performance.improvementTrend.slice(-10)
      }
    });
  } catch (error) {
    console.error('Error completing practice session:', error);
    res.status(500).json({ message: 'Failed to complete practice session' });
  }
};

// Get performance tracking data
export const getPerformanceTracking = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const performance = await PerformanceTracking.getOrCreate(userId);
    
    res.json(performance);
  } catch (error) {
    console.error('Error fetching performance tracking:', error);
    res.status(500).json({ message: 'Failed to fetch performance tracking' });
  }
};

// Compare practice sessions
export const compareSessions = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { sessionIds } = req.query;
    
    if (!sessionIds || sessionIds.length < 2) {
      return res.status(400).json({ message: 'At least 2 session IDs are required for comparison' });
    }
    
    const ids = Array.isArray(sessionIds) ? sessionIds : sessionIds.split(',');
    const sessions = await PracticeSession.find({
      _id: { $in: ids },
      userId
    }).populate('responses.questionId');
    
    if (sessions.length < 2) {
      return res.status(404).json({ message: 'Not enough sessions found for comparison' });
    }
    
    const comparison = generateSessionComparison(sessions);
    
    res.json(comparison);
  } catch (error) {
    console.error('Error comparing sessions:', error);
    res.status(500).json({ message: 'Failed to compare sessions' });
  }
};

// Update nerve management progress
export const updateNerveManagement = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { confidenceLevel, preparednessLevel, notes, technique } = req.body;
    
    const performance = await PerformanceTracking.getOrCreate(userId);
    
    if (confidenceLevel) {
      performance.nerveManagementProgress.confidenceLevel = confidenceLevel;
    }
    
    if (preparednessLevel) {
      performance.nerveManagementProgress.preparednessLevel = preparednessLevel;
    }
    
    if (notes) {
      performance.nerveManagementProgress.improvementNotes.push(notes);
    }
    
    if (technique) {
      const existingTechniqueIndex = performance.nerveManagementProgress.techniques.findIndex(
        t => t.technique === technique.name
      );
      
      if (existingTechniqueIndex === -1) {
        performance.nerveManagementProgress.techniques.push({
          technique: technique.name,
          effectiveness: technique.effectiveness,
          lastUsed: new Date()
        });
      } else {
        performance.nerveManagementProgress.techniques[existingTechniqueIndex].effectiveness = technique.effectiveness;
        performance.nerveManagementProgress.techniques[existingTechniqueIndex].lastUsed = new Date();
      }
    }
    
    await performance.save();
    
    res.json({
      nerveManagementProgress: performance.nerveManagementProgress
    });
  } catch (error) {
    console.error('Error updating nerve management progress:', error);
    res.status(500).json({ message: 'Failed to update nerve management progress' });
  }
};

// Get writing practice tips
export const getWritingTips = async (req, res) => {
  try {
    const { category } = req.query;
    
    const tips = {
      general: [
        'Use the STAR method: Situation, Task, Action, Result',
        'Start with a compelling opening that sets the context',
        'Focus on your specific actions and contributions',
        'Quantify results whenever possible (percentages, numbers, metrics)',
        'Keep responses concise but detailed (150-300 words)',
        'Use active voice and strong action verbs',
        'Show, don\'t just tell - provide concrete examples',
        'End with the impact or outcome of your actions'
      ],
      timing: [
        'Aim for 1-2 minutes when speaking (150-250 words)',
        'Practice with a timer to develop natural pacing',
        'Don\'t rush - clarity is more important than speed',
        'Allow time for the interviewer to ask follow-ups'
      ],
      engagement: [
        'Make your stories memorable with vivid details',
        'Show enthusiasm and passion for your work',
        'Connect your experience to the role you\'re applying for',
        'Use transitions to guide the listener through your story',
        'Practice varying your tone and emphasis'
      ],
      nerveManagement: [
        'Practice deep breathing before and during the interview',
        'Prepare and rehearse your top 5-7 STAR stories',
        'Remember: the interviewer wants you to succeed',
        'Take a moment to think before answering',
        'It\'s okay to ask for clarification on a question',
        'Focus on your preparation and past successes',
        'Visualize success before the interview',
        'Use power poses to boost confidence before starting'
      ]
    };
    
    if (category) {
      const categoryTips = getCategorySpecificTips(category);
      tips.categorySpecific = categoryTips;
    }
    
    res.json(tips);
  } catch (error) {
    console.error('Error fetching writing tips:', error);
    res.status(500).json({ message: 'Failed to fetch writing tips' });
  }
};

// Helper function to generate session feedback
function generateSessionFeedback(session) {
  const responses = session.responses;
  
  if (responses.length === 0) {
    return {
      overallPerformance: 'No responses submitted yet',
      keyStrengths: [],
      areasForImprovement: [],
      progressIndicators: [],
      nextSteps: []
    };
  }
  
  const avgScore = session.sessionScore;
  const allStrengths = responses.flatMap(r => r.feedback?.strengths || []);
  const allWeaknesses = responses.flatMap(r => r.feedback?.weaknesses || []);
  const avgTimeSpent = session.totalTimeSpent / responses.length;
  
  // Count strength frequency
  const strengthCounts = {};
  allStrengths.forEach(s => {
    strengthCounts[s] = (strengthCounts[s] || 0) + 1;
  });
  
  const keyStrengths = Object.entries(strengthCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([strength]) => strength);
  
  // Count weakness frequency
  const weaknessCounts = {};
  allWeaknesses.forEach(w => {
    weaknessCounts[w] = (weaknessCounts[w] || 0) + 1;
  });
  
  const areasForImprovement = Object.entries(weaknessCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([weakness]) => weakness);
  
  let overallPerformance;
  if (avgScore >= 80) {
    overallPerformance = 'Excellent performance! Your responses demonstrate strong communication skills and excellent structure.';
  } else if (avgScore >= 70) {
    overallPerformance = 'Good performance! You\'re showing solid understanding of effective response techniques.';
  } else if (avgScore >= 60) {
    overallPerformance = 'Fair performance. With more practice on structure and clarity, you\'ll see significant improvement.';
  } else {
    overallPerformance = 'Keep practicing! Focus on the STAR method and providing more specific examples.';
  }
  
  const progressIndicators = [
    `Average response score: ${avgScore.toFixed(1)}/100`,
    `Average time per response: ${Math.round(avgTimeSpent / 60)} minutes`,
    `Questions answered: ${responses.length}`
  ];
  
  const nextSteps = [];
  if (avgScore < 70) {
    nextSteps.push('Review STAR method guidelines and practice structuring your responses');
  }
  if (areasForImprovement.includes('Quantify results with specific metrics')) {
    nextSteps.push('Add specific numbers and metrics to demonstrate impact');
  }
  if (avgTimeSpent > 900) { // More than 15 minutes
    nextSteps.push('Work on conciseness - aim to express your ideas more efficiently');
  }
  nextSteps.push('Continue practicing with questions from different categories');
  nextSteps.push('Record yourself and review your responses for clarity');
  
  return {
    overallPerformance,
    keyStrengths,
    areasForImprovement,
    progressIndicators,
    nextSteps
  };
}

// Helper function to generate session comparison
function generateSessionComparison(sessions) {
  sessions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  const comparison = {
    sessions: sessions.map(s => ({
      id: s._id,
      date: s.createdAt,
      score: s.sessionScore,
      questionsAnswered: s.responses.length,
      totalTimeSpent: s.totalTimeSpent
    })),
    trends: {
      scoreImprovement: 0,
      timeEfficiency: 0,
      consistency: 0
    },
    insights: [],
    recommendations: []
  };
  
  // Calculate score improvement
  const firstScore = sessions[0].sessionScore;
  const lastScore = sessions[sessions.length - 1].sessionScore;
  comparison.trends.scoreImprovement = lastScore - firstScore;
  
  // Calculate time efficiency (lower is better)
  const firstAvgTime = sessions[0].totalTimeSpent / sessions[0].responses.length;
  const lastAvgTime = sessions[sessions.length - 1].totalTimeSpent / sessions[sessions.length - 1].responses.length;
  comparison.trends.timeEfficiency = ((firstAvgTime - lastAvgTime) / firstAvgTime) * 100;
  
  // Calculate consistency (lower standard deviation is better)
  const scores = sessions.map(s => s.sessionScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
  comparison.trends.consistency = 100 - Math.sqrt(variance);
  
  // Generate insights
  if (comparison.trends.scoreImprovement > 10) {
    comparison.insights.push('🎉 Strong improvement in response quality across sessions!');
  } else if (comparison.trends.scoreImprovement < -5) {
    comparison.insights.push('⚠️ Recent scores have declined - consider reviewing fundamentals');
  }
  
  if (comparison.trends.timeEfficiency > 20) {
    comparison.insights.push('⏱️ You\'re becoming more efficient at crafting responses');
  }
  
  if (comparison.trends.consistency > 80) {
    comparison.insights.push('📊 Your performance is very consistent');
  } else if (comparison.trends.consistency < 60) {
    comparison.insights.push('📊 Work on maintaining consistent quality across all responses');
  }
  
  // Generate recommendations
  if (lastScore < 75) {
    comparison.recommendations.push('Focus on incorporating more specific examples and metrics');
  }
  if (lastAvgTime > 900) {
    comparison.recommendations.push('Practice timed responses to improve conciseness');
  }
  comparison.recommendations.push('Review your strongest responses and identify what made them successful');
  comparison.recommendations.push('Practice questions from your weaker categories');
  
  return comparison;
}

// Helper function to get category-specific tips
function getCategorySpecificTips(category) {
  const categoryTips = {
    'Leadership': [
      'Highlight how you influenced and motivated others',
      'Show decision-making process and accountability',
      'Demonstrate how you balanced team needs with goals'
    ],
    'Teamwork': [
      'Emphasize collaboration and communication',
      'Show how you handled different perspectives',
      'Highlight your specific role and contributions'
    ],
    'Problem Solving': [
      'Break down your analytical approach',
      'Show creativity in finding solutions',
      'Emphasize both process and outcome'
    ],
    'Conflict Resolution': [
      'Show empathy and understanding of all perspectives',
      'Demonstrate professional communication',
      'Focus on positive resolution and learning'
    ],
    'Time Management': [
      'Show prioritization skills',
      'Demonstrate handling of competing demands',
      'Highlight organizational strategies'
    ],
    'Communication': [
      'Show adaptation to different audiences',
      'Demonstrate clarity and effectiveness',
      'Highlight listening skills and responsiveness'
    ],
    'Adaptability': [
      'Show flexibility in changing situations',
      'Demonstrate learning and growth',
      'Highlight positive attitude toward change'
    ],
    'Initiative': [
      'Show proactive problem identification',
      'Demonstrate self-motivation',
      'Highlight going beyond requirements'
    ]
  };
  
  return categoryTips[category] || categoryTips['Problem Solving'];
}
