import { jest, beforeEach, describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import NetworkingEvent from '../NetworkingEvent.js';

describe('NetworkingEvent Model', () => {
    describe('Schema Validation', () => {
        it('should validate required fields', () => {
            const event = new NetworkingEvent({});

            const error = event.validateSync();
            expect(error).toBeDefined();
            expect(error.errors.userId).toBeDefined();
            expect(error.errors.name).toBeDefined();
            expect(error.errors.eventDate).toBeDefined();
        });

        it('should create event with valid required fields', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Tech Networking Event',
                eventDate: new Date('2025-12-01'),
            });

            const error = event.validateSync();
            expect(error).toBeUndefined();
            expect(event.userId).toBe('user_123');
            expect(event.name).toBe('Tech Networking Event');
        });

        it('should trim name field', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: '  Tech Event  ',
                eventDate: new Date('2025-12-01'),
            });

            const error = event.validateSync();
            expect(error).toBeUndefined();
            expect(event.name).toBe('Tech Event');
        });

        it('should validate eventType enum', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                eventType: 'InvalidType',
            });

            const error = event.validateSync();
            expect(error).toBeDefined();
            expect(error.errors.eventType).toBeDefined();
        });

        it('should accept valid eventType values', () => {
            const validTypes = [
                'Conference',
                'Meetup',
                'Career Fair',
                'Workshop',
                'Webinar',
                'Social Event',
                'Industry Mixer',
                'Other',
            ];

            validTypes.forEach(type => {
                const event = new NetworkingEvent({
                    userId: 'user_123',
                    name: 'Test Event',
                    eventDate: new Date('2025-12-01'),
                    eventType: type,
                });

                const error = event.validateSync();
                expect(error).toBeUndefined();
                expect(event.eventType).toBe(type);
            });
        });

        it('should default eventType to Other', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
            });

            expect(event.eventType).toBe('Other');
        });

        it('should validate attendanceStatus enum', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                attendanceStatus: 'InvalidStatus',
            });

            const error = event.validateSync();
            expect(error).toBeDefined();
            expect(error.errors.attendanceStatus).toBeDefined();
        });

        it('should accept valid attendanceStatus values', () => {
            const validStatuses = [
                'Planning to Attend',
                'Registered',
                'Attended',
                'Missed',
                'Cancelled',
            ];

            validStatuses.forEach(status => {
                const event = new NetworkingEvent({
                    userId: 'user_123',
                    name: 'Test Event',
                    eventDate: new Date('2025-12-01'),
                    attendanceStatus: status,
                });

                const error = event.validateSync();
                expect(error).toBeUndefined();
                expect(event.attendanceStatus).toBe(status);
            });
        });

        it('should default attendanceStatus to Planning to Attend', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
            });

            expect(event.attendanceStatus).toBe('Planning to Attend');
        });

        it('should default isVirtual to false', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
            });

            expect(event.isVirtual).toBe(false);
        });

        it('should default preparationCompleted to false', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
            });

            expect(event.preparationCompleted).toBe(false);
        });

        it('should default connectionsGained to 0', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
            });

            expect(event.connectionsGained).toBe(0);
        });

        it('should default jobLeadsGenerated to 0', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
            });

            expect(event.jobLeadsGenerated).toBe(0);
        });

        it('should validate connectionsGained minimum value', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                connectionsGained: -1,
            });

            const error = event.validateSync();
            expect(error).toBeDefined();
            expect(error.errors.connectionsGained).toBeDefined();
        });

        it('should validate jobLeadsGenerated minimum value', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                jobLeadsGenerated: -1,
            });

            const error = event.validateSync();
            expect(error).toBeDefined();
            expect(error.errors.jobLeadsGenerated).toBeDefined();
        });

        it('should validate targetConnectionCount minimum value', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                targetConnectionCount: -1,
            });

            const error = event.validateSync();
            expect(error).toBeDefined();
            expect(error.errors.targetConnectionCount).toBeDefined();
        });

        it('should validate roiRating range', () => {
            const invalidRatings = [0, 6, -1, 10];

            invalidRatings.forEach(rating => {
                const event = new NetworkingEvent({
                    userId: 'user_123',
                    name: 'Test Event',
                    eventDate: new Date('2025-12-01'),
                    roiRating: rating,
                });

                const error = event.validateSync();
                expect(error).toBeDefined();
                expect(error.errors.roiRating).toBeDefined();
            });
        });

        it('should accept valid roiRating values', () => {
            const validRatings = [1, 2, 3, 4, 5];

            validRatings.forEach(rating => {
                const event = new NetworkingEvent({
                    userId: 'user_123',
                    name: 'Test Event',
                    eventDate: new Date('2025-12-01'),
                    roiRating: rating,
                });

                const error = event.validateSync();
                expect(error).toBeUndefined();
                expect(event.roiRating).toBe(rating);
            });
        });
    });

    describe('Connection Schema', () => {
        it('should validate required connection fields', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                connections: [{}],
            });

            const error = event.validateSync();
            expect(error).toBeDefined();
            expect(error.errors['connections.0.name']).toBeDefined();
        });

        it('should create connection with valid fields', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                connections: [
                    {
                        name: 'John Doe',
                        notes: 'Met at networking session',
                    },
                ],
            });

            const error = event.validateSync();
            expect(error).toBeUndefined();
            expect(event.connections[0].name).toBe('John Doe');
            expect(event.connections[0].followUpCompleted).toBe(false);
        });

        it('should default followUpCompleted to false', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                connections: [{ name: 'Jane Smith' }],
            });

            expect(event.connections[0].followUpCompleted).toBe(false);
        });

        it('should allow contactId reference', () => {
            const contactId = new mongoose.Types.ObjectId();
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                connections: [
                    {
                        name: 'Jane Smith',
                        contactId: contactId,
                    },
                ],
            });

            const error = event.validateSync();
            expect(error).toBeUndefined();
            expect(event.connections[0].contactId.toString()).toBe(contactId.toString());
        });
    });

    describe('Goals Schema', () => {
        it('should create goals with description', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                goals: [
                    {
                        description: 'Meet 5 new people',
                    },
                ],
            });

            const error = event.validateSync();
            expect(error).toBeUndefined();
            expect(event.goals[0].description).toBe('Meet 5 new people');
            expect(event.goals[0].achieved).toBe(false);
        });

        it('should default achieved to false', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                goals: [{ description: 'Network with recruiters' }],
            });

            expect(event.goals[0].achieved).toBe(false);
        });
    });

    describe('Follow-Up Actions Schema', () => {
        it('should create follow-up actions', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                followUpActions: [
                    {
                        action: 'Send LinkedIn requests',
                        dueDate: new Date('2025-12-05'),
                    },
                ],
            });

            const error = event.validateSync();
            expect(error).toBeUndefined();
            expect(event.followUpActions[0].action).toBe('Send LinkedIn requests');
            expect(event.followUpActions[0].completed).toBe(false);
        });

        it('should default completed to false', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                followUpActions: [{ action: 'Follow up with contacts' }],
            });

            expect(event.followUpActions[0].completed).toBe(false);
        });
    });

    describe('Virtual Properties', () => {
        it('should calculate isUpcoming for future events', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Future Event',
                eventDate: futureDate,
            });

            expect(event.isUpcoming).toBe(true);
        });

        it('should calculate isUpcoming as false for past events', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 7);

            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Past Event',
                eventDate: pastDate,
            });

            expect(event.isUpcoming).toBe(false);
        });

        it('should calculate isUpcoming as false for cancelled events', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Cancelled Event',
                eventDate: futureDate,
                attendanceStatus: 'Cancelled',
            });

            expect(event.isUpcoming).toBe(false);
        });

        it('should calculate isPast for past events', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 7);

            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Past Event',
                eventDate: pastDate,
            });

            expect(event.isPast).toBe(true);
        });

        it('should calculate isPast as false for future events', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Future Event',
                eventDate: futureDate,
            });

            expect(event.isPast).toBe(false);
        });

        it('should calculate goalCompletionRate with no goals', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
            });

            expect(event.goalCompletionRate).toBe(0);
        });

        it('should calculate goalCompletionRate with all goals achieved', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                goals: [
                    { description: 'Goal 1', achieved: true },
                    { description: 'Goal 2', achieved: true },
                ],
            });

            expect(event.goalCompletionRate).toBe(100);
        });

        it('should calculate goalCompletionRate with partial completion', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                goals: [
                    { description: 'Goal 1', achieved: true },
                    { description: 'Goal 2', achieved: false },
                ],
            });

            expect(event.goalCompletionRate).toBe(50);
        });

        it('should calculate goalCompletionRate with no goals achieved', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Test Event',
                eventDate: new Date('2025-12-01'),
                goals: [
                    { description: 'Goal 1', achieved: false },
                    { description: 'Goal 2', achieved: false },
                ],
            });

            expect(event.goalCompletionRate).toBe(0);
        });
    });

    describe('Complete Event Creation', () => {
        it('should create event with all optional fields', () => {
            const event = new NetworkingEvent({
                userId: 'user_123',
                name: 'Tech Conference 2025',
                eventDate: new Date('2025-12-01'),
                endDate: new Date('2025-12-03'),
                location: 'San Francisco, CA',
                eventType: 'Conference',
                isVirtual: false,
                industry: 'Technology',
                description: 'Annual tech conference',
                attendanceStatus: 'Registered',
                preparationNotes: 'Research speakers',
                preparationCompleted: true,
                goals: [
                    { description: 'Meet 10 people', achieved: false },
                ],
                targetConnectionCount: 10,
                connectionsGained: 5,
                connections: [
                    { name: 'John Doe', notes: 'CEO of StartupXYZ' },
                ],
                keyTakeaways: 'Great insights on AI',
                postEventNotes: 'Very productive event',
                followUpActions: [
                    { action: 'Send thank you emails', completed: false },
                ],
                jobLeadsGenerated: 2,
                roiRating: 5,
                organizer: 'TechEvents Inc',
                website: 'https://techconf.com',
                cost: 500,
                tags: ['AI', 'Networking', 'Technology'],
            });

            const error = event.validateSync();
            expect(error).toBeUndefined();
            expect(event.name).toBe('Tech Conference 2025');
            expect(event.eventType).toBe('Conference');
            expect(event.connectionsGained).toBe(5);
            expect(event.roiRating).toBe(5);
            expect(event.tags).toHaveLength(3);
        });
    });
});
