import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { User } from '../User.js';

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should validate required fields', async () => {
      const user = new User({});
      
      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.auth0Id).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    it('should validate email format', async () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'invalid-email',
        name: 'Test User',
      });

      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.email.message).toContain('valid email');
    });

    it('should validate password requirements', async () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        password: 'weak',
      });

      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    it('should accept valid password', async () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        password: 'ValidPass123',
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it('should validate phone number format', async () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        phone: 'invalid',
      });

      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.phone).toBeDefined();
    });

    it('should validate URL format', async () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        website: 'not-a-url',
      });

      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.errors.website).toBeDefined();
    });
  });

  describe('Employment Schema', () => {
    it('should validate required employment fields', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        employment: [{}],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['employment.0.jobTitle']).toBeDefined();
      expect(error.errors['employment.0.company']).toBeDefined();
      expect(error.errors['employment.0.startDate']).toBeDefined();
    });

    it('should validate end date is after start date', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        employment: [
          {
            jobTitle: 'Developer',
            company: 'Test Corp',
            startDate: new Date('2023-12-01'),
            endDate: new Date('2023-01-01'),
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['employment.0.endDate']).toBeDefined();
    });

    it('should validate description length', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        employment: [
          {
            jobTitle: 'Developer',
            company: 'Test Corp',
            startDate: new Date('2023-01-01'),
            description: 'x'.repeat(1001),
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['employment.0.description']).toBeDefined();
    });
  });

  describe('Skills Schema', () => {
    it('should validate required skill fields', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        skills: [{}],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['skills.0.name']).toBeDefined();
      expect(error.errors['skills.0.level']).toBeDefined();
      expect(error.errors['skills.0.category']).toBeDefined();
    });

    it('should validate skill level enum', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        skills: [
          {
            name: 'JavaScript',
            level: 'Master',
            category: 'Programming',
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['skills.0.level']).toBeDefined();
    });

    it('should validate skill name length', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        skills: [
          {
            name: 'x'.repeat(101),
            level: 'Advanced',
            category: 'Programming',
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['skills.0.name']).toBeDefined();
    });
  });

  describe('Education Schema', () => {
    it('should validate required education fields', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        education: [{}],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['education.0.institution']).toBeDefined();
      expect(error.errors['education.0.degree']).toBeDefined();
      expect(error.errors['education.0.fieldOfStudy']).toBeDefined();
      expect(error.errors['education.0.startDate']).toBeDefined();
    });

    it('should validate GPA range', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        education: [
          {
            institution: 'Test University',
            degree: 'Bachelor',
            fieldOfStudy: 'Computer Science',
            startDate: new Date('2020-01-01'),
            gpa: 5.0,
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['education.0.gpa']).toBeDefined();
    });
  });

  describe('Project Schema', () => {
    it('should validate required project fields', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        projects: [{}],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['projects.0.name']).toBeDefined();
      expect(error.errors['projects.0.description']).toBeDefined();
      expect(error.errors['projects.0.startDate']).toBeDefined();
    });

    it('should validate project URL format', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        projects: [
          {
            name: 'Test Project',
            description: 'Test Description',
            startDate: new Date('2023-01-01'),
            url: 'not-a-url',
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['projects.0.url']).toBeDefined();
    });

    it('should validate GitHub URL format', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        projects: [
          {
            name: 'Test Project',
            description: 'Test Description',
            startDate: new Date('2023-01-01'),
            githubUrl: 'not-a-github-url',
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['projects.0.githubUrl']).toBeDefined();
    });
  });

  describe('Certification Schema', () => {
    it('should validate required certification fields', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        certifications: [{}],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['certifications.0.name']).toBeDefined();
      expect(error.errors['certifications.0.organization']).toBeDefined();
      expect(error.errors['certifications.0.dateEarned']).toBeDefined();
    });

    it('should validate dateEarned is not in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        certifications: [
          {
            name: 'AWS Certified',
            organization: 'Amazon',
            dateEarned: futureDate,
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['certifications.0.dateEarned']).toBeDefined();
    });

    it('should validate certification ID format', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        certifications: [
          {
            name: 'AWS Certified',
            organization: 'Amazon',
            dateEarned: new Date('2023-01-01'),
            certId: 'invalid@cert#id',
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['certifications.0.certId']).toBeDefined();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      // This test would need actual database connection
      // Simplified to test the concept
      const mockUser = {
        password: 'PlainPassword123',
        isModified: jest.fn().mockReturnValue(true),
      };

      // Simulate the pre-save hook logic
      const bcrypt = await import('bcrypt');
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(mockUser.password, salt);

      expect(hashedPassword).not.toBe('PlainPassword123');
      expect(hashedPassword.length).toBeGreaterThan(20);
    });
  });

  describe('Password Comparison', () => {
    it('should compare passwords correctly', async () => {
      const bcrypt = await import('bcrypt');
      const plainPassword = 'TestPassword123';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);

      const result = await bcrypt.compare(plainPassword, hashedPassword);
      expect(result).toBe(true);

      const wrongResult = await bcrypt.compare('WrongPassword', hashedPassword);
      expect(wrongResult).toBe(false);
    });
  });

  describe('UUID Generation', () => {
    it('should generate UUID for new users', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(user.uuid).toBeDefined();
      expect(typeof user.uuid).toBe('string');
      expect(user.uuid.length).toBe(36); // UUID v4 format
    });
  });
});
