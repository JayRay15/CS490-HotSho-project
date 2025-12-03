import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function CompanyResearch() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [research, setResearch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (interviewId) {
      fetchResearch();
    }
  }, [interviewId]);

  const fetchResearch = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await window.Clerk.session.getToken();
      const response = await fetch(`${API_BASE_URL}/api/company-research/interview/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResearch(data.data.research);
        setLoading(false);
      } else if (response.status === 404) {
        // No research found, auto-generate it
        console.log('No research found, auto-generating...');
        await handleGenerate();
      } else {
        throw new Error('Failed to fetch company research');
      }
    } catch (err) {
      console.error('Error fetching research:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setLoading(true);
      setError('');
      
      const token = await window.Clerk.session.getToken();
      
      // First get the interview to find the job details
      const interviewResponse = await fetch(`${API_BASE_URL}/api/interviews/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!interviewResponse.ok) {
        throw new Error('Failed to fetch interview details');
      }

      const interviewData = await interviewResponse.json();
      const interview = interviewData.data?.interview;

      if (!interview || !interview.jobId) {
        throw new Error('Interview data is incomplete');
      }

      // jobId can be either an object (populated) or a string (just the ID)
      const jobId = typeof interview.jobId === 'object' ? interview.jobId._id : interview.jobId;
      const companyName = typeof interview.jobId === 'object' ? interview.jobId.company : interview.company;

      console.log('Generating comprehensive company research for:', companyName);
      
      const response = await fetch(`${API_BASE_URL}/api/company-research/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: jobId,
          interviewId: interviewId,
          companyName: companyName || 'Unknown Company',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate research');
      }

      const data = await response.json();
      console.log('Company research generated successfully:', data.data.research);
      setResearch(data.data.research);
      setError('');
    } catch (err) {
      console.error('Error generating research:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const token = await window.Clerk.session.getToken();
      const response = await fetch(`${API_BASE_URL}/api/company-research/${research._id}/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        throw new Error('Failed to export research');
      }

      const data = await response.json();
      
      if (format === 'markdown') {
        // Download as markdown file
        const blob = new Blob([data.data.exportData], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${research.companyName}-research.md`;
        a.click();
      } else if (format === 'json') {
        // Download as JSON file
        const blob = new Blob([JSON.stringify(data.data.exportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${research.companyName}-research.json`;
        a.click();
      }
    } catch (err) {
      console.error('Error exporting research:', err);
      setError(err.message);
    }
  };

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {generating ? 'Generating company research...' : 'Loading company research...'}
          </p>
        </div>
      </div>
    );
  }

  if (!research) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing company research...</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                ← Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'leadership', label: 'Leadership' },
    { id: 'competitive', label: 'Competitive Analysis' },
    { id: 'news', label: 'Recent News' },
    { id: 'talking-points', label: 'Talking Points' },
    { id: 'questions', label: 'Questions to Ask' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="text-blue-600 hover:text-blue-700 mb-2 inline-flex items-center"
              >
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{research.companyName}</h1>
              <p className="text-gray-600 mt-1">Company Research Report</p>
              <div className="mt-4 flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Generated: {new Date(research.generatedAt).toLocaleDateString()}
                </span>
                <span className="text-sm text-gray-500">
                  Completeness: {research.completeness}%
                </span>
              </div>
              <div className="mt-2">
                <div className="w-64 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${research.completeness}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => handleExport('markdown')}
              >
                📄 Export as Markdown
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
              >
                📋 Export as JSON
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? '🔄 Refreshing...' : '🔄 Refresh Research'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Company Overview</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">{research.profile?.overview}</p>
                </div>
                {research.profile?.history && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      📜 Company History
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{research.profile.history}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      🎯 Mission
                    </h4>
                    <p className="text-gray-700">{research.profile?.mission || 'N/A'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      🌟 Culture
                    </h4>
                    <p className="text-gray-700">{research.profile?.culture || 'N/A'}</p>
                  </div>
                </div>
                {research.profile?.values && research.profile.values.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      💎 Core Values
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {research.profile.values.map((value, idx) => (
                        <span key={idx} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {research.profile?.location && (
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                        📍 Location
                      </p>
                      <p className="text-gray-900 font-medium">{research.profile.location}</p>
                    </div>
                  )}
                  {research.profile?.industry && (
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                        🏢 Industry
                      </p>
                      <p className="text-gray-900 font-medium">{research.profile.industry}</p>
                    </div>
                  )}
                  {research.profile?.workMode && (
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                        💼 Work Mode
                      </p>
                      <p className="text-gray-900 font-medium">{research.profile.workMode}</p>
                    </div>
                  )}
                </div>
                {research.profile?.website && (
                  <div className="mt-4">
                    <a
                      href={research.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      🌐 Visit Company Website
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Leadership Tab */}
            {activeTab === 'leadership' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Leadership Team</h3>
                {research.leadership && research.leadership.length > 0 ? (
                  research.leadership.map((leader, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900">{leader.name}</h4>
                      <p className="text-blue-600 mb-2">{leader.title}</p>
                      {leader.bio && <p className="text-gray-700">{leader.bio}</p>}
                      {leader.linkedIn && (
                        <a href={leader.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                          LinkedIn Profile →
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No leadership information available.</p>
                )}

                {/* Potential Interviewers */}
                {research.interviewers && research.interviewers.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Potential Interviewers</h3>
                    <div className="space-y-3">
                      {research.interviewers.map((iv, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{iv.name}</h4>
                              {iv.title && <p className="text-blue-600">{iv.title}</p>}
                            </div>
                            {iv.email && (
                              <a href={`mailto:${iv.email}`} className="text-sm text-blue-600 hover:underline">{iv.email}</a>
                            )}
                          </div>
                          {iv.notes && <p className="text-gray-700 mt-2">{iv.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Competitive Analysis Tab */}
            {activeTab === 'competitive' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Market Position</h3>
                  <p className="text-gray-700">{research.competitive?.marketPosition || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Key Differentiators</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {research.competitive?.differentiators?.map((diff, idx) => (
                        <li key={idx} className="text-gray-700">{diff}</li>
                      )) || <li className="text-gray-600">N/A</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Competitors</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {research.competitive?.competitors?.map((comp, idx) => (
                        <li key={idx} className="text-gray-700">{comp}</li>
                      )) || <li className="text-gray-600">N/A</li>}
                    </ul>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Challenges</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {research.competitive?.challenges?.map((challenge, idx) => (
                        <li key={idx} className="text-gray-700">{challenge}</li>
                      )) || <li className="text-gray-600">N/A</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Opportunities</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {research.competitive?.opportunities?.map((opp, idx) => (
                        <li key={idx} className="text-gray-700">{opp}</li>
                      )) || <li className="text-gray-600">N/A</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* News Tab */}
            {activeTab === 'news' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Recent News & Developments</h3>
                  {research.news && research.news.length > 0 && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {research.news.length} {research.news.length === 1 ? 'Article' : 'Articles'}
                    </span>
                  )}
                </div>
                {research.news && research.news.length > 0 ? (
                  <div className="space-y-4">
                    {research.news.map((item, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                              <span className="flex items-center gap-1">
                                📅 {new Date(item.date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                📰 {item.source}
                              </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{item.summary}</p>
                          </div>
                          {item.category && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm ml-4 flex-shrink-0">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium mt-3"
                          >
                            Read full article
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-4xl mb-3">📰</div>
                    <p className="text-gray-600 mb-2">No recent news available.</p>
                    <p className="text-sm text-gray-500">
                      Click "Refresh Research" above to fetch the latest company news and updates.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Talking Points Tab */}
            {activeTab === 'talking-points' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Talking Points for Interview</h3>
                {research.talkingPoints && research.talkingPoints.length > 0 ? (
                  research.talkingPoints.map((tp, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">{tp.topic}</h4>
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Key Points:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {tp.points?.map((point, pidx) => (
                            <li key={pidx} className="text-gray-700">{point}</li>
                          ))}
                        </ul>
                      </div>
                      {tp.questions && tp.questions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Questions to Ask:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {tp.questions.map((q, qidx) => (
                              <li key={qidx} className="text-blue-700">{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No talking points available.</p>
                )}
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Intelligent Questions to Ask</h3>
                {research.intelligentQuestions && research.intelligentQuestions.length > 0 ? (
                  research.intelligentQuestions.map((q, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">{q.question}</h4>
                          <p className="text-sm text-gray-600 mt-2 italic">{q.reasoning}</p>
                        </div>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm ml-4">
                          {q.category}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No questions available.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
