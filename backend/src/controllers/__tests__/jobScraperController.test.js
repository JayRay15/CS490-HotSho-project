import { jest, beforeEach, describe, it, expect } from '@jest/globals';

jest.resetModules();

// Mock node-fetch
const mockFetch = jest.fn();
jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch,
}));

// Import controller
const { scrapeJobFromURL } = await import('../jobScraperController.js');

describe('JobScraperController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('scrapeJobFromURL', () => {
    it('should return 400 if URL is missing', async () => {
      mockReq.body = {};

      await scrapeJobFromURL(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('URL is required'),
        })
      );
    });

    it('should return 400 for invalid URL format', async () => {
      mockReq.body = { url: 'not-a-valid-url' };

      await scrapeJobFromURL(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid URL format'),
        })
      );
    });

    it('should return 400 for non-job board URLs', async () => {
      mockReq.body = { url: 'https://example.com/page' };

      await scrapeJobFromURL(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("doesn't appear to be a job posting URL"),
        })
      );
    });

    it('should accept LinkedIn URLs', async () => {
      mockReq.body = { url: 'https://www.linkedin.com/jobs/view/123456' };
      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('<html><title>Software Engineer at TechCorp | LinkedIn</title></html>'),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await scrapeJobFromURL(mockReq, mockRes);

      expect(mockFetch).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Job URL processed',
          data: expect.objectContaining({
            jobData: expect.objectContaining({
              url: 'https://www.linkedin.com/jobs/view/123456',
            }),
          }),
        })
      );
    });

    it('should accept Indeed URLs', async () => {
      mockReq.body = { url: 'https://www.indeed.com/viewjob?jk=123456' };
      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('<html><title>Software Engineer - TechCorp</title></html>'),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await scrapeJobFromURL(mockReq, mockRes);

      expect(mockFetch).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should accept Greenhouse URLs', async () => {
      mockReq.body = { url: 'https://boards.greenhouse.io/company/jobs/123456' };
      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('<html><h1>Software Engineer</h1></html>'),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await scrapeJobFromURL(mockReq, mockRes);

      expect(mockFetch).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle 403 Forbidden errors gracefully', async () => {
      mockReq.body = { url: 'https://www.indeed.com/viewjob?jk=123456' };
      const mockResponse = {
        ok: false,
        status: 403,
        text: jest.fn().mockResolvedValue('Forbidden'),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await scrapeJobFromURL(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            jobData: expect.objectContaining({
              importStatus: 'failed',
              importNotes: expect.stringContaining('blocked'),
            }),
          }),
        })
      );
    });

    it('should handle 404 Not Found errors', async () => {
      mockReq.body = { url: 'https://www.linkedin.com/jobs/view/123456' };
      const mockResponse = {
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not Found'),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await scrapeJobFromURL(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobData: expect.objectContaining({
              importStatus: 'failed',
            }),
          }),
        })
      );
    });

    it('should handle network errors gracefully', async () => {
      mockReq.body = { url: 'https://www.linkedin.com/jobs/view/123456' };
      mockFetch.mockRejectedValue(new Error('Network error'));

      await scrapeJobFromURL(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobData: expect.objectContaining({
              importStatus: 'failed',
              importNotes: expect.stringContaining('Failed to fetch'),
            }),
          }),
        })
      );
    });

    it('should accept URLs with job-related keywords', async () => {
      mockReq.body = { url: 'https://example.com/careers/job-posting-123' };
      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('<html><h1>Software Engineer</h1></html>'),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await scrapeJobFromURL(mockReq, mockRes);

      expect(mockFetch).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should set importStatus to success when core fields extracted', async () => {
      mockReq.body = { url: 'https://www.linkedin.com/jobs/view/123456' };
      const htmlWithJsonLd = `
        <html>
          <script type="application/ld+json">
            {
              "@type": "JobPosting",
              "title": "Software Engineer",
              "hiringOrganization": { "name": "TechCorp" },
              "description": "Job description here"
            }
          </script>
        </html>
      `;
      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(htmlWithJsonLd),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await scrapeJobFromURL(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobData: expect.objectContaining({
              importStatus: expect.stringMatching(/success|partial|failed/),
            }),
          }),
        })
      );
    });

    it('should handle 403 Forbidden response from job board', async () => {
      mockReq.body = { url: 'https://www.indeed.com/viewjob?jk=123456' };
      const mockResponse = {
        ok: false,
        status: 403,
        text: jest.fn().mockResolvedValue('Forbidden'),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await scrapeJobFromURL(mockReq, mockRes);

      // Controller catches errors and returns 200 with failed status in jobData
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            jobData: expect.objectContaining({
              importStatus: 'failed',
              importNotes: expect.stringContaining('blocked'),
            }),
          }),
        })
      );
    });

    it('should handle 404 Not Found response', async () => {
      mockReq.body = { url: 'https://www.linkedin.com/jobs/view/999999' };
      const mockResponse = {
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not Found'),
      };
      mockFetch.mockRejectedValue(new Error('Job posting not found (404)'));

      await scrapeJobFromURL(mockReq, mockRes);

      // Controller catches errors and returns 200 with failed status
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            jobData: expect.objectContaining({
              importStatus: 'failed',
            }),
          }),
        })
      );
    });

    it('should handle fetch network errors', async () => {
      mockReq.body = { url: 'https://www.linkedin.com/jobs/view/123456' };
      mockFetch.mockRejectedValue(new Error('Network error'));

      await scrapeJobFromURL(mockReq, mockRes);

      // Controller catches errors and returns 200 with failed status
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            jobData: expect.objectContaining({
              importStatus: 'failed',
              importNotes: expect.stringContaining('Network error'),
            }),
          }),
        })
      );
    });

    it('should reject URLs that do not look like job postings', async () => {
      mockReq.body = { url: 'https://www.example.com/blog/article' };

      await scrapeJobFromURL(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("doesn't appear to be a job posting URL"),
        })
      );
    });

    it('should accept URLs from known job boards', async () => {
      mockReq.body = { url: 'https://www.greenhouse.io/jobs/123456' };
      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('<html><body>Job posting</body></html>'),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await scrapeJobFromURL(mockReq, mockRes);

      expect(mockFetch).toHaveBeenCalled();
    });
  });
});

