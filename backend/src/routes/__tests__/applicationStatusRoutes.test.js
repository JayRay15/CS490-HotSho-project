import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock middleware and controller module before importing the router
await jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: function checkJwt(req, res, next) { return next(); }
}));

const controllerMocks = {
  getApplicationStatus: jest.fn(),
  getAllApplicationStatuses: jest.fn(),
  updateApplicationStatus: jest.fn(),
  getStatusTimeline: jest.fn(),
  addTimelineEvent: jest.fn(),
  bulkUpdateStatuses: jest.fn(),
  getStatusStatistics: jest.fn(),
  detectStatusFromEmailEndpoint: jest.fn(),
  confirmStatusDetection: jest.fn(),
  updateAutomationSettings: jest.fn(),
  deleteApplicationStatus: jest.fn()
};

await jest.unstable_mockModule('../../controllers/applicationStatusController.js', () => (controllerMocks));

const { default: router } = await import('../../routes/applicationStatusRoutes.js');

describe('applicationStatusRoutes router', () => {
  it('should register checkJwt middleware', () => {
    // router.stack contains middleware and routes; check for an entry without .route and with name 'checkJwt'
    const found = router.stack.some(layer => !layer.route && layer.name === 'checkJwt');
    expect(found).toBe(true);
  });

  it('should register expected routes and methods', () => {
    const routes = router.stack.filter(l => l.route).map(l => ({ path: l.route.path, methods: l.route.methods }));

    const expected = [
      '/stats',
      '/bulk',
      '/',
      '/:jobId',
      '/:jobId', // delete
      '/:jobId/timeline',
      '/:jobId/timeline', // post
      '/:jobId/detect-from-email',
      '/:jobId/confirm-detection',
      '/:jobId/automation'
    ];

    for (const p of expected) {
      const ok = routes.some(r => r.path === p);
      expect(ok).toBe(true);
    }
  });
});
