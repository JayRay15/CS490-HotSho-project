import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { successResponse, errorResponse, sendResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * UC-062: Auto-fetch company information
 * Fetches company data from multiple sources and consolidates it
 */

// Check if Gemini API key is configured
const GEMINI_CONFIGURED = !!process.env.GEMINI_API_KEY;
if (!GEMINI_CONFIGURED) {
    console.warn('[company-controller] WARNING: GEMINI_API_KEY is not configured. AI-powered company research will not be available.');
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Use Gemini AI to extract comprehensive company information
 * Focuses on basic information: size, industry, headquarters, description, mission
 */
async function extractCompanyInfoWithAI(companyName, websiteUrl = '') {
    try {
        const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

        const prompt = `You are a company research expert. Determine if ${companyName}${websiteUrl ? ` (website: ${websiteUrl})` : ''} is a real, existing company that you have knowledge about.

IMPORTANT: If this is NOT a real company, or you don't have reliable information about it, return this JSON:
{
  "exists": false,
  "message": "Unable to find information about this company. Please verify the company name or provide more details."
}

If this IS a real company that you know about, return ONLY a valid JSON object with the following structure. Do not include any markdown formatting, code blocks, or additional text:

{
  "exists": true,
  "name": "Official company name",
  "website": "Company website URL starting with https://",
  "logo": "Company logo URL if available, or empty string",
  "description": "2-3 sentence company description",
  "mission": "Company mission statement",
  "size": "Choose ONE from: 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001-10000, 10000+",
  "industry": "Primary industry/sector",
  "location": "City, State/Country (headquarters)",
  "glassdoor": {
    "url": "https://www.glassdoor.com/Search/results.htm?keyword=COMPANY-NAME - Generic search URL to help users find the company on Glassdoor. Replace COMPANY-NAME with the actual company name with spaces replaced by hyphens. This is a search link, not a direct company page.",
    "rating": "Leave as null - we cannot accurately estimate Glassdoor ratings",
    "reviewCount": "Leave as null - we cannot accurately estimate review counts"
  }
}

Important guidelines:
- ONLY provide information if you are confident this is a real company
- If the company name seems fake, made-up, or you have no knowledge of it, return exists: false
- For real companies, provide accurate information based on your knowledge
- For size, estimate based on your knowledge of the company's employee count
- Keep descriptions concise and professional
- Location should be the headquarters city and country/state
- If logo URL is available from your knowledge, include it, otherwise leave empty
- For Glassdoor URL, create a SEARCH link in format: https://www.glassdoor.com/Search/results.htm?keyword=Company-Name (replace spaces with hyphens)
- DO NOT try to guess specific Glassdoor company page URLs - use search links only
- Set rating and reviewCount to null - we cannot accurately estimate these values
- The search link will help users find the company on Glassdoor themselves`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        // Remove markdown code blocks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const aiData = JSON.parse(text);

        // Check if company exists
        if (aiData.exists === false) {
            return {
                exists: false,
                message: aiData.message || "Unable to find information about this company. Please verify the company name or provide more details."
            };
        }

        return {
            exists: true,
            name: aiData.name || companyName,
            website: aiData.website || websiteUrl,
            logo: aiData.logo || '',
            description: aiData.description || '',
            mission: aiData.mission || '',
            size: aiData.size || '',
            industry: aiData.industry || '',
            location: aiData.location || '',
            glassdoor: {
                url: aiData.glassdoor?.url || '',
                rating: aiData.glassdoor?.rating || null,
                reviewCount: aiData.glassdoor?.reviewCount || null
            }
        };
    } catch (error) {
        console.error('AI extraction error:', error);
        return null;
    }
}

/**
 * Fetch company information using AI
 * GET /api/companies/info?name=CompanyName&domain=company.com
 */
export const getCompanyInfo = asyncHandler(async (req, res) => {
    const { name, domain } = req.query;

    if (!name && !domain) {
        const { response, statusCode } = errorResponse(
            "Company name or domain is required",
            400,
            ERROR_CODES.VALIDATION_ERROR
        );
        return sendResponse(res, response, statusCode);
    }

    try {
        // Initialize company data with basic structure
        let companyData = {
            name: name || '',
            website: domain || '',
            logo: '',
            description: '',
            mission: '',
            size: '',
            industry: '',
            location: '',
            contactInfo: {
                email: '',
                phone: '',
                address: ''
            },
            glassdoorRating: {
                rating: null,
                reviewCount: null,
                url: ''
            }
        };

        // Use Gemini AI to extract comprehensive company information
        console.log(`Using AI to extract company info for ${companyData.name || domain}...`);
        const aiData = await extractCompanyInfoWithAI(companyData.name || domain, domain);

        if (aiData && aiData.exists === false) {
            // Company doesn't exist or no information available
            const { response, statusCode } = errorResponse(
                aiData.message || "Unable to find information about this company. Please verify the company name or provide more details.",
                404,
                ERROR_CODES.NOT_FOUND
            );
            return sendResponse(res, response, statusCode);
        }

        if (aiData && aiData.exists !== false) {
            // Use AI data for all fields
            companyData.name = aiData.name || companyData.name;
            companyData.website = aiData.website || companyData.website;
            companyData.logo = aiData.logo || companyData.logo;
            companyData.description = aiData.description || companyData.description;
            companyData.mission = aiData.mission || companyData.mission;
            companyData.size = aiData.size || companyData.size;
            companyData.industry = aiData.industry || companyData.industry;
            companyData.location = aiData.location || companyData.location;

            // Use AI-provided Glassdoor data if available
            if (aiData.glassdoor) {
                companyData.glassdoorRating.url = aiData.glassdoor.url || '';
                // Don't include rating/reviewCount since we can't get accurate data
                // Users can click the search link to see actual ratings on Glassdoor
            }
        }

        // Return whatever we found
        const { response, statusCode } = successResponse(
            "Company information retrieved successfully",
            { companyInfo: companyData }
        );
        return sendResponse(res, response, statusCode);

    } catch (error) {
        console.error("Error fetching company info:", error);
        const { response, statusCode } = errorResponse(
            "Failed to fetch company information",
            500,
            ERROR_CODES.SERVER_ERROR
        );
        return sendResponse(res, response, statusCode);
    }
});

/**
 * Search for company news using Google search (free)
 * GET /api/companies/news?company=CompanyName
 */
export const getCompanyNews = asyncHandler(async (req, res) => {
    const { company, limit = 5, minRelevance = 3, category } = req.query;

    if (!company) {
        const { response, statusCode } = errorResponse(
            "Company name is required",
            400,
            ERROR_CODES.VALIDATION_ERROR
        );
        return sendResponse(res, response, statusCode);
    }

    try {
        // Dynamic import of news service
        const { fetchCompanyNews, generateNewsSummary } = await import('../utils/newsService.js');

        // Fetch news with options
        let news = await fetchCompanyNews(company, {
            limit: parseInt(limit),
            minRelevance: parseInt(minRelevance),
        });

        // Filter by category if specified
        if (category && category !== 'all') {
            news = news.filter(item => item.category === category);
        }

        // Generate summary
        const summary = generateNewsSummary(news, company);

        const { response, statusCode } = successResponse(
            "Company news retrieved successfully",
            {
                company,
                news,
                summary,
                categories: ['all', 'funding', 'product_launch', 'hiring', 'acquisition', 'partnership', 'leadership', 'awards', 'general'],
            }
        );
        return sendResponse(res, response, statusCode);

    } catch (error) {
        console.error("Error fetching company news:", error);
        const { response, statusCode } = errorResponse(
            "Failed to fetch company news",
            500,
            ERROR_CODES.SERVER_ERROR
        );
        return sendResponse(res, response, statusCode);
    }
});

/**
 * Export news summary for job applications
 * GET /api/companies/news/export?company=<name>&format=<json|text>
 */
export const exportNewsSummary = asyncHandler(async (req, res) => {
    const { company, format = 'json' } = req.query;

    if (!company) {
        const { response, statusCode } = errorResponse(
            "Company name is required",
            400,
            ERROR_CODES.VALIDATION_ERROR
        );
        return sendResponse(res, response, statusCode);
    }

    try {
        const { fetchCompanyNews, generateNewsSummary } = await import('../utils/newsService.js');

        // Fetch news
        const news = await fetchCompanyNews(company, { limit: 10, minRelevance: 5 });
        const summary = generateNewsSummary(news, company);

        if (format === 'text') {
            // Export as formatted text for cover letters/applications
            let textOutput = `COMPANY NEWS SUMMARY - ${company.toUpperCase()}\n`;
            textOutput += `Generated: ${new Date().toLocaleDateString()}\n`;
            textOutput += `${'='.repeat(60)}\n\n`;
            textOutput += `OVERVIEW:\n${summary.summary}\n\n`;

            if (summary.highlights.length > 0) {
                textOutput += `KEY HIGHLIGHTS:\n${summary.highlights.join('\n')}\n\n`;
            }

            textOutput += `RECENT NEWS (${news.length} items):\n`;
            textOutput += `${'='.repeat(60)}\n\n`;

            news.forEach((item, index) => {
                textOutput += `${index + 1}. ${item.title}\n`;
                textOutput += `   Category: ${item.category} | Sentiment: ${item.sentiment} | Relevance: ${item.relevanceScore}/10\n`;
                textOutput += `   Date: ${new Date(item.date).toLocaleDateString()} | Source: ${item.source}\n`;
                textOutput += `   ${item.summary}\n`;
                if (item.keyPoints && item.keyPoints.length > 0) {
                    textOutput += `   Key Points:\n`;
                    item.keyPoints.forEach(point => {
                        textOutput += `   - ${point}\n`;
                    });
                }
                textOutput += `   URL: ${item.url}\n\n`;
            });

            res.set('Content-Type', 'text/plain');
            res.set('Content-Disposition', `attachment; filename="${company.replace(/\s+/g, '_')}_news_summary.txt"`);
            return res.send(textOutput);
        } else {
            // Export as JSON
            const exportData = {
                company,
                exportDate: new Date(),
                summary,
                news,
                metadata: {
                    totalItems: news.length,
                    categories: summary.categories,
                    averageRelevance: summary.averageRelevance,
                },
            };

            res.set('Content-Type', 'application/json');
            res.set('Content-Disposition', `attachment; filename="${company.replace(/\s+/g, '_')}_news_summary.json"`);
            return res.json(exportData);
        }
    } catch (error) {
        console.error("Error exporting news summary:", error);
        const { response, statusCode } = errorResponse(
            "Failed to export news summary",
            500,
            ERROR_CODES.SERVER_ERROR
        );
        return sendResponse(res, response, statusCode);
    }
});

/**
 * UC-064: Comprehensive Company Research
 * GET /api/companies/research?company=<name>&jobDescription=<desc>&website=<url>
 */
export const getComprehensiveResearch = asyncHandler(async (req, res) => {
    const { company, jobDescription = '', website = '' } = req.query;

    if (!company) {
        const { response, statusCode } = errorResponse(
            "Company name is required",
            400,
            ERROR_CODES.VALIDATION_ERROR
        );
        return sendResponse(res, response, statusCode);
    }

    // Check if Gemini API is configured before proceeding
    if (!GEMINI_CONFIGURED) {
        const { response, statusCode } = errorResponse(
            "Company research is temporarily unavailable. Please try again later.",
            503,
            ERROR_CODES.SERVICE_UNAVAILABLE
        );
        return sendResponse(res, response, statusCode);
    }

    try {
        // Dynamic import of research service
        const { conductComprehensiveResearch, formatComprehensiveResearch } = await import('../utils/companyResearchService.js');

        // Conduct comprehensive research
        const research = await conductComprehensiveResearch(company, jobDescription, website);

        // Format for display
        const formatted = formatComprehensiveResearch(research);

        const { response, statusCode } = successResponse(
            "Company research completed successfully",
            {
                research,
                formatted,
                metadata: {
                    researchDate: research.researchDate,
                    dataQuality: research.metadata.dataQuality,
                    sources: research.metadata.sources
                }
            }
        );
        return sendResponse(res, response, statusCode);

    } catch (error) {
        console.error("Error conducting company research:", error);
        const { response, statusCode } = errorResponse(
            "Failed to conduct company research",
            500,
            ERROR_CODES.SERVER_ERROR
        );
        return sendResponse(res, response, statusCode);
    }
});

/**
 * Export comprehensive research report
 * GET /api/companies/research/export?company=<name>&format=<json|pdf>
 */
export const exportResearchReport = asyncHandler(async (req, res) => {
    const { company, format = 'json', jobDescription = '', website = '' } = req.query;

    if (!company) {
        const { response, statusCode } = errorResponse(
            "Company name is required",
            400,
            ERROR_CODES.VALIDATION_ERROR
        );
        return sendResponse(res, response, statusCode);
    }

    // Check if Gemini API is configured before proceeding
    if (!GEMINI_CONFIGURED) {
        const { response, statusCode } = errorResponse(
            "Company research is temporarily unavailable. Please try again later.",
            503,
            ERROR_CODES.SERVICE_UNAVAILABLE
        );
        return sendResponse(res, response, statusCode);
    }

    try {
        const { conductComprehensiveResearch } = await import('../utils/companyResearchService.js');

        // Conduct research
        const research = await conductComprehensiveResearch(company, jobDescription, website);

        if (format === 'json') {
            // Export as JSON
            res.set('Content-Type', 'application/json');
            res.set('Content-Disposition', `attachment; filename="${company.replace(/\s+/g, '_')}_research_report.json"`);
            return res.json(research);
        } else {
            // Export as formatted text
            let textOutput = `COMPREHENSIVE COMPANY RESEARCH REPORT\n`;
            textOutput += `Company: ${company.toUpperCase()}\n`;
            textOutput += `Generated: ${new Date().toLocaleDateString()}\n`;
            textOutput += `Data Quality: ${research.metadata.dataQuality}%\n`;
            textOutput += `${'='.repeat(70)}\n\n`;

            // Summary
            textOutput += `EXECUTIVE SUMMARY:\n${research.summary}\n\n`;
            textOutput += `${'='.repeat(70)}\n\n`;

            // Basic Information
            textOutput += `BASIC INFORMATION:\n`;
            textOutput += `  Industry: ${research.basicInfo.industry}\n`;
            textOutput += `  Size: ${research.basicInfo.size}\n`;
            textOutput += `  Headquarters: ${research.basicInfo.headquarters}\n`;
            if (research.basicInfo.founded) {
                textOutput += `  Founded: ${research.basicInfo.founded}\n`;
            }
            if (research.basicInfo.website) {
                textOutput += `  Website: ${research.basicInfo.website}\n`;
            }
            textOutput += `\n`;

            // Mission and Culture
            if (research.missionAndCulture.mission || research.missionAndCulture.values.length > 0) {
                textOutput += `MISSION & CULTURE:\n`;
                if (research.missionAndCulture.mission) {
                    textOutput += `  Mission: ${research.missionAndCulture.mission}\n`;
                }
                if (research.missionAndCulture.values.length > 0) {
                    textOutput += `  Core Values:\n`;
                    research.missionAndCulture.values.forEach(value => {
                        textOutput += `    • ${value}\n`;
                    });
                }
                if (research.missionAndCulture.culture) {
                    textOutput += `  Culture: ${research.missionAndCulture.culture}\n`;
                }
                textOutput += `\n`;
            }

            // Products and Services
            if (research.productsAndServices.mainProducts.length > 0) {
                textOutput += `PRODUCTS & SERVICES:\n`;
                textOutput += `  Main Products:\n`;
                research.productsAndServices.mainProducts.forEach(product => {
                    textOutput += `    • ${product}\n`;
                });
                if (research.productsAndServices.technologies.length > 0) {
                    textOutput += `  Technologies:\n`;
                    research.productsAndServices.technologies.forEach(tech => {
                        textOutput += `    • ${tech}\n`;
                    });
                }
                textOutput += `\n`;
            }

            // Leadership
            if (research.leadership.executives.length > 0) {
                textOutput += `LEADERSHIP TEAM:\n`;
                research.leadership.executives.forEach(exec => {
                    textOutput += `  • ${exec.name} - ${exec.title}\n`;
                    if (exec.background) {
                        textOutput += `    ${exec.background}\n`;
                    }
                });
                textOutput += `\n`;
            }

            // Competitive Landscape
            if (research.competitive.mainCompetitors.length > 0 || research.competitive.marketPosition) {
                textOutput += `COMPETITIVE LANDSCAPE:\n`;
                if (research.competitive.mainCompetitors.length > 0) {
                    textOutput += `  Main Competitors:\n`;
                    research.competitive.mainCompetitors.forEach(competitor => {
                        textOutput += `    • ${competitor}\n`;
                    });
                }
                if (research.competitive.marketPosition) {
                    textOutput += `  Market Position: ${research.competitive.marketPosition}\n`;
                }
                if (research.competitive.uniqueValue) {
                    textOutput += `  Unique Value: ${research.competitive.uniqueValue}\n`;
                }
                textOutput += `\n`;
            }

            // Social Media
            if (research.socialMedia.platforms && Object.keys(research.socialMedia.platforms).length > 0) {
                textOutput += `SOCIAL MEDIA PRESENCE:\n`;
                Object.entries(research.socialMedia.platforms).forEach(([platform, url]) => {
                    textOutput += `  ${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${url}\n`;
                });
                textOutput += `\n`;
            }

            textOutput += `${'='.repeat(70)}\n`;
            textOutput += `Report generated by HotSho Job Application Tracker\n`;
            textOutput += `Research Date: ${research.researchDate}\n`;

            res.set('Content-Type', 'text/plain');
            res.set('Content-Disposition', `attachment; filename="${company.replace(/\s+/g, '_')}_research_report.txt"`);
            return res.send(textOutput);
        }
    } catch (error) {
        console.error("Error exporting research report:", error);
        const { response, statusCode } = errorResponse(
            "Failed to export research report",
            500,
            ERROR_CODES.SERVER_ERROR
        );
        return sendResponse(res, response, statusCode);
    }
});
