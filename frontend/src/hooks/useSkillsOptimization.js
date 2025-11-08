/**
 * Custom hook for resume skills optimization functionality (UC-49)
 * Handles AI-powered skills suggestions and management
 */

import { useState } from 'react';
import { optimizeResumeSkills } from '../api/aiResume';

export const useSkillsOptimization = (authWrap) => {
  const [showSkillsOptimization, setShowSkillsOptimization] = useState(false);
  const [skillsOptimizationData, setSkillsOptimizationData] = useState(null);
  const [isOptimizingSkills, setIsOptimizingSkills] = useState(false);
  const [selectedJobForSkills, setSelectedJobForSkills] = useState('');
  const [selectedSkillsToAdd, setSelectedSkillsToAdd] = useState([]);
  const [currentResumeSkills, setCurrentResumeSkills] = useState([]);
  const [isApplyingSkills, setIsApplyingSkills] = useState(false);
  const [showSkillsSuccessBanner, setShowSkillsSuccessBanner] = useState(false);

  /**
   * Optimize skills for a specific job posting
   */
  const handleOptimizeSkills = async (resumeId, jobSelector) => {
    if (!resumeId) return;
    
    if (!jobSelector) {
      alert('Please select a job posting to optimize skills for.');
      return;
    }

    const [title, company] = jobSelector.split('|');
    if (!title || !company) {
      alert('Invalid job selection. Please select a valid job from the dropdown.');
      console.error('Invalid job selector:', jobSelector);
      return;
    }
    
    setIsOptimizingSkills(true);
    try {
      await authWrap();
      const response = await optimizeResumeSkills(resumeId, { title, company });
      setSkillsOptimizationData(response.data.data);
      setSelectedSkillsToAdd([]);
      setShowSkillsOptimization(true);
    } catch (err) {
      console.error('Skills optimization failed:', err);
      const errorMsg = err.response?.data?.message || 'Failed to optimize skills. Please try again.';
      alert(errorMsg);
    } finally {
      setIsOptimizingSkills(false);
    }
  };

  /**
   * Delete a skill from the current resume
   */
  const handleDeleteSkill = (skillToDelete, currentSkills) => {
    const updatedSkills = currentSkills.filter(skill => skill !== skillToDelete);
    setCurrentResumeSkills(updatedSkills);
    return updatedSkills;
  };

  /**
   * Apply selected skill changes to resume
   */
  const handleApplySkillChanges = async (viewingResume, updateResume, onSuccess) => {
    if (!viewingResume) return;
    
    setIsApplyingSkills(true);
    try {
      // Get current skills
      const currentSkills = viewingResume.sections?.skills || [];
      
      // Add selected skills (avoiding duplicates)
      const skillsSet = new Set(currentSkills.map(s => s.toLowerCase()));
      const newSkillsSet = new Set(currentSkills);
      
      selectedSkillsToAdd.forEach(skill => {
        if (!skillsSet.has(skill.toLowerCase())) {
          newSkillsSet.add(skill);
        }
      });
      
      const updatedSkills = Array.from(newSkillsSet);
      
      // Update resume
      const updatedResume = {
        ...viewingResume,
        sections: {
          ...viewingResume.sections,
          skills: updatedSkills
        }
      };
      
      // Update local state via callback
      updateResume(updatedResume);
      
      // Update current skills list
      setCurrentResumeSkills(updatedSkills);
      setSelectedSkillsToAdd([]);
      
      // Show success banner
      setShowSkillsSuccessBanner(true);
      
      // Auto-close modal after 2 seconds
      setTimeout(() => {
        setShowSkillsOptimization(false);
        setShowSkillsSuccessBanner(false);
      }, 2000);
      
      // Call success callback
      onSuccess?.();
    } catch (err) {
      console.error('Failed to apply skill changes:', err);
      alert('Failed to update skills. Please try again.');
    } finally {
      setIsApplyingSkills(false);
    }
  };

  /**
   * Toggle skill selection
   */
  const toggleSkillSelection = (skillName) => {
    setSelectedSkillsToAdd(prev => {
      if (prev.includes(skillName)) {
        return prev.filter(s => s !== skillName);
      } else {
        return [...prev, skillName];
      }
    });
  };

  /**
   * Remove skill from resume
   */
  const handleRemoveSkill = (skillName) => {
    setCurrentResumeSkills(prev => prev.filter(s => s !== skillName));
  };

  return {
    // State
    showSkillsOptimization,
    setShowSkillsOptimization,
    skillsOptimizationData,
    setSkillsOptimizationData,
    isOptimizingSkills,
    selectedJobForSkills,
    setSelectedJobForSkills,
    selectedSkillsToAdd,
    setSelectedSkillsToAdd,
    currentResumeSkills,
    setCurrentResumeSkills,
    isApplyingSkills,
    showSkillsSuccessBanner,
    setShowSkillsSuccessBanner,
    
    // Handlers
    handleOptimizeSkills,
    handleDeleteSkill,
    handleApplySkillChanges,
    toggleSkillSelection,
    handleRemoveSkill
  };
};
