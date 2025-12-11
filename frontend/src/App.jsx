import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import Breadcrumb from "./components/Breadcrumb";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// ============================================================================
// Lazy-loaded pages for code splitting
// ============================================================================

// Auth pages - higher priority, load first
const Register = lazy(() => import("./pages/auth/Register"));
const Login = lazy(() => import("./pages/auth/Login"));
const Dashboard = lazy(() => import("./pages/auth/Dashboard"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));

// Core pages
const ProfilePage = lazy(() => import("./pages/auth/ProfilePage"));
const Jobs = lazy(() => import("./pages/auth/Jobs"));
const Projects = lazy(() => import("./pages/auth/Projects"));
const Portfolio = lazy(() => import("./pages/auth/Portfolio"));
const ProjectPublic = lazy(() => import("./pages/auth/ProjectPublic"));
const ResumeTemplates = lazy(() => import("./pages/auth/ResumeTemplates"));
const JobMaterialsPage = lazy(() => import("./pages/auth/JobMaterialsPage"));

// Public/Shared pages
const SharedResumeView = lazy(() => import("./pages/public/SharedResumeView"));
const SharedCoverLetterView = lazy(() => import("./pages/public/SharedCoverLetterView"));
const SharedReportView = lazy(() => import("./pages/SharedReportView"));

// Salary & Offers
const SalaryResearch = lazy(() => import("./components/SalaryResearch"));
const SalaryBenchmarksExplorer = lazy(() => import("./components/SalaryBenchmarksExplorer"));
const SalaryNegotiationPrep = lazy(() => import("./components/SalaryNegotiationPrep"));
const OfferComparison = lazy(() => import("./components/OfferComparison"));

// Skills & Analysis
const SkillGapAnalysis = lazy(() => import("./pages/auth/SkillGapAnalysis"));
const SkillTrends = lazy(() => import("./pages/auth/SkillTrends"));

// Interview Prep
const InterviewChecklist = lazy(() => import("./components/InterviewChecklist"));
const TechnicalInterviewPrep = lazy(() => import("./pages/TechnicalInterviewPrep"));
const TechnicalPrepPerformance = lazy(() => import("./pages/TechnicalPrepPerformance"));
const CodingChallenge = lazy(() => import("./components/CodingChallenge"));
const SystemDesignPractice = lazy(() => import("./components/SystemDesignPractice"));
const CaseStudyPractice = lazy(() => import("./components/CaseStudyPractice"));
const InterviewCoaching = lazy(() => import("./pages/InterviewCoaching"));
const InterviewPrepPage = lazy(() => import("./pages/InterviewPrepPage"));
const InterviewsPage = lazy(() => import("./pages/auth/InterviewsPage"));
const CompanyResearch = lazy(() => import("./pages/interviews/CompanyResearch"));
const MockInterviewStart = lazy(() => import("./pages/interviews/MockInterviewStart"));
const MockInterviewSession = lazy(() => import("./pages/interviews/MockInterviewSession"));
const MockInterviewHistory = lazy(() => import("./pages/interviews/MockInterviewHistory"));
const InterviewPredictionDetail = lazy(() => import("./pages/InterviewPredictionDetail"));

// Network & Mentoring
const Network = lazy(() => import("./pages/auth/Network"));
const MentorsAdvisorsPage = lazy(() => import("./pages/MentorsAdvisorsPage"));
const AdvisorMessagingPage = lazy(() => import("./pages/AdvisorMessagingPage"));
const InformationalInterviewsPage = lazy(() => import("./pages/InformationalInterviews"));
const PeerSupportPage = lazy(() => import("./pages/PeerSupportPage"));

// Lazy load mentor components
const MentorComponents = lazy(() => import("./components/mentors").then(module => ({
  default: { ProgressSharing: module.ProgressSharing, MentorMessaging: module.MentorMessaging }
})));
const ProgressSharing = lazy(() => import("./components/mentors").then(m => ({ default: m.ProgressSharing })));
const MentorMessaging = lazy(() => import("./components/mentors").then(m => ({ default: m.MentorMessaging })));

// Goals & Productivity
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const NewGoalPage = lazy(() => import("./pages/NewGoalPage"));
const EditGoalPage = lazy(() => import("./pages/EditGoalPage"));
const GoalDetailPage = lazy(() => import("./pages/GoalDetailPage"));
const ProductivityAnalysisPage = lazy(() => import("./pages/ProductivityAnalysisPage"));
const WritingPracticePage = lazy(() => import("./pages/WritingPracticePage"));

// Teams
const TeamsPage = lazy(() => import("./pages/TeamsPage"));
const TeamDashboardPage = lazy(() => import("./pages/TeamDashboardPage"));
const TeamSettingsPage = lazy(() => import("./pages/TeamSettingsPage"));

// Reports & Analytics
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const MarketIntelligenceDashboard = lazy(() => import("./components/MarketIntelligenceDashboard"));
const DocumentManagementPage = lazy(() => import("./pages/DocumentManagementPage"));
const MyPerformancePage = lazy(() => import("./pages/MyPerformancePage"));
const PredictiveAnalytics = lazy(() => import("./pages/PredictiveAnalytics"));
const ResponseTimeDashboard = lazy(() => import("./pages/ResponseTimeDashboard"));
const CompetitiveAnalysis = lazy(() => import("./pages/auth/CompetitiveAnalysis"));
const ABTestingPage = lazy(() => import("./pages/auth/ABTestingPage"));

// Settings
const CalendarSettings = lazy(() => import("./pages/auth/CalendarSettings"));
const LinkedInSettings = lazy(() => import("./pages/auth/LinkedInSettings"));

// Maps & Location
const JobMapPage = lazy(() => import("./pages/JobMapPage"));

// Admin
const APIMonitoringDashboard = lazy(() => import("./pages/APIMonitoringDashboard"));
const SystemMonitoringDashboard = lazy(() => import("./pages/SystemMonitoringDashboard"));
const TestErrorPage = lazy(() => import("./pages/TestErrorPage"));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Navbar />
        <Breadcrumb />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Register />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/jobs/:jobId/materials" element={<ProtectedRoute><JobMaterialsPage /></ProtectedRoute>} />
            <Route path="/profile/project/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/portfolio/project/:id" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProjectPublic />} />
            <Route path="/resumes" element={<ProtectedRoute><ResumeTemplates /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharedResumeView />} />
            <Route path="/share/cover-letter/:token" element={<SharedCoverLetterView />} />
            <Route path="/salary-research/:jobId" element={<ProtectedRoute><SalaryResearch /></ProtectedRoute>} />
            <Route path="/salary-negotiation/:jobId" element={<ProtectedRoute><SalaryNegotiationPrep /></ProtectedRoute>} />
            <Route path="/salary-benchmarks" element={<ProtectedRoute><SalaryBenchmarksExplorer /></ProtectedRoute>} />
            <Route path="/offer-comparison" element={<ProtectedRoute><OfferComparison /></ProtectedRoute>} />
            <Route path="/skill-gap-analysis/:jobId" element={<ProtectedRoute><SkillGapAnalysis /></ProtectedRoute>} />
            <Route path="/skill-trends" element={<ProtectedRoute><SkillTrends /></ProtectedRoute>} />
            <Route path="/interview-checklist" element={<ProtectedRoute><InterviewChecklist /></ProtectedRoute>} />
            <Route path="/prep" element={<ProtectedRoute><TechnicalInterviewPrep /></ProtectedRoute>} />
            <Route path="/prep/performance" element={<ProtectedRoute><TechnicalPrepPerformance /></ProtectedRoute>} />
            <Route path="/prep/coding/:challengeId" element={<ProtectedRoute><CodingChallenge /></ProtectedRoute>} />
            <Route path="/prep/system-design/:questionId" element={<ProtectedRoute><SystemDesignPractice /></ProtectedRoute>} />
            <Route path="/prep/case-study/:caseStudyId" element={<ProtectedRoute><CaseStudyPractice /></ProtectedRoute>} />
            <Route path="/technical-prep" element={<ProtectedRoute><TechnicalInterviewPrep /></ProtectedRoute>} />
            <Route path="/technical-prep/performance" element={<ProtectedRoute><TechnicalPrepPerformance /></ProtectedRoute>} />
            <Route path="/technical-prep/coding/:challengeId" element={<ProtectedRoute><CodingChallenge /></ProtectedRoute>} />
            <Route path="/technical-prep/system-design/:questionId" element={<ProtectedRoute><SystemDesignPractice /></ProtectedRoute>} />
            <Route path="/technical-prep/case-study/:caseStudyId" element={<ProtectedRoute><CaseStudyPractice /></ProtectedRoute>} />
            <Route path="/interview-coaching" element={<ProtectedRoute><InterviewCoaching /></ProtectedRoute>} />
            <Route path="/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
            <Route path="/informational-interviews" element={<ProtectedRoute><InformationalInterviewsPage /></ProtectedRoute>} />
            <Route path="/writing-practice" element={<ProtectedRoute><WritingPracticePage /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
            <Route path="/goals/new" element={<ProtectedRoute><NewGoalPage /></ProtectedRoute>} />
            <Route path="/goals/:id/edit" element={<ProtectedRoute><EditGoalPage /></ProtectedRoute>} />
            <Route path="/goals/:id" element={<ProtectedRoute><GoalDetailPage /></ProtectedRoute>} />
            <Route path="/jobs/:jobId/interview-prep" element={<ProtectedRoute><InterviewPrepPage /></ProtectedRoute>} />
            <Route path="/interviews" element={<ProtectedRoute><InterviewsPage /></ProtectedRoute>} />
            <Route path="/interviews/analytics" element={<Navigate to="/interviews?tab=analytics" replace />} />
            <Route path="/interview-predictions" element={<Navigate to="/interviews?tab=predictions" replace />} />
            <Route path="/interviews/:interviewId/company-research" element={<ProtectedRoute><CompanyResearch /></ProtectedRoute>} />
            <Route path="/settings/calendar" element={<ProtectedRoute><CalendarSettings /></ProtectedRoute>} />
            <Route path="/settings/linkedin" element={<ProtectedRoute><LinkedInSettings /></ProtectedRoute>} />
            <Route path="/mock-interviews" element={<ProtectedRoute><MockInterviewHistory /></ProtectedRoute>} />
            <Route path="/mock-interviews/start" element={<ProtectedRoute><MockInterviewStart /></ProtectedRoute>} />
            <Route path="/mock-interviews/:sessionId" element={<ProtectedRoute><MockInterviewSession /></ProtectedRoute>} />
            <Route path="/productivity" element={<ProtectedRoute><ProductivityAnalysisPage /></ProtectedRoute>} />
            <Route path="/productivity/tracker" element={<ProtectedRoute><ProductivityAnalysisPage /></ProtectedRoute>} />
            <Route path="/productivity/analysis" element={<ProtectedRoute><ProductivityAnalysisPage /></ProtectedRoute>} />
            <Route path="/productivity/analysis/:analysisId" element={<ProtectedRoute><ProductivityAnalysisPage /></ProtectedRoute>} />
            <Route path="/interview-predictions/:interviewId" element={<ProtectedRoute><InterviewPredictionDetail /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/reports/shared/:token" element={<SharedReportView />} />
            <Route path="/documents" element={<ProtectedRoute><DocumentManagementPage /></ProtectedRoute>} />
            <Route path="/market-intelligence" element={<ProtectedRoute><MarketIntelligenceDashboard /></ProtectedRoute>} />
            <Route path="/my-performance" element={<ProtectedRoute><MyPerformancePage /></ProtectedRoute>} />
            <Route path="/performance-dashboard" element={<Navigate to="/my-performance" replace />} />
            <Route path="/application-success" element={<Navigate to="/my-performance?tab=success" replace />} />
            <Route path="/interview-performance" element={<Navigate to="/interviews?tab=performance" replace />} />
            <Route path="/predictive-analytics" element={<ProtectedRoute><PredictiveAnalytics /></ProtectedRoute>} />
            <Route path="/response-time" element={<ProtectedRoute><ResponseTimeDashboard /></ProtectedRoute>} />
            <Route path="/competitive-analysis" element={<ProtectedRoute><CompetitiveAnalysis /></ProtectedRoute>} />
            <Route path="/ab-testing" element={<ProtectedRoute><ABTestingPage /></ProtectedRoute>} />
            <Route path="/mentors-advisors" element={<ProtectedRoute><MentorsAdvisorsPage /></ProtectedRoute>} />
            <Route path="/mentors" element={<Navigate to="/mentors-advisors" replace />} />
            <Route path="/mentors/progress" element={<ProtectedRoute><ProgressSharing /></ProtectedRoute>} />
            <Route path="/mentors/messages" element={<ProtectedRoute><MentorMessaging /></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
            <Route path="/teams/:teamId" element={<ProtectedRoute><TeamDashboardPage /></ProtectedRoute>} />
            <Route path="/teams/:teamId/settings" element={<ProtectedRoute><TeamSettingsPage /></ProtectedRoute>} />
            <Route path="/advisors" element={<Navigate to="/mentors-advisors?tab=advisors" replace />} />
            <Route path="/advisors/messages" element={<ProtectedRoute><AdvisorMessagingPage /></ProtectedRoute>} />
            <Route path="/peer-support" element={<ProtectedRoute><PeerSupportPage /></ProtectedRoute>} />
            <Route path="/job-map" element={<ProtectedRoute><JobMapPage /></ProtectedRoute>} />
            <Route path="/admin/api-monitoring" element={<ProtectedRoute><APIMonitoringDashboard /></ProtectedRoute>} />
            <Route path="/admin/system-monitoring" element={<ProtectedRoute><SystemMonitoringDashboard /></ProtectedRoute>} />
            <Route path="/admin/test-errors" element={<ProtectedRoute><TestErrorPage /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;


