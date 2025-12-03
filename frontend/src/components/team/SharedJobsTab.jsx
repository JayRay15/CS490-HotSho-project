import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Share2, MessageCircle, Pin, Archive, ThumbsUp, Lightbulb, Target, PartyPopper,
  Building2, MapPin, DollarSign, Calendar, ExternalLink, MoreVertical, Filter,
  AlertCircle, ChevronDown, Tag, Clock
} from 'lucide-react';
import {
  getSharedJobs,
  togglePin,
  archiveSharedJob,
  SHARE_CATEGORIES,
  PRIORITY_LABELS,
  REACTION_TYPES
} from '../../api/sharedJobs';
import JobCommentThread from './JobCommentThread';

const SharedJobsTab = ({ teamId }) => {
  const { user } = useUser();
  const [sharedJobs, setSharedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchSharedJobs = useCallback(async () => {
    if (!teamId) return;
    
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        if (filter === 'pinned') params.pinned = true;
        else params.status = filter;
      }
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const response = await getSharedJobs(teamId, params);
      setSharedJobs(response.sharedJobs || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching shared jobs:', err);
      setError('Failed to load shared jobs');
    } finally {
      setLoading(false);
    }
  }, [teamId, filter, categoryFilter]);

  useEffect(() => {
    fetchSharedJobs();
  }, [fetchSharedJobs]);

  const handleTogglePin = async (sharedJobId) => {
    try {
      await togglePin(teamId, sharedJobId);
      fetchSharedJobs();
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const handleArchive = async (sharedJobId) => {
    try {
      await archiveSharedJob(teamId, sharedJobId);
      fetchSharedJobs();
    } catch (err) {
      console.error('Error archiving:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'opportunity': return 'text-green-600 bg-green-100';
      case 'discussion': return 'text-blue-600 bg-blue-100';
      case 'feedback_request': return 'text-purple-600 bg-purple-100';
      case 'success_story': return 'text-yellow-600 bg-yellow-100';
      case 'learning': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Shared Jobs</h2>
          <p className="text-sm text-gray-500">
            {sharedJobs.length} job{sharedJobs.length !== 1 ? 's' : ''} shared with team
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          Filters
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="pinned">Pinned</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {Object.entries(SHARE_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Shared Jobs List */}
      {sharedJobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shared jobs yet</h3>
          <p className="text-gray-500">
            Share interesting job opportunities with your team to collaborate and get feedback.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sharedJobs.map((sharedJob) => (
            <div
              key={sharedJob._id}
              className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                sharedJob.isPinned ? 'border-yellow-300 bg-yellow-50/30' : ''
              }`}
            >
              {/* Job Header */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {sharedJob.isPinned && (
                        <Pin className="h-4 w-4 text-yellow-600 fill-current" />
                      )}
                      <h3 className="font-semibold text-gray-900">
                        {sharedJob.jobId?.title || 'Job Title'}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(sharedJob.category)}`}>
                        {SHARE_CATEGORIES[sharedJob.category]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(sharedJob.priority)}`}>
                        {PRIORITY_LABELS[sharedJob.priority]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {sharedJob.jobId?.company || 'Company'}
                      </span>
                      {sharedJob.jobId?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {sharedJob.jobId.location}
                        </span>
                      )}
                      {sharedJob.jobId?.salary && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {sharedJob.jobId.salary}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePin(sharedJob._id)}
                      className={`p-2 rounded-lg transition-colors ${
                        sharedJob.isPinned 
                          ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      title={sharedJob.isPinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleArchive(sharedJob._id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Archive"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Share Note */}
                {sharedJob.note && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">{sharedJob.note}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Shared by {sharedJob.sharedBy?.firstName || 'Team Member'} • {formatDate(sharedJob.createdAt)}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {sharedJob.tags && sharedJob.tags.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    <Tag className="h-3 w-3 text-gray-400" />
                    {sharedJob.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments Preview */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {sharedJob.comments?.length || 0} comments
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last activity {formatDate(sharedJob.lastActivity || sharedJob.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedJob(selectedJob?._id === sharedJob._id ? null : sharedJob)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedJob?._id === sharedJob._id ? 'Hide Comments' : 'View Discussion'}
                  </button>
                </div>

                {/* Recent Comments Preview */}
                {sharedJob.comments?.length > 0 && selectedJob?._id !== sharedJob._id && (
                  <div className="space-y-2">
                    {sharedJob.comments.slice(0, 2).map((comment) => (
                      <div key={comment._id} className="flex items-start gap-2 text-sm">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium flex-shrink-0">
                          {comment.userId?.firstName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900">
                            {comment.userId?.firstName || 'User'}
                          </span>
                          <span className="text-gray-600 ml-1 truncate">
                            {comment.content.substring(0, 100)}
                            {comment.content.length > 100 ? '...' : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                    {sharedJob.comments.length > 2 && (
                      <button
                        onClick={() => setSelectedJob(sharedJob)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        +{sharedJob.comments.length - 2} more comments
                      </button>
                    )}
                  </div>
                )}

                {/* Full Comment Thread */}
                {selectedJob?._id === sharedJob._id && (
                  <JobCommentThread
                    teamId={teamId}
                    sharedJob={sharedJob}
                    onUpdate={fetchSharedJobs}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedJobsTab;
