import { jest } from "@jest/globals";

// Use ESM-friendly module mocking: pre-register the Job module mock
await jest.unstable_mockModule("../../models/Job.js", () => ({
  __esModule: true,
  Job: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe("Job Analytics Controller", () => {
  let req, res, mockJobs;

  beforeEach(async () => {
    // Reset Jest module registry and mocks
    jest.resetModules();
    jest.clearAllMocks();

    // Dynamically import the mocked Job module and ensure mocks exist per-test
    const jobMod = await import("../../models/Job.js");
    jobMod.Job.find = jest.fn();
    jobMod.Job.countDocuments = jest.fn();

    // Mock request with userId
    req = { auth: { userId: "test-user-123" } };

    // Mock response
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // Mock jobs data
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    mockJobs = [
      {
        _id: "1",
        userId: "test-user-123",
        title: "Software Engineer",
        company: "TechCorp",
        status: "Applied",
        archived: false,
        createdAt: thirtyDaysAgo,
        updatedAt: thirtyDaysAgo,
        statusHistory: [
          { status: "Interested", timestamp: sixtyDaysAgo },
          { status: "Applied", timestamp: thirtyDaysAgo },
        ],
        applicationDate: thirtyDaysAgo,
        deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      },
      {
        _id: "2",
        userId: "test-user-123",
        title: "Frontend Developer",
        company: "WebCo",
        status: "Interview",
        archived: false,
        createdAt: thirtyDaysAgo,
        updatedAt: now,
        statusHistory: [
          { status: "Interested", timestamp: sixtyDaysAgo },
          { status: "Applied", timestamp: thirtyDaysAgo },
          { status: "Phone Screen", timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
          { status: "Interview", timestamp: now },
        ],
        applicationDate: thirtyDaysAgo,
        deadline: thirtyDaysAgo,
      },
      {
        _id: "3",
        userId: "test-user-123",
        title: "Backend Engineer",
        company: "DataCorp",
        status: "Offer",
        archived: false,
        createdAt: sixtyDaysAgo,
        updatedAt: now,
        statusHistory: [
          { status: "Interested", timestamp: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
          { status: "Applied", timestamp: sixtyDaysAgo },
          { status: "Interview", timestamp: thirtyDaysAgo },
          { status: "Offer", timestamp: now },
        ],
        applicationDate: sixtyDaysAgo,
        deadline: sixtyDaysAgo,
      },
      {
        _id: "4",
        userId: "test-user-123",
        title: "DevOps Engineer",
        company: "CloudCorp",
        status: "Rejected",
        archived: false,
        createdAt: thirtyDaysAgo,
        updatedAt: now,
        statusHistory: [
          { status: "Interested", timestamp: thirtyDaysAgo },
          { status: "Applied", timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000) },
          { status: "Rejected", timestamp: now },
        ],
        applicationDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        _id: "5",
        userId: "test-user-123",
        title: "Archived Job",
        company: "OldCorp",
        status: "Rejected",
        archived: true,
        createdAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000),
        statusHistory: [
          { status: "Interested", timestamp: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) },
          { status: "Rejected", timestamp: new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000) },
        ],
      },
    ];
  });

  describe("getJobAnalytics", () => {
    it("should return comprehensive analytics for user jobs", async () => {
      const jobMod = await import("../../models/Job.js");
      jobMod.Job.find.mockResolvedValue(mockJobs);

      const { getJobAnalytics } = await import("../jobController.js");

      await getJobAnalytics(req, res);

      expect(jobMod.Job.find).toHaveBeenCalledWith({ userId: "test-user-123" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      const response = res.json.mock.calls[0][0];
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response).toHaveProperty("data");
      expect(response.data).toHaveProperty("overview");
      expect(response.data).toHaveProperty("statusCounts");
      expect(response.data).toHaveProperty("statusDistribution");
      expect(response.data).toHaveProperty("avgTimeByStage");
      expect(response.data).toHaveProperty("monthlyVolume");
      expect(response.data).toHaveProperty("deadlineTracking");
      expect(response.data).toHaveProperty("timeToOffer");
    });

    it("should calculate correct total applications", async () => {
      const jobMod = await import("../../models/Job.js");
      jobMod.Job.find.mockResolvedValue(mockJobs);
      const { getJobAnalytics } = await import("../jobController.js");

      await getJobAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.overview).toBeDefined();
      expect(response.data.overview.totalApplications).toBe(5);
    });

    it("should calculate correct active vs archived applications", async () => {
      const jobMod = await import("../../models/Job.js");
      jobMod.Job.find.mockResolvedValue(mockJobs);
      const { getJobAnalytics } = await import("../jobController.js");

      await getJobAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.overview).toBeDefined();
      expect(response.data.overview.activeApplications).toBe(4);
      expect(response.data.overview.archivedApplications).toBe(1);
    });

    it("should calculate response rate correctly", async () => {
      const jobMod = await import("../../models/Job.js");
      jobMod.Job.find.mockResolvedValue(mockJobs);
      const { getJobAnalytics } = await import("../jobController.js");

      await getJobAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.overview).toBeDefined();
      // 3 responded (Interview, Offer, Rejected) out of 4 applied jobs
      expect(response.data.overview.responseRate).toBeGreaterThan(0);
    });

    it("should track status distribution", async () => {
      const jobMod = await import("../../models/Job.js");
      jobMod.Job.find.mockResolvedValue(mockJobs);
      const { getJobAnalytics } = await import("../jobController.js");

      await getJobAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.statusDistribution).toBeInstanceOf(Array);
      expect(response.data.statusDistribution.length).toBe(6); // 6 statuses
      
      const appliedStatus = response.data.statusDistribution.find(s => s.status === "Applied");
      expect(appliedStatus).toBeDefined();
      expect(appliedStatus.count).toBe(1);
    });

    it("should calculate average time by stage", async () => {
      const jobMod = await import("../../models/Job.js");
      jobMod.Job.find.mockResolvedValue(mockJobs);
      const { getJobAnalytics } = await import("../jobController.js");

      await getJobAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.avgTimeByStage).toBeDefined();
      // avgTimeByStage can be a string or number (converted to string with .toFixed)
      const appliedTime = response.data.avgTimeByStage.Applied;
      expect(appliedTime).toBeDefined();
      expect(parseFloat(appliedTime)).toBeGreaterThanOrEqual(0);
    });

    it("should provide monthly volume for last 12 months", async () => {
      const jobMod = await import("../../models/Job.js");
      jobMod.Job.find.mockResolvedValue(mockJobs);
      const { getJobAnalytics } = await import("../jobController.js");

      await getJobAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.monthlyVolume).toBeInstanceOf(Array);
      expect(response.data.monthlyVolume.length).toBe(12);
      expect(response.data.monthlyVolume[0]).toHaveProperty("month");
      expect(response.data.monthlyVolume[0]).toHaveProperty("count");
      expect(response.data.monthlyVolume[0]).toHaveProperty("timestamp");
    });

    it("should track deadline adherence", async () => {
      const jobMod = await import("../../models/Job.js");
      jobMod.Job.find.mockResolvedValue(mockJobs);
      const { getJobAnalytics } = await import("../jobController.js");

      await getJobAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.deadlineTracking).toBeDefined();
      expect(response.data.deadlineTracking.total).toBeGreaterThan(0);
      expect(response.data.deadlineTracking).toHaveProperty("met");
      expect(response.data.deadlineTracking).toHaveProperty("missed");
      expect(response.data.deadlineTracking).toHaveProperty("upcoming");
      expect(response.data.deadlineTracking).toHaveProperty("adherenceRate");
    });

    it("should calculate time to offer", async () => {
      const jobMod = await import("../../models/Job.js");
      jobMod.Job.find.mockResolvedValue(mockJobs);
      const { getJobAnalytics } = await import("../jobController.js");

      await getJobAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.timeToOffer).toBeDefined();
      expect(response.data.timeToOffer.count).toBe(1); // One offer job
      expect(parseFloat(response.data.timeToOffer.average)).toBeGreaterThan(0);
    });

    it("should return unauthorized error if no userId", async () => {
      req.auth = {};

      const { getJobAnalytics } = await import("../jobController.js");
      await getJobAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
    });

    it("should handle empty job list", async () => {
      const jobMod = await import("../../models/Job.js");
      jobMod.Job.find.mockResolvedValue([]);
      const { getJobAnalytics } = await import("../jobController.js");

      await getJobAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.overview).toBeDefined();
      expect(response.data.overview.totalApplications).toBe(0);
      expect(response.data.overview.responseRate).toBe(0);
    });

    it("should calculate offer rate correctly", async () => {
      const jobMod = await import("../../models/Job.js");
      jobMod.Job.find.mockResolvedValue(mockJobs);
      const { getJobAnalytics } = await import("../jobController.js");

      await getJobAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.overview).toBeDefined();
      expect(response.data.overview.offerRate).toBeGreaterThan(0);
      // 1 offer out of 4 applied jobs = 25%
      expect(parseFloat(response.data.overview.offerRate)).toBeCloseTo(25, 0);
    });

    it("should calculate interview rate correctly", async () => {
      const jobMod = await import("../../models/Job.js");
      jobMod.Job.find.mockResolvedValue(mockJobs);
      const { getJobAnalytics } = await import("../jobController.js");

      await getJobAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.overview).toBeDefined();
      expect(response.data.overview.interviewRate).toBeGreaterThan(0);
      // 2 (Interview + Offer) out of 4 applied = 50%
      expect(parseFloat(response.data.overview.interviewRate)).toBeCloseTo(50, 0);
    });

    it("should handle database errors gracefully", async () => {
      const jobMod = await import("../../models/Job.js");
      jobMod.Job.find.mockRejectedValue(new Error("Database error"));
      const { getJobAnalytics } = await import("../jobController.js");

      await getJobAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
    });
  });
});
