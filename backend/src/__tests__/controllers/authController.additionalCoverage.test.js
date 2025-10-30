// Additional tests to push authController coverage above 90%
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { registerUser } from '../../controllers/authController.js';
import User from '../../models/User.js';

// Mock Clerk SDK
jest.mock('@clerk/express', () => ({
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
}));

import { clerkClient } from '@clerk/express';

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.auth = {
    userId: 'user_test123',
    payload: { sub: 'user_test123' }
  };
  next();
});

app.post('/api/auth/register', registerUser);

describe('AuthController - Additional Coverage Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotshot-test');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
    
    // Default mock for Clerk user
    clerkClient.users.getUser.mockResolvedValue({
      id: 'user_test123',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register - Deletion Grace Period Logic', () => {
    it('should reject registration if email has account scheduled for deletion (within grace period)', async () => {
      // Create a soft-deleted user with deletion scheduled in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15); // 15 days from now
      
      await User.create({
        auth0Id: 'old_user_123',
        email: 'test@example.com',
        name: 'Old User',
        isDeleted: true,
        deletionExpiresAt: futureDate
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/scheduled for deletion/i);
      expect(response.body.message).toMatch(/15 day/i);
      expect(response.body.errorCode).toBe('DUPLICATE_ENTRY');
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].field).toBe('email');
    });

    it('should calculate days remaining correctly (1 day remaining)', async () => {
      // Create user scheduled for deletion tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59); // End of tomorrow
      
      await User.create({
        auth0Id: 'old_user_456',
        email: 'test@example.com',
        name: 'Old User',
        isDeleted: true,
        deletionExpiresAt: tomorrow
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/1 day/i);
    });

    it('should permanently delete expired account and allow re-registration', async () => {
      // Create a soft-deleted user with expired deletion date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5); // 5 days ago
      
      const oldUser = await User.create({
        auth0Id: 'old_user_789',
        email: 'test@example.com',
        name: 'Old User',
        isDeleted: true,
        deletionExpiresAt: pastDate
      });

      const oldUserId = oldUser._id;

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/registered successfully/i);

      // Verify old user was permanently deleted
      const deletedUser = await User.findById(oldUserId);
      expect(deletedUser).toBeNull();

      // Verify new user was created
      const newUser = await User.findOne({ email: 'test@example.com', isDeleted: false });
      expect(newUser).toBeTruthy();
      expect(newUser.auth0Id).toBe('user_test123');
    });

    it('should handle registration when expired deletion account exists (edge case: exactly at expiration)', async () => {
      // Create user with deletion expiring right now
      const now = new Date();
      
      await User.create({
        auth0Id: 'old_user_edge',
        email: 'test@example.com',
        name: 'Edge User',
        isDeleted: true,
        deletionExpiresAt: now
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      // Should allow registration as expiration time has passed
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should handle registration with deleted user but no deletionExpiresAt set', async () => {
      // Create soft-deleted user without expiration date (old data format)
      await User.create({
        auth0Id: 'old_user_no_expiry',
        email: 'test@example.com',
        name: 'Old User',
        isDeleted: true
        // no deletionExpiresAt
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      // Should allow registration as there's no active grace period
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/register - Name Handling Edge Cases', () => {
    it('should use "Unknown User" when Clerk provides no name data', async () => {
      clerkClient.users.getUser.mockResolvedValue({
        id: 'user_test123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        // No firstName or lastName
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(201);
      
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user.name).toBe('Unknown User');
    });

    it('should construct name from firstName only when lastName is missing', async () => {
      clerkClient.users.getUser.mockResolvedValue({
        id: 'user_test123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        // No lastName
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(201);
      
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user.name).toBe('John');
    });

    it('should construct name from lastName only when firstName is missing', async () => {
      clerkClient.users.getUser.mockResolvedValue({
        id: 'user_test123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        lastName: 'Doe',
        // No firstName
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(201);
      
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user.name).toBe('Doe');
    });
  });

  describe('POST /api/auth/register - Error Code Coverage', () => {
    it('should return proper error structure for grace period conflict', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      await User.create({
        auth0Id: 'old_user',
        email: 'test@example.com',
        name: 'Old User',
        isDeleted: true,
        deletionExpiresAt: futureDate
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errorCode', 'DUPLICATE_ENTRY');
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('field', 'email');
      expect(response.body.errors[0]).toHaveProperty('message');
      expect(response.body.errors[0]).toHaveProperty('value', 'test@example.com');
    });
  });
});
