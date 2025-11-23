import React from 'react';

/**
 * Merge Resume Modal Component
 * Allows users to selectively merge sections from one resume into another
 */
export default function MergeResumeModal({
    showMergeModal,
    setShowMergeModal,
    comparisonData,
    viewingResume,
    selectedMergeChanges,
    setSelectedMergeChanges,
    isMerging,
    handleMergeResumes
}) {
    if (!showMergeModal || !comparisonData || !viewingResume) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
            onClick={() => {
                setShowMergeModal(false);
                setSelectedMergeChanges([]);
            }}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="bg-[#777C6D] border-b px-6 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <h3 className="text-xl font-heading font-bold text-white">Merge Resume Changes</h3>
                        </div>
                        <button
                            onClick={() => {
                                setShowMergeModal(false);
                                setSelectedMergeChanges([]);
                            }}
                            className="text-white hover:text-gray-200 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                    {/* Merge Direction Indicator */}
                    <div className="bg-[#f7f6f2] border border-[#e6e6e1] rounded-lg p-4">
                        <div className="flex items-center justify-center gap-4">
                            <div className="text-center">
                                <div className="font-semibold text-purple-900">{comparisonData.resume2.name}</div>
                                <div className="text-xs text-[#4F5348]">Source</div>
                            </div>
                            <svg className="w-8 h-8 text-[#4F5348]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            <div className="text-center">
                                <div className="font-semibold text-purple-900">{comparisonData.resume1.name}</div>
                                <div className="text-xs text-[#4F5348]">Target (current)</div>
                            </div>
                        </div>
                        <p className="text-sm text-purple-700 text-center mt-3">
                            Select which sections to copy from the source resume to the target resume
                        </p>
                    </div>

                    {/* Merge Options */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Select Changes to Merge:</h4>

                        {/* Summary Section */}
                        {comparisonData.fullData.resume2.summary && comparisonData.differences.summary && (
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedMergeChanges.includes('summary')}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedMergeChanges([...selectedMergeChanges, 'summary']);
                                            } else {
                                                setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== 'summary'));
                                            }
                                        }}
                                        className="mt-1 w-5 h-5 text-[#4F5348] rounded focus:ring-2 focus:ring-[#777C6D]"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 mb-2">Summary</div>
                                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200 line-clamp-3">
                                            {comparisonData.fullData.resume2.summary}
                                        </div>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Experience Section */}
                        {comparisonData.fullData.resume2.experience?.length > 0 && (
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedMergeChanges.includes('experience')}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedMergeChanges([...selectedMergeChanges, 'experience']);
                                            } else {
                                                setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== 'experience'));
                                            }
                                        }}
                                        className="mt-1 w-5 h-5 text-[#4F5348] rounded focus:ring-2 focus:ring-[#777C6D]"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 mb-2">
                                            All Experience ({comparisonData.fullData.resume2.experience.length} items)
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Replace all experience with source, or select individual items below to add
                                        </div>
                                    </div>
                                </label>

                                {/* Individual Experience Items */}
                                <div className="ml-8 mt-3 space-y-2">
                                    <div className="text-xs text-gray-500 mb-2 italic">Select individual experience items to ADD them to current resume</div>
                                    {comparisonData.fullData.resume2.experience.map((exp, idx) => (
                                        <label key={idx} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-white">
                                            <input
                                                type="checkbox"
                                                checked={selectedMergeChanges.includes(`experience.${idx}`)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedMergeChanges([...selectedMergeChanges, `experience.${idx}`]);
                                                    } else {
                                                        setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== `experience.${idx}`));
                                                    }
                                                }}
                                                className="mt-1 w-4 h-4 text-[#4F5348] rounded focus:ring-2 focus:ring-[#777C6D]"
                                            />
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">{exp.title} at {exp.company}</div>
                                                <div className="text-xs text-gray-500">
                                                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Skills Section */}
                        {comparisonData.fullData.resume2.skills?.length > 0 && (() => {
                            // Get current resume skills to show which are new/different
                            const currentSkillNames = new Set(
                                (comparisonData.fullData.resume1.skills || []).map(s =>
                                    typeof s === 'string' ? s : s.name
                                )
                            );

                            return (
                                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedMergeChanges.includes('skills')}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedMergeChanges([...selectedMergeChanges, 'skills']);
                                                } else {
                                                    setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== 'skills'));
                                                }
                                            }}
                                            className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 mb-2">
                                                All Skills ({comparisonData.fullData.resume2.skills.length} items)
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Add all missing skills from source resume
                                            </div>
                                        </div>
                                    </label>

                                    {/* Individual Skills */}
                                    <div className="ml-8 mt-3 flex flex-wrap gap-2">
                                        {comparisonData.fullData.resume2.skills.map((skill, idx) => {
                                            const skillName = typeof skill === 'string' ? skill : skill.name;
                                            const isInCurrent = currentSkillNames.has(skillName);

                                            return (
                                                <label
                                                    key={idx}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition ${isInCurrent
                                                        ? 'bg-gray-100 text-gray-500'
                                                        : 'bg-purple-50 hover:bg-purple-100 text-purple-900'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMergeChanges.includes(`skill.${idx}`)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedMergeChanges([...selectedMergeChanges, `skill.${idx}`]);
                                                            } else {
                                                                setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== `skill.${idx}`));
                                                            }
                                                        }}
                                                        disabled={isInCurrent}
                                                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                                                    />
                                                    <span className="text-sm">
                                                        {skillName}
                                                        {isInCurrent && <span className="ml-1 text-xs">(already in current)</span>}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Education Section */}
                        {comparisonData.fullData.resume2.education?.length > 0 && (
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedMergeChanges.includes('education')}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedMergeChanges([...selectedMergeChanges, 'education']);
                                            } else {
                                                setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== 'education'));
                                            }
                                        }}
                                        className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 mb-2">
                                            Education ({comparisonData.fullData.resume2.education.length} items)
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Replace all education entries with those from source resume
                                        </div>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Projects Section */}
                        {comparisonData.fullData.resume2.projects?.length > 0 && (
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedMergeChanges.includes('projects')}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedMergeChanges([...selectedMergeChanges, 'projects']);
                                            } else {
                                                setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== 'projects'));
                                            }
                                        }}
                                        className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 mb-2">
                                            Projects ({comparisonData.fullData.resume2.projects.length} items)
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Replace all projects with those from source resume
                                        </div>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Section Visibility/Customization */}
                        {comparisonData.differences.sectionCustomization && (
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedMergeChanges.includes('sectionCustomization')}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedMergeChanges([...selectedMergeChanges, 'sectionCustomization']);
                                            } else {
                                                setSelectedMergeChanges(selectedMergeChanges.filter(c => c !== 'sectionCustomization'));
                                            }
                                        }}
                                        className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 mb-2">Section Visibility & Layout</div>
                                        <div className="text-sm text-gray-600">
                                            Restore section visibility settings, order, and formatting from source resume
                                        </div>
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        {selectedMergeChanges.length > 0 ? (
                            <span className="font-medium text-purple-700">
                                {selectedMergeChanges.length} section{selectedMergeChanges.length !== 1 ? 's' : ''} selected for merge
                            </span>
                        ) : (
                            <span className="text-gray-500">Select at least one section to merge</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setShowMergeModal(false);
                                setSelectedMergeChanges([]);
                            }}
                            disabled={isMerging}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleMergeResumes}
                            disabled={isMerging || selectedMergeChanges.length === 0}
                            className="px-6 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isMerging ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Merging...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Apply Merge</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
