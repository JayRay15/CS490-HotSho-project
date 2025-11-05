import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { setAuthToken } from "../../api/axios";
import { fetchTemplates, createTemplate as apiCreateTemplate, updateTemplate as apiUpdateTemplate, deleteTemplate as apiDeleteTemplate, importTemplate as apiImportTemplate } from "../../api/resumeTemplates";
import { 
  fetchResumes, 
  updateResume as apiUpdateResume, 
  deleteResume as apiDeleteResume,
  exportResumePDF,
  exportResumeDOCX,
  exportResumeHTML,
  exportResumeText,
  cloneResume as apiCloneResume,
  compareResumes as apiCompareResumes,
  setDefaultResume as apiSetDefaultResume,
  archiveResume as apiArchiveResume,
  unarchiveResume as apiUnarchiveResume,
  mergeResumes as apiMergeResumes
} from "../../api/resumes";
import { 
  generateAIResume, 
  generateResumeVariations, 
  regenerateResumeSection,
  optimizeResumeSkills,
  tailorExperienceForJob
} from "../../api/aiResume";
import api from "../../api/axios";
import Container from "../../components/Container";
import Card from "../../components/Card";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import LoadingSpinner from "../../components/LoadingSpinner";
import { THEME_PRESETS, getThemePresetNames, getThemePreset } from "../../utils/themePresets";

const TEMPLATE_TYPES = [
  { value: "chronological", label: "Chronological" },
  { value: "functional", label: "Functional" },
  { value: "hybrid", label: "Hybrid" },
];

const DEFAULT_SECTIONS = [
  { key: 'contactInfo', label: 'Contact Info' },
  { key: 'summary', label: 'Summary' },
  { key: 'experience', label: 'Experience' },
  { key: 'skills', label: 'Skills' },
  { key: 'education', label: 'Education' },
  { key: 'projects', label: 'Projects' },
  { key: 'certifications', label: 'Certifications' },
];

// Section arrangement presets/templates
const SECTION_PRESETS = [
  {
    name: 'Standard',
    order: ['contactInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
    description: 'Traditional resume layout'
  },
  {
    name: 'Skills-First',
    order: ['contactInfo', 'skills', 'experience', 'projects', 'education', 'certifications', 'summary'],
    description: 'Emphasize skills before experience'
  },
  {
    name: 'Project-Focused',
    order: ['contactInfo', 'summary', 'projects', 'experience', 'skills', 'education', 'certifications'],
    description: 'Highlight projects prominently'
  },
  {
    name: 'Academic',
    order: ['contactInfo', 'education', 'projects', 'experience', 'skills', 'certifications', 'summary'],
    description: 'Education and academic work first'
  },
  {
    name: 'Minimal',
    order: ['contactInfo', 'experience', 'education', 'skills'],
    description: 'Only essential sections'
  },
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
function ResumeTile({ resume, template, onView, onDelete, onRename }) {
  const theme = template?.theme || { colors: { primary: "#4F5348", text: "#222" } };
  const fonts = theme?.fonts || { heading: "Inter, sans-serif", body: "Inter, sans-serif", sizes: {} };


  return (
    <Card variant="outlined" interactive className={`overflow-hidden !p-0 ${resume.isArchived ? 'opacity-60' : ''}`}>
      {/* Preview Area */}
      <div 
        className="h-64 p-4 flex flex-col justify-start border-b cursor-pointer"
        style={{ backgroundColor: "#F9F9F9" }}
        onClick={onView}
      >
        <div className="text-xs font-bold mb-2" style={{ color: theme.colors?.primary || '#4F5348', fontFamily: fonts.heading }}>
          {resume.name || "Untitled Resume"}
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
            {/* Simple preview of resume sections */}
            {resume.sections?.contactInfo && (
              <div className="text-[8px] text-gray-700 font-semibold" style={{ fontFamily: fonts.heading }}>
                {resume.sections.contactInfo.name || "Name"}
              </div>
            )}
            {resume.sections?.summary && (
              <div className="text-[7px] text-gray-600 leading-tight line-clamp-2" style={{ fontFamily: fonts.body }}>
                {resume.sections.summary.substring(0, 100)}...
              </div>
            )}
            {resume.sections?.experience && resume.sections.experience.length > 0 && (
              <div className="mt-2">
                <div className="text-[7px] text-gray-700 font-semibold" style={{ fontFamily: fonts.heading }}>
                  {resume.sections.experience[0].company}
                </div>
                <div className="text-[6px] text-gray-500 italic" style={{ fontFamily: fonts.heading }}>
                  {resume.sections.experience[0].title}
                </div>
              </div>
            )}
            {resume.sections?.skills && resume.sections.skills.length > 0 && (
              <div className="mt-2 text-[6px] text-gray-600" style={{ fontFamily: fonts.body }}>
                {resume.sections.skills.slice(0, 3).join(' • ')}
                {resume.sections.skills.length > 3 && ' ...'}
              </div>
            )}
            {resume.sections?.education && resume.sections.education.length > 0 && (
              <div className="mt-2 text-[6px] text-gray-600" style={{ fontFamily: fonts.body }}>
                {resume.sections.education[0].school} ({resume.sections.education[0].degree})
              </div>
            )}
        </div>
      </div>
      {/* Info & Actions */}
      <div className="px-2 pt-2 pb-2">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 min-w-0" style={{ fontFamily: fonts.heading }}>{resume.name}</p>
          {/* UC-52: Archived badge */}
          {resume.isArchived && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded">
              ARCHIVED
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRename(); }}
            className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center"
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
        {/* UC-52: Version description */}
        {resume.metadata?.description && (
          <p className="text-xs text-gray-600 mb-1 line-clamp-2 italic" style={{ fontFamily: fonts.body }}>
            {resume.metadata.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-xs text-gray-500">Modified {new Date(resume.updatedAt).toLocaleDateString()}</p>
            {/* UC-52: Job usage badge */}
            {resume.linkedJobCount > 0 && (
              <p className="text-xs text-blue-600 font-medium">
                Used in {resume.linkedJobCount} application{resume.linkedJobCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onView(); }}
              className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center"
              style={{ color: '#6B7280' }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#777C6D';
                e.currentTarget.style.backgroundColor = '#F5F6F4';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center"
              style={{ color: '#6B7280' }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#B91C1C';
                e.currentTarget.style.backgroundColor = '#FEE2E2';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m4-4h2a2 2 0 012 2v2H9V5a2 2 0 012-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Template preview for management modal
function TemplatePreviewCard({ template, isDefault, onSetDefault, onCustomize, onDelete, onPreview }) {
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

      <div className="flex flex-wrap gap-2 items-center justify-between">
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
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center"
          style={{ color: '#6B7280' }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#EF4444';
            e.currentTarget.style.backgroundColor = '#FEF2F2';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#6B7280';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Delete template"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
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
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(null);
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
  
  // Resume Display State
  const [showAllResumes, setShowAllResumes] = useState(false);
  const [showArchivedResumes, setShowArchivedResumes] = useState(false); // UC-52: Archive filter
  
  // UC-49: Skills Optimization State
  const [showSkillsOptimization, setShowSkillsOptimization] = useState(false);
  const [skillsOptimizationData, setSkillsOptimizationData] = useState(null);
  const [isOptimizingSkills, setIsOptimizingSkills] = useState(false);
  const [selectedJobForSkills, setSelectedJobForSkills] = useState(''); // Store "title|company" string
  const [selectedSkillsToAdd, setSelectedSkillsToAdd] = useState([]); // Skills user wants to add
  const [currentResumeSkills, setCurrentResumeSkills] = useState([]); // Current skills in resume
  const [isApplyingSkills, setIsApplyingSkills] = useState(false);
  const [showSkillsSuccessBanner, setShowSkillsSuccessBanner] = useState(false);
  
  // UC-50: Experience Tailoring State
  const [showExperienceTailoring, setShowExperienceTailoring] = useState(false);
  const [experienceTailoringData, setExperienceTailoringData] = useState(null);
  const [isTailoringExperience, setIsTailoringExperience] = useState(false);
  const [selectedJobForExperience, setSelectedJobForExperience] = useState(''); // Store "title|company" string
  const [selectedExperienceVariations, setSelectedExperienceVariations] = useState({}); // { "expIdx-bulletIdx": "achievement" | "technical" | "impact" | "original" }
  const [isApplyingExperience, setIsApplyingExperience] = useState(false);
  const [showExperienceSuccessBanner, setShowExperienceSuccessBanner] = useState(false);
  
  // UC-51: Export State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);
  // Custom "Save As" modal for exports (replaces window.prompt)
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsFilename, setSaveAsFilename] = useState('');
  const [pendingExportFormat, setPendingExportFormat] = useState(null);
  
  // UC-51: Watermark options
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  
  // UC-52: Version Management State
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [cloneDescription, setCloneDescription] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareResumeId, setCompareResumeId] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedMergeChanges, setSelectedMergeChanges] = useState([]);
  const [isMerging, setIsMerging] = useState(false);
  
    // Section Customization State (UC-048)
    const [visibleSections, setVisibleSections] = useState(DEFAULT_SECTIONS.map(s => s.key));
    const [sectionOrder, setSectionOrder] = useState(DEFAULT_SECTIONS.map(s => s.key));
    const [sectionFormatting, setSectionFormatting] = useState({});
    const [selectedJobType, setSelectedJobType] = useState('general');
    const [isSavingCustomization, setIsSavingCustomization] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showPresetMenu, setShowPresetMenu] = useState(false);
    const [showSavePresetModal, setShowSavePresetModal] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [customPresets, setCustomPresets] = useState([]);
    const [showFormattingPanel, setShowFormattingPanel] = useState(false);
    const [formattingSection, setFormattingSection] = useState(null);
    const [showCustomizationPanel, setShowCustomizationPanel] = useState(false);
  
  // Removed PDF experimental feature states
  // const [viewingAsPdf, setViewingAsPdf] = useState(false);
  // const [pdfUrl, setPdfUrl] = useState(null);
  // const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  // const [experimentalFeaturesEnabled, setExperimentalFeaturesEnabled] = useState(false);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState(null);

  const authWrap = async () => {
    const token = await getToken();
    setAuthToken(token);
  };

  // UC-052: Auto-save version snapshot before making changes
  const createAutoVersionSnapshot = async (resume, changeDescription) => {
    try {
      // Create a snapshot with timestamp
      const timestamp = new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      const snapshotName = `${resume.name} (${timestamp})`;
      
      console.log('Creating auto-version snapshot:', snapshotName);
      
      // Clone the resume as a version snapshot
      const cloneResponse = await apiCloneResume(
        resume._id, 
        snapshotName,
        `Auto-saved before: ${changeDescription}`
      );
      
      console.log('Clone response:', cloneResponse);
      
      const clonedResumeId = cloneResponse.data?.resume?._id || cloneResponse.data?.data?.resume?._id;
      
      if (!clonedResumeId) {
        console.error('No resume ID in clone response:', cloneResponse);
        return null;
      }
      
      console.log('Cloned resume ID:', clonedResumeId);
      
      // Archive it immediately so it doesn't clutter the main list
      console.log('Archiving snapshot...');
      const archiveResponse = await apiArchiveResume(clonedResumeId);
      console.log('Archive response:', archiveResponse);
      
      // Refresh resumes list to include the new archived version
      console.log('Refreshing resumes list...');
      await loadAll();
      console.log('✅ Auto-version snapshot created and archived:', snapshotName);
      
      return cloneResponse.data?.resume || cloneResponse.data?.data?.resume;
    } catch (err) {
      console.error('❌ Failed to create auto-version snapshot:', err);
      console.error('Error details:', err.response?.data || err.message);
      // Don't block the main operation if snapshot fails
      return null;
    }
  };

  // UC-048 handlers and derived helpers
  const jobTypeConfigs = {
    general: { required: ['contactInfo', 'experience', 'education'], recommended: ['skills', 'summary'] },
    technical: { required: ['contactInfo', 'skills', 'experience'], recommended: ['projects', 'education'] },
    creative: { required: ['contactInfo', 'projects', 'experience'], recommended: ['skills', 'summary'] },
    academic: { required: ['contactInfo', 'education', 'projects'], recommended: ['experience', 'certifications'] },
    entry_level: { required: ['contactInfo', 'education', 'skills'], recommended: ['projects', 'experience'] },
  };

  const handleToggleSection = (key) => {
    setVisibleSections((prev) =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    setHasUnsavedChanges(true);
  };

  const applyPreset = (preset) => {
    setSectionOrder(preset.order);
    setVisibleSections(preset.order);
    setShowPresetMenu(false);
    setHasUnsavedChanges(true);
  };

  const saveCustomPreset = () => {
    if (!presetName.trim()) return;
    const newPreset = {
      name: presetName.trim(),
      order: sectionOrder,
      description: 'Custom arrangement',
      isCustom: true
    };
    setCustomPresets([...customPresets, newPreset]);
    setPresetName('');
    setShowSavePresetModal(false);
  };

  const openSectionFormatting = (sectionKey) => {
    setFormattingSection(sectionKey);
    setShowFormattingPanel(true);
  };

  const updateSectionFormatting = (key, formatting) => {
    setSectionFormatting((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...formatting }
    }));
    setHasUnsavedChanges(true);
  };

  const applyJobTypeConfig = (jobType) => {
    setSelectedJobType(jobType);
    const config = jobTypeConfigs[jobType];
    if (config) {
      const recommendedSections = [...config.required, ...config.recommended];
      setSectionOrder(recommendedSections.filter(key => DEFAULT_SECTIONS.find(s => s.key === key)));
      setVisibleSections(recommendedSections);
    }
    setHasUnsavedChanges(true);
  };

  const getSectionStatus = (sectionKey) => {
    const config = jobTypeConfigs[selectedJobType];
    if (config?.required?.includes(sectionKey)) return 'required';
    if (config?.recommended?.includes(sectionKey)) return 'recommended';
    return 'optional';
  };

  // UC-52: Helper function to highlight text differences
  const highlightTextDiff = (text1, text2) => {
    if (!text1 && !text2) return { text1: null, text2: null };
    if (!text1) return { text1: null, text2: <span className="bg-green-200 text-green-900 px-1 rounded">{text2}</span> };
    if (!text2) return { text1: <span className="bg-red-200 text-red-900 px-1 rounded">{text1}</span>, text2: null };
    
    // Simple word-level diff
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    if (text1 === text2) {
      return { text1: text1, text2: text2, identical: true };
    }
    
    // Find common and different words
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const highlightedText1 = words1.map((word, idx) => {
      if (!set2.has(word)) {
        return <span key={idx} className="bg-red-100 text-red-900 px-0.5 rounded">{word}</span>;
      }
      return word;
    });
    
    const highlightedText2 = words2.map((word, idx) => {
      if (!set1.has(word)) {
        return <span key={idx} className="bg-green-100 text-green-900 px-0.5 rounded">{word}</span>;
      }
      return word;
    });
    
    // Join with spaces
    const result1 = [];
    const result2 = [];
    
    highlightedText1.forEach((item, idx) => {
      if (idx > 0) result1.push(' ');
      result1.push(item);
    });
    
    highlightedText2.forEach((item, idx) => {
      if (idx > 0) result2.push(' ');
      result2.push(item);
    });
    
    return { text1: <span>{result1}</span>, text2: <span>{result2}</span> };
  };

  // Drag-and-drop move for sections (will be used in modal)
  const moveSection = (dragIndex, hoverIndex) => {
    setSectionOrder((prevOrder) => {
      const newOrder = [...prevOrder];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, removed);
      return newOrder;
    });
    setHasUnsavedChanges(true);
  };

  // Note: Auto-save has been replaced with manual save button
  // Users now explicitly save customization changes via "Save Changes" button

  // When opening a resume, hydrate customization from existing data or template order
  useEffect(() => {
    if (!showViewResumeModal || !viewingResume) return;
    const existing = viewingResume.sectionCustomization || {};
    
    console.log('Loading resume customization:', existing);
    
    // Use consistent field names (match what we save)
    const order = existing.sectionOrder || existing.order || (templates.find(t => t._id === viewingResume.templateId)?.layout?.sectionsOrder) || DEFAULT_SECTIONS.map(s => s.key);
    const vis = existing.visibleSections || existing.visible || order;
    const formatting = existing.sectionFormatting || existing.formatting || {};
    const jobType = existing.selectedJobType || existing.jobType || 'general';
    const presets = existing.customPresets || [];
    
    setSectionOrder(order);
    setVisibleSections(vis);
    setSectionFormatting(formatting);
    setSelectedJobType(jobType);
    setCustomPresets(presets);
    // DON'T reset hasUnsavedChanges here - this effect runs every time viewingResume updates
    // (including after regeneration), which would incorrectly clear the unsaved flag
    
    console.log('Loaded customization - Order:', order, 'Visible:', vis);
  }, [showViewResumeModal, viewingResume]);

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
      console.log('Loaded jobs:', savedAppliedJobs); // Debug: check job structure
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

  // Save section customization
  const saveSectionCustomization = async (resumeId, customization) => {
    try {
      await authWrap();
      await apiUpdateResume(resumeId, { sectionCustomization: customization });
    } catch (err) {
      console.error("Failed to save section customization:", err);
    }
  };

  // UC-048: Save all section customization changes
  const handleSaveCustomization = async () => {
    if (!viewingResume) return;
    
    setIsSavingCustomization(true);
    try {
      await authWrap();
      
      // STEP 1: Find the CURRENT database version from resumes state (before our local changes)
      // The resumes array contains the unmodified database versions
      console.log('Finding current database version for snapshot...');
      const currentDbVersion = resumes.find(r => r._id === viewingResume._id);
      
      if (!currentDbVersion) {
        console.warn('Current resume not found in resumes list, skipping snapshot');
      } else {
        // STEP 2: Create a snapshot of the OLD database version (before changes)
        console.log('Creating snapshot of old version:', currentDbVersion.name);
        const timestamp = new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        const snapshotName = `${currentDbVersion.name} (${timestamp})`;
        
        const cloneResponse = await apiCloneResume(
          currentDbVersion._id, 
          snapshotName,
          'Version snapshot before save'
        );
        
        const clonedResumeId = cloneResponse.data?.resume?._id || cloneResponse.data?.data?.resume?._id;
        
        if (clonedResumeId) {
          // Archive it immediately so it doesn't clutter the main list
          await apiArchiveResume(clonedResumeId);
          console.log('✅ Archived snapshot:', clonedResumeId);
        }
      }
      
      // STEP 3: Now save the NEW changes to the main resume
      console.log('Saving new changes to main resume...');
      
      // Build the update object with ALL changes (sections + customization)
      const updateData = {
        sections: viewingResume.sections, // Include section content changes (from AI regen, etc)
        sectionCustomization: {
          visibleSections,
          sectionOrder,
          sectionFormatting,
          selectedJobType,
          customPresets
        }
      };
      
      const response = await apiUpdateResume(viewingResume._id, updateData);
      
      // Get the updated resume from the response
      const savedResume = response.data?.resume || response.data?.data?.resume;
      
      // Update the viewing resume with the saved data from backend
      if (savedResume) {
        setViewingResume(savedResume);
        
        // Refresh the resumes list to include the new archived version
        await loadAll();
      } else {
        // Fallback: reload all resumes
        await loadAll();
      }
      
      // Clear unsaved changes flag
      setHasUnsavedChanges(false);
      
      // Show success message
      setSuccessMessage('✅ Resume saved successfully! Previous version archived.');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      console.error('Failed to save customization:', err);
      alert(`Failed to save changes: ${err.message || 'Please try again'}`);
    } finally {
      setIsSavingCustomization(false);
    }
  };

  // UC-51: Export handlers
  // When user clicks an export option, open a themed "Save As" modal first.
  // After they confirm filename, performExport will run the request and download.
  const handleExport = async (format) => {
    if (!viewingResume) return;
    setShowExportMenu(false);
    const filenameBase = `${viewingResume.name.replace(/[^a-z0-9-_]/gi, '_')}`;
    const extMap = { pdf: '.pdf', docx: '.docx', html: '.html', txt: '.txt' };
    const ext = extMap[format] || '';
    const suggested = `${filenameBase}${ext}`;
    setSaveAsFilename(suggested);
    setPendingExportFormat(format);
    setShowSaveAsModal(true);
  };

  // Perform the server request and trigger file download
  const performExport = async (format, filename) => {
    if (!viewingResume) return;
    setIsExporting(true);
    setExportFormat(format);
    setShowSaveAsModal(false);
    try {
      await authWrap();
      // Ensure filename has proper extension
      const extMap = { pdf: '.pdf', docx: '.docx', html: '.html', txt: '.txt' };
      const ext = extMap[format] || '';
      if (ext && filename && !filename.toLowerCase().endsWith(ext)) {
        filename = filename + ext;
      }
      
      // UC-51: Prepare watermark options
      const watermarkOptions = watermarkEnabled ? { enabled: true, text: watermarkText } : null;
      
      let response;
      switch (format) {
        case 'pdf':
          response = await exportResumePDF(viewingResume._id, watermarkOptions);
          break;
        case 'docx':
          response = await exportResumeDOCX(viewingResume._id, watermarkOptions);
          break;
        case 'html':
          response = await exportResumeHTML(viewingResume._id);
          break;
        case 'txt':
          response = await exportResumeText(viewingResume._id);
          break;
        default:
          throw new Error('Invalid export format');
      }

      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMessage(`Resume exported as ${format.toUpperCase()} successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Export failed:', err);
      let errorMsg = `Failed to export resume as ${format.toUpperCase()}. Please try again.`;
      try {
        const data = err?.response?.data;
        if (data instanceof Blob) {
          const text = await data.text();
          try {
            const json = JSON.parse(text);
            if (json?.message) errorMsg = json.message;
          } catch {
            if (text) errorMsg = text;
          }
        } else if (typeof err?.response?.data === 'object' && err.response.data?.message) {
          errorMsg = err.response.data.message;
        }
      } catch {}
      alert(errorMsg);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
      setPendingExportFormat(null);
    }
  };

  // UC-52: Version management handlers
  const handleCloneResume = async () => {
    if (!viewingResume || !cloneName.trim()) return;
    
    setIsCloning(true);
    try {
      await authWrap();
      const response = await apiCloneResume(viewingResume._id, cloneName.trim(), cloneDescription.trim());
      const clonedResume = response.data.data.resume;
      
      setResumes(prev => [clonedResume, ...prev]);
      setShowCloneModal(false);
      setCloneName('');
      setCloneDescription('');
      setSuccessMessage(`Resume cloned successfully as "${clonedResume.name}"!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Clone failed:', err);
      alert('Failed to clone resume. Please try again.');
    } finally {
      setIsCloning(false);
    }
  };

  const handleSetDefaultResume = async (resumeId) => {
    try {
      await authWrap();
      await apiSetDefaultResume(resumeId);
      
      // Update resumes list
      setResumes(prev => prev.map(r => ({
        ...r,
        isDefault: r._id === resumeId
      })));
      
      // Update viewing resume if it's the one being set as default
      if (viewingResume?._id === resumeId) {
        setViewingResume(prev => ({ ...prev, isDefault: true }));
      }
      
      setSuccessMessage('Default resume updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Set default failed:', err);
      alert('Failed to set default resume. Please try again.');
    }
  };

  const handleCompareResumes = async (resumeId2) => {
    if (!viewingResume || !resumeId2) return;
    
    try {
      await authWrap();
      const response = await apiCompareResumes(viewingResume._id, resumeId2);
      setComparisonData(response.data.data.comparison);
      setCompareResumeId(resumeId2);
      setShowCompareModal(true);
    } catch (err) {
      console.error('Compare failed:', err);
      alert('Failed to compare resumes. Please try again.');
    }
  };

  // UC-052: Revert to previous version
  const handleRevertToPreviousVersion = async () => {
    if (!viewingResume || !compareResumeId) return;
    
    const confirm = window.confirm(
      'Are you sure you want to revert to the previous version? This will create a new version snapshot of your current resume before reverting.'
    );
    
    if (!confirm) return;
    
    try {
      await authWrap();
      
      // Create snapshot of current version before reverting
      await createAutoVersionSnapshot(viewingResume, 'Before Revert');
      
      // Get the previous version's full data
      const previousResume = resumes.find(r => r._id === compareResumeId);
      if (!previousResume) {
        alert('Previous version not found.');
        return;
      }
      
      // Update current resume with previous version's content
      const revertedResume = {
        ...viewingResume,
        sections: previousResume.sections,
        sectionCustomization: previousResume.sectionCustomization
      };
      
      await apiUpdateResume(viewingResume._id, revertedResume);
      
      // Refresh resumes and update viewing resume
      await loadAll();
      setViewingResume(revertedResume);
      
      // Close comparison modal
      setShowCompareModal(false);
      setComparisonData(null);
      setCompareResumeId(null);
      
      setSuccessMessage('Successfully reverted to previous version!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      console.error('Revert failed:', err);
      alert('Failed to revert to previous version. Please try again.');
    }
  };

  // UC-52: Archive/Unarchive handlers
  const handleArchiveResume = async (resumeId) => {
    try {
      await authWrap();
      await apiArchiveResume(resumeId);
      
      setResumes(prev => prev.map(r => 
        r._id === resumeId ? { ...r, isArchived: true } : r
      ));
      
      if (viewingResume?._id === resumeId) {
        setViewingResume(prev => ({ ...prev, isArchived: true }));
      }
      
      // If not showing all resumes and not showing archived, expand view to show 4 active resumes
      if (!showAllResumes && !showArchivedResumes) {
        const nonArchivedCount = resumes.filter(r => !r.isArchived && r._id !== resumeId).length;
        // If we had exactly 4 showing and now will have less, keep showing 4 if possible
        if (nonArchivedCount >= 4) {
          // Keep current collapsed view - filter will handle showing 4
        }
      }
      
      setSuccessMessage('Resume archived successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Archive failed:', err);
      alert('Failed to archive resume. Please try again.');
    }
  };

  const handleUnarchiveResume = async (resumeId) => {
    try {
      await authWrap();
      await apiUnarchiveResume(resumeId);
      
      setResumes(prev => prev.map(r => 
        r._id === resumeId ? { ...r, isArchived: false } : r
      ));
      
      if (viewingResume?._id === resumeId) {
        setViewingResume(prev => ({ ...prev, isArchived: false }));
      }
      
      setSuccessMessage('Resume unarchived successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Unarchive failed:', err);
      alert('Failed to unarchive resume. Please try again.');
    }
  };

  // UC-52: Merge resumes handler
  const handleMergeResumes = async () => {
    if (!viewingResume || !compareResumeId || selectedMergeChanges.length === 0) return;
    
    setIsMerging(true);
    try {
      await authWrap();
      
      // Get the source resume (the old version we're pulling from)
      const sourceResume = resumes.find(r => r._id === compareResumeId);
      if (!sourceResume) {
        alert('Source resume not found');
        return;
      }
      
      // Create updated resume by merging selected sections
      const updatedResume = { ...viewingResume };
      
      selectedMergeChanges.forEach(change => {
        if (change === 'summary' && sourceResume.sections?.summary) {
          // Summary: replace entirely
          updatedResume.sections.summary = sourceResume.sections.summary;
        } else if (change === 'skills' && sourceResume.sections?.skills) {
          // Skills: MERGE (add missing skills, don't replace)
          const currentSkills = updatedResume.sections?.skills || [];
          const sourceSkills = sourceResume.sections.skills;
          
          // Get skill names from current resume
          const currentSkillNames = new Set(
            currentSkills.map(s => typeof s === 'string' ? s : s.name)
          );
          
          // Add skills from source that aren't already in current
          const newSkills = sourceSkills.filter(skill => {
            const skillName = typeof skill === 'string' ? skill : skill.name;
            return !currentSkillNames.has(skillName);
          });
          
          // Combine current + new skills
          updatedResume.sections.skills = [...currentSkills, ...newSkills];
        } else if (change.startsWith('skill.')) {
          // Individual skill selection: skill.0, skill.1, etc.
          const skillIndex = parseInt(change.split('.')[1]);
          const skillToAdd = sourceResume.sections?.skills?.[skillIndex];
          
          if (skillToAdd) {
            const currentSkills = updatedResume.sections?.skills || [];
            const skillName = typeof skillToAdd === 'string' ? skillToAdd : skillToAdd.name;
            
            // Check if skill already exists
            const skillExists = currentSkills.some(s => {
              const existingName = typeof s === 'string' ? s : s.name;
              return existingName === skillName;
            });
            
            if (!skillExists) {
              updatedResume.sections.skills = [...currentSkills, skillToAdd];
            }
          }
        } else if (change === 'experience' && sourceResume.sections?.experience) {
          // Experience: REPLACE all (user selected "All Experience")
          updatedResume.sections.experience = sourceResume.sections.experience;
        } else if (change.startsWith('experience.')) {
          // Individual experience item: experience.0, experience.1, etc.
          const expIndex = parseInt(change.split('.')[1]);
          const expToAdd = sourceResume.sections?.experience?.[expIndex];
          
          if (expToAdd) {
            const currentExperience = updatedResume.sections?.experience || [];
            
            // Check if this exact experience already exists (by title + company)
            const expExists = currentExperience.some(e => 
              e.title === expToAdd.title && e.company === expToAdd.company
            );
            
            if (!expExists) {
              updatedResume.sections.experience = [...currentExperience, expToAdd];
            }
          }
        } else if (change === 'education' && sourceResume.sections?.education) {
          updatedResume.sections.education = sourceResume.sections.education;
        } else if (change === 'projects' && sourceResume.sections?.projects) {
          updatedResume.sections.projects = sourceResume.sections.projects;
        } else if (change === 'sectionCustomization' && sourceResume.sectionCustomization) {
          // Restore section visibility settings
          if (sourceResume.sectionCustomization.visibleSections) {
            setVisibleSections(sourceResume.sectionCustomization.visibleSections);
          }
          if (sourceResume.sectionCustomization.sectionOrder) {
            setSectionOrder(sourceResume.sectionCustomization.sectionOrder);
          }
          if (sourceResume.sectionCustomization.sectionFormatting) {
            setSectionFormatting(sourceResume.sectionCustomization.sectionFormatting);
          }
        }
      });
      
      // Update the viewing resume locally (DON'T save to DB yet)
      setViewingResume(updatedResume);
      
      // Mark as having unsaved changes
      setHasUnsavedChanges(true);
      
      // Close modals and reset state
      setShowMergeModal(false);
      setShowCompareModal(false);
      setSelectedMergeChanges([]);
      setComparisonData(null);
      setCompareResumeId(null);
      
      setSuccessMessage('Changes merged! Click Save to apply.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Merge failed:', err);
      alert('Failed to merge changes. Please try again.');
    } finally {
      setIsMerging(false);
    }
  };

  // UC-49: Skills optimization handler
  const handleOptimizeSkills = async () => {
    if (!viewingResume) return;
    
    // Parse selected job (format: "title|company")
    const jobSelector = selectedJobForSkills || selectedJobForExperience;
    
    if (!jobSelector) {
      alert('Please select a job posting to optimize skills against.');
      return;
    }

    const [title, company] = jobSelector.split('|');
    if (!title || !company) {
      alert('Invalid job selection. Please select a valid job from the dropdown.');
      console.error('Invalid job selector:', jobSelector);
      return;
    }
    
    setIsOptimizingSkills(true);
    try {
      await authWrap();
      const response = await optimizeResumeSkills(viewingResume._id, { title, company });
      setSkillsOptimizationData(response.data.data);
      
      // Initialize current resume skills
      const currentSkills = viewingResume.sections?.skills || [];
      setCurrentResumeSkills(currentSkills.map(s => typeof s === 'string' ? s : s.name));
      setSelectedSkillsToAdd([]);
      
      setShowSkillsOptimization(true);
    } catch (err) {
      console.error('Skills optimization failed:', err);
      const errorMsg = err.response?.data?.message || 'Failed to optimize skills. Please try again.';
      alert(errorMsg);
    } finally {
      setIsOptimizingSkills(false);
    }
  };

  // Delete individual skill
  const handleDeleteSkill = (skillToDelete) => {
    if (!viewingResume) return;
    
    const skillName = typeof skillToDelete === 'string' ? skillToDelete : skillToDelete.name;
    
    const updatedSkills = (viewingResume.sections?.skills || []).filter(skill => {
      const currentSkillName = typeof skill === 'string' ? skill : skill.name;
      return currentSkillName !== skillName;
    });
    
    const updatedResume = {
      ...viewingResume,
      sections: {
        ...viewingResume.sections,
        skills: updatedSkills
      }
    };
    
    setViewingResume(updatedResume);
    setHasUnsavedChanges(true);
  };

  // UC-49: Apply skill changes to resume
  const handleApplySkillChanges = async () => {
    if (!viewingResume) return;
    
    setIsApplyingSkills(true);
    try {
      await authWrap();
      
      // Combine current skills with selected new skills (avoiding duplicates)
      const newSkillsSet = new Set([...currentResumeSkills, ...selectedSkillsToAdd]);
      const updatedSkills = Array.from(newSkillsSet).map(skillName => ({
        name: skillName,
        level: 'Intermediate' // Default level, user can adjust in resume editor
      }));
      
      // Update resume with new skills (LOCAL STATE ONLY - not saved to DB yet)
      const updatedResume = {
        ...viewingResume,
        sections: {
          ...viewingResume.sections,
          skills: updatedSkills
        }
      };
      
      // DON'T save to database yet - let user click "Save Changes"
      // await apiUpdateResume(viewingResume._id, updatedResume);
      
      // Update local state only
      setViewingResume(updatedResume);
      
      // Update current skills list
      setCurrentResumeSkills(Array.from(newSkillsSet));
      setSelectedSkillsToAdd([]);
      
      // Mark as having unsaved changes (user must click Save to create version)
      setHasUnsavedChanges(true);
      
      // Show success banner
      setShowSkillsSuccessBanner(true);
      
      // Auto-close modal after 2 seconds
      setTimeout(() => {
        setShowSkillsOptimization(false);
        setShowSkillsSuccessBanner(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to apply skill changes:', err);
      alert('Failed to update skills. Please try again.');
    } finally {
      setIsApplyingSkills(false);
    }
  };

  // UC-49: Toggle skill selection
  const toggleSkillSelection = (skillName) => {
    setSelectedSkillsToAdd(prev => {
      if (prev.includes(skillName)) {
        return prev.filter(s => s !== skillName);
      } else {
        return [...prev, skillName];
      }
    });
  };

  // UC-49: Remove skill from resume
  const handleRemoveSkill = (skillName) => {
    setCurrentResumeSkills(prev => prev.filter(s => s !== skillName));
  };

  // UC-50: Experience tailoring handler
  const handleTailorExperience = async () => {
    if (!viewingResume) return;
    
    // Parse selected job (format: "title|company")
    const jobSelector = selectedJobForExperience || selectedJobForSkills;
    
    if (!jobSelector) {
      alert('Please select a job posting to tailor experience for.');
      return;
    }

    const [title, company] = jobSelector.split('|');
    if (!title || !company) {
      alert('Invalid job selection. Please select a valid job from the dropdown.');
      console.error('Invalid job selector:', jobSelector);
      return;
    }
    
    setIsTailoringExperience(true);
    try {
      await authWrap();
      const response = await tailorExperienceForJob(viewingResume._id, { title, company });
      setExperienceTailoringData(response.data.data);
      setSelectedExperienceVariations({}); // Reset selections
      setShowExperienceTailoring(true);
    } catch (err) {
      console.error('Experience tailoring failed:', err);
      const errorMsg = err.response?.data?.message || 'Failed to tailor experience. Please try again.';
      alert(errorMsg);
    } finally {
      setIsTailoringExperience(false);
    }
  };

  // UC-50: Toggle experience variation selection
  const toggleExperienceVariation = (expIdx, bulletIdx, variationType) => {
    const key = `${expIdx}-${bulletIdx}`;
    setSelectedExperienceVariations(prev => {
      const newSelections = { ...prev };
      // If clicking the same variation, deselect it (go back to original)
      if (newSelections[key] === variationType) {
        delete newSelections[key];
      } else {
        newSelections[key] = variationType;
      }
      return newSelections;
    });
  };

  // UC-50: Apply selected experience variations to resume
  const handleApplyExperienceChanges = async () => {
    if (!viewingResume || !experienceTailoringData) return;
    
    setIsApplyingExperience(true);
    try {
      await authWrap();
      
      // Build updated experience array with selected variations
      const updatedExperience = viewingResume.sections?.experience?.map((job, expIdx) => {
        const aiExperience = experienceTailoringData.tailoring?.experiences?.find(
          exp => exp.experienceIndex === expIdx
        );
        
        if (!aiExperience || !aiExperience.bullets) {
          return job; // No AI suggestions for this experience, keep original
        }
        
        // Map bullets with selected variations
        const updatedBullets = job.bullets?.map((originalBullet, bulletIdx) => {
          const key = `${expIdx}-${bulletIdx}`;
          const selectedVariation = selectedExperienceVariations[key];
          
          if (!selectedVariation || selectedVariation === 'original') {
            return originalBullet; // Keep original
          }
          
          // Find the AI bullet suggestion
          const aiBullet = aiExperience.bullets?.find(b => {
            // Match by comparing original text (after cleaning)
            const cleanOriginal = (b.originalBullet || '').trim().toLowerCase();
            const cleanCurrent = originalBullet.trim().toLowerCase();
            return cleanOriginal.includes(cleanCurrent) || cleanCurrent.includes(cleanOriginal);
          });
          
          if (aiBullet && aiBullet.variations && aiBullet.variations[selectedVariation]) {
            return aiBullet.variations[selectedVariation]; // Use selected variation
          }
          
          return originalBullet; // Fallback to original
        });
        
        return {
          ...job,
          bullets: updatedBullets || job.bullets
        };
      });
      
      // Update resume with new experience (LOCAL STATE ONLY - not saved to DB yet)
      const updatedResume = {
        ...viewingResume,
        sections: {
          ...viewingResume.sections,
          experience: updatedExperience
        }
      };
      
      // DON'T save to database yet - let user click "Save Changes"
      // await apiUpdateResume(viewingResume._id, updatedResume);
      
      // Update local state only
      setViewingResume(updatedResume);
      
      // Mark as having unsaved changes (user must click Save to create version)
      setHasUnsavedChanges(true);
      
      // Show success banner
      setShowExperienceSuccessBanner(true);
      
      // Auto-close modal after 2 seconds
      setTimeout(() => {
        setShowExperienceTailoring(false);
        setShowExperienceSuccessBanner(false);
        setSelectedExperienceVariations({});
      }, 2000);
    } catch (err) {
      console.error('Failed to apply experience changes:', err);
      alert('Failed to update experience. Please try again.');
    } finally {
      setIsApplyingExperience(false);
    }
  };

  // Resume handlers
  const handleViewResume = async (resume) => {
    setViewingResume(resume);
    setShowViewResumeModal(true);
    setHasUnsavedChanges(false); // Reset unsaved changes when opening a resume
    // Load jobs for AI optimization features
    if (jobs.length === 0) {
      await loadJobs();
    }
    // Always use HTML view now; PDF experimental view removed
  };

  const loadResumePdf = async (resumeId) => {
    try {
      setIsGeneratingPdf(true);
      await authWrap();
      const token = await getToken();
      setAuthToken(token);
      
      console.log('Loading PDF for resume:', resumeId);
      const response = await api.get(`/api/resume/resumes/${resumeId}/pdf`, {
        responseType: 'blob',
        timeout: 30000 // 30 second timeout for PDF generation
      });
      
      // Verify we got a PDF blob
      if (!response.data || response.data.size === 0) {
        throw new Error('Empty PDF response');
      }
      
      // Create object URL for the PDF blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      console.log('PDF loaded successfully, size:', blob.size, 'bytes');
    } catch (err) {
      console.error('Failed to load PDF:', err);
      // Fall back to HTML view if PDF generation fails
      setViewingAsPdf(false);
      setPdfUrl(null);
      
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      if (err.response?.status === 400 || err.response?.status === 404) {
        alert(`PDF generation not available: ${errorMessage}\n\nShowing HTML view instead.`);
      } else {
        alert(`Failed to generate PDF: ${errorMessage}\n\nShowing HTML view instead.`);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
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
      
      // Mark as having unsaved changes (user must click Save to create version)
      setHasUnsavedChanges(true);
      
      // Show success banner
      setSuccessMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} regenerated successfully! Click Save to create a version.`);
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


  const handleDeleteTemplateClick = (tpl) => {
    setDeletingTemplate(tpl);
    setShowDeleteTemplateModal(true);
  };

  const handleConfirmDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    
    setIsDeleting(true);
    try {
      await authWrap();
      await apiDeleteTemplate(deletingTemplate._id);
      setShowDeleteTemplateModal(false);
      setDeletingTemplate(null);
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to delete template");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeleteTemplate = () => {
    if (!isDeleting) {
      setShowDeleteTemplateModal(false);
      setDeletingTemplate(null);
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
      // Initialize PDF data variables (will be populated if PDF analysis succeeds)
      let pdfBuffer = null;
      let detailedLayout = null;
      let sectionMapping = null;
      
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
          
          // Store PDF buffer and detailed layout for pixel-perfect generation
          pdfBuffer = analysis?.pdfBuffer || null;
          detailedLayout = analysis?.detailedLayout || null;
          sectionMapping = analysis?.sectionMapping || null;
          
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
      
      // Store project and experience formats if extracted from PDF
      const projectFormat = extractedLayout?.projectFormat || null;
      const experienceFormat = extractedLayout?.experienceFormat || null;
      
      console.log('Storing layout formats:', { educationFormat, projectFormat, experienceFormat });
      
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
          // Store section-specific formats if extracted
          educationFormat: educationFormat,
          projectFormat: projectFormat,
          experienceFormat: experienceFormat
        },
        theme: theme,
        analysis: __analysis || { used: false },
        // Include PDF data for pixel-perfect generation
        pdfBuffer: pdfBuffer || null,
        pdfLayout: detailedLayout || null,
        sectionMapping: sectionMapping || null
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
      const response = await apiImportTemplate(pendingImport);
      console.log("Template import response:", response);
      setShowCustomizeImport(false);
      setPendingImport(null);
      setImportFile(null);
      setImportMethod("file");
      await loadAll();
      setSuccessMessage("Template imported successfully!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Template import error:", err);
      console.error("Error response:", err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || "Failed to import template";
      alert(`Failed to import template: ${errorMessage}`);
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
          <div className="mb-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: "#4F5348" }}>
                  Resumes & Cover Letters
                </h1>
                <p className="text-sm" style={{ color: "#656A5C" }}>
                  View, create, and manage your resumes, cover letters, and templates.
                </p>
              </div>
              
            </div>
            
            {/* Removed Experimental Features Toggle */}
          </div>

          {/* Resumes Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-heading font-bold" style={{ color: "#4F5348" }}>
                  My Resumes
                </h2>
                {/* UC-52: Show Archived Toggle */}
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={showArchivedResumes}
                    onChange={(e) => setShowArchivedResumes(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Show Archived</span>
                </label>
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
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* UC-52: Filter by archived status first, then limit display */}
                  {resumes
                    .filter(r => showArchivedResumes ? true : !r.isArchived)
                    .slice(0, showAllResumes ? undefined : 4)
                    .map((resume) => (
                    <ResumeTile
                      key={resume._id}
                      resume={resume}
                      template={templates.find(t => t._id === resume.templateId)}
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
                
                {/* View All / View Less Button */}
                {resumes.length > 4 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowAllResumes(!showAllResumes)}
                      className="px-6 py-2 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: '#777C6D' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                    >
                      {showAllResumes ? 'View Less' : 'View All'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Cover Letters Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-heading font-bold mb-4" style={{ color: "#4F5348" }}>
              My Cover Letters
            </h2>
            <Card variant="elevated" className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">Cover letters coming soon</p>
                <p className="text-sm">This feature will be available in a future update</p>
              </div>
            </Card>
          </div>
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
                  className="px-4 py-2 text-white rounded-lg transition flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: '#777C6D' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
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
                      onDelete={() => handleDeleteTemplateClick(tpl)}
                      onPreview={() => setPreviewTemplate(tpl)}
                    />
                  ))}
                </div>
              )}
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

                {/* UC-051: Theme Preset Selector */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-heading font-semibold mb-3">Theme Preset</h4>
                  <p className="text-sm text-gray-600 mb-4">Choose a pre-designed theme or customize colors manually below</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getThemePresetNames().map(presetName => {
                      const preset = getThemePreset(presetName);
                      const isSelected = customizeTemplate.theme?.presetName === presetName;
                      return (
                        <button
                          key={presetName}
                          onClick={() => {
                            const themeData = getThemePreset(presetName);
                            setCustomizeTemplate({
                              ...customizeTemplate,
                              theme: {
                                ...themeData,
                                presetName
                              }
                            });
                          }}
                          className={`p-4 rounded-lg border-2 transition text-left ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-900">{preset.name}</div>
                            {isSelected && (
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mb-3">{preset.description}</div>
                          <div className="flex gap-1">
                            <div 
                              className="w-6 h-6 rounded border border-gray-300" 
                              style={{ backgroundColor: preset.colors.primary }}
                              title="Primary"
                            />
                            <div 
                              className="w-6 h-6 rounded border border-gray-300" 
                              style={{ backgroundColor: preset.colors.accent }}
                              title="Accent"
                            />
                            <div 
                              className="w-6 h-6 rounded border border-gray-300" 
                              style={{ backgroundColor: preset.colors.text }}
                              title="Text"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-lg font-heading font-semibold mb-3">Custom Theme Colors</h4>
                  <p className="text-sm text-gray-600 mb-3">Fine-tune the selected theme or create your own color scheme</p>
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
          className="fixed inset-0 flex items-center justify-center z-[99999]" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 99999 }}
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

      {/* Delete Template Confirmation Modal */}
      {showDeleteTemplateModal && deletingTemplate && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[99999]" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 99999 }}
          onClick={handleCancelDeleteTemplate}
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
                Are you sure you want to delete this template?
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900">{deletingTemplate.name}</p>
                <p className="text-sm text-gray-600 capitalize">{deletingTemplate.type} template</p>
              </div>
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <button
                type="button"
                onClick={handleCancelDeleteTemplate}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTemplate}
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

      {/* Save As (Export filename) Modal - replaces window.prompt */}
      {showSaveAsModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-60"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => !isExporting && setShowSaveAsModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-50 border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-heading font-semibold text-gray-900">Download Resume</h3>
                </div>
                <button
                  onClick={() => !isExporting && setShowSaveAsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <label htmlFor="saveAsInput" className="block text-sm font-medium text-gray-700 mb-2">Filename</label>
              <input
                id="saveAsInput"
                type="text"
                value={saveAsFilename}
                onChange={(e) => setSaveAsFilename(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isExporting && saveAsFilename.trim()) {
                    performExport(pendingExportFormat, saveAsFilename.trim());
                  }
                }}
                disabled={isExporting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Enter filename"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">Enter a filename for the exported file. The appropriate extension will be kept if included.</p>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => !isExporting && setShowSaveAsModal(false)}
                disabled={isExporting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => performExport(pendingExportFormat, saveAsFilename.trim() || saveAsFilename)}
                disabled={isExporting || !saveAsFilename.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                style={{ backgroundColor: '#777C6D' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
              >
                {isExporting ? 'Exporting...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UC-51: Watermark Configuration Modal */}
      {showWatermarkModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-60"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowWatermarkModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-purple-50 border-b border-purple-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-[#4F5348]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <h3 className="text-lg font-heading font-semibold text-gray-900">Watermark Settings</h3>
                </div>
                <button
                  onClick={() => setShowWatermarkModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Configure the watermark text that will appear on exported PDF and DOCX files.
              </p>
              
              <label htmlFor="watermarkTextInput" className="block text-sm font-medium text-gray-700 mb-2">
                Watermark Text
              </label>
              <input
                id="watermarkTextInput"
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && watermarkText.trim()) {
                    setShowWatermarkModal(false);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., CONFIDENTIAL, DRAFT, Property of..."
                autoFocus
              />
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">Preview</p>
                    <p className="text-gray-600 opacity-30 font-semibold text-2xl tracking-wide transform -rotate-45">
                      {watermarkText || 'CONFIDENTIAL'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => setShowWatermarkModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowWatermarkModal(false)}
                className="px-4 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition"
              >
                Save Settings
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
        
  // Order is controlled by 'sectionOrder' state (hydrated from template or resume)
        
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
              const summaryFmt = sectionFormatting['summary'] || {};
              return (
                <div key="summary" style={{ marginBottom: `${summaryFmt.spacing ?? sectionSpacing}px` }}>
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
                      color: summaryFmt.color || theme.colors.text, 
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
              const skillsFmt = sectionFormatting['skills'] || {};
              return (
                <div key="skills" style={{ marginBottom: `${skillsFmt.spacing ?? skillsSectionSpacing}px` }}>
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
                  <div className="flex flex-wrap gap-2 print:gap-1">
                    {viewingResume.sections.skills.map((skill, idx) => {
                      const skillName = typeof skill === 'string' ? skill : skill.name || skill;
                      return (
                        <div 
                          key={idx}
                          className="group inline-flex items-center gap-1 px-2 py-1 print:px-1 print:py-0.5 rounded print:rounded-sm bg-gray-100 print:bg-transparent"
                          style={{
                            fontFamily: theme.fonts.body,
                            fontSize: theme.fonts.sizes?.body || "14px"
                          }}
                        >
                          <span style={{ color: skillsFmt.color || theme.colors.text }}>
                            {skillName}
                          </span>
                          <button
                            onClick={() => handleDeleteSkill(skill)}
                            className="print:hidden opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 ml-1"
                            title="Remove skill"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            
            case 'education':
              if (!viewingResume.sections?.education || viewingResume.sections.education.length === 0) return null;
              const eduSectionSpacing = resumeTemplate.layout?.sectionSpacing || 24;
              const eduHeaderStyle = resumeTemplate.layout?.headerStyle || 'underline';
              const educationFmt = sectionFormatting['education'] || {};
              return (
                <div key="education" style={{ marginBottom: `${educationFmt.spacing ?? eduSectionSpacing}px` }}>
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
              const projectsFmt = sectionFormatting['projects'] || {};
              return (
                <div key="projects" style={{ marginBottom: `${projectsFmt.spacing ?? projSectionSpacing}px` }}>
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
                            color: projectsFmt.color || theme.colors.text, 
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
              const awardsFmt = sectionFormatting['awards'] || {};
              return (
                <div key="awards" style={{ marginBottom: `${awardsFmt.spacing ?? awardsSectionSpacing}px` }}>
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
                          color: awardsFmt.color || theme.colors.text, 
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
              const certFmt = sectionFormatting['certifications'] || {};
              return (
                <div key="certifications" style={{ marginBottom: `${certFmt.spacing ?? certSectionSpacing}px` }}>
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
                          color: certFmt.color || theme.colors.text, 
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
        
        // DnD item for section toggle/reorder in customization panel
        const SectionToggleItem = ({ section, index }) => {
          const ref = React.useRef(null);
          const [, drop] = useDrop({
            accept: 'section',
            hover(item) {
              if (item.index === index) return;
              moveSection(item.index, index);
              item.index = index;
            },
          });
          const [{ isDragging }, drag] = useDrag({
            type: 'section',
            item: { type: 'section', key: section.key, index },
            collect: (monitor) => ({ isDragging: monitor.isDragging() }),
          });
          drag(drop(ref));

          const hasFormatting = !!sectionFormatting[section.key];
          const sectionStatus = getSectionStatus(section.key);

          // Completion indicator
          const isComplete = viewingResume.sections?.[section.key] && (
            Array.isArray(viewingResume.sections[section.key])
              ? viewingResume.sections[section.key].length > 0
              : !!viewingResume.sections[section.key]
          );

          const getBorderColor = () => {
            if (sectionStatus === 'required') return 'border-red-300';
            if (sectionStatus === 'recommended') return 'border-yellow-300';
            return 'border-gray-300';
          };

          return (
            <div
              ref={ref}
              style={{ opacity: isDragging ? 0.5 : 1 }}
              className={`flex items-center gap-2 text-sm cursor-move border-2 ${getBorderColor()} px-3 py-2 rounded-lg bg-white hover:shadow-md transition-shadow relative`}
            >
              <input
                type="checkbox"
                checked={visibleSections.includes(section.key)}
                onChange={() => handleToggleSection(section.key)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-700">{section.label}</span>
              <span
                className={`text-sm ${isComplete ? 'text-green-600' : 'text-gray-400'}`}
                title={isComplete ? 'Section complete' : 'Section incomplete'}
              >
                {isComplete ? '✓' : '○'}
              </span>
              {sectionStatus === 'required' && (
                <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-semibold">REQ</span>
              )}
              {sectionStatus === 'recommended' && (
                <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded font-semibold">REC</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); openSectionFormatting(section.key); }}
                className={`p-1 rounded hover:bg-gray-100 transition ${hasFormatting ? 'text-blue-600' : 'text-gray-400'}`}
                title="Format section"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
              <span className="text-gray-400 text-sm ml-auto" style={{ cursor: 'grab' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </span>
            </div>
          );
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
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-[#777C6D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-heading font-semibold text-gray-900">{viewingResume.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCustomizationPanel(v => !v)}
                  className="px-4 py-2 text-white rounded-lg transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: '#777C6D' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span>{showCustomizationPanel ? 'Hide Customization' : 'Customize Sections'}</span>
                </button>
                <button
                  onClick={() => setShowViewResumeModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - HTML View only (PDF experimental removed) */}
            <div className="flex-1 overflow-y-auto py-4 px-4" style={{ backgroundColor: '#525252' }}>
              {/* Customization Panel */}
              {showCustomizationPanel && (
                <div className="mb-4 mx-auto bg-white border border-gray-200 rounded-lg shadow-lg" style={{ width: '8.5in' }}>
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 rounded-t-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-[#777C6D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <h4 className="text-sm font-heading font-semibold text-gray-900">Section Customization</h4>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {/* Job Type and Presets Row */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Job Type:</label>
                        <select
                          value={selectedJobType}
                          onChange={(e) => applyJobTypeConfig(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="general">General</option>
                          <option value="technical">Technical/Engineering</option>
                          <option value="creative">Creative/Design</option>
                          <option value="academic">Academic/Research</option>
                          <option value="entry_level">Entry Level</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 relative">
                        <button
                          onClick={() => setShowPresetMenu(v => !v)}
                          className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Presets
                        </button>
                        {showPresetMenu && (
                          <div className="absolute right-0 top-12 z-10 w-64 bg-white border border-gray-200 rounded-lg shadow-xl">
                            <div className="py-2 max-h-64 overflow-auto">
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Built-in Presets</div>
                              {SECTION_PRESETS.map(preset => (
                                <button
                                  key={preset.name}
                                  onClick={() => applyPreset(preset)}
                                  className="w-full text-left px-3 py-2 hover:bg-blue-50 transition"
                                >
                                  <div className="font-medium text-sm text-gray-900">{preset.name}</div>
                                  <div className="text-xs text-gray-500">{preset.description}</div>
                                </button>
                              ))}
                              {customPresets.length > 0 && (
                                <>
                                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2 border-t">Custom Presets</div>
                                  {customPresets.map((preset, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => applyPreset(preset)}
                                      className="w-full text-left px-3 py-2 hover:bg-blue-50 transition"
                                    >
                                      <div className="font-medium text-sm text-gray-900">{preset.name}</div>
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => setShowSavePresetModal(true)}
                          className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save Preset
                        </button>
                      </div>
                    </div>
                    
                    {/* Sections Grid */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Section Order & Visibility (Drag to Reorder)</label>
                      <DndProvider backend={HTML5Backend}>
                        <div className="flex flex-wrap gap-2">
                          {sectionOrder.map((key, idx) => {
                            const section = DEFAULT_SECTIONS.find(s => s.key === key);
                            if (!section) return null;
                            return <SectionToggleItem key={key} section={section} index={idx} />;
                          })}
                        </div>
                      </DndProvider>
                    </div>

                    {/* AI Optimization Section (UC-49 & UC-50) */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#4F5348]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI Optimization
                      </h4>
                      
                      {/* Job Selector */}
                      {jobs.length > 0 && (
                        <div className="mb-4">
                          <label className="text-xs font-medium text-gray-700 mb-2 block">Select Job for Optimization:</label>
                          <select
                            value={selectedJobForSkills || selectedJobForExperience || ''}
                            onChange={(e) => {
                              const selectedValue = e.target.value;
                              console.log('Selected job:', selectedValue); // Debug
                              setSelectedJobForSkills(selectedValue);
                              setSelectedJobForExperience(selectedValue);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                          >
                            <option value="">Select a job...</option>
                            {jobs.map((job, idx) => {
                              // Ensure we have a valid job object
                              if (!job || !job.title || !job.company) {
                                console.warn('Invalid job object:', job);
                                return null;
                              }
                              
                              // Use title|company as the value (pipe separator)
                              const jobValue = `${job.title}|${job.company}`;
                              const displayText = `${job.title} at ${job.company}`;
                              
                              return (
                                <option key={idx} value={jobValue}>
                                  {displayText}
                                </option>
                              );
                            }).filter(Boolean)}
                          </select>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {/* UC-49: Skills Optimization Button */}
                        <button
                          onClick={handleOptimizeSkills}
                          disabled={isOptimizingSkills || (!selectedJobForSkills && !viewingResume.metadata?.tailoredForJob)}
                          className="flex-1 px-3 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isOptimizingSkills ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Optimizing...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              Optimize Skills
                            </>
                          )}
                        </button>

                        {/* UC-50: Experience Tailoring Button */}
                        <button
                          onClick={handleTailorExperience}
                          disabled={isTailoringExperience || (!selectedJobForExperience && !viewingResume.metadata?.tailoredForJob)}
                          className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isTailoringExperience ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Tailoring...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Tailor Experience
                            </>
                          )}
                        </button>
                      </div>

                      {jobs.length === 0 && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          Save or apply to jobs to use AI optimization features.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                  className="flex flex-wrap gap-2 justify-center" 
                  style={{ 
                    color: theme.colors.muted, 
                    fontFamily: theme.fonts.body, 
                    fontSize: theme.fonts.sizes?.small || "12px"
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
                    className="text-xs flex flex-wrap gap-2 mt-1 justify-center" 
                    style={{ 
                      color: '#4A5568'
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
                        >
                          Portfolio
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Render sections in current customized order and visibility */}
              {sectionOrder
                .filter(sectionKey => visibleSections.includes(sectionKey))
                .map(sectionType => renderSection(sectionType))}

              </div>
            </div>

            {/* Save Preset Modal */}
            {showSavePresetModal && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-50 p-4" 
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
                onClick={() => setShowSavePresetModal(false)}
              >
                <div 
                  className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-heading font-semibold text-gray-900">Save Section Arrangement</h3>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6">
                    <label htmlFor="presetName" className="block text-sm font-medium text-gray-700 mb-2">
                      Preset Name
                    </label>
                    <input
                      id="presetName"
                      type="text"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && presetName.trim()) {
                          saveCustomPreset();
                        }
                      }}
                      placeholder="e.g., My Custom Layout"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>

                  {/* Modal Actions */}
                  <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                    <button
                      onClick={() => setShowSavePresetModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCustomPreset}
                      disabled={!presetName.trim()}
                      className="px-4 py-2 text-white rounded-lg transition disabled:opacity-50"
                      style={{ backgroundColor: '#777C6D' }}
                      onMouseOver={(e) => !presetName.trim() ? null : e.currentTarget.style.backgroundColor = '#656A5C'}
                      onMouseOut={(e) => !presetName.trim() ? null : e.currentTarget.style.backgroundColor = '#777C6D'}
                    >
                      Save Preset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Section Formatting Panel */}
            {showFormattingPanel && formattingSection && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-50 p-4" 
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
                onClick={() => setShowFormattingPanel(false)}
              >
                <div 
                  className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="w-6 h-6 text-[#777C6D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-heading font-semibold text-gray-900">
                          Format: {DEFAULT_SECTIONS.find(s => s.key === formattingSection)?.label}
                        </h3>
                      </div>
                      <button
                        type="button"
                        aria-label="Close"
                        onClick={() => setShowFormattingPanel(false)}
                        className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#777C6D] focus:ring-offset-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                      <select
                        value={sectionFormatting[formattingSection]?.fontSize || 'medium'}
                        onChange={(e) => updateSectionFormatting(formattingSection, { fontSize: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium (Default)</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Font Weight</label>
                      <select
                        value={sectionFormatting[formattingSection]?.fontWeight || 'normal'}
                        onChange={(e) => updateSectionFormatting(formattingSection, { fontWeight: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                      >
                        <option value="light">Light</option>
                        <option value="normal">Normal (Default)</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={sectionFormatting[formattingSection]?.color || '#000000'}
                          onChange={(e) => updateSectionFormatting(formattingSection, { color: e.target.value })}
                          className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={sectionFormatting[formattingSection]?.color || '#000000'}
                          onChange={(e) => updateSectionFormatting(formattingSection, { color: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent font-mono text-sm"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bottom Spacing (px)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          value={sectionFormatting[formattingSection]?.spacing || 24}
                          onChange={(e) => updateSectionFormatting(formattingSection, { spacing: e.target.value })}
                          className="flex-1"
                          min="0"
                          max="100"
                        />
                        <input
                          type="number"
                          value={sectionFormatting[formattingSection]?.spacing || 24}
                          onChange={(e) => updateSectionFormatting(formattingSection, { spacing: e.target.value })}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent text-sm"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                    <button
                      onClick={() => {
                        const newFormatting = { ...sectionFormatting };
                        delete newFormatting[formattingSection];
                        setSectionFormatting(newFormatting);
                        setShowFormattingPanel(false);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                    >
                      Reset to Default
                    </button>
                    <button
                      onClick={() => setShowFormattingPanel(false)}
                      className="px-4 py-2 text-white rounded-lg transition"
                      style={{ backgroundColor: '#777C6D' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message Banner */}
            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 px-6 py-3 print:hidden">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Unsaved Changes Indicator */}
            {hasUnsavedChanges && !successMessage && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 px-6 py-3 print:hidden">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-medium text-yellow-800">You have unsaved changes. Click "Save Changes" to keep your customization.</p>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t print:hidden">
              <div className="flex items-center gap-3">
                <p className="text-[9px] text-gray-500">
                  Last modified: {new Date(viewingResume.updatedAt).toLocaleString()}
                </p>
                {viewingResume.isDefault && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    Default
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {/* UC-52: Compare Button */}
                <button
                  onClick={() => {
                    // Show selector to choose which resume to compare with
                    setCompareResumeId(null);
                    setComparisonData(null);
                    setShowCompareModal(true);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
                  title="Compare with another resume"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  Compare
                </button>
                
                {/* UC-048: Save Customization Button */}
                <button
                  onClick={handleSaveCustomization}
                  disabled={!hasUnsavedChanges || isSavingCustomization}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    hasUnsavedChanges && !isSavingCustomization
                      ? 'bg-[#777C6D] text-white hover:bg-[#656A5C]'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  title={hasUnsavedChanges ? "Save section customization changes" : "No unsaved changes"}
                >
                  {isSavingCustomization ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                    </>
                  )}
                </button>
                
                {/* UC-52: Set Default Button */}
                {!viewingResume.isDefault && (
                  <button
                    onClick={() => handleSetDefaultResume(viewingResume._id)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
                    title="Set as default resume"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Set Default
                  </button>
                )}
                
                {/* UC-52: Archive/Unarchive Button */}
                <button
                  onClick={() => viewingResume.isArchived 
                    ? handleUnarchiveResume(viewingResume._id) 
                    : handleArchiveResume(viewingResume._id)
                  }
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
                  title={viewingResume.isArchived ? "Unarchive resume" : "Archive resume"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  {viewingResume.isArchived ? 'Unarchive' : 'Archive'}
                </button>
                
                {/* UC-51: Export Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={isExporting}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                  
                  {showExportMenu && !isExporting && (
                    <div className="absolute right-0 bottom-full mb-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                      <div className="py-1">
                        {/* UC-51: Watermark Toggle */}
                        <div className="px-4 py-2 border-b border-gray-200">
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-xs font-medium text-gray-700">Watermark</span>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={watermarkEnabled}
                                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </div>
                          </label>
                          {watermarkEnabled && (
                            <button
                              onClick={() => { setShowExportMenu(false); setShowWatermarkModal(true); }}
                              className="mt-2 w-full text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Configure: "{watermarkText}"
                            </button>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleExport('pdf')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Export as PDF
                        </button>
                        <button
                          onClick={() => handleExport('docx')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export as DOCX
                        </button>
                        <button
                          onClick={() => handleExport('html')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          Export as HTML
                        </button>
                        <button
                          onClick={() => handleExport('txt')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export as Text
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button> */}
                <button
                  onClick={() => setShowViewResumeModal(false)}
                  className="px-4 py-2 text-white rounded-lg transition"
                  style={{ backgroundColor: '#777C6D' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
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

      {/* UC-52: Clone Resume Modal */}
      {showCloneModal && viewingResume && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => !isCloning && setShowCloneModal(false)}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-heading font-semibold text-gray-900">Clone Resume</h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Create a copy of "{viewingResume.name}" with a new name.
              </p>
              <label htmlFor="cloneNameInput" className="block text-sm font-medium text-gray-700 mb-2">
                New Resume Name
              </label>
              <input
                id="cloneNameInput"
                type="text"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && cloneName.trim()) {
                    handleCloneResume();
                  }
                }}
                placeholder="Enter name for cloned resume"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                disabled={isCloning}
              />
              
              <label htmlFor="cloneDescriptionInput" className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                Version Description (Optional)
              </label>
              <textarea
                id="cloneDescriptionInput"
                value={cloneDescription}
                onChange={(e) => setCloneDescription(e.target.value)}
                placeholder="Describe this version (e.g., 'Tailored for software engineering roles')"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isCloning}
              />
            </div>

            {/* Modal Actions */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => setShowCloneModal(false)}
                disabled={isCloning}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCloneResume}
                disabled={isCloning || !cloneName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isCloning ? 'Cloning...' : 'Clone Resume'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UC-52: Compare Resume Modal */}
      {showCompareModal && viewingResume && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => {
            setShowCompareModal(false);
            setCompareResumeId(null);
            setComparisonData(null);
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#777C6D] border-b px-6 py-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <h3 className="text-xl font-heading font-bold text-white">Compare Resume Versions</h3>
                </div>
                <button
                  onClick={() => {
                    setShowCompareModal(false);
                    setCompareResumeId(null);
                    setComparisonData(null);
                  }}
                  className="text-white hover:text-gray-200 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {!comparisonData ? (
                /* Resume Selector - Only show previous versions */
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-1">Version History</h4>
                        <p className="text-sm text-blue-800">
                          Compare with previous versions of this resume. Only cloned versions of <strong>{viewingResume.name}</strong> are shown below.
                        </p>
                      </div>
                    </div>
                  </div>
                  {(() => {
                    // Filter to only show versions that are clones of the current resume
                    // This includes: direct clones, reverse clones, and sibling clones
                    
                    console.log('=== VERSION HISTORY DEBUG ===');
                    console.log('Current resume:', viewingResume.name, 'ID:', viewingResume._id);
                    console.log('Current resume clonedFrom:', viewingResume.metadata?.clonedFrom);
                    console.log('Total resumes in state:', resumes.length);
                    console.log('All resumes:', resumes.map(r => ({ 
                      name: r.name, 
                      id: r._id, 
                      clonedFrom: r.metadata?.clonedFrom,
                      isArchived: r.isArchived 
                    })));
                    
                    const previousVersions = resumes.filter(r => {
                      if (r._id === viewingResume._id) return false;
                      
                      // Direct clone: r was cloned FROM current resume
                      if (r.metadata?.clonedFrom === viewingResume._id) {
                        console.log('✓ Direct clone found:', r.name);
                        return true;
                      }
                      
                      // Reverse clone: current resume was cloned FROM r
                      if (viewingResume.metadata?.clonedFrom === r._id) {
                        console.log('✓ Reverse clone found:', r.name);
                        return true;
                      }
                      
                      // Sibling clones: both were cloned from the same parent
                      if (r.metadata?.clonedFrom && viewingResume.metadata?.clonedFrom && 
                          r.metadata.clonedFrom === viewingResume.metadata.clonedFrom) {
                        console.log('✓ Sibling clone found:', r.name);
                        return true;
                      }
                      
                      return false;
                    });

                    // Sort by date (newest first)
                    previousVersions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

                    console.log('Previous versions found:', previousVersions.length);
                    console.log('=== END DEBUG ===');

                    if (previousVersions.length === 0) {
                      return (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <p className="text-gray-600 font-medium mb-2">No Previous Versions</p>
                          <p className="text-sm text-gray-500 mb-2">
                            Previous versions will appear here automatically when you:
                          </p>
                          <ul className="text-xs text-gray-500 text-left inline-block">
                            <li>• Apply AI skills optimization</li>
                            <li>• Apply AI experience tailoring</li>
                            <li>• Manually clone this resume</li>
                          </ul>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                        {previousVersions.map(resume => (
                        <div
                          key={resume._id}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#777C6D] hover:bg-[#f3f3ef] transition text-left flex items-start justify-between gap-3"
                        >
                          <button
                            onClick={async () => {
                              await handleCompareResumes(resume._id);
                            }}
                            className="text-left flex-1"
                          >
                            <div className="font-semibold text-gray-900">{resume.name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Modified {new Date(resume.updatedAt).toLocaleDateString()}
                            </div>
                            {resume.metadata?.description && (
                              <div className="text-xs text-gray-500 mt-1 italic line-clamp-2">
                                {resume.metadata.description}
                              </div>
                            )}
                            {resume.isDefault && (
                              <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                Default
                              </span>
                            )}
                            {resume.isArchived && (
                              <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                                Archived
                              </span>
                            )}
                          </button>

                          {/* Trash icon to delete this archived version */}
                          <div className="flex-shrink-0 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingResume(resume);
                                setShowDeleteModal(true);
                              }}
                              title="Delete version"
                              aria-label={`Delete version ${resume.name}`}
                              className="p-2 rounded-lg transition text-gray-600 flex items-center justify-center"
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#FEE2E2';
                                e.currentTarget.style.color = '#B91C1C';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#6B7280';
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Comparison View */
                <div className="space-y-6">
                  {/* Comparison Header with Revert Button */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Current Version</span>
                        <h4 className="font-semibold text-lg text-gray-900">{comparisonData.resume1.name}</h4>
                        <p className="text-sm text-gray-600">
                          Modified: {new Date(comparisonData.resume1.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Previous Version</span>
                        <h4 className="font-semibold text-lg text-gray-900">{comparisonData.resume2.name}</h4>
                        <p className="text-sm text-gray-600">
                          Modified: {new Date(comparisonData.resume2.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-center gap-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          // Switch to merge modal
                          setSelectedMergeChanges([]);
                          setShowMergeModal(true);
                        }}
                        className="px-6 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition flex items-center gap-2 font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Merge Selected Sections
                      </button>
                      <button
                        onClick={handleRevertToPreviousVersion}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2 font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Revert Entirely
                      </button>
                    </div>
                  </div>

                  {/* Differences Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Key Differences
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-900">
                      {comparisonData.differences.summary && (
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Summary content differs</span>
                        </li>
                      )}
                      {comparisonData.differences.experienceCount.resume1 !== comparisonData.differences.experienceCount.resume2 && (
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>
                            Experience items: {comparisonData.differences.experienceCount.resume1} vs {comparisonData.differences.experienceCount.resume2}
                          </span>
                        </li>
                      )}
                      {comparisonData.differences.skillsCount.resume1 !== comparisonData.differences.skillsCount.resume2 && (
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>
                            Skills: {comparisonData.differences.skillsCount.resume1} vs {comparisonData.differences.skillsCount.resume2}
                          </span>
                        </li>
                      )}
                      {comparisonData.differences.educationCount.resume1 !== comparisonData.differences.educationCount.resume2 && (
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>
                            Education items: {comparisonData.differences.educationCount.resume1} vs {comparisonData.differences.educationCount.resume2}
                          </span>
                        </li>
                      )}
                      {comparisonData.differences.projectsCount.resume1 !== comparisonData.differences.projectsCount.resume2 && (
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>
                            Projects: {comparisonData.differences.projectsCount.resume1} vs {comparisonData.differences.projectsCount.resume2}
                          </span>
                        </li>
                      )}
                      {comparisonData.differences.sectionCustomization && (
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Section customization differs</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Side-by-Side Sections */}
                  <div className="space-y-6">
                    {/* Summary Comparison with Diff Highlighting */}
                    {(comparisonData.fullData.resume1.summary || comparisonData.fullData.resume2.summary) && (() => {
                      const summaryDiff = highlightTextDiff(
                        comparisonData.fullData.resume1.summary,
                        comparisonData.fullData.resume2.summary
                      );
                      
                      return (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                            <span className="font-semibold text-gray-900">Summary</span>
                            {summaryDiff.identical ? (
                              <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">Identical</span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Different</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 divide-x">
                            <div className="p-4 bg-white">
                              <div className="text-xs font-semibold text-gray-500 mb-2">Current Version</div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {summaryDiff.text1 || <span className="text-gray-400 italic">No summary</span>}
                              </p>
                            </div>
                            <div className="p-4 bg-white">
                              <div className="text-xs font-semibold text-gray-500 mb-2">Previous Version</div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {summaryDiff.text2 || <span className="text-gray-400 italic">No summary</span>}
                              </p>
                            </div>
                          </div>
                          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-600 border-t">
                            <span className="inline-flex items-center gap-1 mr-3">
                              <span className="w-3 h-3 bg-red-100 border border-red-300 rounded"></span> Removed
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span> Added
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Skills Comparison with Highlighting */}
                    {(comparisonData.fullData.resume1.skills?.length > 0 || comparisonData.fullData.resume2.skills?.length > 0) && (() => {
                      const skills1Set = new Set(
                        (comparisonData.fullData.resume1.skills || []).map(s => typeof s === 'string' ? s : s.name)
                      );
                      const skills2Set = new Set(
                        (comparisonData.fullData.resume2.skills || []).map(s => typeof s === 'string' ? s : s.name)
                      );
                      
                      return (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                            <span className="font-semibold text-gray-900">Skills</span>
                            {JSON.stringify([...skills1Set].sort()) === JSON.stringify([...skills2Set].sort()) ? (
                              <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">Identical</span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Different</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 divide-x">
                            <div className="p-4 bg-white">
                              <div className="text-xs font-semibold text-gray-500 mb-2">Current Version</div>
                              {comparisonData.fullData.resume1.skills?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {comparisonData.fullData.resume1.skills.map((skill, idx) => {
                                    const skillName = typeof skill === 'string' ? skill : skill.name;
                                    const inOther = skills2Set.has(skillName);
                                    return (
                                      <span 
                                        key={idx} 
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          inOther 
                                            ? 'bg-gray-100 text-gray-800 border border-gray-300' 
                                            : 'bg-red-100 text-red-800 border border-red-300'
                                        }`}
                                      >
                                        {skillName}
                                        {!inOther && <span className="ml-1 text-red-600">✕</span>}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic text-sm">No skills</span>
                              )}
                            </div>
                            <div className="p-4 bg-white">
                              <div className="text-xs font-semibold text-gray-500 mb-2">Previous Version</div>
                              {comparisonData.fullData.resume2.skills?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {comparisonData.fullData.resume2.skills.map((skill, idx) => {
                                    const skillName = typeof skill === 'string' ? skill : skill.name;
                                    const inOther = skills1Set.has(skillName);
                                    return (
                                      <span 
                                        key={idx} 
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          inOther 
                                            ? 'bg-gray-100 text-gray-800 border border-gray-300' 
                                            : 'bg-green-100 text-green-800 border border-green-300'
                                        }`}
                                      >
                                        {skillName}
                                        {!inOther && <span className="ml-1 text-green-600">✓</span>}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic text-sm">No skills</span>
                              )}
                            </div>
                          </div>
                          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-600 border-t">
                            <span className="inline-flex items-center gap-1 mr-3">
                              <span className="w-3 h-3 bg-red-100 border border-red-300 rounded"></span> Only in current
                            </span>
                            <span className="inline-flex items-center gap-1 mr-3">
                              <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span> Only in previous
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></span> In both
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Experience Count Comparison */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-900">
                        Experience
                      </div>
                      <div className="grid grid-cols-2 divide-x">
                        <div className="p-4 bg-white">
                          <p className="text-sm text-gray-700">
                            {comparisonData.differences.experienceCount.resume1} experience item(s)
                          </p>
                        </div>
                        <div className="p-4 bg-white">
                          <p className="text-sm text-gray-700">
                            {comparisonData.differences.experienceCount.resume2} experience item(s)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Merge Action */}
                  <div className="bg-[#f7f6f2] border border-[#e6e6e1] rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-purple-900 mb-1">Want to merge changes?</h4>
                        <p className="text-sm text-purple-700">
                          Copy selected sections from one resume to another
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          // Switch to merge modal
                          setSelectedMergeChanges([]);
                          setShowMergeModal(true);
                        }}
                        className="px-4 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Merge Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
              {comparisonData && (
                <button
                  onClick={() => {
                    setCompareResumeId(null);
                    setComparisonData(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Compare Different Resume
                </button>
              )}
              <button
                onClick={() => {
                  setShowCompareModal(false);
                  setCompareResumeId(null);
                  setComparisonData(null);
                }}
                className="px-4 py-2 text-white rounded-lg transition"
                style={{ backgroundColor: '#777C6D' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UC-52: Merge Resume Modal */}
      {showMergeModal && comparisonData && viewingResume && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => {
            setShowMergeModal(false);
            setSelectedMergeChanges([]);
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#777C6D] border-b px-6 py-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <h3 className="text-xl font-heading font-bold text-white">Merge Resume Changes</h3>
                </div>
                <button
                  onClick={() => {
                    setShowMergeModal(false);
                    setSelectedMergeChanges([]);
                  }}
                  className="text-white hover:text-gray-200 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Merge Direction Indicator */}
              <div className="bg-[#f7f6f2] border border-[#e6e6e1] rounded-lg p-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="font-semibold text-purple-900">{comparisonData.resume2.name}</div>
                    <div className="text-xs text-[#4F5348]">Source</div>
                  </div>
                  <svg className="w-8 h-8 text-[#4F5348]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <div className="text-center">
                    <div className="font-semibold text-purple-900">{comparisonData.resume1.name}</div>
                    <div className="text-xs text-[#4F5348]">Target (current)</div>
                  </div>
                </div>
                <p className="text-sm text-purple-700 text-center mt-3">
                  Select which sections to copy from the source resume to the target resume
                </p>
              </div>

              {/* Merge Options */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Select Changes to Merge:</h4>

                {/* Summary Section */}
                {comparisonData.fullData.resume2.summary && comparisonData.differences.summary && (
                  <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMergeChanges.includes('summary')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMergeChanges([...selectedMergeChanges, 'summary']);
                          } else {
                            setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== 'summary'));
                          }
                        }}
                        className="mt-1 w-5 h-5 text-[#4F5348] rounded focus:ring-2 focus:ring-[#777C6D]"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-2">Summary</div>
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200 line-clamp-3">
                          {comparisonData.fullData.resume2.summary}
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Experience Section */}
                {comparisonData.fullData.resume2.experience?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMergeChanges.includes('experience')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMergeChanges([...selectedMergeChanges, 'experience']);
                          } else {
                            setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== 'experience'));
                          }
                        }}
                        className="mt-1 w-5 h-5 text-[#4F5348] rounded focus:ring-2 focus:ring-[#777C6D]"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-2">
                          All Experience ({comparisonData.fullData.resume2.experience.length} items)
                        </div>
                        <div className="text-sm text-gray-600">
                          Replace all experience with source, or select individual items below to add
                        </div>
                      </div>
                    </label>

                    {/* Individual Experience Items */}
                    <div className="ml-8 mt-3 space-y-2">
                      <div className="text-xs text-gray-500 mb-2 italic">Select individual experience items to ADD them to current resume</div>
                      {comparisonData.fullData.resume2.experience.map((exp, idx) => (
                        <label key={idx} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-white">
                          <input
                            type="checkbox"
                            checked={selectedMergeChanges.includes(`experience.${idx}`)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMergeChanges([...selectedMergeChanges, `experience.${idx}`]);
                              } else {
                                setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== `experience.${idx}`));
                              }
                            }}
                            className="mt-1 w-4 h-4 text-[#4F5348] rounded focus:ring-2 focus:ring-[#777C6D]"
                          />
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{exp.title} at {exp.company}</div>
                            <div className="text-xs text-gray-500">
                              {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Section */}
                {comparisonData.fullData.resume2.skills?.length > 0 && (() => {
                  // Get current resume skills to show which are new/different
                  const currentSkillNames = new Set(
                    (comparisonData.fullData.resume1.skills || []).map(s => 
                      typeof s === 'string' ? s : s.name
                    )
                  );
                  
                  return (
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMergeChanges.includes('skills')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMergeChanges([...selectedMergeChanges, 'skills']);
                            } else {
                              setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== 'skills'));
                            }
                          }}
                          className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-2">
                            All Skills ({comparisonData.fullData.resume2.skills.length} items)
                          </div>
                          <div className="text-sm text-gray-600">
                            Add all missing skills from source resume
                          </div>
                        </div>
                      </label>

                      {/* Individual Skills */}
                      <div className="ml-8 mt-3 flex flex-wrap gap-2">
                        {comparisonData.fullData.resume2.skills.map((skill, idx) => {
                          const skillName = typeof skill === 'string' ? skill : skill.name;
                          const isInCurrent = currentSkillNames.has(skillName);
                          
                          return (
                            <label 
                              key={idx} 
                              className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition ${
                                isInCurrent 
                                  ? 'bg-gray-100 text-gray-500' 
                                  : 'bg-purple-50 hover:bg-purple-100 text-purple-900'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedMergeChanges.includes(`skill.${idx}`)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedMergeChanges([...selectedMergeChanges, `skill.${idx}`]);
                                  } else {
                                    setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== `skill.${idx}`));
                                  }
                                }}
                                disabled={isInCurrent}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                              />
                              <span className="text-sm">
                                {skillName}
                                {isInCurrent && <span className="ml-1 text-xs">(already in current)</span>}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Education Section */}
                {comparisonData.fullData.resume2.education?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMergeChanges.includes('education')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMergeChanges([...selectedMergeChanges, 'education']);
                          } else {
                            setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== 'education'));
                          }
                        }}
                        className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-2">
                          Education ({comparisonData.fullData.resume2.education.length} items)
                        </div>
                        <div className="text-sm text-gray-600">
                          Replace all education entries with those from source resume
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Projects Section */}
                {comparisonData.fullData.resume2.projects?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMergeChanges.includes('projects')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMergeChanges([...selectedMergeChanges, 'projects']);
                          } else {
                            setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== 'projects'));
                          }
                        }}
                        className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-2">
                          Projects ({comparisonData.fullData.resume2.projects.length} items)
                        </div>
                        <div className="text-sm text-gray-600">
                          Replace all projects with those from source resume
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Section Visibility/Customization */}
                {comparisonData.differences.sectionCustomization && (
                  <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMergeChanges.includes('sectionCustomization')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMergeChanges([...selectedMergeChanges, 'sectionCustomization']);
                          } else {
                            setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== 'sectionCustomization'));
                          }
                        }}
                        className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-2">Section Visibility & Layout</div>
                        <div className="text-sm text-gray-600">
                          Restore section visibility settings, order, and formatting from source resume
                        </div>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedMergeChanges.length > 0 ? (
                  <span className="font-medium text-purple-700">
                    {selectedMergeChanges.length} section{selectedMergeChanges.length !== 1 ? 's' : ''} selected for merge
                  </span>
                ) : (
                  <span className="text-gray-500">Select at least one section to merge</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMergeModal(false);
                    setSelectedMergeChanges([]);
                  }}
                  disabled={isMerging}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMergeResumes}
                  disabled={isMerging || selectedMergeChanges.length === 0}
                  className="px-6 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isMerging ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Merging...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Apply Merge</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UC-49: Skills Optimization Modal */}
      {showSkillsOptimization && skillsOptimizationData && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowSkillsOptimization(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#777C6D] px-6 py-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-heading font-bold text-white">AI Skills Optimization</h3>
                </div>
                <button
                  onClick={() => setShowSkillsOptimization(false)}
                  className="text-white hover:text-gray-200 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Success Banner */}
            {showSkillsSuccessBanner && (
              <div className="bg-green-50 border-l-4 border-green-500 px-6 py-4 mx-6 mt-4 rounded-r-lg animate-fade-in">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-900">Skills Updated Successfully!</p>
                    <p className="text-sm text-green-700">Your resume has been updated with the selected skills. Returning to resume view...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Match Score */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Skills Match Score</h4>
                    <p className="text-sm text-gray-600">{skillsOptimizationData.optimization?.summary || 'Your skills alignment with this job'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-[#4F5348]">
                      {skillsOptimizationData.optimization?.matchScore || 0}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Match Rate</div>
                  </div>
                </div>
              </div>

              {/* Current Resume Skills */}
              <div className="bg-white rounded-lg border-2 border-gray-300 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Current Skills in Resume
                  </h4>
                  <span className="text-sm text-gray-500">{currentResumeSkills.length} skills</span>
                </div>
                {currentResumeSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentResumeSkills.map((skill, idx) => (
                      <div
                        key={idx}
                        className="group px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm border border-gray-300 flex items-center gap-2"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800"
                          title="Remove skill"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No skills in resume yet. Add skills from recommendations below.</p>
                )}
              </div>

              {/* Technical Skills */}
              {skillsOptimizationData.optimization?.technicalSkills?.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Technical</span>
                    Recommended Technical Skills
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">Click to select skills to add to your resume</p>
                  <div className="flex flex-wrap gap-2">
                    {skillsOptimizationData.optimization.technicalSkills.map((skill, idx) => {
                      const isInResume = currentResumeSkills.includes(skill);
                      const isSelected = selectedSkillsToAdd.includes(skill);
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => !isInResume && toggleSkillSelection(skill)}
                          disabled={isInResume}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all flex items-center gap-2 ${
                            isInResume 
                              ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' 
                              : isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span>{skill}</span>
                          {isInResume && <span className="text-xs">✓ In Resume</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Soft Skills */}
              {skillsOptimizationData.optimization?.softSkills?.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Soft Skills</span>
                    Recommended Soft Skills
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">Click to select skills to add to your resume</p>
                  <div className="flex flex-wrap gap-2">
                    {skillsOptimizationData.optimization.softSkills.map((skill, idx) => {
                      const isInResume = currentResumeSkills.includes(skill);
                      const isSelected = selectedSkillsToAdd.includes(skill);
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => !isInResume && toggleSkillSelection(skill)}
                          disabled={isInResume}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all flex items-center gap-2 ${
                            isInResume 
                              ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' 
                              : isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                              : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 cursor-pointer'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span>{skill}</span>
                          {isInResume && <span className="text-xs">✓ In Resume</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {skillsOptimizationData.optimization?.missingSkills?.length > 0 && (
                <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-5">
                  <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Skill Gaps Detected
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    These skills are mentioned in the job posting but missing from your resume:
                  </p>
                  <div className="space-y-2">
                    {skillsOptimizationData.optimization.missingSkills.map((skill, idx) => {
                      // Handle both string and object formats
                      const skillName = typeof skill === 'string' ? skill : skill.name;
                      const importance = skill.importance || null;
                      const suggestion = skill.suggestion || null;
                      
                      return (
                        <div
                          key={idx}
                          className="bg-white rounded-lg p-3 border border-yellow-300"
                        >
                          <div className="flex items-start gap-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium uppercase">
                              {importance || 'Important'}
                            </span>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{skillName}</div>
                              {suggestion && (
                                <p className="text-sm text-gray-600 mt-1">{suggestion}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Skills to Emphasize */}
              {skillsOptimizationData.optimization?.skillsToEmphasize?.length > 0 && (
                <div className="bg-green-50 rounded-lg border border-green-200 p-5">
                  <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Skills to Emphasize
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    You already have these skills - make sure they're prominent in your resume:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skillsOptimizationData.optimization.skillsToEmphasize.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-white text-green-800 rounded-full text-sm border border-green-300 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Industry Recommendations */}
              {skillsOptimizationData.optimization?.industryRecommendations?.length > 0 && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                  <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                    Industry-Specific Recommendations
                  </h4>
                  <div className="space-y-2">
                    {skillsOptimizationData.optimization.industryRecommendations.map((rec, idx) => {
                      // Handle both string and object formats
                      const skillName = typeof rec === 'string' ? rec : (rec.skill || rec.name);
                      const reason = rec.reason || null;
                      
                      return (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1 text-lg">💡</span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{skillName}</div>
                              {reason && (
                                <p className="text-sm text-gray-600 mt-1">{reason}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t sticky bottom-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{selectedSkillsToAdd.length}</span>
                    <span className="text-gray-600"> skills selected</span>
                  </div>
                  {selectedSkillsToAdd.length > 0 && (
                    <button
                      onClick={() => setSelectedSkillsToAdd([])}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSkillsOptimization(false)}
                    disabled={isApplyingSkills}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleApplySkillChanges}
                    disabled={isApplyingSkills || (selectedSkillsToAdd.length === 0 && currentResumeSkills.length === (viewingResume?.sections?.skills?.length || 0))}
                    className="px-6 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isApplyingSkills ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Apply Changes to Resume</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                💡 Click skills to select, then click "Apply Changes" to update your resume
              </p>
            </div>
          </div>
        </div>
      )}

      {/* UC-50: Experience Tailoring Modal - Coming in next update */}
      {showExperienceTailoring && experienceTailoringData && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowExperienceTailoring(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#777C6D] px-6 py-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <h3 className="text-xl font-heading font-bold text-white">AI Experience Tailoring</h3>
                </div>
                <button
                  onClick={() => setShowExperienceTailoring(false)}
                  className="text-white hover:text-gray-200 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Success Banner */}
            {showExperienceSuccessBanner && (
              <div className="bg-green-50 border-l-4 border-green-500 px-6 py-4 mx-6 mt-4 rounded-r-lg animate-fade-in">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-900">Experience Updated Successfully!</p>
                    <p className="text-sm text-green-700">Your resume has been updated with the selected variations. Returning to resume view...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Summary */}
              {experienceTailoringData.tailoring?.summary && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
                  <p className="text-gray-800">{experienceTailoringData.tailoring.summary}</p>
                </div>
              )}

              {/* Experience Suggestions */}
              {experienceTailoringData.tailoring?.experiences?.map((exp, expIdx) => (
                <div key={expIdx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-semibold text-gray-900">
                        Experience #{exp.experienceIndex + 1}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        exp.relevanceScore >= 80 ? 'bg-green-100 text-green-800' :
                        exp.relevanceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {exp.relevanceScore}% Relevant
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-4">
                    {exp.bullets?.map((bullet, bulletIdx) => (
                      <div key={bulletIdx} className="border-l-4 border-purple-300 pl-4 space-y-3">
                        {/* Original */}
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Original</div>
                          <p className="text-sm text-gray-700">{bullet.originalBullet}</p>
                        </div>

                        {/* Variations */}
                        {bullet.variations && (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              AI-Generated Variations (Click to Select)
                            </div>
                            
                            {/* Original Option */}
                            <button
                              onClick={() => {
                                const key = `${expIdx}-${bulletIdx}`;
                                if (selectedExperienceVariations[key]) {
                                  const newSelections = { ...selectedExperienceVariations };
                                  delete newSelections[key];
                                  setSelectedExperienceVariations(newSelections);
                                } else {
                                  setSelectedExperienceVariations(prev => ({ ...prev, [key]: 'original' }));
                                }
                              }}
                              className={`w-full text-left bg-gray-50 rounded p-3 border-2 transition cursor-pointer ${
                                !selectedExperienceVariations[`${expIdx}-${bulletIdx}`] || selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'original'
                                  ? 'border-gray-400 bg-gray-100'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <input
                                  type="radio"
                                  name={`variation-${expIdx}-${bulletIdx}`}
                                  checked={!selectedExperienceVariations[`${expIdx}-${bulletIdx}`] || selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'original'}
                                  onChange={() => {}}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="text-xs font-medium text-gray-700 mb-1">✨ Keep Original</div>
                                  <p className="text-sm text-gray-700">{bullet.originalBullet}</p>
                                </div>
                              </div>
                            </button>
                            
                            {bullet.variations.achievement && (
                              <button
                                onClick={() => toggleExperienceVariation(expIdx, bulletIdx, 'achievement')}
                                className={`w-full text-left bg-blue-50 rounded p-3 border-2 transition cursor-pointer ${
                                  selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'achievement'
                                    ? 'border-blue-600 bg-blue-100 shadow-md'
                                    : 'border-blue-200 hover:border-blue-400'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <input
                                    type="radio"
                                    name={`variation-${expIdx}-${bulletIdx}`}
                                    checked={selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'achievement'}
                                    onChange={() => {}}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-blue-800 mb-1">🏆 Achievement-Focused</div>
                                    <p className="text-sm text-gray-800">{bullet.variations.achievement}</p>
                                  </div>
                                </div>
                              </button>
                            )}
                            
                            {bullet.variations.technical && (
                              <button
                                onClick={() => toggleExperienceVariation(expIdx, bulletIdx, 'technical')}
                                className={`w-full text-left bg-green-50 rounded p-3 border-2 transition cursor-pointer ${
                                  selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'technical'
                                    ? 'border-green-600 bg-green-100 shadow-md'
                                    : 'border-green-200 hover:border-green-400'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <input
                                    type="radio"
                                    name={`variation-${expIdx}-${bulletIdx}`}
                                    checked={selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'technical'}
                                    onChange={() => {}}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-green-800 mb-1">⚙️ Technical-Focused</div>
                                    <p className="text-sm text-gray-800">{bullet.variations.technical}</p>
                                  </div>
                                </div>
                              </button>
                            )}
                            
                            {bullet.variations.impact && (
                              <button
                                onClick={() => toggleExperienceVariation(expIdx, bulletIdx, 'impact')}
                                className={`w-full text-left bg-purple-50 rounded p-3 border-2 transition cursor-pointer ${
                                  selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'impact'
                                    ? 'border-purple-600 bg-purple-100 shadow-md'
                                    : 'border-purple-200 hover:border-purple-400'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <input
                                    type="radio"
                                    name={`variation-${expIdx}-${bulletIdx}`}
                                    checked={selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'impact'}
                                    onChange={() => {}}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-purple-800 mb-1">📈 Impact-Focused</div>
                                    <p className="text-sm text-gray-800">{bullet.variations.impact}</p>
                                  </div>
                                </div>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Suggestions */}
                        {(bullet.suggestedActionVerbs?.length > 0 || bullet.keywordsToAdd?.length > 0) && (
                          <div className="flex gap-4 pt-2">
                            {bullet.suggestedActionVerbs?.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-600 mb-1">Suggested Verbs:</div>
                                <div className="flex flex-wrap gap-1">
                                  {bullet.suggestedActionVerbs.map((verb, vIdx) => (
                                    <span key={vIdx} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                                      {verb}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {bullet.keywordsToAdd?.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-600 mb-1">Keywords to Add:</div>
                                <div className="flex flex-wrap gap-1">
                                  {bullet.keywordsToAdd.map((keyword, kIdx) => (
                                    <span key={kIdx} className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t sticky bottom-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{Object.keys(selectedExperienceVariations).length}</span>
                    <span className="text-gray-600"> bullets selected for update</span>
                  </div>
                  {Object.keys(selectedExperienceVariations).length > 0 && (
                    <button
                      onClick={() => setSelectedExperienceVariations({})}
                      className="text-xs text-purple-600 hover:text-purple-800 underline"
                    >
                      Clear selections
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowExperienceTailoring(false)}
                    disabled={isApplyingExperience}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleApplyExperienceChanges}
                    disabled={isApplyingExperience || Object.keys(selectedExperienceVariations).length === 0}
                    className="px-6 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isApplyingExperience ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Apply Changes to Resume</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                💡 Select your preferred variation for each bullet, then click "Apply Changes" to update your resume
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
