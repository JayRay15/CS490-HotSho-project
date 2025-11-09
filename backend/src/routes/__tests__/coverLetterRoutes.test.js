import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock controllers
const mockList = jest.fn((req, res) => res.json({ success: true }));
const mockCreate = jest.fn((req, res) => res.json({ success: true }));
const mockGet = jest.fn((req, res) => res.json({ success: true }));
const mockUpdate = jest.fn((req, res) => res.json({ success: true }));
const mockDelete = jest.fn((req, res) => res.json({ success: true }));
const mockSetDefault = jest.fn((req, res) => res.json({ success: true }));
const mockArchive = jest.fn((req, res) => res.json({ success: true }));
const mockUnarchive = jest.fn((req, res) => res.json({ success: true }));
const mockClone = jest.fn((req, res) => res.json({ success: true }));
const mockExportPdf = jest.fn((req, res) => res.json({ success: true }));
const mockExportDocx = jest.fn((req, res) => res.json({ success: true }));
const mockExportHtml = jest.fn((req, res) => res.json({ success: true }));
const mockExportText = jest.fn((req, res) => res.json({ success: true }));
const mockGenerateEmailTemplate = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/coverLetterController.js', () => ({
  listCoverLetters: mockList,
  createCoverLetterFromTemplate: mockCreate,
  getCoverLetterById: mockGet,
  updateCoverLetter: mockUpdate,
  deleteCoverLetter: mockDelete,
  setDefaultCoverLetter: mockSetDefault,
  archiveCoverLetter: mockArchive,
  unarchiveCoverLetter: mockUnarchive,
  cloneCoverLetter: mockClone,
  exportCoverLetterAsPdf: mockExportPdf,
  exportCoverLetterAsDocx: mockExportDocx,
  exportCoverLetterAsHtml: mockExportHtml,
  exportCoverLetterAsText: mockExportText,
  generateCoverLetterEmailTemplate: mockGenerateEmailTemplate,
}));

// Mock middleware
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user' };
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

describe('coverLetterRoutes', () => {
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());

    const routesModule = await import('../../routes/coverLetterRoutes.js');
    const coverRoutes = routesModule.default;
    app.use('/api', coverRoutes);
  });

  test('GET /api/cover-letters calls listCoverLetters and is protected', async () => {
    const res = await request(app).get('/api/cover-letters');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockList).toHaveBeenCalled();
  });

  test('POST /api/cover-letters calls createCoverLetterFromTemplate and is protected', async () => {
    const res = await request(app).post('/api/cover-letters').send({ title: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalled();
  });

  test('GET /api/cover-letters/:id calls getCoverLetterById and is protected', async () => {
    const res = await request(app).get('/api/cover-letters/abc123');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockGet).toHaveBeenCalled();
  });

  test('PUT /api/cover-letters/:id calls updateCoverLetter and is protected', async () => {
    const res = await request(app).put('/api/cover-letters/abc123').send({ title: 'updated' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });

  test('DELETE /api/cover-letters/:id calls deleteCoverLetter and is protected', async () => {
    const res = await request(app).delete('/api/cover-letters/abc123');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalled();
  });
});
