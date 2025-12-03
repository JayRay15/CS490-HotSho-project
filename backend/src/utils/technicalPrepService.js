import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract JSON from AI response that may contain markdown or extra text
 */
function extractJSON(response) {
  let cleaned = response.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Try to find JSON object/array in the response
  const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  // Remove any text before the first { or [
  const firstBrace = Math.min(
    cleaned.indexOf('{') >= 0 ? cleaned.indexOf('{') : Infinity,
    cleaned.indexOf('[') >= 0 ? cleaned.indexOf('[') : Infinity
  );
  if (firstBrace !== Infinity && firstBrace > 0) {
    cleaned = cleaned.substring(firstBrace);
  }
  
  // Remove any text after the last } or ]
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (lastBrace >= 0 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.substring(0, lastBrace + 1);
  }
  
  // Fix common control character issues in string values
  // Replace unescaped newlines, tabs, and other control characters within strings
  cleaned = cleaned.replace(/(\\"[^"]*")|("[^"]*")/g, (match) => {
    // Don't process already escaped strings
    if (match.startsWith('\\"')) return match;
    
    // Escape control characters within the string
    return match
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\f/g, '\\f')
      .replace(/\b/g, '\\b');
  });
  
  return cleaned.trim();
}

/**
 * Generate coding challenges based on job requirements
 */
export async function generateCodingChallenges(jobDetails) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

  const prompt = `You are a technical interview expert. Generate 3 coding challenges for the following job:

**JOB DETAILS:**
Title: ${jobDetails.title || 'Software Engineer'}
Company: ${jobDetails.company || 'Tech Company'}
Level: ${jobDetails.level || 'Mid-Level'}
Tech Stack: ${jobDetails.techStack?.join(', ') || 'General Programming'}
Required Skills: ${jobDetails.requiredSkills?.join(', ') || 'Problem Solving'}
Description: ${jobDetails.description || 'Software development role'}

Generate 3 coding challenges with varying difficulty (Easy, Medium, Hard) that are relevant to this role.

IMPORTANT: The "category" field MUST be ONE of these exact values:
- Data Structures
- Algorithms
- System Design
- Database
- API Design
- Frontend
- Backend
- Full Stack

Return ONLY valid JSON (no markdown formatting, no code blocks, no extra text). Ensure all strings are properly escaped.

{
  "challenges": [
    {
      "title": "Challenge Title",
      "description": "Brief description (1 sentence)",
      "difficulty": "Easy|Medium|Hard",
      "category": "Data Structures",
      "techStack": ["Language1", "Language2"],
      "timeLimit": 15,
      "problemStatement": "Detailed problem statement with clear requirements",
      "constraints": ["constraint1", "constraint2"],
      "examples": [
        {
          "input": "example input",
          "output": "expected output",
          "explanation": "why this output"
        }
      ],
      "testCases": [
        {
          "input": {"param1": "value"},
          "expectedOutput": "result",
          "isHidden": false
        }
      ],
      "starterCode": {
        "javascript": "function solution() { }",
        "python": "def solution(): pass",
        "java": "public class Solution { }"
      },
      "hints": ["hint1", "hint2"],
      "solution": {
        "code": "complete working solution code",
        "language": "javascript",
        "explanation": "detailed explanation of the approach",
        "timeComplexity": "O(n)",
        "spaceComplexity": "O(1)"
      },
      "relatedConcepts": ["concept1", "concept2"],
      "companyTags": ["${jobDetails.company || 'Tech Companies'}"],
      "realWorldApplication": "how this applies to real work"
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  try {
    const cleanedResponse = extractJSON(response);
    const parsed = JSON.parse(cleanedResponse);
    return parsed.challenges || [];
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Problematic JSON:', response.substring(0, 500));
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}

/**
 * Generate system design questions for senior roles
 */
export async function generateSystemDesignQuestions(jobDetails) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

  const prompt = `You are a technical interview expert specializing in system design. Generate 2 system design questions for the following senior role:

**JOB DETAILS:**
Title: ${jobDetails.title || 'Senior Software Engineer'}
Company: ${jobDetails.company || 'Tech Company'}
Level: ${jobDetails.level || 'Senior'}
Tech Stack: ${jobDetails.techStack?.join(', ') || 'Distributed Systems'}
Required Skills: ${jobDetails.requiredSkills?.join(', ') || 'System Architecture'}
Description: ${jobDetails.description || 'Senior engineering role'}

Generate 2 system design questions relevant to this role.

Return ONLY valid JSON in this exact format (no markdown, no code blocks, no extra text):
{
  "questions": [
    {
      "title": "Design Question Title",
      "description": "Brief description (1 sentence)",
      "level": "Senior|Staff|Principal",
      "scenario": "Detailed scenario description",
      "requirements": {
        "functional": ["requirement1", "requirement2"],
        "nonFunctional": ["requirement1", "requirement2"],
        "constraints": ["constraint1", "constraint2"]
      },
      "scale": {
        "users": "number of users",
        "requests": "requests per second",
        "storage": "storage requirements"
      },
      "keyComponents": ["component1", "component2"],
      "considerations": ["consideration1", "consideration2"],
      "solutionFramework": {
        "architecture": "high-level architecture description",
        "components": [
          {
            "name": "Component Name",
            "description": "what it does",
            "technology": "suggested tech"
          }
        ],
        "dataFlow": "how data flows through system",
        "scalingStrategy": "how to scale",
        "tradeOffs": ["tradeoff1", "tradeoff2"]
      },
      "followUpQuestions": ["question1", "question2"],
      "relatedTopics": ["topic1", "topic2"]
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  try {
    const cleanedResponse = extractJSON(response);
    const parsed = JSON.parse(cleanedResponse);
    return parsed.questions || [];
  } catch (error) {
    console.error('Failed to parse system design response:', error);
    console.error('Response:', response.substring(0, 500));
    return [];
  }
}

/**
 * Generate case studies for consulting/business roles
 */
export async function generateCaseStudies(jobDetails) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

  const prompt = `You are a business case interview expert. Generate 2 case studies for the following role:

**JOB DETAILS:**
Title: ${jobDetails.title || 'Business Analyst'}
Company: ${jobDetails.company || 'Consulting Firm'}
Level: ${jobDetails.level || 'Mid-Level'}
Industry: ${jobDetails.industry || 'Technology'}
Required Skills: ${jobDetails.requiredSkills?.join(', ') || 'Business Analysis'}
Description: ${jobDetails.description || 'Business role'}

Generate 2 case studies relevant to this role.

Return ONLY valid JSON in this exact format (no markdown, no code blocks, no extra text):
{
  "caseStudies": [
    {
      "title": "Case Study Title",
      "industry": "Industry Name",
      "type": "Business|Technical|Product",
      "scenario": "Detailed scenario description",
      "context": "Background context and current situation",
      "data": {
        "currentMetrics": {"metric1": 100, "metric2": 200},
        "industryBenchmarks": {"metric1": 120, "metric2": 180}
      },
      "questions": ["question1", "question2", "question3"],
      "framework": {
        "approach": "recommended framework to use",
        "keySteps": ["step1", "step2", "step3"],
        "analysisTools": ["tool1", "tool2"]
      },
      "sampleSolution": {
        "approach": "how to approach the problem",
        "analysis": "key analysis points",
        "recommendations": ["recommendation1", "recommendation2"],
        "expectedOutcome": "expected business impact"
      }
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  try {
    const cleanedResponse = extractJSON(response);
    const parsed = JSON.parse(cleanedResponse);
    return parsed.caseStudies || [];
  } catch (error) {
    console.error('Failed to parse case studies response:', error);
    console.error('Response:', response.substring(0, 500));
    return [];
  }
}

/**
 * Generate comprehensive technical prep content based on job
 */
export async function generateCompleteTechnicalPrep(jobDetails) {
  try {
    // Infer level from title if not provided
    let inferredLevel = jobDetails.level;
    
    if (!inferredLevel && jobDetails.title) {
      const titleLower = jobDetails.title.toLowerCase();
      
      if (titleLower.includes('senior')) inferredLevel = 'Senior';
      else if (titleLower.includes('staff')) inferredLevel = 'Staff';
      else if (titleLower.includes('principal')) inferredLevel = 'Principal';
      else if (titleLower.includes('lead')) inferredLevel = 'Lead';
    }

    const jobDetailsWithLevel = { ...jobDetails, level: inferredLevel };
    
    const shouldGenerateSystemDesign = inferredLevel && ['Senior', 'Staff', 'Principal', 'Lead'].some(l => inferredLevel.includes(l));
    const shouldGenerateCaseStudy = ['Business', 'Consulting', 'Product', 'Analyst', 'Finance', 'Financial'].some(term => 
      jobDetails.title?.toLowerCase().includes(term.toLowerCase())
    );
    
    // Skip coding challenges for pure business/analyst roles
    const shouldGenerateCoding = !shouldGenerateCaseStudy || 
      jobDetails.title?.toLowerCase().includes('technical') ||
      jobDetails.title?.toLowerCase().includes('engineer') ||
      jobDetails.title?.toLowerCase().includes('developer');

    const [codingChallenges, systemDesignQuestions, caseStudies] = await Promise.all([
      shouldGenerateCoding
        ? generateCodingChallenges(jobDetailsWithLevel)
        : Promise.resolve([]),
      shouldGenerateSystemDesign
        ? generateSystemDesignQuestions(jobDetailsWithLevel)
        : Promise.resolve([]),
      shouldGenerateCaseStudy
        ? generateCaseStudies(jobDetailsWithLevel)
        : Promise.resolve([])
    ]);

    return {
      codingChallenges,
      systemDesignQuestions,
      caseStudies
    };
  } catch (error) {
    console.error('Error generating technical prep content:', error);
    throw error;
  }
}
