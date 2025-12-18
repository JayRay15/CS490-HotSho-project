import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setAuthToken } from '../../api/axios';
import Button from '../Button';

export default function ContactFormModal({ contact, onClose, onSave }) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInteractionForm, setShowInteractionForm] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phoneticFirstName: '',
    phoneticMiddleName: '',
    phoneticLastName: '',
    prefix: '',
    suffix: '',
    nickname: '',
    fileAs: '',
    email: '',
    emailLabel: '',
    phone: '',
    company: '',
    jobTitle: '',
    department: '',
    industry: '',
    relationshipType: 'Other',
    relationshipStrength: 'New',
    linkedInUrl: '',
    location: '',
    birthday: '',
    notes: '',
    photo: '',
    personalInterests: '',
    professionalInterests: '',
    mutualConnections: '',
    tags: '',
    nextFollowUpDate: '',
    reminderEnabled: false,
    canProvideReferral: false,
    isReference: false
  });

  const [newInteraction, setNewInteraction] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Email',
    notes: ''
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.firstName || '',
        middleName: contact.middleName || '',
        lastName: contact.lastName || '',
        phoneticFirstName: contact.phoneticFirstName || '',
        phoneticMiddleName: contact.phoneticMiddleName || '',
        phoneticLastName: contact.phoneticLastName || '',
        prefix: contact.prefix || '',
        suffix: contact.suffix || '',
        nickname: contact.nickname || '',
        fileAs: contact.fileAs || '',
        email: contact.email || '',
        emailLabel: contact.emailLabel || '',
        phone: contact.phone || '',
        company: contact.company || '',
        jobTitle: contact.jobTitle || '',
        department: contact.department || '',
        industry: contact.industry || '',
        relationshipType: contact.relationshipType || 'Other',
        relationshipStrength: contact.relationshipStrength || 'New',
        linkedInUrl: contact.linkedInUrl || '',
        location: contact.location || '',
        birthday: contact.birthday || '',
        notes: contact.notes || '',
        photo: contact.photo || '',
        personalInterests: contact.personalInterests || '',
        professionalInterests: contact.professionalInterests || '',
        mutualConnections: contact.mutualConnections?.join(', ') || '',
        tags: contact.tags?.join(', ') || '',
        nextFollowUpDate: contact.nextFollowUpDate
          ? new Date(contact.nextFollowUpDate).toISOString().split('T')[0]
          : '',
        reminderEnabled: contact.reminderEnabled || false,
        canProvideReferral: contact.canProvideReferral || false,
        isReference: contact.isReference || false
      });
    }
  }, [contact]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleInteractionChange = (e) => {
    const { name, value } = e.target;
    setNewInteraction((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      setAuthToken(token);

      // Process arrays from comma-separated strings
      const processedData = {
        ...formData,
        mutualConnections: formData.mutualConnections
          ? formData.mutualConnections.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        tags: formData.tags
          ? formData.tags.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        nextFollowUpDate: formData.nextFollowUpDate || undefined
      };

      if (contact) {
        // Update existing contact
        await api.put(`/api/contacts/${contact._id}`, processedData);
      } else {
        // Create new contact
        await api.post('/api/contacts', processedData);
      }

      onSave();
    } catch (err) {
      console.error('Error saving contact:', err);
      setError(err.response?.data?.message || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInteraction = async () => {
    if (!contact) {
      alert('Please save the contact first before adding interactions');
      return;
    }

    try {
      const token = await getToken();
      setAuthToken(token);

      await api.post(`/api/contacts/${contact._id}/interactions`, newInteraction);

      setNewInteraction({
        date: new Date().toISOString().split('T')[0],
        type: 'Email',
        notes: ''
      });
      setShowInteractionForm(false);
      onSave();
    } catch (err) {
      console.error('Error adding interaction:', err);
      alert(err.response?.data?.message || 'Failed to add interaction');
    }
  };

  // Handler for clicking the backdrop
  const handleBackdropClick = (e) => {
    // Only close if the click is directly on the backdrop, not on modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="contact-firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contact-firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-middleName" className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  id="contact-middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="contact-lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-prefix" className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
                <input
                  type="text"
                  id="contact-prefix"
                  name="prefix"
                  value={formData.prefix}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-suffix" className="block text-sm font-medium text-gray-700 mb-1">Suffix</label>
                <input
                  type="text"
                  id="contact-suffix"
                  name="suffix"
                  value={formData.suffix}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-nickname" className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                <input
                  type="text"
                  id="contact-nickname"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  id="contact-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-birthday" className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                <input
                  type="text"
                  id="contact-birthday"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-company" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  id="contact-company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-jobTitle" className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  id="contact-jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  id="contact-department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-industry" className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input
                  type="text"
                  id="contact-industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  id="contact-location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State/Country"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="contact-linkedInUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  id="contact-linkedInUrl"
                  name="linkedInUrl"
                  value={formData.linkedInUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Relationship Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Relationship Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-relationshipType" className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship Type
                </label>
                <select
                  id="contact-relationshipType"
                  name="relationshipType"
                  value={formData.relationshipType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Mentor">Mentor</option>
                  <option value="Peer">Peer</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="Manager">Manager</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Alumni">Alumni</option>
                  <option value="Industry Contact">Industry Contact</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="contact-relationshipStrength" className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship Strength
                </label>
                <select
                  id="contact-relationshipStrength"
                  name="relationshipStrength"
                  value={formData.relationshipStrength}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Strong">Strong</option>
                  <option value="Medium">Medium</option>
                  <option value="Weak">Weak</option>
                  <option value="New">New</option>
                </select>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="canProvideReferral"
                  checked={formData.canProvideReferral}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Can provide referrals</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isReference"
                  checked={formData.isReference}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Can serve as a professional reference
                </span>
              </label>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="contact-notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  id="contact-notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="General notes about this contact..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-professionalInterests" className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Interests
                </label>
                <textarea
                  id="contact-professionalInterests"
                  name="professionalInterests"
                  value={formData.professionalInterests}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Their professional interests and expertise..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-personalInterests" className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Interests
                </label>
                <textarea
                  id="contact-personalInterests"
                  name="personalInterests"
                  value={formData.personalInterests}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Hobbies, interests for relationship building..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-mutualConnections" className="block text-sm font-medium text-gray-700 mb-1">
                  Mutual Connections
                </label>
                <input
                  type="text"
                  id="contact-mutualConnections"
                  name="mutualConnections"
                  value={formData.mutualConnections}
                  onChange={handleChange}
                  placeholder="Comma-separated list of mutual connections"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  id="contact-tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="Comma-separated tags (e.g., tech, NYC, hiring)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Follow-up Reminder */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow-up Reminder</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="contact-nextFollowUpDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  id="contact-nextFollowUpDate"
                  name="nextFollowUpDate"
                  value={formData.nextFollowUpDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="reminderEnabled"
                  checked={formData.reminderEnabled}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable reminder notifications</span>
              </label>
            </div>
          </div>

          {/* Interaction History (for existing contacts) */}
          {contact && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Interaction History</h3>
                <button
                  type="button"
                  onClick={() => setShowInteractionForm(!showInteractionForm)}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  {showInteractionForm ? 'Cancel' : '+ Add Interaction'}
                </button>
              </div>

              {showInteractionForm && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="interaction-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        id="interaction-date"
                        name="date"
                        value={newInteraction.date}
                        onChange={handleInteractionChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="interaction-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        id="interaction-type"
                        name="type"
                        value={newInteraction.type}
                        onChange={handleInteractionChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="Email">Email</option>
                        <option value="Phone">Phone</option>
                        <option value="Meeting">Meeting</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Coffee Chat">Coffee Chat</option>
                        <option value="Conference">Conference</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="interaction-notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      id="interaction-notes"
                      name="notes"
                      value={newInteraction.notes}
                      onChange={handleInteractionChange}
                      rows={2}
                      placeholder="Brief notes about the interaction..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddInteraction}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Add Interaction
                  </button>
                </div>
              )}

              {contact.interactions && contact.interactions.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[...contact.interactions]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((interaction, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gray-900">{interaction.type}</span>
                          <span className="text-gray-500">
                            {new Date(interaction.date).toLocaleDateString()}
                          </span>
                        </div>
                        {interaction.notes && (
                          <p className="text-gray-600">{interaction.notes}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#777C6D] hover:bg-[#656A5C] text-white">
              {loading ? 'Saving...' : contact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
