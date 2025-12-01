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
} from 'lucide-react';

const PeerSupportPage = () => {
    const { getToken } = useAuth();
    const [activeTab, setActiveTab] = useState('discover'); // discover, myGroups, impact
    const [activeGroupTab, setActiveGroupTab] = useState('discussions'); // discussions, challenges, stories, referrals, webinars, alerts
    
    // State
    const [groups, setGroups] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [networkingImpact, setNetworkingImpact] = useState(null);
    
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
    });
    
    const [webinarForm, setWebinarForm] = useState({
        title: '',
        description: '',
        sessionType: 'webinar',
        topic: 'interview_prep',
        scheduledAt: '',
        duration: 60,
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
            await peerSupportApi.shareReferral(selectedGroup._id, referralForm);
            setShowShareReferralModal(false);
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

    const handleRegisterWebinar = async (webinarId) => {
        try {
            await peerSupportApi.registerForWebinar(selectedGroup._id, webinarId);
            fetchGroupContent(selectedGroup._id);
        } catch (error) {
            console.error('Error registering for webinar:', error);
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

    const renderGroupCard = (group) => (
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
                {group.isMember ? (
                    <button
                        onClick={() => setSelectedGroup(group)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        View Group
                    </button>
                ) : (
                    <button
                        onClick={() => handleJoinGroup(group._id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Join Group
                    </button>
                )}
            </div>
        </div>
    );

    const renderDiscussion = (discussion) => (
        <div key={discussion._id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => setSelectedDiscussion(discussion)}>
            {discussion.isPinned && (
                <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded mb-2">
                    Pinned
                </span>
            )}
            <h3 className="font-semibold text-gray-900 mb-2">{discussion.title}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{discussion.content}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {discussion.stats.likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {discussion.stats.replyCount} replies
                    </span>
                    <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {discussion.stats.viewCount}
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900 font-medium mb-1">Your Progress</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {challenge.myProgress?.percentComplete.toFixed(0)}%
                    </p>
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
                    <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {story.stats.likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {story.stats.commentCount}
                    </span>
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
                    <span>{referral.stats.interestCount} interested</span>
                    {referral.canRefer && (
                        <span className="ml-2">• Can refer {referral.referralSlots.total - referral.referralSlots.used} more</span>
                    )}
                </div>
                <button
                    onClick={() => handleExpressInterest(referral._id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                    Interested
                </button>
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
                    {new Date(webinar.scheduledAt).toLocaleDateString()}
                </span>
                <span>{webinar.duration} min</span>
                <span>{webinar.stats.registrationCount}/{webinar.capacity.max}</span>
            </div>
            {webinar.isRegistered ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-900 font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        You're registered!
                    </p>
                </div>
            ) : (
                <button
                    onClick={() => handleRegisterWebinar(webinar._id)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    disabled={webinar.capacity.current >= webinar.capacity.max}
                >
                    {webinar.capacity.current >= webinar.capacity.max ? 'Full' : 'Register'}
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
                                {groups.map(group => renderGroupCard(group))}
                            </div>
                        )}

                        {activeTab === 'myGroups' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myGroups.map(group => renderGroupCard(group))}
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
                                <button
                                    onClick={() => setShowPrivacyModal(true)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    Privacy
                                </button>
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
                                    { id: 'alerts', label: 'Alerts', icon: Bell },
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
                                {activeGroupTab === 'alerts' && alerts.map(alert => (
                                    <div key={alert._id} className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                                        alert.priority === 'urgent' ? 'border-red-500' :
                                        alert.priority === 'high' ? 'border-orange-500' :
                                        'border-blue-500'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            <Bell className="w-5 h-5 text-gray-600 mt-0.5" />
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                                                <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                                                {alert.link && (
                                                    <a href={alert.link} target="_blank" rel="noopener noreferrer" 
                                                       className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
                                                        Learn more →
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Create New Group</h2>
                                <button onClick={() => setShowCreateGroupModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateGroup} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                                    <input
                                        type="text"
                                        value={createGroupForm.name}
                                        onChange={(e) => setCreateGroupForm({...createGroupForm, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={createGroupForm.description}
                                        onChange={(e) => setCreateGroupForm({...createGroupForm, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Type</label>
                                    <select
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">New Discussion</h2>
                                <button onClick={() => setShowCreateDiscussionModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateDiscussion} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={discussionForm.title}
                                        onChange={(e) => setDiscussionForm({...discussionForm, title: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                    <textarea
                                        value={discussionForm.content}
                                        onChange={(e) => setDiscussionForm({...discussionForm, content: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows={5}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
            </div>
        </div>
    );
};

export default PeerSupportPage;
