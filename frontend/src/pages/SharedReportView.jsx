import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Container from '../components/Container';
import ReportVisualization from '../components/ReportVisualization';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { viewSharedReport } from '../api/reports';

/**
 * SharedReportView Page
 * Public page for viewing shared reports via token
 * No authentication required
 */
export default function SharedReportView() {
  const { token } = useParams();
  const [reportData, setReportData] = useState(null);
  const [reportConfig, setReportConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchSharedReport();
    }
  }, [token]);

  const fetchSharedReport = async (pwd = null) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await viewSharedReport(token, pwd);
      
      // Backend wraps data in response.data.data structure
      const sharedData = response.data.data || response.data;
      
      setReportData(sharedData.reportSnapshot);
      setReportConfig(sharedData.config);
      setRequiresPassword(false);
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.message?.includes('password')) {
        setRequiresPassword(true);
        setError(null);
      } else if (err.response?.status === 403) {
        setError('This report link has expired or been revoked.');
      } else if (err.response?.status === 404) {
        setError('Report not found. The link may be invalid.');
      } else {
        setError(err.message || 'Failed to load shared report');
      }
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter a password');
      return;
    }
    setIsSubmitting(true);
    await fetchSharedReport(password);
  };

  if (isLoading && !requiresPassword) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Loading shared report...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (requiresPassword) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-screen">
          <Card className="max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Password Protected Report
              </h2>
              <p className="text-gray-600">
                This report requires a password to view
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
              </div>

              {error && <ErrorMessage message={error} />}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isSubmitting}
              >
                View Report
              </Button>
            </form>
          </Card>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-screen">
          <Card className="max-w-md w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Unable to Load Report
            </h2>
            <ErrorMessage message={error} />
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => window.location.href = '/'}
              >
                Go to Home
              </Button>
            </div>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {reportConfig?.name || 'Shared Report'}
              </h1>
              {reportConfig?.description && (
                <p className="text-gray-600 text-sm mt-1">
                  {reportConfig.description}
                </p>
              )}
            </div>
            <div className="text-sm text-gray-500">
              📅 {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Share Message */}
          {reportData?.shareMessage && (
            <Card variant="info" className="mt-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Message from sender</h3>
                  <p className="mt-1 text-sm text-gray-600">{reportData.shareMessage}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Report Visualization */}
        <ReportVisualization
          reportData={reportData}
          config={reportConfig}
        />

        {/* Footer Info */}
        <Card variant="muted" className="mt-8">
          <div className="text-center text-sm text-gray-600">
            <p>This is a read-only view of a shared report.</p>
            <p className="mt-1">
              Powered by HotSho Custom Reports
            </p>
          </div>
        </Card>
      </div>
    </Container>
  );
}
