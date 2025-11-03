import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setAuthToken } from "../../api/axios";
import { fetchTemplates, createTemplate as apiCreateTemplate, updateTemplate as apiUpdateTemplate, deleteTemplate as apiDeleteTemplate, importTemplate as apiImportTemplate } from "../../api/resumeTemplates";
import { fetchResumes, updateResume as apiUpdateResume, deleteResume as apiDeleteResume } from "../../api/resumes";
import { generateAIResume, generateResumeVariations, regenerateResumeSection } from "../../api/aiResume";
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

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // If it's already in a good format (e.g., "Jan 2020"), return as-is
  if (dateString.match(/^[A-Za-z]{3,9}\s\d{4}$/)) {
    return dateString;
  }
  
  // If it's an ISO string or Date object, format it
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Invalid date, return as-is
    
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  } catch (e) {
    return dateString; // Return as-is if parsing fails
  }
};

// Simple resume preview tile (Google Docs style)
function ResumeTile({ resume, onView, onDelete, onRename }) {
  const theme = { primary: "#4F5348", text: "#222", bg: "#FFF" };
  
  return (
    <Card variant="outlined" interactive className="overflow-hidden !p-0">
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
      <div className="px-2 pt-2 pb-2">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 min-w-0">{resume.name}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onRename(); }}
            className="p-1 rounded-lg transition flex-shrink-0"
            style={{ color: '#6B7280' }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#777C6D';
              e.currentTarget.style.backgroundColor = '#F5F6F4';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#6B7280';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Rename resume"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Modified {new Date(resume.updatedAt).toLocaleDateString()}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onView(); }}
              className="p-1 rounded-lg transition flex-shrink-0"
              style={{ color: '#6B7280' }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#777C6D';
                e.currentTarget.style.backgroundColor = '#F5F6F4';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="View resume"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 rounded-lg transition flex-shrink-0"
              style={{ color: '#6B7280' }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#EF4444';
                e.currentTarget.style.backgroundColor = '#FEF2F2';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Delete resume"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
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
  const [importFile, setImportFile] = useState(null);
  const [importMethod, setImportMethod] = useState("file"); // "file" or "json"
  const [pendingImport, setPendingImport] = useState(null); // Template pending customization
  const [showCustomizeImport, setShowCustomizeImport] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingResume, setDeletingResume] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Rename resume modal state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamingResume, setRenamingResume] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  
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
  const [variations, setVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [showVariations, setShowVariations] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  
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
    setVariations([]);
    setSelectedVariation(null);
    setShowVariations(false);
    await loadJobs();
  };

  const handleGenerateVariations = async () => {
    if (!aiFormData.jobId || !aiFormData.templateId) {
      setGenerationError("Please select a job and template first");
      return;
    }

    setIsGeneratingVariations(true);
    setGenerationError(null);
    try {
      await authWrap();
      const response = await generateResumeVariations(
        aiFormData.jobId,
        aiFormData.templateId
      );
      
      setVariations(response.data.data.variations || []);
      setShowVariations(true);
    } catch (err) {
      console.error("Variations generation error:", err);
      setGenerationError(
        err.response?.data?.message || "Failed to generate variations. Please try again."
      );
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const handleGenerateAIResume = async (e) => {
    e.preventDefault();
    setGenerationError(null);
    
    if (!aiFormData.name || !aiFormData.jobId || !aiFormData.templateId) {
      setGenerationError("Please fill in all fields");
      return;
    }

    // If variations are shown but none selected, require selection
    if (showVariations && !selectedVariation) {
      setGenerationError("Please select a variation or generate without variations");
      return;
    }

    setIsGenerating(true);
    try {
      await authWrap();
      const response = await generateAIResume(
        aiFormData.jobId,
        aiFormData.templateId,
        aiFormData.name,
        selectedVariation || null // Pass selected variation if available
      );
      
      // Success!
      setShowAIResumeModal(false);
      setAIFormData({ name: "", jobId: "", templateId: "" });
      setVariations([]);
      setSelectedVariation(null);
      setShowVariations(false);
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

  const handleRenameResume = async () => {
    if (!renamingResume || !renameValue.trim()) return;
    
    setIsRenaming(true);
    try {
      await authWrap();
      await apiUpdateResume(renamingResume._id, { name: renameValue.trim() });
      setShowRenameModal(false);
      setRenamingResume(null);
      setRenameValue("");
      await loadAll();
      setSuccessMessage(`Resume renamed to "${renameValue.trim()}" successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to rename resume");
    } finally {
      setIsRenaming(false);
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

  const handleFileUpload = async (file) => {
    // Create a template based on file analysis and existing user preferences
    try {
      // Simple template creation with filename
      const templateName = file.name.replace(/\.[^/.]+$/, "") + " Template";
      
      // Default theme with professional styling
      let theme = {
        colors: { primary: "#4F5348", text: "#222", muted: "#666" },
        fonts: { 
          body: "Inter, sans-serif", 
          heading: "Inter, sans-serif",
          sizes: {
            name: "36px",
            sectionHeader: "18px",
            jobTitle: "16px",
            body: "14px",
            small: "12px"
          }
        },
        spacing: 8
      };
      
      let type = "chronological"; // Default type
      let extractedStructure = null; // Store extracted PDF structure
      let extractedLayout = null; // Store extracted PDF layout
      
      // Try to analyze PDF if it's a PDF file
      if (file.type === 'application/pdf') {
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          // Acquire a Clerk JWT without specifying a template;
          // if token is unavailable, skip PDF analysis gracefully.
          let token = null;
          try {
            token = await getToken();
          } catch (e) {
            token = null;
          }
          if (!token) {
            throw new Error('No auth token available for PDF analysis');
          }
          // Ensure axios carries the Authorization header
          setAuthToken(token);
          // Use axios client with configured baseURL
          const { data: analysis } = await api.post('/api/pdf-analysis/analyze', formData);
          console.info('PDF analysis received', analysis?.suggestions);
          // Use suggestions from PDF analysis if available
          if (analysis?.suggestions) {
            theme = {
              colors: analysis.suggestions.colors || theme.colors,
              fonts: analysis.suggestions.fonts || theme.fonts,
              spacing: theme.spacing
            };
            type = analysis.suggestions.type || type;
            // Mark that PDF analysis suggestions were applied
            // This will be propagated via the returned object
            var __analysis = { used: true, suggestions: analysis.suggestions };
            
            // Use extracted structure if available
            if (analysis.suggestions.structure?.sectionsOrder?.length > 0) {
              extractedStructure = analysis.suggestions.structure;
            }
            
            // Store layout information (alignment, spacing, etc.)
            if (analysis.suggestions.layout) {
              extractedLayout = analysis.suggestions.layout;
            }
          }
        } catch (pdfError) {
          console.log('PDF analysis unavailable, using defaults:', pdfError);
          // Continue with default theme - not a critical error
        }
      }
      
      // If no PDF analysis, use existing resumes/templates as fallback
      if (resumes.length > 0 && resumes[0].templateId) {
        const firstResumeTemplate = templates.find(t => t._id === resumes[0].templateId);
        if (firstResumeTemplate && firstResumeTemplate.theme) {
          // Only override if PDF analysis didn't provide better data
          if (file.type !== 'application/pdf') {
            theme = firstResumeTemplate.theme;
          }
        }
      } else if (templates.length > 0 && templates[0].theme && file.type !== 'application/pdf') {
        theme = templates[0].theme;
      }
      
      // Smart template type detection from filename (overrides PDF analysis if explicit)
      const lowerName = templateName.toLowerCase();
      const lowerFileName = file.name.toLowerCase();
      
      if (lowerName.includes("functional") || lowerFileName.includes("functional") || 
          lowerName.includes("skills-based") || lowerFileName.includes("skills")) {
        type = "functional";
      } else if (lowerName.includes("hybrid") || lowerFileName.includes("hybrid") ||
                 lowerName.includes("combination") || lowerFileName.includes("combination") ||
                 lowerName.includes("combined")) {
        type = "hybrid";
      } else if (lowerName.includes("chronological") || lowerFileName.includes("chronological") ||
                 lowerName.includes("reverse") || lowerFileName.includes("timeline")) {
        type = "chronological";
      }
      // If no explicit type in filename and no PDF analysis, check user's existing templates
      else if (templates.length > 0 && file.type !== 'application/pdf') {
        const typeCounts = templates.reduce((acc, t) => {
          acc[t.type] = (acc[t.type] || 0) + 1;
          return acc;
        }, {});
        const mostCommonType = Object.keys(typeCounts).reduce((a, b) => 
          typeCounts[a] > typeCounts[b] ? a : b, 'chronological'
        );
        type = mostCommonType;
      }
      
      // Set sections order - prioritize extracted structure from PDF, otherwise use type-based defaults
      let sectionsOrder;
      if (extractedStructure?.sectionsOrder?.length > 0) {
        // Use the exact structure extracted from the PDF
        sectionsOrder = extractedStructure.sectionsOrder;
        console.log('Using extracted PDF structure:', sectionsOrder);
      } else {
        // Fallback to type-based ordering
        switch (type) {
          case 'functional':
            // Functional: Skills come before experience to highlight capabilities first
            sectionsOrder = ["summary", "skills", "experience", "education", "projects"];
            break;
          case 'hybrid':
            // Hybrid: Skills and experience can be close together, often skills first
            sectionsOrder = ["summary", "skills", "experience", "education", "projects"];
            break;
          case 'chronological':
          default:
            // Chronological: Experience comes before skills (traditional format)
            sectionsOrder = ["summary", "experience", "skills", "education", "projects"];
            break;
        }
      }
      
      // Store section names mapping if extracted from PDF
      const sectionStyles = {};
      if (extractedStructure?.sectionNames) {
        // Preserve the actual section names from the PDF
        Object.entries(extractedStructure.sectionNames).forEach(([standardName, actualName]) => {
          sectionStyles[standardName] = { displayName: actualName };
        });
      }
      
      // Add layout properties to sectionStyles or layout
      if (extractedLayout) {
        // Store layout properties at the template level
        if (!theme.spacing) {
          theme.spacing = extractedLayout.sectionSpacing || 8;
        }
      }
      
      // Store education format if extracted from PDF (already included in extractedLayout)
      let educationFormat = extractedLayout?.educationFormat || null;
      
      return {
        name: templateName,
        type: type,
        layout: {
          sectionsOrder: sectionsOrder,
          sectionStyles: sectionStyles,
          // Store layout properties
          headerAlignment: extractedLayout?.headerAlignment || 'center',
          textAlignment: extractedLayout?.textAlignment || 'left',
          sectionSpacing: extractedLayout?.sectionSpacing || 24,
          headerStyle: extractedLayout?.headerStyle || 'underline',
          lineHeight: extractedLayout?.lineHeight || 1.5,
          paragraphSpacing: extractedLayout?.paragraphSpacing || 8,
          // Store education format if extracted
          educationFormat: educationFormat
        },
        theme: theme,
        analysis: __analysis || { used: false }
      };
    } catch (error) {
      console.error("Error processing file:", error);
      throw new Error("Failed to process resume file");
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    try {
      let templateData;
      
      if (importMethod === "file" && importFile) {
        // Handle file upload
        templateData = await handleFileUpload(importFile);
        // For file uploads, show customization modal first
        setPendingImport(templateData);
        setShowImport(false);
        setShowCustomizeImport(true);
      } else if (importMethod === "json" && importJson) {
        // Handle JSON import - import directly
        templateData = JSON.parse(importJson);
        await authWrap();
        await apiImportTemplate(templateData);
        setShowImport(false);
        setImportJson("");
        await loadAll();
        setSuccessMessage("Template imported successfully!");
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        alert("Please select a file or paste JSON");
        return;
      }
    } catch (err) {
      console.error(err);
      alert(importMethod === "file" ? "Failed to import resume file" : "Invalid JSON for import");
    }
  };

  const handleFinalizeImport = async () => {
    if (!pendingImport) return;
    
    try {
      await authWrap();
      await apiImportTemplate(pendingImport);
      setShowCustomizeImport(false);
      setPendingImport(null);
      setImportFile(null);
      setImportMethod("file");
      await loadAll();
      setSuccessMessage("Template imported successfully!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error(err);
      alert("Failed to finalize template import");
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
                  onRename={() => {
                    setRenamingResume(resume);
                    setRenameValue(resume.name);
                    setShowRenameModal(true);
                  }}
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
            {/* Success Banner in Modal */}
            {successMessage && (
              <div className="mx-6 mt-6 p-4 border rounded-lg" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                <p className="font-medium" style={{ color: '#166534' }}>{successMessage}</p>
              </div>
            )}
            
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
                {/* Import Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Import Method
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="importMethod"
                        value="file"
                        checked={importMethod === "file"}
                        onChange={(e) => setImportMethod(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Upload Resume File</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="importMethod"
                        value="json"
                        checked={importMethod === "json"}
                        onChange={(e) => setImportMethod(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Paste JSON</span>
                    </label>
                  </div>
                </div>

                {/* File Upload Section */}
                {importMethod === "file" && (
                  <div>
                    <label htmlFor="importFile" className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Resume File <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        type="file"
                        id="importFile"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => setImportFile(e.target.files[0])}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-medium
                          file:bg-gray-100 file:text-gray-700
                          hover:file:bg-gray-200 file:cursor-pointer
                          cursor-pointer"
                        required
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
                      </p>
                      {importFile && (
                        <p className="mt-2 text-sm text-green-600">
                          Selected: {importFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* JSON Input Section */}
                {importMethod === "json" && (
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
                )}

                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 -mx-6 -mb-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImport(false);
                      setImportFile(null);
                      setImportJson("");
                      setImportMethod("file");
                    }}
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

      {/* Customize Import Modal */}
      {showCustomizeImport && pendingImport && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => {
            setShowCustomizeImport(false);
            setPendingImport(null);
            setImportFile(null);
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-2xl font-heading font-semibold">Customize Template Appearance</h3>
                <p className="text-sm text-gray-600 mt-1">Set fonts and colors to match your original resume</p>
              </div>
              <button
                onClick={() => {
                  setShowCustomizeImport(false);
                  setPendingImport(null);
                  setImportFile(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Analysis Banner or Help Banner */}
              {pendingImport?.analysis?.used ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-700 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h5 className="font-semibold text-green-900 mb-1">Applied styling detected from your PDF</h5>
                      <p className="text-sm text-green-800">
                        We detected styling hints from your uploaded PDF and prefilled the colors and font sizes below. You can still fine-tune anything before saving.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h5 className="font-semibold text-blue-900 mb-1">Match Your Original Resume</h5>
                      <p className="text-sm text-blue-800">
                        PDFs can be hard to parse for exact styling. Adjust the colors, fonts, and sizes below to match your original resume. The live preview updates instantly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={pendingImport.name}
                  onChange={(e) => setPendingImport({ ...pendingImport, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Colors Section */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Colors</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color (Headers)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={pendingImport.theme?.colors?.primary || "#4F5348"}
                        onChange={(e) => setPendingImport({
                          ...pendingImport,
                          theme: {
                            ...pendingImport.theme,
                            colors: { ...pendingImport.theme?.colors, primary: e.target.value }
                          }
                        })}
                        className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={pendingImport.theme?.colors?.primary || "#4F5348"}
                        onChange={(e) => setPendingImport({
                          ...pendingImport,
                          theme: {
                            ...pendingImport.theme,
                            colors: { ...pendingImport.theme?.colors, primary: e.target.value }
                          }
                        })}
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                        placeholder="#4F5348"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={pendingImport.theme?.colors?.text || "#222"}
                        onChange={(e) => setPendingImport({
                          ...pendingImport,
                          theme: {
                            ...pendingImport.theme,
                            colors: { ...pendingImport.theme?.colors, text: e.target.value }
                          }
                        })}
                        className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={pendingImport.theme?.colors?.text || "#222"}
                        onChange={(e) => setPendingImport({
                          ...pendingImport,
                          theme: {
                            ...pendingImport.theme,
                            colors: { ...pendingImport.theme?.colors, text: e.target.value }
                          }
                        })}
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                        placeholder="#222"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Muted Color (Dates)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={pendingImport.theme?.colors?.muted || "#666"}
                        onChange={(e) => setPendingImport({
                          ...pendingImport,
                          theme: {
                            ...pendingImport.theme,
                            colors: { ...pendingImport.theme?.colors, muted: e.target.value }
                          }
                        })}
                        className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={pendingImport.theme?.colors?.muted || "#666"}
                        onChange={(e) => setPendingImport({
                          ...pendingImport,
                          theme: {
                            ...pendingImport.theme,
                            colors: { ...pendingImport.theme?.colors, muted: e.target.value }
                          }
                        })}
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                        placeholder="#666"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fonts Section */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Fonts</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heading Font
                    </label>
                    <select
                      value={pendingImport.theme?.fonts?.heading || "Inter, sans-serif"}
                      onChange={(e) => setPendingImport({
                        ...pendingImport,
                        theme: {
                          ...pendingImport.theme,
                          fonts: { ...pendingImport.theme?.fonts, heading: e.target.value }
                        }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Inter, sans-serif">Inter (Modern)</option>
                      <option value="Georgia, serif">Georgia (Classic)</option>
                      <option value="Times New Roman, serif">Times New Roman (Traditional)</option>
                      <option value="Arial, sans-serif">Arial (Clean)</option>
                      <option value="Helvetica, sans-serif">Helvetica (Professional)</option>
                      <option value="Calibri, sans-serif">Calibri (Modern)</option>
                      <option value="Garamond, serif">Garamond (Elegant)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Body Font
                    </label>
                    <select
                      value={pendingImport.theme?.fonts?.body || "Inter, sans-serif"}
                      onChange={(e) => setPendingImport({
                        ...pendingImport,
                        theme: {
                          ...pendingImport.theme,
                          fonts: { ...pendingImport.theme?.fonts, body: e.target.value }
                        }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Inter, sans-serif">Inter (Modern)</option>
                      <option value="Georgia, serif">Georgia (Classic)</option>
                      <option value="Times New Roman, serif">Times New Roman (Traditional)</option>
                      <option value="Arial, sans-serif">Arial (Clean)</option>
                      <option value="Helvetica, sans-serif">Helvetica (Professional)</option>
                      <option value="Calibri, sans-serif">Calibri (Modern)</option>
                      <option value="Garamond, serif">Garamond (Elegant)</option>
                    </select>
                  </div>
                </div>

                {/* Font Sizes */}
                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">Font Sizes</h5>
                  <div className="grid grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Name
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="60"
                        value={parseInt(pendingImport.theme?.fonts?.sizes?.name) || 36}
                        onChange={(e) => setPendingImport({
                          ...pendingImport,
                          theme: {
                            ...pendingImport.theme,
                            fonts: { 
                              ...pendingImport.theme?.fonts, 
                              sizes: { 
                                ...pendingImport.theme?.fonts?.sizes, 
                                name: `${e.target.value}px` 
                              } 
                            }
                          }
                        })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-gray-500">px</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Headers
                      </label>
                      <input
                        type="number"
                        min="12"
                        max="32"
                        value={parseInt(pendingImport.theme?.fonts?.sizes?.sectionHeader) || 18}
                        onChange={(e) => setPendingImport({
                          ...pendingImport,
                          theme: {
                            ...pendingImport.theme,
                            fonts: { 
                              ...pendingImport.theme?.fonts, 
                              sizes: { 
                                ...pendingImport.theme?.fonts?.sizes, 
                                sectionHeader: `${e.target.value}px` 
                              } 
                            }
                          }
                        })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-gray-500">px</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Job Title
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="24"
                        value={parseInt(pendingImport.theme?.fonts?.sizes?.jobTitle) || 16}
                        onChange={(e) => setPendingImport({
                          ...pendingImport,
                          theme: {
                            ...pendingImport.theme,
                            fonts: { 
                              ...pendingImport.theme?.fonts, 
                              sizes: { 
                                ...pendingImport.theme?.fonts?.sizes, 
                                jobTitle: `${e.target.value}px` 
                              } 
                            }
                          }
                        })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-gray-500">px</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Body
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="20"
                        value={parseInt(pendingImport.theme?.fonts?.sizes?.body) || 14}
                        onChange={(e) => setPendingImport({
                          ...pendingImport,
                          theme: {
                            ...pendingImport.theme,
                            fonts: { 
                              ...pendingImport.theme?.fonts, 
                              sizes: { 
                                ...pendingImport.theme?.fonts?.sizes, 
                                body: `${e.target.value}px` 
                              } 
                            }
                          }
                        })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-gray-500">px</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Small
                      </label>
                      <input
                        type="number"
                        min="8"
                        max="16"
                        value={parseInt(pendingImport.theme?.fonts?.sizes?.small) || 12}
                        onChange={(e) => setPendingImport({
                          ...pendingImport,
                          theme: {
                            ...pendingImport.theme,
                            fonts: { 
                              ...pendingImport.theme?.fonts, 
                              sizes: { 
                                ...pendingImport.theme?.fonts?.sizes, 
                                small: `${e.target.value}px` 
                              } 
                            }
                          }
                        })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-gray-500">px</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Preview</h4>
                <div className="border border-gray-300 rounded-lg p-6 bg-white">
                  <h2 
                    className="font-bold mb-2"
                    style={{ 
                      color: pendingImport.theme?.colors?.primary || "#4F5348",
                      fontFamily: pendingImport.theme?.fonts?.heading || "Inter, sans-serif",
                      fontSize: pendingImport.theme?.fonts?.sizes?.name || "36px"
                    }}
                  >
                    Your Name
                  </h2>
                  <p 
                    className="mb-4"
                    style={{ 
                      color: pendingImport.theme?.colors?.muted || "#666",
                      fontFamily: pendingImport.theme?.fonts?.body || "Inter, sans-serif",
                      fontSize: pendingImport.theme?.fonts?.sizes?.small || "12px"
                    }}
                  >
                    email@example.com • (555) 123-4567
                  </p>
                  <h3 
                    className="font-semibold mb-2 uppercase"
                    style={{ 
                      color: pendingImport.theme?.colors?.primary || "#4F5348",
                      fontFamily: pendingImport.theme?.fonts?.heading || "Inter, sans-serif",
                      fontSize: pendingImport.theme?.fonts?.sizes?.sectionHeader || "18px"
                    }}
                  >
                    Experience
                  </h3>
                  <h4 
                    className="font-bold mb-1"
                    style={{ 
                      color: pendingImport.theme?.colors?.text || "#222",
                      fontFamily: pendingImport.theme?.fonts?.heading || "Inter, sans-serif",
                      fontSize: pendingImport.theme?.fonts?.sizes?.jobTitle || "16px"
                    }}
                  >
                    Senior Developer
                  </h4>
                  <p 
                    style={{ 
                      color: pendingImport.theme?.colors?.text || "#222",
                      fontFamily: pendingImport.theme?.fonts?.body || "Inter, sans-serif",
                      fontSize: pendingImport.theme?.fonts?.sizes?.body || "14px"
                    }}
                  >
                    This is how your body text will appear in the resume.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowCustomizeImport(false);
                  setPendingImport(null);
                  setImportFile(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizeImport}
                className="px-4 py-2 text-white rounded-lg transition"
                style={{ backgroundColor: '#777C6D' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
              >
                Save Template
              </button>
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

                {/* Generate Variations Button */}
                {!showVariations && (
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleGenerateVariations}
                      disabled={!aiFormData.jobId || !aiFormData.templateId || isGeneratingVariations}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isGeneratingVariations ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Generating Variations...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Generate Multiple Variations (Recommended)</span>
                        </>
                      )}
                    </button>
                    <span className="text-sm text-gray-500">or proceed to generate single version</span>
                  </div>
                )}

                {/* Variations Display */}
                {showVariations && variations.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold text-gray-900">Choose a Variation:</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setShowVariations(false);
                          setSelectedVariation(null);
                          setVariations([]);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Generate new variations
                      </button>
                    </div>
                    <div className="space-y-3">
                      {variations.map((variation, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedVariation(variation)}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                            selectedVariation?.variationNumber === variation.variationNumber
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-semibold text-gray-900">
                                Variation {variation.variationNumber}: {variation.emphasis}
                              </h5>
                              {variation.tailoringNotes && (
                                <p className="text-sm text-gray-600 mt-1">{variation.tailoringNotes}</p>
                              )}
                            </div>
                            {selectedVariation?.variationNumber === variation.variationNumber && (
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div className="text-sm text-gray-700">
                            <p className="line-clamp-2 mb-2">{variation.summary}</p>
                            <div className="flex flex-wrap gap-2">
                              {variation.relevantSkills?.slice(0, 5).map((skill, skillIdx) => (
                                <span key={skillIdx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                              {variation.relevantSkills?.length > 5 && (
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  +{variation.relevantSkills.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

      {/* Rename Resume Modal */}
      {showRenameModal && renamingResume && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => !isRenaming && setShowRenameModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-heading font-semibold text-gray-900">Rename Resume</h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <label htmlFor="renameInput" className="block text-sm font-medium text-gray-700 mb-2">
                Resume Name
              </label>
              <input
                id="renameInput"
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isRenaming && renameValue.trim()) {
                    handleRenameResume();
                  }
                }}
                disabled={isRenaming}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Enter resume name"
                autoFocus
              />
            </div>

            {/* Modal Actions */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => !isRenaming && setShowRenameModal(false)}
                disabled={isRenaming}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameResume}
                disabled={isRenaming || !renameValue.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isRenaming ? "Renaming..." : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Resume Modal */}
      {showViewResumeModal && viewingResume && (() => {
        // Get the template for this resume to use its theme and layout
        const resumeTemplate = templates.find(t => t._id === viewingResume.templateId) || {};
        const theme = resumeTemplate.theme || {
          colors: { primary: "#4F5348", text: "#222", muted: "#666" },
          fonts: { 
            body: "Inter, sans-serif", 
            heading: "Inter, sans-serif",
            sizes: {
              name: "36px",
              sectionHeader: "18px",
              jobTitle: "16px",
              body: "14px",
              small: "12px"
            }
          }
        };
        
        // Get section order from template layout, fallback to default order
        const sectionsOrder = resumeTemplate.layout?.sectionsOrder || ["summary", "experience", "skills", "education", "projects"];
        
        // Get section display names from template (preserved from PDF)
        const sectionStyles = resumeTemplate.layout?.sectionStyles || {};
        const getSectionName = (sectionType) => {
          return sectionStyles[sectionType]?.displayName || 
                 (sectionType === 'summary' ? 'Professional Summary' :
                  sectionType === 'experience' ? 'Professional Experience' :
                  sectionType === 'skills' ? 'Technical Skills' :
                  sectionType === 'education' ? 'Education' :
                  sectionType === 'projects' ? 'Projects' :
                  sectionType === 'awards' ? 'Awards' :
                  sectionType === 'certifications' ? 'Certifications' :
                  sectionType.charAt(0).toUpperCase() + sectionType.slice(1)); // Capitalize first letter as fallback
        };
        
        // Helper function to render a section by type
        const renderSection = (sectionType) => {
          switch (sectionType) {
            case 'summary':
              if (!viewingResume.sections?.summary) return null;
              const sectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
              const headerStyle = resumeTemplate.layout?.headerStyle || 'underline';
              return (
                <div key="summary" style={{ marginBottom: `${sectionSpacing}px` }}>
                  <div className="flex justify-between items-center mb-3">
                    <h2 
                      className="font-bold uppercase tracking-wide" 
                      style={{ 
                        color: theme.colors.primary, 
                        fontFamily: theme.fonts.heading, 
                        fontSize: theme.fonts.sizes?.sectionHeader || "18px",
                        borderBottom: headerStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
                        paddingBottom: headerStyle === 'underline' ? '4px' : '0'
                      }}
                    >
                      {getSectionName('summary')}
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
                  <p 
                    className="leading-relaxed" 
                    style={{ 
                      color: theme.colors.text, 
                      textAlign: resumeTemplate.layout?.textAlignment || 'justify', 
                      fontFamily: theme.fonts.body, 
                      fontSize: theme.fonts.sizes?.body || "14px",
                      lineHeight: resumeTemplate.layout?.lineHeight || 1.5
                    }}
                  >
                    {viewingResume.sections.summary}
                  </p>
                </div>
              );
            
            case 'experience':
              if (!viewingResume.sections?.experience || viewingResume.sections.experience.length === 0) return null;
              const expSectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
              const expHeaderStyle = resumeTemplate.layout?.headerStyle || 'underline';
              return (
                <div key="experience" style={{ marginBottom: `${expSectionSpacing}px` }}>
                  <div className="flex justify-between items-center mb-3">
                    <h2 
                      className="font-bold uppercase tracking-wide" 
                      style={{ 
                        color: theme.colors.primary, 
                        fontFamily: theme.fonts.heading, 
                        fontSize: theme.fonts.sizes?.sectionHeader || "18px",
                        borderBottom: expHeaderStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
                        paddingBottom: expHeaderStyle === 'underline' ? '4px' : '0'
                      }}
                    >
                      {getSectionName('experience')}
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
                          <h3 className="font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: theme.fonts.sizes?.jobTitle || "16px" }}>
                            {job.jobTitle}
                          </h3>
                          <span className="font-semibold" style={{ color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: theme.fonts.sizes?.small || "12px" }}>
                            {formatDate(job.startDate)} - {job.isCurrentPosition ? 'Present' : formatDate(job.endDate)}
                          </span>
                        </div>
                        <p className="italic mb-2" style={{ color: theme.colors.muted, fontFamily: theme.fonts.heading, fontSize: theme.fonts.sizes?.body || "14px" }}>
                          {job.company}
                        </p>
                        {job.bullets && job.bullets.length > 0 && (
                          <ul className="space-y-1 ml-5" style={{ listStyleType: 'disc' }}>
                            {job.bullets.map((bullet, bulletIdx) => (
                              <li 
                                key={bulletIdx} 
                                className="leading-relaxed" 
                                style={{ 
                                  color: theme.colors.text, 
                                  fontFamily: theme.fonts.body, 
                                  fontSize: theme.fonts.sizes?.body || "14px",
                                  lineHeight: resumeTemplate.layout?.lineHeight || 1.5,
                                  marginBottom: `${(resumeTemplate.layout?.paragraphSpacing || 8) / 2}px`
                                }}
                              >
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            
            case 'skills':
              if (!viewingResume.sections?.skills || viewingResume.sections.skills.length === 0) return null;
              const skillsSectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
              const skillsHeaderStyle = resumeTemplate.layout?.headerStyle || 'underline';
              return (
                <div key="skills" style={{ marginBottom: `${skillsSectionSpacing}px` }}>
                  <div className="flex justify-between items-center mb-3">
                    <h2 
                      className="font-bold uppercase tracking-wide" 
                      style={{ 
                        color: theme.colors.primary, 
                        fontFamily: theme.fonts.heading, 
                        fontSize: theme.fonts.sizes?.sectionHeader || "18px",
                        borderBottom: skillsHeaderStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
                        paddingBottom: skillsHeaderStyle === 'underline' ? '4px' : '0'
                      }}
                    >
                      {getSectionName('skills')}
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
                  <p 
                    className="leading-relaxed" 
                    style={{ 
                      color: theme.colors.text, 
                      fontFamily: theme.fonts.body, 
                      fontSize: theme.fonts.sizes?.body || "14px",
                      textAlign: resumeTemplate.layout?.textAlignment || 'left',
                      lineHeight: resumeTemplate.layout?.lineHeight || 1.5
                    }}
                  >
                    {viewingResume.sections.skills.map((skill, idx) => (
                      typeof skill === 'string' ? skill : skill.name || skill
                    )).join(' • ')}
                  </p>
                </div>
              );
            
            case 'education':
              if (!viewingResume.sections?.education || viewingResume.sections.education.length === 0) return null;
              const eduSectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
              const eduHeaderStyle = resumeTemplate.layout?.headerStyle || 'underline';
              return (
                <div key="education" style={{ marginBottom: `${eduSectionSpacing}px` }}>
                  <h2 
                    className="font-bold mb-3 uppercase tracking-wide" 
                    style={{ 
                      color: theme.colors.primary, 
                      fontFamily: theme.fonts.heading, 
                      fontSize: theme.fonts.sizes?.sectionHeader || "18px",
                      borderBottom: eduHeaderStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
                      paddingBottom: eduHeaderStyle === 'underline' ? '4px' : '0'
                    }}
                  >
                    {getSectionName('education')}
                  </h2>
                  <div className="space-y-3">
                    {viewingResume.sections.education.map((edu, idx) => {
                      const eduFormat = resumeTemplate.layout?.educationFormat || {
                        order: ['degree', 'institution', 'location', 'dates', 'gpa'],
                        datesOnRight: true,
                        locationAfterInstitution: true,
                        gpaSeparateLine: true
                      };
                      
                      // Render fields based on template format
                      const renderEducationField = (fieldType) => {
                        switch (fieldType) {
                          case 'degree':
                            return (
                              <h3 
                                key="degree"
                                className="font-bold" 
                                style={{ 
                                  color: theme.colors.text, 
                                  fontFamily: theme.fonts.heading, 
                                  fontSize: theme.fonts.sizes?.jobTitle || "16px"
                                }}
                              >
                                {edu.degree} in {edu.fieldOfStudy}
                              </h3>
                            );
                          case 'institution':
                            return (
                              <div 
                                key="institution"
                                className="italic"
                                style={{ 
                                  color: theme.colors.muted, 
                                  fontFamily: theme.fonts.heading, 
                                  fontSize: theme.fonts.sizes?.body || "14px",
                                  lineHeight: resumeTemplate.layout?.lineHeight || 1.5
                                }}
                              >
                                {edu.institution}
                                {eduFormat.locationAfterInstitution && edu.location && (
                                  <span>, {edu.location}</span>
                                )}
                              </div>
                            );
                          case 'location':
                            if (!eduFormat.locationAfterInstitution && edu.location) {
                              return (
                                <div 
                                  key="location"
                                  className="italic"
                                  style={{ 
                                    color: theme.colors.muted, 
                                    fontFamily: theme.fonts.heading, 
                                    fontSize: theme.fonts.sizes?.body || "14px",
                                    lineHeight: resumeTemplate.layout?.lineHeight || 1.5
                                  }}
                                >
                                  {edu.location}
                                </div>
                              );
                            }
                            return null;
                          case 'dates':
                            const datesText = `${formatDate(edu.startDate)} - ${edu.current ? 'Present' : formatDate(edu.endDate)}`;
                            return (
                              <span 
                                key="dates"
                                className="font-semibold" 
                                style={{ 
                                  color: theme.colors.muted, 
                                  fontFamily: theme.fonts.body, 
                                  fontSize: theme.fonts.sizes?.small || "12px"
                                }}
                              >
                                {datesText}
                              </span>
                            );
                          case 'gpa':
                            if (edu.gpa && (!edu.gpaPrivate)) {
                              return (
                                <p 
                                  key="gpa"
                                  className={eduFormat.gpaSeparateLine ? "mt-1" : ""}
                                  style={{ 
                                    color: theme.colors.text, 
                                    fontFamily: theme.fonts.body, 
                                    fontSize: theme.fonts.sizes?.small || "12px",
                                    lineHeight: resumeTemplate.layout?.lineHeight || 1.5
                                  }}
                                >
                                  GPA: {edu.gpa}
                                </p>
                              );
                            }
                            return null;
                          default:
                            return null;
                        }
                      };
                      
                      // Determine if dates should be on same line (right-aligned) with degree/institution
                      const datesIndex = eduFormat.order.indexOf('dates');
                      const degreeIndex = eduFormat.order.indexOf('degree');
                      const institutionIndex = eduFormat.order.indexOf('institution');
                      
                      // Find first field (degree or institution)
                      let firstFieldType = null;
                      let firstFieldIndex = Infinity;
                      if (degreeIndex !== -1 && degreeIndex < firstFieldIndex) {
                        firstFieldIndex = degreeIndex;
                        firstFieldType = 'degree';
                      }
                      if (institutionIndex !== -1 && institutionIndex < firstFieldIndex) {
                        firstFieldIndex = institutionIndex;
                        firstFieldType = 'institution';
                      }
                      
                      // Dates on right if flag is set AND dates come right after first field
                      const hasDatesOnRight = eduFormat.datesOnRight && 
                        datesIndex !== -1 && 
                        firstFieldIndex !== Infinity &&
                        datesIndex === firstFieldIndex + 1;
                      
                      // Render all fields in order
                      const renderedFields = [];
                      let datesField = null;
                      
                      for (let i = 0; i < eduFormat.order.length; i++) {
                        const field = eduFormat.order[i];
                        
                        if (field === 'dates') {
                          if (hasDatesOnRight) {
                            datesField = renderEducationField('dates');
                          } else {
                            // Dates not on right - render normally
                            const rendered = renderEducationField('dates');
                            if (rendered) {
                              renderedFields.push({ type: 'normal', element: rendered });
                            }
                          }
                        } else {
                          const rendered = renderEducationField(field);
                          if (rendered) {
                            if (field === firstFieldType) {
                              // First field - may be on same line as dates
                              renderedFields.unshift({ type: 'first', element: rendered });
                            } else {
                              renderedFields.push({ type: 'normal', element: rendered });
                            }
                          }
                        }
                      }
                      
                      // Separate first field from rest
                      const firstField = renderedFields.find(f => f.type === 'first');
                      const otherFields = renderedFields.filter(f => f.type !== 'first');
                      
                      return (
                        <div key={idx}>
                          {firstField && (
                            <div className={hasDatesOnRight && datesField ? "flex justify-between items-baseline" : ""}>
                              <div>
                                {firstField.element}
                              </div>
                              {hasDatesOnRight && datesField && (
                                <div>
                                  {datesField}
                                </div>
                              )}
                            </div>
                          )}
                          {otherFields.map((field, fIdx) => (
                            <div key={fIdx}>
                              {field.element}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            
            case 'projects':
              if (!viewingResume.sections?.projects || viewingResume.sections.projects.length === 0) return null;
              const projSectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
              const projHeaderStyle = resumeTemplate.layout?.headerStyle || 'underline';
              return (
                <div key="projects" style={{ marginBottom: `${projSectionSpacing}px` }}>
                  <h2 
                    className="font-bold mb-3 uppercase tracking-wide" 
                    style={{ 
                      color: theme.colors.primary, 
                      fontFamily: theme.fonts.heading, 
                      fontSize: theme.fonts.sizes?.sectionHeader || "18px",
                      borderBottom: projHeaderStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
                      paddingBottom: projHeaderStyle === 'underline' ? '4px' : '0'
                    }}
                  >
                    {getSectionName('projects')}
                  </h2>
                  <div className="space-y-3">
                    {viewingResume.sections.projects.map((proj, idx) => (
                      <div key={idx}>
                        <h3 className="font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: theme.fonts.sizes?.jobTitle || "16px" }}>
                          {proj.name}
                        </h3>
                        <p 
                          className="leading-relaxed mb-1" 
                          style={{ 
                            color: theme.colors.text, 
                            fontFamily: theme.fonts.body, 
                            fontSize: theme.fonts.sizes?.body || "14px",
                            textAlign: resumeTemplate.layout?.textAlignment || 'left',
                            lineHeight: resumeTemplate.layout?.lineHeight || 1.5
                          }}
                        >
                          {proj.description}
                        </p>
                          {proj.technologies && proj.technologies.length > 0 && (
                            <p 
                              className="italic" 
                              style={{ 
                                color: theme.colors.muted, 
                                fontFamily: theme.fonts.body, 
                                fontSize: theme.fonts.sizes?.small || "12px",
                                lineHeight: resumeTemplate.layout?.lineHeight || 1.5
                              }}
                            >
                              Technologies: {proj.technologies.join(', ')}
                            </p>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            
            case 'awards':
              if (!viewingResume.sections?.awards || viewingResume.sections.awards.length === 0) return null;
              const awardsSectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
              const awardsHeaderStyle = resumeTemplate.layout?.headerStyle || 'underline';
              return (
                <div key="awards" style={{ marginBottom: `${awardsSectionSpacing}px` }}>
                  <h2 
                    className="font-bold mb-3 uppercase tracking-wide" 
                    style={{ 
                      color: theme.colors.primary, 
                      fontFamily: theme.fonts.heading, 
                      fontSize: theme.fonts.sizes?.sectionHeader || "18px",
                      borderBottom: awardsHeaderStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
                      paddingBottom: awardsHeaderStyle === 'underline' ? '4px' : '0'
                    }}
                  >
                    {getSectionName('awards')}
                  </h2>
                  <div className="space-y-2">
                    {viewingResume.sections.awards.map((award, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          color: theme.colors.text, 
                          fontFamily: theme.fonts.body, 
                          fontSize: theme.fonts.sizes?.body || "14px",
                          textAlign: resumeTemplate.layout?.textAlignment || 'left',
                          lineHeight: resumeTemplate.layout?.lineHeight || 1.5,
                          marginBottom: `${(resumeTemplate.layout?.paragraphSpacing || 8) / 2}px`
                        }}
                      >
                        {typeof award === 'string' ? award : `${award.name || award.title || ''}${award.date ? ` (${award.date})` : ''}${award.issuer ? ` - ${award.issuer}` : ''}`}
                      </div>
                    ))}
                  </div>
                </div>
              );
            
            case 'certifications':
              if (!viewingResume.sections?.certifications || viewingResume.sections.certifications.length === 0) return null;
              const certSectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
              const certHeaderStyle = resumeTemplate.layout?.headerStyle || 'underline';
              return (
                <div key="certifications" style={{ marginBottom: `${certSectionSpacing}px` }}>
                  <h2 
                    className="font-bold mb-3 uppercase tracking-wide" 
                    style={{ 
                      color: theme.colors.primary, 
                      fontFamily: theme.fonts.heading, 
                      fontSize: theme.fonts.sizes?.sectionHeader || "18px",
                      borderBottom: certHeaderStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
                      paddingBottom: certHeaderStyle === 'underline' ? '4px' : '0'
                    }}
                  >
                    {getSectionName('certifications')}
                  </h2>
                  <div className="space-y-2">
                    {viewingResume.sections.certifications.map((cert, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          color: theme.colors.text, 
                          fontFamily: theme.fonts.body, 
                          fontSize: theme.fonts.sizes?.body || "14px",
                          textAlign: resumeTemplate.layout?.textAlignment || 'left',
                          lineHeight: resumeTemplate.layout?.lineHeight || 1.5,
                          marginBottom: `${(resumeTemplate.layout?.paragraphSpacing || 8) / 2}px`
                        }}
                      >
                        {typeof cert === 'string' ? cert : `${cert.name || cert.title || ''}${cert.date ? ` (${cert.date})` : ''}${cert.issuer ? ` - ${cert.issuer || cert.issuingOrganization}` : ''}`}
                      </div>
                    ))}
                  </div>
                </div>
              );
            
            default:
              return null;
          }
        };
        
        return (
        <>
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 print:hidden" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowViewResumeModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl w-full mx-4 border border-gray-200 overflow-hidden flex flex-col" 
            style={{ maxWidth: '960px', height: '95vh' }}
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

            {/* Modal Content - Print Preview Style */}
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#525252' }}>
              {/* Paper-like Resume Document - Looks like print preview */}
              <div className="py-8 px-4">
                <div 
                  className="resume-printable mx-auto bg-white shadow-2xl print:shadow-none" 
                  style={{ 
                    width: '8.5in', 
                    minHeight: '11in', 
                    padding: '0.75in',
                    boxShadow: '0 0 0.5cm rgba(0,0,0,0.5)'
                  }}
                >
                
                {/* Resume Header */}
                <div 
                  className="pb-6 border-b-2"
                  style={{ 
                    borderColor: theme.colors.primary,
                    textAlign: resumeTemplate.layout?.headerAlignment || 'center',
                    marginBottom: `${resumeTemplate.layout?.sectionSpacing || 32}px`
                  }}
                >
                  <h1 className="font-bold mb-2" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: theme.fonts.sizes?.name || "36px" }}>
                    {viewingResume.sections?.contactInfo?.name || 'Your Name'}
                  </h1>
                  <div 
                    className="flex flex-wrap gap-2" 
                    style={{ 
                      color: theme.colors.muted, 
                      fontFamily: theme.fonts.body, 
                      fontSize: theme.fonts.sizes?.small || "12px",
                      justifyContent: resumeTemplate.layout?.headerAlignment === 'center' ? 'center' : 
                                     resumeTemplate.layout?.headerAlignment === 'right' ? 'flex-end' : 'flex-start'
                    }}
                  >
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
                    <div 
                      className="text-xs flex flex-wrap gap-2 mt-1" 
                      style={{ 
                        color: '#4A5568',
                        justifyContent: resumeTemplate.layout?.headerAlignment === 'center' ? 'center' : 
                                       resumeTemplate.layout?.headerAlignment === 'right' ? 'flex-end' : 'flex-start'
                      }}
                    >
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

                {/* Render sections in the order specified by template layout */}
                {sectionsOrder.map(sectionType => renderSection(sectionType))}

                {/* Optional: ATS Keywords - hidden by default, only visible in metadata view */}
                {/* These keywords are embedded in the content above for ATS scanning */}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t print:hidden">
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
        </>
        );
      })()}
    </div>
  );
}
