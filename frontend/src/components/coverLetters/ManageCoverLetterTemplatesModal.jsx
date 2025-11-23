import React from 'react';
import LoadingSpinner from '../LoadingSpinner';

/**
 * Manage Cover Letter Templates Modal Component
 * Allows users to view, create, import, and delete cover letter templates
 */
export default function ManageCoverLetterTemplatesModal({
    showManageCoverLetterTemplates,
    setShowManageCoverLetterTemplates,
    setSelectedCoverLetterTemplate,
    setCustomCoverLetterName,
    setCustomCoverLetterContent,
    setIsCreatingCoverLetterTemplate,
    setShowCoverLetterCustomize,
    setShowCoverLetterImport,
    coverLetterLoading,
    coverLetterTemplates,
    authWrap,
    deleteCoverLetterTemplate,
    loadCoverLetterTemplates
}) {
    if (!showManageCoverLetterTemplates) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
            onClick={() => setShowManageCoverLetterTemplates(false)}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                            Manage Templates
                        </h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowManageCoverLetterTemplates(false);
                                    setSelectedCoverLetterTemplate({
                                        name: 'New Template',
                                        industry: 'general',
                                        style: 'formal',
                                        content: '',
                                        description: ''
                                    });
                                    setCustomCoverLetterName('My Custom Template');
                                    setCustomCoverLetterContent('');
                                    setIsCreatingCoverLetterTemplate(true); // Creating a template, not a cover letter
                                    setShowCoverLetterCustomize(true);
                                }}
                                className="px-4 py-2 text-white rounded-lg transition"
                                style={{ backgroundColor: '#777C6D' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                            >
                                Create Template
                            </button>
                            <button
                                onClick={() => {
                                    setShowManageCoverLetterTemplates(false);
                                    setShowCoverLetterImport(true);
                                }}
                                className="px-4 py-2 text-white rounded-lg transition"
                                style={{ backgroundColor: '#777C6D' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                            >
                                Import Template
                            </button>
                            <button
                                onClick={() => setShowManageCoverLetterTemplates(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {coverLetterLoading ? (
                        <div className="text-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : coverLetterTemplates.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600">No templates available</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(() => {
                                // Deduplicate default templates - keep only one per name
                                const defaultTemplateNames = [
                                    'Formal Professional',
                                    'Modern Professional',
                                    'Creative Expression',
                                    'Technical Professional',
                                    'Executive Leadership',
                                    'Technology Professional',
                                    'Business Professional',
                                    'Healthcare Professional'
                                ];
                                const seenNames = new Set();
                                const uniqueTemplates = coverLetterTemplates.filter(template => {
                                    const isDefaultSystemTemplate = defaultTemplateNames.includes(template.name);

                                    if (isDefaultSystemTemplate) {
                                        if (seenNames.has(template.name)) {
                                            return false; // Skip duplicate by name
                                        }
                                        seenNames.add(template.name);
                                        return true;
                                    }
                                    return true; // Keep all custom templates
                                });

                                return uniqueTemplates.map((template) => {
                                    // Check if this is a default system template
                                    const isDefaultSystemTemplate = defaultTemplateNames.includes(template.name);

                                    return (
                                        <div
                                            key={template._id}
                                            className="border-2 border-gray-300 rounded-lg overflow-hidden hover:border-[#777C6D] transition"
                                        >
                                            <div className="bg-white p-4 h-64 overflow-hidden">
                                                <div className="text-xs font-mono whitespace-pre-wrap text-gray-700 line-clamp-[14]">
                                                    {template.content}
                                                </div>
                                            </div>
                                            <div className="border-t border-gray-200 p-4 bg-gray-50">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold truncate" style={{ color: "#4F5348" }}>
                                                            {template.name}
                                                        </h3>
                                                        <p className="text-xs text-gray-600 mt-1">{template.description || template.style}</p>
                                                    </div>
                                                    {template.isDefault && (
                                                        <span className="ml-2 px-2 py-1 text-xs rounded" style={{ backgroundColor: "#E8EAE3", color: "#4F5348" }}>
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCoverLetterTemplate(template);
                                                            setCustomCoverLetterName(`${template.name} - Copy`);
                                                            setCustomCoverLetterContent(template.content);
                                                            setIsCreatingCoverLetterTemplate(false);
                                                            setShowManageCoverLetterTemplates(false);
                                                            setShowCoverLetterCustomize(true);
                                                        }}
                                                        className={`${isDefaultSystemTemplate ? 'w-full' : 'flex-1'} px-3 py-2 text-sm text-white rounded transition`}
                                                        style={{ backgroundColor: '#777C6D' }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                                                    >
                                                        Use Template
                                                    </button>
                                                    {!isDefaultSystemTemplate && (
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm(`Delete "${template.name}"?`)) {
                                                                    try {
                                                                        await authWrap();
                                                                        await deleteCoverLetterTemplate(template._id);
                                                                        await loadCoverLetterTemplates();
                                                                        setShowManageCoverLetterTemplates(true);
                                                                        alert("Template deleted successfully!");
                                                                    } catch (err) {
                                                                        console.error("Delete failed:", err);
                                                                        alert("Failed to delete template");
                                                                    }
                                                                }
                                                            }}
                                                            className="px-3 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded transition"
                                                            title="Delete Template"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
