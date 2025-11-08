import { jest, beforeEach, describe, it, expect } from '@jest/globals';

jest.resetModules();

// Mock dependencies
const mockResume = {
  findOne: jest.fn(),
  updateOne: jest.fn(),
};

const mockResumeTemplate = {
  findById: jest.fn(),
};

const mockUser = {
  findOne: jest.fn(),
};

const mockResumeValidator = {
  validateResume: jest.fn(),
};

const mockHtmlToPdf = {
  htmlToPdf: jest.fn(),
};

jest.unstable_mockModule('../../models/Resume.js', () => ({
  Resume: mockResume,
}));

jest.unstable_mockModule('../../models/ResumeTemplate.js', () => ({
  ResumeTemplate: mockResumeTemplate,
}));

jest.unstable_mockModule('../../models/User.js', () => ({
  User: mockUser,
}));

jest.unstable_mockModule('../../utils/resumeValidator.js', () => mockResumeValidator);

jest.unstable_mockModule('../../utils/htmlToPdf.js', () => mockHtmlToPdf);

// Import controller
const {
  validateResumeEndpoint,
  getValidationStatus,
} = await import('../resumeValidationController.js');

describe('ResumeValidationController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      auth: {
        userId: 'test-user-123',
        payload: { sub: 'test-user-123' },
      },
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('validateResumeEndpoint', () => {
    it('should validate resume successfully', async () => {
      mockReq.params.id = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        sections: {
          summary: 'Test summary',
          experience: [],
          skills: [],
        },
        templateId: 'template-123',
        metadata: {},
      };
      const mockTemplate = {
        _id: 'template-123',
        theme: { colors: { primary: '#000' } },
        layout: {},
      };
      const mockUserDoc = {
        _id: 'user-123',
        auth0Id: 'test-user-123',
        clerkId: 'test-user-123',
      };
      const mockValidationResults = {
        isValid: true,
        issues: [],
        score: 95,
        checks: {
          spelling: { passed: true },
          grammar: { passed: true },
          length: { passed: true },
        },
      };
      const mockPdfBuffer = Buffer.from('fake pdf');

      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });
      mockResumeTemplate.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTemplate),
      });
      mockUser.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUserDoc),
      });
      mockHtmlToPdf.htmlToPdf.mockResolvedValue(mockPdfBuffer);
      mockResumeValidator.validateResume.mockResolvedValue(mockValidationResults);
      mockResume.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await validateResumeEndpoint(mockReq, mockRes);

      expect(mockResume.findOne).toHaveBeenCalledWith({
        _id: 'resume-123',
        userId: 'test-user-123',
      });
      expect(mockResumeValidator.validateResume).toHaveBeenCalled();
      expect(mockResume.updateOne).toHaveBeenCalledWith(
        { _id: 'resume-123' },
        expect.objectContaining({
          $set: expect.objectContaining({
            'metadata.lastValidation': mockValidationResults,
            'metadata.validatedAt': expect.any(Date),
          }),
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Resume validation passed',
          data: expect.objectContaining({
            validation: mockValidationResults,
          }),
        })
      );
    });

    it('should return validation results with issues', async () => {
      mockReq.params.id = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        sections: { summary: '' },
        templateId: 'template-123',
        metadata: {},
      };
      const mockTemplate = { _id: 'template-123', theme: {}, layout: {} };
      const mockUserDoc = { _id: 'user-123', auth0Id: 'test-user-123', clerkId: 'test-user-123' };
      const mockValidationResults = {
        isValid: false,
        issues: [
          { type: 'missing_summary', severity: 'warning' },
          { type: 'no_experience', severity: 'error' },
        ],
        score: 60,
      };
      const mockPdfBuffer = Buffer.from('fake pdf');

      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });
      mockResumeTemplate.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTemplate),
      });
      mockUser.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUserDoc),
      });
      mockHtmlToPdf.htmlToPdf.mockResolvedValue(mockPdfBuffer);
      mockResumeValidator.validateResume.mockResolvedValue(mockValidationResults);
      mockResume.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await validateResumeEndpoint(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Resume validation found issues',
          data: expect.objectContaining({
            validation: expect.objectContaining({
              isValid: false,
              issues: expect.arrayContaining([
                expect.objectContaining({ type: 'missing_summary' }),
              ]),
            }),
          }),
        })
      );
    });

    it('should return 404 if resume not found', async () => {
      mockReq.params.id = 'non-existent';
      // validateResumeEndpoint uses findOne().lean()
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await validateResumeEndpoint(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Resume not found',
        })
      );
    });

    it('should handle PDF generation errors gracefully', async () => {
      mockReq.params.id = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        sections: {},
        templateId: 'template-123',
        metadata: {},
      };
      const mockTemplate = { _id: 'template-123', theme: {}, layout: {} };
      const mockUserDoc = { _id: 'user-123', auth0Id: 'test-user-123', clerkId: 'test-user-123' };
      const mockValidationResults = {
        isValid: true,
        issues: [],
      };

      // validateResumeEndpoint uses findOne().lean()
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });
      mockResumeTemplate.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTemplate),
      });
      mockUser.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUserDoc),
      });
      mockHtmlToPdf.htmlToPdf.mockRejectedValue(new Error('PDF generation failed'));
      mockResumeValidator.validateResume.mockResolvedValue(mockValidationResults);
      mockResume.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await validateResumeEndpoint(mockReq, mockRes);

      // Should still validate without PDF length check
      expect(mockResumeValidator.validateResume).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getValidationStatus', () => {
    it('should return validation status', async () => {
      mockReq.params.id = 'resume-123';
      const validatedAt = new Date('2024-01-01');
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        updatedAt: new Date('2024-01-01'),
        metadata: {
          lastValidation: {
            isValid: true,
            score: 95,
          },
          validatedAt: validatedAt,
        },
      };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });

      await getValidationStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            hasBeenValidated: true,
            isValid: true,
            isStale: false,
            validatedAt: validatedAt,
            lastValidation: expect.objectContaining({
              isValid: true,
              score: 95,
            }),
          }),
        })
      );
    });

    it('should detect stale validation', async () => {
      mockReq.params.id = 'resume-123';
      const validatedAt = new Date('2024-01-01');
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        updatedAt: new Date('2024-01-15'), // Updated after validation
        metadata: {
          lastValidation: {
            isValid: true,
          },
          validatedAt: validatedAt,
        },
      };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });

      await getValidationStatus(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isStale: true, // Resume was modified after validation
          }),
        })
      );
    });

    it('should return false for hasBeenValidated if never validated', async () => {
      mockReq.params.id = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        updatedAt: new Date(),
        metadata: {}, // No validation data
      };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });

      await getValidationStatus(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hasBeenValidated: false,
            isValid: false,
            isStale: false,
          }),
        })
      );
    });

    it('should return 404 if resume not found', async () => {
      mockReq.params.id = 'non-existent';
      // getValidationStatus uses findOne().lean()
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await getValidationStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('validateResumeEndpoint edge cases', () => {
    it('should handle missing template', async () => {
      mockReq.params.id = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        sections: {},
        templateId: 'non-existent',
        metadata: {},
      };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });
      mockResumeTemplate.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await validateResumeEndpoint(mockReq, mockRes);

      // Should still validate even without template
      expect(mockResumeValidator.validateResume).toHaveBeenCalled();
    });

    it('should handle missing user', async () => {
      mockReq.params.id = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        sections: {},
        templateId: 'template-123',
        metadata: {},
      };
      const mockTemplate = { _id: 'template-123', theme: {}, layout: {} };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });
      mockResumeTemplate.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTemplate),
      });
      mockUser.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await validateResumeEndpoint(mockReq, mockRes);

      // Should still validate even without user
      expect(mockResumeValidator.validateResume).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockReq.params.id = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        sections: {},
        templateId: 'template-123',
        metadata: {},
      };
      const mockTemplate = { _id: 'template-123', theme: {}, layout: {} };
      const mockUserDoc = { _id: 'user-123', auth0Id: 'test-user-123', clerkId: 'test-user-123' };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });
      mockResumeTemplate.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTemplate),
      });
      mockUser.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUserDoc),
      });
      mockHtmlToPdf.htmlToPdf.mockResolvedValue(Buffer.from('pdf'));
      mockResumeValidator.validateResume.mockRejectedValue(new Error('Validation error'));

      await validateResumeEndpoint(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getValidationStatus edge cases', () => {
    it('should handle missing metadata gracefully', async () => {
      mockReq.params.id = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        updatedAt: new Date(),
        // No metadata field at all
      };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });

      await getValidationStatus(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hasBeenValidated: false,
            isValid: false,
            isStale: false,
          }),
        })
      );
    });

    it('should handle null validation data', async () => {
      mockReq.params.id = 'resume-123';
      const mockResumeDoc = {
        _id: 'resume-123',
        userId: 'test-user-123',
        updatedAt: new Date(),
        metadata: {
          lastValidation: null,
          validatedAt: null,
        },
      };
      mockResume.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResumeDoc),
      });

      await getValidationStatus(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hasBeenValidated: false,
          }),
        })
      );
    });
  });
});

