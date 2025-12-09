import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ApplicationTiming } from '../src/models/ApplicationTiming.js';
import { Job } from '../src/models/Job.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

await mongoose.connect(process.env.MONGO_URI);

const checkSchedule = async () => {
  try {
    console.log('🔍 Checking for scheduled submissions...\n');

    // Find the most recent scheduled submission
    const scheduled = await ApplicationTiming.findOne({
      'scheduledSubmission.scheduledTime': { $exists: true }
    })
    .sort({ 'scheduledSubmission.scheduledTime': -1 })
    .populate('jobId');

    if (!scheduled) {
      console.log('❌ No scheduled submissions found in database');
      console.log('   Try scheduling a submission first via the frontend.');
      process.exit(0);
    }

    const job = scheduled.jobId;
    const schedTime = new Date(scheduled.scheduledSubmission.scheduledTime);
    const now = new Date();
    
    console.log('✅ Found scheduled submission!');
    console.log('\n📋 Details:');
    console.log(`  Job: ${job?.title || 'Unknown'} at ${job?.company || 'Unknown'}`);
    console.log(`  Scheduled Time: ${schedTime.toLocaleString()}`);
    console.log(`  Current Time: ${now.toLocaleString()}`);
    console.log(`  Status: ${scheduled.scheduledSubmission.status}`);
    console.log(`  Auto-submit: ${scheduled.scheduledSubmission.autoSubmit ? '✅ YES' : '❌ NO (reminder only)'}`);
    console.log(`  Reminder Sent: ${scheduled.scheduledSubmission.reminderSent ? 'Yes' : 'No'}`);
    
    if (scheduled.scheduledSubmission.submittedAt) {
      console.log(`  Submitted At: ${new Date(scheduled.scheduledSubmission.submittedAt).toLocaleString()}`);
    }

    const minutesUntil = Math.round((schedTime - now) / 60000);
    
    if (scheduled.scheduledSubmission.status === 'scheduled') {
      if (schedTime <= now) {
        console.log('\n⏰ STATUS: DUE NOW - Scheduler should process this soon!');
        console.log('   Next scheduler run: Within 15 minutes');
      } else {
        console.log(`\n⏰ STATUS: Pending - Will be processed in ${minutesUntil} minutes`);
      }
    } else if (scheduled.scheduledSubmission.status === 'submitted') {
      console.log('\n✅ STATUS: Successfully processed and submitted!');
    } else if (scheduled.scheduledSubmission.status === 'reminded') {
      console.log('\n📧 STATUS: Reminder email sent!');
    } else if (scheduled.scheduledSubmission.status === 'failed') {
      console.log('\n❌ STATUS: Failed');
      console.log(`   Reason: ${scheduled.scheduledSubmission.failureReason || 'Unknown'}`);
    }

    // Check all scheduled submissions
    const allScheduled = await ApplicationTiming.countDocuments({
      'scheduledSubmission.status': 'scheduled'
    });
    
    console.log(`\n📊 Total pending schedules: ${allScheduled}`);

    console.log('\n💡 To verify the scheduler is working:');
    console.log('   1. Check backend logs for: "Timing scheduler started"');
    console.log('   2. Wait until the scheduled time passes');
    console.log('   3. Run this script again to see if status changed');
    console.log('   4. Check your email for confirmation/reminder');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkSchedule();
