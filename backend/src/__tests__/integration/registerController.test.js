import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { User } from '../../models/User.js';

// Mock Clerk client used by authController
const mockGetUser = jest.fn();
// ESM-friendly mock of Clerk client
jest.unstable_mockModule('@clerk/express', () => ({
  clerkClient: {
    users: { getUser: (...args) => mockGetUser(...args) }
  }
}));

const { register } = await import('../../controllers/authController.js');

const createApp = (userId = 'clerk_user_123') => {
  const app = express();
  app.use(express.json());
  const mockAuth = (req, res, next) => { req.auth = { userId, payload: { sub: userId } }; next(); };
  app.post('/api/auth/register', mockAuth, register);
  return app;
};

const SKIP_DB = !!process.env.CI && !process.env.MONGODB_URI;
const describeMaybe = SKIP_DB ? describe.skip : describe;

describeMaybe('Auth Register Integration (with mocked Clerk)', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    mockGetUser.mockReset();
  });

  test('registers new user with Clerk data', async () => {
    mockGetUser.mockResolvedValue({
      id: 'clerk_user_123',
      fullName: 'John Doe',
      primaryEmailAddress: { emailAddress: 'john.doe@example.com' },
      imageUrl: 'https://example.com/photo.jpg',
    });
    const app = createApp('clerk_user_123');
    const res = await request(app).post('/api/auth/register').expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('john.doe@example.com');
    expect(res.body.data.name).toBe('John Doe');
  });

  test('returns existing user if already registered (idempotent)', async () => {
    await User.create({ auth0Id: 'clerk_user_123', email: 'existing@example.com', name: 'Existing' });
    mockGetUser.mockResolvedValue({ id: 'clerk_user_123', fullName: 'John', primaryEmailAddress: { emailAddress: 'existing@example.com' }});
    const app = createApp('clerk_user_123');
    const res = await request(app).post('/api/auth/register').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('derives name from first/last when fullName missing', async () => {
    mockGetUser.mockResolvedValue({
      id: 'clerk_user_999',
      firstName: 'Jane',
      lastName: 'Doe',
      primaryEmailAddress: { emailAddress: 'jane.doe@example.com' },
      imageUrl: undefined,
    });
    const app = createApp('clerk_user_999');
    const res = await request(app).post('/api/auth/register').expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Jane Doe');
    expect(res.body.data.email).toBe('jane.doe@example.com');
  });

  test('rejects when email invalid/missing', async () => {
    mockGetUser.mockResolvedValue({ id: 'clerk_user_123', fullName: 'No Email User' });
    const app = createApp('clerk_user_123');
    const res = await request(app).post('/api/auth/register').expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid email/i);
  });

  test('rejects duplicate email when another active user has it', async () => {
    await User.create({ auth0Id: 'different', email: 'dup@example.com', name: 'Other' });
    mockGetUser.mockResolvedValue({ id: 'clerk_user_123', fullName: 'Dup', primaryEmailAddress: { emailAddress: 'dup@example.com' }});
    const app = createApp('clerk_user_123');
    const res = await request(app).post('/api/auth/register').expect(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test.skip('blocks re-registration during deletion grace period (obsolete - no grace period)', async () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    await User.create({ auth0Id: 'clerk_user_123', email: 'deleted@example.com', name: 'Deleted', isDeleted: true, deletionExpiresAt: future });
    mockGetUser.mockResolvedValue({ id: 'clerk_user_123', fullName: 'John', primaryEmailAddress: { emailAddress: 'deleted@example.com' }});
    const app = createApp('clerk_user_123');
    const res = await request(app).post('/api/auth/register').expect(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/scheduled for deletion/i);
  });

  test.skip('allows re-registration after grace period (obsolete - immediate deletion policy)', async () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    await User.create({ auth0Id: 'clerk_user_123', email: 'expired@example.com', name: 'Expired', isDeleted: true, deletionExpiresAt: past });
    mockGetUser.mockResolvedValue({ id: 'clerk_user_123', fullName: 'John', primaryEmailAddress: { emailAddress: 'expired@example.com' }});
    const app = createApp('clerk_user_123');
    const res = await request(app).post('/api/auth/register').expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/registered successfully/i);
  });

  test('treats Clerk fetch failure by requiring email validation', async () => {
    mockGetUser.mockRejectedValue(new Error('Clerk API error'));
    const app = createApp('clerk_user_123');
    const res = await request(app).post('/api/auth/register').expect(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects when unauthenticated', async () => {
    const app = express();
    app.use(express.json());
    app.post('/api/auth/register', register);
    const res = await request(app).post('/api/auth/register').expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Unauthorized/i);
  });
});


