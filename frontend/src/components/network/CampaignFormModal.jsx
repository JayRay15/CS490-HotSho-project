import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../../api/axios';
import { createCampaign, updateCampaign } from '../../api/networkingCampaigns';
import Button from '../Button';
import { X, Plus, Trash2 } from 'lucide-react';

/**
 * Campaign Form Modal
 * 
 * Modal for creating or editing a networking campaign.
 */
export default function CampaignFormModal({ campaign, onClose, onSave }) {
  const { getToken } = useAuth();
  const isEditing = !!campaign;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaignType: 'Custom',
    targetCompanies: [],
    targetIndustries: [],
    targetRoles: [],
    goals: {
      totalOutreach: 20,
      responseRate: 30,
      meetingsScheduled: 5,
      connectionsGained: 10,
      referralsObtained: 2
    },
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    strategy: {
      approach: '',
      keyMessages: [],
      followUpSchedule: '1 week'
    },
    notes: ''
  });

  const [newCompany, setNewCompany] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newKeyMessage, setNewKeyMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        campaignType: campaign.campaignType || 'Custom',
        targetCompanies: campaign.targetCompanies || [],
        targetIndustries: campaign.targetIndustries || [],
        targetRoles: campaign.targetRoles || [],
        goals: {
          totalOutreach: campaign.goals?.totalOutreach || 20,
          responseRate: campaign.goals?.responseRate || 30,
          meetingsScheduled: campaign.goals?.meetingsScheduled || 5,
          connectionsGained: campaign.goals?.connectionsGained || 10,
          referralsObtained: campaign.goals?.referralsObtained || 2
        },
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
        strategy: {
          approach: campaign.strategy?.approach || '',
          keyMessages: campaign.strategy?.keyMessages || [],
          followUpSchedule: campaign.strategy?.followUpSchedule || '1 week'
        },
        notes: campaign.notes || ''
      });
    }
  }, [campaign]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('goals.')) {
      const goalKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        goals: { ...prev.goals, [goalKey]: parseInt(value) || 0 }
      }));
    } else if (name.startsWith('strategy.')) {
      const stratKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        strategy: { ...prev.strategy, [stratKey]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addToList = (listName, value, setter) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [listName]: [...prev[listName], value.trim()]
      }));
      setter('');
    }
  };

  const removeFromList = (listName, index) => {
    setFormData(prev => ({
      ...prev,
      [listName]: prev[listName].filter((_, i) => i !== index)
    }));
  };

  const addKeyMessage = () => {
    if (newKeyMessage.trim()) {
      setFormData(prev => ({
        ...prev,
        strategy: {
          ...prev.strategy,
          keyMessages: [...prev.strategy.keyMessages, newKeyMessage.trim()]
        }
      }));
      setNewKeyMessage('');
    }
  };

  const removeKeyMessage = (index) => {
    setFormData(prev => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        keyMessages: prev.strategy.keyMessages.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      setAuthToken(token);

      if (isEditing) {
        await updateCampaign(campaign._id, formData);
      } else {
        await createCampaign(formData);
      }

      onSave();
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError(err.response?.data?.message || 'Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'targets', label: 'Targets' },
    { id: 'goals', label: 'Goals' },
    { id: 'strategy', label: 'Strategy' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Campaign' : 'Create Networking Campaign'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b px-6">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === section.id
                  ? 'border-[#777C6D] text-[#777C6D]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info Section */}
          {activeSection === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Q1 Tech Company Outreach"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe the purpose and focus of this campaign..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Type
                </label>
                <select
                  name="campaignType"
                  value={formData.campaignType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                >
                  <option value="Company Targeting">Company Targeting</option>
                  <option value="Industry Networking">Industry Networking</option>
                  <option value="Role-based">Role-based</option>
                  <option value="Event Follow-up">Event Follow-up</option>
                  <option value="Alumni Outreach">Alumni Outreach</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Any additional notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Targets Section */}
          {activeSection === 'targets' && (
            <div className="space-y-6">
              {/* Target Companies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Companies
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="Add a company..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('targetCompanies', newCompany, setNewCompany))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addToList('targetCompanies', newCompany, setNewCompany)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.targetCompanies.map((company, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {company}
                      <button
                        type="button"
                        onClick={() => removeFromList('targetCompanies', idx)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Target Industries */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Industries
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    placeholder="Add an industry..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('targetIndustries', newIndustry, setNewIndustry))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addToList('targetIndustries', newIndustry, setNewIndustry)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.targetIndustries.map((industry, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
                    >
                      {industry}
                      <button
                        type="button"
                        onClick={() => removeFromList('targetIndustries', idx)}
                        className="hover:text-purple-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Target Roles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Roles
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Add a role..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('targetRoles', newRole, setNewRole))}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addToList('targetRoles', newRole, setNewRole)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.targetRoles.map((role, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                    >
                      {role}
                      <button
                        type="button"
                        onClick={() => removeFromList('targetRoles', idx)}
                        className="hover:text-green-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Goals Section */}
          {activeSection === 'goals' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Set your campaign goals to track progress and measure success.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Outreach Target
                  </label>
                  <input
                    type="number"
                    name="goals.totalOutreach"
                    value={formData.goals.totalOutreach}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Response Rate Goal (%)
                  </label>
                  <input
                    type="number"
                    name="goals.responseRate"
                    value={formData.goals.responseRate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meetings to Schedule
                  </label>
                  <input
                    type="number"
                    name="goals.meetingsScheduled"
                    value={formData.goals.meetingsScheduled}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connections to Gain
                  </label>
                  <input
                    type="number"
                    name="goals.connectionsGained"
                    value={formData.goals.connectionsGained}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referrals to Obtain
                  </label>
                  <input
                    type="number"
                    name="goals.referralsObtained"
                    value={formData.goals.referralsObtained}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Strategy Section */}
          {activeSection === 'strategy' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outreach Approach
                </label>
                <textarea
                  name="strategy.approach"
                  value={formData.strategy.approach}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe your approach for this campaign..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Messages
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newKeyMessage}
                    onChange={(e) => setNewKeyMessage(e.target.value)}
                    placeholder="Add a key message point..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyMessage())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                  />
                  <Button type="button" variant="outline" onClick={addKeyMessage}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.strategy.keyMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">• {msg}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyMessage(idx)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Schedule
                </label>
                <select
                  name="strategy.followUpSchedule"
                  value={formData.strategy.followUpSchedule}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                >
                  <option value="3 days">After 3 days</option>
                  <option value="1 week">After 1 week</option>
                  <option value="2 weeks">After 2 weeks</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={loading}>
            {isEditing ? 'Save Changes' : 'Create Campaign'}
          </Button>
        </div>
      </div>
    </div>
  );
}
