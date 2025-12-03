import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Send, Edit2, Trash2, ThumbsUp, Lightbulb, Target, PartyPopper,
  MessageSquare, HelpCircle, Star, Reply, MoreHorizontal
} from 'lucide-react';
import {
  addComment,
  updateComment,
  deleteComment,
  addReaction,
  COMMENT_TYPES,
  REACTION_TYPES
} from '../../api/sharedJobs';

const JobCommentThread = ({ teamId, sharedJob, onUpdate }) => {
  const { user } = useUser();
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('comment');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      await addComment(teamId, sharedJob._id, {
        content: newComment,
        type: commentType,
        parentCommentId: replyingTo?._id
      });
      setNewComment('');
      setCommentType('comment');
      setReplyingTo(null);
      onUpdate();
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim() || submitting) return;

    try {
      setSubmitting(true);
      await updateComment(teamId, sharedJob._id, commentId, {
        content: editContent
      });
      setEditingComment(null);
      setEditContent('');
      onUpdate();
    } catch (err) {
      console.error('Error updating comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment(teamId, sharedJob._id, commentId);
      onUpdate();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleReaction = async (commentId, type) => {
    try {
      await addReaction(teamId, sharedJob._id, commentId, type);
      onUpdate();
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCommentTypeIcon = (type) => {
    switch (type) {
      case 'recommendation': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'feedback': return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'question': return <HelpCircle className="h-4 w-4 text-blue-500" />;
      case 'tip': return <Lightbulb className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const getCommentTypeBadge = (type) => {
    const colors = {
      comment: 'bg-gray-100 text-gray-600',
      recommendation: 'bg-yellow-100 text-yellow-700',
      feedback: 'bg-purple-100 text-purple-700',
      question: 'bg-blue-100 text-blue-700',
      tip: 'bg-green-100 text-green-700'
    };
    return colors[type] || colors.comment;
  };

  const getReactionIcon = (type) => {
    switch (type) {
      case 'like': return <ThumbsUp className="h-3 w-3" />;
      case 'helpful': return <Lightbulb className="h-3 w-3" />;
      case 'insightful': return <Target className="h-3 w-3" />;
      case 'celebrate': return <PartyPopper className="h-3 w-3" />;
      default: return null;
    }
  };

  // Group comments by parent
  const parentComments = sharedJob.comments?.filter(c => !c.parentCommentId) || [];
  const replies = sharedJob.comments?.filter(c => c.parentCommentId) || [];

  const getReplies = (parentId) => replies.filter(r => r.parentCommentId === parentId);

  const renderComment = (comment, isReply = false) => {
    const isOwner = comment.userId?._id === user?.id || comment.userId?.clerkId === user?.id;
    const commentReplies = isReply ? [] : getReplies(comment._id);

    return (
      <div key={comment._id} className={`${isReply ? 'ml-8 mt-3' : ''}`}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`${isReply ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0`}>
            {comment.userId?.firstName?.charAt(0) || 'U'}
          </div>

          {/* Comment Body */}
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 text-sm">
                  {comment.userId?.firstName} {comment.userId?.lastName}
                </span>
                {comment.type !== 'comment' && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${getCommentTypeBadge(comment.type)}`}>
                    {getCommentTypeIcon(comment.type)}
                    <span className="ml-1">{COMMENT_TYPES[comment.type]}</span>
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {formatDate(comment.createdAt)}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-gray-400 italic">(edited)</span>
                )}
              </div>

              {editingComment === comment._id ? (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdateComment(comment._id)}
                      disabled={submitting}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingComment(null);
                        setEditContent('');
                      }}
                      className="px-3 py-1 text-gray-600 text-sm hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              )}
            </div>

            {/* Comment Actions */}
            <div className="flex items-center gap-4 mt-1 ml-2">
              {/* Reactions */}
              <div className="flex items-center gap-1">
                {Object.entries(REACTION_TYPES).map(([type, emoji]) => {
                  const reactionCount = comment.reactions?.filter(r => r.type === type).length || 0;
                  const hasReacted = comment.reactions?.some(
                    r => r.type === type && (r.userId === user?.id || r.userId?._id === user?.id)
                  );
                  return (
                    <button
                      key={type}
                      onClick={() => handleReaction(comment._id, type)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                        hasReacted 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                    >
                      <span>{emoji}</span>
                      {reactionCount > 0 && <span>{reactionCount}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Reply Button */}
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(replyingTo?._id === comment._id ? null : comment)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </button>
              )}

              {/* Edit/Delete for owner */}
              {isOwner && !editingComment && (
                <>
                  <button
                    onClick={() => {
                      setEditingComment(comment._id);
                      setEditContent(comment.content);
                    }}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </>
              )}
            </div>

            {/* Replies */}
            {commentReplies.length > 0 && (
              <div className="mt-2 space-y-2">
                {commentReplies.map(reply => renderComment(reply, true))}
              </div>
            )}

            {/* Reply Input */}
            {replyingTo?._id === comment._id && (
              <form onSubmit={handleSubmitComment} className="mt-3 ml-8">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium flex-shrink-0">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={`Reply to ${comment.userId?.firstName}...`}
                      className="w-full border rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="px-3 py-1 text-gray-600 text-sm hover:bg-gray-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newComment.trim() || submitting}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Send className="h-3 w-3" />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 pt-4 border-t">
      {/* Comments List */}
      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
        {parentComments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No comments yet. Start the discussion!
          </p>
        ) : (
          parentComments.map(comment => renderComment(comment))
        )}
      </div>

      {/* New Comment Form */}
      {!replyingTo && (
        <form onSubmit={handleSubmitComment} className="pt-4 border-t">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment, tip, or recommendation..."
                className="w-full border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Comment as:</span>
                  <select
                    value={commentType}
                    onChange={(e) => setCommentType(e.target.value)}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    {Object.entries(COMMENT_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default JobCommentThread;
