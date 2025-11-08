import React from 'react';

/**
 * UC-053: View Issues Button Component
 * Button that shows when validation results contain errors/warnings
 * Opens the inline validation issues panel
 */
const ViewIssuesButton = ({ validationResults, onClick }) => {
  const hasIssues = validationResults && (validationResults.errors?.length > 0 || validationResults.warnings?.length > 0);
  
  if (!hasIssues) return null;

  const errorCount = validationResults.errors?.length || 0;

  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
      title="View validation issues"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>View Issues</span>
      {errorCount > 0 && (
        <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
          {errorCount}
        </span>
      )}
    </button>
  );
};

export default ViewIssuesButton;
