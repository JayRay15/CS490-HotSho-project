import React from 'react';
import Card from '../Card';

/**
 * TemplatePreviewCard - Template card for template management modal
 * Shows template name, type, default badge, mini preview, and actions (set default, customize, delete)
 * Part of UC-051 (Template Management)
 */
function TemplatePreviewCard({ template, isDefault, onSetDefault, onCustomize, onDelete, onPreview }) {
  const theme = template.theme || { colors: { primary: "#4F5348", text: "#222" } };
  
  return (
    <Card variant="outlined" className={isDefault ? 'ring-2 ring-green-500' : ''}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold">{template.name}</div>
          <div className="text-xs text-gray-500 capitalize">{template.type}</div>
        </div>
        {isDefault && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#DCFCE7', color: '#166534', borderColor: '#BBF7D0' }}>
            Default
          </span>
        )}
      </div>

      {/* Mini preview - Document style */}
      <div 
        className="border rounded-lg p-4 mb-3 h-40 overflow-hidden cursor-pointer hover:border-blue-400 transition bg-white shadow-sm"
        onClick={onPreview}
      >
        {/* Sample resume header */}
        <div className="text-center mb-2 pb-1 border-b" style={{ borderColor: theme.colors?.primary }}>
          <div className="text-xs font-bold" style={{ color: theme.colors?.primary || '#4F5348', fontFamily: 'Georgia, serif' }}>
            John Doe
          </div>
          <div className="text-[8px] text-gray-500">john.doe@email.com • (555) 123-4567</div>
        </div>
        
        {/* Sample section */}
        <div className="mb-2">
          <div className="text-[9px] font-bold mb-1 uppercase" style={{ color: theme.colors?.primary || '#4F5348' }}>
            Experience
          </div>
          <div className="text-[7px] font-semibold text-gray-800">Senior Developer</div>
          <div className="text-[6px] text-gray-500 italic mb-1">Tech Company Inc.</div>
          <div className="space-y-0.5">
            <div className="flex items-start gap-1">
              <div className="w-1 h-1 rounded-full bg-gray-400 mt-0.5 flex-shrink-0"></div>
              <div className="text-[6px] text-gray-700 leading-tight">Led development of key features</div>
            </div>
            <div className="flex items-start gap-1">
              <div className="w-1 h-1 rounded-full bg-gray-400 mt-0.5 flex-shrink-0"></div>
              <div className="text-[6px] text-gray-700 leading-tight">Improved system performance</div>
            </div>
          </div>
        </div>

        {/* Sample skills */}
        <div>
          <div className="text-[9px] font-bold mb-1 uppercase" style={{ color: theme.colors?.primary || '#4F5348' }}>
            Skills
          </div>
          <div className="text-[6px] text-gray-700">JavaScript • React • Node.js • Python • SQL</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {!isDefault && (
            <button
              onClick={onSetDefault}
              className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              Set Default
            </button>
          )}
          <button
            onClick={onCustomize}
            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Customize
          </button>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center"
          style={{ color: '#6B7280' }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#EF4444';
            e.currentTarget.style.backgroundColor = '#FEF2F2';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#6B7280';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Delete template"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </Card>
  );
}

export default TemplatePreviewCard;
