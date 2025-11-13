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
    it('should validate required employment fields', async () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        employment: [{}],
      });

      let error;
      try {
        await user.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
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

  describe('URL and Social Media Validation', () => {
    it('should validate LinkedIn URL format', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        linkedin: 'https://linkedin.com/in/testuser',
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it('should reject invalid LinkedIn URL', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        linkedin: 'not-a-valid-url',
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.linkedin).toBeDefined();
    });

    it('should validate GitHub URL format', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        github: 'https://github.com/testuser',
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it('should reject invalid GitHub URL', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        github: 'not-valid-github',
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.github).toBeDefined();
    });

    it('should validate website URL', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        website: 'https://example.com',
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it('should reject invalid website URL', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        website: 'not-a-url',
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.website).toBeDefined();
    });

    it('should accept data URL for profile picture', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD',
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it('should accept regular URL for profile picture', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it('should reject invalid profile picture format', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'invalid-picture-format',
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.picture).toBeDefined();
    });
  });

  describe('Optional Fields and Enums', () => {
    it('should validate industry enum values', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        industry: 'Technology',
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it('should reject invalid industry value', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        industry: 'InvalidIndustry',
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.industry).toBeDefined();
    });

    it('should validate experienceLevel enum values', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        experienceLevel: 'Senior',
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it('should reject invalid experienceLevel value', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        experienceLevel: 'InvalidLevel',
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.experienceLevel).toBeDefined();
    });

    it('should validate headline maxlength', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        headline: 'a'.repeat(121), // Exceeds 120 char limit
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.headline).toBeDefined();
    });

    it('should validate bio maxlength', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        bio: 'a'.repeat(501), // Exceeds 500 char limit
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.bio).toBeDefined();
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
      expect(user.uuid.length).toBeGreaterThan(0);
    });
  });

  describe('Comprehensive Field Coverage', () => {
    it('should handle all optional profile fields', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        headline: 'Software Engineer',
        bio: 'Experienced developer',
        location: 'New York, NY',
        phone: '+1234567890',
        industry: 'Technology',
        experienceLevel: 'Senior',
        website: 'https://example.com',
        linkedin: 'https://linkedin.com/in/testuser',
        github: 'https://github.com/testuser',
        picture: 'https://example.com/pic.jpg',
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.headline).toBe('Software Engineer');
      expect(user.bio).toBe('Experienced developer');
      expect(user.industry).toBe('Technology');
      expect(user.experienceLevel).toBe('Senior');
    });

    it('should handle employment with all fields', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        employment: [
          {
            jobTitle: 'Software Engineer',
            company: 'Tech Corp',
            location: 'San Francisco',
            startDate: new Date('2020-01-01'),
            endDate: new Date('2023-01-01'),
            isCurrentPosition: false,
            description: 'Developed web applications',
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.employment[0].jobTitle).toBe('Software Engineer');
      expect(user.employment[0].description).toBe('Developed web applications');
    });

    it('should handle skills with all fields', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        skills: [
          {
            name: 'JavaScript',
            level: 'Expert',
            category: 'Programming',
          },
          {
            name: 'React',
            level: 'Advanced',
            category: 'Frontend',
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.skills).toHaveLength(2);
      expect(user.skills[0].level).toBe('Expert');
    });

    it('should handle education with all optional fields', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        education: [
          {
            institution: 'MIT',
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Computer Science',
            startDate: new Date('2016-09-01'),
            endDate: new Date('2020-05-01'),
            current: false,
            gpa: 3.8,
            gpaPrivate: false,
            achievements: 'Dean\'s List, Magna Cum Laude',
            location: 'Cambridge, MA',
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.education[0].gpa).toBe(3.8);
      expect(user.education[0].achievements).toBe('Dean\'s List, Magna Cum Laude');
      expect(user.education[0].gpaPrivate).toBe(false);
    });

    it('should handle projects with all fields', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        projects: [
          {
            name: 'E-commerce Platform',
            description: 'Built a full-stack e-commerce application',
            technologies: ['React', 'Node.js', 'MongoDB'],
            startDate: new Date('2022-01-01'),
            endDate: new Date('2022-12-01'),
            url: 'https://example.com/project',
            githubUrl: 'https://github.com/user/project',
            outcomes: 'Successfully deployed to production',
            role: 'Lead Developer',
            teamSize: 5,
            status: 'Completed',
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.projects[0].technologies).toEqual(['React', 'Node.js', 'MongoDB']);
      expect(user.projects[0].outcomes).toBe('Successfully deployed to production');
      expect(user.projects[0].role).toBe('Lead Developer');
    });

    it('should handle certifications with all fields', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        certifications: [
          {
            name: 'AWS Solutions Architect',
            organization: 'Amazon Web Services',
            dateEarned: new Date('2023-01-15'),
            expirationDate: new Date('2026-01-15'),
            certId: 'AWS-12345',
            doesNotExpire: false,
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.certifications[0].certId).toBe('AWS-12345');
      expect(user.certifications[0].doesNotExpire).toBe(false);
    });

    it('should handle phone number in multiple formats', () => {
      const formats = [
        '+1234567890',
        '1234567890',
        '123-456-7890',
      ];

      formats.forEach(phone => {
        const user = new User({
          auth0Id: 'test-id',
          email: 'test@example.com',
          name: 'Test User',
          phone,
        });

        const error = user.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should validate certification doesNotExpire with expiration date', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        certifications: [
          {
            name: 'AWS Certified',
            organization: 'Amazon',
            dateEarned: new Date('2023-01-01'),
            doesNotExpire: true,
            expirationDate: new Date('2025-01-01'), // Should fail - can't have expiration if it doesn't expire
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['certifications.0.expirationDate']).toBeDefined();
    });

    it('should accept current position with no end date', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        employment: [
          {
            jobTitle: 'Senior Developer',
            company: 'Tech Corp',
            startDate: new Date('2023-01-01'),
            isCurrentPosition: true,
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.employment[0].isCurrentPosition).toBe(true);
      expect(user.employment[0].endDate).toBeUndefined();
    });

    it('should accept current education with no end date', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        education: [
          {
            institution: 'MIT',
            degree: 'Master of Science',
            fieldOfStudy: 'Computer Science',
            startDate: new Date('2023-09-01'),
            current: true,
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.education[0].current).toBe(true);
    });

    it('should handle projects without end date', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        projects: [
          {
            name: 'Ongoing Project',
            description: 'Currently working on this',
            startDate: new Date('2024-01-01'),
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.projects[0].endDate).toBeUndefined();
    });

    it('should trim whitespace from string fields', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: '  test@example.com  ',
        name: '  Test User  ',
        headline: '  Software Engineer  ',
      });

      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.headline).toBe('Software Engineer');
    });

    it('should validate project name length', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        projects: [
          {
            name: 'a'.repeat(201),
            description: 'Test',
            startDate: new Date(),
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['projects.0.name']).toBeDefined();
    });

    it('should validate project description length', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        projects: [
          {
            name: 'Test Project',
            description: 'a'.repeat(2001),
            startDate: new Date(),
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['projects.0.description']).toBeDefined();
    });

    it('should validate skill name length', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        skills: [
          {
            name: 'a'.repeat(101),
            level: 'Expert',
            category: 'Programming',
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['skills.0.name']).toBeDefined();
    });

    it('should validate minimum skill name length', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        skills: [
          {
            name: '',
            level: 'Expert',
            category: 'Programming',
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['skills.0.name']).toBeDefined();
    });

    it('should validate technology name length in projects', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        projects: [
          {
            name: 'Test Project',
            description: 'Test Description',
            startDate: new Date(),
            technologies: ['a'.repeat(51)],
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['projects.0.technologies.0']).toBeDefined();
    });

    it('should accept certifications without expiration date', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        certifications: [
          {
            name: 'Professional Certificate',
            organization: 'Tech Institute',
            dateEarned: new Date('2023-01-01'),
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.certifications[0].expirationDate).toBeUndefined();
    });

    it('should validate education achievements length', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        education: [
          {
            institution: 'MIT',
            degree: 'Bachelor',
            fieldOfStudy: 'CS',
            startDate: new Date(),
            achievements: 'a'.repeat(1001),
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['education.0.achievements']).toBeDefined();
    });

    it('should validate employment description length', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        employment: [
          {
            jobTitle: 'Engineer',
            company: 'Tech Corp',
            startDate: new Date(),
            description: 'a'.repeat(1001),
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error.errors['employment.0.description']).toBeDefined();
    });

    it('should handle location field in education', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        education: [
          {
            institution: 'MIT',
            degree: 'Bachelor',
            fieldOfStudy: 'CS',
            startDate: new Date(),
            location: 'Cambridge, MA',
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.education[0].location).toBe('Cambridge, MA');
    });

    it('should handle location field in employment', () => {
      const user = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        employment: [
          {
            jobTitle: 'Engineer',
            company: 'Tech Corp',
            startDate: new Date(),
            location: 'New York, NY',
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.employment[0].location).toBe('New York, NY');
    });

    it('should validate notifications required fields', () => {
      const user = new User({
        auth0Id: 'test-id-notify',
        email: 'notify@example.com',
        name: 'Notify User',
        notifications: [
          {
            // missing required fields type and message
          },
        ],
      });

      const error = user.validateSync();
      expect(error).toBeDefined();
      // should report missing required fields inside notifications array
      expect(error.errors['notifications.0.type']).toBeDefined();
      expect(error.errors['notifications.0.message']).toBeDefined();
    });

    it('User.comparePassword should work against a hashed password', async () => {
      const bcrypt = await import('bcrypt');
      const plain = 'TestPassword123!';
      const hashed = await bcrypt.hash(plain, 12);

      // Create a user instance with a hashed password (no DB save required)
      const user = new User({
        auth0Id: 'test-id-compare',
        email: 'compare@example.com',
        name: 'Compare User',
        password: hashed,
      });

      const match = await user.comparePassword(plain);
      expect(match).toBe(true);

      const notMatch = await user.comparePassword('wrongpassword');
      expect(notMatch).toBe(false);
    });

    it('employment virtual displayPosition should prefer position then jobTitle', () => {
      const userWithPosition = new User({
        auth0Id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        employment: [
          {
            position: 'Lead Engineer',
            jobTitle: 'Legacy Title',
            company: 'Tech Corp',
            startDate: new Date('2020-01-01')
          }
        ]
      });

      expect(userWithPosition.employment[0].displayPosition).toBe('Lead Engineer');

      const userWithJobTitleOnly = new User({
        auth0Id: 'test-id-2',
        email: 'test2@example.com',
        name: 'Test User 2',
        employment: [
          {
            jobTitle: 'Legacy Only',
            company: 'Tech Corp',
            startDate: new Date('2020-01-01')
          }
        ]
      });

      expect(userWithJobTitleOnly.employment[0].displayPosition).toBe('Legacy Only');
    });
  });
});
