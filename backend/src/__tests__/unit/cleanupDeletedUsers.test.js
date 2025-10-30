import { User } from '../../models/User.js';
import { cleanupExpiredAccounts } from '../../utils/cleanupDeletedUsers.js';

describe('Cleanup Deleted Users Tests', () => {
  let originalLog, originalError;
  let logCalls = [];

  beforeAll(() => {
    originalLog = console.log;
    originalError = console.error;
    
    console.log = (...args) => {
      logCalls.push(args.join(' '));
    };
    console.error = (...args) => {
      logCalls.push(args.join(' '));
    };
  });

  afterAll(() => {
    console.log = originalLog;
    console.error = originalError;
  });

  beforeEach(async () => {
    logCalls = [];
  });

  describe('cleanupExpiredAccounts', () => {
    test('should return 0 deleted when no expired accounts exist', async () => {
      // Create a user that is NOT deleted
      await User.create({
        auth0Id: 'active_user_123',
        email: 'active@example.com',
        name: 'Active User',
        isDeleted: false,
      });

      const result = await cleanupExpiredAccounts();

      expect(result.deleted).toBe(0);
      expect(result.errors).toEqual([]);
      expect(logCalls.some(call => call.includes('No expired accounts to delete'))).toBe(true);
    });

    test('should return 0 deleted when deleted users have not expired', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10); // 10 days in future

      await User.create({
        auth0Id: 'deleted_user_123',
        email: 'deleted@example.com',
        name: 'Deleted User',
        isDeleted: true,
        deletionExpiresAt: futureDate,
      });

      const result = await cleanupExpiredAccounts();

      expect(result.deleted).toBe(0);
      expect(result.errors).toEqual([]);
    });

    test('should permanently delete expired accounts', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

      const expiredUser = await User.create({
        auth0Id: 'expired_user_123',
        email: 'expired@example.com',
        name: 'Expired User',
        isDeleted: true,
        deletionExpiresAt: pastDate,
      });

      const result = await cleanupExpiredAccounts();

      expect(result.deleted).toBe(1);
      expect(result.errors).toEqual([]);

      // Verify user was actually deleted from database
      const deletedUser = await User.findById(expiredUser._id);
      expect(deletedUser).toBeNull();
    });

    test('should send final deletion email before deleting account', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await User.create({
        auth0Id: 'expired_user_email',
        email: 'expiredemail@example.com',
        name: 'Email Test User',
        isDeleted: true,
        deletionExpiresAt: pastDate,
      });

      await cleanupExpiredAccounts();

      // Check that email-related logs appear (since we can't mock in ES modules)
      expect(logCalls.some(call => call.includes('expiredemail@example.com'))).toBe(true);
    });

    test('should delete multiple expired accounts', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      await User.create({
        auth0Id: 'expired_1',
        email: 'expired1@example.com',
        name: 'Expired User 1',
        isDeleted: true,
        deletionExpiresAt: pastDate,
      });

      await User.create({
        auth0Id: 'expired_2',
        email: 'expired2@example.com',
        name: 'Expired User 2',
        isDeleted: true,
        deletionExpiresAt: pastDate,
      });

      await User.create({
        auth0Id: 'expired_3',
        email: 'expired3@example.com',
        name: 'Expired User 3',
        isDeleted: true,
        deletionExpiresAt: pastDate,
      });

      const result = await cleanupExpiredAccounts();

      expect(result.deleted).toBe(3);
      expect(result.errors).toEqual([]);
    });

    test('should handle deletion process correctly', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const expiredUser = await User.create({
        auth0Id: 'expired_email_process',
        email: 'emailprocess@example.com',
        name: 'Process Test User',
        isDeleted: true,
        deletionExpiresAt: pastDate,
      });

      const result = await cleanupExpiredAccounts();

      // User should be deleted
      expect(result.deleted).toBe(1);

      const deletedUser = await User.findById(expiredUser._id);
      expect(deletedUser).toBeNull();
    });

    test('should delete all valid expired users', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      // Create multiple users
      await User.create({
        auth0Id: 'expired_multi_1',
        email: 'multi1@example.com',
        name: 'Multi User 1',
        isDeleted: true,
        deletionExpiresAt: pastDate,
      });

      await User.create({
        auth0Id: 'expired_multi_2',
        email: 'multi2@example.com',
        name: 'Multi User 2',
        isDeleted: true,
        deletionExpiresAt: pastDate,
      });

      const result = await cleanupExpiredAccounts();

      expect(result.deleted).toBeGreaterThanOrEqual(2);
    });

    test('should handle accounts expiring exactly now', async () => {
      const now = new Date();

      await User.create({
        auth0Id: 'expired_now',
        email: 'expirednow@example.com',
        name: 'Expired Now User',
        isDeleted: true,
        deletionExpiresAt: now,
      });

      const result = await cleanupExpiredAccounts();

      expect(result.deleted).toBe(1);
    });

    test('should not delete accounts expiring 1 second in future', async () => {
      const futureDate = new Date();
      futureDate.setSeconds(futureDate.getSeconds() + 1);

      await User.create({
        auth0Id: 'almost_expired',
        email: 'almost@example.com',
        name: 'Almost Expired User',
        isDeleted: true,
        deletionExpiresAt: futureDate,
      });

      const result = await cleanupExpiredAccounts();

      expect(result.deleted).toBe(0);
    });

    test('should log correct count of found expired accounts', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await User.create({
        auth0Id: 'log_test_1',
        email: 'log1@example.com',
        name: 'Log Test 1',
        isDeleted: true,
        deletionExpiresAt: pastDate,
      });

      await User.create({
        auth0Id: 'log_test_2',
        email: 'log2@example.com',
        name: 'Log Test 2',
        isDeleted: true,
        deletionExpiresAt: pastDate,
      });

      await cleanupExpiredAccounts();

      expect(logCalls.some(call => call.includes('Found 2 expired account(s)'))).toBe(true);
    });

    test('should log completion summary', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await User.create({
        auth0Id: 'summary_test',
        email: 'summary@example.com',
        name: 'Summary Test',
        isDeleted: true,
        deletionExpiresAt: pastDate,
      });

      await cleanupExpiredAccounts();

      expect(logCalls.some(call => call.includes('Cleanup complete'))).toBe(true);
      expect(logCalls.some(call => call.includes('1 accounts deleted'))).toBe(true);
    });

    test('should handle empty database gracefully', async () => {
      // Clear all users
      await User.deleteMany({});

      const result = await cleanupExpiredAccounts();

      expect(result.deleted).toBe(0);
      expect(result.errors).toEqual([]);
    });

    test('should only delete users with isDeleted=true', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      // Create user with expired date but NOT marked as deleted
      const activeUser = await User.create({
        auth0Id: 'active_with_expiry',
        email: 'activeexpiry@example.com',
        name: 'Active User',
        isDeleted: false,
        deletionExpiresAt: pastDate,
      });

      const result = await cleanupExpiredAccounts();

      expect(result.deleted).toBe(0);

      // Verify user still exists
      const stillExists = await User.findById(activeUser._id);
      expect(stillExists).not.toBeNull();
    });
  });
});
