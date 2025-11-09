import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controllers
const mockListTemplates = jest.fn((req, res) => res.json({ success: true }));
const mockGetTemplateById = jest.fn((req, res) => res.json({ success: true }));
const mockCreateTemplate = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateTemplate = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteTemplate = jest.fn((req, res) => res.json({ success: true }));
const mockTrackTemplateUsage = jest.fn((req, res) => res.json({ success: true }));
const mockGetTemplateAnalytics = jest.fn((req, res) => res.json({ success: true }));
const mockImportTemplate = jest.fn((req, res) => res.json({ success: true }));
const mockShareTemplate = jest.fn((req, res) => res.json({ success: true }));
const mockExportTemplate = jest.fn((req, res) => res.json({ success: true }));
const mockGetIndustryGuidance = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/coverLetterTemplateController.js', () => ({
  listTemplates: mockListTemplates,
  getTemplateById: mockGetTemplateById,
  createTemplate: mockCreateTemplate,
  updateTemplate: mockUpdateTemplate,
  deleteTemplate: mockDeleteTemplate,
  trackTemplateUsage: mockTrackTemplateUsage,
  getTemplateAnalytics: mockGetTemplateAnalytics,
  importTemplate: mockImportTemplate,
  shareTemplate: mockShareTemplate,
  exportTemplate: mockExportTemplate,
  getIndustryGuidance: mockGetIndustryGuidance,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-id' };
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

describe('coverLetterTemplateRoutes', () => {
  let app;
  let coverLetterTemplateRoutes;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    const routesModule = await import('../../routes/coverLetterTemplateRoutes.js');
    coverLetterTemplateRoutes = routesModule.default;
    app.use('/api', coverLetterTemplateRoutes);
  });

  describe('GET /api/cover-letter-templates', () => {
    it('should call listTemplates controller', async () => {
      const response = await request(app).get('/api/cover-letter-templates');
      expect(response.status).toBe(200);
      expect(mockListTemplates).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/cover-letter-templates');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/cover-letter-templates/industry-guidance', () => {
    it('should call getIndustryGuidance controller', async () => {
      const response = await request(app).get('/api/cover-letter-templates/industry-guidance');
      expect(response.status).toBe(200);
      expect(mockGetIndustryGuidance).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/cover-letter-templates/industry-guidance');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/cover-letter-templates/analytics/stats', () => {
    it('should call getTemplateAnalytics controller', async () => {
      const response = await request(app).get('/api/cover-letter-templates/analytics/stats');
      expect(response.status).toBe(200);
      expect(mockGetTemplateAnalytics).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/cover-letter-templates/analytics/stats');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/cover-letter-templates/:id', () => {
    it('should call getTemplateById controller', async () => {
      const response = await request(app).get('/api/cover-letter-templates/template-123');
      expect(response.status).toBe(200);
      expect(mockGetTemplateById).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/cover-letter-templates/template-123');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/cover-letter-templates/:id/use', () => {
    it('should call trackTemplateUsage controller', async () => {
      const response = await request(app).post('/api/cover-letter-templates/template-123/use');
      expect(response.status).toBe(200);
      expect(mockTrackTemplateUsage).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/cover-letter-templates/template-123/use');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/cover-letter-templates', () => {
    it('should call createTemplate controller', async () => {
      const response = await request(app)
        .post('/api/cover-letter-templates')
        .send({ name: 'New Template' });
      expect(response.status).toBe(200);
      expect(mockCreateTemplate).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/cover-letter-templates').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/cover-letter-templates/:id', () => {
    it('should call updateTemplate controller', async () => {
      const response = await request(app)
        .put('/api/cover-letter-templates/template-123')
        .send({ name: 'Updated Template' });
      expect(response.status).toBe(200);
      expect(mockUpdateTemplate).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/cover-letter-templates/template-123').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/cover-letter-templates/:id', () => {
    it('should call deleteTemplate controller', async () => {
      const response = await request(app).delete('/api/cover-letter-templates/template-123');
      expect(response.status).toBe(200);
      expect(mockDeleteTemplate).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).delete('/api/cover-letter-templates/template-123');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/cover-letter-templates/import', () => {
    it('should call importTemplate controller', async () => {
      const response = await request(app)
        .post('/api/cover-letter-templates/import')
        .send({ templateData: {} });
      expect(response.status).toBe(200);
      expect(mockImportTemplate).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/cover-letter-templates/import').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/cover-letter-templates/:id/export', () => {
    it('should call exportTemplate controller', async () => {
      const response = await request(app).get('/api/cover-letter-templates/template-123/export');
      expect(response.status).toBe(200);
      expect(mockExportTemplate).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/cover-letter-templates/template-123/export');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/cover-letter-templates/:id/share', () => {
    it('should call shareTemplate controller', async () => {
      const response = await request(app)
        .put('/api/cover-letter-templates/template-123/share')
        .send({ shared: true });
      expect(response.status).toBe(200);
      expect(mockShareTemplate).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/cover-letter-templates/template-123/share').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });
});
