import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  TONE_OPTIONS, 
  INDUSTRY_SETTINGS, 
  COMPANY_CULTURE, 
  LENGTH_OPTIONS, 
  WRITING_STYLE 
} from '../config/coverLetterTones.js';
import dotenv from 'dotenv';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate text using Gemini AI
 * @param {string} prompt - The prompt to send to Gemini
 * @param {Object} options - Generation options (temperature, maxTokens)
 * @returns {Promise<string>} Generated text
 */
export async function generateText(prompt, options = {}) {
  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating text with Gemini:', error);
    throw new Error(`Failed to generate text: ${error.message}`);
  }
}

/**
 * Generate multiple variations of tailored resume content
 * @param {Object} jobPosting - The job posting to tailor for
 * @param {Object} userProfile - The user's profile data
 * @param {Object} template - The resume template being used
 * @param {number} numVariations - Number of variations to generate (default: 3)
 * @returns {Array} Array of generated resume content variations
 */
export async function generateResumeContentVariations(jobPosting, userProfile, template, numVariations = 3) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

  const prompt = `You are an expert resume writer and career coach. Generate ${numVariations} DIFFERENT variations of tailored resume content based on the job posting and user's profile. Each variation should approach the content from a different angle or emphasis.

**JOB POSTING:**
Title: ${jobPosting.title}
Company: ${jobPosting.company}
Description: ${jobPosting.description || 'Not provided'}
Requirements: ${jobPosting.requirements || 'Not provided'}

**USER PROFILE:**
Employment History:
${userProfile.employment?.map(job => `
- ${job.jobTitle} at ${job.company} (${job.startDate} - ${job.isCurrentPosition ? 'Present' : job.endDate})
  ${job.description || 'No description'}
`).join('\n') || 'No employment history'}

Skills:
${userProfile.skills?.map(skill => `- ${skill.name} (${skill.level})`).join('\n') || 'No skills listed'}

Education:
${userProfile.education?.map(edu => `
- ${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution} (${edu.graduationYear || edu.endDate})
`).join('\n') || 'No education listed'}

Projects:
${userProfile.projects?.map(proj => `
- ${proj.name}: ${proj.description}
  Technologies: ${proj.technologies?.join(', ') || 'Not specified'}
`).join('\n') || 'No projects listed'}

Certifications:
${userProfile.certifications?.map(cert => `- ${cert.name} (${cert.issuingOrganization})`).join('\n') || 'No certifications'}

**TASK:**
Generate ${numVariations} professional resume content variations, each with a different approach:
- Variation 1: Focus on technical skills and achievements
- Variation 2: Focus on leadership and impact
- Variation 3: Focus on problem-solving and innovation (or different emphasis based on job requirements)

IMPORTANT RULES:
- Use ONLY factual information from the user's profile
- DO NOT fabricate dates, companies, or specific achievements
- Each variation should be distinctly different in tone or emphasis
- Make bullet points achievement-oriented using action verbs
- Focus on impact and results when possible
- Ensure all content is ready for a professional resume

For EACH variation, generate:
1. **Professional Summary** (3-4 compelling sentences)
2. **Experience Bullets** (For EACH job, create 3-5 strong bullet points)
3. **Relevant Skills** (10-15 skills most relevant to this job)
4. **ATS Keywords** (10-15 important keywords from the job posting)

**OUTPUT FORMAT (JSON):**
{
  "variations": [
    {
      "variationNumber": 1,
      "emphasis": "Technical skills and achievements",
      "summary": "...",
      "experienceBullets": {
        "job0": ["Bullet 1", "Bullet 2", ...],
        "job1": [...]
      },
      "relevantSkills": ["skill1", "skill2", ...],
      "atsKeywords": ["keyword1", "keyword2", ...],
      "tailoringNotes": "Focus on technical expertise..."
    },
    {
      "variationNumber": 2,
      "emphasis": "Leadership and impact",
      ...
    },
    {
      "variationNumber": 3,
      "emphasis": "Problem-solving and innovation",
      ...
    }
  ]
}

Return ONLY valid JSON, no markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    
    const generatedVariations = JSON.parse(cleanedText.trim());
    return generatedVariations.variations || [];
  } catch (error) {
    console.error('Error generating resume content variations with Gemini:', error);
    throw new Error(`Failed to generate resume content variations: ${error.message}`);
  }
}

/**
 * Generate tailored resume content based on job posting and user profile
 * @param {Object} jobPosting - The job posting to tailor for
 * @param {Object} userProfile - The user's profile data
 * @param {Object} template - The resume template being used
 * @returns {Object} Generated resume content
 */
export async function generateResumeContent(jobPosting, userProfile, template) {
  // Validate inputs
  if (!jobPosting || !userProfile) {
    throw new Error('jobPosting and userProfile are required');
  }
  
  // Ensure template has safe defaults
  if (!template) {
    template = { layout: {} };
  }
  if (!template.layout) {
    template.layout = {};
  }
  
  const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

  const prompt = `You are an expert resume writer and career coach. Generate tailored resume content based on the job posting and user's profile.

**JOB POSTING:**
Title: ${jobPosting.title}
Company: ${jobPosting.company}
Description: ${jobPosting.description || 'Not provided'}
Requirements: ${jobPosting.requirements || 'Not provided'}

**USER PROFILE:**
Employment History:
${userProfile.employment?.map(job => `
- ${job.jobTitle} at ${job.company} (${job.startDate} - ${job.isCurrentPosition ? 'Present' : job.endDate})
  ${job.description || 'No description'}
`).join('\n') || 'No employment history'}

Skills:
${userProfile.skills?.map(skill => `- ${skill.name} (${skill.level})`).join('\n') || 'No skills listed'}

Education:
${userProfile.education?.map(edu => `
- ${edu.degree || ''} ${edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''} from ${edu.institution || ''} (${edu.graduationYear || edu.endDate || edu.startDate || 'N/A'})
  Location: ${edu.location || 'Not specified'}
  GPA: ${edu.gpa && !edu.gpaPrivate ? edu.gpa : 'Not specified'}
`).join('\n') || 'No education listed'}

Projects:
${userProfile.projects?.map(proj => `
- ${proj.name}: ${proj.description}
  Technologies: ${proj.technologies?.join(', ') || 'Not specified'}
`).join('\n') || 'No projects listed'}

Certifications:
${userProfile.certifications?.map(cert => `- ${cert.name} (${cert.issuingOrganization})`).join('\n') || 'No certifications'}

**RESUME TEMPLATE FORMAT (DETECTED FROM UPLOADED TEMPLATE):**
${template && template.layout && template.layout.projectFormat ? `
PROJECTS FORMAT (detected from template): ${JSON.stringify(template.layout.projectFormat)}
- You MUST match the template's format EXACTLY
- Template structure: ${template.layout.projectFormat.titleWithTech ? '"Project Title | Technology1, Technology2, Technology3" on ONE line' : 'Project Title on first line, Technologies on second line (separate)'}, then ${template.layout.projectFormat.bulletsAfterTitle ? 'bullet points' : 'description'} below
- Bullet character to use: "${template.layout.projectFormat.bulletCharacter || '•'}"
- ${template.layout.projectFormat.titleWithTech ? 'CRITICAL: Put project title AND technologies on the SAME line, separated by a pipe (|) character' : 'Put project title on first line, technologies on second line'}
- Use bullet points: ${template.layout.projectFormat.hasBullets ? `YES, use "${template.layout.projectFormat.bulletCharacter || '•'}" character` : 'NO, use paragraph format'}
` : `
PROJECTS FORMAT: Standard format (template format not detected)
- Use: Project Title, then Technologies, then bullet points
`}

${template && template.layout && template.layout.experienceFormat ? `
EXPERIENCE FORMAT (detected from template): ${JSON.stringify(template.layout.experienceFormat)}
- Match the template format EXACTLY:
  - Job Title and Company: ${template.layout.experienceFormat.titleCompanySameLine ? 'On the SAME line (e.g., "Software Engineer at Company Name")' : 'On SEPARATE lines (Title on first line, Company on second)'}
  - Dates placement: ${template.layout.experienceFormat.datesOnRight ? 'On the RIGHT side of the same line' : 'On a line below the title/company'}
  - Bullet points: ${template.layout.experienceFormat.hasBullets ? `Use "${template.layout.experienceFormat.bulletCharacter || '•'}" character` : 'Use paragraph format'}
  - Bullet indentation: ${template.layout.experienceFormat.bulletIndentation || 0} spaces
` : 'Use standard format: Job title, company, dates, then bullet points'}

${template && template.layout && template.layout.educationFormat ? `
EDUCATION FORMAT (detected from template): ${JSON.stringify(template.layout.educationFormat)}
- Follow the template's field order and layout EXACTLY: ${template.layout.educationFormat.order.join(' → ')}
- Dates placement: ${template.layout.educationFormat.datesOnRight ? 'On the RIGHT side' : 'On a line below'}
- Location placement: ${template.layout.educationFormat.locationAfterInstitution ? 'After institution name' : 'Separate line'}
- GPA format: ${template.layout.educationFormat.gpaSeparateLine ? 'On separate line' : 'On same line as degree/institution'}
` : 'Use standard format: Degree, institution, dates, GPA'}

**TASK:**
Generate professional resume content tailored to this job posting. Create compelling, achievement-focused content that highlights how the user's actual experience matches the job requirements.

IMPORTANT RULES:
- Use ONLY factual information from the user's profile
- DO NOT fabricate dates, companies, or specific achievements
- If employment descriptions are missing, create professional bullet points based on the job title and company context
- Make bullet points achievement-oriented using action verbs (Led, Developed, Implemented, etc.)
- Focus on impact and results when possible
- Ensure all content is ready for a professional resume - no technical notes or disclaimers
- **CRITICAL: Follow the template format exactly as specified above for projects, experience, and education**

Generate:

1. **Professional Summary** (3-4 compelling sentences that position the candidate for THIS specific role)

2. **Experience Bullets** (For EACH job in their employment history, create 3-5 strong, achievement-focused bullet points that:
   - Highlight relevant skills and accomplishments
   - Use strong action verbs
   - Connect their experience to the target job requirements
   - Show progression and impact)

3. **Projects** (For EACH project, format according to template EXACTLY:
   - ${template && template.layout && template.layout.projectFormat && template.layout.projectFormat.titleWithTech ? 'FIRST LINE: "Project Name | Tech1, Tech2, Tech3" (title and tech on SAME line with pipe separator)' : 'FIRST LINE: Project name only\nSECOND LINE: Tech1, Tech2, Tech3 (technologies on separate line)'}
   - Then 3-4 achievement-focused bullet points using "${template && template.layout && template.layout.projectFormat ? (template.layout.projectFormat.bulletCharacter || '•') : '•'}" character
   - Each bullet should start with the exact bullet character specified
   - Use action verbs and quantify results when possible)

4. **Relevant Skills** (Select 10-15 skills from their profile most relevant to this job. Include both technical and soft skills mentioned in the job description)

5. **ATS Keywords** (10-15 important keywords from the job posting for ATS optimization)

**OUTPUT FORMAT (JSON):**
{
  "summary": "Compelling professional summary...",
  "experienceBullets": {
    "job0": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5"],
    "job1": ["Bullet 1", "Bullet 2", "Bullet 3"],
    "job2": [...]
  },
  "projects": [
    {
      "name": "Project Name",
      "technologies": ["Tech1", "Tech2", "Tech3"],
      "bullets": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4"]
    }
  ],
  "relevantSkills": ["skill1", "skill2", "skill3", ...],
  "atsKeywords": ["keyword1", "keyword2", ...],
  "tailoringNotes": "One sentence about the tailoring strategy"
}

Return ONLY valid JSON, no markdown formatting. Make all content professional and resume-ready.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();
    
    // Log first 500 chars for debugging
    console.log('AI Response (first 500 chars):', cleanedText.substring(0, 500));
    
    // Try to parse JSON
    let generatedContent;
    try {
      generatedContent = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON Parse Error at position:', parseError.message);
      console.error('Text around error position:', cleanedText.substring(Math.max(0, parseError.message.match(/position (\d+)/)?.[1] - 100 || 0), Math.min(cleanedText.length, parseError.message.match(/position (\d+)/)?.[1] + 100 || 500)));
      
      // Try to fix common JSON issues
      // Remove trailing commas before ] or }
      cleanedText = cleanedText.replace(/,(\s*[}\]])/g, '$1');
      
      // Try parsing again
      try {
        generatedContent = JSON.parse(cleanedText);
        console.log('✓ Fixed JSON and parsed successfully');
      } catch (retryError) {
        console.error('Failed to parse JSON after fixes:', retryError);
        throw new Error(`Invalid JSON response from AI: ${parseError.message}. Response preview: ${cleanedText.substring(0, 200)}...`);
      }
    }
    
    return generatedContent;
  } catch (error) {
    console.error('Error generating resume content with Gemini:', error);
    throw new Error(`Failed to generate resume content: ${error.message}`);
  }
}

/**
 * Regenerate a specific section of resume content
 * @param {string} section - Section to regenerate (summary, experience, skills)
 * @param {Object} jobPosting - The job posting
 * @param {Object} userProfile - User's profile
 * @param {Object} currentContent - Current resume content for context
 * @returns {Object} Regenerated section content
 */
export async function regenerateSection(section, jobPosting, userProfile, currentContent) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

  let prompt = '';
  
  switch (section) {
    case 'summary':
      prompt = `Generate an alternative professional summary (3-4 sentences) for a resume tailored to this job:

Job: ${jobPosting.title} at ${jobPosting.company}
Description: ${jobPosting.description}

User Background:
${userProfile.employment?.[0] ? `Current/Recent Role: ${userProfile.employment[0].jobTitle} at ${userProfile.employment[0].company}` : ''}
Skills: ${userProfile.skills?.map(s => s.name).join(', ') || 'Not specified'}

Previous summary: ${currentContent.summary}

Generate a DIFFERENT summary with a fresh angle while staying factual. Return only the summary text, no JSON.`;
      break;
      
    case 'experience':
      prompt = `Generate alternative achievement-focused bullet points for the user's work experience, tailored to this job:

Job Target: ${jobPosting.title} at ${jobPosting.company}
Requirements: ${jobPosting.requirements || jobPosting.description}

User's Experience:
${userProfile.employment?.map((job, index) => `
Job ${index} (job${index}): ${job.jobTitle} at ${job.company}
${job.description || 'No description'}
`).join('\n')}

Generate 3-5 DIFFERENT bullet points for each job that emphasize different aspects relevant to the target role.
Return as JSON with keys "job0", "job1", etc.: {"job0": ["bullet1", "bullet2", ...], "job1": ["bullet1", "bullet2", ...]}`;
      break;
      
    case 'skills':
      prompt = `From this user's skill set, select a DIFFERENT combination of 8-12 skills most relevant to this job:

Job: ${jobPosting.title}
Requirements: ${jobPosting.requirements || jobPosting.description}

Available Skills: ${userProfile.skills?.map(s => s.name).join(', ')}
Previous Selection: ${Array.isArray(currentContent.skills) ? currentContent.skills.map(s => typeof s === 'string' ? s : s.name).join(', ') : currentContent.relevantSkills?.join(', ') || 'None'}

Return only a JSON array of skill names: ["skill1", "skill2", ...]`;
      break;
      
    default:
      throw new Error(`Invalid section: ${section}`);
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean markdown if present
    if (text.startsWith('```json')) {
      text = text.slice(7);
    } else if (text.startsWith('```')) {
      text = text.slice(3);
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
    text = text.trim();
    
    // For summary, return as-is if not JSON
    if (section === 'summary' && !text.startsWith('{') && !text.startsWith('[')) {
      return { summary: text };
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error(`Error regenerating ${section}:`, error);
    throw new Error(`Failed to regenerate ${section}: ${error.message}`);
  }
}

/**
 * Analyze ATS compatibility of resume content
 * @param {Object} resumeContent - The resume content to analyze
 * @param {Object} jobPosting - The job posting
 * @returns {Object} ATS analysis with score and suggestions
 */
export async function analyzeATSCompatibility(resumeContent, jobPosting) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

  const prompt = `Analyze this resume content for ATS (Applicant Tracking System) compatibility against the job posting.

**JOB POSTING:**
${jobPosting.title} at ${jobPosting.company}
Requirements: ${jobPosting.requirements || jobPosting.description}

**RESUME CONTENT:**
Summary: ${resumeContent.summary}
Skills: ${resumeContent.relevantSkills?.join(', ')}
Experience highlights: ${JSON.stringify(resumeContent.experienceBullets)}

**ANALYSIS REQUIRED:**
1. ATS Score (0-100) - how well keywords match
2. Missing Keywords - important keywords from job posting not in resume
3. Keyword Density - is it natural or keyword-stuffed?
4. Improvement Suggestions - 3-5 specific recommendations

Return as JSON:
{
  "score": 85,
  "missingKeywords": ["keyword1", "keyword2"],
  "keywordDensity": "optimal|good|low|excessive",
  "suggestions": ["suggestion1", "suggestion2", ...],
  "matchedKeywords": ["keyword1", "keyword2", ...]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    if (text.startsWith('```json')) {
      text = text.slice(7);
    } else if (text.startsWith('```')) {
      text = text.slice(3);
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Error analyzing ATS compatibility:', error);
    throw new Error(`Failed to analyze ATS compatibility: ${error.message}`);
  }
}

/**
 * Optimize resume skills based on job requirements (UC-49)
 * @param {Object} resume - The resume to optimize
 * @param {Object} jobPosting - The job posting to optimize for
 * @param {Object} userProfile - User's complete skill profile
 * @returns {Object} Skills optimization with reordering, gaps, and matching score
 */
export async function optimizeResumeSkills(resume, jobPosting, userProfile) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

  const prompt = `You are an expert resume optimization specialist. Analyze the job requirements and optimize the skills section for maximum impact.

**JOB POSTING:**
Title: ${jobPosting.title}
Company: ${jobPosting.company}
Description: ${jobPosting.description || 'Not provided'}
Requirements: ${jobPosting.requirements || 'Not provided'}

**CURRENT RESUME SKILLS:**
${resume.sections?.skills?.map(skill => `- ${skill.name || skill} (${skill.level || 'Not specified'})`).join('\n') || 'No skills listed'}

**USER'S COMPLETE SKILL PROFILE:**
${userProfile.skills?.map(skill => `- ${skill.name} (${skill.level}, ${skill.yearsOfExperience || 0} years)`).join('\n') || 'No additional skills'}

**ANALYSIS REQUIRED:**
1. **Match Score** (0-100): How well current skills match the job
2. **Optimized Skills List**: Reorder and select the most relevant 10-15 skills from user's profile for this specific job
3. **Technical Skills**: Category with most relevant technical skills
4. **Soft Skills**: Category with most relevant soft skills  
5. **Missing Skills**: Important skills from job requirements that user doesn't have
6. **Skills to Add**: Skills from user's profile that should be added to resume for this job
7. **Skills to Emphasize**: Which skills should be highlighted or moved to top
8. **Industry Recommendations**: Industry-specific skills that would strengthen the application

**OUTPUT FORMAT (JSON):**
{
  "matchScore": 85,
  "optimizedSkills": [
    {"name": "Skill name", "level": "Expert/Advanced/Intermediate/Beginner", "relevance": "high/medium/low", "reason": "Why this skill matters for this job"}
  ],
  "technicalSkills": ["skill1", "skill2", ...],
  "softSkills": ["skill1", "skill2", ...],
  "missingSkills": [
    {"name": "Skill name", "importance": "critical/important/nice-to-have", "suggestion": "How to acquire or demonstrate"}
  ],
  "skillsToAdd": ["skill1 from user profile", "skill2 from user profile", ...],
  "skillsToEmphasize": ["skill1", "skill2", ...],
  "industryRecommendations": [
    {"skill": "Skill name", "reason": "Why it's valuable in this industry"}
  ],
  "summary": "2-3 sentence summary of the skills optimization strategy"
}

Return ONLY valid JSON, no markdown formatting. Focus on actionable, specific recommendations.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    
    const optimization = JSON.parse(cleanedText.trim());
    return optimization;
  } catch (error) {
    console.error('Error optimizing skills:', error);
    throw new Error(`Failed to optimize skills: ${error.message}`);
  }
}

/**
 * Tailor experience descriptions based on job requirements (UC-50)
 * @param {Object} resume - The resume to tailor
 * @param {Object} jobPosting - The job posting
 * @param {Object} userProfile - User's complete employment history
 * @returns {Object} Experience tailoring with suggestions and variations
 */
export async function tailorExperience(resume, jobPosting, userProfile) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

  const currentExperience = resume.sections?.experience || [];
  
  const prompt = `You are an expert resume writer specializing in experience optimization. Analyze the job requirements and suggest how to tailor each experience entry.

**JOB POSTING:**
Title: ${jobPosting.title}
Company: ${jobPosting.company}
Description: ${jobPosting.description || 'Not provided'}
Requirements: ${jobPosting.requirements || 'Not provided'}

**CURRENT RESUME EXPERIENCE:**
${currentExperience.map((exp, idx) => `
Experience ${idx + 1}:
- Job Title: ${exp.jobTitle}
- Company: ${exp.company}
- Duration: ${exp.startDate} - ${exp.endDate || 'Present'}
- Current Bullets:
${exp.bullets?.map(b => `  • ${b}`).join('\n') || '  (No bullets)'}
`).join('\n---\n')}

**USER'S FULL EMPLOYMENT HISTORY:**
${userProfile.employment?.map(job => `
- ${job.jobTitle} at ${job.company}
- ${job.startDate} - ${job.isCurrentPosition ? 'Present' : job.endDate}
- Description: ${job.description || 'No description'}
`).join('\n')}

**TASK:**
For each experience entry, provide:
1. **Relevance Score** (0-100): How relevant this experience is to the job
2. **Modification Suggestions**: Specific changes to make bullets more impactful
3. **3 Bullet Variations**: Different ways to phrase each bullet (achievement-focused, technical-focused, impact-focused)
4. **Action Verbs**: Better action verbs to use
5. **Quantification Opportunities**: Where to add metrics/numbers
6. **Keyword Integration**: Which job keywords to naturally incorporate

**OUTPUT FORMAT (JSON):**
{
  "experiences": [
    {
      "experienceIndex": 0,
      "jobTitle": "Job title",
      "relevanceScore": 85,
      "overallSuggestion": "Brief suggestion for this experience",
      "bullets": [
        {
          "originalBullet": "Current bullet text",
          "suggestions": "Specific improvements for this bullet",
          "variations": [
            {"type": "achievement", "text": "Achievement-focused version", "reason": "Why this angle works"},
            {"type": "technical", "text": "Technical skills version", "reason": "Highlights technical expertise"},
            {"type": "impact", "text": "Business impact version", "reason": "Shows measurable results"}
          ],
          "suggestedActionVerbs": ["verb1", "verb2", "verb3"],
          "quantificationIdeas": ["Add: number of X", "Include: % improvement"],
          "keywordsToAdd": ["keyword1", "keyword2"]
        }
      ]
    }
  ],
  "summary": "Overall strategy for experience tailoring"
}

Return ONLY valid JSON, no markdown formatting. Focus on maintaining factual accuracy while optimizing for impact.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    
    const tailoring = JSON.parse(cleanedText.trim());
    return tailoring;
  } catch (error) {
    console.error('Error tailoring experience:', error);
    throw new Error(`Failed to tailor experience: ${error.message}`);
  }
}

/**
 * Clean up AI response by removing unwanted markers, notes, and artifacts
 */
function cleanAIResponse(text) {
  // Remove common AI meta-commentary patterns
  text = text.replace(/\*\*CRITICAL NOTE:\*\*[^\n]*\n*/gi, '');
  text = text.replace(/\*\*NOTE:\*\*[^\n]*\n*/gi, '');
  text = text.replace(/\*\*IMPORTANT:\*\*[^\n]*\n*/gi, '');
  
  // Remove markdown formatting (bold and italics)
  // Remove bold: **word** -> word
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  // Remove italics: *word* -> word
  text = text.replace(/\*([^*\n]+)\*/g, '$1');
  
  // Remove standalone asterisks or hash marks
  text = text.replace(/^\s*\*{3,}\s*$/gm, '');
  text = text.replace(/^\s*#{3,}\s*$/gm, '');
  
  // Remove explanatory parentheticals at the start
  text = text.replace(/^\s*\([^)]*omitting[^)]*\)\s*/gi, '');
  text = text.replace(/^\s*\([^)]*not supplied[^)]*\)\s*/gi, '');
  
  // Remove focus annotations like *(Focus: ...)*
  text = text.replace(/^\s*\*\(Focus:.*?\)\*\s*\n*/gm, '');
  
  // Trim multiple blank lines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

/**
 * Generate AI cover letter content based on job posting and user profile
 * @param {Object} params - Generation parameters
 * @param {string} params.companyName - Name of the company
 * @param {string} params.position - Job position title
 * @param {string} params.jobDescription - Full job posting description
 * @param {Object} params.userProfile - User's profile data
 * @param {string} params.tone - Desired tone (formal, modern, creative, technical, executive)
 * @param {number} params.variationCount - Number of variations to generate (1-3)
 * @returns {Promise<Array>} Array of generated cover letter variations
 */
export async function generateCoverLetter({
  companyName,
  position,
  jobDescription,
  userProfile,
  tone = 'formal',
  variationCount = 1,
  industry = 'general',
  companyCulture = 'corporate',
  length = 'standard',
  writingStyle = 'hybrid',
  customInstructions = ''
}) {
  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    // Build user profile summary
    const profileSummary = buildProfileSummary(userProfile);

    // Construct the prompt with enhanced options
    const prompt = buildCoverLetterPrompt({
      companyName,
      position,
      jobDescription,
      profileSummary,
      tone,
      variationCount,
      industry,
      companyCulture,
      length,
      writingStyle,
      customInstructions
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up any unwanted markers or notes
    text = cleanAIResponse(text);

    // Parse the response to extract variations
    const variations = parseCoverLetterVariations(text, variationCount);

    return variations;
  } catch (error) {
    console.error('AI Generation Error:', error);
    throw new Error(`Failed to generate cover letter: ${error.message}`);
  }
}

/**
 * Build a comprehensive profile summary from user data
 */
function buildProfileSummary(profile) {
  const parts = [];

  // Add current date for the letter header
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Contact information - to be used in letter header
  const contactInfo = [];
  contactInfo.push(`Current Date: ${currentDate}`);
  
  if (profile.firstName && profile.lastName) {
    contactInfo.push(`Name: ${profile.firstName} ${profile.lastName}`);
  } else if (profile.name) {
    contactInfo.push(`Name: ${profile.name}`);
  }
  
  if (profile.email) {
    contactInfo.push(`Email: ${profile.email}`);
  }
  
  if (profile.phone) {
    contactInfo.push(`Phone: ${profile.phone}`);
  }
  
  if (profile.location) {
    contactInfo.push(`Location: ${profile.location}`);
  }
  
  if (contactInfo.length > 1) { // More than just the date
    parts.push('CONTACT INFORMATION (use this EXACT information in the letter header - DO NOT use placeholders):');
    parts.push(contactInfo.join('\n'));
  }

  // Basic info
  if (profile.headline) {
    parts.push(`\nHeadline/Title: ${profile.headline}`);
  }
  if (profile.professionalSummary || profile.bio) {
    parts.push(`\nProfessional Summary: ${profile.professionalSummary || profile.bio}`);
  }

  // Employment history
  if (profile.employment && profile.employment.length > 0) {
    parts.push('\n\nWork Experience:');
    profile.employment.slice(0, 3).forEach(job => {
      const position = job.position || job.jobTitle;
      const current = job.isCurrentPosition ? ' (Current)' : '';
      parts.push(`- ${position} at ${job.company}${current}`);
      if (job.description) {
        parts.push(`  ${job.description.substring(0, 200)}...`);
      }
    });
  }

  // Skills
  if (profile.skills && profile.skills.length > 0) {
    const topSkills = profile.skills
      .filter(s => s.level === 'Expert' || s.level === 'Advanced')
      .slice(0, 8)
      .map(s => s.name);
    if (topSkills.length > 0) {
      parts.push(`\n\nTop Skills: ${topSkills.join(', ')}`);
    }
  }

  // Education
  if (profile.education && profile.education.length > 0) {
    parts.push('\n\nEducation:');
    profile.education.slice(0, 2).forEach(edu => {
      parts.push(`- ${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}`);
      if (edu.gpa && edu.gpa >= 3.5) {
        parts.push(`  GPA: ${edu.gpa}`);
      }
    });
  }

  // Certifications
  if (profile.certifications && profile.certifications.length > 0) {
    const certs = profile.certifications.slice(0, 5).map(c => c.name);
    parts.push(`\n\nCertifications: ${certs.join(', ')}`);
  }

  // Projects
  if (profile.projects && profile.projects.length > 0) {
    parts.push('\n\nNotable Projects:');
    profile.projects.slice(0, 2).forEach(proj => {
      parts.push(`- ${proj.name}: ${proj.description?.substring(0, 150)}...`);
    });
  }

  return parts.join('\n');
}

/**
 * Build the AI prompt for cover letter generation with comprehensive tone and style options
 */
function buildCoverLetterPrompt({
  companyName,
  position,
  jobDescription,
  profileSummary,
  tone,
  variationCount,
  industry,
  companyCulture,
  length,
  writingStyle,
  customInstructions
}) {
  // Get configuration details
  const toneConfig = TONE_OPTIONS[tone] || TONE_OPTIONS.formal;
  const industryConfig = INDUSTRY_SETTINGS[industry] || INDUSTRY_SETTINGS.general;
  const cultureConfig = COMPANY_CULTURE[companyCulture] || COMPANY_CULTURE.corporate;
  const lengthConfig = LENGTH_OPTIONS[length] || LENGTH_OPTIONS.standard;
  const styleConfig = WRITING_STYLE[writingStyle] || WRITING_STYLE.hybrid;

  // Build industry-specific keyword guidance
  const industryKeywords = industryConfig.keywords.length > 0 
    ? `Industry Keywords to incorporate naturally: ${industryConfig.keywords.join(', ')}`
    : '';
  
  const industryTerminology = industryConfig.terminology.length > 0
    ? `Industry Terminology to use appropriately: ${industryConfig.terminology.join(', ')}`
    : '';

  return `You are an expert cover letter writer. Generate ${variationCount} compelling cover letter${variationCount > 1 ? 's' : ''} for the following job application.

**Job Details:**
- Company: ${companyName}
- Position: ${position}
- Job Description: ${jobDescription}

**Candidate Profile:**
${profileSummary}

**TONE AND STYLE REQUIREMENTS:**

**Primary Tone: ${toneConfig.name}**
${toneConfig.description}
Guidelines: ${toneConfig.guidelines}

**Industry Focus: ${industryConfig.name}**
${industryConfig.focus}
${industryKeywords}
${industryTerminology}

**Company Culture: ${cultureConfig.name}**
${cultureConfig.description}
Cultural Alignment: ${cultureConfig.language}

**Writing Style: ${styleConfig.name}**
${styleConfig.description}
Style Guidelines: ${styleConfig.guidelines}

**Length Target: ${lengthConfig.name}**
${lengthConfig.description}
Target word count: ${lengthConfig.wordCount.min}-${lengthConfig.wordCount.max} words (excluding header)
Number of body paragraphs: ${lengthConfig.paragraphs}
${lengthConfig.guidelines}

${customInstructions ? `**Custom Instructions:**\n${customInstructions}\n` : ''}

**Cover Letter Format:**
The cover letter MUST start with a professional header. Use the EXACT information from the CONTACT INFORMATION section above.

**HEADER FORMAT EXAMPLE:**
John Smith
john.smith@email.com
(555) 123-4567
New York, NY

December 8, 2024

Hiring Manager
${companyName}
[Company Location if known from job description]

**CRITICAL INSTRUCTIONS:**
1. The header MUST use the ACTUAL name, email, phone, and location from CONTACT INFORMATION
2. Use the Current Date provided in CONTACT INFORMATION (do NOT write "[Date]" or "Current Date")
3. NEVER write "[Your Name]", "[Your Email]", "[Your Phone]", "[Your Address]" - use ACTUAL values
4. If a field is not provided in CONTACT INFORMATION, omit it entirely (don't use placeholders)
5. The closing signature MUST use the actual candidate name (not "[Your Name]")
6. OUTPUT ONLY THE COVER LETTER - Do NOT include explanatory notes, asterisks, or meta-commentary
7. Do NOT start with phrases like "CRITICAL NOTE" or explanations about missing fields
8. Generate the complete professional cover letter directly without any preamble

**COMPANY RESEARCH REQUIREMENTS:**
Before writing, analyze the job description and company information to identify:
1. Company's mission, values, and culture (extract from job description)
2. Recent projects, initiatives, or achievements mentioned
3. Technologies, methodologies, or approaches the company uses
4. Industry trends or challenges the company is addressing
5. Company's competitive advantages or unique selling points

**Requirements:**
1. **Opening Paragraph:** 
   - Start with a compelling hook that demonstrates knowledge of ${companyName}
   - Reference specific company initiatives, projects, or achievements if mentioned in job description
   - Mention the specific position and show understanding of its strategic importance
   - Connect your interest to company's mission or recent developments
   - Personalize with company-specific details from the job description

2. **Body Paragraphs (2-3):**
   - **First Body Paragraph**: Highlight your most relevant experience that directly addresses company needs
     * Connect specific achievements to job requirements with quantifiable results
     * Use metrics (e.g., "increased efficiency by 40%", "managed team of 10", "reduced costs by $50K")
     * Reference technologies or methodologies mentioned in the job description
   
   - **Second Body Paragraph**: Demonstrate cultural fit and alignment with company values
     * Show understanding of company's industry position and challenges
     * Explain how your approach aligns with their culture and work style
     * Mention relevant skills that match their tech stack or requirements
   
   - **Third Body Paragraph (if needed)**: Additional relevant qualifications
     * Certifications, education, or projects that demonstrate expertise
     * Leadership experience or collaborative achievements
     * Innovation or problem-solving examples relevant to their needs

3. **Closing Paragraph:**
   - Reaffirm enthusiasm specifically for ${companyName} and this role
   - Reference how you can contribute to their specific goals or challenges mentioned in job description
   - Include a clear call-to-action (request for interview/meeting)
   - Express gratitude for consideration
   - Professional sign-off: "Sincerely," followed by the actual candidate name from CONTACT INFORMATION

**Important Guidelines:**
- Keep total length between 300-400 words (excluding header)
- Use active voice and strong action verbs (led, achieved, developed, implemented, delivered)
- Avoid generic phrases and clichés
- Make it personal and specific to ${companyName} and this exact role
- Show personality while maintaining professionalism
- Include specific examples that demonstrate value
- Reference company-specific information from the job description at least 2-3 times
- Demonstrate you've researched and understand the company's context

**ABSOLUTELY FORBIDDEN:**
❌ [Your Name] - Use actual name from CONTACT INFORMATION
❌ [Your Email] - Use actual email from CONTACT INFORMATION  
❌ [Your Phone Number] - Use actual phone from CONTACT INFORMATION
❌ [Your Address] - Use actual location from CONTACT INFORMATION
❌ [Date] - Use Current Date from CONTACT INFORMATION
❌ [Company Address] - Use city from job description or omit
❌ Generic statements like "I am a hard worker" without specific examples
❌ Phrases like "I believe I would be a good fit" without explaining why with specifics
❌ Explanatory notes, asterisks (***), or hash marks (###) - Output ONLY the letter content
❌ Meta-commentary like "CRITICAL NOTE" or explanations about the data provided
❌ Markdown formatting (*italics* or **bold**) - Use plain text only

${variationCount > 1 ? `\n**MULTIPLE VARIATIONS FORMAT:**
You must generate ${variationCount} COMPLETE, SEPARATE cover letters.
Each cover letter must be a FULL, STANDALONE document with:
- Complete header (name, email, date, hiring manager, company)
- Full opening paragraph
- All body paragraphs (2-3)
- Complete closing paragraph
- Signature line

Separate each COMPLETE cover letter with exactly this line:
===VARIATION 2===
(or ===VARIATION 3=== for the third one)

Each variation should:
- Be a complete cover letter from start to finish
- Emphasize different aspects of the candidate's experience
- Use slightly different examples and achievements
- Maintain the same tone and style throughout
- Be equally strong and comprehensive

DO NOT split one cover letter into parts. Generate ${variationCount} completely independent cover letters.
` : ''}

**IMPORTANT: Your response must ONLY contain the cover letter content itself. Start directly with the candidate's name in the header. Do not include any explanatory text, notes, asterisks, or commentary about the generation process.**

Generate the ${variationCount > 1 ? `${variationCount} complete cover letters` : 'cover letter'} now:`;
}

/**
 * Parse AI response into structured variations
 */
function parseCoverLetterVariations(text, expectedCount) {
  const variations = [];

  if (expectedCount === 1) {
    // Single variation - return as is
    variations.push({
      content: text.trim(),
      openingParagraph: extractParagraph(text, 0),
      bodyParagraphs: extractParagraphs(text, 1, -1),
      closingParagraph: extractParagraph(text, -1)
    });
  } else {
    // Multiple variations - split by separator
    // Split by the separator
    const parts = text.split(/===\s*VARIATION\s+\d+\s*===/i);
    
    parts.forEach((part, index) => {
      const content = part.trim();
      if (content && content.length > 100) { // Must be substantial content
        variations.push({
          content,
          openingParagraph: extractParagraph(content, 0),
          bodyParagraphs: extractParagraphs(content, 1, -1),
          closingParagraph: extractParagraph(content, -1)
        });
      }
    });
  }

  return variations.slice(0, expectedCount);
}

/**
 * Extract a specific paragraph from text
 */
function extractParagraph(text, index) {
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  if (index < 0) {
    index = paragraphs.length + index;
  }
  return paragraphs[index] || '';
}

/**
 * Extract multiple paragraphs from text
 */
function extractParagraphs(text, startIndex, endIndex) {
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  if (endIndex < 0) {
    endIndex = paragraphs.length + endIndex;
  }
  return paragraphs.slice(startIndex, endIndex).join('\n\n');
}

/**
 * Analyze company culture from job description
 * @param {string} jobDescription - Job posting text
 * @returns {Promise<Object>} Culture analysis
 */
export async function analyzeCompanyCulture(jobDescription) {
  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    const prompt = `Analyze the following job description and provide insights about the company culture, values, and tone:

${jobDescription}

Provide a brief analysis (2-3 sentences) covering:
1. Company culture indicators (e.g., innovative, traditional, collaborative)
2. Key values mentioned or implied
3. Recommended tone for application (formal, casual, creative)

Keep the response concise and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    return {
      analysis: analysis.trim(),
      recommendedTone: detectRecommendedTone(analysis)
    };
  } catch (error) {
    console.error('Culture Analysis Error:', error);
    return {
      analysis: 'Unable to analyze company culture at this time.',
      recommendedTone: 'formal'
    };
  }
}

/**
 * Detect recommended tone from culture analysis
 */
function detectRecommendedTone(analysis) {
  const lowerAnalysis = analysis.toLowerCase();
  
  if (lowerAnalysis.includes('creative') || lowerAnalysis.includes('innovative') || lowerAnalysis.includes('startup')) {
    return 'creative';
  }
  if (lowerAnalysis.includes('technical') || lowerAnalysis.includes('engineering') || lowerAnalysis.includes('data')) {
    return 'technical';
  }
  if (lowerAnalysis.includes('executive') || lowerAnalysis.includes('leadership') || lowerAnalysis.includes('strategic')) {
    return 'executive';
  }
  if (lowerAnalysis.includes('modern') || lowerAnalysis.includes('casual') || lowerAnalysis.includes('friendly')) {
    return 'modern';
  }
  
  return 'formal';
}

/**
 * Check spelling and grammar in cover letter text
 * @param {string} text - Cover letter text to check
 * @returns {Promise<Object>} Spelling and grammar suggestions
 */
export async function checkSpellingAndGrammar(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    const prompt = `You are an expert proofreader and grammar checker. Analyze the following cover letter text and identify all spelling errors, grammar mistakes, and punctuation issues.

**TEXT TO CHECK:**
${text}

**ANALYSIS REQUIRED:**
1. Spelling Errors: Words that are misspelled
2. Grammar Issues: Subject-verb agreement, tense consistency, sentence structure problems
3. Punctuation: Missing or incorrect punctuation
4. Word Choice: Awkward phrasing or better alternatives
5. Overall Quality Score (0-100)

**OUTPUT FORMAT (JSON):**
{
  "score": 95,
  "issues": [
    {
      "type": "spelling|grammar|punctuation|word_choice",
      "severity": "critical|moderate|minor",
      "text": "The incorrect text",
      "suggestion": "The corrected text",
      "explanation": "Brief explanation of why it's wrong",
      "position": {"start": 10, "end": 15}
    }
  ],
  "summary": "Overall assessment of writing quality"
}

Return ONLY valid JSON, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text().trim();
    
    // Clean JSON markers
    if (textResponse.startsWith('```json')) {
      textResponse = textResponse.slice(7);
    } else if (textResponse.startsWith('```')) {
      textResponse = textResponse.slice(3);
    }
    if (textResponse.endsWith('```')) {
      textResponse = textResponse.slice(0, -3);
    }
    
    return JSON.parse(textResponse.trim());
  } catch (error) {
    console.error('Spelling/Grammar Check Error:', error);
    throw new Error(`Failed to check spelling and grammar: ${error.message}`);
  }
}

/**
 * Get synonym suggestions for a word or phrase
 * @param {string} word - Word or phrase to get synonyms for
 * @param {string} context - Surrounding text for context
 * @returns {Promise<Object>} Synonym suggestions
 */
export async function getSynonymSuggestions(word, context) {
  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    const prompt = `Suggest professional synonyms for the word/phrase "${word}" in the context of a cover letter.

**CONTEXT:**
${context}

**REQUIREMENTS:**
1. Provide 5-8 synonyms or alternative phrases
2. Consider the professional cover letter context
3. Rank by appropriateness for formal business writing
4. Include brief usage notes

**OUTPUT FORMAT (JSON):**
{
  "word": "${word}",
  "synonyms": [
    {
      "word": "alternative",
      "formality": "formal|neutral|casual",
      "usage": "Best when emphasizing X",
      "example": "Example sentence using this synonym"
    }
  ]
}

Return ONLY valid JSON, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text().trim();
    
    if (textResponse.startsWith('```json')) {
      textResponse = textResponse.slice(7);
    } else if (textResponse.startsWith('```')) {
      textResponse = textResponse.slice(3);
    }
    if (textResponse.endsWith('```')) {
      textResponse = textResponse.slice(0, -3);
    }
    
    return JSON.parse(textResponse.trim());
  } catch (error) {
    console.error('Synonym Suggestion Error:', error);
    throw new Error(`Failed to get synonym suggestions: ${error.message}`);
  }
}

/**
 * Analyze readability and provide improvement suggestions
 * @param {string} text - Cover letter text to analyze
 * @returns {Promise<Object>} Readability analysis and suggestions
 */
export async function analyzeReadability(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    const prompt = `Analyze the readability and writing quality of this cover letter text. Provide detailed feedback and improvement suggestions.

**TEXT TO ANALYZE:**
${text}

**ANALYSIS REQUIRED:**
1. Readability Score (0-100): Based on sentence complexity, word choice, and flow
2. Average Sentence Length
3. Vocabulary Level (basic, intermediate, advanced, expert)
4. Tone Consistency (formal, professional, casual)
5. Paragraph Structure Quality
6. Transition Quality Between Paragraphs
7. Specific Improvement Suggestions

**OUTPUT FORMAT (JSON):**
{
  "readabilityScore": 85,
  "metrics": {
    "averageSentenceLength": 18,
    "vocabularyLevel": "advanced",
    "toneConsistency": "professional",
    "paragraphStructure": "good|fair|poor",
    "transitionQuality": "excellent|good|fair|poor"
  },
  "strengths": [
    "Clear opening statement",
    "Strong action verbs"
  ],
  "improvements": [
    {
      "issue": "Long, complex sentences in paragraph 2",
      "suggestion": "Break into shorter sentences for better clarity",
      "priority": "high|medium|low",
      "example": "Example of improved version"
    }
  ],
  "summary": "2-3 sentence overall assessment"
}

Return ONLY valid JSON, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text().trim();
    
    if (textResponse.startsWith('```json')) {
      textResponse = textResponse.slice(7);
    } else if (textResponse.startsWith('```')) {
      textResponse = textResponse.slice(3);
    }
    if (textResponse.endsWith('```')) {
      textResponse = textResponse.slice(0, -3);
    }
    
    return JSON.parse(textResponse.trim());
  } catch (error) {
    console.error('Readability Analysis Error:', error);
    throw new Error(`Failed to analyze readability: ${error.message}`);
  }
}

/**
 * Suggest restructuring for sentences or paragraphs
 * @param {string} text - Text to restructure
 * @param {string} type - Type of restructuring: 'sentence' or 'paragraph'
 * @returns {Promise<Object>} Restructuring suggestions
 */
export async function suggestRestructuring(text, type = 'sentence') {
  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    const prompt = `Suggest better ways to structure this ${type} from a cover letter. Provide multiple variations with different emphases.

**TEXT TO RESTRUCTURE:**
${text}

**REQUIREMENTS:**
1. Provide 3-5 restructured variations
2. Each should emphasize a different aspect (clarity, impact, flow, conciseness, formality)
3. Explain what makes each version better
4. Maintain the original meaning and facts

**OUTPUT FORMAT (JSON):**
{
  "original": "${text.substring(0, 100)}...",
  "variations": [
    {
      "text": "Restructured version",
      "emphasis": "clarity|impact|flow|conciseness|formality",
      "improvements": "What's better about this version",
      "wordCountChange": "+5|-3|0"
    }
  ]
}

Return ONLY valid JSON, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text().trim();
    
    if (textResponse.startsWith('```json')) {
      textResponse = textResponse.slice(7);
    } else if (textResponse.startsWith('```')) {
      textResponse = textResponse.slice(3);
    }
    if (textResponse.endsWith('```')) {
      textResponse = textResponse.slice(0, -3);
    }
    
    return JSON.parse(textResponse.trim());
  } catch (error) {
    console.error('Restructuring Suggestion Error:', error);
    throw new Error(`Failed to suggest restructuring: ${error.message}`);
  }
}

/**
 * Generate personalized referral request template
 * @param {Object} job - The job application to request referral for
 * @param {Object} contact - The contact who may provide the referral
 * @param {Object} userProfile - The user's profile data
 * @param {string} tone - Desired tone (formal, friendly, professional, casual)
 * @returns {Promise<Object>} Generated referral request with etiquette guidance
 */
export async function generateReferralTemplate(job, contact, userProfile, tone = 'professional') {
  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    // Build relationship context
    const relationshipStrength = contact.relationshipStrength || 'New';
    const relationshipType = contact.relationshipType || 'Other';
    const lastContactDate = contact.lastContactDate 
      ? new Date(contact.lastContactDate).toLocaleDateString() 
      : 'Unknown';

    const prompt = `You are an expert networking and career coach. Generate a personalized referral request message for a job application.

**JOB DETAILS:**
- Position: ${job.title}
- Company: ${job.company}
- Description: ${job.description || 'Not provided'}
- Location: ${job.location || 'Not specified'}

**CONTACT INFORMATION:**
- Name: ${contact.firstName} ${contact.lastName}
- Company: ${contact.company || 'Unknown'}
- Job Title: ${contact.jobTitle || 'Unknown'}
- Relationship Type: ${relationshipType}
- Relationship Strength: ${relationshipStrength}
- Last Contact: ${lastContactDate}
- Notes: ${contact.notes || 'No additional context'}

**YOUR PROFILE:**
${userProfile.employment?.[0] ? `Current/Recent Role: ${userProfile.employment[0].jobTitle} at ${userProfile.employment[0].company}` : 'No employment history'}
Skills: ${userProfile.skills?.slice(0, 5).map(s => s.name).join(', ') || 'Not specified'}
${userProfile.education?.[0] ? `Education: ${userProfile.education[0].degree} from ${userProfile.education[0].institution}` : ''}

**TONE REQUIREMENT: ${tone}**
- formal: Professional and respectful, suitable for senior contacts or distant relationships
- friendly: Warm and personable, suitable for close colleagues
- professional: Balanced professionalism with warmth
- casual: Relaxed and conversational, suitable for close friends in your industry

**TASK:**
Generate a personalized referral request message that:
1. Acknowledges the relationship and recent interactions
2. Clearly states the request for a referral
3. Explains why you're interested in the role and company
4. Highlights relevant qualifications briefly
5. Makes it easy for them to help (provide specific details)
6. Expresses gratitude and offers reciprocity
7. Includes appropriate timing considerations
8. Follows proper referral etiquette

**OUTPUT FORMAT (JSON):**
{
  "subject": "Email subject line (if email format)",
  "message": "The complete referral request message",
  "etiquetteGuidance": [
    "Specific etiquette tip 1",
    "Specific etiquette tip 2",
    "Specific etiquette tip 3"
  ],
  "timingRecommendation": "When to send this request (e.g., 'Send on a Tuesday morning', 'Wait 2 weeks after last contact')",
  "followUpSuggestion": "When and how to follow up if no response",
  "reciprocityIdeas": [
    "Way to offer value back to this contact",
    "Another way to maintain relationship health"
  ],
  "relationshipImpact": "Brief assessment of how this request might affect the relationship",
  "successProbability": "high|medium|low - likelihood of positive response based on relationship strength and context",
  "improvementTips": [
    "Tip to improve this specific request",
    "Another improvement suggestion"
  ]
}

**IMPORTANT:**
- Keep the message concise (150-250 words for the main message)
- Be authentic and personalize based on the contact's role and relationship
- Never sound entitled or demanding
- Show that you've done your research on the company
- Make it easy for them to say yes (or no)
- Consider the relationship strength when crafting tone

Return ONLY valid JSON, no markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text().trim();
    
    // Clean markdown formatting
    if (textResponse.startsWith('```json')) {
      textResponse = textResponse.slice(7);
    } else if (textResponse.startsWith('```')) {
      textResponse = textResponse.slice(3);
    }
    if (textResponse.endsWith('```')) {
      textResponse = textResponse.slice(0, -3);
    }
    
    return JSON.parse(textResponse.trim());
  } catch (error) {
    console.error('Referral Template Generation Error:', error);
    throw new Error(`Failed to generate referral template: ${error.message}`);
  }
}

/**
 * Generate comprehensive AI coaching feedback for interview response (UC-076)
 * @param {string} question - The interview question
 * @param {string} response - The user's response
 * @param {string} category - Question category (Behavioral, Technical, etc.)
 * @param {number} targetDuration - Target response duration in seconds
 * @param {Object} context - Optional context (jobTitle, company, industry)
 * @returns {Object} Comprehensive feedback with scores, analysis, and suggestions
 */
export async function generateInterviewResponseFeedback(question, response, category, targetDuration = 120, context = {}) {
  const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

  const contextInfo = context.jobTitle || context.company || context.industry
    ? `\n**CONTEXT:**
${context.jobTitle ? `Job Title: ${context.jobTitle}` : ''}
${context.company ? `Company: ${context.company}` : ''}
${context.industry ? `Industry: ${context.industry}` : ''}`
    : '';

  const prompt = `You are an expert interview coach with extensive experience helping candidates improve their interview responses. Analyze this interview response and provide comprehensive, actionable feedback.

**INTERVIEW QUESTION:**
"${question}"

**QUESTION CATEGORY:** ${category}

**CANDIDATE'S RESPONSE:**
"${response}"

**TARGET DURATION:** ${targetDuration} seconds (approximately ${Math.round(targetDuration / 60)} minute${targetDuration >= 120 ? 's' : ''})
${contextInfo}

**ANALYSIS REQUIRED:**

Provide a comprehensive analysis in the following JSON format:

{
  "contentScore": 85,
  "structureScore": 80,
  "clarityScore": 90,
  "relevanceScore": 88,
  "specificityScore": 75,
  "impactScore": 82,
  "overallScore": 83,
  "strengths": [
    "Strong opening that addresses the question directly",
    "Good use of specific metrics and quantifiable results"
  ],
  "weaknesses": [
    "Could provide more context about the situation",
    "Conclusion feels rushed and lacks impact"
  ],
  "suggestions": [
    "Add more details about the initial challenge to set the scene",
    "Include the broader impact of your actions on the team or organization",
    "End with a stronger takeaway or lesson learned"
  ],
  "weakLanguagePatterns": [
    {
      "pattern": "I just",
      "context": "I just decided to implement a new system",
      "alternative": "I strategically decided to implement a new system",
      "reason": "The word 'just' minimizes your contribution and makes the action seem trivial"
    },
    {
      "pattern": "kind of",
      "context": "It was kind of challenging",
      "alternative": "It was significantly challenging",
      "reason": "Hedging words like 'kind of' weaken your message and show lack of confidence"
    }
  ],
  "lengthAnalysis": {
    "wordCount": 185,
    "estimatedDuration": 95,
    "recommendation": "Slightly Short",
    "idealRange": {
      "min": 100,
      "max": 140
    },
    "adjustmentSuggestion": "Your response is well-structured but could benefit from 20-30 more seconds of content. Consider expanding on the specific actions you took or the measurable results achieved."
  },
  "starAnalysis": {
    "hasStructure": true,
    "components": {
      "situation": {
        "present": true,
        "score": 85,
        "feedback": "Good context provided about the initial situation, though more details about the challenge would strengthen it"
      },
      "task": {
        "present": true,
        "score": 90,
        "feedback": "Clear description of your responsibility and what needed to be accomplished"
      },
      "action": {
        "present": true,
        "score": 80,
        "feedback": "Actions are described but could be more specific about the steps taken"
      },
      "result": {
        "present": true,
        "score": 95,
        "feedback": "Excellent use of quantifiable metrics to demonstrate impact"
      }
    },
    "overallAdherence": 87,
    "recommendations": [
      "Strengthen the Situation section by adding more context about why this was challenging",
      "In the Action section, break down your approach into clear, sequential steps",
      "Consider adding a reflection or lesson learned at the end to show growth"
    ]
  },
  "alternativeApproaches": [
    {
      "title": "Results-First Approach",
      "description": "Start with the impressive outcome, then explain how you achieved it",
      "example": "I increased team productivity by 40% in three months. Here's how: When I joined as team lead, our sprint completion rate was only 60%...",
      "whenToUse": "When you have strong quantifiable results that will immediately grab attention"
    },
    {
      "title": "Challenge-Solution Framework",
      "description": "Emphasize the difficulty of the problem before describing your solution",
      "example": "We were facing a critical deadline with half our team unavailable. The challenge was daunting, but I approached it systematically...",
      "whenToUse": "When the complexity of the problem itself demonstrates your capabilities"
    }
  ]
}

**SCORING CRITERIA:**

1. **Content Score (0-100):** Quality and relevance of the information provided
   - Does the response answer the question?
   - Is the content meaningful and substantive?
   - Are there specific examples and details?

2. **Structure Score (0-100):** Organization and flow of the response
   - Is there a clear beginning, middle, and end?
   - Does the response follow a logical progression?
   - Is it easy to follow?

3. **Clarity Score (0-100):** How clearly the response is communicated
   - Is the language clear and concise?
   - Are ideas expressed without ambiguity?
   - Is the response easy to understand?

4. **Relevance Score (0-100):** How well the response addresses the question
   - Does it stay on topic?
   - Does it directly address what was asked?
   - Is all information relevant?

5. **Specificity Score (0-100):** Level of detail and concrete examples
   - Are there specific examples rather than generalities?
   - Are there metrics, numbers, or quantifiable results?
   - Is there sufficient detail to be credible?

6. **Impact Score (0-100):** How compelling and memorable the response is
   - Does it demonstrate value and achievement?
   - Does it show growth or learning?
   - Would it impress an interviewer?

7. **Overall Score (0-100):** Average of all scores weighted by importance

**WEAK LANGUAGE PATTERNS TO IDENTIFY:**
- Hedging words: "kind of", "sort of", "maybe", "possibly"
- Minimizing words: "just", "only", "simply"
- Passive voice: "was done", "was implemented" instead of "I did", "I implemented"
- Vague terms: "things", "stuff", "a lot"
- Filler words: "like", "um", "you know"
- Self-deprecating language: "I'm not sure but", "This might be wrong"

**LENGTH ANALYSIS:**
- Calculate word count
- Estimate speaking duration (average 120-150 words per minute)
- Compare to target duration
- Provide specific guidance: "Too Short", "Slightly Short", "Optimal", "Slightly Long", "Too Long"
- Suggest specific adjustments

**STAR METHOD ANALYSIS:**
For ${category} questions, evaluate STAR framework adherence:
- **Situation:** Context and background (20-25% of response)
- **Task:** Your responsibility or challenge (15-20% of response)
- **Action:** Specific steps you took (40-45% of response)
- **Result:** Outcomes and impact (20-25% of response)

Score each component and provide specific feedback on strengthening each part.

**ALTERNATIVE APPROACHES:**
Suggest 2-3 different ways to structure the same response, each with:
- Title of the approach
- Brief description
- Example opening or key phrases
- When this approach works best

Return ONLY valid JSON with all fields populated. Be specific, actionable, and encouraging while being honest about areas for improvement.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text().trim();
    
    // Clean JSON markers
    // Clean markdown formatting
    if (textResponse.startsWith('```json')) {
      textResponse = textResponse.slice(7);
    } else if (textResponse.startsWith('```')) {
      textResponse = textResponse.slice(3);
    }
    if (textResponse.endsWith('```')) {
      textResponse = textResponse.slice(0, -3);
    }
    
    const generatedContent = JSON.parse(textResponse.trim());

    // Post-process message to replace placeholder signatures like [Your name] with actual user name
    try {
      const displayName = (userProfile && (userProfile.name || (userProfile.profile && userProfile.profile.name))) || '';
      if (displayName && generatedContent.message && typeof generatedContent.message === 'string') {
        let msg = generatedContent.message;
        // Common placeholder patterns to replace: [Your name], [Your Name], <Your Name>, {{your_name}}, YOUR NAME
        const placeholderPatterns = [
          /\[\s*Your\s+name\s*\]/gi,
          /\[\s*Your\s+Name\s*\]/gi,
          /<\s*Your\s+Name\s*>/gi,
          /\{\{\s*your_name\s*\}\}/gi,
          /YOUR\s+NAME/gi,
          /Your\s+name/gi
        ];
        for (const pat of placeholderPatterns) {
          msg = msg.replace(pat, displayName);
        }
        // Also handle simple occurrences like 'Your name' on its own (but avoid accidental replacements inside words)
        msg = msg.replace(/\bYour\s+name\b/gi, displayName);
        generatedContent.message = msg;
      }
    } catch (e) {
      // If replacement fails for any reason, proceed with original generatedContent
      console.warn('Failed to replace name placeholder in generated referral message', e);
    }

    // Calculate etiquette and timing scores
    const etiquetteScore = calculateEtiquetteScore(relationshipStrength, lastContactDate);
    const timingScore = calculateTimingScore(lastContactDate, contact.nextFollowUpDate);

    return {
      ...generatedContent,
      etiquetteScore,
      timingScore
    };
    const feedback = JSON.parse(textResponse.trim());
    
    // Validate and ensure all required fields exist
    const requiredFields = ['contentScore', 'structureScore', 'clarityScore', 'relevanceScore', 
                            'specificityScore', 'impactScore', 'overallScore', 'strengths', 
                            'weaknesses', 'suggestions', 'lengthAnalysis', 'starAnalysis'];
    
    for (const field of requiredFields) {
      if (!feedback[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    return feedback;
  } catch (error) {
    console.error('Interview Response Feedback Error:', error);
    throw new Error(`Failed to generate interview response feedback: ${error.message}`);
  }
}

    


/**
 * Calculate etiquette score based on relationship factors
 */
function calculateEtiquetteScore(relationshipStrength, lastContactDate) {
  let score = 5; // Base score
  
  // Adjust based on relationship strength
  if (relationshipStrength === 'Strong') score += 3;
  else if (relationshipStrength === 'Medium') score += 1;
  else if (relationshipStrength === 'Weak') score -= 1;
  else if (relationshipStrength === 'New') score -= 2;
  
  // Adjust based on recent contact
  if (lastContactDate && lastContactDate !== 'Unknown') {
    const daysSinceContact = Math.floor((Date.now() - new Date(lastContactDate)) / (1000 * 60 * 60 * 24));
    if (daysSinceContact < 30) score += 2;
    else if (daysSinceContact < 90) score += 1;
    else if (daysSinceContact > 365) score -= 1;
  }
  
  return Math.max(0, Math.min(10, score));
}

/**
 * Calculate timing score for the referral request
 */
function calculateTimingScore(lastContactDate, nextFollowUpDate) {
  let score = 5; // Base score
  
  // Check if this is a good time based on last contact
  if (lastContactDate && lastContactDate !== 'Unknown') {
    const daysSinceContact = Math.floor((Date.now() - new Date(lastContactDate)) / (1000 * 60 * 60 * 24));
    if (daysSinceContact >= 7 && daysSinceContact <= 60) score += 3; // Sweet spot
    else if (daysSinceContact < 7) score -= 2; // Too soon
    else if (daysSinceContact > 180) score -= 1; // Been a while
  }
  
  // Check if there's a scheduled follow-up
  if (nextFollowUpDate) {
    const daysUntilFollowUp = Math.floor((new Date(nextFollowUpDate) - Date.now()) / (1000 * 60 * 60 * 24));
    if (Math.abs(daysUntilFollowUp) < 7) score += 2; // Good timing near scheduled contact
  }
  
  return Math.max(0, Math.min(10, score));
}

/**
 * Generate personalized reference request email template
 * @param {Object} reference - The reference contact
 * @param {Object} job - The job application details
 * @param {Object} userProfile - The user's profile data
 * @returns {Promise<Object>} Generated reference request email and guidance
 */
export async function generateReferenceRequestEmail(reference, job, userProfile) {
  const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

  const relationshipContext = reference.relationshipType || 'Professional Contact';
  const lastContact = reference.lastContactDate 
    ? new Date(reference.lastContactDate).toLocaleDateString() 
    : 'Unknown';

  const prompt = `You are an expert career advisor specializing in professional reference management. Generate a personalized email to request someone to be a reference for a job application.

**REFERENCE CONTACT:**
- Name: ${reference.firstName} ${reference.lastName}
- Relationship: ${relationshipContext}
- Company: ${reference.company || 'Unknown'}
- Title: ${reference.jobTitle || 'Unknown'}
- Last Contact: ${lastContact}
- Relationship Strength: ${reference.relationshipStrength || 'Medium'}
- Notes: ${reference.notes || 'No additional context'}

**JOB APPLICATION:**
- Position: ${job.title || job.jobTitle}
- Company: ${job.company}
- Description: ${job.description?.substring(0, 300) || 'Not provided'}

**YOUR PROFILE:**
${userProfile.employment?.[0] ? `Current/Recent Role: ${userProfile.employment[0].jobTitle} at ${userProfile.employment[0].company}` : ''}
${userProfile.headline ? `Headline: ${userProfile.headline}` : ''}

**TASK:**
Generate a professional, personalized email requesting this person to serve as a reference. The email should:

1. **Re-establish Connection** (if needed based on last contact date)
2. **Express Genuine Appreciation** for the relationship and past working experience
3. **Clearly State the Request** to serve as a reference
4. **Provide Context** about the role and why you're excited about it
5. **Explain Why They're Ideal** as a reference (what they can speak to)
6. **Make It Easy** by offering to provide materials (resume, key points)
7. **Be Considerate** of their time and offer an out
8. **Include Specific Details** they might mention to make it authentic

Additionally, provide:
- **Talking Points**: 3-5 specific accomplishments or qualities they could mention
- **Preparation Tips**: Guidance for preparing the reference
- **Timeline**: When they might be contacted

**OUTPUT FORMAT (JSON):**
{
  "subject": "Email subject line",
  "emailBody": "The complete email text (professional but warm)",
  "talkingPoints": [
    {
      "point": "Specific achievement or quality",
      "context": "Brief context or example they could reference",
      "impact": "Why this matters for the target role"
    }
  ],
  "preparationTips": [
    "Tip 1 for preparing this reference",
    "Tip 2 for preparing this reference"
  ],
  "timeline": "Expected timeline for when they might be contacted",
  "followUpGuidance": "How to follow up after they agree",
  "gratitudeSuggestions": [
    "Way to thank them regardless of outcome",
    "How to maintain the relationship"
  ]
}

**TONE GUIDELINES:**
- Match the relationship strength and type
- For "Strong" relationships: Warmer, more personal
- For "Weak" or "New": More formal, more context-setting
- Always be grateful and considerate of their time
- Make it easy for them to say yes or no

Return ONLY valid JSON, no markdown formatting. Keep the email concise (200-300 words).`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text().trim();
    
    // Clean markdown formatting
    if (textResponse.startsWith('```json')) {
      textResponse = textResponse.slice(7);
    } else if (textResponse.startsWith('```')) {
      textResponse = textResponse.slice(3);
    }
    if (textResponse.endsWith('```')) {
      textResponse = textResponse.slice(0, -3);
    }
    
    return JSON.parse(textResponse.trim());
  } catch (error) {
    console.error('Reference Request Email Generation Error:', error);
    throw new Error(`Failed to generate reference request email: ${error.message}`);
  }
}

/**
 * Generate sample interview questions by category
 * @param {string} category - Question category
 * @param {Object} context - Optional context (jobTitle, company, industry)
 * @param {number} count - Number of questions to generate
 * @returns {Array} Array of interview questions
 */
export async function generateInterviewQuestions(category, context = {}, count = 5) {
  const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

  const contextInfo = context.jobTitle || context.company || context.industry
    ? `\n**CONTEXT:**
${context.jobTitle ? `Job Title: ${context.jobTitle}` : ''}
${context.company ? `Company: ${context.company}` : ''}
${context.industry ? `Industry: ${context.industry}` : ''}`
    : '';

  const prompt = `You are an expert interview coach. Generate ${count} realistic, high-quality ${category} interview questions.
${contextInfo}

Generate questions that are:
- Commonly asked in real interviews
- Appropriate for the category and context
- Varied in difficulty and focus
- Designed to elicit STAR method responses for behavioral questions

Return a JSON array of question objects:

[
  {
    "text": "Tell me about a time when you had to deal with a difficult team member.",
    "category": "${category}",
    "difficulty": "Medium",
    "tips": "Focus on your conflict resolution skills and ability to maintain professionalism. Use the STAR method to structure your response."
  }
]

Return ONLY valid JSON array, no markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text().trim();
    
    // Clean markdown formatting
    if (textResponse.startsWith('```json')) {
      textResponse = textResponse.slice(7);
    } else if (textResponse.startsWith('```')) {
      textResponse = textResponse.slice(3);
    }
    if (textResponse.endsWith('```')) {
      textResponse = textResponse.slice(0, -3);
    }
    
    return JSON.parse(textResponse.trim());
  } catch (error) {
    console.error('Generate Interview Questions Error:', error);
    throw new Error(`Failed to generate interview questions: ${error.message}`);
  }
}

/**
 * Generate personalized goal recommendations based on user profile and current goals
 * @param {Object} userProfile - User's profile data
 * @param {Array} currentGoals - User's current goals
 * @param {Object} jobSearchData - User's job search analytics
 * @returns {Promise<Object>} Goal recommendations with strategies and resources
 */
export async function generateGoalRecommendations(userProfile, currentGoals = [], jobSearchData = {}) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

  const prompt = `You are an expert career coach and goal-setting strategist. Analyze the user's profile and current goals to generate personalized career goal recommendations.

**USER PROFILE:**
Skills: ${userProfile.skills?.map(s => `${s.name} (${s.level})`).join(', ') || 'None listed'}
Experience: ${userProfile.employment?.map(e => `${e.position || e.jobTitle} at ${e.company}`).join(', ') || 'None listed'}
Education: ${userProfile.education?.map(e => `${e.degree} in ${e.fieldOfStudy}`).join(', ') || 'None listed'}
Target Roles: ${userProfile.targetRoles?.join(', ') || 'Not specified'}
Career Interests: ${userProfile.careerInterests?.join(', ') || 'Not specified'}

**CURRENT GOALS:**
${currentGoals.length > 0 ? currentGoals.map((g, i) => `
${i + 1}. ${g.title} (${g.category})
   Status: ${g.status}
   Progress: ${g.progressPercentage || 0}%
   Target: ${g.measurable?.targetValue} ${g.measurable?.unit}
   Deadline: ${new Date(g.timeBound?.targetDate).toLocaleDateString()}
`).join('\n') : 'No active goals'}

**JOB SEARCH DATA:**
Applications Sent: ${jobSearchData.totalApplications || 0}
Interviews: ${jobSearchData.totalInterviews || 0}
Offers: ${jobSearchData.totalOffers || 0}
Response Rate: ${jobSearchData.responseRate || 0}%

**TASK:**
Generate 5-7 personalized SMART goal recommendations that will help advance the user's career. Consider:
1. Gaps in their current goal coverage
2. Career progression opportunities
3. Skill development needs
4. Job search optimization
5. Networking and personal brand building

For each recommendation, provide:
- **Goal Title** (concise and actionable)
- **Category** (Job Search, Skill Development, Networking, etc.)
- **Type** (Short-term or Long-term)
- **Priority** (Low, Medium, High, Critical)
- **Specific Description** (What exactly to accomplish)
- **Measurable Metric** (How to measure progress with target value and unit)
- **Timeline** (Recommended duration in days)
- **Key Milestones** (3-5 actionable steps)
- **Success Strategies** (2-3 specific strategies to achieve this goal)
- **Resources** (2-3 helpful resources, tools, or platforms)
- **Why It Matters** (Impact on career success)

**OUTPUT FORMAT (JSON):**
{
  "recommendations": [
    {
      "title": "Goal title",
      "category": "Category name",
      "type": "Short-term or Long-term",
      "priority": "Priority level",
      "specific": "Specific description",
      "measurable": {
        "metric": "What to measure",
        "targetValue": 10,
        "unit": "applications|interviews|skills|etc"
      },
      "timeline": 30,
      "milestones": ["Milestone 1", "Milestone 2", "Milestone 3"],
      "strategies": ["Strategy 1", "Strategy 2"],
      "resources": ["Resource 1", "Resource 2"],
      "impact": "Why this matters"
    }
  ],
  "overallStrategy": "One paragraph strategic summary",
  "priorityActions": ["Top 3 immediate actions to take"]
}

Return ONLY valid JSON, no markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Generate Goal Recommendations Error:', error);
    throw new Error(`Failed to generate goal recommendations: ${error.message}`);
  }
}

/**
 * Analyze goal progress and generate insights
 * @param {Object} goal - The goal to analyze
 * @param {Object} userProfile - User's profile data
 * @returns {Promise<Object>} Progress insights and recommendations
 */
export async function analyzeGoalProgress(goal, userProfile = {}) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

  const progressHistory = goal.progressUpdates?.slice(-10) || [];
  const recentMilestones = goal.milestones?.slice(-5) || [];

  const prompt = `You are an expert career coach analyzing goal progress. Provide detailed insights and actionable recommendations.

**GOAL DETAILS:**
Title: ${goal.title}
Category: ${goal.category}
Type: ${goal.type}
Status: ${goal.status}
Priority: ${goal.priority}

Description: ${goal.description}

**SMART CRITERIA:**
Specific: ${goal.specific}
Measurable: ${goal.measurable?.metric} - Target: ${goal.measurable?.targetValue} ${goal.measurable?.unit}, Current: ${goal.measurable?.currentValue} ${goal.measurable?.unit}
Achievable: ${goal.achievable}
Relevant: ${goal.relevant}
Time-bound: Started ${new Date(goal.timeBound?.startDate).toLocaleDateString()}, Target ${new Date(goal.timeBound?.targetDate).toLocaleDateString()}

**PROGRESS DATA:**
Overall Progress: ${goal.progressPercentage || 0}%
Days Remaining: ${goal.daysRemaining || 0}
Milestone Completion: ${goal.milestoneCompletionRate || 0}%
On Track: ${goal.isOnTrack ? 'Yes' : 'No'}

Recent Progress Updates:
${progressHistory.length > 0 ? progressHistory.map((p, i) => `
${i + 1}. ${new Date(p.date).toLocaleDateString()}: ${p.value} ${goal.measurable?.unit}
   ${p.notes ? `Notes: ${p.notes}` : ''}
`).join('\n') : 'No progress updates yet'}

Milestones:
${recentMilestones.length > 0 ? recentMilestones.map((m, i) => `
${i + 1}. ${m.title} - ${m.completed ? 'Completed ✓' : 'Pending'}
   Target: ${new Date(m.targetDate).toLocaleDateString()}
`).join('\n') : 'No milestones defined'}

**TASK:**
Analyze this goal and provide comprehensive insights:

1. **Progress Assessment** (Current state and trajectory)
2. **Risk Analysis** (Potential obstacles and challenges)
3. **Patterns Identified** (Positive and negative patterns in progress)
4. **Adjustment Recommendations** (Specific changes to timeline, approach, or metrics)
5. **Motivation Strategies** (How to stay motivated and overcome challenges)
6. **Success Predictions** (Likelihood of achieving goal on time)

**OUTPUT FORMAT (JSON):**
{
  "progressAssessment": {
    "overallStatus": "On track|Behind schedule|Ahead of schedule",
    "velocityTrend": "Accelerating|Steady|Slowing|Stagnant",
    "summary": "1-2 sentence assessment"
  },
  "riskAnalysis": {
    "riskLevel": "Low|Medium|High|Critical",
    "identifiedRisks": ["Risk 1", "Risk 2"],
    "mitigationStrategies": ["Strategy 1", "Strategy 2"]
  },
  "patterns": {
    "positive": ["Pattern 1", "Pattern 2"],
    "negative": ["Pattern 1", "Pattern 2"],
    "recommendations": "How to leverage good patterns and fix bad ones"
  },
  "adjustments": [
    {
      "type": "Timeline|Metric|Strategy|Approach",
      "recommendation": "Specific adjustment to make",
      "rationale": "Why this adjustment is needed",
      "priority": "Low|Medium|High"
    }
  ],
  "motivationStrategies": [
    "Strategy 1",
    "Strategy 2",
    "Strategy 3"
  ],
  "successPrediction": {
    "likelihood": 75,
    "confidence": "Low|Medium|High",
    "keyFactors": ["Factor 1", "Factor 2"],
    "criticalActions": ["Action 1", "Action 2"]
  },
  "nextSteps": ["Immediate action 1", "Immediate action 2", "Immediate action 3"]
}

Return ONLY valid JSON, no markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Analyze Goal Progress Error:', error);
    throw new Error(`Failed to analyze goal progress: ${error.message}`);
  }
}

/**
 * Generate achievement celebration message and success analysis
 * @param {Object} goal - The completed goal
 * @param {Object} userProfile - User's profile data
 * @param {Array} allGoals - All user goals for context
 * @returns {Promise<Object>} Celebration message and achievement insights
 */
export async function generateAchievementCelebration(goal, userProfile = {}, allGoals = []) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

  const completedGoals = allGoals.filter(g => g.status === 'Completed');
  const timeToComplete = goal.timeBound?.completedDate && goal.timeBound?.startDate
    ? Math.ceil((new Date(goal.timeBound.completedDate) - new Date(goal.timeBound.startDate)) / (1000 * 60 * 60 * 24))
    : 0;

  const prompt = `You are an enthusiastic career coach celebrating a goal achievement. Generate a motivating celebration message and insightful success analysis.

**ACHIEVED GOAL:**
Title: ${goal.title}
Category: ${goal.category}
Description: ${goal.description}
Target: ${goal.measurable?.targetValue} ${goal.measurable?.unit}
Final Value: ${goal.measurable?.currentValue} ${goal.measurable?.unit}
Time to Complete: ${timeToComplete} days
Milestones Completed: ${goal.milestones?.filter(m => m.completed).length || 0}

**USER CONTEXT:**
Total Goals: ${allGoals.length}
Completed Goals: ${completedGoals.length}
Success Rate: ${allGoals.length > 0 ? Math.round((completedGoals.length / allGoals.length) * 100) : 0}%

**IMPACT METRICS:**
Job Applications: ${goal.impactMetrics?.jobApplications || 0}
Interviews Secured: ${goal.impactMetrics?.interviewsSecured || 0}
Offers Received: ${goal.impactMetrics?.offersReceived || 0}
Skills Acquired: ${goal.impactMetrics?.skillsAcquired || 0}
Connections Gained: ${goal.impactMetrics?.connectionsGained || 0}

**TASK:**
Generate an inspiring celebration and comprehensive success analysis:

1. **Celebration Message** (Enthusiastic 2-3 paragraph congratulatory message)
2. **Achievement Highlights** (Key accomplishments and milestones)
3. **Success Factors** (What contributed to success)
4. **Lessons Learned** (Transferable insights for future goals)
5. **Career Impact** (How this achievement advances their career)
6. **Next Level Goals** (Suggestions for building on this success)

Make the tone celebratory, personal, and motivating!

**OUTPUT FORMAT (JSON):**
{
  "celebrationMessage": "Enthusiastic multi-paragraph celebration",
  "achievementHighlights": [
    "Highlight 1",
    "Highlight 2",
    "Highlight 3"
  ],
  "successFactors": [
    {
      "factor": "Success factor name",
      "description": "How this contributed",
      "impact": "High|Medium|Low"
    }
  ],
  "lessonsLearned": [
    "Lesson 1",
    "Lesson 2",
    "Lesson 3"
  ],
  "careerImpact": {
    "immediate": "Immediate impact description",
    "longTerm": "Long-term impact description",
    "opportunities": ["New opportunity 1", "New opportunity 2"]
  },
  "nextLevelGoals": [
    {
      "title": "Next goal suggestion",
      "description": "Why this is a good next step",
      "category": "Goal category"
    }
  ],
  "shareableMessage": "Short shareable achievement message for social/accountability"
}

Return ONLY valid JSON, no markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Generate Achievement Celebration Error:', error);
    throw new Error(`Failed to generate achievement celebration: ${error.message}`);
  }
}

/**
 * Identify success patterns across multiple goals
 * @param {Array} goals - User's goals (completed and in-progress)
 * @param {Object} userProfile - User's profile data
 * @returns {Promise<Object>} Success patterns and optimization strategies
 */
export async function identifySuccessPatterns(goals, userProfile = {}) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

  const completedGoals = goals.filter(g => g.status === 'Completed');
  const failedGoals = goals.filter(g => g.status === 'Abandoned' || g.status === 'At Risk');
  const activeGoals = goals.filter(g => g.status === 'In Progress' || g.status === 'On Track');

  const prompt = `You are a data-driven career strategist analyzing goal achievement patterns. Identify what works and what doesn't.

**GOAL STATISTICS:**
Total Goals: ${goals.length}
Completed: ${completedGoals.length}
Failed/At Risk: ${failedGoals.length}
Active: ${activeGoals.length}
Success Rate: ${goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%

**COMPLETED GOALS:**
${completedGoals.slice(0, 5).map((g, i) => `
${i + 1}. ${g.title} (${g.category})
   Progress: ${g.progressPercentage || 0}%
   Timeline: ${g.duration || 0} days planned, ${g.timeBound?.completedDate && g.timeBound?.startDate ? Math.ceil((new Date(g.timeBound.completedDate) - new Date(g.timeBound.startDate)) / (1000 * 60 * 60 * 24)) : 0} days actual
   Priority: ${g.priority}
`).join('\n')}

**FAILED/AT RISK GOALS:**
${failedGoals.slice(0, 5).map((g, i) => `
${i + 1}. ${g.title} (${g.category})
   Progress: ${g.progressPercentage || 0}%
   Status: ${g.status}
   Priority: ${g.priority}
`).join('\n')}

**ACTIVE GOALS:**
${activeGoals.slice(0, 5).map((g, i) => `
${i + 1}. ${g.title} (${g.category})
   Progress: ${g.progressPercentage || 0}%
   On Track: ${g.isOnTrack ? 'Yes' : 'No'}
`).join('\n')}

**TASK:**
Analyze these goals to identify patterns and provide optimization strategies:

1. **Success Patterns** (What characteristics lead to goal completion?)
2. **Failure Patterns** (What characteristics correlate with abandonment?)
3. **Optimal Goal Characteristics** (Best timeline, priority, category combinations)
4. **Recommended Adjustments** (How to improve active goals based on patterns)
5. **Goal-Setting Strategy** (Personalized approach for future goals)

**OUTPUT FORMAT (JSON):**
{
  "successPatterns": [
    {
      "pattern": "Pattern description",
      "frequency": "High|Medium|Low",
      "examples": ["Example 1", "Example 2"],
      "recommendation": "How to apply this pattern"
    }
  ],
  "failurePatterns": [
    {
      "pattern": "Pattern description",
      "frequency": "High|Medium|Low",
      "examples": ["Example 1", "Example 2"],
      "avoidance": "How to avoid this pattern"
    }
  ],
  "optimalCharacteristics": {
    "timeline": "Optimal duration in days",
    "priorityBalance": "How to balance priorities",
    "categoryFocus": "Which categories to focus on",
    "milestoneStrategy": "How to structure milestones"
  },
  "activeGoalAdjustments": [
    {
      "goalId": "Goal ID if available",
      "goalTitle": "Goal title",
      "adjustmentType": "Timeline|Priority|Approach",
      "recommendation": "Specific adjustment",
      "rationale": "Why this adjustment"
    }
  ],
  "personalizedStrategy": {
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "recommendations": ["Rec 1", "Rec 2", "Rec 3"],
    "focusAreas": ["Area 1", "Area 2"]
  },
  "benchmarks": {
    "averageCompletionTime": "X days",
    "optimalGoalLoad": "X active goals",
    "recommendedCategories": ["Category 1", "Category 2"]
  }
}

Return ONLY valid JSON, no markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Identify Success Patterns Error:', error);
    throw new Error(`Failed to identify success patterns: ${error.message}`);
  }
}

