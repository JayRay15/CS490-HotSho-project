import React from 'react';

/**
 * SaveAsModal - Modal for entering filename before exporting
 * Extracted from ResumeTemplates.jsx for better code organization
 */
const SaveAsModal = ({
  isOpen,
  onClose,
  onSave,
  filename,
  setFilename,
  isExporting,
  format
}) => {
  if (!isOpen) return null;

  const handleSave = () => {
    if (!isExporting && filename.trim()) {
      onSave(filename.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isExporting && filename.trim()) {
      handleSave();
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-60"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-50 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-heading font-semibold text-gray-900">Download Resume</h3>
            </div>
            <button
              onClick={handleClose}
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
          <label htmlFor="saveAsInput" className="block text-sm font-medium text-gray-700 mb-2">
            Filename
          </label>
          <input
            id="saveAsInput"
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isExporting}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Enter filename"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-2">
            Enter a filename for the exported file. The appropriate extension will be kept if included.
          </p>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isExporting || !filename.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            style={{ backgroundColor: '#777C6D' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
          >
            {isExporting ? 'Exporting...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveAsModal;
