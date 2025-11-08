import React from 'react';

/**
 * Reusable Section Header Component
 * Used across multiple resume sections (summary, experience, skills, etc.)
 * with optional regenerate button
 */
const ResumeSectionHeader = ({ 
  sectionKey,
  sectionName, 
  theme, 
  headerStyle = 'underline',
  showRegenerateButton = false,
  isGeneratedByAI = false,
  isRegenerating = false,
  onRegenerate
}) => {
  return (
    <div className="flex justify-between items-center mb-3">
      <h2 
        className="font-bold uppercase tracking-wide" 
        style={{ 
          color: theme.colors.primary, 
          fontFamily: theme.fonts.heading, 
          fontSize: theme.fonts.sizes?.sectionHeader || "18px",
          borderBottom: headerStyle === 'underline' ? `2px solid ${theme.colors.primary}` : 'none',
          paddingBottom: headerStyle === 'underline' ? '4px' : '0'
        }}
      >
        {sectionName}
      </h2>
      {showRegenerateButton && isGeneratedByAI && (
        <button
          onClick={() => onRegenerate(sectionKey)}
          disabled={isRegenerating}
          className="print:hidden text-xs px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition disabled:opacity-50"
        >
          {isRegenerating ? '⟳ Regenerating...' : '⟳ Regenerate'}
        </button>
      )}
    </div>
  );
};

export default ResumeSectionHeader;
