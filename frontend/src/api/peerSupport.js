import api from './axios';

// ===== GROUP MANAGEMENT =====

/**
 * Get all available groups
 */
export const getGroups = async (params = {}) => {
    const response = await api.get('/api/peer-support/groups', { params });
    return response.data;
};

/**
 * Get my groups
 */
export const getMyGroups = async () => {
    const response = await api.get('/api/peer-support/my-groups');
    return response.data;
};

/**
 * Get group by ID or slug
 */
export const getGroup = async (groupId) => {
    const response = await api.get(`/api/peer-support/groups/${groupId}`);
    return response.data;
};

/**
 * Create a new group
 */
export const createGroup = async (groupData) => {
    const response = await api.post('/api/peer-support/groups', groupData);
    return response.data;
};

/**
 * Join a group
 */
export const joinGroup = async (groupId, inviteCode = null) => {
    const response = await api.post(`/api/peer-support/groups/${groupId}/join`, { inviteCode });
    return response.data;
};

/**
 * Leave a group
 */
export const leaveGroup = async (groupId) => {
    const response = await api.post(`/api/peer-support/groups/${groupId}/leave`);
    return response.data;
};

/**
 * Update privacy settings for a group
 */
export const updateMemberPrivacy = async (groupId, settings) => {
    const response = await api.put(`/api/peer-support/groups/${groupId}/privacy`, settings);
    return response.data;
};

/**
 * Get group members
 */
export const getGroupMembers = async (groupId, params = {}) => {
    const response = await api.get(`/api/peer-support/groups/${groupId}/members`, { params });
    return response.data;
};

// ===== DISCUSSIONS =====

/**
 * Get discussions for a group
 */
export const getDiscussions = async (groupId, params = {}) => {
    const response = await api.get(`/api/peer-support/groups/${groupId}/discussions`, { params });
    return response.data;
};

/**
 * Create a discussion
 */
export const createDiscussion = async (groupId, discussionData) => {
    const response = await api.post(`/api/peer-support/groups/${groupId}/discussions`, discussionData);
    return response.data;
};

/**
 * Get discussion with replies
 */
export const getDiscussion = async (groupId, discussionId) => {
    const response = await api.get(`/api/peer-support/groups/${groupId}/discussions/${discussionId}`);
    return response.data;
};

/**
 * Reply to a discussion
 */
export const replyToDiscussion = async (groupId, discussionId, replyData) => {
    const response = await api.post(`/api/peer-support/groups/${groupId}/discussions/${discussionId}/replies`, replyData);
    return response.data;
};

/**
 * Like content (discussion or reply)
 */
export const likeContent = async (groupId, contentType, contentId) => {
    const response = await api.post(`/api/peer-support/groups/${groupId}/like/${contentType}/${contentId}`);
    return response.data;
};

// ===== CHALLENGES =====

/**
 * Get challenges for a group
 */
export const getChallenges = async (groupId, params = {}) => {
    const response = await api.get(`/api/peer-support/groups/${groupId}/challenges`, { params });
    return response.data;
};

/**
 * Create a challenge
 */
export const createChallenge = async (groupId, challengeData) => {
    const response = await api.post(`/api/peer-support/groups/${groupId}/challenges`, challengeData);
    return response.data;
};

/**
 * Join a challenge
 */
export const joinChallenge = async (groupId, challengeId) => {
    const response = await api.post(`/api/peer-support/groups/${groupId}/challenges/${challengeId}/join`);
    return response.data;
};

/**
 * Update challenge progress
 */
export const updateChallengeProgress = async (groupId, challengeId, currentValue) => {
    const response = await api.put(`/api/peer-support/groups/${groupId}/challenges/${challengeId}/progress`, { currentValue });
    return response.data;
};

// ===== SUCCESS STORIES =====

/**
 * Get success stories
 */
export const getSuccessStories = async (groupId, params = {}) => {
    const response = await api.get(`/api/peer-support/groups/${groupId}/success-stories`, { params });
    return response.data;
};

/**
 * Share a success story
 */
export const shareSuccessStory = async (groupId, storyData) => {
    const response = await api.post(`/api/peer-support/groups/${groupId}/success-stories`, storyData);
    return response.data;
};

// ===== REFERRALS & OPPORTUNITIES =====

/**
 * Get referrals/opportunities
 */
export const getReferrals = async (groupId, params = {}) => {
    const response = await api.get(`/api/peer-support/groups/${groupId}/referrals`, { params });
    return response.data;
};

/**
 * Share a referral/opportunity
 */
export const shareReferral = async (groupId, referralData) => {
    const response = await api.post(`/api/peer-support/groups/${groupId}/referrals`, referralData);
    return response.data;
};

/**
 * Express interest in a referral
 */
export const expressInterest = async (groupId, referralId) => {
    const response = await api.post(`/api/peer-support/groups/${groupId}/referrals/${referralId}/interest`);
    return response.data;
};

// ===== WEBINARS & COACHING =====

/**
 * Get webinars/coaching sessions
 */
export const getWebinars = async (groupId, params = {}) => {
    const response = await api.get(`/api/peer-support/groups/${groupId}/webinars`, { params });
    return response.data;
};

/**
 * Create a webinar
 */
export const createWebinar = async (groupId, webinarData) => {
    const response = await api.post(`/api/peer-support/groups/${groupId}/webinars`, webinarData);
    return response.data;
};

/**
 * Register for a webinar
 */
export const registerForWebinar = async (groupId, webinarId) => {
    const response = await api.post(`/api/peer-support/groups/${groupId}/webinars/${webinarId}/register`);
    return response.data;
};

// ===== OPPORTUNITY ALERTS =====

/**
 * Get opportunity alerts
 */
export const getOpportunityAlerts = async (groupId) => {
    const response = await api.get(`/api/peer-support/groups/${groupId}/alerts`);
    return response.data;
};

/**
 * Create opportunity alert
 */
export const createOpportunityAlert = async (groupId, alertData) => {
    const response = await api.post(`/api/peer-support/groups/${groupId}/alerts`, alertData);
    return response.data;
};

// ===== NETWORKING IMPACT =====

/**
 * Get user's networking impact
 */
export const getNetworkingImpact = async () => {
    const response = await api.get('/api/peer-support/impact');
    return response.data;
};
