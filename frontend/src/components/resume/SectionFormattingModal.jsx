import React from 'react';

/**
 * Section Formatting Modal Component
 * Modal for customizing section formatting (font size, weight, color, spacing)
 */
const SectionFormattingModal = ({ 
  showModal, 
  onClose, 
  formattingSection,
  sectionFormatting,
  updateSectionFormatting,
  setSectionFormatting,
  DEFAULT_SECTIONS
}) => {
  if (!showModal || !formattingSection) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-[#777C6D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-heading font-semibold text-gray-900">
                Format: {DEFAULT_SECTIONS.find(s => s.key === formattingSection)?.label}
              </h3>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#777C6D] focus:ring-offset-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
            <select
              value={sectionFormatting[formattingSection]?.fontSize || 'medium'}
              onChange={(e) => updateSectionFormatting(formattingSection, { fontSize: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
            >
              <option value="small">Small</option>
              <option value="medium">Medium (Default)</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Weight</label>
            <select
              value={sectionFormatting[formattingSection]?.fontWeight || 'normal'}
              onChange={(e) => updateSectionFormatting(formattingSection, { fontWeight: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
            >
              <option value="light">Light</option>
              <option value="normal">Normal (Default)</option>
              <option value="bold">Bold</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={sectionFormatting[formattingSection]?.color || '#000000'}
                onChange={(e) => updateSectionFormatting(formattingSection, { color: e.target.value })}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={sectionFormatting[formattingSection]?.color || '#000000'}
                onChange={(e) => updateSectionFormatting(formattingSection, { color: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent font-mono text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bottom Spacing (px)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={sectionFormatting[formattingSection]?.spacing || 24}
                onChange={(e) => updateSectionFormatting(formattingSection, { spacing: e.target.value })}
                className="flex-1"
                min="0"
                max="100"
              />
              <input
                type="number"
                value={sectionFormatting[formattingSection]?.spacing || 24}
                onChange={(e) => updateSectionFormatting(formattingSection, { spacing: e.target.value })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent text-sm"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={() => {
              const newFormatting = { ...sectionFormatting };
              delete newFormatting[formattingSection];
              setSectionFormatting(newFormatting);
              onClose();
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Reset to Default
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-white rounded-lg transition"
            style={{ backgroundColor: '#777C6D' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionFormattingModal;
