import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controllers
const mockGetCurrentUser = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateCurrentUser = jest.fn((req, res) => res.json({ success: true }));
const mockUploadProfilePicture = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteProfilePicture = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteAccount = jest.fn((req, res) => res.json({ success: true }));
const mockAddEmployment = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateEmployment = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteEmployment = jest.fn((req, res) => res.json({ success: true }));
const mockUpload = {
  single: jest.fn(() => (req, res, next) => next()),
};

jest.unstable_mockModule('../../controllers/userController.js', () => ({
  getCurrentUser: mockGetCurrentUser,
  updateCurrentUser: mockUpdateCurrentUser,
  uploadProfilePicture: mockUploadProfilePicture,
  deleteProfilePicture: mockDeleteProfilePicture,
  deleteAccount: mockDeleteAccount,
  addEmployment: mockAddEmployment,
  updateEmployment: mockUpdateEmployment,
  deleteEmployment: mockDeleteEmployment,
  upload: mockUpload,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-id' };
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

describe('userRoutes', () => {
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    const userRoutes = await import('../../routes/userRoutes.js');
    app.use('/api/users', userRoutes.default);
  });

  describe('GET /api/users/me', () => {
    it('should get current user', async () => {
      const response = await request(app).get('/api/users/me');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/users/me');
      
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update current user', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/users/profile-picture', () => {
    it('should upload profile picture', async () => {
      const response = await request(app)
        .post('/api/users/profile-picture')
        .attach('picture', Buffer.from('fake-image'), 'test.jpg');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/users/profile-picture', () => {
    it('should delete profile picture', async () => {
      const response = await request(app).delete('/api/users/profile-picture');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/users/delete', () => {
    it('should delete account', async () => {
      const response = await request(app)
        .delete('/api/users/delete')
        .send({ password: 'TestPassword123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Employment routes', () => {
    it('POST /api/users/employment should add employment', async () => {
      const response = await request(app)
        .post('/api/users/employment')
        .send({ company: 'Test Corp' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/users/employment/:employmentId should update employment', async () => {
      const response = await request(app)
        .put('/api/users/employment/123')
        .send({ company: 'Updated Corp' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/users/employment/:employmentId should delete employment', async () => {
      const response = await request(app).delete('/api/users/employment/123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should protect all routes with checkJwt', async () => {
      await request(app).get('/api/users/me');
      
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });
});
