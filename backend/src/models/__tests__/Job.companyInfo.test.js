/**
 * UC-062: Company Information Display
 * Test file for Job model with company information
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Job } from '../Job.js';

describe('UC-062: Job Model - Company Information', () => {
    beforeEach(() => {
        // Clear any previous test data
        // Note: These are unit tests that work with Job instances in memory
    });

    it('should create a job with company information', () => {
        const jobData = {
            userId: 'test-user-id',
            title: 'Test Job for UC-062',
            company: 'Test Company',
            status: 'Interested',
            companyInfo: {
                size: '51-200',
                website: 'https://testcompany.com',
                description: 'A test company for UC-062',
                mission: 'To test company information feature',
                logo: 'https://testcompany.com/logo.png',
                contactInfo: {
                    email: 'contact@testcompany.com',
                    phone: '(555) 123-4567',
                    address: '123 Test St, Test City, TS 12345',
                },
                glassdoorRating: {
                    rating: 4.5,
                    reviewCount: 150,
                    url: 'https://glassdoor.com/testcompany',
                },
                recentNews: [
                    {
                        title: 'Test Company Launches New Product',
                        summary: 'Exciting new product announced',
                        url: 'https://news.com/article',
                        date: new Date('2024-01-15'),
                    },
                ],
            },
        };

        const job = new Job(jobData);

        expect(job).toBeDefined();
        expect(job.companyInfo).toBeDefined();
        expect(job.companyInfo.size).toBe('51-200');
        expect(job.companyInfo.website).toBe('https://testcompany.com');
        expect(job.companyInfo.description).toBe('A test company for UC-062');
        expect(job.companyInfo.mission).toBe('To test company information feature');
        expect(job.companyInfo.logo).toBe('https://testcompany.com/logo.png');
        expect(job.companyInfo.contactInfo.email).toBe('contact@testcompany.com');
        expect(job.companyInfo.contactInfo.phone).toBe('(555) 123-4567');
        expect(job.companyInfo.contactInfo.address).toBe('123 Test St, Test City, TS 12345');
        expect(job.companyInfo.glassdoorRating.rating).toBe(4.5);
        expect(job.companyInfo.glassdoorRating.reviewCount).toBe(150);
        expect(job.companyInfo.glassdoorRating.url).toBe('https://glassdoor.com/testcompany');
        expect(job.companyInfo.recentNews).toHaveLength(1);
        expect(job.companyInfo.recentNews[0].title).toBe('Test Company Launches New Product');
    });

    it('should create a job without company information', () => {
        const jobData = {
            userId: 'test-user-id',
            title: 'Test Job for UC-062',
            company: 'Test Company Without Info',
            status: 'Applied',
        };

        const job = new Job(jobData);

        expect(job).toBeDefined();
        expect(job.title).toBe('Test Job for UC-062');
        expect(job.company).toBe('Test Company Without Info');
        // companyInfo should exist but be empty
    });

    it('should validate Glassdoor rating range', () => {
        const jobData = {
            userId: 'test-user-id',
            title: 'Test Job for UC-062',
            company: 'Test Company',
            status: 'Interested',
            companyInfo: {
                glassdoorRating: {
                    rating: 6, // Invalid - above max
                },
            },
        };

        // Create the job instance and validate it
        const job = new Job(jobData);
        
        // Test that validation error occurs when trying to validate
        const error = job.validateSync();
        expect(error).toBeDefined();
        expect(error.errors['companyInfo.glassdoorRating.rating']).toBeDefined();
    });

    it('should validate company size enum', () => {
        const jobData = {
            userId: 'test-user-id',
            title: 'Test Job for UC-062',
            company: 'Test Company',
            status: 'Interested',
            companyInfo: {
                size: 'invalid-size', // Invalid enum value
            },
        };

        // Create the job instance and validate it
        const job = new Job(jobData);
        
        // Test that validation error occurs
        const error = job.validateSync();
        expect(error).toBeDefined();
        expect(error.errors['companyInfo.size']).toBeDefined();
    });

    it('should update company information', () => {
        // Create initial job
        const job = new Job({
            userId: 'test-user-id',
            title: 'Test Job for UC-062',
            company: 'Test Company',
            status: 'Interested',
        });

        // Update with company info
        job.companyInfo = {
            size: '201-500',
            website: 'https://updated.com',
            description: 'Updated description',
        };

        expect(job).toBeDefined();
        expect(job.companyInfo.size).toBe('201-500');
        expect(job.companyInfo.website).toBe('https://updated.com');
        expect(job.companyInfo.description).toBe('Updated description');
    });

    it('should handle multiple recent news items', () => {
        const jobData = {
            userId: 'test-user-id',
            title: 'Test Job for UC-062',
            company: 'Test Company',
            status: 'Interested',
            companyInfo: {
                recentNews: [
                    {
                        title: 'News Item 1',
                        summary: 'Summary 1',
                        date: new Date('2024-01-01'),
                    },
                    {
                        title: 'News Item 2',
                        summary: 'Summary 2',
                        url: 'https://news.com/2',
                        date: new Date('2024-01-15'),
                    },
                    {
                        title: 'News Item 3',
                        summary: 'Summary 3',
                        date: new Date('2024-02-01'),
                    },
                ],
            },
        };

        const job = new Job(jobData);
        expect(job.companyInfo.recentNews).toHaveLength(3);
        expect(job.companyInfo.recentNews[0].title).toBe('News Item 1');
        expect(job.companyInfo.recentNews[1].url).toBe('https://news.com/2');
        expect(job.companyInfo.recentNews[2].summary).toBe('Summary 3');
    });
});
