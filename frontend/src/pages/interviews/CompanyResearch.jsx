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
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'culture', label: 'Mission & Culture', icon: '🎯' },
    { id: 'products', label: 'Products & Services', icon: '🚀' },
    { id: 'leadership', label: 'Leadership', icon: '👔' },
    { id: 'competitive', label: 'Competitive Landscape', icon: '🏆' },
    { id: 'news', label: 'Recent News', icon: '📰' },
    { id: 'social', label: 'Social Media', icon: '📱' },
    { id: 'talking-points', label: 'Talking Points', icon: '💬' },
    { id: 'questions', label: 'Questions to Ask', icon: '❓' },
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
          <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-2 sm:py-4 px-2 sm:px-4 text-center border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-1">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab - Enhanced like Jobs page */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Company Description */}
                {(research.profile?.description || research.profile?.overview) && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border-l-4 border-blue-500">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">📖 About {research.companyName}</h3>
                    <p className="text-gray-700 leading-relaxed">{research.profile.description || research.profile.overview}</p>
                  </div>
                )}

                {/* Company Details Grid - Enhanced */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {research.profile?.industry && (
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600 mb-1">🏢 Industry</p>
                        <p className="text-lg font-semibold text-gray-900">{research.profile.industry}</p>
                      </div>
                    )}
                    {research.profile?.size && (
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600 mb-1">👥 Company Size</p>
                        <p className="text-lg font-semibold text-gray-900">{research.profile.size}</p>
                      </div>
                    )}
                    {(research.profile?.headquarters || research.profile?.location) && (
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600 mb-1">📍 Headquarters</p>
                        <p className="text-lg font-semibold text-gray-900">{research.profile.headquarters || research.profile.location}</p>
                      </div>
                    )}
                    {research.profile?.founded && (
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600 mb-1">📅 Founded</p>
                        <p className="text-lg font-semibold text-gray-900">{research.profile.founded}</p>
                      </div>
                    )}
                    {research.profile?.companyType && (
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600 mb-1">🏛️ Type</p>
                        <p className="text-lg font-semibold text-gray-900">{research.profile.companyType}</p>
                      </div>
                    )}
                    {research.profile?.stockTicker && (
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600 mb-1">📈 Stock</p>
                        <p className="text-lg font-semibold text-gray-900">{research.profile.stockTicker}</p>
                      </div>
                    )}
                    {research.profile?.revenue && (
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600 mb-1">💰 Revenue</p>
                        <p className="text-lg font-semibold text-gray-900">{research.profile.revenue}</p>
                      </div>
                    )}
                    {research.profile?.workMode && (
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600 mb-1">💼 Work Mode</p>
                        <p className="text-lg font-semibold text-gray-900">{research.profile.workMode}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Website and Contact */}
                {research.profile?.website && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">🌐 Website</h3>
                    <a
                      href={research.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-lg font-medium"
                    >
                      {research.profile.website}
                    </a>
                  </div>
                )}

                {/* Research Summary */}
                {research.profile?.overview && research.profile?.description && research.profile.overview !== research.profile.description && (
                  <div className="bg-green-50 p-5 rounded-lg border-l-4 border-green-500">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">📝 Research Summary</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{research.profile.overview}</p>
                  </div>
                )}
              </div>
            )}

            {/* Mission & Culture Tab - New */}
            {activeTab === 'culture' && (
              <div className="space-y-6">
                {research.profile?.mission && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Mission Statement</h3>
                    <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                      {research.profile.mission}
                    </p>
                  </div>
                )}

                {research.profile?.values && research.profile.values.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">💎 Core Values</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {research.profile.values.map((value, index) => (
                        <div key={index} className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                          <p className="text-gray-700">• {value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {research.profile?.culture && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">🌟 Company Culture</h3>
                    <p className="text-gray-700 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                      {research.profile.culture}
                    </p>
                  </div>
                )}

                {research.profile?.workEnvironment && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">💼 Work Environment</h3>
                    <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                      {research.profile.workEnvironment}
                    </p>
                  </div>
                )}

                {!research.profile?.mission && !research.profile?.values?.length && !research.profile?.culture && (
                  <p className="text-gray-500 text-center py-8">
                    Mission & Culture information not available
                  </p>
                )}
              </div>
            )}

            {/* Products & Services Tab - New */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                {research.productsAndServices?.mainProducts && research.productsAndServices.mainProducts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">🚀 Main Products</h3>
                    <ul className="space-y-2">
                      {research.productsAndServices.mainProducts.map((product, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span className="text-gray-700">{product}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {research.productsAndServices?.services && research.productsAndServices.services.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">🛠️ Services</h3>
                    <ul className="space-y-2">
                      {research.productsAndServices.services.map((service, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          <span className="text-gray-700">{service}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {research.productsAndServices?.technologies && research.productsAndServices.technologies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">⚙️ Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {research.productsAndServices.technologies.map((tech, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {research.productsAndServices?.innovations && research.productsAndServices.innovations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Recent Innovations</h3>
                    <ul className="space-y-2">
                      {research.productsAndServices.innovations.map((innovation, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-yellow-500 mr-2">✨</span>
                          <span className="text-gray-700">{innovation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(!research.productsAndServices?.mainProducts?.length && 
                  !research.productsAndServices?.services?.length && 
                  !research.productsAndServices?.technologies?.length) && (
                  <p className="text-gray-500 text-center py-8">
                    Products & Services information not available
                  </p>
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

            {/* Competitive Analysis Tab - Enhanced like Jobs page */}
            {activeTab === 'competitive' && (
              <div className="space-y-6">
                {research.competitive?.competitors && research.competitive.competitors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">🏆 Main Competitors</h3>
                    <div className="flex flex-wrap gap-2">
                      {research.competitive.competitors.map((competitor, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
                        >
                          {competitor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {research.competitive?.marketPosition && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Market Position</h3>
                    <p className="text-gray-700 bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                      {research.competitive.marketPosition}
                    </p>
                  </div>
                )}

                {research.competitive?.differentiators && research.competitive.differentiators.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">✨ Unique Value Proposition</h3>
                    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                      <ul className="space-y-2">
                        {research.competitive.differentiators.map((diff, index) => (
                          <li key={index} className="text-gray-700">• {diff}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {research.competitive?.challenges && research.competitive.challenges.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">⚠️ Industry Challenges</h3>
                      <ul className="space-y-2">
                        {research.competitive.challenges.map((challenge, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-orange-500 mr-2">📌</span>
                            <span className="text-gray-700">{challenge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {research.competitive?.opportunities && research.competitive.opportunities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">📈 Opportunities</h3>
                      <ul className="space-y-2">
                        {research.competitive.opportunities.map((opp, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2">📌</span>
                            <span className="text-gray-700">{opp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {!research.competitive?.competitors?.length && !research.competitive?.marketPosition && (
                  <p className="text-gray-500 text-center py-8">
                    Competitive landscape information not available
                  </p>
                )}
              </div>
            )}

            {/* News Tab */}
            {activeTab === 'news' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent News & Developments</h3>
                {research.news && research.news.length > 0 ? (
                  research.news.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(item.date).toLocaleDateString()} • {item.source}
                          </p>
                          <p className="text-gray-700 mt-2">{item.summary}</p>
                        </div>
                        {item.category && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm ml-4">
                            {item.category}
                          </span>
                        )}
                      </div>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                          Read more →
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No recent news available.</p>
                )}
              </div>
            )}

            {/* Social Media Tab - New */}
            {activeTab === 'social' && (
              <div className="space-y-6">
                {research.socialMedia?.platforms && Object.keys(research.socialMedia.platforms).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">📱 Social Media Profiles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(research.socialMedia.platforms).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-2xl mr-3">{getPlatformIcon(platform)}</span>
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{platform}</p>
                            <p className="text-sm text-blue-600 hover:underline truncate">{url}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {research.socialMedia?.engagement && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">💬 Engagement Tip</h3>
                    <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                      {research.socialMedia.engagement}
                    </p>
                  </div>
                )}

                {(!research.socialMedia?.platforms || Object.keys(research.socialMedia.platforms).length === 0) && 
                 !research.socialMedia?.engagement && (
                  <p className="text-gray-500 text-center py-8">
                    Social media information not available
                  </p>
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

// Helper function for social media platform icons
function getPlatformIcon(platform) {
  const icons = {
    linkedin: '💼',
    twitter: '🐦',
    facebook: '👥',
    instagram: '📷',
    youtube: '📺',
    github: '💻',
    tiktok: '🎵',
    pinterest: '📌',
  };
  return icons[platform.toLowerCase()] || '🔗';
}
