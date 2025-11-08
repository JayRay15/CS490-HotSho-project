import React from 'react';

/**
 * UC-053: Editable Education Component
 * Renders education entries in edit mode with input fields for all properties
 */
const EditableEducation = ({ 
  education, 
  idx, 
  editedContent, 
  setEditedContent, 
  theme 
}) => {
  const handleChange = (field, value) => {
    setEditedContent(prev => ({ ...prev, [`education.${idx}.${field}`]: value }));
  };

  return (
    <div className="space-y-2 p-3 border-2 border-blue-300 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
      <input
        type="text"
        value={editedContent[`education.${idx}.degree`] || education.degree || ''}
        onChange={(e) => handleChange('degree', e.target.value)}
        className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        style={{ 
          color: theme.colors.text, 
          fontFamily: theme.fonts.heading, 
          fontSize: theme.fonts.sizes?.jobTitle || "16px"
        }}
        placeholder="Degree"
      />
      <input
        type="text"
        value={editedContent[`education.${idx}.fieldOfStudy`] || education.fieldOfStudy || ''}
        onChange={(e) => handleChange('fieldOfStudy', e.target.value)}
        className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        style={{ 
          color: theme.colors.text, 
          fontFamily: theme.fonts.body, 
          fontSize: theme.fonts.sizes?.body || "14px"
        }}
        placeholder="Field of Study"
      />
      <input
        type="text"
        value={editedContent[`education.${idx}.institution`] || education.institution || ''}
        onChange={(e) => handleChange('institution', e.target.value)}
        className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        style={{ 
          color: theme.colors.muted, 
          fontFamily: theme.fonts.heading, 
          fontSize: theme.fonts.sizes?.body || "14px"
        }}
        placeholder="Institution"
      />
      <input
        type="text"
        value={editedContent[`education.${idx}.location`] || education.location || ''}
        onChange={(e) => handleChange('location', e.target.value)}
        className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        style={{ 
          color: theme.colors.muted, 
          fontFamily: theme.fonts.body, 
          fontSize: theme.fonts.sizes?.small || "12px"
        }}
        placeholder="Location"
      />
      <div className="flex gap-2">
        <input
          type="text"
          value={editedContent[`education.${idx}.startDate`] || education.startDate || ''}
          onChange={(e) => handleChange('startDate', e.target.value)}
          className="flex-1 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
          style={{ 
            color: theme.colors.muted, 
            fontFamily: theme.fonts.body, 
            fontSize: theme.fonts.sizes?.small || "12px"
          }}
          placeholder="Start Date (e.g., 2020-09)"
        />
        <input
          type="text"
          value={editedContent[`education.${idx}.endDate`] || education.endDate || ''}
          onChange={(e) => handleChange('endDate', e.target.value)}
          className="flex-1 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
          style={{ 
            color: theme.colors.muted, 
            fontFamily: theme.fonts.body, 
            fontSize: theme.fonts.sizes?.small || "12px"
          }}
          placeholder="End Date (or leave blank if current)"
        />
      </div>
      <input
        type="text"
        value={editedContent[`education.${idx}.gpa`] || education.gpa || ''}
        onChange={(e) => handleChange('gpa', e.target.value)}
        className="w-full border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        style={{ 
          color: theme.colors.text, 
          fontFamily: theme.fonts.body, 
          fontSize: theme.fonts.sizes?.small || "12px"
        }}
        placeholder="GPA (optional)"
      />
    </div>
  );
};

export default EditableEducation;
