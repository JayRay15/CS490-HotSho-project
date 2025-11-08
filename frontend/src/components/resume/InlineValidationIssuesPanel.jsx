import React from 'react';

/**
 * UC-053: Inline Validation Issues Panel Component
 * Displays validation errors and warnings in a collapsible inline panel
 */
const InlineValidationIssuesPanel = ({ validationResults, onClose }) => {
  const totalIssues = (validationResults.errors?.length || 0) + (validationResults.warnings?.length || 0);

  return (
    <div className="mb-4 mx-auto bg-white border border-gray-200 rounded-lg shadow-lg" style={{ width: '8.5in' }}>
      <div className="bg-red-50 border-b border-red-200 px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h4 className="text-sm font-heading font-semibold text-gray-900">
            Validation Issues ({totalIssues})
          </h4>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
          title="Close issues panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {/* Errors */}
        {validationResults.errors?.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Errors ({validationResults.errors.length}) - Must Fix Before Export
            </h5>
            <div className="space-y-2">
              {validationResults.errors.map((error, idx) => (
                <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium text-red-900">
                        {error.section && <span className="text-xs bg-red-100 px-2 py-0.5 rounded mr-2">{error.section}</span>}
                        {error.message}
                      </p>
                      {error.context && (
                        <p className="text-xs text-red-700 mt-1 font-mono bg-white px-2 py-1 rounded border border-red-200">
                          {error.context}
                        </p>
                      )}
                      {error.replacements && error.replacements.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="text-xs text-red-700">Suggestions:</span>
                          {error.replacements.map((rep, i) => (
                            <span key={i} className="text-xs bg-white border border-red-300 px-2 py-0.5 rounded">
                              {rep}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Warnings */}
        {validationResults.warnings?.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Warnings ({validationResults.warnings.length}) - Recommended to Fix
            </h5>
            <div className="space-y-2">
              {validationResults.warnings.map((warning, idx) => (
                <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium text-yellow-900">
                        {warning.section && <span className="text-xs bg-yellow-100 px-2 py-0.5 rounded mr-2">{warning.section}</span>}
                        {warning.message}
                      </p>
                      {warning.context && (
                        <p className="text-xs text-yellow-700 mt-1 font-mono bg-white px-2 py-1 rounded border border-yellow-200">
                          {warning.context}
                        </p>
                      )}
                      {warning.replacements && warning.replacements.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="text-xs text-yellow-700">Suggestions:</span>
                          {warning.replacements.map((rep, i) => (
                            <span key={i} className="text-xs bg-white border border-yellow-300 px-2 py-0.5 rounded">
                              {rep}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineValidationIssuesPanel;
