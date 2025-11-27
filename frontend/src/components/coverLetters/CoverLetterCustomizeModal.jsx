import React from 'react';
import Button from '../Button';

export default function CoverLetterCustomizeModal({
  isOpen,
  selectedTemplate,
  onClose,
  customName,
  setCustomName,
  customContent,
  setCustomContent,
  customStyle,
  setCustomStyle,
  isCreatingTemplate,
  onTemplateChange,
  onSave
}) {
  if (!isOpen || !selectedTemplate) return null;

  const styleOptions = [
    { value: 'formal', label: 'Formal' },
    { value: 'modern', label: 'Modern' },
    { value: 'creative', label: 'Creative' },
    { value: 'technical', label: 'Technical' },
    { value: 'executive', label: 'Executive' }
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
              Customize Cover Letter
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g., My Software Engineer Cover Letter"
            />
          </div>

          {isCreatingTemplate && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Style
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={selectedTemplate.style || 'formal'}
                onChange={(e) => onTemplateChange({
                  ...selectedTemplate,
                  style: e.target.value
                })}
              >
                {styleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">
                Choose a style that best represents this template
              </p>
            </div>
          )}

          {!isCreatingTemplate && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter Style
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
              >
                {styleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">
                Choose a style for your cover letter
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Letter Content
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Replace the placeholders in brackets (e.g., [POSITION], [COMPANY]) with your specific information.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Tip:</strong> Common placeholders include [YOUR_NAME], [POSITION], [COMPANY], [HIRING_MANAGER_NAME],
                [FIELD], [SKILLS], [ACHIEVEMENT], etc.
              </p>
            </div>
            <textarea
              className="w-full h-96 p-4 border border-gray-300 rounded-lg font-sans text-sm"
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder="Customize your cover letter here..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onSave}
            >
              {isCreatingTemplate ? 'Create Template' : 'Save Cover Letter'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
