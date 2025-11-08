import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controllers
const mockListCoverLetters = jest.fn((req, res) => res.json({ success: true }));
const mockCreateCoverLetterFromTemplate = jest.fn((req, res) => res.json({ success: true }));
const mockGetCoverLetterById = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateCoverLetter = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteCoverLetter = jest.fn((req, res) => res.json({ success: true }));
const mockSetDefaultCoverLetter = jest.fn((req, res) => res.json({ success: true }));
const mockArchiveCoverLetter = jest.fn((req, res) => res.json({ success: true }));
const mockUnarchiveCoverLetter = jest.fn((req, res) => res.json({ success: true }));
const mockCloneCoverLetter = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/coverLetterController.js', () => ({
  listCoverLetters: mockListCoverLetters,
  createCoverLetterFromTemplate: mockCreateCoverLetterFromTemplate,
  getCoverLetterById: mockGetCoverLetterById,
  updateCoverLetter: mockUpdateCoverLetter,
  deleteCoverLetter: mockDeleteCoverLetter,
  setDefaultCoverLetter: mockSetDefaultCoverLetter,
  archiveCoverLetter: mockArchiveCoverLetter,
  unarchiveCoverLetter: mockUnarchiveCoverLetter,
  cloneCoverLetter: mockCloneCoverLetter,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-id' };
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

describe('coverLetterRoutes', () => {
  let app;
  let coverLetterRoutes;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    const routesModule = await import('../../routes/coverLetterRoutes.js');
    coverLetterRoutes = routesModule.default;
    app.use('/api', coverLetterRoutes);
  });

  describe('GET /api/cover-letters', () => {
    it('should call listCoverLetters controller', async () => {
      const response = await request(app).get('/api/cover-letters');
      expect(response.status).toBe(200);
      expect(mockListCoverLetters).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/cover-letters');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/cover-letters', () => {
    it('should call createCoverLetterFromTemplate controller', async () => {
      const response = await request(app)
        .post('/api/cover-letters')
        .send({ templateId: 'template-1' });
      expect(response.status).toBe(200);
      expect(mockCreateCoverLetterFromTemplate).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/cover-letters').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/cover-letters/:id', () => {
    it('should call getCoverLetterById controller', async () => {
      const response = await request(app).get('/api/cover-letters/123');
      expect(response.status).toBe(200);
      expect(mockGetCoverLetterById).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).get('/api/cover-letters/123');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/cover-letters/:id', () => {
    it('should call updateCoverLetter controller', async () => {
      const response = await request(app)
        .put('/api/cover-letters/123')
        .send({ content: 'Updated content' });
      expect(response.status).toBe(200);
      expect(mockUpdateCoverLetter).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/cover-letters/123').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/cover-letters/:id', () => {
    it('should call deleteCoverLetter controller', async () => {
      const response = await request(app).delete('/api/cover-letters/123');
      expect(response.status).toBe(200);
      expect(mockDeleteCoverLetter).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).delete('/api/cover-letters/123');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/cover-letters/:id/set-default', () => {
    it('should call setDefaultCoverLetter controller', async () => {
      const response = await request(app).put('/api/cover-letters/123/set-default');
      expect(response.status).toBe(200);
      expect(mockSetDefaultCoverLetter).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/cover-letters/123/set-default');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/cover-letters/:id/archive', () => {
    it('should call archiveCoverLetter controller', async () => {
      const response = await request(app).put('/api/cover-letters/123/archive');
      expect(response.status).toBe(200);
      expect(mockArchiveCoverLetter).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/cover-letters/123/archive');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/cover-letters/:id/unarchive', () => {
    it('should call unarchiveCoverLetter controller', async () => {
      const response = await request(app).put('/api/cover-letters/123/unarchive');
      expect(response.status).toBe(200);
      expect(mockUnarchiveCoverLetter).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).put('/api/cover-letters/123/unarchive');
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/cover-letters/:id/clone', () => {
    it('should call cloneCoverLetter controller', async () => {
      const response = await request(app)
        .post('/api/cover-letters/123/clone')
        .send({ newName: 'Cloned Letter' });
      expect(response.status).toBe(200);
      expect(mockCloneCoverLetter).toHaveBeenCalled();
    });

    it('should protect the route with checkJwt', async () => {
      await request(app).post('/api/cover-letters/123/clone').send({});
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });
});
