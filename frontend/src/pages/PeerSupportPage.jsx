import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import * as peerSupportApi from '../api/peerSupport';
import {
    Users,
    Plus,
    Search,
    Filter,
    MessageSquare,
    Trophy,
    Share2,
    Video,
    Bell,
    TrendingUp,
    Lock,
    Unlock,
    ThumbsUp,
    MessageCircle,
    Calendar,
    Target,
    Award,
    Briefcase,
    Heart,
    Star,
    Flame,
    Send,
    CheckCircle,
    Eye,
    EyeOff,
    X,
    ChevronRight,
    AlertCircle,
    BookOpen,
    Sparkles,
    UserPlus,
    Settings,
    Trash2,
    LogOut,
    Reply,
} from 'lucide-react';

const PeerSupportPage = () => {
    const { getToken, userId } = useAuth();
    const [activeTab, setActiveTab] = useState('discover'); // discover, myGroups, impact
    const [activeGroupTab, setActiveGroupTab] = useState('discussions'); // discussions, challenges, stories, referrals, webinars, alerts
    
    // State
    const [groups, setGroups] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [networkingImpact, setNetworkingImpact] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    
    // Group content
    const [discussions, setDiscussions] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [successStories, setSuccessStories] = useState([]);
    const [referrals, setReferrals] = useState([]);
    const [webinars, setWebinars] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [members, setMembers] = useState([]);
    
    // Loading states
    const [loading, setLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(false);
    
    // Modals
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showCreateDiscussionModal, setShowCreateDiscussionModal] = useState(false);
    const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
    const [showShareStoryModal, setShowShareStoryModal] = useState(false);
    const [showShareReferralModal, setShowShareReferralModal] = useState(false);
    const [showCreateWebinarModal, setShowCreateWebinarModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [selectedDiscussion, setSelectedDiscussion] = useState(null);
    const [showDiscussionDetailModal, setShowDiscussionDetailModal] = useState(false);
    const [discussionReplies, setDiscussionReplies] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [isAnonymousReply, setIsAnonymousReply] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    
    // Forms
    const [createGroupForm, setCreateGroupForm] = useState({
        name: '',
        description: '',
        category: 'industry',
        tags: [],
        groupType: 'public',
        guidelines: '',
    });
    
    const [discussionForm, setDiscussionForm] = useState({
        title: '',
        content: '',
        discussionType: 'general',
        tags: [],
        isAnonymous: false,
    });
    
    const [challengeForm, setChallengeForm] = useState({
        title: '',
        description: '',
        challengeType: 'application_sprint',
        goals: { targetValue: 10, metric: 'applications', timeframe: 7 },
        startDate: '',
        endDate: '',
    });
    
    const [storyForm, setStoryForm] = useState({
        title: '',
        summary: '',
        fullStory: '',
        storyType: 'job_offer',
        keyLearnings: [],
        tipsForOthers: [],
        isAnonymous: false,
    });
    
    const [referralForm, setReferralForm] = useState({
        title: '',
        company: '',
        description: '',
        opportunityType: 'job_opening',
        jobDetails: {},
        applicationInfo: {},
        canRefer: false,
        referralSlots: 1,
    });
    
    const [webinarForm, setWebinarForm] = useState({
        title: '',
        description: '',
        sessionType: 'webinar',
        topic: 'interview_prep',
        scheduledAt: '',
        duration: 60,
        meetingLink: '',
        meetingInfo: {},
        capacity: 100,
    });
    
    const [privacySettings, setPrivacySettings] = useState({
        showProfile: true,
        allowDirectMessages: true,
        shareJobSearchStatus: true,
        shareProgress: true,
        anonymousMode: false,
    });

    useEffect(() => {
        const initAuth = async () => {
            const token = await getToken();
            setAuthToken(token);
            fetchData();
        };
        initAuth();
    }, [getToken]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'discover') {
                const groupsData = await peerSupportApi.getGroups({ 
                    search: searchQuery, 
                    category: categoryFilter 
                });
                setGroups(groupsData.data.groups);
            } else if (activeTab === 'myGroups') {
                const myGroupsData = await peerSupportApi.getMyGroups();
                setMyGroups(myGroupsData.data.groups);
            } else if (activeTab === 'impact') {
                const impactData = await peerSupportApi.getNetworkingImpact();
                setNetworkingImpact(impactData.data.impact);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab) fetchData();
    }, [activeTab, searchQuery, categoryFilter]);

    const fetchGroupContent = async (groupId) => {
        if (!groupId) return;
        setContentLoading(true);
        try {
            const token = await getToken();
            setAuthToken(token);
            
            if (activeGroupTab === 'discussions') {
                const data = await peerSupportApi.getDiscussions(groupId, { sort: sortBy });
                setDiscussions([...(data.data.pinned || []), ...(data.data.discussions || [])]);
            } else if (activeGroupTab === 'challenges') {
                const data = await peerSupportApi.getChallenges(groupId);
                setChallenges(data.data.challenges);
            } else if (activeGroupTab === 'stories') {
                const data = await peerSupportApi.getSuccessStories(groupId);
                setSuccessStories(data.data.stories);
            } else if (activeGroupTab === 'referrals') {
                const data = await peerSupportApi.getReferrals(groupId);
                setReferrals(data.data.referrals);
            } else if (activeGroupTab === 'webinars') {
                const data = await peerSupportApi.getWebinars(groupId);
                setWebinars(data.data.webinars);
            } else if (activeGroupTab === 'alerts') {
                const data = await peerSupportApi.getOpportunityAlerts(groupId);
                setAlerts(data.data.alerts);
            } else if (activeGroupTab === 'members') {
                const data = await peerSupportApi.getGroupMembers(groupId);
                setMembers(data.data.members);
            }
        } catch (error) {
            console.error('Error fetching group content:', error);
        } finally {
            setContentLoading(false);
        }
    };

    useEffect(() => {
        if (selectedGroup && activeGroupTab) {
            fetchGroupContent(selectedGroup._id);
        }
    }, [selectedGroup, activeGroupTab, sortBy]);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            await peerSupportApi.createGroup(createGroupForm);
            setShowCreateGroupModal(false);
            fetchData();
            setCreateGroupForm({
                name: '',
                description: '',
                category: 'industry',
                tags: [],
                groupType: 'public',
                guidelines: '',
            });
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    const handleJoinGroup = async (groupId, inviteCode = null) => {
        try {
            await peerSupportApi.joinGroup(groupId, inviteCode);
            setShowJoinModal(false);
            fetchData();
        } catch (error) {
            console.error('Error joining group:', error);
        }
    };

    const handleCreateDiscussion = async (e) => {
        e.preventDefault();
        try {
            await peerSupportApi.createDiscussion(selectedGroup._id, discussionForm);
            setShowCreateDiscussionModal(false);
            fetchGroupContent(selectedGroup._id);
            setDiscussionForm({
                title: '',
                content: '',
                discussionType: 'general',
                tags: [],
                isAnonymous: false,
            });
        } catch (error) {
            console.error('Error creating discussion:', error);
        }
    };

    const handleCreateChallenge = async (e) => {
        e.preventDefault();
        try {
            await peerSupportApi.createChallenge(selectedGroup._id, challengeForm);
            setShowCreateChallengeModal(false);
            fetchGroupContent(selectedGroup._id);
        } catch (error) {
            console.error('Error creating challenge:', error);
        }
    };

    const handleShareStory = async (e) => {
        e.preventDefault();
        try {
            await peerSupportApi.shareSuccessStory(selectedGroup._id, storyForm);
            setShowShareStoryModal(false);
            fetchGroupContent(selectedGroup._id);
        } catch (error) {
            console.error('Error sharing story:', error);
        }
    };

    const handleShareReferral = async (e) => {
        e.preventDefault();
        try {
            const formData = {
                ...referralForm,
                referralSlots: referralForm.canRefer ? { total: referralForm.referralSlots, used: 0 } : { total: 0, used: 0 }
            };
            await peerSupportApi.shareReferral(selectedGroup._id, formData);
            setShowShareReferralModal(false);
            setReferralForm({
                title: '',
                company: '',
                description: '',
                opportunityType: 'job_opening',
                jobDetails: {},
                applicationInfo: {},
                canRefer: false,
                referralSlots: 1,
            });
            fetchGroupContent(selectedGroup._id);
        } catch (error) {
            console.error('Error sharing referral:', error);
        }
    };

    const handleCreateWebinar = async (e) => {
        e.preventDefault();
        try {
            await peerSupportApi.createWebinar(selectedGroup._id, webinarForm);
            setShowCreateWebinarModal(false);
            fetchGroupContent(selectedGroup._id);
        } catch (error) {
            console.error('Error creating webinar:', error);
        }
    };

    const handleLikeContent = async (contentType, contentId) => {
        try {
            await peerSupportApi.likeContent(selectedGroup._id, contentType, contentId);
            fetchGroupContent(selectedGroup._id);
        } catch (error) {
            console.error('Error liking content:', error);
        }
    };

    const handleJoinChallenge = async (challengeId) => {
        try {
            await peerSupportApi.joinChallenge(selectedGroup._id, challengeId);
            fetchGroupContent(selectedGroup._id);
        } catch (error) {
            console.error('Error joining challenge:', error);
        }
    };

    const handleExpressInterest = async (referralId) => {
        try {
            await peerSupportApi.expressInterest(selectedGroup._id, referralId);
            fetchGroupContent(selectedGroup._id);
        } catch (error) {
            console.error('Error expressing interest:', error);
        }
    };

    const handleWithdrawInterest = async (referralId) => {
        try {
            await peerSupportApi.withdrawInterest(selectedGroup._id, referralId);
            fetchGroupContent(selectedGroup._id);
        } catch (error) {
            console.error('Error withdrawing interest:', error);
        }
    };

    const handleRegisterWebinar = async (webinarId) => {
        try {
            await peerSupportApi.registerForWebinar(selectedGroup._id, webinarId);
            fetchGroupContent(selectedGroup._id);
        } catch (error) {
            console.error('Error registering for webinar:', error);
        }
    };

    const handleUnregisterWebinar = async (webinarId) => {
        try {
            await peerSupportApi.unregisterFromWebinar(selectedGroup._id, webinarId);
            fetchGroupContent(selectedGroup._id);
        } catch (error) {
            console.error('Error unregistering from webinar:', error);
        }
    };

    const handleLeaveChallenge = async (challengeId) => {
        try {
            await peerSupportApi.leaveChallenge(selectedGroup._id, challengeId);
            fetchGroupContent(selectedGroup._id);
        } catch (error) {
            console.error('Error leaving challenge:', error);
        }
    };

    const handleUpdatePrivacy = async (e) => {
        e.preventDefault();
        try {
            await peerSupportApi.updateMemberPrivacy(selectedGroup._id, { privacySettings });
            setShowPrivacyModal(false);
        } catch (error) {
            console.error('Error updating privacy:', error);
        }
    };

    const handleLeaveGroup = async () => {
        try {
            await peerSupportApi.leaveGroup(selectedGroup._id);
            setSelectedGroup(null);
            fetchData();
        } catch (error) {
            console.error('Error leaving group:', error);
            alert(error.response?.data?.message || 'Failed to leave group');
        }
    };

    const handleDeleteGroup = async () => {
        try {
            await peerSupportApi.deleteGroup(selectedGroup._id);
            setSelectedGroup(null);
            setShowDeleteConfirm(false);
            fetchData();
        } catch (error) {
            console.error('Error deleting group:', error);
            alert(error.response?.data?.message || 'Failed to delete group');
        }
    };

    const handleViewStory = (story) => {
        // For now, just show an alert with the full story
        // In a full implementation, this would open a modal with comments
        alert(`${story.title}\n\n${story.fullStory || story.summary}\n\nBy: ${story.isAnonymous ? 'Anonymous' : story.authorId?.name || 'Unknown'}`);
    };

    const handleViewDiscussion = async (discussion) => {
        setSelectedDiscussion(discussion);
        setShowDiscussionDetailModal(true);
        try {
            const data = await peerSupportApi.getDiscussion(selectedGroup._id, discussion._id);
            setSelectedDiscussion(data.data.discussion);
            setDiscussionReplies(data.data.replies || []);
        } catch (error) {
            console.error('Error fetching discussion details:', error);
        }
    };

    const handleReplyToDiscussion = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        
        try {
            await peerSupportApi.replyToDiscussion(selectedGroup._id, selectedDiscussion._id, {
                content: replyText,
                isAnonymous: isAnonymousReply,
            });
            setReplyText('');
            setIsAnonymousReply(false);
            // Refresh discussion details
            const data = await peerSupportApi.getDiscussion(selectedGroup._id, selectedDiscussion._id);
            setSelectedDiscussion(data.data.discussion);
            setDiscussionReplies(data.data.replies || []);
            fetchGroupContent(selectedGroup._id);
        } catch (error) {
            console.error('Error replying to discussion:', error);
        }
    };

    const handleLikeDiscussion = async (e, discussionId) => {
        e.stopPropagation();
        try {
            await peerSupportApi.likeContent(selectedGroup._id, 'discussion', discussionId);
            fetchGroupContent(selectedGroup._id);
            // Also update the selected discussion if we're viewing it
            if (selectedDiscussion && selectedDiscussion._id === discussionId) {
                const data = await peerSupportApi.getDiscussion(selectedGroup._id, discussionId);
                setSelectedDiscussion(data.data.discussion);
            }
        } catch (error) {
            console.error('Error liking discussion:', error);
        }
    };

    const handleLikeReply = async (replyId) => {
        try {
            await peerSupportApi.likeContent(selectedGroup._id, 'reply', replyId);
            // Refresh replies
            const data = await peerSupportApi.getDiscussion(selectedGroup._id, selectedDiscussion._id);
            setDiscussionReplies(data.data.replies || []);
        } catch (error) {
            console.error('Error liking reply:', error);
        }
    };

    const handleLeaveGroupFromCard = async (groupId) => {
        try {
            await peerSupportApi.leaveGroup(groupId);
            fetchData();
        } catch (error) {
            console.error('Error leaving group:', error);
            alert(error.response?.data?.message || 'Failed to leave group');
        }
    };

    // Render card for Discover tab - shows Join button for groups user hasn't joined
    const renderDiscoverGroupCard = (group) => (
        <div key={group._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            {group.coverImage?.url && (
                <img src={group.coverImage.url} alt={group.name} className="w-full h-32 object-cover rounded-lg mb-4" />
            )}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mt-1">
                        {group.category}
                    </span>
                </div>
                {group.groupType === 'private' && <Lock className="w-5 h-5 text-gray-400" />}
            </div>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {group.stats.totalMembers} members
                </span>
                <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {group.stats.totalDiscussions}
                </span>
                <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {group.stats.totalChallenges}
                </span>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => handleJoinGroup(group._id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Join Group
                </button>
            </div>
        </div>
    );

    // Render card for My Groups tab - shows View and Leave buttons
    const renderMyGroupCard = (group) => (
        <div key={group._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            {group.coverImage?.url && (
                <img src={group.coverImage.url} alt={group.name} className="w-full h-32 object-cover rounded-lg mb-4" />
            )}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mt-1">
                        {group.category}
                    </span>
                    {group.isOwner && (
                        <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded mt-1 ml-1">
                            Owner
                        </span>
                    )}
                </div>
                {group.groupType === 'private' && <Lock className="w-5 h-5 text-gray-400" />}
            </div>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {group.stats.totalMembers} members
                </span>
                <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {group.stats.totalDiscussions}
                </span>
                <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {group.stats.totalChallenges}
                </span>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => setSelectedGroup(group)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    View Group
                </button>
                {!group.isOwner && (
                    <button
                        onClick={() => handleLeaveGroupFromCard(group._id)}
                        className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Leave
                    </button>
                )}
            </div>
        </div>
    );

    const renderDiscussion = (discussion) => (
        <div key={discussion._id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            {discussion.isPinned && (
                <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded mb-2">
                    Pinned
                </span>
            )}
            <div className="cursor-pointer" onClick={() => handleViewDiscussion(discussion)}>
                <h3 className="font-semibold text-gray-900 mb-2">{discussion.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{discussion.content}</p>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={(e) => handleLikeDiscussion(e, discussion._id)}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                        <ThumbsUp className={`w-4 h-4 ${discussion.hasLiked ? 'text-blue-600 fill-blue-600' : ''}`} />
                        {discussion.stats?.likeCount || 0}
                    </button>
                    <button 
                        onClick={() => handleViewDiscussion(discussion)}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                        {discussion.stats?.replyCount || 0} replies
                    </button>
                    <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {discussion.stats?.viewCount || 0}
                    </span>
                </div>
                <span className="text-xs">
                    {discussion.isAnonymous ? 'Anonymous' : discussion.authorId?.name || 'Unknown'}
                </span>
            </div>
        </div>
    );

    const renderChallenge = (challenge) => (
        <div key={challenge._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{challenge.title}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                        challenge.status === 'active' ? 'bg-green-100 text-green-800' :
                        challenge.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {challenge.status}
                    </span>
                </div>
                <Target className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Goal</span>
                    <span className="text-sm font-semibold text-blue-600">
                        {challenge.goals.targetValue} {challenge.goals.metric}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-blue-600 rounded-full h-2 transition-all"
                        style={{ width: `${challenge.stats.averageProgress}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{challenge.stats.activeParticipants} participating</span>
                    <span>{challenge.stats.averageProgress.toFixed(0)}% avg</span>
                </div>
            </div>
            {challenge.isParticipating ? (
                <div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-blue-900 font-medium mb-1">Your Progress</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {challenge.myProgress?.percentComplete?.toFixed(0) || 0}%
                        </p>
                    </div>
                    <button
                        onClick={() => handleLeaveChallenge(challenge._id)}
                        className="w-full px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Leave Challenge
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => handleJoinChallenge(challenge._id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Trophy className="w-4 h-4" />
                    Join Challenge
                </button>
            )}
        </div>
    );

    const renderSuccessStory = (story) => (
        <div key={story._id} className="bg-white rounded-lg shadow p-6">
            {story.isFeatured && (
                <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded mb-2 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Featured
                </span>
            )}
            <h3 className="font-semibold text-gray-900 mb-2">{story.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{story.summary}</p>
            {story.fullStory && (
                <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{story.fullStory}</p>
            )}
            <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-1 text-xs rounded ${
                    story.storyType === 'job_offer' ? 'bg-green-100 text-green-800' :
                    story.storyType === 'interview_success' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                }`}>
                    {story.storyType.replace('_', ' ')}
                </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleLikeContent('story', story._id)}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    >
                        <Heart className={`w-4 h-4 ${story.hasLiked ? 'text-red-500 fill-red-500' : ''}`} />
                        {story.stats?.likeCount || 0}
                    </button>
                </div>
                <span className="text-xs">
                    {story.isAnonymous ? 'Anonymous' : story.authorId?.name || 'Unknown'}
                </span>
            </div>
        </div>
    );

    const renderReferral = (referral) => (
        <div key={referral._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900">{referral.title}</h3>
                    <p className="text-sm text-gray-600">{referral.company}</p>
                </div>
                <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{referral.description}</p>
            <div className="flex gap-2 mb-3">
                {referral.jobDetails?.location && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {referral.jobDetails.location}
                    </span>
                )}
                {referral.jobDetails?.locationType && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        {referral.jobDetails.locationType}
                    </span>
                )}
            </div>
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    <span>{referral.stats?.interestCount || 0} interested</span>
                    {referral.canRefer && referral.referralSlots?.total > 0 && (
                        <span className="ml-2">• {referral.referralSlots.total} referral{referral.referralSlots.total !== 1 ? 's' : ''} available</span>
                    )}
                </div>
                {referral.hasExpressedInterest ? (
                    <button
                        onClick={() => handleWithdrawInterest(referral._id)}
                        className="px-4 py-2 bg-orange-100 text-orange-700 text-sm rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-1"
                    >
                        <X className="w-4 h-4" />
                        Withdraw
                    </button>
                ) : (
                    <button
                        onClick={() => handleExpressInterest(referral._id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Interested
                    </button>
                )}
            </div>
        </div>
    );

    const renderWebinar = (webinar) => (
        <div key={webinar._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{webinar.title}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                        webinar.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        webinar.status === 'live' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {webinar.status}
                    </span>
                </div>
                <Video className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{webinar.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(webinar.scheduledAt).toLocaleDateString()} at {new Date(webinar.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                <span>{webinar.duration} min</span>
                <span>{webinar.stats?.registrationCount || 0}/{webinar.capacity?.max || webinar.capacity}</span>
            </div>
            {webinar.isRegistered ? (
                <div>
                    {webinar.meetingInfo?.link && (
                        <div className="mb-3 p-2 bg-purple-50 rounded-lg">
                            <a 
                                href={webinar.meetingInfo.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-2"
                            >
                                <Video className="w-4 h-4" />
                                Join Meeting
                            </a>
                        </div>
                    )}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-green-900 font-medium flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            You're registered!
                        </p>
                    </div>
                    <button
                        onClick={() => handleUnregisterWebinar(webinar._id)}
                        className="w-full px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Cancel Registration
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => handleRegisterWebinar(webinar._id)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    disabled={(webinar.capacity?.current || 0) >= (webinar.capacity?.max || webinar.capacity)}
                >
                    {(webinar.capacity?.current || 0) >= (webinar.capacity?.max || webinar.capacity) ? 'Full' : 'Register'}
                </button>
            )}
        </div>
    );

    const renderImpactDashboard = () => {
        if (!networkingImpact) return null;
        
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Groups</h3>
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-blue-600">
                            {networkingImpact.overallStats.activeGroups}
                        </p>
                        <p className="text-sm text-gray-500">Active memberships</p>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Engagement</h3>
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-green-600">
                            {networkingImpact.engagementScore.current}
                        </p>
                        <p className="text-sm text-gray-500">Engagement score</p>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Impact</h3>
                            <Award className="w-6 h-6 text-purple-600" />
                        </div>
                        <p className="text-3xl font-bold text-purple-600">
                            {networkingImpact.impactMetrics.referralsReceived}
                        </p>
                        <p className="text-sm text-gray-500">Referrals received</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Activity Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900">
                                {networkingImpact.overallStats.discussionsParticipated}
                            </p>
                            <p className="text-sm text-gray-600">Discussions</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900">
                                {networkingImpact.overallStats.challengesCompleted}
                            </p>
                            <p className="text-sm text-gray-600">Challenges</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900">
                                {networkingImpact.overallStats.webinarsAttended}
                            </p>
                            <p className="text-sm text-gray-600">Webinars</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900">
                                {networkingImpact.impactMetrics.referralsGiven}
                            </p>
                            <p className="text-sm text-gray-600">Referrals Given</p>
                        </div>
                    </div>
                </div>

                {networkingImpact.badges && networkingImpact.badges.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Badges Earned</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {networkingImpact.badges.map((badge, index) => (
                                <div key={index} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                                    <div className="text-3xl mb-2">{badge.icon || '🏆'}</div>
                                    <p className="font-semibold text-sm text-gray-900">{badge.name}</p>
                                    <p className="text-xs text-gray-600">{badge.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading peer support groups...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Peer Support Groups</h1>
                    <p className="text-gray-600">Connect with job seekers, share experiences, and support each other</p>
                </div>

                {/* Main Tabs */}
                <div className="mb-6">
                    <div className="flex gap-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('discover')}
                            className={`px-4 py-2 font-medium transition-colors ${
                                activeTab === 'discover'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Discover Groups
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('myGroups')}
                            className={`px-4 py-2 font-medium transition-colors ${
                                activeTab === 'myGroups'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                My Groups
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('impact')}
                            className={`px-4 py-2 font-medium transition-colors ${
                                activeTab === 'impact'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                My Impact
                            </div>
                        </button>
                    </div>
                </div>

                {/* Content */}
                {!selectedGroup ? (
                    <>
                        {/* Search and Filters */}
                        {activeTab !== 'impact' && (
                            <div className="mb-6 flex gap-4">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search groups..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Categories</option>
                                    <option value="industry">Industry</option>
                                    <option value="role">Role</option>
                                    <option value="experience">Experience Level</option>
                                    <option value="location">Location</option>
                                    <option value="specialty">Specialty</option>
                                </select>
                                <button
                                    onClick={() => setShowCreateGroupModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Group
                                </button>
                            </div>
                        )}

                        {/* Groups Grid */}
                        {activeTab === 'discover' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groups.filter(group => !group.isMember).length > 0 ? (
                                    groups.filter(group => !group.isMember).map(group => renderDiscoverGroupCard(group))
                                ) : (
                                    <div className="col-span-full text-center py-12 text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>You've joined all available groups!</p>
                                        <p className="text-sm mt-2">Create a new group to connect with more peers.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'myGroups' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myGroups.length > 0 ? (
                                    myGroups.map(group => renderMyGroupCard(group))
                                ) : (
                                    <div className="col-span-full text-center py-12 text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>You haven't joined any groups yet.</p>
                                        <p className="text-sm mt-2">Discover groups to connect with peers in your field.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'impact' && renderImpactDashboard()}
                    </>
                ) : (
                    /* Group Detail View */
                    <div>
                        {/* Back Button */}
                        <button
                            onClick={() => setSelectedGroup(null)}
                            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                            Back to groups
                        </button>

                        {/* Group Header */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedGroup.name}</h2>
                                    <p className="text-gray-600 mb-4">{selectedGroup.description}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {selectedGroup.stats.totalMembers} members
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="w-4 h-4" />
                                            {selectedGroup.stats.totalDiscussions} discussions
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Trophy className="w-4 h-4" />
                                            {selectedGroup.stats.totalChallenges} challenges
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowPrivacyModal(true)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Privacy
                                    </button>
                                    {selectedGroup.isOwner ? (
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Group
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleLeaveGroup}
                                            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Leave Group
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Group Tabs */}
                        <div className="mb-6">
                            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                                {[
                                    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
                                    { id: 'challenges', label: 'Challenges', icon: Trophy },
                                    { id: 'stories', label: 'Success Stories', icon: Star },
                                    { id: 'referrals', label: 'Referrals', icon: Briefcase },
                                    { id: 'webinars', label: 'Webinars', icon: Video },
                                    { id: 'members', label: 'Members', icon: Users },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveGroupTab(tab.id)}
                                        className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                                            activeGroupTab === tab.id
                                                ? 'text-blue-600 border-b-2 border-blue-600'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mb-6 flex gap-2">
                            {activeGroupTab === 'discussions' && (
                                <button
                                    onClick={() => setShowCreateDiscussionModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Discussion
                                </button>
                            )}
                            {activeGroupTab === 'challenges' && (
                                <button
                                    onClick={() => setShowCreateChallengeModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Challenge
                                </button>
                            )}
                            {activeGroupTab === 'stories' && (
                                <button
                                    onClick={() => setShowShareStoryModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Share Story
                                </button>
                            )}
                            {activeGroupTab === 'referrals' && (
                                <button
                                    onClick={() => setShowShareReferralModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Share Opportunity
                                </button>
                            )}
                            {activeGroupTab === 'webinars' && (
                                <button
                                    onClick={() => setShowCreateWebinarModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Webinar
                                </button>
                            )}
                        </div>

                        {/* Content Area */}
                        {contentLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeGroupTab === 'discussions' && discussions.map(renderDiscussion)}
                                {activeGroupTab === 'challenges' && challenges.map(renderChallenge)}
                                {activeGroupTab === 'stories' && successStories.map(renderSuccessStory)}
                                {activeGroupTab === 'referrals' && referrals.map(renderReferral)}
                                {activeGroupTab === 'webinars' && webinars.map(renderWebinar)}
                                {activeGroupTab === 'members' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {members.map(member => (
                                            <div key={member._id} className="bg-white rounded-lg shadow p-4">
                                                <div className="flex items-center gap-3">
                                                    {member.userId?.profilePicture ? (
                                                        <img src={member.userId.profilePicture} alt={member.userId.name} 
                                                             className="w-12 h-12 rounded-full" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                            <Users className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900">{member.userId?.name || 'Private Member'}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Modals */}
                {showCreateGroupModal && (
                    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Create New Group</h2>
                                <button onClick={() => setShowCreateGroupModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateGroup} className="space-y-4">
                                <div>
                                    <label htmlFor="create-group-name" className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                                    <input
                                        id="create-group-name"
                                        type="text"
                                        value={createGroupForm.name}
                                        onChange={(e) => setCreateGroupForm({...createGroupForm, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="create-group-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        id="create-group-description"
                                        value={createGroupForm.description}
                                        onChange={(e) => setCreateGroupForm({...createGroupForm, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="create-group-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        id="create-group-category"
                                        value={createGroupForm.category}
                                        onChange={(e) => setCreateGroupForm({...createGroupForm, category: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="industry">Industry</option>
                                        <option value="role">Role</option>
                                        <option value="experience">Experience Level</option>
                                        <option value="location">Location</option>
                                        <option value="specialty">Specialty</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="create-group-type" className="block text-sm font-medium text-gray-700 mb-1">Group Type</label>
                                    <select
                                        id="create-group-type"
                                        value={createGroupForm.groupType}
                                        onChange={(e) => setCreateGroupForm({...createGroupForm, groupType: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="public">Public</option>
                                        <option value="private">Private</option>
                                        <option value="invite_only">Invite Only</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Create Group
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateGroupModal(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showCreateDiscussionModal && (
                    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">New Discussion</h2>
                                <button onClick={() => setShowCreateDiscussionModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateDiscussion} className="space-y-4">
                                <div>
                                    <label htmlFor="discussion-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        id="discussion-title"
                                        type="text"
                                        value={discussionForm.title}
                                        onChange={(e) => setDiscussionForm({...discussionForm, title: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="discussion-content" className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                    <textarea
                                        id="discussion-content"
                                        value={discussionForm.content}
                                        onChange={(e) => setDiscussionForm({...discussionForm, content: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows={5}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="discussion-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        id="discussion-type"
                                        value={discussionForm.discussionType}
                                        onChange={(e) => setDiscussionForm({...discussionForm, discussionType: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="question">Question</option>
                                        <option value="insight">Insight/Strategy</option>
                                        <option value="experience">Experience</option>
                                        <option value="resource">Resource</option>
                                        <option value="celebration">Celebration</option>
                                        <option value="support">Support</option>
                                        <option value="general">General</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="anonymous"
                                        checked={discussionForm.isAnonymous}
                                        onChange={(e) => setDiscussionForm({...discussionForm, isAnonymous: e.target.checked})}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="anonymous" className="text-sm text-gray-700 flex items-center gap-1">
                                        <EyeOff className="w-4 h-4" />
                                        Post anonymously
                                    </label>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Post Discussion
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateDiscussionModal(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showPrivacyModal && (
                    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Privacy Settings</h2>
                                <button onClick={() => setShowPrivacyModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleUpdatePrivacy} className="space-y-4">
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.showProfile}
                                            onChange={(e) => setPrivacySettings({...privacySettings, showProfile: e.target.checked})}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Show my profile to members</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.allowDirectMessages}
                                            onChange={(e) => setPrivacySettings({...privacySettings, allowDirectMessages: e.target.checked})}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Allow direct messages</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.shareJobSearchStatus}
                                            onChange={(e) => setPrivacySettings({...privacySettings, shareJobSearchStatus: e.target.checked})}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Share job search status</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.shareProgress}
                                            onChange={(e) => setPrivacySettings({...privacySettings, shareProgress: e.target.checked})}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Share my progress</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={privacySettings.anonymousMode}
                                            onChange={(e) => setPrivacySettings({...privacySettings, anonymousMode: e.target.checked})}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Post anonymously by default</span>
                                    </label>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Save Settings
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowPrivacyModal(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Discussion Detail Modal */}
                {showDiscussionDetailModal && selectedDiscussion && (
                    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedDiscussion.title}</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Posted by {selectedDiscussion.isAnonymous ? selectedDiscussion.anonymousName || 'Anonymous' : selectedDiscussion.authorId?.name || 'Unknown'}
                                        {' • '}
                                        {new Date(selectedDiscussion.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setShowDiscussionDetailModal(false);
                                        setSelectedDiscussion(null);
                                        setDiscussionReplies([]);
                                    }} 
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="prose max-w-none mb-6">
                                <p className="text-gray-700 whitespace-pre-wrap">{selectedDiscussion.content}</p>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                                <button 
                                    onClick={(e) => handleLikeDiscussion(e, selectedDiscussion._id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                        selectedDiscussion.hasLiked 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <ThumbsUp className={`w-4 h-4 ${selectedDiscussion.hasLiked ? 'fill-blue-600' : ''}`} />
                                    {selectedDiscussion.stats?.likeCount || 0} Likes
                                </button>
                                <span className="flex items-center gap-2 text-gray-500">
                                    <MessageCircle className="w-4 h-4" />
                                    {discussionReplies.length} Replies
                                </span>
                            </div>

                            {/* Replies */}
                            <div className="space-y-4 mb-6">
                                <h3 className="font-semibold text-gray-900">Replies</h3>
                                {discussionReplies.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No replies yet. Be the first to reply!</p>
                                ) : (
                                    discussionReplies.map(reply => (
                                        <div key={reply._id} className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {reply.isAnonymous ? reply.anonymousName || 'Anonymous' : reply.authorId?.name || 'Unknown'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(reply.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{reply.content}</p>
                                            <button 
                                                onClick={() => handleLikeReply(reply._id)}
                                                className={`flex items-center gap-1 text-sm transition-colors ${
                                                    reply.hasLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                                                }`}
                                            >
                                                <ThumbsUp className={`w-3 h-3 ${reply.hasLiked ? 'fill-blue-600' : ''}`} />
                                                {reply.stats?.likeCount || 0}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Reply Form */}
                            <form onSubmit={handleReplyToDiscussion} className="border-t pt-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Add a Reply</h3>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write your reply..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
                                    rows={3}
                                    required
                                />
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={isAnonymousReply}
                                            onChange={(e) => setIsAnonymousReply(e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 flex items-center gap-1">
                                            <EyeOff className="w-4 h-4" />
                                            Reply anonymously
                                        </span>
                                    </label>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        Reply
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Create Challenge Modal */}
                {showCreateChallengeModal && (
                    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Create Challenge</h2>
                                <button onClick={() => setShowCreateChallengeModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateChallenge} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Challenge Title</label>
                                    <input
                                        type="text"
                                        value={challengeForm.title}
                                        onChange={(e) => setChallengeForm({...challengeForm, title: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., 30-Day Application Sprint"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={challengeForm.description}
                                        onChange={(e) => setChallengeForm({...challengeForm, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        placeholder="Describe the challenge and what participants will achieve..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Challenge Type</label>
                                    <select
                                        value={challengeForm.challengeType}
                                        onChange={(e) => setChallengeForm({...challengeForm, challengeType: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="application_sprint">Application Sprint</option>
                                        <option value="networking">Networking Challenge</option>
                                        <option value="skill_building">Skill Building</option>
                                        <option value="interview_prep">Interview Prep</option>
                                        <option value="accountability">Accountability Partner</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                                        <input
                                            type="number"
                                            value={challengeForm.goals.targetValue}
                                            onChange={(e) => setChallengeForm({...challengeForm, goals: {...challengeForm.goals, targetValue: parseInt(e.target.value)}})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
                                        <select
                                            value={challengeForm.goals.metric}
                                            onChange={(e) => setChallengeForm({...challengeForm, goals: {...challengeForm.goals, metric: e.target.value}})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="applications">Applications</option>
                                            <option value="connections">Connections</option>
                                            <option value="interviews">Interviews</option>
                                            <option value="skills">Skills Learned</option>
                                            <option value="hours">Hours</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={challengeForm.startDate}
                                            onChange={(e) => setChallengeForm({...challengeForm, startDate: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={challengeForm.endDate}
                                            onChange={(e) => setChallengeForm({...challengeForm, endDate: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateChallengeModal(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Create Challenge
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Share Success Story Modal */}
                {showShareStoryModal && (
                    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Share Your Success Story</h2>
                                <button onClick={() => setShowShareStoryModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleShareStory} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={storyForm.title}
                                        onChange={(e) => setStoryForm({...storyForm, title: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., How I landed my dream job at Google"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Story Type</label>
                                    <select
                                        value={storyForm.storyType}
                                        onChange={(e) => setStoryForm({...storyForm, storyType: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="job_offer">Job Offer</option>
                                        <option value="interview_success">Interview Success</option>
                                        <option value="career_transition">Career Transition</option>
                                        <option value="skill_development">Skill Development</option>
                                        <option value="networking_win">Networking Win</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                                    <textarea
                                        value={storyForm.summary}
                                        onChange={(e) => setStoryForm({...storyForm, summary: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows="2"
                                        placeholder="A brief summary of your success..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Story</label>
                                    <textarea
                                        value={storyForm.fullStory}
                                        onChange={(e) => setStoryForm({...storyForm, fullStory: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows="5"
                                        placeholder="Share the details of your journey..."
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={storyForm.isAnonymous}
                                        onChange={(e) => setStoryForm({...storyForm, isAnonymous: e.target.checked})}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label className="text-sm text-gray-700">Share anonymously</label>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowShareStoryModal(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Share Story
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Share Referral Modal */}
                {showShareReferralModal && (
                    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Share Referral Opportunity</h2>
                                <button onClick={() => setShowShareReferralModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleShareReferral} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={referralForm.title}
                                        onChange={(e) => setReferralForm({...referralForm, title: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Software Engineer at Tesla"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                    <input
                                        type="text"
                                        value={referralForm.company}
                                        onChange={(e) => setReferralForm({...referralForm, company: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Company name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Type</label>
                                    <select
                                        value={referralForm.opportunityType}
                                        onChange={(e) => setReferralForm({...referralForm, opportunityType: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="job_opening">Job Opening</option>
                                        <option value="internship">Internship</option>
                                        <option value="referral_available">Referral Available</option>
                                        <option value="networking">Networking Opportunity</option>
                                        <option value="informational_interview">Informational Interview</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={referralForm.description}
                                        onChange={(e) => setReferralForm({...referralForm, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows="4"
                                        placeholder="Describe the opportunity, requirements, and how you can help..."
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={referralForm.canRefer}
                                        onChange={(e) => setReferralForm({...referralForm, canRefer: e.target.checked})}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label className="text-sm text-gray-700">I can provide a referral for this position</label>
                                </div>
                                {referralForm.canRefer && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Referrals Available</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={referralForm.referralSlots}
                                            onChange={(e) => setReferralForm({...referralForm, referralSlots: parseInt(e.target.value) || 1})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="How many people can you refer?"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Specify how many referrals you can provide for this opportunity</p>
                                    </div>
                                )}
                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowShareReferralModal(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Share Opportunity
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Create Webinar Modal */}
                {showCreateWebinarModal && (
                    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Schedule Webinar/Coaching Session</h2>
                                <button onClick={() => setShowCreateWebinarModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateWebinar} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={webinarForm.title}
                                        onChange={(e) => setWebinarForm({...webinarForm, title: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Resume Review Workshop"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                                    <select
                                        value={webinarForm.sessionType}
                                        onChange={(e) => setWebinarForm({...webinarForm, sessionType: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="webinar">Webinar</option>
                                        <option value="group_coaching">Group Coaching</option>
                                        <option value="workshop">Workshop</option>
                                        <option value="q_and_a">Q&A Session</option>
                                        <option value="panel">Panel Discussion</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                                    <select
                                        value={webinarForm.topic}
                                        onChange={(e) => setWebinarForm({...webinarForm, topic: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="interview_prep">Interview Preparation</option>
                                        <option value="resume_review">Resume Review</option>
                                        <option value="networking">Networking Strategies</option>
                                        <option value="salary_negotiation">Salary Negotiation</option>
                                        <option value="career_transition">Career Transition</option>
                                        <option value="industry_insights">Industry Insights</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={webinarForm.description}
                                        onChange={(e) => setWebinarForm({...webinarForm, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        placeholder="What will participants learn..."
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            value={webinarForm.scheduledAt}
                                            onChange={(e) => setWebinarForm({...webinarForm, scheduledAt: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                        <input
                                            type="number"
                                            value={webinarForm.duration}
                                            onChange={(e) => setWebinarForm({...webinarForm, duration: parseInt(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            min="15"
                                            max="180"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
                                    <input
                                        type="number"
                                        value={webinarForm.capacity}
                                        onChange={(e) => setWebinarForm({...webinarForm, capacity: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        min="2"
                                        max="500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (Zoom, Google Meet, etc.)</label>
                                    <input
                                        type="url"
                                        value={webinarForm.meetingLink}
                                        onChange={(e) => setWebinarForm({...webinarForm, meetingLink: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateWebinarModal(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Schedule Session
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Delete Group</h2>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete "{selectedGroup?.name}"? This action cannot be undone. 
                                All discussions, challenges, and other content will be permanently deleted.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteGroup}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete Group
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PeerSupportPage;
