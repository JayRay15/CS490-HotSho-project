import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { createCareerSimulation } from '../../api/careerSimulation';
import CareerSimulationResults from './CareerSimulationResults';

/**
 * UC-128: Career Path Simulator Modal Component
 * Allows users to simulate career outcomes without adding new navigation
 */
const CareerPathSimulator = ({ currentJob = null, onClose }) => {
  // Add custom slider styles
  const sliderStyle = `
    <style>
      .custom-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 8px;
        border-radius: 8px;
        outline: none;
        background: transparent;
      }
      .custom-slider::-webkit-slider-track {
        width: 100%;
        height: 8px;
        border-radius: 8px;
        background: #E8EAE5;
      }
      .custom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #777C6D;
        cursor: pointer;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        transition: all 0.2s;
      }
      .custom-slider::-webkit-slider-thumb:hover {
        background: #656A5C;
        transform: scale(1.1);
      }
      .custom-slider::-moz-range-track {
        width: 100%;
        height: 8px;
        border-radius: 8px;
        background: #E8EAE5;
      }
      .custom-slider::-moz-range-thumb {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #777C6D;
        cursor: pointer;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        transition: all 0.2s;
      }
      .custom-slider::-moz-range-thumb:hover {
        background: #656A5C;
        transform: scale(1.1);
      }
      .custom-slider::-moz-range-progress {
        height: 8px;
        border-radius: 8px;
        background: #777C6D;
      }
    </style>
  `;
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    currentRole: {
      title: currentJob?.title || '',
      salary: currentJob?.salary?.min || currentJob?.salary?.max || 80000,
      level: 'Mid',
      industry: currentJob?.industry || 'Technology',
      yearsOfExperience: 3
    },
    targetRoles: currentJob ? [{
      jobId: currentJob._id,
      title: currentJob.title,
      company: currentJob.company,
      salary: currentJob.salary?.max || 100000,
      industry: currentJob.industry || 'Technology'
    }] : [],
    timeHorizon: 10,
    successCriteria: {
      workLifeBalanceWeight: 0.33,
      learningOpportunitiesWeight: 0.33,
      impactWeight: 0.34
    }
  });

  const handleInputChange = (section, field, value) => {
    if (section === 'successCriteria') {
      const newValue = parseFloat(value);
      const currentCriteria = { ...formData.successCriteria, [field]: newValue };
      const total = currentCriteria.workLifeBalanceWeight + currentCriteria.learningOpportunitiesWeight + currentCriteria.impactWeight;
      
      // Prevent total from exceeding 1.0 (100%)
      if (total > 1.0) {
        return; // Don't update if it would exceed 100%
      }
      
      setFormData(prev => ({
        ...prev,
        successCriteria: currentCriteria
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: field === 'salary' || field === 'yearsOfExperience' ? parseInt(value) : value
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await createCareerSimulation(formData, token);
      
      if (response.success) {
        setSimulation(response.data.simulation);
      } else {
        setError(response.message || 'Failed to create simulation');
      }
    } catch (err) {
      console.error('Career simulation error:', err);
      setError(err.response?.data?.message || 'Failed to create simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSimulation(null);
    setError(null);
  };

  // If simulation results are ready, show them
  if (simulation) {
    return (
      <CareerSimulationResults
        simulation={simulation}
        onBack={handleReset}
        onClose={onClose}
      />
    );
  }

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: sliderStyle }} />
      <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Career Path Simulator</h2>
              <p className="text-sm text-gray-600 mt-1">
                Model different career trajectories and compare long-term outcomes
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Role Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Current Role</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.currentRole.title}
                    onChange={(e) => handleInputChange('currentRole', 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Salary ($)
                  </label>
                  <input
                    type="number"
                    value={formData.currentRole.salary}
                    onChange={(e) => handleInputChange('currentRole', 'salary', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={formData.currentRole.level}
                    onChange={(e) => handleInputChange('currentRole', 'level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Entry">Entry</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Principal">Principal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={formData.currentRole.yearsOfExperience}
                    onChange={(e) => handleInputChange('currentRole', 'yearsOfExperience', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <select
                    value={formData.currentRole.industry}
                    onChange={(e) => handleInputChange('currentRole', 'industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Simulation Settings */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Simulation Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Horizon (Years)
                </label>
                <select
                  value={formData.timeHorizon}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeHorizon: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="5">5 Years</option>
                  <option value="10">10 Years</option>
                  <option value="15">15 Years</option>
                  <option value="20">20 Years</option>
                </select>
              </div>
            </div>

            {/* Success Criteria */}
            <div className="bg-primary-50 p-5 rounded-xl border-2 border-primary-300">
              <h3 className="font-semibold text-gray-900 mb-1">Success Criteria Weights</h3>
              <p className="text-xs text-gray-600 mb-4">Adjust how much each factor matters (must total 100%)</p>
              <div className="space-y-4">
                {/* Work-Life Balance */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-800">
                      Work-Life Balance
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('successCriteria', 'workLifeBalanceWeight', Math.max(0, formData.successCriteria.workLifeBalanceWeight - 0.01))}
                        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-lg transition-colors"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold text-primary-700 w-12 text-center">
                        {Math.round(formData.successCriteria.workLifeBalanceWeight * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInputChange('successCriteria', 'workLifeBalanceWeight', Math.min(1, formData.successCriteria.workLifeBalanceWeight + 0.01))}
                        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-lg transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(formData.successCriteria.workLifeBalanceWeight * 100)}
                    onChange={(e) => handleInputChange('successCriteria', 'workLifeBalanceWeight', e.target.value / 100)}
                    className="custom-slider"
                    style={{
                      background: `linear-gradient(to right, #777C6D 0%, #777C6D ${Math.round(formData.successCriteria.workLifeBalanceWeight * 100)}%, #E8EAE5 ${Math.round(formData.successCriteria.workLifeBalanceWeight * 100)}%, #E8EAE5 100%)`
                    }}
                  />
                </div>
                {/* Learning Opportunities */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-800">
                      Learning Opportunities
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('successCriteria', 'learningOpportunitiesWeight', Math.max(0, formData.successCriteria.learningOpportunitiesWeight - 0.01))}
                        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-lg transition-colors"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold text-primary-700 w-12 text-center">
                        {Math.round(formData.successCriteria.learningOpportunitiesWeight * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInputChange('successCriteria', 'learningOpportunitiesWeight', Math.min(1, formData.successCriteria.learningOpportunitiesWeight + 0.01))}
                        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-lg transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(formData.successCriteria.learningOpportunitiesWeight * 100)}
                    onChange={(e) => handleInputChange('successCriteria', 'learningOpportunitiesWeight', e.target.value / 100)}
                    className="custom-slider"
                    style={{
                      background: `linear-gradient(to right, #777C6D 0%, #777C6D ${Math.round(formData.successCriteria.learningOpportunitiesWeight * 100)}%, #E8EAE5 ${Math.round(formData.successCriteria.learningOpportunitiesWeight * 100)}%, #E8EAE5 100%)`
                    }}
                  />
                </div>
                {/* Impact & Advancement */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-800">
                      Impact & Advancement
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('successCriteria', 'impactWeight', Math.max(0, formData.successCriteria.impactWeight - 0.01))}
                        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-lg transition-colors"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold text-primary-700 w-12 text-center">
                        {Math.round(formData.successCriteria.impactWeight * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInputChange('successCriteria', 'impactWeight', Math.min(1, formData.successCriteria.impactWeight + 0.01))}
                        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-lg transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(formData.successCriteria.impactWeight * 100)}
                    onChange={(e) => handleInputChange('successCriteria', 'impactWeight', e.target.value / 100)}
                    className="custom-slider"
                    style={{
                      background: `linear-gradient(to right, #777C6D 0%, #777C6D ${Math.round(formData.successCriteria.impactWeight * 100)}%, #E8EAE5 ${Math.round(formData.successCriteria.impactWeight * 100)}%, #E8EAE5 100%)`
                    }}
                  />
                </div>
                <div className="text-xs border-t-2 border-primary-200 mt-2 pt-3">
                  <span className={((formData.successCriteria.workLifeBalanceWeight + formData.successCriteria.learningOpportunitiesWeight + formData.successCriteria.impactWeight) * 100) > 100 ? 'text-red-600 font-semibold' : 'text-blue-700 font-medium'}>
                    Total: {((formData.successCriteria.workLifeBalanceWeight + formData.successCriteria.learningOpportunitiesWeight + formData.successCriteria.impactWeight) * 100).toFixed(0)}%
                  </span>
                  {((formData.successCriteria.workLifeBalanceWeight + formData.successCriteria.learningOpportunitiesWeight + formData.successCriteria.impactWeight) * 100) > 100 && (
                    <span className="text-red-600 ml-2">⚠️ Cannot exceed 100%</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-accent-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-accent-300 disabled:bg-gray-400 disabled:text-gray-600 font-bold shadow-lg transition-all text-base border-2 border-accent-400"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Simulating...
                  </span>
                ) : (
                  'Run Simulation'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white border-2 border-gray-700 text-gray-900 rounded-lg hover:bg-gray-100 font-bold transition-all shadow-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </>
  );
};

export default CareerPathSimulator;
