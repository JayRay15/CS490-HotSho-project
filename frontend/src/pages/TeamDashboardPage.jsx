import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import {
    getTeam,
    getTeamDashboard,
    getTeamMembers,
    inviteMember,
    updateMemberRole,
    removeMember
} from '../api/teams';
import * as accountabilityApi from '../api/accountability';
import {
    Users,
    UserPlus,
    Settings,
    TrendingUp,
    Briefcase,
    Calendar,
    Target,
    Crown,
    Shield,
    UserCheck,
    Eye,
    MoreVertical,
    Mail,
    X,
    Check,
    Clock,
    ChevronDown,
    Activity,
    Share2,
    Trophy,
    Heart,
    MessageCircle,
    BarChart3,
    Send,
    Lock,
    Unlock,
    CheckCircle,
    Star,
    Flame,
    Award,
    ThumbsUp,
    Sparkles,
    AlertCircle,
    RefreshCw,
    Zap,
    Gift
} from 'lucide-react';

const TeamDashboardPage = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();

    // Active tab state
    const [activeTab, setActiveTab] = useState('dashboard');

    const [team, setTeam] = useState(null);
    const [membership, setMembership] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Invite modal state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        email: '',
        role: 'candidate',
        invitationMessage: '',
        focusAreas: [],
    });
    const [inviteLoading, setInviteLoading] = useState(false);

    // Member actions
    const [selectedMember, setSelectedMember] = useState(null);
    const [showMemberMenu, setShowMemberMenu] = useState(null);

    // Progress Sharing State
    const [partnerships, setPartnerships] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [weeklySummary, setWeeklySummary] = useState(null);
    const [insights, setInsights] = useState(null);
    const [progressLoading, setProgressLoading] = useState(false);
    const [progressError, setProgressError] = useState(null);

    // Progress Sharing Modals
    const [showInvitePartnerModal, setShowInvitePartnerModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showShareProgressModal, setShowShareProgressModal] = useState(false);
    const [selectedPartnership, setSelectedPartnership] = useState(null);

    // Invite Partner Form
    const [invitePartnerForm, setInvitePartnerForm] = useState({
        email: '',
        partnerType: 'peer',
        message: ''
    });
    const [invitePartnerLoading, setInvitePartnerLoading] = useState(false);

    // Privacy Settings Form
    const [privacyForm, setPrivacyForm] = useState({
        shareApplicationCount: true,
        shareInterviewCount: true,
        shareCompanyNames: false,
        shareJobTitles: true,
        shareSalaryInfo: false,
        shareGoals: true,
        shareMilestones: true,
        checkInFrequency: 'weekly'
    });

    // Share Progress Form
    const [shareProgressForm, setShareProgressForm] = useState({
        applicationsSent: 0,
        interviewsScheduled: 0,
        offersReceived: 0,
        weeklyGoal: 10,
        currentStreak: 0,
        milestones: [],
        newMilestone: ''
    });

    useEffect(() => {
        fetchTeamData();
    }, [teamId]);

    const fetchTeamData = async () => {
        try {
            const token = await getToken();
            setAuthToken(token);

            const [teamRes, dashboardRes, membersRes] = await Promise.all([
                getTeam(teamId),
                getTeamDashboard(teamId),
                getTeamMembers(teamId),
            ]);

            setTeam(teamRes.data.team);
            setMembership(teamRes.data.membership);
            setDashboard(dashboardRes.data);
            setMembers(membersRes.data);
        } catch (err) {
            console.error('Error fetching team data:', err);
            setError(err.message || 'Failed to fetch team data');
        } finally {
            setLoading(false);
        }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        setInviteLoading(true);
        setError(null);

        try {
            const token = await getToken();
            setAuthToken(token);
            await inviteMember(teamId, inviteForm);

            // Refresh members
            const membersRes = await getTeamMembers(teamId);
            setMembers(membersRes.data);

            setShowInviteModal(false);
            setInviteForm({
                email: '',
                role: 'candidate',
                invitationMessage: '',
                focusAreas: [],
            });
        } catch (err) {
            console.error('Error inviting member:', err);
            setError(err.message || 'Failed to send invitation');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) {
            return;
        }

        try {
            const token = await getToken();
            setAuthToken(token);
            await removeMember(teamId, memberId);

            // Refresh members
            const membersRes = await getTeamMembers(teamId);
            setMembers(membersRes.data);
            setShowMemberMenu(null);
        } catch (err) {
            console.error('Error removing member:', err);
            setError(err.message || 'Failed to remove member');
        }
    };

    // Progress Sharing Functions
    const fetchProgressData = useCallback(async () => {
        if (activeTab !== 'progress') return;
        
        setProgressLoading(true);
        setProgressError(null);

        try {
            const token = await getToken();
            setAuthToken(token);

            const [partnershipsRes, achievementsRes, summaryRes, insightsRes] = await Promise.all([
                accountabilityApi.getPartnerships().catch((e) => { console.error('Partnerships error:', e); return { success: false, data: [] }; }),
                accountabilityApi.getAchievements().catch((e) => { console.error('Achievements error:', e); return { success: false, data: { achievements: [] } }; }),
                accountabilityApi.getWeeklySummary().catch((e) => { console.error('Summary error:', e); return { success: false, data: null }; }),
                accountabilityApi.getInsights().catch((e) => { console.error('Insights error:', e); return { success: false, data: null }; })
            ]);

            // API returns { success: true, data: [...] } for partnerships
            // API returns { success: true, data: { achievements: [...], totalPoints, count } } for achievements
            
            // Extract partnerships array - could be in .data or directly in response
            let partnershipsArray = [];
            if (Array.isArray(partnershipsRes)) {
                partnershipsArray = partnershipsRes;
            } else if (Array.isArray(partnershipsRes?.data)) {
                partnershipsArray = partnershipsRes.data;
            } else if (partnershipsRes?.success && Array.isArray(partnershipsRes?.data)) {
                partnershipsArray = partnershipsRes.data;
            }
            
            // Extract achievements array
            let achievementsArray = [];
            if (Array.isArray(achievementsRes)) {
                achievementsArray = achievementsRes;
            } else if (Array.isArray(achievementsRes?.data?.achievements)) {
                achievementsArray = achievementsRes.data.achievements;
            } else if (Array.isArray(achievementsRes?.data)) {
                achievementsArray = achievementsRes.data;
            } else if (achievementsRes?.success && achievementsRes?.data?.achievements) {
                achievementsArray = achievementsRes.data.achievements;
            }
            
            setPartnerships(partnershipsArray);
            setAchievements(achievementsArray);
            setWeeklySummary(summaryRes?.data || summaryRes);
            setInsights(insightsRes?.data || insightsRes);
        } catch (err) {
            console.error('Error fetching progress data:', err);
            setProgressError(err.message || 'Failed to load progress data');
        } finally {
            setProgressLoading(false);
        }
    }, [activeTab, getToken]);

    useEffect(() => {
        if (activeTab === 'progress') {
            fetchProgressData();
        }
    }, [activeTab, fetchProgressData]);

    const handleInvitePartner = async (e) => {
        e.preventDefault();
        setInvitePartnerLoading(true);
        setProgressError(null);

        try {
            const token = await getToken();
            setAuthToken(token);
            await accountabilityApi.invitePartner(invitePartnerForm);
            
            setShowInvitePartnerModal(false);
            setInvitePartnerForm({ email: '', partnerType: 'peer', message: '' });
            fetchProgressData();
        } catch (err) {
            console.error('Error inviting partner:', err);
            setProgressError(err.message || 'Failed to invite partner');
        } finally {
            setInvitePartnerLoading(false);
        }
    };

    const handleAcceptPartner = async (partnershipId) => {
        try {
            const token = await getToken();
            setAuthToken(token);
            await accountabilityApi.acceptInvitation(partnershipId);
            fetchProgressData();
        } catch (err) {
            console.error('Error accepting partnership:', err);
            setProgressError(err.message || 'Failed to accept partnership');
        }
    };

    const handleUpdatePrivacy = async (partnershipId) => {
        try {
            const token = await getToken();
            setAuthToken(token);
            await accountabilityApi.updatePartnership(partnershipId, { privacySettings: privacyForm });
            setShowPrivacyModal(false);
            setSelectedPartnership(null);
            fetchProgressData();
        } catch (err) {
            console.error('Error updating privacy:', err);
            setProgressError(err.message || 'Failed to update privacy settings');
        }
    };

    const handleShareProgress = async () => {
        if (!selectedPartnership) return;
        
        try {
            const token = await getToken();
            setAuthToken(token);
            
            const progressData = {
                partnershipId: selectedPartnership._id,
                metrics: {
                    applicationsSent: shareProgressForm.applicationsSent,
                    interviewsScheduled: shareProgressForm.interviewsScheduled,
                    offersReceived: shareProgressForm.offersReceived
                },
                goals: {
                    weeklyApplications: shareProgressForm.weeklyGoal,
                    currentStreak: shareProgressForm.currentStreak
                },
                milestones: shareProgressForm.milestones
            };
            
            await accountabilityApi.shareProgress(progressData);
            setShowShareProgressModal(false);
            setSelectedPartnership(null);
            fetchProgressData();
        } catch (err) {
            console.error('Error sharing progress:', err);
            setProgressError(err.message || 'Failed to share progress');
        }
    };

    const handleCelebrateAchievement = async (achievementId) => {
        try {
            const token = await getToken();
            setAuthToken(token);
            await accountabilityApi.celebrateAchievement(achievementId, { message: '🎉 Congratulations!' });
            fetchProgressData();
        } catch (err) {
            console.error('Error celebrating achievement:', err);
        }
    };

    const handleSendEncouragement = async (partnershipId, message) => {
        try {
            const token = await getToken();
            setAuthToken(token);
            await accountabilityApi.sendMessage({
                partnershipId,
                content: message,
                messageType: 'encouragement'
            });
        } catch (err) {
            console.error('Error sending encouragement:', err);
        }
    };

    const handleCheckIn = async (partnershipId) => {
        try {
            const token = await getToken();
            setAuthToken(token);
            await accountabilityApi.recordCheckIn(partnershipId, { checkInType: 'progress_update' });
            fetchProgressData();
        } catch (err) {
            console.error('Error recording check-in:', err);
        }
    };

    const addMilestone = () => {
        if (shareProgressForm.newMilestone.trim()) {
            setShareProgressForm(prev => ({
                ...prev,
                milestones: [...prev.milestones, { 
                    title: prev.newMilestone, 
                    achievedAt: new Date().toISOString() 
                }],
                newMilestone: ''
            }));
        }
    };

    const getAchievementIcon = (type) => {
        switch (type) {
            case 'streak': return <Flame className="w-5 h-5 text-orange-500" />;
            case 'milestone': return <Target className="w-5 h-5 text-purple-500" />;
            case 'celebration': return <Sparkles className="w-5 h-5 text-yellow-500" />;
            case 'consistency': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'support': return <Heart className="w-5 h-5 text-pink-500" />;
            default: return <Award className="w-5 h-5 text-blue-500" />;
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
            case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
            case 'mentor':
            case 'coach': return <UserCheck className="w-4 h-4 text-green-500" />;
            case 'candidate': return <Users className="w-4 h-4 text-purple-500" />;
            case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />;
            default: return <Users className="w-4 h-4 text-gray-500" />;
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'owner': return 'bg-yellow-100 text-yellow-800';
            case 'admin': return 'bg-blue-100 text-blue-800';
            case 'mentor':
            case 'coach': return 'bg-green-100 text-green-800';
            case 'candidate': return 'bg-purple-100 text-purple-800';
            case 'viewer': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const canInviteMembers = membership?.role === 'owner' || membership?.role === 'admin';
    const canManageMembers = membership?.role === 'owner' || membership?.role === 'admin';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading team dashboard...</p>
                </div>
            </div>
        );
    }

    if (error && !team) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{team?.name}</h1>
                    <p className="mt-2 text-gray-600">{team?.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                        {getRoleIcon(membership?.role)}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(membership?.role)}`}>
                            {membership?.role}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    {canInviteMembers && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <UserPlus className="w-5 h-5" />
                            Invite Member
                        </button>
                    )}
                    <button
                        onClick={() => navigate(`/teams/${teamId}/settings`)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="flex flex-wrap gap-1 sm:gap-4 overflow-x-auto pb-1">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`py-2 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                            activeTab === 'dashboard'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('progress')}
                        className={`py-2 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                            activeTab === 'progress'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Progress Sharing</span>
                        <span className="sm:hidden">Progress</span>
                    </button>
                </nav>
            </div>

            {/* Dashboard Tab Content */}
            {activeTab === 'dashboard' && (
                <>
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Members</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {dashboard?.metrics?.totalMembers || 0}
                            </p>
                        </div>
                        <Users className="w-12 h-12 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Candidates</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {dashboard?.metrics?.activeCandidates || 0}
                            </p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-green-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Applications</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {dashboard?.metrics?.totalApplications || 0}
                            </p>
                        </div>
                        <Briefcase className="w-12 h-12 text-purple-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Interviews</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {dashboard?.metrics?.totalInterviews || 0}
                            </p>
                        </div>
                        <Calendar className="w-12 h-12 text-orange-500" />
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Team Members */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Members</h2>

                    <div className="space-y-3">
                        {members.map((member) => (
                            <div
                                key={member._id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        {member.userId?.profilePicture ? (
                                            <img
                                                src={member.userId.profilePicture}
                                                alt={member.userId.name}
                                                className="w-10 h-10 rounded-full"
                                            />
                                        ) : (
                                            <span className="text-blue-600 font-semibold">
                                                {member.userId?.name?.[0] || member.email[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {member.userId?.name || member.email}
                                        </p>
                                        <p className="text-sm text-gray-600">{member.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getRoleIcon(member.role)}
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                                                {member.role}
                                            </span>
                                            {member.status === 'pending' && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <Clock className="w-3 h-3 inline mr-1" />
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {canManageMembers && member.role !== 'owner' && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowMemberMenu(showMemberMenu === member._id ? null : member._id)}
                                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5 text-gray-600" />
                                        </button>

                                        {showMemberMenu === member._id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                                <button
                                                    onClick={() => {
                                                        navigate(`/teams/${teamId}/candidates/${member.userId?._id}`);
                                                        setShowMemberMenu(null);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                    disabled={!member.userId}
                                                >
                                                    View Profile
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveMember(member._id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    Remove Member
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Recent Activity
                    </h2>

                    <div className="space-y-3">
                        {dashboard?.recentActivity?.slice(0, 10).map((activity, index) => (
                            <div key={index} className="border-l-2 border-blue-500 pl-3 py-2">
                                <p className="text-sm font-medium text-gray-900">
                                    {activity.actorName}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {activity.action.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(activity.createdAt).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
                </>
            )}

            {/* Progress Sharing Tab Content */}
            {activeTab === 'progress' && (
                <div className="space-y-6">
                    {progressError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                            <span>{progressError}</span>
                            <button onClick={() => setProgressError(null)} className="text-red-500 hover:text-red-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {progressLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Progress Stats Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Accountability Partners</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                                {partnerships.filter(p => p.status === 'active').length}
                                            </p>
                                        </div>
                                        <Users className="w-12 h-12 text-blue-500" />
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Achievements Earned</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                                {achievements.length}
                                            </p>
                                        </div>
                                        <Trophy className="w-12 h-12 text-yellow-500" />
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Current Streak</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                                {insights?.streaks?.currentStreak || weeklySummary?.currentStreak || 0} days
                                            </p>
                                        </div>
                                        <Flame className="w-12 h-12 text-orange-500" />
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Weekly Goal Progress</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                                {insights?.accountabilityScore?.current || weeklySummary?.goalProgress || 0}%
                                            </p>
                                        </div>
                                        <Target className="w-12 h-12 text-green-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Partners Column */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Partners Section */}
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                                <Users className="w-5 h-5" />
                                                Accountability Partners
                                            </h2>
                                            <button
                                                onClick={() => setShowInvitePartnerModal(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                Invite Partner
                                            </button>
                                        </div>

                                        {/* Pending Invitations */}
                                        {partnerships.filter(p => p.status === 'pending').length > 0 && (
                                            <div className="mb-4">
                                                <h3 className="text-sm font-medium text-gray-700 mb-2">Pending Invitations</h3>
                                                <div className="space-y-2">
                                                    {partnerships.filter(p => p.status === 'pending').map(partnership => (
                                                        <div key={partnership._id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                                                    <Clock className="w-5 h-5 text-yellow-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">
                                                                        {partnership.partnerId?.name || partnership.partnerId?.email || 'Pending User'}
                                                                    </p>
                                                                    <p className="text-sm text-yellow-600">Invitation pending</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleAcceptPartner(partnership._id)}
                                                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                                            >
                                                                Accept
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Active Partners */}
                                        <div className="space-y-3">
                                            {partnerships.filter(p => p.status === 'active').length === 0 ? (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                                    <p>No accountability partners yet</p>
                                                    <p className="text-sm">Invite team members to share progress</p>
                                                </div>
                                            ) : (
                                                partnerships.filter(p => p.status === 'active').map(partnership => (
                                                    <div key={partnership._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <span className="text-blue-600 font-semibold">
                                                                    {(partnership.partnerId?.name || 'P')[0].toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {partnership.partnerId?.name || partnership.partnerId?.email}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {partnership.partnerType || 'Partner'} • 
                                                                    Last check-in: {partnership.engagementStats?.lastCheckIn 
                                                                        ? new Date(partnership.engagementStats.lastCheckIn).toLocaleDateString()
                                                                        : 'Never'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleCheckIn(partnership._id)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                                title="Check In"
                                                            >
                                                                <CheckCircle className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedPartnership(partnership);
                                                                    setShowShareProgressModal(true);
                                                                }}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                                title="Share Progress"
                                                            >
                                                                <Share2 className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleSendEncouragement(partnership._id, '💪 Keep going!')}
                                                                className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg"
                                                                title="Send Encouragement"
                                                            >
                                                                <Heart className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedPartnership(partnership);
                                                                    setPrivacyForm(partnership.privacySettings || privacyForm);
                                                                    setShowPrivacyModal(true);
                                                                }}
                                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                                title="Privacy Settings"
                                                            >
                                                                <Lock className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Weekly Summary */}
                                    {weeklySummary && (
                                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5" />
                                                Weekly Summary
                                            </h2>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                                    <p className="text-2xl font-bold text-blue-600">{weeklySummary.applicationsSent || 0}</p>
                                                    <p className="text-sm text-gray-600">Applications</p>
                                                </div>
                                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                                    <p className="text-2xl font-bold text-green-600">{weeklySummary.interviewsScheduled || 0}</p>
                                                    <p className="text-sm text-gray-600">Interviews</p>
                                                </div>
                                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                                    <p className="text-2xl font-bold text-purple-600">{weeklySummary.offersReceived || 0}</p>
                                                    <p className="text-sm text-gray-600">Offers</p>
                                                </div>
                                                <div className="text-center p-4 bg-orange-50 rounded-lg">
                                                    <p className="text-2xl font-bold text-orange-600">{weeklySummary.checkInsCompleted || 0}</p>
                                                    <p className="text-sm text-gray-600">Check-ins</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Insights */}
                                    {insights && (
                                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Sparkles className="w-5 h-5" />
                                                Accountability Insights
                                            </h2>
                                            <div className="space-y-4">
                                                {insights.motivationalMessage && (
                                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                                                        <p className="text-gray-700 italic">"{insights.motivationalMessage}"</p>
                                                    </div>
                                                )}
                                                {insights.recommendations?.map((rec, idx) => (
                                                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                                                        <p className="text-sm text-gray-700">{rec}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Achievements Column */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Trophy className="w-5 h-5" />
                                            Achievements
                                        </h2>
                                        <div className="space-y-3">
                                            {achievements.length === 0 ? (
                                                <div className="text-center py-6 text-gray-500">
                                                    <Award className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                                    <p>No achievements yet</p>
                                                    <p className="text-sm">Keep sharing progress to earn badges!</p>
                                                </div>
                                            ) : (
                                                achievements.slice(0, 6).map(achievement => (
                                                    <div key={achievement._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                                            {getAchievementIcon(achievement.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 truncate">{achievement.title}</p>
                                                            <p className="text-sm text-gray-500">{achievement.description}</p>
                                                            <p className="text-xs text-gray-400">
                                                                {achievement.achievedAt ? new Date(achievement.achievedAt).toLocaleDateString() : 'Recently'}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleCelebrateAchievement(achievement._id)}
                                                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                                        >
                                                            <ThumbsUp className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Zap className="w-5 h-5" />
                                            Quick Actions
                                        </h2>
                                        <div className="space-y-2">
                                            <button
                                                onClick={fetchProgressData}
                                                className="w-full flex items-center gap-2 p-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <RefreshCw className="w-5 h-5" />
                                                Refresh Data
                                            </button>
                                            <button
                                                onClick={() => setShowInvitePartnerModal(true)}
                                                className="w-full flex items-center gap-2 p-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <UserPlus className="w-5 h-5" />
                                                Invite Partner
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Invite Partner Modal */}
            {showInvitePartnerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Invite Accountability Partner</h2>
                            <button onClick={() => setShowInvitePartnerModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleInvitePartner}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        value={invitePartnerForm.email}
                                        onChange={(e) => setInvitePartnerForm({ ...invitePartnerForm, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="partner@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Partner Type</label>
                                    <select
                                        value={invitePartnerForm.partnerType}
                                        onChange={(e) => setInvitePartnerForm({ ...invitePartnerForm, partnerType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="peer">Peer</option>
                                        <option value="mentor">Mentor</option>
                                        <option value="friend">Friend</option>
                                        <option value="family">Family</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Personal Message</label>
                                    <textarea
                                        value={invitePartnerForm.message}
                                        onChange={(e) => setInvitePartnerForm({ ...invitePartnerForm, message: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="I'd like you to be my accountability partner..."
                                        rows="3"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowInvitePartnerModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={invitePartnerLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                                    disabled={invitePartnerLoading}
                                >
                                    {invitePartnerLoading ? 'Sending...' : 'Send Invitation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Privacy Settings Modal */}
            {showPrivacyModal && selectedPartnership && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Privacy Settings</h2>
                            <button onClick={() => { setShowPrivacyModal(false); setSelectedPartnership(null); }} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">Choose what to share with {selectedPartnership.partnerId?.name || 'your partner'}</p>
                            
                            {[
                                { key: 'shareApplicationCount', label: 'Application Count', icon: Briefcase },
                                { key: 'shareInterviewCount', label: 'Interview Count', icon: Calendar },
                                { key: 'shareCompanyNames', label: 'Company Names', icon: Target },
                                { key: 'shareJobTitles', label: 'Job Titles', icon: Award },
                                { key: 'shareSalaryInfo', label: 'Salary Information', icon: Star },
                                { key: 'shareGoals', label: 'Goals', icon: Target },
                                { key: 'shareMilestones', label: 'Milestones', icon: Trophy }
                            ].map(({ key, label, icon: Icon }) => (
                                <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-5 h-5 text-gray-600" />
                                        <span className="text-gray-700">{label}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={privacyForm[key]}
                                        onChange={(e) => setPrivacyForm({ ...privacyForm, [key]: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                </label>
                            ))}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Frequency</label>
                                <select
                                    value={privacyForm.checkInFrequency}
                                    onChange={(e) => setPrivacyForm({ ...privacyForm, checkInFrequency: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Bi-weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowPrivacyModal(false); setSelectedPartnership(null); }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleUpdatePrivacy(selectedPartnership._id)}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Progress Modal */}
            {showShareProgressModal && selectedPartnership && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Share Progress</h2>
                            <button onClick={() => { setShowShareProgressModal(false); setSelectedPartnership(null); }} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">Share your job search progress with {selectedPartnership.partnerId?.name || 'your partner'}</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Applications Sent</label>
                                    <input
                                        type="number"
                                        value={shareProgressForm.applicationsSent}
                                        onChange={(e) => setShareProgressForm({ ...shareProgressForm, applicationsSent: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Interviews Scheduled</label>
                                    <input
                                        type="number"
                                        value={shareProgressForm.interviewsScheduled}
                                        onChange={(e) => setShareProgressForm({ ...shareProgressForm, interviewsScheduled: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Offers Received</label>
                                    <input
                                        type="number"
                                        value={shareProgressForm.offersReceived}
                                        onChange={(e) => setShareProgressForm({ ...shareProgressForm, offersReceived: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Goal</label>
                                    <input
                                        type="number"
                                        value={shareProgressForm.weeklyGoal}
                                        onChange={(e) => setShareProgressForm({ ...shareProgressForm, weeklyGoal: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Add Milestone</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={shareProgressForm.newMilestone}
                                        onChange={(e) => setShareProgressForm({ ...shareProgressForm, newMilestone: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Got interview at dream company"
                                    />
                                    <button
                                        type="button"
                                        onClick={addMilestone}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Add
                                    </button>
                                </div>
                                {shareProgressForm.milestones.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {shareProgressForm.milestones.map((m, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-green-50 px-3 py-1 rounded">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                {m.title}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowShareProgressModal(false); setSelectedPartnership(null); }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleShareProgress}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Share Progress
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Member Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Invite Team Member
                        </h2>

                        <form onSubmit={handleInviteMember}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        value={inviteForm.email}
                                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="member@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role
                                    </label>
                                    <select
                                        value={inviteForm.role}
                                        onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="candidate">Candidate</option>
                                        <option value="mentor">Mentor</option>
                                        <option value="coach">Coach</option>
                                        <option value="admin">Admin</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Personal Message
                                    </label>
                                    <textarea
                                        value={inviteForm.invitationMessage}
                                        onChange={(e) => setInviteForm({ ...inviteForm, invitationMessage: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Add a personal message to the invitation..."
                                        rows="3"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowInviteModal(false);
                                        setError(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={inviteLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                                    disabled={inviteLoading}
                                >
                                    {inviteLoading ? 'Sending...' : 'Send Invitation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamDashboardPage;
