import React from 'react';
import Button from '../Button';
import {
    TONE_OPTIONS,
    INDUSTRY_OPTIONS,
    COMPANY_CULTURE_OPTIONS,
    LENGTH_OPTIONS,
    WRITING_STYLE_OPTIONS,
    validateToneConsistency,
    getRecommendedSettings
} from '../../utils/coverLetterToneConfig';

/**
 * AI Cover Letter Generation Modal Component
 * Handles the generation of AI-powered cover letters based on job postings
 */
export default function AICoverLetterModal({
    showAICoverLetterModal,
    setShowAICoverLetterModal,
    isGeneratingAI,
    setIsGeneratingAI,
    aiJobId,
    setAiJobId,
    aiTone,
    setAiTone,
    aiIndustry,
    setAiIndustry,
    aiCompanyCulture,
    setAiCompanyCulture,
    aiLength,
    setAiLength,
    aiWritingStyle,
    setAiWritingStyle,
    aiCustomInstructions,
    setAiCustomInstructions,
    aiVariationCount,
    setAiVariationCount,
    aiGeneratedVariations,
    setAiGeneratedVariations,
    selectedAIVariation,
    setSelectedAIVariation,
    aiGenerationError,
    setAiGenerationError,
    aiConsistencyWarnings,
    setAiConsistencyWarnings,
    showAdvancedOptions,
    setShowAdvancedOptions,
    jobs,
    authWrap,
    generateAICoverLetter,
    createCoverLetter,
    loadSavedCoverLetters,
    setCoverLetterSuccessMessage,
    setAiCompanyName,
    setAiPosition,
    setAiJobDescription,
    setCultureAnalysis
}) {
    if (!showAICoverLetterModal) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
            onClick={() => !isGeneratingAI && setShowAICoverLetterModal(false)}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                                    AI Cover Letter Generator
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Generate personalized cover letters based on job postings
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => !isGeneratingAI && setShowAICoverLetterModal(false)}
                            disabled={isGeneratingAI}
                            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {!aiGeneratedVariations.length ? (
                        /* Input Form */
                        <div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Job to Tailor For *
                                </label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                    value={aiJobId}
                                    onChange={(e) => {
                                        setAiJobId(e.target.value);
                                        // Clear any previous errors when job is selected
                                        if (e.target.value) {
                                            setAiGenerationError('');

                                            // Auto-recommend settings based on job
                                            const selectedJob = jobs.find(j => j._id === e.target.value);
                                            if (selectedJob) {
                                                const recommendations = getRecommendedSettings(
                                                    selectedJob.title,
                                                    selectedJob.description,
                                                    selectedJob.company
                                                );

                                                // Apply recommendations
                                                setAiTone(recommendations.tone);
                                                setAiIndustry(recommendations.industry);
                                                setAiCompanyCulture(recommendations.companyCulture);
                                                setAiLength(recommendations.length);
                                                setAiWritingStyle(recommendations.writingStyle);

                                                // Update warnings
                                                const warnings = validateToneConsistency(
                                                    recommendations.tone,
                                                    recommendations.industry,
                                                    recommendations.companyCulture
                                                );
                                                setAiConsistencyWarnings(warnings);
                                            }
                                        }
                                    }}
                                    disabled={isGeneratingAI}
                                >
                                    <option value="">-- Select a job --</option>
                                    {jobs.map((job) => (
                                        <option key={job._id} value={job._id}>
                                            {job.title} at {job.company}
                                        </option>
                                    ))}
                                </select>
                                {!jobs.length && (
                                    <p className="text-sm text-orange-600 mt-2">
                                        ⚠️ You haven't added any jobs yet. Please add a job first to generate a cover letter.
                                    </p>
                                )}
                            </div>

                            {aiJobId && (
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <div>
                                            <p className="font-semibold text-blue-900 text-sm mb-1">Selected Job</p>
                                            <p className="text-blue-800 text-sm">
                                                <strong>{jobs.find(j => j._id === aiJobId)?.title}</strong> at{' '}
                                                <strong>{jobs.find(j => j._id === aiJobId)?.company}</strong>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tone and Style Configuration */}
                            <div className="space-y-4 mb-6">
                                {/* Tone Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Writing Tone *
                                    </label>
                                    <select
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={aiTone}
                                        onChange={(e) => {
                                            setAiTone(e.target.value);
                                            // Update warnings when tone changes
                                            const warnings = validateToneConsistency(e.target.value, aiIndustry, aiCompanyCulture);
                                            setAiConsistencyWarnings(warnings);
                                        }}
                                        disabled={isGeneratingAI}
                                    >
                                        {TONE_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label} - {option.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Industry Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Industry
                                    </label>
                                    <select
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={aiIndustry}
                                        onChange={(e) => {
                                            setAiIndustry(e.target.value);
                                            const warnings = validateToneConsistency(aiTone, e.target.value, aiCompanyCulture);
                                            setAiConsistencyWarnings(warnings);
                                        }}
                                        disabled={isGeneratingAI}
                                    >
                                        {INDUSTRY_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Company Culture Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Culture
                                    </label>
                                    <select
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={aiCompanyCulture}
                                        onChange={(e) => {
                                            setAiCompanyCulture(e.target.value);
                                            const warnings = validateToneConsistency(aiTone, aiIndustry, e.target.value);
                                            setAiConsistencyWarnings(warnings);
                                        }}
                                        disabled={isGeneratingAI}
                                    >
                                        {COMPANY_CULTURE_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label} - {option.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Consistency Warnings */}
                                {aiConsistencyWarnings.length > 0 && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        {aiConsistencyWarnings.map((warning, idx) => (
                                            <p key={idx} className="text-sm text-amber-800 mb-1 last:mb-0">
                                                {warning}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {/* Advanced Options Toggle */}
                                <button
                                    type="button"
                                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                    disabled={isGeneratingAI}
                                >
                                    <svg
                                        className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-90' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
                                </button>

                                {/* Advanced Options Panel */}
                                {showAdvancedOptions && (
                                    <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        {/* Length Selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Cover Letter Length
                                            </label>
                                            <select
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={aiLength}
                                                onChange={(e) => setAiLength(e.target.value)}
                                                disabled={isGeneratingAI}
                                            >
                                                {LENGTH_OPTIONS.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label} - {option.description}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Writing Style Selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Writing Style
                                            </label>
                                            <select
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={aiWritingStyle}
                                                onChange={(e) => setAiWritingStyle(e.target.value)}
                                                disabled={isGeneratingAI}
                                            >
                                                {WRITING_STYLE_OPTIONS.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label} - {option.description}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Custom Instructions */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Custom Instructions (Optional)
                                            </label>
                                            <textarea
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                                rows="3"
                                                placeholder="Any specific instructions or points to emphasize? (max 500 characters)"
                                                value={aiCustomInstructions}
                                                onChange={(e) => setAiCustomInstructions(e.target.value.slice(0, 500))}
                                                disabled={isGeneratingAI}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {aiCustomInstructions.length}/500 characters
                                            </p>
                                        </div>

                                        {/* Variation Count */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Number of Variations
                                            </label>
                                            <select
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={aiVariationCount}
                                                onChange={(e) => setAiVariationCount(Number(e.target.value))}
                                                disabled={isGeneratingAI}
                                            >
                                                <option value={1}>1 Variation</option>
                                                <option value={2}>2 Variations</option>
                                                <option value={3}>3 Variations</option>
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Generate multiple versions to choose from
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {aiGenerationError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800">{aiGenerationError}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowAICoverLetterModal(false)}
                                    disabled={isGeneratingAI}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={async () => {
                                        if (!aiJobId) {
                                            setAiGenerationError('Please select a job to generate a cover letter for');
                                            return;
                                        }

                                        try {
                                            setIsGeneratingAI(true);
                                            setAiGenerationError('');
                                            await authWrap();

                                            const response = await generateAICoverLetter({
                                                jobId: aiJobId,
                                                tone: aiTone,
                                                variationCount: aiVariationCount,
                                                industry: aiIndustry,
                                                companyCulture: aiCompanyCulture,
                                                length: aiLength,
                                                writingStyle: aiWritingStyle,
                                                customInstructions: aiCustomInstructions
                                            });

                                            setAiGeneratedVariations(response.data.data.variations);
                                            setSelectedAIVariation(0);
                                        } catch (err) {
                                            console.error('AI generation failed:', err);
                                            setAiGenerationError(err.response?.data?.message || 'Failed to generate cover letter. Please ensure your profile has work experience and try again.');
                                        } finally {
                                            setIsGeneratingAI(false);
                                        }
                                    }}
                                    disabled={isGeneratingAI || !aiJobId}
                                >
                                    {isGeneratingAI ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 mr-2 inline-block" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Researching company & generating...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Generate Cover Letter
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Results View */
                        <div>
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <p className="text-sm text-green-800 font-medium">
                                        Successfully generated {aiGeneratedVariations.length} variation{aiGeneratedVariations.length > 1 ? 's' : ''}!
                                    </p>
                                </div>
                            </div>

                            {/* Tone Adjustment and Regeneration */}
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Adjust Tone
                                        </label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={aiTone}
                                            onChange={(e) => {
                                                setAiTone(e.target.value);
                                                const warnings = validateToneConsistency(e.target.value, aiIndustry, aiCompanyCulture);
                                                setAiConsistencyWarnings(warnings);
                                            }}
                                        >
                                            {TONE_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label} - {option.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            variant="primary"
                                            onClick={async () => {
                                                if (!aiJobId) {
                                                    setAiGenerationError('Please select a job to regenerate for');
                                                    return;
                                                }

                                                try {
                                                    setIsGeneratingAI(true);
                                                    setAiGenerationError('');
                                                    await authWrap();

                                                    const response = await generateAICoverLetter({
                                                        jobId: aiJobId,
                                                        tone: aiTone,
                                                        variationCount: aiVariationCount,
                                                        industry: aiIndustry,
                                                        companyCulture: aiCompanyCulture,
                                                        length: aiLength,
                                                        writingStyle: aiWritingStyle,
                                                        customInstructions: aiCustomInstructions
                                                    });

                                                    setAiGeneratedVariations(response.data.data.variations);
                                                    setSelectedAIVariation(0);
                                                } catch (err) {
                                                    console.error('Regeneration failed:', err);
                                                    setAiGenerationError(err.response?.data?.message || 'Failed to regenerate cover letter. Please try again.');
                                                } finally {
                                                    setIsGeneratingAI(false);
                                                }
                                            }}
                                            disabled={isGeneratingAI || !aiJobId}
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
                                {aiConsistencyWarnings.length > 0 && (
                                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                                        {aiConsistencyWarnings.map((warning, idx) => (
                                            <p key={idx} className="text-xs text-amber-800 mb-1 last:mb-0">
                                                {warning}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {aiVariationCount > 1 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Variation
                                    </label>
                                    <div className="flex gap-2">
                                        {aiGeneratedVariations.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedAIVariation(index)}
                                                className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${selectedAIVariation === index
                                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                            >
                                                Variation {index + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mb-6">
                                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                        {aiGeneratedVariations[selectedAIVariation]?.content}
                                    </pre>
                                </div>
                            </div>

                            <div className="flex justify-between gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setAiGeneratedVariations([]);
                                        setSelectedAIVariation(0);
                                    }}
                                >
                                    ← Generate Another
                                </Button>
                                <div className="flex gap-3">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setShowAICoverLetterModal(false);
                                            setAiGeneratedVariations([]);
                                            setAiCompanyName('');
                                            setAiPosition('');
                                            setAiJobDescription('');
                                            setCultureAnalysis(null);
                                        }}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={async () => {
                                            try {
                                                await authWrap();
                                                const selectedContent = aiGeneratedVariations[selectedAIVariation].content;

                                                // Validate content is not empty
                                                if (!selectedContent || !selectedContent.trim()) {
                                                    alert('Selected cover letter content is empty. Please try generating again.');
                                                    return;
                                                }

                                                // Find the selected job to get company and position
                                                const selectedJob = jobs.find(j => j._id === aiJobId);
                                                const coverLetterName = selectedJob
                                                    ? `${selectedJob.title} at ${selectedJob.company}`
                                                    : 'AI Generated Cover Letter';

                                                const response = await createCoverLetter({
                                                    name: coverLetterName,
                                                    content: selectedContent,
                                                    style: aiTone,
                                                    templateId: null
                                                });

                                                if (response && response.data && response.data.success) {
                                                    setShowAICoverLetterModal(false);
                                                    setAiGeneratedVariations([]);
                                                    setAiJobId('');

                                                    await loadSavedCoverLetters();
                                                    setCoverLetterSuccessMessage('AI-generated cover letter saved successfully!');
                                                    setTimeout(() => setCoverLetterSuccessMessage(null), 3000);
                                                } else {
                                                    throw new Error('Unexpected response format');
                                                }
                                            } catch (err) {
                                                console.error('Save failed:', err);
                                                const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
                                                alert(`Failed to save cover letter: ${errorMessage}. Please try again.`);
                                            }
                                        }}
                                    >
                                        Save Cover Letter
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
