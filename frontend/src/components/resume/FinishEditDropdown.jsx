import React, { useEffect } from 'react';

/**
 * UC-053: Finish Edit Dropdown Component
 * Renders the edit mode toggle button with a dropdown for Save & Exit or Exit Without Saving
 */
const FinishEditDropdown = ({ 
  isEditMode, 
  showDropdown, 
  setShowDropdown,
  onToggleEditMode,
  onSaveAndExit,
  onExitWithoutSaving
}) => {
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.edit-dropdown-container')) {
        setShowDropdown(false);
      }
    };
    
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown, setShowDropdown]);

  return (
    <div className="relative edit-dropdown-container">
      <button
        onClick={onToggleEditMode}
        className="px-4 py-2 text-white rounded-lg transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ backgroundColor: isEditMode ? '#3B82F6' : '#777C6D' }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = isEditMode ? '#2563EB' : '#656A5C'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = isEditMode ? '#3B82F6' : '#777C6D'}
        title={isEditMode ? "Finish editing" : "Edit resume content"}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span>{isEditMode ? 'Finish Edit' : 'Edit'}</span>
        {isEditMode && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      
      {/* Dropdown Menu */}
      {isEditMode && showDropdown && (
        <div className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[200px]">
          <button
            onClick={onSaveAndExit}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 transition rounded-t-lg"
          >
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">Save & Exit</span>
          </button>
          <button
            onClick={onExitWithoutSaving}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 transition rounded-b-lg border-t border-gray-100"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-gray-700">Exit Without Saving</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FinishEditDropdown;
