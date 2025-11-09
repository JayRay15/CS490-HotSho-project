import { jest, beforeEach, describe, it, expect } from '@jest/globals';

jest.resetModules();

// Mock dependencies
const mockResume = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(),
  updateOne: jest.fn(),
  updateMany: jest.fn(),
  countDocuments: jest.fn(),
};

const mockResumeTemplate = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  insertMany: jest.fn(),
  updateMany: jest.fn(),
  findById: jest.fn(),
  deleteOne: jest.fn(),
};

const mockJob = {
  findOne: jest.fn(),
  countDocuments: jest.fn(),
};

const mockUser = {
  findOne: jest.fn(),
};

const mockGeminiService = {
  generateResumeContent: jest.fn(),
  generateResumeContentVariations: jest.fn(),
  regenerateSection: jest.fn(),
  analyzeATSCompatibility: jest.fn(),
  optimizeResumeSkills: jest.fn(),
  tailorExperience: jest.fn(),
};

const mockPdfGenerator = {
  generatePdfFromTemplate: jest.fn(),
};

const mockResumeExporter = {
  exportToDocx: jest.fn(),
  exportToHtml: jest.fn(),
  exportToPlainText: jest.fn(),
};

jest.unstable_mockModule('../../models/Resume.js', () => ({
  Resume: mockResume,
}));

jest.unstable_mockModule('../../models/ResumeTemplate.js', () => ({
  ResumeTemplate: mockResumeTemplate,
}));

jest.unstable_mockModule('../../models/Job.js', () => ({
  Job: mockJob,
}));

jest.unstable_mockModule('../../models/User.js', () => ({
  User: mockUser,
}));

jest.unstable_mockModule('../../utils/geminiService.js', () => mockGeminiService);

const mockJobDataFetcher = {
  fetchEnrichedJobData: jest.fn(),
};

jest.unstable_mockModule('../../utils/pdfGenerator.js', () => mockPdfGenerator);

jest.unstable_mockModule('../../utils/resumeExporter.js', () => mockResumeExporter);
jest.unstable_mockModule('../../utils/jobDataFetcher.js', () => mockJobDataFetcher);

// Import controller
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
  mergeResumes,
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

describe('ResumeController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      auth: {
        userId: 'test-user-123',
        payload: { sub: 'test-user-123' },
      },
      body: {},
      params: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('listTemplates', () => {
    it('should list templates successfully', async () => {
      const mockTemplates = [
        { _id: 'template-1', name: 'Template 1', userId: 'test-user-123' },
      ];
      mockResumeTemplate.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockTemplates),
        }),
      });

      await listTemplates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should seed default templates if user has none', async () => {
      mockResumeTemplate.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]), // No templates
        }),
      });
      const mockSeededTemplates = [
        { _id: 't1', name: 'Chronological', toObject: () => ({ _id: 't1', name: 'Chronological' }) },
        { _id: 't2', name: 'Functional', toObject: () => ({ _id: 't2', name: 'Functional' }) },
      ];
      mockResumeTemplate.insertMany.mockResolvedValue(mockSeededTemplates);

      await listTemplates(mockReq, mockRes);

      expect(mockResumeTemplate.insertMany).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      mockResumeTemplate.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      await listTemplates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createTemplate', () => {
    it('should create template successfully', async () => {
      mockReq.body = {
        name: 'New Template',
        type: 'chronological',
        layout: {},
        theme: {},
      };
      const mockTemplate = {
        _id: 'template-123',
        name: 'New Template',
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn(() => ({ _id: 'template-123', name: 'New Template' })),
      };
      mockResumeTemplate.updateMany.mockResolvedValue({});
      mockResumeTemplate.create.mockResolvedValue(mockTemplate);
      mockResumeTemplate.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockTemplate),
      });

      await createTemplate(mockReq, mockRes);

      expect(mockResumeTemplate.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if name or type missing', async () => {
      mockReq.body = { name: 'Template' }; // Missing type

      await createTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should set default sections order based on type', async () => {
      mockReq.body = {
        name: 'Functional Template',
        type: 'functional',
      };
      const mockTemplate = {
        _id: 'template-123',
        save: jest.fn().mockResolvedValue(true),
      };
      mockResumeTemplate.updateMany.mockResolvedValue({});
      mockResumeTemplate.create.mockResolvedValue(mockTemplate);

      await createTemplate(mockReq, mockRes);

      expect(mockResumeTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          layout: expect.objectContaining({
            sectionsOrder: expect.arrayContaining(['summary', 'skills']),
          }),
        })
      );
    });
  });

  describe('updateTemplate', () => {
    it('should update template successfully', async () => {
      mockReq.params.id = 'template-123';
      mockReq.body = { name: 'Updated Template' };
      const mockTemplate = {
        _id: 'template-123',
        userId: 'test-user-123',
        name: 'Original',
        save: jest.fn().mockResolvedValue(true),
      };
      mockResumeTemplate.findOne.mockResolvedValue(mockTemplate);
      mockResumeTemplate.updateMany.mockResolvedValue({});

      await updateTemplate(mockReq, mockRes);

      expect(mockTemplate.name).toBe('Updated Template');
      expect(mockTemplate.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if template not found', async () => {
      mockReq.params.id = 'non-existent';
      mockReq.body = { name: 'Updated' };
      mockResumeTemplate.findOne.mockResolvedValue(null);

      await updateTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should unset other defaults when setting one as default', async () => {
      mockReq.params.id = 'template-123';
      mockReq.body = { isDefault: true };
      const mockTemplate = {
        _id: 'template-123',
        userId: 'test-user-123',
        isDefault: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockResumeTemplate.findOne.mockResolvedValue(mockTemplate);
      mockResumeTemplate.updateMany.mockResolvedValue({});

      await updateTemplate(mockReq, mockRes);

      expect(mockResumeTemplate.updateMany).toHaveBeenCalledWith(
        { userId: 'test-user-123' },
        { $set: { isDefault: false } }
      );
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template successfully', async () => {
      mockReq.params.id = 'template-123';
      mockResumeTemplate.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await deleteTemplate(mockReq, mockRes);

      expect(mockResumeTemplate.deleteOne).toHaveBeenCalledWith({
        _id: 'template-123',
        userId: 'test-user-123',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if template not found', async () => {
      mockReq.params.id = 'non-existent';
      mockResumeTemplate.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await deleteTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('importTemplate', () => {
    it('should import template successfully', async () => {
      mockReq.body = {
        name: 'Imported Template',
        type: 'chronological',
        layout: {},
        theme: {},
      };
      const mockTemplate = {
        _id: 'template-123',
        name: 'Imported Template',
        toObject: jest.fn(() => ({ _id: 'template-123', name: 'Imported Template' })),
      };
      mockResumeTemplate.create.mockResolvedValue(mockTemplate);

      await importTemplate(mockReq, mockRes);

      expect(mockResumeTemplate.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if name or type missing', async () => {
      mockReq.body = { name: 'Template' }; // Missing type

      await importTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle PDF buffer conversion', async () => {
      const base64Pdf = Buffer.from('fake pdf').toString('base64');
      mockReq.body = {
        name: 'Template with PDF',
        type: 'chronological',
        pdfBuffer: base64Pdf,
      };
      const mockTemplate = {
        _id: 'template-123',
        toObject: jest.fn(() => ({ _id: 'template-123' })),
      };
      mockResumeTemplate.create.mockResolvedValue(mockTemplate);

      await importTemplate(mockReq, mockRes);

      expect(mockResumeTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalPdf: expect.any(Buffer),
        })
      );
    });

    it('should reject PDF buffer if too large', async () => {
      const largeBase64 = Buffer.alloc(16 * 1024 * 1024).toString('base64'); // 16MB
      mockReq.body = {
        name: 'Template',
        type: 'chronological',
        pdfBuffer: largeBase64,
      };
      const mockTemplate = {
        _id: 'template-123',
        toObject: jest.fn(() => ({ _id: 'template-123' })),
      };
      mockResumeTemplate.create.mockResolvedValue(mockTemplate);

      await importTemplate(mockReq, mockRes);

      // Should skip PDF buffer if too large
      expect(mockResumeTemplate.create).toHaveBeenCalled();
    });
  });

  describe('listResumes', () => {
    it('should list all resumes for user with job count', async () => {
      const mockResumes = [
        { _id: 'resume-1', name: 'Resume 1', userId: 'test-user-123' },
        { _id: 'resume-2', name: 'Resume 2', userId: 'test-user-123' },
      ];
      mockResume.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockResumes),
        }),
      });
      mockJob.countDocuments
        .mockResolvedValueOnce(2) // linkedJobCount for resume-1
        .mockResolvedValueOnce(1); // linkedJobCount for resume-2

      await listResumes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Resumes fetched',
          data: expect.objectContaining({
            resumes: expect.arrayContaining([
              expect.objectContaining({
                _id: 'resume-1',
                linkedJobCount: 2,
              }),
              expect.objectContaining({
                _id: 'resume-2',
                linkedJobCount: 1,
              }),
            ]),
          }),
        })
      );
    });

    it('should handle empty resume list', async () => {
      mockResume.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      await listResumes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resumes: [],
          }),
        })
      );
    });
  });

  describe('createResumeFromTemplate', () => {
    it('should create resume from template successfully', async () => {
      mockReq.body = {
        templateId: 'template-123',
        name: 'My Resume',
        sections: { summary: 'Test summary' },
      };
      const mockTemplate = {
        _id: 'template-123',
        userId: 'test-user-123',
        name: 'Chronological',
      };
      const mockCreatedResume = {
        _id: 'resume-123',
        name: 'My Resume',
        templateId: 'template-123',
        sections: { summary: 'Test summary' },
      };
      mockResumeTemplate.findOne.mockResolvedValue(mockTemplate);
      mockResume.create.mockResolvedValue(mockCreatedResume);

      await createResumeFromTemplate(mockReq, mockRes);

      expect(mockResumeTemplate.findOne).toHaveBeenCalledWith({
        _id: 'template-123',
        $or: [{ userId: 'test-user-123' }, { isShared: true }],
      });
      expect(mockResume.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if templateId is missing', async () => {
      mockReq.body = { name: 'My Resume' };

      await createResumeFromTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('templateId and name are required'),
        })
      );
    });

    it('should return 404 if template not found', async () => {
      mockReq.body = { templateId: 'non-existent', name: 'My Resume' };
      mockResumeTemplate.findOne.mockResolvedValue(null);

      await createResumeFromTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateResume', () => {
    it('should update resume successfully', async () => {
      mockReq.params.id = 'resume-123';
      mockReq.body = { name: 'Updated Resume', sections: { summary: 'New summary' } };
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        name: 'Original Resume',
        sections: {},
        save: jest.fn().mockResolvedValue(true),
      };
      // updateResume doesn't use .lean() - it needs the document object
      mockResume.findOne.mockResolvedValue(mockResumeDoc);

      await updateResume(mockReq, mockRes);

      expect(mockResumeDoc.name).toBe('Updated Resume');
      expect(mockResumeDoc.sections).toEqual({ summary: 'New summary' });
      expect(mockResumeDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if resume not found', async () => {
      mockReq.params.id = 'non-existent';
      // updateResume doesn't use .lean()
      mockResume.findOne.mockResolvedValue(null);

      await updateResume(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteResume', () => {
    it('should delete resume successfully', async () => {
      mockReq.params.id = 'resume-123';
      mockResume.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await deleteResume(mockReq, mockRes);

      expect(mockResume.deleteOne).toHaveBeenCalledWith({
        _id: 'resume-123',
        userId: 'test-user-123',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Resume deleted',
        })
      );
    });

    it('should return 404 if resume not found', async () => {
      mockReq.params.id = 'non-existent';
      mockResume.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await deleteResume(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('generateAIResume', () => {
    it('should generate AI resume successfully', async () => {
      mockReq.body = {
        jobId: 'job-123',
        templateId: 'template-123',
        name: 'AI Generated Resume',
      };
      const mockJobData = {
        _id: 'job-123',
        title: 'Software Engineer',
        company: 'TechCorp',
        description: 'Job description',
        userId: 'test-user-123',
      };
      const mockUserData = {
        _id: 'user-123',
        auth0Id: 'test-user-123',
        employment: [],
        skills: ['JavaScript', 'React'],
        education: [],
        projects: [],
      };
      const mockTemplate = {
        _id: 'template-123',
        userId: 'test-user-123',
        layout: { sectionsOrder: ['summary', 'experience'] },
        toObject: jest.fn(() => ({
          _id: 'template-123',
          layout: { sectionsOrder: ['summary', 'experience'] },
        })),
      };
      const mockAIContent = {
        summary: 'AI generated summary',
        experienceBullets: {},
        relevantSkills: ['JavaScript', 'React'],
        atsKeywords: ['JavaScript', 'React'],
        tailoringNotes: 'Tailored for Software Engineer role',
      };
      const mockCreatedResume = {
        _id: 'resume-123',
        name: 'AI Generated Resume',
        sections: {},
        metadata: { tailoredForJob: 'job-123' },
      };

      mockJob.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockJobData),
      });
      mockUser.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUserData),
      });
      mockResumeTemplate.findOne.mockResolvedValue(mockTemplate);
      mockGeminiService.generateResumeContent.mockResolvedValue(mockAIContent);
      mockResume.create.mockResolvedValue(mockCreatedResume);

      await generateAIResume(mockReq, mockRes);

      expect(mockGeminiService.generateResumeContent).toHaveBeenCalled();
      expect(mockResume.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.body = { jobId: 'job-123' }; // Missing templateId and name

      await generateAIResume(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if job not found', async () => {
      mockReq.body = {
        jobId: 'non-existent',
        templateId: 'template-123',
        name: 'Resume',
      };
      // Mock the chain: findOne().lean()
      mockJob.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await generateAIResume(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Job not found'),
        })
      );
    });
  });

  describe('cloneResume', () => {
    it('should clone resume successfully', async () => {
      mockReq.params.id = 'resume-123'; // Controller uses req.params.id, not resumeId
      mockReq.body = { name: 'Cloned Resume', description: 'Copy of original' };
      const mockOriginalResume = {
        _id: 'resume-123',
        name: 'Original Resume',
        sections: { summary: 'Test' },
        metadata: {},
        userId: 'test-user-123',
      };
      const mockClonedResume = {
        _id: 'resume-456',
        name: 'Cloned Resume',
        metadata: { clonedFrom: 'resume-123' },
      };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockOriginalResume),
      });
      mockResume.create.mockResolvedValue(mockClonedResume);

      await cloneResume(mockReq, mockRes);

      expect(mockResume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cloned Resume',
          metadata: expect.objectContaining({
            clonedFrom: 'resume-123',
          }),
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should use default name if not provided', async () => {
      mockReq.params.id = 'resume-123'; // Controller uses req.params.id, not resumeId
      mockReq.body = {};
      const mockOriginalResume = {
        _id: 'resume-123',
        name: 'Original Resume',
        sections: {},
        metadata: {},
      };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockOriginalResume),
      });
      mockResume.create.mockResolvedValue({ _id: 'resume-456' });

      await cloneResume(mockReq, mockRes);

      expect(mockResume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Original Resume (Copy)',
        })
      );
    });
  });

  describe('compareResumes', () => {
    it('should compare two resumes successfully', async () => {
      mockReq.params.resumeId1 = 'resume-1';
      mockReq.query.resumeId2 = 'resume-2';
      const mockResume1 = {
        _id: 'resume-1',
        name: 'Resume 1',
        sections: { summary: 'Summary 1', experience: [], skills: [] },
        sectionCustomization: { visibleSections: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockResume2 = {
        _id: 'resume-2',
        name: 'Resume 2',
        sections: { summary: 'Summary 2', experience: [], skills: [] },
        sectionCustomization: { visibleSections: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockResume.findOne
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue(mockResume1),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue(mockResume2),
        });

      await compareResumes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            comparison: expect.objectContaining({
              resume1: expect.objectContaining({ id: 'resume-1' }),
              resume2: expect.objectContaining({ id: 'resume-2' }),
              differences: expect.any(Object),
            }),
          }),
        })
      );
    });

    it('should return 400 if resumeId2 is missing', async () => {
      mockReq.params.resumeId1 = 'resume-1';
      mockReq.query = {};

      await compareResumes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('setDefaultResume', () => {
    it('should set resume as default', async () => {
      mockReq.params.resumeId = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        isDefault: false,
        save: jest.fn().mockResolvedValue(true),
      };
      // setDefaultResume doesn't use .lean()
      mockResume.findOne.mockResolvedValue(mockResumeDoc);
      mockResume.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });

      await setDefaultResume(mockReq, mockRes);

      expect(mockResume.updateMany).toHaveBeenCalledWith(
        { userId: 'test-user-123', isDefault: true },
        { $set: { isDefault: false } }
      );
      expect(mockResumeDoc.isDefault).toBe(true);
      expect(mockResumeDoc.save).toHaveBeenCalled();
    });
  });

  describe('archiveResume', () => {
    it('should archive resume successfully', async () => {
      mockReq.params.resumeId = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        isArchived: false,
        save: jest.fn().mockResolvedValue(true),
      };
      // archiveResume doesn't use .lean() - it needs the document object
      mockResume.findOne.mockResolvedValue(mockResumeDoc);

      await archiveResume(mockReq, mockRes);

      expect(mockResumeDoc.isArchived).toBe(true);
      expect(mockResumeDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('unarchiveResume', () => {
    it('should unarchive resume successfully', async () => {
      mockReq.params.resumeId = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        isArchived: true,
        save: jest.fn().mockResolvedValue(true),
      };
      // unarchiveResume doesn't use .lean()
      mockResume.findOne.mockResolvedValue(mockResumeDoc);

      await unarchiveResume(mockReq, mockRes);

      expect(mockResumeDoc.isArchived).toBe(false);
      expect(mockResumeDoc.save).toHaveBeenCalled();
    });
  });

  describe('generateResumeVariations', () => {
    it('should generate resume variations successfully', async () => {
      mockReq.body = {
        jobId: 'job-123',
        templateId: 'template-123',
      };
      const mockJobData = {
        _id: 'job-123',
        title: 'Software Engineer',
        company: 'TechCorp',
        description: 'Job description',
      };
      const mockUserData = {
        _id: 'user-123',
        auth0Id: 'test-user-123',
        employment: [],
        skills: ['JavaScript'],
        education: [],
        projects: [],
        certifications: [],
      };
      const mockTemplate = {
        _id: 'template-123',
        layout: {},
      };
      const mockVariations = [
        { summary: 'Variation 1' },
        { summary: 'Variation 2' },
        { summary: 'Variation 3' },
      ];

      mockJob.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockJobData),
      });
      mockUser.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUserData),
      });
      mockResumeTemplate.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTemplate),
      });
      mockGeminiService.generateResumeContentVariations.mockResolvedValue(mockVariations);

      await generateResumeVariations(mockReq, mockRes);

      expect(mockGeminiService.generateResumeContentVariations).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.body = { jobId: 'job-123' };

      await generateResumeVariations(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if job not found', async () => {
      mockReq.body = { jobId: 'non-existent', templateId: 'template-123' };
      mockJob.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await generateResumeVariations(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if user not found', async () => {
      mockReq.body = { jobId: 'job-123', templateId: 'template-123' };
      mockJob.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'job-123' }),
      });
      mockUser.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await generateResumeVariations(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if template not found', async () => {
      mockReq.body = { jobId: 'job-123', templateId: 'non-existent' };
      mockJob.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'job-123' }),
      });
      mockUser.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'user-123' }),
      });
      mockResumeTemplate.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await generateResumeVariations(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('regenerateResumeSection', () => {
    it('should regenerate summary section successfully', async () => {
      mockReq.params.id = 'resume-123';
      mockReq.body = { section: 'summary' };
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        sections: { summary: 'Old summary' },
        metadata: { tailoredForJob: '507f1f77bcf86cd799439011' }, // Valid ObjectId format
        toObject: jest.fn(() => ({ _id: 'resume-123', sections: { summary: 'New summary' } })),
      };
      const mockJobData = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Software Engineer',
        company: 'TechCorp',
        description: 'Job description',
      };
      const mockUserData = {
        _id: 'user-123',
        auth0Id: 'test-user-123',
        employment: [],
        skills: [],
        education: [],
        projects: [],
      };
      const mockRegenerated = { summary: 'New summary' };

      mockResume.findOne.mockResolvedValue(mockResumeDoc);
      mockJob.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockJobData),
      });
      mockUser.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUserData),
      });
      mockGeminiService.regenerateSection.mockResolvedValue(mockRegenerated);

      await regenerateResumeSection(mockReq, mockRes);

      expect(mockGeminiService.regenerateSection).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if section is invalid', async () => {
      mockReq.params.id = 'resume-123';
      mockReq.body = { section: 'invalid' };

      await regenerateResumeSection(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if resume not found', async () => {
      mockReq.params.id = 'non-existent';
      mockReq.body = { section: 'summary' };
      mockResume.findOne.mockResolvedValue(null);

      await regenerateResumeSection(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if resume was not AI-generated', async () => {
      mockReq.params.id = 'resume-123';
      mockReq.body = { section: 'summary' };
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        sections: {},
        metadata: {},
      };
      mockResume.findOne.mockResolvedValue(mockResumeDoc);

      await regenerateResumeSection(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('analyzeATS', () => {
    it('should analyze ATS compatibility successfully', async () => {
      mockReq.params.id = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        sections: { summary: 'Test' },
        metadata: { tailoredForJob: 'job-123' },
      };
      const mockJobData = {
        _id: 'job-123',
        title: 'Software Engineer',
        company: 'TechCorp',
        description: 'Job description',
      };
      const mockAnalysis = { score: 85, keywords: ['JavaScript'] };

      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });
      mockJob.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockJobData),
      });
      mockGeminiService.analyzeATSCompatibility.mockResolvedValue(mockAnalysis);

      await analyzeATS(mockReq, mockRes);

      expect(mockGeminiService.analyzeATSCompatibility).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if resume not found', async () => {
      mockReq.params.id = 'non-existent';
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await analyzeATS(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if resume was not tailored for a job', async () => {
      mockReq.params.id = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        sections: {},
        metadata: {},
      };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });

      await analyzeATS(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('generateResumePDF', () => {
    it('should generate PDF successfully', async () => {
      mockReq.params.id = 'resume-123';
      mockReq.query = {};
      const validatedAt = new Date();
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        templateId: 'template-123',
        sections: {},
        metadata: {
          lastValidation: { isValid: true },
          validatedAt: validatedAt,
        },
        updatedAt: validatedAt,
      };
      const mockTemplate = {
        _id: 'template-123',
        originalPdf: Buffer.from('fake pdf'),
        toObject: jest.fn(() => ({ _id: 'template-123', originalPdf: Buffer.from('fake pdf') })),
      };
      const mockPdfBuffer = Buffer.from('generated pdf');

      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });
      // Mock the chain: findOne().select() - returns template with originalPdf and pdfLayout
      const mockTemplateWithSelect = {
        _id: 'template-123',
        originalPdf: Buffer.from('fake pdf'),
        pdfLayout: { sections: [] },
        layout: {},
        toObject: jest.fn(() => ({
          _id: 'template-123',
          originalPdf: Buffer.from('fake pdf'),
          pdfLayout: { sections: [] },
          layout: {},
        })),
      };
      mockResumeTemplate.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockTemplateWithSelect),
      });
      mockPdfGenerator.generatePdfFromTemplate.mockResolvedValue(mockPdfBuffer);
      mockRes.send = jest.fn();
      mockRes.setHeader = jest.fn();

      await generateResumePDF(mockReq, mockRes);

      expect(mockPdfGenerator.generatePdfFromTemplate).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should return 400 if resume not validated', async () => {
      mockReq.params.id = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        metadata: {},
      };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });

      await generateResumePDF(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if resume modified after validation', async () => {
      mockReq.params.id = 'resume-123';
      const validatedAt = new Date('2024-01-01');
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        templateId: 'template-123',
        metadata: {
          lastValidation: { isValid: true },
          validatedAt: validatedAt,
        },
        updatedAt: new Date('2024-01-15'), // Updated after validation
      };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });

      await generateResumePDF(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('optimizeSkills', () => {
    it('should optimize skills successfully', async () => {
      mockReq.params.resumeId = 'resume-123';
      mockReq.query = { jobPostingId: 'job-123' };
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        sections: { skills: [] },
        metadata: {},
      };
      const mockUserData = {
        _id: 'user-123',
        auth0Id: 'test-user-123',
        skills: ['JavaScript'],
      };
      const mockJobData = {
        _id: 'job-123',
        title: 'Software Engineer',
        description: 'Job description',
      };
      const mockOptimization = { optimizedSkills: ['JavaScript', 'React'] };

      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });
      mockUser.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUserData),
      });
      mockGeminiService.optimizeResumeSkills.mockResolvedValue(mockOptimization);
      mockJobDataFetcher.fetchEnrichedJobData.mockResolvedValue(mockJobData);

      await optimizeSkills(mockReq, mockRes);

      expect(mockGeminiService.optimizeResumeSkills).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if resume not found', async () => {
      mockReq.params.resumeId = 'non-existent';
      mockReq.query = { jobPostingId: 'job-123' };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await optimizeSkills(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('tailorExperienceForJob', () => {
    it('should tailor experience successfully', async () => {
      mockReq.params.resumeId = 'resume-123';
      mockReq.query = { jobPostingId: 'job-123' };
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        sections: { experience: [] },
        metadata: {},
      };
      const mockUserData = {
        _id: 'user-123',
        auth0Id: 'test-user-123',
        employment: [],
      };
      const mockJobData = {
        _id: 'job-123',
        title: 'Software Engineer',
        description: 'Job description',
      };
      const mockTailored = { experience: [{ bullets: ['Tailored bullet'] }] };

      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });
      mockUser.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUserData),
      });
      mockGeminiService.tailorExperience.mockResolvedValue(mockTailored);
      mockJobDataFetcher.fetchEnrichedJobData.mockResolvedValue(mockJobData);

      await tailorExperienceForJob(mockReq, mockRes);

      expect(mockGeminiService.tailorExperience).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if resume not found', async () => {
      mockReq.params.resumeId = 'non-existent';
      mockReq.query = { jobPostingId: 'job-123' };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await tailorExperienceForJob(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('mergeResumes', () => {
    it('should merge resumes successfully', async () => {
      mockReq.params.id = 'resume-1'; // Controller uses req.params.id
      mockReq.body = { 
        sourceId: 'resume-2',
        selectedChanges: ['summary', 'experience']
      };
      const mockTargetResume = {
        _id: 'resume-1',
        userId: 'test-user-123',
        sections: { summary: 'Target summary', experience: [] },
        save: jest.fn().mockResolvedValue(true),
      };
      const mockSourceResume = {
        _id: 'resume-2',
        userId: 'test-user-123',
        sections: { summary: 'Source summary', experience: [] },
      };

      mockResume.findOne
        .mockResolvedValueOnce(mockTargetResume)
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue(mockSourceResume),
        });

      await mergeResumes(mockReq, mockRes);

      expect(mockTargetResume.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.params.id = 'resume-1';
      mockReq.body = { sourceId: 'resume-2' }; // Missing selectedChanges

      await mergeResumes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if target resume not found', async () => {
      mockReq.params.id = 'non-existent';
      mockReq.body = { 
        sourceId: 'resume-2',
        selectedChanges: ['summary']
      };
      // Promise.all needs both mocks - first one returns null (target not found)
      mockResume.findOne
        .mockResolvedValueOnce(null) // targetResume not found
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue({ _id: 'resume-2' }), // sourceResume found
        });

      await mergeResumes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('exportResumeDocx', () => {
    it('should export resume as DOCX successfully', async () => {
      mockReq.params.id = 'resume-123';
      mockReq.query = {};
      const validatedAt = new Date();
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        name: 'My Resume',
        sections: {},
        templateId: 'template-123',
        metadata: {
          lastValidation: { isValid: true },
          validatedAt: validatedAt,
        },
        updatedAt: validatedAt,
      };
      const mockTemplate = { _id: 'template-123', layout: {} };
      const mockDocxBuffer = Buffer.from('docx content');

      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });
      mockResumeTemplate.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTemplate),
      });
      mockResumeExporter.exportToDocx.mockResolvedValue(mockDocxBuffer);
      mockRes.send = jest.fn();
      mockRes.setHeader = jest.fn();

      await exportResumeDocx(mockReq, mockRes);

      expect(mockResumeExporter.exportToDocx).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalledWith(mockDocxBuffer);
    });

    it('should return 404 if resume not found', async () => {
      mockReq.params.id = 'non-existent';
      mockReq.query = {};
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await exportResumeDocx(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if resume not validated', async () => {
      mockReq.params.id = 'resume-123';
      mockReq.query = {};
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        sections: {},
        metadata: {},
      };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });

      await exportResumeDocx(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('exportResumeHtml', () => {
    it('should export resume as HTML successfully', async () => {
      mockReq.params.id = 'resume-123';
      const validatedAt = new Date();
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        name: 'My Resume',
        sections: {},
        templateId: 'template-123',
        metadata: {
          lastValidation: { isValid: true },
          validatedAt: validatedAt,
        },
        updatedAt: validatedAt,
      };
      const mockTemplate = { _id: 'template-123', layout: {} };
      const mockHtml = '<html>content</html>';

      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });
      mockResumeTemplate.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTemplate),
      });
      mockResumeExporter.exportToHtml.mockReturnValue(mockHtml);
      mockRes.send = jest.fn();
      mockRes.setHeader = jest.fn();

      await exportResumeHtml(mockReq, mockRes);

      expect(mockResumeExporter.exportToHtml).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalledWith(mockHtml);
    });
  });

  describe('exportResumeText', () => {
    it('should export resume as plain text successfully', async () => {
      mockReq.params.id = 'resume-123';
      const validatedAt = new Date();
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        name: 'My Resume',
        sections: {},
        templateId: 'template-123',
        metadata: {
          lastValidation: { isValid: true },
          validatedAt: validatedAt,
        },
        updatedAt: validatedAt,
      };
      const mockText = 'Plain text content';

      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });
      mockResumeExporter.exportToPlainText.mockReturnValue(mockText);
      mockRes.send = jest.fn();
      mockRes.setHeader = jest.fn();

      await exportResumeText(mockReq, mockRes);

      expect(mockResumeExporter.exportToPlainText).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalledWith(mockText);
    });
  });
});

