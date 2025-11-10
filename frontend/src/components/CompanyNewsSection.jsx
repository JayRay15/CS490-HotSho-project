import { useState, useEffect } from 'prop-types';
import PropTypes from 'prop-types';
import Card from './Card';
import axios from 'axios';

/**
 * Enhanced Company News Section Component
 * Displays categorized news with filtering, relevance scoring, and export functionality
 */
export default function CompanyNewsSection({ companyName, initialNews = [], onNewsUpdate }) {
    const [news, setNews] = useState(initialNews);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('relevance'); // relevance or date
    const [summary, setSummary] = useState(null);
    const [showExportModal, setShowExportModal] = useState(false);

    const categories = [
        { value: 'all', label: 'All News', icon: '📰' },
        { value: 'funding', label: 'Funding', icon: '💰' },
        { value: 'product_launch', label: 'Products', icon: '🚀' },
        { value: 'hiring', label: 'Hiring', icon: '👥' },
        { value: 'acquisition', label: 'M&A', icon: '🤝' },
        { value: 'partnership', label: 'Partnerships', icon: '🔗' },
        { value: 'leadership', label: 'Leadership', icon: '👔' },
        { value: 'awards', label: 'Awards', icon: '🏆' },
        { value: 'general', label: 'General', icon: '📢' },
    ];

    // Fetch news from API
    const fetchNews = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(`/api/companies/news`, {
                params: {
                    company: companyName,
                    limit: 10,
                    minRelevance: 3,
                    category: selectedCategory === 'all' ? undefined : selectedCategory,
                },
            });

            if (response.data.success) {
                setNews(response.data.data.news);
                setSummary(response.data.data.summary);
                if (onNewsUpdate) {
                    onNewsUpdate(response.data.data.news);
                }
            }
        } catch (err) {
            console.error('Error fetching news:', err);
            setError('Failed to fetch company news. Using cached data.');
        } finally {
            setLoading(false);
        }
    };

    // Load news on component mount or when company changes
    useEffect(() => {
        if (companyName && initialNews.length === 0) {
            fetchNews();
        }
    }, [companyName]);

    // Re-fetch when category changes
    useEffect(() => {
        if (companyName && selectedCategory !== 'all') {
            fetchNews();
        }
    }, [selectedCategory]);

    // Sort news
    const sortedNews = [...news].sort((a, b) => {
        if (sortBy === 'relevance') {
            return (b.relevanceScore || 5) - (a.relevanceScore || 5);
        } else {
            return new Date(b.date) - new Date(a.date);
        }
    });

    // Filter news by category
    const filteredNews = selectedCategory === 'all'
        ? sortedNews
        : sortedNews.filter(item => item.category === selectedCategory);

    // Export news summary
    const handleExport = async (format) => {
        try {
            const response = await axios.get(`/api/companies/news/export`, {
                params: {
                    company: companyName,
                    format,
                },
                responseType: format === 'text' ? 'blob' : 'json',
            });

            if (format === 'text') {
                const blob = new Blob([response.data], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${companyName.replace(/\s+/g, '_')}_news_summary.txt`;
                a.click();
            } else {
                const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${companyName.replace(/\s+/g, '_')}_news_summary.json`;
                a.click();
            }
            
            setShowExportModal(false);
        } catch (err) {
            console.error('Error exporting news:', err);
            alert('Failed to export news summary');
        }
    };

    // Get category badge color
    const getCategoryColor = (category) => {
        const colors = {
            funding: 'bg-green-100 text-green-800',
            product_launch: 'bg-blue-100 text-blue-800',
            hiring: 'bg-purple-100 text-purple-800',
            acquisition: 'bg-orange-100 text-orange-800',
            partnership: 'bg-indigo-100 text-indigo-800',
            leadership: 'bg-pink-100 text-pink-800',
            awards: 'bg-yellow-100 text-yellow-800',
            general: 'bg-gray-100 text-gray-800',
        };
        return colors[category] || colors.general;
    };

    // Get sentiment badge color
    const getSentimentColor = (sentiment) => {
        const colors = {
            positive: 'bg-green-50 text-green-700 border-green-200',
            neutral: 'bg-gray-50 text-gray-700 border-gray-200',
            negative: 'bg-red-50 text-red-700 border-red-200',
        };
        return colors[sentiment] || colors.neutral;
    };

    // Get relevance badge
    const getRelevanceBadge = (score) => {
        if (score >= 8) return { label: 'High', color: 'bg-green-100 text-green-800' };
        if (score >= 6) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
        return { label: 'Low', color: 'bg-gray-100 text-gray-800' };
    };

    if (!companyName) return null;

    return (
        <Card title="Company News & Updates" variant="elevated">
            <div className="space-y-6">
                {/* Summary Section */}
                {summary && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">📊 News Summary</h4>
                        <p className="text-sm text-blue-800">{summary.summary}</p>
                        {summary.highlights && summary.highlights.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs font-medium text-blue-900 mb-1">Key Highlights:</p>
                                <ul className="text-xs text-blue-800 space-y-1">
                                    {summary.highlights.map((highlight, idx) => (
                                        <li key={idx}>{highlight}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setSelectedCategory(cat.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                                    selectedCategory === cat.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <span className="mr-1">{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="relevance">Sort by Relevance</option>
                            <option value="date">Sort by Date</option>
                        </select>

                        {/* Refresh */}
                        <button
                            onClick={fetchNews}
                            disabled={loading}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            {loading ? '🔄' : '↻'} Refresh
                        </button>

                        {/* Export */}
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            📥 Export
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                        ⚠️ {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-sm text-gray-600">Fetching latest news...</p>
                    </div>
                )}

                {/* News Items */}
                {!loading && filteredNews.length > 0 && (
                    <div className="space-y-4">
                        {filteredNews.map((newsItem, idx) => (
                            <div
                                key={idx}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h5 className="font-semibold text-gray-900 flex-1">
                                        {newsItem.url ? (
                                            <a
                                                href={newsItem.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:text-blue-600 transition"
                                            >
                                                {newsItem.title}
                                            </a>
                                        ) : (
                                            newsItem.title
                                        )}
                                    </h5>
                                    {newsItem.relevanceScore && (
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getRelevanceBadge(newsItem.relevanceScore).color}`}>
                                            {getRelevanceBadge(newsItem.relevanceScore).label}
                                        </span>
                                    )}
                                </div>

                                {/* Metadata */}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    {newsItem.category && (
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getCategoryColor(newsItem.category)}`}>
                                            {newsItem.category.replace('_', ' ')}
                                        </span>
                                    )}
                                    {newsItem.sentiment && (
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getSentimentColor(newsItem.sentiment)}`}>
                                            {newsItem.sentiment === 'positive' && '😊'}
                                            {newsItem.sentiment === 'neutral' && '😐'}
                                            {newsItem.sentiment === 'negative' && '😟'}
                                            {newsItem.sentiment}
                                        </span>
                                    )}
                                    {newsItem.date && (
                                        <span className="text-xs text-gray-500">
                                            📅 {new Date(newsItem.date).toLocaleDateString()}
                                        </span>
                                    )}
                                    {newsItem.source && (
                                        <span className="text-xs text-gray-500">
                                            📰 {newsItem.source}
                                        </span>
                                    )}
                                    {newsItem.relevanceScore && (
                                        <span className="text-xs text-gray-500">
                                            ⭐ {newsItem.relevanceScore}/10
                                        </span>
                                    )}
                                </div>

                                {/* Summary */}
                                {newsItem.summary && (
                                    <p className="text-sm text-gray-700 mb-3">{newsItem.summary}</p>
                                )}

                                {/* Key Points */}
                                {newsItem.keyPoints && newsItem.keyPoints.length > 0 && (
                                    <div className="bg-gray-50 rounded p-3 mb-3">
                                        <p className="text-xs font-medium text-gray-700 mb-2">🔑 Key Points:</p>
                                        <ul className="text-xs text-gray-600 space-y-1">
                                            {newsItem.keyPoints.map((point, pointIdx) => (
                                                <li key={pointIdx} className="flex items-start gap-2">
                                                    <span className="text-blue-600 mt-0.5">•</span>
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Tags */}
                                {newsItem.tags && newsItem.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {newsItem.tags.map((tag, tagIdx) => (
                                            <span
                                                key={tagIdx}
                                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredNews.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">📭 No news items found for this category.</p>
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                        >
                            View all news
                        </button>
                    </div>
                )}
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export News Summary</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Choose a format to export the news summary for use in applications and interviews.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleExport('text')}
                                className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                <div className="font-medium text-gray-900">📄 Text Format (.txt)</div>
                                <div className="text-sm text-gray-600">Formatted text for cover letters</div>
                            </button>
                            <button
                                onClick={() => handleExport('json')}
                                className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                <div className="font-medium text-gray-900">📊 JSON Format (.json)</div>
                                <div className="text-sm text-gray-600">Structured data for analysis</div>
                            </button>
                        </div>
                        <button
                            onClick={() => setShowExportModal(false)}
                            className="mt-4 w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
}

CompanyNewsSection.propTypes = {
    companyName: PropTypes.string.isRequired,
    initialNews: PropTypes.array,
    onNewsUpdate: PropTypes.func,
};
