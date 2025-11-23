import React from 'react';

/**
 * Skills Optimization Modal Component
 * Displays AI-powered skills recommendations and allows users to select skills to add to their resume
 */
export default function SkillsOptimizationModal({
    showSkillsOptimization,
    setShowSkillsOptimization,
    skillsOptimizationData,
    showSkillsSuccessBanner,
    currentResumeSkills,
    handleRemoveSkill,
    selectedSkillsToAdd,
    toggleSkillSelection,
    setSelectedSkillsToAdd,
    isApplyingSkills,
    handleApplySkillChanges,
    viewingResume
}) {
    if (!showSkillsOptimization || !skillsOptimizationData) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setShowSkillsOptimization(false)}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="bg-[#777C6D] px-6 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-heading font-bold text-white">AI Skills Optimization</h3>
                        </div>
                        <button
                            onClick={() => setShowSkillsOptimization(false)}
                            className="text-white hover:text-gray-200 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Success Banner */}
                {showSkillsSuccessBanner && (
                    <div className="bg-green-50 border-l-4 border-green-500 px-6 py-4 mx-6 mt-4 rounded-r-lg animate-fade-in">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-semibold text-green-900">Skills Updated Successfully!</p>
                                <p className="text-sm text-green-700">Your resume has been updated with the selected skills. Returning to resume view...</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                    {/* Match Score */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">Skills Match Score</h4>
                                <p className="text-sm text-gray-600">{skillsOptimizationData.optimization?.summary || 'Your skills alignment with this job'}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold text-[#4F5348]">
                                    {skillsOptimizationData.optimization?.matchScore || 0}%
                                </div>
                                <div className="text-sm text-gray-600 mt-1">Match Rate</div>
                            </div>
                        </div>
                    </div>

                    {/* Current Resume Skills */}
                    <div className="bg-white rounded-lg border-2 border-gray-300 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Current Skills in Resume
                            </h4>
                            <span className="text-sm text-gray-500">{currentResumeSkills.length} skills</span>
                        </div>
                        {currentResumeSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {currentResumeSkills.map((skill, idx) => (
                                    <div
                                        key={idx}
                                        className="group px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm border border-gray-300 flex items-center gap-2"
                                    >
                                        <span>{skill}</span>
                                        <button
                                            onClick={() => handleRemoveSkill(skill)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800"
                                            title="Remove skill"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No skills in resume yet. Add skills from recommendations below.</p>
                        )}
                    </div>

                    {/* Technical Skills */}
                    {skillsOptimizationData.optimization?.technicalSkills?.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                            <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Technical</span>
                                Recommended Technical Skills
                            </h4>
                            <p className="text-xs text-gray-600 mb-3">Click to select skills to add to your resume</p>
                            <div className="flex flex-wrap gap-2">
                                {skillsOptimizationData.optimization.technicalSkills.map((skill, idx) => {
                                    const isInResume = currentResumeSkills.includes(skill);
                                    const isSelected = selectedSkillsToAdd.includes(skill);

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => !isInResume && toggleSkillSelection(skill)}
                                            disabled={isInResume}
                                            className={`px-3 py-1.5 rounded-full text-sm border transition-all flex items-center gap-2 ${isInResume
                                                ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer'
                                                }`}
                                        >
                                            {isSelected && (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <span>{skill}</span>
                                            {isInResume && <span className="text-xs">✓ In Resume</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Soft Skills */}
                    {skillsOptimizationData.optimization?.softSkills?.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                            <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Soft Skills</span>
                                Recommended Soft Skills
                            </h4>
                            <p className="text-xs text-gray-600 mb-3">Click to select skills to add to your resume</p>
                            <div className="flex flex-wrap gap-2">
                                {skillsOptimizationData.optimization.softSkills.map((skill, idx) => {
                                    const isInResume = currentResumeSkills.includes(skill);
                                    const isSelected = selectedSkillsToAdd.includes(skill);

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => !isInResume && toggleSkillSelection(skill)}
                                            disabled={isInResume}
                                            className={`px-3 py-1.5 rounded-full text-sm border transition-all flex items-center gap-2 ${isInResume
                                                ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 cursor-pointer'
                                                }`}
                                        >
                                            {isSelected && (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <span>{skill}</span>
                                            {isInResume && <span className="text-xs">✓ In Resume</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Missing Skills */}
                    {skillsOptimizationData.optimization?.missingSkills?.length > 0 && (
                        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-5">
                            <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Skill Gaps Detected
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">
                                These skills are mentioned in the job posting but missing from your resume:
                            </p>
                            <div className="space-y-2">
                                {skillsOptimizationData.optimization.missingSkills.map((skill, idx) => {
                                    // Handle both string and object formats
                                    const skillName = typeof skill === 'string' ? skill : skill.name;
                                    const importance = skill.importance || null;
                                    const suggestion = skill.suggestion || null;

                                    return (
                                        <div
                                            key={idx}
                                            className="bg-white rounded-lg p-3 border border-yellow-300"
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium uppercase">
                                                    {importance || 'Important'}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-900">{skillName}</div>
                                                    {suggestion && (
                                                        <p className="text-sm text-gray-600 mt-1">{suggestion}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Skills to Emphasize */}
                    {skillsOptimizationData.optimization?.skillsToEmphasize?.length > 0 && (
                        <div className="bg-green-50 rounded-lg border border-green-200 p-5">
                            <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Skills to Emphasize
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">
                                You already have these skills - make sure they're prominent in your resume:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {skillsOptimizationData.optimization.skillsToEmphasize.map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 bg-white text-green-800 rounded-full text-sm border border-green-300 font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Industry Recommendations */}
                    {skillsOptimizationData.optimization?.industryRecommendations?.length > 0 && (
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                            <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                </svg>
                                Industry-Specific Recommendations
                            </h4>
                            <div className="space-y-2">
                                {skillsOptimizationData.optimization.industryRecommendations.map((rec, idx) => {
                                    // Handle both string and object formats
                                    const skillName = typeof rec === 'string' ? rec : (rec.skill || rec.name);
                                    const reason = rec.reason || null;

                                    return (
                                        <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="flex items-start gap-2">
                                                <span className="text-blue-500 mt-1 text-lg">💡</span>
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{skillName}</div>
                                                    {reason && (
                                                        <p className="text-sm text-gray-600 mt-1">{reason}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Actions */}
                <div className="bg-gray-50 px-6 py-4 border-t sticky bottom-0">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="text-sm">
                                <span className="font-medium text-gray-900">{selectedSkillsToAdd.length}</span>
                                <span className="text-gray-600"> skills selected</span>
                            </div>
                            {selectedSkillsToAdd.length > 0 && (
                                <button
                                    onClick={() => setSelectedSkillsToAdd([])}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                    Clear selection
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSkillsOptimization(false)}
                                disabled={isApplyingSkills}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleApplySkillChanges}
                                disabled={isApplyingSkills || (selectedSkillsToAdd.length === 0 && currentResumeSkills.length === (viewingResume?.sections?.skills?.length || 0))}
                                className="px-6 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isApplyingSkills ? (
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
                        💡 Click skills to select, then click "Apply Changes" to update your resume
                    </p>
                </div>
            </div>
        </div>
    );
}
