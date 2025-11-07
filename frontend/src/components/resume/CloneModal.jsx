import React from 'react';

/**
 * CloneModal - Modal for cloning a resume with a new name
 * Extracted from ResumeTemplates.jsx for better code organization
 */
const CloneModal = ({
  isOpen,
  onClose,
  onClone,
  resumeName,
  cloneName,
  setCloneName,
  cloneDescription,
  setCloneDescription,
  isCloning
}) => {
  if (!isOpen) return null;

  const handleClone = () => {
    if (cloneName.trim() && !isCloning) {
      onClone();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && cloneName.trim() && !isCloning) {
      handleClone();
    }
  };

  const handleClose = () => {
    if (!isCloning) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={handleClose}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-heading font-semibold text-gray-900">Clone Resume</h3>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Create a copy of "{resumeName}" with a new name.
          </p>
          <label htmlFor="cloneNameInput" className="block text-sm font-medium text-gray-700 mb-2">
            New Resume Name
          </label>
          <input
            id="cloneNameInput"
            type="text"
            value={cloneName}
            onChange={(e) => setCloneName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter name for cloned resume"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
            disabled={isCloning}
          />
          
          <label htmlFor="cloneDescriptionInput" className="block text-sm font-medium text-gray-700 mb-2 mt-4">
            Version Description (Optional)
          </label>
          <textarea
            id="cloneDescriptionInput"
            value={cloneDescription}
            onChange={(e) => setCloneDescription(e.target.value)}
            placeholder="Describe this version (e.g., 'Tailored for software engineering roles')"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isCloning}
          />
        </div>

        {/* Modal Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={handleClose}
            disabled={isCloning}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleClone}
            disabled={isCloning || !cloneName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isCloning ? 'Cloning...' : 'Clone Resume'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloneModal;
