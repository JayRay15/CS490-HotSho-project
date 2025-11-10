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
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
