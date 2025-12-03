import SharedJob from '../models/SharedJob.js';
import { Team, TeamMember } from '../models/Team.js';
import { Job } from '../models/Job.js';

// Share a job with team
export const shareJobWithTeam = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { teamId } = req.params;
    const { jobId, message, category, priority, tags, visibleTo } = req.body;

    // Verify team membership
    const membership = await TeamMember.findOne({
      teamId,
      $or: [{ userId }, { email: req.auth?.sessionClaims?.email }],
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    // Get job data
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if already shared
    const existing = await SharedJob.findOne({ teamId, jobId, status: 'active' });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This job has already been shared with the team'
      });
    }

    // Create shared job
    const sharedJob = new SharedJob({
      teamId,
      jobId,
      jobSnapshot: {
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description?.substring(0, 500),
        salary: job.salary,
        status: job.status,
        url: job.url
      },
      sharedBy: {
        userId,
        userName: req.auth?.sessionClaims?.name || req.auth?.sessionClaims?.email || 'Team Member',
        role: membership.role
      },
      message,
      category: category || 'opportunity',
      priority: priority || 'normal',
      tags: tags || [],
      visibleTo: visibleTo || []
    });

    await sharedJob.save();

    res.status(201).json({
      success: true,
      message: 'Job shared successfully',
      data: { sharedJob }
    });
  } catch (error) {
    console.error('Error sharing job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share job',
      error: error.message
    });
  }
};

// Get shared jobs for team
export const getSharedJobs = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { teamId } = req.params;
    const { status = 'active', category, page = 1, limit = 20 } = req.query;

    // Verify team membership
    const membership = await TeamMember.findOne({
      teamId,
      $or: [{ userId }, { email: req.auth?.sessionClaims?.email }],
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    const query = { teamId, status };
    if (category) query.category = category;

    // Filter by visibility if not admin/owner
    if (!['owner', 'admin'].includes(membership.role)) {
      query.$or = [
        { visibleTo: { $size: 0 } }, // Visible to all
        { visibleTo: membership._id } // Explicitly visible to this member
      ];
    }

    const sharedJobs = await SharedJob.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await SharedJob.countDocuments(query);

    res.json({
      success: true,
      data: {
        sharedJobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching shared jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shared jobs',
      error: error.message
    });
  }
};

// Get single shared job
export const getSharedJob = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { teamId, sharedJobId } = req.params;

    // Verify team membership
    const membership = await TeamMember.findOne({
      teamId,
      $or: [{ userId }, { email: req.auth?.sessionClaims?.email }],
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    const sharedJob = await SharedJob.findOne({ _id: sharedJobId, teamId });
    
    if (!sharedJob) {
      return res.status(404).json({
        success: false,
        message: 'Shared job not found'
      });
    }

    // Increment view count
    sharedJob.incrementViews();
    await sharedJob.save();

    res.json({
      success: true,
      data: { sharedJob }
    });
  } catch (error) {
    console.error('Error fetching shared job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shared job',
      error: error.message
    });
  }
};

// Add comment to shared job
export const addComment = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { teamId, sharedJobId } = req.params;
    const { content, type, parentId } = req.body;

    // Verify team membership
    const membership = await TeamMember.findOne({
      teamId,
      $or: [{ userId }, { email: req.auth?.sessionClaims?.email }],
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    const sharedJob = await SharedJob.findOne({ _id: sharedJobId, teamId });
    
    if (!sharedJob) {
      return res.status(404).json({
        success: false,
        message: 'Shared job not found'
      });
    }

    const comment = {
      userId,
      userName: req.auth?.sessionClaims?.name || req.auth?.sessionClaims?.email || 'Team Member',
      userRole: membership.role,
      content,
      type: type || 'comment',
      parentId: parentId || null
    };

    sharedJob.addComment(comment);
    await sharedJob.save();

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { 
        comment: sharedJob.comments[sharedJob.comments.length - 1],
        totalComments: sharedJob.stats.commentCount
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// Update comment
export const updateComment = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { teamId, sharedJobId, commentId } = req.params;
    const { content } = req.body;

    const sharedJob = await SharedJob.findOne({ _id: sharedJobId, teamId });
    
    if (!sharedJob) {
      return res.status(404).json({
        success: false,
        message: 'Shared job not found'
      });
    }

    const comment = sharedJob.comments.id(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only comment author can edit
    if (comment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    
    await sharedJob.save();

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment }
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { teamId, sharedJobId, commentId } = req.params;

    // Verify team membership
    const membership = await TeamMember.findOne({
      teamId,
      $or: [{ userId }, { email: req.auth?.sessionClaims?.email }],
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    const sharedJob = await SharedJob.findOne({ _id: sharedJobId, teamId });
    
    if (!sharedJob) {
      return res.status(404).json({
        success: false,
        message: 'Shared job not found'
      });
    }

    const comment = sharedJob.comments.id(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only comment author or admin can delete
    if (comment.userId !== userId && !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this comment'
      });
    }

    sharedJob.comments.pull(commentId);
    sharedJob.stats.commentCount = sharedJob.comments.length;
    await sharedJob.save();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

// Add reaction to comment
export const addReaction = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { teamId, sharedJobId, commentId } = req.params;
    const { type } = req.body;

    const sharedJob = await SharedJob.findOne({ _id: sharedJobId, teamId });
    
    if (!sharedJob) {
      return res.status(404).json({
        success: false,
        message: 'Shared job not found'
      });
    }

    const comment = sharedJob.comments.id(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Remove existing reaction from this user
    comment.reactions = comment.reactions.filter(r => r.userId !== userId);
    
    // Add new reaction
    comment.reactions.push({ userId, type });
    
    await sharedJob.save();

    res.json({
      success: true,
      message: 'Reaction added successfully',
      data: { reactions: comment.reactions }
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction',
      error: error.message
    });
  }
};

// Pin/unpin shared job
export const togglePin = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { teamId, sharedJobId } = req.params;

    // Verify team membership with admin rights
    const membership = await TeamMember.findOne({
      teamId,
      $or: [{ userId }, { email: req.auth?.sessionClaims?.email }],
      status: 'active',
      role: { $in: ['owner', 'admin', 'mentor', 'coach'] }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to pin/unpin jobs'
      });
    }

    const sharedJob = await SharedJob.findOne({ _id: sharedJobId, teamId });
    
    if (!sharedJob) {
      return res.status(404).json({
        success: false,
        message: 'Shared job not found'
      });
    }

    sharedJob.isPinned = !sharedJob.isPinned;
    if (sharedJob.isPinned) {
      sharedJob.pinnedAt = new Date();
      sharedJob.pinnedBy = userId;
    } else {
      sharedJob.pinnedAt = null;
      sharedJob.pinnedBy = null;
    }

    await sharedJob.save();

    res.json({
      success: true,
      message: sharedJob.isPinned ? 'Job pinned successfully' : 'Job unpinned successfully',
      data: { sharedJob }
    });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle pin status',
      error: error.message
    });
  }
};

// Archive shared job
export const archiveSharedJob = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { teamId, sharedJobId } = req.params;

    // Verify team membership
    const membership = await TeamMember.findOne({
      teamId,
      $or: [{ userId }, { email: req.auth?.sessionClaims?.email }],
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    const sharedJob = await SharedJob.findOne({ _id: sharedJobId, teamId });
    
    if (!sharedJob) {
      return res.status(404).json({
        success: false,
        message: 'Shared job not found'
      });
    }

    // Only original sharer or admin can archive
    if (sharedJob.sharedBy.userId !== userId && !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to archive this job'
      });
    }

    sharedJob.status = 'archived';
    await sharedJob.save();

    res.json({
      success: true,
      message: 'Shared job archived successfully',
      data: { sharedJob }
    });
  } catch (error) {
    console.error('Error archiving shared job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive shared job',
      error: error.message
    });
  }
};
