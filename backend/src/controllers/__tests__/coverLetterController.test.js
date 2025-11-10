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
    EXPORT_ERROR: 'EXPORT_ERR'
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
});

