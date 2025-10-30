import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// ESM-friendly mock of @clerk/express
jest.unstable_mockModule('@clerk/express', () => ({
  requireAuth: () => (req, res, next) => {
    if (req.__authError) return next(req.__authError);
    req.auth = req.__authPayload || { userId: 'test_user', payload: { sub: 'test_user' } };
    next();
  }
}));

const { checkJwt } = await import('../../middleware/checkJwt.js');

describe('checkJwt middleware', () => {
  const createApp = (prepare) => {
    const app = express();
    app.get('/protected', (req, res, next) => {
      if (prepare) prepare(req);
      next();
    }, checkJwt, (req, res) => {
      res.json({ ok: true, userId: req.auth?.userId || req.auth?.payload?.sub });
    });
    return app;
  };

  test('allows request with valid auth payload (userId)', async () => {
    const app = createApp((req) => {
      req.__authPayload = { userId: 'valid_user', payload: { sub: 'valid_user' } };
    });
    const res = await request(app).get('/protected').expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.userId).toBe('valid_user');
  });

  test('allows request with valid auth payload (payload.sub only)', async () => {
    const app = createApp((req) => {
      req.__authPayload = { payload: { sub: 'from_sub' } };
    });
    const res = await request(app).get('/protected').expect(200);
    expect(res.body.userId).toBe('from_sub');
  });

  test('rejects when Clerk returns an auth error', async () => {
    const app = createApp((req) => {
      req.__authError = new Error('Invalid token');
    });
    const res = await request(app).get('/protected').expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Unauthorized/i);
  });

  test('rejects when auth payload is missing', async () => {
    const app = createApp((req) => {
      req.__authPayload = {}; // no userId or payload.sub
    });
    const res = await request(app).get('/protected').expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Unable to identify user/i);
  });
});


