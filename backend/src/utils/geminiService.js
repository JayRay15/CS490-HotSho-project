import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate multiple variations of tailored resume content
 * @param {Object} jobPosting - The job posting to tailor for
 * @param {Object} userProfile - The user's profile data
 * @param {Object} template - The resume template being used
 * @param {number} numVariations - Number of variations to generate (default: 3)
 * @returns {Array} Array of generated resume content variations
 */
export async function generateResumeContentVariations(jobPosting, userProfile, template, numVariations = 3) {
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

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
  
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

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
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

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
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

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
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

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
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

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
  variationCount = 1
}) {
  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

    // Build user profile summary
    const profileSummary = buildProfileSummary(userProfile);

    // Construct the prompt
    const prompt = buildCoverLetterPrompt({
      companyName,
      position,
      jobDescription,
      profileSummary,
      tone,
      variationCount
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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
 * Build the AI prompt for cover letter generation
 */
function buildCoverLetterPrompt({
  companyName,
  position,
  jobDescription,
  profileSummary,
  tone,
  variationCount
}) {
  const toneGuide = {
    formal: 'professional, traditional, and respectful',
    modern: 'contemporary, friendly yet professional, with conversational elements',
    creative: 'expressive, engaging, and personality-driven',
    technical: 'precise, detail-oriented, with technical terminology',
    executive: 'strategic, leadership-focused, and high-level'
  };

  return `You are an expert cover letter writer. Generate ${variationCount} compelling cover letter${variationCount > 1 ? 's' : ''} for the following job application.

**Job Details:**
- Company: ${companyName}
- Position: ${position}
- Job Description: ${jobDescription}

**Candidate Profile:**
${profileSummary}

**Tone:** ${toneGuide[tone] || toneGuide.formal}

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

${variationCount > 1 ? `\n**Format:** Separate each variation clearly with "===VARIATION [NUMBER]===" header. Each variation should emphasize different aspects of the candidate's background while maintaining all requirements above.\n` : ''}

Generate the cover letter${variationCount > 1 ? 's' : ''} now with ALL actual information filled in and company-specific personalization:`;
}

/**
 * Parse AI response into structured variations
 */
function parseCoverLetterVariations(text, expectedCount) {
  // Normalize newlines
  const normalized = String(text || '').replace(/\r\n/g, '\n');

  // Helper to build a variation object
  const buildVariation = (content) => ({
    content: content.trim(),
    openingParagraph: extractParagraph(content, 0),
    bodyParagraphs: extractParagraphs(content, 1, -1),
    closingParagraph: extractParagraph(content, -1)
  });

  // If only one variation expected, return whole response as single variation
  if (expectedCount === 1) {
    return [buildVariation(normalized)];
  }

  // Try a set of likely separators the model might use
  const separatorPatterns = [
    /={3,}\s*VARIATION\s*\d+\s*={3,}/i, // ===VARIATION 1===
    /={3,}\s*VARIATION\b/i,                // ===VARIATION
    /---+\s*VARIATION\s*\d+\s*-+/i,     // ---VARIATION 1---
    /VARIATION\s+\d+/i,                  // VARIATION 1
    /\n\s*={3,}\s*\n/                   // lines of ===
  ];

  // Attempt splitting using separators
  let parts = null;
  for (const pat of separatorPatterns) {
    if (pat.test(normalized)) {
      parts = normalized.split(pat).map(p => p.trim()).filter(Boolean);
      if (parts.length > 1) break;
    }
  }

  // As a fallback, try splitting on explicit marker like ===VARIATION 1=== with optional spaces
  if (!parts || parts.length <= 1) {
    parts = normalized.split(/===\s*VARIATION\s*\d+\s*===/i).map(p => p.trim()).filter(Boolean);
  }

  // If still single part, attempt heuristic: split into paragraphs and distribute across expectedCount
  if (!parts || parts.length <= 1) {
    const paragraphs = normalized.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length >= expectedCount) {
      // Try to chunk paragraphs into expectedCount groups as evenly as possible
      const groups = Array.from({ length: expectedCount }, () => []);
      paragraphs.forEach((p, i) => {
        groups[i % expectedCount].push(p);
      });
      parts = groups.map(g => g.join('\n\n').trim()).filter(Boolean);
    }
  }

  // Final safety: if still no multi-parts, include the whole text as a single part
  if (!parts || parts.length === 0) {
    parts = [normalized.trim()];
  }

  // Build variation objects and return up to expectedCount
  const variations = parts.map(p => buildVariation(p));
  return variations.slice(0, expectedCount);
}

/**
 * Extract a specific paragraph from text
 */
function extractParagraph(text, index) {
  const paragraphs = String(text || '').split(/\n\n+/).filter(p => p.trim());
  if (index < 0) {
    index = paragraphs.length + index;
  }
  return paragraphs[index] || '';
}

/**
 * Extract multiple paragraphs from text
 */
function extractParagraphs(text, startIndex, endIndex) {
  const paragraphs = String(text || '').split(/\n\n+/).filter(p => p.trim());
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
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

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

