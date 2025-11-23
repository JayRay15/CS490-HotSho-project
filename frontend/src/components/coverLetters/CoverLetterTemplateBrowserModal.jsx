import React from 'react';
import Card from '../Card';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';

/**
 * Cover Letter Template Browser Modal Component
 * Displays a grid of available cover letter templates with filtering options
 */
export default function CoverLetterTemplateBrowserModal({
    showCoverLetterBrowser,
    setShowCoverLetterBrowser,
    coverLetterFilters,
    setCoverLetterFilters,
    loadCoverLetterTemplates,
    coverLetterLoading,
    coverLetterTemplates,
    setSelectedCoverLetterTemplate,
    setShowCoverLetterPreview,
    authWrap,
    setCustomCoverLetterName,
    setCustomCoverLetterContent,
    setCustomCoverLetterStyle,
    setIsCreatingCoverLetterTemplate,
    setShowCoverLetterCustomize,
    exportCoverLetterTemplate,
    setShareTemplateId,
    setShowCoverLetterShare
}) {
    if (!showCoverLetterBrowser) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
            onClick={() => setShowCoverLetterBrowser(false)}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                            Cover Letter Templates
                        </h2>
                        <button
                            onClick={() => setShowCoverLetterBrowser(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="mb-6">
                        <div className="flex gap-4 mb-4">
                            <select
                                value={coverLetterFilters.style}
                                onChange={(e) => {
                                    const newFilters = { ...coverLetterFilters, style: e.target.value };
                                    setCoverLetterFilters(newFilters);
                                    loadCoverLetterTemplates(newFilters);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="">All Styles</option>
                                <option value="formal">Formal</option>
                                <option value="modern">Modern</option>
                                <option value="creative">Creative</option>
                                <option value="technical">Technical</option>
                                <option value="executive">Executive</option>
                            </select>
                        </div>
                    </div>

                    {/* Template Grid */}
                    {coverLetterLoading ? (
                        <div className="text-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : coverLetterTemplates.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>No templates found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                                return uniqueTemplates.map((template) => (
                                    <Card
                                        key={template._id}
                                        variant="outlined"
                                        interactive
                                        className="p-4 hover:border-[#777C6D] transition"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg">{template.name}</h3>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded capitalize">
                                                        {template.style} Style
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                            {template.description}
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedCoverLetterTemplate(template);
                                                        setShowCoverLetterPreview(true);
                                                    }}
                                                >
                                                    Preview
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    size="small"
                                                    onClick={async () => {
                                                        try {
                                                            await authWrap();
                                                            setSelectedCoverLetterTemplate(template);
                                                            setShowCoverLetterBrowser(false);

                                                            // Initialize the customization form
                                                            setCustomCoverLetterName(`${template.name} - Customized`);
                                                            setCustomCoverLetterContent(template.content);
                                                            setCustomCoverLetterStyle(template.style || 'formal');
                                                            setIsCreatingCoverLetterTemplate(false); // Using template to create cover letter
                                                            setShowCoverLetterCustomize(true);
                                                        } catch (err) {
                                                            console.error("Failed to prepare template:", err);
                                                        }
                                                    }}
                                                >
                                                    Use
                                                </Button>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await authWrap();
                                                            const response = await exportCoverLetterTemplate(template._id);
                                                            const dataStr = JSON.stringify(response.data.data.template, null, 2);
                                                            const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                                            const url = URL.createObjectURL(dataBlob);
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.download = `${template.name.replace(/\s+/g, '_')}_template.json`;
                                                            link.click();
                                                            URL.revokeObjectURL(url);
                                                        } catch (err) {
                                                            console.error("Export failed:", err);
                                                            alert("Failed to export template");
                                                        }
                                                    }}
                                                    className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition"
                                                >
                                                    Export
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShareTemplateId(template._id);
                                                        setShowCoverLetterShare(true);
                                                    }}
                                                    className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition"
                                                >
                                                    Share
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                ));
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
