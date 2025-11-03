import { errorResponse, sendResponse, successResponse, ERROR_CODES } from "../utils/responseFormat.js";

/**
 * Scrape job posting details from URL
 * Supports LinkedIn, Indeed, Glassdoor, and generic job postings
 */
export const scrapeJobFromURL = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      const { response, statusCode } = errorResponse(
        "URL is required",
        400,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
      return sendResponse(res, response, statusCode);
    }

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      const { response, statusCode } = errorResponse(
        "Invalid URL format",
        400,
        ERROR_CODES.INVALID_INPUT
      );
      return sendResponse(res, response, statusCode);
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // Detect job board type
    let jobData = {
      url: url,
      title: null,
      company: null,
      location: null,
      description: null,
      requirements: null,
      jobType: null,
      workMode: null,
      industry: null,
      importStatus: 'failed',
      importNotes: ''
    };

    try {
      // Fetch the page
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();

      // Use regex and basic parsing for common job boards
      if (hostname.includes('linkedin.com')) {
        jobData = await parseLinkedIn(html, url);
      } else if (hostname.includes('indeed.com')) {
        jobData = await parseIndeed(html, url);
      } else if (hostname.includes('glassdoor.com')) {
        jobData = await parseGlassdoor(html, url);
      } else {
        // Generic parsing for other sites
        jobData = await parseGeneric(html, url);
      }

      jobData.importStatus = jobData.title ? 'success' : 'partial';
      if (jobData.importStatus === 'partial') {
        jobData.importNotes = 'Some fields could not be automatically extracted. Please review and fill in manually.';
      } else {
        jobData.importNotes = 'Job details extracted successfully. Please review and adjust as needed.';
      }

    } catch (error) {
      console.error('Error scraping job URL:', error);
      jobData.importStatus = 'failed';
      jobData.importNotes = `Failed to fetch job details: ${error.message}. Please enter details manually.`;
    }

    const { response: successResp, statusCode } = successResponse(
      "Job URL processed",
      { jobData },
      200
    );
    return sendResponse(res, successResp, statusCode);

  } catch (err) {
    console.error("Job scraping error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to scrape job URL: ${err.message}`,
      500,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// Parse LinkedIn job posting
async function parseLinkedIn(html, url) {
  const data = { url };

  // Extract JSON-LD structured data if available
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      if (Array.isArray(jsonLd)) {
        const jobPosting = jsonLd.find(item => item['@type'] === 'JobPosting');
        if (jobPosting) {
          data.title = jobPosting.title || jobPosting.name;
          data.company = jobPosting.hiringOrganization?.name || jobPosting.employer?.name;
          data.location = jobPosting.jobLocation?.address?.addressLocality || 
                         jobPosting.jobLocation?.name ||
                         jobPosting.place?.name;
          data.description = jobPosting.description;
        }
      } else if (jsonLd['@type'] === 'JobPosting') {
        data.title = jsonLd.title || jsonLd.name;
        data.company = jsonLd.hiringOrganization?.name || jsonLd.employer?.name;
        data.location = jsonLd.jobLocation?.address?.addressLocality || jsonLd.jobLocation?.name;
        data.description = jsonLd.description;
      }
    } catch (e) {
      // Continue with regex parsing
    }
  }

  // Fallback to regex parsing
  if (!data.title) {
    const titleMatch = html.match(/<h1[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>(.*?)<\/h1>/i) ||
                       html.match(/"title":"([^"]+)"/);
    data.title = titleMatch ? cleanHtml(titleMatch[1]) : null;
  }

  if (!data.company) {
    const companyMatch = html.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>(.*?)<\/a>/i) ||
                         html.match(/"companyName":"([^"]+)"/) ||
                         html.match(/"hiringOrganization":\s*{\s*"name":\s*"([^"]+)"/);
    data.company = companyMatch ? cleanHtml(companyMatch[1]) : null;
  }

  if (!data.location) {
    const locationMatch = html.match(/<span[^>]*class="[^"]*topcard__flavor[^"]*"[^>]*>(.*?)<\/span>/i) ||
                          html.match(/"jobLocation":\s*{\s*"name":\s*"([^"]+)"/);
    data.location = locationMatch ? cleanHtml(locationMatch[1]) : null;
  }

  if (!data.description) {
    const descMatch = html.match(/<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>(.*?)<\/div>/s) ||
                     html.match(/"description":\s*"([^"]+)"|\"description\":\s*\{[^}]*"text":\s*"([^"]+)"/);
    data.description = descMatch ? cleanHtml(descMatch[1] || descMatch[2]) : null;
  }

  return data;
}

// Parse Indeed job posting
async function parseIndeed(html, url) {
  const data = { url };

  // Extract JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      if (jsonLd['@type'] === 'JobPosting') {
        data.title = jsonLd.title || jsonLd.name;
        data.company = jsonLd.hiringOrganization?.name;
        data.location = jsonLd.jobLocation?.address?.addressLocality;
        data.description = jsonLd.description;
      }
    } catch (e) {}
  }

  // Fallback regex
  if (!data.title) {
    const titleMatch = html.match(/<h1[^>]*class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>(.*?)<\/h1>/i);
    data.title = titleMatch ? cleanHtml(titleMatch[1]) : null;
  }

  if (!data.company) {
    const companyMatch = html.match(/<a[^>]*class="[^"]*jobsearch-CompanyReview--primary[^"]*"[^>]*>(.*?)<\/a>/i) ||
                         html.match(/data-testid="company-name"[^>]*>(.*?)<\/a>/);
    data.company = companyMatch ? cleanHtml(companyMatch[1]) : null;
  }

  if (!data.description) {
    const descMatch = html.match(/<div[^>]*id="jobDescriptionText"[^>]*>(.*?)<\/div>/s);
    data.description = descMatch ? cleanHtml(descMatch[1]) : null;
  }

  return data;
}

// Parse Glassdoor job posting
async function parseGlassdoor(html, url) {
  const data = { url };

  const titleMatch = html.match(/<h1[^>]*class="[^"]*jobTitle[^"]*"[^>]*>(.*?)<\/h1>/i) ||
                    html.match(/"jobTitle":"([^"]+)"/);
  data.title = titleMatch ? cleanHtml(titleMatch[1]) : null;

  const companyMatch = html.match(/<span[^>]*class="[^"]*employerName[^"]*"[^>]*>(.*?)<\/span>/i) ||
                       html.match(/"employerName":"([^"]+)"/);
  data.company = companyMatch ? cleanHtml(companyMatch[1]) : null;

  const locationMatch = html.match(/<span[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)<\/span>/i);
  data.location = locationMatch ? cleanHtml(locationMatch[1]) : null;

  const descMatch = html.match(/<div[^>]*class="[^"]*jobDescriptionContent[^"]*"[^>]*>(.*?)<\/div>/s);
  data.description = descMatch ? cleanHtml(descMatch[1]) : null;

  return data;
}

// Generic parsing for other job sites
async function parseGeneric(html, url) {
  const data = { url };

  // Try to find common patterns
  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i) ||
                    html.match(/<title>(.*?)<\/title>/i) ||
                    html.match(/"jobTitle":"([^"]+)"/i) ||
                    html.match(/"title":"([^"]+)"/i);
  data.title = titleMatch ? cleanHtml(titleMatch[1]) : null;

  const companyMatch = html.match(/"company":"([^"]+)"/i) ||
                       html.match(/"employer":"([^"]+)"/i) ||
                       html.match(/<strong[^>]*>Company:<\/strong>\s*([^<]+)/i);
  data.company = companyMatch ? cleanHtml(companyMatch[1]) : null;

  // Look for description in common tags
  const descPatterns = [
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/s,
    /<section[^>]*id="[^"]*description[^"]*"[^>]*>(.*?)<\/section>/s,
    /<div[^>]*id="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/s
  ];

  for (const pattern of descPatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].length > 100) {
      data.description = cleanHtml(match[1]);
      break;
    }
  }

  return data;
}

// Clean HTML tags and decode entities
function cleanHtml(text) {
  if (!text) return null;
  return text
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000); // Limit length
}

