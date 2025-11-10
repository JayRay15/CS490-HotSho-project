import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * UC-064: Comprehensive Company Research Report Component
 * Displays automated company research with all acceptance criteria covered:
 * - Basic information (size, industry, headquarters)
 * - Mission, values, and culture
 * - Recent news and press releases
 * - Key executives and leadership
 * - Products and services
 * - Competitive landscape
 * - Social media presence
 * - Research summary
 */
export default function CompanyResearchReport({ companyName, jobDescription = '', website = '', autoLoad = true }) {
    const [research, setResearch] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (companyName && autoLoad) {
            fetchResearch();
        }
    }, [companyName, autoLoad]);

    const fetchResearch = async () => {
        setLoading(true);
        setError(null);

        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
            const response = await axios.get(`${API_URL}/api/companies/research`, {
                params: {
                    company: companyName,
                    jobDescription,
                    website
                }
            });

            if (response.data.success) {
                setResearch(response.data.data.research);
            }
        } catch (err) {
            console.error('Research fetch error:', err);
            setError('Failed to fetch company research. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
            const response = await axios.get(`${API_URL}/api/companies/research/export`, {
                params: {
                    company: companyName,
                    format,
                    jobDescription,
                    website
                },
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${companyName.replace(/\s+/g, '_')}_research_report.${format === 'json' ? 'json' : 'txt'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to export research report');
        }
    };

    const getDataQualityColor = (quality) => {
        if (quality >= 80) return 'text-green-600 bg-green-100';
        if (quality >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'culture', label: 'Mission & Culture', icon: '🎯' },
        { id: 'products', label: 'Products & Services', icon: '🚀' },
        { id: 'leadership', label: 'Leadership', icon: '👔' },
        { id: 'competitive', label: 'Competitive Landscape', icon: '🏆' },
        { id: 'social', label: 'Social Media', icon: '📱' }
    ];

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Researching {companyName}...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                        <button
                            onClick={fetchResearch}
                            className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!research) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-center">Click "Research Company" to begin</p>
                <div className="mt-4 text-center">
                    <button
                        onClick={fetchResearch}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        🔍 Research Company
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md">
            {/* Header */}
            <div className="border-b border-gray-200 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{research.companyName}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Research Date: {new Date(research.researchDate).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDataQualityColor(research.metadata.dataQuality)}`}>
                            {research.metadata.dataQuality}% Data Quality
                        </span>
                        <button
                            onClick={fetchResearch}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Refresh Research"
                        >
                            ↻
                        </button>
                    </div>
                </div>

                {/* Summary Banner */}
                <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <p className="text-sm text-gray-700">{research.summary}</p>
                </div>

                {/* Export Buttons */}
                <div className="mt-4 flex space-x-2">
                    <button
                        onClick={() => handleExport('text')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                    >
                        📄 Export as Text
                    </button>
                    <button
                        onClick={() => handleExport('json')}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                    >
                        📋 Export as JSON
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-4 px-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {/* Overview Tab - Enhanced */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Company Description */}
                        {research.basicInfo.description && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border-l-4 border-blue-500">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">📖 About {research.companyName}</h3>
                                <p className="text-gray-700 leading-relaxed">{research.basicInfo.description}</p>
                            </div>
                        )}

                        {/* Company Details Grid */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InfoCard label="Industry" value={research.basicInfo.industry} icon="🏢" />
                                <InfoCard label="Company Size" value={research.basicInfo.size} icon="👥" />
                                <InfoCard label="Headquarters" value={research.basicInfo.headquarters} icon="📍" />
                                {research.basicInfo.founded && (
                                    <InfoCard label="Founded" value={research.basicInfo.founded} icon="📅" />
                                )}
                                <InfoCard label="Type" value={research.basicInfo.companyType} icon="🏛️" />
                                {research.basicInfo.stockTicker && (
                                    <InfoCard label="Stock" value={research.basicInfo.stockTicker} icon="📈" />
                                )}
                                {research.basicInfo.revenue && (
                                    <InfoCard label="Revenue" value={research.basicInfo.revenue} icon="💰" />
                                )}
                            </div>
                        </div>

                        {/* Website and Contact */}
                        {research.basicInfo.website && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">🌐 Website</h3>
                                <a
                                    href={research.basicInfo.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-lg font-medium"
                                >
                                    {research.basicInfo.website}
                                </a>
                            </div>
                        )}

                        {/* Research Summary */}
                        {research.summary && (
                            <div className="bg-green-50 p-5 rounded-lg border-l-4 border-green-500">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">📝 Research Summary</h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{research.summary}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Mission & Culture Tab */}
                {activeTab === 'culture' && (
                    <div className="space-y-6">
                        {research.missionAndCulture.mission && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Mission Statement</h3>
                                <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                    {research.missionAndCulture.mission}
                                </p>
                            </div>
                        )}

                        {research.missionAndCulture.values.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">💎 Core Values</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {research.missionAndCulture.values.map((value, index) => (
                                        <div key={index} className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                                            <p className="text-gray-700">• {value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {research.missionAndCulture.culture && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">🌟 Company Culture</h3>
                                <p className="text-gray-700 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                                    {research.missionAndCulture.culture}
                                </p>
                            </div>
                        )}

                        {research.missionAndCulture.workEnvironment && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">💼 Work Environment</h3>
                                <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                                    {research.missionAndCulture.workEnvironment}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Products & Services Tab */}
                {activeTab === 'products' && (
                    <div className="space-y-6">
                        {research.productsAndServices.mainProducts.length > 0 && (
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

                        {research.productsAndServices.services.length > 0 && (
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

                        {research.productsAndServices.technologies.length > 0 && (
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

                        {research.productsAndServices.innovations.length > 0 && (
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
                    </div>
                )}

                {/* Leadership Tab */}
                {activeTab === 'leadership' && (
                    <div className="space-y-6">
                        {research.leadership.executives.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">👔 Key Executives</h3>
                                <div className="space-y-4">
                                    {research.leadership.executives.map((exec, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                                            <p className="font-semibold text-gray-900">{exec.name}</p>
                                            <p className="text-sm text-blue-600">{exec.title}</p>
                                            {exec.background && (
                                                <p className="text-sm text-gray-600 mt-2">{exec.background}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {research.leadership.keyLeaders.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">🌟 Other Key Leaders</h3>
                                <ul className="space-y-2">
                                    {research.leadership.keyLeaders.map((leader, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="text-blue-500 mr-2">•</span>
                                            <span className="text-gray-700">{leader}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {research.leadership.leadershipInfo && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">📖 Leadership Philosophy</h3>
                                <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                    {research.leadership.leadershipInfo}
                                </p>
                            </div>
                        )}

                        {research.leadership.executives.length === 0 && research.leadership.keyLeaders.length === 0 && (
                            <p className="text-gray-500 text-center py-8">
                                Leadership information not available
                            </p>
                        )}
                    </div>
                )}

                {/* Competitive Landscape Tab */}
                {activeTab === 'competitive' && (
                    <div className="space-y-6">
                        {research.competitive.mainCompetitors.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">🏆 Main Competitors</h3>
                                <div className="flex flex-wrap gap-2">
                                    {research.competitive.mainCompetitors.map((competitor, index) => (
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

                        {research.competitive.marketPosition && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Market Position</h3>
                                <p className="text-gray-700 bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                                    {research.competitive.marketPosition}
                                </p>
                            </div>
                        )}

                        {research.competitive.uniqueValue && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">✨ Unique Value Proposition</h3>
                                <p className="text-gray-700 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                                    {research.competitive.uniqueValue}
                                </p>
                            </div>
                        )}

                        {research.competitive.industryTrends.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">📈 Industry Trends</h3>
                                <ul className="space-y-2">
                                    {research.competitive.industryTrends.map((trend, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="text-blue-500 mr-2">📌</span>
                                            <span className="text-gray-700">{trend}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Social Media Tab */}
                {activeTab === 'social' && (
                    <div className="space-y-6">
                        {research.socialMedia.platforms && Object.keys(research.socialMedia.platforms).length > 0 && (
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

                        {research.socialMedia.engagement && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">💬 Engagement Tip</h3>
                                <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                    {research.socialMedia.engagement}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper Components
function InfoCard({ label, value, icon }) {
    return (
        <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">{icon} {label}</p>
            <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
    );
}

function getPlatformIcon(platform) {
    const icons = {
        linkedin: '💼',
        twitter: '🐦',
        facebook: '👥',
        instagram: '📷',
        youtube: '📺',
        github: '💻'
    };
    return icons[platform.toLowerCase()] || '🔗';
}
