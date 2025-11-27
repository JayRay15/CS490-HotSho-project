import React from 'react';

export default function CustomizeImportModal({
  isOpen,
  pendingImport,
  onClose,
  onPendingImportChange,
  onFinalizeImport
}) {
  if (!isOpen || !pendingImport) return null;

  const handleClose = () => {
    onClose();
  };

  const updateThemeColor = (colorKey, value) => {
    onPendingImportChange({
      ...pendingImport,
      theme: {
        ...pendingImport.theme,
        colors: { ...pendingImport.theme?.colors, [colorKey]: value }
      }
    });
  };

  const updateThemeFont = (fontKey, value) => {
    onPendingImportChange({
      ...pendingImport,
      theme: {
        ...pendingImport.theme,
        fonts: { ...pendingImport.theme?.fonts, [fontKey]: value }
      }
    });
  };

  const updateFontSize = (sizeKey, value) => {
    onPendingImportChange({
      ...pendingImport,
      theme: {
        ...pendingImport.theme,
        fonts: {
          ...pendingImport.theme?.fonts,
          sizes: {
            ...pendingImport.theme?.fonts?.sizes,
            [sizeKey]: `${value}px`
          }
        }
      }
    });
  };

  const fontOptions = [
    { value: "Inter, sans-serif", label: "Inter (Modern)" },
    { value: "Georgia, serif", label: "Georgia (Classic)" },
    { value: "Times New Roman, serif", label: "Times New Roman (Traditional)" },
    { value: "Arial, sans-serif", label: "Arial (Clean)" },
    { value: "Helvetica, sans-serif", label: "Helvetica (Professional)" },
    { value: "Calibri, sans-serif", label: "Calibri (Modern)" },
    { value: "Garamond, serif", label: "Garamond (Elegant)" }
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-2xl font-heading font-semibold">Customize Template Appearance</h3>
            <p className="text-sm text-gray-600 mt-1">Set fonts and colors to match your original resume</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Analysis Banner or Help Banner */}
          {pendingImport?.analysis?.used ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-700 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h5 className="font-semibold text-green-900 mb-1">Applied styling detected from your PDF</h5>
                  <p className="text-sm text-green-800">
                    We detected styling hints from your uploaded PDF and prefilled the colors and font sizes below. You can still fine-tune anything before saving.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h5 className="font-semibold text-blue-900 mb-1">Match Your Original Resume</h5>
                  <p className="text-sm text-blue-800">
                    PDFs can be hard to parse for exact styling. Adjust the colors, fonts, and sizes below to match your original resume. The live preview updates instantly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={pendingImport.name}
              onChange={(e) => onPendingImportChange({ ...pendingImport, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Colors Section */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Colors</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color (Headers)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={pendingImport.theme?.colors?.primary || "#4F5348"}
                    onChange={(e) => updateThemeColor('primary', e.target.value)}
                    className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={pendingImport.theme?.colors?.primary || "#4F5348"}
                    onChange={(e) => updateThemeColor('primary', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                    placeholder="#4F5348"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={pendingImport.theme?.colors?.text || "#222"}
                    onChange={(e) => updateThemeColor('text', e.target.value)}
                    className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={pendingImport.theme?.colors?.text || "#222"}
                    onChange={(e) => updateThemeColor('text', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                    placeholder="#222"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Muted Color (Dates)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={pendingImport.theme?.colors?.muted || "#666"}
                    onChange={(e) => updateThemeColor('muted', e.target.value)}
                    className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={pendingImport.theme?.colors?.muted || "#666"}
                    onChange={(e) => updateThemeColor('muted', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                    placeholder="#666"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fonts Section */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Fonts</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heading Font
                </label>
                <select
                  value={pendingImport.theme?.fonts?.heading || "Inter, sans-serif"}
                  onChange={(e) => updateThemeFont('heading', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {fontOptions.map((font) => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body Font
                </label>
                <select
                  value={pendingImport.theme?.fonts?.body || "Inter, sans-serif"}
                  onChange={(e) => updateThemeFont('body', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {fontOptions.map((font) => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Font Sizes */}
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-3">Font Sizes</h5>
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Name
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="60"
                    value={parseInt(pendingImport.theme?.fonts?.sizes?.name) || 36}
                    onChange={(e) => updateFontSize('name', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Headers
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="32"
                    value={parseInt(pendingImport.theme?.fonts?.sizes?.sectionHeader) || 18}
                    onChange={(e) => updateFontSize('sectionHeader', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Job Title
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="24"
                    value={parseInt(pendingImport.theme?.fonts?.sizes?.jobTitle) || 16}
                    onChange={(e) => updateFontSize('jobTitle', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Body
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="20"
                    value={parseInt(pendingImport.theme?.fonts?.sizes?.body) || 14}
                    onChange={(e) => updateFontSize('body', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Small
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="16"
                    value={parseInt(pendingImport.theme?.fonts?.sizes?.small) || 12}
                    onChange={(e) => updateFontSize('small', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Preview</h4>
            <div className="border border-gray-300 rounded-lg p-6 bg-white">
              <h2
                className="font-bold mb-2"
                style={{
                  color: pendingImport.theme?.colors?.primary || "#4F5348",
                  fontFamily: pendingImport.theme?.fonts?.heading || "Inter, sans-serif",
                  fontSize: pendingImport.theme?.fonts?.sizes?.name || "36px"
                }}
              >
                Your Name
              </h2>
              <p
                className="mb-4"
                style={{
                  color: pendingImport.theme?.colors?.muted || "#666",
                  fontFamily: pendingImport.theme?.fonts?.body || "Inter, sans-serif",
                  fontSize: pendingImport.theme?.fonts?.sizes?.small || "12px"
                }}
              >
                email@example.com • (555) 123-4567
              </p>
              <h3
                className="font-semibold mb-2 uppercase"
                style={{
                  color: pendingImport.theme?.colors?.primary || "#4F5348",
                  fontFamily: pendingImport.theme?.fonts?.heading || "Inter, sans-serif",
                  fontSize: pendingImport.theme?.fonts?.sizes?.sectionHeader || "18px"
                }}
              >
                Experience
              </h3>
              <h4
                className="font-bold mb-1"
                style={{
                  color: pendingImport.theme?.colors?.text || "#222",
                  fontFamily: pendingImport.theme?.fonts?.heading || "Inter, sans-serif",
                  fontSize: pendingImport.theme?.fonts?.sizes?.jobTitle || "16px"
                }}
              >
                Senior Developer
              </h4>
              <p
                style={{
                  color: pendingImport.theme?.colors?.text || "#222",
                  fontFamily: pendingImport.theme?.fonts?.body || "Inter, sans-serif",
                  fontSize: pendingImport.theme?.fonts?.sizes?.body || "14px"
                }}
              >
                This is how your body text will appear in the resume.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onFinalizeImport}
            className="px-4 py-2 text-white rounded-lg transition"
            style={{ backgroundColor: '#777C6D' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}
