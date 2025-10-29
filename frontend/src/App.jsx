import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Breadcrumb from "./components/Breadcrumb";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/auth/Dashboard";
import ProfilePage from "./pages/auth/ProfilePage";
import ErrorBoundary from "./components/ErrorBoundary";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Projects from "./pages/auth/Projects";
import Portfolio from "./pages/auth/Portfolio";
import ProjectPublic from "./pages/auth/ProjectPublic";

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/project/:id" element={<ProfilePage />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/project/:id" element={<Portfolio />} />
          <Route path="/projects/:id" element={<ProjectPublic />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
