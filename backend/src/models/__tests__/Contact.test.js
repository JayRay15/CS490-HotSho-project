import { jest, beforeEach, describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import Contact from '../Contact.js';

describe('Contact Model', () => {
    describe('Schema Validation', () => {
        it('should validate required fields', () => {
            const contact = new Contact({});

            const error = contact.validateSync();
            expect(error).toBeDefined();
            expect(error.errors.userId).toBeDefined();
            expect(error.errors.firstName).toBeDefined();
        });

        it('should create contact with valid required fields', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.userId).toBe('user_123');
            expect(contact.firstName).toBe('John');
        });

        it('should allow lastName to be optional', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
        });

        it('should trim firstName', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: '  John  ',
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.firstName).toBe('John');
        });

        it('should trim lastName', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                lastName: '  Doe  ',
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.lastName).toBe('Doe');
        });

        it('should lowercase email', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                email: 'JOHN.DOE@EXAMPLE.COM',
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.email).toBe('john.doe@example.com');
        });

        it('should validate relationshipType enum', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                relationshipType: 'InvalidType',
            });

            const error = contact.validateSync();
            expect(error).toBeDefined();
            expect(error.errors.relationshipType).toBeDefined();
        });

        it('should accept valid relationshipType values', () => {
            const validTypes = [
                'Mentor',
                'Peer',
                'Recruiter',
                'Manager',
                'Colleague',
                'Alumni',
                'Industry Contact',
                'Other',
            ];

            validTypes.forEach(type => {
                const contact = new Contact({
                    userId: 'user_123',
                    firstName: 'John',
                    relationshipType: type,
                });

                const error = contact.validateSync();
                expect(error).toBeUndefined();
                expect(contact.relationshipType).toBe(type);
            });
        });

        it('should default relationshipType to Other', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
            });

            expect(contact.relationshipType).toBe('Other');
        });

        it('should validate relationshipStrength enum', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                relationshipStrength: 'InvalidStrength',
            });

            const error = contact.validateSync();
            expect(error).toBeDefined();
            expect(error.errors.relationshipStrength).toBeDefined();
        });

        it('should accept valid relationshipStrength values', () => {
            const validStrengths = ['Strong', 'Medium', 'Weak', 'New'];

            validStrengths.forEach(strength => {
                const contact = new Contact({
                    userId: 'user_123',
                    firstName: 'John',
                    relationshipStrength: strength,
                });

                const error = contact.validateSync();
                expect(error).toBeUndefined();
                expect(contact.relationshipStrength).toBe(strength);
            });
        });

        it('should default relationshipStrength to New', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
            });

            expect(contact.relationshipStrength).toBe('New');
        });

        it('should default canProvideReferral to false', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
            });

            expect(contact.canProvideReferral).toBe(false);
        });

        it('should default isReference to false', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
            });

            expect(contact.isReference).toBe(false);
        });

        it('should default reminderEnabled to false', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
            });

            expect(contact.reminderEnabled).toBe(false);
        });
    });

    describe('Interaction Schema', () => {
        it('should validate required interaction fields', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                interactions: [{}],
            });

            const error = contact.validateSync();
            expect(error).toBeDefined();
            expect(error.errors['interactions.0.type']).toBeDefined();
        });

        it('should create interaction with valid fields', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                interactions: [
                    {
                        type: 'Email',
                        notes: 'Discussed job opportunity',
                    },
                ],
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.interactions[0].type).toBe('Email');
            expect(contact.interactions[0].notes).toBe('Discussed job opportunity');
        });

        it('should default interaction date to now', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                interactions: [
                    {
                        type: 'Phone',
                    },
                ],
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.interactions[0].date).toBeDefined();
            expect(contact.interactions[0].date).toBeInstanceOf(Date);
        });

        it('should validate interaction type enum', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                interactions: [
                    {
                        type: 'InvalidType',
                    },
                ],
            });

            const error = contact.validateSync();
            expect(error).toBeDefined();
            expect(error.errors['interactions.0.type']).toBeDefined();
        });

        it('should accept valid interaction types', () => {
            const validTypes = [
                'Email',
                'Phone',
                'Meeting',
                'LinkedIn',
                'Coffee Chat',
                'Conference',
                'Reference Request',
                'Reference Feedback',
                'Other',
            ];

            validTypes.forEach(type => {
                const contact = new Contact({
                    userId: 'user_123',
                    firstName: 'John',
                    interactions: [{ type }],
                });

                const error = contact.validateSync();
                expect(error).toBeUndefined();
                expect(contact.interactions[0].type).toBe(type);
            });
        });

        it('should allow jobId reference in interaction', () => {
            const jobId = new mongoose.Types.ObjectId();
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                interactions: [
                    {
                        type: 'Email',
                        jobId: jobId,
                    },
                ],
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.interactions[0].jobId.toString()).toBe(jobId.toString());
        });

        it('should trim interaction notes', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                interactions: [
                    {
                        type: 'Meeting',
                        notes: '  Great conversation  ',
                    },
                ],
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.interactions[0].notes).toBe('Great conversation');
        });
    });

    describe('Virtual Properties', () => {
        it('should calculate fullName with firstName and lastName', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                lastName: 'Doe',
            });

            expect(contact.fullName).toBe('John Doe');
        });

        it('should calculate fullName with only firstName', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
            });

            expect(contact.fullName).toBe('John undefined');
        });
    });

    describe('Optional Fields', () => {
        it('should accept all optional profile fields', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '+1234567890',
                company: 'Tech Corp',
                jobTitle: 'Software Engineer',
                industry: 'Technology',
                linkedInUrl: 'https://linkedin.com/in/johndoe',
                location: 'San Francisco, CA',
                notes: 'Met at conference',
                personalInterests: 'Hiking, Photography',
                professionalInterests: 'AI, Cloud Computing',
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.company).toBe('Tech Corp');
            expect(contact.jobTitle).toBe('Software Engineer');
            expect(contact.industry).toBe('Technology');
        });

        it('should accept mutualConnections array', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                mutualConnections: ['Jane Smith', 'Bob Johnson'],
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.mutualConnections).toHaveLength(2);
            expect(contact.mutualConnections[0]).toBe('Jane Smith');
        });

        it('should accept tags array', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                tags: ['Recruiter', 'Tech', 'Bay Area'],
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.tags).toHaveLength(3);
            expect(contact.tags).toContain('Recruiter');
        });

        it('should accept linkedJobIds array', () => {
            const jobId1 = new mongoose.Types.ObjectId();
            const jobId2 = new mongoose.Types.ObjectId();

            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                linkedJobIds: [jobId1, jobId2],
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.linkedJobIds).toHaveLength(2);
        });

        it('should accept follow-up dates', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                lastContactDate: new Date('2025-01-01'),
                nextFollowUpDate: new Date('2025-02-01'),
                reminderEnabled: true,
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.lastContactDate).toBeInstanceOf(Date);
            expect(contact.nextFollowUpDate).toBeInstanceOf(Date);
            expect(contact.reminderEnabled).toBe(true);
        });
    });

    describe('Google CSV Import Fields', () => {
        it('should accept Google CSV import fields', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                middleName: 'Michael',
                lastName: 'Doe',
                phoneticFirstName: 'Jon',
                phoneticMiddleName: 'Maikl',
                phoneticLastName: 'Doh',
                prefix: 'Dr.',
                suffix: 'Jr.',
                nickname: 'Johnny',
                fileAs: 'Doe, John',
                department: 'Engineering',
                birthday: '1990-01-15',
                photo: 'https://example.com/photo.jpg',
                emailLabel: 'Work',
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.middleName).toBe('Michael');
            expect(contact.prefix).toBe('Dr.');
            expect(contact.suffix).toBe('Jr.');
            expect(contact.nickname).toBe('Johnny');
            expect(contact.department).toBe('Engineering');
        });

        it('should trim all Google CSV fields', () => {
            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                middleName: '  Michael  ',
                prefix: '  Dr.  ',
                suffix: '  Jr.  ',
                nickname: '  Johnny  ',
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.middleName).toBe('Michael');
            expect(contact.prefix).toBe('Dr.');
            expect(contact.suffix).toBe('Jr.');
            expect(contact.nickname).toBe('Johnny');
        });
    });

    describe('Complete Contact Creation', () => {
        it('should create contact with all fields', () => {
            const jobId = new mongoose.Types.ObjectId();

            const contact = new Contact({
                userId: 'user_123',
                firstName: 'John',
                lastName: 'Doe',
                middleName: 'Michael',
                email: 'john.doe@example.com',
                phone: '+1234567890',
                company: 'Tech Corp',
                jobTitle: 'Senior Software Engineer',
                industry: 'Technology',
                relationshipType: 'Mentor',
                relationshipStrength: 'Strong',
                linkedInUrl: 'https://linkedin.com/in/johndoe',
                location: 'San Francisco, CA',
                notes: 'Very helpful mentor',
                personalInterests: 'Hiking, Photography',
                professionalInterests: 'AI, Cloud Computing',
                mutualConnections: ['Jane Smith'],
                tags: ['Mentor', 'Tech Lead'],
                interactions: [
                    {
                        date: new Date('2025-01-15'),
                        type: 'Coffee Chat',
                        notes: 'Discussed career growth',
                        jobId: jobId,
                    },
                ],
                lastContactDate: new Date('2025-01-15'),
                nextFollowUpDate: new Date('2025-02-15'),
                reminderEnabled: true,
                linkedJobIds: [jobId],
                canProvideReferral: true,
                isReference: true,
                prefix: 'Dr.',
                suffix: 'PhD',
                nickname: 'Johnny',
                department: 'Engineering',
                birthday: '1985-05-20',
            });

            const error = contact.validateSync();
            expect(error).toBeUndefined();
            expect(contact.fullName).toBe('John Doe');
            expect(contact.relationshipType).toBe('Mentor');
            expect(contact.relationshipStrength).toBe('Strong');
            expect(contact.canProvideReferral).toBe(true);
            expect(contact.isReference).toBe(true);
            expect(contact.interactions).toHaveLength(1);
            expect(contact.tags).toHaveLength(2);
        });
    });
});
