import PreLaunchChecklist from '../models/PreLaunchChecklist.js';
import logger from '../utils/logger.js';

/**
 * Get the pre-launch checklist
 */
export const getChecklist = async (req, res) => {
  try {
    const checklist = await PreLaunchChecklist.getChecklist();
    
    res.json({
      success: true,
      data: checklist
    });
  } catch (error) {
    logger.error('Error fetching pre-launch checklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pre-launch checklist',
      error: error.message
    });
  }
};

/**
 * Toggle a checklist item's completion status
 */
export const toggleItem = async (req, res) => {
  try {
    const { sectionKey, itemId } = req.params;
    const userId = req.auth?.userId;
    const userName = req.body.userName || 'Admin';
    
    const checklist = await PreLaunchChecklist.getChecklist();
    
    // Validate section exists
    if (!checklist[sectionKey]) {
      return res.status(400).json({
        success: false,
        message: `Invalid section: ${sectionKey}`
      });
    }
    
    // Find and toggle the item
    const item = checklist[sectionKey].items.find(i => i.id === itemId);
    if (!item) {
      return res.status(400).json({
        success: false,
        message: `Item not found: ${itemId}`
      });
    }
    
    // Toggle completion
    item.completed = !item.completed;
    item.completedBy = item.completed ? userId : null;
    item.completedAt = item.completed ? new Date() : null;
    
    // Update metadata
    checklist.lastModifiedBy = userId;
    checklist.lastModifiedByName = userName;
    
    await checklist.save();
    
    logger.info(`Checklist item ${itemId} toggled to ${item.completed} by ${userId}`);
    
    res.json({
      success: true,
      data: checklist,
      message: `Item ${item.completed ? 'completed' : 'uncompleted'}`
    });
  } catch (error) {
    logger.error('Error toggling checklist item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle checklist item',
      error: error.message
    });
  }
};

/**
 * Admin sign-off on the checklist
 */
export const signOff = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { userName } = req.body;
    
    const checklist = await PreLaunchChecklist.getChecklist();
    
    // Calculate progress to ensure 100%
    let totalItems = 0;
    let completedItems = 0;
    const sections = ['criticalBugs', 'testing', 'deployment', 'monitoring', 'security', 
                      'legal', 'marketing', 'support', 'teamReadiness', 'postLaunch'];
    
    sections.forEach(sectionKey => {
      if (checklist[sectionKey]?.items) {
        checklist[sectionKey].items.forEach(item => {
          totalItems++;
          if (item.completed) completedItems++;
        });
      }
    });
    
    const progress = Math.round((completedItems / totalItems) * 100);
    
    if (progress < 100) {
      return res.status(400).json({
        success: false,
        message: `Cannot sign off until all items are complete. Current progress: ${progress}%`
      });
    }
    
    // Sign off
    checklist.adminSignoff = {
      signed: true,
      signedBy: userId,
      signedByName: userName || 'Admin',
      date: new Date()
    };
    
    checklist.lastModifiedBy = userId;
    checklist.lastModifiedByName = userName || 'Admin';
    
    await checklist.save();
    
    logger.info(`Pre-launch checklist signed off by ${userId}`);
    
    res.json({
      success: true,
      data: checklist,
      message: 'Checklist signed off successfully'
    });
  } catch (error) {
    logger.error('Error signing off checklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sign off checklist',
      error: error.message
    });
  }
};

/**
 * Make launch decision (GO or NO-GO)
 */
export const makeLaunchDecision = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { decision, reason, userName } = req.body;
    
    if (!['go', 'no-go'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be "go" or "no-go"'
      });
    }
    
    const checklist = await PreLaunchChecklist.getChecklist();
    
    // For GO decision, require sign-off
    if (decision === 'go' && !checklist.adminSignoff.signed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve launch without admin sign-off'
      });
    }
    
    checklist.launchDecision = {
      decision,
      decidedBy: userId,
      decidedByName: userName || 'Admin',
      decidedAt: new Date(),
      reason: reason || null
    };
    
    checklist.lastModifiedBy = userId;
    checklist.lastModifiedByName = userName || 'Admin';
    
    await checklist.save();
    
    logger.info(`Launch decision: ${decision} by ${userId}`);
    
    res.json({
      success: true,
      data: checklist,
      message: `Launch ${decision === 'go' ? 'approved' : 'delayed'}`
    });
  } catch (error) {
    logger.error('Error making launch decision:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to make launch decision',
      error: error.message
    });
  }
};

/**
 * Reset the entire checklist
 */
export const resetChecklist = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { userName } = req.body;
    
    // Delete existing and create new
    await PreLaunchChecklist.deleteOne({ _singleton: true });
    const checklist = await PreLaunchChecklist.getChecklist();
    
    // Update metadata
    checklist.lastModifiedBy = userId;
    checklist.lastModifiedByName = userName || 'Admin';
    await checklist.save();
    
    logger.info(`Pre-launch checklist reset by ${userId}`);
    
    res.json({
      success: true,
      data: checklist,
      message: 'Checklist reset successfully'
    });
  } catch (error) {
    logger.error('Error resetting checklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset checklist',
      error: error.message
    });
  }
};
