/**
 * Resume Merge Utilities
 * Extracted from ResumeTemplates.jsx for better maintainability
 * Handles merging sections between resume versions
 */

/**
 * Merges selected sections from a source resume into a target resume
 * 
 * @param {Object} targetResume - The current resume being edited
 * @param {Object} sourceResume - The resume to pull changes from
 * @param {Array<string>} selectedChanges - Array of change identifiers to apply
 * @returns {Object} The updated resume with merged changes
 */
export function mergeResumeChanges(targetResume, sourceResume, selectedChanges) {
  const updatedResume = { ...targetResume };

  selectedChanges.forEach(change => {
    if (change === 'summary' && sourceResume.sections?.summary) {
      // Summary: replace entirely
      updatedResume.sections.summary = sourceResume.sections.summary;
    } else if (change === 'skills' && sourceResume.sections?.skills) {
      // Skills: MERGE (add missing skills, don't replace)
      updatedResume.sections.skills = mergeSkills(
        updatedResume.sections?.skills || [],
        sourceResume.sections.skills
      );
    } else if (change.startsWith('skill.')) {
      // Individual skill selection: skill.0, skill.1, etc.
      updatedResume.sections.skills = addIndividualSkill(
        updatedResume.sections?.skills || [],
        sourceResume.sections?.skills,
        change
      );
    } else if (change === 'experience' && sourceResume.sections?.experience) {
      // Experience: REPLACE all (user selected "All Experience")
      updatedResume.sections.experience = sourceResume.sections.experience;
    } else if (change.startsWith('experience.')) {
      // Individual experience item: experience.0, experience.1, etc.
      updatedResume.sections.experience = addIndividualExperience(
        updatedResume.sections?.experience || [],
        sourceResume.sections?.experience,
        change
      );
    } else if (change === 'education' && sourceResume.sections?.education) {
      updatedResume.sections.education = sourceResume.sections.education;
    } else if (change === 'projects' && sourceResume.sections?.projects) {
      updatedResume.sections.projects = sourceResume.sections.projects;
    }
    // Note: sectionCustomization is handled separately in the component
    // as it requires state setters
  });

  return updatedResume;
}

/**
 * Merges skills from source into current, avoiding duplicates
 */
function mergeSkills(currentSkills, sourceSkills) {
  // Get skill names from current resume
  const currentSkillNames = new Set(
    currentSkills.map(s => typeof s === 'string' ? s : s.name)
  );

  // Add skills from source that aren't already in current
  const newSkills = sourceSkills.filter(skill => {
    const skillName = typeof skill === 'string' ? skill : skill.name;
    return !currentSkillNames.has(skillName);
  });

  // Combine current + new skills
  return [...currentSkills, ...newSkills];
}

/**
 * Adds an individual skill from source if it doesn't exist
 */
function addIndividualSkill(currentSkills, sourceSkills, change) {
  const skillIndex = parseInt(change.split('.')[1]);
  const skillToAdd = sourceSkills?.[skillIndex];

  if (!skillToAdd) return currentSkills;

  const skillName = typeof skillToAdd === 'string' ? skillToAdd : skillToAdd.name;

  // Check if skill already exists
  const skillExists = currentSkills.some(s => {
    const existingName = typeof s === 'string' ? s : s.name;
    return existingName === skillName;
  });

  if (!skillExists) {
    return [...currentSkills, skillToAdd];
  }

  return currentSkills;
}

/**
 * Adds an individual experience from source if it doesn't exist
 */
function addIndividualExperience(currentExperience, sourceExperience, change) {
  const expIndex = parseInt(change.split('.')[1]);
  const expToAdd = sourceExperience?.[expIndex];

  if (!expToAdd) return currentExperience;

  // Check if this exact experience already exists (by title + company)
  const expExists = currentExperience.some(e =>
    e.title === expToAdd.title && e.company === expToAdd.company
  );

  if (!expExists) {
    return [...currentExperience, expToAdd];
  }

  return currentExperience;
}

/**
 * Extracts section customization changes from source resume
 * Returns an object with the customization settings if they exist
 */
export function extractSectionCustomization(sourceResume) {
  if (!sourceResume.sectionCustomization) return null;

  return {
    visibleSections: sourceResume.sectionCustomization.visibleSections || null,
    sectionOrder: sourceResume.sectionCustomization.sectionOrder || null,
    sectionFormatting: sourceResume.sectionCustomization.sectionFormatting || null
  };
}

/**
 * Checks if sectionCustomization change is selected
 */
export function hasSectionCustomizationChange(selectedChanges) {
  return selectedChanges.includes('sectionCustomization');
}
