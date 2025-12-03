import Document from '../models/Document.js';
import mongoose from 'mongoose';

// Get all documents for user
export const getDocuments = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { category, status = 'active', search, tags, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;

    const query = { userId, status };

    if (category) {
      query.category = category;
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query.tags = { $in: tagArray };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const documents = await Document.find(query)
      .sort(sortOptions)
      .select('-versions.fileData') // Exclude file data from list view
      .lean();

    // Get category counts
    const categoryCounts = await Document.aggregate([
      { $match: { userId, status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const stats = {
      total: documents.length,
      byCategory: categoryCounts.reduce((acc, c) => {
        acc[c._id] = c.count;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: {
        documents,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message
    });
  }
};

// Get single document with version history
export const getDocumentById = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const document = await Document.findOne({ _id: id, userId })
      .populate('linkedJobs', 'title company status')
      .lean();

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Update last accessed
    await Document.updateOne({ _id: id }, { lastAccessedAt: new Date() });

    res.json({
      success: true,
      data: { document }
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document',
      error: error.message
    });
  }
};

// Create new document
export const createDocument = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const {
      name,
      description,
      category,
      tags,
      fileName,
      fileSize,
      fileData,
      mimeType,
      linkedJobs,
      notes
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }

    const document = new Document({
      userId,
      name,
      description,
      category,
      tags: tags || [],
      currentVersion: 1,
      versions: [{
        versionNumber: 1,
        fileName: fileName || name,
        fileSize,
        fileData,
        mimeType,
        notes,
        createdBy: userId
      }],
      linkedJobs: linkedJobs || [],
      currentFileName: fileName || name,
      currentFileSize: fileSize,
      currentMimeType: mimeType,
      sourceType: 'upload'
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      data: { document }
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create document',
      error: error.message
    });
  }
};

// Update document metadata
export const updateDocument = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;
    const { name, description, category, tags, linkedJobs, isFavorite, status } = req.body;

    const document = await Document.findOne({ _id: id, userId });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (name) document.name = name;
    if (description !== undefined) document.description = description;
    if (category) document.category = category;
    if (tags) document.tags = tags;
    if (linkedJobs) document.linkedJobs = linkedJobs;
    if (isFavorite !== undefined) document.isFavorite = isFavorite;
    if (status) document.status = status;

    await document.save();

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: { document }
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: error.message
    });
  }
};

// Add new version to document
export const addVersion = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;
    const { fileName, fileSize, fileData, mimeType, notes } = req.body;

    const document = await Document.findOne({ _id: id, userId });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    document.addVersion({
      fileName,
      fileSize,
      fileData,
      mimeType,
      notes,
      createdBy: userId
    });

    await document.save();

    res.json({
      success: true,
      message: 'Version added successfully',
      data: { 
        document,
        newVersion: document.currentVersion
      }
    });
  } catch (error) {
    console.error('Error adding version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add version',
      error: error.message
    });
  }
};

// Get specific version
export const getVersion = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id, versionNumber } = req.params;

    const document = await Document.findOne({ _id: id, userId });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const version = document.getVersion(parseInt(versionNumber));

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    res.json({
      success: true,
      data: { version }
    });
  } catch (error) {
    console.error('Error fetching version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch version',
      error: error.message
    });
  }
};

// Restore specific version as current
export const restoreVersion = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id, versionNumber } = req.params;

    const document = await Document.findOne({ _id: id, userId });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const versionToRestore = document.getVersion(parseInt(versionNumber));

    if (!versionToRestore) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    // Add as new version (restore creates a new version)
    document.addVersion({
      fileName: versionToRestore.fileName,
      fileSize: versionToRestore.fileSize,
      fileData: versionToRestore.fileData,
      mimeType: versionToRestore.mimeType,
      notes: `Restored from version ${versionNumber}`,
      createdBy: userId
    });

    await document.save();

    res.json({
      success: true,
      message: `Version ${versionNumber} restored as version ${document.currentVersion}`,
      data: { document }
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore version',
      error: error.message
    });
  }
};

// Delete document (soft delete)
export const deleteDocument = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const document = await Document.findOneAndUpdate(
      { _id: id, userId },
      { status: 'deleted' },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
};

// Permanently delete document
export const permanentlyDeleteDocument = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const result = await Document.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      message: 'Document permanently deleted'
    });
  } catch (error) {
    console.error('Error permanently deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete document',
      error: error.message
    });
  }
};

// Link document to job
export const linkToJob = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;
    const { jobId } = req.body;

    const document = await Document.findOne({ _id: id, userId });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (!document.linkedJobs.includes(jobId)) {
      document.linkedJobs.push(jobId);
      await document.save();
    }

    res.json({
      success: true,
      message: 'Document linked to job successfully',
      data: { document }
    });
  } catch (error) {
    console.error('Error linking document to job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link document to job',
      error: error.message
    });
  }
};

// Unlink document from job
export const unlinkFromJob = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id, jobId } = req.params;

    const document = await Document.findOne({ _id: id, userId });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    document.linkedJobs = document.linkedJobs.filter(
      j => j.toString() !== jobId
    );
    await document.save();

    res.json({
      success: true,
      message: 'Document unlinked from job successfully',
      data: { document }
    });
  } catch (error) {
    console.error('Error unlinking document from job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlink document from job',
      error: error.message
    });
  }
};

// Get documents linked to a specific job
export const getDocumentsByJob = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { jobId } = req.params;

    const documents = await Document.find({
      userId,
      linkedJobs: jobId,
      status: 'active'
    }).select('-versions.fileData').lean();

    res.json({
      success: true,
      data: { documents }
    });
  } catch (error) {
    console.error('Error fetching documents by job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message
    });
  }
};

// Import existing resumes and cover letters into document system
export const importExistingDocuments = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    // This would typically import from resume and cover letter collections
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Import functionality available',
      data: {
        imported: {
          resumes: 0,
          coverLetters: 0
        }
      }
    });
  } catch (error) {
    console.error('Error importing documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import documents',
      error: error.message
    });
  }
};

// Get document statistics
export const getDocumentStats = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const stats = await Document.aggregate([
      { $match: { userId, status: 'active' } },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          totalVersions: { $sum: { $size: '$versions' } },
          totalSize: { $sum: '$currentFileSize' },
          categories: { $addToSet: '$category' }
        }
      }
    ]);

    const categoryBreakdown = await Document.aggregate([
      { $match: { userId, status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalSize: { $sum: '$currentFileSize' }
        }
      }
    ]);

    const recentActivity = await Document.find({ userId, status: 'active' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name category updatedAt currentVersion')
      .lean();

    res.json({
      success: true,
      data: {
        summary: stats[0] || { totalDocuments: 0, totalVersions: 0, totalSize: 0 },
        categoryBreakdown,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document statistics',
      error: error.message
    });
  }
};
