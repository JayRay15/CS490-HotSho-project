import api from './axios';

// ===== PARTNERSHIP MANAGEMENT =====

/**
 * Invite an accountability partner
 */
export const invitePartner = async (partnerData) => {
    const response = await api.post('/api/accountability/partners/invite', partnerData);
    return response.data;
};

/**
 * Accept partnership invitation
 */
export const acceptPartnerInvitation = async (token) => {
    const response = await api.post(`/api/accountability/partners/accept/${token}`);
    return response.data;
};

// Alias for acceptPartnerInvitation
export const acceptInvitation = acceptPartnerInvitation;

/**
 * Get all my partnerships
 */
export const getMyPartnerships = async () => {
    const response = await api.get('/api/accountability/partners');
    return response.data;
};

// Alias for getMyPartnerships
export const getPartnerships = getMyPartnerships;

/**
 * Update partnership settings
 */
export const updatePartnership = async (partnershipId, updates) => {
    const response = await api.put(`/api/accountability/partners/${partnershipId}`, updates);
    return response.data;
};

/**
 * End/remove partnership
 */
export const endPartnership = async (partnershipId) => {
    const response = await api.delete(`/api/accountability/partners/${partnershipId}`);
    return response.data;
};

/**
 * Record a check-in
 */
export const recordCheckIn = async (partnershipId, data) => {
    const response = await api.post(`/api/accountability/check-in/${partnershipId}`, data);
    return response.data;
};

// ===== PROGRESS SHARING =====

/**
 * Share progress with partners
 */
export const shareProgress = async (progressData) => {
    const response = await api.post('/api/accountability/progress', progressData);
    return response.data;
};

/**
 * Get my progress shares
 */
export const getMyProgressShares = async (params = {}) => {
    const response = await api.get('/api/accountability/progress', { params });
    return response.data;
};

/**
 * Get progress shared with me (as a partner)
 */
export const getSharedProgress = async (partnershipId, params = {}) => {
    const response = await api.get(`/api/accountability/progress/shared/${partnershipId}`, { params });
    return response.data;
};

/**
 * View progress by token (public/semi-public)
 */
export const viewProgressByToken = async (token) => {
    const response = await api.get(`/api/accountability/progress/view/${token}`);
    return response.data;
};

/**
 * Add encouragement to a progress share
 */
export const addEncouragement = async (shareId, data) => {
    const response = await api.post(`/api/accountability/progress/${shareId}/encourage`, data);
    return response.data;
};

// ===== ACHIEVEMENTS =====

/**
 * Get user's achievements
 */
export const getAchievements = async () => {
    const response = await api.get('/api/accountability/achievements');
    return response.data;
};

/**
 * Celebrate/share an achievement
 */
export const celebrateAchievement = async (achievementId, partnershipIds) => {
    const response = await api.post(`/api/accountability/achievements/${achievementId}/celebrate`, {
        partnershipIds,
    });
    return response.data;
};

// ===== MESSAGING =====

/**
 * Send message to partner
 */
export const sendMessage = async (messageData) => {
    const response = await api.post('/api/accountability/messages', messageData);
    return response.data;
};

/**
 * Get messages for a partnership
 */
export const getMessages = async (partnershipId, params = {}) => {
    const response = await api.get(`/api/accountability/messages/${partnershipId}`, { params });
    return response.data;
};

// ===== INSIGHTS & ANALYTICS =====

/**
 * Get accountability insights
 */
export const getInsights = async () => {
    const response = await api.get('/api/accountability/insights');
    return response.data;
};

/**
 * Get weekly summary
 */
export const getWeeklySummary = async () => {
    const response = await api.get('/api/accountability/weekly-summary');
    return response.data;
};
