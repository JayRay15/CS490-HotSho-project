import React from 'react';

/**
 * UC-053: Editable Skills Component
 * Renders skills array in edit mode with ability to add/remove/edit skills
 */
const EditableSkills = ({ 
  skills, 
  editedContent, 
  setEditedContent, 
  viewingResume,
  setViewingResume,
  theme 
}) => {
  const handleSkillChange = (idx, value) => {
    setEditedContent(prev => ({ ...prev, [`skills.${idx}`]: value }));
  };

  const handleRemoveSkill = (idx) => {
    const updatedSkills = viewingResume.sections.skills.filter((_, i) => i !== idx);
    setViewingResume(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        skills: updatedSkills
      }
    }));
    
    // Clean up editedContent for this skill
    const newEditedContent = { ...editedContent };
    delete newEditedContent[`skills.${idx}`];
    setEditedContent(newEditedContent);
  };

  const handleAddSkill = () => {
    setViewingResume(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        skills: [...(prev.sections.skills || []), '']
      }
    }));
  };

  return (
    <div className="space-y-2">
      {skills.map((skill, idx) => {
        const skillName = typeof skill === 'string' ? skill : skill.name || skill;
        return (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              value={editedContent[`skills.${idx}`] || skillName || ''}
              onChange={(e) => handleSkillChange(idx, e.target.value)}
              className="flex-1 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
              style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fonts.sizes?.body || "14px",
                backgroundColor: 'rgba(59, 130, 246, 0.05)'
              }}
              placeholder="Skill name"
            />
            <button
              onClick={() => handleRemoveSkill(idx)}
              className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
              title="Remove skill"
            >
              ×
            </button>
          </div>
        );
      })}
      <button
        onClick={handleAddSkill}
        className="mt-2 px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition text-sm"
      >
        + Add Skill
      </button>
    </div>
  );
};

export default EditableSkills;
