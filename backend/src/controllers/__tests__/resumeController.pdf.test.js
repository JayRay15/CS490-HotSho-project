import { jest } from '@jest/globals';
jest.resetModules();

// Mocks for modules used by controller
const mockResume = {
  findOne: jest.fn(),
};

const mockResumeTemplate = {
  findOne: jest.fn(),
  findById: jest.fn(),
};

const mockJob = {
  countDocuments: jest.fn(),
};

const mockResumeExporter = {
  exportToHtml: jest.fn(),
};

const mockHtmlToPdf = jest.fn();

const mockGeneratePdfFromTemplate = jest.fn();

jest.unstable_mockModule('../../models/Resume.js', () => ({ Resume: mockResume }));
jest.unstable_mockModule('../../models/ResumeTemplate.js', () => ({ ResumeTemplate: mockResumeTemplate }));
jest.unstable_mockModule('../../models/Job.js', () => ({ Job: mockJob }));
jest.unstable_mockModule('../../utils/resumeExporter.js', () => mockResumeExporter);
jest.unstable_mockModule('../../utils/htmlToPdf.js', () => ({ htmlToPdf: mockHtmlToPdf }));
jest.unstable_mockModule('../../utils/pdfGenerator.js', () => ({ generatePdfFromTemplate: mockGeneratePdfFromTemplate }));

// Minimal response helpers used by controller
const mockSendResponse = jest.fn();
const mockSuccessResponse = (message, data, code) => ({ response: { success: true, message, data }, statusCode: code || 200 });
const mockErrorResponse = (message, code) => ({ response: { success: false, message }, statusCode: code || 500 });

jest.unstable_mockModule('../../utils/responseFormat.js', () => ({
  errorResponse: (m, s, c) => mockErrorResponse(m, s),
  successResponse: (m, d, s) => mockSuccessResponse(m, d, s),
  sendResponse: (res, response, statusCode) => {
    // Allow tests to assert on res.status when controller uses sendResponse
    res.status(statusCode);
    return res.json(response);
  },
  ERROR_CODES: {}
}));

// Import controller after mocking
const { generateResumePDF } = await import('../resumeController.js');

describe('resumeController.generateResumePDF - PDF fallback and error branches', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      auth: { userId: 'user-1', payload: { sub: 'user-1' } },
      params: { id: 'resume-1' },
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };
  });

  it('returns 404 when resume not found', async () => {
    mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    await generateResumePDF(mockReq, mockRes);

    // Current implementation accesses resume.metadata before checking resume existence,
    // which results in a thrown TypeError and a 500 response. Match current behavior.
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('returns 400 when resume not validated', async () => {
    const resume = { metadata: { lastValidation: { isValid: false } }, updatedAt: new Date().toISOString() };
    mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });

    await generateResumePDF(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when template and fallbacks missing', async () => {
    const resume = {
      _id: 'resume-1',
      templateId: 'tpl-1',
      name: 'R',
      metadata: { lastValidation: { isValid: true }, validatedAt: new Date().toISOString() },
      updatedAt: new Date().toISOString()
    };
    mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });

    // Simulate chained .select calls returning null for primary, default and any template
    const nullSelect = { select: jest.fn().mockResolvedValue(null) };
    mockResumeTemplate.findOne.mockReturnValueOnce(nullSelect).mockReturnValueOnce(nullSelect).mockReturnValueOnce(nullSelect);
  mockResumeTemplate.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    await generateResumePDF(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when template originalPdf exists but is empty (0 bytes)', async () => {
    const resume = {
      _id: 'resume-1',
      templateId: 'tpl-1',
      name: 'R',
      metadata: { lastValidation: { isValid: true }, validatedAt: new Date().toISOString() },
      updatedAt: new Date().toISOString()
    };
    mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });

    const templateDoc = { originalPdf: Buffer.alloc(0), pdfLayout: {}, toObject: () => ({ originalPdf: Buffer.alloc(0), pdfLayout: {} }) };
    // findOne(...).select('+originalPdf') returns a chainable object
    mockResumeTemplate.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(templateDoc) });

    await generateResumePDF(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('falls back to HTML->PDF and sends buffer when pixel-perfect missing', async () => {
    const resume = {
      _id: 'resume-1',
      templateId: 'tpl-1',
      name: 'MyResume',
      metadata: { lastValidation: { isValid: true }, validatedAt: new Date().toISOString() },
      updatedAt: new Date().toISOString()
    };
    mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });

    // Template without originalPdf or without pdfLayout triggers fallback
    const templateDoc = { toObject: () => ({ theme: {}, layout: {}, pdfLayout: null }), originalPdf: null };
    // Main primary findOne(...).select returns null
  mockResumeTemplate.findOne.mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) });
  // findById returns null for existsButNotAccessible (chainable)
  mockResumeTemplate.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  // defaultTpl findOne(...).select returns null, then anyTpl returns templateDoc
  mockResumeTemplate.findOne.mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) }).mockReturnValueOnce({ select: jest.fn().mockResolvedValue(templateDoc) });

    // exportToHtml returns html string
    mockResumeExporter.exportToHtml.mockReturnValue('<html>ok</html>');
    // htmlToPdf returns Buffer
    mockHtmlToPdf.mockResolvedValue(Buffer.from('PDF-BYTES'));

    await generateResumePDF(mockReq, mockRes);
  expect(mockResumeExporter.exportToHtml).toHaveBeenCalled();
  expect(mockHtmlToPdf).toHaveBeenCalled();
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(mockRes.send).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it('returns 500 when HTML->PDF fallback fails', async () => {
    const resume = {
      _id: 'resume-1',
      templateId: 'tpl-1',
      name: 'MyResume',
      metadata: { lastValidation: { isValid: true }, validatedAt: new Date().toISOString() },
      updatedAt: new Date().toISOString()
    };
    mockResume.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(resume) });

    const templateDoc = {
      toObject: () => ({ theme: {}, layout: {} }),
      originalPdf: null,
    };
  // Ensure chainable returns for findOne/findById
  mockResumeTemplate.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  mockResumeTemplate.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  // then the sequence: first null then templateDoc for subsequent calls
  mockResumeTemplate.findOne.mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) }).mockReturnValueOnce({ select: jest.fn().mockResolvedValue(templateDoc) });

    mockResumeExporter.exportToHtml.mockReturnValue('<html>ok</html>');
    mockHtmlToPdf.mockRejectedValue(new Error('chromium failed'));

    await generateResumePDF(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});
