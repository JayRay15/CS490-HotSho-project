import { jest } from '@jest/globals';
jest.resetModules();

// Lightweight mocks for dependencies used by the controller to allow "happy path" execution
const mockResume = {
  find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }),
  findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
  create: jest.fn().mockResolvedValue({ _id: 'r1' }),
  deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  updateOne: jest.fn().mockResolvedValue({}),
  updateMany: jest.fn().mockResolvedValue({}),
  countDocuments: jest.fn().mockResolvedValue(0),
};

const mockResumeTemplate = {
  find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }),
  findOne: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(null) }),
  create: jest.fn().mockResolvedValue({ _id: 't1' }),
  insertMany: jest.fn().mockResolvedValue([]),
  updateMany: jest.fn().mockResolvedValue({}),
  findById: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(null) }),
  deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
};

const mockJob = { findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }), countDocuments: jest.fn().mockResolvedValue(0) };
const mockUser = { findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({}) }) };

const mockGeminiService = {
  generateResumeContent: jest.fn().mockResolvedValue({}),
  generateResumeContentVariations: jest.fn().mockResolvedValue([]),
  regenerateSection: jest.fn().mockResolvedValue({}),
  analyzeATSCompatibility: jest.fn().mockResolvedValue({}),
  optimizeResumeSkills: jest.fn().mockResolvedValue({}),
  tailorExperience: jest.fn().mockResolvedValue({}),
};

const mockPdfGenerator = { generatePdfFromTemplate: jest.fn().mockResolvedValue(Buffer.from('pdf')) };
const mockResumeExporter = { exportToDocx: jest.fn().mockResolvedValue(Buffer.from('docx')), exportToHtml: jest.fn().mockResolvedValue('<html/>'), exportToPlainText: jest.fn().mockResolvedValue('text') };
const mockHtmlToPdf = { htmlToPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')) };

jest.unstable_mockModule('../../models/Resume.js', () => ({ Resume: mockResume }));
jest.unstable_mockModule('../../models/ResumeTemplate.js', () => ({ ResumeTemplate: mockResumeTemplate }));
jest.unstable_mockModule('../../models/Job.js', () => ({ Job: mockJob }));
jest.unstable_mockModule('../../models/User.js', () => ({ User: mockUser }));
jest.unstable_mockModule('../../utils/geminiService.js', () => mockGeminiService);
jest.unstable_mockModule('../../utils/pdfGenerator.js', () => mockPdfGenerator);
jest.unstable_mockModule('../../utils/resumeExporter.js', () => mockResumeExporter);
jest.unstable_mockModule('../../utils/htmlToPdf.js', () => mockHtmlToPdf);

const {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  importTemplate,
  listResumes,
  createResumeFromTemplate,
  updateResume,
  deleteResume,
  generateAIResume,
  generateResumeVariations,
  regenerateResumeSection,
  analyzeATS,
  cloneResume,
  compareResumes,
  setDefaultResume,
  archiveResume,
  unarchiveResume,
  generateResumePDF,
  optimizeSkills,
  tailorExperienceForJob,
  exportResumeDocx,
  exportResumeHtml,
  exportResumeText,
} = await import('../resumeController.js');

describe('resumeController bulk execute (smoke paths)', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { auth: { userId: 'u1', payload: { sub: 'u1' } }, body: {}, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis(), setHeader: jest.fn() };
  });

  it('executes many controller handlers on basic happy paths', async () => {
    // listTemplates
    await listTemplates(req, res);
    expect(res.status).toHaveBeenCalled();

    // createTemplate (minimal body)
    req.body = { name: 'T', type: 'chronological' };
    await createTemplate(req, res);
    expect(mockResumeTemplate.create).toHaveBeenCalled();

    // updateTemplate - create a doc to be found
    const tplDoc = { _id: 't1', userId: 'u1', save: jest.fn().mockResolvedValue(true) };
    mockResumeTemplate.findOne.mockResolvedValueOnce(tplDoc);
    req.params.id = 't1'; req.body = { name: 'Updated' };
    await updateTemplate(req, res);
    expect(tplDoc.save).toHaveBeenCalled();

    // deleteTemplate
    mockResumeTemplate.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });
    req.params.id = 't1';
    await deleteTemplate(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // importTemplate (pdf buffer path)
    req.body = { name: 'Imp', type: 'chronological', pdfBuffer: Buffer.from('x').toString('base64') };
    await importTemplate(req, res);
    expect(mockResumeTemplate.create).toHaveBeenCalled();

    // listResumes
    mockResume.find.mockReturnValueOnce({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) });
    await listResumes(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // createResumeFromTemplate -> when template not found should return 404
    req.body = { templateId: 'no', name: 'R' };
    mockResumeTemplate.findOne.mockResolvedValueOnce(null);
    await createResumeFromTemplate(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    // updateResume -> not found (404) path
    req.params.id = 'no'; mockResume.findOne.mockResolvedValueOnce(null);
    await updateResume(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    // deleteResume
    req.params.id = 'r1'; mockResume.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });
    await deleteResume(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // generateAIResume - missing fields -> 400
    req.body = { jobId: 'job-1' };
    await generateAIResume(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // generateResumeVariations - missing fields -> 400
    req.body = { jobId: 'job-1' };
    await generateResumeVariations(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // regenerateResumeSection - not found -> 404
    req.params.id = 'rX'; req.body = { section: 'summary' };
    mockResume.findOne.mockResolvedValueOnce(null);
    await regenerateResumeSection(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    // analyzeATS - not found -> 404
    req.params.id = 'rX'; mockResume.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });
    await analyzeATS(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    // cloneResume - original not found -> 404
    req.params.id = 'rX'; mockResume.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });
    await cloneResume(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    // compareResumes - missing resumeId2 -> 400
    req.params.resumeId1 = 'r1'; req.query = {};
    await compareResumes(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // setDefaultResume - not found -> 404
    req.params.resumeId = 'rX'; mockResume.findOne.mockResolvedValueOnce(null);
    await setDefaultResume(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    // archive/unarchive - not found -> 404
    req.params.resumeId = 'rX'; mockResume.findOne.mockResolvedValueOnce(null);
    await archiveResume(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    mockResume.findOne.mockResolvedValueOnce(null);
    await unarchiveResume(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    // generateResumePDF - resume not found -> 404
    req.params.id = 'rX'; mockResume.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });
    await generateResumePDF(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    // optimizeSkills and tailorExperienceForJob - missing resume -> 404
    req.params.resumeId = 'rX'; mockResume.findOne.mockResolvedValueOnce(null);
    await optimizeSkills(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    mockResume.findOne.mockResolvedValueOnce(null);
    await tailorExperienceForJob(req, res);
    expect(res.status).toHaveBeenCalledWith(404);

    // exportResumeDocx/Html/Text - resume not found -> 404
    req.params.id = 'rX'; mockResume.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });
    await exportResumeDocx(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    mockResume.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });
    await exportResumeHtml(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    mockResume.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });
    await exportResumeText(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
