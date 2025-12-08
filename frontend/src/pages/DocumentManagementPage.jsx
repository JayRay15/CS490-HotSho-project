import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Container from '../components/Container';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { setAuthToken } from '../api/axios';
import { fetchResumes } from '../api/resumes';
import { fetchCoverLetters } from '../api/coverLetters';
import { addAdditionalDocument, removeAdditionalDocument } from '../api/jobs';
import api from '../api/axios';

/**
 * Document Management Page
 * Unified view for all application materials: resumes, cover letters, and certificates
 * Provides quick access to version control, linking, and export features
 */

// Utility function to format plain text into HTML paragraphs (matches ResumeTemplates.jsx)
const formatCoverLetterContent = (content) => {
  if (!content) return '';
  if (content.includes('<p>') || content.includes('<div>') || content.includes('<br')) {
    return content;
  }
  // Split by double newlines (paragraphs) or single newlines (line breaks)
  const paragraphs = content.split(/\n\n+/);
  return paragraphs.map(para => {
    // Replace single newlines with <br> within paragraphs
    const withBreaks = para.replace(/\n/g, '<br>');
    return `<p style="margin-bottom: 1em;">${withBreaks}</p>`;
  }).join('');
};

export default function DocumentManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);

  // Get initial tab from query parameter
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return ['resumes', 'covers', 'packages'].includes(tab) ? tab : 'resumes';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Document counts and summaries
  const [resumeSummary, setResumeSummary] = useState({ total: 0, default: null, recent: [] });
  const [coverLetterSummary, setCoverLetterSummary] = useState({ total: 0, recent: [] });
  const [certificateSummary, setCertificateSummary] = useState({ total: 0, recent: [] });
  const [jobPackages, setJobPackages] = useState([]);

  // For Job Packages - document lookup maps
  const [allResumes, setAllResumes] = useState([]);
  const [allCoverLetters, setAllCoverLetters] = useState([]);
  const [expandedJobIds, setExpandedJobIds] = useState(new Set());

  // Add document modal
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [addDocJobId, setAddDocJobId] = useState(null);
  const [newDocForm, setNewDocForm] = useState({ name: '', documentType: 'other', notes: '' });
  const [addingDoc, setAddingDoc] = useState(false);

  // View modals
  const [viewingResume, setViewingResume] = useState(null);
  const [viewingCoverLetter, setViewingCoverLetter] = useState(null);

  useEffect(() => {
    loadDocumentSummaries();
  }, []);

  const authWrap = async () => {
    const token = await getToken();
    setAuthToken(token);
  };

  const loadDocumentSummaries = async () => {
    try {
      setLoading(true);
      await authWrap();

      // Fetch resumes
      const resumeRes = await fetchResumes();
      const resumes = resumeRes.data?.data?.resumes || resumeRes.data?.resumes || [];
      const defaultResume = resumes.find(r => r.isDefault);
      setResumeSummary({
        total: resumes.length,
        default: defaultResume,
        recent: resumes.slice(0, 3),
        archived: resumes.filter(r => r.isArchived).length
      });
      setAllResumes(resumes);

      // Fetch cover letters
      const clRes = await fetchCoverLetters();
      const coverLetters = clRes.data?.data?.coverLetters || clRes.data?.coverLetters || [];
      setCoverLetterSummary({
        total: coverLetters.length,
        recent: coverLetters.slice(0, 3),
        archived: coverLetters.filter(cl => cl.isArchived).length
      });
      setAllCoverLetters(coverLetters);

      // Fetch jobs with linked documents
      try {
        const jobsRes = await api.get('/api/jobs');
        const jobs = jobsRes.data?.data?.jobs || jobsRes.data?.jobs || [];
        const jobsWithDocs = jobs.filter(j => j.linkedResumeId || j.linkedCoverLetterId || (j.linkedAdditionalDocuments && j.linkedAdditionalDocuments.length > 0));
        setJobPackages(jobsWithDocs);
      } catch (err) {
        console.log('Could not fetch jobs:', err);
      }

      // Fetch certifications from user profile
      try {
        const profileRes = await api.get('/api/users/me');
        const profileData = profileRes.data?.data || profileRes.data || {};
        const certifications = Array.isArray(profileData.certifications) ? profileData.certifications : [];
        setCertificateSummary({
          total: certifications.length,
          recent: certifications.slice(0, 5),
          all: certifications
        });
      } catch (err) {
        console.log('Could not fetch certifications:', err);
        setCertificateSummary({
          total: 0,
          recent: [],
          all: []
        });
      }

    } catch (error) {
      console.error('Error loading document summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle job package expansion
  const toggleJobExpansion = (jobId) => {
    setExpandedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  // Get resume name by ID
  const getResumeName = (resumeId) => {
    const resume = allResumes.find(r => r._id === resumeId);
    return resume?.name || 'Unknown Resume';
  };

  // Get cover letter name by ID
  const getCoverLetterName = (coverLetterId) => {
    const cl = allCoverLetters.find(c => c._id === coverLetterId);
    return cl?.name || 'Unknown Cover Letter';
  };

  // Get resume by ID
  const getResumeById = (resumeId) => allResumes.find(r => r._id === resumeId);

  // Get cover letter by ID
  const getCoverLetterById = (coverLetterId) => allCoverLetters.find(c => c._id === coverLetterId);

  // Handle opening add document modal
  const openAddDocModal = (jobId) => {
    setAddDocJobId(jobId);
    setNewDocForm({ name: '', documentType: 'other', notes: '' });
    setShowAddDocModal(true);
  };

  // Handle adding additional document
  const handleAddDocument = async () => {
    if (!newDocForm.name.trim() || !addDocJobId) return;
    try {
      setAddingDoc(true);
      await authWrap();
      await addAdditionalDocument(addDocJobId, newDocForm);
      setShowAddDocModal(false);
      setAddDocJobId(null);
      setNewDocForm({ name: '', documentType: 'other', notes: '' });
      // Reload job packages
      const jobsRes = await api.get('/api/jobs');
      const jobs = jobsRes.data?.data?.jobs || jobsRes.data?.jobs || [];
      const jobsWithDocs = jobs.filter(j => j.linkedResumeId || j.linkedCoverLetterId || (j.linkedAdditionalDocuments && j.linkedAdditionalDocuments.length > 0));
      setJobPackages(jobsWithDocs);
    } catch (err) {
      console.error('Error adding document:', err);
    } finally {
      setAddingDoc(false);
    }
  };

  // Handle removing additional document
  const handleRemoveDocument = async (jobId, docIndex) => {
    try {
      await authWrap();
      await removeAdditionalDocument(jobId, docIndex);
      // Reload job packages
      const jobsRes = await api.get('/api/jobs');
      const jobs = jobsRes.data?.data?.jobs || jobsRes.data?.jobs || [];
      const jobsWithDocs = jobs.filter(j => j.linkedResumeId || j.linkedCoverLetterId || (j.linkedAdditionalDocuments && j.linkedAdditionalDocuments.length > 0));
      setJobPackages(jobsWithDocs);
    } catch (err) {
      console.error('Error removing document:', err);
    }
  };

  const tabs = [
    { id: 'resumes', label: '📄 Resumes', count: resumeSummary.total },
    { id: 'coverLetters', label: '✉️ Cover Letters', count: coverLetterSummary.total },
    { id: 'certificates', label: '🏆 Certificates', count: certificateSummary.total },
    { id: 'packages', label: '📦 Job Packages', count: jobPackages.length }
  ];

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📁 Document Management</h1>
          <p className="text-gray-600">
            Organize all your application materials in one place. Manage versions, link to jobs, and export reports.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4">
            <div className="text-3xl font-bold text-blue-600">{resumeSummary.total}</div>
            <div className="text-sm text-gray-600">Resumes</div>
            {resumeSummary.archived > 0 && (
              <div className="text-xs text-gray-400 mt-1">{resumeSummary.archived} archived</div>
            )}
          </Card>
          <Card className="text-center p-4">
            <div className="text-3xl font-bold text-green-600">{coverLetterSummary.total}</div>
            <div className="text-sm text-gray-600">Cover Letters</div>
            {coverLetterSummary.archived > 0 && (
              <div className="text-xs text-gray-400 mt-1">{coverLetterSummary.archived} archived</div>
            )}
          </Card>
          <Card className="text-center p-4">
            <div className="text-3xl font-bold text-purple-600">{certificateSummary.total}</div>
            <div className="text-sm text-gray-600">Certificates</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-3xl font-bold text-orange-600">{jobPackages.length}</div>
            <div className="text-sm text-gray-600">Job Packages</div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'resumes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Resume Management</h2>
              <Button variant="primary" onClick={() => navigate('/resumes')}>
                📄 Open Resume Manager
              </Button>
            </div>

            {/* Default Resume Highlight */}
            {resumeSummary.default && (
              <Card variant="elevated" className="border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium">{resumeSummary.default.name}</span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Default</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Last updated: {new Date(resumeSummary.default.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="small" onClick={() => navigate('/resumes')}>
                    View
                  </Button>
                </div>
              </Card>
            )}

            {/* Recent Resumes */}
            <Card title="Recent Resumes">
              {resumeSummary.recent.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {resumeSummary.recent.map(resume => (
                    <div key={resume._id} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium">{resume.name}</span>
                        {resume.isDefault && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Default</span>
                        )}
                        {resume.isArchived && (
                          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Archived</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(resume.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No resumes yet. Create your first resume!</p>
              )}
              <div className="mt-4 pt-4 border-t">
                <Button variant="ghost" onClick={() => navigate('/resumes')} className="w-full">
                  View All Resumes →
                </Button>
              </div>
            </Card>

            {/* Version Control Info */}
            <Card title="📊 Version Control Features">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">📋</div>
                  <h4 className="font-medium">Clone & Duplicate</h4>
                  <p className="text-sm text-gray-600">Create copies to customize for different applications</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">🔄</div>
                  <h4 className="font-medium">Compare Versions</h4>
                  <p className="text-sm text-gray-600">Side-by-side comparison of different resume versions</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">📦</div>
                  <h4 className="font-medium">Archive & Restore</h4>
                  <p className="text-sm text-gray-600">Keep old versions without cluttering your workspace</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'coverLetters' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Cover Letter Management</h2>
              <Button variant="primary" onClick={() => navigate('/resumes')}>
                ✉️ Open Cover Letter Manager
              </Button>
            </div>

            {/* Recent Cover Letters */}
            <Card title="Recent Cover Letters">
              {coverLetterSummary.recent.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {coverLetterSummary.recent.map(cl => (
                    <div key={cl._id} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium">{cl.name || 'Untitled Cover Letter'}</span>
                        {cl.jobTitle && (
                          <span className="ml-2 text-sm text-gray-500">for {cl.jobTitle}</span>
                        )}
                        {cl.isArchived && (
                          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Archived</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(cl.updatedAt || cl.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No cover letters yet. Create your first cover letter!</p>
              )}
              <div className="mt-4 pt-4 border-t">
                <Button variant="ghost" onClick={() => navigate('/resumes')} className="w-full">
                  View All Cover Letters →
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Certificate Management</h2>
              <Button variant="primary" onClick={() => navigate('/profile')}>
                🏆 Manage in Profile
              </Button>
            </div>

            {/* Certificates List */}
            <Card title="Your Certifications">
              {certificateSummary.recent && certificateSummary.recent.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {certificateSummary.recent.map((cert, index) => (
                    <div key={cert._id || index} className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🏆</span>
                            <h4 className="font-medium text-gray-900">{cert.name || cert.title || 'Certification'}</h4>
                          </div>
                          {cert.issuer && (
                            <p className="text-sm text-gray-600 mt-1 ml-8">Issued by: {cert.issuer}</p>
                          )}
                          {cert.issueDate && (
                            <p className="text-sm text-gray-500 mt-1 ml-8">
                              Issued: {new Date(cert.issueDate).toLocaleDateString()}
                              {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                            </p>
                          )}
                          {cert.credentialId && (
                            <p className="text-xs text-gray-400 mt-1 ml-8">Credential ID: {cert.credentialId}</p>
                          )}
                        </div>
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🏆</div>
                  <p className="text-gray-500 mb-4">No certifications added yet.</p>
                  <p className="text-sm text-gray-400">Add certifications in your Profile to showcase your credentials.</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <Button variant="ghost" onClick={() => navigate('/profile')} className="w-full">
                  Add or Edit Certifications in Profile →
                </Button>
              </div>
            </Card>

            {/* Certificate Types Info */}
            <Card title="📊 Certification Categories">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">📜 Professional Certifications</h4>
                  <p className="text-sm text-blue-600">AWS, Google Cloud, Microsoft, etc.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">🎓 Academic Credentials</h4>
                  <p className="text-sm text-green-600">Degrees, diplomas, academic certificates</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800">⭐ Industry Awards</h4>
                  <p className="text-sm text-purple-600">Professional awards & recognitions</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Job Packages</h2>
              <Button variant="outline" onClick={() => navigate('/jobs')}>
                📋 View All Jobs
              </Button>
            </div>

            <Card title="Application Packages">
              {jobPackages.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {jobPackages.map(job => {
                    const isExpanded = expandedJobIds.has(job._id);
                    const docCount = (job.linkedResumeId ? 1 : 0) +
                      (job.linkedCoverLetterId ? 1 : 0) +
                      (job.linkedAdditionalDocuments?.length || 0);

                    return (
                      <div key={job._id} className="py-3">
                        {/* Clickable header */}
                        <div
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg -m-2"
                          onClick={() => toggleJobExpansion(job._id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                              ▶
                            </span>
                            <div>
                              <h4 className="font-medium">{job.title}</h4>
                              <p className="text-sm text-gray-500">{job.company}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{docCount} document{docCount !== 1 ? 's' : ''}</span>
                            <span className={`text-xs px-2 py-1 rounded ${job.status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                              job.status === 'Interview' ? 'bg-green-100 text-green-700' :
                                job.status === 'Offer' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                              }`}>
                              {job.status}
                            </span>
                          </div>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="mt-3 ml-8 space-y-2">
                            {/* Linked Resume */}
                            {job.linkedResumeId && (
                              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span>📄</span>
                                  <span className="text-sm font-medium text-blue-800">{getResumeName(job.linkedResumeId)}</span>
                                </div>
                                <button
                                  onClick={() => setViewingResume(getResumeById(job.linkedResumeId))}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  View
                                </button>
                              </div>
                            )}

                            {/* Linked Cover Letter */}
                            {job.linkedCoverLetterId && (
                              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span>✉️</span>
                                  <span className="text-sm font-medium text-green-800">{getCoverLetterName(job.linkedCoverLetterId)}</span>
                                </div>
                                <button
                                  onClick={() => setViewingCoverLetter(getCoverLetterById(job.linkedCoverLetterId))}
                                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                >
                                  View
                                </button>
                              </div>
                            )}

                            {/* Additional Documents */}
                            {job.linkedAdditionalDocuments?.map((doc, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span>📎</span>
                                  <div>
                                    <span className="text-sm font-medium text-orange-800">{doc.name}</span>
                                    <span className="text-xs text-orange-600 ml-2">({doc.documentType})</span>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Manage Documents Button */}
                            <button
                              onClick={() => navigate(`/jobs/${job._id}/materials?from=documents`)}
                              className="w-full p-2 mt-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2"
                            >
                              <span>📁</span> Manage Documents
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No job packages yet. Link resumes and cover letters to job applications to see them here.
                </p>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* View Resume Modal - Matches ResumeTemplates.jsx View Resume Modal */}
      {viewingResume && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 print:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setViewingResume(null)}
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
              <button
                onClick={() => setViewingResume(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto py-4 px-4" style={{ backgroundColor: '#525252' }}>
              {/* Resume Paper */}
              <div
                className="mx-auto bg-white shadow-lg"
                style={{
                  width: '8.5in',
                  minHeight: '11in',
                  padding: '0.75in',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {/* Contact Info / Header */}
                {viewingResume.sections?.contactInfo && (
                  <div className="text-center mb-6">
                    <h1
                      className="font-bold"
                      style={{ fontSize: '36px', color: '#4F5348' }}
                    >
                      {viewingResume.sections.contactInfo.name}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      {[
                        viewingResume.sections.contactInfo.email,
                        viewingResume.sections.contactInfo.phone,
                        viewingResume.sections.contactInfo.location
                      ].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                )}

                {/* Summary */}
                {viewingResume.sections?.summary && (
                  <div className="mb-6">
                    <h2
                      className="font-semibold border-b-2 pb-1 mb-3"
                      style={{ fontSize: '18px', color: '#4F5348', borderColor: '#4F5348' }}
                    >
                      PROFESSIONAL SUMMARY
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: '#222' }}>
                      {viewingResume.sections.summary}
                    </p>
                  </div>
                )}

                {/* Experience */}
                {viewingResume.sections?.experience && viewingResume.sections.experience.length > 0 && (
                  <div className="mb-6">
                    <h2
                      className="font-semibold border-b-2 pb-1 mb-3"
                      style={{ fontSize: '18px', color: '#4F5348', borderColor: '#4F5348' }}
                    >
                      EXPERIENCE
                    </h2>
                    {viewingResume.sections.experience.map((exp, idx) => (
                      <div key={idx} className="mb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold" style={{ fontSize: '16px', color: '#222' }}>
                              {exp.title}
                            </p>
                            <p className="text-sm text-gray-600 italic">{exp.company}</p>
                          </div>
                          <p className="text-xs text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
                        </div>
                        {exp.description && (
                          <p className="mt-2 text-sm whitespace-pre-line" style={{ color: '#666' }}>
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Education */}
                {viewingResume.sections?.education && viewingResume.sections.education.length > 0 && (
                  <div className="mb-6">
                    <h2
                      className="font-semibold border-b-2 pb-1 mb-3"
                      style={{ fontSize: '18px', color: '#4F5348', borderColor: '#4F5348' }}
                    >
                      EDUCATION
                    </h2>
                    {viewingResume.sections.education.map((edu, idx) => (
                      <div key={idx} className="mb-3">
                        <p className="font-semibold" style={{ color: '#222' }}>
                          {edu.degree}
                        </p>
                        <p className="text-sm text-gray-600">{edu.school}</p>
                        {edu.graduationDate && <p className="text-xs text-gray-500">{edu.graduationDate}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {viewingResume.sections?.skills && viewingResume.sections.skills.length > 0 && (
                  <div className="mb-6">
                    <h2
                      className="font-semibold border-b-2 pb-1 mb-3"
                      style={{ fontSize: '18px', color: '#4F5348', borderColor: '#4F5348' }}
                    >
                      SKILLS
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {viewingResume.sections.skills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          {typeof skill === 'string' ? skill : skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Cover Letter Modal - Matches ResumeTemplates.jsx style */}
      {viewingCoverLetter && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 print:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setViewingCoverLetter(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full mx-4 border border-gray-200 overflow-hidden flex flex-col"
            style={{ maxWidth: '960px', height: '95vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-heading font-semibold text-gray-900">{viewingCoverLetter.name || 'Cover Letter'}</h3>
              </div>
              <button
                onClick={() => setViewingCoverLetter(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto py-4 px-4" style={{ backgroundColor: '#525252' }}>
              {/* Cover Letter Paper */}
              <div
                className="mx-auto bg-white shadow-lg"
                style={{
                  width: '8.5in',
                  minHeight: '11in',
                  padding: '1in',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {viewingCoverLetter.jobTitle && (
                  <p className="text-sm text-gray-600 mb-2">For: <span className="font-medium">{viewingCoverLetter.jobTitle}</span></p>
                )}
                {viewingCoverLetter.company && (
                  <p className="text-sm text-gray-600 mb-6">Company: <span className="font-medium">{viewingCoverLetter.company}</span></p>
                )}
                <div
                  className="prose max-w-none cover-letter-content"
                  dangerouslySetInnerHTML={{ __html: formatCoverLetterContent(viewingCoverLetter.content) }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
