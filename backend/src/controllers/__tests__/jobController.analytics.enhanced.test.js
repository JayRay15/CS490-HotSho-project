/**
 * Enhanced Analytics Tests for Job Controller
 * Tests all new UC-072 features
 */

import { getJobAnalytics } from '../jobController.js';
import { Job } from '../../models/Job.js';

// Mock the Job model
jest.mock('../../models/Job.js');

describe('Job Controller - Enhanced Analytics (UC-072)', () => {
  let mockReq, mockRes, mockJobs;

  beforeEach(() => {
    // Setup mock request
    mockReq = {
      auth: {
        userId: 'test-user-123'
      }
    };

    // Setup mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Setup mock jobs data
    mockJobs = [
      {
        _id: '1',
        userId: 'test-user-123',
        title: 'Software Engineer',
        company: 'TechCorp',
        status: 'Applied',
        industry: 'Technology',
        workMode: 'Remote',
        applicationDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-10'),
        archived: false,
        statusHistory: [
          { status: 'Interested', timestamp: new Date('2024-01-10') },
          { status: 'Applied', timestamp: new Date('2024-01-15') }
        ]
      },
      {
        _id: '2',
        userId: 'test-user-123',
        title: 'Senior Developer',
        company: 'StartupXYZ',
        status: 'Interview',
        industry: 'Technology',
        workMode: 'Hybrid',
        applicationDate: new Date('2024-01-20'),
        createdAt: new Date('2024-01-18'),
        archived: false,
        statusHistory: [
          { status: 'Interested', timestamp: new Date('2024-01-18') },
          { status: 'Applied', timestamp: new Date('2024-01-20') },
          { status: 'Phone Screen', timestamp: new Date('2024-01-25') },
          { status: 'Interview', timestamp: new Date('2024-01-30') }
        ]
      },
      {
        _id: '3',
        userId: 'test-user-123',
        title: 'Data Scientist',
        company: 'TechCorp',
        status: 'Offer',
        industry: 'Technology',
        workMode: 'Remote',
        applicationDate: new Date('2024-02-01'),
        createdAt: new Date('2024-01-28'),
        archived: false,
        statusHistory: [
          { status: 'Interested', timestamp: new Date('2024-01-28') },
          { status: 'Applied', timestamp: new Date('2024-02-01') },
          { status: 'Phone Screen', timestamp: new Date('2024-02-05') },
          { status: 'Interview', timestamp: new Date('2024-02-10') },
          { status: 'Offer', timestamp: new Date('2024-02-15') }
        ]
      },
      {
        _id: '4',
        userId: 'test-user-123',
        title: 'Healthcare Analyst',
        company: 'MedCorp',
        status: 'Rejected',
        industry: 'Healthcare',
        workMode: 'On-site',
        applicationDate: new Date('2024-02-10'),
        createdAt: new Date('2024-02-08'),
        archived: false,
        statusHistory: [
          { status: 'Interested', timestamp: new Date('2024-02-08') },
          { status: 'Applied', timestamp: new Date('2024-02-10') },
          { status: 'Rejected', timestamp: new Date('2024-02-20') }
        ]
      }
    ];

    Job.find = jest.fn().mockResolvedValue(mockJobs);
    Job.countDocuments = jest.fn().mockResolvedValue(mockJobs.length);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Application Funnel Analytics', () => {
    it('should calculate funnel stages correctly', async () => {
      await getJobAnalytics(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];
      
      expect(response.data.funnelAnalytics).toBeDefined();
      expect(response.data.funnelAnalytics.applied).toBeGreaterThan(0);
      expect(response.data.funnelAnalytics.phoneScreen).toBeDefined();
      expect(response.data.funnelAnalytics.interview).toBeDefined();
      expect(response.data.funnelAnalytics.offer).toBeDefined();
    });

    it('should calculate conversion rates correctly', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const conversionRates = response.data.funnelAnalytics.conversionRates;
      
      expect(conversionRates).toBeDefined();
      expect(conversionRates.applyToScreen).toBeDefined();
      expect(conversionRates.screenToInterview).toBeDefined();
      expect(conversionRates.interviewToOffer).toBeDefined();
      
      // Rates should be percentages (0-100)
      expect(parseFloat(conversionRates.applyToScreen)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(conversionRates.applyToScreen)).toBeLessThanOrEqual(100);
    });
  });

  describe('Company Analytics', () => {
    it('should track response times by company', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      
      expect(response.data.companyAnalytics).toBeDefined();
      expect(Array.isArray(response.data.companyAnalytics)).toBe(true);
    });

    it('should calculate company success rates', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const companies = response.data.companyAnalytics;
      
      if (companies.length > 0) {
        companies.forEach(company => {
          expect(company.company).toBeDefined();
          expect(company.avgResponseTime).toBeDefined();
          expect(company.applications).toBeDefined();
          expect(company.successRate).toBeDefined();
        });
      }
    });

    it('should sort companies by application count', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const companies = response.data.companyAnalytics;
      
      if (companies.length > 1) {
        for (let i = 0; i < companies.length - 1; i++) {
          expect(companies[i].applications).toBeGreaterThanOrEqual(companies[i + 1].applications);
        }
      }
    });
  });

  describe('Industry Analytics', () => {
    it('should provide industry-specific insights', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      
      expect(response.data.industryAnalytics).toBeDefined();
      expect(Array.isArray(response.data.industryAnalytics)).toBe(true);
    });

    it('should calculate industry response times', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const industries = response.data.industryAnalytics;
      
      if (industries.length > 0) {
        industries.forEach(industry => {
          expect(industry.industry).toBeDefined();
          expect(industry.avgResponseTime).toBeDefined();
          expect(industry.applications).toBeDefined();
          expect(industry.successRate).toBeDefined();
        });
      }
    });
  });

  describe('Success Rate by Approach', () => {
    it('should analyze success by work mode', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      
      expect(response.data.approachAnalytics).toBeDefined();
    });

    it('should calculate rates for each work mode', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const approaches = response.data.approachAnalytics;
      
      Object.values(approaches).forEach(approach => {
        expect(approach.applications).toBeDefined();
        expect(approach.responseRate).toBeDefined();
        expect(approach.interviewRate).toBeDefined();
        expect(approach.offerRate).toBeDefined();
      });
    });
  });

  describe('Application Frequency Trends', () => {
    it('should provide weekly trends', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      
      expect(response.data.weeklyTrends).toBeDefined();
      expect(Array.isArray(response.data.weeklyTrends)).toBe(true);
      expect(response.data.weeklyTrends.length).toBe(4); // Last 4 weeks
    });

    it('should include application and response counts', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const trends = response.data.weeklyTrends;
      
      trends.forEach(week => {
        expect(week.week).toBeDefined();
        expect(week.applications).toBeDefined();
        expect(week.responses).toBeDefined();
        expect(typeof week.applications).toBe('number');
        expect(typeof week.responses).toBe('number');
      });
    });
  });

  describe('Performance Benchmarking', () => {
    it('should provide industry benchmarks', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      
      expect(response.data.benchmarks).toBeDefined();
      expect(response.data.benchmarks.industryAverages).toBeDefined();
      expect(response.data.benchmarks.userPerformance).toBeDefined();
      expect(response.data.benchmarks.comparison).toBeDefined();
    });

    it('should compare user performance to industry', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const benchmarks = response.data.benchmarks;
      
      ['responseRate', 'interviewRate', 'offerRate'].forEach(metric => {
        expect(benchmarks.industryAverages[metric]).toBeDefined();
        expect(benchmarks.userPerformance[metric]).toBeDefined();
        expect(benchmarks.comparison[metric]).toMatch(/above|average|below/);
      });
    });
  });

  describe('Optimization Recommendations', () => {
    it('should provide actionable recommendations', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      
      expect(response.data.recommendations).toBeDefined();
      expect(Array.isArray(response.data.recommendations)).toBe(true);
    });

    it('should categorize recommendations by type', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const recommendations = response.data.recommendations;
      
      recommendations.forEach(rec => {
        expect(rec.type).toMatch(/critical|warning|success|info/);
        expect(rec.category).toBeDefined();
        expect(rec.message).toBeDefined();
        expect(rec.action).toBeDefined();
      });
    });

    it('should generate low response rate recommendation', async () => {
      // Mock low response rate scenario
      const lowRateJobs = mockJobs.map(j => ({ ...j, status: 'Applied' }));
      Job.find = jest.fn().mockResolvedValue(lowRateJobs);

      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const recommendations = response.data.recommendations;
      
      const responseRateRec = recommendations.find(r => r.category === 'Response Rate');
      expect(responseRateRec).toBeDefined();
    });
  });

  describe('Goal Tracking', () => {
    it('should track monthly goals', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      
      expect(response.data.goalTracking).toBeDefined();
      expect(response.data.goalTracking.applications).toBeDefined();
      expect(response.data.goalTracking.interviews).toBeDefined();
      expect(response.data.goalTracking.offers).toBeDefined();
    });

    it('should calculate goal progress percentages', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const goals = response.data.goalTracking;
      
      ['applications', 'interviews', 'offers'].forEach(category => {
        expect(goals[category].goal).toBeDefined();
        expect(goals[category].current).toBeDefined();
        expect(goals[category].percentage).toBeDefined();
        expect(parseFloat(goals[category].percentage)).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Export Data Completeness', () => {
    it('should include all analytics data for export', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const data = response.data;
      
      // Verify all sections are present for comprehensive export
      expect(data.overview).toBeDefined();
      expect(data.funnelAnalytics).toBeDefined();
      expect(data.companyAnalytics).toBeDefined();
      expect(data.industryAnalytics).toBeDefined();
      expect(data.approachAnalytics).toBeDefined();
      expect(data.weeklyTrends).toBeDefined();
      expect(data.monthlyVolume).toBeDefined();
      expect(data.benchmarks).toBeDefined();
      expect(data.recommendations).toBeDefined();
      expect(data.goalTracking).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized requests', async () => {
      const req = { auth: {} };
      
      await getJobAnalytics(req, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];
      expect(response.status).toBe('error');
    });

    it('should handle database errors gracefully', async () => {
      Job.find = jest.fn().mockRejectedValue(new Error('Database error'));

      await getJobAnalytics(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];
      expect(response.status).toBe('error');
    });
  });

  describe('Data Accuracy', () => {
    it('should calculate response rate correctly', async () => {
      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      const responseRate = response.data.overview.responseRate;
      
      expect(typeof responseRate).toBe('number');
      expect(responseRate).toBeGreaterThanOrEqual(0);
      expect(responseRate).toBeLessThanOrEqual(100);
    });

    it('should handle empty data sets', async () => {
      Job.find = jest.fn().mockResolvedValue([]);

      await getJobAnalytics(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      
      expect(response.status).toBe('success');
      expect(response.data.overview.totalApplications).toBe(0);
    });
  });
});
