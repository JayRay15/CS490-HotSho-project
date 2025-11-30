import React, { useState, useEffect } from 'react';
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
    Activity
} from 'lucide-react';

const TeamDashboardPage = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();

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
