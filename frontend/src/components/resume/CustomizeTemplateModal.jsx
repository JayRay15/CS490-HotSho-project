import React from 'react';

/**
 * Customize Template Modal Component
 * Modal for customizing template name, type, theme, and layout
 */
const CustomizeTemplateModal = ({
  customizeTemplate,
  setCustomizeTemplate,
  TEMPLATE_TYPES,
  getThemePresetNames,
  getThemePreset,
  setPreviewTemplate,
  handleCustomizeSave
}) => {
  if (!customizeTemplate) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[60] p-4" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
      onClick={() => setCustomizeTemplate(null)}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h3 className="text-2xl font-heading font-semibold">Customize Template: {customizeTemplate.name}</h3>
          <button
            onClick={() => setCustomizeTemplate(null)}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customizeName" className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  id="customizeName"
                  value={customizeTemplate.name}
                  onChange={(e) => setCustomizeTemplate({...customizeTemplate, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="customizeType" className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select 
                  id="customizeType"
                  value={customizeTemplate.type} 
                  onChange={(e) => setCustomizeTemplate({...customizeTemplate, type: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TEMPLATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* UC-051: Theme Preset Selector */}
            <div className="border-t pt-4">
              <h4 className="text-lg font-heading font-semibold mb-3">Theme Preset</h4>
              <p className="text-sm text-gray-600 mb-4">Choose a pre-designed theme or customize colors manually below</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {getThemePresetNames().map(presetName => {
                  const preset = getThemePreset(presetName);
                  const isSelected = customizeTemplate.theme?.presetName === presetName;
                  return (
                    <button
                      key={presetName}
                      onClick={() => {
                        const themeData = getThemePreset(presetName);
                        setCustomizeTemplate({
                          ...customizeTemplate,
                          theme: {
                            ...themeData,
                            presetName
                          }
                        });
                      }}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{preset.name}</div>
                        {isSelected && (
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mb-3">{preset.description}</div>
                      <div className="flex gap-1">
                        <div 
                          className="w-6 h-6 rounded border border-gray-300" 
                          style={{ backgroundColor: preset.colors.primary }}
                          title="Primary"
                        />
                        <div 
                          className="w-6 h-6 rounded border border-gray-300" 
                          style={{ backgroundColor: preset.colors.accent }}
                          title="Accent"
                        />
                        <div 
                          className="w-6 h-6 rounded border border-gray-300" 
                          style={{ backgroundColor: preset.colors.text }}
                          title="Text"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-lg font-heading font-semibold mb-3">Custom Theme Colors</h4>
              <p className="text-sm text-gray-600 mb-3">Fine-tune the selected theme or create your own color scheme</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <input 
                    type="color"
                    id="primaryColor"
                    value={customizeTemplate.theme?.colors?.primary || "#4F5348"} 
                    onChange={(e) => setCustomizeTemplate({
                      ...customizeTemplate, 
                      theme: { 
                        ...(customizeTemplate.theme||{}), 
                        colors: { ...(customizeTemplate.theme?.colors||{}), primary: e.target.value }
                      }
                    })}
                    className="w-full h-10 rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label htmlFor="textColor" className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                  <input 
                    type="color"
                    id="textColor"
                    value={customizeTemplate.theme?.colors?.text || "#222222"} 
                    onChange={(e) => setCustomizeTemplate({
                      ...customizeTemplate, 
                      theme: { 
                        ...(customizeTemplate.theme||{}), 
                        colors: { ...(customizeTemplate.theme?.colors||{}), text: e.target.value }
                      }
                    })}
                    className="w-full h-10 rounded-lg border border-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-lg font-heading font-semibold mb-3">Layout</h4>
              <div className="space-y-4">
                <div>
                  <label htmlFor="sectionOrder" className="block text-sm font-medium text-gray-700 mb-2">
                    Section Order (comma-separated)
                  </label>
                  <input 
                    type="text"
                    id="sectionOrder"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={(customizeTemplate.layout?.sectionsOrder||[]).join(", ")} 
                    onChange={(e) => setCustomizeTemplate({
                      ...customizeTemplate, 
                      layout: { 
                        ...(customizeTemplate.layout||{}), 
                        sectionsOrder: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) 
                      }
                    })} 
                    placeholder="summary, experience, skills, education, projects"
                  />
                </div>
                <div>
                  <label htmlFor="spacing" className="block text-sm font-medium text-gray-700 mb-2">
                    Spacing (px)
                  </label>
                  <input
                    type="number"
                    id="spacing"
                    value={customizeTemplate.theme?.spacing || 8}
                    onChange={(e) => setCustomizeTemplate({
                      ...customizeTemplate,
                      theme: {
                        ...(customizeTemplate.theme||{}),
                        spacing: parseInt(e.target.value)||8
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 -mx-6 -mb-6 mt-6 border-t">
            <button
              type="button"
              onClick={() => setCustomizeTemplate(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setPreviewTemplate(customizeTemplate)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={handleCustomizeSave}
              className="px-4 py-2 text-white rounded-lg transition"
              style={{ backgroundColor: '#777C6D' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizeTemplateModal;
