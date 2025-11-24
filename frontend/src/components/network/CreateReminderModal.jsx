import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import Button from '../Button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function CreateReminderModal({ onClose, onSuccess, contactId = null }) {
  const { getToken } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    contactId: contactId || '',
    reminderType: 'General Check-in',
    reminderDate: new Date().toISOString().split('T')[0],
    priority: 'Medium',
    title: '',
    description: '',
    suggestedMessage: '',
    isRecurring: false,
    recurrencePattern: 'Weekly'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (formData.reminderType) {
      loadTemplates();
    }
  }, [formData.reminderType, formData.contactId]);

  const loadContacts = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // API returns { success, count, data } structure
      const contactsData = response.data.data || response.data;
      setContacts(Array.isArray(contactsData) ? contactsData : []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    }
  };

  const loadTemplates = async () => {
    try {
      const token = await getToken();
      const params = { reminderType: formData.reminderType };
      if (formData.contactId) params.contactId = formData.contactId;
      
      const response = await axios.get(
        `${API_BASE_URL}/api/relationship-maintenance/reminders/templates`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/api/relationship-maintenance/reminders`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Reminder</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contact Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact *
              </label>
              <select
                name="contactId"
                value={formData.contactId}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select a contact</option>
                {contacts.map(contact => (
                  <option key={contact._id} value={contact._id}>
                    {contact.firstName} {contact.lastName}
                    {contact.company && ` - ${contact.company}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Reminder Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Type *
              </label>
              <select
                name="reminderType"
                value={formData.reminderType}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="General Check-in">General Check-in</option>
                <option value="Birthday">Birthday</option>
                <option value="Work Anniversary">Work Anniversary</option>
                <option value="Industry News Share">Industry News Share</option>
                <option value="Congratulations">Congratulations</option>
                <option value="Thank You">Thank You</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Coffee Chat">Coffee Chat</option>
                <option value="Relationship Maintenance">Relationship Maintenance</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            {/* Date and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Date *
                </label>
                <input
                  type="date"
                  name="reminderDate"
                  value={formData.reminderDate}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Check in with John"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Add any context or notes..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Suggested Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggested Message
              </label>
              {templates.length > 0 && (
                <div className="mb-2">
                  <label className="block text-xs text-gray-600 mb-1">Use a template:</label>
                  <select
                    onChange={(e) => setFormData(prev => ({ ...prev, suggestedMessage: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select a template...</option>
                    {templates.map((template, index) => (
                      <option key={index} value={template}>
                        {template.substring(0, 60)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <textarea
                name="suggestedMessage"
                value={formData.suggestedMessage}
                onChange={handleChange}
                rows={4}
                placeholder="Add a suggested outreach message..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Recurring Options */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Make this a recurring reminder
                </span>
              </label>
            </div>

            {formData.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recurrence Pattern
                </label>
                <select
                  name="recurrencePattern"
                  value={formData.recurrencePattern}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Biweekly">Biweekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Reminder'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
