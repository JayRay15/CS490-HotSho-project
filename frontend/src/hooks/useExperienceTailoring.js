// UC-50: Experience Tailoring Custom Hook
import { useState } from 'react';
import { tailorExperienceForJob } from '../api/aiResume';

export function useExperienceTailoring(authWrap) {
  const [showExperienceTailoring, setShowExperienceTailoring] = useState(false);
  const [experienceTailoringData, setExperienceTailoringData] = useState(null);
  const [isTailoringExperience, setIsTailoringExperience] = useState(false);
  const [selectedJobForExperience, setSelectedJobForExperience] = useState('');
  const [selectedExperienceVariations, setSelectedExperienceVariations] = useState({});
  const [isApplyingExperience, setIsApplyingExperience] = useState(false);
  const [showExperienceSuccessBanner, setShowExperienceSuccessBanner] = useState(false);

  const handleTailorExperience = async (viewingResume, selectedJobForSkills) => {
    if (!viewingResume) return;

    const jobSelector = selectedJobForExperience || selectedJobForSkills;

    if (!jobSelector) {
      alert('Please select a job posting to tailor experience for.');
      return;
    }

    const [title, company] = jobSelector.split('|');
    if (!title || !company) {
      alert('Invalid job selection. Please select a valid job from the dropdown.');
      console.error('Invalid job selector:', jobSelector);
      return;
    }

    setIsTailoringExperience(true);
    try {
      await authWrap();
      const response = await tailorExperienceForJob(viewingResume._id, { title, company });
      setExperienceTailoringData(response.data.data);
      setSelectedExperienceVariations({});
      setShowExperienceTailoring(true);
    } catch (err) {
      console.error('Experience tailoring failed:', err);
      const errorMsg = err.response?.data?.message || 'Failed to tailor experience. Please try again.';
      alert(errorMsg);
    } finally {
      setIsTailoringExperience(false);
    }
  };

  const toggleExperienceVariation = (expIdx, bulletIdx, variationType) => {
    const key = `${expIdx}-${bulletIdx}`;
    setSelectedExperienceVariations(prev => {
      const newSelections = { ...prev };
      if (newSelections[key] === variationType) {
        delete newSelections[key];
      } else {
        newSelections[key] = variationType;
      }
      return newSelections;
    });
  };

  const handleApplyExperienceChanges = async (viewingResume, onUpdate) => {
    if (!viewingResume || !experienceTailoringData) return;

    setIsApplyingExperience(true);
    try {
      await authWrap();

      const updatedExperience = viewingResume.sections?.experience?.map((job, expIdx) => {
        const aiExperience = experienceTailoringData.tailoring?.experiences?.find(
          exp => exp.experienceIndex === expIdx
        );

        if (!aiExperience || !aiExperience.bullets) {
          return job;
        }

        const updatedBullets = job.bullets?.map((originalBullet, bulletIdx) => {
          const key = `${expIdx}-${bulletIdx}`;
          const selectedVariation = selectedExperienceVariations[key];

          if (!selectedVariation || selectedVariation === 'original') {
            return originalBullet;
          }

          const aiBullet = aiExperience.bullets?.find(b => {
            const cleanOriginal = (b.originalBullet || '').trim().toLowerCase();
            const cleanCurrent = originalBullet.trim().toLowerCase();
            return cleanOriginal.includes(cleanCurrent) || cleanCurrent.includes(cleanOriginal);
          });

          if (aiBullet && aiBullet.variations && aiBullet.variations[selectedVariation]) {
            return aiBullet.variations[selectedVariation];
          }

          return originalBullet;
        });

        return {
          ...job,
          bullets: updatedBullets || job.bullets
        };
      });

      const updatedResume = {
        ...viewingResume,
        sections: {
          ...viewingResume.sections,
          experience: updatedExperience
        }
      };

      onUpdate(updatedResume);

      setShowExperienceSuccessBanner(true);

      setTimeout(() => {
        setShowExperienceTailoring(false);
        setShowExperienceSuccessBanner(false);
        setSelectedExperienceVariations({});
      }, 2000);
    } catch (err) {
      console.error('Failed to apply experience changes:', err);
      alert('Failed to update experience. Please try again.');
    } finally {
      setIsApplyingExperience(false);
    }
  };

  return {
    showExperienceTailoring,
    setShowExperienceTailoring,
    experienceTailoringData,
    isTailoringExperience,
    selectedJobForExperience,
    setSelectedJobForExperience,
    selectedExperienceVariations,
    isApplyingExperience,
    showExperienceSuccessBanner,
    handleTailorExperience,
    toggleExperienceVariation,
    handleApplyExperienceChanges,
    setSelectedExperienceVariations
  };
}
