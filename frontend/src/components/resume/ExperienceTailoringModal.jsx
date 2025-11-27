import React from 'react';

const ExperienceTailoringModal = ({
    showExperienceTailoring,
    setShowExperienceTailoring,
    experienceTailoringData,
    showExperienceSuccessBanner,
    selectedExperienceVariations,
    setSelectedExperienceVariations,
    toggleExperienceVariation,
    isApplyingExperience,
    handleApplyExperienceChanges
}) => {
    if (!showExperienceTailoring || !experienceTailoringData) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setShowExperienceTailoring(false)}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="bg-[#777C6D] px-6 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <h3 className="text-xl font-heading font-bold text-white">AI Experience Tailoring</h3>
                        </div>
                        <button
                            onClick={() => setShowExperienceTailoring(false)}
                            className="text-white hover:text-gray-200 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Success Banner */}
                {showExperienceSuccessBanner && (
                    <div className="bg-green-50 border-l-4 border-green-500 px-6 py-4 mx-6 mt-4 rounded-r-lg animate-fade-in">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-semibold text-green-900">Experience Updated Successfully!</p>
                                <p className="text-sm text-green-700">Your resume has been updated with the selected variations. Returning to resume view...</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                    {/* Summary */}
                    {experienceTailoringData.tailoring?.summary && (
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
                            <p className="text-gray-800">{experienceTailoringData.tailoring.summary}</p>
                        </div>
                    )}

                    {/* Experience Suggestions */}
                    {experienceTailoringData.tailoring?.experiences?.map((exp, expIdx) => (
                        <div key={expIdx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-md font-semibold text-gray-900">
                                        Experience #{exp.experienceIndex + 1}
                                    </h4>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${exp.relevanceScore >= 80 ? 'bg-green-100 text-green-800' :
                                        exp.relevanceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {exp.relevanceScore}% Relevant
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                {exp.bullets?.map((bullet, bulletIdx) => (
                                    <div key={bulletIdx} className="border-l-4 border-purple-300 pl-4 space-y-3">
                                        {/* Original */}
                                        <div>
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Original</div>
                                            <p className="text-sm text-gray-700">{bullet.originalBullet}</p>
                                        </div>

                                        {/* Variations */}
                                        {bullet.variations && (
                                            <div className="space-y-2">
                                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                    AI-Generated Variations (Click to Select)
                                                </div>

                                                {/* Original Option */}
                                                <button
                                                    onClick={() => {
                                                        const key = `${expIdx}-${bulletIdx}`;
                                                        if (selectedExperienceVariations[key]) {
                                                            const newSelections = { ...selectedExperienceVariations };
                                                            delete newSelections[key];
                                                            setSelectedExperienceVariations(newSelections);
                                                        } else {
                                                            setSelectedExperienceVariations(prev => ({ ...prev, [key]: 'original' }));
                                                        }
                                                    }}
                                                    className={`w-full text-left bg-gray-50 rounded p-3 border-2 transition cursor-pointer ${!selectedExperienceVariations[`${expIdx}-${bulletIdx}`] || selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'original'
                                                        ? 'border-gray-400 bg-gray-100'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`variation-${expIdx}-${bulletIdx}`}
                                                            checked={!selectedExperienceVariations[`${expIdx}-${bulletIdx}`] || selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'original'}
                                                            onChange={() => { }}
                                                            className="mt-1"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="text-xs font-medium text-gray-700 mb-1">✨ Keep Original</div>
                                                            <p className="text-sm text-gray-700">{bullet.originalBullet}</p>
                                                        </div>
                                                    </div>
                                                </button>

                                                {bullet.variations.achievement && (
                                                    <button
                                                        onClick={() => toggleExperienceVariation(expIdx, bulletIdx, 'achievement')}
                                                        className={`w-full text-left bg-blue-50 rounded p-3 border-2 transition cursor-pointer ${selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'achievement'
                                                            ? 'border-blue-600 bg-blue-100 shadow-md'
                                                            : 'border-blue-200 hover:border-blue-400'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <input
                                                                type="radio"
                                                                name={`variation-${expIdx}-${bulletIdx}`}
                                                                checked={selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'achievement'}
                                                                onChange={() => { }}
                                                                className="mt-1"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="text-xs font-medium text-blue-800 mb-1">🏆 Achievement-Focused</div>
                                                                <p className="text-sm text-gray-800">{bullet.variations.achievement}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                )}

                                                {bullet.variations.technical && (
                                                    <button
                                                        onClick={() => toggleExperienceVariation(expIdx, bulletIdx, 'technical')}
                                                        className={`w-full text-left bg-green-50 rounded p-3 border-2 transition cursor-pointer ${selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'technical'
                                                            ? 'border-green-600 bg-green-100 shadow-md'
                                                            : 'border-green-200 hover:border-green-400'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <input
                                                                type="radio"
                                                                name={`variation-${expIdx}-${bulletIdx}`}
                                                                checked={selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'technical'}
                                                                onChange={() => { }}
                                                                className="mt-1"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="text-xs font-medium text-green-800 mb-1">⚙️ Technical-Focused</div>
                                                                <p className="text-sm text-gray-800">{bullet.variations.technical}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                )}

                                                {bullet.variations.impact && (
                                                    <button
                                                        onClick={() => toggleExperienceVariation(expIdx, bulletIdx, 'impact')}
                                                        className={`w-full text-left bg-purple-50 rounded p-3 border-2 transition cursor-pointer ${selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'impact'
                                                            ? 'border-purple-600 bg-purple-100 shadow-md'
                                                            : 'border-purple-200 hover:border-purple-400'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <input
                                                                type="radio"
                                                                name={`variation-${expIdx}-${bulletIdx}`}
                                                                checked={selectedExperienceVariations[`${expIdx}-${bulletIdx}`] === 'impact'}
                                                                onChange={() => { }}
                                                                className="mt-1"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="text-xs font-medium text-purple-800 mb-1">📈 Impact-Focused</div>
                                                                <p className="text-sm text-gray-800">{bullet.variations.impact}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Suggestions */}
                                        {(bullet.suggestedActionVerbs?.length > 0 || bullet.keywordsToAdd?.length > 0) && (
                                            <div className="flex gap-4 pt-2">
                                                {bullet.suggestedActionVerbs?.length > 0 && (
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-600 mb-1">Suggested Verbs:</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {bullet.suggestedActionVerbs.map((verb, vIdx) => (
                                                                <span key={vIdx} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                                                                    {verb}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {bullet.keywordsToAdd?.length > 0 && (
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-600 mb-1">Keywords to Add:</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {bullet.keywordsToAdd.map((keyword, kIdx) => (
                                                                <span key={kIdx} className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">
                                                                    {keyword}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal Actions */}
                <div className="bg-gray-50 px-6 py-4 border-t sticky bottom-0">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="text-sm">
                                <span className="font-medium text-gray-900">{Object.keys(selectedExperienceVariations).length}</span>
                                <span className="text-gray-600"> bullets selected for update</span>
                            </div>
                            {Object.keys(selectedExperienceVariations).length > 0 && (
                                <button
                                    onClick={() => setSelectedExperienceVariations({})}
                                    className="text-xs text-purple-600 hover:text-purple-800 underline"
                                >
                                    Clear selections
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowExperienceTailoring(false)}
                                disabled={isApplyingExperience}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleApplyExperienceChanges}
                                disabled={isApplyingExperience || Object.keys(selectedExperienceVariations).length === 0}
                                className="px-6 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isApplyingExperience ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Applying...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Apply Changes to Resume</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        💡 Select your preferred variation for each bullet, then click "Apply Changes" to update your resume
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExperienceTailoringModal;
