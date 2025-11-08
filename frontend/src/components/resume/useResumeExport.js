/**
 * Custom hook for resume export functionality (UC-51)
 * Handles PDF, DOCX, HTML, and Text export with validation and watermark support
 */

import { useState } from 'react';
import { 
  exportResumePDF,
  exportResumeDOCX,
  exportResumeHTML,
  exportResumeText
} from '../../api/resumes';

export const useResumeExport = (authWrap, validationStatus) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsFilename, setSaveAsFilename] = useState('');
  const [pendingExportFormat, setPendingExportFormat] = useState(null);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);

  /**
   * Handle export with validation check
   */
  const handleExportWithValidation = async (resumeId, format, onSuccess, onError) => {
    const status = validationStatus[resumeId];
    
    if (!status || status.status !== 'valid') {
      onError?.('⚠️ Please validate your resume before exporting');
      return false;
    }
    
    await handleExport(format, resumeId, onSuccess, onError);
    return true;
  };

  /**
   * Main export handler
   */
  const handleExport = async (format, resumeId, onSuccess, onError) => {
    if (!resumeId) {
      onError?.('No resume selected for export');
      return;
    }

    setPendingExportFormat(format);
    setShowSaveAsModal(true);
    
    // Store resume ID and callbacks for use in confirmExport
    handleExport._pendingResumeId = resumeId;
    handleExport._onSuccess = onSuccess;
    handleExport._onError = onError;
  };

  /**
   * Confirm export with custom filename
   */
  const confirmExport = async () => {
    const format = pendingExportFormat;
    const resumeId = handleExport._pendingResumeId;
    const onSuccess = handleExport._onSuccess;
    const onError = handleExport._onError;
    
    if (!saveAsFilename.trim()) {
      onError?.('Please enter a filename');
      return;
    }

    setIsExporting(true);
    setShowSaveAsModal(false);

    try {
      await authWrap();
      let response;
      const watermarkOptions = watermarkEnabled ? { text: watermarkText } : undefined;

      switch (format) {
        case "pdf":
          response = await exportResumePDF(resumeId, watermarkOptions);
          downloadFile(response.data, `${saveAsFilename}.pdf`, "application/pdf");
          break;
        case "docx":
          response = await exportResumeDOCX(resumeId, watermarkOptions);
          downloadFile(
            response.data,
            `${saveAsFilename}.docx`,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          );
          break;
        case "html":
          response = await exportResumeHTML(resumeId);
          downloadFile(response.data, `${saveAsFilename}.html`, "text/html");
          break;
        case "txt":
          response = await exportResumeText(resumeId);
          downloadFile(response.data, `${saveAsFilename}.txt`, "text/plain");
          break;
        default:
          throw new Error("Invalid export format");
      }

      onSuccess?.(`Resume exported as ${format.toUpperCase()} successfully!`);
      
      // Reset states
      setSaveAsFilename('');
      setPendingExportFormat(null);
      setWatermarkEnabled(false);
      setWatermarkText('CONFIDENTIAL');
    } catch (err) {
      console.error("Export error:", err);
      onError?.(err.response?.data?.message || "Failed to export resume. Please try again.");
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  /**
   * Cancel export
   */
  const cancelExport = () => {
    setShowSaveAsModal(false);
    setSaveAsFilename('');
    setPendingExportFormat(null);
  };

  /**
   * Download file helper
   */
  const downloadFile = (data, filename, mimeType) => {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  /**
   * Print HTML version
   */
  const handlePrintHtml = async (resumeId, onSuccess, onError) => {
    if (!resumeId) {
      onError?.('No resume selected');
      return;
    }

    try {
      await authWrap();
      const response = await exportResumeHTML(resumeId);
      
      // Open HTML in new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(response.data);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
      
      onSuccess?.('Opening print preview...');
    } catch (err) {
      console.error("Print error:", err);
      onError?.(err.response?.data?.message || "Failed to prepare resume for printing.");
    }
  };

  /**
   * Toggle watermark modal
   */
  const toggleWatermarkModal = () => {
    setShowWatermarkModal(!showWatermarkModal);
  };

  /**
   * Save watermark settings
   */
  const saveWatermarkSettings = (enabled, text) => {
    setWatermarkEnabled(enabled);
    setWatermarkText(text);
    setShowWatermarkModal(false);
  };

  return {
    // State
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
    
    // Handlers
    handleExport,
    handleExportWithValidation,
    confirmExport,
    cancelExport,
    handlePrintHtml,
    toggleWatermarkModal,
    saveWatermarkSettings
  };
};
