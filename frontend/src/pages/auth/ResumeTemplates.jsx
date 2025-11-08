import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { setAuthToken } from "../../api/axios";
import { fetchTemplates, createTemplate as apiCreateTemplate, updateTemplate as apiUpdateTemplate, deleteTemplate as apiDeleteTemplate, importTemplate as apiImportTemplate } from "../../api/resumeTemplates";
import { fetchCoverLetterTemplates, createCoverLetterTemplate, updateCoverLetterTemplate, deleteCoverLetterTemplate, trackCoverLetterTemplateUsage, importCoverLetterTemplate, exportCoverLetterTemplate, shareCoverLetterTemplate, getIndustryGuidance, getCoverLetterTemplateAnalytics, generateAICoverLetter } from "../../api/coverLetterTemplates";
import { fetchCoverLetters, createCoverLetter, updateCoverLetter as apiUpdateCoverLetter, deleteCoverLetter as apiDeleteCoverLetter, setDefaultCoverLetter, archiveCoverLetter, unarchiveCoverLetter, cloneCoverLetter as apiCloneCoverLetter } from "../../api/coverLetters";
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
import LoadingSpinner from "../../components/LoadingSpinner";
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
import ResumeSectionHeader from "../../components/resume/ResumeSectionHeader";
import SectionToggleItem from "../../components/resume/SectionToggleItem";
import CustomizationPanel from "../../components/resume/CustomizationPanel";
import SavePresetModal from "../../components/resume/SavePresetModal";
import SectionFormattingModal from "../../components/resume/SectionFormattingModal";
import CustomizeTemplateModal from "../../components/resume/CustomizeTemplateModal";
import RenameResumeModal from "../../components/resume/RenameResumeModal";
import DeleteConfirmationModal from "../../components/resume/DeleteConfirmationModal";
import ViewIssuesButton from "../../components/resume/ViewIssuesButton";
import { THEME_PRESETS, getThemePresetNames, getThemePreset } from "../../utils/themePresets";
import { TEMPLATE_TYPES, DEFAULT_SECTIONS, SECTION_PRESETS, formatDate } from "../../utils/resumeConstants";
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
  exportFeedbackSummary as apiExportFeedbackSummary
} from "../../api/resumeShare";

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
  const [isCreatingCoverLetterTemplate, setIsCreatingCoverLetterTemplate] = useState(false); // Track if creating template vs cover letter
  const [showAllCoverLetters, setShowAllCoverLetters] = useState(false);
  const [showCoverLetterAnalytics, setShowCoverLetterAnalytics] = useState(false);
  const [coverLetterAnalytics, setCoverLetterAnalytics] = useState(null);
  const [showAddCoverLetterModal, setShowAddCoverLetterModal] = useState(false);
  const [showManageCoverLetterTemplates, setShowManageCoverLetterTemplates] = useState(false);
  const [editingCoverLetter, setEditingCoverLetter] = useState(null);
  const [showEditCoverLetterModal, setShowEditCoverLetterModal] = useState(false);

  // AI Cover Letter Generation State
  const [showAICoverLetterModal, setShowAICoverLetterModal] = useState(false);
  const [aiJobId, setAiJobId] = useState('');
  const [aiTone, setAiTone] = useState('formal');
  const [aiVariationCount, setAiVariationCount] = useState(1);
  const [aiGeneratedVariations, setAiGeneratedVariations] = useState([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGenerationError, setAiGenerationError] = useState('');
  const [selectedAIVariation, setSelectedAIVariation] = useState(0);

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
    handleApplyExperienceChanges: handleApplyExperienceChangesHook
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

  const loadCoverLetterTemplates = async (filters = {}) => {
    try {
      setCoverLetterLoading(true);
      await authWrap();
      console.log('Loading templates with filters:', filters); // Debug log
      const [templatesResponse, guidanceResponse] = await Promise.all([
        fetchCoverLetterTemplates(filters), // Fetch templates (no isTemplate filter needed)
        getIndustryGuidance()
      ]);
      console.log('Received templates:', templatesResponse.data.data.templates.length); // Debug log
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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadAll(), loadSavedCoverLetters()]);
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
                        variant="elevated"
                        className="p-4 hover:shadow-lg transition-shadow"
                      >
                        <div className="mb-3">
                          <h3 className="font-semibold text-lg truncate" style={{ color: "#4F5348" }}>
                            {letter.name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                          {letter.content.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          Modified {new Date(letter.updatedAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingCoverLetter(letter);
                              setCustomCoverLetterName(letter.name);
                              setCustomCoverLetterContent(letter.content);
                              setCustomCoverLetterStyle(letter.style || 'formal');
                              setShowEditCoverLetterModal(true);
                            }}
                            className="flex-1 px-3 py-1.5 text-sm rounded transition"
                            style={{ backgroundColor: "#777C6D", color: "white" }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                          >
                            View
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete "${letter.name}"?`)) {
                                try {
                                  await authWrap();
                                  await apiDeleteCoverLetter(letter._id);
                                  await loadSavedCoverLetters();
                                  alert("Cover letter deleted successfully!");
                                } catch (err) {
                                  console.error("Delete failed:", err);
                                  alert("Failed to delete cover letter.");
                                }
                              }
                            }}
                            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded transition"
                          >
                            Delete
                          </button>
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
                    onChange={(e) => setAIFormData({ ...aiFormData, name: e.target.value })}
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
                      onChange={(e) => setAIFormData({ ...aiFormData, jobId: e.target.value })}
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
                    onChange={(e) => setAIFormData({ ...aiFormData, templateId: e.target.value })}
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
                          className={`border-2 rounded-lg p-4 cursor-pointer transition ${selectedVariation?.variationNumber === variation.variationNumber
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
                              className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition ${isInCurrent
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
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all flex items-center gap-2 ${isInResume
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
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all flex items-center gap-2 ${isInResume
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${exp.relevanceScore >= 80 ? 'bg-green-100 text-green-800' :
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
                              className={`w-full text-left bg-gray-50 rounded p-3 border-2 transition cursor-pointer ${!selectedExperienceVariations[`${expIdx}-${bulletIdx}`] || selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'original'
                                  ? 'border-gray-400 bg-gray-100'
                                  : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <div className="flex items-start gap-2">
                                <input
                                  type="radio"
                                  name={`variation-${expIdx}-${bulletIdx}`}
                                  checked={!selectedExperienceVariations[`${expIdx}-${bulletIdx}`] || selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'original'}
                                  onChange={() => { }}
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
                                className={`w-full text-left bg-blue-50 rounded p-3 border-2 transition cursor-pointer ${selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'achievement'
                                    ? 'border-blue-600 bg-blue-100 shadow-md'
                                    : 'border-blue-200 hover:border-blue-400'
                                  }`}
                              >
                                <div className="flex items-start gap-2">
                                  <input
                                    type="radio"
                                    name={`variation-${expIdx}-${bulletIdx}`}
                                    checked={selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'achievement'}
                                    onChange={() => { }}
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
                                className={`w-full text-left bg-green-50 rounded p-3 border-2 transition cursor-pointer ${selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'technical'
                                    ? 'border-green-600 bg-green-100 shadow-md'
                                    : 'border-green-200 hover:border-green-400'
                                  }`}
                              >
                                <div className="flex items-start gap-2">
                                  <input
                                    type="radio"
                                    name={`variation-${expIdx}-${bulletIdx}`}
                                    checked={selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'technical'}
                                    onChange={() => { }}
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
                                className={`w-full text-left bg-purple-50 rounded p-3 border-2 transition cursor-pointer ${selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'impact'
                                    ? 'border-purple-600 bg-purple-100 shadow-md'
                                    : 'border-purple-200 hover:border-purple-400'
                                  }`}
                              >
                                <div className="flex items-start gap-2">
                                  <input
                                    type="radio"
                                    name={`variation-${expIdx}-${bulletIdx}`}
                                    checked={selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'impact'}
                                    onChange={() => { }}
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

      {/* Cover Letter Template Browser Modal */}
      {showCoverLetterBrowser && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowCoverLetterBrowser(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                  Cover Letter Templates
                </h2>
                <button
                  onClick={() => setShowCoverLetterBrowser(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Filters */}
              <div className="mb-6">
                <div className="flex gap-4 mb-4">
                  <select
                    value={coverLetterFilters.style}
                    onChange={(e) => {
                      const newFilters = { ...coverLetterFilters, style: e.target.value };
                      setCoverLetterFilters(newFilters);
                      loadCoverLetterTemplates(newFilters);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Styles</option>
                    <option value="formal">Formal</option>
                    <option value="modern">Modern</option>
                    <option value="creative">Creative</option>
                    <option value="technical">Technical</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
              </div>

              {/* Template Grid */}
              {coverLetterLoading ? (
                <div className="text-center py-12">
                  <LoadingSpinner />
                </div>
              ) : coverLetterTemplates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No templates found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    // Deduplicate default templates - keep only one per name
                    const defaultTemplateNames = [
                      'Formal Professional',
                      'Modern Professional',
                      'Creative Expression',
                      'Technical Professional',
                      'Executive Leadership',
                      'Technology Professional',
                      'Business Professional',
                      'Healthcare Professional'
                    ];
                    const seenNames = new Set();
                    const uniqueTemplates = coverLetterTemplates.filter(template => {
                      const isDefaultSystemTemplate = defaultTemplateNames.includes(template.name);

                      if (isDefaultSystemTemplate) {
                        if (seenNames.has(template.name)) {
                          return false; // Skip duplicate by name
                        }
                        seenNames.add(template.name);
                        return true;
                      }
                      return true; // Keep all custom templates
                    });

                    return uniqueTemplates.map((template) => (
                      <Card
                        key={template._id}
                        variant="outlined"
                        interactive
                        className="p-4 hover:border-[#777C6D] transition"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded capitalize">
                                {template.style} Style
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => {
                                setSelectedCoverLetterTemplate(template);
                                setShowCoverLetterPreview(true);
                              }}
                            >
                              Preview
                            </Button>
                            <Button
                              variant="primary"
                              size="small"
                              onClick={async () => {
                                try {
                                  await authWrap();
                                  setSelectedCoverLetterTemplate(template);
                                  setShowCoverLetterBrowser(false);

                                  // Initialize the customization form
                                  setCustomCoverLetterName(`${template.name} - Customized`);
                                  setCustomCoverLetterContent(template.content);
                                  setCustomCoverLetterStyle(template.style || 'formal');
                                  setIsCreatingCoverLetterTemplate(false); // Using template to create cover letter
                                  setShowCoverLetterCustomize(true);
                                } catch (err) {
                                  console.error("Failed to prepare template:", err);
                                }
                              }}
                            >
                              Use
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  await authWrap();
                                  const response = await exportCoverLetterTemplate(template._id);
                                  const dataStr = JSON.stringify(response.data.data.template, null, 2);
                                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                  const url = URL.createObjectURL(dataBlob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `${template.name.replace(/\s+/g, '_')}_template.json`;
                                  link.click();
                                  URL.revokeObjectURL(url);
                                } catch (err) {
                                  console.error("Export failed:", err);
                                  alert("Failed to export template");
                                }
                              }}
                              className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition"
                            >
                              Export
                            </button>
                            <button
                              onClick={() => {
                                setShareTemplateId(template._id);
                                setShowCoverLetterShare(true);
                              }}
                              className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition"
                            >
                              Share
                            </button>
                          </div>
                        </div>
                      </Card>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
      {showCoverLetterCustomize && selectedCoverLetterTemplate && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowCoverLetterCustomize(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                  Customize Cover Letter
                </h2>
                <button
                  onClick={() => setShowCoverLetterCustomize(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={customCoverLetterName}
                  onChange={(e) => setCustomCoverLetterName(e.target.value)}
                  placeholder="e.g., My Software Engineer Cover Letter"
                />
              </div>

              {isCreatingCoverLetterTemplate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Style
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={selectedCoverLetterTemplate.style || 'formal'}
                    onChange={(e) => setSelectedCoverLetterTemplate({
                      ...selectedCoverLetterTemplate,
                      style: e.target.value
                    })}
                  >
                    <option value="formal">Formal</option>
                    <option value="modern">Modern</option>
                    <option value="creative">Creative</option>
                    <option value="technical">Technical</option>
                    <option value="executive">Executive</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-2">
                    Choose a style that best represents this template
                  </p>
                </div>
              )}

              {!isCreatingCoverLetterTemplate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter Style
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={customCoverLetterStyle}
                    onChange={(e) => setCustomCoverLetterStyle(e.target.value)}
                  >
                    <option value="formal">Formal</option>
                    <option value="modern">Modern</option>
                    <option value="creative">Creative</option>
                    <option value="technical">Technical</option>
                    <option value="executive">Executive</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-2">
                    Choose a style for your cover letter
                  </p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter Content
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Replace the placeholders in brackets (e.g., [POSITION], [COMPANY]) with your specific information.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Tip:</strong> Common placeholders include [YOUR_NAME], [POSITION], [COMPANY], [HIRING_MANAGER_NAME],
                    [FIELD], [SKILLS], [ACHIEVEMENT], etc.
                  </p>
                </div>
                <textarea
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg font-sans text-sm"
                  value={customCoverLetterContent}
                  onChange={(e) => setCustomCoverLetterContent(e.target.value)}
                  placeholder="Customize your cover letter here..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowCoverLetterCustomize(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
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
                        alert("Cover letter saved successfully!");
                      }
                    } catch (err) {
                      console.error("Save failed:", err);
                      alert("Failed to save. Please try again.");
                    }
                  }}
                >
                  {isCreatingCoverLetterTemplate ? 'Create Template' : 'Save Cover Letter'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Import Modal */}
      {showCoverLetterImport && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowCoverLetterImport(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                  Import Cover Letter Template
                </h2>
                <button
                  onClick={() => setShowCoverLetterImport(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Paste your cover letter text below. We'll create a template from it.
                </p>
                <textarea
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg text-sm"
                  value={importCoverLetterJson}
                  onChange={(e) => setImportCoverLetterJson(e.target.value)}
                  placeholder="Dear Hiring Manager,&#10;&#10;I am writing to express my interest in...&#10;&#10;Paste your cover letter text here and we'll create a template from it."
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name (Optional)
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={customCoverLetterName}
                  onChange={(e) => setCustomCoverLetterName(e.target.value)}
                  placeholder="e.g., My Marketing Cover Letter"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCoverLetterImport(false);
                    setImportCoverLetterJson('');
                    setCustomCoverLetterName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    try {
                      if (!importCoverLetterJson.trim()) {
                        alert("Please paste your cover letter text.");
                        return;
                      }

                      await authWrap();

                      // Create template from plain text
                      const templateName = customCoverLetterName.trim() || 'Imported Cover Letter';
                      await createCoverLetterTemplate({
                        name: templateName,
                        industry: 'general',
                        style: 'formal',
                        description: 'Imported from text',
                        content: importCoverLetterJson.trim(),
                        isTemplate: true  // Import as a reusable template
                      });

                      setShowCoverLetterImport(false);
                      setImportCoverLetterJson('');
                      setCustomCoverLetterName('');
                      await loadCoverLetterTemplates();
                      alert("Cover letter template imported successfully!");
                    } catch (err) {
                      console.error("Import failed:", err);
                      alert("Failed to import cover letter. Please try again.");
                    }
                  }}
                >
                  Import Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Share Modal */}
      {showCoverLetterShare && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowCoverLetterShare(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                  Share Template
                </h2>
                <button
                  onClick={() => setShowCoverLetterShare(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Choose how you want to share this template:
                </p>
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      try {
                        await authWrap();
                        await shareCoverLetterTemplate(shareTemplateId, { isShared: true });
                        setShowCoverLetterShare(false);
                        loadCoverLetterTemplates();
                        alert("Template is now publicly shared!");
                      } catch (err) {
                        console.error("Share failed:", err);
                        alert("Failed to share template");
                      }
                    }}
                    className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-[#777C6D] transition text-left"
                  >
                    <div className="font-semibold mb-1">Make Public</div>
                    <div className="text-sm text-gray-600">Anyone can view and use this template</div>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await authWrap();
                        await shareCoverLetterTemplate(shareTemplateId, { isShared: false });
                        setShowCoverLetterShare(false);
                        loadCoverLetterTemplates();
                        alert("Template is now private");
                      } catch (err) {
                        console.error("Unshare failed:", err);
                        alert("Failed to update sharing settings");
                      }
                    }}
                    className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-[#777C6D] transition text-left"
                  >
                    <div className="font-semibold mb-1">Make Private</div>
                    <div className="text-sm text-gray-600">Only you can see this template</div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowCoverLetterShare(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Cover Letter Modal */}
      {showAddCoverLetterModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowAddCoverLetterModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                    Create Cover Letter
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose how you want to create your cover letter
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCoverLetterModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Option 1: Select Template */}
                <button
                  onClick={() => {
                    setShowAddCoverLetterModal(false);
                    loadCoverLetterTemplates();
                    setShowCoverLetterBrowser(true);
                  }}
                  className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-[#777C6D] hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "#E8EAE3" }}>
                      <svg className="w-6 h-6" style={{ color: "#4F5348" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2" style={{ color: "#4F5348" }}>
                        Use a Template
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Choose from professional templates designed for different industries and styles
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1">
                        <li>• 5 professional writing styles</li>
                        <li>• Industry-specific guidance</li>
                        <li>• Customizable placeholders</li>
                      </ul>
                    </div>
                  </div>
                </button>

                {/* Option 2: AI Generate */}
                <button
                  onClick={async () => {
                    setShowAddCoverLetterModal(false);
                    // Reset AI state
                    setAiJobId('');
                    setAiTone('formal');
                    setAiVariationCount(1);
                    setAiGeneratedVariations([]);
                    setAiGenerationError('');
                    setSelectedAIVariation(0);
                    // Load jobs for the dropdown
                    await loadJobs();
                    setShowAICoverLetterModal(true);
                  }}
                  className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-[#777C6D] hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg" style={{ color: "#4F5348" }}>
                          AI Generate
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full">
                          NEW
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Let AI create a personalized cover letter based on the job posting and your profile
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1">
                        <li>• Personalized content for any job</li>
                        <li>• Highlights relevant experience</li>
                        <li>• Multiple variations available</li>
                        <li>• Company culture analysis</li>
                      </ul>
                    </div>
                  </div>
                </button>

                {/* Option 3: Create from Scratch */}
                <button
                  onClick={() => {
                    setShowAddCoverLetterModal(false);
                    setSelectedCoverLetterTemplate({
                      name: 'New Cover Letter',
                      industry: 'general',
                      style: 'formal',
                      content: '',
                      description: ''
                    });
                    setCustomCoverLetterName('My Cover Letter');
                    setCustomCoverLetterContent('');
                    setCustomCoverLetterStyle('formal');
                    setIsCreatingCoverLetterTemplate(false); // Creating a cover letter, not a template
                    setShowCoverLetterCustomize(true);
                  }}
                  className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-[#777C6D] hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "#E8EAE3" }}>
                      <svg className="w-6 h-6" style={{ color: "#4F5348" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2" style={{ color: "#4F5348" }}>
                        Create from Scratch
                      </h3>
                      <p className="text-sm text-gray-600">
                        Start with a blank canvas and write your own custom cover letter
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowAddCoverLetterModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Cover Letter Generation Modal */}
      {showAICoverLetterModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => !isGeneratingAI && setShowAICoverLetterModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                      AI Cover Letter Generator
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Generate personalized cover letters based on job postings
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isGeneratingAI && setShowAICoverLetterModal(false)}
                  disabled={isGeneratingAI}
                  className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!aiGeneratedVariations.length ? (
                /* Input Form */
                <div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Job to Tailor For *
                    </label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      value={aiJobId}
                      onChange={(e) => {
                        setAiJobId(e.target.value);
                        // Clear any previous errors when job is selected
                        if (e.target.value) {
                          setAiGenerationError('');
                        }
                      }}
                      disabled={isGeneratingAI}
                    >
                      <option value="">-- Select a job --</option>
                      {jobs.map((job) => (
                        <option key={job._id} value={job._id}>
                          {job.title} at {job.company}
                        </option>
                      ))}
                    </select>
                    {!jobs.length && (
                      <p className="text-sm text-orange-600 mt-2">
                        ⚠️ You haven't added any jobs yet. Please add a job first to generate a cover letter.
                      </p>
                    )}
                  </div>

                  {aiJobId && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-blue-900 text-sm mb-1">Selected Job</p>
                          <p className="text-blue-800 text-sm">
                            <strong>{jobs.find(j => j._id === aiJobId)?.title}</strong> at{' '}
                            <strong>{jobs.find(j => j._id === aiJobId)?.company}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Writing Tone
                      </label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                        disabled={isGeneratingAI}
                      >
                        <option value="formal">Formal Professional</option>
                        <option value="modern">Modern Professional</option>
                        <option value="creative">Creative</option>
                        <option value="technical">Technical</option>
                        <option value="executive">Executive Leadership</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Variations
                      </label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        value={aiVariationCount}
                        onChange={(e) => setAiVariationCount(Number(e.target.value))}
                        disabled={isGeneratingAI}
                      >
                        <option value={1}>1 Variation</option>
                        <option value={2}>2 Variations</option>
                        <option value={3}>3 Variations</option>
                      </select>
                    </div>
                  </div>

                  {aiGenerationError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{aiGenerationError}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setShowAICoverLetterModal(false)}
                      disabled={isGeneratingAI}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={async () => {
                        if (!aiJobId) {
                          setAiGenerationError('Please select a job to generate a cover letter for');
                          return;
                        }

                        try {
                          setIsGeneratingAI(true);
                          setAiGenerationError('');
                          await authWrap();
                          
                          const response = await generateAICoverLetter({
                            jobId: aiJobId,
                            tone: aiTone,
                            variationCount: aiVariationCount
                          });

                          setAiGeneratedVariations(response.data.data.variations);
                          setSelectedAIVariation(0);
                        } catch (err) {
                          console.error('AI generation failed:', err);
                          setAiGenerationError(err.response?.data?.message || 'Failed to generate cover letter. Please ensure your profile has work experience and try again.');
                        } finally {
                          setIsGeneratingAI(false);
                        }
                      }}
                      disabled={isGeneratingAI || !aiJobId}
                    >
                      {isGeneratingAI ? (
                        <>
                          <svg className="animate-spin h-5 w-5 mr-2 inline-block" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Cover Letter
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Results View */
                <div>
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm text-green-800 font-medium">
                        Successfully generated {aiGeneratedVariations.length} variation{aiGeneratedVariations.length > 1 ? 's' : ''}!
                      </p>
                    </div>
                  </div>

                  {aiVariationCount > 1 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Variation
                      </label>
                      <div className="flex gap-2">
                        {aiGeneratedVariations.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedAIVariation(index)}
                            className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
                              selectedAIVariation === index
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            Variation {index + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {aiGeneratedVariations[selectedAIVariation]?.content}
                      </pre>
                    </div>
                  </div>

                  <div className="flex justify-between gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setAiGeneratedVariations([]);
                        setSelectedAIVariation(0);
                      }}
                    >
                      ← Generate Another
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowAICoverLetterModal(false);
                          setAiGeneratedVariations([]);
                          setAiCompanyName('');
                          setAiPosition('');
                          setAiJobDescription('');
                          setCultureAnalysis(null);
                        }}
                      >
                        Close
                      </Button>
                      <Button
                        variant="primary"
                        onClick={async () => {
                          try {
                            await authWrap();
                            const selectedContent = aiGeneratedVariations[selectedAIVariation].content;
                            
                            // Find the selected job to get company and position
                            const selectedJob = jobs.find(j => j._id === aiJobId);
                            const coverLetterName = selectedJob 
                              ? `${selectedJob.title} at ${selectedJob.company}`
                              : 'AI Generated Cover Letter';
                            
                            await createCoverLetter({
                              name: coverLetterName,
                              content: selectedContent,
                              style: aiTone,
                              templateId: null
                            });

                            setShowAICoverLetterModal(false);
                            setAiGeneratedVariations([]);
                            setAiJobId('');
                            
                            await loadSavedCoverLetters();
                            alert('AI-generated cover letter saved successfully!');
                          } catch (err) {
                            console.error('Save failed:', err);
                            alert('Failed to save cover letter. Please try again.');
                          }
                        }}
                      >
                        Save Cover Letter
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manage Cover Letter Templates Modal */}
      {showManageCoverLetterTemplates && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0 0, 0.48)' }}
          onClick={() => setShowManageCoverLetterTemplates(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                  Manage Templates
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowManageCoverLetterTemplates(false);
                      setSelectedCoverLetterTemplate({
                        name: 'New Template',
                        industry: 'general',
                        style: 'formal',
                        content: '',
                        description: ''
                      });
                      setCustomCoverLetterName('My Custom Template');
                      setCustomCoverLetterContent('');
                      setIsCreatingCoverLetterTemplate(true); // Creating a template, not a cover letter
                      setShowCoverLetterCustomize(true);
                    }}
                    className="px-4 py-2 text-white rounded-lg transition"
                    style={{ backgroundColor: '#777C6D' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                  >
                    Create Template
                  </button>
                  <button
                    onClick={() => {
                      setShowManageCoverLetterTemplates(false);
                      setShowCoverLetterImport(true);
                    }}
                    className="px-4 py-2 text-white rounded-lg transition"
                    style={{ backgroundColor: '#777C6D' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                  >
                    Import Template
                  </button>
                  <button
                    onClick={() => setShowManageCoverLetterTemplates(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {coverLetterLoading ? (
                <div className="text-center py-12">
                  <LoadingSpinner />
                </div>
              ) : coverLetterTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No templates available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(() => {
                    // Deduplicate default templates - keep only one per name
                    const defaultTemplateNames = [
                      'Formal Professional',
                      'Modern Professional',
                      'Creative Expression',
                      'Technical Professional',
                      'Executive Leadership',
                      'Technology Professional',
                      'Business Professional',
                      'Healthcare Professional'
                    ];
                    const seenNames = new Set();
                    const uniqueTemplates = coverLetterTemplates.filter(template => {
                      const isDefaultSystemTemplate = defaultTemplateNames.includes(template.name);

                      if (isDefaultSystemTemplate) {
                        if (seenNames.has(template.name)) {
                          return false; // Skip duplicate by name
                        }
                        seenNames.add(template.name);
                        return true;
                      }
                      return true; // Keep all custom templates
                    });

                    return uniqueTemplates.map((template) => {
                      // Check if this is a default system template
                      const isDefaultSystemTemplate = defaultTemplateNames.includes(template.name);

                      return (
                        <div
                          key={template._id}
                          className="border-2 border-gray-300 rounded-lg overflow-hidden hover:border-[#777C6D] transition"
                        >
                          <div className="bg-white p-4 h-64 overflow-hidden">
                            <div className="text-xs font-mono whitespace-pre-wrap text-gray-700 line-clamp-[14]">
                              {template.content}
                            </div>
                          </div>
                          <div className="border-t border-gray-200 p-4 bg-gray-50">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold truncate" style={{ color: "#4F5348" }}>
                                  {template.name}
                                </h3>
                                <p className="text-xs text-gray-600 mt-1">{template.description || template.style}</p>
                              </div>
                              {template.isDefault && (
                                <span className="ml-2 px-2 py-1 text-xs rounded" style={{ backgroundColor: "#E8EAE3", color: "#4F5348" }}>
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCoverLetterTemplate(template);
                                  setCustomCoverLetterName(`${template.name} - Copy`);
                                  setCustomCoverLetterContent(template.content);
                                  setIsCreatingCoverLetterTemplate(false);
                                  setShowManageCoverLetterTemplates(false);
                                  setShowCoverLetterCustomize(true);
                                }}
                                className={`${isDefaultSystemTemplate ? 'w-full' : 'flex-1'} px-3 py-2 text-sm text-white rounded transition`}
                                style={{ backgroundColor: '#777C6D' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                              >
                                Use Template
                              </button>
                              {!isDefaultSystemTemplate && (
                                <button
                                  onClick={async () => {
                                    if (confirm(`Delete "${template.name}"?`)) {
                                      try {
                                        await authWrap();
                                        await deleteCoverLetterTemplate(template._id);
                                        await loadCoverLetterTemplates();
                                        setShowManageCoverLetterTemplates(true);
                                        alert("Template deleted successfully!");
                                      } catch (err) {
                                        console.error("Delete failed:", err);
                                        alert("Failed to delete template");
                                      }
                                    }
                                  }}
                                  className="px-3 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded transition"
                                  title="Delete Template"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Template Analytics Modal */}
      {showCoverLetterAnalytics && coverLetterAnalytics && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowCoverLetterAnalytics(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                  Template Usage Analytics
                </h2>
                <button
                  onClick={() => setShowCoverLetterAnalytics(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Templates</p>
                      <p className="text-3xl font-bold text-blue-900">{coverLetterAnalytics.summary.totalTemplates}</p>
                    </div>
                    <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Usage</p>
                      <p className="text-3xl font-bold text-green-900">{coverLetterAnalytics.summary.totalUsage}</p>
                    </div>
                    <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Average Usage</p>
                      <p className="text-3xl font-bold text-purple-900">{coverLetterAnalytics.summary.avgUsage}</p>
                    </div>
                    <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Most Used Template */}
              {coverLetterAnalytics.mostUsedTemplate && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3" style={{ color: "#4F5348" }}>
                    Most Used Template
                  </h3>
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-yellow-900">{coverLetterAnalytics.mostUsedTemplate.name}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded capitalize">
                            {coverLetterAnalytics.mostUsedTemplate.industry}
                          </span>
                          <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded capitalize">
                            {coverLetterAnalytics.mostUsedTemplate.style}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-yellow-900">{coverLetterAnalytics.mostUsedTemplate.usageCount}</p>
                        <p className="text-sm text-yellow-700">times used</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top 5 Templates */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: "#4F5348" }}>
                  Top 5 Templates by Usage
                </h3>
                <div className="space-y-2">
                  {coverLetterAnalytics.topTemplates.map((template, index) => (
                    <div key={template.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{template.name}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded capitalize">
                              {template.industry}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded capitalize">
                              {template.style}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{template.usageCount}</p>
                        <p className="text-xs text-gray-600">uses</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage by Industry and Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* By Industry */}
                <div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: "#4F5348" }}>
                    Usage by Industry
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(coverLetterAnalytics.usageByIndustry).map(([industry, data]) => (
                      <div key={industry} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 capitalize">{industry}</span>
                          <span className="text-sm text-gray-600">{data.usage} uses</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(data.usage / coverLetterAnalytics.summary.totalUsage) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{data.count} templates</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Style */}
                <div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: "#4F5348" }}>
                    Usage by Style
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(coverLetterAnalytics.usageByStyle).map(([style, data]) => (
                      <div key={style} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 capitalize">{style}</span>
                          <span className="text-sm text-gray-600">{data.usage} uses</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${(data.usage / coverLetterAnalytics.summary.totalUsage) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{data.count} templates</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCoverLetterAnalytics(false)}
                  className="px-6 py-2 text-white rounded-lg transition"
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
      )}

      {/* Edit Cover Letter Modal */}
      {showEditCoverLetterModal && editingCoverLetter && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={() => setShowEditCoverLetterModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                  Edit Cover Letter
                </h2>
                <button
                  onClick={() => setShowEditCoverLetterModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter Name
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={customCoverLetterName}
                  onChange={(e) => setCustomCoverLetterName(e.target.value)}
                  placeholder="e.g., My Software Engineer Cover Letter"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter Style
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={customCoverLetterStyle}
                  onChange={(e) => setCustomCoverLetterStyle(e.target.value)}
                >
                  <option value="formal">Formal</option>
                  <option value="modern">Modern</option>
                  <option value="creative">Creative</option>
                  <option value="technical">Technical</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter Content
                </label>
                <textarea
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg font-sans text-sm"
                  value={customCoverLetterContent}
                  onChange={(e) => setCustomCoverLetterContent(e.target.value)}
                  placeholder="Edit your cover letter here..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEditCoverLetterModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
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
                      await apiUpdateCoverLetter(editingCoverLetter._id, {
                        name: customCoverLetterName,
                        content: customCoverLetterContent,
                        style: customCoverLetterStyle
                      });

                      setShowEditCoverLetterModal(false);
                      setEditingCoverLetter(null);
                      setCustomCoverLetterName('');
                      setCustomCoverLetterContent('');

                      await loadSavedCoverLetters();
                      alert("Cover letter updated successfully!");
                    } catch (err) {
                      console.error("Update failed:", err);
                      alert("Failed to update cover letter. Please try again.");
                    }
                  }}
                  className="px-6 py-2 text-white rounded-lg transition"
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
    </div>
  );
}


