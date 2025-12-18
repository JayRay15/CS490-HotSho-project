import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SectionToggleItem from './SectionToggleItem';

/**
 * Customization Panel Component
 * Handles section ordering, visibility, job type, presets, and AI optimization
 */
const CustomizationPanel = ({
  showCustomizationPanel,
  selectedJobType,
  applyJobTypeConfig,
  showPresetMenu,
  setShowPresetMenu,
  SECTION_PRESETS,
  applyPreset,
  customPresets,
  setShowSavePresetModal,
  sectionOrder,
  DEFAULT_SECTIONS,
  visibleSections,
  sectionFormatting,
  viewingResume,
  moveSection,
  handleToggleSection,
  openSectionFormatting,
  getSectionStatus,
  jobs,
  selectedJobForSkills,
  selectedJobForExperience,
  setSelectedJobForSkills,
  setSelectedJobForExperience,
  handleOptimizeSkills,
  isOptimizingSkills,
  handleTailorExperience,
  isTailoringExperience
}) => {
  if (!showCustomizationPanel) return null;

  return (
    <div className="mb-4 mx-auto bg-white border border-gray-200 rounded-lg shadow-lg" style={{ width: '8.5in' }}>
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-[#777C6D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <h4 className="text-sm font-heading font-semibold text-gray-900">Section Customization</h4>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Job Type and Presets Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="customization-job-type" className="text-sm font-medium text-gray-700">Job Type:</label>
            <select
              id="customization-job-type"
              value={selectedJobType}
              onChange={(e) => applyJobTypeConfig(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="general">General</option>
              <option value="technical">Technical/Engineering</option>
              <option value="creative">Creative/Design</option>
              <option value="academic">Academic/Research</option>
              <option value="entry_level">Entry Level</option>
            </select>
          </div>
          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => setShowPresetMenu(v => !v)}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Presets
            </button>
            {showPresetMenu && (
              <div className="absolute right-0 top-12 z-10 w-64 bg-white border border-gray-200 rounded-lg shadow-xl">
                <div className="py-2 max-h-64 overflow-auto">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Built-in Presets</div>
                  {SECTION_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 transition"
                    >
                      <div className="font-medium text-sm text-gray-900">{preset.name}</div>
                      <div className="text-xs text-gray-500">{preset.description}</div>
                    </button>
                  ))}
                  {customPresets.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2 border-t">Custom Presets</div>
                      {customPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => applyPreset(preset)}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 transition"
                        >
                          <div className="font-medium text-sm text-gray-900">{preset.name}</div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={() => setShowSavePresetModal(true)}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Preset
            </button>
          </div>
        </div>
        
        {/* Sections Grid */}
        <div>
          <span className="text-sm font-medium text-gray-700 mb-2 block">Section Order & Visibility (Drag to Reorder)</span>
          <DndProvider backend={HTML5Backend}>
            <div className="flex flex-wrap gap-2">
              {sectionOrder.map((key, idx) => {
                const section = DEFAULT_SECTIONS.find(s => s.key === key);
                if (!section) return null;
                return (
                  <SectionToggleItem 
                    key={key} 
                    section={section} 
                    index={idx}
                    visibleSections={visibleSections}
                    sectionFormatting={sectionFormatting}
                    viewingResume={viewingResume}
                    moveSection={moveSection}
                    handleToggleSection={handleToggleSection}
                    openSectionFormatting={openSectionFormatting}
                    getSectionStatus={getSectionStatus}
                  />
                );
              })}
            </div>
          </DndProvider>
        </div>

        {/* AI Optimization Section (UC-49 & UC-50) */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#4F5348]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Optimization
          </h4>
          
          {/* Job Selector */}
          {jobs.length > 0 && (
            <div className="mb-4">
              <label htmlFor="job-optimization-select" className="text-xs font-medium text-gray-700 mb-2 block">Select Job for Optimization:</label>
              <select
                id="job-optimization-select"
                value={selectedJobForSkills || selectedJobForExperience || ''}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  console.log('Selected job:', selectedValue); // Debug
                  setSelectedJobForSkills(selectedValue);
                  setSelectedJobForExperience(selectedValue);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="">Select a job...</option>
                {jobs.map((job, idx) => {
                  // Ensure we have a valid job object
                  if (!job || !job.title || !job.company) {
                    console.warn('Invalid job object:', job);
                    return null;
                  }
                  
                  // Use title|company as the value (pipe separator)
                  const jobValue = `${job.title}|${job.company}`;
                  const displayText = `${job.title} at ${job.company}`;
                  
                  return (
                    <option key={idx} value={jobValue}>
                      {displayText}
                    </option>
                  );
                }).filter(Boolean)}
              </select>
            </div>
          )}
          
          <div className="flex gap-2">
            {/* UC-49: Skills Optimization Button */}
            <button
              onClick={handleOptimizeSkills}
              disabled={isOptimizingSkills || (!selectedJobForSkills && !viewingResume.metadata?.tailoredForJob)}
              className="flex-1 px-3 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOptimizingSkills ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Optimizing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Optimize Skills
                </>
              )}
            </button>

            {/* UC-50: Experience Tailoring Button */}
            <button
              onClick={handleTailorExperience}
              disabled={isTailoringExperience || (!selectedJobForExperience && !viewingResume.metadata?.tailoredForJob)}
              className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTailoringExperience ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Tailoring...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Tailor Experience
                </>
              )}
            </button>
          </div>

          {jobs.length === 0 && (
            <p className="text-xs text-gray-500 mt-2 italic">
              Save or apply to jobs to use AI optimization features.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomizationPanel;
