import { User } from "../models/User.js";

/**
 * Cleanup job that permanently deletes user accounts
 * that have exceeded their 30-day grace period
 */
export const cleanupExpiredAccounts = async () => {
  try {
    const now = new Date();
    
    // Find all users marked as deleted with expired grace periods
    const expiredUsers = await User.find({
      isDeleted: true,
      deletionExpiresAt: { $lte: now }
    });

    if (expiredUsers.length === 0) {
      console.log('🧹 Cleanup job: No expired accounts to delete');
      return { deleted: 0, errors: [] };
    }

    console.log(`🧹 Cleanup job: Found ${expiredUsers.length} expired account(s) to permanently delete`);

    const deletedIds = [];
    const errors = [];

    for (const user of expiredUsers) {
      try {
        await User.deleteOne({ _id: user._id });
        deletedIds.push(user._id);
        console.log(`✅ Permanently deleted user: ${user.email} (ID: ${user._id})`);
      } catch (err) {
        console.error(`❌ Failed to delete user ${user.email}:`, err.message);
        errors.push({ userId: user._id, email: user.email, error: err.message });
      }
    }

    console.log(`🧹 Cleanup complete: ${deletedIds.length} accounts deleted, ${errors.length} errors`);
    
    return {
      deleted: deletedIds.length,
      errors: errors
    };
  } catch (err) {
    console.error('❌ Cleanup job error:', err);
    throw err;
  }
};

/**
 * Start a periodic cleanup job that runs every 24 hours
 * Call this when the server starts
 */
export const startCleanupSchedule = () => {
  // Run cleanup immediately on startup
  cleanupExpiredAccounts()
    .then(result => {
      console.log('🚀 Initial cleanup completed:', result);
    })
    .catch(err => {
      console.error('🚀 Initial cleanup failed:', err);
    });

  // Schedule cleanup to run every 24 hours (86400000 ms)
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  
  setInterval(() => {
    console.log('⏰ Running scheduled cleanup job...');
    cleanupExpiredAccounts()
      .then(result => {
        console.log('✅ Scheduled cleanup completed:', result);
      })
      .catch(err => {
        console.error('❌ Scheduled cleanup failed:', err);
      });
  }, CLEANUP_INTERVAL);

  console.log('📅 Cleanup schedule started: will run every 24 hours');
};
