import React, { useState, useEffect } from 'react';
import { Share2, X, Users, MessageSquare, Tag, AlertCircle, Check } from 'lucide-react';
import { shareJobWithTeam, SHARE_CATEGORIES, PRIORITY_LABELS } from '../../api/sharedJobs';
import { getMyTeams } from '../../api/teams';

const ShareJobButton = ({ job, onSuccess, variant = 'button', className = '' }) => {
  const [showModal, setShowModal] = useState(false);
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    teamId: '',
    note: '',
    category: 'opportunity',
    priority: 'normal',
    tags: '',
    visibility: 'team'
  });

  useEffect(() => {
    if (showModal && teams.length === 0) {
      fetchTeams();
    }
  }, [showModal]);

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true);
      const response = await getMyTeams();
      setTeams(response.teams || []);
      if (response.teams?.length > 0) {
        setFormData(prev => ({ ...prev, teamId: response.teams[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams');
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.teamId || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await shareJobWithTeam(formData.teamId, {
        jobId: job._id,
        note: formData.note,
        category: formData.category,
        priority: formData.priority,
        tags,
        visibility: formData.visibility
      });

      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setFormData({
          teamId: teams[0]?._id || '',
          note: '',
          category: 'opportunity',
          priority: 'normal',
          tags: '',
          visibility: 'team'
        });
        onSuccess?.();
      }, 1500);
    } catch (err) {
      console.error('Error sharing job:', err);
      setError(err.response?.data?.message || 'Failed to share job');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTrigger = () => {
    if (variant === 'icon') {
      return (
        <button
          onClick={() => setShowModal(true)}
          className={`p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ${className}`}
          title="Share with Team"
        >
          <Share2 className="h-4 w-4" />
        </button>
      );
    }

    return (
      <button
        onClick={() => setShowModal(true)}
        className={`text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium flex items-center gap-1 ${className}`}
        title="Share this job with your team"
      >
        <Share2 className="h-3 w-3" />
        Share with Team
      </button>
    );
  };

  return (
    <>
      {renderTrigger()}

      {/* Share Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600" />
                Share Job with Team
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Job Preview */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">{job.title}</h3>
              <p className="text-sm text-gray-600">{job.company}</p>
              {job.location && (
                <p className="text-sm text-gray-500">{job.location}</p>
              )}
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Shared Successfully!</h3>
                <p className="text-sm text-gray-500">Your team can now see and discuss this job.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Team Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Team *
                  </label>
                  {loadingTeams ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Loading teams...
                    </div>
                  ) : teams.length === 0 ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
                      <Users className="h-4 w-4 inline mr-1" />
                      You're not a member of any teams yet.
                    </div>
                  ) : (
                    <select
                      value={formData.teamId}
                      onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {teams.map((team) => (
                        <option key={team._id} value={team._id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Category */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(SHARE_CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Note */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    Add a note (optional)
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Why are you sharing this? Any thoughts or questions?"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                {/* Tags */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="h-4 w-4 inline mr-1" />
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="remote, entry-level, tech"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || teams.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4" />
                        Share
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ShareJobButton;
