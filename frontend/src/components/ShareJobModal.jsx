import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import { getMyTeams, shareJobWithTeam } from '../api/teams';
import { X, Users, Share2, MessageSquare, Check, Loader2 } from 'lucide-react';

const ShareJobModal = ({ job, onClose, onSuccess }) => {
    const { getToken } = useAuth();
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [shareMessage, setShareMessage] = useState('');
    const [visibility, setVisibility] = useState('all_members');
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const token = await getToken();
            setAuthToken(token);
            const response = await getMyTeams();
            // Response contains { team, membership } objects, extract the teams
            const teamsData = response.data || [];
            // Handle both formats: array of teams or array of { team, membership }
            const normalizedTeams = teamsData.map(item => item.team || item);
            setTeams(normalizedTeams);
            if (normalizedTeams.length > 0) {
                setSelectedTeam(normalizedTeams[0]._id);
            }
        } catch (err) {
            console.error('Error fetching teams:', err);
            setError('Failed to load teams');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!selectedTeam) {
            setError('Please select a team');
            return;
        }

        setSharing(true);
        setError(null);

        try {
            const token = await getToken();
            setAuthToken(token);
            await shareJobWithTeam(selectedTeam, {
                jobId: job._id,
                shareMessage,
                visibility,
            });
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Error sharing job:', err);
            setError(err.response?.data?.message || 'Failed to share job');
        } finally {
            setSharing(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Share Job with Team</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Job Shared!</h3>
                            <p className="text-gray-600 mt-2">Your team can now see and comment on this job.</p>
                        </div>
                    ) : (
                        <>
                            {/* Job Preview */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <h3 className="font-medium text-gray-900">{job.title}</h3>
                                <p className="text-sm text-gray-600">{job.company}</p>
                                {job.location && (
                                    <p className="text-xs text-gray-500 mt-1">{job.location}</p>
                                )}
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {teams.length === 0 ? (
                                <div className="text-center py-4">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-600">You're not a member of any teams yet.</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Join or create a team to share jobs.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Team Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Select Team
                                        </label>
                                        <select
                                            value={selectedTeam || ''}
                                            onChange={(e) => setSelectedTeam(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {teams.map((team) => (
                                                <option key={team._id} value={team._id}>
                                                    {team.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Visibility */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Who can see this?
                                        </label>
                                        <select
                                            value={visibility}
                                            onChange={(e) => setVisibility(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all_members">All Team Members</option>
                                            <option value="coaches_only">Coaches/Mentors Only</option>
                                        </select>
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <MessageSquare className="w-4 h-4 inline mr-1" />
                                            Add a message (optional)
                                        </label>
                                        <textarea
                                            value={shareMessage}
                                            onChange={(e) => setShareMessage(e.target.value)}
                                            placeholder="Why are you sharing this job? Any thoughts or questions?"
                                            rows={3}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                            maxLength={1000}
                                        />
                                        <p className="text-xs text-gray-500 mt-1 text-right">
                                            {shareMessage.length}/1000
                                        </p>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && teams.length > 0 && (
                    <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={sharing || !selectedTeam}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            {sharing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sharing...
                                </>
                            ) : (
                                <>
                                    <Share2 className="w-4 h-4" />
                                    Share with Team
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShareJobModal;
