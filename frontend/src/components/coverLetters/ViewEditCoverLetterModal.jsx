import React from 'react';
import Button from '../Button';
import CoverLetterEditor from '../CoverLetterEditor';
import {
    TONE_OPTIONS,
    validateToneConsistency
} from '../../utils/coverLetterToneConfig';

/**
 * View/Edit Cover Letter Modal Component
 * Handles viewing and editing of cover letters with AI regeneration support
 */
export default function ViewEditCoverLetterModal({
    showViewCoverLetterModal,
    setShowViewCoverLetterModal,
    viewingCoverLetter,
    setViewingCoverLetter,
    isCoverLetterEditMode,
    setIsCoverLetterEditMode,
    customCoverLetterName,
    setCustomCoverLetterName,
    customCoverLetterStyle,
    setCustomCoverLetterStyle,
    customCoverLetterContent,
    setCustomCoverLetterContent,
    formatCoverLetterContent,
    setExportingCoverLetter,
    setShowCoverLetterExportModal,
    editingCoverLetter,
    setEditingCoverLetter,
    selectedJobForRegeneration,
    setSelectedJobForRegeneration,
    jobs,
    loadJobs,
    aiIndustry,
    aiCompanyCulture,
    aiConsistencyWarnings,
    setAiConsistencyWarnings,
    isGeneratingAI,
    setIsGeneratingAI,
    authWrap,
    generateAICoverLetter,
    aiLength,
    aiWritingStyle,
    editorContentKey,
    setEditorContentKey,
    apiUpdateCoverLetter,
    loadSavedCoverLetters,
    onViewLinkedJobs
}) {
    if (!showViewCoverLetterModal || !viewingCoverLetter) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
            onClick={() => {
                setShowViewCoverLetterModal(false);
                setIsCoverLetterEditMode(false);
            }}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                            {isCoverLetterEditMode ? 'Edit Cover Letter' : 'View Cover Letter'}
                        </h2>
                        <div className="flex items-center gap-3">
                            {/* View Linked Jobs Button */}
                            <button
                                onClick={() => onViewLinkedJobs && onViewLinkedJobs(viewingCoverLetter)}
                                className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex items-center gap-2 border border-blue-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                View Linked Jobs
                            </button>
                            {!isCoverLetterEditMode && (
                                <button
                                    onClick={async () => {
                                        setEditingCoverLetter(viewingCoverLetter);
                                        setIsCoverLetterEditMode(true);
                                        // Initialize selected job for regeneration
                                        setSelectedJobForRegeneration(viewingCoverLetter?.jobId || '');
                                        // Ensure jobs are loaded
                                        if (jobs.length === 0) {
                                            await loadJobs();
                                        }
                                    }}
                                    className="px-4 py-2 text-white rounded-lg transition flex items-center gap-2"
                                    style={{ backgroundColor: '#777C6D' }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setShowViewCoverLetterModal(false);
                                    setIsCoverLetterEditMode(false);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {!isCoverLetterEditMode ? (
                        /* VIEW MODE */
                        <>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cover Letter Name
                                </label>
                                <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50">
                                    {customCoverLetterName}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cover Letter Style
                                </label>
                                <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 capitalize">
                                    {customCoverLetterStyle}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cover Letter Content
                                </label>
                                <div
                                    className="cover-letter-content w-full p-4 border border-gray-300 rounded-lg bg-gray-50 min-h-[400px]"
                                    dangerouslySetInnerHTML={{ __html: formatCoverLetterContent(customCoverLetterContent) }}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowViewCoverLetterModal(false);
                                        setIsCoverLetterEditMode(false);
                                    }}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setExportingCoverLetter(viewingCoverLetter);
                                        setShowCoverLetterExportModal(true);
                                    }}
                                    className="px-6 py-2 text-white rounded-lg transition flex items-center gap-2"
                                    style={{ backgroundColor: '#4F5348' }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3a3d34'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4F5348'}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export
                                </button>
                            </div>
                        </>
                    ) : (
                        /* EDIT MODE */
                        <>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cover Letter Name
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                    value={customCoverLetterName}
                                    onChange={(e) => setCustomCoverLetterName(e.target.value)}
                                    placeholder="e.g., My Software Engineer Cover Letter"
                                />
                            </div>

                            {/* Tone Adjustment and Regeneration */}
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Adjust Tone
                                            </label>
                                            <select
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={customCoverLetterStyle}
                                                onChange={(e) => {
                                                    setCustomCoverLetterStyle(e.target.value);
                                                    // Update warnings when tone changes (if we have industry/culture info)
                                                    if (selectedJobForRegeneration || viewingCoverLetter?.jobId) {
                                                        const warnings = validateToneConsistency(e.target.value, aiIndustry, aiCompanyCulture);
                                                        setAiConsistencyWarnings(warnings);
                                                    }
                                                }}
                                            >
                                                {TONE_OPTIONS.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label} - {option.description}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Select Job for Regeneration *
                                            </label>
                                            <select
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={selectedJobForRegeneration || viewingCoverLetter?.jobId || ''}
                                                onChange={(e) => {
                                                    setSelectedJobForRegeneration(e.target.value);
                                                    // Update warnings when job changes
                                                    if (e.target.value) {
                                                        const selectedJob = jobs.find(j => j._id === e.target.value);
                                                        if (selectedJob) {
                                                            const warnings = validateToneConsistency(customCoverLetterStyle, aiIndustry, aiCompanyCulture);
                                                            setAiConsistencyWarnings(warnings);
                                                        }
                                                    }
                                                }}
                                            >
                                                <option value="">Select a job...</option>
                                                {jobs.filter(job => !job.archived).map(job => (
                                                    <option key={job._id} value={job._id}>
                                                        {job.title} at {job.company}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            variant="primary"
                                            onClick={async () => {
                                                const jobIdToUse = selectedJobForRegeneration || viewingCoverLetter?.jobId;

                                                if (!jobIdToUse) {
                                                    alert('Please select a job to regenerate the cover letter for.');
                                                    return;
                                                }

                                                try {
                                                    setIsGeneratingAI(true);
                                                    await authWrap();

                                                    const response = await generateAICoverLetter({
                                                        jobId: jobIdToUse,
                                                        tone: customCoverLetterStyle,
                                                        variationCount: 1,
                                                        industry: aiIndustry || 'general',
                                                        companyCulture: aiCompanyCulture || 'corporate',
                                                        length: aiLength || 'standard',
                                                        writingStyle: aiWritingStyle || 'hybrid',
                                                        customInstructions: ''
                                                    });

                                                    if (response.data.data.variations && response.data.data.variations.length > 0) {
                                                        // Update the content with the regenerated version
                                                        const newContent = response.data.data.variations[0].content;
                                                        setCustomCoverLetterContent(newContent);
                                                        // Force editor to re-render with new content
                                                        setEditorContentKey(prev => prev + 1);
                                                        alert('Cover letter regenerated with new tone! Review the changes and click Save to update.');
                                                    }
                                                } catch (err) {
                                                    console.error('Regeneration failed:', err);
                                                    alert(err.response?.data?.message || 'Failed to regenerate cover letter. Please ensure your profile has work experience and try again.');
                                                } finally {
                                                    setIsGeneratingAI(false);
                                                }
                                            }}
                                            disabled={isGeneratingAI || (!selectedJobForRegeneration && !viewingCoverLetter?.jobId)}
                                        >
                                            {isGeneratingAI ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 mr-2 inline-block" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Regenerating...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    Regenerate with New Tone
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                {aiConsistencyWarnings.length > 0 && (selectedJobForRegeneration || viewingCoverLetter?.jobId) && (
                                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                                        {aiConsistencyWarnings.map((warning, idx) => (
                                            <p key={idx} className="text-xs text-amber-800 mb-1 last:mb-0">
                                                {warning}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cover Letter Content
                                </label>
                                <CoverLetterEditor
                                    key={editorContentKey}
                                    initialContent={formatCoverLetterContent(customCoverLetterContent)}
                                    onChange={(content) => setCustomCoverLetterContent(content)}
                                    coverLetterId={editingCoverLetter._id}
                                    onSave={async (content) => {
                                        setCustomCoverLetterContent(content);
                                    }}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        // Restore original values
                                        setCustomCoverLetterName(viewingCoverLetter.name);
                                        setCustomCoverLetterContent(viewingCoverLetter.content);
                                        setCustomCoverLetterStyle(viewingCoverLetter.style || 'formal');
                                        setIsCoverLetterEditMode(false);
                                    }}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            if (!customCoverLetterName.trim()) {
                                                alert("Please enter a name for your cover letter.");
                                                return;
                                            }
                                            if (!customCoverLetterContent.trim()) {
                                                alert("Please enter cover letter content.");
                                                return;
                                            }

                                            await authWrap();
                                            await apiUpdateCoverLetter(editingCoverLetter._id, {
                                                name: customCoverLetterName,
                                                content: customCoverLetterContent,
                                                style: customCoverLetterStyle
                                            });

                                            // Update the viewing cover letter with new data
                                            setViewingCoverLetter({
                                                ...viewingCoverLetter,
                                                name: customCoverLetterName,
                                                content: customCoverLetterContent,
                                                style: customCoverLetterStyle
                                            });

                                            setIsCoverLetterEditMode(false);
                                            setEditingCoverLetter(null);

                                            await loadSavedCoverLetters();
                                            alert("Cover letter updated successfully!");
                                        } catch (err) {
                                            console.error("Update failed:", err);
                                            alert("Failed to update cover letter. Please try again.");
                                        }
                                    }}
                                    className="px-6 py-2 text-white rounded-lg transition"
                                    style={{ backgroundColor: '#777C6D' }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
