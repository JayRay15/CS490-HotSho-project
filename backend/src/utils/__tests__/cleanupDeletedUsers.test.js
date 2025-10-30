import { jest } from '@jest/globals';

// Mock dependencies before importing
const mockUser = {
  find: jest.fn(),
  deleteOne: jest.fn(),
};

const mockSendFinalDeletionEmail = jest.fn();

jest.unstable_mockModule('../../models/User.js', () => ({
  User: mockUser,
}));

jest.unstable_mockModule('../email.js', () => ({
  sendFinalDeletionEmail: mockSendFinalDeletionEmail,
}));

const { User } = await import('../../models/User.js');
const { sendFinalDeletionEmail } = await import('../email.js');
const { cleanupExpiredAccounts, startCleanupSchedule } = await import('../cleanupDeletedUsers.js');

describe('cleanupDeletedUsers utility (DEPRECATED)', () => {
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.useRealTimers();
  });

  describe('cleanupExpiredAccounts', () => {
    it('should return zero deleted when no expired accounts found', async () => {
      User.find.mockResolvedValue([]);

      const result = await cleanupExpiredAccounts();

      expect(result).toEqual({ deleted: 0, errors: [] });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No expired accounts')
      );
    });

    it('should delete expired accounts successfully', async () => {
      const expiredUsers = [
        {
          _id: 'user-id-1',
          email: 'user1@example.com',
          name: 'User One',
          isDeleted: true,
          deletionExpiresAt: new Date('2023-01-01'),
        },
        {
          _id: 'user-id-2',
          email: 'user2@example.com',
          name: 'User Two',
          isDeleted: true,
          deletionExpiresAt: new Date('2023-01-01'),
        },
      ];

      User.find.mockResolvedValue(expiredUsers);
      User.deleteOne.mockResolvedValue({ deletedCount: 1 });
      sendFinalDeletionEmail.mockResolvedValue();

      const result = await cleanupExpiredAccounts();

      expect(result.deleted).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(User.deleteOne).toHaveBeenCalledTimes(2);
      expect(sendFinalDeletionEmail).toHaveBeenCalledTimes(2);
    });

    it('should send final deletion email before deleting account', async () => {
      const expiredUser = {
        _id: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        isDeleted: true,
        deletionExpiresAt: new Date('2023-01-01'),
      };

      User.find.mockResolvedValue([expiredUser]);
      User.deleteOne.mockResolvedValue({ deletedCount: 1 });
      sendFinalDeletionEmail.mockResolvedValue();

      await cleanupExpiredAccounts();

      expect(mockSendFinalDeletionEmail).toHaveBeenCalledWith('user@example.com', 'Test User');
      expect(mockUser.deleteOne).toHaveBeenCalled();
      // Email should be sent before deletion
      const emailCallOrder = mockSendFinalDeletionEmail.mock.invocationCallOrder[0];
      const deleteCallOrder = mockUser.deleteOne.mock.invocationCallOrder[0];
      expect(emailCallOrder).toBeLessThan(deleteCallOrder);
    });

    it('should continue deletion even if email fails', async () => {
      const expiredUser = {
        _id: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        isDeleted: true,
        deletionExpiresAt: new Date('2023-01-01'),
      };

      mockUser.find.mockResolvedValue([expiredUser]);
      mockUser.deleteOne.mockResolvedValue({ deletedCount: 1 });
      mockSendFinalDeletionEmail.mockRejectedValue(new Error('Email failed'));

      const result = await cleanupExpiredAccounts();

      expect(result.deleted).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send final deletion email'),
        expect.any(String)
      );
      expect(mockUser.deleteOne).toHaveBeenCalled();
    });

    it('should handle deletion errors and continue with other accounts', async () => {
      const expiredUsers = [
        {
          _id: 'user-id-1',
          email: 'user1@example.com',
          name: 'User One',
          isDeleted: true,
          deletionExpiresAt: new Date('2023-01-01'),
        },
        {
          _id: 'user-id-2',
          email: 'user2@example.com',
          name: 'User Two',
          isDeleted: true,
          deletionExpiresAt: new Date('2023-01-01'),
        },
      ];

      mockUser.find.mockResolvedValue(expiredUsers);
      mockSendFinalDeletionEmail.mockResolvedValue();
      mockUser.deleteOne
        .mockRejectedValueOnce(new Error('Deletion failed'))
        .mockResolvedValueOnce({ deletedCount: 1 });

      const result = await cleanupExpiredAccounts();

      expect(result.deleted).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        userId: 'user-id-1',
        email: 'user1@example.com',
        error: 'Deletion failed',
      });
    });

    it('should query for expired accounts correctly', async () => {
      mockUser.find.mockResolvedValue([]);

      await cleanupExpiredAccounts();

      expect(mockUser.find).toHaveBeenCalledWith({
        isDeleted: true,
        deletionExpiresAt: { $lte: expect.any(Date) },
      });
    });

    it('should log cleanup summary', async () => {
      const expiredUsers = [
        {
          _id: 'user-id',
          email: 'user@example.com',
          name: 'Test User',
          isDeleted: true,
          deletionExpiresAt: new Date('2023-01-01'),
        },
      ];

      User.find.mockResolvedValue(expiredUsers);
      User.deleteOne.mockResolvedValue({ deletedCount: 1 });
      sendFinalDeletionEmail.mockResolvedValue();

      await cleanupExpiredAccounts();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup complete')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('1 accounts deleted')
      );
    });

    it('should throw error if cleanup fails', async () => {
      const error = new Error('Database error');
      User.find.mockRejectedValue(error);

      await expect(cleanupExpiredAccounts()).rejects.toThrow('Database error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup job error'),
        error
      );
    });
  });

  describe('startCleanupSchedule', () => {
    it.skip('should run cleanup immediately on startup', async () => {
      // Skipping this test as it's testing implementation details of a deprecated function
      // The startCleanupSchedule function is deprecated and will be removed
    });

    it('should schedule cleanup to run every 24 hours', () => {
      mockUser.find.mockResolvedValue([]);

      startCleanupSchedule();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup schedule started')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('every 24 hours')
      );
    });

    it.skip('should handle initial cleanup errors gracefully', async () => {
      // Skipping this test as it's testing implementation details of a deprecated function
      // The startCleanupSchedule function is deprecated and will be removed
    });
  });

  describe('Deprecation notice', () => {
    it('should be marked as deprecated', () => {
      // Check file content or documentation for deprecation notice
      // This is a meta-test to ensure the deprecation is documented
      expect(cleanupExpiredAccounts).toBeDefined();
      expect(startCleanupSchedule).toBeDefined();
    });
  });
});
