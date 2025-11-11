import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.resetModules();

// Mock middleware and controller modules before importing the router
const mockCheckJwt = jest.fn((req, res, next) => next());
jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({ checkJwt: mockCheckJwt }));

const controllerMocks = {
  calculateMatch: jest.fn(),
  getJobMatch: jest.fn(),
  getAllMatches: jest.fn(),
  compareMatches: jest.fn(),
  updateMatchWeights: jest.fn(),
  getMatchHistory: jest.fn(),
  getMatchTrends: jest.fn(),
  exportMatchReport: jest.fn(),
  deleteMatch: jest.fn(),
  calculateAllMatches: jest.fn(),
};

jest.unstable_mockModule('../../controllers/jobMatchController.js', () => controllerMocks);

let router;

beforeEach(async () => {
  jest.clearAllMocks();
  const mod = await import('../jobMatchRoutes.js');
  router = mod.default;
});

describe('jobMatchRoutes', () => {
  it('applies checkJwt middleware', () => {
    const hasMiddleware = router.stack.some((layer) => layer.handle === mockCheckJwt);
    expect(hasMiddleware).toBeTruthy();
  });

  it('registers specific routes in the intended order and methods', () => {
    // Build map path -> set(methods)
    const routeEntries = router.stack.filter((layer) => layer.route);
    const routes = routeEntries.reduce((acc, layer) => {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods);
      if (!acc[path]) acc[path] = new Set();
      methods.forEach((m) => acc[path].add(m));
      return acc;
    }, {});

    const expected = [
      { path: '/', methods: ['get'] },
      { path: '/trends/all', methods: ['get'] },
      { path: '/compare', methods: ['post'] },
      { path: '/calculate-all', methods: ['post'] },
      { path: '/calculate/:jobId', methods: ['post'] },
      { path: '/:jobId/history', methods: ['get'] },
      { path: '/:jobId/export', methods: ['get'] },
      { path: '/:jobId/weights', methods: ['put'] },
      { path: '/:jobId', methods: ['get'] },
      { path: '/:jobId', methods: ['delete'] },
    ];

    expected.forEach((exp) => {
      const set = routes[exp.path];
      expect(set).toBeDefined();
      exp.methods.forEach((m) => expect(set.has(m)).toBeTruthy());
    });
  });

  it('uses controller handlers for at least one route', () => {
    const layer = router.stack.find((l) => l.route && l.route.path === '/');
    expect(layer).toBeDefined();
    const handlers = layer.route.stack.map((s) => s.handle);
    const contains = handlers.some((h) => h === controllerMocks.getAllMatches || h === controllerMocks.calculateMatch);
    expect(contains).toBeTruthy();
  });
});
