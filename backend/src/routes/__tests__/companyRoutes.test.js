import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controllers
const mockGetCompanyInfo = jest.fn((req, res) => res.json({ success: true, company: {} }));
const mockGetCompanyNews = jest.fn((req, res) => res.json({ success: true, news: [] }));
const mockExportNewsSummary = jest.fn((req, res) => res.json({ success: true, summary: '' }));

jest.unstable_mockModule('../../controllers/companyController.js', () => ({
  getCompanyInfo: mockGetCompanyInfo,
  getCompanyNews: mockGetCompanyNews,
  exportNewsSummary: mockExportNewsSummary,
}));

describe('companyRoutes', () => {
  let app;
  let companyRoutes;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    const routesModule = await import('../../routes/companyRoutes.js');
    companyRoutes = routesModule.default;
    app.use('/api/companies', companyRoutes);
  });

  describe('GET /api/companies/info', () => {
    it('should call getCompanyInfo controller', async () => {
      const response = await request(app).get('/api/companies/info?name=Google');
      expect(response.status).toBe(200);
      expect(mockGetCompanyInfo).toHaveBeenCalled();
    });

    it('should allow unauthenticated access', async () => {
      const response = await request(app).get('/api/companies/info?name=Microsoft');
      expect(response.status).toBe(200);
    });

    it('should pass query parameters to controller', async () => {
      await request(app).get('/api/companies/info?name=Apple&industry=Technology');
      expect(mockGetCompanyInfo).toHaveBeenCalled();
      const callArgs = mockGetCompanyInfo.mock.calls[0];
      expect(callArgs[0].query.name).toBe('Apple');
      expect(callArgs[0].query.industry).toBe('Technology');
    });
  });

  describe('GET /api/companies/news', () => {
    it('should call getCompanyNews controller', async () => {
      const response = await request(app).get('/api/companies/news?companyId=123');
      expect(response.status).toBe(200);
      expect(mockGetCompanyNews).toHaveBeenCalled();
    });

    it('should allow unauthenticated access', async () => {
      const response = await request(app).get('/api/companies/news?companyId=456');
      expect(response.status).toBe(200);
    });

    it('should handle missing companyId parameter', async () => {
      const response = await request(app).get('/api/companies/news');
      expect(response.status).toBe(200);
      expect(mockGetCompanyNews).toHaveBeenCalled();
    });
  });

  describe('GET /api/companies/news/export', () => {
    it('should call exportNewsSummary controller', async () => {
      const response = await request(app).get('/api/companies/news/export?companyId=123&format=pdf');
      expect(response.status).toBe(200);
      expect(mockExportNewsSummary).toHaveBeenCalled();
    });

    it('should allow unauthenticated access', async () => {
      const response = await request(app).get('/api/companies/news/export?companyId=789');
      expect(response.status).toBe(200);
    });

    it('should pass format parameter to controller', async () => {
      await request(app).get('/api/companies/news/export?companyId=999&format=csv');
      expect(mockExportNewsSummary).toHaveBeenCalled();
      const callArgs = mockExportNewsSummary.mock.calls[0];
      expect(callArgs[0].query.format).toBe('csv');
    });
  });

  describe('Route structure', () => {
    it('should have correct route endpoints', async () => {
      expect(mockGetCompanyInfo).toBeDefined();
      expect(mockGetCompanyNews).toBeDefined();
      expect(mockExportNewsSummary).toBeDefined();
    });

    it('should return json responses', async () => {
      const response = await request(app).get('/api/companies/info?name=Test');
      expect(response.type).toMatch(/json/);
    });
  });
});
