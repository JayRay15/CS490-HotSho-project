import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controllers
const mockRegister = jest.fn((req, res) => res.json({ success: true }));
const mockLogin = jest.fn((req, res) => res.json({ success: true }));
const mockLogout = jest.fn((req, res) => res.json({ success: true }));
const mockForgotPassword = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/authController.js', () => ({
  register: mockRegister,
  login: mockLogin,
  logout: mockLogout,
  forgotPassword: mockForgotPassword,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-id' };
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

describe('authRoutes', () => {
  let app;
  let authRoutes;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    // Import routes after mocks are set up
    const routesModule = await import('../../routes/authRoutes.js');
    authRoutes = routesModule.default;
    app.use('/api/auth', authRoutes);
  });

  describe('POST /api/auth/register', () => {
    it('should call register controller', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/auth/register').send({});
      
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should call login controller', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/auth/login').send({});
      
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should call logout controller', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/auth/logout');
      
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should call forgotPassword controller', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not require authentication', async () => {
      mockCheckJwt.mockClear();
      
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });
      
      // This route should not call checkJwt (it's public)
      // The controller is called directly without auth middleware
      expect(mockCheckJwt).not.toHaveBeenCalled();
    });
  });
});
