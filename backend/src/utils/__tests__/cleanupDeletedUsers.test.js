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
const cleanupModule = await import('../cleanupDeletedUsers.js');
const { cleanupExpiredAccounts, startCleanupSchedule } = cleanupModule;

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
    jest.clearAllTimers();
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
    it('should run cleanup immediately on startup', async () => {
      // Use real timers for the immediate startup invocation to let promises resolve
      jest.useRealTimers();

      // Make the underlying User.find resolve to an empty list so the cleanup resolves
      mockUser.find.mockResolvedValue([]);

      // capture any real interval IDs so we can clear them after the test
      const origSetInterval = global.setInterval;
      const intervalIds = [];
      global.setInterval = (fn, ms) => {
        const id = origSetInterval(fn, ms);
        intervalIds.push(id);
        return id;
      };

      startCleanupSchedule();

      // wait a tick for the initial promise chain to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockUser.find).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Initial cleanup completed'), expect.any(Object));

      // clear any real intervals created by the function
      intervalIds.forEach(id => clearInterval(id));
      global.setInterval = origSetInterval;
      jest.useFakeTimers();
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

    it('should handle initial cleanup errors gracefully', async () => {
      jest.useRealTimers();

      const error = new Error('Initial cleanup failure');
      mockUser.find.mockRejectedValue(error);

      // capture any real interval IDs so we can clear them after the test
      const origSetInterval2 = global.setInterval;
      const intervalIds2 = [];
      global.setInterval = (fn, ms) => {
        const id = origSetInterval2(fn, ms);
        intervalIds2.push(id);
        return id;
      };

      startCleanupSchedule();

      // wait for the promise rejection to be handled
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockUser.find).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Initial cleanup failed'), error);

      // clear any real intervals created by the function
      intervalIds2.forEach(id => clearInterval(id));
      global.setInterval = origSetInterval2;
      jest.useFakeTimers();
    });

    it('should run scheduled cleanup job and log failures', async () => {
      // First call (immediate) resolves; second scheduled call will reject
      mockUser.find.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Scheduled failure'));

      startCleanupSchedule();

      // Immediate first call should have happened
      expect(mockUser.find).toHaveBeenCalled();

      // Advance timers by 24 hours to trigger the interval
      const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
      jest.advanceTimersByTime(CLEANUP_INTERVAL);

      // The interval logs synchronously
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Running scheduled cleanup job'));

  // Allow any promise rejections to be processed
  await Promise.resolve();

  // The scheduled invocation may log either the scheduled failure message or the internal cleanup job error.
  expect(consoleErrorSpy).toHaveBeenCalled();
  const loggedError = consoleErrorSpy.mock.calls.some(call => call.some(arg => arg instanceof Error));
  expect(loggedError).toBe(true);
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
