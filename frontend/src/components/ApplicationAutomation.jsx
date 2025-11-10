import { useState, useEffect } from 'react';
import { X, Zap, Plus, Trash2, Edit2, CheckSquare, FileText, Users } from 'lucide-react';
import Button from './Button';
import {
  createAutomationRule,
  getAutomationRules,
  updateAutomationRule,
  deleteAutomationRule,
  createApplicationTemplate,
  getApplicationTemplates,
  updateApplicationTemplate,
  deleteApplicationTemplate,
  bulkApply
} from '../api/applications';

const ApplicationAutomation = ({ selectedJobs = [], onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('rules'); // rules, templates, bulk, checklists
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Automation Rules
  const [rules, setRules] = useState([]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  
  // Templates
  const [templates, setTemplates] = useState([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  // Bulk Apply
  const [bulkOptions, setBulkOptions] = useState({
    scheduleDaysOffset: 0,
    autoTailor: false
  });

  useEffect(() => {
    if (activeTab === 'rules') {
      loadRules();
    } else if (activeTab === 'templates') {
      loadTemplates();
    }
  }, [activeTab]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const result = await getAutomationRules();
      setRules(result.data || []);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const result = await getApplicationTemplates();
      setTemplates(result.data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (rule) => {
    try {
      await updateAutomationRule(rule._id, { active: !rule.active });
      await loadRules();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
      setError('Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;
    
    try {
      await deleteAutomationRule(ruleId);
      await loadRules();
    } catch (err) {
      console.error('Failed to delete rule:', err);
      setError('Failed to delete rule');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await deleteApplicationTemplate(templateId);
      await loadTemplates();
    } catch (err) {
      console.error('Failed to delete template:', err);
      setError('Failed to delete template');
    }
  };

  const handleBulkApply = async () => {
    if (selectedJobs.length === 0) {
      setError('Please select at least one job to apply to');
      return;
    }

    if (!confirm(`Apply to ${selectedJobs.length} job(s)?`)) return;

    try {
      setLoading(true);
      setError('');
      
      const jobIds = selectedJobs.map(job => job._id);
      const result = await bulkApply({
        jobIds,
        scheduleDaysOffset: bulkOptions.scheduleDaysOffset || undefined,
        autoTailor: bulkOptions.autoTailor
      });
      
      const { successful, failed } = result.data;
      alert(`Bulk apply completed!\n✓ ${successful.length} successful\n✗ ${failed.length} failed`);
      
      onSuccess?.();
    } catch (err) {
      console.error('Failed to bulk apply:', err);
      setError(err.response?.data?.message || 'Failed to bulk apply');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-900">Application Automation</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b bg-gray-50">
          <div className="flex gap-1 px-6">
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'rules'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Automation Rules
              </div>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'templates'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Templates
              </div>
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bulk'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Bulk Apply
                {selectedJobs.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {selectedJobs.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Automate your application workflow with custom rules
                </p>
                <Button
                  onClick={() => {
                    setEditingRule(null);
                    setShowRuleForm(true);
                  }}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Rule
                </Button>
              </div>

              {showRuleForm && (
                <RuleForm
                  rule={editingRule}
                  onSave={async (ruleData) => {
                    try {
                      if (editingRule) {
                        await updateAutomationRule(editingRule._id, ruleData);
                      } else {
                        await createAutomationRule(ruleData);
                      }
                      setShowRuleForm(false);
                      setEditingRule(null);
                      await loadRules();
                    } catch (err) {
                      setError('Failed to save rule');
                    }
                  }}
                  onCancel={() => {
                    setShowRuleForm(false);
                    setEditingRule(null);
                  }}
                />
              )}

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading rules...</div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No automation rules yet. Create one to get started!
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{rule.name}</h3>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                rule.active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {rule.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                          
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            <div>
                              <span className="font-medium">Triggered:</span> {rule.statistics?.timesTriggered || 0} times
                            </div>
                            <div>
                              <span className="font-medium">Success:</span> {rule.statistics?.successCount || 0}
                            </div>
                            <div>
                              <span className="font-medium">Failed:</span> {rule.statistics?.failureCount || 0}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleToggleRule(rule)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              rule.active
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {rule.active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingRule(rule);
                              setShowRuleForm(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Reusable templates for cover letters, emails, and follow-ups
                </p>
                <Button
                  onClick={() => {
                    setEditingTemplate(null);
                    setShowTemplateForm(true);
                  }}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Template
                </Button>
              </div>

              {showTemplateForm && (
                <TemplateForm
                  template={editingTemplate}
                  onSave={async (templateData) => {
                    try {
                      if (editingTemplate) {
                        await updateApplicationTemplate(editingTemplate._id, templateData);
                      } else {
                        await createApplicationTemplate(templateData);
                      }
                      setShowTemplateForm(false);
                      setEditingTemplate(null);
                      await loadTemplates();
                    } catch (err) {
                      setError('Failed to save template');
                    }
                  }}
                  onCancel={() => {
                    setShowTemplateForm(false);
                    setEditingTemplate(null);
                  }}
                />
              )}

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading templates...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No templates yet. Create one to get started!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <div
                      key={template._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          <span className="text-xs text-gray-500 capitalize">
                            {template.category.replace(/-/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingTemplate(template);
                              setShowTemplateForm(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template._id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                        {template.content}
                      </p>
                      <div className="text-xs text-gray-500">
                        Used {template.usageCount || 0} times
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bulk' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Selected Jobs</h3>
                {selectedJobs.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
                    No jobs selected. Go back to the jobs list and select jobs to apply to.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedJobs.map((job) => (
                      <div
                        key={job._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-600">{job.company}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedJobs.length > 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Days Offset (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={bulkOptions.scheduleDaysOffset}
                      onChange={(e) =>
                        setBulkOptions({ ...bulkOptions, scheduleDaysOffset: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0 = Apply immediately"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Schedule applications N days from now (0 = apply immediately)
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="bulkAutoTailor"
                      checked={bulkOptions.autoTailor}
                      onChange={(e) => setBulkOptions({ ...bulkOptions, autoTailor: e.target.checked })}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="bulkAutoTailor" className="flex-1 text-sm">
                      <span className="font-medium text-gray-900">Auto-tailor applications</span>
                      <p className="text-gray-600 mt-1">
                        Automatically customize resumes and cover letters for each position
                      </p>
                    </label>
                  </div>

                  <Button
                    onClick={handleBulkApply}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {loading ? 'Processing...' : `Apply to ${selectedJobs.length} Job(s)`}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t px-6 py-4 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// Rule Form Component
const RuleForm = ({ rule, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    rule || {
      name: '',
      description: '',
      active: true,
      triggers: {
        onJobAdded: false,
        onStatusChange: [],
        onScheduledDate: false,
        customSchedule: ''
      },
      actions: {
        generatePackage: false,
        scheduleApplication: false,
        sendFollowUp: false,
        updateChecklist: false
      }
    }
  );

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Auto-apply to remote jobs"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows="2"
          placeholder="Describe what this rule does..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Triggers</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.triggers.onJobAdded}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  triggers: { ...formData.triggers, onJobAdded: e.target.checked }
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            When a new job is added
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.actions.generatePackage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  actions: { ...formData.actions, generatePackage: e.target.checked }
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            Generate application package
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.actions.scheduleApplication}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  actions: { ...formData.actions, scheduleApplication: e.target.checked }
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            Schedule application
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.actions.sendFollowUp}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  actions: { ...formData.actions, sendFollowUp: e.target.checked }
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            Send follow-up reminder
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={() => onSave(formData)} size="sm">
          Save Rule
        </Button>
        <Button onClick={onCancel} variant="secondary" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
};

// Template Form Component
const TemplateForm = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    template || {
      name: '',
      category: 'cover-letter-intro',
      content: '',
      tags: []
    }
  );

  const categories = [
    'cover-letter-intro',
    'why-company',
    'why-role',
    'experience-summary',
    'closing',
    'email-subject',
    'follow-up',
    'thank-you',
    'custom'
  ];

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Software Engineer Opening"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          rows="6"
          placeholder="Template content... Use {{variable}} for dynamic values"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use {'{{companyName}}'}, {'{{jobTitle}}'}, {'{{yourName}}'} for variables
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={() => onSave(formData)} size="sm">
          Save Template
        </Button>
        <Button onClick={onCancel} variant="secondary" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ApplicationAutomation;
