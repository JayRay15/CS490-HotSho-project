import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controller
const mockGetNetworkAnalytics = jest.fn((req, res) => res.json({ success: true, data: {} }));

jest.unstable_mockModule('../../controllers/analyticsController.js', () => ({
  getNetworkAnalytics: mockGetNetworkAnalytics,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-id' };
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

describe('analyticsRoutes', () => {
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    const analyticsRoutes = await import('../../routes/analyticsRoutes.js');
    app.use('/api/analytics', analyticsRoutes.default);
  });

  describe('GET /api/analytics/network', () => {
    it('should get network analytics', async () => {
      const response = await request(app).get('/api/analytics/network');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should protect the route with checkJwt middleware', async () => {
      await request(app).get('/api/analytics/network');
      
      expect(mockCheckJwt).toHaveBeenCalled();
    });

    it('should call getNetworkAnalytics controller', async () => {
      await request(app).get('/api/analytics/network');
      
      expect(mockGetNetworkAnalytics).toHaveBeenCalled();
    });

    it('should pass request to controller with auth info', async () => {
      await request(app).get('/api/analytics/network');
      
      expect(mockGetNetworkAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: { userId: 'test-user-id' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe('middleware application', () => {
    it('should apply checkJwt to all routes', async () => {
      await request(app).get('/api/analytics/network');
      
      // Since router.use(checkJwt) is used, it should be called
      expect(mockCheckJwt).toHaveBeenCalled();
    });

    it('should reject unauthenticated requests when middleware fails', async () => {
      // Reset and make checkJwt fail
      mockCheckJwt.mockImplementationOnce((req, res, next) => {
        res.status(401).json({ success: false, message: 'Unauthorized' });
      });

      const response = await request(app).get('/api/analytics/network');

      expect(response.status).toBe(401);
      expect(mockGetNetworkAnalytics).not.toHaveBeenCalled();
    });
  });
});
