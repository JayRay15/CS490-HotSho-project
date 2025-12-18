import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api, { setAuthToken } from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import Container from "../../components/Container";
import Card from "../../components/Card";
import Button from "../../components/Button";

// Platform configuration with professional icons
const PLATFORM_CONFIG = {
  "LinkedIn": { icon: "💼", color: "bg-blue-100 text-blue-800 border-blue-300", label: "LinkedIn" },
  "Indeed": { icon: "📋", color: "bg-purple-100 text-purple-800 border-purple-300", label: "Indeed" },
  "Glassdoor": { icon: "🏢", color: "bg-green-100 text-green-800 border-green-300", label: "Glassdoor" },
  "Company Website": { icon: "🌐", color: "bg-gray-100 text-gray-800 border-gray-300", label: "Direct" },
  "ZipRecruiter": { icon: "⚡", color: "bg-orange-100 text-orange-800 border-orange-300", label: "ZipRecruiter" },
  "Monster": { icon: "📊", color: "bg-indigo-100 text-indigo-800 border-indigo-300", label: "Monster" },
  "CareerBuilder": { icon: "🛠️", color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "CareerBuilder" },
  "AngelList": { icon: "🚀", color: "bg-pink-100 text-pink-800 border-pink-300", label: "AngelList" },
  "Other": { icon: "📄", color: "bg-gray-100 text-gray-700 border-gray-300", label: "Other" },
  "Manual": { icon: "✏️", color: "bg-slate-100 text-slate-800 border-slate-300", label: "Manual" },
};

// Status badge colors
const STATUS_COLORS = {
  "Interested": "bg-gray-100 text-gray-700 border-gray-300",
  "Applied": "bg-blue-100 text-blue-700 border-blue-300",
  "Phone Screen": "bg-yellow-100 text-yellow-700 border-yellow-300",
  "Interview": "bg-purple-100 text-purple-700 border-purple-300",
  "Offer": "bg-green-100 text-green-700 border-green-300",
  "Rejected": "bg-red-100 text-red-700 border-red-300",
};

export default function MultiPlatformTracker() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getToken } = useAuth();
  
  // Core state
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [stats, setStats] = useState({
    totalApplications: 0,
    platforms: {},
    consolidated: 0,
  });
  
  // Gmail state
  const [gmailStatus, setGmailStatus] = useState({ connected: false, email: null });
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);
  
  // Gaps state
  const [gaps, setGaps] = useState([]);
  const [showGaps, setShowGaps] = useState(false);
  
  // Import state
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [showImportResults, setShowImportResults] = useState(false);
  
  // Export state
  const [exporting, setExporting] = useState(false);
  
  // Manual email import state
  const [showEmailImport, setShowEmailImport] = useState(false);
  const [emailData, setEmailData] = useState({ sender: "", subject: "", body: "" });

  // Check for Gmail OAuth callback params
  useEffect(() => {
    const gmailConnected = searchParams.get('gmail_connected');
    const gmailError = searchParams.get('gmail_error');
    
    if (gmailConnected === 'true') {
      setScanMessage({ type: 'success', text: 'Gmail connected successfully! Click "Scan Emails" to import applications.' });
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (gmailError) {
      setScanMessage({ type: 'error', text: `Gmail connection failed: ${gmailError}` });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  // Fetch Gmail connection status
  const fetchGmailStatus = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.get("/api/gmail/status");
      setGmailStatus(response.data.data || { connected: false, email: null });
    } catch (error) {
      console.error("Error fetching Gmail status:", error);
    }
  };

  // Fetch applications from backend
  const fetchApplications = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.get("/api/jobs");
      const jobs = response.data.data?.jobs || [];
      
      setApplications(jobs);
      calculateStats(jobs);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setLoading(false);
    }
  };

  // Fetch application gaps
  const fetchGaps = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.get("/api/jobs/gaps?gapDays=7");
      setGaps(response.data.data?.gaps || []);
    } catch (error) {
      console.error("Error fetching gaps:", error);
    }
  };

  // Calculate statistics
  const calculateStats = (jobs) => {
    const platformCounts = {};
    let consolidatedCount = 0;
    
    jobs.forEach(app => {
      if (app.applicationPlatforms && app.applicationPlatforms.length > 1) {
        consolidatedCount++;
      }
      if (app.applicationPlatforms && app.applicationPlatforms.length > 0) {
        app.applicationPlatforms.forEach(platform => {
          platformCounts[platform.name] = (platformCounts[platform.name] || 0) + 1;
        });
      } else if (app.primaryPlatform) {
        platformCounts[app.primaryPlatform] = (platformCounts[app.primaryPlatform] || 0) + 1;
      } else {
        platformCounts["Manual"] = (platformCounts["Manual"] || 0) + 1;
      }
    });
    
    setStats({
      totalApplications: jobs.length,
      platforms: platformCounts,
      consolidated: consolidatedCount,
    });
  };

  useEffect(() => {
    fetchApplications();
    fetchGaps();
    fetchGmailStatus();
  }, [getToken]);

  // Connect Gmail
  const handleConnectGmail = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.get("/api/gmail/auth");
      const { authUrl } = response.data.data;
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error connecting Gmail:", error);
      setScanMessage({ type: 'error', text: 'Failed to initiate Gmail connection' });
    }
  };

  // Disconnect Gmail
  const handleDisconnectGmail = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      
      await api.post("/api/gmail/disconnect");
      setGmailStatus({ connected: false, email: null });
      setScanMessage({ type: 'success', text: 'Gmail disconnected successfully' });
    } catch (error) {
      console.error("Error disconnecting Gmail:", error);
    }
  };

  // Scan Gmail for job emails
  const handleScanEmails = async () => {
    setScanning(true);
    setScanMessage(null);
    
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.post("/api/gmail/scan", {
        daysBack: 30,
        maxResults: 50,
      });
      
      const result = response.data.data;
      
      if (result.applications && result.applications.length > 0) {
        // Import the found applications
        await importApplications(result.applications);
        setScanMessage({ 
          type: 'success', 
          text: result.message || `Found ${result.applications.length} applications` 
        });
      } else {
        setScanMessage({ 
          type: 'info', 
          text: result.message || 'No new job application emails found' 
        });
      }
    } catch (error) {
      console.error("Error scanning emails:", error);
      setScanMessage({ type: 'error', text: 'Failed to scan emails' });
    } finally {
      setScanning(false);
    }
  };

  // Import applications from scan results
  const importApplications = async (apps) => {
    setImporting(true);
    
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const results = {
        imported: 0,
        consolidated: 0,
        failed: 0,
        details: [],
      };

      for (const app of apps) {
        try {
          const response = await api.post("/api/jobs/import-email", {
            sender: app.platform ? `noreply@${app.platform.toLowerCase()}.com` : '',
            subject: `Application for ${app.title} at ${app.company}`,
            body: `You applied to ${app.title} at ${app.company}. Location: ${app.location || 'Not specified'}`,
          });
          
          if (response.data.data?.consolidated) {
            results.consolidated++;
            results.details.push({
              title: app.title,
              company: app.company,
              platform: app.platform,
              status: "consolidated",
              reason: "Merged with existing application",
            });
          } else {
            results.imported++;
            results.details.push({
              title: app.title,
              company: app.company,
              platform: app.platform,
              status: "imported",
            });
          }
        } catch (err) {
          results.failed++;
          results.details.push({
            title: app.title,
            company: app.company,
            platform: app.platform,
            status: "failed",
            reason: err.response?.data?.message || err.message,
          });
        }
      }

      setImportResults(results);
      setShowImportResults(true);
      
      // Refresh applications
      await fetchApplications();
      await fetchGaps();
    } catch (error) {
      console.error("Error importing applications:", error);
    } finally {
      setImporting(false);
    }
  };

  // Import from email content (manual paste)
  const handleImportFromEmail = async () => {
    if (!emailData.body && !emailData.subject) {
      setScanMessage({ type: 'error', text: 'Please enter email content' });
      return;
    }

    setImporting(true);
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.post("/api/jobs/import-email", emailData);
      setImportResults({ 
        imported: response.data.data?.consolidated ? 0 : 1,
        consolidated: response.data.data?.consolidated ? 1 : 0,
        failed: 0,
        details: [{
          title: response.data.data?.job?.title,
          company: response.data.data?.job?.company,
          platform: response.data.data?.platform,
          status: response.data.data?.consolidated ? "consolidated" : "imported",
        }]
      });
      setShowImportResults(true);
      setShowEmailImport(false);
      setEmailData({ sender: "", subject: "", body: "" });
      
      // Refresh applications
      await fetchApplications();
      await fetchGaps();
    } catch (error) {
      console.error("Error importing from email:", error);
      setScanMessage({ type: 'error', text: error.response?.data?.message || 'Failed to import' });
    } finally {
      setImporting(false);
    }
  };

  // Export as JSON
  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.get("/api/jobs/export");
      const data = response.data.data;
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `applications_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setScanMessage({ type: 'success', text: 'Export successful!' });
    } catch (error) {
      console.error("Error exporting:", error);
      setScanMessage({ type: 'error', text: 'Failed to export applications' });
    } finally {
      setExporting(false);
    }
  };

  // Export as CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.get("/api/jobs/export/csv", { responseType: "blob" });
      
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `applications_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      setScanMessage({ type: 'error', text: 'Failed to export' });
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const formatSalary = (salary) => {
    if (!salary || (!salary.min && !salary.max)) return null;
    
    const format = (num) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: salary.currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    };

    if (salary.min && salary.max) {
      return `${format(salary.min)} - ${format(salary.max)}`;
    } else if (salary.min) {
      return `${format(salary.min)}+`;
    } else if (salary.max) {
      return `Up to ${format(salary.max)}`;
    }
    return null;
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    // Platform filter
    if (selectedPlatform !== "all") {
      const hasPlatform = app.applicationPlatforms?.some(p => p.name === selectedPlatform) ||
        app.primaryPlatform === selectedPlatform ||
        (selectedPlatform === "Manual" && !app.primaryPlatform && (!app.applicationPlatforms || app.applicationPlatforms.length === 0));
      if (!hasPlatform) return false;
    }
    
    // Status filter
    if (selectedStatus !== "all" && app.status !== selectedStatus) {
      return false;
    }
    
    return true;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Tracker</h1>
            <p className="text-gray-600">
              Track applications across all job platforms in one unified view
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowEmailImport(true)}
              variant="secondary"
            >
              ✉️ Paste Email
            </Button>
            <Button
              onClick={handleExportJSON}
              disabled={exporting}
              variant="secondary"
            >
              📥 Export JSON
            </Button>
            <Button
              onClick={handleExportCSV}
              disabled={exporting}
              variant="secondary"
            >
              📊 Export CSV
            </Button>
          </div>
        </div>

        {/* Gmail Connection Card */}
        <Card className="mb-6 bg-gradient-to-r from-white to-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gmail Integration</h3>
                {gmailStatus.connected ? (
                  <p className="text-sm text-green-600">
                    ✓ Connected as {gmailStatus.email || 'your Gmail account'}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Connect to automatically import job applications from your email
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {gmailStatus.connected ? (
                <>
                  <Button
                    onClick={handleScanEmails}
                    disabled={scanning}
                    variant="primary"
                  >
                    {scanning ? "Scanning..." : "Scan Emails"}
                  </Button>
                  <Button
                    onClick={handleDisconnectGmail}
                    variant="secondary"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button onClick={handleConnectGmail} variant="primary">
                  Connect Gmail
                </Button>
              )}
            </div>
          </div>
          
          {/* Scan message */}
          {scanMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              scanMessage.type === 'success' ? 'bg-green-50 text-green-800' :
              scanMessage.type === 'error' ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              {scanMessage.text}
            </div>
          )}
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700">{stats.totalApplications}</div>
              <div className="text-sm text-blue-600 mt-1">Total Applications</div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-700">{stats.consolidated}</div>
              <div className="text-sm text-green-600 mt-1">Multi-Platform</div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-700">
                {Object.keys(stats.platforms).length}
              </div>
              <div className="text-sm text-purple-600 mt-1">Platforms Used</div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-700">
                {applications.filter(a => a.status === "Interview" || a.status === "Phone Screen").length}
              </div>
              <div className="text-sm text-orange-600 mt-1">Active Interviews</div>
            </div>
          </Card>
        </div>

        {/* Application Gaps Alert */}
        {gaps.length > 0 && (
          <Card className="mb-6 bg-amber-50 border-amber-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">
                    Activity Gaps Detected
                  </h4>
                  <p className="text-sm text-amber-700">
                    Found {gaps.length} period(s) with no tracked applications. 
                    Consider importing missing applications or checking your email.
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowGaps(!showGaps)} variant="secondary" className="text-sm">
                {showGaps ? "Hide" : "Details"}
              </Button>
            </div>
            {showGaps && (
              <div className="mt-4 space-y-2">
                {gaps.map((gap, idx) => (
                  <div key={idx} className="p-3 bg-amber-100 rounded-lg text-sm">
                    <div className="font-medium text-amber-800">
                      {formatDate(gap.startDate)} → {formatDate(gap.endDate)}
                    </div>
                    <div className="text-amber-700">{gap.daysMissing} days without activity</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Platform Distribution */}
        {Object.keys(stats.platforms).length > 0 && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Distribution</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.platforms).map(([platform, count]) => {
                const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG["Other"];
                return (
                  <div
                    key={platform}
                    className={`px-4 py-2 rounded-lg border-2 ${config.color} font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                      selectedPlatform === platform ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedPlatform(selectedPlatform === platform ? "all" : platform)}
                  >
                    {config.icon} {platform}: {count}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="platform-filter-select" className="text-sm font-medium text-gray-700">Platform:</label>
            <select
              id="platform-filter-select"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Platforms ({applications.length})</option>
              {Object.keys(stats.platforms).map(platform => (
                <option key={platform} value={platform}>
                  {platform} ({stats.platforms[platform]})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter-select" className="text-sm font-medium text-gray-700">Status:</label>
            <select
              id="status-filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Interested">Interested</option>
              <option value="Applied">Applied</option>
              <option value="Phone Screen">Phone Screen</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing {filteredApplications.length} of {applications.length} applications
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <Card key={app._id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${app._id}`)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {app.title}
                      </h3>
                      <p className="text-gray-600 mb-2">{app.company}</p>
                      
                      {/* Platform Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {app.applicationPlatforms && app.applicationPlatforms.length > 0 ? (
                          app.applicationPlatforms.map((platform, idx) => {
                            const config = PLATFORM_CONFIG[platform.name] || PLATFORM_CONFIG["Other"];
                            return (
                              <div
                                key={idx}
                                className={`px-3 py-1 rounded-full border text-sm font-medium ${config.color} flex items-center gap-1`}
                              >
                                {config.icon} {platform.name}
                                <span className="text-xs opacity-75 ml-1">
                                  ({formatDate(platform.dateApplied)})
                                </span>
                              </div>
                            );
                          })
                        ) : app.primaryPlatform ? (
                          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${(PLATFORM_CONFIG[app.primaryPlatform] || PLATFORM_CONFIG["Other"]).color}`}>
                            {(PLATFORM_CONFIG[app.primaryPlatform] || PLATFORM_CONFIG["Other"]).icon} {app.primaryPlatform}
                          </div>
                        ) : (
                          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${PLATFORM_CONFIG["Manual"].color}`}>
                            {PLATFORM_CONFIG["Manual"].icon} Manual Entry
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {app.location && (
                          <div className="flex items-center gap-1">
                            📍 {app.location}
                          </div>
                        )}
                        {formatSalary(app.salary) && (
                          <div className="flex items-center gap-1">
                            💰 {formatSalary(app.salary)}
                          </div>
                        )}
                        {app.applicationDate && (
                          <div className="flex items-center gap-1">
                            📅 Applied: {formatDate(app.applicationDate)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[app.status] || STATUS_COLORS["Applied"]}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>

                  {/* Consolidation Notice */}
                  {app.applicationPlatforms && app.applicationPlatforms.length > 1 && (
                    <div className="mt-3 p-2 bg-green-50 border-l-4 border-green-500 text-sm text-green-700">
                      ✓ Tracked across {app.applicationPlatforms.length} platforms
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <Card className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
            <p className="text-gray-500 mb-4">
              {gmailStatus.connected 
                ? "Click 'Scan Emails' to import job applications from your Gmail"
                : "Connect your Gmail to automatically import job applications"}
            </p>
            {!gmailStatus.connected && (
              <Button onClick={handleConnectGmail} variant="primary">
                Connect Gmail
              </Button>
            )}
          </Card>
        )}

        {/* Email Import Modal */}
        {showEmailImport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">Import from Email</h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste the contents of a job application confirmation email to automatically extract and import the application details.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-sender-input" className="block text-sm font-medium text-gray-700 mb-1">
                    Sender Email (optional)
                  </label>
                  <input
                    id="email-sender-input"
                    type="email"
                    value={emailData.sender}
                    onChange={(e) => setEmailData({ ...emailData, sender: e.target.value })}
                    placeholder="e.g., jobs-noreply@linkedin.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="email-subject-input" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Subject
                  </label>
                  <input
                    id="email-subject-input"
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    placeholder="e.g., Your application was sent to Google"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="email-body-textarea" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Body *
                  </label>
                  <textarea
                    id="email-body-textarea"
                    value={emailData.body}
                    onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                    placeholder="Paste the email content here..."
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <Button onClick={() => setShowEmailImport(false)} variant="secondary">
                  Cancel
                </Button>
                <Button onClick={handleImportFromEmail} disabled={importing}>
                  {importing ? "Importing..." : "Import Application"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Import Results Modal */}
        {showImportResults && importResults && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">Import Results</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{importResults.imported}</div>
                  <div className="text-sm text-green-600">Imported</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{importResults.consolidated}</div>
                  <div className="text-sm text-blue-600">Merged</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">{importResults.failed}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
              </div>
              
              {importResults.details && importResults.details.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {importResults.details.map((detail, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg text-sm ${
                        detail.status === "imported" ? "bg-green-50 text-green-800" :
                        detail.status === "consolidated" ? "bg-blue-50 text-blue-800" :
                        detail.status === "skipped" ? "bg-gray-50 text-gray-600" :
                        "bg-red-50 text-red-800"
                      }`}
                    >
                      <div className="font-medium">
                        {detail.title} at {detail.company}
                      </div>
                      <div className="text-xs opacity-75">
                        {detail.platform} - {detail.reason || detail.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setShowImportResults(false)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Container>
  );
}
