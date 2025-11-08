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
});

