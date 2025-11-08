/**
 * Custom hook for managing resume validation state and loading
 * Handles validation result caching and persistence across page refreshes
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import { validateResume, getValidationStatus } from '../api/resumeValidation';

export const useResumeValidation = (showViewResumeModal, viewingResume) => {
  const { getToken } = useAuth();
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState({}); // {resumeId: {status, lastValidation}}

  const authWrap = async () => {
    const token = await getToken();
    setAuthToken(token);
  };

  // Load validation results when viewing a resume
  useEffect(() => {
    const loadValidationResults = async () => {
      if (!showViewResumeModal || !viewingResume?._id) {
        // Clear validation when closing modal
        setValidationResults(null);
        return;
      }

      try {
        // Check if we have cached validation in validationStatus
        const cached = validationStatus[viewingResume._id];
        if (cached?.lastValidation) {
          console.log('Loading cached validation results');
          setValidationResults(cached.lastValidation);
          return;
        }

        // Otherwise try to fetch from API
        await authWrap();
        const response = await getValidationStatus(viewingResume._id);
        const validation = response.data?.data?.validation || response.data?.validation;
        
        if (validation) {
          console.log('Loaded validation results from API:', validation);
          setValidationResults(validation);
          // Update cache
          setValidationStatus(prev => ({
            ...prev,
            [viewingResume._id]: {
              status: validation.isValid ? 'valid' : 'invalid',
              lastValidation: validation,
              validatedAt: validation.validatedAt || new Date().toISOString()
            }
          }));
        }
      } catch (error) {
        // Silently fail - validation results are optional
        console.log('No validation results found for resume');
      }
    };

    loadValidationResults();
  }, [showViewResumeModal, viewingResume?._id]);

  // Validate resume function
  const handleValidateResume = async (resume, callbacks = {}) => {
    setIsValidating(true);
    try {
      await authWrap();
      const response = await validateResume(resume._id);
      console.log('Validation API response:', response.data);
      const validation = response.data?.data?.validation || response.data?.validation;
      console.log('Extracted validation:', validation);
      
      setValidationResults(validation);
      console.log('Validation results set:', validation);
      console.log('Has errors?', validation?.errors?.length > 0);
      console.log('Has warnings?', validation?.warnings?.length > 0);
      
      // Update validation status cache
      setValidationStatus(prev => ({
        ...prev,
        [resume._id]: {
          status: validation.isValid ? 'valid' : 'invalid',
          lastValidation: validation,
          validatedAt: new Date().toISOString()
        }
      }));
      
      // Execute callbacks if provided
      if (callbacks.onSuccess) {
        callbacks.onSuccess(validation);
      }
      
      return validation;
    } catch (error) {
      console.error('Validation error:', error);
      if (callbacks.onError) {
        callbacks.onError(error);
      }
      throw error;
    } finally {
      setIsValidating(false);
    }
  };

  // Check validation status for a resume (used for badges in resume list)
  const checkValidationStatus = async (resumeId) => {
    try {
      await authWrap();
      const response = await getValidationStatus(resumeId);
      const status = response.data?.data;
      
      let badgeStatus = 'not-validated';
      if (status.hasBeenValidated) {
        if (status.isStale) {
          badgeStatus = 'stale';
        } else if (status.isValid) {
          badgeStatus = 'valid';
        } else {
          badgeStatus = 'invalid';
        }
      }
      
      setValidationStatus(prev => ({
        ...prev,
        [resumeId]: {
          status: badgeStatus,
          lastValidation: status.lastValidation,
          validatedAt: status.validatedAt
        }
      }));
      
      return badgeStatus;
    } catch (error) {
      console.error('Error checking validation status:', error);
      return 'not-validated';
    }
  };

  return {
    validationResults,
    setValidationResults,
    isValidating,
    validationStatus,
    setValidationStatus,
    handleValidateResume,
    checkValidationStatus
  };
};
