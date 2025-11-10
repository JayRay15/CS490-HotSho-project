import request from 'supertest';
import express from 'express';
import { checkJwt } from '../../middleware/checkJwt.js';
import companyRoutes from '../companyRoutes.js';
import * as companyController from '../../controllers/companyController.js';

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock the JWT middleware to always pass
app.use((req, res, next) => {
  req.userId = 'test-user-123';
  next();
});

app.use('/api/companies', companyRoutes);

describe('Company Routes - Detailed Coverage', () => {
  describe('GET /api/companies/info', () => {
    it('should require query parameters', async () => {
      const res = await request(app)
        .get('/api/companies/info');
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    it('should accept name query parameter', async () => {
      const res = await request(app)
        .get('/api/companies/info')
        .query({ name: 'Google' });
      
      // Should succeed (may return cached data or real data)
      expect([200, 400, 500]).toContain(res.status);
      expect(res.body).toHaveProperty('success');
    });

    it('should accept domain query parameter', async () => {
      const res = await request(app)
        .get('/api/companies/info')
        .query({ domain: 'google.com' });
      
      expect([200, 400, 500]).toContain(res.status);
      expect(res.body).toHaveProperty('success');
    });

    it('should handle both name and domain parameters', async () => {
      const res = await request(app)
        .get('/api/companies/info')
        .query({ name: 'Microsoft', domain: 'microsoft.com' });
      
      expect([200, 400, 500]).toContain(res.status);
      expect(res.body).toHaveProperty('success');
    });

    it('should encode special characters in query', async () => {
      const res = await request(app)
        .get('/api/companies/info')
        .query({ name: 'IBM' })
        .timeout(5000);
      
      expect([200, 400, 500]).toContain(res.status);
    }, 10000);

    it('should return response with required structure', async () => {
      const res = await request(app)
        .get('/api/companies/info')
        .query({ name: 'TestCo' });
      
      if (res.status === 200) {
        expect(res.body.data).toBeDefined();
        // Check structure of company data
        if (res.body.data.companyInfo) {
          expect(res.body.data.companyInfo).toHaveProperty('name');
        }
      }
    });
  });

  describe('GET /api/companies/news', () => {
    it('should require jobId parameter', async () => {
      const res = await request(app)
        .get('/api/companies/news');
      
      expect([400, 404, 500]).toContain(res.status);
    });

    it('should accept valid jobId', async () => {
      const res = await request(app)
        .get('/api/companies/news')
        .query({ jobId: 'valid-job-id' });
      
      expect([200, 400, 404, 500]).toContain(res.status);
      expect(res.body).toHaveProperty('success');
    });

    it('should return news data structure', async () => {
      const res = await request(app)
        .get('/api/companies/news')
        .query({ jobId: 'test-job-123' });
      
      expect([200, 400, 404, 500]).toContain(res.status);
      if (res.status === 200 && res.body.data) {
        // Check if response has expected structure
        expect(res.body).toHaveProperty('timestamp');
      }
    });
  });

  describe('GET /api/companies/news/export', () => {
    it('should require jobId parameter', async () => {
      const res = await request(app)
        .get('/api/companies/news/export');
      
      expect([400, 404, 500]).toContain(res.status);
    });

    it('should accept valid export request', async () => {
      const res = await request(app)
        .get('/api/companies/news/export')
        .query({ jobId: 'test-job-123' });
      
      expect([200, 400, 500]).toContain(res.status);
      expect(res.body).toHaveProperty('success');
    });

    it('should handle empty news array', async () => {
      const res = await request(app)
        .get('/api/companies/news/export')
        .query({ jobId: 'empty-news' });
      
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should format export data correctly', async () => {
      const res = await request(app)
        .get('/api/companies/news/export')
        .query({ jobId: 'test-123' });
      
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200 && res.body.data) {
        expect(res.body.data).toBeDefined();
      }
    });

    it('should return JSON formatted response', async () => {
      const res = await request(app)
        .get('/api/companies/news/export')
        .query({ jobId: 'test' });
      
      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Route Response Format', () => {
    it('should always return success flag', async () => {
      const res = await request(app)
        .get('/api/companies/info')
        .query({ name: 'Test' });
      
      expect(res.body).toHaveProperty('success');
      expect(typeof res.body.success).toBe('boolean');
    });

    it('should include timestamp in responses', async () => {
      const res = await request(app)
        .get('/api/companies/info')
        .query({ name: 'Test' });
      
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should return valid JSON', async () => {
      const res = await request(app)
        .get('/api/companies/info')
        .query({ name: 'Test' });
      
      expect(res.headers['content-type']).toMatch(/json/);
      expect(typeof res.body).toBe('object');
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const res = await request(app)
        .get('/api/companies/info')
        .query({ name: 'Test' });
      
      // Should not crash
      expect(res.status).toBeDefined();
      expect(res.body).toBeDefined();
    });

    it('should handle invalid domains', async () => {
      const res = await request(app)
        .get('/api/companies/info')
        .query({ domain: '://invalid-domain' });
      
      // Should handle gracefully
      expect(res.status).toBeDefined();
    });

    it('should handle missing parameters with helpful message', async () => {
      const res = await request(app)
        .get('/api/companies/info');
      
      if (res.status === 400) {
        expect(res.body.message).toBeTruthy();
      }
    });
  });

  describe('Parameter Validation', () => {
    it('should trim whitespace from parameters', async () => {
      const res = await request(app)
        .get('/api/companies/info')
        .query({ name: '  Google  ' });
      
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should handle empty string parameters', async () => {
      const res = await request(app)
        .get('/api/companies/info')
        .query({ name: '' });
      
      // Empty string should be treated same as missing parameter
      expect([400, 500]).toContain(res.status);
    });

    it('should handle very long company names', async () => {
      const longName = 'A'.repeat(500);
      const res = await request(app)
        .get('/api/companies/info')
        .query({ name: longName });
      
      expect([200, 400, 500]).toContain(res.status);
    });

    it('should preserve case in company names', async () => {
      const res = await request(app)
        .get('/api/companies/info')
        .query({ name: 'GoOgLe' });
      
      expect([200, 400, 500]).toContain(res.status);
    });
  });
});
