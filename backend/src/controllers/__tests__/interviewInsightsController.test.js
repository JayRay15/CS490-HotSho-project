import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Reset modules to ensure clean imports
jest.resetModules();

// Mock dependencies before importing
const mockSelect = jest.fn();
const mockFind = jest.fn(() => ({
  select: mockSelect,
}));

const mockJob = {
  findOne: jest.fn(),
  find: mockFind,
};

const mockSuccessResponse = jest.fn();
const mockErrorResponse = jest.fn();
const mockSendResponse = jest.fn();

// Use unstable_mockModule for ES modules
jest.unstable_mockModule('../../models/Job.js', () => ({
  Job: mockJob,
}));

jest.unstable_mockModule('../../utils/responseFormat.js', () => ({
  successResponse: mockSuccessResponse,
  errorResponse: mockErrorResponse,
  sendResponse: mockSendResponse,
  ERROR_CODES: {
    UNAUTHORIZED: 'UNAUTHORIZED',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
  }
}));

jest.unstable_mockModule('../../middleware/errorHandler.js', () => ({
  asyncHandler: (fn) => fn,
}));

// Import controller AFTER mocks are set up
const { getInterviewInsights } = await import('../interviewInsightsController.js');

describe("Interview Insights Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      auth: {
        userId: "test-user-123",
      },
      params: {
        jobId: "job-123",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();
    mockJob.findOne.mockReset();
    mockFind.mockClear();
    mockSelect.mockReset();
    mockSuccessResponse.mockReset();
    mockErrorResponse.mockReset();
    mockSendResponse.mockReset();
  });

  describe("getInterviewInsights", () => {
    it("should return interview insights for a valid job", async () => {
      const mockJobData = {
        _id: "job-123",
        userId: "test-user-123",
        company: "TechCorp",
        title: "Software Engineer",
        industry: "Technology",
        status: "Interview",
        statusHistory: [
          { status: "Interested", timestamp: new Date("2024-01-01") },
          { status: "Applied", timestamp: new Date("2024-01-05") },
        ],
      };

      const mockCompanyJobs = [
        {
          status: "Phone Screen",
          statusHistory: [
            { status: "Applied", timestamp: new Date("2024-01-01") },
            { status: "Phone Screen", timestamp: new Date("2024-01-10") },
          ],
          applicationDate: new Date("2024-01-01"),
        },
        {
          status: "Interview",
          statusHistory: [
            { status: "Applied", timestamp: new Date("2024-01-15") },
            { status: "Interview", timestamp: new Date("2024-01-25") },
          ],
          applicationDate: new Date("2024-01-15"),
        },
      ];

      mockJob.findOne.mockResolvedValue(mockJobData);
      mockSelect.mockResolvedValue(mockCompanyJobs);

      const mockResponse = {
        response: { success: true, data: { insights: {} } },
        statusCode: 200,
      };
      mockSuccessResponse.mockReturnValue(mockResponse);

      await getInterviewInsights(req, res);

      expect(mockJob.findOne).toHaveBeenCalledWith({
        _id: "job-123",
        userId: "test-user-123",
      });

      expect(mockJob.find).toHaveBeenCalledWith({
        company: "TechCorp",
        status: { $in: ["Phone Screen", "Interview", "Offer", "Rejected"] },
      });

      expect(mockSuccessResponse).toHaveBeenCalled();
      const successCall = mockSuccessResponse.mock.calls[0];
      expect(successCall[0]).toBe("Interview insights retrieved successfully");
      expect(successCall[1].insights).toBeDefined();
      expect(successCall[1].insights.company).toBe("TechCorp");
      expect(successCall[1].insights.jobTitle).toBe("Software Engineer");
    });

    it("should return 401 if user is not authenticated", async () => {
      req.auth = null;

      const mockResponse = {
        response: { success: false, message: "Unauthorized" },
        statusCode: 401,
      };
      mockErrorResponse.mockReturnValue(mockResponse);

      await getInterviewInsights(req, res);

      expect(mockErrorResponse).toHaveBeenCalledWith(
        "Unauthorized: missing authentication credentials",
        401,
        expect.any(String)
      );
    });

    it("should return 404 if job is not found", async () => {
      mockJob.findOne.mockResolvedValue(null);

      const mockResponse = {
        response: { success: false, message: "Job not found" },
        statusCode: 404,
      };
      mockErrorResponse.mockReturnValue(mockResponse);

      await getInterviewInsights(req, res);

      expect(mockJob.findOne).toHaveBeenCalledWith({
        _id: "job-123",
        userId: "test-user-123",
      });

      expect(mockErrorResponse).toHaveBeenCalledWith(
        "Job not found or you don't have permission to view it",
        404,
        expect.any(String)
      );
    });

    it("should generate insights with all required sections", async () => {
      const mockJobData = {
        _id: "job-123",
        userId: "test-user-123",
        company: "DataCorp",
        title: "Data Analyst",
        industry: "Technology",
        status: "Applied",
        statusHistory: [{ status: "Applied", timestamp: new Date() }],
      };

      mockJob.findOne.mockResolvedValue(mockJobData);
      mockSelect.mockResolvedValue([]);

      const mockResponse = {
        response: { success: true, data: { insights: {} } },
        statusCode: 200,
      };
      mockSuccessResponse.mockReturnValue(mockResponse);

      await getInterviewInsights(req, res);

      const successCall = mockSuccessResponse.mock.calls[0];
      const insights = successCall[1].insights;

      // Verify all required sections are present
      expect(insights.processStages).toBeDefined();
      expect(insights.timeline).toBeDefined();
      expect(insights.successMetrics).toBeDefined();
      expect(insights.commonQuestions).toBeDefined();
      expect(insights.interviewerInfo).toBeDefined();
      expect(insights.interviewFormats).toBeDefined();
      expect(insights.preparationRecs).toBeDefined();
      expect(insights.successTips).toBeDefined();
      expect(insights.checklist).toBeDefined();
      expect(insights.dataSource).toBeDefined();
      expect(insights.generatedAt).toBeDefined();
    });

    it("should include role-specific questions for software engineers", async () => {
      const mockJobData = {
        _id: "job-123",
        userId: "test-user-123",
        company: "TechStartup",
        title: "Software Developer",
        industry: "Technology",
        status: "Interview",
        statusHistory: [{ status: "Interview", timestamp: new Date() }],
      };

      mockJob.findOne.mockResolvedValue(mockJobData);
      mockSelect.mockResolvedValue([]);

      const mockResponse = {
        response: { success: true, data: { insights: {} } },
        statusCode: 200,
      };
      mockSuccessResponse.mockReturnValue(mockResponse);

      await getInterviewInsights(req, res);

      const successCall = mockSuccessResponse.mock.calls[0];
      const insights = successCall[1].insights;

      expect(insights.commonQuestions.technical).toBeDefined();
      expect(insights.commonQuestions.technical.length).toBeGreaterThan(0);
      expect(insights.commonQuestions.roleSpecific).toBeDefined();
      expect(insights.preparationRecs.roleSpecific).toBeDefined();
    });

    it("should indicate limited data when company jobs are less than 3", async () => {
      const mockJobData = {
        _id: "job-123",
        userId: "test-user-123",
        company: "NewCompany",
        title: "Marketing Manager",
        industry: "Marketing",
        status: "Applied",
        statusHistory: [{ status: "Applied", timestamp: new Date() }],
      };

      mockJob.findOne.mockResolvedValue(mockJobData);
      mockSelect.mockResolvedValue([mockJobData]); // Only 1 job

      const mockResponse = {
        response: { success: true, data: { insights: {} } },
        statusCode: 200,
      };
      mockSuccessResponse.mockReturnValue(mockResponse);

      await getInterviewInsights(req, res);

      const successCall = mockSuccessResponse.mock.calls[0];
      const insights = successCall[1].insights;

      expect(insights.dataSource.basedOnRealData).toBe(false);
      expect(insights.dataSource.note).toContain("Limited data available");
    });

    it("should include preparation checklist with all phases", async () => {
      const mockJobData = {
        _id: "job-123",
        userId: "test-user-123",
        company: "GlobalCorp",
        title: "Project Manager",
        status: "Interview",
        statusHistory: [{ status: "Interview", timestamp: new Date() }],
      };

      mockJob.findOne.mockResolvedValue(mockJobData);
      mockSelect.mockResolvedValue([]);

      const mockResponse = {
        response: { success: true, data: { insights: {} } },
        statusCode: 200,
      };
      mockSuccessResponse.mockReturnValue(mockResponse);

      await getInterviewInsights(req, res);

      const successCall = mockSuccessResponse.mock.calls[0];
      const checklist = successCall[1].insights.checklist;

      expect(checklist.oneWeekBefore).toBeDefined();
      expect(checklist.threeDaysBefore).toBeDefined();
      expect(checklist.oneDayBefore).toBeDefined();
      expect(checklist.dayOf).toBeDefined();
      expect(checklist.afterInterview).toBeDefined();
      
      // Each phase should have tasks
      expect(checklist.oneWeekBefore.length).toBeGreaterThan(0);
      expect(checklist.dayOf.length).toBeGreaterThan(0);
    });
  });
});
