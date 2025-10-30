import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Force successResponse to throw to exercise logout catch path
jest.unstable_mockModule('../../utils/responseFormat.js', () => ({
  successResponse: () => { throw new Error('boom'); },
  validationErrorResponse: (message = 'Validation failed', errors = []) => ({
    response: { success: false, message, errors },
    statusCode: 400
  }),
  errorResponse: (message = 'Internal server error', statusCode = 500) => ({ response: { success: false, message }, statusCode }),
  sendResponse: (res, response, status) => res.status(status).json(response),
  ERROR_CODES: {}
}));

const { logout, forgotPassword } = await import('../../controllers/authController.js');

describe.skip('Auth Controller - error paths', () => {
  test('logout returns 500 on internal error', async () => {
    const app = express();
    app.post('/api/auth/logout', logout);
    const res = await request(app).post('/api/auth/logout').expect(500);
    expect(res.body.success).toBe(false);
  });

  test('forgot-password returns 500 on internal error', async () => {
    const app = express();
    app.use(express.json());
    app.post('/api/auth/forgot-password', forgotPassword);
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'x@example.com' }).expect(500);
    expect(res.body.success).toBe(false);
  });
});


