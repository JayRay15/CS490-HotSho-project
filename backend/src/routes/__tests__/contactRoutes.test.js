import { jest } from '@jest/globals';

// Mock the authentication middleware to just call next()
jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: (req, res, next) => next(),
}));

// Create mock controller handlers
const mockHandlers = {
  getContacts: jest.fn((req, res) => res.json({ handler: 'getContacts' })),
  getContactById: jest.fn((req, res) => res.json({ handler: 'getContactById', id: req.params.id })),
  createContact: jest.fn((req, res) => res.status(201).json({ handler: 'createContact' })),
  updateContact: jest.fn((req, res) => res.json({ handler: 'updateContact', id: req.params.id })),
  deleteContact: jest.fn((req, res) => res.status(204).send()),
  addInteraction: jest.fn((req, res) => res.status(201).json({ handler: 'addInteraction', id: req.params.id })),
  getUpcomingFollowUps: jest.fn((req, res) => res.json({ handler: 'getUpcomingFollowUps' })),
  getContactStats: jest.fn((req, res) => res.json({ handler: 'getContactStats' })),
  linkContactToJob: jest.fn((req, res) => res.json({ handler: 'linkContactToJob', id: req.params.id, jobId: req.params.jobId })),
  batchCreateContacts: jest.fn((req, res) => res.status(201).json({ handler: 'batchCreateContacts' })),
  generateReferenceRequest: jest.fn((req, res) => res.status(200).json({ handler: 'generateReferenceRequest' })),
  // Discovery-related controllers (route imports expect these named exports)
  discoverContactsController: jest.fn((req, res) => res.json({ handler: 'discoverContactsController' })),
  discoverExternalContactsController: jest.fn((req, res) => res.json({ handler: 'discoverExternalContactsController' })),
  getDiscoveryFiltersController: jest.fn((req, res) => res.json({ handler: 'getDiscoveryFiltersController' })),
  getSuggestedContactsController: jest.fn((req, res) => res.json({ handler: 'getSuggestedContactsController' })),
  trackDiscoverySuccess: jest.fn((req, res) => res.status(200).json({ handler: 'trackDiscoverySuccess' })),
};

jest.unstable_mockModule('../../controllers/contactController.js', () => mockHandlers);

const express = (await import('express')).default;
const request = (await import('supertest')).default;
const { default: contactRoutes } = await import('../contactRoutes.js');

describe('contactRoutes router', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/contacts', contactRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/contacts/stats -> getContactStats', async () => {
    const res = await request(app).get('/api/contacts/stats');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'getContactStats' });
    expect(mockHandlers.getContactStats).toHaveBeenCalled();
  });

  test('GET /api/contacts/follow-ups/upcoming -> getUpcomingFollowUps', async () => {
    const res = await request(app).get('/api/contacts/follow-ups/upcoming');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'getUpcomingFollowUps' });
    expect(mockHandlers.getUpcomingFollowUps).toHaveBeenCalled();
  });

  test('GET /api/contacts -> getContacts', async () => {
    const res = await request(app).get('/api/contacts');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'getContacts' });
    expect(mockHandlers.getContacts).toHaveBeenCalled();
  });

  test('GET /api/contacts/:id -> getContactById', async () => {
    const res = await request(app).get('/api/contacts/123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'getContactById', id: '123' });
    expect(mockHandlers.getContactById).toHaveBeenCalled();
  });

  test('POST /api/contacts -> createContact', async () => {
    const res = await request(app).post('/api/contacts').send({ name: 'Alice' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ handler: 'createContact' });
    expect(mockHandlers.createContact).toHaveBeenCalled();
  });

  test('PUT /api/contacts/:id -> updateContact', async () => {
    const res = await request(app).put('/api/contacts/321').send({ name: 'Bob' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'updateContact', id: '321' });
    expect(mockHandlers.updateContact).toHaveBeenCalled();
  });

  test('DELETE /api/contacts/:id -> deleteContact', async () => {
    const res = await request(app).delete('/api/contacts/999');
    expect(res.status).toBe(204);
    expect(mockHandlers.deleteContact).toHaveBeenCalled();
  });

  test('POST /api/contacts/:id/interactions -> addInteraction', async () => {
    const res = await request(app).post('/api/contacts/55/interactions').send({ note: 'met' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ handler: 'addInteraction', id: '55' });
    expect(mockHandlers.addInteraction).toHaveBeenCalled();
  });

  test('POST /api/contacts/:id/link-job/:jobId -> linkContactToJob', async () => {
    const res = await request(app).post('/api/contacts/77/link-job/abc123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'linkContactToJob', id: '77', jobId: 'abc123' });
    expect(mockHandlers.linkContactToJob).toHaveBeenCalled();
  });

  test('POST /api/contacts/batch -> batchCreateContacts', async () => {
    const res = await request(app).post('/api/contacts/batch').send([{ name: 'A' }]);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ handler: 'batchCreateContacts' });
    expect(mockHandlers.batchCreateContacts).toHaveBeenCalled();
  });

  test('POST /api/contacts/reference-request -> generateReferenceRequest', async () => {
    const res = await request(app).post('/api/contacts/reference-request').send({ contactId: 'x' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'generateReferenceRequest' });
    expect(mockHandlers.generateReferenceRequest).toHaveBeenCalled();
  });
});
