import React from 'react';

/**
 * Save Preset Modal Component
 * Modal for saving custom section arrangement presets
 */
const SavePresetModal = ({ 
  showModal, 
  onClose, 
  presetName, 
  setPresetName, 
  onSave 
}) => {
  if (!showModal) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </div>
            <h3 className="text-lg font-heading font-semibold text-gray-900">Save Section Arrangement</h3>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <label htmlFor="presetName" className="block text-sm font-medium text-gray-700 mb-2">
            Preset Name
          </label>
          <input
            id="presetName"
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && presetName.trim()) {
                onSave();
              }
            }}
            placeholder="e.g., My Custom Layout"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Modal Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!presetName.trim()}
            className="px-4 py-2 text-white rounded-lg transition disabled:opacity-50"
            style={{ backgroundColor: '#777C6D' }}
            onMouseOver={(e) => !presetName.trim() ? null : e.currentTarget.style.backgroundColor = '#656A5C'}
            onMouseOut={(e) => !presetName.trim() ? null : e.currentTarget.style.backgroundColor = '#777C6D'}
          >
            Save Preset
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavePresetModal;
