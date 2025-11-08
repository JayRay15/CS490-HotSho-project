import React from 'react';
import { highlightTextDiff } from '../../utils/resumeHelpers.jsx';

/**
 * CompareModal - UC-52 Resume Version Comparison Modal
 * Shows side-by-side comparison of two resume versions with diff highlighting
 * Allows reverting to previous version or merging specific sections
 */
function CompareModal({
  show,
  viewingResume,
  resumes,
  comparisonData,
  onClose,
  onCompare,
  onRevert,
  onMerge,
  onDelete,
  onBackToSelector
}) {
  if (!show || !viewingResume) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#777C6D] border-b px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <h3 className="text-xl font-heading font-bold text-white">Compare Resume Versions</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {!comparisonData ? (
            /* Resume Selector - Only show previous versions */
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">Version History</h4>
                    <p className="text-sm text-blue-800">
                      Compare with previous versions of this resume. Only cloned versions of <strong>{viewingResume.name}</strong> are shown below.
                    </p>
                  </div>
                </div>
              </div>
              {(() => {
                // Filter to only show versions that are clones of the current resume
                // This includes: direct clones, reverse clones, and sibling clones
                
                console.log('=== VERSION HISTORY DEBUG ===');
                console.log('Current resume:', viewingResume.name, 'ID:', viewingResume._id);
                console.log('Current resume clonedFrom:', viewingResume.metadata?.clonedFrom);
                console.log('Total resumes in state:', resumes.length);
                console.log('All resumes:', resumes.map(r => ({ 
                  name: r.name, 
                  id: r._id, 
                  clonedFrom: r.metadata?.clonedFrom,
                  isArchived: r.isArchived 
                })));
                
                const previousVersions = resumes.filter(r => {
                  if (r._id === viewingResume._id) return false;
                  
                  // Direct clone: r was cloned FROM current resume
                  if (r.metadata?.clonedFrom === viewingResume._id) {
                    console.log('✓ Direct clone found:', r.name);
                    return true;
                  }
                  
                  // Reverse clone: current resume was cloned FROM r
                  if (viewingResume.metadata?.clonedFrom === r._id) {
                    console.log('✓ Reverse clone found:', r.name);
                    return true;
                  }
                  
                  // Sibling clones: both were cloned from the same parent
                  if (r.metadata?.clonedFrom && viewingResume.metadata?.clonedFrom && 
                      r.metadata.clonedFrom === viewingResume.metadata.clonedFrom) {
                    console.log('✓ Sibling clone found:', r.name);
                    return true;
                  }
                  
                  return false;
                });

                // Sort by date (newest first)
                previousVersions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

                console.log('Previous versions found:', previousVersions.length);
                console.log('=== END DEBUG ===');

                if (previousVersions.length === 0) {
                  return (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-gray-600 font-medium mb-2">No Previous Versions</p>
                      <p className="text-sm text-gray-500 mb-2">
                        Previous versions will appear here automatically when you:
                      </p>
                      <ul className="text-xs text-gray-500 text-left inline-block">
                        <li>• Apply AI skills optimization</li>
                        <li>• Apply AI experience tailoring</li>
                        <li>• Manually clone this resume</li>
                      </ul>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {previousVersions.map(resume => (
                    <div
                      key={resume._id}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#777C6D] hover:bg-[#f3f3ef] transition text-left flex items-start justify-between gap-3"
                    >
                      <button
                        onClick={async () => {
                          await onCompare(resume._id);
                        }}
                        className="text-left flex-1"
                      >
                        <div className="font-semibold text-gray-900">{resume.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Modified {new Date(resume.updatedAt).toLocaleDateString()}
                        </div>
                        {resume.metadata?.description && (
                          <div className="text-xs text-gray-500 mt-1 italic line-clamp-2">
                            {resume.metadata.description}
                          </div>
                        )}
                        {resume.isDefault && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Default
                          </span>
                        )}
                        {resume.isArchived && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                            Archived
                          </span>
                        )}
                      </button>

                      {/* Trash icon to delete this archived version */}
                      <div className="flex-shrink-0 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(resume);
                          }}
                          title="Delete version"
                          aria-label={`Delete version ${resume.name}`}
                          className="p-2 rounded-lg transition text-gray-600 flex items-center justify-center"
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#FEE2E2';
                            e.currentTarget.style.color = '#B91C1C';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#6B7280';
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Comparison View */
            <div className="space-y-6">
              {/* Comparison Header with Revert Button */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase">Current Version</span>
                    <h4 className="font-semibold text-lg text-gray-900">{comparisonData.resume1.name}</h4>
                    <p className="text-sm text-gray-600">
                      Modified: {new Date(comparisonData.resume1.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase">Previous Version</span>
                    <h4 className="font-semibold text-lg text-gray-900">{comparisonData.resume2.name}</h4>
                    <p className="text-sm text-gray-600">
                      Modified: {new Date(comparisonData.resume2.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-center gap-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={onMerge}
                    className="px-6 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition flex items-center gap-2 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Merge Selected Sections
                  </button>
                  <button
                    onClick={onRevert}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Revert Entirely
                  </button>
                </div>
              </div>

              {/* Differences Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Key Differences
                </h4>
                <ul className="space-y-2 text-sm text-blue-900">
                  {comparisonData.differences.summary && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Summary content differs</span>
                    </li>
                  )}
                  {comparisonData.differences.experienceCount.resume1 !== comparisonData.differences.experienceCount.resume2 && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>
                        Experience items: {comparisonData.differences.experienceCount.resume1} vs {comparisonData.differences.experienceCount.resume2}
                      </span>
                    </li>
                  )}
                  {comparisonData.differences.skillsCount.resume1 !== comparisonData.differences.skillsCount.resume2 && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>
                        Skills: {comparisonData.differences.skillsCount.resume1} vs {comparisonData.differences.skillsCount.resume2}
                      </span>
                    </li>
                  )}
                  {comparisonData.differences.educationCount.resume1 !== comparisonData.differences.educationCount.resume2 && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>
                        Education items: {comparisonData.differences.educationCount.resume1} vs {comparisonData.differences.educationCount.resume2}
                      </span>
                    </li>
                  )}
                  {comparisonData.differences.projectsCount.resume1 !== comparisonData.differences.projectsCount.resume2 && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>
                        Projects: {comparisonData.differences.projectsCount.resume1} vs {comparisonData.differences.projectsCount.resume2}
                      </span>
                    </li>
                  )}
                  {comparisonData.differences.sectionCustomization && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Section customization differs</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Side-by-Side Sections */}
              <div className="space-y-6">
                {/* Summary Comparison with Diff Highlighting */}
                {(comparisonData.fullData.resume1.summary || comparisonData.fullData.resume2.summary) && (() => {
                  const summaryDiff = highlightTextDiff(
                    comparisonData.fullData.resume1.summary,
                    comparisonData.fullData.resume2.summary
                  );
                  
                  return (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                        <span className="font-semibold text-gray-900">Summary</span>
                        {summaryDiff.identical ? (
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">Identical</span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Different</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 divide-x">
                        <div className="p-4 bg-white">
                          <div className="text-xs font-semibold text-gray-500 mb-2">Current Version</div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {summaryDiff.text1 || <span className="text-gray-400 italic">No summary</span>}
                          </p>
                        </div>
                        <div className="p-4 bg-white">
                          <div className="text-xs font-semibold text-gray-500 mb-2">Previous Version</div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {summaryDiff.text2 || <span className="text-gray-400 italic">No summary</span>}
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-600 border-t">
                        <span className="inline-flex items-center gap-1 mr-3">
                          <span className="w-3 h-3 bg-red-100 border border-red-300 rounded"></span> Removed
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span> Added
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Skills Comparison with Highlighting */}
                {(comparisonData.fullData.resume1.skills?.length > 0 || comparisonData.fullData.resume2.skills?.length > 0) && (() => {
                  const skills1Set = new Set(
                    (comparisonData.fullData.resume1.skills || []).map(s => typeof s === 'string' ? s : s.name)
                  );
                  const skills2Set = new Set(
                    (comparisonData.fullData.resume2.skills || []).map(s => typeof s === 'string' ? s : s.name)
                  );
                  
                  return (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                        <span className="font-semibold text-gray-900">Skills</span>
                        {JSON.stringify([...skills1Set].sort()) === JSON.stringify([...skills2Set].sort()) ? (
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">Identical</span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Different</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 divide-x">
                        <div className="p-4 bg-white">
                          <div className="text-xs font-semibold text-gray-500 mb-2">Current Version</div>
                          {comparisonData.fullData.resume1.skills?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {comparisonData.fullData.resume1.skills.map((skill, idx) => {
                                const skillName = typeof skill === 'string' ? skill : skill.name;
                                const inOther = skills2Set.has(skillName);
                                return (
                                  <span 
                                    key={idx} 
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      inOther 
                                        ? 'bg-gray-100 text-gray-800 border border-gray-300' 
                                        : 'bg-red-100 text-red-800 border border-red-300'
                                    }`}
                                  >
                                    {skillName}
                                    {!inOther && <span className="ml-1 text-red-600">✕</span>}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-sm">No skills</span>
                          )}
                        </div>
                        <div className="p-4 bg-white">
                          <div className="text-xs font-semibold text-gray-500 mb-2">Previous Version</div>
                          {comparisonData.fullData.resume2.skills?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {comparisonData.fullData.resume2.skills.map((skill, idx) => {
                                const skillName = typeof skill === 'string' ? skill : skill.name;
                                const inOther = skills1Set.has(skillName);
                                return (
                                  <span 
                                    key={idx} 
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      inOther 
                                        ? 'bg-gray-100 text-gray-800 border border-gray-300' 
                                        : 'bg-green-100 text-green-800 border border-green-300'
                                    }`}
                                  >
                                    {skillName}
                                    {!inOther && <span className="ml-1 text-green-600">✓</span>}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-sm">No skills</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-600 border-t">
                        <span className="inline-flex items-center gap-1 mr-3">
                          <span className="w-3 h-3 bg-red-100 border border-red-300 rounded"></span> Only in current
                        </span>
                        <span className="inline-flex items-center gap-1 mr-3">
                          <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span> Only in previous
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></span> In both
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Experience Count Comparison */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-900">
                    Experience
                  </div>
                  <div className="grid grid-cols-2 divide-x">
                    <div className="p-4 bg-white">
                      <p className="text-sm text-gray-700">
                        {comparisonData.differences.experienceCount.resume1} experience item(s)
                      </p>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-sm text-gray-700">
                        {comparisonData.differences.experienceCount.resume2} experience item(s)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Merge Action */}
              <div className="bg-[#f7f6f2] border border-[#e6e6e1] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-1">Want to merge changes?</h4>
                    <p className="text-sm text-purple-700">
                      Copy selected sections from one resume to another
                    </p>
                  </div>
                  <button
                    onClick={onMerge}
                    className="px-4 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Merge Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
          {comparisonData && (
            <button
              onClick={onBackToSelector}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              Compare Different Resume
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-white rounded-lg transition"
            style={{ backgroundColor: '#777C6D' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompareModal;
