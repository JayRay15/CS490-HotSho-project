import PropTypes from "prop-types";
import Card from "./Card";

export default function CompanyInfoCard({ companyInfo, companyName, industry, location }) {
    if (!companyInfo || Object.keys(companyInfo).length === 0) {
        return null;
    }

    // Check if there's any meaningful company information
    const hasCompanyInfo =
        companyInfo.size ||
        companyInfo.website ||
        companyInfo.description ||
        companyInfo.mission ||
        companyInfo.logo ||
        companyInfo.contactInfo?.email ||
        companyInfo.contactInfo?.phone ||
        companyInfo.contactInfo?.address ||
        companyInfo.glassdoorRating?.rating ||
        (companyInfo.recentNews && companyInfo.recentNews.length > 0);

    if (!hasCompanyInfo) {
        return null;
    }

    return (
        <Card title="Company Information" variant="elevated">
            <div className="space-y-6">
                {/* Company Header */}
                <div className="flex items-start gap-4">
                    {companyInfo.logo && (
                        <div className="flex-shrink-0">
                            <img
                                src={companyInfo.logo}
                                alt={`${companyName} logo`}
                                className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{companyName}</h3>
                        {(industry || location) && (
                            <p className="text-sm text-gray-600 mt-1">
                                {[industry, location].filter(Boolean).join(" • ")}
                            </p>
                        )}
                    </div>
                </div>

                {/* Company Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {companyInfo.size && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Company Size</p>
                            <p className="text-gray-900">{companyInfo.size} employees</p>
                        </div>
                    )}

                    {companyInfo.website && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Website</p>
                            <a
                                href={companyInfo.website.startsWith('http') ? companyInfo.website : `https://${companyInfo.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                                {companyInfo.website}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    )}

                    {companyInfo.glassdoorRating?.rating && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Glassdoor Rating</p>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                    <span className="text-lg font-bold text-gray-900">{companyInfo.glassdoorRating.rating.toFixed(1)}</span>
                                    <span className="text-yellow-500 ml-1">★</span>
                                </div>
                                {companyInfo.glassdoorRating.reviewCount && (
                                    <span className="text-sm text-gray-600">
                                        ({companyInfo.glassdoorRating.reviewCount.toLocaleString()} reviews)
                                    </span>
                                )}
                            </div>
                            {companyInfo.glassdoorRating.url && (
                                <a
                                    href={companyInfo.glassdoorRating.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    View on Glassdoor →
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* Company Description */}
                {companyInfo.description && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">About Company</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{companyInfo.description}</p>
                    </div>
                )}

                {/* Mission Statement */}
                {companyInfo.mission && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Mission Statement</h4>
                        <p className="text-gray-700 italic whitespace-pre-wrap">{companyInfo.mission}</p>
                    </div>
                )}

                {/* Contact Information */}
                {(companyInfo.contactInfo?.email || companyInfo.contactInfo?.phone || companyInfo.contactInfo?.address) && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h4>
                        <div className="space-y-2">
                            {companyInfo.contactInfo.email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <a href={`mailto:${companyInfo.contactInfo.email}`} className="text-blue-600 hover:underline">
                                        {companyInfo.contactInfo.email}
                                    </a>
                                </div>
                            )}
                            {companyInfo.contactInfo.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <a href={`tel:${companyInfo.contactInfo.phone}`} className="text-blue-600 hover:underline">
                                        {companyInfo.contactInfo.phone}
                                    </a>
                                </div>
                            )}
                            {companyInfo.contactInfo.address && (
                                <div className="flex items-start gap-2 text-sm">
                                    <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-gray-700">{companyInfo.contactInfo.address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Recent News */}
                {companyInfo.recentNews && companyInfo.recentNews.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Recent News & Updates</h4>
                        <div className="space-y-3">
                            {companyInfo.recentNews.slice(0, 3).map((news, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1">
                                            {news.url ? (
                                                <a
                                                    href={news.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-gray-900 hover:text-blue-600"
                                                >
                                                    {news.title}
                                                </a>
                                            ) : (
                                                <p className="font-medium text-gray-900">{news.title}</p>
                                            )}
                                        </div>
                                        {news.relevanceScore && (
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap ${
                                                news.relevanceScore >= 8 ? 'bg-green-100 text-green-800' :
                                                news.relevanceScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                ⭐ {news.relevanceScore}/10
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Metadata badges */}
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {news.category && (
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                                news.category === 'funding' ? 'bg-green-100 text-green-800' :
                                                news.category === 'product_launch' ? 'bg-blue-100 text-blue-800' :
                                                news.category === 'hiring' ? 'bg-purple-100 text-purple-800' :
                                                news.category === 'acquisition' ? 'bg-orange-100 text-orange-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {news.category.replace('_', ' ')}
                                            </span>
                                        )}
                                        {news.sentiment && (
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${
                                                news.sentiment === 'positive' ? 'bg-green-50 text-green-700 border-green-200' :
                                                news.sentiment === 'negative' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-gray-50 text-gray-700 border-gray-200'
                                            }`}>
                                                {news.sentiment === 'positive' && '😊'}
                                                {news.sentiment === 'neutral' && '😐'}
                                                {news.sentiment === 'negative' && '😟'}
                                            </span>
                                        )}
                                        {news.date && (
                                            <span className="text-xs text-gray-500">
                                                📅 {new Date(news.date).toLocaleDateString()}
                                            </span>
                                        )}
                                        {news.source && (
                                            <span className="text-xs text-gray-500">
                                                📰 {news.source}
                                            </span>
                                        )}
                                    </div>

                                    {news.summary && (
                                        <p className="text-sm text-gray-600 mb-2">{news.summary}</p>
                                    )}

                                    {/* Key Points */}
                                    {news.keyPoints && news.keyPoints.length > 0 && (
                                        <div className="bg-white rounded p-2 mb-2">
                                            <p className="text-xs font-medium text-gray-600 mb-1">Key Points:</p>
                                            <ul className="text-xs text-gray-600 space-y-0.5">
                                                {news.keyPoints.slice(0, 2).map((point, pointIdx) => (
                                                    <li key={pointIdx} className="flex items-start gap-1">
                                                        <span className="text-blue-600">•</span>
                                                        <span>{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {news.tags && news.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {news.tags.slice(0, 3).map((tag, tagIdx) => (
                                                <span key={tagIdx} className="px-1.5 py-0.5 text-xs bg-white text-gray-600 rounded">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {companyInfo.recentNews.length > 3 && (
                                <p className="text-xs text-center text-gray-500">
                                    +{companyInfo.recentNews.length - 3} more news items
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}

CompanyInfoCard.propTypes = {
    companyInfo: PropTypes.shape({
        size: PropTypes.string,
        website: PropTypes.string,
        description: PropTypes.string,
        mission: PropTypes.string,
        logo: PropTypes.string,
        contactInfo: PropTypes.shape({
            email: PropTypes.string,
            phone: PropTypes.string,
            address: PropTypes.string,
        }),
        glassdoorRating: PropTypes.shape({
            rating: PropTypes.number,
            reviewCount: PropTypes.number,
            url: PropTypes.string,
        }),
        recentNews: PropTypes.arrayOf(
            PropTypes.shape({
                title: PropTypes.string,
                summary: PropTypes.string,
                url: PropTypes.string,
                date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
            })
        ),
    }),
    companyName: PropTypes.string.isRequired,
    industry: PropTypes.string,
    location: PropTypes.string,
};
