import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { updatePreferences, getMarketIntelligence } from '../api/marketIntelligence';

export default function MarketIntelligencePreferences({ onClose, currentPreferences, onUpdate }) {
  const [preferences, setPreferences] = useState({
    industries: currentPreferences?.industries || [],
    locations: currentPreferences?.locations || [],
    jobTitles: currentPreferences?.jobTitles || [],
    skillsOfInterest: currentPreferences?.skillsOfInterest || [],
  });
  
  const [newIndustry, setNewIndustry] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Education', 
    'Manufacturing', 'Retail', 'Marketing', 'Consulting', 'Other'
  ];

  const handleAddItem = (field, value, setter) => {
    if (value.trim() && !preferences[field].includes(value.trim())) {
      setPreferences(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setter('');
    }
  };

  const handleRemoveItem = (field, index) => {
    setPreferences(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await updatePreferences(preferences);
      onUpdate(preferences);
      onClose();
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading font-bold text-gray-900">
              Market Intelligence Preferences
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Customize your market intelligence tracking preferences
          </p>
        </div>

        <div className="p-6 space-y-6">
          {error && <ErrorMessage message={error} />}

          {/* Industries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Industries
            </label>
            <div className="flex gap-2 mb-3">
              <select
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select an industry</option>
                {industryOptions.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              <Button
                onClick={() => handleAddItem('industries', newIndustry, setNewIndustry)}
                disabled={!newIndustry}
                size="sm"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.industries.map((industry, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                >
                  {industry}
                  <button
                    onClick={() => handleRemoveItem('industries', index)}
                    className="hover:text-primary-900"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Locations
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddItem('locations', newLocation, setNewLocation)}
                placeholder="e.g., Remote, New York, San Francisco"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button
                onClick={() => handleAddItem('locations', newLocation, setNewLocation)}
                disabled={!newLocation.trim()}
                size="sm"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.locations.map((location, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {location}
                  <button
                    onClick={() => handleRemoveItem('locations', index)}
                    className="hover:text-blue-900"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Job Titles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Job Titles
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddItem('jobTitles', newJobTitle, setNewJobTitle)}
                placeholder="e.g., Software Engineer, Product Manager"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button
                onClick={() => handleAddItem('jobTitles', newJobTitle, setNewJobTitle)}
                disabled={!newJobTitle.trim()}
                size="sm"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.jobTitles.map((title, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                >
                  {title}
                  <button
                    onClick={() => handleRemoveItem('jobTitles', index)}
                    className="hover:text-green-900"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills of Interest
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddItem('skillsOfInterest', newSkill, setNewSkill)}
                placeholder="e.g., JavaScript, React, Python"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button
                onClick={() => handleAddItem('skillsOfInterest', newSkill, setNewSkill)}
                disabled={!newSkill.trim()}
                size="sm"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.skillsOfInterest.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveItem('skillsOfInterest', index)}
                    className="hover:text-purple-900"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
}
