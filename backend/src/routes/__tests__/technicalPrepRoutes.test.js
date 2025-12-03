import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controller
const mockGetTechnicalPrep = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockUpdateTechnicalPrep = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockGetCodingChallenges = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetCodingChallenge = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockSubmitCodingSolution = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockDeleteCodingChallenge = jest.fn((req, res) => res.json({ success: true, message: 'Deleted' }));
const mockGetHint = jest.fn((req, res) => res.json({ success: true, hint: 'hint' }));
const mockGetSolution = jest.fn((req, res) => res.json({ success: true, solution: 'solution' }));
const mockGetSystemDesignQuestions = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetSystemDesignQuestion = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockSubmitSystemDesignSolution = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockDeleteSystemDesignQuestion = jest.fn((req, res) => res.json({ success: true, message: 'Deleted' }));
const mockGetCaseStudies = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetCaseStudy = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockSubmitCaseStudySolution = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockDeleteCaseStudy = jest.fn((req, res) => res.json({ success: true, message: 'Deleted' }));
const mockGenerateJobSpecificChallenges = jest.fn((req, res) => res.json({ success: true, data: [] }));
const mockGetPerformanceAnalytics = jest.fn((req, res) => res.json({ success: true, data: {} }));
const mockBookmarkChallenge = jest.fn((req, res) => res.json({ success: true, message: 'Bookmarked' }));
const mockGetBookmarkedChallenges = jest.fn((req, res) => res.json({ success: true, data: [] }));

jest.unstable_mockModule('../../controllers/technicalPrepController.js', () => ({
    getTechnicalPrep: mockGetTechnicalPrep,
    updateTechnicalPrep: mockUpdateTechnicalPrep,
    getCodingChallenges: mockGetCodingChallenges,
    getCodingChallenge: mockGetCodingChallenge,
    submitCodingSolution: mockSubmitCodingSolution,
    deleteCodingChallenge: mockDeleteCodingChallenge,
    getHint: mockGetHint,
    getSolution: mockGetSolution,
    getSystemDesignQuestions: mockGetSystemDesignQuestions,
    getSystemDesignQuestion: mockGetSystemDesignQuestion,
    submitSystemDesignSolution: mockSubmitSystemDesignSolution,
    deleteSystemDesignQuestion: mockDeleteSystemDesignQuestion,
    getCaseStudies: mockGetCaseStudies,
    getCaseStudy: mockGetCaseStudy,
    submitCaseStudySolution: mockSubmitCaseStudySolution,
    deleteCaseStudy: mockDeleteCaseStudy,
    generateJobSpecificChallenges: mockGenerateJobSpecificChallenges,
    getPerformanceAnalytics: mockGetPerformanceAnalytics,
    bookmarkChallenge: mockBookmarkChallenge,
    getBookmarkedChallenges: mockGetBookmarkedChallenges,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
    req.auth = { userId: 'test-user-id' };
    next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
    checkJwt: mockCheckJwt,
}));

describe('technicalPrepRoutes', () => {
    let app;

    beforeEach(async () => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());

        const technicalPrepRoutes = await import('../../routes/technicalPrepRoutes.js');
        app.use('/api/technical-prep', technicalPrepRoutes.default);
    });

    describe('GET /api/technical-prep/profile', () => {
        it('should get technical prep profile', async () => {
            const response = await request(app).get('/api/technical-prep/profile');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetTechnicalPrep).toHaveBeenCalled();
        });

        it('should protect the route with checkJwt middleware', async () => {
            await request(app).get('/api/technical-prep/profile');
            expect(mockCheckJwt).toHaveBeenCalled();
        });
    });

    describe('PUT /api/technical-prep/profile', () => {
        it('should update technical prep profile', async () => {
            const response = await request(app)
                .put('/api/technical-prep/profile')
                .send({ preferredLanguage: 'Python' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockUpdateTechnicalPrep).toHaveBeenCalled();
        });
    });

    describe('GET /api/technical-prep/coding-challenges', () => {
        it('should get coding challenges', async () => {
            const response = await request(app).get('/api/technical-prep/coding-challenges');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetCodingChallenges).toHaveBeenCalled();
        });
    });

    describe('GET /api/technical-prep/coding-challenges/:id', () => {
        it('should get a specific coding challenge', async () => {
            const response = await request(app).get('/api/technical-prep/coding-challenges/challenge123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetCodingChallenge).toHaveBeenCalled();
        });
    });

    describe('POST /api/technical-prep/coding-challenges/:challengeId/submit', () => {
        it('should submit coding solution', async () => {
            const response = await request(app)
                .post('/api/technical-prep/coding-challenges/challenge123/submit')
                .send({ code: 'solution code' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockSubmitCodingSolution).toHaveBeenCalled();
        });
    });

    describe('GET /api/technical-prep/coding-challenges/:id/hint', () => {
        it('should get hint for challenge', async () => {
            const response = await request(app).get('/api/technical-prep/coding-challenges/challenge123/hint');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetHint).toHaveBeenCalled();
        });
    });

    describe('GET /api/technical-prep/coding-challenges/:id/solution', () => {
        it('should get solution for challenge', async () => {
            const response = await request(app).get('/api/technical-prep/coding-challenges/challenge123/solution');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetSolution).toHaveBeenCalled();
        });
    });

    describe('GET /api/technical-prep/system-design', () => {
        it('should get system design questions', async () => {
            const response = await request(app).get('/api/technical-prep/system-design');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetSystemDesignQuestions).toHaveBeenCalled();
        });
    });

    describe('GET /api/technical-prep/system-design/:id', () => {
        it('should get a specific system design question', async () => {
            const response = await request(app).get('/api/technical-prep/system-design/sd123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetSystemDesignQuestion).toHaveBeenCalled();
        });
    });

    describe('POST /api/technical-prep/system-design/:questionId/submit', () => {
        it('should submit system design solution', async () => {
            const response = await request(app)
                .post('/api/technical-prep/system-design/sd123/submit')
                .send({ design: 'my design' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockSubmitSystemDesignSolution).toHaveBeenCalled();
        });
    });

    describe('GET /api/technical-prep/case-studies', () => {
        it('should get case studies', async () => {
            const response = await request(app).get('/api/technical-prep/case-studies');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetCaseStudies).toHaveBeenCalled();
        });
    });

    describe('GET /api/technical-prep/case-studies/:id', () => {
        it('should get a specific case study', async () => {
            const response = await request(app).get('/api/technical-prep/case-studies/case123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetCaseStudy).toHaveBeenCalled();
        });
    });

    describe('POST /api/technical-prep/case-studies/:caseStudyId/submit', () => {
        it('should submit case study solution', async () => {
            const response = await request(app)
                .post('/api/technical-prep/case-studies/case123/submit')
                .send({ solution: 'my solution' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockSubmitCaseStudySolution).toHaveBeenCalled();
        });
    });

    describe('GET /api/technical-prep/job/:jobId/challenges', () => {
        it('should generate job-specific challenges', async () => {
            const response = await request(app).get('/api/technical-prep/job/job123/challenges');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGenerateJobSpecificChallenges).toHaveBeenCalled();
        });
    });

    describe('GET /api/technical-prep/performance', () => {
        it('should get performance analytics', async () => {
            const response = await request(app).get('/api/technical-prep/performance');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetPerformanceAnalytics).toHaveBeenCalled();
        });
    });

    describe('POST /api/technical-prep/bookmark', () => {
        it('should bookmark a challenge', async () => {
            const response = await request(app)
                .post('/api/technical-prep/bookmark')
                .send({ challengeId: 'challenge123' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockBookmarkChallenge).toHaveBeenCalled();
        });
    });

    describe('GET /api/technical-prep/bookmarks', () => {
        it('should get bookmarked challenges', async () => {
            const response = await request(app).get('/api/technical-prep/bookmarks');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockGetBookmarkedChallenges).toHaveBeenCalled();
        });
    });

    describe('middleware application', () => {
        it('should apply checkJwt to all routes via router.use', async () => {
            await request(app).get('/api/technical-prep/profile');
            expect(mockCheckJwt).toHaveBeenCalled();
        });

        it('should reject unauthenticated requests when middleware fails', async () => {
            mockCheckJwt.mockImplementationOnce((req, res, next) => {
                res.status(401).json({ success: false, message: 'Unauthorized' });
            });

            const response = await request(app).get('/api/technical-prep/profile');

            expect(response.status).toBe(401);
            expect(mockGetTechnicalPrep).not.toHaveBeenCalled();
        });
    });
});
