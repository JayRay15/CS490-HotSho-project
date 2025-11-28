// UC-52: Version Management Custom Hook (Clone, Compare, Revert, Archive, Merge)
import { useState } from 'react';
import { 
  cloneResume, 
  setDefaultResume, 
  compareResumes, 
  updateResume,
  archiveResume,
  unarchiveResume
} from '../api/resumes';

export function useVersionManagement(authWrap) {
  // Clone state
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [cloneDescription, setCloneDescription] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  
  // Compare state
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareResumeId, setCompareResumeId] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  
  // Merge state
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedMergeChanges, setSelectedMergeChanges] = useState([]);
  const [isMerging, setIsMerging] = useState(false);
  
  // Archive state
  const [showArchivedResumes, setShowArchivedResumes] = useState(false);

  const handleCloneResume = async (viewingResume, onSuccess) => {
    if (!viewingResume || !cloneName.trim()) return;
    
    setIsCloning(true);
    try {
      await authWrap();
      const response = await cloneResume(viewingResume._id, cloneName.trim(), cloneDescription.trim());
      const clonedResume = response.data.data.resume;
      
      setShowCloneModal(false);
      setCloneName('');
      setCloneDescription('');
      
      onSuccess(clonedResume, `Resume cloned successfully as "${clonedResume.name}"!`);
    } catch (err) {
      console.error('Clone failed:', err);
      alert('Failed to clone resume. Please try again.');
    } finally {
      setIsCloning(false);
    }
  };

  const handleSetDefaultResume = async (resumeId, viewingResumeId, onSuccess) => {
    try {
      await authWrap();
      await setDefaultResume(resumeId);
      
      onSuccess(resumeId, viewingResumeId);
    } catch (err) {
      console.error('Set default failed:', err);
      alert('Failed to set default resume. Please try again.');
    }
  };

  const handleCompareResumes = async (viewingResumeId, resumeId2) => {
    if (!viewingResumeId || !resumeId2) return;
    
    try {
      await authWrap();
      const response = await compareResumes(viewingResumeId, resumeId2);
      setComparisonData(response.data.data.comparison);
      setCompareResumeId(resumeId2);
      setShowCompareModal(true);
    } catch (err) {
      console.error('Compare failed:', err);
      alert('Failed to compare resumes. Please try again.');
    }
  };

  const handleRevertToPreviousVersion = async (
    viewingResume, 
    resumes, 
    createAutoVersionSnapshot, 
    onSuccess
  ) => {
    if (!viewingResume || !compareResumeId) return;
    
    const confirm = window.confirm(
      'Are you sure you want to revert to the previous version? This will create a new version snapshot of your current resume before reverting.'
    );
    
    if (!confirm) return;
    
    try {
      await authWrap();
      
      await createAutoVersionSnapshot(viewingResume, 'Before Revert');
      
      const previousResume = resumes.find(r => r._id === compareResumeId);
      if (!previousResume) {
        alert('Previous version not found.');
        return;
      }
      
      const revertedResume = {
        ...viewingResume,
        sections: previousResume.sections,
        sectionCustomization: previousResume.sectionCustomization
      };
      
      await updateResume(viewingResume._id, revertedResume);
      
      setShowCompareModal(false);
      setComparisonData(null);
      setCompareResumeId(null);
      
      onSuccess(revertedResume);
    } catch (err) {
      console.error('Revert failed:', err);
      alert('Failed to revert to previous version. Please try again.');
    }
  };

  const handleArchiveResume = async (resumeId, onSuccess) => {
    const confirm = window.confirm(
      'Are you sure you want to archive this resume? You can unarchive it later from the archived resumes view.'
    );
    
    if (!confirm) return;
    
    try {
      await authWrap();
      await archiveResume(resumeId);
      
      onSuccess(resumeId, 'Resume archived successfully!');
    } catch (err) {
      console.error('Archive failed:', err);
      alert('Failed to archive resume. Please try again.');
    }
  };

  const handleUnarchiveResume = async (resumeId, onSuccess) => {
    try {
      await authWrap();
      await unarchiveResume(resumeId);
      
      onSuccess(resumeId, 'Resume unarchived successfully!');
    } catch (err) {
      console.error('Unarchive failed:', err);
      alert('Failed to unarchive resume. Please try again.');
    }
  };

  const handleMergeResumes = async (
    viewingResume,
    comparisonData,
    selectedMergeChanges,
    onSuccess
  ) => {
    if (!viewingResume || !comparisonData || selectedMergeChanges.length === 0) {
      alert('Please select at least one change to merge.');
      return;
    }
    
    setIsMerging(true);
    try {
      await authWrap();
      
      let mergedResume = { ...viewingResume };
      
      selectedMergeChanges.forEach(changeKey => {
        const [section, field] = changeKey.split('.');
        
        if (section === 'metadata') {
          if (comparisonData.metadata?.[field]) {
            mergedResume[field] = comparisonData.metadata[field].resume2;
          }
        } else if (section && field) {
          if (!mergedResume.sections) mergedResume.sections = {};
          if (!mergedResume.sections[section]) mergedResume.sections[section] = {};
          
          const change = comparisonData.sections?.[section]?.[field];
          if (change) {
            mergedResume.sections[section][field] = change.resume2;
          }
        }
      });
      
      await updateResume(viewingResume._id, mergedResume);
      
      setShowMergeModal(false);
      setSelectedMergeChanges([]);
      
      onSuccess(mergedResume);
    } catch (err) {
      console.error('Merge failed:', err);
      alert('Failed to merge changes. Please try again.');
    } finally {
      setIsMerging(false);
    }
  };

  return {
    // Clone
    showCloneModal,
    setShowCloneModal,
    cloneName,
    setCloneName,
    cloneDescription,
    setCloneDescription,
    isCloning,
    handleCloneResume,
    
    // Compare & Revert
    showCompareModal,
    setShowCompareModal,
    compareResumeId,
    setCompareResumeId,
    comparisonData,
    setComparisonData,
    handleCompareResumes,
    handleRevertToPreviousVersion,
    handleSetDefaultResume,
    
    // Merge
    showMergeModal,
    setShowMergeModal,
    selectedMergeChanges,
    setSelectedMergeChanges,
    isMerging,
    setIsMerging,
    handleMergeResumes,
    
    // Archive
    showArchivedResumes,
    setShowArchivedResumes,
    handleArchiveResume,
    handleUnarchiveResume
  };
}
