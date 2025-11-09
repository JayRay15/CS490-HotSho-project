import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controllers
const mockGetJobs = jest.fn((req, res) => res.json({ success: true }));
const mockAddJob = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateJob = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateJobStatus = jest.fn((req, res) => res.json({ success: true }));
const mockBulkUpdateStatus = jest.fn((req, res) => res.json({ success: true }));
const mockBulkUpdateDeadline = jest.fn((req, res) => res.json({ success: true }));
const mockSendDeadlineReminders = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteJob = jest.fn((req, res) => res.json({ success: true }));
const mockGetJobStats = jest.fn((req, res) => res.json({ success: true }));
const mockGetJobAnalytics = jest.fn((req, res) => res.json({ success: true }));
const mockLinkResumeToJob = jest.fn((req, res) => res.json({ success: true }));
const mockArchiveJob = jest.fn((req, res) => res.json({ success: true }));
const mockRestoreJob = jest.fn((req, res) => res.json({ success: true }));
const mockBulkArchiveJobs = jest.fn((req, res) => res.json({ success: true }));
const mockBulkRestoreJobs = jest.fn((req, res) => res.json({ success: true }));
const mockAutoArchiveJobs = jest.fn((req, res) => res.json({ success: true }));
const mockScrapeJobFromURL = jest.fn((req, res) => res.json({ success: true }));
const mockGetInterviewInsights = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/jobController.js', () => ({
  getJobs: mockGetJobs,
  addJob: mockAddJob,
  updateJob: mockUpdateJob,
  updateJobStatus: mockUpdateJobStatus,
  bulkUpdateStatus: mockBulkUpdateStatus,
  bulkUpdateDeadline: mockBulkUpdateDeadline,
  sendDeadlineReminders: mockSendDeadlineReminders,
  deleteJob: mockDeleteJob,
  getJobStats: mockGetJobStats,
  getJobAnalytics: mockGetJobAnalytics,
  linkResumeToJob: mockLinkResumeToJob,
  archiveJob: mockArchiveJob,
  restoreJob: mockRestoreJob,
  bulkArchiveJobs: mockBulkArchiveJobs,
  bulkRestoreJobs: mockBulkRestoreJobs,
  autoArchiveJobs: mockAutoArchiveJobs,
}));

jest.unstable_mockModule('../../controllers/jobScraperController.js', () => ({
  scrapeJobFromURL: mockScrapeJobFromURL,
}));

jest.unstable_mockModule('../../controllers/interviewInsightsController.js', () => ({
  getInterviewInsights: mockGetInterviewInsights,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-id' };
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

describe('jobRoutes', () => {
  let app;
  let jobRoutes;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    const routesModule = await import('../../routes/jobRoutes.js');
    jobRoutes = routesModule.default;
    app.use('/api/jobs', jobRoutes);
  });

  describe('GET /api/jobs/stats', () => {
    it('should call getJobStats controller', async () => {
      const response = await request(app).get('/api/jobs/stats');
      expect(response.status).toBe(200);
      expect(mockGetJobStats).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/jobs/stats');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/jobs/analytics', () => {
    it('should call getJobAnalytics controller', async () => {
      const response = await request(app).get('/api/jobs/analytics');
      expect(response.status).toBe(200);
      expect(mockGetJobAnalytics).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/jobs/analytics');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/jobs', () => {
    it('should call getJobs controller', async () => {
      const response = await request(app).get('/api/jobs');
      expect(response.status).toBe(200);
      expect(mockGetJobs).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/jobs');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/jobs/scrape', () => {
    it('should call scrapeJobFromURL controller', async () => {
      const response = await request(app)
        .post('/api/jobs/scrape')
        .send({ url: 'https://example.com/job' });
      expect(response.status).toBe(200);
      expect(mockScrapeJobFromURL).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/jobs/scrape').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/jobs', () => {
    it('should call addJob controller', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({ title: 'Software Engineer', company: 'Test Co' });
      expect(response.status).toBe(200);
      expect(mockAddJob).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/jobs').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/jobs/bulk-update-status', () => {
    it('should call bulkUpdateStatus controller', async () => {
      const response = await request(app)
        .post('/api/jobs/bulk-update-status')
        .send({ jobIds: ['1', '2'], status: 'Applied' });
      expect(response.status).toBe(200);
      expect(mockBulkUpdateStatus).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/jobs/bulk-update-status').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/jobs/bulk-update-deadline', () => {
    it('should call bulkUpdateDeadline controller', async () => {
      const response = await request(app)
        .post('/api/jobs/bulk-update-deadline')
        .send({ jobIds: ['1', '2'], deadline: '2025-12-31' });
      expect(response.status).toBe(200);
      expect(mockBulkUpdateDeadline).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/jobs/bulk-update-deadline').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/jobs/send-deadline-reminders', () => {
    it('should call sendDeadlineReminders controller', async () => {
      const response = await request(app).post('/api/jobs/send-deadline-reminders');
      expect(response.status).toBe(200);
      expect(mockSendDeadlineReminders).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/jobs/send-deadline-reminders');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/jobs/bulk-archive', () => {
    it('should call bulkArchiveJobs controller', async () => {
      const response = await request(app)
        .post('/api/jobs/bulk-archive')
        .send({ jobIds: ['1', '2'] });
      expect(response.status).toBe(200);
      expect(mockBulkArchiveJobs).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/jobs/bulk-archive').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/jobs/bulk-restore', () => {
    it('should call bulkRestoreJobs controller', async () => {
      const response = await request(app)
        .post('/api/jobs/bulk-restore')
        .send({ jobIds: ['1', '2'] });
      expect(response.status).toBe(200);
      expect(mockBulkRestoreJobs).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/jobs/bulk-restore').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/jobs/auto-archive', () => {
    it('should call autoArchiveJobs controller', async () => {
      const response = await request(app).post('/api/jobs/auto-archive');
      expect(response.status).toBe(200);
      expect(mockAutoArchiveJobs).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/jobs/auto-archive');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/jobs/:jobId/archive', () => {
    it('should call archiveJob controller', async () => {
      const response = await request(app).post('/api/jobs/job-123/archive');
      expect(response.status).toBe(200);
      expect(mockArchiveJob).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/jobs/job-123/archive');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/jobs/:jobId/restore', () => {
    it('should call restoreJob controller', async () => {
      const response = await request(app).post('/api/jobs/job-123/restore');
      expect(response.status).toBe(200);
      expect(mockRestoreJob).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/jobs/job-123/restore');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/jobs/:jobId/interview-insights', () => {
    it('should call getInterviewInsights controller', async () => {
      const response = await request(app).get('/api/jobs/job-123/interview-insights');
      expect(response.status).toBe(200);
      expect(mockGetInterviewInsights).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/jobs/job-123/interview-insights');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/jobs/:jobId', () => {
    it('should call updateJob controller', async () => {
      const response = await request(app)
        .put('/api/jobs/job-123')
        .send({ title: 'Updated Title' });
      expect(response.status).toBe(200);
      expect(mockUpdateJob).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/jobs/job-123').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/jobs/:jobId/status', () => {
    it('should call updateJobStatus controller', async () => {
      const response = await request(app)
        .put('/api/jobs/job-123/status')
        .send({ status: 'Interview' });
      expect(response.status).toBe(200);
      expect(mockUpdateJobStatus).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/jobs/job-123/status').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/jobs/:jobId/link-resume', () => {
    it('should call linkResumeToJob controller', async () => {
      const response = await request(app)
        .put('/api/jobs/job-123/link-resume')
        .send({ resumeId: 'resume-456' });
      expect(response.status).toBe(200);
      expect(mockLinkResumeToJob).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/jobs/job-123/link-resume').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/jobs/:jobId', () => {
    it('should call deleteJob controller', async () => {
      const response = await request(app).delete('/api/jobs/job-123');
      expect(response.status).toBe(200);
      expect(mockDeleteJob).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).delete('/api/jobs/job-123');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });
});
