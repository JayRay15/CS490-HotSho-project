import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controllers
const mockGetInterviews = jest.fn((req, res) => res.json({ success: true }));
const mockGetInterview = jest.fn((req, res) => res.json({ success: true }));
const mockScheduleInterview = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateInterview = jest.fn((req, res) => res.json({ success: true }));
const mockRescheduleInterview = jest.fn((req, res) => res.json({ success: true }));
const mockCancelInterview = jest.fn((req, res) => res.json({ success: true }));
const mockRecordOutcome = jest.fn((req, res) => res.json({ success: true }));
const mockConfirmInterview = jest.fn((req, res) => res.json({ success: true }));
const mockUpdatePreparationTask = jest.fn((req, res) => res.json({ success: true }));
const mockAddPreparationTask = jest.fn((req, res) => res.json({ success: true }));
const mockDeletePreparationTask = jest.fn((req, res) => res.json({ success: true }));
const mockGeneratePreparationTasks = jest.fn((req, res) => res.json({ success: true }));
const mockGetUpcomingInterviews = jest.fn((req, res) => res.json({ success: true }));
const mockCheckConflicts = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteInterview = jest.fn((req, res) => res.json({ success: true }));
const mockDownloadInterviewICS = jest.fn((req, res) => res.json({ success: true }));
const mockSyncToCalendar = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/interviewController.js', () => ({
  getInterviews: mockGetInterviews,
  getInterview: mockGetInterview,
  scheduleInterview: mockScheduleInterview,
  updateInterview: mockUpdateInterview,
  rescheduleInterview: mockRescheduleInterview,
  cancelInterview: mockCancelInterview,
  recordOutcome: mockRecordOutcome,
  confirmInterview: mockConfirmInterview,
  updatePreparationTask: mockUpdatePreparationTask,
  addPreparationTask: mockAddPreparationTask,
  deletePreparationTask: mockDeletePreparationTask,
  generatePreparationTasks: mockGeneratePreparationTasks,
  getUpcomingInterviews: mockGetUpcomingInterviews,
  checkConflicts: mockCheckConflicts,
  deleteInterview: mockDeleteInterview,
  downloadInterviewICS: mockDownloadInterviewICS,
  syncToCalendar: mockSyncToCalendar,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-id' };
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

describe('interviewRoutes', () => {
  let app;
  let interviewRoutes;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());

    const routesModule = await import('../../routes/interviewRoutes.js');
    interviewRoutes = routesModule.default;
    app.use('/api/interviews', interviewRoutes);
  });

  describe('GET /api/interviews/upcoming', () => {
    it('should call getUpcomingInterviews controller', async () => {
      const response = await request(app).get('/api/interviews/upcoming');
      expect(response.status).toBe(200);
      expect(mockGetUpcomingInterviews).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/interviews/upcoming');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/interviews/conflicts', () => {
    it('should call checkConflicts controller', async () => {
      const response = await request(app).get('/api/interviews/conflicts');
      expect(response.status).toBe(200);
      expect(mockCheckConflicts).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/interviews/conflicts');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/interviews', () => {
    it('should call getInterviews controller', async () => {
      const response = await request(app).get('/api/interviews');
      expect(response.status).toBe(200);
      expect(mockGetInterviews).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/interviews');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/interviews/:interviewId', () => {
    it('should call getInterview controller', async () => {
      const response = await request(app).get('/api/interviews/interview-123');
      expect(response.status).toBe(200);
      expect(mockGetInterview).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/interviews/interview-123');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/interviews', () => {
    it('should call scheduleInterview controller', async () => {
      const response = await request(app)
        .post('/api/interviews')
        .send({ date: '2025-01-01', company: 'Test Co' });
      expect(response.status).toBe(200);
      expect(mockScheduleInterview).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/interviews').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/interviews/:interviewId', () => {
    it('should call updateInterview controller', async () => {
      const response = await request(app)
        .put('/api/interviews/interview-123')
        .send({ notes: 'Updated notes' });
      expect(response.status).toBe(200);
      expect(mockUpdateInterview).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/interviews/interview-123').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/interviews/:interviewId/reschedule', () => {
    it('should call rescheduleInterview controller', async () => {
      const response = await request(app)
        .put('/api/interviews/interview-123/reschedule')
        .send({ newDate: '2025-01-15' });
      expect(response.status).toBe(200);
      expect(mockRescheduleInterview).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/interviews/interview-123/reschedule').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/interviews/:interviewId/cancel', () => {
    it('should call cancelInterview controller', async () => {
      const response = await request(app).put('/api/interviews/interview-123/cancel');
      expect(response.status).toBe(200);
      expect(mockCancelInterview).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/interviews/interview-123/cancel');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/interviews/:interviewId/confirm', () => {
    it('should call confirmInterview controller', async () => {
      const response = await request(app).put('/api/interviews/interview-123/confirm');
      expect(response.status).toBe(200);
      expect(mockConfirmInterview).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/interviews/interview-123/confirm');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/interviews/:interviewId/outcome', () => {
    it('should call recordOutcome controller', async () => {
      const response = await request(app)
        .put('/api/interviews/interview-123/outcome')
        .send({ outcome: 'passed' });
      expect(response.status).toBe(200);
      expect(mockRecordOutcome).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/interviews/interview-123/outcome').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/interviews/:interviewId/generate-tasks', () => {
    it('should call generatePreparationTasks controller', async () => {
      const response = await request(app).post('/api/interviews/interview-123/generate-tasks');
      expect(response.status).toBe(200);
      expect(mockGeneratePreparationTasks).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/interviews/interview-123/generate-tasks');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/interviews/:interviewId/tasks', () => {
    it('should call addPreparationTask controller', async () => {
      const response = await request(app)
        .post('/api/interviews/interview-123/tasks')
        .send({ task: 'Research company' });
      expect(response.status).toBe(200);
      expect(mockAddPreparationTask).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/interviews/interview-123/tasks').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/interviews/:interviewId/tasks/:taskId', () => {
    it('should call updatePreparationTask controller', async () => {
      const response = await request(app)
        .put('/api/interviews/interview-123/tasks/task-456')
        .send({ completed: true });
      expect(response.status).toBe(200);
      expect(mockUpdatePreparationTask).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/interviews/interview-123/tasks/task-456').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/interviews/:interviewId/tasks/:taskId', () => {
    it('should call deletePreparationTask controller', async () => {
      const response = await request(app).delete('/api/interviews/interview-123/tasks/task-456');
      expect(response.status).toBe(200);
      expect(mockDeletePreparationTask).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).delete('/api/interviews/interview-123/tasks/task-456');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/interviews/:interviewId', () => {
    it('should call deleteInterview controller', async () => {
      const response = await request(app).delete('/api/interviews/interview-123');
      expect(response.status).toBe(200);
      expect(mockDeleteInterview).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).delete('/api/interviews/interview-123');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });
});
