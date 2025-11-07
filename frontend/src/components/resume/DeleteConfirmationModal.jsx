import React from 'react';

/**
 * Delete Confirmation Modal Component
 * Reusable modal for confirming deletion of resumes or templates
 */
const DeleteConfirmationModal = ({
  showModal,
  itemToDelete,
  onClose,
  onConfirm,
  isDeleting,
  itemType = 'item', // 'resume' or 'template'
  itemDetails // Object with name, subtitle (like modified date or template type)
}) => {
  if (!showModal || !itemToDelete) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[99999]" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 99999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-heading font-semibold text-gray-900">Confirm Deletion</h3>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete this {itemType}?
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="font-semibold text-gray-900">{itemDetails?.name || itemToDelete.name}</p>
            {itemDetails?.subtitle && (
              <p className="text-sm text-gray-600">{itemDetails.subtitle}</p>
            )}
          </div>
          <p className="text-sm text-red-600 font-medium">
            This action cannot be undone.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
