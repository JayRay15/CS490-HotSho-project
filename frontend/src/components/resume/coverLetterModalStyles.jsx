import React from 'react';

// Reusable presentational components for cover-letter modal styling.
// These are intentionally pure/presentational so ResumeTemplates.jsx can
// import and use them without adding behavior here.

export const ModalOverlay = ({ children, onClick }) => (
  <div
    className="fixed inset-0 flex items-center justify-center z-50"
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
    onClick={onClick}
  >
    {children}
  </div>
);

export const ModalCard = ({ children, className = '', onClick }) => (
  <div
    className={`bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl mx-4 ${className}`}
    onClick={(e) => { if (onClick) onClick(e); else e.stopPropagation(); }}
  >
    {children}
  </div>
);

export const ModalHeader = ({ title, onClose, variant = 'default' }) => {
  const headerBg = variant === 'danger' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200';
  return (
    <div className={`${headerBg} border-b px-6 py-4`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading font-semibold text-gray-900">{title}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export const ModalContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

export const ModalFooter = ({ children }) => (
  <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">{children}</div>
);

// Buttons
export const CancelButton = ({ onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Cancel
  </button>
);

export const PrimaryButton = ({ children, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="px-4 py-2 bg-[#777C6D] text-white rounded-lg hover:bg-[#656A5C] transition disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);

export const DangerButton = ({ children = 'Delete', onClick, disabled, loading }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
  >
    {loading ? (
      <>
        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span>Deleting...</span>
      </>
    ) : (
      <>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m4-4h2a2 2 0 012 2v2H9V5a2 2 0 012-2z" />
        </svg>
        <span>{children}</span>
      </>
    )}
  </button>
);

export const SuccessPill = ({ message = 'Saved' }) => (
  <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-green-800 flex items-center gap-2">
    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    <span className="text-sm font-medium">{message}</span>
  </div>
);

export default {
  ModalOverlay,
  ModalCard,
  ModalHeader,
  ModalContent,
  ModalFooter,
  CancelButton,
  PrimaryButton,
  DangerButton,
  SuccessPill,
};
