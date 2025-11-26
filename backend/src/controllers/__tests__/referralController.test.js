import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Mock models
const mockReferralFind = jest.fn();
const mockReferralFindOne = jest.fn();
const mockReferralFindOneAndDelete = jest.fn();
const mockReferralSave = jest.fn();
const mockReferralPopulate = jest.fn();

const mockJobFindOne = jest.fn();
const mockContactFindOne = jest.fn();
const mockUserFindOne = jest.fn();
const mockGenerateReferralTemplate = jest.fn();

class MockReferral {
    constructor(data) {
        Object.assign(this, data);
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
    save = mockReferralSave;
    populate = mockReferralPopulate;
}

MockReferral.find = mockReferralFind;
MockReferral.findOne = mockReferralFindOne;
MockReferral.findOneAndDelete = mockReferralFindOneAndDelete;

jest.unstable_mockModule('../../models/Referral.js', () => ({
    default: MockReferral,
}));

jest.unstable_mockModule('../../models/Job.js', () => ({
    Job: {
        findOne: mockJobFindOne,
    },
}));

jest.unstable_mockModule('../../models/Contact.js', () => ({
    default: {
        findOne: mockContactFindOne,
    },
}));

jest.unstable_mockModule('../../models/User.js', () => ({
    User: {
        findOne: mockUserFindOne,
    },
}));

jest.unstable_mockModule('../../utils/geminiService.js', () => ({
    generateReferralTemplate: mockGenerateReferralTemplate,
}));

// Import controller functions
const {
    createReferral,
    getReferrals,
    getReferralById,
    updateReferral,
    deleteReferral,
    generateTemplate,
    getReferralAnalytics,
} = await import('../referralController.js');

describe('Referral Controller', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            auth: { userId: 'user_123' },
            body: {},
            query: {},
            params: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    describe('createReferral', () => {
        it('should return error if required fields are missing', async () => {
            mockReq.body = {};

            await createReferral(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Job ID, Contact ID, and request content are required',
                })
            );
        });

        it('should return error if job not found', async () => {
            mockReq.body = {
                jobId: 'job_123',
                contactId: 'contact_123',
                requestContent: 'Please refer me',
            };
            mockJobFindOne.mockResolvedValueOnce(null);

            await createReferral(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Job not found',
                })
            );
        });

        it('should return error if contact not found', async () => {
            mockReq.body = {
                jobId: 'job_123',
                contactId: 'contact_123',
                requestContent: 'Please refer me',
            };
            mockJobFindOne.mockResolvedValueOnce({ _id: 'job_123' });
            mockContactFindOne.mockResolvedValueOnce(null);

            await createReferral(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Contact not found',
                })
            );
        });

        it('should create referral successfully', async () => {
            mockReq.body = {
                jobId: 'job_123',
                contactId: 'contact_123',
                requestContent: 'Please refer me for this position',
                tone: 'professional',
            };

            const mockJob = { _id: 'job_123', title: 'Software Engineer' };
            const mockContact = { _id: 'contact_123', firstName: 'John' };

            mockJobFindOne.mockResolvedValueOnce(mockJob);
            mockContactFindOne.mockResolvedValueOnce(mockContact);
            mockReferralSave.mockResolvedValueOnce(true);
            mockReferralPopulate.mockResolvedValueOnce({
                jobId: mockJob,
                contactId: mockContact,
                requestContent: 'Please refer me for this position',
            });

            await createReferral(mockReq, mockRes);

            expect(mockReferralSave).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Referral request created successfully',
                })
            );
        });

        it('should set default status to draft', async () => {
            mockReq.body = {
                jobId: 'job_123',
                contactId: 'contact_123',
                requestContent: 'Please refer me',
            };

            mockJobFindOne.mockResolvedValueOnce({ _id: 'job_123' });
            mockContactFindOne.mockResolvedValueOnce({ _id: 'contact_123' });
            mockReferralSave.mockResolvedValueOnce(true);
            mockReferralPopulate.mockResolvedValueOnce({});

            await createReferral(mockReq, mockRes);

            expect(mockReferralSave).toHaveBeenCalled();
        });

        it('should handle server errors', async () => {
            mockReq.body = {
                jobId: 'job_123',
                contactId: 'contact_123',
                requestContent: 'Please refer me',
            };

            mockJobFindOne.mockRejectedValueOnce(new Error('Database error'));

            await createReferral(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Failed to create referral request',
                })
            );
        });
    });

    describe('getReferrals', () => {
        it('should fetch all referrals for user', async () => {
            const mockReferrals = [
                { _id: '1', status: 'draft' },
                { _id: '2', status: 'requested' },
            ];

            mockReferralFind.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue(mockReferrals),
                    }),
                }),
            });

            await getReferrals(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    count: 2,
                    data: mockReferrals,
                })
            );
        });

        it('should filter referrals by status', async () => {
            mockReq.query = { status: 'requested' };

            mockReferralFind.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            await getReferrals(mockReq, mockRes);

            expect(mockReferralFind).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user_123',
                    status: 'requested',
                })
            );
        });

        it('should filter referrals by jobId', async () => {
            mockReq.query = { jobId: 'job_123' };

            mockReferralFind.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            await getReferrals(mockReq, mockRes);

            expect(mockReferralFind).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user_123',
                    jobId: 'job_123',
                })
            );
        });

        it('should handle server errors', async () => {
            mockReferralFind.mockImplementation(() => {
                throw new Error('Database error');
            });

            await getReferrals(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Failed to fetch referrals',
                })
            );
        });
    });

    describe('getReferralById', () => {
        it('should fetch referral by ID', async () => {
            mockReq.params = { id: 'ref_123' };
            const mockReferral = { _id: 'ref_123', status: 'draft' };

            mockReferralFindOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockReferral),
                }),
            });

            await getReferralById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockReferral,
                })
            );
        });

        it('should return 404 if referral not found', async () => {
            mockReq.params = { id: 'ref_123' };

            mockReferralFindOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null),
                }),
            });

            await getReferralById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Referral not found',
                })
            );
        });

        it('should handle server errors', async () => {
            mockReq.params = { id: 'ref_123' };

            mockReferralFindOne.mockImplementation(() => {
                throw new Error('Database error');
            });

            await getReferralById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateReferral', () => {
        it('should update referral successfully', async () => {
            mockReq.params = { id: 'ref_123' };
            mockReq.body = { status: 'requested', notes: 'Updated notes' };

            const mockReferral = {
                _id: 'ref_123',
                status: 'draft',
                save: mockReferralSave,
                populate: mockReferralPopulate,
            };

            mockReferralFindOne.mockResolvedValueOnce(mockReferral);
            mockReferralSave.mockResolvedValueOnce(true);
            mockReferralPopulate.mockResolvedValueOnce(mockReferral);

            await updateReferral(mockReq, mockRes);

            expect(mockReferralSave).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Referral updated successfully',
                })
            );
        });

        it('should return 404 if referral not found', async () => {
            mockReq.params = { id: 'ref_123' };
            mockReq.body = { status: 'requested' };

            mockReferralFindOne.mockResolvedValueOnce(null);

            await updateReferral(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Referral not found',
                })
            );
        });

        it('should set requestedDate when status changes to requested', async () => {
            mockReq.params = { id: 'ref_123' };
            mockReq.body = { status: 'requested' };

            const mockReferral = {
                _id: 'ref_123',
                status: 'draft',
                requestedDate: null,
                save: mockReferralSave,
                populate: mockReferralPopulate,
            };

            mockReferralFindOne.mockResolvedValueOnce(mockReferral);
            mockReferralSave.mockResolvedValueOnce(true);
            mockReferralPopulate.mockResolvedValueOnce(mockReferral);

            await updateReferral(mockReq, mockRes);

            expect(mockReferral.requestedDate).toBeInstanceOf(Date);
        });

        it('should handle server errors', async () => {
            mockReq.params = { id: 'ref_123' };
            mockReq.body = { status: 'requested' };

            mockReferralFindOne.mockRejectedValueOnce(new Error('Database error'));

            await updateReferral(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('deleteReferral', () => {
        it('should delete referral successfully', async () => {
            mockReq.params = { id: 'ref_123' };

            mockReferralFindOneAndDelete.mockResolvedValueOnce({ _id: 'ref_123' });

            await deleteReferral(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Referral deleted successfully',
                })
            );
        });

        it('should return 404 if referral not found', async () => {
            mockReq.params = { id: 'ref_123' };

            mockReferralFindOneAndDelete.mockResolvedValueOnce(null);

            await deleteReferral(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Referral not found',
                })
            );
        });

        it('should handle server errors', async () => {
            mockReq.params = { id: 'ref_123' };

            mockReferralFindOneAndDelete.mockRejectedValueOnce(new Error('Database error'));

            await deleteReferral(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('generateTemplate', () => {
        it('should return error if required fields missing', async () => {
            mockReq.body = {};

            await generateTemplate(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Job ID and Contact ID are required',
                })
            );
        });

        it('should generate template successfully', async () => {
            mockReq.body = {
                jobId: 'job_123',
                contactId: 'contact_123',
                tone: 'professional',
            };

            const mockJob = { _id: 'job_123', title: 'Software Engineer' };
            const mockContact = { _id: 'contact_123', firstName: 'John' };
            const mockUser = { auth0Id: 'user_123', name: 'Test User' };
            const mockTemplate = { content: 'Generated template' };

            mockJobFindOne.mockResolvedValueOnce(mockJob);
            mockContactFindOne.mockResolvedValueOnce(mockContact);
            mockUserFindOne.mockResolvedValueOnce(mockUser);
            mockGenerateReferralTemplate.mockResolvedValueOnce(mockTemplate);

            await generateTemplate(mockReq, mockRes);

            expect(mockGenerateReferralTemplate).toHaveBeenCalledWith(
                mockJob,
                mockContact,
                mockUser,
                'professional'
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Referral template generated successfully',
                    data: mockTemplate,
                })
            );
        });

        it('should handle server errors', async () => {
            mockReq.body = {
                jobId: 'job_123',
                contactId: 'contact_123',
            };

            mockJobFindOne.mockRejectedValueOnce(new Error('Database error'));

            await generateTemplate(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getReferralAnalytics', () => {
        it('should calculate analytics correctly', async () => {
            const mockReferrals = [
                { status: 'draft', outcome: 'pending', etiquetteScore: 8, timingScore: 7, gratitudeExpressed: false },
                { status: 'requested', outcome: 'pending', etiquetteScore: 9, timingScore: 8, gratitudeExpressed: true },
                { status: 'accepted', outcome: 'led_to_interview', etiquetteScore: 10, timingScore: 9, gratitudeExpressed: true },
            ];

            mockReferralFind.mockResolvedValueOnce(mockReferrals);

            await getReferralAnalytics(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        totalReferrals: 3,
                        byStatus: expect.objectContaining({
                            draft: 1,
                            requested: 1,
                            accepted: 1,
                        }),
                        gratitudeExpressedCount: 2,
                    }),
                })
            );
        });

        it('should handle empty referrals', async () => {
            mockReferralFind.mockResolvedValueOnce([]);

            await getReferralAnalytics(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        totalReferrals: 0,
                        successRate: 0,
                        avgEtiquetteScore: 0,
                        avgTimingScore: 0,
                    }),
                })
            );
        });

        it('should handle server errors', async () => {
            mockReferralFind.mockRejectedValueOnce(new Error('Database error'));

            await getReferralAnalytics(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});
