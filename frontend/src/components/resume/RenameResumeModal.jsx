import React from 'react';

/**
 * Rename Resume Modal Component
 * Modal for renaming a resume
 */
const RenameResumeModal = ({
  showModal,
  renamingResume,
  onClose,
  renameValue,
  setRenameValue,
  onRename,
  isRenaming
}) => {
  if (!showModal || !renamingResume) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={() => !isRenaming && onClose()}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-heading font-semibold text-gray-900">Rename Resume</h3>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <label htmlFor="renameInput" className="block text-sm font-medium text-gray-700 mb-2">
            Resume Name
          </label>
          <input
            id="renameInput"
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isRenaming && renameValue.trim()) {
                onRename();
              }
            }}
            disabled={isRenaming}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Enter resume name"
            autoFocus
          />
        </div>

        {/* Modal Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={() => !isRenaming && onClose()}
            disabled={isRenaming}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onRename}
            disabled={isRenaming || !renameValue.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isRenaming ? "Renaming..." : "Rename"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameResumeModal;
