import api from './axios';

// ===== TEAM MANAGEMENT =====

/**
 * Create a new team
 */
export const createTeam = async (teamData) => {
    const response = await api.post('/api/teams', teamData);
    return response.data;
};

/**
 * Get user's teams
 */
export const getMyTeams = async () => {
    const response = await api.get('/api/teams');
    return response.data;
};

/**
 * Get team by ID or slug
 */
export const getTeam = async (identifier) => {
    const response = await api.get(`/api/teams/${identifier}`);
    return response.data;
};

/**
 * Update team
 */
export const updateTeam = async (teamId, updates) => {
    const response = await api.put(`/api/teams/${teamId}`, updates);
    return response.data;
};

/**
 * Delete team
 */
export const deleteTeam = async (teamId) => {
    const response = await api.delete(`/api/teams/${teamId}`);
    return response.data;
};

// ===== TEAM MEMBER MANAGEMENT =====

/**
 * Invite member to team
 */
export const inviteMember = async (teamId, invitationData) => {
    const response = await api.post(`/api/teams/${teamId}/members/invite`, invitationData);
    return response.data;
};

/**
 * Accept team invitation
 */
export const acceptInvitation = async (token) => {
    const response = await api.post(`/api/teams/invitations/${token}/accept`);
    return response.data;
};

/**
 * Get team members
 */
export const getTeamMembers = async (teamId, params = {}) => {
    const response = await api.get(`/api/teams/${teamId}/members`, { params });
    return response.data;
};

/**
 * Update member role or permissions
 */
export const updateMemberRole = async (teamId, memberId, updates) => {
    const response = await api.put(`/api/teams/${teamId}/members/${memberId}`, updates);
    return response.data;
};

/**
 * Remove member from team
 */
export const removeMember = async (teamId, memberId) => {
    const response = await api.delete(`/api/teams/${teamId}/members/${memberId}`);
    return response.data;
};

// ===== TEAM DASHBOARD & ANALYTICS =====

/**
 * Get team dashboard
 */
export const getTeamDashboard = async (teamId) => {
    const response = await api.get(`/api/teams/${teamId}/dashboard`);
    return response.data;
};

/**
 * Get candidate progress
 */
export const getCandidateProgress = async (teamId, candidateId) => {
    const response = await api.get(`/api/teams/${teamId}/candidates/${candidateId}/progress`);
    return response.data;
};

/**
 * Get team activity log
 */
export const getTeamActivity = async (teamId, params = {}) => {
    const response = await api.get(`/api/teams/${teamId}/activity`, { params });
    return response.data;
};

// ===== SUBSCRIPTION & BILLING =====

/**
 * Get subscription details
 */
export const getSubscription = async (teamId) => {
    const response = await api.get(`/api/teams/${teamId}/subscription`);
    return response.data;
};

/**
 * Update subscription
 */
export const updateSubscription = async (teamId, updates) => {
    const response = await api.put(`/api/teams/${teamId}/subscription`, updates);
    return response.data;
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (teamId, cancelData) => {
    const response = await api.post(`/api/teams/${teamId}/subscription/cancel`, cancelData);
    return response.data;
};

/**
 * Get subscription usage
 */
export const getSubscriptionUsage = async (teamId) => {
    const response = await api.get(`/api/teams/${teamId}/subscription/usage`);
    return response.data;
};

/**
 * Apply coupon code
 */
export const applyCoupon = async (teamId, couponCode) => {
    const response = await api.post(`/api/teams/${teamId}/subscription/coupon`, { couponCode });
    return response.data;
};

/**
 * Get my pending invitations
 */
export const getMyInvitations = async () => {
    const response = await api.get('/api/teams/invitations/pending');
    return response.data;
};

export default {
    createTeam,
    getMyTeams,
    getTeam,
    updateTeam,
    deleteTeam,
    inviteMember,
    acceptInvitation,
    getTeamMembers,
    updateMemberRole,
    removeMember,
    getTeamDashboard,
    getCandidateProgress,
    getTeamActivity,
    getSubscription,
    updateSubscription,
    cancelSubscription,
    getSubscriptionUsage,
    applyCoupon,
};
