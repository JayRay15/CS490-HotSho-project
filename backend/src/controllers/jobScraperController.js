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
    console.log('🔍 Scraping job from:', hostname, 'URL:', url);

    // Validate that this looks like a job board URL
    const knownJobBoards = [
      'linkedin.com', 'indeed.com', 'glassdoor.com', 'joinhandshake.com',
      'greenhouse.io', 'lever.co', 'myworkdayjobs.com', 'workday.com',
      'smartrecruiters.com', 'workable.com', 'bamboohr.com', 'breezy.hr',
      'recruitee.com', 'jobvite.com', 'ziprecruiter.com', 'monster.com'
    ];
    
    const isKnownJobBoard = knownJobBoards.some(board => hostname.includes(board));
    const looksLikeJobURL = /job|career|position|opening|posting|apply|hiring|recruit/i.test(url);
    
    if (!isKnownJobBoard && !looksLikeJobURL) {
      const { response, statusCode } = errorResponse(
        "This doesn't appear to be a job posting URL. Please enter a URL from a job board (LinkedIn, Greenhouse, Lever, Workday, etc.) or a company careers page.",
        400,
        ERROR_CODES.INVALID_INPUT
      );
      return sendResponse(res, response, statusCode);
    }

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
      
      // Enhanced headers to mimic a real browser
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      };
      
      const response = await fetch(url, { headers });
      console.log('📥 Fetched page, status:', response.status);

      if (!response.ok) {
        // Provide specific error messages for common issues
        if (response.status === 403) {
          const boardName = hostname.includes('indeed') ? 'Indeed' : hostname.includes('glassdoor') ? 'Glassdoor' : 'This job board';
          throw new Error(`${boardName} blocked the request (403 Forbidden). This site uses bot detection. Please copy the job details manually, or try accessing the direct job posting URL.`);
        } else if (response.status === 404) {
          throw new Error(`Job posting not found (404). The URL may be incorrect or the job may have been removed.`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();

      // Use regex/JSON-LD and basic parsing for common job boards
      if (hostname.includes('linkedin.com')) {
        jobData = await parseLinkedIn(html, url);
      } else if (hostname.includes('indeed.com')) {
        jobData = await parseIndeed(html, url);
      } else if (hostname.includes('glassdoor.com')) {
        jobData = await parseGlassdoor(html, url);
      } else if (hostname.includes('joinhandshake.com')) {
        console.log('🤝 Parsing Handshake job...');
        jobData = await parseHandshake(html, url);
        console.log('🤝 Handshake result:', { title: jobData.title, company: jobData.company, hasDescription: !!jobData.description });
      } else if (hostname.includes('boards.greenhouse.io')) {
        jobData = await parseGreenhouse(html, url);
      } else if (hostname.includes('jobs.lever.co')) {
        jobData = await parseLever(html, url);
      } else if (hostname.includes('myworkdayjobs.com') || /\.wd\d+\.myworkdayjobs\.com$/.test(hostname) || hostname.includes('workday')) {
        jobData = await parseWorkday(html, url);
      } else {
        // Generic parsing for other sites
        jobData = await parseGeneric(html, url);
      }

      // Augment with normalized fields and confidences
      jobData = augmentAndNormalize(html, hostname, jobData);

      // Determine import status based on confidences
      const titleConf = jobData?.extractionInfo?.title?.confidence || 0;
      const companyConf = jobData?.extractionInfo?.company?.confidence || 0;
      const hasCore = (titleConf >= 0.6 && companyConf >= 0.6);
      const anyField = Object.keys(jobData || {}).some(k => ['title','company','description','location','jobType','workMode','salary','requirements','benefits'].includes(k) && jobData[k] && (Array.isArray(jobData[k]) ? jobData[k].length : true));
      if (hasCore) {
        jobData.importStatus = 'success';
        jobData.importNotes = 'Job details extracted successfully. Please review and adjust as needed.';
      } else if (anyField) {
        jobData.importStatus = 'partial';
        jobData.importNotes = 'Some fields could not be confidently extracted. Please review and complete missing details.';
      } else {
        jobData.importStatus = 'failed';
        jobData.importNotes = 'Could not extract job details. Please enter manually.';
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

  // Extract from og:title meta tag (format: "Company hiring Job Title in Location | LinkedIn")
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (ogTitleMatch) {
    const titleText = ogTitleMatch[1];
    // Pattern: "ADP hiring Summer 2026 Data Science/Machine Learning Internship in Florham Park, NJ | LinkedIn"
    const titlePattern = /^([^|]+?)\s+hiring\s+(.+?)\s+in\s+(.+?)\s*\|/i;
    const match = titleText.match(titlePattern);
    if (match) {
      if (!data.company) data.company = cleanHtml(match[1].trim());
      if (!data.title) data.title = cleanHtml(match[2].trim());
      if (!data.location) data.location = cleanHtml(match[3].trim());
    }
    
    // Alternative pattern: "Job Title at Company | LinkedIn" or just "Job Title | LinkedIn"
    if (!data.title || !data.company) {
      const altPattern = /^(.+?)\s+at\s+([^|]+)\s*\|/i;
      const altMatch = titleText.match(altPattern);
      if (altMatch) {
        if (!data.title) data.title = cleanHtml(altMatch[1].trim());
        if (!data.company) data.company = cleanHtml(altMatch[2].trim());
      } else if (!data.title) {
        // Just extract title before " | LinkedIn"
        const simpleTitle = titleText.split('|')[0].trim();
        data.title = cleanHtml(simpleTitle);
      }
    }
  }

  // Extract from page title tag as backup
  if (!data.title || !data.company || !data.location) {
    const pageTitleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (pageTitleMatch) {
      const titleText = pageTitleMatch[1];
      const titlePattern = /^([^|]+?)\s+hiring\s+(.+?)\s+in\s+(.+?)\s*\|/i;
      const match = titleText.match(titlePattern);
      if (match) {
        if (!data.company) data.company = cleanHtml(match[1].trim());
        if (!data.title) data.title = cleanHtml(match[2].trim());
        if (!data.location) data.location = cleanHtml(match[3].trim());
      }
    }
  }

  // Fallback to regex parsing from HTML body
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

// Parse Handshake job posting (joinhandshake.com)
async function parseHandshake(html, url) {
  const data = { url };

  // Check if page is behind login (common for Handshake)
  if (html.includes('<title>Sign In | Handshake</title>') || html.includes('login') && html.includes('csrf-token')) {
    console.warn('⚠️  Handshake job requires authentication - cannot scrape');
    data.importStatus = 'failed';
    data.importNotes = 'Handshake job postings require login and cannot be automatically imported. Please copy the details manually.';
    return data;
  }

  // Try JSON-LD first
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      const jobPosting = Array.isArray(jsonLd) ? jsonLd.find(j => j['@type'] === 'JobPosting') : (jsonLd['@type'] === 'JobPosting' ? jsonLd : null);
      if (jobPosting) {
        data.title = jobPosting.title || jobPosting.name || data.title;
        data.company = jobPosting.hiringOrganization?.name || data.company;
        data.location = jobPosting.jobLocation?.address?.addressLocality || jobPosting.jobLocation?.name || data.location;
        data.description = jobPosting.description || data.description;
      }
    } catch {}
  }

  // Fallback to meta tags and common classes
  if (!data.title) {
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    data.title = cleanHtml((ogTitle && ogTitle[1]) || (h1 && h1[1]) || null);
  }
  if (!data.company) {
    const comp = html.match(/"hiringOrganization"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i) ||
                 html.match(/data-testid=["']employer-name["'][^>]*>(.*?)<\/[^>]+>/i);
    data.company = cleanHtml(comp && (comp[1] || comp[0]));
  }
  if (!data.location) {
    const loc = html.match(/data-testid=["']job-location["'][^>]*>(.*?)<\/[^>]+>/i) ||
                html.match(/"jobLocation"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i);
    data.location = cleanHtml(loc && (loc[1] || loc[0]));
  }
  if (!data.description) {
    const desc = html.match(/<div[^>]*class=["'][^"']*description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                 html.match(/<section[^>]*id=["']job-description["'][^>]*>([\s\S]*?)<\/section>/i);
    data.description = cleanHtml(desc && (desc[1] || desc[0]));
  }

  return data;
}

// Parse Indeed job posting
async function parseIndeed(html, url) {
  const data = { url };

  // Extract JSON-LD (Indeed uses this for job data)
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      if (jsonLd['@type'] === 'JobPosting') {
        data.title = jsonLd.title || jsonLd.name;
        data.company = jsonLd.hiringOrganization?.name;
        data.location = jsonLd.jobLocation?.address?.addressLocality || jsonLd.jobLocation?.name;
        data.description = jsonLd.description;
      }
    } catch (e) {}
  }

  // Extract from meta tags (fallback)
  if (!data.title) {
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (ogTitle) data.title = cleanHtml(ogTitle[1]);
  }
  
  if (!data.description) {
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (ogDesc) data.description = cleanHtml(ogDesc[1]);
  }

  // Fallback to HTML parsing with multiple selector patterns
  if (!data.title) {
    const titleMatch = html.match(/<h1[^>]*class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>(.*?)<\/h1>/i) ||
                       html.match(/<h1[^>]*class="[^"]*icl-u-xs-mb--xs[^"]*"[^>]*>(.*?)<\/h1>/i) ||
                       html.match(/<span[^>]*title="([^"]+)"[^>]*class="[^"]*jobTitle[^"]*"/i);
    data.title = titleMatch ? cleanHtml(titleMatch[1]) : null;
  }

  if (!data.company) {
    const companyMatch = html.match(/<div[^>]*data-company-name="true"[^>]*>(.*?)<\/div>/is) ||
                         html.match(/<a[^>]*data-testid="company-name"[^>]*>(.*?)<\/a>/is) ||
                         html.match(/<a[^>]*class="[^"]*jobsearch-CompanyReview--primary[^"]*"[^>]*>(.*?)<\/a>/i) ||
                         html.match(/<span[^>]*class="[^"]*companyName[^"]*"[^>]*>(.*?)<\/span>/i);
    data.company = companyMatch ? cleanHtml(companyMatch[1]) : null;
  }

  if (!data.location) {
    const locationMatch = html.match(/<div[^>]*data-testid="job-location"[^>]*>(.*?)<\/div>/is) ||
                          html.match(/<div[^>]*class="[^"]*jobsearch-JobInfoHeader-subtitle[^"]*"[^>]*>.*?<div[^>]*>(.*?)<\/div>/is) ||
                          html.match(/<div[^>]*class="[^"]*companyLocation[^"]*"[^>]*>(.*?)<\/div>/i);
    data.location = locationMatch ? cleanHtml(locationMatch[1]) : null;
  }

  if (!data.description) {
    const descMatch = html.match(/<div[^>]*id="jobDescriptionText"[^>]*>(.*?)<\/div>/s) ||
                      html.match(/<div[^>]*class="[^"]*jobsearch-jobDescriptionText[^"]*"[^>]*>(.*?)<\/div>/s);
    data.description = descMatch ? cleanHtml(descMatch[1]) : null;
  }

  return data;
}

// Parse Greenhouse job posting (boards.greenhouse.io)
async function parseGreenhouse(html, url) {
  const data = { url };

  // JSON-LD first
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      const jobPosting = Array.isArray(jsonLd) ? jsonLd.find(j => j['@type'] === 'JobPosting') : (jsonLd['@type'] === 'JobPosting' ? jsonLd : null);
      if (jobPosting) {
        data.title = jobPosting.title || jobPosting.name || data.title;
        data.company = jobPosting.hiringOrganization?.name || data.company;
        data.location = jobPosting.jobLocation?.address?.addressLocality || jobPosting.jobLocation?.name || data.location;
        data.description = jobPosting.description || data.description;
      }
    } catch {}
  }

  if (!data.title) {
    const h1 = html.match(/<h1[^>]*class=["'][^"']*(app-title|opening)[^"']*["'][^>]*>(.*?)<\/h1>/i) || html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    data.title = cleanHtml(h1 && (h1[2] || h1[1]));
  }
  if (!data.company) {
    const comp = html.match(/"hiringOrganization"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i) ||
                 html.match(/<a[^>]*class=["'][^"']*company[^"']*["'][^>]*>(.*?)<\/a>/i);
    data.company = cleanHtml(comp && (comp[1] || comp[0]));
  }
  if (!data.location) {
    const loc = html.match(/<div[^>]*class=["'][^"']*location[^"']*["'][^>]*>(.*?)<\/div>/i);
    data.location = cleanHtml(loc && loc[1]);
  }
  if (!data.description) {
    const desc = html.match(/<div[^>]*id=["']content["'][^>]*>([\s\S]*?)<\/div>/i) ||
                 html.match(/<div[^>]*class=["'][^"']*opening[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    data.description = cleanHtml(desc && (desc[1] || desc[0]));
  }

  return data;
}

// Parse Lever job posting (jobs.lever.co)
async function parseLever(html, url) {
  const data = { url };

  // Lever often includes meta og:title like: "Role - Company - Lever"
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (ogTitle && ogTitle[1]) {
    const parts = ogTitle[1].split(' - ');
    if (parts.length >= 2) {
      data.title = parts[0];
      data.company = parts[1];
    }
  }

  // JSON in script id="data"
  if (!data.title || !data.description) {
    const dataScript = html.match(/<script[^>]*id=["']data["'][^>]*>([\s\S]*?)<\/script>/i);
    if (dataScript) {
      try {
        const json = JSON.parse(dataScript[1]);
        data.title = json?.title || data.title;
        data.company = json?.company?.name || data.company;
        data.location = json?.categories?.location || data.location;
        data.description = json?.descriptionPlain || json?.description || data.description;
      } catch {}
    }
  }

  if (!data.description) {
    const desc = html.match(/<div[^>]*id=["']jobdesc["'][^>]*>([\s\S]*?)<\/div>/i);
    data.description = cleanHtml(desc && desc[1]);
  }

  return data;
}

// Parse Workday job posting (myworkdayjobs.com)
async function parseWorkday(html, url) {
  const data = { url };

  // JSON-LD first (if present)
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      const jobPosting = Array.isArray(jsonLd) ? jsonLd.find(j => j['@type'] === 'JobPosting') : (jsonLd['@type'] === 'JobPosting' ? jsonLd : null);
      if (jobPosting) {
        data.title = jobPosting.title || jobPosting.name || data.title;
        data.company = jobPosting.hiringOrganization?.name || data.company;
        data.location = jobPosting.jobLocation?.address?.addressLocality || jobPosting.jobLocation?.name || data.location;
        data.description = jobPosting.description || data.description;
      }
    } catch {}
  }

  // Fallback to meta
  if (!data.title) {
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const title = html.match(/<title>(.*?)<\/title>/i);
    data.title = cleanHtml((ogTitle && ogTitle[1]) || (title && title[1]) || null);
  }
  if (!data.description) {
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                   html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    data.description = cleanHtml(ogDesc && ogDesc[1]);
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

// Clean HTML tags and decode entities (handles double-encoding)
function cleanHtml(text) {
  if (!text) return null;
  let cleaned = text
    .replace(/<[^>]+>/g, ' '); // Remove HTML tags
  
  // Decode HTML entities multiple times to handle double/triple encoding
  let prev;
  let iterations = 0;
  do {
    prev = cleaned;
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'");
    iterations++;
  } while (cleaned !== prev && iterations < 5); // Max 5 iterations to prevent infinite loops
  
  return cleaned
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000); // Limit length
}

// Normalize and enrich with confidences, salary, jobType, workMode, requirements, benefits
function augmentAndNormalize(html, hostname, data) {
  const extractionInfo = {};

  const record = (field, value, confidence, source, reason) => {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) return;
    data[field] = value;
    extractionInfo[field] = { confidence, source, reason };
  };

  // Try JSON-LD to boost confidence for core fields
  try {
    const jsonld = parseJsonLdJobPosting(html);
    if (jsonld) {
      if (!data.title) record('title', jsonld.title || jsonld.name, 0.9, 'jsonld', 'JobPosting.title');
      else record('title', data.title, (extractionInfo.title?.confidence || 0.7), extractionInfo.title?.source || 'parser', extractionInfo.title?.reason || 'Parsed title');
      if (!data.company) record('company', jsonld.hiringOrganization?.name, 0.9, 'jsonld', 'Hiring organization name');
      if (!data.location) {
        const loc = jsonld.jobLocation?.address?.addressLocality || jsonld.jobLocation?.name;
        if (loc) record('location', loc, 0.8, 'jsonld', 'Job location');
      }
      if (!data.description && jsonld.description) record('description', cleanHtml(jsonld.description), 0.8, 'jsonld', 'Structured description');
      // Salary
      const baseSalary = jsonld.baseSalary?.value?.value || jsonld.baseSalary?.value;
      const currency = jsonld.baseSalary?.currency || jsonld.currency;
      if (baseSalary) {
        const sal = { min: Number(baseSalary) || undefined, max: undefined, currency: currency || 'USD' };
        record('salary', sal, 0.7, 'jsonld', 'Base salary');
      }
      // Work mode via remote
      const descTxt = (jsonld.description && cleanHtml(jsonld.description)) || '';
      const wm = detectWorkModeFromText(descTxt);
      if (wm?.workMode && !data.workMode) record('workMode', wm.workMode, wm.confidence, 'text', wm.reason);
    }
  } catch {}

  // If core fields exist but without extraction info, assign default confidence
  if (data.title && !extractionInfo.title) record('title', data.title, 0.6, hostname, 'Parsed from page');
  if (data.company && !extractionInfo.company) record('company', data.company, 0.6, hostname, 'Parsed from page');
  if (data.location && !extractionInfo.location) record('location', data.location, 0.5, hostname, 'Parsed from page');
  if (data.description && !extractionInfo.description) record('description', data.description, 0.5, hostname, 'Parsed from page');

  // Extract salary from page text if missing or incomplete
  const text = cleanHtml(html) || '';
  if (!data.salary || (!data.salary.min && !data.salary.max)) {
    const sal = extractSalaryFromText(text);
    if (sal) record('salary', sal, sal.confidence || 0.6, sal.source || 'regex', sal.reason || 'Detected salary range');
  }

  // Job type - prioritize title, then full text
  if (!data.jobType) {
    // Check title first (higher confidence)
    const titleJobType = data.title ? extractJobTypeFromText(data.title) : null;
    if (titleJobType?.value) {
      record('jobType', titleJobType.value, 0.9, 'title', 'Job type found in title');
    } else {
      // Fallback to full text
      const jt = extractJobTypeFromText(text);
      if (jt?.value) record('jobType', jt.value, jt.confidence, jt.source, jt.reason);
    }
  }

  // Work mode (Remote/Hybrid/On-site)
  if (!data.workMode) {
    const wm = detectWorkModeFromText(text);
    if (wm?.workMode) record('workMode', wm.workMode, wm.confidence, wm.source || 'text', wm.reason);
  }

  // Requirements & Benefits from description section (prefer description if present)
  const descForLists = data.description || html;
  const reqs = extractListFromSection(descForLists, /(requirements|qualifications|what you will|you will)/i);
  if (reqs?.length) record('requirements', reqs, 0.6, 'section', 'Requirements list detected');
  const bens = extractListFromSection(descForLists, /(benefits|perks|what we offer)/i);
  if (bens?.length) record('benefits', bens, 0.5, 'section', 'Benefits/perks list detected');

  // Append extracted lists into description field for a single consolidated field in the UI
  try {
    const lower = (data.description || '').toLowerCase();
    const hasSectionsAlready = /requirements:|benefits:/i.test(lower);
    const parts = [];
    if (reqs?.length) {
      const reqText = 'Requirements:\n' + reqs.map(r => `- ${r}`).join('\n');
      parts.push(reqText);
    }
    if (bens?.length) {
      const benText = 'Benefits:\n' + bens.map(b => `- ${b}`).join('\n');
      parts.push(benText);
    }
    if (parts.length) {
      const combined = parts.join('\n\n');
      const base = data.description ? data.description.trim() : '';
      // Avoid duplicate append if sections already present
      if (!hasSectionsAlready) {
        const merged = base ? `${base}\n\n${combined}` : combined;
        record('description', merged, Math.max(extractionInfo.description?.confidence || 0.6, 0.7), 'merge', 'Appended requirements/benefits into description');
      }
    }
  } catch {}

  data.extractionInfo = extractionInfo;
  return data;
}

function parseJsonLdJobPosting(html) {
  const matches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of matches) {
    try {
      const json = JSON.parse(m[1]);
      if (Array.isArray(json)) {
        const jp = json.find(x => x && x['@type'] === 'JobPosting');
        if (jp) return jp;
      } else if (json && json['@type'] === 'JobPosting') {
        return json;
      }
    } catch {}
  }
  return null;
}

function extractSalaryFromText(text) {
  if (!text) return null;
  // Common patterns: $120,000 - $150,000 ; $60k–$80k ; £50,000–£60,000 ; 100k-130k USD
  const currencyMap = { '$': 'USD', '£': 'GBP', '€': 'EUR', 'C$': 'CAD', 'A$': 'AUD' };
  const rangeRe = /([£$€]|(?:C\$|A\$))?\s?(\d{1,3}(?:[,\.]\d{3})*(?:\.\d+)?|\d+\s?[kK])\s?(?:-|–|to|—)\s?([£$€]|(?:C\$|A\$))?\s?(\d{1,3}(?:[,\.]\d{3})*(?:\.\d+)?|\d+\s?[kK])\s*(USD|GBP|EUR|CAD|AUD)?/;
  const singleRe = /([£$€]|(?:C\$|A\$))\s?(\d{1,3}(?:[,\.]\d{3})*(?:\.\d+)?|\d+\s?[kK])\s*(USD|GBP|EUR|CAD|AUD)?/;

  const toNumber = (s) => {
    if (!s) return undefined;
    const v = String(s).replace(/[,]/g,'').trim();
    if (/k$/i.test(v)) return Number(v.replace(/k/i,'')) * 1000;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  };

  const m1 = text.match(rangeRe);
  if (m1) {
    const cur = (m1[1] && currencyMap[m1[1]]) || (m1[3] && currencyMap[m1[3]]) || m1[5] || 'USD';
    const min = toNumber(m1[2]);
    const max = toNumber(m1[4]);
    if (min || max) return { min, max, currency: cur, confidence: 0.7, source: 'regex', reason: 'Detected salary range in text' };
  }
  const m2 = text.match(singleRe);
  if (m2) {
    const cur = (m2[1] && currencyMap[m2[1]]) || m2[3] || 'USD';
    const val = toNumber(m2[2]);
    if (val) return { min: val, max: undefined, currency: cur, confidence: 0.6, source: 'regex', reason: 'Detected single salary value' };
  }
  return null;
}

function extractJobTypeFromText(text) {
  if (!text) return null;
  const pairs = [
    { re: /full[-\s]?time/i, value: 'Full-time' },
    { re: /part[-\s]?time/i, value: 'Part-time' },
    { re: /contract/i, value: 'Contract' },
    { re: /intern(ship)?/i, value: 'Internship' },
    { re: /temporary|temp\b/i, value: 'Temporary' },
  ];
  for (const p of pairs) {
    if (p.re.test(text)) return { value: p.value, confidence: 0.6, source: 'text', reason: 'Matched job type phrase' };
  }
  return null;
}

function detectWorkModeFromText(text) {
  if (!text) return null;
  if (/\bremote\b/i.test(text)) return { workMode: 'Remote', confidence: 0.7, source: 'text', reason: 'Contains "remote"' };
  if (/hybrid/i.test(text)) return { workMode: 'Hybrid', confidence: 0.6, source: 'text', reason: 'Contains "hybrid"' };
  if (/(on[-\s]?site|onsite)/i.test(text)) return { workMode: 'On-site', confidence: 0.6, source: 'text', reason: 'Contains "on-site"' };
  return null;
}

function extractListFromSection(htmlOrText, sectionRegex) {
  if (!htmlOrText) return [];
  // Try to find a heading with section name and then list items following
  const html = htmlOrText;
  const headingRe = new RegExp(`<h[1-6][^>]*>\\s*${sectionRegex.source}\\s*<\\/h[1-6]>`, 'i');
  const sectMatch = html.match(headingRe);
  if (sectMatch) {
    const after = html.slice(sectMatch.index + sectMatch[0].length);
    const list = parseListItemsFromHtml(after);
    if (list.length) return list;
  }
  // Fallback: scan for bullet-like lines in text
  const text = cleanHtml(htmlOrText);
  const lines = (text || '').split(/\n|\r|•/).map(s => s.trim()).filter(Boolean);
  const candidates = lines.filter(l => /^[-*\u2022]\s+/.test(l) || /\b(Required|Preferred|Benefits|Perks):/i.test(l));
  if (candidates.length >= 2) return candidates.map(c => c.replace(/^[-*\u2022]\s+/, ''));
  return [];
}

function parseListItemsFromHtml(html) {
  const matches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  const items = matches.map(m => cleanHtml(m[1])).filter(Boolean);
  return items.slice(0, 25);
}

