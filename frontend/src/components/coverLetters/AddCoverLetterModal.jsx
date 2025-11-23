import React from 'react';
import Button from '../Button';

/**
 * Add Cover Letter Modal Component
 * Displays options for creating a new cover letter (template, AI, or from scratch)
 */
export default function AddCoverLetterModal({
    showAddCoverLetterModal,
    setShowAddCoverLetterModal,
    loadCoverLetterTemplates,
    setShowCoverLetterBrowser,
    setAiJobId,
    setAiTone,
    setAiIndustry,
    setAiCompanyCulture,
    setAiLength,
    setAiWritingStyle,
    setAiCustomInstructions,
    setAiVariationCount,
    setAiGeneratedVariations,
    setAiGenerationError,
    setAiConsistencyWarnings,
    setSelectedAIVariation,
    setShowAdvancedOptions,
    loadJobs,
    setShowAICoverLetterModal,
    setSelectedCoverLetterTemplate,
    setCustomCoverLetterName,
    setCustomCoverLetterContent,
    setCustomCoverLetterStyle,
    setIsCreatingCoverLetterTemplate,
    setShowCoverLetterCustomize
}) {
    if (!showAddCoverLetterModal) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
            onClick={() => setShowAddCoverLetterModal(false)}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-lg w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                                Create Cover Letter
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Choose how you want to create your cover letter
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddCoverLetterModal(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Option 1: Select Template */}
                        <button
                            onClick={() => {
                                setShowAddCoverLetterModal(false);
                                loadCoverLetterTemplates();
                                setShowCoverLetterBrowser(true);
                            }}
                            className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-[#777C6D] hover:bg-gray-50 transition text-left"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg" style={{ backgroundColor: "#E8EAE3" }}>
                                    <svg className="w-6 h-6" style={{ color: "#4F5348" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2" style={{ color: "#4F5348" }}>
                                        Use a Template
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Choose from professional templates designed for different industries and styles
                                    </p>
                                    <ul className="text-xs text-gray-500 space-y-1">
                                        <li>• 5 professional writing styles</li>
                                        <li>• Industry-specific guidance</li>
                                        <li>• Customizable placeholders</li>
                                    </ul>
                                </div>
                            </div>
                        </button>

                        {/* Option 2: AI Generate */}
                        <button
                            onClick={async () => {
                                setShowAddCoverLetterModal(false);
                                // Reset AI state
                                setAiJobId('');
                                setAiTone('formal');
                                setAiIndustry('general');
                                setAiCompanyCulture('corporate');
                                setAiLength('standard');
                                setAiWritingStyle('hybrid');
                                setAiCustomInstructions('');
                                setAiVariationCount(1);
                                setAiGeneratedVariations([]);
                                setAiGenerationError('');
                                setAiConsistencyWarnings([]);
                                setSelectedAIVariation(0);
                                setShowAdvancedOptions(false);
                                // Load jobs for the dropdown
                                await loadJobs();
                                setShowAICoverLetterModal(true);
                            }}
                            className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-[#777C6D] hover:bg-gray-50 transition text-left"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-lg" style={{ color: "#4F5348" }}>
                                            AI Generate
                                        </h3>
                                        <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full">
                                            NEW
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Let AI create a personalized cover letter based on the job posting and your profile
                                    </p>
                                    <ul className="text-xs text-gray-500 space-y-1">
                                        <li>• Personalized content for any job</li>
                                        <li>• Highlights relevant experience</li>
                                        <li>• Multiple variations available</li>
                                        <li>• Company culture analysis</li>
                                    </ul>
                                </div>
                            </div>
                        </button>

                        {/* Option 3: Create from Scratch */}
                        <button
                            onClick={() => {
                                setShowAddCoverLetterModal(false);
                                setSelectedCoverLetterTemplate({
                                    name: 'New Cover Letter',
                                    industry: 'general',
                                    style: 'formal',
                                    content: '',
                                    description: ''
                                });
                                setCustomCoverLetterName('My Cover Letter');
                                setCustomCoverLetterContent('');
                                setCustomCoverLetterStyle('formal');
                                setIsCreatingCoverLetterTemplate(false); // Creating a cover letter, not a template
                                setShowCoverLetterCustomize(true);
                            }}
                            className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-[#777C6D] hover:bg-gray-50 transition text-left"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg" style={{ backgroundColor: "#E8EAE3" }}>
                                    <svg className="w-6 h-6" style={{ color: "#4F5348" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2" style={{ color: "#4F5348" }}>
                                        Create from Scratch
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Start with a blank canvas and write your own custom cover letter
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => setShowAddCoverLetterModal(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
