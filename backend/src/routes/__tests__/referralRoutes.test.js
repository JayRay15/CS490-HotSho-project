import { jest } from '@jest/globals';

// Mock the authentication middleware to just call next()
jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: (req, res, next) => next(),
}));

// Create mock controller handlers for referrals
const mockHandlers = {
  createReferral: jest.fn((req, res) => res.status(201).json({ handler: 'createReferral' })),
  getReferrals: jest.fn((req, res) => res.json({ handler: 'getReferrals' })),
  getReferralById: jest.fn((req, res) => res.json({ handler: 'getReferralById', id: req.params.id })),
  updateReferral: jest.fn((req, res) => res.json({ handler: 'updateReferral', id: req.params.id })),
  deleteReferral: jest.fn((req, res) => res.status(204).send()),
  generateTemplate: jest.fn((req, res) => res.json({ handler: 'generateTemplate' })),
  getReferralAnalytics: jest.fn((req, res) => res.json({ handler: 'getReferralAnalytics' })),
};

jest.unstable_mockModule('../../controllers/referralController.js', () => mockHandlers);

const express = (await import('express')).default;
const request = (await import('supertest')).default;
const { default: referralRoutes } = await import('../referralRoutes.js');

describe('referralRoutes router', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/referrals', referralRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/referrals/analytics -> getReferralAnalytics', async () => {
    const res = await request(app).get('/api/referrals/analytics');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'getReferralAnalytics' });
    expect(mockHandlers.getReferralAnalytics).toHaveBeenCalled();
  });

  test('POST /api/referrals/generate-template -> generateTemplate', async () => {
    const res = await request(app).post('/api/referrals/generate-template').send({ prompt: 'hi' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'generateTemplate' });
    expect(mockHandlers.generateTemplate).toHaveBeenCalled();
  });

  test('GET /api/referrals -> getReferrals', async () => {
    const res = await request(app).get('/api/referrals');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'getReferrals' });
    expect(mockHandlers.getReferrals).toHaveBeenCalled();
  });

  test('POST /api/referrals -> createReferral', async () => {
    const res = await request(app).post('/api/referrals').send({ name: 'Ref' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ handler: 'createReferral' });
    expect(mockHandlers.createReferral).toHaveBeenCalled();
  });

  test('GET /api/referrals/:id -> getReferralById', async () => {
    const res = await request(app).get('/api/referrals/42');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'getReferralById', id: '42' });
    expect(mockHandlers.getReferralById).toHaveBeenCalled();
  });

  test('PUT /api/referrals/:id -> updateReferral', async () => {
    const res = await request(app).put('/api/referrals/77').send({ status: 'ok' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'updateReferral', id: '77' });
    expect(mockHandlers.updateReferral).toHaveBeenCalled();
  });

  test('DELETE /api/referrals/:id -> deleteReferral', async () => {
    const res = await request(app).delete('/api/referrals/99');
    expect(res.status).toBe(204);
    expect(mockHandlers.deleteReferral).toHaveBeenCalled();
  });
});
