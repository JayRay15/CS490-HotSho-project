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
import SkillsOptimizationModal from "../../components/resume/SkillsOptimizationModal";
import MergeResumeModal from "../../components/resume/MergeResumeModal";
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
          {reviewInvitations.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-heading font-bold" style={{ color: "#4F5348" }}>
                    Shared with Me
                  </h2>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {reviewInvitations.length} pending review{reviewInvitations.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={loadReviewInvitations}
                  disabled={isLoadingReviewInvitations}
                  className="px-3 py-1.5 text-sm border rounded-lg transition hover:bg-gray-50"
                  style={{ borderColor: '#D1D5DB' }}
                >
                  {isLoadingReviewInvitations ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Documents that others have shared with you for review and feedback.
              </p>

              {isLoadingReviewInvitations ? (
                <div className="text-center py-8 text-gray-500">Loading invitations...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reviewInvitations.map((invitation) => {
                    const isResume = invitation.type === 'resume';
                    const deadlineDate = invitation.deadline ? new Date(invitation.deadline) : null;
                    const isOverdue = deadlineDate && deadlineDate < new Date();
                    const daysLeft = deadlineDate ? Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

                    return (
                      <Card
                        key={`${invitation.type}-${invitation.token}`}
                        variant="outlined"
                        className="overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="p-4">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isResume ? 'bg-blue-100' : 'bg-purple-100'
                                }`}>
                                {isResume ? (
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isResume ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                }`}>
                                {isResume ? 'Resume' : 'Cover Letter'}
                              </span>
                            </div>
                            {invitation.approvalStatus && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${invitation.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                invitation.approvalStatus === 'changes_requested' ? 'bg-orange-100 text-orange-700' :
                                  invitation.approvalStatus === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                {invitation.approvalStatus.replace('_', ' ')}
                              </span>
                            )}
                          </div>

                          {/* Document Name */}
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                            {invitation.documentName}
                          </h3>

                          {/* Owner */}
                          <p className="text-sm text-gray-600 mb-2">
                            From: <span className="font-medium">{invitation.ownerName}</span>
                          </p>

                          {/* Note */}
                          {invitation.note && (
                            <p className="text-sm text-gray-500 mb-2 line-clamp-2 italic">
                              "{invitation.note}"
                            </p>
                          )}

                          {/* Deadline */}
                          {deadlineDate && (
                            <div className={`text-xs px-2 py-1 rounded mb-3 inline-block ${isOverdue
                              ? 'bg-red-100 text-red-700'
                              : daysLeft <= 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-50 text-blue-700'
                              }`}>
                              {isOverdue ? (
                                <>⚠️ Overdue: {deadlineDate.toLocaleDateString()}</>
                              ) : (
                                <>📅 Due: {deadlineDate.toLocaleDateString()} ({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)</>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 mt-3">
                            <a
                              href={isResume
                                ? `/share/${invitation.token}`
                                : `/share/cover-letter/${invitation.token}`
                              }
                              className="flex-1 px-3 py-2 text-sm text-center text-white rounded-lg transition"
                              style={{ backgroundColor: '#777C6D' }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                            >
                              Review & Comment
                            </a>
                          </div>

                          {/* Shared date */}
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            Shared {new Date(invitation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
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
      {showSharePanel && shareForResume && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowSharePanel(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-2xl font-heading font-semibold">Share & Feedback — {shareForResume.name}</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSharePanel(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {successMessage && (
              <div className="mx-6 mt-6 p-4 border rounded-lg" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                <p className="font-medium" style={{ color: '#166534' }}>{successMessage}</p>
              </div>
            )}

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create New Share */}
              <Card variant="outlined">
                <div className="p-4">
                  <h4 className="text-lg font-heading font-semibold mb-3">Create new share link</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Privacy</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={shareForm.privacy}
                        onChange={(e) => setShareForm(prev => ({ ...prev, privacy: e.target.value }))}
                      >
                        <option value="unlisted">Unlisted (anyone with link)</option>
                        <option value="private">Private (allow-listed reviewers only)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="allowComments" type="checkbox" className="h-4 w-4" checked={shareForm.allowComments} onChange={(e) => setShareForm(prev => ({ ...prev, allowComments: e.target.checked }))} />
                      <label htmlFor="allowComments" className="text-sm">Allow comments</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="canViewContact" type="checkbox" className="h-4 w-4" checked={shareForm.canViewContact} onChange={(e) => setShareForm(prev => ({ ...prev, canViewContact: e.target.checked }))} />
                      <label htmlFor="canViewContact" className="text-sm">Show contact info</label>
                    </div>
                    {shareForm.privacy === 'private' && (
                      <div>
                        <label className="text-sm text-gray-700 block mb-1">Allowed reviewer emails (comma-separated)</label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2"
                          placeholder="name@example.com, other@example.com"
                          value={shareForm.allowedReviewersText}
                          onChange={(e) => setShareForm(prev => ({ ...prev, allowedReviewersText: e.target.value }))}
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Note (optional)</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        placeholder="e.g., For Design team review"
                        value={shareForm.note}
                        onChange={(e) => setShareForm(prev => ({ ...prev, note: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Expiry (days, optional)</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full border rounded px-3 py-2"
                        placeholder="e.g., 7"
                        value={shareForm.expiresInDays}
                        onChange={(e) => setShareForm(prev => ({ ...prev, expiresInDays: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleGenerateShare}
                        disabled={shareActionLoading}
                        className="px-4 py-2 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                        style={{ backgroundColor: '#2563EB' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                      >
                        {shareActionLoading ? 'Creating…' : 'Create link'}
                      </button>
                      {createdShareUrl && (
                        <button
                          onClick={() => navigator.clipboard.writeText(createdShareUrl)}
                          className="px-3 py-2 border rounded text-sm"
                          title={createdShareUrl}
                        >Copy URL</button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Existing Share Links */}
              <Card variant="outlined">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-heading font-semibold">Existing links</h4>
                    <button
                      onClick={() => loadShares(shareForResume._id)}
                      className="text-sm px-3 py-1 border rounded"
                    >Refresh</button>
                  </div>
                  {isLoadingShares ? (
                    <div className="text-sm text-gray-500">Loading…</div>
                  ) : (shareLinks && shareLinks.length > 0 ? (
                    <div className="space-y-2">
                      {shareLinks.map((s) => (
                        <div key={s.token} className={`p-3 border rounded flex items-center justify-between ${s.status === 'revoked' ? 'opacity-60' : ''}`}>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{s.privacy === 'private' ? 'Private' : 'Unlisted'} • {s.allowComments ? 'Comments on' : 'Comments off'} {s.canViewContact ? '• Contact visible' : ''}</p>
                            <p className="text-xs text-gray-600 truncate">Token: {s.token}</p>
                            {s.expiresAt && (
                              <p className="text-xs text-gray-500">Expires: {new Date(s.expiresAt).toLocaleString()}</p>
                            )}
                            <p className="text-xs text-gray-500">Status: {s.status}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {s.status !== 'revoked' && (
                              <>
                                <button
                                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/share/${s.token}`)}
                                  className="px-2 py-1 border rounded text-xs"
                                >Copy URL</button>
                                <button
                                  onClick={() => handleRevokeShare(s.token)}
                                  className="px-2 py-1 border rounded text-xs text-red-600 border-red-300"
                                >Revoke</button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No share links yet.</p>
                  ))}
                </div>
              </Card>

              {/* Feedback Management */}
              <Card variant="outlined" className="lg:col-span-2">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-heading font-semibold">Feedback</h4>
                    <div className="flex items-center gap-2">
                      <button onClick={() => loadOwnerFeedback(shareForResume._id)} className="text-sm px-3 py-1 border rounded">Refresh</button>
                      <button onClick={() => handleExportFeedback('csv')} className="text-sm px-3 py-1 border rounded">Export CSV</button>
                      <button onClick={() => handleExportFeedback('json')} className="text-sm px-3 py-1 border rounded">Export JSON</button>
                    </div>
                  </div>
                  {isLoadingOwnerFeedback ? (
                    <div className="text-sm text-gray-500">Loading…</div>
                  ) : (ownerFeedback && ownerFeedback.length > 0 ? (
                    <div className="divide-y">
                      {ownerFeedback.map(fb => (
                        <div key={fb._id} className="py-3 flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm"><span className="font-medium">{fb.authorName || fb.authorEmail || 'Anonymous'}</span> — <span className="text-gray-600 text-xs">{new Date(fb.createdAt).toLocaleString()}</span></p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{fb.comment}</p>
                            {fb.status === 'resolved' && (
                              <p className="text-xs text-green-700 mt-1">Resolved {fb.resolvedAt ? new Date(fb.resolvedAt).toLocaleString() : ''}{fb.resolutionNote ? ` • ${fb.resolutionNote}` : ''}</p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {fb.status !== 'resolved' && (
                              <button onClick={() => handleResolveFeedback(fb)} className="px-3 py-1 border rounded text-sm">Mark Resolved</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No feedback yet.</p>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* UC-110: Cover Letter Share & Feedback Panel (Owner) */}
      {showCoverLetterSharePanel && shareForCoverLetter && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowCoverLetterSharePanel(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-2xl font-heading font-semibold">Share & Feedback — {shareForCoverLetter.name}</h3>
                {shareForCoverLetter.approvalStatus && (
                  <span className={`text-sm px-2 py-1 rounded mt-1 inline-block ${shareForCoverLetter.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                    shareForCoverLetter.approvalStatus === 'needs_revision' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                    Status: {shareForCoverLetter.approvalStatus.replace('_', ' ')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Approval buttons */}
                <button
                  onClick={() => handleUpdateCoverLetterApproval('approved')}
                  className="px-3 py-1 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200 transition"
                >
                  Mark Approved
                </button>
                <button
                  onClick={() => handleUpdateCoverLetterApproval('needs_revision')}
                  className="px-3 py-1 text-sm rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition"
                >
                  Needs Revision
                </button>
                <button
                  onClick={() => setShowCoverLetterSharePanel(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {coverLetterSuccessMessage && (
              <div className="mx-6 mt-6 p-4 border rounded-lg" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                <p className="font-medium" style={{ color: '#166534' }}>{coverLetterSuccessMessage}</p>
              </div>
            )}

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create New Share */}
              <Card variant="outlined">
                <div className="p-4">
                  <h4 className="text-lg font-heading font-semibold mb-3">Create new share link</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Privacy</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={coverLetterShareForm.privacy}
                        onChange={(e) => setCoverLetterShareForm(prev => ({ ...prev, privacy: e.target.value }))}
                      >
                        <option value="unlisted">Unlisted (anyone with link)</option>
                        <option value="private">Private (allow-listed reviewers only)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="clAllowComments" type="checkbox" className="h-4 w-4" checked={coverLetterShareForm.allowComments} onChange={(e) => setCoverLetterShareForm(prev => ({ ...prev, allowComments: e.target.checked }))} />
                      <label htmlFor="clAllowComments" className="text-sm">Allow comments</label>
                    </div>
                    {coverLetterShareForm.privacy === 'private' && (
                      <div>
                        <label className="text-sm text-gray-700 block mb-1">Allowed reviewer emails (comma-separated)</label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2"
                          placeholder="name@example.com, other@example.com"
                          value={coverLetterShareForm.allowedReviewersText}
                          onChange={(e) => setCoverLetterShareForm(prev => ({ ...prev, allowedReviewersText: e.target.value }))}
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Note (optional)</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        placeholder="e.g., For career advisor review"
                        value={coverLetterShareForm.note}
                        onChange={(e) => setCoverLetterShareForm(prev => ({ ...prev, note: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Feedback deadline (optional)</label>
                      <input
                        type="date"
                        className="w-full border rounded px-3 py-2"
                        value={coverLetterShareForm.deadline}
                        onChange={(e) => setCoverLetterShareForm(prev => ({ ...prev, deadline: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Link expiry (days, optional)</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full border rounded px-3 py-2"
                        placeholder="e.g., 7"
                        value={coverLetterShareForm.expiresInDays}
                        onChange={(e) => setCoverLetterShareForm(prev => ({ ...prev, expiresInDays: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleGenerateCoverLetterShare}
                        disabled={coverLetterShareActionLoading}
                        className="px-4 py-2 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                        style={{ backgroundColor: '#2563EB' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                      >
                        {coverLetterShareActionLoading ? 'Creating…' : 'Create link'}
                      </button>
                      {createdCoverLetterShareUrl && (
                        <button
                          onClick={() => navigator.clipboard.writeText(createdCoverLetterShareUrl)}
                          className="px-3 py-2 border rounded text-sm"
                          title={createdCoverLetterShareUrl}
                        >Copy URL</button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Existing Share Links */}
              <Card variant="outlined">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-heading font-semibold">Existing links</h4>
                    <button
                      onClick={() => loadCoverLetterShares(shareForCoverLetter._id)}
                      className="text-sm px-3 py-1 border rounded"
                    >Refresh</button>
                  </div>
                  {isLoadingCoverLetterShares ? (
                    <div className="text-sm text-gray-500">Loading…</div>
                  ) : (coverLetterShareLinks && coverLetterShareLinks.length > 0 ? (
                    <div className="space-y-2">
                      {coverLetterShareLinks.map((s) => (
                        <div key={s.token} className={`p-3 border rounded flex items-center justify-between ${s.status === 'revoked' ? 'opacity-60' : ''}`}>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{s.privacy === 'private' ? 'Private' : 'Unlisted'} • {s.allowComments ? 'Comments on' : 'Comments off'}</p>
                            <p className="text-xs text-gray-600 truncate">Token: {s.token}</p>
                            {s.expiresAt && (
                              <p className="text-xs text-gray-500">Expires: {new Date(s.expiresAt).toLocaleString()}</p>
                            )}
                            {s.deadline && (
                              <p className="text-xs text-gray-500">Feedback deadline: {new Date(s.deadline).toLocaleDateString()}</p>
                            )}
                            <p className="text-xs text-gray-500">Status: {s.status}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {s.status !== 'revoked' && (
                              <>
                                <button
                                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/share/cover-letter/${s.token}`)}
                                  className="px-2 py-1 border rounded text-xs"
                                >Copy URL</button>
                                <button
                                  onClick={() => handleRevokeCoverLetterShare(s.token)}
                                  className="px-2 py-1 border rounded text-xs text-red-600 border-red-300"
                                >Revoke</button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No share links yet.</p>
                  ))}
                </div>
              </Card>

              {/* Feedback Management */}
              <Card variant="outlined" className="lg:col-span-2">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-heading font-semibold">Feedback</h4>
                    <div className="flex items-center gap-2">
                      <button onClick={() => loadCoverLetterOwnerFeedback(shareForCoverLetter._id)} className="text-sm px-3 py-1 border rounded">Refresh</button>
                      <button onClick={() => handleExportCoverLetterFeedback('csv')} className="text-sm px-3 py-1 border rounded">Export CSV</button>
                      <button onClick={() => handleExportCoverLetterFeedback('json')} className="text-sm px-3 py-1 border rounded">Export JSON</button>
                    </div>
                  </div>

                  {/* Feedback Stats */}
                  {coverLetterOwnerFeedback && coverLetterOwnerFeedback.length > 0 && (
                    <div className="mb-4 flex gap-4 flex-wrap">
                      <div className="px-3 py-2 bg-gray-100 rounded">
                        <span className="text-sm font-medium">Total: </span>
                        <span className="text-sm">{coverLetterOwnerFeedback.length}</span>
                      </div>
                      <div className="px-3 py-2 bg-blue-50 rounded">
                        <span className="text-sm font-medium text-blue-700">Open: </span>
                        <span className="text-sm text-blue-700">{coverLetterOwnerFeedback.filter(f => f.status === 'open').length}</span>
                      </div>
                      <div className="px-3 py-2 bg-green-50 rounded">
                        <span className="text-sm font-medium text-green-700">Resolved: </span>
                        <span className="text-sm text-green-700">{coverLetterOwnerFeedback.filter(f => f.status === 'resolved').length}</span>
                      </div>
                      <div className="px-3 py-2 bg-yellow-50 rounded">
                        <span className="text-sm font-medium text-yellow-700">Dismissed: </span>
                        <span className="text-sm text-yellow-700">{coverLetterOwnerFeedback.filter(f => f.status === 'dismissed').length}</span>
                      </div>
                    </div>
                  )}

                  {isLoadingCoverLetterOwnerFeedback ? (
                    <div className="text-sm text-gray-500">Loading…</div>
                  ) : (coverLetterOwnerFeedback && coverLetterOwnerFeedback.length > 0 ? (
                    <div className="divide-y">
                      {coverLetterOwnerFeedback.map(fb => (
                        <div key={fb._id} className="py-3 flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium">{fb.authorName || fb.authorEmail || 'Anonymous'}</p>
                              <span className="text-xs text-gray-500">{new Date(fb.createdAt).toLocaleString()}</span>
                              {fb.feedbackTheme && (
                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">{fb.feedbackTheme}</span>
                              )}
                              {fb.suggestionType && (
                                <span className={`text-xs px-2 py-0.5 rounded ${fb.suggestionType === 'critical' ? 'bg-red-100 text-red-700' :
                                  fb.suggestionType === 'suggestion' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>{fb.suggestionType}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap mt-1">{fb.comment}</p>
                            {fb.selectionStart !== undefined && fb.selectionEnd !== undefined && (
                              <p className="text-xs text-gray-500 mt-1 italic">Inline comment (chars {fb.selectionStart}-{fb.selectionEnd})</p>
                            )}
                            {fb.status === 'resolved' && (
                              <p className="text-xs text-green-700 mt-1">✓ Resolved {fb.resolvedAt ? new Date(fb.resolvedAt).toLocaleString() : ''}{fb.resolutionNote ? ` • ${fb.resolutionNote}` : ''}</p>
                            )}
                            {fb.status === 'dismissed' && (
                              <p className="text-xs text-yellow-700 mt-1">✗ Dismissed{fb.resolutionNote ? ` • ${fb.resolutionNote}` : ''}</p>
                            )}
                          </div>
                          <div className="flex-shrink-0 flex gap-1">
                            {fb.status === 'open' && (
                              <>
                                <button onClick={() => handleResolveCoverLetterFeedback(fb)} className="px-2 py-1 border rounded text-xs text-green-600 border-green-300 hover:bg-green-50">Resolve</button>
                                <button onClick={async () => {
                                  try {
                                    await authWrap();
                                    const note = window.prompt('Add a dismissal note (optional):', '');
                                    const resp = await apiResolveCoverLetterFeedback(fb._id, { resolutionNote: note || '', status: 'dismissed' });
                                    const payload = getPayload(resp);
                                    const updated = payload.feedback || payload;
                                    setCoverLetterOwnerFeedback(prev => prev.map(it => it._id === updated._id ? updated : it));
                                  } catch (e) {
                                    console.error('Dismiss cover letter feedback failed', e);
                                  }
                                }} className="px-2 py-1 border rounded text-xs text-yellow-600 border-yellow-300 hover:bg-yellow-50">Dismiss</button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No feedback yet.</p>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

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
                  {/* UC-053: Rich text editor in edit mode */}
                  {isEditMode ? (
                    <RichTextEditor
                      value={editedContent['summary'] || viewingResume.sections.summary}
                      onChange={(content) => {
                        setEditedContent(prev => ({ ...prev, summary: content }));
                      }}
                      placeholder="Enter your professional summary..."
                      style={{
                        fontFamily: theme.fonts.body,
                        fontSize: theme.fonts.sizes?.body || "14px"
                      }}
                    />
                  ) : (
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
                  )}
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
                          isEditMode ? (
                            /* UC-053: Rich text editor for experience bullets in edit mode */
                            <div className="space-y-2">
                              {job.bullets.map((bullet, bulletIdx) => (
                                <RichTextEditor
                                  key={bulletIdx}
                                  value={editedContent[`experience_${idx}_${bulletIdx}`] || bullet}
                                  onChange={(content) => {
                                    setEditedContent(prev => ({ ...prev, [`experience_${idx}_${bulletIdx}`]: content }));
                                  }}
                                  placeholder={`Bullet point ${bulletIdx + 1}...`}
                                  style={{
                                    fontFamily: theme.fonts.body,
                                    fontSize: theme.fonts.sizes?.body || "14px"
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
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
                          )
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
                  {/* UC-053: Edit mode for skills */}
                  {isEditMode ? (
                    <EditableSkills
                      skills={viewingResume.sections.skills}
                      editedContent={editedContent}
                      setEditedContent={setEditedContent}
                      viewingResume={viewingResume}
                      setViewingResume={setViewingResume}
                      theme={theme}
                    />
                  ) : (
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
                  )}
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

                      // UC-053: Edit mode for education
                      if (isEditMode) {
                        return (
                          <EditableEducation
                            key={idx}
                            education={edu}
                            idx={idx}
                            editedContent={editedContent}
                            setEditedContent={setEditedContent}
                            theme={theme}
                          />
                        );
                      }

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


