import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock all resume controllers
const mockListTemplates = jest.fn((req, res) => res.json({ success: true }));
const mockCreateTemplate = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateTemplate = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteTemplate = jest.fn((req, res) => res.json({ success: true }));
const mockImportTemplate = jest.fn((req, res) => res.json({ success: true }));
const mockListResumes = jest.fn((req, res) => res.json({ success: true }));
const mockCreateResumeFromTemplate = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateResume = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteResume = jest.fn((req, res) => res.json({ success: true }));
const mockGenerateAIResume = jest.fn((req, res) => res.json({ success: true }));
const mockGenerateResumeVariations = jest.fn((req, res) => res.json({ success: true }));
const mockRegenerateResumeSection = jest.fn((req, res) => res.json({ success: true }));
const mockAnalyzeATS = jest.fn((req, res) => res.json({ success: true }));
const mockGenerateResumePDF = jest.fn((req, res) => res.json({ success: true }));
const mockOptimizeSkills = jest.fn((req, res) => res.json({ success: true }));
const mockTailorExperienceForJob = jest.fn((req, res) => res.json({ success: true }));
const mockCloneResume = jest.fn((req, res) => res.json({ success: true }));
const mockCompareResumes = jest.fn((req, res) => res.json({ success: true }));
const mockMergeResumes = jest.fn((req, res) => res.json({ success: true }));
const mockSetDefaultResume = jest.fn((req, res) => res.json({ success: true }));
const mockArchiveResume = jest.fn((req, res) => res.json({ success: true }));
const mockUnarchiveResume = jest.fn((req, res) => res.json({ success: true }));
const mockExportResumeDocx = jest.fn((req, res) => res.json({ success: true }));
const mockExportResumeHtml = jest.fn((req, res) => res.json({ success: true }));
const mockExportResumeText = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/resumeController.js', () => ({
  listTemplates: mockListTemplates,
  createTemplate: mockCreateTemplate,
  updateTemplate: mockUpdateTemplate,
  deleteTemplate: mockDeleteTemplate,
  importTemplate: mockImportTemplate,
  listResumes: mockListResumes,
  createResumeFromTemplate: mockCreateResumeFromTemplate,
  updateResume: mockUpdateResume,
  deleteResume: mockDeleteResume,
  generateAIResume: mockGenerateAIResume,
  generateResumeVariations: mockGenerateResumeVariations,
  regenerateResumeSection: mockRegenerateResumeSection,
  analyzeATS: mockAnalyzeATS,
  generateResumePDF: mockGenerateResumePDF,
  optimizeSkills: mockOptimizeSkills,
  tailorExperienceForJob: mockTailorExperienceForJob,
  cloneResume: mockCloneResume,
  compareResumes: mockCompareResumes,
  mergeResumes: mockMergeResumes,
  setDefaultResume: mockSetDefaultResume,
  archiveResume: mockArchiveResume,
  unarchiveResume: mockUnarchiveResume,
  exportResumeDocx: mockExportResumeDocx,
  exportResumeHtml: mockExportResumeHtml,
  exportResumeText: mockExportResumeText,
}));

// Mock share controllers
const mockCreateShareLink = jest.fn((req, res) => res.json({ success: true }));
const mockListShares = jest.fn((req, res) => res.json({ success: true }));
const mockRevokeShare = jest.fn((req, res) => res.json({ success: true }));
const mockGetSharedResume = jest.fn((req, res) => res.json({ success: true }));
const mockCreateFeedback = jest.fn((req, res) => res.json({ success: true }));
const mockListFeedbackForResume = jest.fn((req, res) => res.json({ success: true }));
const mockListFeedbackForShare = jest.fn((req, res) => res.json({ success: true }));
const mockResolveFeedback = jest.fn((req, res) => res.json({ success: true }));
const mockExportFeedbackSummary = jest.fn((req, res) => res.json({ success: true }));
const mockGetPendingReviewInvitations = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/resumeShareController.js', () => ({
  createShareLink: mockCreateShareLink,
  listShares: mockListShares,
  revokeShare: mockRevokeShare,
  getSharedResume: mockGetSharedResume,
  createFeedback: mockCreateFeedback,
  listFeedbackForResume: mockListFeedbackForResume,
  listFeedbackForShare: mockListFeedbackForShare,
  resolveFeedback: mockResolveFeedback,
  exportFeedbackSummary: mockExportFeedbackSummary,
  getPendingReviewInvitations: mockGetPendingReviewInvitations,
}));

// Mock validation controllers
const mockValidateResumeEndpoint = jest.fn((req, res) => res.json({ success: true }));
const mockGetValidationStatus = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/resumeValidationController.js', () => ({
  validateResumeEndpoint: mockValidateResumeEndpoint,
  getValidationStatus: mockGetValidationStatus,
}));

// Mock middlewares
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-id' };
  next();
});

const mockEnsureShareAccess = jest.fn((req, res, next) => {
  req.shareToken = 'test-token';
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

jest.unstable_mockModule('../../middleware/shareAccess.js', () => ({
  ensureShareAccess: mockEnsureShareAccess,
}));

describe('resumeRoutes', () => {
  let app;
  let resumeRoutes;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    const routesModule = await import('../../routes/resumeRoutes.js');
    resumeRoutes = routesModule.default;
    app.use('/api/resume', resumeRoutes);
  });

  // Template routes
  describe('GET /api/resume/templates', () => {
    it('should call listTemplates controller', async () => {
      const response = await request(app).get('/api/resume/templates');
      expect(response.status).toBe(200);
      expect(mockListTemplates).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/resume/templates', () => {
    it('should call createTemplate controller', async () => {
      const response = await request(app).post('/api/resume/templates').send({ name: 'Test' });
      expect(response.status).toBe(200);
      expect(mockCreateTemplate).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/resume/templates/:id', () => {
    it('should call updateTemplate controller', async () => {
      const response = await request(app).put('/api/resume/templates/123').send({ name: 'Updated' });
      expect(response.status).toBe(200);
      expect(mockUpdateTemplate).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/resume/templates/:id', () => {
    it('should call deleteTemplate controller', async () => {
      const response = await request(app).delete('/api/resume/templates/123');
      expect(response.status).toBe(200);
      expect(mockDeleteTemplate).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/resume/templates/import', () => {
    it('should call importTemplate controller', async () => {
      const response = await request(app).post('/api/resume/templates/import').send({});
      expect(response.status).toBe(200);
      expect(mockImportTemplate).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  // Resume routes
  describe('GET /api/resume/resumes', () => {
    it('should call listResumes controller', async () => {
      const response = await request(app).get('/api/resume/resumes');
      expect(response.status).toBe(200);
      expect(mockListResumes).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/resume/resumes', () => {
    it('should call createResumeFromTemplate controller', async () => {
      const response = await request(app).post('/api/resume/resumes').send({});
      expect(response.status).toBe(200);
      expect(mockCreateResumeFromTemplate).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/resume/resumes/:id', () => {
    it('should call updateResume controller', async () => {
      const response = await request(app).put('/api/resume/resumes/123').send({});
      expect(response.status).toBe(200);
      expect(mockUpdateResume).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/resume/resumes/:id', () => {
    it('should call deleteResume controller', async () => {
      const response = await request(app).delete('/api/resume/resumes/123');
      expect(response.status).toBe(200);
      expect(mockDeleteResume).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  // AI-powered routes
  describe('POST /api/resume/resumes/generate', () => {
    it('should call generateAIResume controller', async () => {
      const response = await request(app).post('/api/resume/resumes/generate').send({});
      expect(response.status).toBe(200);
      expect(mockGenerateAIResume).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/resume/resumes/generate-variations', () => {
    it('should call generateResumeVariations controller', async () => {
      const response = await request(app).post('/api/resume/resumes/generate-variations').send({});
      expect(response.status).toBe(200);
      expect(mockGenerateResumeVariations).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/resume/resumes/:id/regenerate', () => {
    it('should call regenerateResumeSection controller', async () => {
      const response = await request(app).post('/api/resume/resumes/123/regenerate').send({});
      expect(response.status).toBe(200);
      expect(mockRegenerateResumeSection).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/resume/resumes/:id/ats-analysis', () => {
    it('should call analyzeATS controller', async () => {
      const response = await request(app).get('/api/resume/resumes/123/ats-analysis');
      expect(response.status).toBe(200);
      expect(mockAnalyzeATS).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  // UC-49: Skills optimization
  describe('GET /api/resume/resumes/:id/optimize-skills', () => {
    it('should call optimizeSkills controller', async () => {
      const response = await request(app).get('/api/resume/resumes/123/optimize-skills');
      expect(response.status).toBe(200);
      expect(mockOptimizeSkills).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  // UC-50: Experience tailoring
  describe('GET /api/resume/resumes/:id/tailor-experience', () => {
    it('should call tailorExperienceForJob controller', async () => {
      const response = await request(app).get('/api/resume/resumes/123/tailor-experience');
      expect(response.status).toBe(200);
      expect(mockTailorExperienceForJob).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  // UC-53: Validation routes
  describe('POST /api/resume/resumes/:id/validate', () => {
    it('should call validateResumeEndpoint controller', async () => {
      const response = await request(app).post('/api/resume/resumes/123/validate').send({});
      expect(response.status).toBe(200);
      expect(mockValidateResumeEndpoint).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/resume/resumes/:id/validation-status', () => {
    it('should call getValidationStatus controller', async () => {
      const response = await request(app).get('/api/resume/resumes/123/validation-status');
      expect(response.status).toBe(200);
      expect(mockGetValidationStatus).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  // UC-51: Export routes
  describe('GET /api/resume/resumes/:id/pdf', () => {
    it('should call generateResumePDF controller', async () => {
      const response = await request(app).get('/api/resume/resumes/123/pdf');
      expect(response.status).toBe(200);
      expect(mockGenerateResumePDF).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/resume/resumes/:id/docx', () => {
    it('should call exportResumeDocx controller', async () => {
      const response = await request(app).get('/api/resume/resumes/123/docx');
      expect(response.status).toBe(200);
      expect(mockExportResumeDocx).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/resume/resumes/:id/html', () => {
    it('should call exportResumeHtml controller', async () => {
      const response = await request(app).get('/api/resume/resumes/123/html');
      expect(response.status).toBe(200);
      expect(mockExportResumeHtml).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/resume/resumes/:id/txt', () => {
    it('should call exportResumeText controller', async () => {
      const response = await request(app).get('/api/resume/resumes/123/txt');
      expect(response.status).toBe(200);
      expect(mockExportResumeText).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  // UC-52: Version management
  describe('POST /api/resume/resumes/:id/clone', () => {
    it('should call cloneResume controller', async () => {
      const response = await request(app).post('/api/resume/resumes/123/clone').send({});
      expect(response.status).toBe(200);
      expect(mockCloneResume).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/resume/resumes/:id/compare', () => {
    it('should call compareResumes controller', async () => {
      const response = await request(app).get('/api/resume/resumes/123/compare');
      expect(response.status).toBe(200);
      expect(mockCompareResumes).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('POST /api/resume/resumes/:id/merge', () => {
    it('should call mergeResumes controller', async () => {
      const response = await request(app).post('/api/resume/resumes/123/merge').send({});
      expect(response.status).toBe(200);
      expect(mockMergeResumes).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/resume/resumes/:id/set-default', () => {
    it('should call setDefaultResume controller', async () => {
      const response = await request(app).put('/api/resume/resumes/123/set-default').send({});
      expect(response.status).toBe(200);
      expect(mockSetDefaultResume).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/resume/resumes/:id/archive', () => {
    it('should call archiveResume controller', async () => {
      const response = await request(app).put('/api/resume/resumes/123/archive').send({});
      expect(response.status).toBe(200);
      expect(mockArchiveResume).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PUT /api/resume/resumes/:id/unarchive', () => {
    it('should call unarchiveResume controller', async () => {
      const response = await request(app).put('/api/resume/resumes/123/unarchive').send({});
      expect(response.status).toBe(200);
      expect(mockUnarchiveResume).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  // UC-054: Resume sharing & feedback - Owner actions
  describe('POST /api/resume/resumes/:id/share', () => {
    it('should call createShareLink controller', async () => {
      const response = await request(app).post('/api/resume/resumes/123/share').send({});
      expect(response.status).toBe(200);
      expect(mockCreateShareLink).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/resume/resumes/:id/shares', () => {
    it('should call listShares controller', async () => {
      const response = await request(app).get('/api/resume/resumes/123/shares');
      expect(response.status).toBe(200);
      expect(mockListShares).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/resume/resumes/:id/shares/:token/revoke', () => {
    it('should call revokeShare controller', async () => {
      const response = await request(app).patch('/api/resume/resumes/123/shares/token123/revoke');
      expect(response.status).toBe(200);
      expect(mockRevokeShare).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/resume/resumes/:id/feedback', () => {
    it('should call listFeedbackForResume controller', async () => {
      const response = await request(app).get('/api/resume/resumes/123/feedback');
      expect(response.status).toBe(200);
      expect(mockListFeedbackForResume).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/resume/feedback/:feedbackId/resolve', () => {
    it('should call resolveFeedback controller', async () => {
      const response = await request(app).patch('/api/resume/feedback/fb123/resolve');
      expect(response.status).toBe(200);
      expect(mockResolveFeedback).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  describe('GET /api/resume/resumes/:id/feedback/export', () => {
    it('should call exportFeedbackSummary controller', async () => {
      const response = await request(app).get('/api/resume/resumes/123/feedback/export');
      expect(response.status).toBe(200);
      expect(mockExportFeedbackSummary).toHaveBeenCalled();
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });

  // UC-054: Public share endpoints
  describe('GET /api/resume/share/:token', () => {
    it('should call getSharedResume controller', async () => {
      const response = await request(app).get('/api/resume/share/token123');
      expect(response.status).toBe(200);
      expect(mockGetSharedResume).toHaveBeenCalled();
      expect(mockEnsureShareAccess).toHaveBeenCalled();
    });
  });

  describe('GET /api/resume/share/:token/feedback', () => {
    it('should call listFeedbackForShare controller', async () => {
      const response = await request(app).get('/api/resume/share/token123/feedback');
      expect(response.status).toBe(200);
      expect(mockListFeedbackForShare).toHaveBeenCalled();
      expect(mockEnsureShareAccess).toHaveBeenCalled();
    });
  });

  describe('POST /api/resume/share/:token/feedback', () => {
    it('should call createFeedback controller', async () => {
      const response = await request(app).post('/api/resume/share/token123/feedback').send({});
      expect(response.status).toBe(200);
      expect(mockCreateFeedback).toHaveBeenCalled();
      expect(mockEnsureShareAccess).toHaveBeenCalled();
    });
  });
});
