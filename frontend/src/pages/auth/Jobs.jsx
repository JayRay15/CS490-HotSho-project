import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import api, { setAuthToken } from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import Container from "../../components/Container";
import Card from "../../components/Card";
import JobPipeline from "../../components/JobPipeline";
import DeadlineCalendar from "../../components/DeadlineCalendar";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import ArchiveModal from "../../components/ArchiveModal";
import AutoArchiveModal from "../../components/AutoArchiveModal";
import JobStatistics from "../../components/JobStatistics";
import InterviewInsights from "../../components/InterviewInsights";
import InterviewScheduler from "../../components/InterviewScheduler";
import InterviewCard from "../../components/InterviewCard";
import CompanyInfoCard from "../../components/CompanyInfoCard";
import CompanyNewsSection from "../../components/CompanyNewsSection";
import CompanyResearchReport from "../../components/CompanyResearchReport";
import JobMatchScore from "../../components/JobMatchScore";
import JobMatchComparison from "../../components/JobMatchComparison";
import ApplicationPackageGenerator from "../../components/ApplicationPackageGenerator";
import ApplicationAutomation from "../../components/ApplicationAutomation";
import StatusUpdateModal from "../../components/StatusUpdateModal";
import StatusTimeline from "../../components/StatusTimeline";
import EmailStatusDetector from "../../components/EmailStatusDetector";
import StatusStatistics from "../../components/StatusStatistics";
import BulkStatusUpdate from "../../components/BulkStatusUpdate";
import CoverLetterGeneratorModal from "../../components/CoverLetterGeneratorModal";
import * as interviewsAPI from "../../api/interviews";
import * as statusAPI from "../../api/applicationStatus";

const PIPELINE_STAGES = ["Interested", "Applied", "Phone Screen", "Interview", "Offer", "Rejected"];

export default function Jobs() {
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedJobs, setSelectedJobs] = useState([]);

  // Advanced filters
  const [filters, setFilters] = useState({
    location: "",
    salaryMin: "",
    salaryMax: "",
    jobType: "",
    industry: "",
    workMode: "",
    priority: "",
    tags: "",
    applicationDateFrom: "",
    applicationDateTo: "",
    deadlineFrom: "",
    deadlineTo: "",
  });
  const [sortBy, setSortBy] = useState("dateAdded");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [importMessage, setImportMessage] = useState("");

  // Archive-related state
  const [showArchived, setShowArchived] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showAutoArchiveModal, setShowAutoArchiveModal] = useState(false);
  const [archivingJob, setArchivingJob] = useState(null);
  const [archiveNotification, setArchiveNotification] = useState(null);

  // Statistics modal state
  const [showStatistics, setShowStatistics] = useState(false);

  // UC-68: Interview Insights state
  const [showInterviewInsights, setShowInterviewInsights] = useState(false);
  const [insightsJob, setInsightsJob] = useState(null);

  // UC-071: Interview Scheduling state
  const [showInterviewScheduler, setShowInterviewScheduler] = useState(false);
  const [selectedJobForInterview, setSelectedJobForInterview] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [editingInterview, setEditingInterview] = useState(null);

  // UC-063: Job Matching state
  const [showMatchScore, setShowMatchScore] = useState(false);
  const [matchJobId, setMatchJobId] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  // Application Automation state
  const [showPackageGenerator, setShowPackageGenerator] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
  const [selectedJobForPackage, setSelectedJobForPackage] = useState(null);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);

  // Application Status Tracking state
  const [applicationStatuses, setApplicationStatuses] = useState({});
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showEmailDetector, setShowEmailDetector] = useState(false);
  const [showStatusStats, setShowStatusStats] = useState(false);
  const [showBulkStatusUpdate, setShowBulkStatusUpdate] = useState(false);
  const [selectedJobForStatus, setSelectedJobForStatus] = useState(null);

  // Cover Letter Generator state
  const [showCoverLetterGenerator, setShowCoverLetterGenerator] = useState(false);
  const [selectedJobForCoverLetter, setSelectedJobForCoverLetter] = useState(null);

  // Form state for adding/editing jobs
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    status: "Interested",
    location: "",
    salaryMin: "",
    salaryMax: "",
    jobType: "",
    industry: "",
    workMode: "",
    description: "",
    url: "",
    notes: "",
    priority: "Medium",
    tags: "",
    applicationDate: "",
    deadline: "",
    contacts: [],
    interviewNotes: "",
    salaryNegotiationNotes: "",
    // UC-062: Company information
    companyInfo: {
      size: "",
      website: "",
      description: "",
      mission: "",
      logo: "",
      contactInfo: {
        email: "",
        phone: "",
        address: "",
      },
      glassdoorRating: {
        rating: "",
        reviewCount: "",
        url: "",
      },
      recentNews: [],
    },
  });

  // Load jobs on mount
  useEffect(() => {
    fetchJobs();
    fetchStats();
    fetchUpcomingInterviews();
    loadApplicationStatuses();
  }, []);

  // Load application statuses
  const loadApplicationStatuses = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const statuses = await statusAPI.getAllApplicationStatuses();
      
      // Convert array to object map by jobId for easy lookup
      const statusMap = {};
      statuses.forEach(status => {
        statusMap[status.jobId] = status;
      });
      setApplicationStatuses(statusMap);
    } catch (error) {
      console.error('Failed to load application statuses:', error);
    }
  };

  // Filter jobs when search or filter changes
  useEffect(() => {
    let filtered = [...jobs];

    console.log('🔍 Total jobs:', jobs.length);
    console.log('📦 Archived jobs in data:', jobs.filter(j => j.archived).length);
    console.log('🎯 Show archived?', showArchived);

    // Apply archived filter
    filtered = filtered.filter((job) => job.archived === showArchived);

    console.log('✅ After archive filter:', filtered.length);

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((job) => job.status === filterStatus);
    }

    // Apply search (search in title, company, location, description, requirements, notes)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) => {
          const requirementsText = Array.isArray(job.requirements)
            ? job.requirements.join(' ').toLowerCase()
            : (job.requirements || '').toLowerCase();

          return (
            job.title.toLowerCase().includes(search) ||
            job.company.toLowerCase().includes(search) ||
            job.location?.toLowerCase().includes(search) ||
            job.description?.toLowerCase().includes(search) ||
            requirementsText.includes(search) ||
            job.notes?.toLowerCase().includes(search) ||
            job.interviewNotes?.toLowerCase().includes(search) ||
            job.salaryNegotiationNotes?.toLowerCase().includes(search)
          );
        }
      );
    }

    // Apply location filter
    if (filters.location) {
      const locationSearch = filters.location.toLowerCase();
      filtered = filtered.filter((job) =>
        job.location?.toLowerCase().includes(locationSearch)
      );
    }

    // Apply salary range filter
    if (filters.salaryMin) {
      const minSalary = parseFloat(filters.salaryMin);
      filtered = filtered.filter((job) => {
        const jobSalary = job.salary?.min || 0;
        return jobSalary >= minSalary;
      });
    }
    if (filters.salaryMax) {
      const maxSalary = parseFloat(filters.salaryMax);
      filtered = filtered.filter((job) => {
        const jobSalary = job.salary?.max || job.salary?.min || 0;
        return jobSalary <= maxSalary;
      });
    }

    // Apply job type filter
    if (filters.jobType) {
      filtered = filtered.filter((job) => job.jobType === filters.jobType);
    }

    // Apply industry filter
    if (filters.industry) {
      filtered = filtered.filter((job) => job.industry === filters.industry);
    }

    // Apply work mode filter
    if (filters.workMode) {
      filtered = filtered.filter((job) => job.workMode === filters.workMode);
    }

    // Apply priority filter
    if (filters.priority) {
      filtered = filtered.filter((job) => job.priority === filters.priority);
    }

    // Apply tags filter
    if (filters.tags) {
      const searchTags = filters.tags.toLowerCase().split(",").map(t => t.trim());
      filtered = filtered.filter((job) => {
        if (!job.tags || job.tags.length === 0) return false;
        const jobTags = job.tags.map(t => t.toLowerCase());
        return searchTags.some(tag => jobTags.some(jt => jt.includes(tag)));
      });
    }

    // Apply application date range filter
    if (filters.applicationDateFrom) {
      const fromDate = new Date(filters.applicationDateFrom);
      filtered = filtered.filter((job) => {
        if (!job.applicationDate) return false;
        const appDate = new Date(job.applicationDate);
        return appDate >= fromDate;
      });
    }
    if (filters.applicationDateTo) {
      const toDate = new Date(filters.applicationDateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter((job) => {
        if (!job.applicationDate) return false;
        const appDate = new Date(job.applicationDate);
        return appDate <= toDate;
      });
    }

    // Apply deadline range filter
    if (filters.deadlineFrom) {
      const fromDate = new Date(filters.deadlineFrom);
      filtered = filtered.filter((job) => {
        if (!job.deadline) return false;
        const deadlineDate = new Date(job.deadline);
        return deadlineDate >= fromDate;
      });
    }
    if (filters.deadlineTo) {
      const toDate = new Date(filters.deadlineTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((job) => {
        if (!job.deadline) return false;
        const deadlineDate = new Date(job.deadline);
        return deadlineDate <= toDate;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "dateAdded":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "deadline":
          aValue = a.deadline ? new Date(a.deadline) : new Date(8640000000000000); // Far future if no deadline
          bValue = b.deadline ? new Date(b.deadline) : new Date(8640000000000000);
          break;
        case "salary":
          aValue = a.salary?.max || a.salary?.min || 0;
          bValue = b.salary?.max || b.salary?.min || 0;
          break;
        case "company":
          aValue = a.company.toLowerCase();
          bValue = b.company.toLowerCase();
          break;
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, filterStatus, filters, sortBy, sortOrder, showArchived]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);
      // Fetch ALL jobs (both active and archived) - filtering happens on frontend
      const [activeResponse, archivedResponse] = await Promise.all([
        api.get("/api/jobs?archived=false"),
        api.get("/api/jobs?archived=true")
      ]);
      const allJobs = [
        ...activeResponse.data.data.jobs,
        ...archivedResponse.data.data.jobs
      ];
      setJobs(allJobs);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      alert("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await api.get("/api/jobs/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchUpcomingInterviews = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await interviewsAPI.getInterviews({ limit: 20 });

      // Backend returns: { success: true, data: { interviews: [...], count: X } }
      const interviewData = response.data?.data?.interviews || [];

      // Filter out cancelled and completed interviews from the upcoming list
      const activeInterviews = interviewData.filter(
        i => i.status !== "Cancelled" && i.status !== "Completed"
      );

      setInterviews(activeInterviews);
    } catch (error) {
      console.error("Failed to fetch interviews:", error);
      setInterviews([]);
    }
  };

  const handleImportFromURL = async () => {
    if (!formData.url || !formData.url.trim()) {
      setImportStatus('failed');
      setImportMessage('Please enter a URL first');
      return;
    }

    setIsImporting(true);
    setImportStatus(null);
    setImportMessage('');

    try {
      const token = await getToken();
      setAuthToken(token);

      const response = await api.post('/api/jobs/scrape', { url: formData.url.trim() });
      const jobData = response.data.data.jobData;

      // Populate form with scraped data
      if (jobData.title) setFormData(prev => ({ ...prev, title: jobData.title }));
      if (jobData.company) setFormData(prev => ({ ...prev, company: jobData.company }));
      if (jobData.location) setFormData(prev => ({ ...prev, location: jobData.location }));
      if (jobData.description) setFormData(prev => ({ ...prev, description: jobData.description }));
      if (jobData.jobType) setFormData(prev => ({ ...prev, jobType: jobData.jobType }));
      if (jobData.workMode) setFormData(prev => ({ ...prev, workMode: jobData.workMode }));
      if (jobData.salary) {
        const { min, max } = jobData.salary || {};
        setFormData(prev => ({
          ...prev,
          salaryMin: min ? String(min) : prev.salaryMin,
          salaryMax: max ? String(max) : prev.salaryMax,
        }));
      }

      // Set status based on import result
      setImportStatus(jobData.importStatus || 'partial');
      // If backend provided field-level confidences, append a compact summary for transparency
      const info = jobData.extractionInfo || {};
      const summaryParts = [];
      ['title', 'company', 'location', 'jobType', 'workMode', 'salary'].forEach(k => {
        const m = info[k];
        if (m && typeof m.confidence === 'number') summaryParts.push(`${k}: ${(m.confidence * 100).toFixed(0)}%`);
      });
      const summary = summaryParts.length ? `\nFields: ${summaryParts.join(', ')}` : '';
      setImportMessage((jobData.importNotes || 'Job details imported. Please review and complete.') + summary);

      // Clear status message after 10 seconds
      setTimeout(() => {
        setImportStatus(null);
        setImportMessage('');
      }, 10000);
    } catch (error) {
      console.error('Failed to import job:', error);
      setImportStatus('failed');
      setImportMessage(error.response?.data?.message || 'Failed to import job details. Please enter manually.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddJob = async (e) => {
    e.preventDefault();

    try {
      const token = await getToken();
      setAuthToken(token);

      const jobData = {
        title: formData.title,
        company: formData.company,
        status: formData.status,
        location: formData.location || undefined,
        salary:
          formData.salaryMin || formData.salaryMax
            ? {
              min: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
              max: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
              currency: "USD",
            }
            : undefined,
        jobType: formData.jobType || undefined,
        industry: formData.industry || undefined,
        workMode: formData.workMode || undefined,
        description: formData.description || undefined,
        url: formData.url || undefined,
        notes: formData.notes || undefined,
        priority: formData.priority,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : undefined,
        applicationDate: formData.applicationDate || undefined,
        deadline: formData.deadline || undefined,
        // UC-062: Company information
        companyInfo: {
          size: formData.companyInfo?.size || undefined,
          website: formData.companyInfo?.website || undefined,
          description: formData.companyInfo?.description || undefined,
          mission: formData.companyInfo?.mission || undefined,
          logo: formData.companyInfo?.logo || undefined,
          contactInfo: {
            email: formData.companyInfo?.contactInfo?.email || undefined,
            phone: formData.companyInfo?.contactInfo?.phone || undefined,
            address: formData.companyInfo?.contactInfo?.address || undefined,
          },
          glassdoorRating: {
            rating: formData.companyInfo?.glassdoorRating?.rating ? parseFloat(formData.companyInfo.glassdoorRating.rating) : undefined,
            reviewCount: formData.companyInfo?.glassdoorRating?.reviewCount ? parseInt(formData.companyInfo.glassdoorRating.reviewCount) : undefined,
            url: formData.companyInfo?.glassdoorRating?.url || undefined,
          },
          recentNews: formData.companyInfo?.recentNews || [],
        },
      };

      await api.post("/api/jobs", jobData);
      await fetchJobs();
      await fetchStats();
      setShowAddModal(false);
      resetForm();
      setImportStatus(null);
      setImportMessage('');

      // Show success message
      setSuccessMessage("Job successfully added!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Failed to add job:", error);
      alert(error.response?.data?.message || "Failed to add job. Please try again.");
    }
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();

    try {
      const token = await getToken();
      setAuthToken(token);

      const jobData = {
        title: formData.title,
        company: formData.company,
        location: formData.location || undefined,
        salary:
          formData.salaryMin || formData.salaryMax
            ? {
              min: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
              max: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
              currency: "USD",
            }
            : undefined,
        jobType: formData.jobType || undefined,
        industry: formData.industry || undefined,
        workMode: formData.workMode || undefined,
        description: formData.description || undefined,
        url: formData.url || undefined,
        notes: formData.notes || undefined,
        interviewNotes: formData.interviewNotes || undefined,
        salaryNegotiationNotes: formData.salaryNegotiationNotes || undefined,
        priority: formData.priority,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : undefined,
        applicationDate: formData.applicationDate || undefined,
        deadline: formData.deadline || undefined,
        // UC-062: Company information
        companyInfo: {
          size: formData.companyInfo?.size || undefined,
          website: formData.companyInfo?.website || undefined,
          description: formData.companyInfo?.description || undefined,
          mission: formData.companyInfo?.mission || undefined,
          logo: formData.companyInfo?.logo || undefined,
          contactInfo: {
            email: formData.companyInfo?.contactInfo?.email || undefined,
            phone: formData.companyInfo?.contactInfo?.phone || undefined,
            address: formData.companyInfo?.contactInfo?.address || undefined,
          },
          glassdoorRating: {
            rating: formData.companyInfo?.glassdoorRating?.rating ? parseFloat(formData.companyInfo.glassdoorRating.rating) : undefined,
            reviewCount: formData.companyInfo?.glassdoorRating?.reviewCount ? parseInt(formData.companyInfo.glassdoorRating.reviewCount) : undefined,
            url: formData.companyInfo?.glassdoorRating?.url || undefined,
          },
          recentNews: formData.companyInfo?.recentNews || [],
        },
      };

      console.log("UPDATE JOB - Frontend formData:", formData);
      console.log("UPDATE JOB - Frontend jobData being sent:", jobData);
      console.log("UPDATE JOB - Industry value:", formData.industry, "->", jobData.industry);

      await api.put(`/api/jobs/${editingJob._id}`, jobData);
      await fetchJobs();
      setShowEditModal(false);
      setEditingJob(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update job:", error);
      alert(error.response?.data?.message || "Failed to update job. Please try again.");
    }
  };

  const handleJobStatusChange = async (jobId, newStatus, options = {}) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      if (options.extendDeadlineDays) {
        const job = jobs.find(j => j._id === jobId);
        const base = job?.deadline ? new Date(job.deadline) : new Date();
        const newDate = new Date(base);
        newDate.setDate(newDate.getDate() + options.extendDeadlineDays);
        await api.put(`/api/jobs/${jobId}`, { deadline: newDate.toISOString() });
      } else if (newStatus !== undefined) {
        await api.put(`/api/jobs/${jobId}/status`, { status: newStatus });
      }
      await fetchJobs();
      await fetchStats();
    } catch (error) {
      console.error("Failed to update job status:", error);
      alert("Failed to update job. Please try again.");
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await api.delete(`/api/jobs/${jobId}`);
      await fetchJobs();
      await fetchStats();
    } catch (error) {
      console.error("Failed to delete job:", error);
      alert("Failed to delete job. Please try again.");
    }
  };

  const handleEditJob = (job) => {
    console.log("EDIT JOB - Opening edit modal for job:", job);
    console.log("EDIT JOB - Job industry:", job.industry);
    setEditingJob(job);
    setFormData({
      title: job.title,
      company: job.company,
      status: job.status,
      location: job.location || "",
      salaryMin: job.salary?.min || "",
      salaryMax: job.salary?.max || "",
      jobType: job.jobType || "",
      industry: job.industry || "",
      workMode: job.workMode || "",
      description: job.description || "",
      url: job.url || "",
      notes: job.notes || "",
      priority: job.priority || "Medium",
      tags: job.tags?.join(", ") || "",
      applicationDate: job.applicationDate ? job.applicationDate.split("T")[0] : "",
      deadline: job.deadline ? job.deadline.split("T")[0] : "",
      interviewNotes: job.interviewNotes || "",
      salaryNegotiationNotes: job.salaryNegotiationNotes || "",
      // UC-062: Company information
      companyInfo: {
        size: job.companyInfo?.size || "",
        website: job.companyInfo?.website || "",
        description: job.companyInfo?.description || "",
        mission: job.companyInfo?.mission || "",
        logo: job.companyInfo?.logo || "",
        contactInfo: {
          email: job.companyInfo?.contactInfo?.email || "",
          phone: job.companyInfo?.contactInfo?.phone || "",
          address: job.companyInfo?.contactInfo?.address || "",
        },
        glassdoorRating: {
          rating: job.companyInfo?.glassdoorRating?.rating || "",
          reviewCount: job.companyInfo?.glassdoorRating?.reviewCount || "",
          url: job.companyInfo?.glassdoorRating?.url || "",
        },
        recentNews: job.companyInfo?.recentNews || [],
      },
    });
    console.log("EDIT JOB - Form data set with industry:", job.industry || "");
    setShowEditModal(true);
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedJobs.length === 0) {
      alert("Please select jobs to update");
      return;
    }

    if (!window.confirm(`Update ${selectedJobs.length} job(s) to "${newStatus}"?`)) {
      return;
    }

    try {
      const token = await getToken();
      setAuthToken(token);
      await api.post("/api/jobs/bulk-update-status", {
        jobIds: selectedJobs,
        status: newStatus,
      });
      await fetchJobs();
      await fetchStats();
      setSelectedJobs([]);
    } catch (error) {
      console.error("Failed to bulk update jobs:", error);
      alert("Failed to update jobs. Please try again.");
    }
  };

  const handleBulkDeadlineShift = async (days) => {
    if (selectedJobs.length === 0) {
      alert("Please select jobs to update");
      return;
    }
    if (!window.confirm(`Shift deadlines by ${days} day(s) for ${selectedJobs.length} job(s)?`)) return;
    try {
      const token = await getToken();
      setAuthToken(token);
      await api.post("/api/jobs/bulk-update-deadline", {
        jobIds: selectedJobs,
        shiftDays: days,
      });
      await fetchJobs();
      setSelectedJobs([]);
    } catch (error) {
      console.error("Failed to shift deadlines:", error);
      alert("Failed to update deadlines.");
    }
  };

  // Toggle selection for a single job ID
  const toggleSelectJob = (id) => {
    setSelectedJobs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkDeadlineSet = async (dateStr) => {
    if (selectedJobs.length === 0) {
      alert("Please select jobs to update");
      return;
    }
    if (!window.confirm(`Set deadline to ${dateStr} for ${selectedJobs.length} job(s)?`)) return;
    try {
      const token = await getToken();
      setAuthToken(token);
      await api.post("/api/jobs/bulk-update-deadline", {
        jobIds: selectedJobs,
        setDate: new Date(dateStr).toISOString(),
      });
      await fetchJobs();
      setSelectedJobs([]);
    } catch (error) {
      console.error("Failed to set deadlines:", error);
      alert("Failed to update deadlines.");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      company: "",
      status: "Interested",
      location: "",
      salaryMin: "",
      salaryMax: "",
      jobType: "",
      industry: "",
      workMode: "",
      description: "",
      url: "",
      notes: "",
      priority: "Medium",
      tags: "",
      applicationDate: "",
      deadline: "",
      contacts: [],
      interviewNotes: "",
      salaryNegotiationNotes: "",
      // UC-062: Company information
      companyInfo: {
        size: "",
        website: "",
        description: "",
        mission: "",
        logo: "",
        contactInfo: {
          email: "",
          phone: "",
          address: "",
        },
        glassdoorRating: {
          rating: "",
          reviewCount: "",
          url: "",
        },
        recentNews: [],
      },
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilters({
      location: "",
      salaryMin: "",
      salaryMax: "",
      jobType: "",
      industry: "",
      workMode: "",
      priority: "",
      tags: "",
      applicationDateFrom: "",
      applicationDateTo: "",
      deadlineFrom: "",
      deadlineTo: "",
    });
    setSortBy("dateAdded");
    setSortOrder("desc");
    localStorage.removeItem("jobSearchPreferences");
  };

  const saveSearchPreferences = () => {
    const preferences = {
      searchTerm,
      filterStatus,
      filters,
      sortBy,
      sortOrder,
    };
    localStorage.setItem("jobSearchPreferences", JSON.stringify(preferences));
    alert("Search preferences saved!");
  };

  const loadSearchPreferences = () => {
    const saved = localStorage.getItem("jobSearchPreferences");
    if (saved) {
      const preferences = JSON.parse(saved);
      setSearchTerm(preferences.searchTerm || "");
      setFilterStatus(preferences.filterStatus || "all");
      setFilters(preferences.filters || {
        location: "",
        salaryMin: "",
        salaryMax: "",
        jobType: "",
        workMode: "",
        priority: "",
        tags: "",
        applicationDateFrom: "",
        applicationDateTo: "",
        deadlineFrom: "",
        deadlineTo: "",
      });
      setSortBy(preferences.sortBy || "dateAdded");
      setSortOrder(preferences.sortOrder || "desc");
    }
  };

  const hasActiveFilters = () => {
    return searchTerm !== "" ||
      filterStatus !== "all" ||
      Object.values(filters).some(v => v !== "") ||
      sortBy !== "dateAdded" ||
      sortOrder !== "desc";
  };

  const handleViewJob = (job) => {
    setViewingJob(job);
    setShowDetailModal(true);
  };

  // Job selection handlers for bulk operations
  // Note: selectedJobs stores job IDs (strings), not full job objects
  const getSelectedJobObjects = () => {
    return jobs.filter(job => selectedJobs.includes(job._id));
  };

  // Archive handlers
  const handleArchiveJob = (job) => {
    setArchivingJob(job);
    setShowArchiveModal(true);
  };

  const handleArchiveConfirm = async (reason, notes) => {
    try {
      const token = await getToken();
      setAuthToken(token);

      if (archivingJob) {
        // Single job archive
        await api.post(`/api/jobs/${archivingJob._id}/archive`, { reason, notes });
        setArchiveNotification({
          message: `"${archivingJob.title}" archived successfully`,
          jobId: archivingJob._id,
          type: 'single'
        });
      } else if (selectedJobs.length > 0) {
        // Bulk archive
        await api.post('/api/jobs/bulk-archive', {
          jobIds: selectedJobs,
          reason,
          notes
        });
        setArchiveNotification({
          message: `${selectedJobs.length} job(s) archived successfully`,
          jobIds: [...selectedJobs],
          type: 'bulk'
        });
        setSelectedJobs([]);
      }

      await fetchJobs();
      await fetchStats();
      setArchivingJob(null);

      // Clear notification after 10 seconds
      setTimeout(() => setArchiveNotification(null), 10000);
    } catch (error) {
      console.error("Failed to archive job:", error);
      alert(error.response?.data?.message || "Failed to archive job. Please try again.");
    }
  };

  const handleBulkArchive = () => {
    if (selectedJobs.length === 0) {
      alert("Please select jobs to archive");
      return;
    }
    setArchivingJob(null);
    setShowArchiveModal(true);
  };

  const handleRestoreJob = async (jobId) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await api.post(`/api/jobs/${jobId}/restore`);
      await fetchJobs();
      await fetchStats();
      setSuccessMessage("Job restored successfully!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Failed to restore job:", error);
      alert(error.response?.data?.message || "Failed to restore job. Please try again.");
    }
  };

  const handleBulkRestore = async () => {
    if (selectedJobs.length === 0) {
      alert("Please select jobs to restore");
      return;
    }

    if (!window.confirm(`Restore ${selectedJobs.length} job(s)?`)) {
      return;
    }

    try {
      const token = await getToken();
      setAuthToken(token);
      await api.post('/api/jobs/bulk-restore', { jobIds: selectedJobs });
      await fetchJobs();
      await fetchStats();
      setSelectedJobs([]);
      setSuccessMessage(`${selectedJobs.length} job(s) restored successfully!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Failed to restore jobs:", error);
      alert(error.response?.data?.message || "Failed to restore jobs. Please try again.");
    }
  };

  const handleUndoArchive = async () => {
    if (!archiveNotification) return;

    try {
      const token = await getToken();
      setAuthToken(token);

      if (archiveNotification.type === 'single') {
        await api.post(`/api/jobs/${archiveNotification.jobId}/restore`);
      } else if (archiveNotification.type === 'bulk') {
        await api.post('/api/jobs/bulk-restore', { jobIds: archiveNotification.jobIds });
      }

      await fetchJobs();
      await fetchStats();
      setArchiveNotification(null);
      setSuccessMessage("Archive undone successfully!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Failed to undo archive:", error);
      alert("Failed to undo archive. Please try again.");
    }
  };

  // UC-071: Interview Scheduling Handlers
  const handleScheduleInterview = (job) => {
    // Only allow scheduling interviews for jobs in Interview or Phone Screen stages
    const allowedStages = ['Interview', 'Phone Screen'];
    if (!allowedStages.includes(job.status)) {
      alert(`You can only schedule interviews for jobs in "Interview" or "Phone Screen" stages. This job is currently in "${job.status}" stage.`);
      return;
    }

    setSelectedJobForInterview(job);
    setEditingInterview(null);
    setShowInterviewScheduler(true);
  };

  const handleInterviewSaved = async () => {
    await fetchUpcomingInterviews();
    setShowInterviewScheduler(false);
    setSelectedJobForInterview(null);
    setEditingInterview(null);
    setSuccessMessage("Interview scheduled successfully!");
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleInterviewUpdated = async () => {
    await fetchUpcomingInterviews();
    setSuccessMessage("Interview updated successfully!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleInterviewDeleted = async () => {
    await fetchUpcomingInterviews();
    setSuccessMessage("Interview cancelled successfully!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleInterviewView = (interview) => {
    // interview.jobId might be populated with job object or just ID
    const jobIdString = typeof interview.jobId === 'object'
      ? interview.jobId._id
      : interview.jobId;
    const job = jobs.find(j => j._id === jobIdString);

    setEditingInterview(interview);
    setSelectedJobForInterview(job);
    setShowInterviewScheduler(true);
  };

  const handleAutoArchive = async (daysInactive, statuses) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await api.post('/api/jobs/auto-archive', {
        daysInactive,
        statuses
      });

      const count = response.data.data.count;
      await fetchJobs();
      await fetchStats();

      if (count > 0) {
        setSuccessMessage(`${count} job(s) auto-archived successfully!`);
      } else {
        setSuccessMessage("No jobs matched the auto-archive criteria.");
      }
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Failed to auto-archive jobs:", error);
      alert(error.response?.data?.message || "Failed to auto-archive jobs. Please try again.");
    }
  };

  // UC-063: Job Matching Handlers
  const handleViewMatchScore = (job) => {
    setMatchJobId(job._id);
    setShowMatchScore(true);
  };

  // Cover Letter Generator Handler
  const handleGenerateCoverLetter = (job) => {
    setSelectedJobForCoverLetter(job);
    setShowCoverLetterGenerator(true);
  };

  const handleCoverLetterSuccess = () => {
    setSuccessMessage('Cover letter generated and saved successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteJobWithConfirm = async (jobId, jobTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${jobTitle}"?\n\nThis action cannot be undone. Consider archiving instead.`
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "This is your final warning. The job will be permanently deleted. Continue?"
    );

    if (!doubleConfirm) return;

    await handleDeleteJob(jobId);
  };

  // Status Tracking Handlers
  const handleOpenStatusModal = (job) => {
    setSelectedJobForStatus(job);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async (updateData) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      
      // Update the job's actual status in the pipeline using the dedicated status endpoint
      await api.put(`/api/jobs/${selectedJobForStatus._id}/status`, {
        status: updateData.status,
        notes: updateData.notes,
        nextAction: updateData.nextAction,
        nextActionDate: updateData.nextActionDate
      });
      
      // Also update priority and tags if they were changed
      if (updateData.priority || updateData.tags) {
        await api.put(`/api/jobs/${selectedJobForStatus._id}`, {
          priority: updateData.priority,
          tags: updateData.tags
        });
      }
      
      // Refresh the jobs list
      await fetchJobs();
      
      setShowStatusModal(false);
      setSelectedJobForStatus(null);
      setSuccessMessage(`Job moved to ${updateData.status} stage!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  };

  const handleOpenTimeline = (job) => {
    setSelectedJobForStatus(job);
    setShowTimelineModal(true);
  };

  const handleOpenEmailDetector = (job) => {
    setSelectedJobForStatus(job);
    setShowEmailDetector(true);
  };

  const handleDetectionConfirmed = async () => {
    await fetchJobs(); // Refresh jobs to show updated status in pipeline
    setSuccessMessage('Status updated from email detection!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleBulkApplicationStatusUpdate = async (newStatus) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      
      // Update each job's status in the pipeline
      await api.post("/api/jobs/bulk-update-status", {
        jobIds: selectedJobs,
        status: newStatus,
      });
      
      // Refresh jobs and clear selection
      await fetchJobs();
      await loadApplicationStatuses();
      
      setBulkSelectionMode(false);
      setSelectedJobs([]);
      setSuccessMessage(`${selectedJobs.length} job(s) moved to ${newStatus} stage!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to bulk update:', error);
      throw error;
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen={true} size="lg" text="Loading jobs..." />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E4E6E0" }}>
      <Container level={1} className="pt-12 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: "#4F5348" }}>
              Job Application Tracker
            </h1>
            <p className="text-sm" style={{ color: "#656A5C" }}>
              Track your job applications through each stage of the hiring process
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-4 text-green-700 hover:text-green-900 font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Archive Notification with Undo */}
          {archiveNotification && (
            <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                  <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{archiveNotification.message}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleUndoArchive}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                  Undo
                </button>
                <button
                  onClick={() => setArchiveNotification(null)}
                  className="ml-2 text-blue-700 hover:text-blue-900 font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              {PIPELINE_STAGES.map((stage) => (
                <Card key={stage} variant="elevated" className="text-center">
                  <p className="text-sm text-gray-600 mb-1">{stage}</p>
                  <p className="text-2xl font-bold" style={{ color: "#777C6D" }}>
                    {stats.byStatus[stage] || 0}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* Deadline Reminders */}
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const soon = jobs
              .filter(j => j.deadline)
              .map(j => ({
                job: j,
                days: Math.round((new Date(j.deadline).setHours(0, 0, 0, 0) - today) / (1000 * 60 * 60 * 24))
              }))
              .filter(x => x.days <= 3)
              .sort((a, b) => a.days - b.days)
              .slice(0, 5);
            return soon.length ? (
              <Card variant="info" className="mb-4" title="Upcoming Deadlines">
                <ul className="text-sm text-gray-800 space-y-1">
                  {soon.map(({ job, days }) => (
                    <li key={job._id}>
                      <button className={`font-medium ${days <= 0 ? 'text-red-700' : 'text-blue-700'} hover:underline`}
                        onClick={() => handleViewJob(job)}
                      >{job.title}</button> @ {job.company} — {days < 0 ? `Overdue ${Math.abs(days)}d` : days === 0 ? 'Due today' : `${days}d left`}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null;
          })()}

          {/* Controls */}
          <Card variant="primary" className="mb-6">
            {/* Search Bar - Full Width */}
            <div className="mb-4">
              <label className="block text-base font-medium text-gray-700 mb-2">Search Jobs</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, company, location, keywords..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  {PIPELINE_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dateAdded">Date Added</option>
                  <option value="deadline">Deadline</option>
                  <option value="salary">Salary</option>
                  <option value="company">Company</option>
                  <option value="title">Title</option>
                </select>
              </div>
              <div className="w-full md:w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">↓ Desc</option>
                  <option value="asc">↑ Asc</option>
                </select>
              </div>
              <div className="flex items-end gap-2 flex-wrap">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant={showFilters || hasActiveFilters() ? "primary" : "secondary"}
                >
                  {showFilters ? "Hide Filters" : "More Filters"}
                  {hasActiveFilters() && !showFilters && " ⚡"}
                </Button>
                <Button onClick={() => setShowCalendar(!showCalendar)} variant="secondary">
                  {showCalendar ? "Pipeline View" : "Calendar View"}
                </Button>
                <Button onClick={() => setShowStatistics(true)} variant="secondary">
                  Statistics
                </Button>
                <Button onClick={() => setShowStatusStats(true)} variant="secondary">
                  📊 Status Analytics
                </Button>
                <Button
                  onClick={() => {
                    setBulkSelectionMode(!bulkSelectionMode);
                    if (bulkSelectionMode) setSelectedJobs([]);
                  }}
                  variant={bulkSelectionMode ? "primary" : "secondary"}
                  className={bulkSelectionMode ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                >
                  {bulkSelectionMode ? `Bulk Mode (${selectedJobs.length})` : "Bulk Select"}
                </Button>
                {selectedJobs.length > 0 && (
                  <>
                    <Button
                      onClick={() => setShowAutomation(true)}
                      variant="primary"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      ⚡ Automate ({selectedJobs.length})
                    </Button>
                    <Button
                      onClick={() => setShowBulkStatusUpdate(true)}
                      variant="primary"
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      📝 Update Status ({selectedJobs.length})
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => setShowArchived(!showArchived)}
                  variant={showArchived ? "primary" : "secondary"}
                >
                  {showArchived ? "Show Active" : "Show Archived"}
                  {stats?.totalArchived > 0 && ` (${stats.totalArchived})`}
                </Button>
                {!showArchived && (
                  <>
                    <Button onClick={() => setShowAutoArchiveModal(true)} variant="secondary">
                      Auto-Archive
                    </Button>
                    <Button onClick={() => setShowComparison(true)} variant="secondary">
                      Compare Matches
                    </Button>
                  </>
                )}
                <Button onClick={() => setShowAddModal(true)} variant="primary">
                  Add Job
                </Button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Advanced Filters</h3>
                  <span className="text-xs text-gray-500">
                    Showing {filteredJobs.length} of {jobs.length} jobs
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Location Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g., New York, Remote"
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Job Type Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Job Type</label>
                    <select
                      value={filters.jobType}
                      onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>

                  {/* Industry Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
                    <select
                      value={filters.industry}
                      onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Industries</option>
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Education">Education</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Work Mode Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Work Mode</label>
                    <select
                      value={filters.workMode}
                      onChange={(e) => setFilters({ ...filters, workMode: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Modes</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Priorities</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  {/* Salary Min */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Min Salary ($)</label>
                    <input
                      type="number"
                      placeholder="e.g., 50000"
                      value={filters.salaryMin}
                      onChange={(e) => setFilters({ ...filters, salaryMin: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Salary Max */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Salary ($)</label>
                    <input
                      type="number"
                      placeholder="e.g., 150000"
                      value={filters.salaryMax}
                      onChange={(e) => setFilters({ ...filters, salaryMax: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Tags Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g., react, python"
                      value={filters.tags}
                      onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Application Date From */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Applied From</label>
                    <input
                      type="date"
                      value={filters.applicationDateFrom}
                      onChange={(e) => setFilters({ ...filters, applicationDateFrom: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Application Date To */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Applied To</label>
                    <input
                      type="date"
                      value={filters.applicationDateTo}
                      onChange={(e) => setFilters({ ...filters, applicationDateTo: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Deadline From */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Deadline From</label>
                    <input
                      type="date"
                      value={filters.deadlineFrom}
                      onChange={(e) => setFilters({ ...filters, deadlineFrom: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Deadline To */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Deadline To</label>
                    <input
                      type="date"
                      value={filters.deadlineTo}
                      onChange={(e) => setFilters({ ...filters, deadlineTo: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button onClick={clearFilters} variant="secondary" size="small">
                    🔄 Clear All Filters
                  </Button>
                  <Button onClick={saveSearchPreferences} variant="secondary" size="small">
                    💾 Save Preferences
                  </Button>
                  <Button onClick={loadSearchPreferences} variant="secondary" size="small">
                    📂 Load Saved
                  </Button>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedJobs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">{selectedJobs.length} job(s) selected</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {!showArchived ? (
                    <>
                      {PIPELINE_STAGES.map((stage) => (
                        <button
                          key={stage}
                          onClick={() => handleBulkStatusUpdate(stage)}
                          className="text-xs px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                        >
                          Move to {stage}
                        </button>
                      ))}
                      <button
                        onClick={handleBulkArchive}
                        className="text-xs px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium"
                      >
                        📦 Archive Selected
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleBulkRestore}
                      className="text-xs px-3 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700 font-medium"
                    >
                      ↩️ Restore Selected
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedJobs([])}
                    className="text-xs px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700"
                  >
                    Clear Selection
                  </button>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="text-xs font-semibold text-gray-700">Deadlines:</span>
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="number"
                      id="shiftDaysInput"
                      placeholder="Shift days (+/-)"
                      className="px-2 py-1 border rounded w-32"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById('shiftDaysInput');
                        const val = parseInt(el?.value || '0', 10);
                        if (!val) return alert('Enter days to shift (positive or negative)');
                        handleBulkDeadlineShift(val);
                      }}
                      className="px-3 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-700"
                    >
                      Shift
                    </button>
                    <input
                      type="date"
                      id="setDeadlineInput"
                      className="px-2 py-1 border rounded"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById('setDeadlineInput');
                        const val = el?.value;
                        if (!val) return alert('Pick a date');
                        handleBulkDeadlineSet(val);
                      }}
                      className="px-3 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700"
                    >
                      Set Date
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* UC-071: Upcoming Interviews Section */}
          {!showArchived && interviews.length > 0 && (
            <Card variant="primary" className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">📅 Upcoming Interviews</h2>
                <span className="text-sm text-gray-600">{interviews.length} scheduled</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {interviews.map((interview) => (
                  <InterviewCard
                    key={interview._id}
                    interview={interview}
                    onUpdate={handleInterviewUpdated}
                    onDelete={handleInterviewDeleted}
                    onEdit={(interview) => {
                      // interview.jobId might be populated with job object or just ID
                      const jobIdString = typeof interview.jobId === 'object'
                        ? interview.jobId._id
                        : interview.jobId;
                      const job = jobs.find(j => j._id === jobIdString);

                      setEditingInterview(interview);
                      setSelectedJobForInterview(job);
                      setShowInterviewScheduler(true);
                    }}
                    compact={true}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Pipeline or Calendar View */}
          {showCalendar ? (
            <DeadlineCalendar
              jobs={filteredJobs}
              interviews={interviews}
              onJobView={handleViewJob}
              onInterviewView={handleInterviewView}
            />
          ) : (
            <JobPipeline
              jobs={filteredJobs}
              onJobStatusChange={handleJobStatusChange}
              onJobEdit={handleEditJob}
              onJobDelete={showArchived ? handleDeleteJobWithConfirm : handleDeleteJob}
              onJobView={handleViewJob}
              selectedJobs={selectedJobs}
              onToggleSelect={toggleSelectJob}
              onJobArchive={handleArchiveJob}
              onJobRestore={handleRestoreJob}
              onScheduleInterview={handleScheduleInterview}
              onViewMatchScore={handleViewMatchScore}
              onOpenStatusModal={handleOpenStatusModal}
              onOpenTimeline={handleOpenTimeline}
              onOpenEmailDetector={handleOpenEmailDetector}
              applicationStatuses={applicationStatuses}
              onGenerateCoverLetter={handleGenerateCoverLetter}
              highlightTerms={[
                searchTerm?.trim(),
                filters.location?.trim(),
                ...(filters.tags ? filters.tags.split(",").map((t) => t.trim()) : []),
              ].filter(Boolean)}
            />
          )}
        </div>
      </Container>

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Add New Job</h2>
              <form onSubmit={handleAddJob} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Job Title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                  <InputField
                    label="Company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PIPELINE_STAGES.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </div>
                  <InputField
                    label="Location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Min Salary"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                  />
                  <InputField
                    label="Max Salary"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                    <select
                      value={formData.jobType}
                      onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Temporary">Temporary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Education">Education</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
                    <select
                      value={formData.workMode}
                      onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Application Date"
                    type="date"
                    value={formData.applicationDate}
                    onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                  />
                  <InputField
                    label="Deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Job URL</label>
                    {formData.url && (
                      <button
                        type="button"
                        onClick={handleImportFromURL}
                        disabled={!formData.url || isImporting}
                        className="text-sm px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        {isImporting ? (
                          <>
                            <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Importing...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Import Details</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/jobs/view/..."
                  />
                  {importStatus && (
                    <div className={`mt-2 p-3 rounded-lg text-sm ${importStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                      importStatus === 'partial' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                        'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                      {importMessage}
                    </div>
                  )}
                </div>

                <InputField
                  label="Tags (comma-separated)"
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., JavaScript, Remote, Senior"
                />

                <InputField
                  label="Description"
                  as="textarea"
                  rows={4}
                  maxLength={2000}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the job responsibilities, requirements, and other details..."
                />

                <InputField
                  label="Notes"
                  as="textarea"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Personal notes about this opportunity..."
                />

                {/* UC-062: Company Information Section */}
                <details className="border rounded-lg p-4 bg-gray-50">
                  <summary className="cursor-pointer font-medium text-gray-900 hover:text-blue-600">
                    📋 Company Information
                  </summary>
                  <div className="mt-4 space-y-4">
                    {/* Auto-fill button */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Auto-fill company information</p>
                        <p className="text-xs text-blue-700">Automatically fetch company details, logo, and description</p>
                      </div>
                      <Button
                        type="button"
                        onClick={async (event) => {
                          if (!formData.company) {
                            alert('Please enter a company name first');
                            return;
                          }
                          try {
                            const token = await getToken();
                            setAuthToken(token);

                            // Show loading state
                            const btn = event.target;
                            btn.disabled = true;
                            btn.textContent = 'Fetching...';

                            const response = await api.get(`/api/companies/info?name=${encodeURIComponent(formData.company)}`);

                            if (response.data?.success && response.data?.data?.companyInfo) {
                              const info = response.data.data.companyInfo;
                              setFormData({
                                ...formData,
                                companyInfo: {
                                  ...formData.companyInfo,
                                  website: info.website || formData.companyInfo?.website || '',
                                  logo: info.logo || formData.companyInfo?.logo || '',
                                  description: info.description || formData.companyInfo?.description || '',
                                  mission: info.mission || formData.companyInfo?.mission || '',
                                  size: info.size || formData.companyInfo?.size || '',
                                  industry: info.industry || formData.companyInfo?.industry || '',
                                  location: info.location || formData.companyInfo?.location || '',
                                  contactInfo: {
                                    email: info.contactInfo?.email || formData.companyInfo?.contactInfo?.email || '',
                                    phone: info.contactInfo?.phone || formData.companyInfo?.contactInfo?.phone || '',
                                    address: info.contactInfo?.address || formData.companyInfo?.contactInfo?.address || ''
                                  },
                                  glassdoorRating: {
                                    rating: info.glassdoorRating?.rating ?? formData.companyInfo?.glassdoorRating?.rating ?? '',
                                    reviewCount: info.glassdoorRating?.reviewCount ?? formData.companyInfo?.glassdoorRating?.reviewCount ?? '',
                                    url: info.glassdoorRating?.url ?? formData.companyInfo?.glassdoorRating?.url ?? ''
                                  },
                                  recentNews: info.recentNews || formData.companyInfo?.recentNews || []
                                }
                              });
                              alert('Company information loaded successfully!');
                            } else {
                              alert('Could not find company information. You can add it manually below.');
                            }

                            btn.disabled = false;
                            btn.textContent = '🔄 Auto-fill';
                          } catch (error) {
                            console.error('Error fetching company info:', error);
                            alert('Failed to fetch company information. You can add it manually below.');
                            event.target.disabled = false;
                            event.target.textContent = '🔄 Auto-fill';
                          }
                        }}
                        variant="primary"
                        className="text-sm whitespace-nowrap"
                      >
                        🔄 Auto-fill
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                        <select
                          value={formData.companyInfo?.size || ""}
                          onChange={(e) => setFormData({ ...formData, companyInfo: { ...formData.companyInfo, size: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select size...</option>
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-500">201-500 employees</option>
                          <option value="501-1000">501-1000 employees</option>
                          <option value="1001-5000">1001-5000 employees</option>
                          <option value="5001-10000">5001-10000 employees</option>
                          <option value="10000+">10000+ employees</option>
                        </select>
                      </div>
                      <InputField
                        label="Company Website"
                        type="url"
                        value={formData.companyInfo?.website || ""}
                        onChange={(e) => setFormData({ ...formData, companyInfo: { ...formData.companyInfo, website: e.target.value } })}
                        placeholder="https://company.com"
                      />
                    </div>

                    <InputField
                      label="Company Logo URL"
                      type="url"
                      value={formData.companyInfo?.logo || ""}
                      onChange={(e) => setFormData({ ...formData, companyInfo: { ...formData.companyInfo, logo: e.target.value } })}
                      placeholder="https://company.com/logo.png"
                    />

                    <InputField
                      label="Company Description"
                      as="textarea"
                      rows={3}
                      value={formData.companyInfo?.description || ""}
                      onChange={(e) => setFormData({ ...formData, companyInfo: { ...formData.companyInfo, description: e.target.value } })}
                      placeholder="Brief description of the company..."
                    />

                    <InputField
                      label="Mission Statement"
                      as="textarea"
                      rows={2}
                      value={formData.companyInfo?.mission || ""}
                      onChange={(e) => setFormData({ ...formData, companyInfo: { ...formData.companyInfo, mission: e.target.value } })}
                      placeholder="Company's mission statement..."
                    />

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                          label="Email"
                          type="email"
                          value={formData.companyInfo?.contactInfo?.email || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            companyInfo: {
                              ...formData.companyInfo,
                              contactInfo: { ...formData.companyInfo?.contactInfo, email: e.target.value }
                            }
                          })}
                          placeholder="contact@company.com"
                        />
                        <InputField
                          label="Phone"
                          type="tel"
                          value={formData.companyInfo?.contactInfo?.phone || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            companyInfo: {
                              ...formData.companyInfo,
                              contactInfo: { ...formData.companyInfo?.contactInfo, phone: e.target.value }
                            }
                          })}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <InputField
                        label="Address"
                        type="text"
                        value={formData.companyInfo?.contactInfo?.address || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          companyInfo: {
                            ...formData.companyInfo,
                            contactInfo: { ...formData.companyInfo?.contactInfo, address: e.target.value }
                          }
                        })}
                        placeholder="123 Main St, City, State 12345"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Glassdoor Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField
                          label="Rating (0-5)"
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={formData.companyInfo?.glassdoorRating?.rating || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            companyInfo: {
                              ...formData.companyInfo,
                              glassdoorRating: { ...formData.companyInfo?.glassdoorRating, rating: e.target.value }
                            }
                          })}
                          placeholder="4.2"
                        />
                        <InputField
                          label="Review Count"
                          type="number"
                          value={formData.companyInfo?.glassdoorRating?.reviewCount || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            companyInfo: {
                              ...formData.companyInfo,
                              glassdoorRating: { ...formData.companyInfo?.glassdoorRating, reviewCount: e.target.value }
                            }
                          })}
                          placeholder="150"
                        />
                        <InputField
                          label="Glassdoor URL"
                          type="url"
                          value={formData.companyInfo?.glassdoorRating?.url || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            companyInfo: {
                              ...formData.companyInfo,
                              glassdoorRating: { ...formData.companyInfo?.glassdoorRating, url: e.target.value }
                            }
                          })}
                          placeholder="https://glassdoor.com/..."
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Recent News & Updates</h4>
                        <Button
                          type="button"
                          onClick={() => {
                            const newNews = {
                              title: "",
                              summary: "",
                              url: "",
                              date: new Date().toISOString().split('T')[0]
                            };
                            setFormData({
                              ...formData,
                              companyInfo: {
                                ...formData.companyInfo,
                                recentNews: [...(formData.companyInfo?.recentNews || []), newNews]
                              }
                            });
                          }}
                          variant="secondary"
                          className="text-xs"
                        >
                          + Add News Item
                        </Button>
                      </div>

                      {formData.companyInfo?.recentNews && formData.companyInfo.recentNews.length > 0 ? (
                        <div className="space-y-3">
                          {formData.companyInfo.recentNews.map((news, idx) => (
                            <div key={idx} className="p-3 border rounded-lg bg-gray-50">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600">News Item {idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedNews = formData.companyInfo.recentNews.filter((_, i) => i !== idx);
                                    setFormData({
                                      ...formData,
                                      companyInfo: {
                                        ...formData.companyInfo,
                                        recentNews: updatedNews
                                      }
                                    });
                                  }}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="space-y-2">
                                <InputField
                                  label="Title"
                                  type="text"
                                  value={news.title || ""}
                                  onChange={(e) => {
                                    const updatedNews = [...formData.companyInfo.recentNews];
                                    updatedNews[idx] = { ...updatedNews[idx], title: e.target.value };
                                    setFormData({
                                      ...formData,
                                      companyInfo: {
                                        ...formData.companyInfo,
                                        recentNews: updatedNews
                                      }
                                    });
                                  }}
                                  placeholder="News headline..."
                                />
                                <InputField
                                  label="Summary"
                                  as="textarea"
                                  rows={2}
                                  value={news.summary || ""}
                                  onChange={(e) => {
                                    const updatedNews = [...formData.companyInfo.recentNews];
                                    updatedNews[idx] = { ...updatedNews[idx], summary: e.target.value };
                                    setFormData({
                                      ...formData,
                                      companyInfo: {
                                        ...formData.companyInfo,
                                        recentNews: updatedNews
                                      }
                                    });
                                  }}
                                  placeholder="Brief summary..."
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <InputField
                                    label="URL"
                                    type="url"
                                    value={news.url || ""}
                                    onChange={(e) => {
                                      const updatedNews = [...formData.companyInfo.recentNews];
                                      updatedNews[idx] = { ...updatedNews[idx], url: e.target.value };
                                      setFormData({
                                        ...formData,
                                        companyInfo: {
                                          ...formData.companyInfo,
                                          recentNews: updatedNews
                                        }
                                      });
                                    }}
                                    placeholder="https://..."
                                  />
                                  <InputField
                                    label="Date"
                                    type="date"
                                    value={news.date ? (typeof news.date === 'string' ? news.date.split('T')[0] : new Date(news.date).toISOString().split('T')[0]) : ""}
                                    onChange={(e) => {
                                      const updatedNews = [...formData.companyInfo.recentNews];
                                      updatedNews[idx] = { ...updatedNews[idx], date: e.target.value };
                                      setFormData({
                                        ...formData,
                                        companyInfo: {
                                          ...formData.companyInfo,
                                          recentNews: updatedNews
                                        }
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No news items added yet. Click "Add News Item" to get started.</p>
                      )}
                    </div>
                  </div>
                </details>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Add Job
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {showEditModal && editingJob && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Edit Job</h2>
              <form onSubmit={handleUpdateJob} className="space-y-4">
                {/* Same form fields as Add Job Modal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Job Title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                  <InputField
                    label="Company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Min Salary"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                  />
                  <InputField
                    label="Max Salary"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                    <select
                      value={formData.jobType}
                      onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Temporary">Temporary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Education">Education</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
                    <select
                      value={formData.workMode}
                      onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Application Date"
                    type="date"
                    value={formData.applicationDate}
                    onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                  />
                  <InputField
                    label="Deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Job URL</label>
                    {formData.url && (
                      <button
                        type="button"
                        onClick={handleImportFromURL}
                        disabled={!formData.url || isImporting}
                        className="text-sm px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        {isImporting ? (
                          <>
                            <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Importing...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Import Details</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/jobs/view/..."
                  />
                  {importStatus && (
                    <div className={`mt-2 p-3 rounded-lg text-sm ${importStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                      importStatus === 'partial' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                        'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                      {importMessage}
                    </div>
                  )}
                </div>

                <InputField
                  label="Tags (comma-separated)"
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., JavaScript, Remote, Senior"
                />

                <InputField
                  label="Description"
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <InputField
                  label="Notes"
                  as="textarea"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Personal observations and notes..."
                />

                <InputField
                  label="Interview Notes"
                  as="textarea"
                  rows={3}
                  value={formData.interviewNotes}
                  onChange={(e) => setFormData({ ...formData, interviewNotes: e.target.value })}
                  placeholder="Notes from interviews, feedback received..."
                />

                <InputField
                  label="Salary Negotiation Notes"
                  as="textarea"
                  rows={3}
                  value={formData.salaryNegotiationNotes}
                  onChange={(e) => setFormData({ ...formData, salaryNegotiationNotes: e.target.value })}
                  placeholder="Salary discussions, negotiation points..."
                />

                {/* UC-062: Company Information Section */}
                <details className="border rounded-lg p-4 bg-gray-50">
                  <summary className="cursor-pointer font-medium text-gray-900 hover:text-blue-600">
                    📋 Company Information
                  </summary>
                  <div className="mt-4 space-y-4">
                    {/* Auto-fill button */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Auto-fill company information</p>
                        <p className="text-xs text-blue-700">Automatically fetch company details, logo, and description</p>
                      </div>
                      <Button
                        type="button"
                        onClick={async (event) => {
                          if (!formData.company) {
                            alert('Please enter a company name first');
                            return;
                          }
                          try {
                            const token = await getToken();
                            setAuthToken(token);

                            // Show loading state
                            const btn = event.target;
                            btn.disabled = true;
                            btn.textContent = 'Fetching...';

                            const response = await api.get(`/api/companies/info?name=${encodeURIComponent(formData.company)}`);

                            if (response.data?.success && response.data?.data?.companyInfo) {
                              const info = response.data.data.companyInfo;
                              setFormData({
                                ...formData,
                                companyInfo: {
                                  ...formData.companyInfo,
                                  website: info.website || formData.companyInfo?.website || '',
                                  logo: info.logo || formData.companyInfo?.logo || '',
                                  description: info.description || formData.companyInfo?.description || '',
                                  mission: info.mission || formData.companyInfo?.mission || '',
                                  size: info.size || formData.companyInfo?.size || '',
                                  industry: info.industry || formData.companyInfo?.industry || '',
                                  location: info.location || formData.companyInfo?.location || '',
                                  contactInfo: {
                                    email: info.contactInfo?.email || formData.companyInfo?.contactInfo?.email || '',
                                    phone: info.contactInfo?.phone || formData.companyInfo?.contactInfo?.phone || '',
                                    address: info.contactInfo?.address || formData.companyInfo?.contactInfo?.address || ''
                                  },
                                  glassdoorRating: {
                                    rating: info.glassdoorRating?.rating ?? formData.companyInfo?.glassdoorRating?.rating ?? '',
                                    reviewCount: info.glassdoorRating?.reviewCount ?? formData.companyInfo?.glassdoorRating?.reviewCount ?? '',
                                    url: info.glassdoorRating?.url ?? formData.companyInfo?.glassdoorRating?.url ?? ''
                                  },
                                  recentNews: info.recentNews || formData.companyInfo?.recentNews || []
                                }
                              });
                              alert('Company information loaded successfully!');
                            } else {
                              alert('Could not find company information. You can add it manually below.');
                            }

                            btn.disabled = false;
                            btn.textContent = '🔄 Auto-fill';
                          } catch (error) {
                            console.error('Error fetching company info:', error);
                            alert('Failed to fetch company information. You can add it manually below.');
                            event.target.disabled = false;
                            event.target.textContent = '🔄 Auto-fill';
                          }
                        }}
                        variant="primary"
                        className="text-sm whitespace-nowrap"
                      >
                        🔄 Auto-fill
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                        <select
                          value={formData.companyInfo?.size || ""}
                          onChange={(e) => setFormData({ ...formData, companyInfo: { ...formData.companyInfo, size: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select size...</option>
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-500">201-500 employees</option>
                          <option value="501-1000">501-1000 employees</option>
                          <option value="1001-5000">1001-5000 employees</option>
                          <option value="5001-10000">5001-10000 employees</option>
                          <option value="10000+">10000+ employees</option>
                        </select>
                      </div>
                      <InputField
                        label="Company Website"
                        type="url"
                        value={formData.companyInfo?.website || ""}
                        onChange={(e) => setFormData({ ...formData, companyInfo: { ...formData.companyInfo, website: e.target.value } })}
                        placeholder="https://company.com"
                      />
                    </div>

                    <InputField
                      label="Company Logo URL"
                      type="url"
                      value={formData.companyInfo?.logo || ""}
                      onChange={(e) => setFormData({ ...formData, companyInfo: { ...formData.companyInfo, logo: e.target.value } })}
                      placeholder="https://company.com/logo.png"
                    />

                    <InputField
                      label="Company Description"
                      as="textarea"
                      rows={3}
                      value={formData.companyInfo?.description || ""}
                      onChange={(e) => setFormData({ ...formData, companyInfo: { ...formData.companyInfo, description: e.target.value } })}
                      placeholder="Brief description of the company..."
                    />

                    <InputField
                      label="Mission Statement"
                      as="textarea"
                      rows={2}
                      value={formData.companyInfo?.mission || ""}
                      onChange={(e) => setFormData({ ...formData, companyInfo: { ...formData.companyInfo, mission: e.target.value } })}
                      placeholder="Company's mission statement..."
                    />

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                          label="Email"
                          type="email"
                          value={formData.companyInfo?.contactInfo?.email || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            companyInfo: {
                              ...formData.companyInfo,
                              contactInfo: { ...formData.companyInfo?.contactInfo, email: e.target.value }
                            }
                          })}
                          placeholder="contact@company.com"
                        />
                        <InputField
                          label="Phone"
                          type="tel"
                          value={formData.companyInfo?.contactInfo?.phone || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            companyInfo: {
                              ...formData.companyInfo,
                              contactInfo: { ...formData.companyInfo?.contactInfo, phone: e.target.value }
                            }
                          })}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <InputField
                        label="Address"
                        type="text"
                        value={formData.companyInfo?.contactInfo?.address || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          companyInfo: {
                            ...formData.companyInfo,
                            contactInfo: { ...formData.companyInfo?.contactInfo, address: e.target.value }
                          }
                        })}
                        placeholder="123 Main St, City, State 12345"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Glassdoor Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField
                          label="Rating (0-5)"
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={formData.companyInfo?.glassdoorRating?.rating || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            companyInfo: {
                              ...formData.companyInfo,
                              glassdoorRating: { ...formData.companyInfo?.glassdoorRating, rating: e.target.value }
                            }
                          })}
                          placeholder="4.2"
                        />
                        <InputField
                          label="Review Count"
                          type="number"
                          value={formData.companyInfo?.glassdoorRating?.reviewCount || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            companyInfo: {
                              ...formData.companyInfo,
                              glassdoorRating: { ...formData.companyInfo?.glassdoorRating, reviewCount: e.target.value }
                            }
                          })}
                          placeholder="150"
                        />
                        <InputField
                          label="Glassdoor URL"
                          type="url"
                          value={formData.companyInfo?.glassdoorRating?.url || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            companyInfo: {
                              ...formData.companyInfo,
                              glassdoorRating: { ...formData.companyInfo?.glassdoorRating, url: e.target.value }
                            }
                          })}
                          placeholder="https://glassdoor.com/..."
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Recent News & Updates</h4>
                        <Button
                          type="button"
                          onClick={() => {
                            const newNews = {
                              title: "",
                              summary: "",
                              url: "",
                              date: new Date().toISOString().split('T')[0]
                            };
                            setFormData({
                              ...formData,
                              companyInfo: {
                                ...formData.companyInfo,
                                recentNews: [...(formData.companyInfo?.recentNews || []), newNews]
                              }
                            });
                          }}
                          variant="secondary"
                          className="text-xs"
                        >
                          + Add News Item
                        </Button>
                      </div>

                      {formData.companyInfo?.recentNews && formData.companyInfo.recentNews.length > 0 ? (
                        <div className="space-y-3">
                          {formData.companyInfo.recentNews.map((news, idx) => (
                            <div key={idx} className="p-3 border rounded-lg bg-gray-50">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600">News Item {idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedNews = formData.companyInfo.recentNews.filter((_, i) => i !== idx);
                                    setFormData({
                                      ...formData,
                                      companyInfo: {
                                        ...formData.companyInfo,
                                        recentNews: updatedNews
                                      }
                                    });
                                  }}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="space-y-2">
                                <InputField
                                  label="Title"
                                  type="text"
                                  value={news.title || ""}
                                  onChange={(e) => {
                                    const updatedNews = [...formData.companyInfo.recentNews];
                                    updatedNews[idx] = { ...updatedNews[idx], title: e.target.value };
                                    setFormData({
                                      ...formData,
                                      companyInfo: {
                                        ...formData.companyInfo,
                                        recentNews: updatedNews
                                      }
                                    });
                                  }}
                                  placeholder="News headline..."
                                />
                                <InputField
                                  label="Summary"
                                  as="textarea"
                                  rows={2}
                                  value={news.summary || ""}
                                  onChange={(e) => {
                                    const updatedNews = [...formData.companyInfo.recentNews];
                                    updatedNews[idx] = { ...updatedNews[idx], summary: e.target.value };
                                    setFormData({
                                      ...formData,
                                      companyInfo: {
                                        ...formData.companyInfo,
                                        recentNews: updatedNews
                                      }
                                    });
                                  }}
                                  placeholder="Brief summary..."
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <InputField
                                    label="URL"
                                    type="url"
                                    value={news.url || ""}
                                    onChange={(e) => {
                                      const updatedNews = [...formData.companyInfo.recentNews];
                                      updatedNews[idx] = { ...updatedNews[idx], url: e.target.value };
                                      setFormData({
                                        ...formData,
                                        companyInfo: {
                                          ...formData.companyInfo,
                                          recentNews: updatedNews
                                        }
                                      });
                                    }}
                                    placeholder="https://..."
                                  />
                                  <InputField
                                    label="Date"
                                    type="date"
                                    value={news.date ? (typeof news.date === 'string' ? news.date.split('T')[0] : new Date(news.date).toISOString().split('T')[0]) : ""}
                                    onChange={(e) => {
                                      const updatedNews = [...formData.companyInfo.recentNews];
                                      updatedNews[idx] = { ...updatedNews[idx], date: e.target.value };
                                      setFormData({
                                        ...formData,
                                        companyInfo: {
                                          ...formData.companyInfo,
                                          recentNews: updatedNews
                                        }
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No news items added yet. Click "Add News Item" to get started.</p>
                      )}
                    </div>
                  </div>
                </details>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingJob(null);
                      resetForm();
                    }}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Job View Modal */}
      {showDetailModal && viewingJob && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{viewingJob.title}</h2>
                  <p className="text-xl text-gray-600 mt-1">{viewingJob.company}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${viewingJob.status === "Interested" ? "bg-gray-100 text-gray-800" :
                      viewingJob.status === "Applied" ? "bg-blue-100 text-blue-800" :
                        viewingJob.status === "Phone Screen" ? "bg-yellow-100 text-yellow-800" :
                          viewingJob.status === "Interview" ? "bg-purple-100 text-purple-800" :
                            viewingJob.status === "Offer" ? "bg-green-100 text-green-800" :
                              "bg-red-100 text-red-800"
                      }`}>
                      {viewingJob.status}
                    </span>
                    {viewingJob.priority && (
                      <span className="text-sm text-gray-500">
                        Priority: {viewingJob.priority}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setViewingJob(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEditJob(viewingJob);
                  }}
                  variant="primary"
                >
                  Edit Job
                </Button>
                {/* Application Automation Button */}
                <Button
                  onClick={() => {
                    setSelectedJobForPackage(viewingJob);
                    setShowPackageGenerator(true);
                  }}
                  variant="secondary"
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700"
                >
                  ⚡ Generate Package
                </Button>
                {/* UC-68: Interview Insights Button */}
                <Button
                  onClick={() => {
                    setInsightsJob(viewingJob);
                    setShowInterviewInsights(true);
                  }}
                  variant="secondary"
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700"
                >
                  🎯 Interview Insights
                </Button>
                {viewingJob.archived ? (
                  <Button
                    onClick={() => {
                      handleRestoreJob(viewingJob._id);
                      setShowDetailModal(false);
                      setViewingJob(null);
                    }}
                    variant="secondary"
                    className="bg-green-100 hover:bg-green-200 text-green-700"
                  >
                    ↩️ Restore Job
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleArchiveJob(viewingJob);
                    }}
                    variant="secondary"
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700"
                  >
                    📦 Archive Job
                  </Button>
                )}
                <Button
                  onClick={() => {
                    handleDeleteJobWithConfirm(viewingJob._id, viewingJob.title);
                    setShowDetailModal(false);
                    setViewingJob(null);
                  }}
                  variant="secondary"
                  className="bg-red-100 hover:bg-red-200 text-red-700"
                >
                  Delete Permanently
                </Button>
              </div>

              {/* Content Sections */}
              <div className="space-y-6">
                {/* Basic Information */}
                <Card title="Job Information" variant="elevated">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingJob.location && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Location</p>
                        <p className="text-gray-900">{viewingJob.location}</p>
                      </div>
                    )}
                    {viewingJob.workMode && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Work Mode</p>
                        <p className="text-gray-900">{viewingJob.workMode}</p>
                      </div>
                    )}
                    {viewingJob.jobType && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Job Type</p>
                        <p className="text-gray-900">{viewingJob.jobType}</p>
                      </div>
                    )}
                    {viewingJob.industry && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Industry</p>
                        <p className="text-gray-900">{viewingJob.industry}</p>
                      </div>
                    )}
                    {(viewingJob.salary?.min || viewingJob.salary?.max) && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Salary Range</p>
                        <p className="text-gray-900">
                          {viewingJob.salary.min && viewingJob.salary.max
                            ? `$${viewingJob.salary.min.toLocaleString()} - $${viewingJob.salary.max.toLocaleString()}`
                            : viewingJob.salary.min
                              ? `$${viewingJob.salary.min.toLocaleString()}+`
                              : `Up to $${viewingJob.salary.max.toLocaleString()}`}
                        </p>
                      </div>
                    )}
                    {viewingJob.applicationDate && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Application Date</p>
                        <p className="text-gray-900">{new Date(viewingJob.applicationDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {viewingJob.deadline && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Deadline</p>
                        <p className={`font-medium ${new Date(viewingJob.deadline) < new Date() ? "text-red-600" : "text-gray-900"}`}>
                          {new Date(viewingJob.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500">Days in Current Stage</p>
                      <p className="text-gray-900">{viewingJob.daysInStage || 0} days</p>
                    </div>
                  </div>

                  {viewingJob.url && (
                    <div className="mt-4">
                      <a
                        href={viewingJob.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        View Job Posting
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}

                  {viewingJob.tags && viewingJob.tags.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {viewingJob.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* UC-062: Company Information */}
                <CompanyInfoCard
                  companyInfo={viewingJob.companyInfo}
                  companyName={viewingJob.company}
                  industry={viewingJob.industry}
                  location={viewingJob.location}
                />

                {/* UC-062: Enhanced Company News Section */}
                {viewingJob.company && (
                  <CompanyNewsSection
                    companyName={viewingJob.company}
                    initialNews={viewingJob.companyInfo?.recentNews || []}
                    onNewsUpdate={(news) => {
                      // Update the viewing job with fresh news
                      setViewingJob({
                        ...viewingJob,
                        companyInfo: {
                          ...viewingJob.companyInfo,
                          recentNews: news,
                        },
                      });
                    }}
                  />
                )}

                {/* UC-064: Comprehensive Company Research Report */}
                {viewingJob.company && (
                  <Card variant="elevated" className="mt-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        🔍 Comprehensive Company Research
                      </h3>
                      <p className="text-sm text-gray-600">
                        Automated research report with company insights, mission, products, leadership, and competitive landscape
                      </p>
                    </div>
                    <CompanyResearchReport
                      companyName={viewingJob.company}
                      jobDescription={viewingJob.description}
                      website={viewingJob.companyInfo?.website || viewingJob.url}
                      autoLoad={false}
                    />
                  </Card>
                )}

                {/* Description */}
                {viewingJob.description && (
                  <Card title="Job Description" variant="elevated">
                    <p className="text-gray-700 whitespace-pre-wrap">{viewingJob.description}</p>
                  </Card>
                )}

                {/* Requirements */}
                {viewingJob.requirements && viewingJob.requirements.length > 0 && (
                  <Card title="Requirements" variant="elevated">
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {viewingJob.requirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Personal Notes */}
                {viewingJob.notes && (
                  <Card title="Personal Notes" variant="elevated">
                    <p className="text-gray-700 whitespace-pre-wrap">{viewingJob.notes}</p>
                  </Card>
                )}

                {/* Next Action Reminder */}
                {(viewingJob.nextAction || viewingJob.nextActionDate) && (
                  <Card title="Next Action Reminder" variant="elevated">
                    <div className="space-y-2">
                      {viewingJob.nextAction && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Action</p>
                          <p className="text-gray-900">{viewingJob.nextAction}</p>
                        </div>
                      )}
                      {viewingJob.nextActionDate && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Due Date</p>
                          <p className={`font-medium ${new Date(viewingJob.nextActionDate) < new Date() ? "text-red-600" : "text-gray-900"}`}>
                            {new Date(viewingJob.nextActionDate).toLocaleDateString()}
                            {new Date(viewingJob.nextActionDate) < new Date() && " (Overdue)"}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Interview Notes */}
                {viewingJob.interviewNotes && (
                  <Card title="Interview Notes" variant="elevated">
                    <p className="text-gray-700 whitespace-pre-wrap">{viewingJob.interviewNotes}</p>
                  </Card>
                )}

                {/* Salary Negotiation Notes */}
                {viewingJob.salaryNegotiationNotes && (
                  <Card title="Salary Negotiation Notes" variant="elevated">
                    <p className="text-gray-700 whitespace-pre-wrap">{viewingJob.salaryNegotiationNotes}</p>
                  </Card>
                )}

                {/* Contacts */}
                {viewingJob.contacts && viewingJob.contacts.length > 0 && (
                  <Card title="Contacts" variant="elevated">
                    <div className="space-y-4">
                      {viewingJob.contacts.map((contact, idx) => (
                        <div key={idx} className="border-l-4 border-blue-500 pl-4">
                          {contact.name && (
                            <p className="font-semibold text-gray-900">{contact.name}</p>
                          )}
                          {contact.role && (
                            <p className="text-sm text-gray-600">{contact.role}</p>
                          )}
                          {contact.email && (
                            <p className="text-sm text-gray-700">
                              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                {contact.email}
                              </a>
                            </p>
                          )}
                          {contact.phone && (
                            <p className="text-sm text-gray-700">
                              <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                                {contact.phone}
                              </a>
                            </p>
                          )}
                          {contact.notes && (
                            <p className="text-sm text-gray-600 mt-1">{contact.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Application History (Status History) */}
                {viewingJob.statusHistory && viewingJob.statusHistory.length > 0 && (
                  <Card title="Application History" variant="elevated">
                    <div className="space-y-3">
                      {[...viewingJob.statusHistory].reverse().map((history, idx) => (
                        <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
                          <div className="shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{history.status}</span>
                              <span className="text-sm text-gray-500">
                                {new Date(history.timestamp).toLocaleDateString()} at{" "}
                                {new Date(history.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            {history.notes && (
                              <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Materials */}
                {viewingJob.materials && (
                  <Card title="Application Materials" variant="elevated">
                    <div className="space-y-2">
                      {viewingJob.materials.resume && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Resume: </span>
                          <a href={viewingJob.materials.resume} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {viewingJob.materials.resume}
                          </a>
                        </div>
                      )}
                      {viewingJob.materials.coverLetter && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Cover Letter: </span>
                          <a href={viewingJob.materials.coverLetter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {viewingJob.materials.coverLetter}
                          </a>
                        </div>
                      )}
                      {viewingJob.materials.portfolio && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Portfolio: </span>
                          <a href={viewingJob.materials.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {viewingJob.materials.portfolio}
                          </a>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Archive Information */}
                {viewingJob.archived && (
                  <Card title="Archive Information" variant="elevated">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-500">Archived Date</p>
                        <p className="text-gray-900">
                          {new Date(viewingJob.archivedAt).toLocaleDateString()} at{" "}
                          {new Date(viewingJob.archivedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {viewingJob.archiveReason && (
                        <div>
                          <p className="font-medium text-gray-500">Archive Reason</p>
                          <p className="text-gray-900">{viewingJob.archiveReason}</p>
                        </div>
                      )}
                      {viewingJob.autoArchived && (
                        <div>
                          <p className="font-medium text-gray-500">Archive Type</p>
                          <p className="text-gray-900">Auto-archived</p>
                        </div>
                      )}
                    </div>
                    {viewingJob.archiveNotes && (
                      <div className="mt-4">
                        <p className="font-medium text-gray-500 mb-1">Archive Notes</p>
                        <p className="text-gray-700 text-sm">{viewingJob.archiveNotes}</p>
                      </div>
                    )}
                  </Card>
                )}

                {/* Metadata */}
                <Card title="Tracking Information" variant="elevated">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-500">Created</p>
                      <p className="text-gray-900">
                        {new Date(viewingJob.createdAt).toLocaleDateString()} at{" "}
                        {new Date(viewingJob.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Last Updated</p>
                      <p className="text-gray-900">
                        {new Date(viewingJob.updatedAt).toLocaleDateString()} at{" "}
                        {new Date(viewingJob.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Close Button */}
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    setViewingJob(null);
                  }}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      <ArchiveModal
        isOpen={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setArchivingJob(null);
        }}
        onArchive={handleArchiveConfirm}
        jobCount={archivingJob ? 1 : selectedJobs.length}
        jobTitle={archivingJob ? `${archivingJob.title} at ${archivingJob.company}` : null}
      />

      {/* Auto-Archive Modal */}
      <AutoArchiveModal
        isOpen={showAutoArchiveModal}
        onClose={() => setShowAutoArchiveModal(false)}
        onAutoArchive={handleAutoArchive}
      />

      {/* Job Statistics Modal */}
      {showStatistics && (
        <JobStatistics onClose={() => setShowStatistics(false)} />
      )}

      {/* UC-68: Interview Insights Modal */}
      {showInterviewInsights && insightsJob && (
        <InterviewInsights
          jobId={insightsJob._id}
          company={insightsJob.company}
          onClose={() => {
            setShowInterviewInsights(false);
            setInsightsJob(null);
          }}
        />
      )}

      {/* UC-071: Interview Scheduler Modal */}
      {showInterviewScheduler && selectedJobForInterview && (
        <InterviewScheduler
          job={selectedJobForInterview}
          interview={editingInterview}
          onClose={() => {
            setShowInterviewScheduler(false);
            setSelectedJobForInterview(null);
            setEditingInterview(null);
          }}
          onSuccess={handleInterviewSaved}
        />
      )}

      {/* UC-063: Job Match Score Modal */}
      {showMatchScore && matchJobId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Job Match Analysis</h2>
                <button
                  onClick={() => {
                    setShowMatchScore(false);
                    setMatchJobId(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <JobMatchScore jobId={matchJobId} />
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => {
                    setShowMatchScore(false);
                    setMatchJobId(null);
                  }}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UC-063: Job Comparison Modal */}
      {showComparison && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Compare Job Matches</h2>
                <button
                  onClick={() => setShowComparison(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <JobMatchComparison />
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setShowComparison(false)}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Package Generator Modal */}
      {showPackageGenerator && selectedJobForPackage && (
        <ApplicationPackageGenerator
          job={selectedJobForPackage}
          onClose={() => {
            setShowPackageGenerator(false);
            setSelectedJobForPackage(null);
          }}
          onSuccess={async (pkg) => {
            setShowPackageGenerator(false);
            setSelectedJobForPackage(null);
            alert(`Application package generated successfully for ${pkg.metadata.jobTitle}!`);
            await fetchJobs(); // Refresh jobs to show updated status
          }}
        />
      )}

      {/* Application Automation Modal */}
      {showAutomation && (
        <ApplicationAutomation
          selectedJobs={getSelectedJobObjects()}
          onClose={() => {
            setShowAutomation(false);
          }}
          onSuccess={async () => {
            setShowAutomation(false);
            setBulkSelectionMode(false);
            setSelectedJobs([]);
            await fetchJobs(); // Refresh jobs
          }}
        />
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedJobForStatus && (
        <StatusUpdateModal
          job={selectedJobForStatus}
          currentStatus={applicationStatuses[selectedJobForStatus._id]}
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedJobForStatus(null);
          }}
          onUpdate={handleStatusUpdate}
        />
      )}

      {/* Status Timeline Modal */}
      {showTimelineModal && selectedJobForStatus && (
        <StatusTimeline
          jobId={selectedJobForStatus._id}
          isOpen={showTimelineModal}
          onClose={() => {
            setShowTimelineModal(false);
            setSelectedJobForStatus(null);
          }}
        />
      )}

      {/* Email Status Detector Modal */}
      {showEmailDetector && selectedJobForStatus && (
        <EmailStatusDetector
          jobId={selectedJobForStatus._id}
          isOpen={showEmailDetector}
          onClose={() => {
            setShowEmailDetector(false);
            setSelectedJobForStatus(null);
          }}
          onDetectionConfirmed={handleDetectionConfirmed}
        />
      )}

      {/* Status Statistics Modal */}
      {showStatusStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Application Status Analytics</h2>
                <button
                  onClick={() => setShowStatusStats(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <StatusStatistics />
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setShowStatusStats(false)}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Status Update Modal */}
      {showBulkStatusUpdate && selectedJobs.length > 0 && (
        <BulkStatusUpdate
          selectedJobs={getSelectedJobObjects()}
          isOpen={showBulkStatusUpdate}
          onClose={() => {
            setShowBulkStatusUpdate(false);
          }}
          onUpdate={handleBulkApplicationStatusUpdate}
        />
      )}

      {/* Cover Letter Generator Modal */}
      {showCoverLetterGenerator && selectedJobForCoverLetter && (
        <CoverLetterGeneratorModal
          job={selectedJobForCoverLetter}
          onClose={() => {
            setShowCoverLetterGenerator(false);
            setSelectedJobForCoverLetter(null);
          }}
          onSuccess={handleCoverLetterSuccess}
        />
      )}
    </div>
  );
}
