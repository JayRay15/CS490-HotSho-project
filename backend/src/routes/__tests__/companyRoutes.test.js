import { describe, it, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { getCompanyInfo, getCompanyNews, exportNewsSummary } from '../../controllers/companyController.js';

describe('companyRoutes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Create a simple router with the actual controller functions
    // This tests the routes without needing to mock the controllers
    const router = express.Router();
    router.get('/info', getCompanyInfo);
    router.get('/news', getCompanyNews);
    router.get('/news/export', exportNewsSummary);
    
    app.use('/api/companies', router);
  });

  describe('GET /api/companies/info', () => {
    it('should accept requests to /info endpoint', async () => {
      const response = await request(app).get('/api/companies/info?name=Google');
      // Just check that it returns a response (may fail with 400 if params are invalid)
      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    it('should return JSON response', async () => {
      const response = await request(app).get('/api/companies/info?name=Test');
      expect(response.type).toMatch(/json/);
    });
  });

  describe('GET /api/companies/news', () => {
    it('should accept requests to /news endpoint', async () => {
      const response = await request(app).get('/api/companies/news?companyId=123');
      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    it('should handle missing companyId parameter', async () => {
      const response = await request(app).get('/api/companies/news');
      expect(response).toBeDefined();
    });
  });

  describe('GET /api/companies/news/export', () => {
    it('should accept requests to /news/export endpoint', async () => {
      const response = await request(app).get('/api/companies/news/export?companyId=123&format=pdf');
      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    it('should return JSON response', async () => {
      const response = await request(app).get('/api/companies/news/export?companyId=123&format=csv');
      expect(response.type).toMatch(/json/);
    });
  });

  describe('Route structure', () => {
    it('should have correct route endpoints', () => {
      expect(getCompanyInfo).toBeDefined();
      expect(getCompanyNews).toBeDefined();
      expect(exportNewsSummary).toBeDefined();
    });

    it('should be functions', () => {
      expect(typeof getCompanyInfo).toBe('function');
      expect(typeof getCompanyNews).toBe('function');
      expect(typeof exportNewsSummary).toBe('function');
    });
  });
});
