import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate behavioral interview questions using AI
 * @param {Object} params - Question generation parameters
 * @returns {Object} - Generated question with STAR guidance
 */
export async function generateBehavioralQuestion(params) {
  try {
    const { category, difficulty, role, industry, count = 1 } = params;
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

    const prompt = `You are an expert interview coach. Generate ${count} realistic behavioral interview question(s) based on the following criteria:

**CRITERIA:**
- Category: ${category}
- Difficulty Level: ${difficulty}
- Target Role: ${role || 'General'}
- Industry: ${industry || 'General'}

**REQUIREMENTS:**
For each question, provide:
1. The interview question itself
2. STAR method guidance (Situation, Task, Action, Result) - specific guidance for this question
3. 3-4 practical tips for answering this question
4. 2-3 common mistakes to avoid
5. Ideal response length (min/max words)
6. Recommended time limit (in minutes)
7. 2 relevant follow-up questions

**OUTPUT FORMAT (JSON):**
Return a JSON array with each question as an object:
{
  "question": "Tell me about a time...",
  "category": "${category}",
  "difficulty": "${difficulty}",
  "role": "${role || 'General'}",
  "industry": "${industry || 'General'}",
  "starGuidance": {
    "situation": "What context to describe",
    "task": "What responsibility/goal to explain",
    "action": "What specific actions to highlight",
    "result": "What outcomes/metrics to share"
  },
  "tips": ["tip1", "tip2", "tip3"],
  "commonMistakes": ["mistake1", "mistake2"],
  "idealResponseLength": { "min": 200, "max": 350 },
  "timeLimit": 15,
  "followUpQuestions": ["question1", "question2"]
}

Generate realistic, specific questions that align with the category "${category}" and difficulty "${difficulty}".
Return ONLY valid JSON without any markdown formatting or additional text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean up response - remove markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/g, '');
    }
    
    const questions = JSON.parse(cleanText);
    return Array.isArray(questions) ? questions : [questions];
  } catch (error) {
    console.error('Error generating behavioral question:', error);
    throw new Error('Failed to generate question');
  }
}

/**
 * Analyze an interview response using AI
 * @param {string} response - The user's written response
 * @param {Object} question - The behavioral question being answered
 * @returns {Object} - Detailed feedback analysis
 */
export async function analyzeInterviewResponse(response, question) {
  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

    const prompt = `You are an expert interview coach and communication specialist. Analyze the following interview response and provide comprehensive feedback.

**INTERVIEW QUESTION:**
Category: ${question.category}
Difficulty: ${question.difficulty}
Question: ${question.question}

**IDEAL RESPONSE GUIDELINES (STAR Method):**
${question.starGuidance ? `
- Situation: ${question.starGuidance.situation}
- Task: ${question.starGuidance.task}
- Action: ${question.starGuidance.action}
- Result: ${question.starGuidance.result}
` : 'Use STAR method: Situation, Task, Action, Result'}

**IDEAL LENGTH:** ${question.idealResponseLength.min}-${question.idealResponseLength.max} words
**TIME LIMIT:** ${question.timeLimit} minutes

**CANDIDATE'S RESPONSE:**
${response}

**ANALYSIS TASK:**
Provide a detailed analysis with the following structure:

1. **Overall Assessment** (0-100 score):
   - Overall quality score
   - Brief summary of response strength

2. **Component Scores** (0-100 each):
   - Clarity: Is the response easy to understand?
   - Professionalism: Is the tone and language professional?
   - Structure: Is it well-organized and logical?
   - Relevance: Does it directly answer the question?
   - Impact: Does it demonstrate meaningful results?

3. **STAR Framework Analysis**:
   - Situation: Present (Yes/No) - Did they set the context?
   - Task: Present (Yes/No) - Did they define their responsibility?
   - Action: Present (Yes/No) - Did they explain what THEY did?
   - Result: Present (Yes/No) - Did they show the outcome/impact?
   - STAR Adherence Score (0-100)

4. **Communication Quality Analysis**:
   - Word Count: ${response.trim().split(/\s+/).length}
   - Estimated Speaking Time: (words / 150 * 60) seconds for natural pace
   - Readability: Rate 0-100
   - Tone Assessment: (Confident/Uncertain/Defensive/Enthusiastic, etc.)
   - Confidence Level: (High/Medium/Low)
   - Conciseness: (Excellent/Good/Wordy/Too Brief)
   - Engagement Factor: (Compelling/Adequate/Weak)

5. **Language Pattern Analysis**:
   Identify:
   - Weak phrases (passive voice, hedging language like "I think", "maybe", "kind of")
   - Strong phrases (action verbs, specific details, quantified results)
   - Filler words/phrases
   - Percentage of passive voice usage
   - Action verbs used effectively

6. **Strengths** (List 3-5 specific strengths):
   - What the candidate did well
   - Specific examples from their response

7. **Weaknesses** (List 3-5 areas needing improvement):
   - What could be improved
   - Specific examples from their response

8. **Specific Improvements** (List 5-7 actionable suggestions):
   - Concrete ways to improve this response
   - Alternative phrasings or approaches
   - Missing elements to add

9. **Alternative Approaches** (List 2-3 different ways to answer):
   - Other storytelling angles
   - Different examples that could work
   - Structure variations

**OUTPUT FORMAT (strict JSON):**
{
  "overallScore": <number 0-100>,
  "clarityScore": <number 0-100>,
  "professionalismScore": <number 0-100>,
  "structureScore": <number 0-100>,
  "relevanceScore": <number 0-100>,
  "impactScore": <number 0-100>,
  "starAdherence": {
    "hasSituation": <boolean>,
    "hasTask": <boolean>,
    "hasAction": <boolean>,
    "hasResult": <boolean>,
    "score": <number 0-100>
  },
  "wordCount": <number>,
  "estimatedSpeakingTime": <number in seconds>,
  "readabilityScore": <number 0-100>,
  "strengths": [<array of 3-5 specific strength strings>],
  "weaknesses": [<array of 3-5 specific weakness strings>],
  "improvements": [<array of 5-7 actionable improvement strings>],
  "alternativeApproaches": [<array of 2-3 alternative approach strings>],
  "languagePatterns": {
    "weakPhrases": [<array of identified weak phrases>],
    "strongPhrases": [<array of identified strong phrases>],
    "fillerWords": [<array of filler words found>],
    "passiveVoice": <percentage number>,
    "actionVerbs": [<array of strong action verbs used>]
  },
  "communicationQuality": {
    "tone": "<tone assessment>",
    "confidence": "<High/Medium/Low>",
    "conciseness": "<Excellent/Good/Wordy/Too Brief>",
    "engagement": "<Compelling/Adequate/Weak>"
  }
}

**IMPORTANT GUIDELINES:**
- Be specific and constructive in feedback
- Provide actionable suggestions, not just criticism
- Consider the question category and difficulty level
- Recognize cultural differences in communication styles
- Focus on helping the candidate improve
- Quantify results where mentioned
- Identify whether they spoke about "I" vs "we" appropriately
- Check for concrete examples vs vague statements
- Evaluate whether outcomes are measurable`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }
    
    const feedback = JSON.parse(jsonMatch[0]);
    
    // Validate and ensure all required fields exist
    return {
      overallScore: feedback.overallScore || 0,
      clarityScore: feedback.clarityScore || 0,
      professionalismScore: feedback.professionalismScore || 0,
      structureScore: feedback.structureScore || 0,
      relevanceScore: feedback.relevanceScore || 0,
      impactScore: feedback.impactScore || 0,
      starAdherence: {
        hasSituation: feedback.starAdherence?.hasSituation || false,
        hasTask: feedback.starAdherence?.hasTask || false,
        hasAction: feedback.starAdherence?.hasAction || false,
        hasResult: feedback.starAdherence?.hasResult || false,
        score: feedback.starAdherence?.score || 0
      },
      wordCount: feedback.wordCount || response.trim().split(/\s+/).length,
      estimatedSpeakingTime: feedback.estimatedSpeakingTime || Math.round(feedback.wordCount / 150 * 60),
      readabilityScore: feedback.readabilityScore || 0,
      strengths: feedback.strengths || [],
      weaknesses: feedback.weaknesses || [],
      improvements: feedback.improvements || [],
      alternativeApproaches: feedback.alternativeApproaches || [],
      languagePatterns: {
        weakPhrases: feedback.languagePatterns?.weakPhrases || [],
        strongPhrases: feedback.languagePatterns?.strongPhrases || [],
        fillerWords: feedback.languagePatterns?.fillerWords || [],
        passiveVoice: feedback.languagePatterns?.passiveVoice || 0,
        actionVerbs: feedback.languagePatterns?.actionVerbs || []
      },
      communicationQuality: {
        tone: feedback.communicationQuality?.tone || 'Neutral',
        confidence: feedback.communicationQuality?.confidence || 'Medium',
        conciseness: feedback.communicationQuality?.conciseness || 'Good',
        engagement: feedback.communicationQuality?.engagement || 'Adequate'
      }
    };
    
  } catch (error) {
    console.error('Error analyzing interview response:', error);
    
    // Return a basic analysis if AI fails
    const wordCount = response.trim().split(/\s+/).length;
    return {
      overallScore: 50,
      clarityScore: 50,
      professionalismScore: 50,
      structureScore: 50,
      relevanceScore: 50,
      impactScore: 50,
      starAdherence: {
        hasSituation: false,
        hasTask: false,
        hasAction: false,
        hasResult: false,
        score: 0
      },
      wordCount,
      estimatedSpeakingTime: Math.round(wordCount / 150 * 60),
      readabilityScore: 50,
      strengths: ['Response submitted successfully'],
      weaknesses: ['Unable to provide detailed analysis at this time'],
      improvements: ['Try again or contact support if this issue persists'],
      alternativeApproaches: [],
      languagePatterns: {
        weakPhrases: [],
        strongPhrases: [],
        fillerWords: [],
        passiveVoice: 0,
        actionVerbs: []
      },
      communicationQuality: {
        tone: 'Unable to analyze',
        confidence: 'Medium',
        conciseness: 'Good',
        engagement: 'Adequate'
      }
    };
  }
}

/**
 * Generate behavioral questions using AI based on job details
 * @param {Object} jobDetails - Job information
 * @param {number} count - Number of questions to generate
 * @returns {Array} - Array of generated questions
 */
export async function generateBehavioralQuestions(jobDetails, count = 10) {
  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

    const prompt = `You are an expert interview question designer. Generate ${count} highly relevant behavioral interview questions for the following job.

**JOB DETAILS:**
Title: ${jobDetails.title || 'Not specified'}
Company: ${jobDetails.company || 'Not specified'}
Industry: ${jobDetails.industry || 'Not specified'}
Level: ${jobDetails.level || 'Not specified'}
Description: ${jobDetails.description || 'Not specified'}
Required Skills: ${jobDetails.requiredSkills?.join(', ') || 'Not specified'}

**REQUIREMENTS:**
Generate ${count} behavioral interview questions that:
1. Are specific to the role and industry
2. Cover different competency categories
3. Vary in difficulty level
4. Include STAR method guidance
5. Have practical tips for answering
6. Include common mistakes to avoid

**CATEGORIES TO COVER:**
- Leadership
- Teamwork
- Problem Solving
- Conflict Resolution
- Time Management
- Communication
- Adaptability
- Initiative
- Technical
- Customer Focus
- Achievement

**OUTPUT FORMAT (strict JSON array):**
[
  {
    "question": "Tell me about a time when...",
    "category": "Problem Solving",
    "difficulty": "Mid-Level",
    "industry": "${jobDetails.industry || 'General'}",
    "role": "${jobDetails.title || 'General'}",
    "starGuidance": {
      "situation": "Brief guidance on what situation to describe",
      "task": "What task/challenge should be explained",
      "action": "What actions to highlight",
      "result": "What results to emphasize"
    },
    "tips": [
      "Tip 1 for answering this question",
      "Tip 2",
      "Tip 3"
    ],
    "commonMistakes": [
      "Common mistake 1 to avoid",
      "Common mistake 2"
    ],
    "idealResponseLength": {
      "min": 150,
      "max": 300
    },
    "timeLimit": 15,
    "followUpQuestions": [
      "Potential follow-up question 1",
      "Potential follow-up question 2"
    ]
  }
]

Ensure questions are:
- Specific and relevant to ${jobDetails.title}
- Varied across different categories
- Appropriate for ${jobDetails.level || 'Mid-Level'} level
- Actionable with clear STAR guidance`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from response
    let jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }
    
    const questions = JSON.parse(jsonMatch[0]);
    return questions;
    
  } catch (error) {
    console.error('Error generating behavioral questions:', error);
    throw error;
  }
}

/**
 * Generate personalized improvement plan
 * @param {Object} performanceData - User's performance data
 * @returns {Object} - Personalized improvement plan
 */
export async function generateImprovementPlan(performanceData) {
  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

    const prompt = `You are an expert career coach. Based on the following performance data, create a personalized improvement plan for interview preparation.

**PERFORMANCE DATA:**
- Total Sessions: ${performanceData.totalSessions}
- Total Questions Answered: ${performanceData.totalQuestionsAnswered}
- Average Score: ${performanceData.averageScore}
- Total Time Spent: ${Math.round(performanceData.totalTimeSpent / 60)} minutes

**CATEGORY PERFORMANCE:**
${performanceData.categoryPerformance?.map(cp => 
  `- ${cp.category}: ${cp.averageScore.toFixed(1)}/100 (${cp.questionsAnswered} questions)`
).join('\n')}

**STRENGTH CATEGORIES:** ${performanceData.strengthCategories?.join(', ') || 'None identified yet'}
**IMPROVEMENT CATEGORIES:** ${performanceData.improvementCategories?.join(', ') || 'None identified yet'}

**NERVE MANAGEMENT:**
- Confidence Level: ${performanceData.nerveManagementProgress?.confidenceLevel || 5}/10
- Preparedness Level: ${performanceData.nerveManagementProgress?.preparednessLevel || 5}/10

**TASK:**
Create a comprehensive 4-week improvement plan with:
1. Weekly focus areas
2. Specific exercises and practice questions
3. Time management recommendations
4. Confidence-building techniques
5. Milestone goals

**OUTPUT FORMAT (strict JSON):**
{
  "summary": "Overall assessment and plan overview",
  "weeklyPlan": [
    {
      "week": 1,
      "focus": "Main focus area",
      "goals": ["Goal 1", "Goal 2"],
      "exercises": ["Exercise 1", "Exercise 2"],
      "practiceCategories": ["Category 1", "Category 2"],
      "timeCommitment": "Recommended hours per week"
    }
  ],
  "confidenceBuilding": [
    "Technique 1",
    "Technique 2"
  ],
  "milestones": [
    {
      "milestone": "Achievement to aim for",
      "targetWeek": 2,
      "criteria": "How to measure success"
    }
  ],
  "resources": [
    "Resource recommendation 1",
    "Resource recommendation 2"
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }
    
    return JSON.parse(jsonMatch[0]);
    
  } catch (error) {
    console.error('Error generating improvement plan:', error);
    throw error;
  }
}
