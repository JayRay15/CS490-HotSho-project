import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import Button from '../Button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function LogActivityModal({ onClose, onSuccess, contactId = null, reminderId = null }) {
  const { getToken } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [formData, setFormData] = useState({
    contactId: contactId || '',
    activityType: 'Email Sent',
    activityDate: new Date().toISOString().split('T')[0],
    direction: 'Outbound',
    subject: '',
    notes: '',
    sentiment: 'Neutral',
    responseReceived: false,
    valueExchange: 'None',
    valueType: '',
    opportunityGenerated: false,
    opportunityType: '',
    followUpRequired: false,
    followUpDate: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

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
      const activityData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      };

      if (reminderId) {
        activityData.linkedReminderId = reminderId;
      }

      await axios.post(
        `${API_BASE_URL}/api/relationship-maintenance/activities`,
        activityData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (error) {
      console.error('Error logging activity:', error);
      alert('Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  // Close when clicking backdrop (but not when clicking inside modal)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Log Activity</h2>
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

            {/* Activity Type and Direction */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type *
                </label>
                <select
                  name="activityType"
                  value={formData.activityType}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="Email Sent">Email Sent</option>
                  <option value="Email Received">Email Received</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Meeting">Meeting</option>
                  <option value="LinkedIn Message">LinkedIn Message</option>
                  <option value="Coffee Chat">Coffee Chat</option>
                  <option value="Introduction Made">Introduction Made</option>
                  <option value="Referral Requested">Referral Requested</option>
                  <option value="Referral Provided">Referral Provided</option>
                  <option value="Job Lead Shared">Job Lead Shared</option>
                  <option value="Advice Requested">Advice Requested</option>
                  <option value="Advice Given">Advice Given</option>
                  <option value="Birthday Wish">Birthday Wish</option>
                  <option value="Congratulations Sent">Congratulations Sent</option>
                  <option value="Thank You Sent">Thank You Sent</option>
                  <option value="Industry News Shared">Industry News Shared</option>
                  <option value="Event Attended Together">Event Attended Together</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direction *
                </label>
                <select
                  name="direction"
                  value={formData.direction}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="Outbound">Outbound</option>
                  <option value="Inbound">Inbound</option>
                  <option value="Mutual">Mutual</option>
                </select>
              </div>
            </div>

            {/* Date and Sentiment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Date *
                </label>
                <input
                  type="date"
                  name="activityDate"
                  value={formData.activityDate}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sentiment
                </label>
                <select
                  name="sentiment"
                  value={formData.sentiment}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Coffee chat about career growth"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Add details about this interaction..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Value Exchange */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value Exchange
                </label>
                <select
                  name="valueExchange"
                  value={formData.valueExchange}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="None">None</option>
                  <option value="Given">Given</option>
                  <option value="Received">Received</option>
                  <option value="Mutual">Mutual</option>
                </select>
              </div>
              {formData.valueExchange !== 'None' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value Type
                  </label>
                  <select
                    name="valueType"
                    value={formData.valueType}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select type...</option>
                    <option value="Job Lead">Job Lead</option>
                    <option value="Introduction">Introduction</option>
                    <option value="Advice">Advice</option>
                    <option value="Information">Information</option>
                    <option value="Referral">Referral</option>
                    <option value="Recommendation">Recommendation</option>
                    <option value="Mentorship">Mentorship</option>
                    <option value="Support">Support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="responseReceived"
                  checked={formData.responseReceived}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Response received</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="opportunityGenerated"
                  checked={formData.opportunityGenerated}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Generated an opportunity</span>
              </label>

              {formData.opportunityGenerated && (
                <div className="ml-6">
                  <select
                    name="opportunityType"
                    value={formData.opportunityType}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select opportunity type...</option>
                    <option value="Job Interview">Job Interview</option>
                    <option value="Job Offer">Job Offer</option>
                    <option value="Referral">Referral</option>
                    <option value="Introduction">Introduction</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="followUpRequired"
                  checked={formData.followUpRequired}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Follow-up required</span>
              </label>

              {formData.followUpRequired && (
                <div className="ml-6">
                  <input
                    type="date"
                    name="followUpDate"
                    value={formData.followUpDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., career advice, job search, networking"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#777C6D] hover:bg-[#656A5C] text-white">
                {loading ? 'Logging...' : 'Log Activity'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
