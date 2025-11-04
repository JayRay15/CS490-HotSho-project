import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuth } from "@clerk/clerk-react";
import JobStatistics from "../JobStatistics";
import api from "../../api/axios";

// Mock dependencies
vi.mock("@clerk/clerk-react");
vi.mock("../../api/axios");

// Mock the setAuthToken function
vi.mock("../../api/axios", async () => {
  const actual = await vi.importActual("../../api/axios");
  return {
    ...actual,
    default: {
      get: vi.fn(),
    },
    setAuthToken: vi.fn(),
  };
});

describe("JobStatistics", () => {
  const mockAnalyticsData = {
    data: {
      success: true,
      message: "Job analytics retrieved successfully",
      data: {
        overview: {
          totalApplications: 25,
          activeApplications: 20,
          archivedApplications: 5,
          responseRate: 60.0,
          offerRate: 20.0,
          interviewRate: 40.0,
        },
        statusCounts: {
          Interested: 5,
          Applied: 8,
          "Phone Screen": 4,
          Interview: 3,
          Offer: 2,
          Rejected: 3,
        },
        statusDistribution: [
          { status: "Interested", count: 5, percentage: "20.0" },
          { status: "Applied", count: 8, percentage: "32.0" },
          { status: "Phone Screen", count: 4, percentage: "16.0" },
          { status: "Interview", count: 3, percentage: "12.0" },
          { status: "Offer", count: 2, percentage: "8.0" },
          { status: "Rejected", count: 3, percentage: "12.0" },
        ],
        avgTimeByStage: {
          Interested: "5.5",
          Applied: "10.2",
          "Phone Screen": "7.8",
          Interview: "14.3",
          Offer: "3.1",
          Rejected: "8.9",
        },
        monthlyVolume: [
          { month: "Jan 2025", count: 2, timestamp: 1704096000000 },
          { month: "Feb 2025", count: 3, timestamp: 1706774400000 },
          { month: "Mar 2025", count: 5, timestamp: 1709280000000 },
          { month: "Apr 2025", count: 4, timestamp: 1711958400000 },
          { month: "May 2025", count: 3, timestamp: 1714550400000 },
          { month: "Jun 2025", count: 2, timestamp: 1717228800000 },
          { month: "Jul 2025", count: 1, timestamp: 1719820800000 },
          { month: "Aug 2025", count: 0, timestamp: 1722499200000 },
          { month: "Sep 2025", count: 2, timestamp: 1725177600000 },
          { month: "Oct 2025", count: 1, timestamp: 1727769600000 },
          { month: "Nov 2025", count: 2, timestamp: 1730448000000 },
          { month: "Dec 2025", count: 0, timestamp: 1733040000000 },
        ],
        deadlineTracking: {
          total: 15,
          met: 12,
          missed: 2,
          upcoming: 1,
          adherenceRate: 80.0,
        },
        timeToOffer: {
          average: 45.5,
          count: 2,
        },
      },
    },
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      getToken: vi.fn().mockResolvedValue("mock-token"),
    });
  });

  it("renders loading state initially", () => {
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<JobStatistics onClose={mockOnClose} />);
    
    expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();
  });

  it("fetches and displays analytics data", async () => {
    api.get.mockResolvedValue(mockAnalyticsData);

    render(<JobStatistics onClose={mockOnClose} />);

    // Wait for the analytics to load
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/jobs/analytics");
    }, { timeout: 3000 });

    // Wait for the heading to appear
    await waitFor(() => {
      const heading = screen.queryByText("Job Search Analytics");
      expect(heading).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check overview metrics
    await waitFor(() => {
      expect(screen.getByText("25")).toBeInTheDocument(); // Total apps
    });
    expect(screen.getByText("20")).toBeInTheDocument(); // Active apps
    expect(screen.getByText("60%")).toBeInTheDocument(); // Response rate
  });

  it("displays status distribution correctly", async () => {
    api.get.mockResolvedValue(mockAnalyticsData);

    render(<JobStatistics onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText("Applications by Status")).toBeInTheDocument();
    });

    expect(screen.getByText("Interested")).toBeInTheDocument();
    expect(screen.getByText("Applied")).toBeInTheDocument();
    expect(screen.getByText("Interview")).toBeInTheDocument();
  });

  it("displays average time by stage", async () => {
    api.get.mockResolvedValue(mockAnalyticsData);

    render(<JobStatistics onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText("Average Time in Each Stage")).toBeInTheDocument();
    });

    expect(screen.getByText("5.5")).toBeInTheDocument();
    expect(screen.getByText("10.2")).toBeInTheDocument();
  });

  it("displays monthly volume chart", async () => {
    api.get.mockResolvedValue(mockAnalyticsData);

    render(<JobStatistics onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText("Monthly Application Volume (Last 12 Months)")).toBeInTheDocument();
    });

    expect(screen.getByText("Jan 2025")).toBeInTheDocument();
    expect(screen.getByText("Feb 2025")).toBeInTheDocument();
  });

  it("displays deadline adherence tracking", async () => {
    api.get.mockResolvedValue(mockAnalyticsData);

    render(<JobStatistics onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText("Deadline Adherence")).toBeInTheDocument();
    });

    expect(screen.getByText("15")).toBeInTheDocument(); // Total
    expect(screen.getByText("12")).toBeInTheDocument(); // Met
    expect(screen.getByText("80%")).toBeInTheDocument(); // Adherence rate
  });

  it("displays time to offer analytics", async () => {
    api.get.mockResolvedValue(mockAnalyticsData);

    render(<JobStatistics onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText("Time to Offer Analytics")).toBeInTheDocument();
    });

    expect(screen.getByText("45.5")).toBeInTheDocument();
    expect(screen.getByText(/based on 2 offer/i)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    api.get.mockResolvedValue(mockAnalyticsData);

    render(<JobStatistics onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText("Job Search Analytics")).toBeInTheDocument();
    });

    const closeButtons = screen.getAllByText("Close");
    fireEvent.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("exports data to CSV when export button is clicked", async () => {
    api.get.mockResolvedValue(mockAnalyticsData);

    // Mock document methods
    const mockCreateElement = vi.fn().mockReturnValue({
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    });
    const mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    
    global.document.createElement = mockCreateElement;
    global.document.body.appendChild = vi.fn();
    global.document.body.removeChild = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;

    render(<JobStatistics onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText("Job Search Analytics")).toBeInTheDocument();
    });

    const exportButton = screen.getByText(/export to csv/i);
    fireEvent.click(exportButton);

    expect(mockCreateElement).toHaveBeenCalledWith("a");
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it("displays error message when fetch fails", async () => {
    api.get.mockRejectedValue({
      response: { data: { message: "Failed to load analytics" } },
    });

    render(<JobStatistics onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/error loading analytics/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Failed to load analytics")).toBeInTheDocument();
  });

  it("allows retry after error", async () => {
    api.get.mockRejectedValueOnce({
      response: { data: { message: "Network error" } },
    });

    render(<JobStatistics onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/error loading analytics/i)).toBeInTheDocument();
    });

    // Mock successful retry
    api.get.mockResolvedValue(mockAnalyticsData);

    const retryButton = screen.getByText("Retry");
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("Job Search Analytics")).toBeInTheDocument();
    });
  });

  it("displays insights and recommendations", async () => {
    api.get.mockResolvedValue(mockAnalyticsData);

    render(<JobStatistics onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/insights & recommendations/i)).toBeInTheDocument();
    });
  });

  it("shows appropriate message when no offers received", async () => {
    const noOffersData = {
      data: {
        ...mockAnalyticsData.data,
        data: {
          ...mockAnalyticsData.data.data,
          timeToOffer: {
            average: 0,
            count: 0,
          },
        },
      },
    };

    api.get.mockResolvedValue(noOffersData);

    render(<JobStatistics onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/no offers received yet/i)).toBeInTheDocument();
    });
  });

  it("calls API with correct endpoint", async () => {
    api.get.mockResolvedValue(mockAnalyticsData);

    render(<JobStatistics onClose={mockOnClose} />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/jobs/analytics");
    });
  });
});
