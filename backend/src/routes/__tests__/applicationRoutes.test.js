import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.resetModules();

// Mock middleware and controller modules before importing the router
const mockCheckJwt = jest.fn((req, res, next) => next());
jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({ checkJwt: mockCheckJwt }));

const controllerMocks = {
  generateApplicationPackage: jest.fn(),
  getApplicationPackages: jest.fn(),
  updateApplicationPackage: jest.fn(),
  deleteApplicationPackage: jest.fn(),
  scoreApplicationPackage: jest.fn(),
  scheduleApplication: jest.fn(),
  getScheduledApplications: jest.fn(),
  createAutomationRule: jest.fn(),
  getAutomationRules: jest.fn(),
  updateAutomationRule: jest.fn(),
  deleteAutomationRule: jest.fn(),
  createApplicationTemplate: jest.fn(),
  getApplicationTemplates: jest.fn(),
  updateApplicationTemplate: jest.fn(),
  deleteApplicationTemplate: jest.fn(),
  bulkApply: jest.fn(),
  createApplicationChecklist: jest.fn(),
  getApplicationChecklist: jest.fn(),
  updateChecklistItem: jest.fn(),
  getAllChecklists: jest.fn(),
};

jest.unstable_mockModule('../../controllers/applicationAutomationController.js', () => controllerMocks);

let router;

beforeEach(async () => {
  // Re-import router fresh each test so mocks are effective
  const mod = await import('../applicationRoutes.js');
  router = mod.default;
});

describe('applicationRoutes', () => {
  it('should be an express router with checkJwt applied', () => {
    // router.stack contains layers; the first layers include our middleware
    const hasMiddleware = router.stack.some((layer) => layer.handle === mockCheckJwt);
    expect(hasMiddleware).toBeTruthy();
  });

  it('should register expected routes with correct methods', () => {
    const routeEntries = router.stack.filter((layer) => layer.route);
    const routes = routeEntries.reduce((acc, layer) => {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods);
      if (!acc[path]) acc[path] = new Set();
      methods.forEach((m) => acc[path].add(m));
      return acc;
    }, {});

    const expected = [
      { path: '/packages', methods: ['get', 'post'] },
      { path: '/packages/:packageId', methods: ['delete', 'put'] },
      { path: '/schedule', methods: ['post'] },
      { path: '/scheduled', methods: ['get'] },
      { path: '/automation/rules', methods: ['get', 'post'] },
      { path: '/automation/rules/:ruleId', methods: ['delete', 'put'] },
      { path: '/templates', methods: ['get', 'post'] },
      { path: '/templates/:templateId', methods: ['delete', 'put'] },
      { path: '/bulk-apply', methods: ['post'] },
      { path: '/checklists', methods: ['get', 'post'] },
      { path: '/checklists/:jobId', methods: ['get'] },
      { path: '/checklists/:jobId/items/:itemId', methods: ['put'] },
    ];

    expected.forEach((exp) => {
      const foundSet = routes[exp.path];
      expect(foundSet).toBeDefined();
      // ensure every expected method exists on the route
      exp.methods.forEach((m) => expect(foundSet.has(m)).toBeTruthy());
    });
  });

  it('should reference controller handlers (not their implementation) for at least one route', () => {
    const layer = router.stack.find((l) => l.route && l.route.path === '/packages');
    expect(layer).toBeDefined();
    // route stack contains handlers in stack[0].handle or route.stack
    const handlers = layer.route.stack.map((s) => s.handle);
    // ensure handler is one of the mocked controller functions
    const hasControllerHandler = handlers.some((h) => h === controllerMocks.generateApplicationPackage || h === controllerMocks.getApplicationPackages);
    expect(hasControllerHandler).toBeTruthy();
  });
});
