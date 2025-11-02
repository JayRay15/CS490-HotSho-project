import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setAuthToken } from "../../api/axios";
import { fetchTemplates, createTemplate as apiCreateTemplate, updateTemplate as apiUpdateTemplate, deleteTemplate as apiDeleteTemplate, importTemplate as apiImportTemplate } from "../../api/resumeTemplates";
import { fetchResumes, updateResume as apiUpdateResume, deleteResume as apiDeleteResume } from "../../api/resumes";
import { generateAIResume, regenerateResumeSection } from "../../api/aiResume";
import api from "../../api/axios";
import Container from "../../components/Container";
import Card from "../../components/Card";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import LoadingSpinner from "../../components/LoadingSpinner";

const TEMPLATE_TYPES = [
  { value: "chronological", label: "Chronological" },
  { value: "functional", label: "Functional" },
  { value: "hybrid", label: "Hybrid" },
];

// Simple resume preview tile (Google Docs style)
function ResumeTile({ resume, onView, onDelete }) {
  const theme = { primary: "#4F5348", text: "#222", bg: "#FFF" };
  
  return (
    <Card variant="outlined" interactive className="overflow-hidden">
      {/* Preview Area */}
      <div 
        className="h-64 p-4 flex flex-col justify-start border-b cursor-pointer"
        style={{ backgroundColor: "#F9F9F9" }}
        onClick={onView}
      >
        <div className="text-xs font-bold mb-2" style={{ color: theme.primary }}>
          {resume.name || "Untitled Resume"}
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          {/* Contact Info Preview */}
          {resume.sections?.contactInfo && (
            <div className="text-[8px] text-gray-700 font-semibold">
              {resume.sections.contactInfo.name || "Name"}
            </div>
          )}
          
          {/* Summary Preview */}
          {resume.sections?.summary && (
            <div className="text-[7px] text-gray-600 leading-tight line-clamp-2">
              {resume.sections.summary.substring(0, 100)}...
            </div>
          )}
          
          {/* Experience Preview */}
          {resume.sections?.experience && resume.sections.experience.length > 0 && (
            <div className="mt-2">
              <div className="text-[7px] text-gray-700 font-semibold">
                {resume.sections.experience[0].company}
              </div>
              <div className="text-[6px] text-gray-500 italic">
                {resume.sections.experience[0].title}
              </div>
            </div>
          )}
          
          {/* Skills Preview */}
          {resume.sections?.skills && resume.sections.skills.length > 0 && (
            <div className="mt-2 text-[6px] text-gray-600">
              {resume.sections.skills.slice(0, 3).join(' • ')}
              {resume.sections.skills.length > 3 && ' ...'}
            </div>
          )}
        </div>
      </div>
      
      {/* Info & Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{resume.name}</p>
            <p className="text-xs text-gray-500">Modified {new Date(resume.updatedAt).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2 ml-2">
            <button
              onClick={(e) => { e.stopPropagation(); onView(); }}
              className="text-xs px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              View
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-xs px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Template preview for management modal
function TemplatePreviewCard({ template, isDefault, onSetDefault, onCustomize, onShare, onDelete, onPreview }) {
  const theme = template.theme || { colors: { primary: "#4F5348", text: "#222" } };
  
  return (
    <Card variant="outlined" className={isDefault ? 'ring-2 ring-green-500' : ''}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold">{template.name}</div>
          <div className="text-xs text-gray-500 capitalize">{template.type}</div>
        </div>
        {isDefault && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#DCFCE7', color: '#166534', borderColor: '#BBF7D0' }}>
            Default
          </span>
        )}
      </div>

      {/* Mini preview - Document style */}
      <div 
        className="border rounded-lg p-4 mb-3 h-40 overflow-hidden cursor-pointer hover:border-blue-400 transition bg-white shadow-sm"
        onClick={onPreview}
      >
        {/* Sample resume header */}
        <div className="text-center mb-2 pb-1 border-b" style={{ borderColor: theme.colors?.primary }}>
          <div className="text-xs font-bold" style={{ color: theme.colors?.primary || '#4F5348', fontFamily: 'Georgia, serif' }}>
            John Doe
          </div>
          <div className="text-[8px] text-gray-500">john.doe@email.com • (555) 123-4567</div>
        </div>
        
        {/* Sample section */}
        <div className="mb-2">
          <div className="text-[9px] font-bold mb-1 uppercase" style={{ color: theme.colors?.primary || '#4F5348' }}>
            Experience
          </div>
          <div className="text-[7px] font-semibold text-gray-800">Senior Developer</div>
          <div className="text-[6px] text-gray-500 italic mb-1">Tech Company Inc.</div>
          <div className="space-y-0.5">
            <div className="flex items-start gap-1">
              <div className="w-1 h-1 rounded-full bg-gray-400 mt-0.5 flex-shrink-0"></div>
              <div className="text-[6px] text-gray-700 leading-tight">Led development of key features</div>
            </div>
            <div className="flex items-start gap-1">
              <div className="w-1 h-1 rounded-full bg-gray-400 mt-0.5 flex-shrink-0"></div>
              <div className="text-[6px] text-gray-700 leading-tight">Improved system performance</div>
            </div>
          </div>
        </div>

        {/* Sample skills */}
        <div>
          <div className="text-[9px] font-bold mb-1 uppercase" style={{ color: theme.colors?.primary || '#4F5348' }}>
            Skills
          </div>
          <div className="text-[6px] text-gray-700">JavaScript • React • Node.js • Python • SQL</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!isDefault && (
          <button
            onClick={onSetDefault}
            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Set Default
          </button>
        )}
        <button
          onClick={onCustomize}
          className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
        >
          Customize
        </button>
        <button
          onClick={onShare}
          className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
        >
          {template.isShared ? 'Unshare' : 'Share'}
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Delete
        </button>
      </div>
    </Card>
  );
}

// Full-page template preview modal
function TemplatePreviewModal({ template, onClose }) {
  if (!template) return null;
  const theme = template.theme || { colors: { primary: "#4F5348", text: "#222", muted: "#666" } };
  const layout = template.layout || { sectionsOrder: ["summary","experience","skills","education","projects"] };
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-2xl font-heading font-semibold">Preview: {template.name}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-8 bg-gray-100">
          {/* Simulated resume page - Document style */}
          <div 
            className="bg-white shadow-lg mx-auto"
            style={{ maxWidth: "8.5in", minHeight: "11in", padding: "0.75in" }}
          >
            {/* Header */}
            <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: theme.colors?.primary }}>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#2C2C2C', fontFamily: 'Georgia, serif' }}>
                JANE DOE
              </h1>
              <p className="text-sm" style={{ color: '#666', fontFamily: 'Times New Roman, serif' }}>
                jane.doe@email.com • (555) 987-6543 • New York, NY • linkedin.com/in/janedoe
              </p>
            </div>

            {layout.sectionsOrder?.map((section) => (
              <div key={section} className="mb-6">
                <h2 
                  className="text-lg font-bold mb-3 uppercase tracking-wide"
                  style={{ color: theme.colors?.primary || '#4F5348', fontFamily: 'Georgia, serif' }}
                >
                  {section === "summary" && "Professional Summary"}
                  {section === "experience" && "Professional Experience"}
                  {section === "skills" && "Technical Skills"}
                  {section === "education" && "Education"}
                  {section === "projects" && "Projects"}
                  {!["summary", "experience", "skills", "education", "projects"].includes(section) && section}
                </h2>
                <div className="text-sm" style={{ color: '#2C2C2C' }}>
                  {section === "summary" && (
                    <p style={{ textAlign: 'justify', lineHeight: '1.6', fontFamily: 'Times New Roman, serif' }}>
                      Results-oriented professional with 8+ years of experience driving innovation and leading cross-functional teams. 
                      Proven track record of delivering high-impact projects and exceeding organizational goals through strategic thinking 
                      and collaborative problem-solving. Expertise in leveraging cutting-edge technologies to optimize processes and 
                      enhance business outcomes.
                    </p>
                  )}
                  {section === "experience" && (
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>Senior Software Engineer</h3>
                          <span className="text-xs font-semibold" style={{ color: '#666' }}>Jan 2021 - Present</span>
                        </div>
                        <p className="text-sm italic mb-2" style={{ color: '#555', fontFamily: 'Georgia, serif' }}>Tech Solutions Inc., New York, NY</p>
                        <ul className="space-y-1 ml-5" style={{ listStyleType: 'disc', fontFamily: 'Times New Roman, serif' }}>
                          <li>Architected and deployed scalable microservices infrastructure serving 500K+ daily active users</li>
                          <li>Led team of 6 engineers in delivering mission-critical features, improving system performance by 45%</li>
                          <li>Implemented CI/CD pipelines reducing deployment time by 60% and minimizing production incidents</li>
                        </ul>
                      </div>
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>Software Developer</h3>
                          <span className="text-xs font-semibold" style={{ color: '#666' }}>Jun 2018 - Dec 2020</span>
                        </div>
                        <p className="text-sm italic mb-2" style={{ color: '#555', fontFamily: 'Georgia, serif' }}>Digital Innovations LLC, San Francisco, CA</p>
                        <ul className="space-y-1 ml-5" style={{ listStyleType: 'disc', fontFamily: 'Times New Roman, serif' }}>
                          <li>Developed full-stack web applications using modern frameworks, increasing user engagement by 35%</li>
                          <li>Collaborated with product team to design and implement customer-facing features for B2B platform</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  {section === "skills" && (
                    <p style={{ lineHeight: '1.6', fontFamily: 'Times New Roman, serif' }}>
                      JavaScript • TypeScript • React • Node.js • Python • Java • MongoDB • PostgreSQL • AWS • Docker • 
                      Kubernetes • CI/CD • Git • Agile/Scrum • REST APIs • GraphQL • Microservices • System Design
                    </p>
                  )}
                  {section === "education" && (
                    <div>
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>Bachelor of Science in Computer Science</h3>
                        <span className="text-xs font-semibold" style={{ color: '#666' }}>May 2018</span>
                      </div>
                      <p className="text-sm italic" style={{ color: '#555', fontFamily: 'Georgia, serif' }}>University of California, Berkeley</p>
                      <p className="text-sm mt-1" style={{ fontFamily: 'Times New Roman, serif' }}>GPA: 3.85/4.0 • Dean's List • Magna Cum Laude</p>
                    </div>
                  )}
                  {section === "projects" && (
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>E-Commerce Platform Redesign</h3>
                        <p className="text-xs italic mb-1" style={{ color: '#666', fontFamily: 'Times New Roman, serif' }}>
                          Technologies: React, Redux, Node.js, Express, PostgreSQL, Stripe API
                        </p>
                        <p style={{ lineHeight: '1.6', fontFamily: 'Times New Roman, serif' }}>
                          Built responsive full-stack e-commerce application with payment processing, inventory management, 
                          and real-time analytics dashboard. Achieved 99.9% uptime and handled 50K+ monthly transactions.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>AI-Powered Task Management System</h3>
                        <p className="text-xs italic mb-1" style={{ color: '#666', fontFamily: 'Times New Roman, serif' }}>
                          Technologies: Python, TensorFlow, React, MongoDB, AWS Lambda
                        </p>
                        <p style={{ lineHeight: '1.6', fontFamily: 'Times New Roman, serif' }}>
                          Developed intelligent task prioritization system using machine learning algorithms. 
                          Improved team productivity by 30% through automated scheduling and smart notifications.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResumeTemplates() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [resumes, setResumes] = useState([]);
  
  // Template Management Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", type: "chronological" });
  const [customizeTemplate, setCustomizeTemplate] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingResume, setDeletingResume] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // AI Resume Creation Modal State
  const [showAIResumeModal, setShowAIResumeModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [aiFormData, setAIFormData] = useState({
    name: "",
    jobId: "",
    templateId: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  
  // View Resume Modal State
  const [showViewResumeModal, setShowViewResumeModal] = useState(false);
  const [viewingResume, setViewingResume] = useState(null);
  const [regeneratingSection, setRegeneratingSection] = useState(null);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState(null);

  const authWrap = async () => {
    const token = await getToken();
    setAuthToken(token);
  };

  const loadAll = async () => {
    await authWrap();
    const [tpls, res] = await Promise.all([fetchTemplates(), fetchResumes()]);
    setTemplates(tpls.data.data.templates || []);
    setResumes(res.data.data.resumes || []);
  };

  const loadJobs = async () => {
    try {
      await authWrap();
      const response = await api.get("/api/jobs");
      // Filter for saved and applied jobs
      const savedAppliedJobs = response.data.data.jobs.filter(
        job => job.status === "Interested" || job.status === "Applied"
      );
      setJobs(savedAppliedJobs);
    } catch (err) {
      console.error("Failed to load jobs:", err);
      setJobs([]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadAll();
      } catch (e) {
        console.error(e);
        alert("Failed to load resume data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Resume handlers
  const handleViewResume = (resume) => {
    setViewingResume(resume);
    setShowViewResumeModal(true);
  };

  const handleRegenerateSection = async (section) => {
    if (!viewingResume || !viewingResume.metadata?.generatedAt) return;
    
    setRegeneratingSection(section);
    try {
      await authWrap();
      const response = await regenerateResumeSection(viewingResume._id, section);
      
      // Update the viewing resume with new content
      const updatedResume = response.data.data.resume;
      setViewingResume(updatedResume);
      
      // Also update in the resumes list
      setResumes(prev => prev.map(r => r._id === updatedResume._id ? updatedResume : r));
      
      // Show success banner
      setSuccessMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} regenerated successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error(`Failed to regenerate ${section}:`, err);
      alert(`Failed to regenerate ${section}. Please try again.`);
    } finally {
      setRegeneratingSection(null);
    }
  };

  const handleOpenAIResumeModal = async () => {
    setShowAIResumeModal(true);
    setGenerationError(null);
    setAIFormData({ name: "", jobId: "", templateId: "" });
    await loadJobs();
  };

  const handleGenerateAIResume = async (e) => {
    e.preventDefault();
    setGenerationError(null);
    
    if (!aiFormData.name || !aiFormData.jobId || !aiFormData.templateId) {
      setGenerationError("Please fill in all fields");
      return;
    }

    setIsGenerating(true);
    try {
      await authWrap();
      const response = await generateAIResume(
        aiFormData.jobId,
        aiFormData.templateId,
        aiFormData.name
      );
      
      // Success!
      setShowAIResumeModal(false);
      setAIFormData({ name: "", jobId: "", templateId: "" });
      await loadAll();
      
      // Show success banner
      setSuccessMessage(`Resume "${aiFormData.name}" generated successfully with AI!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("AI generation error:", err);
      setGenerationError(
        err.response?.data?.message || "Failed to generate resume. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteResumeClick = (resume) => {
    setDeletingResume(resume);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingResume) return;
    
    setIsDeleting(true);
    try {
      await authWrap();
      await apiDeleteResume(deletingResume._id);
      setShowDeleteModal(false);
      setDeletingResume(null);
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to delete resume");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setDeletingResume(null);
    }
  };

  // Template handlers
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      await authWrap();
      await apiCreateTemplate({ name: newTemplate.name, type: newTemplate.type });
      setShowCreateTemplate(false);
      setNewTemplate({ name: "", type: "chronological" });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to create template");
    }
  };

  const handleSetDefault = async (tpl) => {
    try {
      await authWrap();
      await apiUpdateTemplate(tpl._id, { isDefault: true });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to set default template");
    }
  };

  const handleCustomizeSave = async () => {
    try {
      const { _id, name, type, layout, theme } = customizeTemplate;
      await authWrap();
      await apiUpdateTemplate(_id, { name, type, layout, theme });
      setCustomizeTemplate(null);
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to update template");
    }
  };

  const handleToggleShare = async (tpl) => {
    try {
      await authWrap();
      await apiUpdateTemplate(tpl._id, { isShared: !tpl.isShared });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to toggle sharing");
    }
  };

  const handleDeleteTemplate = async (tpl) => {
    if (!confirm(`Delete template "${tpl.name}"?`)) return;
    try {
      await authWrap();
      await apiDeleteTemplate(tpl._id);
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to delete template");
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJson);
      await authWrap();
      await apiImportTemplate(parsed);
      setShowImport(false);
      setImportJson("");
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Invalid JSON for import");
    }
  };

  if (loading) return <LoadingSpinner fullScreen={true} text="Loading resumes..." />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E4E6E0" }}>
      <Container level={1} className="pt-12 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-4 border rounded-lg" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <p className="font-medium" style={{ color: '#166534' }}>{successMessage}</p>
            </div>
          )}

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: "#4F5348" }}>
                My Resumes
              </h1>
              <p className="text-sm" style={{ color: "#656A5C" }}>
                Create and manage your resume versions
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleOpenAIResumeModal}
                className="px-4 py-2 text-white rounded-lg transition flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: '#777C6D' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Resume</span>
              </button>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-4 py-2 text-white rounded-lg transition flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: '#777C6D' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <span>Manage Templates</span>
              </button>
            </div>
          </div>

          {/* Resumes Grid */}
          {resumes.length === 0 ? (
            <Card variant="elevated" className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">No resumes yet</p>
                <p className="text-sm">Click "Add Resume" to create your first resume</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {resumes.map((resume) => (
                <ResumeTile
                  key={resume._id}
                  resume={resume}
                  onView={() => handleViewResume(resume)}
                  onDelete={() => handleDeleteResumeClick(resume)}
                />
              ))}
            </div>
          )}
        </div>
      </Container>

      {/* Template Management Modal */}
      {showTemplateModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowTemplateModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-2xl font-heading font-semibold">Manage Templates</h3>
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => setShowImport(true)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Import Template
                </button>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Create Template Button */}
              <div className="mb-4">
                <button
                  onClick={() => setShowCreateTemplate(true)}
                  className="px-4 py-2 text-white rounded-lg transition flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: '#777C6D' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create New Template</span>
                </button>
              </div>

              {/* Templates Gallery */}
              {templates.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No templates available</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((tpl) => (
                    <TemplatePreviewCard
                      key={tpl._id}
                      template={tpl}
                      isDefault={tpl.isDefault}
                      onSetDefault={() => handleSetDefault(tpl)}
                      onCustomize={() => setCustomizeTemplate(tpl)}
                      onShare={() => handleToggleShare(tpl)}
                      onDelete={() => handleDeleteTemplate(tpl)}
                      onPreview={() => setPreviewTemplate(tpl)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[60] p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowCreateTemplate(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-2xl font-heading font-semibold">Create New Template</h3>
              <button
                onClick={() => setShowCreateTemplate(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleCreateTemplate} className="space-y-6">
                <div>
                  <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="templateName"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="templateType" className="block text-sm font-medium text-gray-700 mb-2">
                    Template Type <span className="text-red-500">*</span>
                  </label>
                  <select 
                    id="templateType"
                    value={newTemplate.type} 
                    onChange={(e) => setNewTemplate({...newTemplate, type: e.target.value})} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {TEMPLATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 -mx-6 -mb-6 mt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateTemplate(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white rounded-lg transition"
                    style={{ backgroundColor: '#777C6D' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                  >
                    Create Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customize Template Modal */}
      {customizeTemplate && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[60] p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setCustomizeTemplate(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-2xl font-heading font-semibold">Customize Template: {customizeTemplate.name}</h3>
              <button
                onClick={() => setCustomizeTemplate(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customizeName" className="block text-sm font-medium text-gray-700 mb-2">
                      Template Name
                    </label>
                    <input
                      type="text"
                      id="customizeName"
                      value={customizeTemplate.name}
                      onChange={(e) => setCustomizeTemplate({...customizeTemplate, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="customizeType" className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select 
                      id="customizeType"
                      value={customizeTemplate.type} 
                      onChange={(e) => setCustomizeTemplate({...customizeTemplate, type: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {TEMPLATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-lg font-heading font-semibold mb-3">Theme Colors</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                      <input 
                        type="color"
                        id="primaryColor"
                        value={customizeTemplate.theme?.colors?.primary || "#4F5348"} 
                        onChange={(e) => setCustomizeTemplate({
                          ...customizeTemplate, 
                          theme: { 
                            ...(customizeTemplate.theme||{}), 
                            colors: { ...(customizeTemplate.theme?.colors||{}), primary: e.target.value }
                          }
                        })}
                        className="w-full h-10 rounded-lg border border-gray-300"
                      />
                    </div>
                    <div>
                      <label htmlFor="textColor" className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                      <input 
                        type="color"
                        id="textColor"
                        value={customizeTemplate.theme?.colors?.text || "#222222"} 
                        onChange={(e) => setCustomizeTemplate({
                          ...customizeTemplate, 
                          theme: { 
                            ...(customizeTemplate.theme||{}), 
                            colors: { ...(customizeTemplate.theme?.colors||{}), text: e.target.value }
                          }
                        })}
                        className="w-full h-10 rounded-lg border border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-lg font-heading font-semibold mb-3">Layout</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="sectionOrder" className="block text-sm font-medium text-gray-700 mb-2">
                        Section Order (comma-separated)
                      </label>
                      <input 
                        type="text"
                        id="sectionOrder"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        value={(customizeTemplate.layout?.sectionsOrder||[]).join(", ")} 
                        onChange={(e) => setCustomizeTemplate({
                          ...customizeTemplate, 
                          layout: { 
                            ...(customizeTemplate.layout||{}), 
                            sectionsOrder: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) 
                          }
                        })} 
                        placeholder="summary, experience, skills, education, projects"
                      />
                    </div>
                    <div>
                      <label htmlFor="spacing" className="block text-sm font-medium text-gray-700 mb-2">
                        Spacing (px)
                      </label>
                      <input
                        type="number"
                        id="spacing"
                        value={customizeTemplate.theme?.spacing || 8}
                        onChange={(e) => setCustomizeTemplate({
                          ...customizeTemplate,
                          theme: {
                            ...(customizeTemplate.theme||{}),
                            spacing: parseInt(e.target.value)||8
                          }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 -mx-6 -mb-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={() => setCustomizeTemplate(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(customizeTemplate)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={handleCustomizeSave}
                  className="px-4 py-2 text-white rounded-lg transition"
                  style={{ backgroundColor: '#777C6D' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Template Modal */}
      {showImport && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[60] p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowImport(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-2xl font-heading font-semibold">Import Template (JSON)</h3>
              <button
                onClick={() => setShowImport(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleImport} className="space-y-6">
                <div>
                  <label htmlFor="importJson" className="block text-sm font-medium text-gray-700 mb-2">
                    Paste Template JSON <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    id="importJson"
                    className="w-full border border-gray-300 rounded-lg p-4 h-64 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder='{"name":"My Template","type":"hybrid","layout":{"sectionsOrder":["summary","skills","experience"]},"theme":{"colors":{"primary":"#2a7"}}}' 
                    value={importJson} 
                    onChange={(e) => setImportJson(e.target.value)} 
                    required
                  />
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 -mx-6 -mb-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowImport(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white rounded-lg transition"
                    style={{ backgroundColor: '#777C6D' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                  >
                    Import Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal 
          template={previewTemplate} 
          onClose={() => setPreviewTemplate(null)} 
        />
      )}

      {/* AI Resume Creation Modal */}
      {showAIResumeModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => !isGenerating && setShowAIResumeModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h3 className="text-2xl font-heading font-semibold">Create Resume with AI</h3>
                <p className="text-sm text-gray-600 mt-1">Generate tailored resume content based on a job posting</p>
              </div>
              <button
                onClick={() => setShowAIResumeModal(false)}
                disabled={isGenerating}
                className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleGenerateAIResume} className="space-y-6">
                {/* Resume Name */}
                <div>
                  <label htmlFor="resumeName" className="block text-sm font-medium text-gray-700 mb-2">
                    Resume Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="resumeName"
                    value={aiFormData.name}
                    onChange={(e) => setAIFormData({...aiFormData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Software Engineer at Google"
                    required
                    disabled={isGenerating}
                  />
                </div>

                {/* Job Selection */}
                <div>
                  <label htmlFor="jobSelect" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Job to Tailor For <span className="text-red-500">*</span>
                  </label>
                  {jobs.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        No saved or applied jobs found. Please save or apply to jobs first.
                      </p>
                    </div>
                  ) : (
                    <select
                      id="jobSelect"
                      value={aiFormData.jobId}
                      onChange={(e) => setAIFormData({...aiFormData, jobId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={isGenerating}
                    >
                      <option value="">-- Select a job --</option>
                      {jobs.map((job) => (
                        <option key={job._id} value={job._id}>
                          {job.title} at {job.company} ({job.status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Template Selection */}
                <div>
                  <label htmlFor="templateSelect" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Template <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="templateSelect"
                    value={aiFormData.templateId}
                    onChange={(e) => setAIFormData({...aiFormData, templateId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isGenerating}
                  >
                    <option value="">-- Select a template --</option>
                    {templates.map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.name} ({template.type})
                        {template.isDefault ? " - Default" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AI Features Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">AI will generate:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Tailored professional summary</li>
                        <li>• Achievement-focused experience bullets</li>
                        <li>• Relevant skills from your profile</li>
                        <li>• ATS-optimized keywords</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {generationError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{generationError}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 -mx-6 -mb-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAIResumeModal(false)}
                    disabled={isGenerating}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating || jobs.length === 0}
                    className="px-4 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    style={{ backgroundColor: isGenerating ? '#9CA3AF' : '#777C6D' }}
                    onMouseOver={(e) => !isGenerating && (e.currentTarget.style.backgroundColor = '#656A5C')}
                    onMouseOut={(e) => !isGenerating && (e.currentTarget.style.backgroundColor = '#777C6D')}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating with AI...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Generate Resume</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingResume && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-heading font-semibold text-gray-900">Confirm Deletion</h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this resume?
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900">{deletingResume.name}</p>
                <p className="text-sm text-gray-600">Modified {new Date(deletingResume.updatedAt).toLocaleDateString()}</p>
              </div>
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Resume Modal */}
      {showViewResumeModal && viewingResume && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowViewResumeModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-heading font-semibold text-gray-900">{viewingResume.name}</h3>
              </div>
              <button
                onClick={() => setShowViewResumeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Document Style */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
              {/* Paper-like Resume Document */}
              <div className="max-w-[8.5in] mx-auto bg-white shadow-lg" style={{ minHeight: '11in', padding: '0.75in' }}>
                
                {/* Resume Header */}
                <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: '#4F5348' }}>
                  <h1 className="text-3xl font-bold mb-2" style={{ color: '#2C2C2C', fontFamily: 'Georgia, serif' }}>
                    {viewingResume.sections?.contactInfo?.name || 'Your Name'}
                  </h1>
                  <div className="text-sm flex flex-wrap justify-center gap-2" style={{ color: '#666', fontFamily: 'Times New Roman, serif' }}>
                    {viewingResume.sections?.contactInfo?.email && (
                      <span>{viewingResume.sections.contactInfo.email}</span>
                    )}
                    {viewingResume.sections?.contactInfo?.phone && (
                      <>
                        {viewingResume.sections?.contactInfo?.email && <span>•</span>}
                        <span>{viewingResume.sections.contactInfo.phone}</span>
                      </>
                    )}
                    {viewingResume.sections?.contactInfo?.location && (
                      <>
                        {(viewingResume.sections?.contactInfo?.email || viewingResume.sections?.contactInfo?.phone) && <span>•</span>}
                        <span>{viewingResume.sections.contactInfo.location}</span>
                      </>
                    )}
                  </div>
                  {/* Links row */}
                  {(viewingResume.sections?.contactInfo?.linkedin || 
                    viewingResume.sections?.contactInfo?.github || 
                    viewingResume.sections?.contactInfo?.website) && (
                    <div className="text-xs flex flex-wrap justify-center gap-2 mt-1" style={{ color: '#4A5568' }}>
                      {viewingResume.sections?.contactInfo?.linkedin && (
                        <a 
                          href={viewingResume.sections.contactInfo.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          LinkedIn
                        </a>
                      )}
                      {viewingResume.sections?.contactInfo?.github && (
                        <>
                          {viewingResume.sections?.contactInfo?.linkedin && <span>•</span>}
                          <a 
                            href={viewingResume.sections.contactInfo.github} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            GitHub
                          </a>
                        </>
                      )}
                      {viewingResume.sections?.contactInfo?.website && (
                        <>
                          {(viewingResume.sections?.contactInfo?.linkedin || viewingResume.sections?.contactInfo?.github) && <span>•</span>}
                          <a 
                            href={viewingResume.sections.contactInfo.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            Portfolio
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Professional Summary */}
                {viewingResume.sections?.summary && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-lg font-bold uppercase tracking-wide" style={{ color: '#4F5348', fontFamily: 'Georgia, serif' }}>
                        Professional Summary
                      </h2>
                      {viewingResume.metadata?.generatedAt && (
                        <button
                          onClick={() => handleRegenerateSection('summary')}
                          disabled={regeneratingSection === 'summary'}
                          className="print:hidden text-xs px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition disabled:opacity-50"
                        >
                          {regeneratingSection === 'summary' ? '⟳ Regenerating...' : '⟳ Regenerate'}
                        </button>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#2C2C2C', textAlign: 'justify', fontFamily: 'Times New Roman, serif' }}>
                      {viewingResume.sections.summary}
                    </p>
                  </div>
                )}

                {/* Experience Section */}
                {viewingResume.sections?.experience && viewingResume.sections.experience.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-lg font-bold uppercase tracking-wide" style={{ color: '#4F5348', fontFamily: 'Georgia, serif' }}>
                        Professional Experience
                      </h2>
                      {viewingResume.metadata?.generatedAt && (
                        <button
                          onClick={() => handleRegenerateSection('experience')}
                          disabled={regeneratingSection === 'experience'}
                          className="print:hidden text-xs px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition disabled:opacity-50"
                        >
                          {regeneratingSection === 'experience' ? '⟳ Regenerating...' : '⟳ Regenerate'}
                        </button>
                      )}
                    </div>
                    <div className="space-y-5">
                      {viewingResume.sections.experience.map((job, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="text-base font-bold" style={{ color: '#2C2C2C', fontFamily: 'Georgia, serif' }}>
                              {job.jobTitle}
                            </h3>
                            <span className="text-xs font-semibold" style={{ color: '#666', fontFamily: 'Times New Roman, serif' }}>
                              {job.startDate} - {job.isCurrentPosition ? 'Present' : job.endDate}
                            </span>
                          </div>
                          <p className="text-sm italic mb-2" style={{ color: '#555', fontFamily: 'Georgia, serif' }}>
                            {job.company}
                          </p>
                          {job.bullets && job.bullets.length > 0 && (
                            <ul className="space-y-1 ml-5" style={{ listStyleType: 'disc' }}>
                              {job.bullets.map((bullet, bulletIdx) => (
                                <li key={bulletIdx} className="text-sm leading-relaxed" style={{ color: '#2C2C2C', fontFamily: 'Times New Roman, serif' }}>
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Section */}
                {viewingResume.sections?.skills && viewingResume.sections.skills.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-lg font-bold uppercase tracking-wide" style={{ color: '#4F5348', fontFamily: 'Georgia, serif' }}>
                        Technical Skills
                      </h2>
                      {viewingResume.metadata?.generatedAt && (
                        <button
                          onClick={() => handleRegenerateSection('skills')}
                          disabled={regeneratingSection === 'skills'}
                          className="print:hidden text-xs px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition disabled:opacity-50"
                        >
                          {regeneratingSection === 'skills' ? '⟳ Regenerating...' : '⟳ Regenerate'}
                        </button>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#2C2C2C', fontFamily: 'Times New Roman, serif' }}>
                      {viewingResume.sections.skills.map((skill, idx) => (
                        typeof skill === 'string' ? skill : skill.name || skill
                      )).join(' • ')}
                    </p>
                  </div>
                )}

                {/* Education Section */}
                {viewingResume.sections?.education && viewingResume.sections.education.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: '#4F5348', fontFamily: 'Georgia, serif' }}>
                      Education
                    </h2>
                    <div className="space-y-3">
                      {viewingResume.sections.education.map((edu, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between items-baseline">
                            <h3 className="text-base font-bold" style={{ color: '#2C2C2C', fontFamily: 'Georgia, serif' }}>
                              {edu.degree} in {edu.fieldOfStudy}
                            </h3>
                            <span className="text-xs font-semibold" style={{ color: '#666', fontFamily: 'Times New Roman, serif' }}>
                              {edu.graduationYear}
                            </span>
                          </div>
                          <p className="text-sm italic" style={{ color: '#555', fontFamily: 'Georgia, serif' }}>
                            {edu.institution}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects Section */}
                {viewingResume.sections?.projects && viewingResume.sections.projects.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: '#4F5348', fontFamily: 'Georgia, serif' }}>
                      Projects
                    </h2>
                    <div className="space-y-3">
                      {viewingResume.sections.projects.map((proj, idx) => (
                        <div key={idx}>
                          <h3 className="text-base font-bold" style={{ color: '#2C2C2C', fontFamily: 'Georgia, serif' }}>
                            {proj.name}
                          </h3>
                          <p className="text-sm leading-relaxed mb-1" style={{ color: '#2C2C2C', fontFamily: 'Times New Roman, serif' }}>
                            {proj.description}
                          </p>
                          {proj.technologies && proj.technologies.length > 0 && (
                            <p className="text-xs italic" style={{ color: '#666', fontFamily: 'Times New Roman, serif' }}>
                              Technologies: {proj.technologies.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional: ATS Keywords - hidden by default, only visible in metadata view */}
                {/* These keywords are embedded in the content above for ATS scanning */}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
              <p className="text-sm text-gray-500">
                Last modified: {new Date(viewingResume.updatedAt).toLocaleString()}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
                <button
                  onClick={() => setShowViewResumeModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
