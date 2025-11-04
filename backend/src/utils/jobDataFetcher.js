import { Job } from "../models/Job.js";

/**
 * Fetch job data and enrich it by scraping URL if needed
 * This ensures AI features have comprehensive job information
 */
export const fetchEnrichedJobData = async (jobId, userId) => {
  if (!jobId) {
    return null;
  }

  // Fetch job from database
  const job = await Job.findOne({ _id: jobId, userId }).lean();
  if (!job) {
    return null;
  }

  // Check if job data is incomplete and has a URL to scrape
  const isIncomplete = !job.description || 
                       !job.requirements || 
                       job.requirements.length === 0;
  
  if (isIncomplete && job.url) {
    console.log(`Job ${jobId} has incomplete data, attempting to enrich from URL: ${job.url}`);
    
    try {
      // Dynamically import fetch
      const fetch = (await import('node-fetch')).default;
      
      // Fetch the page
      const response = await fetch(job.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.ok) {
        const html = await response.text();
        
        // Try to extract job description and requirements using common patterns
        const enrichedData = extractJobDataFromHtml(html, job.url);
        
        // Merge enriched data with existing job data (don't overwrite existing fields)
        if (enrichedData.description && !job.description) {
          job.description = enrichedData.description;
        }
        
        if (enrichedData.requirements && enrichedData.requirements.length > 0 && 
            (!job.requirements || job.requirements.length === 0)) {
          job.requirements = enrichedData.requirements;
        }
        
        console.log(`Successfully enriched job ${jobId} from URL`);
      }
    } catch (error) {
      console.warn(`Failed to enrich job ${jobId} from URL:`, error.message);
      // Continue with existing data - enrichment is optional
    }
  }

  // Build comprehensive job posting object for AI
  return {
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description || '',
    requirements: job.requirements || [],
    jobType: job.jobType,
    industry: job.industry,
    workMode: job.workMode,
    url: job.url,
    // Additional context
    salary: job.salary,
    deadline: job.deadline,
    tags: job.tags || []
  };
};

/**
 * Extract job data from HTML using common patterns
 */
function extractJobDataFromHtml(html, url) {
  const data = {
    description: null,
    requirements: []
  };

  // Clean HTML helper
  const cleanHtml = (text) => {
    if (!text) return null;
    return text
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000);
  };

  // Try JSON-LD structured data first (most reliable)
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      let jobPosting = null;
      
      if (Array.isArray(jsonLd)) {
        jobPosting = jsonLd.find(item => item['@type'] === 'JobPosting');
      } else if (jsonLd['@type'] === 'JobPosting') {
        jobPosting = jsonLd;
      }
      
      if (jobPosting) {
        data.description = cleanHtml(jobPosting.description);
        
        // Extract requirements if available
        if (jobPosting.skills) {
          data.requirements = Array.isArray(jobPosting.skills) 
            ? jobPosting.skills 
            : [jobPosting.skills];
        }
        if (jobPosting.qualifications) {
          const quals = Array.isArray(jobPosting.qualifications)
            ? jobPosting.qualifications
            : [jobPosting.qualifications];
          data.requirements = [...data.requirements, ...quals];
        }
      }
    } catch (e) {
      // Continue with regex parsing
    }
  }

  // Fallback: Try to find description in common HTML patterns
  if (!data.description) {
    const descPatterns = [
      /<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>(.*?)<\/div>/s, // LinkedIn
      /<div[^>]*id="jobDescriptionText"[^>]*>(.*?)<\/div>/s, // Indeed
      /<div[^>]*class="[^"]*jobDescriptionContent[^"]*"[^>]*>(.*?)<\/div>/s, // Glassdoor
      /<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/s, // Generic
      /<section[^>]*id="[^"]*description[^"]*"[^>]*>(.*?)<\/section>/s, // Generic
    ];

    for (const pattern of descPatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].length > 100) {
        data.description = cleanHtml(match[1]);
        break;
      }
    }
  }

  // Try to extract requirements/qualifications
  if (data.requirements.length === 0) {
    const requirementsPatterns = [
      /<ul[^>]*class="[^"]*qualifications[^"]*"[^>]*>(.*?)<\/ul>/s,
      /<ul[^>]*class="[^"]*requirements[^"]*"[^>]*>(.*?)<\/ul>/s,
      /<div[^>]*class="[^"]*requirements[^"]*"[^>]*>(.*?)<\/div>/s
    ];

    for (const pattern of requirementsPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        // Extract list items
        const liMatches = match[1].matchAll(/<li[^>]*>(.*?)<\/li>/gs);
        for (const liMatch of liMatches) {
          const req = cleanHtml(liMatch[1]);
          if (req && req.length > 10 && req.length < 500) {
            data.requirements.push(req);
          }
        }
        if (data.requirements.length > 0) break;
      }
    }
  }

  // If still no requirements but we have a description, try to extract from description
  if (data.requirements.length === 0 && data.description) {
    const reqSection = data.description.match(/(?:requirements?|qualifications?|skills?)[:\s]+(.*?)(?:\n\n|\.|$)/is);
    if (reqSection && reqSection[1]) {
      // Split by common delimiters
      const items = reqSection[1]
        .split(/[•\n-]/)
        .map(item => item.trim())
        .filter(item => item.length > 10 && item.length < 500);
      data.requirements = items.slice(0, 15); // Limit to 15 requirements
    }
  }

  return data;
}
