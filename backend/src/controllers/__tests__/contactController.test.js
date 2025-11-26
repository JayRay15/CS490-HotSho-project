import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Mock models
const mockContactFind = jest.fn();
const mockContactFindOne = jest.fn();
const mockContactFindOneAndDelete = jest.fn();
const mockContactCreate = jest.fn();
const mockContactInsertMany = jest.fn();
const mockContactSave = jest.fn();

const mockJobFindOne = jest.fn();
const mockGenerateReferenceRequestEmail = jest.fn();

class MockContact {
    constructor(data) {
        Object.assign(this, data);
        this.interactions = data.interactions || [];
        this.linkedJobIds = data.linkedJobIds || [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
    save = mockContactSave;
}

MockContact.find = mockContactFind;
MockContact.findOne = mockContactFindOne;
MockContact.findOneAndDelete = mockContactFindOneAndDelete;
MockContact.create = mockContactCreate;
MockContact.insertMany = mockContactInsertMany;

jest.unstable_mockModule('../../models/Contact.js', () => ({
    default: MockContact,
}));

jest.unstable_mockModule('../../models/Job.js', () => ({
    Job: {
        findOne: mockJobFindOne,
    },
}));

jest.unstable_mockModule('../../utils/geminiService.js', () => ({
    generateReferenceRequestEmail: mockGenerateReferenceRequestEmail,
}));

// Import controller functions
const {
    getContacts,
    getContactById,
    createContact,
    updateContact,
    deleteContact,
    addInteraction,
    getUpcomingFollowUps,
    getContactStats,
    linkContactToJob,
    batchCreateContacts,
    generateReferenceRequest,
} = await import('../contactController.js');

describe('Contact Controller', () => {
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

    describe('getContacts', () => {
        it('should fetch all contacts for user', async () => {
            const mockContacts = [
                { _id: '1', firstName: 'John', lastName: 'Doe' },
                { _id: '2', firstName: 'Jane', lastName: 'Smith' },
            ];

            mockContactFind.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockContacts),
                }),
            });

            await getContacts(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    count: 2,
                    data: mockContacts,
                })
            );
        });

        it('should filter contacts by search query', async () => {
            mockReq.query = { search: 'John' };

            mockContactFind.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue([]),
                }),
            });

            await getContacts(mockReq, mockRes);

            expect(mockContactFind).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user_123',
                    $or: expect.any(Array),
                })
            );
        });

        it('should filter contacts by relationshipType', async () => {
            mockReq.query = { relationshipType: 'Mentor' };

            mockContactFind.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue([]),
                }),
            });

            await getContacts(mockReq, mockRes);

            expect(mockContactFind).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user_123',
                    relationshipType: 'Mentor',
                })
            );
        });

        it('should sort contacts by name', async () => {
            mockReq.query = { sortBy: 'name' };

            const mockSort = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue([]),
            });

            mockContactFind.mockReturnValue({
                sort: mockSort,
            });

            await getContacts(mockReq, mockRes);

            expect(mockSort).toHaveBeenCalledWith({ lastName: 1, firstName: 1 });
        });

        it('should handle server errors', async () => {
            mockContactFind.mockImplementation(() => {
                throw new Error('Database error');
            });

            await getContacts(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Failed to fetch contacts',
                })
            );
        });
    });

    describe('getContactById', () => {
        it('should fetch contact by ID', async () => {
            mockReq.params = { id: 'contact_123' };
            const mockContact = { _id: 'contact_123', firstName: 'John' };

            mockContactFindOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockContact),
            });

            await getContactById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockContact,
                })
            );
        });

        it('should return 404 if contact not found', async () => {
            mockReq.params = { id: 'contact_123' };

            mockContactFindOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            await getContactById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Contact not found',
                })
            );
        });

        it('should handle server errors', async () => {
            mockReq.params = { id: 'contact_123' };

            mockContactFindOne.mockImplementation(() => {
                throw new Error('Database error');
            });

            await getContactById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('createContact', () => {
        it('should create contact successfully', async () => {
            mockReq.body = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
            };

            const mockContact = { _id: 'contact_123', ...mockReq.body, userId: 'user_123' };
            mockContactCreate.mockResolvedValueOnce(mockContact);

            await createContact(mockReq, mockRes);

            expect(mockContactCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    firstName: 'John',
                    lastName: 'Doe',
                    userId: 'user_123',
                })
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Contact created successfully',
                })
            );
        });

        it('should set lastContactDate if interactions exist', async () => {
            mockReq.body = {
                firstName: 'John',
                interactions: [{ type: 'Email', date: new Date() }],
            };

            mockContactCreate.mockResolvedValueOnce({});

            await createContact(mockReq, mockRes);

            expect(mockContactCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    lastContactDate: expect.any(Date),
                })
            );
        });

        it('should handle server errors', async () => {
            mockReq.body = { firstName: 'John' };
            mockContactCreate.mockRejectedValueOnce(new Error('Database error'));

            await createContact(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateContact', () => {
        it('should update contact successfully', async () => {
            mockReq.params = { id: 'contact_123' };
            mockReq.body = { firstName: 'Jane', company: 'Tech Corp' };

            const mockContact = {
                _id: 'contact_123',
                firstName: 'John',
                save: mockContactSave,
            };

            mockContactFindOne.mockResolvedValueOnce(mockContact);
            mockContactSave.mockResolvedValueOnce(mockContact);

            await updateContact(mockReq, mockRes);

            expect(mockContactSave).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Contact updated successfully',
                })
            );
        });

        it('should return 404 if contact not found', async () => {
            mockReq.params = { id: 'contact_123' };
            mockReq.body = { firstName: 'Jane' };

            mockContactFindOne.mockResolvedValueOnce(null);

            await updateContact(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should update lastContactDate when interactions are modified', async () => {
            mockReq.params = { id: 'contact_123' };
            mockReq.body = {
                interactions: [{ type: 'Email', date: new Date() }],
            };

            const mockContact = {
                _id: 'contact_123',
                save: mockContactSave,
            };

            mockContactFindOne.mockResolvedValueOnce(mockContact);
            mockContactSave.mockResolvedValueOnce(mockContact);

            await updateContact(mockReq, mockRes);

            expect(mockContact.lastContactDate).toBeDefined();
        });

        it('should handle server errors', async () => {
            mockReq.params = { id: 'contact_123' };
            mockReq.body = { firstName: 'Jane' };

            mockContactFindOne.mockRejectedValueOnce(new Error('Database error'));

            await updateContact(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('deleteContact', () => {
        it('should delete contact successfully', async () => {
            mockReq.params = { id: 'contact_123' };

            mockContactFindOneAndDelete.mockResolvedValueOnce({ _id: 'contact_123' });

            await deleteContact(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Contact deleted successfully',
                })
            );
        });

        it('should return 404 if contact not found', async () => {
            mockReq.params = { id: 'contact_123' };

            mockContactFindOneAndDelete.mockResolvedValueOnce(null);

            await deleteContact(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should handle server errors', async () => {
            mockReq.params = { id: 'contact_123' };

            mockContactFindOneAndDelete.mockRejectedValueOnce(new Error('Database error'));

            await deleteContact(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('addInteraction', () => {
        it('should add interaction successfully', async () => {
            mockReq.params = { id: 'contact_123' };
            mockReq.body = {
                type: 'Email',
                notes: 'Discussed job opportunity',
            };

            const mockContact = {
                _id: 'contact_123',
                interactions: [],
                save: mockContactSave,
            };

            mockContactFindOne.mockResolvedValueOnce(mockContact);
            mockContactSave.mockResolvedValueOnce(mockContact);

            await addInteraction(mockReq, mockRes);

            expect(mockContact.interactions).toHaveLength(1);
            expect(mockContact.lastContactDate).toBeDefined();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if contact not found', async () => {
            mockReq.params = { id: 'contact_123' };
            mockReq.body = { type: 'Email' };

            mockContactFindOne.mockResolvedValueOnce(null);

            await addInteraction(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should handle server errors', async () => {
            mockReq.params = { id: 'contact_123' };
            mockReq.body = { type: 'Email' };

            mockContactFindOne.mockRejectedValueOnce(new Error('Database error'));

            await addInteraction(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getUpcomingFollowUps', () => {
        it('should fetch upcoming follow-ups', async () => {
            const mockContacts = [
                { _id: '1', firstName: 'John', nextFollowUpDate: new Date() },
            ];

            mockContactFind.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockContacts),
            });

            await getUpcomingFollowUps(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    count: 1,
                    data: mockContacts,
                })
            );
        });

        it('should filter by date range and reminderEnabled', async () => {
            mockContactFind.mockReturnValue({
                sort: jest.fn().mockResolvedValue([]),
            });

            await getUpcomingFollowUps(mockReq, mockRes);

            expect(mockContactFind).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user_123',
                    reminderEnabled: true,
                    nextFollowUpDate: expect.any(Object),
                })
            );
        });

        it('should handle server errors', async () => {
            mockContactFind.mockImplementation(() => {
                throw new Error('Database error');
            });

            await getUpcomingFollowUps(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getContactStats', () => {
        it('should calculate contact statistics', async () => {
            const mockContacts = [
                {
                    relationshipType: 'Mentor',
                    relationshipStrength: 'Strong',
                    nextFollowUpDate: new Date(Date.now() + 86400000),
                    lastContactDate: new Date(),
                    isReference: false,
                    interactions: [],
                },
                {
                    relationshipType: 'Peer',
                    relationshipStrength: 'Medium',
                    nextFollowUpDate: null,
                    lastContactDate: new Date(Date.now() - 86400000 * 40),
                    isReference: true,
                    interactions: [
                        { type: 'Reference Request' },
                        { type: 'Reference Feedback' },
                    ],
                },
            ];

            mockContactFind.mockResolvedValueOnce(mockContacts);

            await getContactStats(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        total: 2,
                        byRelationshipType: expect.any(Object),
                        byRelationshipStrength: expect.any(Object),
                        withUpcomingFollowUps: 1,
                        recentInteractions: 1,
                        totalReferences: 1,
                        referenceRequests: 1,
                        referenceFeedback: 1,
                    }),
                })
            );
        });

        it('should handle empty contacts', async () => {
            mockContactFind.mockResolvedValueOnce([]);

            await getContactStats(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        total: 0,
                    }),
                })
            );
        });

        it('should handle server errors', async () => {
            mockContactFind.mockRejectedValueOnce(new Error('Database error'));

            await getContactStats(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('linkContactToJob', () => {
        it('should link contact to job successfully', async () => {
            mockReq.params = { id: 'contact_123', jobId: 'job_123' };

            const mockContact = {
                _id: 'contact_123',
                linkedJobIds: [],
                save: mockContactSave,
            };

            const mockJob = { _id: 'job_123', title: 'Software Engineer' };

            mockContactFindOne.mockResolvedValueOnce(mockContact);
            mockJobFindOne.mockResolvedValueOnce(mockJob);
            mockContactSave.mockResolvedValueOnce(mockContact);

            await linkContactToJob(mockReq, mockRes);

            expect(mockContact.linkedJobIds).toContain('job_123');
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if contact not found', async () => {
            mockReq.params = { id: 'contact_123', jobId: 'job_123' };

            mockContactFindOne.mockResolvedValueOnce(null);

            await linkContactToJob(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Contact not found',
                })
            );
        });

        it('should return 404 if job not found', async () => {
            mockReq.params = { id: 'contact_123', jobId: 'job_123' };

            mockContactFindOne.mockResolvedValueOnce({ _id: 'contact_123' });
            mockJobFindOne.mockResolvedValueOnce(null);

            await linkContactToJob(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Job not found',
                })
            );
        });

        it('should handle server errors', async () => {
            mockReq.params = { id: 'contact_123', jobId: 'job_123' };

            mockContactFindOne.mockRejectedValueOnce(new Error('Database error'));

            await linkContactToJob(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('batchCreateContacts', () => {
        it('should batch create contacts successfully', async () => {
            mockReq.body = {
                contacts: [
                    { firstName: 'John', lastName: 'Doe' },
                    { firstName: 'Jane', lastName: 'Smith' },
                ],
            };

            const mockCreatedContacts = [
                { _id: '1', firstName: 'John', userId: 'user_123' },
                { _id: '2', firstName: 'Jane', userId: 'user_123' },
            ];

            mockContactInsertMany.mockResolvedValueOnce(mockCreatedContacts);

            await batchCreateContacts(mockReq, mockRes);

            expect(mockContactInsertMany).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Successfully imported 2 contacts',
                })
            );
        });

        it('should return error if no contacts provided', async () => {
            mockReq.body = {};

            await batchCreateContacts(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'No contacts provided',
                })
            );
        });

        it('should handle server errors', async () => {
            mockReq.body = {
                contacts: [{ firstName: 'John' }],
            };

            mockContactInsertMany.mockRejectedValueOnce(new Error('Database error'));

            await batchCreateContacts(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('generateReferenceRequest', () => {
        it('should generate reference request successfully', async () => {
            mockReq.body = {
                referenceId: 'contact_123',
                jobId: 'job_123',
            };

            const mockContact = {
                _id: 'contact_123',
                firstName: 'John',
                interactions: [],
                linkedJobIds: [],
                save: mockContactSave,
            };

            const mockJob = {
                _id: 'job_123',
                jobTitle: 'Software Engineer',
                company: 'Tech Corp',
            };

            const mockRequestData = {
                subject: 'Reference Request',
                body: 'Generated email body',
            };

            mockContactFindOne.mockResolvedValueOnce(mockContact);
            mockJobFindOne.mockResolvedValueOnce(mockJob);
            mockGenerateReferenceRequestEmail.mockResolvedValueOnce(mockRequestData);
            mockContactSave.mockResolvedValueOnce(mockContact);

            await generateReferenceRequest(mockReq, mockRes);

            expect(mockGenerateReferenceRequestEmail).toHaveBeenCalled();
            expect(mockContact.interactions).toHaveLength(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should return error if required fields missing', async () => {
            mockReq.body = {};

            await generateReferenceRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Reference ID and Job ID are required',
                })
            );
        });

        it('should return 404 if reference not found', async () => {
            mockReq.body = {
                referenceId: 'contact_123',
                jobId: 'job_123',
            };

            mockContactFindOne.mockResolvedValueOnce(null);

            await generateReferenceRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Reference contact not found',
                })
            );
        });

        it('should return 404 if job not found', async () => {
            mockReq.body = {
                referenceId: 'contact_123',
                jobId: 'job_123',
            };

            mockContactFindOne.mockResolvedValueOnce({ _id: 'contact_123' });
            mockJobFindOne.mockResolvedValueOnce(null);

            await generateReferenceRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Job application not found',
                })
            );
        });

        it('should handle server errors', async () => {
            mockReq.body = {
                referenceId: 'contact_123',
                jobId: 'job_123',
            };

            mockContactFindOne.mockRejectedValueOnce(new Error('Database error'));

            await generateReferenceRequest(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});
