import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Container from '../components/Container';
import ReportTemplatesGallery from '../components/ReportTemplatesGallery';
import ReportBuilder from '../components/ReportBuilder';
import ReportVisualization from '../components/ReportVisualization';
import ShareReportModal from '../components/ShareReportModal';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  createReportConfig,
  updateReportConfig,
  deleteReportConfig,
  generateReport,
  exportReportPDF,
  exportReportExcel,
  downloadFile,
  getUserSharedReports,
  revokeSharedReport,
} from '../api/reports';

/**
 * Reports Page - Main hub for custom reports feature
 * Handles report creation, viewing, exporting, and sharing
 */
export default function ReportsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState('gallery'); // 'gallery', 'builder', 'viewer'
  const [currentReport, setCurrentReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedReports, setSharedReports] = useState([]);
  const [pageError, setPageError] = useState(null);
  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);

  useEffect(() => {
    if (view === 'gallery') {
      fetchSharedReports();
    }
  }, [view]);

  const fetchSharedReports = async () => {
    try {
      const response = await getUserSharedReports();
      // Backend wraps data in response.data.data structure
      setSharedReports(response.data.data || response.data || []);
      setPageError(null);
    } catch (error) {
      console.error('Failed to fetch shared reports:', error);
      // Don't set page error for shared reports, they're optional
    }
  };

  const handleCreateNew = () => {
    setCurrentReport(null);
    setReportData(null);
    setView('builder');
  };

  const handleSelectTemplate = async (template) => {
    setCurrentReport(template);
    
    // Generate report immediately for templates
    try {
      setIsGenerating(true);
      const response = await generateReport({ configId: template._id });
      // Backend returns {data: {reportData, configId, configName}}
      const reportResult = response.data?.reportData || response.reportData || response.data;
      console.log('Template report generated:', {
        hasAiInsights: !!reportResult?.aiInsights,
        insightsCount: reportResult?.aiInsights?.length,
        configIncludesAI: template.includeAIInsights
      });
      setReportData(reportResult);
      setView('viewer');
      toast.success('Report generated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveReport = async (config) => {
    try {
      let response;
      if (currentReport && currentReport._id) {
        // Update existing report
        response = await updateReportConfig(currentReport._id, config);
        toast.success('Report updated successfully!');
      } else {
        // Create new report
        response = await createReportConfig(config);
        toast.success('Report created successfully!');
      }
      
      // Extract saved config from response - backend returns {data: {reportConfig: {...}}}
      const savedConfig = response.data?.reportConfig || response.reportConfig || response.data || response;
      
      if (!savedConfig || !savedConfig._id) {
        throw new Error('Invalid response: missing report configuration ID');
      }
      
      setCurrentReport(savedConfig);
      
      // Generate the report
      setIsGenerating(true);
      const reportResponse = await generateReport({ configId: savedConfig._id });
      // Backend returns {data: {reportData, configId, configName}}
      const reportResult = reportResponse.data?.reportData || reportResponse.reportData || reportResponse.data;
      console.log('Generated report data:', reportResult);
      setReportData(reportResult);
      setView('viewer');
      
      // Refresh gallery to show newly saved report
      setGalleryRefreshKey(prev => prev + 1);
    } catch (error) {
      throw error; // Let ReportBuilder handle the error
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!currentReport || !reportData) {
      toast.error('No report to export');
      return;
    }

    try {
      setIsExporting(true);
      const blob = await exportReportPDF(currentReport._id, reportData);
      const filename = `${currentReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadFile(blob, filename);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!currentReport || !reportData) {
      toast.error('No report to export');
      return;
    }

    try {
      setIsExporting(true);
      const blob = await exportReportExcel(currentReport._id, reportData);
      const filename = `${currentReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadFile(blob, filename);
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareReport = () => {
    if (!currentReport) {
      toast.error('No report to share');
      return;
    }
    setShowShareModal(true);
  };

  const handleShareSuccess = (shareData) => {
    toast.success('Share link created successfully!');
    fetchSharedReports();
  };

  const handleRevokeShare = async (sharedReportId) => {
    if (!confirm('Are you sure you want to revoke access to this shared report?')) {
      return;
    }

    try {
      await revokeSharedReport(sharedReportId);
      toast.success('Share access revoked');
      fetchSharedReports();
    } catch (error) {
      toast.error(error.message || 'Failed to revoke share');
    }
  };

  const handleBackToGallery = () => {
    setView('gallery');
    setCurrentReport(null);
    setReportData(null);
  };

  const handleEditReport = () => {
    setView('builder');
  };

  const handleDeleteReport = async () => {
    if (!currentReport || !currentReport._id) {
      toast.error('No report to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${currentReport.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteReportConfig(currentReport._id);
      toast.success('Report deleted successfully');
      setGalleryRefreshKey(prev => prev + 1);
      handleBackToGallery();
    } catch (error) {
      toast.error(error.message || 'Failed to delete report');
    }
  };

  return (
    <Container>
      <div className="py-8">
        {/* Page Error */}
        {pageError && (
          <Card variant="elevated" className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{pageError}</p>
                    <p className="mt-2">Please ensure:</p>
                    <ul className="list-disc pl-5 mt-1">
                      <li>The backend server is running on port 5000</li>
                      <li>MongoDB is connected</li>
                      <li>You have a stable internet connection</li>
                    </ul>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Gallery View */}
        {view === 'gallery' && (
          <div className="space-y-8">
            <ReportTemplatesGallery
              key={galleryRefreshKey}
              onSelectTemplate={handleSelectTemplate}
              onCreateNew={handleCreateNew}
            />

            {/* Shared Reports Section */}
            {sharedReports.length > 0 && (
              <Card title="📤 Your Shared Reports">
                <div className="space-y-3">
                  {sharedReports.map((shared) => (
                    <div
                      key={shared._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {shared.reportConfigId?.name || 'Unnamed Report'}
                        </h4>
                        <div className="text-sm text-gray-600 mt-1">
                          <span>Views: {shared.viewCount || 0}</span>
                          {shared.expirationDate && (
                            <span className="ml-4">
                              Expires: {new Date(shared.expirationDate).toLocaleDateString()}
                            </span>
                          )}
                          {shared.password && (
                            <span className="ml-4 text-yellow-600">🔒 Password Protected</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => {
                            const shareUrl = `${window.location.origin}/reports/shared/${shared.uniqueToken}`;
                            navigator.clipboard.writeText(shareUrl);
                            toast.success('Link copied to clipboard!');
                          }}
                        >
                          Copy Link
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleRevokeShare(shared._id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Builder View */}
        {view === 'builder' && (
          <div>
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={handleBackToGallery}
              >
                ← Back to Gallery
              </Button>
            </div>
            <ReportBuilder
              initialConfig={currentReport}
              onSave={handleSaveReport}
              onCancel={handleBackToGallery}
            />
          </div>
        )}

        {/* Viewer View */}
        {view === 'viewer' && (
          <div>
            {/* Header with Actions */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={handleBackToGallery}
                >
                  ← Back to Gallery
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentReport?.name || 'Report'}
                  </h1>
                  {currentReport?.description && (
                    <p className="text-gray-600 text-sm mt-1">
                      {currentReport.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!currentReport?.isTemplate && (
                  <>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={handleEditReport}
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={handleDeleteReport}
                    >
                      🗑️ Delete
                    </Button>
                  </>
                )}
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleExportPDF}
                  isLoading={isExporting}
                >
                  📄 Export PDF
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleExportExcel}
                  isLoading={isExporting}
                >
                  📊 Export Excel
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleShareReport}
                >
                  🔗 Share
                </Button>
              </div>
            </div>

            {/* Report Content */}
            {isGenerating ? (
              <Card>
                <div className="flex flex-col items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-600 mt-4">Generating your report...</p>
                </div>
              </Card>
            ) : (
              <ReportVisualization
                reportData={reportData}
                config={currentReport}
              />
            )}
          </div>
        )}

        {/* Share Modal */}
        <ShareReportModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          reportId={currentReport?._id}
          reportName={currentReport?.name}
          reportData={reportData}
          onShareSuccess={handleShareSuccess}
        />
      </div>
    </Container>
  );
}
