import React from 'react';

/**
 * WatermarkModal - Modal for configuring watermark settings
 * Extracted from ResumeTemplates.jsx for better code organization
 */
const WatermarkModal = ({
  isOpen,
  onClose,
  watermarkText,
  setWatermarkText
}) => {
  if (!isOpen) return null;

  const handleSave = () => {
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && watermarkText.trim()) {
      handleSave();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-60"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-purple-50 border-b border-purple-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-[#4F5348]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <h3 className="text-lg font-heading font-semibold text-gray-900">Watermark Settings</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Configure the watermark text that will appear on exported PDF and DOCX files.
          </p>
          
          <label htmlFor="watermarkTextInput" className="block text-sm font-medium text-gray-700 mb-2">
            Watermark Text
          </label>
          <input
            id="watermarkTextInput"
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., CONFIDENTIAL, DRAFT, Property of..."
            autoFocus
          />
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Preview</p>
                <p className="text-gray-600 opacity-30 font-semibold text-2xl tracking-wide transform -rotate-45">
                  {watermarkText || 'CONFIDENTIAL'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default WatermarkModal;
