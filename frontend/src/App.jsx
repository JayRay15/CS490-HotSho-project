import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Breadcrumb from "./components/Breadcrumb";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/auth/Dashboard";
import ProfilePage from "./pages/auth/ProfilePage";
import Jobs from "./pages/auth/Jobs";
import ErrorBoundary from "./components/ErrorBoundary";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Projects from "./pages/auth/Projects";
import Portfolio from "./pages/auth/Portfolio";
import ProjectPublic from "./pages/auth/ProjectPublic";
import ProtectedRoute from "./components/ProtectedRoute";
import ResumeTemplates from "./pages/auth/ResumeTemplates";
import SharedResumeView from "./pages/public/SharedResumeView";
import SalaryResearch from "./components/SalaryResearch";
import SalaryBenchmarksExplorer from "./components/SalaryBenchmarksExplorer";
import SkillGapAnalysis from "./pages/auth/SkillGapAnalysis";
import SkillTrends from "./pages/auth/SkillTrends";
import InterviewChecklist from "./components/InterviewChecklist";
import TechnicalInterviewPrep from "./pages/TechnicalInterviewPrep";
import TechnicalPrepPerformance from "./pages/TechnicalPrepPerformance";
import CodingChallenge from "./components/CodingChallenge";
import SystemDesignPractice from "./components/SystemDesignPractice";
import CaseStudyPractice from "./components/CaseStudyPractice";
import InterviewCoaching from "./pages/InterviewCoaching";
import Network from "./pages/auth/Network";
import WritingPracticePage from "./pages/WritingPracticePage";
import GoalsPage from "./pages/GoalsPage";
import NewGoalPage from "./pages/NewGoalPage";
import EditGoalPage from "./pages/EditGoalPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import InterviewPrepPage from "./pages/InterviewPrepPage.jsx";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Navbar />
        <Breadcrumb />
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
          <Route path="/profile/project/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/portfolio/project/:id" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProjectPublic />} />
          <Route path="/resumes" element={<ProtectedRoute><ResumeTemplates /></ProtectedRoute>} />
          <Route path="/share/:token" element={<SharedResumeView />} />
          <Route path="/salary-research/:jobId" element={<ProtectedRoute><SalaryResearch /></ProtectedRoute>} />
          <Route path="/salary-benchmarks" element={<ProtectedRoute><SalaryBenchmarksExplorer /></ProtectedRoute>} />
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
          <Route path="/writing-practice" element={<ProtectedRoute><WritingPracticePage /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
          <Route path="/goals/new" element={<ProtectedRoute><NewGoalPage /></ProtectedRoute>} />
          <Route path="/goals/:id/edit" element={<ProtectedRoute><EditGoalPage /></ProtectedRoute>} />
          <Route path="/goals/:id" element={<ProtectedRoute><GoalDetailPage /></ProtectedRoute>} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
