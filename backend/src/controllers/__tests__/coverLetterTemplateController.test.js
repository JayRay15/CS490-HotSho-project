import { jest, beforeEach, describe, it, expect } from '@jest/globals';

jest.resetModules();

// Mocks for models and utilities
const mockCover = {
  countDocuments: jest.fn(),
  insertMany: jest.fn(),
  find: jest.fn(),
  updateMany: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
};

const mockUser = {
  findOne: jest.fn(),
};

const mockJob = {
  findOne: jest.fn(),
};

const mockGemini = {
  generateCoverLetter: jest.fn(),
  analyzeCompanyCulture: jest.fn(),
};

const mockResearch = {
  researchCompany: jest.fn(),
  formatResearchForCoverLetter: jest.fn(),
};

jest.unstable_mockModule('../../models/CoverLetterTemplate.js', () => ({
  CoverLetterTemplate: mockCover,
}));

jest.unstable_mockModule('../../models/User.js', () => ({
  User: mockUser,
}));

jest.unstable_mockModule('../../models/Job.js', () => ({
  Job: mockJob,
}));

jest.unstable_mockModule('../../utils/geminiService.js', () => ({
  generateCoverLetter: mockGemini.generateCoverLetter,
  analyzeCompanyCulture: mockGemini.analyzeCompanyCulture,
}));

jest.unstable_mockModule('../../utils/companyResearchService.js', () => ({
  researchCompany: mockResearch.researchCompany,
  formatResearchForCoverLetter: mockResearch.formatResearchForCoverLetter,
}));

// Import controller after mocks are registered
const {
  listTemplates,
  getIndustryGuidance,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  trackTemplateUsage,
  getTemplateAnalytics,
  importTemplate,
  shareTemplate,
  exportTemplate,
  generateAICoverLetter,
  analyzeCulture,
} = await import('../coverLetterTemplateController.js');

describe('coverLetterTemplateController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      auth: { userId: 'user-1', payload: { sub: 'user-1' } },
      body: {},
      params: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    // Provide default chainable behaviors for common mongoose query chains used in controller
    mockCover.find.mockImplementation(() => ({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      lean: jest.fn().mockResolvedValue([]),
    }));

    // Many controller calls use User.findOne(...).lean()
    mockUser.findOne.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue(null) }));
  });

  describe('listTemplates', () => {
    it('should seed defaults when user has none', async () => {
      mockCover.countDocuments.mockResolvedValue(0);
      mockCover.insertMany.mockResolvedValue(true);
      mockCover.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) });

      await listTemplates(mockReq, mockRes);

      expect(mockCover.countDocuments).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(mockCover.insertMany).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should apply filters for industry/style', async () => {
      mockCover.countDocuments.mockResolvedValue(1);
      mockCover.find.mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
        sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      });
      mockReq.query.industry = 'technology';

      await listTemplates(mockReq, mockRes);

      expect(mockCover.find).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getIndustryGuidance', () => {
    it('returns guidance for specific industry', async () => {
      mockReq.query.industry = 'technology';

      await getIndustryGuidance(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getTemplateById', () => {
    it('returns 404 when not found', async () => {
      mockReq.params.id = 't1';
      mockCover.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await getTemplateById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createTemplate', () => {
    it('returns 400 when required fields missing', async () => {
      mockReq.body = { name: '', content: '' };

      await createTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateTemplate', () => {
    it('returns 404 when template not found', async () => {
      mockReq.params.id = 't1';
      mockCover.findOne.mockResolvedValue(null);

      await updateTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteTemplate', () => {
    it('returns 404 when delete count is zero', async () => {
      mockReq.params.id = 't1';
      mockCover.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await deleteTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('trackTemplateUsage', () => {
    it('returns template when updated', async () => {
      mockReq.params.id = 't1';
      mockCover.findByIdAndUpdate.mockResolvedValue({ _id: 't1' });

      await trackTemplateUsage(mockReq, mockRes);

      expect(mockCover.findByIdAndUpdate).toHaveBeenCalledWith('t1', { $inc: { usageCount: 1 } }, { new: true });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getTemplateAnalytics', () => {
    it('returns analytics for user templates', async () => {
      const templates = [
        { _id: 'a', name: 'A', industry: 'tech', style: 'formal', usageCount: 2, createdAt: new Date() },
      ];
      mockCover.find.mockReturnValue({ select: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(templates) }) }) });

      await getTemplateAnalytics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('importTemplate', () => {
    it('returns 400 when templateData missing', async () => {
      mockReq.body = {};

      await importTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('generateAICoverLetter', () => {
    it('returns 400 when jobId missing', async () => {
      mockReq.body = {};

      await generateAICoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('generates cover letter when inputs valid', async () => {
      mockReq.body = { jobId: 'job-1', variationCount: 1 };
      const job = { _id: 'job-1', title: 'Dev', company: 'Acme', description: 'desc', requirements: [] };
      const user = { auth0Id: 'user-1', employment: [{ company: 'X' }] };

  mockJob.findOne.mockResolvedValue(job);
  // User.findOne(...).lean()
  mockUser.findOne.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue(user) }));
      mockResearch.researchCompany.mockResolvedValue({});
      mockResearch.formatResearchForCoverLetter.mockReturnValue('formatted');
      mockGemini.generateCoverLetter.mockResolvedValue(['v1']);

      await generateAICoverLetter(mockReq, mockRes);

      expect(mockJob.findOne).toHaveBeenCalledWith({ _id: 'job-1', userId: 'user-1' });
      expect(mockUser.findOne).toHaveBeenCalledWith({ auth0Id: 'user-1' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('analyzeCulture', () => {
    it('returns 400 when jobDescription missing', async () => {
      mockReq.body = {};

      await analyzeCulture(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('returns analysis when provided', async () => {
      mockReq.body = { jobDescription: 'x' };
      mockGemini.analyzeCompanyCulture.mockResolvedValue({ tone: 'corporate' });

      await analyzeCulture(mockReq, mockRes);

      expect(mockGemini.analyzeCompanyCulture).toHaveBeenCalledWith('x');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
