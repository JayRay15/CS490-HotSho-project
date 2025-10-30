import { jest } from '@jest/globals';

// Mock dependencies before importing
const mockUser = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
};

const mockClerkClient = {
  users: {
    deleteUser: jest.fn(),
  },
};

const mockSendDeletionEmail = jest.fn();

jest.unstable_mockModule('../../models/User.js', () => ({
  User: mockUser,
}));

jest.unstable_mockModule('@clerk/express', () => ({
  clerkClient: mockClerkClient,
}));

jest.unstable_mockModule('../../utils/email.js', () => ({
  sendDeletionEmail: mockSendDeletionEmail,
}));

const { User } = await import('../../models/User.js');
const { clerkClient } = await import('@clerk/express');
const { sendDeletionEmail } = await import('../../utils/email.js');
const {
  getCurrentUser,
  updateCurrentUser,
  uploadProfilePicture,
  deleteProfilePicture,
  deleteAccount,
  addEmployment,
  updateEmployment,
  deleteEmployment,
} = await import('../userController.js');

describe('userController', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      auth: {
        userId: 'test-user-id',
        payload: { sub: 'test-user-id' },
      },
      body: {},
      params: {},
      file: null,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        _id: 'user-id',
        auth0Id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      };

      User.findOne.mockResolvedValue(mockUser);

      await getCurrentUser(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'test-user-id' });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User profile retrieved successfully',
          data: mockUser,
        })
      );
    });

    it('should return error if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      await getCurrentUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });

    it('should return error if userId is missing', async () => {
      mockReq.auth = {};

      await getCurrentUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Unauthorized: missing authentication credentials',
        })
      );
    });
  });

  describe('updateCurrentUser', () => {
    it('should update user successfully', async () => {
      mockReq.body = { name: 'Updated Name', bio: 'New bio' };

      const mockUser = {
        _id: 'user-id',
        auth0Id: 'test-user-id',
        name: 'Updated Name',
        bio: 'New bio',
      };

      User.findOneAndUpdate.mockResolvedValue(mockUser);

      await updateCurrentUser(mockReq, mockRes, mockNext);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { auth0Id: 'test-user-id' },
        { $set: { name: 'Updated Name', bio: 'New bio' } },
        { new: true, runValidators: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User profile updated successfully',
        })
      );
    });

    it('should return error if no update data provided', async () => {
      mockReq.body = {};

      await updateCurrentUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'No update data provided',
        })
      );
    });

    it('should return error for invalid email format', async () => {
      mockReq.body = { email: 'invalid-email' };

      await updateCurrentUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid email format',
        })
      );
    });

    it('should not update protected fields', async () => {
      mockReq.body = {
        name: 'Updated Name',
        auth0Id: 'new-auth0-id',
        _id: 'new-id',
        createdAt: new Date(),
      };

      const mockUser = {
        _id: 'user-id',
        auth0Id: 'test-user-id',
        name: 'Updated Name',
      };

      User.findOneAndUpdate.mockResolvedValue(mockUser);

      await updateCurrentUser(mockReq, mockRes, mockNext);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { auth0Id: 'test-user-id' },
        { $set: { name: 'Updated Name' } },
        { new: true, runValidators: true }
      );
    });

    it('should return error if user not found during update', async () => {
      mockReq.body = { name: 'Updated Name' };
      User.findOneAndUpdate.mockResolvedValue(null);

      await updateCurrentUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });

    it('should return error if userId is missing during update', async () => {
      mockReq.auth = {};
      mockReq.body = { name: 'Updated Name' };

      await updateCurrentUser(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Unauthorized: missing authentication credentials',
        })
      );
    });
  });

  describe('uploadProfilePicture', () => {
    it('should upload profile picture successfully', async () => {
      mockReq.file = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
      };

      const mockUser = {
        _id: 'user-id',
        picture: 'data:image/jpeg;base64,ZmFrZS1pbWFnZS1kYXRh',
      };

      User.findOneAndUpdate.mockResolvedValue(mockUser);

      await uploadProfilePicture(mockReq, mockRes, mockNext);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { auth0Id: 'test-user-id' },
        { $set: { picture: expect.stringContaining('data:image/jpeg;base64,') } },
        { new: true, runValidators: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Profile picture uploaded successfully',
        })
      );
    });

    it('should return error if no file provided', async () => {
      mockReq.file = null;

      await uploadProfilePicture(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'No file provided',
        })
      );
    });

    it('should return error if user not found when uploading picture', async () => {
      mockReq.file = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
      };
      User.findOneAndUpdate.mockResolvedValue(null);

      await uploadProfilePicture(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });

    it('should return error if userId is missing when uploading picture', async () => {
      mockReq.auth = {};
      mockReq.file = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
      };

      await uploadProfilePicture(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Unauthorized: missing authentication credentials',
        })
      );
    });
  });

  describe('deleteProfilePicture', () => {
    it('should delete profile picture successfully', async () => {
      const mockUser = {
        _id: 'user-id',
        picture: null,
      };

      User.findOneAndUpdate.mockResolvedValue(mockUser);

      await deleteProfilePicture(mockReq, mockRes, mockNext);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { auth0Id: 'test-user-id' },
        { $unset: { picture: '' } },
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Profile picture removed successfully',
        })
      );
    });

    it('should return error if user not found when deleting picture', async () => {
      User.findOneAndUpdate.mockResolvedValue(null);

      await deleteProfilePicture(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });

    it('should return error if userId is missing when deleting picture', async () => {
      mockReq.auth = {};

      await deleteProfilePicture(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Unauthorized: missing authentication credentials',
        })
      );
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      const testUser = {
        _id: 'user-id',
        auth0Id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        password: null,
      };

      mockUser.findOne.mockResolvedValueOnce(testUser).mockResolvedValueOnce(null);
      mockClerkClient.users.deleteUser.mockResolvedValue({});
      mockUser.deleteOne.mockResolvedValue({ deletedCount: 1, acknowledged: true });

      await deleteAccount(mockReq, mockRes, mockNext);
      await new Promise(resolve => setImmediate(resolve));

      expect(mockClerkClient.users.deleteUser).toHaveBeenCalledWith('test-user-id');
      expect(mockUser.deleteOne).toHaveBeenCalledWith({ _id: 'user-id' });
      expect(mockSendDeletionEmail).toHaveBeenCalledWith('test@example.com', 'Test User');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('permanently deleted'),
        })
      );
    });

    it('should require password for accounts with password', async () => {
      const testUser = {
        _id: 'user-id',
        auth0Id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      mockReq.body = { password: 'wrong-password' };
      mockUser.findOne.mockResolvedValue(testUser);

      await deleteAccount(mockReq, mockRes, mockNext);
      await new Promise(resolve => setImmediate(resolve));

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Incorrect password',
        })
      );
    });

    it('should return error if Clerk deletion fails', async () => {
      const testUser = {
        _id: 'user-id',
        auth0Id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        password: null,
      };

      mockUser.findOne.mockResolvedValue(testUser);
      mockClerkClient.users.deleteUser.mockRejectedValue(new Error('Clerk API error'));

      await deleteAccount(mockReq, mockRes, mockNext);
      await new Promise(resolve => setImmediate(resolve));

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to fully delete account'),
        })
      );
    });
  });

  describe('addEmployment', () => {
    it('should add employment successfully', async () => {
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        startDate: '10/2023',
        isCurrentPosition: true,
      };

      const mockUser = {
        _id: 'user-id',
        employment: [
          {
            jobTitle: 'Software Engineer',
            company: 'Tech Corp',
            startDate: new Date(2023, 9, 1),
            isCurrentPosition: true,
          },
        ],
      };

      User.findOneAndUpdate.mockResolvedValue(mockUser);

      await addEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Employment entry added successfully',
        })
      );
    });

    it('should return validation error for missing required fields', async () => {
      mockReq.body = { jobTitle: 'Software Engineer' };

      await addEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('fix the following errors'),
        })
      );
    });

    it('should handle employment with location', async () => {
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        location: 'New York, NY',
        startDate: '10/2023',
        isCurrentPosition: true,
      };

      const mockUser = {
        _id: 'user-id',
        employment: [],
      };

      User.findOneAndUpdate.mockResolvedValue(mockUser);

      await addEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Employment entry added successfully',
        })
      );
    });

    it('should validate date format', async () => {
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        startDate: 'invalid-date',
      };

      await addEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should validate end date is after start date', async () => {
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        startDate: '10/2023',
        endDate: '05/2023',
        isCurrentPosition: false,
      };

      await addEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'endDate',
              message: expect.stringContaining('after the start date'),
            }),
          ]),
        })
      );
    });

    it('should return error if user not found when adding employment', async () => {
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        startDate: '10/2023',
        isCurrentPosition: true,
      };
      User.findOneAndUpdate.mockResolvedValue(null);

      await addEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });

    it('should handle YYYY-MM date format in addEmployment', async () => {
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        startDate: '2023-10',
        endDate: '2024-05',
        isCurrentPosition: false,
      };

      const mockUser = {
        _id: 'user-id',
        employment: [],
      };

      User.findOneAndUpdate.mockResolvedValue(mockUser);

      await addEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Employment entry added successfully',
        })
      );
    });

    it('should return error if userId is missing when adding employment', async () => {
      mockReq.auth = {};
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        startDate: '10/2023',
        isCurrentPosition: true,
      };

      await addEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Unauthorized: missing authentication credentials',
        })
      );
    });
  });

  describe('updateEmployment', () => {
    it('should update employment successfully', async () => {
      mockReq.params = { employmentId: 'employment-id' };
      mockReq.body = {
        jobTitle: 'Senior Software Engineer',
        company: 'Tech Corp',
        startDate: '10/2023',
        isCurrentPosition: true,
      };

      const mockUser = {
        _id: 'user-id',
        employment: [
          {
            _id: 'employment-id',
            jobTitle: 'Senior Software Engineer',
            company: 'Tech Corp',
          },
        ],
      };

      User.findOneAndUpdate.mockResolvedValue(mockUser);

      await updateEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Employment entry updated successfully',
        })
      );
    });

    it('should validate required fields on update', async () => {
      mockReq.params = { employmentId: 'employment-id' };
      mockReq.body = {
        jobTitle: '',
        company: 'Tech Corp',
        startDate: '10/2023',
      };

      await updateEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'jobTitle',
              message: expect.stringContaining('required'),
            }),
          ]),
        })
      );
    });

    it('should handle date format validation', async () => {
      mockReq.params = { employmentId: 'employment-id' };
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        startDate: 'invalid-date',
      };

      await updateEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'startDate',
              message: expect.stringContaining('Invalid start date'),
            }),
          ]),
        })
      );
    });

    it('should handle description length validation', async () => {
      mockReq.params = { employmentId: 'employment-id' };
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        startDate: '10/2023',
        description: 'a'.repeat(1001), // Exceeds 1000 char limit
      };

      await updateEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'description',
              message: expect.stringContaining('too long'),
            }),
          ]),
        })
      );
    });

    it('should handle MM/YYYY date format', async () => {
      mockReq.params = { employmentId: 'employment-id' };
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        startDate: '01/2023',
        endDate: '12/2023',
        isCurrentPosition: false,
      };

      const mockUser = {
        _id: 'user-id',
        employment: [
          {
            _id: 'employment-id',
            jobTitle: 'Software Engineer',
            company: 'Tech Corp',
          },
        ],
      };

      User.findOneAndUpdate.mockResolvedValue(mockUser);

      await updateEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Employment entry updated successfully',
        })
      );
    });

    it('should accept valid description length', async () => {
      mockReq.params = { employmentId: 'employment-id' };
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        startDate: '01/2023',
        description: 'A valid description that is under the character limit',
      };

      const mockUser = {
        _id: 'user-id',
        employment: [
          {
            _id: 'employment-id',
            jobTitle: 'Software Engineer',
            company: 'Tech Corp',
          },
        ],
      };

      User.findOneAndUpdate.mockResolvedValue(mockUser);

      await updateEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Employment entry updated successfully',
        })
      );
    });

    it('should handle employment update with location', async () => {
      mockReq.params = { employmentId: 'employment-id' };
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        startDate: '01/2023',
        isCurrentPosition: true,
      };

      const mockUser = {
        _id: 'user-id',
        employment: [
          {
            _id: 'employment-id',
            jobTitle: 'Software Engineer',
            company: 'Tech Corp',
            location: 'San Francisco, CA',
          },
        ],
      };

      User.findOneAndUpdate.mockResolvedValue(mockUser);

      await updateEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Employment entry updated successfully',
        })
      );
    });

    it('should return error if user not found when updating employment', async () => {
      mockReq.params = { employmentId: 'employment-id' };
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        startDate: '10/2023',
      };
      User.findOneAndUpdate.mockResolvedValue(null);

      await updateEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User or employment entry not found',
        })
      );
    });

    it('should handle YYYY-MM date format in updateEmployment', async () => {
      mockReq.params = { employmentId: 'employment-id' };
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        startDate: '2023-01',
        endDate: '2024-12',
        isCurrentPosition: false,
      };

      const mockUser = {
        _id: 'user-id',
        employment: [
          {
            _id: 'employment-id',
            jobTitle: 'Software Engineer',
            company: 'Tech Corp',
          },
        ],
      };

      User.findOneAndUpdate.mockResolvedValue(mockUser);

      await updateEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Employment entry updated successfully',
        })
      );
    });

    it('should return error if userId is missing when updating employment', async () => {
      mockReq.auth = {};
      mockReq.params = { employmentId: 'employment-id' };
      mockReq.body = {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        startDate: '10/2023',
      };

      await updateEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Unauthorized: missing authentication credentials',
        })
      );
    });
  });

  describe('deleteEmployment', () => {
    it('should delete employment successfully', async () => {
      mockReq.params = { employmentId: 'employment-id' };

      const mockUser = {
        _id: 'user-id',
        employment: [],
      };

      User.findOneAndUpdate.mockResolvedValue(mockUser);

      await deleteEmployment(mockReq, mockRes, mockNext);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { auth0Id: 'test-user-id' },
        { $pull: { employment: { _id: 'employment-id' } } },
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Employment entry deleted successfully',
        })
      );
    });

    it('should return error if userId is missing when deleting employment', async () => {
      mockReq.auth = {};
      mockReq.params = { employmentId: 'employment-id' };

      await deleteEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Unauthorized: missing authentication credentials',
        })
      );
    });

    it('should return error if employmentId is missing', async () => {
      mockReq.params = {};

      await deleteEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Employment ID is required',
        })
      );
    });

    it('should return error if user not found when deleting employment', async () => {
      mockReq.params = { employmentId: 'employment-id' };
      User.findOneAndUpdate.mockResolvedValue(null);

      await deleteEmployment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });
  });
});
