import mongoose from "mongoose";
import {
    PeerSupportGroup,
    GroupMembership,
    PeerDiscussion,
    DiscussionReply,
    PeerChallenge,
    PeerSuccessStory,
    PeerReferral,
    PeerWebinar,
    OpportunityAlert,
    PeerNetworkingImpact,
} from "../models/PeerSupportGroup.js";
import { User } from "../models/User.js";

// ===== HELPER FUNCTIONS =====

/**
 * Get MongoDB user from Clerk userId
 */
const getUserFromAuth = async (clerkUserId) => {
    return await User.findOne({ auth0Id: clerkUserId });
};

/**
 * Check if user is group member
 */
const isGroupMember = async (groupId, userId) => {
    const membership = await GroupMembership.findOne({
        groupId,
        userId,
        status: "active",
    });
    return membership;
};

/**
 * Check if user is group admin/moderator
 */
const isGroupAdmin = async (groupId, userId) => {
    const membership = await GroupMembership.findOne({
        groupId,
        userId,
        status: "active",
        role: { $in: ["admin", "owner", "moderator"] },
    });
    return membership;
};

/**
 * Generate anonymous name
 */
const generateAnonymousName = () => {
    const adjectives = ["Curious", "Determined", "Motivated", "Ambitious", "Resilient", "Creative", "Focused", "Driven"];
    const nouns = ["Seeker", "Explorer", "Achiever", "Learner", "Professional", "Candidate", "Networker", "Builder"];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
};

// ===== GROUP MANAGEMENT =====

/**
 * Get all available groups (with filters)
 */
export const getGroups = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { category, tags, search, page = 1, limit = 20 } = req.query;

        const query = { status: "active" };

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by tags
        if (tags) {
            const tagArray = tags.split(",").map(t => t.trim().toLowerCase());
            query.tags = { $in: tagArray };
        }

        // Search by name or description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        // Only show public groups and groups user is member of
        const userMemberships = await GroupMembership.find({
            userId: user._id,
            status: "active",
        }).select("groupId");
        
        const memberGroupIds = userMemberships.map(m => m.groupId);
        
        query.$or = query.$or || [];
        query.$or.push(
            { groupType: "public" },
            { _id: { $in: memberGroupIds } }
        );

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const groups = await PeerSupportGroup.find(query)
            .populate("ownerId", "name email profilePicture")
            .sort({ "stats.totalMembers": -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PeerSupportGroup.countDocuments(query);

        // Add membership status and owner status to each group
        const groupsWithMembership = groups.map(group => {
            const isMember = memberGroupIds.some(id => id.equals(group._id));
            const groupObj = group.toObject();
            const ownerId = groupObj.ownerId?._id || groupObj.ownerId;
            const isOwner = ownerId ? ownerId.toString() === user._id.toString() : false;
            return {
                ...groupObj,
                isMember,
                isOwner,
            };
        });

        res.json({
            success: true,
            data: {
                groups: groupsWithMembership,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error("Error getting groups:", error);
        res.status(500).json({ success: false, message: "Failed to get groups", error: error.message });
    }
};

/**
 * Get group by ID or slug
 */
export const getGroup = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;

        const group = await PeerSupportGroup.findOne({
            $or: [
                { _id: mongoose.isValidObjectId(groupId) ? groupId : null },
                { slug: groupId },
            ],
        }).populate("ownerId", "name email profilePicture");

        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        // Check membership
        const membership = await GroupMembership.findOne({
            groupId: group._id,
            userId: user._id,
        });

        // For private groups, only members can see details
        if (group.groupType === "private" && (!membership || membership.status !== "active")) {
            return res.json({
                success: true,
                data: {
                    group: {
                        _id: group._id,
                        name: group.name,
                        description: group.description,
                        category: group.category,
                        groupType: group.groupType,
                        stats: { totalMembers: group.stats.totalMembers },
                        coverImage: group.coverImage,
                    },
                    membership: null,
                    isMember: false,
                },
            });
        }

        res.json({
            success: true,
            data: {
                group: {
                    ...group.toObject(),
                    isOwner: group.ownerId._id.equals(user._id),
                },
                membership,
                isMember: membership?.status === "active",
                isAdmin: ["admin", "owner", "moderator"].includes(membership?.role),
                isOwner: group.ownerId._id.equals(user._id),
            },
        });
    } catch (error) {
        console.error("Error getting group:", error);
        res.status(500).json({ success: false, message: "Failed to get group", error: error.message });
    }
};

/**
 * Create a new support group
 */
export const createGroup = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { name, description, category, tags, groupType, settings, guidelines } = req.body;

        if (!name || !category) {
            return res.status(400).json({ success: false, message: "Name and category are required" });
        }

        const group = new PeerSupportGroup({
            name,
            description,
            category,
            tags: tags || [],
            groupType: groupType || "public",
            ownerId: user._id,
            settings: settings || {},
            guidelines,
            stats: { totalMembers: 1 },
        });

        await group.save();

        // Create owner membership
        const membership = new GroupMembership({
            groupId: group._id,
            userId: user._id,
            role: "owner",
            status: "active",
            joinedVia: "direct",
        });

        await membership.save();

        // Update user's networking impact
        await PeerNetworkingImpact.findOneAndUpdate(
            { userId: user._id },
            {
                $inc: { "overallStats.groupsJoined": 1, "overallStats.activeGroups": 1 },
                lastCalculatedAt: new Date(),
            },
            { upsert: true }
        );

        res.status(201).json({
            success: true,
            message: "Group created successfully",
            data: { group, membership },
        });
    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).json({ success: false, message: "Failed to create group", error: error.message });
    }
};

/**
 * Join a group
 */
export const joinGroup = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { inviteCode } = req.body;

        const group = await PeerSupportGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        // Check if already a member
        const existingMembership = await GroupMembership.findOne({
            groupId: group._id,
            userId: user._id,
        });

        if (existingMembership) {
            if (existingMembership.status === "active") {
                return res.status(400).json({ success: false, message: "Already a member of this group" });
            }
            if (existingMembership.status === "pending") {
                return res.status(400).json({ success: false, message: "Membership pending approval" });
            }
        }

        // For invite-only groups, validate invite code
        if (group.groupType === "invite_only") {
            if (!inviteCode || inviteCode !== group.inviteCode) {
                return res.status(403).json({ success: false, message: "Valid invite code required" });
            }
            if (group.inviteCodeExpiresAt && group.inviteCodeExpiresAt < new Date()) {
                return res.status(403).json({ success: false, message: "Invite code has expired" });
            }
        }

        // Create membership
        const membershipData = {
            groupId: group._id,
            userId: user._id,
            role: "member",
            status: group.settings.requireApproval ? "pending" : "active",
            joinedVia: inviteCode ? "invite" : "direct",
            inviteCode: inviteCode || undefined,
        };

        if (existingMembership) {
            Object.assign(existingMembership, membershipData);
            await existingMembership.save();
        } else {
            await GroupMembership.create(membershipData);
        }

        // Update group stats if active
        if (!group.settings.requireApproval) {
            group.stats.totalMembers += 1;
            await group.save();

            // Update user's networking impact
            await PeerNetworkingImpact.findOneAndUpdate(
                { userId: user._id },
                {
                    $inc: { "overallStats.groupsJoined": 1, "overallStats.activeGroups": 1 },
                    lastCalculatedAt: new Date(),
                },
                { upsert: true }
            );
        }

        res.json({
            success: true,
            message: group.settings.requireApproval 
                ? "Join request submitted. Awaiting approval." 
                : "Successfully joined the group",
            data: { status: membershipData.status },
        });
    } catch (error) {
        console.error("Error joining group:", error);
        res.status(500).json({ success: false, message: "Failed to join group", error: error.message });
    }
};

/**
 * Leave a group
 */
export const leaveGroup = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;

        const membership = await GroupMembership.findOne({
            groupId,
            userId: user._id,
            status: "active",
        });

        if (!membership) {
            return res.status(404).json({ success: false, message: "Not a member of this group" });
        }

        if (membership.role === "owner") {
            return res.status(400).json({ 
                success: false, 
                message: "Owners cannot leave. Transfer ownership first or delete the group." 
            });
        }

        membership.status = "left";
        await membership.save();

        // Update group stats
        await PeerSupportGroup.findByIdAndUpdate(groupId, {
            $inc: { "stats.totalMembers": -1 },
        });

        // Update user's networking impact
        await PeerNetworkingImpact.findOneAndUpdate(
            { userId: user._id },
            { $inc: { "overallStats.activeGroups": -1 } }
        );

        res.json({
            success: true,
            message: "Successfully left the group",
        });
    } catch (error) {
        console.error("Error leaving group:", error);
        res.status(500).json({ success: false, message: "Failed to leave group", error: error.message });
    }
};

/**
 * Delete a group (owner only)
 */
export const deleteGroup = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;

        const group = await PeerSupportGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        // Check if user is the owner
        if (!group.ownerId.equals(user._id)) {
            return res.status(403).json({ success: false, message: "Only the group owner can delete this group" });
        }

        // Delete all related data
        await Promise.all([
            GroupMembership.deleteMany({ groupId }),
            PeerDiscussion.deleteMany({ groupId }),
            DiscussionReply.deleteMany({ groupId }),
            PeerChallenge.deleteMany({ groupId }),
            PeerSuccessStory.deleteMany({ groupId }),
            PeerReferral.deleteMany({ groupId }),
            PeerWebinar.deleteMany({ groupId }),
            OpportunityAlert.deleteMany({ groupId }),
        ]);

        // Delete the group
        await PeerSupportGroup.findByIdAndDelete(groupId);

        res.json({
            success: true,
            message: "Group deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting group:", error);
        res.status(500).json({ success: false, message: "Failed to delete group", error: error.message });
    }
};

/**
 * Update member privacy settings
 */
export const updateMemberPrivacy = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { privacySettings, notifications } = req.body;

        const membership = await GroupMembership.findOne({
            groupId,
            userId: user._id,
            status: "active",
        });

        if (!membership) {
            return res.status(404).json({ success: false, message: "Not a member of this group" });
        }

        if (privacySettings) {
            membership.privacySettings = { ...membership.privacySettings, ...privacySettings };
        }
        if (notifications) {
            membership.notifications = { ...membership.notifications, ...notifications };
        }

        await membership.save();

        res.json({
            success: true,
            message: "Privacy settings updated",
            data: { membership },
        });
    } catch (error) {
        console.error("Error updating privacy:", error);
        res.status(500).json({ success: false, message: "Failed to update privacy settings", error: error.message });
    }
};

/**
 * Get my groups
 */
export const getMyGroups = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const memberships = await GroupMembership.find({
            userId: user._id,
            status: "active",
        }).populate({
            path: "groupId",
            populate: { path: "ownerId", select: "name email profilePicture" },
        });

        const groups = memberships.map(m => {
            const group = m.groupId.toObject();
            // Check if user is owner - ownerId is populated so we need to check the _id
            const ownerId = group.ownerId?._id || group.ownerId;
            const isOwner = ownerId ? ownerId.toString() === user._id.toString() : false;
            return {
                ...group,
                isMember: true,
                isOwner,
                membership: {
                    role: m.role,
                    joinedAt: m.createdAt,
                    engagement: m.engagement,
                },
            };
        });

        res.json({
            success: true,
            data: { groups },
        });
    } catch (error) {
        console.error("Error getting my groups:", error);
        res.status(500).json({ success: false, message: "Failed to get groups", error: error.message });
    }
};

// ===== DISCUSSIONS =====

/**
 * Get discussions for a group
 */
export const getDiscussions = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { type, page = 1, limit = 20, sort = "recent" } = req.query;

        // Check membership
        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member to view discussions" });
        }

        const query = { groupId, status: "active" };
        if (type) query.discussionType = type;

        let sortOption = { createdAt: -1 };
        if (sort === "popular") sortOption = { "stats.likeCount": -1, "stats.replyCount": -1 };
        if (sort === "active") sortOption = { "stats.replyCount": -1, updatedAt: -1 };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get pinned discussions first
        const pinnedDiscussions = await PeerDiscussion.find({ ...query, isPinned: true })
            .populate("authorId", "name profilePicture")
            .sort(sortOption);

        const regularDiscussions = await PeerDiscussion.find({ ...query, isPinned: false })
            .populate("authorId", "name profilePicture")
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PeerDiscussion.countDocuments(query);

        // Hide author info for anonymous posts
        const processDiscussions = (discussions) => discussions.map(d => {
            const disc = d.toObject();
            if (disc.isAnonymous) {
                disc.authorId = null;
                disc.authorName = disc.anonymousName;
            }
            return disc;
        });

        res.json({
            success: true,
            data: {
                pinned: processDiscussions(pinnedDiscussions),
                discussions: processDiscussions(regularDiscussions),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error("Error getting discussions:", error);
        res.status(500).json({ success: false, message: "Failed to get discussions", error: error.message });
    }
};

/**
 * Create a discussion
 */
export const createDiscussion = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { title, content, discussionType, tags, isAnonymous } = req.body;

        // Check membership
        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member to post" });
        }

        // Check if group allows anonymous posts
        const group = await PeerSupportGroup.findById(groupId);
        if (isAnonymous && !group.settings.allowAnonymousPosts) {
            return res.status(400).json({ success: false, message: "This group does not allow anonymous posts" });
        }

        const discussion = new PeerDiscussion({
            groupId,
            authorId: user._id,
            title,
            content,
            discussionType: discussionType || "general",
            tags: tags || [],
            isAnonymous: isAnonymous || false,
            anonymousName: isAnonymous ? generateAnonymousName() : undefined,
        });

        await discussion.save();

        // Update stats
        await PeerSupportGroup.findByIdAndUpdate(groupId, {
            $inc: { "stats.totalDiscussions": 1 },
        });

        membership.engagement.discussionsStarted += 1;
        membership.engagement.lastActiveAt = new Date();
        await membership.save();

        // Update networking impact
        await PeerNetworkingImpact.findOneAndUpdate(
            { userId: user._id },
            { $inc: { "overallStats.discussionsParticipated": 1 } },
            { upsert: true }
        );

        res.status(201).json({
            success: true,
            message: "Discussion created successfully",
            data: { discussion },
        });
    } catch (error) {
        console.error("Error creating discussion:", error);
        res.status(500).json({ success: false, message: "Failed to create discussion", error: error.message });
    }
};

/**
 * Get discussion with replies
 */
export const getDiscussion = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId, discussionId } = req.params;

        // Check membership
        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member to view" });
        }

        const discussion = await PeerDiscussion.findById(discussionId)
            .populate("authorId", "name profilePicture");

        if (!discussion) {
            return res.status(404).json({ success: false, message: "Discussion not found" });
        }

        // Increment view count
        discussion.stats.viewCount += 1;
        await discussion.save();

        // Get replies
        const replies = await DiscussionReply.find({
            discussionId,
            status: "active",
        })
            .populate("authorId", "name profilePicture")
            .sort({ createdAt: 1 });

        // Process anonymous posts
        const processedDiscussion = discussion.toObject();
        if (processedDiscussion.isAnonymous) {
            processedDiscussion.authorId = null;
            processedDiscussion.authorName = processedDiscussion.anonymousName;
        }

        const processedReplies = replies.map(r => {
            const reply = r.toObject();
            if (reply.isAnonymous) {
                reply.authorId = null;
                reply.authorName = reply.anonymousName;
            }
            return reply;
        });

        res.json({
            success: true,
            data: {
                discussion: processedDiscussion,
                replies: processedReplies,
            },
        });
    } catch (error) {
        console.error("Error getting discussion:", error);
        res.status(500).json({ success: false, message: "Failed to get discussion", error: error.message });
    }
};

/**
 * Reply to a discussion
 */
export const replyToDiscussion = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId, discussionId } = req.params;
        const { content, parentReplyId, isAnonymous } = req.body;

        // Check membership
        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member to reply" });
        }

        const discussion = await PeerDiscussion.findById(discussionId);
        if (!discussion || discussion.isLocked) {
            return res.status(400).json({ success: false, message: "Cannot reply to this discussion" });
        }

        const reply = new DiscussionReply({
            discussionId,
            authorId: user._id,
            parentReplyId: parentReplyId || null,
            content,
            isAnonymous: isAnonymous || false,
            anonymousName: isAnonymous ? generateAnonymousName() : undefined,
        });

        await reply.save();

        // Update discussion stats
        discussion.stats.replyCount += 1;
        await discussion.save();

        // Update member engagement
        membership.engagement.repliesPosted += 1;
        membership.engagement.lastActiveAt = new Date();
        await membership.save();

        res.status(201).json({
            success: true,
            message: "Reply posted successfully",
            data: { reply },
        });
    } catch (error) {
        console.error("Error replying to discussion:", error);
        res.status(500).json({ success: false, message: "Failed to post reply", error: error.message });
    }
};

/**
 * Like a discussion, reply, or story
 */
export const likeContent = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId, contentType, contentId } = req.params;

        // Check membership
        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        let content;
        if (contentType === "discussion") {
            content = await PeerDiscussion.findById(contentId);
        } else if (contentType === "reply") {
            content = await DiscussionReply.findById(contentId);
        } else if (contentType === "story") {
            content = await PeerSuccessStory.findById(contentId);
        } else {
            return res.status(400).json({ success: false, message: "Invalid content type" });
        }

        if (!content) {
            return res.status(404).json({ success: false, message: "Content not found" });
        }

        // Check if already liked
        const existingLike = content.likes.find(l => l.userId.equals(user._id));
        
        if (existingLike) {
            // Unlike
            content.likes = content.likes.filter(l => !l.userId.equals(user._id));
            if (contentType === "discussion" || contentType === "story") {
                content.stats.likeCount = Math.max(0, content.stats.likeCount - 1);
            } else {
                content.likeCount = Math.max(0, content.likeCount - 1);
            }
            membership.engagement.likesGiven = Math.max(0, membership.engagement.likesGiven - 1);
        } else {
            // Like
            content.likes.push({ userId: user._id });
            if (contentType === "discussion" || contentType === "story") {
                content.stats.likeCount += 1;
            } else {
                content.likeCount += 1;
            }
            membership.engagement.likesGiven += 1;
        }

        await content.save();
        await membership.save();

        res.json({
            success: true,
            message: existingLike ? "Unliked" : "Liked",
            data: { liked: !existingLike },
        });
    } catch (error) {
        console.error("Error liking content:", error);
        res.status(500).json({ success: false, message: "Failed to like content", error: error.message });
    }
};

// ===== CHALLENGES =====

/**
 * Get challenges for a group
 */
export const getChallenges = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const query = { groupId };
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const challenges = await PeerChallenge.find(query)
            .populate("createdBy", "name profilePicture")
            .sort({ startDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PeerChallenge.countDocuments(query);

        // Add user's participation status
        const challengesWithStatus = challenges.map(c => {
            const challenge = c.toObject();
            const participation = c.participants.find(p => p.userId.equals(user._id));
            challenge.isParticipating = !!participation;
            challenge.myProgress = participation?.progress || null;
            return challenge;
        });

        res.json({
            success: true,
            data: {
                challenges: challengesWithStatus,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error("Error getting challenges:", error);
        res.status(500).json({ success: false, message: "Failed to get challenges", error: error.message });
    }
};

/**
 * Create a challenge
 */
export const createChallenge = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { title, description, challengeType, goals, startDate, endDate, rewards } = req.body;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const challenge = new PeerChallenge({
            groupId,
            createdBy: user._id,
            title,
            description,
            challengeType,
            goals,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            rewards: rewards || {},
            status: new Date(startDate) > new Date() ? "upcoming" : "active",
        });

        await challenge.save();

        // Update group stats
        await PeerSupportGroup.findByIdAndUpdate(groupId, {
            $inc: { "stats.totalChallenges": 1 },
        });

        res.status(201).json({
            success: true,
            message: "Challenge created successfully",
            data: { challenge },
        });
    } catch (error) {
        console.error("Error creating challenge:", error);
        res.status(500).json({ success: false, message: "Failed to create challenge", error: error.message });
    }
};

/**
 * Join a challenge
 */
export const joinChallenge = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId, challengeId } = req.params;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const challenge = await PeerChallenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ success: false, message: "Challenge not found" });
        }

        if (challenge.status === "completed" || challenge.status === "cancelled") {
            return res.status(400).json({ success: false, message: "Cannot join this challenge" });
        }

        // Check if already participating
        const existingParticipation = challenge.participants.find(p => p.userId.equals(user._id));
        if (existingParticipation) {
            return res.status(400).json({ success: false, message: "Already participating in this challenge" });
        }

        challenge.participants.push({
            userId: user._id,
            progress: {
                currentValue: 0,
                percentComplete: 0,
            },
        });
        challenge.stats.totalParticipants += 1;
        challenge.stats.activeParticipants += 1;

        await challenge.save();

        // Update member engagement
        membership.engagement.challengesJoined += 1;
        await membership.save();

        res.json({
            success: true,
            message: "Successfully joined the challenge",
        });
    } catch (error) {
        console.error("Error joining challenge:", error);
        res.status(500).json({ success: false, message: "Failed to join challenge", error: error.message });
    }
};

/**
 * Leave a challenge
 */
export const leaveChallenge = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId, challengeId } = req.params;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const challenge = await PeerChallenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ success: false, message: "Challenge not found" });
        }

        // Find and remove participation
        const participantIndex = challenge.participants.findIndex(p => p.userId.equals(user._id));
        if (participantIndex === -1) {
            return res.status(400).json({ success: false, message: "Not participating in this challenge" });
        }

        challenge.participants.splice(participantIndex, 1);
        challenge.stats.totalParticipants = Math.max(0, challenge.stats.totalParticipants - 1);
        challenge.stats.activeParticipants = Math.max(0, challenge.stats.activeParticipants - 1);

        await challenge.save();

        // Update member engagement
        membership.engagement.challengesJoined = Math.max(0, membership.engagement.challengesJoined - 1);
        await membership.save();

        res.json({
            success: true,
            message: "Successfully left the challenge",
        });
    } catch (error) {
        console.error("Error leaving challenge:", error);
        res.status(500).json({ success: false, message: "Failed to leave challenge", error: error.message });
    }
};

/**
 * Update challenge progress
 */
export const updateChallengeProgress = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId, challengeId } = req.params;
        const { currentValue } = req.body;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const challenge = await PeerChallenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ success: false, message: "Challenge not found" });
        }

        const participantIndex = challenge.participants.findIndex(p => p.userId.equals(user._id));
        if (participantIndex === -1) {
            return res.status(400).json({ success: false, message: "Not participating in this challenge" });
        }

        const participant = challenge.participants[participantIndex];
        participant.progress.currentValue = currentValue;
        participant.progress.percentComplete = Math.min(100, (currentValue / challenge.goals.targetValue) * 100);
        participant.progress.lastUpdated = new Date();

        // Check if completed
        if (participant.progress.percentComplete >= 100 && participant.status === "active") {
            participant.status = "completed";
            participant.completedAt = new Date();
            challenge.stats.completedParticipants += 1;
            challenge.stats.activeParticipants -= 1;

            // Update member engagement
            membership.engagement.challengesCompleted += 1;
            await membership.save();

            // Update networking impact
            await PeerNetworkingImpact.findOneAndUpdate(
                { userId: user._id },
                { $inc: { "overallStats.challengesCompleted": 1 } },
                { upsert: true }
            );
        }

        // Recalculate average progress
        const activeParticipants = challenge.participants.filter(p => p.status !== "dropped");
        const totalProgress = activeParticipants.reduce((sum, p) => sum + p.progress.percentComplete, 0);
        challenge.stats.averageProgress = totalProgress / activeParticipants.length;

        await challenge.save();

        res.json({
            success: true,
            message: "Progress updated",
            data: { progress: participant.progress },
        });
    } catch (error) {
        console.error("Error updating progress:", error);
        res.status(500).json({ success: false, message: "Failed to update progress", error: error.message });
    }
};

// ===== SUCCESS STORIES =====

/**
 * Get success stories
 */
export const getSuccessStories = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { type, page = 1, limit = 10 } = req.query;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const query = { groupId, status: "approved" };
        if (type) query.storyType = type;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const stories = await PeerSuccessStory.find(query)
            .populate("authorId", "name profilePicture")
            .sort({ isFeatured: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PeerSuccessStory.countDocuments(query);

        // Process anonymous stories and add hasLiked status
        const processedStories = stories.map(s => {
            const story = s.toObject();
            story.hasLiked = s.likes.some(l => l.userId.equals(user._id));
            if (story.isAnonymous) {
                story.authorId = null;
                story.authorName = "Anonymous Member";
            }
            return story;
        });

        res.json({
            success: true,
            data: {
                stories: processedStories,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error("Error getting success stories:", error);
        res.status(500).json({ success: false, message: "Failed to get success stories", error: error.message });
    }
};

/**
 * Share a success story
 */
export const shareSuccessStory = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { title, summary, fullStory, storyType, keyLearnings, tipsForOthers, isAnonymous, careerContext } = req.body;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const story = new PeerSuccessStory({
            groupId,
            authorId: user._id,
            title,
            summary,
            fullStory,
            storyType,
            keyLearnings: keyLearnings || [],
            tipsForOthers: tipsForOthers || [],
            isAnonymous: isAnonymous || false,
            careerContext: careerContext || {},
        });

        await story.save();

        // Update group stats
        await PeerSupportGroup.findByIdAndUpdate(groupId, {
            $inc: { "stats.totalSuccessStories": 1 },
        });

        res.status(201).json({
            success: true,
            message: "Success story shared!",
            data: { story },
        });
    } catch (error) {
        console.error("Error sharing success story:", error);
        res.status(500).json({ success: false, message: "Failed to share story", error: error.message });
    }
};

// ===== REFERRALS & OPPORTUNITIES =====

/**
 * Get referrals/opportunities
 */
export const getReferrals = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { type, page = 1, limit = 20 } = req.query;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const query = { groupId, status: "active" };
        if (type) query.opportunityType = type;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const referrals = await PeerReferral.find(query)
            .populate("sharedBy", "name profilePicture")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PeerReferral.countDocuments(query);

        // Add user's interest status to each referral
        const referralsWithStatus = referrals.map(r => {
            const referral = r.toObject();
            referral.hasExpressedInterest = r.interestedUsers.some(u => u.userId.equals(user._id));
            return referral;
        });

        res.json({
            success: true,
            data: {
                referrals: referralsWithStatus,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error("Error getting referrals:", error);
        res.status(500).json({ success: false, message: "Failed to get referrals", error: error.message });
    }
};

/**
 * Share a referral/opportunity
 */
export const shareReferral = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { title, company, description, opportunityType, jobDetails, applicationInfo, canRefer, referralSlots, expiresAt } = req.body;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const referral = new PeerReferral({
            groupId,
            sharedBy: user._id,
            title,
            company,
            description,
            opportunityType,
            jobDetails: jobDetails || {},
            applicationInfo: applicationInfo || {},
            canRefer: canRefer || false,
            referralSlots: referralSlots || { total: 0, used: 0 },
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        });

        await referral.save();

        // Update group stats
        await PeerSupportGroup.findByIdAndUpdate(groupId, {
            $inc: { "stats.totalReferrals": 1 },
        });

        // Update member engagement
        membership.engagement.referralsShared += 1;
        await membership.save();

        // Update networking impact
        await PeerNetworkingImpact.findOneAndUpdate(
            { userId: user._id },
            { $inc: { "impactMetrics.referralsGiven": 1 } },
            { upsert: true }
        );

        res.status(201).json({
            success: true,
            message: "Opportunity shared!",
            data: { referral },
        });
    } catch (error) {
        console.error("Error sharing referral:", error);
        res.status(500).json({ success: false, message: "Failed to share opportunity", error: error.message });
    }
};

/**
 * Express interest in a referral
 */
export const expressInterest = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId, referralId } = req.params;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const referral = await PeerReferral.findById(referralId);
        if (!referral || referral.status !== "active") {
            return res.status(404).json({ success: false, message: "Opportunity not found or no longer active" });
        }

        // Check if already interested
        const existingInterest = referral.interestedUsers.find(u => u.userId.equals(user._id));
        if (existingInterest) {
            return res.status(400).json({ success: false, message: "Already expressed interest" });
        }

        referral.interestedUsers.push({
            userId: user._id,
            requestedAt: new Date(),
        });
        referral.stats.interestCount += 1;
        
        // Increment used referral slots if canRefer is enabled
        if (referral.canRefer && referral.referralSlots) {
            referral.referralSlots.used = (referral.referralSlots.used || 0) + 1;
        }

        await referral.save();

        // Update networking impact
        await PeerNetworkingImpact.findOneAndUpdate(
            { userId: user._id },
            { $inc: { "impactMetrics.referralsReceived": 1 } },
            { upsert: true }
        );

        res.json({
            success: true,
            message: "Interest expressed! The poster will be notified.",
        });
    } catch (error) {
        console.error("Error expressing interest:", error);
        res.status(500).json({ success: false, message: "Failed to express interest", error: error.message });
    }
};

/**
 * Withdraw interest from a referral
 */
export const withdrawInterest = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId, referralId } = req.params;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const referral = await PeerReferral.findById(referralId);
        if (!referral) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        // Find and remove interest
        const interestIndex = referral.interestedUsers.findIndex(u => u.userId.equals(user._id));
        if (interestIndex === -1) {
            return res.status(400).json({ success: false, message: "You have not expressed interest in this opportunity" });
        }

        referral.interestedUsers.splice(interestIndex, 1);
        referral.stats.interestCount = Math.max(0, referral.stats.interestCount - 1);
        
        // Decrement used referral slots if canRefer is enabled
        if (referral.canRefer && referral.referralSlots) {
            referral.referralSlots.used = Math.max(0, (referral.referralSlots.used || 0) - 1);
        }

        await referral.save();

        res.json({
            success: true,
            message: "Interest withdrawn successfully",
        });
    } catch (error) {
        console.error("Error withdrawing interest:", error);
        res.status(500).json({ success: false, message: "Failed to withdraw interest", error: error.message });
    }
};

// ===== WEBINARS & COACHING =====

/**
 * Get webinars/coaching sessions
 */
export const getWebinars = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { status, topic, page = 1, limit = 10 } = req.query;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const query = { groupId };
        if (status) query.status = status;
        if (topic) query.topic = topic;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const webinars = await PeerWebinar.find(query)
            .populate("hostId", "name profilePicture")
            .sort({ scheduledAt: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PeerWebinar.countDocuments(query);

        // Add user's registration status
        const webinarsWithStatus = webinars.map(w => {
            const webinar = w.toObject();
            const registration = w.registrations.find(r => r.userId.equals(user._id));
            webinar.isRegistered = !!registration;
            webinar.myRegistration = registration || null;
            return webinar;
        });

        res.json({
            success: true,
            data: {
                webinars: webinarsWithStatus,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error("Error getting webinars:", error);
        res.status(500).json({ success: false, message: "Failed to get webinars", error: error.message });
    }
};

/**
 * Create a webinar/coaching session
 */
export const createWebinar = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { title, description, sessionType, topic, scheduledAt, duration, meetingInfo, meetingLink, capacity } = req.body;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        // Build meetingInfo from meetingLink if provided
        const finalMeetingInfo = meetingInfo || {};
        if (meetingLink) {
            finalMeetingInfo.link = meetingLink;
            // Auto-detect platform from link
            if (meetingLink.includes('zoom')) {
                finalMeetingInfo.platform = 'zoom';
            } else if (meetingLink.includes('meet.google')) {
                finalMeetingInfo.platform = 'google_meet';
            } else if (meetingLink.includes('teams')) {
                finalMeetingInfo.platform = 'teams';
            } else {
                finalMeetingInfo.platform = 'other';
            }
        }

        const webinar = new PeerWebinar({
            groupId,
            hostId: user._id,
            title,
            description,
            sessionType,
            topic,
            scheduledAt: new Date(scheduledAt),
            duration: duration || 60,
            meetingInfo: finalMeetingInfo,
            capacity: { max: capacity || 100, current: 0 },
        });

        await webinar.save();

        // Update group stats
        await PeerSupportGroup.findByIdAndUpdate(groupId, {
            $inc: { "stats.totalWebinars": 1 },
        });

        res.status(201).json({
            success: true,
            message: "Webinar created successfully",
            data: { webinar },
        });
    } catch (error) {
        console.error("Error creating webinar:", error);
        res.status(500).json({ success: false, message: "Failed to create webinar", error: error.message });
    }
};

/**
 * Register for a webinar
 */
export const registerForWebinar = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId, webinarId } = req.params;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const webinar = await PeerWebinar.findById(webinarId);
        if (!webinar) {
            return res.status(404).json({ success: false, message: "Webinar not found" });
        }

        if (webinar.status === "completed" || webinar.status === "cancelled") {
            return res.status(400).json({ success: false, message: "Cannot register for this webinar" });
        }

        if (webinar.capacity.current >= webinar.capacity.max) {
            return res.status(400).json({ success: false, message: "Webinar is full" });
        }

        // Check if already registered
        const existingRegistration = webinar.registrations.find(r => r.userId.equals(user._id));
        if (existingRegistration) {
            return res.status(400).json({ success: false, message: "Already registered" });
        }

        webinar.registrations.push({ userId: user._id });
        webinar.capacity.current += 1;
        webinar.stats.registrationCount += 1;

        await webinar.save();

        res.json({
            success: true,
            message: "Successfully registered for the webinar",
            data: { meetingInfo: webinar.meetingInfo },
        });
    } catch (error) {
        console.error("Error registering for webinar:", error);
        res.status(500).json({ success: false, message: "Failed to register", error: error.message });
    }
};

/**
 * Unregister from a webinar
 */
export const unregisterFromWebinar = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId, webinarId } = req.params;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const webinar = await PeerWebinar.findById(webinarId);
        if (!webinar) {
            return res.status(404).json({ success: false, message: "Webinar not found" });
        }

        // Find and remove registration
        const registrationIndex = webinar.registrations.findIndex(r => r.userId.equals(user._id));
        if (registrationIndex === -1) {
            return res.status(400).json({ success: false, message: "Not registered for this webinar" });
        }

        webinar.registrations.splice(registrationIndex, 1);
        webinar.capacity.current = Math.max(0, webinar.capacity.current - 1);
        webinar.stats.registrationCount = Math.max(0, webinar.stats.registrationCount - 1);

        await webinar.save();

        res.json({
            success: true,
            message: "Successfully unregistered from the webinar",
        });
    } catch (error) {
        console.error("Error unregistering from webinar:", error);
        res.status(500).json({ success: false, message: "Failed to unregister", error: error.message });
    }
};

// ===== NETWORKING IMPACT =====

/**
 * Get user's networking impact
 */
export const getNetworkingImpact = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let impact = await PeerNetworkingImpact.findOne({ userId: user._id });

        if (!impact) {
            // Calculate from scratch
            const memberships = await GroupMembership.find({ userId: user._id, status: "active" });
            
            impact = new PeerNetworkingImpact({
                userId: user._id,
                overallStats: {
                    groupsJoined: memberships.length,
                    activeGroups: memberships.length,
                },
            });
            
            // Aggregate engagement from all memberships
            for (const m of memberships) {
                impact.overallStats.discussionsParticipated += m.engagement.discussionsStarted + m.engagement.repliesPosted;
                impact.overallStats.challengesCompleted += m.engagement.challengesCompleted;
                impact.overallStats.webinarsAttended += m.engagement.webinarsAttended;
                impact.impactMetrics.referralsGiven += m.engagement.referralsShared;
            }

            await impact.save();
        }

        // Get recent activity across groups
        const recentDiscussions = await PeerDiscussion.find({ authorId: user._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("groupId", "name");

        const recentChallenges = await PeerChallenge.find({
            "participants.userId": user._id,
            "participants.status": { $in: ["active", "completed"] },
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("groupId", "name");

        res.json({
            success: true,
            data: {
                impact,
                recentActivity: {
                    discussions: recentDiscussions,
                    challenges: recentChallenges,
                },
            },
        });
    } catch (error) {
        console.error("Error getting networking impact:", error);
        res.status(500).json({ success: false, message: "Failed to get networking impact", error: error.message });
    }
};

/**
 * Get opportunity alerts
 */
export const getOpportunityAlerts = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const alerts = await OpportunityAlert.find({
            groupId,
            status: "active",
            $or: [
                { expiresAt: { $gt: new Date() } },
                { expiresAt: null },
            ],
        })
            .populate("createdBy", "name profilePicture")
            .sort({ priority: -1, createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            data: { alerts },
        });
    } catch (error) {
        console.error("Error getting alerts:", error);
        res.status(500).json({ success: false, message: "Failed to get alerts", error: error.message });
    }
};

/**
 * Create opportunity alert
 */
export const createOpportunityAlert = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { title, description, alertType, priority, link, expiresAt } = req.body;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const alert = new OpportunityAlert({
            groupId,
            createdBy: user._id,
            title,
            description,
            alertType,
            priority: priority || "medium",
            link,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        });

        await alert.save();

        res.status(201).json({
            success: true,
            message: "Alert created",
            data: { alert },
        });
    } catch (error) {
        console.error("Error creating alert:", error);
        res.status(500).json({ success: false, message: "Failed to create alert", error: error.message });
    }
};

/**
 * Get group members
 */
export const getGroupMembers = async (req, res) => {
    try {
        const user = await getUserFromAuth(req.auth.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { groupId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const membership = await isGroupMember(groupId, user._id);
        if (!membership) {
            return res.status(403).json({ success: false, message: "Must be a group member" });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const members = await GroupMembership.find({
            groupId,
            status: "active",
        })
            .populate("userId", "name email profilePicture")
            .sort({ role: 1, createdAt: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await GroupMembership.countDocuments({ groupId, status: "active" });

        // Filter based on privacy settings
        const processedMembers = members.map(m => {
            const member = m.toObject();
            if (!m.privacySettings.showProfile) {
                member.userId = { name: "Private Member" };
            }
            return member;
        });

        res.json({
            success: true,
            data: {
                members: processedMembers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error("Error getting members:", error);
        res.status(500).json({ success: false, message: "Failed to get members", error: error.message });
    }
};
