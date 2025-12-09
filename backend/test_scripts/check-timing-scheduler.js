import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ApplicationTiming } from '../src/models/ApplicationTiming.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

await mongoose.connect(process.env.MONGO_URI);

/**
 * Check the status of the timing scheduler
 * Shows all scheduled submissions and their status
 */
const checkSchedulerStatus = async () => {
  try {
    console.log('🔍 Checking Application Timing Scheduler Status...\n');

    // Check all scheduled submissions
    const scheduled = await ApplicationTiming.find({
      'scheduledSubmission.status': 'scheduled'
    }).populate('jobId');

    const submitted = await ApplicationTiming.find({
      'scheduledSubmission.status': 'submitted'
    }).populate('jobId').limit(5);

    const reminded = await ApplicationTiming.find({
      'scheduledSubmission.status': 'reminded'
    }).populate('jobId').limit(5);

    const failed = await ApplicationTiming.find({
      'scheduledSubmission.status': 'failed'
    }).populate('jobId').limit(5);

    console.log('📊 Summary:');
    console.log(`  ⏰ Scheduled: ${scheduled.length}`);
    console.log(`  ✅ Submitted: ${await ApplicationTiming.countDocuments({ 'scheduledSubmission.status': 'submitted' })}`);
    console.log(`  📧 Reminded: ${await ApplicationTiming.countDocuments({ 'scheduledSubmission.status': 'reminded' })}`);
    console.log(`  ❌ Failed: ${await ApplicationTiming.countDocuments({ 'scheduledSubmission.status': 'failed' })}`);

    if (scheduled.length > 0) {
      console.log('\n⏰ Upcoming Scheduled Submissions:');
      scheduled.forEach((timing, index) => {
        const job = timing.jobId;
        const schedTime = new Date(timing.scheduledSubmission.scheduledTime);
        const now = new Date();
        const isDue = schedTime <= now;
        
        console.log(`  ${index + 1}. ${job?.title || 'Unknown'} at ${job?.company || 'Unknown'}`);
        console.log(`     Scheduled: ${schedTime.toLocaleString()}`);
        console.log(`     Auto-submit: ${timing.scheduledSubmission.autoSubmit ? 'Yes' : 'No (reminder only)'}`);
        console.log(`     Status: ${isDue ? '🔴 DUE NOW' : '🟢 Pending'}`);
        console.log(`     Time until: ${isDue ? 'READY' : Math.round((schedTime - now) / 60000)} minutes`);
        console.log('');
      });
    } else {
      console.log('\n✓ No pending scheduled submissions');
    }

    if (submitted.length > 0) {
      console.log('\n✅ Recently Submitted (Last 5):');
      submitted.forEach((timing, index) => {
        const job = timing.jobId;
        const submittedAt = new Date(timing.scheduledSubmission.submittedAt);
        console.log(`  ${index + 1}. ${job?.title || 'Unknown'} at ${job?.company || 'Unknown'}`);
        console.log(`     Submitted: ${submittedAt.toLocaleString()}`);
        console.log('');
      });
    }

    if (reminded.length > 0) {
      console.log('\n📧 Recently Reminded (Last 5):');
      reminded.forEach((timing, index) => {
        const job = timing.jobId;
        const submittedAt = new Date(timing.scheduledSubmission.submittedAt);
        console.log(`  ${index + 1}. ${job?.title || 'Unknown'} at ${job?.company || 'Unknown'}`);
        console.log(`     Reminded: ${submittedAt.toLocaleString()}`);
        console.log('');
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed Submissions:');
      failed.forEach((timing, index) => {
        const job = timing.jobId;
        console.log(`  ${index + 1}. ${job?.title || 'Unknown'} at ${job?.company || 'Unknown'}`);
        console.log(`     Reason: ${timing.scheduledSubmission.failureReason || 'Unknown'}`);
        console.log('');
      });
    }

    // Check environment config
    console.log('\n⚙️  Environment Configuration:');
    console.log(`  ENABLE_TIMING_SCHEDULER: ${process.env.ENABLE_TIMING_SCHEDULER || 'not set (❌)'}`);
    console.log(`  RUN_SCHEDULER_ON_STARTUP: ${process.env.RUN_SCHEDULER_ON_STARTUP || 'not set'}`);
    console.log(`  SMTP_USER: ${process.env.SMTP_USER ? '✅ configured' : '❌ not configured'}`);

    if (process.env.ENABLE_TIMING_SCHEDULER !== 'true') {
      console.log('\n⚠️  WARNING: Timing scheduler is DISABLED!');
      console.log('   Set ENABLE_TIMING_SCHEDULER=true in .env to enable it.');
    }

    if (!process.env.SMTP_USER) {
      console.log('\n⚠️  WARNING: Email notifications not configured!');
      console.log('   Set SMTP_USER and SMTP_PASS in .env for email reminders.');
    }

    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking scheduler status:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

checkSchedulerStatus();
