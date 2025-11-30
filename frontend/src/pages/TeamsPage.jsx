import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import { getMyTeams, createTeam, getMyInvitations, acceptInvitation } from '../api/teams';
import {
    Users,
    Plus,
    ChevronRight,
    Building2,
    Crown,
    Shield,
    UserCheck,
    Eye,
    Calendar,
    Mail,
    Check,
    X,
    Clock
} from 'lucide-react';

const TeamsPage = () => {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [teams, setTeams] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [acceptingInvite, setAcceptingInvite] = useState(null);
    const [newTeam, setNewTeam] = useState({
        name: '',
        description: '',
        teamType: 'career_coaching',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = await getToken();
            setAuthToken(token);

            const [teamsRes, invitationsRes] = await Promise.all([
                getMyTeams(),
                getMyInvitations().catch(() => ({ data: [] })),
            ]);

            setTeams(teamsRes.data || []);
            setInvitations(invitationsRes.data || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptInvitation = async (invitationToken) => {
        setAcceptingInvite(invitationToken);
        try {
            const token = await getToken();
            setAuthToken(token);

            const response = await acceptInvitation(invitationToken);

            // Remove from invitations and refresh teams
            setInvitations(invitations.filter(inv => inv.invitationToken !== invitationToken));

            // Navigate to the team
            if (response.data?.team?._id) {
                navigate(`/teams/${response.data.team._id}`);
            } else {
                fetchData();
            }
        } catch (err) {
            console.error('Error accepting invitation:', err);
            setError(err.response?.data?.message || 'Failed to accept invitation');
        } finally {
            setAcceptingInvite(null);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        setError(null);

        try {
            const token = await getToken();
            setAuthToken(token);
            const response = await createTeam(newTeam);
            setTeams([...teams, { team: response.data.team, membership: { role: 'owner' } }]);
            setShowCreateModal(false);
            setNewTeam({ name: '', description: '', teamType: 'career_coaching' });

            // Navigate to new team
            navigate(`/teams/${response.data.team._id}`);
        } catch (err) {
            console.error('Error creating team:', err);
            setError(err.message || 'Failed to create team');
        } finally {
            setCreateLoading(false);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'owner':
                return <Crown className="w-4 h-4 text-yellow-500" />;
            case 'admin':
                return <Shield className="w-4 h-4 text-blue-500" />;
            case 'mentor':
            case 'coach':
                return <UserCheck className="w-4 h-4 text-green-500" />;
            case 'candidate':
                return <Users className="w-4 h-4 text-purple-500" />;
            case 'viewer':
                return <Eye className="w-4 h-4 text-gray-500" />;
            default:
                return <Users className="w-4 h-4 text-gray-500" />;
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'owner':
                return 'bg-yellow-100 text-yellow-800';
            case 'admin':
                return 'bg-blue-100 text-blue-800';
            case 'mentor':
            case 'coach':
                return 'bg-green-100 text-green-800';
            case 'candidate':
                return 'bg-purple-100 text-purple-800';
            case 'viewer':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading teams...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Teams</h1>
                    <p className="mt-2 text-gray-600">
                        Collaborate with mentors and track candidate progress
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Team
                </button>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-500" />
                        Pending Invitations ({invitations.length})
                    </h2>
                    <div className="space-y-3">
                        {invitations.map((invitation) => (
                            <div
                                key={invitation._id}
                                className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {invitation.teamId?.name || 'Team'}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Invited by {invitation.invitedBy?.name || invitation.invitedBy?.email || 'Team Owner'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getRoleIcon(invitation.role)}
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(invitation.role)}`}>
                                                {invitation.role}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Expires {new Date(invitation.invitationExpiresAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {invitation.invitationMessage && (
                                            <p className="text-sm text-gray-600 mt-2 italic">
                                                "{invitation.invitationMessage}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleAcceptInvitation(invitation.invitationToken)}
                                        disabled={acceptingInvite === invitation.invitationToken}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {acceptingInvite === invitation.invitationToken ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Accepting...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Accept
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Teams Grid */}
            {teams.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No teams yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Create a team to start collaborating with mentors and candidates
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Your First Team
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map(({ team, membership }) => (
                        <div
                            key={team._id}
                            onClick={() => navigate(`/teams/${team._id}`)}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                        >
                            {/* Team Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {team.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getRoleIcon(membership.role)}
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(membership.role)}`}>
                                                {membership.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>

                            {/* Team Description */}
                            {team.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                    {team.description}
                                </p>
                            )}

                            {/* Team Stats */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="w-4 h-4" />
                                    <span>{team.stats?.totalMembers || 0} members</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        {new Date(membership.joinedAt || team.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="mt-4">
                                {team.status === 'trial' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Trial
                                    </span>
                                )}
                                {team.status === 'active' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Team Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Create New Team
                        </h2>

                        <form onSubmit={handleCreateTeam}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Team Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newTeam.name}
                                        onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="My Coaching Team"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={newTeam.description}
                                        onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Brief description of your team's purpose..."
                                        rows="3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Team Type
                                    </label>
                                    <select
                                        value={newTeam.teamType}
                                        onChange={(e) => setNewTeam({ ...newTeam, teamType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="career_coaching">Career Coaching</option>
                                        <option value="mentorship">Mentorship</option>
                                        <option value="recruiting">Recruiting</option>
                                        <option value="educational">Educational</option>
                                        <option value="corporate">Corporate</option>
                                        <option value="other">Other</option>
                                    </select>
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
                                        setShowCreateModal(false);
                                        setError(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={createLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                                    disabled={createLoading}
                                >
                                    {createLoading ? 'Creating...' : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamsPage;
