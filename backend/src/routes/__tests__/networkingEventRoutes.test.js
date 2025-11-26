import { jest, beforeEach, describe, it, expect } from '@jest/globals';
import express from 'express';

// Mock the controller functions
const mockGetNetworkingEvents = jest.fn();
const mockGetNetworkingEventById = jest.fn();
const mockCreateNetworkingEvent = jest.fn();
const mockUpdateNetworkingEvent = jest.fn();
const mockDeleteNetworkingEvent = jest.fn();
const mockGetNetworkingStats = jest.fn();
const mockAddConnection = jest.fn();
const mockUpdateConnection = jest.fn();
const mockDeleteConnection = jest.fn();
const mockDiscoverEvents = jest.fn();
const mockGetCategories = jest.fn();

// Mock Clerk middleware: both are factories that return middleware functions
const mockClerkMiddleware = jest.fn(() => (req, res, next) => next());
const mockRequireAuth = jest.fn(() => (req, res, next) => next());

jest.unstable_mockModule('@clerk/express', () => ({
    clerkMiddleware: mockClerkMiddleware,
    requireAuth: mockRequireAuth,
}));

jest.unstable_mockModule('../../controllers/networkingEventController.js', () => ({
    getNetworkingEvents: mockGetNetworkingEvents,
    getNetworkingEventById: mockGetNetworkingEventById,
    createNetworkingEvent: mockCreateNetworkingEvent,
    updateNetworkingEvent: mockUpdateNetworkingEvent,
    deleteNetworkingEvent: mockDeleteNetworkingEvent,
    getNetworkingStats: mockGetNetworkingStats,
    addConnection: mockAddConnection,
    updateConnection: mockUpdateConnection,
    deleteConnection: mockDeleteConnection,
    discoverEvents: mockDiscoverEvents,
    getCategories: mockGetCategories,
}));

// Import the router after mocking
const router = (await import('../networkingEventRoutes')).default;

describe('Networking Event Routes', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/networking-events', router);
        jest.clearAllMocks();
    });

    describe('Middleware', () => {
        it('should register router-level middleware (clerk + auth)', () => {
            const middlewareLayers = router.stack.filter(layer => !layer.route);
            // Expect at least two non-route middleware layers (clerk and requireAuth)
            expect(middlewareLayers.length).toBeGreaterThanOrEqual(2);
            // Each middleware layer should have a handle function
            middlewareLayers.forEach(layer => {
                expect(typeof layer.handle).toBe('function');
            });
        });
    });

    describe('Route Definitions', () => {
        it('should define GET / route', () => {
            const routes = router.stack
                .filter(layer => layer.route)
                .map(layer => ({
                    path: layer.route.path,
                    methods: Object.keys(layer.route.methods),
                }));

            const getRoute = routes.find(r => r.path === '/' && r.methods.includes('get'));
            expect(getRoute).toBeDefined();
        });

        it('should define GET /stats route', () => {
            const routes = router.stack
                .filter(layer => layer.route)
                .map(layer => ({
                    path: layer.route.path,
                    methods: Object.keys(layer.route.methods),
                }));

            const statsRoute = routes.find(r => r.path === '/stats' && r.methods.includes('get'));
            expect(statsRoute).toBeDefined();
        });

        it('should define GET /discover route', () => {
            const routes = router.stack
                .filter(layer => layer.route)
                .map(layer => ({
                    path: layer.route.path,
                    methods: Object.keys(layer.route.methods),
                }));

            const discoverRoute = routes.find(r => r.path === '/discover' && r.methods.includes('get'));
            expect(discoverRoute).toBeDefined();
        });

        it('should define GET /categories route', () => {
            const routes = router.stack
                .filter(layer => layer.route)
                .map(layer => ({
                    path: layer.route.path,
                    methods: Object.keys(layer.route.methods),
                }));

            const categoriesRoute = routes.find(r => r.path === '/categories' && r.methods.includes('get'));
            expect(categoriesRoute).toBeDefined();
        });

        it('should define GET /:id route', () => {
            const routes = router.stack
                .filter(layer => layer.route)
                .map(layer => ({
                    path: layer.route.path,
                    methods: Object.keys(layer.route.methods),
                }));

            const getByIdRoute = routes.find(r => r.path === '/:id' && r.methods.includes('get'));
            expect(getByIdRoute).toBeDefined();
        });

        it('should define POST / route', () => {
            const routes = router.stack
                .filter(layer => layer.route)
                .map(layer => ({
                    path: layer.route.path,
                    methods: Object.keys(layer.route.methods),
                }));

            const postRoute = routes.find(r => r.path === '/' && r.methods.includes('post'));
            expect(postRoute).toBeDefined();
        });

        it('should define PUT /:id route', () => {
            const routes = router.stack
                .filter(layer => layer.route)
                .map(layer => ({
                    path: layer.route.path,
                    methods: Object.keys(layer.route.methods),
                }));

            const putRoute = routes.find(r => r.path === '/:id' && r.methods.includes('put'));
            expect(putRoute).toBeDefined();
        });

        it('should define DELETE /:id route', () => {
            const routes = router.stack
                .filter(layer => layer.route)
                .map(layer => ({
                    path: layer.route.path,
                    methods: Object.keys(layer.route.methods),
                }));

            const deleteRoute = routes.find(r => r.path === '/:id' && r.methods.includes('delete'));
            expect(deleteRoute).toBeDefined();
        });

        it('should define POST /:id/connections route', () => {
            const routes = router.stack
                .filter(layer => layer.route)
                .map(layer => ({
                    path: layer.route.path,
                    methods: Object.keys(layer.route.methods),
                }));

            const addConnectionRoute = routes.find(
                r => r.path === '/:id/connections' && r.methods.includes('post')
            );
            expect(addConnectionRoute).toBeDefined();
        });

        it('should define PUT /:id/connections/:connectionId route', () => {
            const routes = router.stack
                .filter(layer => layer.route)
                .map(layer => ({
                    path: layer.route.path,
                    methods: Object.keys(layer.route.methods),
                }));

            const updateConnectionRoute = routes.find(
                r => r.path === '/:id/connections/:connectionId' && r.methods.includes('put')
            );
            expect(updateConnectionRoute).toBeDefined();
        });

        it('should define DELETE /:id/connections/:connectionId route', () => {
            const routes = router.stack
                .filter(layer => layer.route)
                .map(layer => ({
                    path: layer.route.path,
                    methods: Object.keys(layer.route.methods),
                }));

            const deleteConnectionRoute = routes.find(
                r => r.path === '/:id/connections/:connectionId' && r.methods.includes('delete')
            );
            expect(deleteConnectionRoute).toBeDefined();
        });
    });

    describe('Route Count', () => {
        it('should have all expected routes defined', () => {
            const routes = router.stack.filter(layer => layer.route);

            // We expect 11 routes total:
            // GET /, GET /stats, GET /discover, GET /categories, GET /:id
            // POST /, PUT /:id, DELETE /:id
            // POST /:id/connections, PUT /:id/connections/:connectionId, DELETE /:id/connections/:connectionId
            expect(routes.length).toBe(11);
        });
    });

    describe('Router Type', () => {
        it('should be an Express router', () => {
            expect(router).toBeDefined();
            expect(typeof router).toBe('function');
            expect(router.stack).toBeDefined();
        });
    });
});
