import { CodingChallenge, SystemDesignQuestion, CaseStudy, TechnicalPrep } from '../models/TechnicalPrep.js';
import { Job } from '../models/Job.js';
import { generateCompleteTechnicalPrep } from '../utils/technicalPrepService.js';

// Get user's technical prep profile
export const getTechnicalPrep = async (req, res) => {
  try {
    const userId = req.user.sub;
    const prep = await TechnicalPrep.getOrCreate(userId);
    
    res.json(prep);
  } catch (error) {
    console.error('Error fetching technical prep:', error);
    res.status(500).json({ message: 'Failed to fetch technical prep data' });
  }
};

// Update technical prep settings
export const updateTechnicalPrep = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { targetRole, targetTechStack, targetCompanies } = req.body;
    
    const prep = await TechnicalPrep.findOneAndUpdate(
      { userId },
      { targetRole, targetTechStack, targetCompanies },
      { new: true, upsert: true }
    );
    
    res.json(prep);
  } catch (error) {
    console.error('Error updating technical prep:', error);
    res.status(500).json({ message: 'Failed to update technical prep' });
  }
};

// Get coding challenges
export const getCodingChallenges = async (req, res) => {
  try {
    const { difficulty, category, techStack, search, limit = 20, skip = 0 } = req.query;
    
    const query = {};
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (techStack) query.techStack = { $in: [techStack] };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const challenges = await CodingChallenge.find(query)
      .select('-testCases -solution') // Don't send test cases and solutions
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });
    
    const total = await CodingChallenge.countDocuments(query);
    
    res.json({ challenges, total });
  } catch (error) {
    console.error('Error fetching coding challenges:', error);
    res.status(500).json({ message: 'Failed to fetch coding challenges' });
  }
};

// Get specific coding challenge
export const getCodingChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await CodingChallenge.findById(id)
      .select('-testCases.expectedOutput -solution'); // Hide expected outputs and solution
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    res.json(challenge);
  } catch (error) {
    console.error('Error fetching coding challenge:', error);
    res.status(500).json({ message: 'Failed to fetch coding challenge' });
  }
};

// Submit coding challenge solution
export const submitCodingSolution = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { challengeId } = req.params;
    const { code, language, timeSpent } = req.body;
    
    const challenge = await CodingChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    // Run test cases (simplified - in production, use a sandboxed code execution service)
    const results = await runTestCases(code, language, challenge.testCases);
    
    const submission = {
      challengeType: 'coding',
      challengeId,
      code,
      language,
      testsPassed: results.passed,
      totalTests: challenge.testCases.length,
      executionTime: results.executionTime,
      timeSpent,
      score: (results.passed / challenge.testCases.length) * 100,
      feedback: generateFeedback(results, challenge),
      hints_used: req.body.hintsUsed || []
    };
    
    let prep = await TechnicalPrep.findOne({ userId });
    if (!prep) {
      prep = new TechnicalPrep({ userId });
    }
    prep.submissions.push(submission);
    prep.updatePerformance();
    await prep.save();
    
    res.json({
      submission,
      results: {
        passed: results.passed,
        total: challenge.testCases.length,
        testResults: results.testResults,
        feedback: submission.feedback
      }
    });
  } catch (error) {
    console.error('Error submitting solution:', error);
    res.status(500).json({ message: 'Failed to submit solution' });
  }
};

// Get hint for a challenge
export const getHint = async (req, res) => {
  try {
    const { id } = req.params;
    const { hintIndex } = req.query;
    
    const challenge = await CodingChallenge.findById(id).select('hints');
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    if (hintIndex >= challenge.hints.length) {
      return res.status(404).json({ message: 'Hint not found' });
    }
    
    res.json({ hint: challenge.hints[hintIndex] });
  } catch (error) {
    console.error('Error fetching hint:', error);
    res.status(500).json({ message: 'Failed to fetch hint' });
  }
};

// Get solution after successful completion
export const getSolution = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;
    
    const prep = await TechnicalPrep.findOne({ userId });
    const hasCompleted = prep.submissions.some(
      s => s.challengeId.toString() === id && s.testsPassed === s.totalTests
    );
    
    if (!hasCompleted) {
      return res.status(403).json({ message: 'Complete the challenge first to view solution' });
    }
    
    const challenge = await CodingChallenge.findById(id).select('solution');
    res.json(challenge.solution);
  } catch (error) {
    console.error('Error fetching solution:', error);
    res.status(500).json({ message: 'Failed to fetch solution' });
  }
};

// Get system design questions
export const getSystemDesignQuestions = async (req, res) => {
  try {
    const { level, search, limit = 20, skip = 0 } = req.query;
    
    const query = {};
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const questions = await SystemDesignQuestion.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });
    
    const total = await SystemDesignQuestion.countDocuments(query);
    
    res.json({ questions, total });
  } catch (error) {
    console.error('Error fetching system design questions:', error);
    res.status(500).json({ message: 'Failed to fetch system design questions' });
  }
};

// Get specific system design question
export const getSystemDesignQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await SystemDesignQuestion.findById(id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Error fetching system design question:', error);
    res.status(500).json({ message: 'Failed to fetch system design question' });
  }
};

// Submit system design solution
export const submitSystemDesignSolution = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { questionId } = req.params;
    const { solution, timeSpent } = req.body;
    
    const question = await SystemDesignQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Evaluate solution based on key components coverage
    const evaluation = evaluateSystemDesign(solution, question);
    
    const submission = {
      challengeType: 'systemDesign',
      challengeId: questionId,
      timeSpent,
      score: evaluation.score,
      feedback: evaluation.feedback,
      submittedAt: new Date()
    };
    
    const prep = await TechnicalPrep.findOne({ userId });
    prep.submissions.push(submission);
    prep.updatePerformance();
    await prep.save();
    
    res.json({ submission, evaluation });
  } catch (error) {
    console.error('Error submitting system design solution:', error);
    res.status(500).json({ message: 'Failed to submit solution' });
  }
};

// Get case studies
export const getCaseStudies = async (req, res) => {
  try {
    const { type, industry, search, limit = 20, skip = 0 } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (industry) query.industry = industry;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { scenario: { $regex: search, $options: 'i' } }
      ];
    }
    
    const caseStudies = await CaseStudy.find(query)
      .select('-sampleSolution') // Don't send sample solution initially
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });
    
    const total = await CaseStudy.countDocuments(query);
    
    res.json({ caseStudies, total });
  } catch (error) {
    console.error('Error fetching case studies:', error);
    res.status(500).json({ message: 'Failed to fetch case studies' });
  }
};

// Get specific case study
export const getCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    const caseStudy = await CaseStudy.findById(id).select('-sampleSolution');
    
    if (!caseStudy) {
      return res.status(404).json({ message: 'Case study not found' });
    }
    
    res.json(caseStudy);
  } catch (error) {
    console.error('Error fetching case study:', error);
    res.status(500).json({ message: 'Failed to fetch case study' });
  }
};

// Submit case study solution
export const submitCaseStudySolution = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { caseStudyId } = req.params;
    const { solution, timeSpent } = req.body;
    
    const submission = {
      challengeType: 'caseStudy',
      challengeId: caseStudyId,
      timeSpent,
      score: 0, // Manual evaluation needed
      feedback: 'Your solution has been submitted for review.',
      submittedAt: new Date()
    };
    
    const prep = await TechnicalPrep.findOne({ userId });
    prep.submissions.push(submission);
    await prep.save();
    
    // Get sample solution after submission
    const caseStudy = await CaseStudy.findById(caseStudyId).select('sampleSolution');
    
    res.json({ submission, sampleSolution: caseStudy.sampleSolution });
  } catch (error) {
    console.error('Error submitting case study solution:', error);
    res.status(500).json({ message: 'Failed to submit solution' });
  }
};

// Generate personalized challenges based on job using AI
export const generateJobSpecificChallenges = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Generate AI-powered technical prep content
    const jobDetails = {
      title: job.title,
      company: job.company,
      level: job.level,
      techStack: job.techStack || [],
      requiredSkills: job.requiredSkills || [],
      description: job.description,
      industry: job.industry
    };
    
    const generatedContent = await generateCompleteTechnicalPrep(jobDetails);
    
    // Validate and clean categories before saving
    const validCategories = ['Data Structures', 'Algorithms', 'System Design', 'Database', 'API Design', 'Frontend', 'Backend', 'Full Stack'];
    generatedContent.codingChallenges = generatedContent.codingChallenges.map(challenge => {
      // If category is invalid, default to 'Algorithms'
      if (!validCategories.includes(challenge.category)) {
        console.warn(`Invalid category "${challenge.category}" replaced with "Algorithms"`);
        challenge.category = 'Algorithms';
      }
      return challenge;
    });
    
    // Save generated challenges to database with error handling
    const savedChallenges = [];
    for (const challenge of generatedContent.codingChallenges) {
      try {
        const saved = await CodingChallenge.create(challenge);
        savedChallenges.push(saved);
      } catch (err) {
        console.error(`Failed to save challenge "${challenge.title}":`, err.message);
        // Continue with other challenges
      }
    }
    
    const savedSystemDesign = [];
    for (const question of generatedContent.systemDesignQuestions) {
      try {
        const saved = await SystemDesignQuestion.create(question);
        savedSystemDesign.push(saved);
      } catch (err) {
        console.error(`Failed to save system design question "${question.title}":`, err.message);
      }
    }
    
    const savedCaseStudies = [];
    for (const caseStudy of generatedContent.caseStudies) {
      try {
        const saved = await CaseStudy.create(caseStudy);
        savedCaseStudies.push(saved);
      } catch (err) {
        console.error(`Failed to save case study "${caseStudy.title}":`, err.message);
      }
    }
    
    res.json({
      jobTitle: job.title,
      company: job.company,
      codingChallenges: savedChallenges.map(c => ({ ...c.toObject(), testCases: undefined, solution: undefined })),
      systemDesignQuestions: savedSystemDesign,
      caseStudies: savedCaseStudies,
      recommendedTopics: [...new Set([...jobDetails.techStack, ...jobDetails.requiredSkills])]
    });
  } catch (error) {
    console.error('Error generating job-specific challenges:', error);
    res.status(500).json({ message: 'Failed to generate challenges', error: error.message });
  }
};

// Get performance analytics
export const getPerformanceAnalytics = async (req, res) => {
  try {
    const userId = req.user.sub;
    const prep = await TechnicalPrep.findOne({ userId });
    
    if (!prep) {
      return res.json({ performance: null });
    }
    
    res.json({ performance: prep.performance });
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({ message: 'Failed to fetch performance analytics' });
  }
};

// Bookmark a challenge
export const bookmarkChallenge = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { challengeType, challengeId } = req.body;
    
    let prep = await TechnicalPrep.findOne({ userId });
    if (!prep) {
      prep = new TechnicalPrep({ userId });
    }
    
    const existingIndex = prep.bookmarkedChallenges.findIndex(
      b => b.challengeId.toString() === challengeId && b.challengeType === challengeType
    );
    
    if (existingIndex > -1) {
      prep.bookmarkedChallenges.splice(existingIndex, 1);
    } else {
      prep.bookmarkedChallenges.push({ challengeType, challengeId });
    }
    
    await prep.save();
    res.json({ bookmarked: existingIndex === -1 });
  } catch (error) {
    console.error('Error bookmarking challenge:', error);
    res.status(500).json({ message: 'Failed to bookmark challenge' });
  }
};

// Get bookmarked challenges
export const getBookmarkedChallenges = async (req, res) => {
  try {
    const userId = req.user.sub;
    const prep = await TechnicalPrep.findOne({ userId });
    
    if (!prep || !prep.bookmarkedChallenges.length) {
      return res.json({ challenges: [] });
    }
    
    const challenges = [];
    for (const bookmark of prep.bookmarkedChallenges) {
      let challenge;
      if (bookmark.challengeType === 'coding') {
        challenge = await CodingChallenge.findById(bookmark.challengeId).select('-testCases -solution');
      } else if (bookmark.challengeType === 'systemDesign') {
        challenge = await SystemDesignQuestion.findById(bookmark.challengeId);
      } else if (bookmark.challengeType === 'caseStudy') {
        challenge = await CaseStudy.findById(bookmark.challengeId).select('-sampleSolution');
      }
      
      if (challenge) {
        challenges.push({ ...challenge.toObject(), type: bookmark.challengeType });
      }
    }
    
    res.json({ challenges });
  } catch (error) {
    console.error('Error fetching bookmarked challenges:', error);
    res.status(500).json({ message: 'Failed to fetch bookmarked challenges' });
  }
};

// Helper function to run test cases (simplified)
async function runTestCases(code, language, testCases) {
  // In production, use a sandboxed code execution service like Judge0, Piston, or AWS Lambda
  // This is a simplified placeholder
  
  const results = {
    passed: 0,
    executionTime: Math.random() * 1000, // Mock execution time
    testResults: []
  };
  
  // Mock test execution
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const passed = Math.random() > 0.3; // 70% pass rate for demo
    
    results.testResults.push({
      testCase: i + 1,
      passed,
      input: testCase.input,
      expectedOutput: passed ? testCase.expectedOutput : null,
      actualOutput: passed ? testCase.expectedOutput : 'Error or incorrect output',
      isHidden: testCase.isHidden
    });
    
    if (passed) results.passed++;
  }
  
  return results;
}

// Helper function to generate feedback
function generateFeedback(results, challenge) {
  const percentage = (results.passed / challenge.testCases.length) * 100;
  
  if (percentage === 100) {
    return `Excellent! All test cases passed. Your solution demonstrates good understanding of ${challenge.category}. Consider reviewing the optimal solution to learn alternative approaches.`;
  } else if (percentage >= 70) {
    return `Good progress! ${results.passed} out of ${challenge.testCases.length} test cases passed. Review the failing test cases to handle edge cases better.`;
  } else if (percentage >= 40) {
    return `You're on the right track, but ${challenge.testCases.length - results.passed} test cases are failing. Consider reviewing the problem constraints and testing with edge cases.`;
  } else {
    return `Keep practicing! Most test cases are failing. Try breaking down the problem into smaller steps and test your logic with the provided examples first.`;
  }
}

// Helper function to evaluate system design
function evaluateSystemDesign(solution, question) {
  // Simplified evaluation - in production, use AI for more sophisticated analysis
  const keyComponents = question.keyComponents || [];
  const solutionText = JSON.stringify(solution).toLowerCase();
  
  let score = 0;
  const feedback = [];
  
  // Check if key components are mentioned
  const mentionedComponents = keyComponents.filter(component => 
    solutionText.includes(component.toLowerCase())
  );
  
  score = (mentionedComponents.length / keyComponents.length) * 100;
  
  if (score >= 80) {
    feedback.push('✓ Comprehensive solution covering most key components');
  } else if (score >= 60) {
    feedback.push('⚠ Good foundation, but missing some key components');
  } else {
    feedback.push('✗ Several important components missing');
  }
  
  // Check for scalability considerations
  if (solutionText.includes('cache') || solutionText.includes('load balancer')) {
    feedback.push('✓ Good consideration of scalability');
    score += 10;
  }
  
  // Check for trade-offs discussion
  if (solutionText.includes('trade-off') || solutionText.includes('tradeoff')) {
    feedback.push('✓ Addressed trade-offs');
    score += 10;
  }
  
  return {
    score: Math.min(score, 100),
    feedback: feedback.join('\n'),
    mentionedComponents,
    missingComponents: keyComponents.filter(c => !mentionedComponents.includes(c))
  };
}
