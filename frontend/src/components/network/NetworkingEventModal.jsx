import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import Button from '../Button';
import InputField from '../InputField';

export default function NetworkingEventModal({ event, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    eventDate: '',
    endDate: '',
    location: '',
    eventType: 'Other',
    isVirtual: false,
    virtualLink: '',
    industry: '',
    description: '',
    attendanceStatus: 'Planning to Attend',
    preparationNotes: '',
    preparationCompleted: false,
    goals: [],
    targetConnectionCount: '',
    connectionsGained: 0,
    jobLeadsGenerated: 0,
    roiRating: '',
    keyTakeaways: '',
    postEventNotes: '',
    organizer: '',
    website: '',
    cost: '',
    tags: []
  });

  const [newGoal, setNewGoal] = useState('');
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
        location: event.location || '',
        eventType: event.eventType || 'Other',
        isVirtual: event.isVirtual || false,
        virtualLink: event.virtualLink || '',
        industry: event.industry || '',
        description: event.description || '',
        attendanceStatus: event.attendanceStatus || 'Planning to Attend',
        preparationNotes: event.preparationNotes || '',
        preparationCompleted: event.preparationCompleted || false,
        goals: event.goals || [],
        targetConnectionCount: event.targetConnectionCount || '',
        connectionsGained: event.connectionsGained || 0,
        jobLeadsGenerated: event.jobLeadsGenerated || 0,
        roiRating: event.roiRating || '',
        keyTakeaways: event.keyTakeaways || '',
        postEventNotes: event.postEventNotes || '',
        organizer: event.organizer || '',
        website: event.website || '',
        cost: event.cost || '',
        tags: event.tags || []
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, { description: newGoal.trim(), achieved: false }]
      }));
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (index) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const handleToggleGoalAchieved = (index) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.map((goal, i) =>
        i === index ? { ...goal, achieved: !goal.achieved } : goal
      )
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        targetConnectionCount: formData.targetConnectionCount ? Number(formData.targetConnectionCount) : undefined,
        connectionsGained: Number(formData.connectionsGained),
        jobLeadsGenerated: Number(formData.jobLeadsGenerated),
        roiRating: formData.roiRating ? Number(formData.roiRating) : undefined,
        cost: formData.cost ? Number(formData.cost) : undefined
      };

      await onSave(submitData);
      onClose();
    } catch (err) {
      console.error('Error saving networking event:', err);
      setError(err.response?.data?.message || 'Failed to save networking event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {event ? 'Edit Networking Event' : 'Add Networking Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <InputField
                  label="Event Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <InputField
                label="Event Date & Time *"
                name="eventDate"
                type="datetime-local"
                value={formData.eventDate}
                onChange={handleChange}
                required
              />
              <InputField
                label="End Date & Time"
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={handleChange}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Conference">Conference</option>
                  <option value="Meetup">Meetup</option>
                  <option value="Career Fair">Career Fair</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Social Event">Social Event</option>
                  <option value="Industry Mixer">Industry Mixer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendance Status
                </label>
                <select
                  name="attendanceStatus"
                  value={formData.attendanceStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Planning to Attend">Planning to Attend</option>
                  <option value="Registered">Registered</option>
                  <option value="Attended">Attended</option>
                  <option value="Missed">Missed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center cursor-pointer">
                  <input
                  type="checkbox"
                  name="isVirtual"
                  checked={formData.isVirtual}
                  onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Virtual Event</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {formData.isVirtual ? (
                <InputField
                  label="Virtual Link"
                  name="virtualLink"
                  value={formData.virtualLink}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              ) : (
                <InputField
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              )}
              <InputField
                label="Industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
              <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Brief description of the event..."
            />
          </div>

          {/* Networking Goals */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Networking Goals</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGoal())}
                placeholder="Add a networking goal..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Button type="button" onClick={handleAddGoal} variant="secondary">
                <Plus size={20} />
              </Button>
            </div>
            {formData.goals.length > 0 && (
              <ul className="space-y-2">
                {formData.goals.map((goal, index) => (
                  <li key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={goal.achieved}
                      onChange={() => handleToggleGoalAchieved(index)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className={`flex-1 ${goal.achieved ? 'line-through text-gray-500' : ''}`}>
                      {goal.description}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(index)}
                      className="p-1 hover:bg-red-100 rounded transition text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <InputField
                label="Target Connection Count"
                name="targetConnectionCount"
                type="number"
                min="0"
                value={formData.targetConnectionCount}
                onChange={handleChange}
                placeholder="How many people do you want to connect with?"
              />
            </div>
          </div>

          {/* Preparation */}
          {new Date(formData.eventDate) > new Date() && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Pre-Event Preparation</h3>
              <textarea
                name="preparationNotes"
                value={formData.preparationNotes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
                placeholder="Research notes, talking points, preparation checklist..."
              />
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="preparationCompleted"
                  checked={formData.preparationCompleted}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Preparation Completed</span>
              </label>
            </div>
          )}

          {/* Post-Event Tracking */}
          {formData.attendanceStatus === 'Attended' && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Post-Event Tracking</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <InputField
                  label="Connections Made"
                  name="connectionsGained"
                  type="number"
                  min="0"
                  value={formData.connectionsGained}
                  onChange={handleChange}
                />
                <InputField
                  label="Job Leads Generated"
                  name="jobLeadsGenerated"
                  type="number"
                  min="0"
                  value={formData.jobLeadsGenerated}
                  onChange={handleChange}
                />
                <InputField
                  label="ROI Rating (1-5)"
                  name="roiRating"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.roiRating}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Takeaways
                  </label>
                  <textarea
                    name="keyTakeaways"
                    value={formData.keyTakeaways}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Important insights, lessons learned..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Post-Event Notes
                  </label>
                  <textarea
                    name="postEventNotes"
                    value={formData.postEventNotes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Follow-up actions, additional notes..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Organizer"
                name="organizer"
                value={formData.organizer}
                onChange={handleChange}
              />
              <InputField
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://..."
              />
              <InputField
                label="Cost ($)"
                name="cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Button type="button" onClick={handleAddTag} variant="secondary">
                <Plus size={20} />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#777C6D] hover:bg-[#656A5C] text-white">
              {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
