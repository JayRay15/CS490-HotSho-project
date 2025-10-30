import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock the controllers
const mockAddEmployment = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateEmployment = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteEmployment = jest.fn((req, res) => res.json({ success: true }));
const mockAddSkill = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateSkill = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteSkill = jest.fn((req, res) => res.json({ success: true }));
const mockReorderSkills = jest.fn((req, res) => res.json({ success: true }));
const mockAddEducation = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateEducation = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteEducation = jest.fn((req, res) => res.json({ success: true }));
const mockAddProject = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateProject = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteProject = jest.fn((req, res) => res.json({ success: true }));
const mockAddCertification = jest.fn((req, res) => res.json({ success: true }));
const mockUpdateCertification = jest.fn((req, res) => res.json({ success: true }));
const mockDeleteCertification = jest.fn((req, res) => res.json({ success: true }));

jest.unstable_mockModule('../../controllers/profileController.js', () => ({
  addEmployment: mockAddEmployment,
  updateEmployment: mockUpdateEmployment,
  deleteEmployment: mockDeleteEmployment,
  addSkill: mockAddSkill,
  updateSkill: mockUpdateSkill,
  deleteSkill: mockDeleteSkill,
  reorderSkills: mockReorderSkills,
  addEducation: mockAddEducation,
  updateEducation: mockUpdateEducation,
  deleteEducation: mockDeleteEducation,
  addProject: mockAddProject,
  updateProject: mockUpdateProject,
  deleteProject: mockDeleteProject,
  addCertification: mockAddCertification,
  updateCertification: mockUpdateCertification,
  deleteCertification: mockDeleteCertification,
}));

// Mock the middleware
const mockCheckJwt = jest.fn((req, res, next) => {
  req.auth = { userId: 'test-user-id' };
  next();
});

jest.unstable_mockModule('../../middleware/checkJwt.js', () => ({
  checkJwt: mockCheckJwt,
}));

describe('profileRoutes', () => {
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    const profileRoutes = await import('../../routes/profileRoutes.js');
    app.use('/api/profile', profileRoutes.default);
  });

  describe('Employment routes', () => {
    it('POST /api/profile/employment should add employment', async () => {
      const response = await request(app)
        .post('/api/profile/employment')
        .send({ company: 'Test Corp' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/profile/employment/:employmentId should update employment', async () => {
      const response = await request(app)
        .put('/api/profile/employment/123')
        .send({ company: 'Updated Corp' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/profile/employment/:employmentId should delete employment', async () => {
      const response = await request(app).delete('/api/profile/employment/123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Skills routes', () => {
    it('POST /api/profile/skills should add skill', async () => {
      const response = await request(app)
        .post('/api/profile/skills')
        .send({ name: 'JavaScript', level: 'Advanced' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/profile/skills/reorder should reorder skills', async () => {
      const response = await request(app)
        .put('/api/profile/skills/reorder')
        .send({ skills: ['id1', 'id2'] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/profile/skills/:skillId should update skill', async () => {
      const response = await request(app)
        .put('/api/profile/skills/123')
        .send({ level: 'Expert' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/profile/skills/:skillId should delete skill', async () => {
      const response = await request(app).delete('/api/profile/skills/123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Education routes', () => {
    it('POST /api/profile/education should add education', async () => {
      const response = await request(app)
        .post('/api/profile/education')
        .send({ institution: 'Test University' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/profile/education/:educationId should update education', async () => {
      const response = await request(app)
        .put('/api/profile/education/123')
        .send({ degree: 'Master' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/profile/education/:educationId should delete education', async () => {
      const response = await request(app).delete('/api/profile/education/123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Projects routes', () => {
    it('POST /api/profile/projects should add project', async () => {
      const response = await request(app)
        .post('/api/profile/projects')
        .send({ name: 'Test Project' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/profile/projects/:projectId should update project', async () => {
      const response = await request(app)
        .put('/api/profile/projects/123')
        .send({ name: 'Updated Project' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/profile/projects/:projectId should delete project', async () => {
      const response = await request(app).delete('/api/profile/projects/123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Certifications routes', () => {
    it('POST /api/profile/certifications should add certification', async () => {
      const response = await request(app)
        .post('/api/profile/certifications')
        .send({ name: 'AWS Certified' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/profile/certifications/:certificationId should update certification', async () => {
      const response = await request(app)
        .put('/api/profile/certifications/123')
        .send({ name: 'Updated Cert' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/profile/certifications/:certificationId should delete certification', async () => {
      const response = await request(app).delete('/api/profile/certifications/123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should protect all routes with checkJwt', async () => {
      await request(app).post('/api/profile/employment').send({});
      
      expect(mockCheckJwt).toHaveBeenCalled();
    });
  });
});
