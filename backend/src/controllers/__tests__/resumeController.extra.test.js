import { jest } from '@jest/globals';

beforeEach(() => jest.resetModules());

// Mocks
const mockResume = { findOne: jest.fn(), deleteOne: jest.fn(), create: jest.fn(), updateMany: jest.fn() };
const mockResumeTemplate = { findById: jest.fn(), findOne: jest.fn(), create: jest.fn(), insertMany: jest.fn(), updateMany: jest.fn(), findByIdAndUpdate: jest.fn() };
const mockUser = { findOne: jest.fn() };
const mockJob = { findOne: jest.fn(), countDocuments: jest.fn() };

jest.unstable_mockModule('../../models/Resume.js', () => ({ Resume: mockResume }));
jest.unstable_mockModule('../../models/ResumeTemplate.js', () => ({ ResumeTemplate: mockResumeTemplate }));
jest.unstable_mockModule('../../models/User.js', () => ({ User: mockUser }));
jest.unstable_mockModule('../../models/Job.js', () => ({ Job: mockJob }));

const mockExportToHtml = jest.fn();
const mockExportToDocx = jest.fn();
const mockExportToPlainText = jest.fn();
jest.unstable_mockModule('../../utils/resumeExporter.js', () => ({
  exportToHtml: mockExportToHtml,
  exportToDocx: mockExportToDocx,
  exportToPlainText: mockExportToPlainText,
}));

const mockHtmlToPdf = jest.fn();
jest.unstable_mockModule('../../utils/htmlToPdf.js', () => ({ htmlToPdf: mockHtmlToPdf }));

const mockGeneratePdfFromTemplate = jest.fn();
jest.unstable_mockModule('../../utils/pdfGenerator.js', () => ({ generatePdfFromTemplate: mockGeneratePdfFromTemplate }));

const { exportResumeHtml, exportResumeDocx, exportResumeText, generateResumePDF } = await import('../resumeController.js');

describe('resumeController export & PDF paths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exportResumeHtml returns 404 when resume not found', async () => {
    mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const req = { auth: { userId: 'u1' }, params: { id: 'r1' }, query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), setHeader: jest.fn(), send: jest.fn() };

    await exportResumeHtml(req, res);

    expect(mockResume.findOne).toHaveBeenCalledWith({ _id: 'r1', userId: 'u1' });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('exportResumeHtml returns 400 when not validated', async () => {
  const resume = { _id: 'r2', metadata: null };
  mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });
  const req = { auth: { userId: 'u1' }, params: { id: 'r2' }, query: {} };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), setHeader: jest.fn(), send: jest.fn() };

  await exportResumeHtml(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  });

  test('exportResumeHtml success sends html with headers', async () => {
    const resume = { _id: 'r3', name: 'MyResume', metadata: { lastValidation: { isValid: true }, validatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString() };
  mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });
  mockResumeTemplate.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({}) });
    mockExportToHtml.mockReturnValueOnce('<html></html>');

  const req = { auth: { userId: 'u1' }, params: { id: 'r3' }, query: {} };
  const res = { setHeader: jest.fn(), send: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await exportResumeHtml(req, res);

    expect(res.setHeader).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith('<html></html>');
  });

  test('exportResumeText success sends text with headers', async () => {
    const resume = { _id: 'r4', name: 'MyResume', metadata: { lastValidation: { isValid: true }, validatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString() };
  mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });
    mockExportToPlainText.mockReturnValueOnce('plain text');

  const req = { auth: { userId: 'u1' }, params: { id: 'r4' }, query: {} };
  const res = { setHeader: jest.fn(), send: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await exportResumeText(req, res);

    expect(res.setHeader).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith('plain text');
  });

  test('exportResumeDocx success sends buffer with headers', async () => {
    const resume = { _id: 'r5', name: 'MyResume', metadata: { lastValidation: { isValid: true }, validatedAt: new Date().toISOString() }, updatedAt: new Date().toISOString() };
  mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });
    const buf = Buffer.from('docx');
    mockExportToDocx.mockResolvedValueOnce(buf);

  const req = { auth: { userId: 'u1' }, params: { id: 'r5' }, query: {} };
  const res = { setHeader: jest.fn(), send: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await exportResumeDocx(req, res);

    expect(res.setHeader).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(buf);
  });

  test('generateResumePDF falls back to HTML->PDF when template missing and sends pdf', async () => {
    const now = new Date().toISOString();
    const resume = { _id: 'r6', name: 'R6', metadata: { lastValidation: { isValid: true }, validatedAt: now }, updatedAt: now, templateId: 't1' };
  mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });

    // Template returned but missing originalPdf/pdfLayout
    const templateDoc = { toObject: () => ({ layout: {} }) };
  mockResumeTemplate.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(templateDoc) });

    mockExportToHtml.mockReturnValueOnce('<html></html>');
    const pdfBuf = Buffer.from('%PDF-1');
    mockHtmlToPdf.mockResolvedValueOnce(pdfBuf);

  const req = { auth: { userId: 'u1' }, params: { id: 'r6' }, query: {} };
  const res = { setHeader: jest.fn(), send: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await generateResumePDF(req, res);

    expect(mockHtmlToPdf).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.send).toHaveBeenCalledWith(pdfBuf);
  });

  test('generateResumePDF uses generatePdfFromTemplate when originalPdf present', async () => {
    const now = new Date().toISOString();
    const resume = { _id: 'r7', name: 'R7', metadata: { lastValidation: { isValid: true }, validatedAt: now }, updatedAt: now, templateId: 't2' };
  mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });

    const originalPdf = Buffer.from('PDFDATA');
    const templateObj = { originalPdf, pdfLayout: {}, layout: {} , toObject: () => ({ layout: {}, originalPdf, pdfLayout: {} }) };
  mockResumeTemplate.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(templateObj) });

    const outBuf = Buffer.from('GENPDF');
    mockGeneratePdfFromTemplate.mockResolvedValueOnce(outBuf);

  const req = { auth: { userId: 'u1' }, params: { id: 'r7' }, query: {} };
  const res = { setHeader: jest.fn(), send: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await generateResumePDF(req, res);

    expect(mockGeneratePdfFromTemplate).toHaveBeenCalledWith(expect.any(Object), resume, expect.any(Object));
    expect(res.send).toHaveBeenCalledWith(outBuf);
  });

  test('generateResumePDF returns 400 if not validated or modified since validation', async () => {
    const resumeNoValidation = { _id: 'r8', metadata: {} };
  mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(resumeNoValidation) });
  const req = { auth: { userId: 'u1' }, params: { id: 'r8' }, query: {} };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), setHeader: jest.fn(), send: jest.fn() };

    await generateResumePDF(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    const validatedAt = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const resumeModified = { _id: 'r9', metadata: { lastValidation: { isValid: true }, validatedAt }, updatedAt: new Date().toISOString() };
  mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(resumeModified) });
    const req2 = { auth: { userId: 'u1' }, params: { id: 'r9' }, query: {} };
    const res2 = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await generateResumePDF(req2, res2);
    expect(res2.status).toHaveBeenCalledWith(400);
  });
});
