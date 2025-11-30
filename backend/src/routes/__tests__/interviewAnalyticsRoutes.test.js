import mongoose from "mongoose";
import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";

// Mock the middleware
jest.unstable_mockModule("../../middleware/checkJwt.js", () => ({
  checkJwt: (req, res, next) => {
    req.user = { id: "test-user-123" };
    next();
  },
}));

// Import after mocking
const { Interview } = await import("../../models/Interview.js");
const { MockInterviewSession } = await import("../../models/MockInterviewSession.js");
const { Job } = await import("../../models/Job.js");
const interviewRoutes = (await import("../interviewRoutes.js")).default;

const app = express();
app.use(express.json());
app.use("/api/interviews", interviewRoutes);

describe("Interview Analytics Routes", () => {
  const testUserId = "test-user-123";
  
  beforeEach(async () => {
    // Clear test data
    await Interview.deleteMany({ userId: testUserId });
    await MockInterviewSession.deleteMany({ clerkId: testUserId });
  });

  afterAll(async () => {
    await Interview.deleteMany({ userId: testUserId });
    await MockInterviewSession.deleteMany({ clerkId: testUserId });
  });

  describe("GET /api/interviews/analytics/performance", () => {
    it("should return analytics for user with no interviews", async () => {
      const res = await request(app)
        .get("/api/interviews/analytics/performance")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.analytics).toBeDefined();
      expect(res.body.data.analytics.overview.totalInterviews).toBe(0);
      expect(res.body.data.analytics.overview.completedInterviews).toBe(0);
    });

    it("should calculate conversion rates correctly", async () => {
      // Create test interviews
      const interviews = [
        {
          userId: testUserId,
          title: "Interview 1",
          company: "Tech Corp",
          interviewType: "Phone Screen",
          scheduledDate: new Date("2024-01-15"),
          status: "Completed",
          outcome: { result: "Passed", rating: 4 },
        },
        {
          userId: testUserId,
          title: "Interview 2",
          company: "Tech Corp",
          interviewType: "Technical",
          scheduledDate: new Date("2024-01-20"),
          status: "Completed",
          outcome: { result: "Offer Extended", rating: 5 },
        },
        {
          userId: testUserId,
          title: "Interview 3",
          company: "Finance Inc",
          interviewType: "Video Call",
          scheduledDate: new Date("2024-01-25"),
          status: "Completed",
          outcome: { result: "Failed", rating: 2 },
        },
        {
          userId: testUserId,
          title: "Interview 4",
          company: "Startup X",
          interviewType: "Phone Screen",
          scheduledDate: new Date("2024-12-15"),
          status: "Scheduled",
        },
      ];

      await Interview.insertMany(interviews);

      const res = await request(app)
        .get("/api/interviews/analytics/performance")
        .expect(200);

      const { analytics } = res.body.data;
      
      expect(analytics.overview.totalInterviews).toBe(4);
      expect(analytics.overview.completedInterviews).toBe(3);
      expect(analytics.overview.upcomingInterviews).toBe(1);
      
      // Conversion rates
      expect(analytics.conversionRates.completionRate).toBeCloseTo(75, 0);
      expect(analytics.conversionRates.offerRate).toBeGreaterThan(0);
    });

    it("should analyze performance by interview type", async () => {
      const interviews = [
        {
          userId: testUserId,
          title: "Technical 1",
          company: "Tech Corp",
          interviewType: "Technical",
          scheduledDate: new Date("2024-01-15"),
          status: "Completed",
          outcome: { result: "Passed", rating: 5 },
        },
        {
          userId: testUserId,
          title: "Technical 2",
          company: "Tech Inc",
          interviewType: "Technical",
          scheduledDate: new Date("2024-01-20"),
          status: "Completed",
          outcome: { result: "Passed", rating: 4 },
        },
        {
          userId: testUserId,
          title: "Phone 1",
          company: "Other Corp",
          interviewType: "Phone Screen",
          scheduledDate: new Date("2024-01-25"),
          status: "Completed",
          outcome: { result: "Failed", rating: 2 },
        },
        {
          userId: testUserId,
          title: "Phone 2",
          company: "Another Corp",
          interviewType: "Phone Screen",
          scheduledDate: new Date("2024-01-28"),
          status: "Completed",
          outcome: { result: "Failed", rating: 2 },
        },
      ];

      await Interview.insertMany(interviews);

      const res = await request(app)
        .get("/api/interviews/analytics/performance")
        .expect(200);

      const { strengthsWeaknesses } = res.body.data.analytics;
      
      // Technical should be a strength (100% success)
      expect(strengthsWeaknesses.strengths).toBeDefined();
      expect(strengthsWeaknesses.weaknesses).toBeDefined();
      
      if (strengthsWeaknesses.strengths.length > 0) {
        expect(strengthsWeaknesses.strengths[0].type).toBe("Technical");
      }
    });

    it("should track improvement over time", async () => {
      // Create older interviews (3-6 months ago) with worse performance
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 1);

      const interviews = [
        // Old interviews - poor performance
        {
          userId: testUserId,
          title: "Old Interview 1",
          company: "Corp A",
          interviewType: "Phone Screen",
          scheduledDate: sixMonthsAgo,
          status: "Completed",
          outcome: { result: "Failed", rating: 2 },
        },
        {
          userId: testUserId,
          title: "Old Interview 2",
          company: "Corp B",
          interviewType: "Video Call",
          scheduledDate: sixMonthsAgo,
          status: "Completed",
          outcome: { result: "Failed", rating: 2 },
        },
        // Recent interviews - good performance
        {
          userId: testUserId,
          title: "Recent Interview 1",
          company: "Corp C",
          interviewType: "Technical",
          scheduledDate: recentDate,
          status: "Completed",
          outcome: { result: "Passed", rating: 5 },
        },
        {
          userId: testUserId,
          title: "Recent Interview 2",
          company: "Corp D",
          interviewType: "Final Round",
          scheduledDate: recentDate,
          status: "Completed",
          outcome: { result: "Offer Extended", rating: 5 },
        },
      ];

      await Interview.insertMany(interviews);

      const res = await request(app)
        .get("/api/interviews/analytics/performance")
        .expect(200);

      const { improvementTracking } = res.body.data.analytics;
      
      expect(improvementTracking).toBeDefined();
      expect(improvementTracking.mockSessionsCount).toBeDefined();
    });

    it("should generate personalized recommendations", async () => {
      const interviews = [
        {
          userId: testUserId,
          title: "Interview 1",
          company: "Tech Corp",
          interviewType: "Phone Screen",
          scheduledDate: new Date("2024-01-15"),
          status: "Completed",
          outcome: { result: "Failed", rating: 2 },
        },
        {
          userId: testUserId,
          title: "Interview 2",
          company: "Tech Inc",
          interviewType: "Phone Screen",
          scheduledDate: new Date("2024-01-20"),
          status: "Completed",
          outcome: { result: "Failed", rating: 2 },
        },
      ];

      await Interview.insertMany(interviews);

      const res = await request(app)
        .get("/api/interviews/analytics/performance")
        .expect(200);

      const { recommendations } = res.body.data.analytics;
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      // Should have recommendations due to poor performance
      if (recommendations.length > 0) {
        expect(recommendations[0]).toHaveProperty("title");
        expect(recommendations[0]).toHaveProperty("priority");
      }
    });

    it("should calculate industry benchmarks", async () => {
      const interviews = [
        {
          userId: testUserId,
          title: "Interview 1",
          company: "Tech Corp",
          interviewType: "Technical",
          scheduledDate: new Date("2024-01-15"),
          status: "Completed",
          outcome: { result: "Offer Extended", rating: 5 },
        },
      ];

      await Interview.insertMany(interviews);

      const res = await request(app)
        .get("/api/interviews/analytics/performance")
        .expect(200);

      const { benchmarks } = res.body.data.analytics;
      
      expect(benchmarks).toBeDefined();
      expect(benchmarks.industryAverages).toBeDefined();
      expect(benchmarks.industryAverages.successRate).toBe(40);
      expect(benchmarks.industryAverages.offerRate).toBe(25);
    });
  });

  describe("POST /api/interviews/analytics/seed", () => {
    it("should generate test data successfully", async () => {
      const res = await request(app)
        .post("/api/interviews/analytics/seed")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.interviewsCreated).toBe(25);
      expect(res.body.data.mockSessionsCreated).toBe(8);

      // Verify data was created
      const interviews = await Interview.find({ userId: testUserId });
      expect(interviews.length).toBe(25);
    });

    it("should clear existing data before seeding", async () => {
      // Create some existing data
      await Interview.create({
        userId: testUserId,
        title: "Existing Interview",
        company: "Existing Corp",
        interviewType: "Phone Screen",
        scheduledDate: new Date(),
        status: "Scheduled",
      });

      const res = await request(app)
        .post("/api/interviews/analytics/seed")
        .expect(200);

      // Should have exactly 25 interviews (not 26)
      const interviews = await Interview.find({ userId: testUserId });
      expect(interviews.length).toBe(25);
    });
  });

  describe("DELETE /api/interviews/analytics/clear", () => {
    it("should clear all interview data", async () => {
      // Create some data first
      await Interview.insertMany([
        {
          userId: testUserId,
          title: "Interview 1",
          company: "Corp A",
          interviewType: "Phone Screen",
          scheduledDate: new Date(),
          status: "Scheduled",
        },
        {
          userId: testUserId,
          title: "Interview 2",
          company: "Corp B",
          interviewType: "Video Call",
          scheduledDate: new Date(),
          status: "Scheduled",
        },
      ]);

      await MockInterviewSession.create({
        clerkId: testUserId,
        type: "behavioral",
        difficulty: "mid",
        status: "completed",
        startedAt: new Date(),
      });

      const res = await request(app)
        .delete("/api/interviews/analytics/clear")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.interviewsDeleted).toBe(2);
      expect(res.body.data.mockSessionsDeleted).toBe(1);

      // Verify data was deleted
      const interviews = await Interview.find({ userId: testUserId });
      const mockSessions = await MockInterviewSession.find({ clerkId: testUserId });
      expect(interviews.length).toBe(0);
      expect(mockSessions.length).toBe(0);
    });

    it("should return 0 if no data exists", async () => {
      const res = await request(app)
        .delete("/api/interviews/analytics/clear")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.interviewsDeleted).toBe(0);
      expect(res.body.data.mockSessionsDeleted).toBe(0);
    });
  });

  describe("Analytics Calculation Edge Cases", () => {
    it("should handle interviews without ratings", async () => {
      await Interview.create({
        userId: testUserId,
        title: "No Rating Interview",
        company: "Corp",
        interviewType: "Phone Screen",
        scheduledDate: new Date("2024-01-15"),
        status: "Completed",
        outcome: { result: "Passed" }, // No rating
      });

      const res = await request(app)
        .get("/api/interviews/analytics/performance")
        .expect(200);

      expect(res.body.data.analytics.overview.averageRating).toBeNull();
    });

    it("should handle mixed statuses correctly", async () => {
      await Interview.insertMany([
        {
          userId: testUserId,
          title: "Cancelled",
          company: "Corp A",
          interviewType: "Phone Screen",
          scheduledDate: new Date("2024-01-15"),
          status: "Cancelled",
        },
        {
          userId: testUserId,
          title: "No Show",
          company: "Corp B",
          interviewType: "Video Call",
          scheduledDate: new Date("2024-01-20"),
          status: "No-Show",
        },
        {
          userId: testUserId,
          title: "Completed",
          company: "Corp C",
          interviewType: "Technical",
          scheduledDate: new Date("2024-01-25"),
          status: "Completed",
          outcome: { result: "Passed", rating: 4 },
        },
      ]);

      const res = await request(app)
        .get("/api/interviews/analytics/performance")
        .expect(200);

      const { overview } = res.body.data.analytics;
      expect(overview.totalInterviews).toBe(3);
      expect(overview.completedInterviews).toBe(1);
    });

    it("should handle Pending outcome correctly", async () => {
      await Interview.create({
        userId: testUserId,
        title: "Pending Outcome",
        company: "Corp",
        interviewType: "Phone Screen",
        scheduledDate: new Date("2024-01-15"),
        status: "Completed",
        outcome: { result: "Pending" },
      });

      const res = await request(app)
        .get("/api/interviews/analytics/performance")
        .expect(200);

      // Pending should not be counted as completed
      expect(res.body.data.analytics.overview.completedInterviews).toBe(0);
    });
  });
});
