import { jest, beforeEach, describe, it, expect } from '@jest/globals';
import express from 'express';

// Mock controller functions
const mockGetReminders = jest.fn();
const mockGetReminderById = jest.fn();
const mockCreateReminder = jest.fn();
const mockUpdateReminder = jest.fn();
const mockCompleteReminder = jest.fn();
const mockSnoozeReminder = jest.fn();
const mockDismissReminder = jest.fn();
const mockDeleteReminder = jest.fn();
const mockGenerateReminders = jest.fn();
const mockGetMessageTemplates = jest.fn();
const mockGetActivities = jest.fn();
const mockCreateActivity = jest.fn();
const mockGetRelationshipHealth = jest.fn();
const mockGetRelationshipAnalytics = jest.fn();

// Mock checkJwt middleware (middleware function)
const mockCheckJwt = jest.fn((req, res, next) => next());

jest.unstable_mockModule('../../controllers/relationshipMaintenanceController.js', () => ({
    getReminders: mockGetReminders,
    getReminderById: mockGetReminderById,
    createReminder: mockCreateReminder,
    updateReminder: mockUpdateReminder,
    completeReminder: mockCompleteReminder,
    snoozeReminder: mockSnoozeReminder,
    dismissReminder: mockDismissReminder,
    deleteReminder: mockDeleteReminder,
    generateReminders: mockGenerateReminders,
    getMessageTemplates: mockGetMessageTemplates,
    getActivities: mockGetActivities,
    createActivity: mockCreateActivity,
    getRelationshipHealth: mockGetRelationshipHealth,
    getRelationshipAnalytics: mockGetRelationshipAnalytics,
}));

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

const router = (await import('../relationshipMaintenanceRoutes.js')).default;

describe('Relationship Maintenance Routes', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/relationship', router);
        jest.clearAllMocks();
    });

    it('registers checkJwt middleware and route handlers', () => {
        const routes = router.stack.filter(layer => layer.route);
        // Find if any route has our mockCheckJwt in its stack of handlers
        const hasCheckJwt = routes.some(routeLayer =>
            routeLayer.route.stack.some(stackItem => stackItem.handle === mockCheckJwt)
        );

        expect(hasCheckJwt).toBe(true);
    });

    it('defines expected reminder and activity routes', () => {
        const routes = router.stack
            .filter(layer => layer.route)
            .map(layer => ({ path: layer.route.path, methods: Object.keys(layer.route.methods) }));

        const expectedPaths = [
            '/reminders',
            '/reminders/templates',
            '/reminders/generate',
            '/reminders/:id',
            '/reminders',
            '/reminders/:id',
            '/reminders/:id/complete',
            '/reminders/:id/snooze',
            '/reminders/:id/dismiss',
            '/reminders/:id',
            '/activities',
            '/activities',
            '/activities/health/:contactId',
            '/activities/analytics',
        ];

        expectedPaths.forEach(p => {
            const found = routes.find(r => r.path === p);
            expect(found).toBeDefined();
        });

        // Expect total routes to be 14
        expect(routes.length).toBe(14);
    });
});
