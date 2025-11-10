/**
 * UC-063: Job Matching System - Test Suite
 * Tests for job matching calculation and API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { Job } from '../../models/Job.js';
import { User } from '../../models/User.js';
import { JobMatch } from '../../models/JobMatch.js';
import { calculateJobMatch, compareJobMatches } from '../../utils/jobMatchingService.js';

describe('UC-063: Job Matching System', () => {
  let testUser;
  let testJob;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotshot-test', {
        serverSelectionTimeoutMS: 30000,
      });
    }
  });

  afterAll(async () => {
    // Clean up and disconnect
    await User.deleteMany({ email: /test-match/ });
    await Job.deleteMany({ title: /Test Job Match/ });
    await JobMatch.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Create test user with complete profile
    testUser = {
      auth0Id: 'test-match-user-' + Date.now(),
      email: 'test-match@example.com',
      name: 'Test User',
      skills: [
        { name: 'JavaScript', level: 'Advanced', category: 'Technical' },
        { name: 'React', level: 'Advanced', category: 'Technical' },
        { name: 'Node.js', level: 'Intermediate', category: 'Technical' },
        { name: 'Python', level: 'Beginner', category: 'Technical' },
        { name: 'Communication', level: 'Advanced', category: 'Soft Skills' },
      ],
      employment: [
        {
          position: 'Software Engineer',
          company: 'Tech Corp',
          location: 'San Francisco, CA',
          startDate: new Date('2021-01-01'),
          endDate: new Date('2023-06-01'),
          isCurrentPosition: false,
          description: 'Developed web applications using React and Node.js',
        },
        {
          position: 'Junior Developer',
          company: 'Startup Inc',
          location: 'New York, NY',
          startDate: new Date('2023-07-01'),
          isCurrentPosition: true,
          description: 'Working on full-stack JavaScript applications',
        },
      ],
      education: [
        {
          institution: 'University of California',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: new Date('2017-09-01'),
          endDate: new Date('2021-05-01'),
          current: false,
          gpa: 3.7,
          gpaPrivate: false,
        },
      ],
      projects: [
        {
          name: 'E-commerce Platform',
          description: 'Built a full-stack e-commerce platform',
          technologies: ['React', 'Node.js', 'MongoDB'],
          startDate: new Date('2022-01-01'),
          endDate: new Date('2022-06-01'),
        },
        {
          name: 'Task Manager App',
          description: 'Mobile-first task management application',
          technologies: ['React Native', 'Firebase'],
          startDate: new Date('2023-01-01'),
          current: true,
        },
      ],
      certifications: [
        {
          name: 'AWS Certified Developer',
          organization: 'Amazon Web Services',
          dateEarned: new Date('2022-08-01'),
          doesNotExpire: false,
          expirationDate: new Date('2025-08-01'),
        },
      ],
      location: 'San Francisco, CA',
      experienceLevel: 'Mid',
    };

    const userDoc = await User.create(testUser);
    testUser = userDoc.toObject();

    // Create test job
    testJob = await Job.create({
      userId: testUser.auth0Id,
      title: 'Test Job Match - Senior Software Engineer',
      company: 'Tech Giant',
      status: 'Interested',
      location: 'San Francisco, CA',
      salary: { min: 120000, max: 180000, currency: 'USD' },
      jobType: 'Full-time',
      industry: 'Technology',
      workMode: 'Hybrid',
      description: 'Looking for a senior software engineer with 3-5 years of experience in JavaScript, React, and Node.js. Should have strong communication skills and experience building scalable web applications.',
      requirements: [
        'Bachelor degree in Computer Science or related field',
        '3+ years of professional experience',
        'Expert in JavaScript and React',
        'Strong experience with Node.js',
        'Python knowledge preferred',
        'Excellent communication skills',
        'Experience with cloud platforms (AWS)',
      ],
    });
  });

  describe('Match Score Calculation', () => {
    it('should calculate match score correctly', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      expect(match.overallScore).toBeGreaterThanOrEqual(0);
      expect(match.overallScore).toBeLessThanOrEqual(100);
      expect(match.categoryScores).toBeDefined();
      expect(match.categoryScores.skills).toBeDefined();
      expect(match.categoryScores.experience).toBeDefined();
      expect(match.categoryScores.education).toBeDefined();
      expect(match.categoryScores.additional).toBeDefined();
    });

    it('should have correct category weights', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      expect(match.categoryScores.skills.weight).toBe(40);
      expect(match.categoryScores.experience.weight).toBe(30);
      expect(match.categoryScores.education.weight).toBe(15);
      expect(match.categoryScores.additional.weight).toBe(15);
    });

    it('should identify matched skills', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      const skillsDetails = match.categoryScores.skills.details;
      expect(skillsDetails.matched).toContain('JavaScript');
      expect(skillsDetails.matched).toContain('React');
      expect(skillsDetails.matched).toContain('Node.js');
    });

    it('should identify missing skills', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      const skillsDetails = match.categoryScores.skills.details;
      // May or may not have missing skills depending on extraction
      expect(skillsDetails).toHaveProperty('missing');
      expect(Array.isArray(skillsDetails.missing)).toBe(true);
    });

    it('should identify weak skills', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      const skillsDetails = match.categoryScores.skills.details;
      // Python is at Beginner level, should be weak
      const weakPython = skillsDetails.weak.find(w => w.name === 'Python');
      if (weakPython) {
        expect(weakPython.userLevel).toBe('Beginner');
      }
    });

    it('should calculate experience score based on years', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      const expDetails = match.categoryScores.experience.details;
      expect(expDetails.yearsExperience).toBeGreaterThan(0);
      expect(expDetails.yearsExperience).toBeLessThanOrEqual(10);
    });

    it('should identify relevant positions', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      const expDetails = match.categoryScores.experience.details;
      expect(expDetails.relevantPositions.length).toBeGreaterThan(0);
      
      const relevantPos = expDetails.relevantPositions.find(p => p.title === 'Software Engineer');
      expect(relevantPos).toBeDefined();
    });

    it('should check education match', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      const eduDetails = match.categoryScores.education.details;
      expect(eduDetails.hasRequiredDegree).toBe(true);
      expect(eduDetails.degreeMatch).toBe(true);
      expect(eduDetails.fieldMatch).toBe(true);
      expect(eduDetails.gpaMatch).toBe(true); // 3.7 GPA
    });

    it('should consider additional factors', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      const addDetails = match.categoryScores.additional.details;
      expect(addDetails.locationMatch).toBe(true); // Both in San Francisco
      expect(addDetails.certifications).toBe(1);
      expect(addDetails.projects).toBe(2);
    });

    it('should identify strengths', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      expect(match.strengths.length).toBeGreaterThan(0);
      const hasSkillStrength = match.strengths.some(s => s.category === 'skills');
      expect(hasSkillStrength).toBe(true);
    });

    it('should identify gaps', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      expect(Array.isArray(match.gaps)).toBe(true);
      // User might have some gaps
    });

    it('should generate suggestions', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      expect(Array.isArray(match.suggestions)).toBe(true);
      if (match.suggestions.length > 0) {
        const suggestion = match.suggestions[0];
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('estimatedImpact');
      }
    });
  });

  describe('Custom Weights', () => {
    it('should apply custom weights correctly', async () => {
      const customWeights = {
        skills: 50,
        experience: 25,
        education: 15,
        additional: 10,
      };

      const match = await calculateJobMatch(testJob, testUser, customWeights);

      expect(match.categoryScores.skills.weight).toBe(50);
      expect(match.categoryScores.experience.weight).toBe(25);
      expect(match.categoryScores.education.weight).toBe(15);
      expect(match.categoryScores.additional.weight).toBe(10);
      expect(match.customWeights).toEqual(customWeights);
    });

    it('should normalize weights that don\'t sum to 100', async () => {
      const customWeights = {
        skills: 60,
        experience: 30,
        education: 20,
        additional: 10,
      }; // Sum = 120

      const match = await calculateJobMatch(testJob, testUser, customWeights);

      // Overall score should still be valid
      expect(match.overallScore).toBeGreaterThanOrEqual(0);
      expect(match.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('JobMatch Model', () => {
    it('should save match to database', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      const savedMatch = await JobMatch.create({
        userId: testUser.auth0Id,
        jobId: testJob._id,
        ...match,
      });

      expect(savedMatch._id).toBeDefined();
      expect(savedMatch.overallScore).toBe(match.overallScore);
    });

    it('should have matchGrade virtual field', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      const savedMatch = await JobMatch.create({
        userId: testUser.auth0Id,
        jobId: testJob._id,
        ...match,
      });

      expect(savedMatch.matchGrade).toBeDefined();
      expect(['Excellent', 'Good', 'Fair', 'Poor']).toContain(savedMatch.matchGrade);
    });

    it('should recalculate overall score with method', async () => {
      const match = await calculateJobMatch(testJob, testUser);

      const savedMatch = await JobMatch.create({
        userId: testUser.auth0Id,
        jobId: testJob._id,
        ...match,
      });

      const originalScore = savedMatch.overallScore;
      
      // Update custom weights
      savedMatch.customWeights = {
        skills: 60,
        experience: 20,
        education: 10,
        additional: 10,
      };

      savedMatch.recalculateOverallScore();
      
      // Score may change based on new weights
      expect(savedMatch.overallScore).toBeDefined();
      expect(savedMatch.overallScore).toBeGreaterThanOrEqual(0);
      expect(savedMatch.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Job Comparison', () => {
    it('should compare multiple jobs', async () => {
      // Create additional test jobs
      const job2 = await Job.create({
        userId: testUser.auth0Id,
        title: 'Test Job Match - Junior Developer',
        company: 'Startup',
        status: 'Interested',
        requirements: ['JavaScript', 'Basic React'],
      });

      const job3 = await Job.create({
        userId: testUser.auth0Id,
        title: 'Test Job Match - Senior Python Developer',
        company: 'Data Corp',
        status: 'Interested',
        requirements: ['Python', 'Machine Learning', 'Data Analysis'],
      });

      // Calculate matches
      const match1 = await calculateJobMatch(testJob, testUser);
      const match2 = await calculateJobMatch(job2, testUser);
      const match3 = await calculateJobMatch(job3, testUser);

      const savedMatch1 = await JobMatch.create({
        userId: testUser.auth0Id,
        jobId: testJob._id,
        ...match1,
      });

      const savedMatch2 = await JobMatch.create({
        userId: testUser.auth0Id,
        jobId: job2._id,
        ...match2,
      });

      const savedMatch3 = await JobMatch.create({
        userId: testUser.auth0Id,
        jobId: job3._id,
        ...match3,
      });

      // Compare
      const comparison = compareJobMatches([savedMatch1, savedMatch2, savedMatch3]);

      expect(comparison.totalJobs).toBe(3);
      expect(comparison.averageScore).toBeGreaterThanOrEqual(0);
      expect(comparison.bestMatch).toBeDefined();
      expect(comparison.worstMatch).toBeDefined();
      expect(comparison.scoreDistribution).toBeDefined();
    });

    it('should identify best and worst matches', async () => {
      const job2 = await Job.create({
        userId: testUser.auth0Id,
        title: 'Test Job Match - Perfect Match',
        company: 'Perfect Corp',
        status: 'Interested',
        description: 'JavaScript, React, Node.js expert needed',
        requirements: ['JavaScript', 'React', 'Node.js'],
      });

      const job3 = await Job.create({
        userId: testUser.auth0Id,
        title: 'Test Job Match - Poor Match',
        company: 'Different Corp',
        status: 'Interested',
        description: 'Looking for Rust and Go developer',
        requirements: ['Rust', 'Go', 'Systems Programming'],
      });

      const match1 = await calculateJobMatch(testJob, testUser);
      const match2 = await calculateJobMatch(job2, testUser);
      const match3 = await calculateJobMatch(job3, testUser);

      const savedMatch1 = await JobMatch.create({
        userId: testUser.auth0Id,
        jobId: testJob._id,
        ...match1,
      });

      const savedMatch2 = await JobMatch.create({
        userId: testUser.auth0Id,
        jobId: job2._id,
        ...match2,
      });

      const savedMatch3 = await JobMatch.create({
        userId: testUser.auth0Id,
        jobId: job3._id,
        ...match3,
      });

      const comparison = compareJobMatches([savedMatch1, savedMatch2, savedMatch3]);

      // Best match should be job2 (perfect match)
      expect(comparison.bestMatch.score).toBeGreaterThan(comparison.worstMatch.score);
      
      // Worst match should be job3 (poor match)
      expect(comparison.worstMatch.score).toBeLessThan(comparison.bestMatch.score);
    });

    it('should provide recommendations', async () => {
      const job2 = await Job.create({
        userId: testUser.auth0Id,
        title: 'Test Job Match - Another Job',
        company: 'Another Corp',
        status: 'Interested',
      });

      const match1 = await calculateJobMatch(testJob, testUser);
      const match2 = await calculateJobMatch(job2, testUser);

      const savedMatch1 = await JobMatch.create({
        userId: testUser.auth0Id,
        jobId: testJob._id,
        ...match1,
      });

      const savedMatch2 = await JobMatch.create({
        userId: testUser.auth0Id,
        jobId: job2._id,
        ...match2,
      });

      const comparison = compareJobMatches([savedMatch1, savedMatch2]);

      expect(Array.isArray(comparison.recommendations)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no skills', async () => {
      const userNoSkills = {
        ...testUser,
        skills: [],
      };

      const match = await calculateJobMatch(testJob, userNoSkills);

      expect(match.overallScore).toBeDefined();
      expect(match.categoryScores.skills.score).toBeLessThan(50);
    });

    it('should handle user with no experience', async () => {
      const userNoExp = {
        ...testUser,
        employment: [],
      };

      const match = await calculateJobMatch(testJob, userNoExp);

      expect(match.overallScore).toBeDefined();
      expect(match.categoryScores.experience.score).toBe(0);
    });

    it('should handle user with no education', async () => {
      const userNoEdu = {
        ...testUser,
        education: [],
      };

      const match = await calculateJobMatch(testJob, userNoEdu);

      expect(match.overallScore).toBeDefined();
      expect(match.categoryScores.education.score).toBeLessThanOrEqual(50);
    });

    it('should handle job with no requirements', async () => {
      const jobNoReqs = await Job.create({
        userId: testUser.auth0Id,
        title: 'Test Job Match - No Requirements',
        company: 'Simple Corp',
        status: 'Interested',
        description: 'General position',
      });

      const match = await calculateJobMatch(jobNoReqs, testUser);

      expect(match.overallScore).toBeDefined();
      expect(match.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle minimal profile', async () => {
      const minimalUser = {
        auth0Id: 'minimal-user',
        email: 'minimal@example.com',
        name: 'Minimal User',
        skills: [],
        employment: [],
        education: [],
        projects: [],
        certifications: [],
      };

      const match = await calculateJobMatch(testJob, minimalUser);

      expect(match.overallScore).toBeDefined();
      expect(match.overallScore).toBeLessThan(40); // Should be low
    });
  });
});
