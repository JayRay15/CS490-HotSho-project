import axiosInstance from './axios';

// ===============================================
// Follow-Up Reminders API
// ===============================================

/**
 * Get all follow-up reminders for the user
 * @param {Object} options - { status?, limit?, includeCompleted? }
 * @returns {Promise<Object>} List of reminders
 */
export const getAllReminders = async (options = {}) => {
  const params = new URLSearchParams();
  if (options.status) params.append('status', options.status);
  if (options.limit) params.append('limit', options.limit);
  if (options.includeCompleted) params.append('includeCompleted', options.includeCompleted);
  
  const response = await axiosInstance.get(`/api/follow-up-reminders?${params.toString()}`);
  return response.data;
};

/**
 * Get reminders for a specific job
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} List of reminders for the job
 */
export const getJobReminders = async (jobId) => {
  const response = await axiosInstance.get(`/api/follow-up-reminders/job/${jobId}`);
  return response.data;
};

/**
 * Get pending reminders (due within specified days)
 * @param {number} days - Days to look ahead (default 7)
 * @returns {Promise<Object>} Overdue and upcoming reminders
 */
export const getPendingReminders = async (days = 7) => {
  const response = await axiosInstance.get(`/api/follow-up-reminders/pending?days=${days}`);
  return response.data;
};

/**
 * Get reminder statistics
 * @returns {Promise<Object>} Reminder statistics
 */
export const getReminderStats = async () => {
  const response = await axiosInstance.get('/api/follow-up-reminders/stats');
  return response.data;
};

/**
 * Create a new reminder
 * @param {Object} reminderData - { jobId, type?, title?, description?, scheduledDate?, priority? }
 * @returns {Promise<Object>} Created reminder
 */
export const createReminder = async (reminderData) => {
  const response = await axiosInstance.post('/api/follow-up-reminders', reminderData);
  return response.data;
};

/**
 * Snooze a reminder
 * @param {string} reminderId - Reminder ID
 * @param {Object} snoozeData - { days, reason? }
 * @returns {Promise<Object>} Updated reminder
 */
export const snoozeReminder = async (reminderId, snoozeData) => {
  const response = await axiosInstance.put(`/api/follow-up-reminders/${reminderId}/snooze`, snoozeData);
  return response.data;
};

/**
 * Dismiss a reminder
 * @param {string} reminderId - Reminder ID
 * @param {string} reason - Reason for dismissal
 * @returns {Promise<Object>} Updated reminder
 */
export const dismissReminder = async (reminderId, reason = '') => {
  const response = await axiosInstance.put(`/api/follow-up-reminders/${reminderId}/dismiss`, { reason });
  return response.data;
};

/**
 * Complete a reminder
 * @param {string} reminderId - Reminder ID
 * @param {Object} completeData - { method?, notes?, followUpId? }
 * @returns {Promise<Object>} Updated reminder
 */
export const completeReminder = async (reminderId, completeData = {}) => {
  const response = await axiosInstance.put(`/api/follow-up-reminders/${reminderId}/complete`, completeData);
  return response.data;
};

/**
 * Mark response received for a reminder
 * @param {string} reminderId - Reminder ID
 * @param {number} responseTime - Response time in days
 * @returns {Promise<Object>} Updated reminder
 */
export const markResponseReceived = async (reminderId, responseTime = null) => {
  const response = await axiosInstance.put(`/api/follow-up-reminders/${reminderId}/response`, { responseTime });
  return response.data;
};

/**
 * Delete a reminder
 * @param {string} reminderId - Reminder ID
 * @returns {Promise<Object>} Success response
 */
export const deleteReminder = async (reminderId) => {
  const response = await axiosInstance.delete(`/api/follow-up-reminders/${reminderId}`);
  return response.data;
};

/**
 * Get etiquette tips for a reminder type
 * @param {string} type - Reminder type
 * @returns {Promise<Object>} Etiquette tips
 */
export const getEtiquetteTips = async (type) => {
  const response = await axiosInstance.get(`/api/follow-up-reminders/tips/${type}`);
  return response.data;
};

/**
 * Get company responsiveness data
 * @param {string} company - Company name
 * @returns {Promise<Object>} Company responsiveness data
 */
export const getCompanyResponsiveness = async (company) => {
  const encodedCompany = encodeURIComponent(company);
  const response = await axiosInstance.get(`/api/follow-up-reminders/responsiveness/${encodedCompany}`);
  return response.data;
};

/**
 * Trigger reminder creation for a status change
 * @param {string} jobId - Job ID
 * @param {Object} statusData - { newStatus, previousStatus? }
 * @returns {Promise<Object>} Created reminder(s)
 */
export const triggerStatusChangeReminders = async (jobId, statusData) => {
  const response = await axiosInstance.post(`/api/follow-up-reminders/job/${jobId}/status-change`, statusData);
  return response.data;
};

/**
 * Dismiss all reminders for rejected applications
 * @returns {Promise<Object>} Number of dismissed reminders
 */
export const dismissRejectedReminders = async () => {
  const response = await axiosInstance.post('/api/follow-up-reminders/dismiss-rejected');
  return response.data;
};

/**
 * Generate email template for a reminder
 * @param {string} reminderId - Reminder ID
 * @returns {Promise<Object>} Email template with subject and body
 */
export const generateEmailTemplate = async (reminderId) => {
  const response = await axiosInstance.get(`/api/follow-up-reminders/${reminderId}/email-template`);
  return response.data;
};

// Helper functions for UI

/**
 * Get priority badge color classes
 * @param {string} priority - Priority level
 * @returns {string} Tailwind CSS classes
 */
export const getPriorityBadgeClasses = (priority) => {
  const classes = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };
  return classes[priority] || classes.medium;
};

/**
 * Get status badge color classes
 * @param {string} status - Reminder status
 * @returns {string} Tailwind CSS classes
 */
export const getStatusBadgeClasses = (status) => {
  const classes = {
    pending: 'bg-blue-100 text-blue-800',
    snoozed: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-600',
    expired: 'bg-red-100 text-red-800'
  };
  return classes[status] || classes.pending;
};

/**
 * Get reminder type display info
 * @param {string} type - Reminder type
 * @returns {Object} { label, icon, description }
 */
export const getReminderTypeInfo = (type) => {
  const typeInfo = {
    'application-follow-up': {
      label: 'Application Follow-up',
      icon: '📝',
      description: 'Follow up on your application'
    },
    'post-interview-thank-you': {
      label: 'Thank You Note',
      icon: '🙏',
      description: 'Send a thank you note after interview'
    },
    'post-interview-follow-up': {
      label: 'Interview Follow-up',
      icon: '📞',
      description: 'Follow up after interview'
    },
    'status-inquiry': {
      label: 'Status Inquiry',
      icon: '❓',
      description: 'Check on application status'
    },
    'feedback-request': {
      label: 'Feedback Request',
      icon: '💡',
      description: 'Request feedback after rejection'
    },
    'offer-response': {
      label: 'Offer Response',
      icon: '🎯',
      description: 'Respond to job offer'
    },
    'networking-follow-up': {
      label: 'Networking',
      icon: '🤝',
      description: 'Networking follow-up'
    },
    'custom': {
      label: 'Custom Reminder',
      icon: '⏰',
      description: 'Custom follow-up reminder'
    }
  };
  return typeInfo[type] || typeInfo.custom;
};

/**
 * Format scheduled date for display
 * @param {string|Date} date - Scheduled date
 * @returns {string} Formatted date string
 */
export const formatScheduledDate = (date) => {
  const scheduled = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((scheduled - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return `${absDays} day${absDays !== 1 ? 's' : ''} overdue`;
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays <= 7) {
    return `In ${diffDays} days`;
  } else {
    return scheduled.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: scheduled.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

/**
 * Get responsiveness badge info
 * @param {string} responsiveness - Responsiveness level
 * @returns {Object} { label, color, description }
 */
export const getResponsivenessInfo = (responsiveness) => {
  const info = {
    'highly-responsive': {
      label: 'Highly Responsive',
      color: 'bg-green-100 text-green-800',
      description: 'Company typically responds quickly'
    },
    'responsive': {
      label: 'Responsive',
      color: 'bg-blue-100 text-blue-800',
      description: 'Company responds within normal timeframes'
    },
    'slow': {
      label: 'Slow to Respond',
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Company may take longer to respond'
    },
    'unresponsive': {
      label: 'Often Unresponsive',
      color: 'bg-red-100 text-red-800',
      description: 'Company rarely responds to follow-ups'
    },
    'unknown': {
      label: 'Unknown',
      color: 'bg-gray-100 text-gray-600',
      description: 'No response data available'
    }
  };
  return info[responsiveness] || info.unknown;
};

export default {
  getAllReminders,
  getJobReminders,
  getPendingReminders,
  getReminderStats,
  createReminder,
  snoozeReminder,
  dismissReminder,
  completeReminder,
  markResponseReceived,
  deleteReminder,
  getEtiquetteTips,
  getCompanyResponsiveness,
  triggerStatusChangeReminders,
  dismissRejectedReminders,
  getPriorityBadgeClasses,
  getStatusBadgeClasses,
  getReminderTypeInfo,
  formatScheduledDate,
  getResponsivenessInfo
};
