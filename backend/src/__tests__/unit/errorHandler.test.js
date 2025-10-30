import express from 'express';
import request from 'supertest';
import multer from 'multer';
import { errorHandler } from '../../middleware/errorHandler.js';

const createAppThatThrows = (thrower) => {
  const app = express();
  app.get('/test', (req, res, next) => {
    try { thrower(); } catch (e) { next(e); }
  });
  app.use(errorHandler);
  return app;
};

describe('errorHandler middleware', () => {
  test('handles Mongoose ValidationError', async () => {
    const validationError = new Error('ValidationError');
    validationError.name = 'ValidationError';
    validationError.errors = { email: { path: 'email', message: 'Invalid', value: 'x' } };
    const app = createAppThatThrows(() => { throw validationError; });
    const res = await request(app).get('/test').expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBeDefined();
  });

  test('handles duplicate key error (code 11000)', async () => {
    const dupError = new Error('Duplicate');
    dupError.code = 11000;
    dupError.keyPattern = { email: 1 };
    dupError.keyValue = { email: 'test@example.com' };
    const app = createAppThatThrows(() => { throw dupError; });
    const res = await request(app).get('/test').expect(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('handles CastError', async () => {
    const castError = new Error('CastError');
    castError.name = 'CastError';
    castError.path = 'id';
    castError.value = 'bad';
    const app = createAppThatThrows(() => { throw castError; });
    const res = await request(app).get('/test').expect(400);
    expect(res.body.message).toMatch(/Invalid id/i);
  });

  test('handles JsonWebTokenError', async () => {
    const jwtErr = new Error('jwt malformed');
    jwtErr.name = 'JsonWebTokenError';
    const app = createAppThatThrows(() => { throw jwtErr; });
    const res = await request(app).get('/test').expect(401);
    expect(res.body.message).toMatch(/Invalid token/i);
  });

  test('handles TokenExpiredError', async () => {
    const expErr = new Error('jwt expired');
    expErr.name = 'TokenExpiredError';
    const app = createAppThatThrows(() => { throw expErr; });
    const res = await request(app).get('/test').expect(401);
    expect(res.body.message).toMatch(/Token expired/i);
  });

  test('handles MulterError (size limit)', async () => {
    const mulErr = new multer.MulterError('LIMIT_FILE_SIZE');
    const app = createAppThatThrows(() => { throw mulErr; });
    const res = await request(app).get('/test').expect(400);
    expect(res.body.message).toMatch(/too large/i);
  });

  test('handles file type error', async () => {
    const err = new Error('Invalid file type');
    const app = createAppThatThrows(() => { throw err; });
    const res = await request(app).get('/test').expect(400);
    expect(res.body.message).toMatch(/Invalid file type/i);
  });

  test('handles custom error with statusCode', async () => {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    const app = createAppThatThrows(() => { throw err; });
    const res = await request(app).get('/test').expect(403);
    expect(res.body.message).toBe('Forbidden');
  });

  test('defaults to 500 for unhandled errors', async () => {
    const err = new Error('Oops');
    const app = createAppThatThrows(() => { throw err; });
    const res = await request(app).get('/test').expect(500);
    expect(res.body.success).toBe(false);
  });
});


