import React from 'react';

/**
 * UC-053: Editable Contact Info Component
 * Renders contact information fields (name, email, phone, location, links) in edit mode
 */
const EditableContactInfo = ({ 
  contactInfo, 
  editedContent, 
  setEditedContent, 
  theme 
}) => {
  const handleChange = (field, value) => {
    setEditedContent(prev => ({ ...prev, [`contactInfo.${field}`]: value }));
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={editedContent['contactInfo.name'] || contactInfo?.name || ''}
        onChange={(e) => handleChange('name', e.target.value)}
        className="font-bold mb-2 w-full text-center border-2 border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        style={{ 
          color: theme.colors.text, 
          fontFamily: theme.fonts.heading, 
          fontSize: theme.fonts.sizes?.name || "36px",
          backgroundColor: 'rgba(59, 130, 246, 0.05)'
        }}
        placeholder="Your Name"
      />
      <input
        type="email"
        value={editedContent['contactInfo.email'] || contactInfo?.email || ''}
        onChange={(e) => handleChange('email', e.target.value)}
        className="w-full text-center border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        style={{ 
          color: theme.colors.muted, 
          fontFamily: theme.fonts.body, 
          fontSize: theme.fonts.sizes?.small || "12px",
          backgroundColor: 'rgba(59, 130, 246, 0.05)'
        }}
        placeholder="email@example.com"
      />
      <input
        type="tel"
        value={editedContent['contactInfo.phone'] || contactInfo?.phone || ''}
        onChange={(e) => handleChange('phone', e.target.value)}
        className="w-full text-center border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        style={{ 
          color: theme.colors.muted, 
          fontFamily: theme.fonts.body, 
          fontSize: theme.fonts.sizes?.small || "12px",
          backgroundColor: 'rgba(59, 130, 246, 0.05)'
        }}
        placeholder="(123) 456-7890"
      />
      <input
        type="text"
        value={editedContent['contactInfo.location'] || contactInfo?.location || ''}
        onChange={(e) => handleChange('location', e.target.value)}
        className="w-full text-center border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        style={{ 
          color: theme.colors.muted, 
          fontFamily: theme.fonts.body, 
          fontSize: theme.fonts.sizes?.small || "12px",
          backgroundColor: 'rgba(59, 130, 246, 0.05)'
        }}
        placeholder="City, State"
      />
      <input
        type="url"
        value={editedContent['contactInfo.linkedin'] || contactInfo?.linkedin || ''}
        onChange={(e) => handleChange('linkedin', e.target.value)}
        className="w-full text-center border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        style={{ 
          color: theme.colors.muted, 
          fontFamily: theme.fonts.body, 
          fontSize: theme.fonts.sizes?.small || "12px",
          backgroundColor: 'rgba(59, 130, 246, 0.05)'
        }}
        placeholder="LinkedIn URL"
      />
      <input
        type="url"
        value={editedContent['contactInfo.github'] || contactInfo?.github || ''}
        onChange={(e) => handleChange('github', e.target.value)}
        className="w-full text-center border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        style={{ 
          color: theme.colors.muted, 
          fontFamily: theme.fonts.body, 
          fontSize: theme.fonts.sizes?.small || "12px",
          backgroundColor: 'rgba(59, 130, 246, 0.05)'
        }}
        placeholder="GitHub URL"
      />
      <input
        type="url"
        value={editedContent['contactInfo.website'] || contactInfo?.website || ''}
        onChange={(e) => handleChange('website', e.target.value)}
        className="w-full text-center border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        style={{ 
          color: theme.colors.muted, 
          fontFamily: theme.fonts.body, 
          fontSize: theme.fonts.sizes?.small || "12px",
          backgroundColor: 'rgba(59, 130, 246, 0.05)'
        }}
        placeholder="Portfolio URL"
      />
    </div>
  );
};

export default EditableContactInfo;
