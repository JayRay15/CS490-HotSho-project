import { jest } from '@jest/globals';

// Mock User model before importing controllers
const mockUser = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

jest.unstable_mockModule('../../models/User.js', () => ({
  User: mockUser,
}));

const { User } = await import('../../models/User.js');
const {
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
  getPublicProject,
  addCertification,
  updateCertification,
  deleteCertification,
} = await import('../profileController.js');

describe('profileController', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      auth: {
        userId: 'test-user-id',
        payload: { sub: 'test-user-id' },
      },
      body: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('Employment endpoints', () => {
    describe('addEmployment', () => {
      it('should add employment successfully', async () => {
        const employmentData = {
          company: 'Test Company',
          position: 'Developer',
          startDate: '2023-01-01',
        };
        mockReq.body = employmentData;

        const mockUser = {
          _id: 'user-id',
          employment: [employmentData],
        };

        User.findOneAndUpdate.mockResolvedValue(mockUser);

        await addEmployment(mockReq, mockRes, mockNext);

        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
          { auth0Id: 'test-user-id' },
          { $push: { employment: employmentData } },
          { new: true, runValidators: true }
        );
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Employment added successfully',
          })
        );
      });

      it('should return validation error for missing required fields', async () => {
        mockReq.body = { company: 'Test Company' }; // Missing position and startDate

        await addEmployment(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Missing required fields',
          })
        );
      });

      it('should return error if user not found', async () => {
        mockReq.body = {
          company: 'Test Company',
          position: 'Developer',
          startDate: '2023-01-01',
        };
        User.findOneAndUpdate.mockResolvedValue(null);

        await addEmployment(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'User not found',
          })
        );
      });
    });

    describe('updateEmployment', () => {
      it('should update employment successfully', async () => {
        mockReq.params = { employmentId: 'employment-id' };
        mockReq.body = { company: 'Updated Company' };

        const testUser = {
          _id: 'user-id',
          employment: {
            id: jest.fn().mockReturnValue({ company: 'Test Company' }),
          },
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.findOne.mockResolvedValue(testUser);

        await updateEmployment(mockReq, mockRes, mockNext);
        await new Promise(resolve => setImmediate(resolve));

        expect(testUser.save).toHaveBeenCalled();
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Employment updated successfully',
          })
        );
      });

      it('should return error if employment not found', async () => {
        mockReq.params = { employmentId: 'employment-id' };
        mockReq.body = { company: 'Updated Company' };

        const testUser = {
          _id: 'user-id',
          employment: {
            id: jest.fn().mockReturnValue(null),
          },
        };

        mockUser.findOne.mockResolvedValue(testUser);

        await updateEmployment(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Employment record not found',
          })
        );
      });
    });

    describe('deleteEmployment', () => {
      it('should delete employment successfully', async () => {
        mockReq.params = { employmentId: 'employment-id' };

        const testUser = {
          _id: 'user-id',
          employment: [],
        };

        mockUser.findOneAndUpdate.mockResolvedValue(testUser);

        await deleteEmployment(mockReq, mockRes, mockNext);

        expect(mockUser.findOneAndUpdate).toHaveBeenCalledWith(
          { auth0Id: 'test-user-id' },
          { $pull: { employment: { _id: 'employment-id' } } },
          { new: true }
        );
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Employment deleted successfully',
          })
        );
      });
    });
  });

  describe('Skills endpoints', () => {
    describe('addSkill', () => {
      it('should add skill successfully', async () => {
        const skillData = {
          name: 'JavaScript',
          level: 'Advanced',
          category: 'Programming',
        };
        mockReq.body = skillData;

        const mockUser = {
          _id: 'user-id',
          skills: [skillData],
        };

        User.findOneAndUpdate.mockResolvedValue(mockUser);

        await addSkill(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Skill added successfully',
          })
        );
      });

      it('should return validation error for missing required fields', async () => {
        mockReq.body = { name: 'JavaScript' }; // Missing level and category

        await addSkill(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });
    });

    describe('reorderSkills', () => {
      it('should reorder skills successfully', async () => {
        mockReq.body = { skills: ['skill-id-1', 'skill-id-2'] };

        const testUser = {
          _id: 'user-id',
          skills: [
            { _id: 'skill-id-1', name: 'Skill 1' },
            { _id: 'skill-id-2', name: 'Skill 2' },
          ],
          save: jest.fn().mockResolvedValue(true),
        };
        testUser.skills.id = jest.fn((id) => testUser.skills.find((s) => s._id === id));
        testUser.skills.forEach = Array.prototype.forEach.bind(testUser.skills);

        mockUser.findOne.mockResolvedValue(testUser);

        await reorderSkills(mockReq, mockRes, mockNext);
        await new Promise(resolve => setImmediate(resolve));

        expect(testUser.save).toHaveBeenCalled();
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Skills reordered successfully',
          })
        );
      });

      it('should return error if skills is not an array', async () => {
        mockReq.body = { skills: 'not-an-array' };

        await reorderSkills(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Skills must be an array',
          })
        );
      });
    });
  });

  describe('Education endpoints', () => {
    describe('addEducation', () => {
      it('should add education successfully', async () => {
        const educationData = {
          institution: 'Test University',
          degree: 'Bachelor',
          fieldOfStudy: 'Computer Science',
          startDate: '2020-01-01',
        };
        mockReq.body = educationData;

        const mockUser = {
          _id: 'user-id',
          education: [educationData],
        };

        User.findOneAndUpdate.mockResolvedValue(mockUser);

        await addEducation(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Education added successfully',
          })
        );
      });

      it('should return validation error for missing required fields', async () => {
        mockReq.body = { institution: 'Test University' };

        await addEducation(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });
    });

    describe('updateEducation', () => {
      it('should update education successfully', async () => {
        mockReq.params = { educationId: 'education-id' };
        mockReq.body = { degree: 'Master' };

        const testUser = {
          _id: 'user-id',
          education: {
            id: jest.fn().mockReturnValue({ degree: 'Bachelor' }),
          },
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.findOne.mockResolvedValue(testUser);

        await updateEducation(mockReq, mockRes, mockNext);
        await new Promise(resolve => setImmediate(resolve));

        expect(testUser.save).toHaveBeenCalled();
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Education updated successfully',
          })
        );
      });
    });

    describe('deleteEducation', () => {
      it('should delete education successfully', async () => {
        mockReq.params = { educationId: 'education-id' };

        const testUser = {
          _id: 'user-id',
          education: [],
        };

        mockUser.findOneAndUpdate.mockResolvedValue(testUser);

        await deleteEducation(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Education deleted successfully',
          })
        );
      });
    });
  });

  describe('Projects endpoints', () => {
    describe('addProject', () => {
      it('should add project successfully', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'Test Description',
          startDate: '2023-01-01',
        };
        mockReq.body = projectData;

        const mockUser = {
          _id: 'user-id',
          projects: [projectData],
        };

        User.findOneAndUpdate.mockResolvedValue(mockUser);

        await addProject(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Project added successfully',
          })
        );
      });

      it('should normalize technologies from string to array', async () => {
        const projectData = {
          name: 'Test Project',
          description: 'Test Description',
          startDate: '2023-01-01',
          technologies: 'JavaScript, React, Node.js',
        };
        mockReq.body = projectData;

        const mockUser = {
          _id: 'user-id',
          projects: [{ ...projectData, technologies: ['JavaScript', 'React', 'Node.js'] }],
        };

        User.findOneAndUpdate.mockResolvedValue(mockUser);

        await addProject(mockReq, mockRes, mockNext);

        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
          { auth0Id: 'test-user-id' },
          expect.objectContaining({
            $push: expect.objectContaining({
              projects: expect.objectContaining({
                technologies: ['JavaScript', 'React', 'Node.js'],
              }),
            }),
          }),
          { new: true, runValidators: true }
        );
      });
    });

    describe('getPublicProject', () => {
      it('should get public project successfully', async () => {
        mockReq.params = { projectId: 'project-id' };

        const mockUser = {
          _id: 'user-id',
          name: 'Test User',
          picture: 'https://example.com/pic.jpg',
          projects: [
            {
              _id: 'project-id',
              name: 'Test Project',
              description: 'Test Description',
            },
          ],
        };

        User.findOne.mockResolvedValue(mockUser);

        await getPublicProject(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Project retrieved',
            data: expect.objectContaining({
              project: mockUser.projects[0],
              owner: {
                name: 'Test User',
                picture: 'https://example.com/pic.jpg',
              },
            }),
          })
        );
      });

      it('should return error if project not found', async () => {
        mockReq.params = { projectId: 'non-existent-id' };
        User.findOne.mockResolvedValue(null);

        await getPublicProject(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Project not found',
          })
        );
      });
    });
  });

  describe('Certifications endpoints', () => {
    describe('addCertification', () => {
      it('should add certification successfully', async () => {
        const certData = {
          name: 'AWS Certified',
          organization: 'Amazon',
          dateEarned: '2023-01-01',
        };
        mockReq.body = certData;

        const mockUser = {
          _id: 'user-id',
          certifications: [certData],
        };

        User.findOneAndUpdate.mockResolvedValue(mockUser);

        await addCertification(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Certification added successfully',
          })
        );
      });

      it('should return validation error for missing required fields', async () => {
        mockReq.body = { name: 'AWS Certified' };

        await addCertification(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });
    });

    describe('updateCertification', () => {
      it('should update certification successfully', async () => {
        mockReq.params = { certificationId: 'cert-id' };
        mockReq.body = { organization: 'Updated Org' };

        const testUser = {
          _id: 'user-id',
          certifications: {
            id: jest.fn().mockReturnValue({ organization: 'Amazon' }),
          },
          save: jest.fn().mockResolvedValue(true),
        };

        mockUser.findOne.mockResolvedValue(testUser);

        await updateCertification(mockReq, mockRes, mockNext);
        await new Promise(resolve => setImmediate(resolve));

        expect(testUser.save).toHaveBeenCalled();
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Certification updated successfully',
          })
        );
      });
    });

    describe('deleteCertification', () => {
      it('should delete certification successfully', async () => {
        mockReq.params = { certificationId: 'cert-id' };

        const testUser = {
          _id: 'user-id',
          certifications: [],
        };

        mockUser.findOneAndUpdate.mockResolvedValue(testUser);

        await deleteCertification(mockReq, mockRes, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'Certification deleted successfully',
          })
        );
      });
    });
  });
});
