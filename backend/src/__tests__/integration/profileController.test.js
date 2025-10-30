import request from 'supertest';
import express from 'express';
import { User } from '../../models/User.js';
import {
  addEmployment,
  updateEmployment,
  deleteEmployment,
  addSkill,
  updateSkill,
  deleteSkill,
  reorderSkills,
  addEducation,
  updateEducation,
  deleteEducation,
  addProject,
  updateProject,
  deleteProject,
  addCertification,
  updateCertification,
  deleteCertification,
} from '../../controllers/profileController.js';

// Create Express app for testing
const createTestApp = (userId = 'test_user_profile') => {
  const app = express();
  app.use(express.json());

  const mockAuth = (req, res, next) => {
    req.auth = { userId, payload: { sub: userId } };
    next();
  };

  // Error handling middleware
  const addErrorHandler = () => {
    app.use((err, req, res, next) => {
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errorCode: 2001,
          errors: Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message,
            value: e.value
          }))
        });
      }
      res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
      });
    });
  };

  // Employment routes
  app.post('/api/profile/employment', mockAuth, addEmployment);
  app.put('/api/profile/employment/:employmentId', mockAuth, updateEmployment);
  app.delete('/api/profile/employment/:employmentId', mockAuth, deleteEmployment);

  // Skills routes
  app.post('/api/profile/skills', mockAuth, addSkill);
  app.put('/api/profile/skills/reorder', mockAuth, reorderSkills); // Specific route before parameterized route
  app.put('/api/profile/skills/:skillId', mockAuth, updateSkill);
  app.delete('/api/profile/skills/:skillId', mockAuth, deleteSkill);

  // Education routes
  app.post('/api/profile/education', mockAuth, addEducation);
  app.put('/api/profile/education/:educationId', mockAuth, updateEducation);
  app.delete('/api/profile/education/:educationId', mockAuth, deleteEducation);

  // Projects routes
  app.post('/api/profile/projects', mockAuth, addProject);
  app.put('/api/profile/projects/:projectId', mockAuth, updateProject);
  app.delete('/api/profile/projects/:projectId', mockAuth, deleteProject);

  // Certifications routes
  app.post('/api/profile/certifications', mockAuth, addCertification);
  app.put('/api/profile/certifications/:certificationId', mockAuth, updateCertification);
  app.delete('/api/profile/certifications/:certificationId', mockAuth, deleteCertification);

  // Add error handling
  addErrorHandler();

  return app;
};

describe('Profile Controller Integration Tests', () => {

  describe('Employment Management (UC-023 to UC-025)', () => {
    let app;
    let testUser;

    beforeEach(async () => {
      app = createTestApp();
      testUser = await User.create({
        auth0Id: 'test_user_profile',
        email: 'profile@example.com',
        name: 'Profile Test User',
      });
    });

    test('should add employment record', async () => {
      const response = await request(app)
        .post('/api/profile/employment')
        .send({
          company: 'Tech Corp',
          jobTitle: 'Software Engineer',
          startDate: '2020-01-01',
          endDate: '2022-12-31',
          description: 'Developed web applications',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].company).toBe('Tech Corp');
    });

    test('should reject employment without required fields', async () => {
      const response = await request(app)
        .post('/api/profile/employment')
        .send({
          company: 'Tech Corp',
          // Missing position and startDate
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    test('should update employment record', async () => {
      const user = await User.findOne({ auth0Id: 'test_user_profile' });
      user.employment.push({
        company: 'Old Company',
        jobTitle: 'Junior Dev',
        startDate: new Date('2020-01-01'),
      });
      await user.save();

      const employmentId = user.employment[0]._id;

      const response = await request(app)
        .put(`/api/profile/employment/${employmentId}`)
        .send({
          company: 'New Company',
          position: 'Senior Dev',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].company).toBe('New Company');
    });

    test('should return 404 when updating non-existent employment', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/profile/employment/${fakeId}`)
        .send({ company: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should delete employment record', async () => {
      const user = await User.findOne({ auth0Id: 'test_user_profile' });
      user.employment.push({
        company: 'To Delete',
        jobTitle: 'Developer',
        startDate: new Date('2020-01-01'),
      });
      await user.save();

      const employmentId = user.employment[0]._id;

      const response = await request(app)
        .delete(`/api/profile/employment/${employmentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const updatedUser = await User.findOne({ auth0Id: 'test_user_profile' });
      expect(updatedUser.employment).toHaveLength(0);
    });

    test('should add multiple employment records', async () => {
      await request(app)
        .post('/api/profile/employment')
        .send({
          company: 'Company 1',
          jobTitle: 'Dev 1',
          startDate: '2020-01-01',
        })
        .expect(200);

      const response = await request(app)
        .post('/api/profile/employment')
        .send({
          company: 'Company 2',
          jobTitle: 'Dev 2',
          startDate: '2021-01-01',
        })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('Skills Management (UC-026 to UC-027)', () => {
    let app;

    beforeEach(async () => {
      app = createTestApp();
      await User.create({
        auth0Id: 'test_user_profile',
        email: 'skills@example.com',
        name: 'Skills Test User',
      });
    });

    test('should add skill', async () => {
      const response = await request(app)
        .post('/api/profile/skills')
        .send({
          name: 'JavaScript',
          level: 'Expert',
          category: 'Programming Languages',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('JavaScript');
      expect(response.body.data[0].level).toBe('Expert');
      expect(response.body.data[0].category).toBe('Programming Languages');
    });

    test('should reject skill without name', async () => {
      const response = await request(app)
        .post('/api/profile/skills')
        .send({
          level: 'Expert',
          category: 'Programming Languages',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should update skill', async () => {
      const user = await User.findOne({ auth0Id: 'test_user_profile' });
      user.skills.push({
        name: 'Python',
        level: 'Intermediate',
        category: 'Programming Languages',
      });
      await user.save();

      const skillId = user.skills[0]._id;

      const response = await request(app)
        .put(`/api/profile/skills/${skillId}`)
        .send({
          level: 'Expert',
        })
        .expect(200);

      expect(response.body.data[0].level).toBe('Expert');
    });

    test('should delete skill', async () => {
      const user = await User.findOne({ auth0Id: 'test_user_profile' });
      user.skills.push({ 
        name: 'To Delete', 
        level: 'Beginner',
        category: 'Tools',
      });
      await user.save();

      const skillId = user.skills[0]._id;

      const response = await request(app)
        .delete(`/api/profile/skills/${skillId}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const updatedUser = await User.findOne({ auth0Id: 'test_user_profile' });
      expect(updatedUser.skills).toHaveLength(0);
    });

    test('should reorder skills', async () => {
      const user = await User.findOne({ auth0Id: 'test_user_profile' });
      user.skills.push(
        { name: 'Skill 1', level: 'Expert', category: 'Programming Languages' },
        { name: 'Skill 2', level: 'Intermediate', category: 'Frameworks' },
        { name: 'Skill 3', level: 'Beginner', category: 'Tools' }
      );
      await user.save();

      const skillIds = user.skills.map(s => s._id.toString());
      const reorderedIds = [skillIds[2], skillIds[0], skillIds[1]]; // Reverse order

      const response = await request(app)
        .put('/api/profile/skills/reorder')
        .send({ skills: reorderedIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].name).toBe('Skill 3');
      expect(response.body.data[1].name).toBe('Skill 1');
      expect(response.body.data[2].name).toBe('Skill 2');
    });
  });

  describe('Education Management (UC-028 to UC-029)', () => {
    let app;

    beforeEach(async () => {
      app = createTestApp();
      await User.create({
        auth0Id: 'test_user_profile',
        email: 'education@example.com',
        name: 'Education Test User',
      });
    });

    test('should add education record', async () => {
      const response = await request(app)
        .post('/api/profile/education')
        .send({
          institution: 'University of Test',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2016-09-01',
          graduationDate: '2020-05-31',
          gpa: 3.8,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].institution).toBe('University of Test');
      expect(response.body.data[0].gpa).toBe(3.8);
    });

    test('should reject education without required fields', async () => {
      const response = await request(app)
        .post('/api/profile/education')
        .send({
          institution: 'University',
          // Missing degree, fieldOfStudy, startDate
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should update education record', async () => {
      const user = await User.findOne({ auth0Id: 'test_user_profile' });
      user.education.push({
        institution: 'Old University',
        degree: 'Bachelor',
        fieldOfStudy: 'CS',
        startDate: new Date('2016-09-01'),
      });
      await user.save();

      const educationId = user.education[0]._id;

      const response = await request(app)
        .put(`/api/profile/education/${educationId}`)
        .send({
          gpa: 3.9,
          degree: 'Bachelor of Science',
        })
        .expect(200);

      expect(response.body.data[0].gpa).toBe(3.9);
      expect(response.body.data[0].degree).toBe('Bachelor of Science');
    });

    test('should delete education record', async () => {
      const user = await User.findOne({ auth0Id: 'test_user_profile' });
      user.education.push({
        institution: 'To Delete',
        degree: 'Bachelor',
        fieldOfStudy: 'CS',
        startDate: new Date('2016-09-01'),
      });
      await user.save();

      const educationId = user.education[0]._id;

      const response = await request(app)
        .delete(`/api/profile/education/${educationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Projects Management (UC-031 to UC-032)', () => {
    let app;

    beforeEach(async () => {
      app = createTestApp();
      await User.create({
        auth0Id: 'test_user_profile',
        email: 'projects@example.com',
        name: 'Projects Test User',
      });
    });

    test('should add project', async () => {
      const response = await request(app)
        .post('/api/profile/projects')
        .send({
          name: 'Awesome Project',
          description: 'A really cool project',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          url: 'https://project.com',
          githubUrl: 'https://github.com/user/project',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Awesome Project');
      expect(response.body.data[0].githubUrl).toBe('https://github.com/user/project');
    });

    test('should reject project without required fields', async () => {
      const response = await request(app)
        .post('/api/profile/projects')
        .send({
          name: 'Project',
          // Missing description and startDate
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should update project', async () => {
      const user = await User.findOne({ auth0Id: 'test_user_profile' });
      user.projects.push({
        name: 'Old Project',
        description: 'Old description',
        startDate: new Date('2023-01-01'),
      });
      await user.save();

      const projectId = user.projects[0]._id;

      const response = await request(app)
        .put(`/api/profile/projects/${projectId}`)
        .send({
          name: 'Updated Project',
          url: 'https://updated-project.com',
        })
        .expect(200);

      expect(response.body.data[0].name).toBe('Updated Project');
      expect(response.body.data[0].url).toBe('https://updated-project.com');
    });

    test('should delete project', async () => {
      const user = await User.findOne({ auth0Id: 'test_user_profile' });
      user.projects.push({
        name: 'To Delete',
        description: 'Will be deleted',
        startDate: new Date('2023-01-01'),
      });
      await user.save();

      const projectId = user.projects[0]._id;

      const response = await request(app)
        .delete(`/api/profile/projects/${projectId}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const updatedUser = await User.findOne({ auth0Id: 'test_user_profile' });
      expect(updatedUser.projects).toHaveLength(0);
    });

    test('should accept project with current flag', async () => {
      const response = await request(app)
        .post('/api/profile/projects')
        .send({
          name: 'Current Project',
          description: 'Ongoing work',
          startDate: '2023-01-01',
          current: true,
        })
        .expect(200);

      expect(response.body.data[0].current).toBe(true);
    });
  });

  describe('Certifications Management (UC-030)', () => {
    let app;
    let testUser;

    beforeEach(async () => {
      app = createTestApp();
      testUser = await User.create({
        auth0Id: 'test_user_profile',
        email: 'certtest@example.com',
        name: 'Certification Test User',
      });
    });

    test('should add certification successfully', async () => {
      const response = await request(app)
        .post('/api/profile/certifications')
        .send({
          name: 'AWS Certified Solutions Architect',
          organization: 'Amazon Web Services',
          dateEarned: '2023-01-15',
          expirationDate: '2026-01-15',
          certId: 'AWS-12345',
          certUrl: 'https://aws.amazon.com/verify/12345',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('AWS Certified Solutions Architect');
      expect(response.body.data[0].organization).toBe('Amazon Web Services');
      expect(response.body.data[0].certId).toBe('AWS-12345');
    });

    test('should reject certification without required fields', async () => {
      const response = await request(app)
        .post('/api/profile/certifications')
        .send({
          organization: 'Some Organization',
          // Missing name and dateEarned
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should update certification successfully', async () => {
      const user = await User.findOne({ auth0Id: 'test_user_profile' });
      user.certifications.push({
        name: 'Old Cert Name',
        organization: 'Old Organization',
        dateEarned: new Date('2022-01-01'),
      });
      await user.save();

      const certId = user.certifications[0]._id;

      const response = await request(app)
        .put(`/api/profile/certifications/${certId}`)
        .send({
          name: 'Updated Cert Name',
          organization: 'Updated Organization',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].name).toBe('Updated Cert Name');
      expect(response.body.data[0].organization).toBe('Updated Organization');
    });

    test('should return 404 when updating non-existent certification', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/profile/certifications/${fakeId}`)
        .send({
          name: 'Updated Name',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should delete certification successfully', async () => {
      const user = await User.findOne({ auth0Id: 'test_user_profile' });
      user.certifications.push({
        name: 'Cert to Delete',
        organization: 'Test Organization',
        dateEarned: new Date('2023-01-01'),
      });
      await user.save();

      const certId = user.certifications[0]._id;

      const response = await request(app)
        .delete(`/api/profile/certifications/${certId}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const updatedUser = await User.findOne({ auth0Id: 'test_user_profile' });
      expect(updatedUser.certifications).toHaveLength(0);
    });

    test('should add multiple certifications', async () => {
      await request(app)
        .post('/api/profile/certifications')
        .send({
          name: 'Certification 1',
          organization: 'Organization 1',
          dateEarned: '2022-01-01',
        })
        .expect(200);

      const response = await request(app)
        .post('/api/profile/certifications')
        .send({
          name: 'Certification 2',
          organization: 'Organization 2',
          dateEarned: '2023-01-01',
        })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Certification 1');
      expect(response.body.data[1].name).toBe('Certification 2');
    });

    test('should handle certification with optional fields', async () => {
      const response = await request(app)
        .post('/api/profile/certifications')
        .send({
          name: 'Basic Cert',
          organization: 'Basic Organization',
          dateEarned: '2023-01-01',
          // No expirationDate or certId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].name).toBe('Basic Cert');
    });

    test('should reject certification with future date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const response = await request(app)
        .post('/api/profile/certifications')
        .send({
          name: 'Future Cert',
          organization: 'Test Organization',
          dateEarned: futureDate.toISOString(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // Additional tests for error paths and edge cases
  describe('Employment Error Scenarios', () => {
    let app;

    beforeEach(async () => {
      app = createTestApp();
      await User.create({
        auth0Id: 'test_user_profile',
        email: 'profile@example.com',
        name: 'Profile Test User',
      });
    });

    test('should handle missing employment data gracefully', async () => {
      const response = await request(app)
        .post('/api/profile/employment')
        .send({});

      expect([400, 500]).toContain(response.status);
    });

    test('should handle update to non-existent employment record', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/profile/employment/${fakeId}`)
        .send({
          company: 'Updated Company',
          jobTitle: 'Updated Title',
        });

      expect([404, 500]).toContain(response.status);
    });

    test('should handle deletion of non-existent employment', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/profile/employment/${fakeId}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('Skills Error Scenarios', () => {
    let app;

    beforeEach(async () => {
      app = createTestApp();
      await User.create({
        auth0Id: 'test_user_profile',
        email: 'profile@example.com',
        name: 'Profile Test User',
      });
    });

    test('should handle missing skill data', async () => {
      const response = await request(app)
        .post('/api/profile/skills')
        .send({});

      expect([400, 500]).toContain(response.status);
    });

    test('should handle update to non-existent skill', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/profile/skills/${fakeId}`)
        .send({
          skillName: 'Updated Skill',
          proficiency: 'Advanced',
        });

      expect([404, 500]).toContain(response.status);
    });

    test('should handle deletion of non-existent skill', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/profile/skills/${fakeId}`);

      expect([200, 404, 500]).toContain(response.status);
    });

    test('should handle reorder with invalid skill IDs', async () => {
      const response = await request(app)
        .put('/api/profile/skills/reorder')
        .send({
          skillIds: ['invalid1', 'invalid2'],
        });

      expect([200, 400, 500]).toContain(response.status);
    });

    test('should handle reorder with empty array', async () => {
      const response = await request(app)
        .put('/api/profile/skills/reorder')
        .send({
          skillIds: [],
        });

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Education Error Scenarios', () => {
    let app;

    beforeEach(async () => {
      app = createTestApp();
      await User.create({
        auth0Id: 'test_user_profile',
        email: 'profile@example.com',
        name: 'Profile Test User',
      });
    });

    test('should handle missing education data', async () => {
      const response = await request(app)
        .post('/api/profile/education')
        .send({});

      expect([400, 500]).toContain(response.status);
    });

    test('should handle update to non-existent education record', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/profile/education/${fakeId}`)
        .send({
          institution: 'Updated University',
        });

      expect([404, 500]).toContain(response.status);
    });

    test('should handle deletion of non-existent education', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/profile/education/${fakeId}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('Projects Error Scenarios', () => {
    let app;

    beforeEach(async () => {
      app = createTestApp();
      await User.create({
        auth0Id: 'test_user_profile',
        email: 'profile@example.com',
        name: 'Profile Test User',
      });
    });

    test('should handle missing project data', async () => {
      const response = await request(app)
        .post('/api/profile/projects')
        .send({});

      expect([400, 500]).toContain(response.status);
    });

    test('should handle update to non-existent project', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/profile/projects/${fakeId}`)
        .send({
          title: 'Updated Project',
        });

      expect([404, 500]).toContain(response.status);
    });

    test('should handle deletion of non-existent project', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/profile/projects/${fakeId}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('Certifications Error Scenarios', () => {
    let app;

    beforeEach(async () => {
      app = createTestApp();
      await User.create({
        auth0Id: 'test_user_profile',
        email: 'profile@example.com',
        name: 'Profile Test User',
      });
    });

    test('should handle missing certification data', async () => {
      const response = await request(app)
        .post('/api/profile/certifications')
        .send({});

      expect([400, 500]).toContain(response.status);
    });

    test('should handle update to non-existent certification', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/profile/certifications/${fakeId}`)
        .send({
          name: 'Updated Cert',
        });

      expect([404, 500]).toContain(response.status);
    });

    test('should handle deletion of non-existent certification', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/profile/certifications/${fakeId}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('User Not Found Scenarios - All Endpoints', () => {
    test('should return 404 when adding employment for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      
      const response = await request(app)
        .post('/api/profile/employment')
        .send({
          company: 'Test Corp',
          jobTitle: 'Engineer',
          startDate: '2020-01-01',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should return 404 when updating employment for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/profile/employment/${fakeId}`)
        .send({
          company: 'Updated Corp',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when deleting employment for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/profile/employment/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when adding skill for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      
      const response = await request(app)
        .post('/api/profile/skills')
        .send({
          name: 'JavaScript',
          level: 'Advanced',
          category: 'Programming',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when updating skill for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/profile/skills/${fakeId}`)
        .send({
          name: 'Updated Skill',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when deleting skill for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/profile/skills/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when reordering skills for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      
      const response = await request(app)
        .put('/api/profile/skills/reorder')
        .send({
          skills: ['507f1f77bcf86cd799439011'],
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when adding education for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      
      const response = await request(app)
        .post('/api/profile/education')
        .send({
          institution: 'Test University',
          degree: 'BS',
          fieldOfStudy: 'Computer Science',
          startDate: '2020-01-01',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when updating education for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/profile/education/${fakeId}`)
        .send({
          institution: 'Updated University',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when deleting education for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/profile/education/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when adding project for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      
      const response = await request(app)
        .post('/api/profile/projects')
        .send({
          name: 'Test Project',
          description: 'A test project',
          startDate: '2024-01-01',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when updating project for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/profile/projects/${fakeId}`)
        .send({
          title: 'Updated Project',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when deleting project for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/profile/projects/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when adding certification for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      
      const response = await request(app)
        .post('/api/profile/certifications')
        .send({
          name: 'Test Cert',
          organization: 'Test Org',
          dateEarned: new Date('2024-01-01'),
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when updating certification for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/profile/certifications/${fakeId}`)
        .send({
          name: 'Updated Cert',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when deleting certification for non-existent user', async () => {
      const app = createTestApp('nonexistent_user_999');
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/profile/certifications/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
