import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

/**
 * Negotiation List Component
 * Shows all negotiations with filters
 */
export function NegotiationList({ negotiations, onSelect, onDelete, formatCurrency, formatDate }) {
  const [filter, setFilter] = useState('all');

  const filteredNegotiations = negotiations
    .filter(neg => neg && neg.offerDetails) // Filter out null/invalid items first
    .filter(neg => {
      if (filter === 'all') return true;
      return neg.outcome?.status === filter;
    });

  const getStatusBadge = (status) => {
    const badges = {
      in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      declined: { color: 'bg-red-100 text-red-800', label: 'Declined' },
      withdrawn: { color: 'bg-gray-100 text-gray-800', label: 'Withdrawn' },
      expired: { color: 'bg-yellow-100 text-yellow-800', label: 'Expired' }
    };
    const badge = badges[status] || badges.in_progress;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'in_progress'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilter('accepted')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'accepted'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Accepted
        </button>
      </div>

      {/* Negotiations Grid */}
      {filteredNegotiations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No negotiations found</p>
            <p className="text-sm text-gray-400">
              Create a new negotiation session to get personalized guidance
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNegotiations.map((neg) => (
            <Card key={neg._id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div onClick={() => onSelect(neg._id)}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {neg.offerDetails.position}
                    </h3>
                    <p className="text-gray-600 text-sm">{neg.offerDetails.company}</p>
                  </div>
                  {getStatusBadge(neg.outcome?.status || 'in_progress')}
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Initial Offer:</span>
                    <span className="font-medium">
                      {formatCurrency(neg.offerDetails.initialOffer?.baseSalary)}
                    </span>
                  </div>
                  {neg.outcome?.finalOffer?.baseSalary && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Final Offer:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(neg.outcome.finalOffer.baseSalary)}
                        {neg.outcome.improvementFromInitial && (
                          <span className="text-xs ml-1">
                            (+{neg.outcome.improvementFromInitial.salaryIncreasePercent}%)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {neg.offerDetails.deadlineDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deadline:</span>
                      <span className="font-medium">{formatDate(neg.offerDetails.deadlineDate)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Created {formatDate(neg.createdAt)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(neg._id);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Create Negotiation Form Component
 */
export function CreateNegotiationForm({ formData, setFormData, onSubmit, loading }) {
  const [skillInput, setSkillInput] = useState('');
  const [achievementInput, setAchievementInput] = useState('');

  const handleOfferDetailChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      offerDetails: {
        ...prev.offerDetails,
        [field]: value
      }
    }));
  };

  const handleInitialOfferChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      offerDetails: {
        ...prev.offerDetails,
        initialOffer: {
          ...prev.offerDetails.initialOffer,
          [field]: value
        }
      }
    }));
  };

  const handleContextChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      context: {
        ...prev.context,
        [field]: value
      }
    }));
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        context: {
          ...prev.context,
          uniqueSkills: [...prev.context.uniqueSkills, skillInput.trim()]
        }
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      context: {
        ...prev.context,
        uniqueSkills: prev.context.uniqueSkills.filter((_, i) => i !== index)
      }
    }));
  };

  const addAchievement = () => {
    if (achievementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        context: {
          ...prev.context,
          achievements: [...prev.context.achievements, achievementInput.trim()]
        }
      }));
      setAchievementInput('');
    }
  };

  const removeAchievement = (index) => {
    setFormData(prev => ({
      ...prev,
      context: {
        ...prev.context,
        achievements: prev.context.achievements.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Offer Details Section */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">📋 Offer Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.offerDetails.company}
              onChange={(e) => handleOfferDetailChange('company', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Google"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.offerDetails.position}
              onChange={(e) => handleOfferDetailChange('position', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.offerDetails.location}
              onChange={(e) => handleOfferDetailChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., San Francisco, CA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Deadline</label>
            <input
              type="date"
              value={formData.offerDetails.deadlineDate}
              onChange={(e) => handleOfferDetailChange('deadlineDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <h3 className="text-lg font-medium mt-6 mb-3">💰 Initial Offer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Salary <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={formData.offerDetails.initialOffer.baseSalary}
              onChange={(e) => handleInitialOfferChange('baseSalary', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 120000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signing Bonus</label>
            <input
              type="number"
              value={formData.offerDetails.initialOffer.signingBonus}
              onChange={(e) => handleInitialOfferChange('signingBonus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equity Value (Annual)</label>
            <input
              type="number"
              value={formData.offerDetails.initialOffer.equityValue}
              onChange={(e) => handleInitialOfferChange('equityValue', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 25000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Performance Bonus</label>
            <input
              type="number"
              value={formData.offerDetails.initialOffer.performanceBonus}
              onChange={(e) => handleInitialOfferChange('performanceBonus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 15000"
            />
          </div>
        </div>
      </Card>

      {/* Personal Context Section */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">👤 Your Context</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label>
            <input
              type="number"
              value={formData.context.yearsExperience}
              onChange={(e) => handleContextChange('yearsExperience', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Salary</label>
            <input
              type="number"
              value={formData.context.currentSalary}
              onChange={(e) => handleContextChange('currentSalary', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 100000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desired Salary</label>
            <input
              type="number"
              value={formData.context.desiredSalary}
              onChange={(e) => handleContextChange('desiredSalary', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 140000"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unique Skills
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Machine Learning, Cloud Architecture"
            />
            <Button type="button" onClick={addSkill}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.context.uniqueSkills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-2"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="text-primary-700 hover:text-primary-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Key Achievements
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={achievementInput}
              onChange={(e) => setAchievementInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Led team that increased revenue by 30%"
            />
            <Button type="button" onClick={addAchievement}>Add</Button>
          </div>
          <div className="space-y-2">
            {formData.context.achievements.map((achievement, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 bg-gray-50 rounded"
              >
                <span className="flex-1 text-sm">{achievement}</span>
                <button
                  type="button"
                  onClick={() => removeAchievement(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Negotiation Session'}
        </Button>
      </div>
    </form>
  );
}

export default { NegotiationList, CreateNegotiationForm };
