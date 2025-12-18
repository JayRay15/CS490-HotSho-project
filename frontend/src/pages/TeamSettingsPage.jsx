import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import { getTeam, updateTeam, deleteTeam } from '../api/teams';
import {
    ArrowLeft,
    Settings,
    Users,
    Shield,
    Trash2,
    Save,
    AlertTriangle
} from 'lucide-react';

const TeamSettingsPage = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();

    const [team, setTeam] = useState(null);
    const [membership, setMembership] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        settings: {
            allowMemberInvites: false,
            requireApprovalForJoin: true,
            defaultMemberRole: 'candidate',
            visibility: 'private'
        }
    });

    useEffect(() => {
        fetchTeam();
    }, [teamId]);

    const fetchTeam = async () => {
        try {
            const token = await getToken();
            setAuthToken(token);

            const response = await getTeam(teamId);
            setTeam(response.data.team);
            setMembership(response.data.membership);
            setFormData({
                name: response.data.team.name || '',
                description: response.data.team.description || '',
                settings: {
                    allowMemberInvites: response.data.team.settings?.allowMemberInvites || false,
                    requireApprovalForJoin: response.data.team.settings?.requireApprovalForJoin ?? true,
                    defaultMemberRole: response.data.team.settings?.defaultMemberRole || 'candidate',
                    visibility: response.data.team.settings?.visibility || 'private'
                }
            });
        } catch (err) {
            console.error('Error fetching team:', err);
            setError('Failed to load team settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const token = await getToken();
            setAuthToken(token);

            await updateTeam(teamId, formData);
            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            setError(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmText !== team.name) {
            setError('Please type the team name correctly to confirm deletion');
            return;
        }

        try {
            const token = await getToken();
            setAuthToken(token);

            await deleteTeam(teamId);
            navigate('/teams');
        } catch (err) {
            console.error('Error deleting team:', err);
            setError(err.response?.data?.message || 'Failed to delete team');
        }
    };

    const isOwner = membership?.role === 'owner';
    const isAdmin = membership?.role === 'admin' || isOwner;

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                    <div className="space-y-4">
                        <div className="h-12 bg-gray-200 rounded"></div>
                        <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-red-700 mb-2">Access Denied</h2>
                    <p className="text-red-600 mb-4">You don't have permission to access team settings.</p>
                    <button
                        onClick={() => navigate(`/teams/${teamId}`)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Back to Team
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(`/teams/${teamId}`)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Settings</h1>
                    <p className="text-gray-600">{team?.name}</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            {/* General Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <Settings className="w-5 h-5 text-gray-500" />
                    <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="team-name-input" className="block text-sm font-medium text-gray-700 mb-1">
                            Team Name
                        </label>
                        <input
                            id="team-name-input"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter team name"
                        />
                    </div>

                    <div>
                        <label htmlFor="team-description-textarea" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="team-description-textarea"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Describe your team's purpose"
                        />
                    </div>
                </div>
            </div>

            {/* Member Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <Users className="w-5 h-5 text-gray-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Member Settings</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Allow Member Invites</p>
                            <p className="text-sm text-gray-500">Let members invite others to the team</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.settings.allowMemberInvites}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    settings: { ...formData.settings, allowMemberInvites: e.target.checked }
                                })}
                                className="sr-only peer"
                                aria-label="Allow Member Invites"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Require Join Approval</p>
                            <p className="text-sm text-gray-500">Admins must approve new member requests</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.settings.requireApprovalForJoin}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    settings: { ...formData.settings, requireApprovalForJoin: e.target.checked }
                                })}
                                className="sr-only peer"
                                aria-label="Require Join Approval"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div>
                        <label htmlFor="default-member-role-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Default Member Role
                        </label>
                        <select
                            id="default-member-role-select"
                            value={formData.settings.defaultMemberRole}
                            onChange={(e) => setFormData({
                                ...formData,
                                settings: { ...formData.settings, defaultMemberRole: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="candidate">Candidate</option>
                            <option value="viewer">Viewer</option>
                            <option value="coach">Coach</option>
                            <option value="mentor">Mentor</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="team-visibility-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Team Visibility
                        </label>
                        <select
                            id="team-visibility-select"
                            value={formData.settings.visibility}
                            onChange={(e) => setFormData({
                                ...formData,
                                settings: { ...formData.settings, visibility: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="private">Private - Only members can see</option>
                            <option value="invite-only">Invite Only - Visible but join by invite</option>
                            <option value="public">Public - Anyone can request to join</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end mb-8">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Danger Zone */}
            {isOwner && (
                <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-red-700">Delete Team</p>
                            <p className="text-sm text-red-600">
                                Permanently delete this team and all its data. This action cannot be undone.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Team
                        </button>
                    </div>

                    {showDeleteConfirm && (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-red-300">
                            <p className="text-sm text-gray-700 mb-3">
                                Type <strong>{team.name}</strong> to confirm deletion:
                            </p>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                                placeholder="Enter team name"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteConfirmText !== team.name}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Delete
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteConfirmText('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamSettingsPage;
