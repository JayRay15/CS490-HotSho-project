import { jest, beforeEach, describe, it, expect } from '@jest/globals';

jest.resetModules();

// Mock dependencies
const mockCoverLetter = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(),
  updateMany: jest.fn(),
};

const mockCoverLetterTemplate = {
  findOne: jest.fn(),
};

const mockJob = {
  countDocuments: jest.fn(),
  findOne: jest.fn().mockImplementation(() => ({ lean: jest.fn().mockResolvedValue(null) })),
};

const mockUser = {
  findOne: jest.fn(),
};

// Mock responseFormat utilities so controller uses deterministic behavior
const mockSendResponse = jest.fn((res, response, statusCode) => {
  // emulate controller's expected behavior: set status and json
  if (res && typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode || 200);
    res.json(response);
  }
});
const mockSuccessResponse = (message, data, statusCode = 200) => ({ response: { success: true, message, data }, statusCode });
const mockErrorResponse = (message, statusCode = 500, code = 'ERR') => ({ response: { success: false, message, code }, statusCode });

// Mock Gemini services
const mockGeminiServices = {
  checkSpellingAndGrammar: jest.fn().mockResolvedValue({ errors: [] }),
  getSynonymSuggestions: jest.fn().mockResolvedValue({ suggestions: [] }),
  analyzeReadability: jest.fn().mockResolvedValue({ score: 8 }),
  suggestRestructuring: jest.fn().mockResolvedValue({ suggestions: [] })
};

// Mock experience analyzer
const mockExperienceAnalyzer = {
  selectRelevantExperiences: jest.fn().mockReturnValue([]),
  generateExperienceNarrative: jest.fn().mockReturnValue('narrative'),
  connectToJobRequirements: jest.fn().mockReturnValue({}),
  suggestAdditionalExperiences: jest.fn().mockReturnValue([]),
  scoreExperiencePackage: jest.fn().mockReturnValue(0),
  generateAlternativePresentations: jest.fn().mockReturnValue([]),
  quantifyAchievements: jest.fn().mockReturnValue([])
};

jest.unstable_mockModule('../../models/User.js', () => ({
  User: mockUser,
}));

jest.unstable_mockModule('../../utils/responseFormat.js', () => ({
  errorResponse: mockErrorResponse,
  sendResponse: mockSendResponse,
  successResponse: mockSuccessResponse,
  ERROR_CODES: {
    DATABASE_ERROR: 'DB_ERR',
    NOT_FOUND: 'NOT_FOUND',
    MISSING_REQUIRED_FIELD: 'MISSING',
    INVALID_INPUT: 'INVALID',
    EXPORT_ERROR: 'EXPORT_ERR',
    SERVER_ERROR: 'SERVER_ERR',
    VALIDATION_ERROR: 'VAL_ERR'
  }
}));

// Mock cover letter exporter helpers used by export endpoints
const mockExporters = {
  exportCoverLetterToPdf: jest.fn().mockResolvedValue(Buffer.from('PDF')),
  exportCoverLetterToDocx: jest.fn().mockResolvedValue(Buffer.from('DOCX')),
  exportCoverLetterToHtml: jest.fn().mockReturnValue('<html>ok</html>'),
  exportCoverLetterToPlainText: jest.fn().mockReturnValue('plain text'),
  generateEmailTemplate: jest.fn().mockReturnValue({ subject: 'Hello', body: 'Body' }),
  generateCoverLetterFilename: jest.fn().mockReturnValue('coverletter.pdf')
};

jest.unstable_mockModule('../../utils/coverLetterExporter.js', () => (mockExporters));

jest.unstable_mockModule('../../utils/geminiService.js', () => (mockGeminiServices));

jest.unstable_mockModule('../../utils/experienceAnalyzer.js', () => (mockExperienceAnalyzer));

jest.unstable_mockModule('../../models/CoverLetter.js', () => ({
  CoverLetter: mockCoverLetter,
}));

jest.unstable_mockModule('../../models/CoverLetterTemplate.js', () => ({
  CoverLetterTemplate: mockCoverLetterTemplate,
}));

jest.unstable_mockModule('../../models/Job.js', () => ({
  Job: mockJob,
}));

// Import controller
const {
  listCoverLetters,
  createCoverLetterFromTemplate,
  getCoverLetterById,
  updateCoverLetter,
  deleteCoverLetter,
  setDefaultCoverLetter,
  archiveCoverLetter,
  unarchiveCoverLetter,
  cloneCoverLetter,
  exportCoverLetterAsPdf,
  exportCoverLetterAsDocx,
  exportCoverLetterAsHtml,
  exportCoverLetterAsText,
  generateCoverLetterEmailTemplate,
  checkCoverLetterSpelling,
  getCoverLetterSynonyms,
  analyzeCoverLetterReadability,
  getSentenceRestructuring,
  saveCoverLetterVersion,
  getCoverLetterHistory,
  analyzeExperienceForCoverLetter
} = await import('../coverLetterController.js');

describe('CoverLetterController', () => {
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

  describe('listCoverLetters', () => {
    it('should list all cover letters with job count', async () => {
      const mockCoverLetters = [
        { _id: 'cl-1', name: 'Cover Letter 1', userId: 'test-user-123' },
        { _id: 'cl-2', name: 'Cover Letter 2', userId: 'test-user-123' },
      ];
      mockCoverLetter.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockCoverLetters),
        }),
      });
      mockJob.countDocuments
        .mockResolvedValueOnce(3) // linkedJobCount for cl-1
        .mockResolvedValueOnce(1); // linkedJobCount for cl-2

      await listCoverLetters(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Cover letters fetched',
          data: expect.objectContaining({
            coverLetters: expect.arrayContaining([
              expect.objectContaining({
                _id: 'cl-1',
                linkedJobCount: 3,
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('createCoverLetterFromTemplate', () => {
    it('should create cover letter successfully', async () => {
      mockReq.body = {
        name: 'My Cover Letter',
        content: 'Dear Hiring Manager...',
        templateId: 'template-123',
      };
      const mockTemplate = {
        _id: 'template-123',
        userId: 'test-user-123',
        style: 'formal',
        usageCount: 0,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockCreatedCoverLetter = {
        _id: 'cl-123',
        name: 'My Cover Letter',
        content: 'Dear Hiring Manager...',
      };
      mockCoverLetterTemplate.findOne.mockResolvedValue(mockTemplate);
      mockCoverLetter.create.mockResolvedValue(mockCreatedCoverLetter);

      await createCoverLetterFromTemplate(mockReq, mockRes);

      expect(mockCoverLetterTemplate.findOne).toHaveBeenCalled();
      expect(mockTemplate.usageCount).toBe(1);
      expect(mockTemplate.save).toHaveBeenCalled();
      expect(mockCoverLetter.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if name or content is missing', async () => {
      mockReq.body = { name: 'My Cover Letter' }; // Missing content

      await createCoverLetterFromTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('name and content are required'),
        })
      );
    });

    it('should use template style if no style provided', async () => {
      mockReq.body = {
        name: 'My Cover Letter',
        content: 'Content',
        templateId: 'template-123',
      };
      const mockTemplate = {
        _id: 'template-123',
        style: 'modern',
        usageCount: 0,
        save: jest.fn().mockResolvedValue(true),
      };
      mockCoverLetterTemplate.findOne.mockResolvedValue(mockTemplate);
      mockCoverLetter.create.mockResolvedValue({ _id: 'cl-123' });

      await createCoverLetterFromTemplate(mockReq, mockRes);

      expect(mockCoverLetter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          style: 'modern',
        })
      );
    });
  });

  describe('getCoverLetterById', () => {
    it('should get cover letter by id', async () => {
      mockReq.params.id = 'cl-123';
      const mockCoverLetterDoc = {
        _id: 'cl-123',
        name: 'My Cover Letter',
        content: 'Content',
        userId: 'test-user-123',
      };
      mockCoverLetter.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCoverLetterDoc),
      });

      await getCoverLetterById(mockReq, mockRes);

      expect(mockCoverLetter.findOne).toHaveBeenCalledWith({
        _id: 'cl-123',
        userId: 'test-user-123',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if cover letter not found', async () => {
      mockReq.params.id = 'non-existent';
      mockCoverLetter.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await getCoverLetterById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateCoverLetter', () => {
    it('should update cover letter successfully', async () => {
      mockReq.params.id = 'cl-123';
      mockReq.body = { content: 'Updated content', name: 'Updated name' };
      const mockCoverLetterDoc = {
        _id: 'cl-123',
        userId: 'test-user-123',
        name: 'Original',
        content: 'Original content',
        save: jest.fn().mockResolvedValue(true),
      };
      // updateCoverLetter doesn't use .lean() - it needs the document object
      mockCoverLetter.findOne.mockResolvedValue(mockCoverLetterDoc);

      await updateCoverLetter(mockReq, mockRes);

      expect(mockCoverLetterDoc.content).toBe('Updated content');
      expect(mockCoverLetterDoc.name).toBe('Updated name');
      expect(mockCoverLetterDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteCoverLetter', () => {
    it('should delete cover letter successfully', async () => {
      mockReq.params.id = 'cl-123';
      mockCoverLetter.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await deleteCoverLetter(mockReq, mockRes);

      expect(mockCoverLetter.deleteOne).toHaveBeenCalledWith({
        _id: 'cl-123',
        userId: 'test-user-123',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if cover letter not found', async () => {
      mockReq.params.id = 'non-existent';
      mockCoverLetter.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await deleteCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('setDefaultCoverLetter', () => {
    it('should set cover letter as default', async () => {
      mockReq.params.id = 'cl-123';
      const mockCoverLetterDoc = {
        _id: 'cl-123',
        userId: 'test-user-123',
        isDefault: false,
        save: jest.fn().mockResolvedValue(true),
      };
      // setDefaultCoverLetter doesn't use .lean()
      mockCoverLetter.findOne.mockResolvedValue(mockCoverLetterDoc);
      mockCoverLetter.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });

      await setDefaultCoverLetter(mockReq, mockRes);

      expect(mockCoverLetter.updateMany).toHaveBeenCalledWith(
        { userId: 'test-user-123', _id: { $ne: 'cl-123' } },
        { $set: { isDefault: false } }
      );
      expect(mockCoverLetterDoc.isDefault).toBe(true);
      expect(mockCoverLetterDoc.save).toHaveBeenCalled();
    });
  });

  describe('archiveCoverLetter', () => {
    it('should archive cover letter successfully', async () => {
      mockReq.params.id = 'cl-123';
      const mockCoverLetterDoc = {
        _id: 'cl-123',
        userId: 'test-user-123',
        isArchived: false,
        save: jest.fn().mockResolvedValue(true),
      };
      // archiveCoverLetter doesn't use .lean()
      mockCoverLetter.findOne.mockResolvedValue(mockCoverLetterDoc);

      await archiveCoverLetter(mockReq, mockRes);

      expect(mockCoverLetterDoc.isArchived).toBe(true);
      expect(mockCoverLetterDoc.save).toHaveBeenCalled();
    });
  });

  describe('unarchiveCoverLetter', () => {
    it('should unarchive cover letter successfully', async () => {
      mockReq.params.id = 'cl-123';
      const mockCoverLetterDoc = {
        _id: 'cl-123',
        userId: 'test-user-123',
        isArchived: true,
        save: jest.fn().mockResolvedValue(true),
      };
      // unarchiveCoverLetter doesn't use .lean()
      mockCoverLetter.findOne.mockResolvedValue(mockCoverLetterDoc);

      await unarchiveCoverLetter(mockReq, mockRes);

      expect(mockCoverLetterDoc.isArchived).toBe(false);
      expect(mockCoverLetterDoc.save).toHaveBeenCalled();
    });
  });

  describe('cloneCoverLetter', () => {
    it('should clone cover letter successfully', async () => {
      mockReq.params.id = 'cl-123';
      mockReq.body = { name: 'Cloned Cover Letter' };
      const mockOriginal = {
        _id: 'cl-123',
        name: 'Original',
        content: 'Content',
        templateId: 'template-123',
        jobId: 'job-123',
        metadata: {},
        userId: 'test-user-123',
      };
      const mockCloned = {
        _id: 'cl-456',
        name: 'Cloned Cover Letter',
        metadata: { clonedFrom: 'cl-123' },
      };
      // cloneCoverLetter doesn't use .lean()
      mockCoverLetter.findOne.mockResolvedValue(mockOriginal);
      mockCoverLetter.create.mockResolvedValue(mockCloned);

      await cloneCoverLetter(mockReq, mockRes);

      expect(mockCoverLetter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cloned Cover Letter',
          content: 'Content',
          metadata: expect.objectContaining({
            clonedFrom: 'cl-123',
          }),
          isDefault: false,
          isArchived: false,
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should use default name if not provided', async () => {
      mockReq.params.id = 'cl-123';
      mockReq.body = {};
      const mockOriginal = {
        _id: 'cl-123',
        name: 'Original',
        content: 'Content',
        templateId: null,
        jobId: null,
        metadata: {},
      };
      mockCoverLetter.findOne.mockResolvedValue(mockOriginal);
      mockCoverLetter.create.mockResolvedValue({ _id: 'cl-456' });

      await cloneCoverLetter(mockReq, mockRes);

      expect(mockCoverLetter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Original (Copy)',
        })
      );
    });

    it('should return 404 if cover letter not found for cloning', async () => {
      mockReq.params.id = 'non-existent';
      mockReq.body = { name: 'Cloned' };
      mockCoverLetter.findOne.mockResolvedValue(null);

      await cloneCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createCoverLetterFromTemplate edge cases', () => {
    it('should handle template not found', async () => {
      mockReq.body = {
        templateId: 'non-existent',
        name: 'Cover Letter',
        content: 'Content',
      };
      mockCoverLetterTemplate.findOne.mockResolvedValue(null);

      await createCoverLetterFromTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle error when creating cover letter', async () => {
      mockReq.body = {
        name: 'Cover Letter',
        content: 'Content',
      };
      mockCoverLetter.create.mockRejectedValue(new Error('Database error'));

      await createCoverLetterFromTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should increment template usage count when template is used', async () => {
      mockReq.body = {
        templateId: 'template-123',
        name: 'Cover Letter',
        content: 'Content',
      };
      const mockTemplate = {
        _id: 'template-123',
        style: 'professional',
        usageCount: 5,
        save: jest.fn().mockResolvedValue(true),
      };
      mockCoverLetterTemplate.findOne.mockResolvedValue(mockTemplate);
      mockCoverLetter.create.mockResolvedValue({ _id: 'cl-123' });

      await createCoverLetterFromTemplate(mockReq, mockRes);

      expect(mockTemplate.usageCount).toBe(6);
      expect(mockTemplate.save).toHaveBeenCalled();
    });
  });

  describe('listCoverLetters edge cases', () => {
    it('should handle database error', async () => {
      mockCoverLetter.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      await listCoverLetters(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('additional error and auth branches', () => {
    it('should return 404 when updating a non-existent cover letter', async () => {
      mockReq.params.id = 'missing-update';
      mockCoverLetter.findOne.mockResolvedValue(null);

      await updateCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 when setting default and not found', async () => {
      mockReq.params.id = 'missing-default';
      mockCoverLetter.findOne.mockResolvedValue(null);

      await setDefaultCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 when archiving and not found', async () => {
      mockReq.params.id = 'missing-archive';
      mockCoverLetter.findOne.mockResolvedValue(null);

      await archiveCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 when unarchiving and not found', async () => {
      mockReq.params.id = 'missing-unarchive';
      mockCoverLetter.findOne.mockResolvedValue(null);

      await unarchiveCoverLetter(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 when generating email template for missing cover letter', async () => {
      const module = await import('../coverLetterController.js');
      const { generateCoverLetterEmailTemplate } = module;

      mockReq.params.id = 'missing-email';
      mockCoverLetter.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null)
        })
      });

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await generateCoverLetterEmailTemplate(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle exporter failure for PDF and return 500', async () => {
      const module = await import('../coverLetterController.js');
      const { exportCoverLetterAsPdf } = module;

      mockReq.params.id = 'cl-err';
      const mockCoverLetterObj = {
        _id: 'cl-err',
        userId: 'test-user-123',
        style: 'formal',
        templateId: { theme: {} },
        jobId: null
      };

      mockCoverLetter.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockCoverLetterObj)
          })
        })
      });

      mockUser.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ profile: { contactInfo: {} } }) }) });

      // make exporter throw
      mockExporters.exportCoverLetterToPdf.mockRejectedValueOnce(new Error('boom'));

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await exportCoverLetterAsPdf(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle exporter failure for DOCX/HTML/TEXT and return 500 via sendResponse', async () => {
      const module = await import('../coverLetterController.js');
      const { exportCoverLetterAsDocx, exportCoverLetterAsHtml, exportCoverLetterAsText } = module;

      const mockCoverLetterObj = {
        _id: 'cl-bad',
        userId: 'test-user-123',
        style: 'formal',
        templateId: { theme: {} },
        jobId: null
      };

      // set up findOne chain
      mockCoverLetter.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockCoverLetterObj)
          })
        })
      });
      mockUser.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ profile: { contactInfo: {} } }) }) });

      // make exporters throw
      mockExporters.exportCoverLetterToDocx.mockRejectedValueOnce(new Error('docx-fail'));
      const resDocx = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
      await exportCoverLetterAsDocx(mockReq, resDocx);
      expect(resDocx.status).toHaveBeenCalledWith(500);

      mockExporters.exportCoverLetterToHtml.mockImplementationOnce(() => { throw new Error('html-fail'); });
      const resHtml = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
      await exportCoverLetterAsHtml(mockReq, resHtml);
      expect(resHtml.status).toHaveBeenCalledWith(500);

      mockExporters.exportCoverLetterToPlainText.mockImplementationOnce(() => { throw new Error('text-fail'); });
      const resText = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
      // exportCoverLetterAsText uses a single populate chain
      mockCoverLetter.findOne.mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockCoverLetterObj) }) });
      await exportCoverLetterAsText(mockReq, resText);
      expect(resText.status).toHaveBeenCalledWith(500);
    });

    it('should accept auth provided as a function and use payload.sub', async () => {
      // provide auth as a function returning payload.sub
      mockReq = {
        auth: () => ({ payload: { sub: 'fn-user-55' } }),
        body: {},
        params: {},
      };

      // make find return empty list for listCoverLetters
      mockCoverLetter.find.mockReturnValue({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) });

      await listCoverLetters(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
  describe('exports and email template', () => {
    it('should return 400 when content is only whitespace during create', async () => {
      mockReq.body = { name: 'Whitespace', content: '    ' };

      await createCoverLetterFromTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Content cannot be empty'),
        })
      );
    });

    it('should export cover letter as PDF and set headers', async () => {
      const module = await import('../coverLetterController.js');
      const { exportCoverLetterAsPdf } = module;

      mockReq.params.id = 'cl-999';
      mockReq.body = { letterhead: true, jobDetails: {} };

      const mockCoverLetterObj = {
        _id: 'cl-999',
        userId: 'test-user-123',
        style: 'formal',
        templateId: { theme: {} },
        jobId: { company: 'ACME', jobTitle: 'Dev', hiringManager: 'Bob', companyAddress: 'Addr' }
      };

      mockCoverLetter.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockCoverLetterObj)
          })
        })
      });

      mockUser.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ profile: { contactInfo: { name: 'U' } } }) }) });

      const res = { setHeader: jest.fn(), send: jest.fn() };

      await exportCoverLetterAsPdf(mockReq, res);

      expect(mockExporters.exportCoverLetterToPdf).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
    });

    it('should return 404 when exporting PDF and cover letter not found', async () => {
      const module = await import('../coverLetterController.js');
      const { exportCoverLetterAsPdf } = module;

      mockReq.params.id = 'not-found';
      // simulate chained populates returning null
      mockCoverLetter.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null)
          })
        })
      });

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await exportCoverLetterAsPdf(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should export DOCX, HTML, Text and generate email template', async () => {
      const module = await import('../coverLetterController.js');
      const { exportCoverLetterAsDocx, exportCoverLetterAsHtml, exportCoverLetterAsText, generateCoverLetterEmailTemplate } = module;

      // prepare a standard cover letter result for chained populates
      const mockCoverLetterObj = {
        _id: 'cl-321',
        userId: 'test-user-123',
        style: 'formal',
        templateId: { theme: {} },
        jobId: { company: 'Beta', jobTitle: 'Eng', hiringManager: 'Alice', companyAddress: 'Addr' }
      };

      mockCoverLetter.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockCoverLetterObj)
          })
        })
      });

      mockUser.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ profile: { contactInfo: {} } }) }) });

      // DOCX
      const resDocx = { setHeader: jest.fn(), send: jest.fn() };
      mockReq.params.id = 'cl-321';
      await exportCoverLetterAsDocx(mockReq, resDocx);
      expect(resDocx.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(resDocx.send).toHaveBeenCalledWith(expect.any(Buffer));

      // HTML
      const resHtml = { setHeader: jest.fn(), send: jest.fn() };
      await exportCoverLetterAsHtml(mockReq, resHtml);
      expect(resHtml.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
      expect(resHtml.send).toHaveBeenCalledWith('<html>ok</html>');

      // Text
      const resText = { setHeader: jest.fn(), send: jest.fn() };
  mockReq.body = { includeHeader: false };
  // exportCoverLetterAsText uses a single .populate('jobId') chain, ensure lean() is on the returned object
  mockCoverLetter.findOne.mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockCoverLetterObj) }) });
  await exportCoverLetterAsText(mockReq, resText);
      expect(resText.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(resText.send).toHaveBeenCalledWith('plain text');

      // Email template
      const resEmail = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
      await generateCoverLetterEmailTemplate(mockReq, resEmail);
      expect(resEmail.status).toHaveBeenCalledWith(200);
      expect(resEmail.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('AI-powered editing assistance endpoints', () => {
    it('should check spelling and grammar successfully', async () => {
      mockReq.body = { text: 'This is a test.' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await checkCoverLetterSpelling(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 when text is missing for spelling check', async () => {
      mockReq.body = {};
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await checkCoverLetterSpelling(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('should return 400 when text is only whitespace for spelling check', async () => {
      mockReq.body = { text: '   ' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await checkCoverLetterSpelling(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should get synonym suggestions', async () => {
      mockReq.body = { word: 'amazing', context: 'experience' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await getCoverLetterSynonyms(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 when word is missing for synonyms', async () => {
      mockReq.body = { context: 'experience' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await getCoverLetterSynonyms(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when word is only whitespace', async () => {
      mockReq.body = { word: '   ' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await getCoverLetterSynonyms(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should analyze cover letter readability', async () => {
      mockReq.body = { text: 'Dear Hiring Manager, I am writing to express interest.' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await analyzeCoverLetterReadability(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 when text is missing for readability', async () => {
      mockReq.body = {};
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await analyzeCoverLetterReadability(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when text is only whitespace for readability', async () => {
      mockReq.body = { text: '  \n  ' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await analyzeCoverLetterReadability(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should get restructuring suggestions', async () => {
      mockReq.body = { text: 'The quick brown fox jumps.', type: 'sentence' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await getSentenceRestructuring(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 when text is missing for restructuring', async () => {
      mockReq.body = { type: 'sentence' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await getSentenceRestructuring(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when text is only whitespace for restructuring', async () => {
      mockReq.body = { text: '\t\t' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await getSentenceRestructuring(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should save cover letter version', async () => {
      mockReq.params.id = 'cl-123';
      mockReq.body = { content: 'Updated content', note: 'First revision' };

      const mockCoverLetterDoc = {
        _id: 'cl-123',
        userId: 'test-user-123',
        editHistory: [],
        save: jest.fn().mockResolvedValue(true)
      };

      mockCoverLetter.findOne.mockResolvedValue(mockCoverLetterDoc);

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await saveCoverLetterVersion(mockReq, res);

      expect(mockCoverLetterDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when saving version for non-existent cover letter', async () => {
      mockReq.params.id = 'missing';
      mockReq.body = { content: 'Content' };
      mockCoverLetter.findOne.mockResolvedValue(null);

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await saveCoverLetterVersion(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should limit edit history to 20 versions', async () => {
      mockReq.params.id = 'cl-123';
      mockReq.body = { content: 'New version' };

      const mockHistory = Array(20).fill({ content: 'old', timestamp: new Date() });
      const mockCoverLetterDoc = {
        _id: 'cl-123',
        userId: 'test-user-123',
        editHistory: mockHistory,
        save: jest.fn().mockResolvedValue(true)
      };

      mockCoverLetter.findOne.mockResolvedValue(mockCoverLetterDoc);

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await saveCoverLetterVersion(mockReq, res);

      expect(mockCoverLetterDoc.editHistory.length).toBeLessThanOrEqual(20);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should get cover letter history', async () => {
      mockReq.params.id = 'cl-123';

      const mockCoverLetterDoc = {
        _id: 'cl-123',
        userId: 'test-user-123',
        editHistory: [
          { content: 'v1', timestamp: new Date() },
          { content: 'v2', timestamp: new Date() }
        ]
      };

      mockCoverLetter.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCoverLetterDoc)
      });

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await getCoverLetterHistory(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 when getting history for non-existent cover letter', async () => {
      mockReq.params.id = 'missing';
      mockCoverLetter.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await getCoverLetterHistory(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should export DOCX with error handling', async () => {
      mockReq.params.id = 'cl-err';
      mockReq.body = { letterhead: false };

      mockCoverLetter.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null)
          })
        })
      });

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await exportCoverLetterAsDocx(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should export HTML with all options', async () => {
      mockReq.params.id = 'cl-html';
      mockReq.body = { letterhead: true, printOptimized: true };

      const mockCoverLetterObj = {
        _id: 'cl-html',
        userId: 'test-user-123',
        style: 'modern',
        templateId: { theme: { color: 'blue' } },
        jobId: null
      };

      mockCoverLetter.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockCoverLetterObj)
          })
        })
      });

      mockUser.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ profile: { contactInfo: { phone: '123-456-7890' } } })
        })
      });

      const res = { setHeader: jest.fn(), send: jest.fn() };

      await exportCoverLetterAsHtml(mockReq, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
      expect(res.send).toHaveBeenCalled();
    });

    it('should export text with includeHeader option', async () => {
      mockReq.params.id = 'cl-text';
      mockReq.body = { includeHeader: true, jobDetails: { title: 'Dev' } };

      const mockCoverLetterObj = {
        _id: 'cl-text',
        userId: 'test-user-123',
        content: 'Dear Hiring Manager',
        jobId: null
      };

      mockCoverLetter.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockCoverLetterObj)
        })
      });

      mockUser.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ profile: { contactInfo: {} } })
        })
      });

      const res = { setHeader: jest.fn(), send: jest.fn() };

      await exportCoverLetterAsText(mockReq, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(res.send).toHaveBeenCalled();
    });

    it('should generate email template with job details', async () => {
      mockReq.params.id = 'cl-email';
      mockReq.body = { jobDetails: { company: 'Tech Corp' } };

      const mockCoverLetterObj = {
        _id: 'cl-email',
        userId: 'test-user-123',
        content: 'My Cover Letter',
        jobId: { company: 'OldCorp', jobTitle: 'Dev' }
      };

      mockCoverLetter.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockCoverLetterObj)
        })
      });

      mockUser.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ profile: { contactInfo: { email: 'test@example.com' } } })
        })
      });

      mockExporters.generateEmailTemplate.mockReturnValue({ subject: 'Application', body: 'Please consider' });

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await generateCoverLetterEmailTemplate(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when generating email template for missing cover letter', async () => {
      mockReq.params.id = 'missing';
      mockCoverLetter.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null)
        })
      });

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await generateCoverLetterEmailTemplate(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('experience analysis and advanced features', () => {
    it('should validate jobId is required for experience analysis', async () => {
      mockReq.body = { maxExperiences: 3 };

      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      await analyzeExperienceForCoverLetter(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should analyze experience and return recommendations for high overallScore', async () => {
      mockReq.body = { jobId: 'job-high', maxExperiences: 3 };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      // Job exists (mock chain .lean())
      mockJob.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'job-high', title: 'Senior Dev' }) });

      // User has two employment entries (less than 3 -> triggers "expand" recommendation)
      const employment = [
        { position: 'Dev', company: 'A', startDate: '2020', endDate: '2021', description: '', isCurrentPosition: false },
        { position: 'Eng', company: 'B', startDate: '2019', endDate: '2020', description: '', isCurrentPosition: false }
      ];
      mockUser.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ employment, skills: [] }) }) });

      // Analyzer returns relevant experiences without quantified achievements
      const relevant = employment.map(e => ({ ...e, achievements: [], relevance: 50 }));
      mockExperienceAnalyzer.selectRelevantExperiences.mockReturnValue(relevant);
      mockExperienceAnalyzer.generateExperienceNarrative.mockReturnValue(['narrative']);
      mockExperienceAnalyzer.generateAlternativePresentations.mockReturnValue(['alt']);
      mockExperienceAnalyzer.quantifyAchievements.mockReturnValue([]);
      mockExperienceAnalyzer.connectToJobRequirements.mockReturnValue({ connected: true });
      mockExperienceAnalyzer.suggestAdditionalExperiences.mockReturnValue([]);
      mockExperienceAnalyzer.scoreExperiencePackage.mockReturnValue({ overallScore: 80, gaps: [] });

      await analyzeExperienceForCoverLetter(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Experience analysis completed',
        data: expect.objectContaining({
          recommendations: expect.arrayContaining([expect.objectContaining({ type: 'emphasis' })])
        })
      }));
    });

    it('should include transferable and skill-gaps recommendations for mid score with gaps and quantified achievements', async () => {
      mockReq.body = { jobId: 'job-mid', maxExperiences: 5 };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      mockJob.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'job-mid' }) });
      const employment = [
        { position: 'Dev', company: 'A', startDate: '2020', endDate: '2020', description: '', achievements: ['Improved by 20%'], isCurrentPosition: false },
        { position: 'Dev2', company: 'B', startDate: '2018', endDate: '2019', description: '', achievements: ['Reduced cost by 5%'], isCurrentPosition: false },
        { position: 'Dev3', company: 'C', startDate: '2017', endDate: '2018', description: '', achievements: ['Led 3 projects'], isCurrentPosition: false }
      ];
      mockUser.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ employment, skills: ['JS'] }) }) });

      const relevant = employment.map(e => ({ ...e, relevance: 60 }));
      mockExperienceAnalyzer.selectRelevantExperiences.mockReturnValue(relevant);
      mockExperienceAnalyzer.generateExperienceNarrative.mockReturnValue(['narr']);
      mockExperienceAnalyzer.generateAlternativePresentations.mockReturnValue(['alt']);
      mockExperienceAnalyzer.quantifyAchievements.mockReturnValue([{ text: '20%' }]);
      mockExperienceAnalyzer.connectToJobRequirements.mockReturnValue({ reqs: [] });
      mockExperienceAnalyzer.suggestAdditionalExperiences.mockReturnValue([{ experience: { title: 'X', company: 'Y' }, relevance: { score: 10 }, reason: 'reason' }]);
      mockExperienceAnalyzer.scoreExperiencePackage.mockReturnValue({ overallScore: 60, gaps: ['Node.js'] });

      await analyzeExperienceForCoverLetter(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.recommendations.some(r => r.type === 'transferable')).toBe(true);
      expect(jsonArg.data.recommendations.some(r => r.type === 'skill-gaps')).toBe(true);
      // quantify should not be included because achievements contain numbers
      expect(jsonArg.data.recommendations.some(r => r.type === 'quantify')).toBe(false);
    });

    it('should include growth recommendation for low score', async () => {
      mockReq.body = { jobId: 'job-low', maxExperiences: 2 };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      mockJob.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'job-low' }) });
      const employment = [
        { position: 'Intern', company: 'Small', startDate: '2019', endDate: '2020', description: '', achievements: [], isCurrentPosition: false }
      ];
      mockUser.findOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ employment, skills: [] }) }) });

      const relevant = employment.map(e => ({ ...e, relevance: 10 }));
      mockExperienceAnalyzer.selectRelevantExperiences.mockReturnValue(relevant);
      mockExperienceAnalyzer.generateExperienceNarrative.mockReturnValue(['narr']);
      mockExperienceAnalyzer.generateAlternativePresentations.mockReturnValue([]);
      mockExperienceAnalyzer.quantifyAchievements.mockReturnValue([]);
      mockExperienceAnalyzer.connectToJobRequirements.mockReturnValue({});
      mockExperienceAnalyzer.suggestAdditionalExperiences.mockReturnValue([]);
      mockExperienceAnalyzer.scoreExperiencePackage.mockReturnValue({ overallScore: 30, gaps: ['Leadership'] });

      await analyzeExperienceForCoverLetter(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.data.recommendations.some(r => r.type === 'growth')).toBe(true);
      expect(jsonArg.data.recommendations.some(r => r.type === 'skill-gaps')).toBe(true);
      expect(jsonArg.data.recommendations.some(r => r.type === 'expand')).toBe(true);
    });
  });
});

