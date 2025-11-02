import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import api, { setAuthToken } from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import Container from "../../components/Container";
import Card from "../../components/Card";
import JobPipeline from "../../components/JobPipeline";
import InputField from "../../components/InputField";
import Button from "../../components/Button";

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
  });

  // Load jobs on mount
  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, []);

  // Filter jobs when search or filter changes
  useEffect(() => {
    let filtered = [...jobs];

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
  }, [jobs, searchTerm, filterStatus, filters, sortBy, sortOrder]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);
      const response = await api.get("/api/jobs");
      setJobs(response.data.data.jobs);
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
      };

      await api.post("/api/jobs", jobData);
      await fetchJobs();
      await fetchStats();
      setShowAddModal(false);
      resetForm();
      
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

  const handleJobStatusChange = async (jobId, newStatus) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await api.put(`/api/jobs/${jobId}/status`, { status: newStatus });
      await fetchJobs();
      await fetchStats();
    } catch (error) {
      console.error("Failed to update job status:", error);
      alert("Failed to update job status. Please try again.");
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

          {/* Controls */}
          <Card variant="primary" className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <InputField
                  label="Search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, company, location, keywords..."
                />
              </div>
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
              <div className="flex items-end gap-2">
                <Button 
                  onClick={() => setShowFilters(!showFilters)} 
                  variant={showFilters || hasActiveFilters() ? "primary" : "secondary"}
                >
                  {showFilters ? "Hide Filters" : "More Filters"}
                  {hasActiveFilters() && !showFilters && " ⚡"}
                </Button>
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
                <div className="flex gap-2">
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
                    onClick={() => setSelectedJobs([])}
                    className="text-xs px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Pipeline View */}
          <JobPipeline
            jobs={filteredJobs}
            onJobStatusChange={handleJobStatusChange}
            onJobEdit={handleEditJob}
            onJobDelete={handleDeleteJob}
            onJobView={handleViewJob}
            highlightTerms={[
              searchTerm?.trim(),
              filters.location?.trim(),
              ...(filters.tags ? filters.tags.split(",").map((t) => t.trim()) : []),
            ].filter(Boolean)}
          />
        </div>
      </Container>

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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

                <InputField
                  label="Job URL"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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

                <InputField
                  label="Job URL"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{viewingJob.title}</h2>
                  <p className="text-xl text-gray-600 mt-1">{viewingJob.company}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewingJob.status === "Interested" ? "bg-gray-100 text-gray-800" :
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
              <div className="flex gap-2 mb-6">
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEditJob(viewingJob);
                  }}
                  variant="primary"
                >
                  Edit Job
                </Button>
                <Button
                  onClick={() => {
                    if (window.confirm(`Delete "${viewingJob.title}" at ${viewingJob.company}?`)) {
                      handleDeleteJob(viewingJob._id);
                      setShowDetailModal(false);
                      setViewingJob(null);
                    }
                  }}
                  variant="secondary"
                  className="bg-red-100 hover:bg-red-200 text-red-700"
                >
                  Delete
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
                          <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
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
    </div>
  );
}
