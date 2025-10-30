import { User } from '../../models/User.js';

describe('Form Validation Tests - UC-012', () => {
  
  describe('Email Validation', () => {
    
    test('should accept valid email addresses', async () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'first.last+tag@company.org',
        'user123@test-domain.com',
      ];

      for (const email of validEmails) {
        const user = await User.create({
          auth0Id: `test_${email.replace(/[@.]/g, '_')}`,
          email,
          name: 'Test User',
        });

        expect(user.email).toBe(email.toLowerCase());
      }
    });

    test('should reject invalid email formats', async () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
        'double@@domain.com',
      ];

      for (const email of invalidEmails) {
        await expect(User.create({
          auth0Id: `test_invalid_${Math.random()}`,
          email,
          name: 'Test User',
        })).rejects.toThrow();
      }
    });

    test('should require email field', async () => {
      await expect(User.create({
        auth0Id: 'test_no_email',
        name: 'Test User',
      })).rejects.toThrow();
    });
  });

  describe('Phone Number Validation', () => {
    
    test('should accept valid phone formats', async () => {
      const validPhones = [
        '+12345678901',
        '(123) 456-7890',
        '123-456-7890',
        '1234567890',
        '+1 (234) 567-8901',
      ];

      for (const phone of validPhones) {
        const user = await User.create({
          auth0Id: `test_phone_${Math.random()}`,
          email: `phone${Math.random()}@test.com`,
          name: 'Phone Test',
          phone,
        });

        expect(user.phone).toBe(phone.trim());
      }
    });

    test('should reject invalid phone numbers', async () => {
      const invalidPhones = [
        'abc123',
        '123',
        'not-a-phone',
        '++123456',
      ];

      for (const phone of invalidPhones) {
        await expect(User.create({
          auth0Id: `test_invalid_phone_${Math.random()}`,
          email: `invalidphone${Math.random()}@test.com`,
          name: 'Invalid Phone Test',
          phone,
        })).rejects.toThrow();
      }
    });

    test('should allow empty phone number', async () => {
      const user = await User.create({
        auth0Id: 'test_no_phone',
        email: 'nophone@test.com',
        name: 'No Phone Test',
      });

      expect(user.phone).toBeUndefined();
    });

    test('should allow null phone number', async () => {
      const user = await User.create({
        auth0Id: 'test_null_phone',
        email: 'nullphone@test.com',
        name: 'Null Phone Test',
        phone: null,
      });

      expect(user.phone).toBeNull();
    });

    test('should accept international phone formats', async () => {
      const internationalPhones = [
        '+441234567890', // UK
        '+33123456789', // France
        '+8613800138000', // China
        '+919876543210', // India
      ];

      for (const phone of internationalPhones) {
        const user = await User.create({
          auth0Id: `test_intl_phone_${Math.random()}`,
          email: `intlphone${Math.random()}@test.com`,
          name: 'International Phone Test',
          phone,
        });

        expect(user.phone).toBe(phone.trim());
      }
    });

    test('should trim spaces from phone number', async () => {
      const user = await User.create({
        auth0Id: 'test_space_phone',
        email: 'spacephone@test.com',
        name: 'Space Phone Test',
        phone: '  1234567890  ',
      });

      expect(user.phone).toBe('1234567890');
    });
  });

  describe('URL Validation (Website, LinkedIn, GitHub)', () => {
    
    test('should accept valid website URLs', async () => {
      const validUrls = [
        'https://example.com',
        'http://subdomain.example.org',
        'www.example.com',
        'example.com',
        'https://example.com/path/to/page',
      ];

      for (const website of validUrls) {
        const user = await User.create({
          auth0Id: `test_url_${Math.random()}`,
          email: `url${Math.random()}@test.com`,
          name: 'URL Test',
          website,
        });

        expect(user.website).toBe(website.trim());
      }
    });

    test('should accept valid LinkedIn URLs', async () => {
      const validLinkedIn = [
        'https://www.linkedin.com/in/johndoe',
        'https://linkedin.com/in/jane-smith',
        'linkedin.com/company/acme-corp',
        'https://www.linkedin.com/company/tech-startup',
      ];

      for (const linkedin of validLinkedIn) {
        const user = await User.create({
          auth0Id: `test_linkedin_${Math.random()}`,
          email: `linkedin${Math.random()}@test.com`,
          name: 'LinkedIn Test',
          linkedin,
        });

        expect(user.linkedin).toBe(linkedin.trim());
      }
    });

    test('should accept valid GitHub URLs', async () => {
      const validGitHub = [
        'https://github.com/username',
        'github.com/octocat',
        'https://www.github.com/developer-name',
      ];

      for (const github of validGitHub) {
        const user = await User.create({
          auth0Id: `test_github_${Math.random()}`,
          email: `github${Math.random()}@test.com`,
          name: 'GitHub Test',
          github,
        });

        expect(user.github).toBe(github.trim());
      }
    });

    test('should reject invalid URLs', async () => {
      const invalidUrls = [
        'not a url',
        'ftp://invalid-protocol.com',
        'ht!tp://broken.com',
      ];

      for (const website of invalidUrls) {
        await expect(User.create({
          auth0Id: `test_invalid_url_${Math.random()}`,
          email: `invalid${Math.random()}@test.com`,
          name: 'Invalid URL Test',
          website,
        })).rejects.toThrow();
      }
    });

    test('should accept valid project GitHub URLs', async () => {
      const validGitHubUrls = [
        'https://github.com/username/repo',
        'github.com/octocat/hello-world',
        'https://www.github.com/user123/my-project/',
      ];

      for (const githubUrl of validGitHubUrls) {
        const user = await User.create({
          auth0Id: `test_project_github_${Math.random()}`,
          email: `projgithub${Math.random()}@test.com`,
          name: 'Project GitHub Test',
          projects: [{
            name: 'Test Project',
            description: 'A test project',
            startDate: new Date('2023-01-01'),
            githubUrl,
          }],
        });

        expect(user.projects[0].githubUrl).toBe(githubUrl.trim());
      }
    });

    test('should accept generic URLs for project GitHub field', async () => {
      // This tests the fallback generic URL validator (lines 125-127)
      const genericUrls = [
        'https://gitlab.com/user/repo',
        'https://bitbucket.org/team/project',
        'https://custom-git.example.com/repo',
      ];

      for (const githubUrl of genericUrls) {
        const user = await User.create({
          auth0Id: `test_generic_url_${Math.random()}`,
          email: `generic${Math.random()}@test.com`,
          name: 'Generic URL Test',
          projects: [{
            name: 'Test Project',
            description: 'A test project with generic URL',
            startDate: new Date('2023-01-01'),
            githubUrl,
          }],
        });

        expect(user.projects[0].githubUrl).toBe(githubUrl.trim());
      }
    });

    test('should allow empty project URLs (optional fields)', async () => {
      const user = await User.create({
        auth0Id: 'test_empty_project_urls',
        email: 'emptyurls@test.com',
        name: 'Empty URLs Test',
        projects: [{
          name: 'Project Without URLs',
          description: 'No URLs provided',
          startDate: new Date('2023-01-01'),
          // url, githubUrl, projectUrl all empty
        }],
      });

      expect(user.projects[0].url).toBeUndefined();
      expect(user.projects[0].githubUrl).toBeUndefined();
      expect(user.projects[0].projectUrl).toBeUndefined();
    });

    test('should allow null URLs', async () => {
      const user = await User.create({
        auth0Id: 'test_null_urls',
        email: 'nullurls@test.com',
        name: 'Null URLs Test',
        website: null,
        linkedin: null,
        github: null,
      });

      expect(user.website).toBeNull();
      expect(user.linkedin).toBeNull();
      expect(user.github).toBeNull();
    });

    test('should accept URLs with paths', async () => {
      const user = await User.create({
        auth0Id: 'test_url_path',
        email: 'urlpath@test.com',
        name: 'URL Path Test',
        website: 'https://example.com/path/to/page',
      });

      expect(user.website).toBe('https://example.com/path/to/page');
    });

    test('should trim spaces from URLs', async () => {
      const user = await User.create({
        auth0Id: 'test_url_trim',
        email: 'urltrim@test.com',
        name: 'URL Trim Test',
        website: '  https://example.com  ',
      });

      expect(user.website).toBe('https://example.com');
    });

    test('should reject invalid GitHub project URLs', async () => {
      await expect(User.create({
        auth0Id: 'test_invalid_github_proj',
        email: 'invalidgithubproj@test.com',
        name: 'Invalid GitHub Project',
        projects: [{
          name: 'Bad Project',
          description: 'Invalid GitHub URL',
          startDate: new Date('2023-01-01'),
          githubUrl: 'not a url at all',
        }],
      })).rejects.toThrow();
    });
  });

  describe('GPA Validation', () => {
    
    test('should accept valid GPA values (0.0 to 4.0)', async () => {
      const validGPAs = [0.0, 1.5, 2.75, 3.0, 3.5, 4.0];

      for (const gpa of validGPAs) {
        const user = await User.create({
          auth0Id: `test_gpa_${gpa}`,
          email: `gpa${gpa}@test.com`,
          name: 'GPA Test',
          education: [{
            institution: 'Test University',
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Computer Science',
            startDate: new Date('2020-09-01'),
            gpa,
          }],
        });

        expect(user.education[0].gpa).toBe(gpa);
      }
    });

    test('should reject GPA less than 0', async () => {
      await expect(User.create({
        auth0Id: 'test_negative_gpa',
        email: 'negativegpa@test.com',
        name: 'Negative GPA Test',
        education: [{
          institution: 'Test University',
          degree: 'Bachelor',
          fieldOfStudy: 'CS',
          startDate: new Date('2020-09-01'),
          gpa: -1.0,
        }],
      })).rejects.toThrow();
    });

    test('should reject GPA greater than 4.0', async () => {
      await expect(User.create({
        auth0Id: 'test_high_gpa',
        email: 'highgpa@test.com',
        name: 'High GPA Test',
        education: [{
          institution: 'Test University',
          degree: 'Bachelor',
          fieldOfStudy: 'CS',
          startDate: new Date('2020-09-01'),
          gpa: 5.0,
        }],
      })).rejects.toThrow();
    });

    test('should allow empty GPA (optional field)', async () => {
      const user = await User.create({
        auth0Id: 'test_no_gpa',
        email: 'nogpa@test.com',
        name: 'No GPA Test',
        education: [{
          institution: 'Test University',
          degree: 'Bachelor',
          fieldOfStudy: 'CS',
          startDate: new Date('2020-09-01'),
        }],
      });

      expect(user.education[0].gpa).toBeUndefined();
    });

    test('should allow null GPA', async () => {
      const user = await User.create({
        auth0Id: 'test_null_gpa',
        email: 'nullgpa@test.com',
        name: 'Null GPA Test',
        education: [{
          institution: 'Test University',
          degree: 'Bachelor',
          fieldOfStudy: 'CS',
          startDate: new Date('2020-09-01'),
          gpa: null,
        }],
      });

      expect(user.education[0].gpa).toBeNull();
    });
  });

  describe('Date Validation', () => {
    
    test('should accept valid start and end dates for employment', async () => {
      const user = await User.create({
        auth0Id: 'test_employment_dates',
        email: 'empdates@test.com',
        name: 'Employment Dates Test',
        employment: [{
          jobTitle: 'Software Engineer',
          company: 'Tech Corp',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2022-12-31'),
        }],
      });

      expect(user.employment[0].startDate).toBeInstanceOf(Date);
      expect(user.employment[0].endDate).toBeInstanceOf(Date);
      expect(user.employment[0].endDate > user.employment[0].startDate).toBe(true);
    });

    test('should reject employment with end date before start date', async () => {
      await expect(User.create({
        auth0Id: 'test_invalid_emp_dates',
        email: 'invalidempdates@test.com',
        name: 'Invalid Employment Dates',
        employment: [{
          jobTitle: 'Developer',
          company: 'Company Inc',
          startDate: new Date('2022-01-01'),
          endDate: new Date('2020-01-01'), // Before start date
        }],
      })).rejects.toThrow();
    });

    test('should accept valid education dates', async () => {
      const user = await User.create({
        auth0Id: 'test_education_dates',
        email: 'edudates@test.com',
        name: 'Education Dates Test',
        education: [{
          institution: 'University',
          degree: 'Bachelor',
          fieldOfStudy: 'Computer Science',
          startDate: new Date('2018-09-01'),
          endDate: new Date('2022-05-15'),
        }],
      });

      expect(user.education[0].endDate > user.education[0].startDate).toBe(true);
    });

    test('should reject education with graduation date before start date', async () => {
      await expect(User.create({
        auth0Id: 'test_invalid_edu_dates',
        email: 'invalidedudates@test.com',
        name: 'Invalid Education Dates',
        education: [{
          institution: 'University',
          degree: 'Bachelor',
          fieldOfStudy: 'CS',
          startDate: new Date('2022-09-01'),
          endDate: new Date('2020-05-15'), // Before start date
        }],
      })).rejects.toThrow();
    });

    test('should accept valid project dates', async () => {
      const user = await User.create({
        auth0Id: 'test_project_dates',
        email: 'projectdates@test.com',
        name: 'Project Dates Test',
        projects: [{
          name: 'Web App',
          description: 'A test project',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-06-30'),
        }],
      });

      expect(user.projects[0].endDate > user.projects[0].startDate).toBe(true);
    });

    test('should reject project with end date before start date', async () => {
      await expect(User.create({
        auth0Id: 'test_invalid_project_dates',
        email: 'invalidprojectdates@test.com',
        name: 'Invalid Project Dates',
        projects: [{
          name: 'Bad Project',
          description: 'Invalid dates',
          startDate: new Date('2023-06-30'),
          endDate: new Date('2023-01-01'), // Before start date
        }],
      })).rejects.toThrow();
    });

    test('should reject certification with expiration before date earned', async () => {
      await expect(User.create({
        auth0Id: 'test_invalid_cert_dates',
        email: 'invalidcertdates@test.com',
        name: 'Invalid Cert Dates',
        certifications: [{
          name: 'AWS Certified',
          organization: 'Amazon',
          dateEarned: new Date('2023-01-01'),
          expirationDate: new Date('2022-01-01'), // Before date earned
        }],
      })).rejects.toThrow();
    });

    test('should allow missing end dates for ongoing items', async () => {
      const user = await User.create({
        auth0Id: 'test_ongoing_items',
        email: 'ongoing@test.com',
        name: 'Ongoing Test',
        employment: [{
          jobTitle: 'Current Job',
          company: 'Current Company',
          startDate: new Date('2023-01-01'),
          // No endDate - currently employed
        }],
        projects: [{
          name: 'Ongoing Project',
          description: 'Still working',
          startDate: new Date('2023-06-01'),
          // No endDate
        }],
      });

      expect(user.employment[0].endDate).toBeUndefined();
      expect(user.projects[0].endDate).toBeUndefined();
    });

    test('should reject certification with future date earned', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      await expect(User.create({
        auth0Id: 'test_future_cert',
        email: 'futurecert@test.com',
        name: 'Future Cert Test',
        certifications: [{
          name: 'Future Cert',
          organization: 'Org',
          dateEarned: futureDate,
        }],
      })).rejects.toThrow();
    });
  });

  describe('Certification ID Validation', () => {
    
    test('should allow empty certification ID (optional)', async () => {
      const user = await User.create({
        auth0Id: 'test_no_cert_id',
        email: 'nocertid@test.com',
        name: 'No Cert ID Test',
        certifications: [{
          name: 'AWS Cert',
          organization: 'Amazon',
          dateEarned: new Date('2023-01-01'),
          // No certificationId
        }],
      });

      expect(user.certifications[0].certificationId).toBeUndefined();
    });

    test('should accept valid certification IDs', async () => {
      const validCertIds = [
        'ABC-123-XYZ',
        'CERT123456',
        'Valid_Cert_ID',
        'Cert 2024 ID',
      ];

      for (const certId of validCertIds) {
        const user = await User.create({
          auth0Id: `test_certid_${Math.random()}`,
          email: `certid${Math.random()}@test.com`,
          name: 'Cert ID Test',
          certifications: [{
            name: 'Test Certification',
            organization: 'Test Org',
            certId,
            dateEarned: new Date('2023-01-01'),
          }],
        });

        expect(user.certifications[0].certId).toBe(certId.trim());
      }
    });

    test('should reject certification IDs with special characters', async () => {
      const invalidCertIds = [
        'CERT@123',
        'ID#456',
        'BAD!CERT',
      ];

      for (const certId of invalidCertIds) {
        await expect(User.create({
          auth0Id: `test_invalid_certid_${Math.random()}`,
          email: `invalidcertid${Math.random()}@test.com`,
          name: 'Invalid Cert ID Test',
          certifications: [{
            name: 'Bad Cert',
            organization: 'Org',
            certId,
            dateEarned: new Date('2023-01-01'),
          }],
        })).rejects.toThrow();
      }
    });
  });

  describe('String Length Validations', () => {
    
    test('should reject bio exceeding 500 characters', async () => {
      const longBio = 'a'.repeat(501);

      await expect(User.create({
        auth0Id: 'test_long_bio',
        email: 'longbio@test.com',
        name: 'Long Bio Test',
        bio: longBio,
      })).rejects.toThrow();
    });

    test('should accept bio with 500 characters', async () => {
      const maxBio = 'a'.repeat(500);

      const user = await User.create({
        auth0Id: 'test_max_bio',
        email: 'maxbio@test.com',
        name: 'Max Bio Test',
        bio: maxBio,
      });

      expect(user.bio.length).toBe(500);
    });

    test('should allow empty bio (optional field)', async () => {
      const user = await User.create({
        auth0Id: 'test_empty_bio',
        email: 'emptybio@test.com',
        name: 'Empty Bio Test',
      });

      expect(user.bio).toBeUndefined();
    });

    test('should accept employment description with 1000 characters', async () => {
      const maxDescription = 'a'.repeat(1000);

      const user = await User.create({
        auth0Id: 'test_max_emp_desc',
        email: 'maxempdesc@test.com',
        name: 'Max Emp Desc Test',
        employment: [{
          jobTitle: 'Developer',
          company: 'Company',
          startDate: new Date('2023-01-01'),
          description: maxDescription,
        }],
      });

      expect(user.employment[0].description.length).toBe(1000);
    });

    test('should allow empty employment description', async () => {
      const user = await User.create({
        auth0Id: 'test_empty_emp_desc',
        email: 'emptyempdesc@test.com',
        name: 'Empty Emp Desc Test',
        employment: [{
          jobTitle: 'Developer',
          company: 'Company',
          startDate: new Date('2023-01-01'),
        }],
      });

      expect(user.employment[0].description).toBeUndefined();
    });

    test('should reject employment description exceeding 1000 characters', async () => {
      const longDescription = 'a'.repeat(1001);

      await expect(User.create({
        auth0Id: 'test_long_description',
        email: 'longdesc@test.com',
        name: 'Long Description Test',
        employment: [{
          jobTitle: 'Developer',
          company: 'Company',
          startDate: new Date('2020-01-01'),
          description: longDescription,
        }],
      })).rejects.toThrow();
    });

    test('should reject project name exceeding 200 characters', async () => {
      const longName = 'a'.repeat(201);

      await expect(User.create({
        auth0Id: 'test_long_project_name',
        email: 'longprojectname@test.com',
        name: 'Long Project Name Test',
        projects: [{
          name: longName,
          description: 'Test',
          startDate: new Date('2023-01-01'),
        }],
      })).rejects.toThrow();
    });
  });

  describe('Enum Validations', () => {
    
    test('should accept valid industry values', async () => {
      const validIndustries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Construction', 'Real Estate'];

      for (const industry of validIndustries) {
        const user = await User.create({
          auth0Id: `test_industry_${industry.toLowerCase().replace(/\s+/g, '_')}`,
          email: `industry_${industry.toLowerCase().replace(/\s+/g, '_')}@test.com`,
          name: 'Industry Test',
          industry,
        });

        expect(user.industry).toBe(industry);
      }
    });

    test('should reject invalid industry values', async () => {
      await expect(User.create({
        auth0Id: 'test_invalid_industry',
        email: 'invalidindustry@test.com',
        name: 'Invalid Industry Test',
        industry: 'Invalid Industry',
      })).rejects.toThrow();
    });

    test('should accept valid experience levels', async () => {
      const validLevels = ['Entry', 'Mid', 'Senior', 'Executive'];

      for (const level of validLevels) {
        const user = await User.create({
          auth0Id: `test_level_${level.toLowerCase()}`,
          email: `level${level.toLowerCase()}@test.com`,
          name: 'Experience Level Test',
          experienceLevel: level,
        });

        expect(user.experienceLevel).toBe(level);
      }
    });

    test('should accept valid skill levels', async () => {
      const validSkillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

      for (const level of validSkillLevels) {
        const user = await User.create({
          auth0Id: `test_skill_level_${level.toLowerCase()}`,
          email: `skill${level.toLowerCase()}@test.com`,
          name: 'Skill Level Test',
          skills: [{
            name: 'JavaScript',
            level,
            category: 'Technical',
          }],
        });

        expect(user.skills[0].level).toBe(level);
      }
    });
  });
});
