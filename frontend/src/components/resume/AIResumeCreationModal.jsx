import React from 'react';

export default function AIResumeCreationModal({
  isOpen,
  onClose,
  isGenerating,
  aiFormData,
  setAIFormData,
  jobs,
  templates,
  showVariations,
  variations,
  selectedVariation,
  setSelectedVariation,
  setShowVariations,
  setVariations,
  generationError,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={() => !isGenerating && onClose()}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h3 className="text-2xl font-heading font-semibold">Create Resume with AI</h3>
            <p className="text-sm text-gray-600 mt-1">Generate tailored resume content based on a job posting</p>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Resume Name */}
            <div>
              <label htmlFor="resumeName" className="block text-sm font-medium text-gray-700 mb-2">
                Resume Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="resumeName"
                value={aiFormData.name}
                onChange={(e) => setAIFormData({ ...aiFormData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Software Engineer at Google"
                required
                disabled={isGenerating}
              />
            </div>

            {/* Job Selection */}
            <div>
              <label htmlFor="jobSelect" className="block text-sm font-medium text-gray-700 mb-2">
                Select Job to Tailor For <span className="text-red-500">*</span>
              </label>
              {jobs.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    No saved or applied jobs found. Please save or apply to jobs first.
                  </p>
                </div>
              ) : (
                <select
                  id="jobSelect"
                  value={aiFormData.jobId}
                  onChange={(e) => setAIFormData({ ...aiFormData, jobId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isGenerating}
                >
                  <option value="">-- Select a job --</option>
                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.title} at {job.company} ({job.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Template Selection */}
            <div>
              <label htmlFor="templateSelect" className="block text-sm font-medium text-gray-700 mb-2">
                Select Template <span className="text-red-500">*</span>
              </label>
              <select
                id="templateSelect"
                value={aiFormData.templateId}
                onChange={(e) => setAIFormData({ ...aiFormData, templateId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isGenerating}
              >
                <option value="">-- Select a template --</option>
                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name} ({template.type})
                    {template.isDefault ? " - Default" : ""}
                  </option>
                ))}
              </select>
            </div>


            {/* Variations Display */}
            {showVariations && variations.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-900">Choose a Variation:</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVariations(false);
                      setSelectedVariation(null);
                      setVariations([]);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Generate new variations
                  </button>
                </div>
                <div className="space-y-3">
                  {variations.map((variation, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedVariation(variation)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition ${selectedVariation?.variationNumber === variation.variationNumber
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-semibold text-gray-900">
                            Variation {variation.variationNumber}: {variation.emphasis}
                          </h5>
                          {variation.tailoringNotes && (
                            <p className="text-sm text-gray-600 mt-1">{variation.tailoringNotes}</p>
                          )}
                        </div>
                        {selectedVariation?.variationNumber === variation.variationNumber && (
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="text-sm text-gray-700">
                        <p className="line-clamp-2 mb-2">{variation.summary}</p>
                        <div className="flex flex-wrap gap-2">
                          {variation.relevantSkills?.slice(0, 5).map((skill, skillIdx) => (
                            <span key={skillIdx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {variation.relevantSkills?.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              +{variation.relevantSkills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Features Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">AI will generate:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Tailored professional summary</li>
                    <li>• Achievement-focused experience bullets</li>
                    <li>• Relevant skills from your profile</li>
                    <li>• ATS-optimized keywords</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {generationError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{generationError}</p>
              </div>
            )}

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 -mx-6 -mb-6 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating || jobs.length === 0}
                className="px-4 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                style={{ backgroundColor: isGenerating ? '#9CA3AF' : '#777C6D' }}
                onMouseOver={(e) => !isGenerating && (e.currentTarget.style.backgroundColor = '#656A5C')}
                onMouseOut={(e) => !isGenerating && (e.currentTarget.style.backgroundColor = '#777C6D')}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating with AI...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate Resume</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
