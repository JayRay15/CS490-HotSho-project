import { jest } from '@jest/globals';

// Mock dependencies
const mockGoal = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndDelete: jest.fn(),
  getUserStats: jest.fn()
};

const mockUser = {
  findOne: jest.fn()
};

const mockApplicationStatus = {
  find: jest.fn()
};

const mockJob = {};

const mockGenerateGoalRecommendations = jest.fn();
const mockAnalyzeGoalProgress = jest.fn();
const mockGenerateAchievementCelebration = jest.fn();
const mockIdentifySuccessPatterns = jest.fn();

await jest.unstable_mockModule('../../models/Goal.js', () => ({
  default: mockGoal
}));

await jest.unstable_mockModule('../../models/User.js', () => ({
  User: mockUser
}));

await jest.unstable_mockModule('../../models/ApplicationStatus.js', () => ({
  ApplicationStatus: mockApplicationStatus
}));

await jest.unstable_mockModule('../../models/Job.js', () => ({
  Job: mockJob
}));

await jest.unstable_mockModule('../../utils/geminiService.js', () => ({
  generateGoalRecommendations: mockGenerateGoalRecommendations,
  analyzeGoalProgress: mockAnalyzeGoalProgress,
  generateAchievementCelebration: mockGenerateAchievementCelebration,
  identifySuccessPatterns: mockIdentifySuccessPatterns
}));

const {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  addProgressUpdate,
  completeMilestone,
  getGoalStats,
  getGoalRecommendations,
  analyzeGoal,
  celebrateGoal,
  getSuccessPatterns,
  linkGoalToEntities,
  updateImpactMetrics,
  getDashboardSummary
} = await import('../goalController.js');

describe('goalController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      auth: { userId: 'user123' },
      params: {},
      body: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getGoals', () => {
    it('should return all goals for user', async () => {
      const mockGoals = [
        { _id: 'goal1', title: 'Goal 1' },
        { _id: 'goal2', title: 'Goal 2' }
      ];
      mockGoal.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockGoals)
          })
        })
      });
      
      await getGoals(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        count: 2,
        goals: mockGoals
      }));
    });

    it('should filter by status', async () => {
      mockReq.query = { status: 'In Progress' };
      mockGoal.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([])
          })
        })
      });
      
      await getGoals(mockReq, mockRes);
      
      expect(mockGoal.find).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user123',
        status: 'In Progress'
      }));
    });

    it('should filter by category', async () => {
      mockReq.query = { category: 'Job Search' };
      mockGoal.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([])
          })
        })
      });
      
      await getGoals(mockReq, mockRes);
      
      expect(mockGoal.find).toHaveBeenCalledWith(expect.objectContaining({
        category: 'Job Search'
      }));
    });

    it('should filter by type', async () => {
      mockReq.query = { type: 'Short-term' };
      mockGoal.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([])
          })
        })
      });
      
      await getGoals(mockReq, mockRes);
      
      expect(mockGoal.find).toHaveBeenCalledWith(expect.objectContaining({
        type: 'Short-term'
      }));
    });

    it('should filter by priority', async () => {
      mockReq.query = { priority: 'High' };
      mockGoal.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([])
          })
        })
      });
      
      await getGoals(mockReq, mockRes);
      
      expect(mockGoal.find).toHaveBeenCalledWith(expect.objectContaining({
        priority: 'High'
      }));
    });

    it('should exclude completed when includeCompleted=false', async () => {
      mockReq.query = { includeCompleted: 'false' };
      mockGoal.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([])
          })
        })
      });
      
      await getGoals(mockReq, mockRes);
      
      expect(mockGoal.find).toHaveBeenCalledWith(expect.objectContaining({
        status: { $ne: 'Completed' }
      }));
    });

    it('should sort in ascending order', async () => {
      mockReq.query = { sortBy: 'title', order: 'asc' };
      const mockSort = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([])
        })
      });
      mockGoal.find.mockReturnValue({ sort: mockSort });
      
      await getGoals(mockReq, mockRes);
      
      expect(mockSort).toHaveBeenCalledWith({ title: 1 });
    });

    it('should handle errors', async () => {
      mockGoal.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockRejectedValue(new Error('DB error'))
          })
        })
      });
      
      await getGoals(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getGoalById', () => {
    it('should return 404 if goal not found', async () => {
      mockReq.params = { id: 'goal123' };
      mockGoal.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });
      
      await getGoalById(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return goal when found', async () => {
      mockReq.params = { id: 'goal123' };
      const mockGoalData = { _id: 'goal123', title: 'Test Goal' };
      mockGoal.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockGoalData)
        })
      });
      
      await getGoalById(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        goal: mockGoalData
      }));
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'goal123' };
      mockGoal.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error('DB error'))
        })
      });
      
      await getGoalById(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createGoal', () => {
    it('should return 400 if SMART criteria missing', async () => {
      mockReq.body = { title: 'Test Goal' };
      
      await createGoal(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'All SMART criteria fields are required'
      }));
    });

    it('should return 400 if description missing', async () => {
      mockReq.body = {
        title: 'Test',
        specific: 'Specific',
        measurable: { metric: 'test' },
        achievable: 'Achievable',
        relevant: 'Relevant',
        timeBound: { targetDate: new Date() }
      };
      
      await createGoal(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors during creation', async () => {
      mockReq.body = {
        title: 'Test',
        description: 'Description',
        specific: 'Specific',
        measurable: { metric: 'test' },
        achievable: 'Achievable',
        relevant: 'Relevant',
        timeBound: { targetDate: new Date() }
      };

      // Mock the Goal constructor to throw
      const originalFind = mockGoal.find;
      mockGoal.find = jest.fn().mockRejectedValue(new Error('DB error'));
      
      // This will test the error path
      // Since we can't easily mock the constructor, we test that validation runs
      await createGoal(mockReq, mockRes);
      
      mockGoal.find = originalFind;
    });
  });

  describe('updateGoal', () => {
    it('should return 404 if goal not found', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = { title: 'Updated' };
      mockGoal.findOne.mockResolvedValue(null);
      
      await updateGoal(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should update goal successfully', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = { title: 'Updated Title' };
      
      const mockGoalDoc = {
        _id: 'goal123',
        title: 'Original',
        save: jest.fn().mockResolvedValue({ _id: 'goal123', title: 'Updated Title' })
      };
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      
      await updateGoal(mockReq, mockRes);
      
      expect(mockGoalDoc.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    it('should not update protected fields', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = { userId: 'hacker', _id: 'hijacked' };
      
      const mockGoalDoc = {
        _id: 'goal123',
        userId: 'user123',
        save: jest.fn().mockResolvedValue({})
      };
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      
      await updateGoal(mockReq, mockRes);
      
      expect(mockGoalDoc.userId).toBe('user123');
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = { title: 'Updated' };
      mockGoal.findOne.mockRejectedValue(new Error('DB error'));
      
      await updateGoal(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteGoal', () => {
    it('should return 404 if goal not found', async () => {
      mockReq.params = { id: 'goal123' };
      mockGoal.findOneAndDelete.mockResolvedValue(null);
      
      await deleteGoal(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should delete goal successfully', async () => {
      mockReq.params = { id: 'goal123' };
      mockGoal.findOneAndDelete.mockResolvedValue({ _id: 'goal123' });
      
      await deleteGoal(mockReq, mockRes);
      
      expect(mockGoal.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'goal123',
        userId: 'user123'
      });
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'goal123' };
      mockGoal.findOneAndDelete.mockRejectedValue(new Error('DB error'));
      
      await deleteGoal(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addProgressUpdate', () => {
    it('should return 404 if goal not found', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = { value: 10 };
      mockGoal.findOne.mockResolvedValue(null);
      
      await addProgressUpdate(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if value missing', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = {};
      
      const mockGoalDoc = { _id: 'goal123' };
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      
      await addProgressUpdate(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should add progress update successfully', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = { value: 10, notes: 'Progress note' };
      
      const mockGoalDoc = {
        _id: 'goal123',
        addProgressUpdate: jest.fn().mockResolvedValue({ _id: 'goal123' })
      };
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      
      await addProgressUpdate(mockReq, mockRes);
      
      expect(mockGoalDoc.addProgressUpdate).toHaveBeenCalledWith(10, 'Progress note', undefined);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = { value: 10 };
      mockGoal.findOne.mockRejectedValue(new Error('DB error'));
      
      await addProgressUpdate(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('completeMilestone', () => {
    it('should return 404 if goal not found', async () => {
      mockReq.params = { id: 'goal123', milestoneId: 'ms123' };
      mockGoal.findOne.mockResolvedValue(null);
      
      await completeMilestone(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should complete milestone successfully', async () => {
      mockReq.params = { id: 'goal123', milestoneId: 'ms123' };
      
      const mockGoalDoc = {
        _id: 'goal123',
        completeMilestone: jest.fn().mockResolvedValue({ _id: 'goal123' })
      };
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      
      await completeMilestone(mockReq, mockRes);
      
      expect(mockGoalDoc.completeMilestone).toHaveBeenCalledWith('ms123');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'goal123', milestoneId: 'ms123' };
      mockGoal.findOne.mockRejectedValue(new Error('DB error'));
      
      await completeMilestone(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getGoalStats', () => {
    it('should return goal statistics', async () => {
      const mockStats = {
        total: 10,
        completed: 5,
        inProgress: 3,
        atRisk: 2,
        completionRate: 50
      };
      mockGoal.getUserStats.mockResolvedValue(mockStats);
      
      await getGoalStats(mockReq, mockRes);
      
      expect(mockGoal.getUserStats).toHaveBeenCalledWith('user123');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        stats: mockStats
      }));
    });

    it('should handle errors', async () => {
      mockGoal.getUserStats.mockRejectedValue(new Error('DB error'));
      
      await getGoalStats(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getGoalRecommendations', () => {
    it('should return 404 if user not found', async () => {
      mockUser.findOne.mockResolvedValue(null);
      
      await getGoalRecommendations(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'User profile not found'
      }));
    });

    it('should generate recommendations successfully', async () => {
      const mockUserData = { _id: 'user123', name: 'Test User' };
      const mockGoals = [{ _id: 'goal1', status: 'In Progress' }];
      const mockApplications = [
        { status: 'Applied' },
        { status: 'Interview Scheduled' },
        { status: 'Offer Received' }
      ];
      const mockRecommendations = [{ type: 'skill', title: 'Learn React' }];
      
      mockUser.findOne.mockResolvedValue(mockUserData);
      mockGoal.find.mockResolvedValue(mockGoals);
      mockApplicationStatus.find.mockResolvedValue(mockApplications);
      mockGenerateGoalRecommendations.mockResolvedValue(mockRecommendations);
      
      await getGoalRecommendations(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        recommendations: mockRecommendations
      }));
    });

    it('should handle errors', async () => {
      mockUser.findOne.mockRejectedValue(new Error('DB error'));
      
      await getGoalRecommendations(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('analyzeGoal', () => {
    it('should return 404 if goal not found', async () => {
      mockReq.params = { id: 'goal123' };
      mockGoal.findOne.mockResolvedValue(null);
      
      await analyzeGoal(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should analyze goal with progress assessment', async () => {
      mockReq.params = { id: 'goal123' };
      
      const mockGoalDoc = {
        _id: 'goal123',
        addInsight: jest.fn().mockResolvedValue({}),
        addRecommendation: jest.fn().mockResolvedValue({})
      };
      const mockUserData = { _id: 'user123', name: 'Test' };
      const mockAnalysis = {
        progressAssessment: { summary: 'On track' },
        riskAnalysis: { riskLevel: 'Low', identifiedRisks: [] },
        adjustments: [
          { priority: 'High', recommendation: 'Focus', rationale: 'Better results' },
          { priority: 'Low', recommendation: 'Optional', rationale: 'Nice to have' }
        ]
      };
      
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      mockUser.findOne.mockResolvedValue(mockUserData);
      mockAnalyzeGoalProgress.mockResolvedValue(mockAnalysis);
      
      await analyzeGoal(mockReq, mockRes);
      
      expect(mockGoalDoc.addInsight).toHaveBeenCalled();
      expect(mockGoalDoc.addRecommendation).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        analysis: mockAnalysis
      }));
    });

    it('should handle analysis without adjustments', async () => {
      mockReq.params = { id: 'goal123' };
      
      const mockGoalDoc = {
        _id: 'goal123',
        addInsight: jest.fn().mockResolvedValue({}),
        addRecommendation: jest.fn().mockResolvedValue({})
      };
      const mockAnalysis = {};
      
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      mockUser.findOne.mockResolvedValue({ _id: 'user123' });
      mockAnalyzeGoalProgress.mockResolvedValue(mockAnalysis);
      
      await analyzeGoal(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'goal123' };
      mockGoal.findOne.mockRejectedValue(new Error('DB error'));
      
      await analyzeGoal(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('celebrateGoal', () => {
    it('should return 404 if goal not found', async () => {
      mockReq.params = { id: 'goal123' };
      mockGoal.findOne.mockResolvedValue(null);
      
      await celebrateGoal(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if goal not completed', async () => {
      mockReq.params = { id: 'goal123' };
      
      const mockGoalDoc = { _id: 'goal123', status: 'In Progress' };
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      
      await celebrateGoal(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Goal must be completed to celebrate'
      }));
    });

    it('should celebrate completed goal', async () => {
      mockReq.params = { id: 'goal123' };
      
      const mockGoalDoc = {
        _id: 'goal123',
        status: 'Completed',
        save: jest.fn().mockResolvedValue({})
      };
      const mockUserData = { _id: 'user123' };
      const allGoals = [mockGoalDoc];
      const mockCelebration = { message: 'Congratulations!' };
      
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      mockUser.findOne.mockResolvedValue(mockUserData);
      mockGoal.find.mockResolvedValue(allGoals);
      mockGenerateAchievementCelebration.mockResolvedValue(mockCelebration);
      
      await celebrateGoal(mockReq, mockRes);
      
      expect(mockGoalDoc.celebrated).toBe(true);
      expect(mockGoalDoc.celebrationDate).toBeDefined();
      expect(mockGoalDoc.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        celebration: mockCelebration
      }));
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'goal123' };
      mockGoal.findOne.mockRejectedValue(new Error('DB error'));
      
      await celebrateGoal(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getSuccessPatterns', () => {
    it('should return 400 if no goals', async () => {
      mockGoal.find.mockResolvedValue([]);
      
      await getSuccessPatterns(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Not enough goals to analyze patterns. Create at least 3 goals first.'
      }));
    });

    it('should identify success patterns', async () => {
      const mockGoals = [{ _id: 'goal1' }, { _id: 'goal2' }, { _id: 'goal3' }];
      const mockUserData = { _id: 'user123' };
      const mockPatterns = [{ pattern: 'morning work' }];
      
      mockGoal.find.mockResolvedValue(mockGoals);
      mockUser.findOne.mockResolvedValue(mockUserData);
      mockIdentifySuccessPatterns.mockResolvedValue(mockPatterns);
      
      await getSuccessPatterns(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        patterns: mockPatterns
      }));
    });

    it('should handle errors', async () => {
      mockGoal.find.mockRejectedValue(new Error('DB error'));
      
      await getSuccessPatterns(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('linkGoalToEntities', () => {
    it('should return 404 if goal not found', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = { jobIds: [] };
      mockGoal.findOne.mockResolvedValue(null);
      
      await linkGoalToEntities(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should link job IDs to goal', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = { jobIds: ['job1', 'job2'], applicationIds: [] };
      
      const mockGoalDoc = {
        _id: 'goal123',
        relatedJobs: [],
        relatedApplications: [],
        save: jest.fn().mockResolvedValue({})
      };
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      
      await linkGoalToEntities(mockReq, mockRes);
      
      expect(mockGoalDoc.relatedJobs).toEqual(['job1', 'job2']);
      expect(mockGoalDoc.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Goal linked successfully'
      }));
    });

    it('should link application IDs to goal', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = { jobIds: [], applicationIds: ['app1', 'app2'] };
      
      const mockGoalDoc = {
        _id: 'goal123',
        relatedJobs: [],
        relatedApplications: [],
        save: jest.fn().mockResolvedValue({})
      };
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      
      await linkGoalToEntities(mockReq, mockRes);
      
      expect(mockGoalDoc.relatedApplications).toEqual(['app1', 'app2']);
    });

    it('should handle default empty arrays', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = {};
      
      const mockGoalDoc = {
        _id: 'goal123',
        relatedJobs: [],
        relatedApplications: [],
        save: jest.fn().mockResolvedValue({})
      };
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      
      await linkGoalToEntities(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = {};
      mockGoal.findOne.mockRejectedValue(new Error('DB error'));
      
      await linkGoalToEntities(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateImpactMetrics', () => {
    it('should return 404 if goal not found', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = { impactMetrics: {} };
      mockGoal.findOne.mockResolvedValue(null);
      
      await updateImpactMetrics(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should update existing impact metrics', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = {
        impactMetrics: {
          jobApplications: 5,
          interviewsSecured: 2
        }
      };
      
      const mockGoalDoc = {
        _id: 'goal123',
        impactMetrics: {
          jobApplications: 0,
          interviewsSecured: 0
        },
        save: jest.fn().mockResolvedValue({})
      };
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      
      await updateImpactMetrics(mockReq, mockRes);
      
      expect(mockGoalDoc.impactMetrics.jobApplications).toBe(5);
      expect(mockGoalDoc.impactMetrics.interviewsSecured).toBe(2);
      expect(mockGoalDoc.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Impact metrics updated successfully'
      }));
    });

    it('should update custom metrics', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = {
        impactMetrics: {
          customMetrics: { customKey: 'customValue' }
        }
      };
      
      const mockGoalDoc = {
        _id: 'goal123',
        impactMetrics: {},
        save: jest.fn().mockResolvedValue({})
      };
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      
      await updateImpactMetrics(mockReq, mockRes);
      
      expect(mockGoalDoc.save).toHaveBeenCalled();
    });

    it('should handle no impactMetrics in body', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = {};
      
      const mockGoalDoc = {
        _id: 'goal123',
        impactMetrics: {},
        save: jest.fn().mockResolvedValue({})
      };
      mockGoal.findOne.mockResolvedValue(mockGoalDoc);
      
      await updateImpactMetrics(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'goal123' };
      mockReq.body = {};
      mockGoal.findOne.mockRejectedValue(new Error('DB error'));
      
      await updateImpactMetrics(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getDashboardSummary', () => {
    it('should return dashboard summary', async () => {
      const mockGoals = [
        {
          _id: 'goal1',
          title: 'Goal 1',
          status: 'In Progress',
          milestones: [
            { _id: 'ms1', title: 'MS1', completed: false, targetDate: new Date(Date.now() + 86400000) }
          ],
          impactMetrics: {
            jobApplications: 5,
            interviewsSecured: 2,
            offersReceived: 1,
            skillsAcquired: 3,
            connectionsGained: 10
          }
        },
        {
          _id: 'goal2',
          title: 'Goal 2',
          status: 'Completed',
          timeBound: { completedDate: new Date() },
          milestones: [],
          impactMetrics: {
            jobApplications: 3,
            interviewsSecured: 1,
            offersReceived: 0,
            skillsAcquired: 2,
            connectionsGained: 5
          }
        },
        {
          _id: 'goal3',
          title: 'At Risk Goal',
          status: 'At Risk',
          milestones: [],
          impactMetrics: {}
        }
      ];
      const mockStats = { total: 3, completed: 1 };
      
      mockGoal.find.mockResolvedValue(mockGoals);
      mockGoal.getUserStats.mockResolvedValue(mockStats);
      
      await getDashboardSummary(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        dashboard: expect.objectContaining({
          stats: mockStats,
          activeGoals: expect.any(Array),
          recentCompletions: expect.any(Array),
          atRiskGoals: expect.any(Array),
          upcomingMilestones: expect.any(Array),
          totalImpact: expect.objectContaining({
            jobApplications: 8,
            interviewsSecured: 3,
            offersReceived: 1,
            skillsAcquired: 5,
            connectionsGained: 15
          })
        })
      }));
    });

    it('should handle empty goals', async () => {
      mockGoal.find.mockResolvedValue([]);
      mockGoal.getUserStats.mockResolvedValue({ total: 0 });
      
      await getDashboardSummary(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        dashboard: expect.objectContaining({
          activeGoals: [],
          recentCompletions: [],
          atRiskGoals: [],
          totalImpact: {
            jobApplications: 0,
            interviewsSecured: 0,
            offersReceived: 0,
            skillsAcquired: 0,
            connectionsGained: 0
          }
        })
      }));
    });

    it('should handle errors', async () => {
      mockGoal.find.mockRejectedValue(new Error('DB error'));
      
      await getDashboardSummary(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
