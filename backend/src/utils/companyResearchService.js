import fetch from 'node-fetch';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Research company information using multiple sources
 * @param {string} companyName - Name of the company to research
 * @param {string} jobDescription - Job description for additional context
 * @returns {Promise<Object>} Company research data
 */
export async function researchCompany(companyName, jobDescription = '') {
  try {
    console.log(`🔍 Researching company: ${companyName}`);
    
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
 * Use AI to analyze job description and generate company research
 */
async function generateCompanyResearch(companyName, jobDescription) {
  const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

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
    
    console.log(`✅ Company research completed for ${companyName}`);
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
