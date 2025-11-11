import { jest } from '@jest/globals';
jest.resetModules();

// Targeted tests for resumeController to hit deeper branches
const mockResume = {
  create: jest.fn().mockResolvedValue({ _id: 'res-1' }),
  findOne: jest.fn(),
  find: jest.fn(),
  deleteOne: jest.fn(),
};

const mockResumeTemplate = {
  findOne: jest.fn(),
  create: jest.fn(),
  updateMany: jest.fn().mockResolvedValue({}),
  findById: jest.fn(),
};

const mockJob = { findOne: jest.fn() };
const mockUser = { findOne: jest.fn() };

const mockGeminiService = {
  generateResumeContent: jest.fn(),
  generateResumeContentVariations: jest.fn(),
  regenerateSection: jest.fn(),
  analyzeATSCompatibility: jest.fn(),
  optimizeResumeSkills: jest.fn(),
  tailorExperience: jest.fn(),
};

jest.unstable_mockModule('../../models/Resume.js', () => ({ Resume: mockResume }));
jest.unstable_mockModule('../../models/ResumeTemplate.js', () => ({ ResumeTemplate: mockResumeTemplate }));
jest.unstable_mockModule('../../models/Job.js', () => ({ Job: mockJob }));
jest.unstable_mockModule('../../models/User.js', () => ({ User: mockUser }));
jest.unstable_mockModule('../../utils/geminiService.js', () => mockGeminiService);

const {
  createTemplate,
  generateAIResume,
} = await import('../resumeController.js');

describe('resumeController targeted tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { auth: { userId: 'u1' }, body: {}, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis(), setHeader: jest.fn() };
  });

  it('createTemplate should save pdf buffer and verify saved PDF when present', async () => {
    // Prepare a small base64 PDF buffer
    const pdfBuf = Buffer.from('smallpdf');
    req.body = { name: 'MyTpl', type: 'chronological', pdfBuffer: pdfBuf.toString('base64'), isDefault: true };

    // Mock create to return a document-like object with save and toObject
    const tplDoc = {
      _id: 'tpl-1',
      layout: { projectFormat: 'x' },
      save: jest.fn().mockResolvedValue(true),
      toObject: () => ({ _id: 'tpl-1', layout: { projectFormat: 'x' }, originalPdf: pdfBuf }),
    };

    mockResumeTemplate.create.mockResolvedValueOnce(tplDoc);
    // findById(...).select('+originalPdf') -> returns savedTemplate
    const savedTemplate = { originalPdf: pdfBuf };
    mockResumeTemplate.findById.mockReturnValueOnce({ select: jest.fn().mockResolvedValue(savedTemplate) });

    await createTemplate(req, res);

    expect(mockResumeTemplate.updateMany).toHaveBeenCalled();
    expect(mockResumeTemplate.create).toHaveBeenCalled();
    expect(tplDoc.save).toHaveBeenCalled();
    expect(mockResumeTemplate.findById).toHaveBeenCalledWith('tpl-1');
    // sendResponse should have set a 201 status via res.status
    expect(res.status).toHaveBeenCalled();
  });

  it('generateAIResume should create a resume when job, user and template exist', async () => {
    req.body = { jobId: 'job-1', templateId: 'tpl-1', name: 'AI Resume' };
    req.auth = { userId: 'u1' };

    // Mock job and user
    mockJob.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue({ _id: 'job-1', title: 'SWE', company: 'ACME', description: 'desc' }) });
    mockUser.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue({ auth0Id: 'u1', name: 'Jane', email: 'j@example.com', employment: [{ jobTitle: 'Dev', company: 'ACME', description: 'did stuff', _id: 'job0' }], skills: [], projects: [], education: [] }) });

    // Template doc (not lean) with toObject
    const templateDoc = { toObject: () => ({ layout: {}, _id: 'tpl-1' }) };
    mockResumeTemplate.findOne.mockResolvedValueOnce(templateDoc);

    // Gemini service returns AI content
    const aiContent = {
      summary: 'auto summary',
      experienceBullets: { job0: ['did X'] },
      projects: [{ name: 'P', bullets: ['p1'] }],
      relevantSkills: ['JS'],
      atsKeywords: ['keyword'],
      tailoringNotes: 'note'
    };
    mockGeminiService.generateResumeContent.mockResolvedValueOnce(aiContent);

    // Resume.create will be called to persist generated resume
    mockResume.create.mockResolvedValueOnce({ _id: 'res-123' });

    await generateAIResume(req, res);

    expect(mockJob.findOne).toHaveBeenCalled();
    expect(mockUser.findOne).toHaveBeenCalled();
    expect(mockResumeTemplate.findOne).toHaveBeenCalled();
    expect(mockGeminiService.generateResumeContent).toHaveBeenCalled();
    expect(mockResume.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
