import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock User model
const mockUserFindOne = jest.fn();
const mockUserSave = jest.fn();

jest.unstable_mockModule('../../models/User.js', () => ({
    User: {
        findOne: mockUserFindOne,
    },
}));

// Mock Google library
const mockGenerateAuthUrl = jest.fn(() => 'https://accounts.google.com/auth');
const mockGetToken = jest.fn(() => Promise.resolve({ tokens: { access_token: 'token', refresh_token: 'refresh', expiry_date: Date.now() + 3600000 } }));
const mockSetCredentials = jest.fn();
const mockUserinfoGet = jest.fn(() => Promise.resolve({ data: { email: 'test@gmail.com' } }));

const mockOAuth2Client = {
    generateAuthUrl: mockGenerateAuthUrl,
    getToken: mockGetToken,
    setCredentials: mockSetCredentials,
};

const mockOAuth2 = jest.fn(() => ({
    userinfo: { get: mockUserinfoGet },
}));

jest.unstable_mockModule('googleapis', () => ({
    google: {
        auth: {
            OAuth2: jest.fn(() => mockOAuth2Client),
        },
        oauth2: mockOAuth2,
    },
}));

// Mock checkJwt
const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

// Mock global fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: 'token', refresh_token: 'refresh', expires_in: 3600 }),
        text: () => Promise.resolve('{}'),
    })
);

describe('calendarRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();

        const mockUser = {
            auth0Id: 'test-user-id',
            calendarSettings: {
                google: null,
                outlook: null,
                preferences: { defaultCalendar: 'none' }
            },
            save: mockUserSave,
        };
        // Make findOne return a thenable object that supports both direct await
        // and chaining with .select(...)
        mockUserFindOne.mockImplementation(() => {
            const p = Promise.resolve(mockUser);
            return {
                select: jest.fn(() => p),
                then: p.then.bind(p),
                catch: p.catch.bind(p),
            };
        });
        mockUserSave.mockResolvedValue(mockUser);

        app = express();
        app.use(express.json());

        const calendarRoutes = await import('../../routes/calendarRoutes.js');
        app.use('/api/calendar', calendarRoutes.default);
    });

    it('should initiate Google auth', async () => {
        const response = await request(app).get('/api/calendar/google/auth');
        expect(response.status).toBe(200);
        expect(response.body.authUrl).toBeDefined();
        expect(mockGenerateAuthUrl).toHaveBeenCalled();
    });

    it('should handle Google callback', async () => {
        const response = await request(app)
            .get('/api/calendar/google/callback')
            .query({ code: 'authcode', state: 'test-user-id' });

        expect(response.status).toBe(302);
        expect(mockGetToken).toHaveBeenCalled();
    });

    it('should initiate Outlook auth', async () => {
        const response = await request(app).get('/api/calendar/outlook/auth');
        expect(response.status).toBe(200);
        expect(response.body.authUrl).toBeDefined();
    });

    it('should handle Outlook callback', async () => {
        const response = await request(app)
            .get('/api/calendar/outlook/callback')
            .query({ code: 'authcode', state: 'test-user-id' });

        expect(response.status).toBe(302);
        expect(fetch).toHaveBeenCalled();
    });

    it('should disconnect calendar provider', async () => {
        const response = await request(app).post('/api/calendar/disconnect/google');
        expect(response.status).toBe(200);
        expect(mockUserFindOne).toHaveBeenCalled();
    });

    it('should get calendar status', async () => {
        const response = await request(app).get('/api/calendar/status');
        expect(response.status).toBe(200);
        expect(mockUserFindOne).toHaveBeenCalled();
    });

    it('should update calendar preferences', async () => {
        const response = await request(app)
            .put('/api/calendar/preferences')
            .send({ defaultCalendar: 'google' });

        expect(response.status).toBe(200);
        expect(mockUserFindOne).toHaveBeenCalled();
    });

    it('should protect routes with checkJwt', async () => {
        await request(app).get('/api/calendar/google/auth');
        expect(mockCheckJwt).toHaveBeenCalled();
    });
});
