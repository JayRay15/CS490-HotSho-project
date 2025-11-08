import React from 'react';
import Card from '../Card';
import ValidationBadge from './ValidationBadge';

/**
 * ResumeTile - Displays a resume card in the grid view
 * Shows resume preview, name, dates, actions (view/rename/delete), badges (archived, validation)
 * Part of UC-052 (Resume Versioning) and UC-053 (Validation)
 */
function ResumeTile({ resume, template, onView, onDelete, onRename, onShare, validationStatus }) {
  const theme = template?.theme || { colors: { primary: "#4F5348", text: "#222" } };
  const fonts = theme?.fonts || { heading: "Inter, sans-serif", body: "Inter, sans-serif", sizes: {} };


  return (
    <Card variant="outlined" interactive className={`overflow-hidden !p-0 ${resume.isArchived ? 'opacity-60' : ''}`}>
      {/* Preview Area */}
      <div
        className="h-64 p-4 flex flex-col justify-start border-b cursor-pointer"
        style={{ backgroundColor: "#F9F9F9" }}
        onClick={onView}
      >
        <div className="text-xs font-bold mb-2" style={{ color: theme.colors?.primary || '#4F5348', fontFamily: fonts.heading }}>
          {resume.name || "Untitled Resume"}
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          {/* Simple preview of resume sections */}
          {resume.sections?.contactInfo && (
            <div className="text-[8px] text-gray-700 font-semibold" style={{ fontFamily: fonts.heading }}>
              {resume.sections.contactInfo.name || "Name"}
            </div>
          )}
          {resume.sections?.summary && (
            <div className="text-[7px] text-gray-600 leading-tight line-clamp-2" style={{ fontFamily: fonts.body }}>
              {resume.sections.summary.substring(0, 100)}...
            </div>
          )}
          {resume.sections?.experience && resume.sections.experience.length > 0 && (
            <div className="mt-2">
              <div className="text-[7px] text-gray-700 font-semibold" style={{ fontFamily: fonts.heading }}>
                {resume.sections.experience[0].company}
              </div>
              <div className="text-[6px] text-gray-500 italic" style={{ fontFamily: fonts.heading }}>
                {resume.sections.experience[0].title}
              </div>
            </div>
          )}
          {resume.sections?.skills && resume.sections.skills.length > 0 && (
            <div className="mt-2 text-[6px] text-gray-600" style={{ fontFamily: fonts.body }}>
              {resume.sections.skills.slice(0, 3).join(' • ')}
              {resume.sections.skills.length > 3 && ' ...'}
            </div>
          )}
          {resume.sections?.education && resume.sections.education.length > 0 && (
            <div className="mt-2 text-[6px] text-gray-600" style={{ fontFamily: fonts.body }}>
              {resume.sections.education[0].school} ({resume.sections.education[0].degree})
            </div>
          )}
        </div>
      </div>
      {/* Info & Actions */}
      <div className="px-2 pt-2 pb-2">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 min-w-0" style={{ fontFamily: fonts.heading }}>{resume.name}</p>
          {/* UC-52: Archived badge */}
          {resume.isArchived && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded">
              ARCHIVED
            </span>
          )}
          {/* UC-053: Validation badge */}
          {validationStatus && (
            <ValidationBadge
              status={validationStatus}
              size="sm"
            />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRename(); }}
            className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center"
            style={{ color: '#6B7280' }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#777C6D';
              e.currentTarget.style.backgroundColor = '#F5F6F4';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#6B7280';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Rename resume"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
        {/* UC-52: Version description */}
        {resume.metadata?.description && (
          <p className="text-xs text-gray-600 mb-1 line-clamp-2 italic" style={{ fontFamily: fonts.body }}>
            {resume.metadata.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-xs text-gray-500">Modified {new Date(resume.updatedAt).toLocaleDateString()}</p>
            {/* UC-52: Job usage badge */}
            {resume.linkedJobCount > 0 && (
              <p className="text-xs text-blue-600 font-medium">
                Used in {resume.linkedJobCount} application{resume.linkedJobCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onView(); }}
              className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center"
              style={{ color: '#6B7280' }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#777C6D';
                e.currentTarget.style.backgroundColor = '#F5F6F4';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            {onShare && (
              <button
                onClick={(e) => { e.stopPropagation(); onShare(); }}
                className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center"
                style={{ color: '#6B7280' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#2563EB';
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#6B7280';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Share"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9l-5 3 5 3m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center"
              style={{ color: '#6B7280' }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#B91C1C';
                e.currentTarget.style.backgroundColor = '#FEE2E2';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m4-4h2a2 2 0 012 2v2H9V5a2 2 0 012-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ResumeTile;
