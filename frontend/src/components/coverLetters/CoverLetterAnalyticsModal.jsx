import React from 'react';

/**
 * Cover Letter Template Analytics Modal Component
 * Displays usage analytics and statistics for cover letter templates
 */
export default function CoverLetterAnalyticsModal({
    showCoverLetterAnalytics,
    setShowCoverLetterAnalytics,
    coverLetterAnalytics
}) {
    if (!showCoverLetterAnalytics || !coverLetterAnalytics) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
            onClick={() => setShowCoverLetterAnalytics(false)}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                            Template Usage Analytics
                        </h2>
                        <button
                            onClick={() => setShowCoverLetterAnalytics(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Total Templates</p>
                                    <p className="text-3xl font-bold text-blue-900">{coverLetterAnalytics.summary.totalTemplates}</p>
                                </div>
                                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-600 font-medium">Total Usage</p>
                                    <p className="text-3xl font-bold text-green-900">{coverLetterAnalytics.summary.totalUsage}</p>
                                </div>
                                <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-600 font-medium">Average Usage</p>
                                    <p className="text-3xl font-bold text-purple-900">{coverLetterAnalytics.summary.avgUsage}</p>
                                </div>
                                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Most Used Template */}
                    {coverLetterAnalytics.mostUsedTemplate && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3" style={{ color: "#4F5348" }}>
                                Most Used Template
                            </h3>
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xl font-bold text-yellow-900">{coverLetterAnalytics.mostUsedTemplate.name}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded capitalize">
                                                {coverLetterAnalytics.mostUsedTemplate.industry}
                                            </span>
                                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded capitalize">
                                                {coverLetterAnalytics.mostUsedTemplate.style}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-yellow-900">{coverLetterAnalytics.mostUsedTemplate.usageCount}</p>
                                        <p className="text-sm text-yellow-700">times used</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Top 5 Templates */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3" style={{ color: "#4F5348" }}>
                            Top 5 Templates by Usage
                        </h3>
                        <div className="space-y-2">
                            {coverLetterAnalytics.topTemplates.map((template, index) => (
                                <div key={template.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{template.name}</p>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded capitalize">
                                                    {template.industry}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded capitalize">
                                                    {template.style}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-900">{template.usageCount}</p>
                                        <p className="text-xs text-gray-600">uses</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Usage by Industry and Style */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* By Industry */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3" style={{ color: "#4F5348" }}>
                                Usage by Industry
                            </h3>
                            <div className="space-y-2">
                                {Object.entries(coverLetterAnalytics.usageByIndustry).map(([industry, data]) => (
                                    <div key={industry} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-900 capitalize">{industry}</span>
                                            <span className="text-sm text-gray-600">{data.usage} uses</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{ width: `${(data.usage / coverLetterAnalytics.summary.totalUsage) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{data.count} templates</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* By Style */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3" style={{ color: "#4F5348" }}>
                                Usage by Style
                            </h3>
                            <div className="space-y-2">
                                {Object.entries(coverLetterAnalytics.usageByStyle).map(([style, data]) => (
                                    <div key={style} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-900 capitalize">{style}</span>
                                            <span className="text-sm text-gray-600">{data.usage} uses</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-purple-500 h-2 rounded-full"
                                                style={{ width: `${(data.usage / coverLetterAnalytics.summary.totalUsage) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{data.count} templates</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Close Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowCoverLetterAnalytics(false)}
                            className="px-6 py-2 text-white rounded-lg transition"
                            style={{ backgroundColor: '#777C6D' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
