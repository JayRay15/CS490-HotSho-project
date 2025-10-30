import { User } from '../../models/User.js';
import bcrypt from 'bcrypt';

describe('Authentication Functions - UC-001 to UC-007', () => {
  
  describe('User Registration (UC-001)', () => {
    
    test('should create user with valid registration data', async () => {
      const userData = {
        auth0Id: 'clerk_test_user_123',
        email: 'test@example.com',
        password: 'ValidPass123',
        name: 'Test User',
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.password).not.toBe('ValidPass123'); // Should be hashed
      expect(user.uuid).toBeDefined(); // UUID should be auto-generated
    });

    test('should reject registration with duplicate email', async () => {
      const userData = {
        auth0Id: 'clerk_test_user_1',
        email: 'duplicate@example.com',
        password: 'ValidPass123',
        name: 'User One',
      };

      await User.create(userData);

      // Try to create another user with same email
      const duplicateUser = {
        auth0Id: 'clerk_test_user_2',
        email: 'duplicate@example.com',
        password: 'AnotherPass123',
        name: 'User Two',
      };

      await expect(User.create(duplicateUser)).rejects.toThrow();
    });

    test('should reject registration with invalid email format', async () => {
      const invalidEmailData = {
        auth0Id: 'clerk_test_user_456',
        email: 'invalid-email',
        password: 'ValidPass123',
        name: 'Test User',
      };

      await expect(User.create(invalidEmailData)).rejects.toThrow();
    });

    test('should reject registration with weak password (no uppercase)', async () => {
      const weakPasswordData = {
        auth0Id: 'clerk_test_user_789',
        email: 'weak@example.com',
        password: 'weakpass123', // No uppercase
        name: 'Test User',
      };

      await expect(User.create(weakPasswordData)).rejects.toThrow();
    });

    test('should reject registration with weak password (no number)', async () => {
      const weakPasswordData = {
        auth0Id: 'clerk_test_user_abc',
        email: 'weak2@example.com',
        password: 'WeakPassword', // No number
        name: 'Test User',
      };

      await expect(User.create(weakPasswordData)).rejects.toThrow();
    });

    test('should reject registration with password less than 8 characters', async () => {
      const shortPasswordData = {
        auth0Id: 'clerk_test_user_def',
        email: 'short@example.com',
        password: 'Pass1', // Too short
        name: 'Test User',
      };

      await expect(User.create(shortPasswordData)).rejects.toThrow();
    });

    test('should lowercase email automatically', async () => {
      const userData = {
        auth0Id: 'clerk_test_user_lowercase',
        email: 'UPPERCASE@EXAMPLE.COM',
        password: 'ValidPass123',
        name: 'Test User',
      };

      const user = await User.create(userData);
      expect(user.email).toBe('uppercase@example.com');
    });

    test('should trim whitespace from string fields', async () => {
      const userData = {
        auth0Id: 'clerk_test_user_trim',
        email: '  trimmed@example.com  ',
        password: 'ValidPass123',
        name: '  Test User  ',
      };

      const user = await User.create(userData);
      expect(user.email).toBe('trimmed@example.com');
      expect(user.name).toBe('Test User');
    });
  });

  describe('Password Hashing (UC-001)', () => {
    
    test('should hash password before saving', async () => {
      const userData = {
        auth0Id: 'clerk_test_hash_1',
        email: 'hash@example.com',
        password: 'PlainPassword123',
        name: 'Hash Test',
      };

      const user = await User.create(userData);

      // Password should be hashed, not plain text
      expect(user.password).not.toBe('PlainPassword123');
      expect(user.password).toMatch(/^\$2[aby]\$.{56}$/); // Bcrypt hash pattern
    });

    test('should create different hashes for same password', async () => {
      const password = 'SamePassword123';

      const user1 = await User.create({
        auth0Id: 'clerk_test_hash_2',
        email: 'hash1@example.com',
        password,
        name: 'User One',
      });

      const user2 = await User.create({
        auth0Id: 'clerk_test_hash_3',
        email: 'hash2@example.com',
        password,
        name: 'User Two',
      });

      // Hashes should be different (salt is random)
      expect(user1.password).not.toBe(user2.password);
    });

    test('should verify password using comparePassword method', async () => {
      const password = 'CorrectPassword123';

      const user = await User.create({
        auth0Id: 'clerk_test_compare_1',
        email: 'compare@example.com',
        password,
        name: 'Compare Test',
      });

      // Correct password should match
      const isMatch = await user.comparePassword(password);
      expect(isMatch).toBe(true);

      // Wrong password should not match
      const isWrongMatch = await user.comparePassword('WrongPassword123');
      expect(isWrongMatch).toBe(false);
    });

    test('should not rehash password if not modified', async () => {
      const user = await User.create({
        auth0Id: 'clerk_test_nohash',
        email: 'nohash@example.com',
        password: 'Password123',
        name: 'No Rehash Test',
      });

      const originalHash = user.password;

      // Update name, not password
      user.name = 'Updated Name';
      await user.save();

      // Password hash should remain the same
      expect(user.password).toBe(originalHash);
    });
  });

  describe('OAuth User Creation (UC-003, UC-004)', () => {
    
    test('should create OAuth user without password', async () => {
      const oauthUser = {
        auth0Id: 'google_oauth_user_123',
        email: 'oauth@example.com',
        name: 'OAuth User',
        picture: 'https://example.com/photo.jpg',
      };

      const user = await User.create(oauthUser);

      expect(user).toBeDefined();
      expect(user.email).toBe('oauth@example.com');
      expect(user.password).toBeUndefined();
      expect(user.picture).toBe('https://example.com/photo.jpg');
    });

    test('should populate profile from OAuth provider data', async () => {
      const oauthUser = {
        auth0Id: 'github_oauth_user_456',
        email: 'github@example.com',
        name: 'GitHub User',
        picture: 'https://github.com/avatar.jpg',
        bio: 'Developer from GitHub',
      };

      const user = await User.create(oauthUser);

      expect(user.name).toBe('GitHub User');
      expect(user.bio).toBe('Developer from GitHub');
    });

    test('should handle OAuth user login with existing account', async () => {
      // Create OAuth user
      const oauthUser = await User.create({
        auth0Id: 'linkedin_oauth_user_789',
        email: 'linkedin@example.com',
        name: 'LinkedIn User',
      });

      // Find same user (simulating OAuth login)
      const foundUser = await User.findOne({ email: 'linkedin@example.com' });

      expect(foundUser._id.toString()).toBe(oauthUser._id.toString());
      expect(foundUser.auth0Id).toBe('linkedin_oauth_user_789');
    });
  });

  describe('Account Deletion (UC-009)', () => {
    
    test.skip('should soft delete user account (obsolete - now immediate deletion)', async () => {
      const user = await User.create({
        auth0Id: 'clerk_test_delete_1',
        email: 'delete@example.com',
        password: 'Password123',
        name: 'Delete Test',
      });

      // Soft delete
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      user.isDeleted = true;
      user.deletedAt = now;
      user.deletionExpiresAt = expires;
      await user.save();

      const deletedUser = await User.findById(user._id);

      expect(deletedUser.isDeleted).toBe(true);
      expect(deletedUser.deletedAt).toBeDefined();
      expect(deletedUser.deletionExpiresAt).toBeDefined();
      expect(deletedUser.deletionExpiresAt > now).toBe(true);
    });

    test.skip('should prevent login for soft-deleted accounts (obsolete - no grace period)', async () => {
      const user = await User.create({
        auth0Id: 'clerk_test_delete_2',
        email: 'deleted2@example.com',
        password: 'Password123',
        name: 'Deleted User',
        isDeleted: true,
        deletedAt: new Date(),
        deletionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Should be able to find user but isDeleted is true
      const foundUser = await User.findOne({ email: 'deleted2@example.com' });
      expect(foundUser.isDeleted).toBe(true);
    });

    test('should permanently delete after 30 days', async () => {
      const user = await User.create({
        auth0Id: 'clerk_test_permanent_delete',
        email: 'permanent@example.com',
        password: 'Password123',
        name: 'Permanent Delete Test',
        isDeleted: true,
        deletedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
        deletionExpiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired yesterday
      });

      // Simulate cleanup job - delete expired users
      await User.deleteOne({ _id: user._id });

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('Password Reset (UC-006, UC-007)', () => {
    
    test('should allow password update for existing user', async () => {
      const user = await User.create({
        auth0Id: 'clerk_test_password_reset',
        email: 'reset@example.com',
        password: 'OldPassword123',
        name: 'Reset Test',
      });

      const oldHash = user.password;

      // Update password
      user.password = 'NewPassword456';
      await user.save();

      // Hash should be different
      expect(user.password).not.toBe(oldHash);
      expect(user.password).not.toBe('NewPassword456');

      // Old password should not work
      const oldMatch = await user.comparePassword('OldPassword123');
      expect(oldMatch).toBe(false);

      // New password should work
      const newMatch = await user.comparePassword('NewPassword456');
      expect(newMatch).toBe(true);
    });

    test('should validate new password meets requirements', async () => {
      const user = await User.create({
        auth0Id: 'clerk_test_weak_reset',
        email: 'weakreset@example.com',
        password: 'StrongPassword123',
        name: 'Weak Reset Test',
      });

      // Try to set weak password
      user.password = 'weak'; // Too short, no uppercase, no number

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Session Management', () => {
    
    test('should store Clerk auth0Id correctly', async () => {
      const user = await User.create({
        auth0Id: 'clerk_user_abc123xyz',
        email: 'clerk@example.com',
        name: 'Clerk User',
      });

      expect(user.auth0Id).toBe('clerk_user_abc123xyz');

      // Should be able to find by auth0Id
      const foundUser = await User.findOne({ auth0Id: 'clerk_user_abc123xyz' });
      expect(foundUser.email).toBe('clerk@example.com');
    });

    test('should have unique auth0Id', async () => {
      await User.create({
        auth0Id: 'unique_clerk_id',
        email: 'unique1@example.com',
        name: 'User One',
      });

      // Try to create another user with same auth0Id
      await expect(User.create({
        auth0Id: 'unique_clerk_id',
        email: 'unique2@example.com',
        name: 'User Two',
      })).rejects.toThrow();
    });
  });

  describe('Password Security Edge Cases', () => {
    
    test('should handle extremely long passwords gracefully', async () => {
      // Test with a very long password to ensure bcrypt handles it
      const longPassword = 'A1' + 'a'.repeat(70); // 72 chars (bcrypt max)
      
      const user = await User.create({
        auth0Id: 'clerk_long_password',
        email: 'longpass@example.com',
        password: longPassword,
        name: 'Long Password Test',
      });

      expect(user.password).toBeDefined();
      expect(user.password).not.toBe(longPassword);
      
      // Should still be able to compare
      const match = await user.comparePassword(longPassword);
      expect(match).toBe(true);
    });

    test('should hash password on update', async () => {
      const user = await User.create({
        auth0Id: 'clerk_update_hash',
        email: 'updatehash@example.com',
        password: 'InitialPass123',
        name: 'Update Hash Test',
      });

      const originalHash = user.password;

      // Update user and change password
      user.password = 'NewPassword456';
      await user.save();

      // Password should be hashed again
      expect(user.password).not.toBe('NewPassword456');
      expect(user.password).not.toBe(originalHash);
      
      // New password should work
      const match = await user.comparePassword('NewPassword456');
      expect(match).toBe(true);
    });
  });
});
