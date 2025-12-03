import { CodingChallenge, SystemDesignQuestion, CaseStudy, TechnicalPrep } from '../models/TechnicalPrep.js';
import { Job } from '../models/Job.js';
import { generateCompleteTechnicalPrep } from '../utils/technicalPrepService.js';

// Get user's technical prep profile
export const getTechnicalPrep = async (req, res) => {
  try {
    const userId = req.auth.userId;
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
    const userId = req.auth.userId;
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
    const { difficulty, category, techStack, search, completed, limit = 20, skip = 0 } = req.query;
    const userId = req.auth?.userId;
    
    const query = {};
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (techStack) query.techStack = { $in: [techStack] };
    
    // Filter by completion status
    if (completed === 'true' && userId) {
      query.completedBy = userId;
    } else if (completed === 'false' && userId) {
      query.completedBy = { $ne: userId };
    }
    
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

// Delete coding challenge
export const deleteCodingChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;
    
    const challenge = await CodingChallenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    await CodingChallenge.findByIdAndDelete(id);
    
    // Remove from user's bookmarks and submissions
    await TechnicalPrep.updateMany(
      {},
      { 
        $pull: { 
          bookmarkedChallenges: { challengeId: id },
          submissions: { challengeId: id }
        }
      }
    );
    
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting coding challenge:', error);
    res.status(500).json({ message: 'Failed to delete coding challenge' });
  }
};

// Submit coding challenge solution
export const submitCodingSolution = async (req, res) => {
  try {
    const userId = req.auth.userId;
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
    
    // Mark challenge as completed if all tests passed
    if (results.passed === challenge.testCases.length) {
      if (!challenge.completedBy.includes(userId)) {
        challenge.completedBy.push(userId);
        await challenge.save();
      }
    }
    
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
    const userId = req.auth.userId;
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
    const { level, search, completed, limit = 20, skip = 0 } = req.query;
    const userId = req.auth?.userId;
    
    const query = {};
    if (level) query.level = level;
    
    // Filter by completion status
    if (completed === 'true' && userId) {
      query.completedBy = userId;
    } else if (completed === 'false' && userId) {
      query.completedBy = { $ne: userId };
    }
    
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

// Delete system design question
export const deleteSystemDesignQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const question = await SystemDesignQuestion.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    await SystemDesignQuestion.findByIdAndDelete(id);
    
    // Remove from user's bookmarks and submissions
    await TechnicalPrep.updateMany(
      {},
      { 
        $pull: { 
          bookmarkedChallenges: { challengeId: id },
          submissions: { challengeId: id }
        }
      }
    );
    
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting system design question:', error);
    res.status(500).json({ message: 'Failed to delete system design question' });
  }
};

// Submit system design solution
export const submitSystemDesignSolution = async (req, res) => {
  try {
    const userId = req.auth.userId;
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
    
    // Mark question as completed if score is above 70%
    if (evaluation.score >= 70) {
      if (!question.completedBy.includes(userId)) {
        question.completedBy.push(userId);
        await question.save();
      }
    }
    
    res.json({ submission, evaluation });
  } catch (error) {
    console.error('Error submitting system design solution:', error);
    res.status(500).json({ message: 'Failed to submit solution' });
  }
};

// Get case studies
export const getCaseStudies = async (req, res) => {
  try {
    const { type, industry, search, completed, limit = 20, skip = 0 } = req.query;
    const userId = req.auth?.userId;
    
    const query = {};
    if (type) query.type = type;
    if (industry) query.industry = industry;
    
    // Filter by completion status
    if (completed === 'true' && userId) {
      query.completedBy = userId;
    } else if (completed === 'false' && userId) {
      query.completedBy = { $ne: userId };
    }
    
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

// Delete case study
export const deleteCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    
    const caseStudy = await CaseStudy.findById(id);
    if (!caseStudy) {
      return res.status(404).json({ message: 'Case study not found' });
    }
    
    await CaseStudy.findByIdAndDelete(id);
    
    // Remove from user's bookmarks and submissions
    await TechnicalPrep.updateMany(
      {},
      { 
        $pull: { 
          bookmarkedChallenges: { challengeId: id },
          submissions: { challengeId: id }
        }
      }
    );
    
    res.json({ message: 'Case study deleted successfully' });
  } catch (error) {
    console.error('Error deleting case study:', error);
    res.status(500).json({ message: 'Failed to delete case study' });
  }
};

// Submit case study solution
export const submitCaseStudySolution = async (req, res) => {
  try {
    const userId = req.auth.userId;
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
    const caseStudy = await CaseStudy.findById(caseStudyId);
    
    // Mark case study as completed after submission (since it's manual review)
    if (!caseStudy.completedBy.includes(userId)) {
      caseStudy.completedBy.push(userId);
      await caseStudy.save();
    }
    
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
    for (const caseStudy of (generatedContent.caseStudies || [])) {
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
    const userId = req.auth.userId;
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
    const userId = req.auth.userId;
    const { challengeType, challengeId } = req.body;
    
    // Validate input
    if (!challengeType || !challengeId) {
      return res.status(400).json({ message: 'Challenge type and ID are required' });
    }
    
    let prep = await TechnicalPrep.findOne({ userId });
    if (!prep) {
      prep = new TechnicalPrep({ userId });
    }
    
    const existingIndex = prep.bookmarkedChallenges.findIndex(
      b => b.challengeId && b.challengeId.toString() === challengeId.toString() && b.challengeType === challengeType
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
    const userId = req.auth.userId;
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

// Helper function to run test cases
async function runTestCases(code, language, testCases) {
  const results = {
    passed: 0,
    executionTime: 0,
    testResults: []
  };
  
  // Support JavaScript, Python, Java, and C++
  const supportedLanguages = ['javascript', 'python', 'java', 'c++', 'cpp'];
  if (!supportedLanguages.includes(language.toLowerCase())) {
    throw new Error('Only JavaScript, Python, Java, and C++ are currently supported');
  }
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const startTime = Date.now();
    
    try {
      let actualOutput;
      let passed = false;
      
      if (language.toLowerCase() === 'javascript') {
        // Execute JavaScript code
        actualOutput = await executeJavaScript(code, testCase.input);
      } else if (language.toLowerCase() === 'python') {
        // Execute Python code
        actualOutput = await executePython(code, testCase.input);
      } else if (language.toLowerCase() === 'java') {
        // Execute Java code
        actualOutput = await executeJava(code, testCase.input);
      } else if (language.toLowerCase() === 'c++' || language.toLowerCase() === 'cpp') {
        // Execute C++ code
        actualOutput = await executeCpp(code, testCase.input);
      }
      
      // Normalize outputs for comparison
      const expectedNormalized = normalizeOutput(testCase.expectedOutput);
      const actualNormalized = normalizeOutput(actualOutput);
      
      passed = expectedNormalized === actualNormalized;
      
      const executionTime = Date.now() - startTime;
      results.executionTime += executionTime;
      
      results.testResults.push({
        testCase: i + 1,
        passed,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: actualOutput,
        executionTime,
        isHidden: testCase.isHidden
      });
      
      if (passed) results.passed++;
    } catch (error) {
      results.testResults.push({
        testCase: i + 1,
        passed: false,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: `Error: ${error.message}`,
        executionTime: Date.now() - startTime,
        isHidden: testCase.isHidden
      });
    }
  }
  
  return results;
}

// Execute JavaScript code safely
async function executeJavaScript(code, input) {
  const vm = await import('vm');
  
  // Create a sandbox with limited access
  const sandbox = {
    console: {
      log: () => {} // Disable console.log in sandbox
    },
    result: null
  };
  
  try {
    // Parse input if it's a JSON string
    let parsedInput;
    try {
      parsedInput = JSON.parse(input);
    } catch {
      parsedInput = input;
    }
    
    // Wrap code to capture return value
    const wrappedCode = `
      ${code}
      
      // Try to find and execute the main function
      const functionMatch = \`${code}\`.match(/function\\s+(\\w+)|const\\s+(\\w+)\\s*=|let\\s+(\\w+)\\s*=|var\\s+(\\w+)\\s*=/);
      if (functionMatch) {
        const funcName = functionMatch[1] || functionMatch[2] || functionMatch[3] || functionMatch[4];
        if (typeof eval(funcName) === 'function') {
          result = eval(funcName)(${JSON.stringify(parsedInput)});
        }
      }
    `;
    
    // Execute with timeout
    vm.runInNewContext(wrappedCode, sandbox, {
      timeout: 5000, // 5 second timeout
      displayErrors: true
    });
    
    return JSON.stringify(sandbox.result);
  } catch (error) {
    throw new Error(`Execution error: ${error.message}`);
  }
}

// Execute Python code using child_process
async function executePython(code, input) {
  const { spawn } = await import('child_process');
  
  return new Promise((resolve, reject) => {
    // Parse input if it's a JSON string or object
    let parsedInput;
    try {
      parsedInput = typeof input === 'string' ? JSON.parse(input) : input;
    } catch {
      parsedInput = input;
    }
    
    // Wrap the user's code to call their function with the input
    const wrappedCode = `
import json
import sys

${code}

# Parse input and call the function
input_data = json.loads('''${JSON.stringify(parsedInput).replace(/'/g, "\\'")}''')

# Try to find and call the main function
try:
    # Look for common function names
    if 'analyze_diversity' in dir():
        result = analyze_diversity(input_data)
    elif 'solution' in dir():
        result = solution(input_data)
    elif 'solve' in dir():
        result = solve(input_data)
    elif 'main' in dir():
        result = main(input_data)
    else:
        # Try to find any function defined in the code
        import re
        func_matches = re.findall(r'def\\\\s+(\\\\w+)\\\\s*\\\\(', '''${code.replace(/'/g, "\\'")}''')
        if func_matches:
            result = eval(func_matches[0] + '(input_data)')
        else:
            result = None
    
    print(json.dumps(result) if not isinstance(result, str) else result)
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;
    
    // Execute Python code
    const python = spawn('python', ['-c', wrappedCode], {
      timeout: 5000 // 5 second timeout
    });
    
    let output = '';
    let error = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(error || 'Python execution failed'));
      } else {
        resolve(output.trim());
      }
    });
    
    python.on('error', (err) => {
      reject(new Error(`Failed to start Python: ${err.message}`));
    });
  });
}

// Execute Java code using child_process
async function executeJava(code, input) {
  const { spawn, exec } = await import('child_process');
  const fs = await import('fs');
  const path = await import('path');
  const os = await import('os');
  
  return new Promise((resolve, reject) => {
    // Extract class name from code
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    if (!classMatch) {
      return reject(new Error('Java code must contain a public class'));
    }
    const className = classMatch[1];
    
    // Create temporary directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'java-'));
    const javaFile = path.join(tempDir, `${className}.java`);
    
    try {
      // Write Java code to file
      fs.writeFileSync(javaFile, code);
      
      // Compile Java code
      exec(`javac "${javaFile}"`, { timeout: 5000 }, (compileError, compileStdout, compileStderr) => {
        if (compileError) {
          // Cleanup
          fs.rmSync(tempDir, { recursive: true, force: true });
          return reject(new Error(`Compilation error: ${compileStderr || compileError.message}`));
        }
        
        // Execute compiled Java class
        const java = spawn('java', ['-cp', tempDir, className], {
          timeout: 5000
        });
        
        let output = '';
        let error = '';
        
        // Send input to stdin (convert to string if needed)
        if (input) {
          const inputStr = typeof input === 'object' ? JSON.stringify(input) : String(input);
          java.stdin.write(inputStr);
          java.stdin.end();
        }
        
        java.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        java.stderr.on('data', (data) => {
          error += data.toString();
        });
        
        java.on('close', (code) => {
          // Cleanup temp directory
          fs.rmSync(tempDir, { recursive: true, force: true });
          
          if (code !== 0) {
            reject(new Error(error || 'Java execution failed'));
          } else {
            resolve(output.trim());
          }
        });
        
        java.on('error', (err) => {
          // Cleanup temp directory
          fs.rmSync(tempDir, { recursive: true, force: true });
          reject(new Error(`Failed to execute Java: ${err.message}`));
        });
      });
    } catch (err) {
      // Cleanup temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      reject(new Error(`Java execution error: ${err.message}`));
    }
  });
}

// Execute C++ code using child_process
async function executeCpp(code, input) {
  const { spawn, exec } = await import('child_process');
  const fs = await import('fs');
  const path = await import('path');
  const os = await import('os');
  
  return new Promise((resolve, reject) => {
    // Create temporary directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cpp-'));
    const cppFile = path.join(tempDir, 'solution.cpp');
    const exeFile = path.join(tempDir, 'solution.exe');
    
    try {
      // Write C++ code to file
      fs.writeFileSync(cppFile, code);
      
      // Compile C++ code (using g++ if available)
      const compiler = process.platform === 'win32' ? 'g++' : 'g++';
      exec(`${compiler} "${cppFile}" -o "${exeFile}"`, { timeout: 5000 }, (compileError, compileStdout, compileStderr) => {
        if (compileError) {
          // Cleanup
          fs.rmSync(tempDir, { recursive: true, force: true });
          return reject(new Error(`Compilation error: ${compileStderr || compileError.message}`));
        }
        
        // Execute compiled C++ program
        const cpp = spawn(exeFile, [], {
          timeout: 5000
        });
        
        let output = '';
        let error = '';
        
        // Send input to stdin (convert to string if needed)
        if (input) {
          const inputStr = typeof input === 'object' ? JSON.stringify(input) : String(input);
          cpp.stdin.write(inputStr);
          cpp.stdin.end();
        }
        
        cpp.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        cpp.stderr.on('data', (data) => {
          error += data.toString();
        });
        
        cpp.on('close', (code) => {
          // Cleanup temp directory
          fs.rmSync(tempDir, { recursive: true, force: true });
          
          if (code !== 0) {
            reject(new Error(error || 'C++ execution failed'));
          } else {
            resolve(output.trim());
          }
        });
        
        cpp.on('error', (err) => {
          // Cleanup temp directory
          fs.rmSync(tempDir, { recursive: true, force: true });
          reject(new Error(`Failed to execute C++: ${err.message}`));
        });
      });
    } catch (err) {
      // Cleanup temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      reject(new Error(`C++ execution error: ${err.message}`));
    }
  });
}

// Normalize output for comparison
function normalizeOutput(output) {
  if (output === null || output === undefined) return '';
  
  // Convert to string and normalize
  let normalized = String(output).trim();
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Try to parse as JSON and re-stringify for consistent formatting
  try {
    const parsed = JSON.parse(normalized);
    return JSON.stringify(parsed);
  } catch {
    return normalized;
  }
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
