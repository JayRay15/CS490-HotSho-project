import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import api, { setAuthToken } from "../api/axios";
import Card from "./Card";
import Container from "./Container";
import LoadingSpinner from "./LoadingSpinner";

export default function MaterialsAnalytics() {
  const { getToken } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.get("/api/materials/analytics");
      setAnalytics(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch materials analytics:", err);
      setError(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen={true} size="lg" text="Loading analytics..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#E4E6E0" }}>
        <Container level={1} className="pt-12 pb-12">
          <div className="max-w-7xl mx-auto">
            <Card variant="elevated" className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Analytics</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  const { resumes, coverLetters, summary } = analytics || {};

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E4E6E0" }}>
      <Container level={1} className="pt-12 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: "#4F5348" }}>
              Materials Analytics
            </h1>
            <p className="text-sm" style={{ color: "#656A5C" }}>
              Track which resume and cover letter versions lead to success
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card variant="elevated" className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Applications</p>
              <p className="text-3xl font-bold" style={{ color: "#777C6D" }}>
                {summary?.totalApplications || 0}
              </p>
            </Card>
            <Card variant="elevated" className="text-center">
              <p className="text-sm text-gray-600 mb-1">With Resume</p>
              <p className="text-3xl font-bold text-blue-600">
                {summary?.withResume || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary?.totalApplications > 0 
                  ? `${Math.round((summary.withResume / summary.totalApplications) * 100)}%`
                  : '0%'}
              </p>
            </Card>
            <Card variant="elevated" className="text-center">
              <p className="text-sm text-gray-600 mb-1">With Cover Letter</p>
              <p className="text-3xl font-bold text-purple-600">
                {summary?.withCoverLetter || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary?.totalApplications > 0 
                  ? `${Math.round((summary.withCoverLetter / summary.totalApplications) * 100)}%`
                  : '0%'}
              </p>
            </Card>
            <Card variant="elevated" className="text-center">
              <p className="text-sm text-gray-600 mb-1">With Both</p>
              <p className="text-3xl font-bold text-green-600">
                {summary?.withBoth || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary?.totalApplications > 0 
                  ? `${Math.round((summary.withBoth / summary.totalApplications) * 100)}%`
                  : '0%'}
              </p>
            </Card>
          </div>

          {/* Resume Analytics */}
          <Card title="Resume Performance" variant="primary" className="mb-6">
            {!resumes || resumes.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No resume usage data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Link resumes to job applications to see analytics here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {resumes.map((resume, index) => {
                  const successRate = resume.usageCount > 0 
                    ? ((resume.offerCount / resume.usageCount) * 100).toFixed(1)
                    : '0.0';
                  
                  return (
                    <div key={resume._id || index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {resume.name || 'Untitled Resume'}
                          </h3>
                          {resume.isDefault && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{successRate}%</p>
                          <p className="text-xs text-gray-500">Success Rate</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Times Used</p>
                          <p className="text-xl font-semibold text-gray-900">{resume.usageCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Offers</p>
                          <p className="text-xl font-semibold text-green-600">{resume.offerCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Rejections</p>
                          <p className="text-xl font-semibold text-red-600">{resume.rejectedCount || 0}</p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Performance</span>
                          <span>{resume.offerCount} / {resume.usageCount} applications</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all" 
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Cover Letter Analytics */}
          <Card title="Cover Letter Performance" variant="primary" className="mb-6">
            {!coverLetters || coverLetters.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No cover letter usage data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Link cover letters to job applications to see analytics here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {coverLetters.map((cl, index) => {
                  const successRate = cl.usageCount > 0 
                    ? ((cl.offerCount / cl.usageCount) * 100).toFixed(1)
                    : '0.0';
                  
                  return (
                    <div key={cl._id || index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {cl.name || 'Untitled Cover Letter'}
                          </h3>
                          {cl.isDefault && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">{successRate}%</p>
                          <p className="text-xs text-gray-500">Success Rate</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Times Used</p>
                          <p className="text-xl font-semibold text-gray-900">{cl.usageCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Offers</p>
                          <p className="text-xl font-semibold text-green-600">{cl.offerCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Rejections</p>
                          <p className="text-xl font-semibold text-red-600">{cl.rejectedCount || 0}</p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Performance</span>
                          <span>{cl.offerCount} / {cl.usageCount} applications</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-green-500 h-2 rounded-full transition-all" 
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Insights */}
          <Card title="Insights & Recommendations" variant="info">
            <div className="space-y-3 text-sm">
              {resumes && resumes.length > 0 && (
                <>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <p className="text-gray-700">
                      <strong>Top Resume:</strong>{' '}
                      "{resumes[0]?.name || 'Untitled'}" with {resumes[0]?.usageCount} applications and{' '}
                      {resumes[0]?.usageCount > 0 
                        ? `${((resumes[0]?.offerCount / resumes[0]?.usageCount) * 100).toFixed(1)}%`
                        : '0%'} success rate.
                    </p>
                  </div>
                </>
              )}
              
              {coverLetters && coverLetters.length > 0 && (
                <>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-purple-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <p className="text-gray-700">
                      <strong>Top Cover Letter:</strong>{' '}
                      "{coverLetters[0]?.name || 'Untitled'}" with {coverLetters[0]?.usageCount} applications and{' '}
                      {coverLetters[0]?.usageCount > 0 
                        ? `${((coverLetters[0]?.offerCount / coverLetters[0]?.usageCount) * 100).toFixed(1)}%`
                        : '0%'} success rate.
                    </p>
                  </div>
                </>
              )}
              
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700">
                  Applications with both resume and cover letter have been submitted {summary?.withBoth || 0} times.
                  Track your results to optimize your application materials.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
