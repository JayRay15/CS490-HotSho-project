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

  test('PUT /api/cover-letters/:id/set-default calls setDefaultCoverLetter and is protected', async () => {
    const res = await request(app).put('/api/cover-letters/abc123/set-default');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockSetDefault).toHaveBeenCalled();
  });

  test('PUT /api/cover-letters/:id/archive calls archiveCoverLetter and is protected', async () => {
    const res = await request(app).put('/api/cover-letters/abc123/archive');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockArchive).toHaveBeenCalled();
  });

  test('PUT /api/cover-letters/:id/unarchive calls unarchiveCoverLetter and is protected', async () => {
    const res = await request(app).put('/api/cover-letters/abc123/unarchive');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockUnarchive).toHaveBeenCalled();
  });

  test('POST /api/cover-letters/:id/clone calls cloneCoverLetter and is protected', async () => {
    const res = await request(app).post('/api/cover-letters/abc123/clone');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockClone).toHaveBeenCalled();
  });

  test('POST /api/cover-letters/:id/export/pdf calls exportCoverLetterAsPdf and is protected', async () => {
    const res = await request(app).post('/api/cover-letters/abc123/export/pdf');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockExportPdf).toHaveBeenCalled();
  });

  test('POST /api/cover-letters/:id/export/docx calls exportCoverLetterAsDocx and is protected', async () => {
    const res = await request(app).post('/api/cover-letters/abc123/export/docx');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockExportDocx).toHaveBeenCalled();
  });

  test('POST /api/cover-letters/:id/export/html calls exportCoverLetterAsHtml and is protected', async () => {
    const res = await request(app).post('/api/cover-letters/abc123/export/html');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockExportHtml).toHaveBeenCalled();
  });

  test('POST /api/cover-letters/:id/export/text calls exportCoverLetterAsText and is protected', async () => {
    const res = await request(app).post('/api/cover-letters/abc123/export/text');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockExportText).toHaveBeenCalled();
  });

  test('POST /api/cover-letters/:id/email-template calls generateCoverLetterEmailTemplate and is protected', async () => {
    const res = await request(app).post('/api/cover-letters/abc123/email-template');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCheckJwt).toHaveBeenCalled();
    expect(mockGenerateEmailTemplate).toHaveBeenCalled();
  });
});
