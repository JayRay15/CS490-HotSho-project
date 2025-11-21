import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createGoal, updateGoal, validateSmartGoal } from '../api/goals';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import toast from 'react-hot-toast';
import { Target, Calendar, TrendingUp, CheckCircle, Plus, X } from 'lucide-react';

const GoalForm = ({ goal, isEdit = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const recommendationData = location.state?.recommendation;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    specific: '',
    measurable: {
      metric: '',
      currentValue: 0,
      targetValue: 0,
      unit: ''
    },
    achievable: '',
    relevant: '',
    timeBound: {
      startDate: new Date().toISOString().split('T')[0],
      targetDate: ''
    },
    category: 'Job Search',
    type: 'Short-term',
    priority: 'Medium',
    milestones: [],
    tags: []
  });

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', targetDate: '' });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (goal) {
      setFormData({
        ...goal,
        timeBound: {
          startDate: goal.timeBound?.startDate ? new Date(goal.timeBound.startDate).toISOString().split('T')[0] : '',
          targetDate: goal.timeBound?.targetDate ? new Date(goal.timeBound.targetDate).toISOString().split('T')[0] : ''
        }
      });
    } else if (recommendationData) {
      // Pre-fill from recommendation
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + (recommendationData.timeline || 30));
      
      setFormData({
        ...formData,
        title: recommendationData.title || '',
        description: recommendationData.specific || '',
        specific: recommendationData.specific || '',
        measurable: {
          metric: recommendationData.measurable?.metric || '',
          currentValue: 0,
          targetValue: recommendationData.measurable?.targetValue || 0,
          unit: recommendationData.measurable?.unit || ''
        },
        category: recommendationData.category || 'Job Search',
        type: recommendationData.type || 'Short-term',
        priority: recommendationData.priority || 'Medium',
        timeBound: {
          startDate: new Date().toISOString().split('T')[0],
          targetDate: targetDate.toISOString().split('T')[0]
        },
        milestones: recommendationData.milestones?.map((m, i) => ({
          title: m,
          description: '',
          targetDate: ''
        })) || []
      });
    }
  }, [goal, recommendationData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addMilestone = () => {
    if (!newMilestone.title.trim()) {
      toast.error('Milestone title is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { ...newMilestone, completed: false }]
    }));
    setNewMilestone({ title: '', description: '', targetDate: '' });
    toast.success('Milestone added');
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    if (formData.tags.includes(newTag.trim())) {
      toast.error('Tag already exists');
      return;
    }
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()]
    }));
    setNewTag('');
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const validation = validateSmartGoal(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setErrors([]);
    setLoading(true);

    try {
      if (isEdit) {
        await updateGoal(goal._id, formData);
        toast.success('Goal updated successfully!');
      } else {
        await createGoal(formData);
        toast.success('Goal created successfully!');
      }
      navigate('/goals');
    } catch (error) {
      console.error('Submit Goal Error:', error);
      toast.error(error.message || 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Job Search',
    'Skill Development',
    'Networking',
    'Career Advancement',
    'Salary Negotiation',
    'Work-Life Balance',
    'Professional Certification',
    'Industry Knowledge',
    'Leadership',
    'Custom'
  ];

  const units = ['applications', 'interviews', 'offers', 'skills', 'connections', 'hours', 'days', 'projects', 'certifications', 'custom'];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="w-8 h-8 text-primary-600" />
          {isEdit ? 'Edit Goal' : 'Create New Goal'}
        </h1>
        <p className="text-gray-600 mt-2">
          Set a SMART goal to advance your career objectives
        </p>
      </div>

      {errors.length > 0 && (
        <Card className="bg-red-50 border-red-200 mb-6">
          <h3 className="font-bold text-red-900 mb-2">Please fix the following errors:</h3>
          <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goal Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Apply to 20 software engineering positions"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your goal in detail..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="Short-term">Short-term (0-3 months)</option>
                  <option value="Long-term">Long-term (3+ months)</option>
                  <option value="Milestone">Milestone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* SMART Criteria */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            SMART Criteria
          </h2>

          <div className="space-y-4">
            {/* Specific */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-primary-600 font-bold">S</span>pecific: What exactly do you want to accomplish? *
              </label>
              <textarea
                name="specific"
                value={formData.specific}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Be specific about what you want to achieve..."
                required
              />
            </div>

            {/* Measurable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-primary-600 font-bold">M</span>easurable: How will you measure progress? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <input
                    type="text"
                    name="measurable.metric"
                    value={formData.measurable.metric}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Metric name"
                    required
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="measurable.currentValue"
                    value={formData.measurable.currentValue}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Current value"
                    min="0"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="measurable.targetValue"
                    value={formData.measurable.targetValue}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Target value"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <select
                    name="measurable.unit"
                    value={formData.measurable.unit}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select unit</option>
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Achievable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-primary-600 font-bold">A</span>chievable: Why is this goal realistic? *
              </label>
              <textarea
                name="achievable"
                value={formData.achievable}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Explain why this goal is achievable given your resources and constraints..."
                required
              />
            </div>

            {/* Relevant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-primary-600 font-bold">R</span>elevant: Why is this goal important? *
              </label>
              <textarea
                name="relevant"
                value={formData.relevant}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Explain how this goal aligns with your career objectives..."
                required
              />
            </div>

            {/* Time-bound */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-primary-600 font-bold">T</span>ime-bound: When will you achieve this? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="timeBound.startDate"
                    value={formData.timeBound.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    name="timeBound.targetDate"
                    value={formData.timeBound.targetDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min={formData.timeBound.startDate}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Milestones */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-600" />
            Milestones (Optional)
          </h2>

          {formData.milestones.length > 0 && (
            <div className="space-y-2 mb-4">
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{milestone.title}</p>
                    {milestone.targetDate && (
                      <p className="text-sm text-gray-600">
                        Due: {new Date(milestone.targetDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMilestone(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Milestone title"
              />
            </div>
            <div>
              <input
                type="date"
                value={newMilestone.targetDate}
                onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min={formData.timeBound.startDate}
                max={formData.timeBound.targetDate}
              />
            </div>
            <div>
              <Button type="button" variant="outline" onClick={addMilestone} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </Card>

        {/* Tags */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tags (Optional)</h2>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Add a tag (press Enter)"
            />
            <Button type="button" variant="outline" onClick={addTag}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                {isEdit ? 'Update Goal' : 'Create Goal'}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate('/goals')}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GoalForm;
