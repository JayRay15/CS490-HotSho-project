import fetch from 'node-fetch';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy-initialize GoogleGenerativeAI to avoid errors when API key is not set
let genAI = null;
function getGenAI() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Research company information using multiple sources
 * @param {string} companyName - Name of the company to research
 * @param {string} jobDescription - Job description for additional context
 * @returns {Promise<Object>} Company research data
 */
export async function researchCompany(companyName, jobDescription = '') {
  try {
    // Use AI to extract and synthesize company information from job description
    // and generate comprehensive research
    const research = await generateCompanyResearch(companyName, jobDescription);

    return research;
  } catch (error) {
    console.error('Company research error:', error);
    // Return minimal data if research fails
    return {
      companyName,
      background: `${companyName} is a company in the industry.`,
      recentNews: [],
      mission: null,
      values: [],
      initiatives: [],
      industryContext: null,
      size: null,
      growth: null,
      funding: null,
      competitive: null,
      researchSuccess: false
    };
  }
}

/**
 * UC-064: Comprehensive Company Research
 * Conducts automated, in-depth company research for job applications
 * @param {string} companyName - Name of the company to research
 * @param {string} jobDescription - Optional job description for context
 * @param {string} companyWebsite - Optional company website
 * @returns {Promise<Object>} Comprehensive company research data
 */
export async function conductComprehensiveResearch(companyName, jobDescription = '', companyWebsite = '') {
  try {
    // Gather data from multiple sources in parallel
    const [
      basicInfo,
      aiResearch,
      socialMedia,
      executives
    ] = await Promise.all([
      gatherBasicCompanyInfo(companyName, companyWebsite),
      generateAIResearch(companyName, jobDescription),
      findSocialMediaPresence(companyName, companyWebsite),
      identifyExecutives(companyName)
    ]);

    // Combine all research data
    const comprehensiveResearch = {
      companyName,
      researchDate: new Date().toISOString(),

      // Basic Information (Enhanced)
      basicInfo: {
        name: basicInfo.name || companyName,
        size: aiResearch.size || basicInfo.size || 'Not specified',
        industry: aiResearch.industry || basicInfo.industry || 'Not specified',
        headquarters: aiResearch.headquarters || basicInfo.headquarters || 'Not specified',
        founded: aiResearch.founded || basicInfo.founded || null,
        website: companyWebsite || basicInfo.website || null,
        logo: basicInfo.logo || null,
        // New enhanced fields
        companyType: aiResearch.companyType || 'Private',
        stockTicker: aiResearch.stockTicker || null,
        revenue: aiResearch.revenue || null,
        description: aiResearch.description || `${companyName} is a company in the ${aiResearch.industry || 'technology'} industry.`
      },

      // Mission, Values, and Culture
      missionAndCulture: {
        mission: basicInfo.mission || aiResearch.mission || null,
        values: aiResearch.values || [],
        culture: aiResearch.culture || null,
        workEnvironment: aiResearch.workEnvironment || null
      },

      // Recent News and Press Releases
      news: {
        recentNews: basicInfo.recentNews || [],
        pressReleases: aiResearch.pressReleases || [],
        majorAnnouncements: aiResearch.majorAnnouncements || []
      },

      // Leadership Team
      leadership: {
        executives: executives.executives || [],
        keyLeaders: executives.keyLeaders || [],
        leadershipInfo: aiResearch.leadershipInfo || null
      },

      // Products and Services
      productsAndServices: {
        mainProducts: aiResearch.mainProducts || [],
        services: aiResearch.services || [],
        technologies: aiResearch.technologies || [],
        innovations: aiResearch.innovations || []
      },

      // Competitive Landscape
      competitive: {
        mainCompetitors: aiResearch.competitors || [],
        marketPosition: aiResearch.marketPosition || null,
        uniqueValue: aiResearch.uniqueValue || null,
        industryTrends: aiResearch.industryTrends || []
      },

      // Social Media Presence
      socialMedia: {
        platforms: socialMedia.platforms || {},
        engagement: socialMedia.engagement || null
      },

      // Summary
      summary: generateResearchSummary({
        basicInfo,
        aiResearch,
        socialMedia,
        executives
      }),

      // Metadata
      metadata: {
        researchSuccess: true,
        dataQuality: calculateDataQuality({ basicInfo, aiResearch, socialMedia, executives }),
        sources: ['AI Analysis', 'Public Data', 'Social Media Lookup'],
        lastUpdated: new Date().toISOString()
      }
    };

    return comprehensiveResearch;

  } catch (error) {
    console.error('Comprehensive company research error:', error);
    return getMinimalComprehensiveResearchData(companyName);
  }
}

/**
 * Use AI to analyze job description and generate company research
 */
async function generateCompanyResearch(companyName, jobDescription) {
  const ai = getGenAI();
  if (!ai) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  const model = ai.getGenerativeModel({ model: 'models/gemini-flash-latest' });

  const prompt = `You are a professional company research analyst. Analyze the following job description and extract/infer comprehensive company information about ${companyName}.

**JOB DESCRIPTION:**
${jobDescription}

**TASK:**
Based on the job description above, provide a comprehensive company research report about ${companyName}. Extract explicit information and make reasonable inferences about:

1. **Company Background** (2-3 sentences):
   - What does the company do?
   - What industry/sector?
   - Brief overview of their business model

2. **Recent News/Achievements** (list 2-3 items if inferable):
   - Projects mentioned in job description
   - Technologies or initiatives referenced
   - Growth indicators or expansion mentioned

3. **Mission/Values**:
   - Extract or infer company mission from job description
   - Identify 3-5 core values based on language used and requirements

4. **Specific Initiatives/Projects**:
   - List 2-3 specific projects, products, or initiatives mentioned
   - Technologies or methodologies they're using

5. **Industry Context**:
   - Industry challenges they're addressing
   - Their market position or competitive advantage
   - Industry trends relevant to their work

6. **Company Size/Growth**:
   - Infer company size (startup, mid-size, enterprise) from job description clues
   - Growth stage (early-stage, growth, mature)
   - Any expansion or scaling mentioned

7. **Funding/Expansion**:
   - Any mention of funding, investment, or financial backing
   - Expansion into new markets or products
   - Acquisition or partnership news

8. **Competitive Landscape**:
   - Who are their likely competitors based on industry
   - What makes them unique or different
   - Their competitive positioning

**OUTPUT FORMAT (JSON):**
Return ONLY valid JSON (no markdown, no code blocks) in this exact structure:
{
  "companyName": "${companyName}",
  "background": "comprehensive 2-3 sentence overview",
  "recentNews": [
    "achievement or news item 1",
    "achievement or news item 2"
  ],
  "mission": "extracted or inferred mission statement",
  "values": ["value1", "value2", "value3"],
  "initiatives": [
    "specific project or initiative 1",
    "specific project or initiative 2"
  ],
  "industryContext": "industry position and challenges",
  "size": "startup|mid-size|enterprise",
  "growth": "early-stage|growth|mature",
  "funding": "funding information or null",
  "competitive": "competitive differentiation",
  "researchSuccess": true
}

**IMPORTANT:**
- Extract explicit information from job description first
- Make reasonable inferences based on job requirements and company description
- If information is not available, use "null" for single values or empty arrays []
- Keep responses concise but informative
- Focus on information that would be valuable in a cover letter

Generate the company research JSON now:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON
    const research = JSON.parse(text);

    return research;
  } catch (error) {
    console.error('AI research generation failed:', error);
    throw error;
  }
}

/**
 * Format company research for cover letter context
 */
export function formatResearchForCoverLetter(research) {
  if (!research.researchSuccess) {
    return '';
  }

  const parts = [];

  parts.push(`**COMPANY RESEARCH INSIGHTS:**\n`);

  if (research.background) {
    parts.push(`Company Background: ${research.background}`);
  }

  if (research.mission) {
    parts.push(`\nMission: ${research.mission}`);
  }

  if (research.values && research.values.length > 0) {
    parts.push(`\nCore Values: ${research.values.join(', ')}`);
  }

  if (research.recentNews && research.recentNews.length > 0) {
    parts.push(`\nRecent Achievements/News:`);
    research.recentNews.forEach(news => parts.push(`  • ${news}`));
  }

  if (research.initiatives && research.initiatives.length > 0) {
    parts.push(`\nKey Initiatives/Projects:`);
    research.initiatives.forEach(init => parts.push(`  • ${init}`));
  }

  if (research.industryContext) {
    parts.push(`\nIndustry Context: ${research.industryContext}`);
  }

  if (research.size || research.growth) {
    const sizeInfo = [research.size, research.growth].filter(Boolean).join(', ');
    parts.push(`\nCompany Stage: ${sizeInfo}`);
  }

  if (research.funding) {
    parts.push(`\nFunding/Expansion: ${research.funding}`);
  }

  if (research.competitive) {
    parts.push(`\nCompetitive Position: ${research.competitive}`);
  }

  parts.push(`\n**INSTRUCTIONS:**`);
  parts.push(`- Reference at least 2-3 specific items from the research above in the cover letter`);
  parts.push(`- Show genuine interest by mentioning recent achievements or initiatives`);
  parts.push(`- Align candidate's experience with company's mission and values`);
  parts.push(`- Demonstrate understanding of industry context and challenges`);
  parts.push(`- Make the research feel natural and integrated, not forced`);

  return parts.join('\n');
}

/**
 * Helper Functions for Comprehensive Research
 */

/**
 * Gather basic company information using AI
 */
async function gatherBasicCompanyInfo(companyName, companyWebsite) {
  const basicInfo = {
    name: companyName,
    size: null,
    industry: null,
    headquarters: null,
    founded: null,
    website: companyWebsite,
    logo: null,
    mission: null,
    recentNews: []
  };

  try {
    // Use AI to extract basic company information
    const ai = getGenAI();
    if (!ai) {
      return basicInfo;
    }
    const model = ai.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    const prompt = `Provide basic information about ${companyName}${companyWebsite ? ` (website: ${companyWebsite})` : ''}.

Return ONLY a valid JSON object:
{
  "name": "Official company name",
  "website": "Company website URL",
  "logo": "Logo URL if known, or null",
  "size": "Employee count estimate",
  "industry": "Primary industry",
  "headquarters": "City, State/Country",
  "founded": "Year founded if known, or null",
  "mission": "Mission statement if known, or null"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const aiData = JSON.parse(text);

    basicInfo.name = aiData.name || companyName;
    basicInfo.website = aiData.website || companyWebsite;
    basicInfo.logo = aiData.logo;
    basicInfo.size = aiData.size;
    basicInfo.industry = aiData.industry;
    basicInfo.headquarters = aiData.headquarters;
    basicInfo.founded = aiData.founded;
    basicInfo.mission = aiData.mission;

  } catch (error) {
    console.log('AI basic info extraction error:', error.message);
  }

  return basicInfo;
}

/**
 * Use AI to generate comprehensive company research
 */
async function generateAIResearch(companyName, jobDescription) {
  const ai = getGenAI();
  if (!ai) {
    return null;
  }
  const model = ai.getGenerativeModel({ model: 'models/gemini-flash-latest' });

  const prompt = `You are a professional business research analyst. Conduct comprehensive research about ${companyName} and provide detailed insights.

${jobDescription ? `**JOB DESCRIPTION CONTEXT:**\n${jobDescription}\n\n` : ''}

**RESEARCH REQUIREMENTS:**

Analyze and provide information about ${companyName} in the following areas:

1. **Basic Information**:
   - Industry and sector (be specific, e.g., "Cloud Computing & Enterprise Software")
   - Company size: Use employee count if known (e.g., "10,000+ employees") or estimate category
   - Headquarters location (City, State/Country)
   - Year founded
   - Type: Public/Private, Parent company if subsidiary
   - Revenue range if public company
   - Stock ticker if publicly traded

2. **Mission and Values**:
   - Company mission statement (exact wording if known)
   - Core values (3-5 specific values)
   - Company culture description (2-3 sentences)
   - Work environment characteristics

3. **Products and Services**:
   - Main products (list 3-5 flagship products with brief descriptions)
   - Services offered (enterprise, consumer, B2B, B2C)
   - Technologies used (programming languages, frameworks, cloud platforms)
   - Recent innovations or product launches (last 12 months)

4. **Leadership Team**:
   - Key executives with full names and titles (CEO, CFO, CTO, etc.)
   - Leadership style or philosophy
   - Notable backgrounds or achievements

5. **Competitive Landscape**:
   - Direct competitors (list 3-5 main competitors)
   - Market position (market leader, challenger, emerging, niche)
   - Unique value proposition or differentiators
   - Industry trends and how company is positioned

6. **Recent Developments**:
   - Recent achievements, milestones, or awards
   - Press releases or major announcements
   - Expansion plans, new offices, or market entries
   - Acquisitions, partnerships, or funding rounds

**OUTPUT FORMAT (JSON):**
Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "size": "Specific employee count (e.g., '50,000+', '1,000-5,000', '100-500') or category (enterprise/large/medium/small/startup)",
  "industry": "Specific industry name",
  "headquarters": "City, State/Country",
  "founded": 2000,
  "companyType": "Public|Private|Subsidiary|Non-profit",
  "stockTicker": "NASDAQ: GOOGL" or null,
  "revenue": "Annual revenue if known" or null,
  "description": "2-3 sentence company overview",
  "mission": "Exact mission statement",
  "values": ["value1", "value2", "value3", "value4", "value5"],
  "culture": "Company culture description",
  "workEnvironment": "Work environment characteristics",
  "mainProducts": ["Product 1: description", "Product 2: description"],
  "services": ["service1", "service2", "service3"],
  "technologies": ["tech1", "tech2", "tech3"],
  "innovations": ["innovation1: brief description", "innovation2: brief description"],
  "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"],
  "marketPosition": "Detailed market position (market share, rank, category)",
  "uniqueValue": "What differentiates them from competitors",
  "industryTrends": ["trend1", "trend2", "trend3"],
  "pressReleases": [
    {"title": "Title", "summary": "Summary", "date": "2025-11-10"}
  ],
  "majorAnnouncements": ["announcement1", "announcement2"],
  "leadershipInfo": "Leadership philosophy or notable info"
}

**IMPORTANT:**
- Use SPECIFIC, FACTUAL information about ${companyName} if you have it
- For company size, prefer specific employee counts over categories (e.g., "150,000 employees" instead of just "enterprise")
- Include all available data - don't leave fields empty if you have information
- If truly unknown, use null for strings, [] for arrays, or reasonable placeholder
- Be detailed and comprehensive - this is for job application research
- Focus on information valuable for job seekers
- All arrays should have at least 2-3 items if possible
- Use null for unknown single values, empty arrays [] for unknown lists

Generate the research JSON now:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON
    const research = JSON.parse(text);

    return research;
  } catch (error) {
    console.error('AI research generation failed:', error);
    return getDefaultAIResearch();
  }
}

/**
 * Find company social media presence using AI
 */
async function findSocialMediaPresence(companyName, companyWebsite) {
  const socialMedia = {
    platforms: {},
    engagement: null
  };

  try {
    // Use AI to find social media accounts
    const ai = getGenAI();
    if (!ai) {
      return socialMedia;
    }
    const model = ai.getGenerativeModel({ model: 'models/gemini-flash-latest' });

    const prompt = `What are the official social media accounts for ${companyName}${companyWebsite ? ` (website: ${companyWebsite})` : ''}? 

Return ONLY a valid JSON object with actual URLs or null:
{
  "linkedin": "Full LinkedIn company page URL or null",
  "twitter": "Full Twitter/X account URL or null",
  "facebook": "Full Facebook page URL or null",
  "instagram": "Full Instagram account URL or null",
  "youtube": "Full YouTube channel URL or null",
  "github": "Full GitHub organization URL or null"
}

Only include URLs you are confident about. Use null for unknown accounts.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const aiData = JSON.parse(text);

    // Only include platforms that AI found
    Object.keys(aiData).forEach(platform => {
      if (aiData[platform]) {
        socialMedia.platforms[platform] = aiData[platform];
      }
    });

    if (Object.keys(socialMedia.platforms).length > 0) {
      socialMedia.engagement = `Check ${companyName}'s social media profiles for latest updates, company culture insights, and employee testimonials.`;
    }

  } catch (error) {
    console.log('Social media lookup error:', error.message);
  }

  return socialMedia;
}

/**
 * Identify key executives and leadership team
 */
async function identifyExecutives(companyName) {
  const ai = getGenAI();
  if (!ai) {
    return { executives: [] };
  }
  const model = ai.getGenerativeModel({ model: 'models/gemini-flash-latest' });

  const prompt = `List the key executives and leadership team for ${companyName}. 

Provide information in JSON format:
{
  "executives": [
    {
      "name": "Full Name",
      "title": "Job Title (e.g., CEO, CTO, CFO)",
      "background": "Brief background or notable achievement"
    }
  ],
  "keyLeaders": ["Name - Title", "Name - Title"]
}

If you don't have specific information about ${companyName}'s executives, return:
{
  "executives": [],
  "keyLeaders": []
}

Return ONLY valid JSON (no markdown, no code blocks).`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Remove markdown code blocks
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const executives = JSON.parse(text);
    return executives;
  } catch (error) {
    console.error('Executive identification failed:', error);
    return { executives: [], keyLeaders: [] };
  }
}

/**
 * Generate a comprehensive research summary
 */
function generateResearchSummary(researchData) {
  const { basicInfo, aiResearch } = researchData;

  const summaryParts = [];

  // Company overview
  if (basicInfo.name) {
    summaryParts.push(`${basicInfo.name} is ${aiResearch.size || 'a'} ${aiResearch.industry || 'company'}`);
    if (basicInfo.headquarters) {
      summaryParts[0] += ` headquartered in ${basicInfo.headquarters}`;
    }
    if (basicInfo.founded) {
      summaryParts[0] += `, founded in ${basicInfo.founded}`;
    }
    summaryParts[0] += '.';
  }

  // Mission
  if (aiResearch.mission) {
    summaryParts.push(`Mission: ${aiResearch.mission}`);
  }

  // Products/Services
  if (aiResearch.mainProducts && aiResearch.mainProducts.length > 0) {
    summaryParts.push(`Key offerings include ${aiResearch.mainProducts.slice(0, 3).join(', ')}.`);
  }

  // Market position
  if (aiResearch.marketPosition) {
    summaryParts.push(`Market Position: ${aiResearch.marketPosition}`);
  }

  // Culture
  if (aiResearch.culture) {
    summaryParts.push(`Culture: ${aiResearch.culture}`);
  }

  return summaryParts.join(' ');
}

/**
 * Calculate data quality score (0-100)
 */
function calculateDataQuality(data) {
  let score = 0;
  let maxScore = 0;

  // Basic info (25 points)
  maxScore += 25;
  if (data.basicInfo.industry) score += 5;
  if (data.basicInfo.size) score += 5;
  if (data.basicInfo.headquarters) score += 5;
  if (data.basicInfo.website) score += 5;
  if (data.basicInfo.founded) score += 5;

  // AI Research (50 points)
  maxScore += 50;
  if (data.aiResearch.mission) score += 10;
  if (data.aiResearch.values && data.aiResearch.values.length > 0) score += 10;
  if (data.aiResearch.mainProducts && data.aiResearch.mainProducts.length > 0) score += 10;
  if (data.aiResearch.competitors && data.aiResearch.competitors.length > 0) score += 10;
  if (data.aiResearch.culture) score += 10;

  // Social Media (15 points)
  maxScore += 15;
  if (data.socialMedia.platforms && Object.keys(data.socialMedia.platforms).length > 0) score += 15;

  // Executives (10 points)
  maxScore += 10;
  if (data.executives.executives && data.executives.executives.length > 0) score += 10;

  return Math.round((score / maxScore) * 100);
}

/**
 * Get minimal comprehensive research data if full research fails
 */
function getMinimalComprehensiveResearchData(companyName) {
  return {
    companyName,
    researchDate: new Date().toISOString(),
    basicInfo: {
      name: companyName,
      size: 'Unknown',
      industry: 'Unknown',
      headquarters: 'Unknown',
      founded: null,
      website: null,
      logo: null,
      description: `${companyName} is a company. Further research data is unavailable.`
    },
    missionAndCulture: {
      mission: null,
      values: [],
      culture: null,
      workEnvironment: null
    },
    news: {
      recentNews: [],
      pressReleases: [],
      majorAnnouncements: []
    },
    leadership: {
      executives: [],
      keyLeaders: [],
      leadershipInfo: null
    },
    productsAndServices: {
      mainProducts: [],
      services: [],
      technologies: [],
      innovations: []
    },
    competitive: {
      mainCompetitors: [],
      marketPosition: null,
      uniqueValue: null,
      industryTrends: []
    },
    socialMedia: {
      platforms: {},
      engagement: null
    },
    summary: `Research data for ${companyName} is currently unavailable. Please try again later or provide more context.`,
    metadata: {
      researchSuccess: false,
      dataQuality: 0,
      sources: [],
      lastUpdated: new Date().toISOString()
    }
  };
}

/**
 * Get default AI research structure
 */
function getDefaultAIResearch() {
  return {
    size: null,
    industry: null,
    headquarters: null,
    founded: null,
    mission: null,
    values: [],
    culture: null,
    workEnvironment: null,
    mainProducts: [],
    services: [],
    technologies: [],
    innovations: [],
    competitors: [],
    marketPosition: null,
    uniqueValue: null,
    industryTrends: [],
    pressReleases: [],
    majorAnnouncements: [],
    leadershipInfo: null
  };
}

/**
 * Format comprehensive research data for display
 */
export function formatComprehensiveResearch(research) {
  const formatted = {
    overview: research.summary,
    sections: []
  };

  // Basic Information Section
  if (research.basicInfo.industry || research.basicInfo.size || research.basicInfo.headquarters) {
    formatted.sections.push({
      title: 'Company Overview',
      items: [
        research.basicInfo.industry && `Industry: ${research.basicInfo.industry}`,
        research.basicInfo.size && `Size: ${research.basicInfo.size}`,
        research.basicInfo.headquarters && `Headquarters: ${research.basicInfo.headquarters}`,
        research.basicInfo.founded && `Founded: ${research.basicInfo.founded}`
      ].filter(Boolean)
    });
  }

  // Mission and Culture Section
  if (research.missionAndCulture.mission || research.missionAndCulture.values.length > 0) {
    formatted.sections.push({
      title: 'Mission & Culture',
      items: [
        research.missionAndCulture.mission && `Mission: ${research.missionAndCulture.mission}`,
        research.missionAndCulture.values.length > 0 && `Values: ${research.missionAndCulture.values.join(', ')}`,
        research.missionAndCulture.culture && `Culture: ${research.missionAndCulture.culture}`
      ].filter(Boolean)
    });
  }

  // Products and Services Section
  if (research.productsAndServices.mainProducts.length > 0) {
    formatted.sections.push({
      title: 'Products & Services',
      items: [
        `Products: ${research.productsAndServices.mainProducts.join(', ')}`,
        research.productsAndServices.technologies.length > 0 && `Technologies: ${research.productsAndServices.technologies.join(', ')}`
      ].filter(Boolean)
    });
  }

  // Leadership Section
  if (research.leadership.executives.length > 0 || research.leadership.keyLeaders.length > 0) {
    formatted.sections.push({
      title: 'Leadership Team',
      items: research.leadership.executives.map(exec => `${exec.name} - ${exec.title}`)
    });
  }

  // Competitive Landscape Section
  if (research.competitive.mainCompetitors.length > 0 || research.competitive.marketPosition) {
    formatted.sections.push({
      title: 'Competitive Landscape',
      items: [
        research.competitive.mainCompetitors.length > 0 && `Competitors: ${research.competitive.mainCompetitors.join(', ')}`,
        research.competitive.marketPosition && `Market Position: ${research.competitive.marketPosition}`,
        research.competitive.uniqueValue && `Unique Value: ${research.competitive.uniqueValue}`
      ].filter(Boolean)
    });
  }

  // Social Media Section
  if (research.socialMedia.platforms && Object.keys(research.socialMedia.platforms).length > 0) {
    formatted.sections.push({
      title: 'Social Media Presence',
      items: Object.entries(research.socialMedia.platforms).map(([platform, url]) =>
        `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${url}`
      )
    });
  }

  return formatted;
}
