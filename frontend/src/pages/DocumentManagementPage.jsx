import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Container from '../components/Container';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { setAuthToken } from '../api/axios';
import { fetchResumes } from '../api/resumes';
import { fetchCoverLetters } from '../api/coverLetters';
import api from '../api/axios';

/**
 * Document Management Page
 * Unified view for all application materials: resumes, cover letters, and certificates
 * Provides quick access to version control, linking, and export features
 */
export default function DocumentManagementPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumes');
  
  // Document counts and summaries
  const [resumeSummary, setResumeSummary] = useState({ total: 0, default: null, recent: [] });
  const [coverLetterSummary, setCoverLetterSummary] = useState({ total: 0, recent: [] });
  const [certificateSummary, setCertificateSummary] = useState({ total: 0, recent: [] });
  const [linkedJobs, setLinkedJobs] = useState([]);

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

      // Fetch cover letters
      const clRes = await fetchCoverLetters();
      const coverLetters = clRes.data?.data?.coverLetters || clRes.data?.coverLetters || [];
      setCoverLetterSummary({
        total: coverLetters.length,
        recent: coverLetters.slice(0, 3),
        archived: coverLetters.filter(cl => cl.isArchived).length
      });

      // Fetch jobs with linked documents
      try {
        const jobsRes = await api.get('/api/jobs');
        const jobs = jobsRes.data?.data?.jobs || jobsRes.data?.jobs || [];
        const jobsWithDocs = jobs.filter(j => j.resumeId || j.coverLetterId).slice(0, 5);
        setLinkedJobs(jobsWithDocs);
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

  const tabs = [
    { id: 'resumes', label: '📄 Resumes', count: resumeSummary.total },
    { id: 'coverLetters', label: '✉️ Cover Letters', count: coverLetterSummary.total },
    { id: 'certificates', label: '🏆 Certificates', count: certificateSummary.total },
    { id: 'linked', label: '🔗 Linked to Jobs', count: linkedJobs.length }
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
            <div className="text-3xl font-bold text-orange-600">{linkedJobs.length}</div>
            <div className="text-sm text-gray-600">Linked Applications</div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
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

        {activeTab === 'linked' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Documents Linked to Jobs</h2>
              <Button variant="outline" onClick={() => navigate('/jobs')}>
                📋 View All Jobs
              </Button>
            </div>

            <Card title="Material Linking">
              {linkedJobs.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {linkedJobs.map(job => (
                    <div key={job._id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{job.title}</h4>
                          <p className="text-sm text-gray-500">{job.company}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          job.status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                          job.status === 'Interview' ? 'bg-green-100 text-green-700' :
                          job.status === 'Offer' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {job.resumeId && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                            📄 Resume linked
                          </span>
                        )}
                        {job.coverLetterId && (
                          <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">
                            ✉️ Cover letter linked
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No documents linked to job applications yet. Link resumes and cover letters when applying!
                </p>
              )}
            </Card>
          </div>
        )}
      </div>
    </Container>
  );
}
