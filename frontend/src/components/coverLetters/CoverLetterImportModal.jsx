import React from 'react';
import Button from '../Button';

/**
 * Cover Letter Import Modal Component
 * Allows users to import cover letter text and create a template from it
 */
export default function CoverLetterImportModal({
    showCoverLetterImport,
    setShowCoverLetterImport,
    importCoverLetterJson,
    setImportCoverLetterJson,
    customCoverLetterName,
    setCustomCoverLetterName,
    authWrap,
    createCoverLetterTemplate,
    loadCoverLetterTemplates
}) {
    if (!showCoverLetterImport) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
            onClick={() => setShowCoverLetterImport(false)}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                            Import Cover Letter Template
                        </h2>
                        <button
                            onClick={() => setShowCoverLetterImport(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-4">
                            Paste your cover letter text below. We'll create a template from it.
                        </p>
                        <textarea
                            className="w-full h-64 p-4 border border-gray-300 rounded-lg text-sm"
                            value={importCoverLetterJson}
                            onChange={(e) => setImportCoverLetterJson(e.target.value)}
                            placeholder="Dear Hiring Manager,&#10;&#10;I am writing to express my interest in...&#10;&#10;Paste your cover letter text here and we'll create a template from it."
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Template Name (Optional)
                        </label>
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg"
                            value={customCoverLetterName}
                            onChange={(e) => setCustomCoverLetterName(e.target.value)}
                            placeholder="e.g., My Marketing Cover Letter"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowCoverLetterImport(false);
                                setImportCoverLetterJson('');
                                setCustomCoverLetterName('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={async () => {
                                try {
                                    if (!importCoverLetterJson.trim()) {
                                        alert("Please paste your cover letter text.");
                                        return;
                                    }

                                    await authWrap();

                                    // Create template from plain text
                                    const templateName = customCoverLetterName.trim() || 'Imported Cover Letter';
                                    await createCoverLetterTemplate({
                                        name: templateName,
                                        industry: 'general',
                                        style: 'formal',
                                        description: 'Imported from text',
                                        content: importCoverLetterJson.trim(),
                                        isTemplate: true  // Import as a reusable template
                                    });

                                    setShowCoverLetterImport(false);
                                    setImportCoverLetterJson('');
                                    setCustomCoverLetterName('');
                                    await loadCoverLetterTemplates();
                                    alert("Cover letter template imported successfully!");
                                } catch (err) {
                                    console.error("Import failed:", err);
                                    alert("Failed to import cover letter. Please try again.");
                                }
                            }}
                        >
                            Import Template
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
