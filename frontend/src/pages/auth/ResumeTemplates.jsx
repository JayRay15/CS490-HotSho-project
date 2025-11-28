import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { setAuthToken } from "../../api/axios";
import { fetchTemplates, createTemplate as apiCreateTemplate, updateTemplate as apiUpdateTemplate, deleteTemplate as apiDeleteTemplate, importTemplate as apiImportTemplate } from "../../api/resumeTemplates";
import { fetchCoverLetterTemplates, createCoverLetterTemplate, updateCoverLetterTemplate, deleteCoverLetterTemplate, trackCoverLetterTemplateUsage, importCoverLetterTemplate, exportCoverLetterTemplate, shareCoverLetterTemplate, getIndustryGuidance, getCoverLetterTemplateAnalytics, generateAICoverLetter } from "../../api/coverLetterTemplates";
import { fetchCoverLetters, createCoverLetter, updateCoverLetter as apiUpdateCoverLetter, deleteCoverLetter as apiDeleteCoverLetter, setDefaultCoverLetter, archiveCoverLetter, unarchiveCoverLetter, cloneCoverLetter as apiCloneCoverLetter } from "../../api/coverLetters";
// import { ModalShell, SuccessModal } from "../../components/coverLetters/CoverLetterModals";
import {
  fetchResumes,
  updateResume as apiUpdateResume,
  deleteResume as apiDeleteResume,
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
  regenerateResumeSection
} from "../../api/aiResume";
import { getValidationStatus } from "../../api/resumeValidation";
import api from "../../api/axios";
import Container from "../../components/Container";
import Card from "../../components/Card";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import CoverLetterEditor from "../../components/CoverLetterEditor";
import LoadingSpinner from "../../components/LoadingSpinner";
import CoverLetterExportModal from "../../components/CoverLetterExportModal";
import ValidationPanel from "../../components/resume/ValidationPanel";
import ValidationBadge from "../../components/resume/ValidationBadge";
import RichTextEditor from "../../components/resume/RichTextEditor";
import WatermarkModal from "../../components/resume/WatermarkModal";
import SaveAsModal from "../../components/resume/SaveAsModal";
import CloneModal from "../../components/resume/CloneModal";
import ExportMenu from "../../components/resume/ExportMenu";
import ResumeTile from "../../components/resume/ResumeTile";
import TemplatePreviewCard from "../../components/resume/TemplatePreviewCard";
import TemplatePreviewModal from "../../components/resume/TemplatePreviewModal";
import CompareModal from "../../components/resume/CompareModal";
import EditableContactInfo from "../../components/resume/EditableContactInfo";
import EditableEducation from "../../components/resume/EditableEducation";
import EditableSkills from "../../components/resume/EditableSkills";
import FinishEditDropdown from "../../components/resume/FinishEditDropdown";
import InlineValidationIssuesPanel from "../../components/resume/InlineValidationIssuesPanel";
import ExperienceTailoringModal from "../../components/resume/ExperienceTailoringModal";
import ImportTemplateModal from "../../components/resume/ImportTemplateModal";
import CustomizeImportModal from "../../components/resume/CustomizeImportModal";
import ResumeSectionHeader from "../../components/resume/ResumeSectionHeader";
import SectionToggleItem from "../../components/resume/SectionToggleItem";
import CustomizationPanel from "../../components/resume/CustomizationPanel";
import SavePresetModal from "../../components/resume/SavePresetModal";
import SectionFormattingModal from "../../components/resume/SectionFormattingModal";
import CustomizeTemplateModal from "../../components/resume/CustomizeTemplateModal";
import RenameResumeModal from "../../components/resume/RenameResumeModal";
import ResumeShareFeedbackPanel from "../../components/resume/ResumeShareFeedbackPanel";
import SharedWithMeSection from "../../components/resume/SharedWithMeSection";
import DeleteConfirmationModal from "../../components/resume/DeleteConfirmationModal";
import AIResumeCreationModal from "../../components/resume/AIResumeCreationModal";
import AICoverLetterModal from "../../components/coverLetters/AICoverLetterModal";
import CoverLetterTemplateBrowserModal from "../../components/coverLetters/CoverLetterTemplateBrowserModal";
import ViewEditCoverLetterModal from "../../components/coverLetters/ViewEditCoverLetterModal";
import ManageCoverLetterTemplatesModal from "../../components/coverLetters/ManageCoverLetterTemplatesModal";
import CoverLetterAnalyticsModal from "../../components/coverLetters/CoverLetterAnalyticsModal";
import CoverLetterImportModal from "../../components/coverLetters/CoverLetterImportModal";
import CoverLetterCustomizeModal from "../../components/coverLetters/CoverLetterCustomizeModal";
import CoverLetterShareModal from "../../components/coverLetters/CoverLetterShareModal";
import AddCoverLetterModal from "../../components/coverLetters/AddCoverLetterModal";
import CoverLetterShareFeedbackPanel from "../../components/coverLetters/CoverLetterShareFeedbackPanel";
import SkillsOptimizationModal from "../../components/resume/SkillsOptimizationModal";
import MergeResumeModal from "../../components/resume/MergeResumeModal";
import ResumeSectionsDisplay from "../../components/resume/ResumeSectionsDisplay";
import {
  ModalOverlay,
  ModalCard,
  ModalHeader,
  ModalContent,
  ModalFooter,
  CancelButton,
  DangerButton,
  SuccessPill
} from "../../components/resume/coverLetterModalStyles";
import ViewIssuesButton from "../../components/resume/ViewIssuesButton";
import { THEME_PRESETS, getThemePresetNames, getThemePreset } from "../../utils/themePresets";
import { TEMPLATE_TYPES, DEFAULT_SECTIONS, SECTION_PRESETS, formatDate } from "../../utils/resumeConstants";
import { handleResumeFileUpload } from "../../utils/resumeFileUpload";
import { mergeResumeChanges, extractSectionCustomization, hasSectionCustomizationChange } from "../../utils/resumeMergeUtils";
import {
  TONE_OPTIONS,
  INDUSTRY_OPTIONS,
  COMPANY_CULTURE_OPTIONS,
  LENGTH_OPTIONS,
  WRITING_STYLE_OPTIONS,
  validateToneConsistency,
  getRecommendedSettings
} from "../../utils/coverLetterToneConfig";
import { useResumeValidation } from "../../hooks/useResumeValidation";
import { useResumeExport } from "../../components/resume/useResumeExport";
import { useSkillsOptimization } from "../../hooks/useSkillsOptimization";
import { useExperienceTailoring } from "../../hooks/useExperienceTailoring";
import { useVersionManagement } from "../../hooks/useVersionManagement";
import {
  createShare as apiCreateShare,
  listShares as apiListShares,
  revokeShare as apiRevokeShare,
  listFeedbackOwner as apiListFeedbackOwner,
  resolveFeedback as apiResolveFeedback,
  exportFeedbackSummary as apiExportFeedbackSummary,
  getReviewInvitations as apiGetReviewInvitations
} from "../../api/resumeShare";
import {
  createCoverLetterShare as apiCreateCoverLetterShare,
  listCoverLetterShares as apiListCoverLetterShares,
  revokeCoverLetterShare as apiRevokeCoverLetterShare,
  listCoverLetterFeedbackOwner as apiListCoverLetterFeedbackOwner,
  resolveCoverLetterFeedback as apiResolveCoverLetterFeedback,
  exportCoverLetterFeedbackSummary as apiExportCoverLetterFeedbackSummary,
  updateCoverLetterApproval as apiUpdateCoverLetterApproval,
  getCoverLetterReviewInvitations as apiGetCoverLetterReviewInvitations
} from "../../api/coverLetterShare";

// Utility function to format plain text into HTML paragraphs
const formatCoverLetterContent = (content) => {
  if (!content) return '';

  // If content already has HTML paragraph tags, return as-is
  if (content.includes('<p>') || content.includes('<div>') || content.includes('<br')) {
    return content;
  }

  // Split content into lines, preserving empty lines
  const lines = content.split('\n');

  const result = [];
  let currentParagraph = [];
  let inBody = false;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Handle empty lines - just skip them, don't add blank paragraphs
    // The CSS margin will provide the spacing
    if (trimmedLine.length === 0) {
      // Save any accumulated paragraph first
      if (currentParagraph.length > 0) {
        result.push(`<p>${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
      return;
    }

    // More aggressive header detection
    const isHeaderLine = !inBody && (
      trimmedLine.length < 80 && (
        trimmedLine.includes('@') || // Email
        trimmedLine.match(/^\d{10}/) || // Phone number
        trimmedLine.match(/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) || // Phone with formatting
        trimmedLine.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) || // Date format
        trimmedLine.match(/^[A-Z][a-z]+ \d{1,2}, \d{4}/) || // Date format "November 10, 2025"
        trimmedLine.match(/^[A-Z][a-z]+(?: [A-Z][a-z]+)*,? [A-Z]{2}$/) || // "City, State" format
        trimmedLine.match(/^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/) || // Name or single words in Title Case
        trimmedLine.toLowerCase().trim() === 'hiring manager' ||
        trimmedLine.toLowerCase().startsWith('dear ') ||
        trimmedLine.endsWith(':') || // Greeting or label
        trimmedLine.endsWith(',') || // Greeting comma
        index < 15 // First 15 lines are likely header
      )
    );

    // Check if this line starts the body (contains multiple sentences or is long)
    const startsBody = trimmedLine.length > 80 || trimmedLine.split(/[.!?]/).length > 2;

    if (isHeaderLine && !startsBody) {
      // Save any accumulated paragraph first
      if (currentParagraph.length > 0) {
        result.push(`<p>${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
      // Add header line as its own paragraph
      result.push(`<p>${trimmedLine}</p>`);
    } else {
      // Mark that we've entered the body
      inBody = true;

      // This is body text - accumulate sentences
      currentParagraph.push(trimmedLine);

      // Check if we should end the paragraph (after ~3 sentences)
      const combinedText = currentParagraph.join(' ');
      const sentenceCount = combinedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

      if (sentenceCount >= 3) {
        result.push(`<p>${combinedText}</p>`);
        currentParagraph = [];
      }
    }
  });

  // Add any remaining content
  if (currentParagraph.length > 0) {
    result.push(`<p>${currentParagraph.join(' ')}</p>`);
  }

  return result.join('');
};

export default function ResumeTemplates() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [resumes, setResumes] = useState([]);

  // Template Management Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [customizeTemplate, setCustomizeTemplate] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showCustomizeImport, setShowCustomizeImport] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

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

  // Success message state
  const [successMessage, setSuccessMessage] = useState(null);

  // Share & Feedback Management State (Owner-side)
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareForResume, setShareForResume] = useState(null);
  const [shareLinks, setShareLinks] = useState([]); // existing shares for selected resume
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [shareActionLoading, setShareActionLoading] = useState(false);
  const [createdShareUrl, setCreatedShareUrl] = useState("");
  const [shareForm, setShareForm] = useState({
    privacy: 'unlisted',
    allowComments: true,
    canViewContact: false,
    allowedReviewersText: '', // comma-separated emails
    note: '',
    expiresInDays: '' // optional number
  });
  const [ownerFeedback, setOwnerFeedback] = useState([]);
  const [isLoadingOwnerFeedback, setIsLoadingOwnerFeedback] = useState(false);

  // UC-110: Cover Letter Share & Collaborative Review State
  const [showCoverLetterSharePanel, setShowCoverLetterSharePanel] = useState(false);
  const [shareForCoverLetter, setShareForCoverLetter] = useState(null);
  const [coverLetterShareLinks, setCoverLetterShareLinks] = useState([]);
  const [isLoadingCoverLetterShares, setIsLoadingCoverLetterShares] = useState(false);
  const [coverLetterShareActionLoading, setCoverLetterShareActionLoading] = useState(false);
  const [createdCoverLetterShareUrl, setCreatedCoverLetterShareUrl] = useState("");
  const [coverLetterShareForm, setCoverLetterShareForm] = useState({
    privacy: 'unlisted',
    allowComments: true,
    allowedReviewersText: '',
    note: '',
    expiresInDays: '',
    deadline: ''
  });
  const [coverLetterOwnerFeedback, setCoverLetterOwnerFeedback] = useState([]);
  const [isLoadingCoverLetterOwnerFeedback, setIsLoadingCoverLetterOwnerFeedback] = useState(false);

  // UC-110: Pending Review Invitations (documents shared with current user)
  const [reviewInvitations, setReviewInvitations] = useState([]);
  const [isLoadingReviewInvitations, setIsLoadingReviewInvitations] = useState(false);
  const [showSharedWithMeSection, setShowSharedWithMeSection] = useState(true);

  // UC-053: Validation State (using custom hook)
  const {
    validationResults,
    setValidationResults,
    isValidating,
    validationStatus,
    setValidationStatus,
    handleValidateResume: validateResumeHook,
    checkValidationStatus
  } = useResumeValidation(showViewResumeModal, viewingResume);

  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [showValidationIssuesPanel, setShowValidationIssuesPanel] = useState(false); // Inline issues panel

  // UC-053: Rich Text Editing State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSection, setEditingSection] = useState(null); // Which section is being edited
  const [editedContent, setEditedContent] = useState({}); // Temporary edited content before saving
  const [showEditDropdown, setShowEditDropdown] = useState(false); // Dropdown for Finish Edit button

  // Cover Letter State
  const [coverLetterTemplates, setCoverLetterTemplates] = useState([]);
  const [savedCoverLetters, setSavedCoverLetters] = useState([]);
  const [showCoverLetterBrowser, setShowCoverLetterBrowser] = useState(false);
  const [selectedCoverLetterTemplate, setSelectedCoverLetterTemplate] = useState(null);
  const [showCoverLetterPreview, setShowCoverLetterPreview] = useState(false);
  const [showCoverLetterCustomize, setShowCoverLetterCustomize] = useState(false);
  const [coverLetterFilters, setCoverLetterFilters] = useState({ industry: '', style: '' });
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [showCoverLetterImport, setShowCoverLetterImport] = useState(false);
  const [importCoverLetterJson, setImportCoverLetterJson] = useState('');
  const [showCoverLetterShare, setShowCoverLetterShare] = useState(false);
  const [shareTemplateId, setShareTemplateId] = useState(null);
  const [industryGuidance, setIndustryGuidance] = useState({});
  const [selectedIndustry, setSelectedIndustry] = useState('general');
  const [customCoverLetterName, setCustomCoverLetterName] = useState('');
  const [customCoverLetterContent, setCustomCoverLetterContent] = useState('');
  const [customCoverLetterStyle, setCustomCoverLetterStyle] = useState('formal');
  const [editorContentKey, setEditorContentKey] = useState(0);
  const [selectedJobForRegeneration, setSelectedJobForRegeneration] = useState('');
  const [isCreatingCoverLetterTemplate, setIsCreatingCoverLetterTemplate] = useState(false); // Track if creating template vs cover letter
  const [showAllCoverLetters, setShowAllCoverLetters] = useState(false);
  const [showCoverLetterAnalytics, setShowCoverLetterAnalytics] = useState(false);
  const [coverLetterAnalytics, setCoverLetterAnalytics] = useState(null);
  const [showAddCoverLetterModal, setShowAddCoverLetterModal] = useState(false);
  const [showManageCoverLetterTemplates, setShowManageCoverLetterTemplates] = useState(false);
  const [editingCoverLetter, setEditingCoverLetter] = useState(null);
  const [showEditCoverLetterModal, setShowEditCoverLetterModal] = useState(false);
  const [showViewCoverLetterModal, setShowViewCoverLetterModal] = useState(false);
  const [viewingCoverLetter, setViewingCoverLetter] = useState(null);
  const [isCoverLetterEditMode, setIsCoverLetterEditMode] = useState(false);

  // UC-054: Cover Letter Export State
  const [showCoverLetterExportModal, setShowCoverLetterExportModal] = useState(false);
  const [coverLetterSuccessMessage, setCoverLetterSuccessMessage] = useState(null);
  const [showCoverLetterDeleteModal, setShowCoverLetterDeleteModal] = useState(false);
  const [coverLetterToDelete, setCoverLetterToDelete] = useState(null);
  const [isCoverLetterDeleting, setIsCoverLetterDeleting] = useState(false);
  const [exportingCoverLetter, setExportingCoverLetter] = useState(null);

  // AI Cover Letter Generation State
  const [showAICoverLetterModal, setShowAICoverLetterModal] = useState(false);
  const [aiJobId, setAiJobId] = useState('');
  const [aiTone, setAiTone] = useState('formal');
  const [aiIndustry, setAiIndustry] = useState('general');
  const [aiCompanyCulture, setAiCompanyCulture] = useState('corporate');
  const [aiLength, setAiLength] = useState('standard');
  const [aiWritingStyle, setAiWritingStyle] = useState('hybrid');
  const [aiCustomInstructions, setAiCustomInstructions] = useState('');
  const [aiVariationCount, setAiVariationCount] = useState(1);
  const [aiGeneratedVariations, setAiGeneratedVariations] = useState([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGenerationError, setAiGenerationError] = useState('');
  const [aiConsistencyWarnings, setAiConsistencyWarnings] = useState([]);
  const [selectedAIVariation, setSelectedAIVariation] = useState(0);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const authWrap = async () => {
    const token = await getToken();
    setAuthToken(token);
  };

  // UC-49: Skills Optimization State - Using custom hook (initialized after authWrap)
  const skillsHook = useSkillsOptimization(authWrap);
  const {
    showSkillsOptimization,
    setShowSkillsOptimization,
    skillsOptimizationData,
    isOptimizingSkills,
    selectedJobForSkills,
    setSelectedJobForSkills,
    selectedSkillsToAdd,
    setSelectedSkillsToAdd,
    currentResumeSkills,
    setCurrentResumeSkills,
    isApplyingSkills,
    showSkillsSuccessBanner,
    handleOptimizeSkills: handleOptimizeSkillsHook,
    handleDeleteSkill: handleDeleteSkillHook,
    handleApplySkillChanges: handleApplySkillChangesHook,
    toggleSkillSelection,
    handleRemoveSkill
  } = skillsHook;

  // UC-50: Experience Tailoring State - Using custom hook (initialized after authWrap)
  const experienceHook = useExperienceTailoring(authWrap);
  const {
    showExperienceTailoring,
    setShowExperienceTailoring,
    experienceTailoringData,
    isTailoringExperience,
    selectedJobForExperience,
    setSelectedJobForExperience,
    selectedExperienceVariations,
    isApplyingExperience,
    showExperienceSuccessBanner,
    handleTailorExperience: handleTailorExperienceHook,
    toggleExperienceVariation,
    handleApplyExperienceChanges: handleApplyExperienceChangesHook,
    setSelectedExperienceVariations
  } = experienceHook;

  // UC-52: Version Management State - Using custom hook (initialized after authWrap)
  const versionHook = useVersionManagement(authWrap);
  const {
    showCloneModal,
    setShowCloneModal,
    cloneName,
    setCloneName,
    cloneDescription,
    setCloneDescription,
    isCloning,
    showCompareModal,
    setShowCompareModal,
    compareResumeId,
    setCompareResumeId,
    comparisonData,
    setComparisonData,
    showMergeModal,
    setShowMergeModal,
    selectedMergeChanges,
    setSelectedMergeChanges,
    isMerging,
    setIsMerging,
    showArchivedResumes,
    setShowArchivedResumes,
    handleCloneResume: handleCloneResumeHook,
    handleSetDefaultResume: handleSetDefaultResumeHook,
    handleCompareResumes: handleCompareResumesHook,
    handleRevertToPreviousVersion: handleRevertToPreviousVersionHook,
    handleArchiveResume: handleArchiveResumeHook,
    handleUnarchiveResume: handleUnarchiveResumeHook,
    handleMergeResumes: handleMergeResumesHook
  } = versionHook;

  // UC-51: Export State - Using custom hook (initialized after authWrap)
  const exportHook = useResumeExport(authWrap, validationStatus);
  const {
    showExportMenu,
    setShowExportMenu,
    isExporting,
    exportFormat,
    setExportFormat,
    showSaveAsModal,
    setShowSaveAsModal,
    saveAsFilename,
    setSaveAsFilename,
    pendingExportFormat,
    watermarkEnabled,
    setWatermarkEnabled,
    watermarkText,
    setWatermarkText,
    showWatermarkModal,
    handleExport: handleExportFromHook,
    handleExportWithValidation: handleExportWithValidationFromHook,
    confirmExport: confirmExportFromHook,
    cancelExport: cancelExportFromHook,
    handlePrintHtml: handlePrintHtmlFromHook,
    toggleWatermarkModal,
    saveWatermarkSettings
  } = exportHook;

  // Helpers to unwrap API payloads safely
  const getPayload = (resp) => resp?.data?.data || resp?.data || {};

  // Open Share panel for a resume and load shares + feedback
  const handleOpenShare = async (resume) => {
    setShareForResume(resume);
    setCreatedShareUrl("");
    setShowSharePanel(true);
    await Promise.all([loadShares(resume._id), loadOwnerFeedback(resume._id)]);
  };

  const loadShares = async (resumeId) => {
    try {
      setIsLoadingShares(true);
      await authWrap();
      const resp = await apiListShares(resumeId);
      const payload = getPayload(resp);
      setShareLinks(payload.shares || []);
    } catch (e) {
      console.error('Failed to load shares', e);
    } finally {
      setIsLoadingShares(false);
    }
  };

  const loadOwnerFeedback = async (resumeId) => {
    try {
      setIsLoadingOwnerFeedback(true);
      await authWrap();
      const resp = await apiListFeedbackOwner(resumeId);
      const payload = getPayload(resp);
      setOwnerFeedback(payload.feedback || []);
    } catch (e) {
      console.error('Failed to load feedback', e);
    } finally {
      setIsLoadingOwnerFeedback(false);
    }
  };

  const handleGenerateShare = async () => {
    if (!shareForResume) return;
    try {
      setShareActionLoading(true);
      await authWrap();
      const allowedReviewers = (shareForm.allowedReviewersText || '')
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
        .map(email => ({ email }));
      let expiresAt = null;
      if (shareForm.expiresInDays) {
        const days = parseInt(shareForm.expiresInDays, 10);
        if (!isNaN(days) && days > 0) {
          const d = new Date();
          d.setDate(d.getDate() + days);
          expiresAt = d.toISOString();
        }
      }
      const resp = await apiCreateShare(shareForResume._id, {
        privacy: shareForm.privacy,
        allowComments: !!shareForm.allowComments,
        canViewContact: !!shareForm.canViewContact,
        allowedReviewers,
        note: shareForm.note || null,
        expiresAt
      });
      const payload = getPayload(resp);
      // Append new share and expose URL
      if (payload.share) setShareLinks(prev => [payload.share, ...(prev || [])]);
      setCreatedShareUrl(payload.url || '');
      setSuccessMessage('Share link created');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (e) {
      console.error('Create share failed', e);
    } finally {
      setShareActionLoading(false);
    }
  };

  const handleRevokeShare = async (token) => {
    if (!shareForResume) return;
    try {
      setShareActionLoading(true);
      await authWrap();
      await apiRevokeShare(shareForResume._id, token);
      setShareLinks(prev => (prev || []).map(s => s.token === token ? { ...s, status: 'revoked' } : s));
    } catch (e) {
      console.error('Revoke share failed', e);
    } finally {
      setShareActionLoading(false);
    }
  };

  const handleResolveFeedback = async (fb) => {
    try {
      await authWrap();
      const note = window.prompt('Add a resolution note (optional):', '');
      const resp = await apiResolveFeedback(fb._id, { resolutionNote: note || '' });
      const payload = getPayload(resp);
      const updated = payload.feedback || payload;
      setOwnerFeedback(prev => prev.map(it => it._id === updated._id ? updated : it));
    } catch (e) {
      console.error('Resolve feedback failed', e);
    }
  };
  const handleExportFeedback = async (format = 'csv') => {
    if (!shareForResume) return;
    try {
      await authWrap();
      const resp = await apiExportFeedbackSummary(shareForResume._id, format);
      if (format === 'csv') {
        const blob = new Blob([resp.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(shareForResume.name || 'resume')}_feedback.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const payload = getPayload(resp);
        const jsonBlob = new Blob([JSON.stringify(payload.feedback || [], null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(shareForResume.name || 'resume')}_feedback.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Export feedback failed', e);
    }
  };

  // UC-110: Cover Letter Share & Collaborative Review Handlers
  const handleOpenCoverLetterShare = async (coverLetter) => {
    setShareForCoverLetter(coverLetter);
    setCreatedCoverLetterShareUrl("");
    setShowCoverLetterSharePanel(true);
    await Promise.all([loadCoverLetterShares(coverLetter._id), loadCoverLetterOwnerFeedback(coverLetter._id)]);
  };

  const loadCoverLetterShares = async (coverLetterId) => {
    try {
      setIsLoadingCoverLetterShares(true);
      await authWrap();
      const resp = await apiListCoverLetterShares(coverLetterId);
      const payload = getPayload(resp);
      setCoverLetterShareLinks(payload.shares || []);
    } catch (e) {
      console.error('Failed to load cover letter shares', e);
    } finally {
      setIsLoadingCoverLetterShares(false);
    }
  };

  const loadCoverLetterOwnerFeedback = async (coverLetterId) => {
    try {
      setIsLoadingCoverLetterOwnerFeedback(true);
      await authWrap();
      const resp = await apiListCoverLetterFeedbackOwner(coverLetterId);
      const payload = getPayload(resp);
      setCoverLetterOwnerFeedback(payload.feedback || []);
    } catch (e) {
      console.error('Failed to load cover letter feedback', e);
    } finally {
      setIsLoadingCoverLetterOwnerFeedback(false);
    }
  };

  const handleGenerateCoverLetterShare = async () => {
    if (!shareForCoverLetter) return;
    try {
      setCoverLetterShareActionLoading(true);
      await authWrap();
      const allowedReviewers = (coverLetterShareForm.allowedReviewersText || '')
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
        .map(email => ({ email }));
      let expiresAt = null;
      if (coverLetterShareForm.expiresInDays) {
        const days = parseInt(coverLetterShareForm.expiresInDays, 10);
        if (!isNaN(days) && days > 0) {
          const d = new Date();
          d.setDate(d.getDate() + days);
          expiresAt = d.toISOString();
        }
      }
      const resp = await apiCreateCoverLetterShare(shareForCoverLetter._id, {
        privacy: coverLetterShareForm.privacy,
        allowComments: !!coverLetterShareForm.allowComments,
        allowedReviewers,
        note: coverLetterShareForm.note || null,
        expiresAt,
        deadline: coverLetterShareForm.deadline || null
      });
      const payload = getPayload(resp);
      if (payload.share) setCoverLetterShareLinks(prev => [payload.share, ...(prev || [])]);
      setCreatedCoverLetterShareUrl(payload.url || '');
      setCoverLetterSuccessMessage('Share link created');
      setTimeout(() => setCoverLetterSuccessMessage(null), 2500);
    } catch (e) {
      console.error('Create cover letter share failed', e);
    } finally {
      setCoverLetterShareActionLoading(false);
    }
  };

  const handleRevokeCoverLetterShare = async (token) => {
    if (!shareForCoverLetter) return;
    try {
      setCoverLetterShareActionLoading(true);
      await authWrap();
      await apiRevokeCoverLetterShare(shareForCoverLetter._id, token);
      setCoverLetterShareLinks(prev => (prev || []).map(s => s.token === token ? { ...s, status: 'revoked' } : s));
    } catch (e) {
      console.error('Revoke cover letter share failed', e);
    } finally {
      setCoverLetterShareActionLoading(false);
    }
  };

  const handleResolveCoverLetterFeedback = async (fb) => {
    try {
      await authWrap();
      const note = window.prompt('Add a resolution note (optional):', '');
      const resp = await apiResolveCoverLetterFeedback(fb._id, { resolutionNote: note || '' });
      const payload = getPayload(resp);
      const updated = payload.feedback || payload;
      setCoverLetterOwnerFeedback(prev => prev.map(it => it._id === updated._id ? updated : it));
    } catch (e) {
      console.error('Resolve cover letter feedback failed', e);
    }
  };

  const handleExportCoverLetterFeedback = async (format = 'csv') => {
    if (!shareForCoverLetter) return;
    try {
      await authWrap();
      const resp = await apiExportCoverLetterFeedbackSummary(shareForCoverLetter._id, format);
      if (format === 'csv') {
        const blob = new Blob([resp.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(shareForCoverLetter.name || 'cover_letter')}_feedback.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const payload = getPayload(resp);
        const jsonBlob = new Blob([JSON.stringify(payload.feedback || [], null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(shareForCoverLetter.name || 'cover_letter')}_feedback.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Export cover letter feedback failed', e);
    }
  };

  const handleUpdateCoverLetterApproval = async (status) => {
    if (!shareForCoverLetter) return;
    try {
      await authWrap();
      await apiUpdateCoverLetterApproval(shareForCoverLetter._id, status);
      // Update local state
      setShareForCoverLetter(prev => ({ ...prev, approvalStatus: status }));
      // Refresh cover letters list
      await loadSavedCoverLetters();
      setCoverLetterSuccessMessage(`Cover letter marked as ${status}`);
      setTimeout(() => setCoverLetterSuccessMessage(null), 2500);
    } catch (e) {
      console.error('Update cover letter approval failed', e);
    }
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
    const loadedResumes = res.data.data.resumes || [];
    setResumes(loadedResumes);

    // UC-053: Check validation status for each resume
    loadedResumes.forEach(resume => {
      checkValidationStatus(resume._id);
    });
  };

  const loadJobs = async () => {
    try {
      await authWrap();
      const response = await api.get("/api/jobs");
      // Filter for non-archived jobs (all statuses allowed for cover letter regeneration)
      const activeJobs = response.data.data.jobs.filter(
        job => !job.archived
      );
      setJobs(activeJobs);
    } catch (err) {
      console.error("Failed to load jobs:", err);
      setJobs([]);
    }
  };

  const loadCoverLetterTemplates = async (filters = {}) => {
    try {
      setCoverLetterLoading(true);
      await authWrap();
      const [templatesResponse, guidanceResponse] = await Promise.all([
        fetchCoverLetterTemplates(filters), // Fetch templates (no isTemplate filter needed)
        getIndustryGuidance()
      ]);
      setCoverLetterTemplates(templatesResponse.data.data.templates || []);
      setIndustryGuidance(guidanceResponse.data.data.guidance || {});
    } catch (err) {
      console.error("Failed to load cover letter templates:", err);
      setCoverLetterTemplates([]);
    } finally {
      setCoverLetterLoading(false);
    }
  };

  const loadSavedCoverLetters = async () => {
    try {
      await authWrap();
      const response = await fetchCoverLetters(); // Fetch actual cover letters from /api/cover-letters
      setSavedCoverLetters(response.data.data.coverLetters || []);
    } catch (err) {
      console.error("Failed to load saved cover letters:", err);
      setSavedCoverLetters([]);
    }
  };

  // UC-110: Load pending review invitations (documents shared with current user)
  const loadReviewInvitations = async () => {
    try {
      setIsLoadingReviewInvitations(true);
      await authWrap();
      const [resumeInvites, coverLetterInvites] = await Promise.all([
        apiGetReviewInvitations(),
        apiGetCoverLetterReviewInvitations()
      ]);
      const resumeItems = resumeInvites.data?.data?.invitations || [];
      const coverLetterItems = coverLetterInvites.data?.data?.invitations || [];
      // Combine and sort by createdAt descending
      const allInvitations = [...resumeItems, ...coverLetterItems].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setReviewInvitations(allInvitations);
    } catch (err) {
      console.error("Failed to load review invitations:", err);
      setReviewInvitations([]);
    } finally {
      setIsLoadingReviewInvitations(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadAll(), loadSavedCoverLetters(), loadJobs(), loadReviewInvitations()]);
      } catch (e) {
        console.error(e);
        alert("Failed to load resume data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load jobs when cover letter modal opens
  useEffect(() => {
    if (showViewCoverLetterModal && jobs.length === 0) {
      loadJobs();
    }
  }, [showViewCoverLetterModal]);

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

      // Close validation issues panel on save
      setShowValidationIssuesPanel(false);

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

  // UC-51: Export handlers - Wrapping hook functions
  const handleExport = async (format) => {
    if (!viewingResume) return;
    setShowExportMenu(false);
    const filenameBase = `${viewingResume.name.replace(/[^a-z0-9-_]/gi, '_')}`;
    const extMap = { pdf: '.pdf', docx: '.docx', html: '.html', txt: '.txt' };
    const ext = extMap[format] || '';
    const suggested = `${filenameBase}${ext}`;
    setSaveAsFilename(suggested);

    await handleExportFromHook(
      format,
      viewingResume._id,
      (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 4000);
      },
      (error) => {
        setSuccessMessage(error);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    );
  };

  // Perform the server request and trigger file download
  const performExport = async (format, filename) => {
    if (!viewingResume) return;

    // UC-053: Check validation before export
    const canExport = await handleExportWithValidationFromHook(
      viewingResume._id,
      format,
      (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 4000);
      },
      (error) => {
        setSuccessMessage(error);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    );

    if (!canExport) {
      setShowSaveAsModal(false);
      return;
    }

    // Set filename and confirm export
    setSaveAsFilename(filename);
    await confirmExportFromHook();
  };

  // UC-51: Print as HTML (fetch HTML, open new window, print)
  const handlePrintHtml = async () => {
    if (!viewingResume) return;
    setShowExportMenu(false);

    await handlePrintHtmlFromHook(
      viewingResume._id,
      (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      (error) => alert(error)
    );
  };

  // UC-52: Version management handlers - Wrappers for hook
  const handleCloneResume = async () => {
    await handleCloneResumeHook(viewingResume, (clonedResume, message) => {
      setResumes(prev => [clonedResume, ...prev]);
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 4000);
    });
  };

  const handleSetDefaultResume = async (resumeId) => {
    await handleSetDefaultResumeHook(resumeId, viewingResume?._id, (setResumeId, viewingResumeId) => {
      setResumes(prev => prev.map(r => ({
        ...r,
        isDefault: r._id === setResumeId
      })));

      if (viewingResumeId === setResumeId) {
        setViewingResume(prev => ({ ...prev, isDefault: true }));
      }

      setSuccessMessage('Default resume updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    });
  };

  const handleCompareResumes = async (resumeId2) => {
    await handleCompareResumesHook(viewingResume?._id, resumeId2);
  };

  const handleRevertToPreviousVersion = async () => {
    await handleRevertToPreviousVersionHook(
      viewingResume,
      resumes,
      createAutoVersionSnapshot,
      async (revertedResume) => {
        await loadAll();
        setViewingResume(revertedResume);
        setSuccessMessage('Successfully reverted to previous version!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    );
  };

  const handleArchiveResume = async (resumeId) => {
    await handleArchiveResumeHook(resumeId, (archivedId, message) => {
      setResumes(prev => prev.map(r =>
        r._id === archivedId ? { ...r, isArchived: true } : r
      ));

      if (viewingResume?._id === archivedId) {
        setViewingResume(prev => ({ ...prev, isArchived: true }));
      }

      if (!showAllResumes && !showArchivedResumes) {
        const nonArchivedCount = resumes.filter(r => !r.isArchived && r._id !== archivedId).length;
      }

      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 4000);
    });
  };

  const handleUnarchiveResume = async (resumeId) => {
    await handleUnarchiveResumeHook(resumeId, (unarchivedId, message) => {
      setResumes(prev => prev.map(r =>
        r._id === unarchivedId ? { ...r, isArchived: false } : r
      ));

      if (viewingResume?._id === unarchivedId) {
        setViewingResume(prev => ({ ...prev, isArchived: false }));
      }

      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 4000);
    });
  };

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

      // Use utility to merge selected sections
      const updatedResume = mergeResumeChanges(viewingResume, sourceResume, selectedMergeChanges);

      // Handle sectionCustomization separately (requires state setters)
      if (hasSectionCustomizationChange(selectedMergeChanges)) {
        const customization = extractSectionCustomization(sourceResume);
        if (customization) {
          if (customization.visibleSections) {
            setVisibleSections(customization.visibleSections);
          }
          if (customization.sectionOrder) {
            setSectionOrder(customization.sectionOrder);
          }
          if (customization.sectionFormatting) {
            setSectionFormatting(customization.sectionFormatting);
          }
        }
      }

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

  // UC-49: Skills optimization handler - Wrapper for hook
  const handleOptimizeSkills = async () => {
    if (!viewingResume) return;

    const jobSelector = selectedJobForSkills || selectedJobForExperience;

    // Initialize current resume skills
    const currentSkills = viewingResume.sections?.skills || [];
    setCurrentResumeSkills(currentSkills.map(s => typeof s === 'string' ? s : s.name));

    await handleOptimizeSkillsHook(viewingResume._id, jobSelector);
  };

  // Delete individual skill - Wrapper for hook
  const handleDeleteSkill = (skillToDelete) => {
    if (!viewingResume) return;

    const skillName = typeof skillToDelete === 'string' ? skillToDelete : skillToDelete.name;
    const currentSkills = (viewingResume.sections?.skills || []).map(skill =>
      typeof skill === 'string' ? skill : skill.name
    );

    const updatedSkills = handleDeleteSkillHook(skillName, currentSkills);

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

  // UC-49: Apply skill changes to resume - Wrapper for hook
  const handleApplySkillChanges = async () => {
    if (!viewingResume) return;

    await handleApplySkillChangesHook(
      viewingResume,
      (updatedResume) => {
        setViewingResume(updatedResume);
        setHasUnsavedChanges(true);
      },
      () => { } // Success callback - already handled in hook
    );
  };

  // UC-50: Experience tailoring handler - Wrapper for hook
  const handleTailorExperience = async () => {
    await handleTailorExperienceHook(viewingResume, selectedJobForSkills);
  };

  // UC-50: Apply selected experience variations to resume - Wrapper for hook
  const handleApplyExperienceChanges = async () => {
    await handleApplyExperienceChangesHook(viewingResume, (updatedResume) => {
      setViewingResume(updatedResume);
      setHasUnsavedChanges(true);
    });
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

  // Cover Letter delete handlers (styled modal)
  const handleConfirmDeleteCoverLetter = async () => {
    if (!coverLetterToDelete) return;
    setIsCoverLetterDeleting(true);
    try {
      await authWrap();
      await apiDeleteCoverLetter(coverLetterToDelete._id);
      setShowCoverLetterDeleteModal(false);
      setCoverLetterToDelete(null);
      await loadSavedCoverLetters();
      setCoverLetterSuccessMessage("Cover letter deleted successfully!");
      setTimeout(() => setCoverLetterSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete cover letter.");
    } finally {
      setIsCoverLetterDeleting(false);
    }
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

  // UC-053: Validate resume
  const handleValidateResume = async (resume) => {
    setShowValidationIssuesPanel(false); // Close issues panel when running validation
    try {
      const validation = await validateResumeHook(resume, {
        onSuccess: async (validation) => {
          setShowValidationPanel(true);

          // Refresh resumes to get updated metadata
          await loadAll();

          if (validation.isValid) {
            setSuccessMessage('✓ Resume validation passed! You can now export your resume.');
            setTimeout(() => setSuccessMessage(null), 5000);
          }
        },
        onError: (error) => {
          setSuccessMessage('❌ ' + (error.response?.data?.message || 'Failed to validate resume. Please check your connection and try again.'));
          setTimeout(() => setSuccessMessage(null), 5000);
        }
      });
    } catch (error) {
      // Error already handled by hook
    }
  };

  // UC-053: Toggle edit mode
  const toggleEditMode = () => {
    if (isEditMode) {
      // In edit mode - show dropdown instead of immediate action
      setShowEditDropdown(!showEditDropdown);
    } else {
      // Entering edit mode - initialize edited content with current values
      setEditedContent({});
      setIsEditMode(true);
    }
  };

  // UC-053: Exit edit mode without saving
  const exitEditModeWithoutSaving = () => {
    setEditedContent({});
    setIsEditMode(false);
    setShowEditDropdown(false);
  };

  // UC-053: Save edited content
  const handleSaveEditedContent = async () => {
    if (!viewingResume || Object.keys(editedContent).length === 0) {
      setIsEditMode(false);
      setShowEditDropdown(false);
      return;
    }

    try {
      await authWrap();
      const updatedSections = { ...viewingResume.sections };

      // Apply edited content to sections
      Object.keys(editedContent).forEach(key => {
        const parts = key.split('.');
        if (parts.length === 1) {
          // Top-level section (e.g., summary)
          updatedSections[parts[0]] = editedContent[key];
        } else if (parts.length === 2) {
          const [section, indexOrField] = parts;

          // Check if it's an array of strings (like skills)
          if (Array.isArray(updatedSections[section]) && !isNaN(indexOrField)) {
            // Array item (e.g., skills.0, skills.1)
            const index = parseInt(indexOrField);
            updatedSections[section][index] = editedContent[key];
          } else {
            // Nested object property (e.g., contactInfo.name, contactInfo.email)
            if (!updatedSections[section]) {
              updatedSections[section] = {};
            }
            updatedSections[section][indexOrField] = editedContent[key];
          }
        } else if (parts.length === 3) {
          // Array item property (e.g., experience.0.description, education.1.degree)
          const [section, index, field] = parts;
          if (Array.isArray(updatedSections[section])) {
            updatedSections[section][parseInt(index)][field] = editedContent[key];
          }
        }
      });

      await apiUpdateResume(viewingResume._id, { sections: updatedSections });

      // Update viewing resume
      setViewingResume({ ...viewingResume, sections: updatedSections });

      // Clear edited content
      setEditedContent({});

      // Mark validation as stale
      if (validationStatus[viewingResume._id]?.status === 'valid') {
        setValidationStatus(prev => ({
          ...prev,
          [viewingResume._id]: {
            ...prev[viewingResume._id],
            status: 'stale'
          }
        }));
      }

      setSuccessMessage('✓ Resume updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsEditMode(false); // Exit edit mode
      setShowEditDropdown(false);
      await loadAll();
    } catch (error) {
      console.error('Error saving edited content:', error);
      setSuccessMessage('❌ Failed to save changes');
      setTimeout(() => setSuccessMessage(null), 5000);
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

  // Wrapper for file upload - uses extracted utility function
  const handleFileUpload = async (file) => {
    return handleResumeFileUpload(file, getToken, resumes, templates);
  };

  const handleImport = async ({ method, file, json }) => {
    try {
      let templateData;

      if (method === "file" && file) {
        // Handle file upload
        templateData = await handleFileUpload(file);
        // For file uploads, show customization modal first
        setPendingImport(templateData);
        setShowImport(false);
        setShowCustomizeImport(true);
      } else if (method === "json" && json) {
        // Handle JSON import - import directly
        templateData = JSON.parse(json);
        await authWrap();
        await apiImportTemplate(templateData);
        setShowImport(false);
        await loadAll();
        setSuccessMessage("Template imported successfully!");
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        alert("Please select a file or paste JSON");
        return;
      }
    } catch (err) {
      console.error(err);
      alert(method === "file" ? "Failed to import resume file" : "Invalid JSON for import");
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
                        validationStatus={validationStatus[resume._id]?.status}
                        onView={() => handleViewResume(resume)}
                        onShare={() => handleOpenShare(resume)}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-heading font-bold" style={{ color: "#4F5348" }}>
                My Cover Letters
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddCoverLetterModal(true)}
                  className="px-4 py-2 text-white rounded-lg transition flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: '#777C6D' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Cover Letter</span>
                </button>
                <button
                  onClick={() => {
                    loadCoverLetterTemplates();
                    setShowManageCoverLetterTemplates(true);
                  }}
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
                <button
                  onClick={async () => {
                    try {
                      await authWrap();
                      const response = await getCoverLetterTemplateAnalytics();
                      setCoverLetterAnalytics(response.data.data.analytics);
                      setShowCoverLetterAnalytics(true);
                    } catch (err) {
                      console.error("Failed to load analytics:", err);
                      alert("Failed to load template analytics");
                    }
                  }}
                  className="px-4 py-2 text-white rounded-lg transition flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: '#777C6D' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>View Analytics</span>
                </button>
              </div>
            </div>

            {coverLetterSuccessMessage && (
              <div className="mx-0 mb-4 p-4 rounded-lg border" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium" style={{ color: '#166534' }}>{coverLetterSuccessMessage}</p>
                  <button
                    onClick={() => setCoverLetterSuccessMessage(null)}
                    className="text-green-700 hover:text-green-900 transition ml-4"
                    aria-label="Dismiss success message"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {savedCoverLetters.length === 0 ? (
              <Card variant="elevated" className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium">No cover letters yet</p>
                  <p className="text-sm">Click "Add Cover Letter" to create your first cover letter</p>
                </div>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {savedCoverLetters
                    .slice(0, showAllCoverLetters ? undefined : 4)
                    .map((letter) => (
                      <Card
                        key={letter._id}
                        variant="outlined"
                        interactive
                        className="overflow-hidden !p-0"
                      >
                        {/* Preview Area */}
                        <div
                          className="h-64 p-4 flex flex-col justify-start border-b cursor-pointer"
                          style={{ backgroundColor: "#F9F9F9" }}
                          onClick={async () => {
                            setViewingCoverLetter(letter);
                            setCustomCoverLetterName(letter.name);
                            setCustomCoverLetterContent(letter.content);
                            setCustomCoverLetterStyle(letter.style || 'formal');
                            setIsCoverLetterEditMode(false);
                            setSelectedJobForRegeneration(letter?.jobId || '');
                            setShowViewCoverLetterModal(true);
                            // Load jobs when modal opens
                            if (jobs.length === 0) {
                              await loadJobs();
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-xs font-bold" style={{ color: '#4F5348' }}>
                              {letter.name || "Untitled Cover Letter"}
                            </div>
                            <span className="inline-block px-2 py-0.5 text-[10px] rounded-full capitalize flex-shrink-0"
                              style={{ backgroundColor: '#E8EBE4', color: '#4F5348' }}>
                              {letter.style || 'formal'}
                            </span>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="text-[7px] text-gray-600 leading-tight line-clamp-[18]">
                              {letter.content.replace(/<[^>]*>/g, '')}
                            </div>
                          </div>
                        </div>

                        {/* Info & Actions */}
                        <div className="px-2 pt-2 pb-2">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1 flex-1 min-w-0">
                              {letter.name}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              Modified {new Date(letter.updatedAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-1">
                              {/* View Button */}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setViewingCoverLetter(letter);
                                  setCustomCoverLetterName(letter.name);
                                  setCustomCoverLetterContent(letter.content);
                                  setCustomCoverLetterStyle(letter.style || 'formal');
                                  setIsCoverLetterEditMode(false);
                                  setSelectedJobForRegeneration(letter?.jobId || '');
                                  setShowViewCoverLetterModal(true);
                                  // Load jobs when modal opens
                                  if (jobs.length === 0) {
                                    await loadJobs();
                                  }
                                }}
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

                              {/* Edit Button */}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setViewingCoverLetter(letter);
                                  setEditingCoverLetter(letter);
                                  setCustomCoverLetterName(letter.name);
                                  setCustomCoverLetterContent(letter.content);
                                  setCustomCoverLetterStyle(letter.style || 'formal');
                                  setIsCoverLetterEditMode(true);
                                  setSelectedJobForRegeneration(letter?.jobId || '');
                                  setShowViewCoverLetterModal(true);
                                  // Load jobs when modal opens
                                  if (jobs.length === 0) {
                                    await loadJobs();
                                  }
                                }}
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
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>

                              {/* Export Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExportingCoverLetter(letter);
                                  setShowCoverLetterExportModal(true);
                                }}
                                className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center"
                                style={{ color: '#6B7280' }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.color = '#4F5348';
                                  e.currentTarget.style.backgroundColor = '#F5F6F4';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.color = '#6B7280';
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="Export"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </button>

                              {/* UC-110: Share Button for Collaborative Review */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCoverLetterShare(letter);
                                }}
                                className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center"
                                style={{ color: '#6B7280' }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.color = '#2563EB';
                                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.color = '#6B7280';
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="Share for Review"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCoverLetterToDelete(letter);
                                  setShowCoverLetterDeleteModal(true);
                                }}
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
                    ))}
                </div>

                {savedCoverLetters.length > 4 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowAllCoverLetters(!showAllCoverLetters)}
                      className="px-6 py-2 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: '#777C6D' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                    >
                      {showAllCoverLetters ? 'View Less' : 'View All'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* UC-110: Shared with Me Section - Documents shared for review */}
          <SharedWithMeSection
            reviewInvitations={reviewInvitations}
            isLoadingReviewInvitations={isLoadingReviewInvitations}
            loadReviewInvitations={loadReviewInvitations}
          />
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
      <CustomizeTemplateModal
        customizeTemplate={customizeTemplate}
        setCustomizeTemplate={setCustomizeTemplate}
        TEMPLATE_TYPES={TEMPLATE_TYPES}
        getThemePresetNames={getThemePresetNames}
        getThemePreset={getThemePreset}
        setPreviewTemplate={setPreviewTemplate}
        handleCustomizeSave={handleCustomizeSave}
      />

      {/* Import Template Modal */}
      <ImportTemplateModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />

      {/* Customize Import Modal */}
      <CustomizeImportModal
        isOpen={showCustomizeImport}
        pendingImport={pendingImport}
        onClose={() => {
          setShowCustomizeImport(false);
          setPendingImport(null);
          setImportFile(null);
        }}
        onPendingImportChange={setPendingImport}
        onFinalizeImport={handleFinalizeImport}
      />

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* AI Resume Creation Modal */}
      <AIResumeCreationModal
        isOpen={showAIResumeModal}
        onClose={() => setShowAIResumeModal(false)}
        isGenerating={isGenerating}
        aiFormData={aiFormData}
        setAIFormData={setAIFormData}
        jobs={jobs}
        templates={templates}
        showVariations={showVariations}
        variations={variations}
        selectedVariation={selectedVariation}
        setSelectedVariation={setSelectedVariation}
        setShowVariations={setShowVariations}
        setVariations={setVariations}
        generationError={generationError}
        onSubmit={handleGenerateAIResume}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        showModal={showDeleteModal}
        itemToDelete={deletingResume}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        itemType="resume"
        itemDetails={{
          name: deletingResume?.name,
          subtitle: deletingResume ? `Modified ${new Date(deletingResume.updatedAt).toLocaleDateString()}` : ''
        }}
      />

      {/* Delete Template Confirmation Modal */}
      <DeleteConfirmationModal
        showModal={showDeleteTemplateModal}
        itemToDelete={deletingTemplate}
        onClose={handleCancelDeleteTemplate}
        onConfirm={handleConfirmDeleteTemplate}
        isDeleting={isDeleting}
        itemType="template"
        itemDetails={{
          name: deletingTemplate?.name,
          subtitle: deletingTemplate ? `${deletingTemplate.type.charAt(0).toUpperCase() + deletingTemplate.type.slice(1)} template` : ''
        }}
      />

      {/* Cover Letter Delete Confirmation (styled) */}
      {showCoverLetterDeleteModal && coverLetterToDelete && (
        <ModalOverlay onClick={() => setShowCoverLetterDeleteModal(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader title="Confirm Deletion" onClose={() => setShowCoverLetterDeleteModal(false)} variant="danger" />
            <ModalContent>
              <p className="text-gray-700 mb-4">Are you sure you want to delete this cover letter?</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900">{coverLetterToDelete?.name}</p>
                {coverLetterToDelete?.templateName && <p className="text-sm text-gray-600">{coverLetterToDelete.templateName}</p>}
              </div>
              <p className="text-sm text-red-600 font-medium">This action cannot be undone.</p>
            </ModalContent>
            <ModalFooter>
              <CancelButton onClick={() => setShowCoverLetterDeleteModal(false)} disabled={isCoverLetterDeleting} />
              <DangerButton onClick={handleConfirmDeleteCoverLetter} loading={isCoverLetterDeleting} disabled={isCoverLetterDeleting} />
            </ModalFooter>
          </ModalCard>
        </ModalOverlay>
      )}


      {/* Rename Resume Modal */}
      <RenameResumeModal
        showModal={showRenameModal}
        renamingResume={renamingResume}
        onClose={() => setShowRenameModal(false)}
        renameValue={renameValue}
        setRenameValue={setRenameValue}
        onRename={handleRenameResume}
        isRenaming={isRenaming}
      />

      {/* Save As (Export filename) Modal - replaces window.prompt */}
      <SaveAsModal
        isOpen={showSaveAsModal}
        onClose={() => setShowSaveAsModal(false)}
        onSave={(filename) => performExport(pendingExportFormat, filename)}
        filename={saveAsFilename}
        setFilename={setSaveAsFilename}
        isExporting={isExporting}
        format={pendingExportFormat}
      />

      {/* Share & Feedback Panel (Owner) */}
      <ResumeShareFeedbackPanel
        showSharePanel={showSharePanel}
        setShowSharePanel={setShowSharePanel}
        shareForResume={shareForResume}
        successMessage={successMessage}
        shareForm={shareForm}
        setShareForm={setShareForm}
        shareActionLoading={shareActionLoading}
        handleGenerateShare={handleGenerateShare}
        createdShareUrl={createdShareUrl}
        isLoadingShares={isLoadingShares}
        shareLinks={shareLinks}
        loadShares={loadShares}
        handleRevokeShare={handleRevokeShare}
        isLoadingOwnerFeedback={isLoadingOwnerFeedback}
        ownerFeedback={ownerFeedback}
        loadOwnerFeedback={loadOwnerFeedback}
        handleExportFeedback={handleExportFeedback}
        handleResolveFeedback={handleResolveFeedback}
      />

      {/* UC-110: Cover Letter Share & Feedback Panel (Owner) */}
      <CoverLetterShareFeedbackPanel
        showCoverLetterSharePanel={showCoverLetterSharePanel}
        setShowCoverLetterSharePanel={setShowCoverLetterSharePanel}
        shareForCoverLetter={shareForCoverLetter}
        coverLetterSuccessMessage={coverLetterSuccessMessage}
        coverLetterShareForm={coverLetterShareForm}
        setCoverLetterShareForm={setCoverLetterShareForm}
        coverLetterShareActionLoading={coverLetterShareActionLoading}
        handleGenerateCoverLetterShare={handleGenerateCoverLetterShare}
        createdCoverLetterShareUrl={createdCoverLetterShareUrl}
        isLoadingCoverLetterShares={isLoadingCoverLetterShares}
        coverLetterShareLinks={coverLetterShareLinks}
        loadCoverLetterShares={loadCoverLetterShares}
        handleRevokeCoverLetterShare={handleRevokeCoverLetterShare}
        isLoadingCoverLetterOwnerFeedback={isLoadingCoverLetterOwnerFeedback}
        coverLetterOwnerFeedback={coverLetterOwnerFeedback}
        setCoverLetterOwnerFeedback={setCoverLetterOwnerFeedback}
        loadCoverLetterOwnerFeedback={loadCoverLetterOwnerFeedback}
        handleExportCoverLetterFeedback={handleExportCoverLetterFeedback}
        handleResolveCoverLetterFeedback={handleResolveCoverLetterFeedback}
        handleUpdateCoverLetterApproval={handleUpdateCoverLetterApproval}
        authWrap={authWrap}
        apiResolveCoverLetterFeedback={apiResolveCoverLetterFeedback}
        getPayload={getPayload}
      />

      {/* UC-51: Watermark Configuration Modal */}
      <WatermarkModal
        isOpen={showWatermarkModal}
        onClose={() => setShowWatermarkModal(false)}
        watermarkText={watermarkText}
        setWatermarkText={setWatermarkText}
      />

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

        // Helper function to render a section by type - uses extracted ResumeSectionsDisplay component
        const renderSection = (sectionType) => {
          return (
            <ResumeSectionsDisplay
              key={sectionType}
              sectionType={sectionType}
              viewingResume={viewingResume}
              resumeTemplate={resumeTemplate}
              theme={theme}
              sectionFormatting={sectionFormatting}
              handleRegenerateSection={handleRegenerateSection}
              regeneratingSection={regeneratingSection}
              handleDeleteSkill={handleDeleteSkill}
              isEditMode={isEditMode}
              editedContent={editedContent}
              setEditedContent={setEditedContent}
              setViewingResume={setViewingResume}
            />
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
                    {/* UC-053: View Issues Button */}
                    <ViewIssuesButton
                      validationResults={validationResults}
                      onClick={() => setShowValidationIssuesPanel(v => !v)}
                    />

                    {/* UC-053: Validate Button */}
                    <button
                      onClick={() => handleValidateResume(viewingResume)}
                      disabled={isValidating}
                      className="px-4 py-2 text-white rounded-lg transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: isValidating ? '#9CA3AF' : '#10B981' }}
                      onMouseOver={(e) => !isValidating && (e.currentTarget.style.backgroundColor = '#059669')}
                      onMouseOut={(e) => !isValidating && (e.currentTarget.style.backgroundColor = '#10B981')}
                      title="Validate resume before export"
                    >
                      {isValidating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Validating...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Validate</span>
                        </>
                      )}
                    </button>

                    {/* UC-053: Edit Mode Toggle with Dropdown */}
                    <FinishEditDropdown
                      isEditMode={isEditMode}
                      showDropdown={showEditDropdown}
                      setShowDropdown={setShowEditDropdown}
                      onToggleEditMode={toggleEditMode}
                      onSaveAndExit={handleSaveEditedContent}
                      onExitWithoutSaving={exitEditModeWithoutSaving}
                    />

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
                  <CustomizationPanel
                    showCustomizationPanel={showCustomizationPanel}
                    selectedJobType={selectedJobType}
                    applyJobTypeConfig={applyJobTypeConfig}
                    showPresetMenu={showPresetMenu}
                    setShowPresetMenu={setShowPresetMenu}
                    SECTION_PRESETS={SECTION_PRESETS}
                    applyPreset={applyPreset}
                    customPresets={customPresets}
                    setShowSavePresetModal={setShowSavePresetModal}
                    sectionOrder={sectionOrder}
                    DEFAULT_SECTIONS={DEFAULT_SECTIONS}
                    visibleSections={visibleSections}
                    sectionFormatting={sectionFormatting}
                    viewingResume={viewingResume}
                    moveSection={moveSection}
                    handleToggleSection={handleToggleSection}
                    openSectionFormatting={openSectionFormatting}
                    getSectionStatus={getSectionStatus}
                    jobs={jobs}
                    selectedJobForSkills={selectedJobForSkills}
                    selectedJobForExperience={selectedJobForExperience}
                    setSelectedJobForSkills={setSelectedJobForSkills}
                    setSelectedJobForExperience={setSelectedJobForExperience}
                    handleOptimizeSkills={handleOptimizeSkills}
                    isOptimizingSkills={isOptimizingSkills}
                    handleTailorExperience={handleTailorExperience}
                    isTailoringExperience={isTailoringExperience}
                  />

                  {/* UC-053: Validation Issues Panel - Inline view below customization */}
                  {showValidationIssuesPanel && validationResults && (
                    <InlineValidationIssuesPanel
                      validationResults={validationResults}
                      onClose={() => setShowValidationIssuesPanel(false)}
                    />
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
                      {/* UC-053: Editable Contact Info in Edit Mode */}
                      {isEditMode ? (
                        <EditableContactInfo
                          contactInfo={viewingResume.sections?.contactInfo}
                          editedContent={editedContent}
                          setEditedContent={setEditedContent}
                          theme={theme}
                        />
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>

                    {/* Render sections in current customized order and visibility */}
                    {sectionOrder
                      .filter(sectionKey => visibleSections.includes(sectionKey))
                      .map(sectionType => renderSection(sectionType))}

                  </div>
                </div>

                {/* Save Preset Modal */}
                <SavePresetModal
                  showModal={showSavePresetModal}
                  onClose={() => setShowSavePresetModal(false)}
                  presetName={presetName}
                  setPresetName={setPresetName}
                  onSave={saveCustomPreset}
                />

                {/* Section Formatting Panel */}
                <SectionFormattingModal
                  showModal={showFormattingPanel}
                  onClose={() => setShowFormattingPanel(false)}
                  formattingSection={formattingSection}
                  sectionFormatting={sectionFormatting}
                  updateSectionFormatting={updateSectionFormatting}
                  setSectionFormatting={setSectionFormatting}
                  DEFAULT_SECTIONS={DEFAULT_SECTIONS}
                />

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
                      className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${hasUnsavedChanges && !isSavingCustomization
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

                      <ExportMenu
                        isOpen={showExportMenu}
                        onClose={() => setShowExportMenu(false)}
                        onExport={handleExport}
                        onPrintHtml={handlePrintHtml}
                        isExporting={isExporting}
                        watermarkEnabled={watermarkEnabled}
                        setWatermarkEnabled={setWatermarkEnabled}
                        watermarkText={watermarkText}
                        onConfigureWatermark={() => setShowWatermarkModal(true)}
                      />
                    </div>

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

      {/* UC-053: Validation Panel Modal */}
      {showValidationPanel && validationResults && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999
          }}
          onClick={() => {
            setShowValidationPanel(false);
            // Keep validationResults so "View Issues" button stays visible
          }}
        >
          <div
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ValidationPanel
              validation={validationResults}
              onClose={() => {
                setShowValidationPanel(false);
                // Keep validationResults so "View Issues" button stays visible
              }}
              onFixIssue={(issue, replacement) => {
                console.log('Fix issue:', issue, 'with:', replacement);
                // TODO: Implement auto-fix functionality
              }}
            />
          </div>
        </div>
      )}

      {/* UC-52: Clone Resume Modal */}
      <CloneModal
        isOpen={showCloneModal && !!viewingResume}
        onClose={() => setShowCloneModal(false)}
        onClone={handleCloneResume}
        resumeName={viewingResume?.name || ''}
        cloneName={cloneName}
        setCloneName={setCloneName}
        cloneDescription={cloneDescription}
        setCloneDescription={setCloneDescription}
        isCloning={isCloning}
      />

      {/* UC-52: Compare Resume Modal */}
      <CompareModal
        show={showCompareModal}
        viewingResume={viewingResume}
        resumes={resumes}
        comparisonData={comparisonData}
        onClose={() => {
          setShowCompareModal(false);
          setCompareResumeId(null);
          setComparisonData(null);
        }}
        onCompare={handleCompareResumes}
        onRevert={handleRevertToPreviousVersion}
        onMerge={() => {
          setSelectedMergeChanges([]);
          setShowMergeModal(true);
        }}
        onDelete={(resume) => {
          setDeletingResume(resume);
          setShowDeleteModal(true);
        }}
        onBackToSelector={() => {
          setCompareResumeId(null);
          setComparisonData(null);
        }}
      />


      {/* UC-52: Merge Resume Modal */}
      <MergeResumeModal
        showMergeModal={showMergeModal}
        setShowMergeModal={setShowMergeModal}
        comparisonData={comparisonData}
        viewingResume={viewingResume}
        selectedMergeChanges={selectedMergeChanges}
        setSelectedMergeChanges={setSelectedMergeChanges}
        isMerging={isMerging}
        handleMergeResumes={handleMergeResumes}
      />


      {/* UC-49: Skills Optimization Modal */}
      <SkillsOptimizationModal
        showSkillsOptimization={showSkillsOptimization}
        setShowSkillsOptimization={setShowSkillsOptimization}
        skillsOptimizationData={skillsOptimizationData}
        showSkillsSuccessBanner={showSkillsSuccessBanner}
        currentResumeSkills={currentResumeSkills}
        handleRemoveSkill={handleRemoveSkill}
        selectedSkillsToAdd={selectedSkillsToAdd}
        toggleSkillSelection={toggleSkillSelection}
        setSelectedSkillsToAdd={setSelectedSkillsToAdd}
        isApplyingSkills={isApplyingSkills}
        handleApplySkillChanges={handleApplySkillChanges}
        viewingResume={viewingResume}
      />

      {/* UC-50: Experience Tailoring Modal - Coming in next update */}
      <ExperienceTailoringModal
        showExperienceTailoring={showExperienceTailoring}
        setShowExperienceTailoring={setShowExperienceTailoring}
        experienceTailoringData={experienceTailoringData}
        showExperienceSuccessBanner={showExperienceSuccessBanner}
        selectedExperienceVariations={selectedExperienceVariations}
        setSelectedExperienceVariations={setSelectedExperienceVariations}
        toggleExperienceVariation={toggleExperienceVariation}
        isApplyingExperience={isApplyingExperience}
        handleApplyExperienceChanges={handleApplyExperienceChanges}
      />


      {/* Cover Letter Template Browser Modal */}
      <CoverLetterTemplateBrowserModal
        showCoverLetterBrowser={showCoverLetterBrowser}
        setShowCoverLetterBrowser={setShowCoverLetterBrowser}
        coverLetterFilters={coverLetterFilters}
        setCoverLetterFilters={setCoverLetterFilters}
        loadCoverLetterTemplates={loadCoverLetterTemplates}
        coverLetterLoading={coverLetterLoading}
        coverLetterTemplates={coverLetterTemplates}
        setSelectedCoverLetterTemplate={setSelectedCoverLetterTemplate}
        setShowCoverLetterPreview={setShowCoverLetterPreview}
        authWrap={authWrap}
        setCustomCoverLetterName={setCustomCoverLetterName}
        setCustomCoverLetterContent={setCustomCoverLetterContent}
        setCustomCoverLetterStyle={setCustomCoverLetterStyle}
        setIsCreatingCoverLetterTemplate={setIsCreatingCoverLetterTemplate}
        setShowCoverLetterCustomize={setShowCoverLetterCustomize}
        exportCoverLetterTemplate={exportCoverLetterTemplate}
        setShareTemplateId={setShareTemplateId}
        setShowCoverLetterShare={setShowCoverLetterShare}
      />

      {/* Cover Letter Preview Modal */}
      {showCoverLetterPreview && selectedCoverLetterTemplate && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowCoverLetterPreview(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                    {selectedCoverLetterTemplate.name}
                  </h2>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {selectedCoverLetterTemplate.industry}
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      {selectedCoverLetterTemplate.style}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowCoverLetterPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">{selectedCoverLetterTemplate.description}</p>
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {selectedCoverLetterTemplate.content}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowCoverLetterPreview(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    try {
                      await authWrap();
                      setShowCoverLetterPreview(false);
                      setShowCoverLetterBrowser(false);

                      // Initialize the customization form
                      setCustomCoverLetterName(`${selectedCoverLetterTemplate.name} - Customized`);
                      setCustomCoverLetterContent(selectedCoverLetterTemplate.content);
                      setCustomCoverLetterStyle(selectedCoverLetterTemplate.style || 'formal');
                      setIsCreatingCoverLetterTemplate(false); // Using template to create cover letter
                      setShowCoverLetterCustomize(true);
                    } catch (err) {
                      console.error("Failed to prepare template:", err);
                    }
                  }}
                >
                  Use This Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Customize Modal */}
      <CoverLetterCustomizeModal
        isOpen={showCoverLetterCustomize}
        selectedTemplate={selectedCoverLetterTemplate}
        onClose={() => setShowCoverLetterCustomize(false)}
        customName={customCoverLetterName}
        setCustomName={setCustomCoverLetterName}
        customContent={customCoverLetterContent}
        setCustomContent={setCustomCoverLetterContent}
        customStyle={customCoverLetterStyle}
        setCustomStyle={setCustomCoverLetterStyle}
        isCreatingTemplate={isCreatingCoverLetterTemplate}
        onTemplateChange={setSelectedCoverLetterTemplate}
        onSave={async () => {
          try {
            if (!customCoverLetterName.trim()) {
              alert("Please enter a name for your cover letter.");
              return;
            }
            if (!customCoverLetterContent.trim()) {
              alert("Please enter cover letter content.");
              return;
            }

            await authWrap();

            if (isCreatingCoverLetterTemplate) {
              // Creating a reusable template
              await createCoverLetterTemplate({
                name: customCoverLetterName,
                industry: selectedCoverLetterTemplate.industry || 'general',
                style: selectedCoverLetterTemplate.style || 'formal',
                description: `Custom ${selectedCoverLetterTemplate.style || 'formal'} cover letter template`,
                content: customCoverLetterContent
              });

              setShowCoverLetterCustomize(false);
              setCustomCoverLetterName('');
              setCustomCoverLetterContent('');
              setIsCreatingCoverLetterTemplate(false);

              await loadCoverLetterTemplates();
              setShowManageCoverLetterTemplates(true); // Reopen Manage Templates modal
              alert("Cover letter template created successfully!");
            } else {
              // Creating a saved cover letter (one-time use)
              await createCoverLetter({
                name: customCoverLetterName,
                content: customCoverLetterContent,
                style: customCoverLetterStyle,
                templateId: selectedCoverLetterTemplate._id || null
              });

              setShowCoverLetterCustomize(false);
              setCustomCoverLetterName('');
              setCustomCoverLetterContent('');
              setCustomCoverLetterStyle('formal');
              setIsCreatingCoverLetterTemplate(false);

              await loadSavedCoverLetters();
              setCoverLetterSuccessMessage("Cover letter saved successfully!");
              setTimeout(() => setCoverLetterSuccessMessage(null), 3000);
            }
          } catch (err) {
            console.error("Save failed:", err);
            alert("Failed to save. Please try again.");
          }
        }}
      />


      {/* Cover Letter Import Modal */}
      <CoverLetterImportModal
        showCoverLetterImport={showCoverLetterImport}
        setShowCoverLetterImport={setShowCoverLetterImport}
        importCoverLetterJson={importCoverLetterJson}
        setImportCoverLetterJson={setImportCoverLetterJson}
        customCoverLetterName={customCoverLetterName}
        setCustomCoverLetterName={setCustomCoverLetterName}
        authWrap={authWrap}
        createCoverLetterTemplate={createCoverLetterTemplate}
        loadCoverLetterTemplates={loadCoverLetterTemplates}
      />


      {/* Cover Letter Share Modal */}
      <CoverLetterShareModal
        showCoverLetterShare={showCoverLetterShare}
        setShowCoverLetterShare={setShowCoverLetterShare}
        shareTemplateId={shareTemplateId}
        authWrap={authWrap}
        shareCoverLetterTemplate={shareCoverLetterTemplate}
        loadCoverLetterTemplates={loadCoverLetterTemplates}
      />


      {/* Add Cover Letter Modal */}
      <AddCoverLetterModal
        showAddCoverLetterModal={showAddCoverLetterModal}
        setShowAddCoverLetterModal={setShowAddCoverLetterModal}
        loadCoverLetterTemplates={loadCoverLetterTemplates}
        setShowCoverLetterBrowser={setShowCoverLetterBrowser}
        setAiJobId={setAiJobId}
        setAiTone={setAiTone}
        setAiIndustry={setAiIndustry}
        setAiCompanyCulture={setAiCompanyCulture}
        setAiLength={setAiLength}
        setAiWritingStyle={setAiWritingStyle}
        setAiCustomInstructions={setAiCustomInstructions}
        setAiVariationCount={setAiVariationCount}
        setAiGeneratedVariations={setAiGeneratedVariations}
        setAiGenerationError={setAiGenerationError}
        setAiConsistencyWarnings={setAiConsistencyWarnings}
        setSelectedAIVariation={setSelectedAIVariation}
        setShowAdvancedOptions={setShowAdvancedOptions}
        loadJobs={loadJobs}
        setShowAICoverLetterModal={setShowAICoverLetterModal}
        setSelectedCoverLetterTemplate={setSelectedCoverLetterTemplate}
        setCustomCoverLetterName={setCustomCoverLetterName}
        setCustomCoverLetterContent={setCustomCoverLetterContent}
        setCustomCoverLetterStyle={setCustomCoverLetterStyle}
        setIsCreatingCoverLetterTemplate={setIsCreatingCoverLetterTemplate}
        setShowCoverLetterCustomize={setShowCoverLetterCustomize}
      />

      {/* AI Cover Letter Generation Modal */}
      <AICoverLetterModal
        showAICoverLetterModal={showAICoverLetterModal}
        setShowAICoverLetterModal={setShowAICoverLetterModal}
        isGeneratingAI={isGeneratingAI}
        setIsGeneratingAI={setIsGeneratingAI}
        aiJobId={aiJobId}
        setAiJobId={setAiJobId}
        aiTone={aiTone}
        setAiTone={setAiTone}
        aiIndustry={aiIndustry}
        setAiIndustry={setAiIndustry}
        aiCompanyCulture={aiCompanyCulture}
        setAiCompanyCulture={setAiCompanyCulture}
        aiLength={aiLength}
        setAiLength={setAiLength}
        aiWritingStyle={aiWritingStyle}
        setAiWritingStyle={setAiWritingStyle}
        aiCustomInstructions={aiCustomInstructions}
        setAiCustomInstructions={setAiCustomInstructions}
        aiVariationCount={aiVariationCount}
        setAiVariationCount={setAiVariationCount}
        aiGeneratedVariations={aiGeneratedVariations}
        setAiGeneratedVariations={setAiGeneratedVariations}
        selectedAIVariation={selectedAIVariation}
        setSelectedAIVariation={setSelectedAIVariation}
        aiGenerationError={aiGenerationError}
        setAiGenerationError={setAiGenerationError}
        aiConsistencyWarnings={aiConsistencyWarnings}
        setAiConsistencyWarnings={setAiConsistencyWarnings}
        showAdvancedOptions={showAdvancedOptions}
        setShowAdvancedOptions={setShowAdvancedOptions}
        jobs={jobs}
        authWrap={authWrap}
        generateAICoverLetter={generateAICoverLetter}
        createCoverLetter={createCoverLetter}
        loadSavedCoverLetters={loadSavedCoverLetters}
        setCoverLetterSuccessMessage={setCoverLetterSuccessMessage}
        setAiCompanyName={() => { }}
        setAiPosition={() => { }}
        setAiJobDescription={() => { }}
        setCultureAnalysis={() => { }}
      />


      {/* Manage Cover Letter Templates Modal */}
      <ManageCoverLetterTemplatesModal
        showManageCoverLetterTemplates={showManageCoverLetterTemplates}
        setShowManageCoverLetterTemplates={setShowManageCoverLetterTemplates}
        setSelectedCoverLetterTemplate={setSelectedCoverLetterTemplate}
        setCustomCoverLetterName={setCustomCoverLetterName}
        setCustomCoverLetterContent={setCustomCoverLetterContent}
        setIsCreatingCoverLetterTemplate={setIsCreatingCoverLetterTemplate}
        setShowCoverLetterCustomize={setShowCoverLetterCustomize}
        setShowCoverLetterImport={setShowCoverLetterImport}
        coverLetterLoading={coverLetterLoading}
        coverLetterTemplates={coverLetterTemplates}
        authWrap={authWrap}
        deleteCoverLetterTemplate={deleteCoverLetterTemplate}
        loadCoverLetterTemplates={loadCoverLetterTemplates}
      />


      {/* Cover Letter Template Analytics Modal */}
      <CoverLetterAnalyticsModal
        showCoverLetterAnalytics={showCoverLetterAnalytics}
        setShowCoverLetterAnalytics={setShowCoverLetterAnalytics}
        coverLetterAnalytics={coverLetterAnalytics}
      />


      {/* View/Edit Cover Letter Modal - UC-060: Enhanced with rich text editor and AI assistance */}
      <ViewEditCoverLetterModal
        showViewCoverLetterModal={showViewCoverLetterModal}
        setShowViewCoverLetterModal={setShowViewCoverLetterModal}
        viewingCoverLetter={viewingCoverLetter}
        setViewingCoverLetter={setViewingCoverLetter}
        isCoverLetterEditMode={isCoverLetterEditMode}
        setIsCoverLetterEditMode={setIsCoverLetterEditMode}
        customCoverLetterName={customCoverLetterName}
        setCustomCoverLetterName={setCustomCoverLetterName}
        customCoverLetterStyle={customCoverLetterStyle}
        setCustomCoverLetterStyle={setCustomCoverLetterStyle}
        customCoverLetterContent={customCoverLetterContent}
        setCustomCoverLetterContent={setCustomCoverLetterContent}
        formatCoverLetterContent={formatCoverLetterContent}
        setExportingCoverLetter={setExportingCoverLetter}
        setShowCoverLetterExportModal={setShowCoverLetterExportModal}
        editingCoverLetter={editingCoverLetter}
        setEditingCoverLetter={setEditingCoverLetter}
        selectedJobForRegeneration={selectedJobForRegeneration}
        setSelectedJobForRegeneration={setSelectedJobForRegeneration}
        jobs={jobs}
        loadJobs={loadJobs}
        aiIndustry={aiIndustry}
        aiCompanyCulture={aiCompanyCulture}
        aiConsistencyWarnings={aiConsistencyWarnings}
        setAiConsistencyWarnings={setAiConsistencyWarnings}
        isGeneratingAI={isGeneratingAI}
        setIsGeneratingAI={setIsGeneratingAI}
        authWrap={authWrap}
        generateAICoverLetter={generateAICoverLetter}
        aiLength={aiLength}
        aiWritingStyle={aiWritingStyle}
        editorContentKey={editorContentKey}
        setEditorContentKey={setEditorContentKey}
        apiUpdateCoverLetter={apiUpdateCoverLetter}
        loadSavedCoverLetters={loadSavedCoverLetters}
      />

      {/* UC-054: Cover Letter Export Modal */}
      {showCoverLetterExportModal && exportingCoverLetter && (
        <CoverLetterExportModal
          coverLetter={exportingCoverLetter}
          onClose={() => {
            setShowCoverLetterExportModal(false);
            setExportingCoverLetter(null);
          }}
          contactInfo={null} // Will be fetched from user profile in modal
          linkedJob={null} // Could be populated if cover letter is linked to a job
        />
      )}
    </div>
  );
}
