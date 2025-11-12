import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotsho';

const jobSchema = new mongoose.Schema({}, { strict: false, collection: 'jobs' });
const Job = mongoose.model('Job', jobSchema);

const applicationStatusSchema = new mongoose.Schema({}, { strict: false, collection: 'applicationstatuses' });
const ApplicationStatus = mongoose.model('ApplicationStatus', applicationStatusSchema);

async function moveGhostedToPhoneScreen() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all jobs with Ghosted status
    const ghostedJobs = await Job.find({ status: 'Ghosted' });
    console.log(`\n📊 Found ${ghostedJobs.length} job(s) with Ghosted status`);

    if (ghostedJobs.length === 0) {
      console.log('No jobs to update');
      return;
    }

    // Update each ghosted job back to Phone Screen
    for (const job of ghostedJobs) {
      console.log(`\n🔄 Updating: ${job.title} at ${job.company}`);
      console.log(`   Old status: ${job.status}`);
      
      // Update job status
      job.status = 'Phone Screen';
      await job.save();
      console.log(`   ✅ Job status updated to: Phone Screen`);

      // Also update ApplicationStatus if it exists
      const appStatus = await ApplicationStatus.findOne({ jobId: job._id });
      if (appStatus) {
        appStatus.currentStatus = 'Phone Screen';
        appStatus.lastStatusChange = new Date();
        
        // Add to status history
        appStatus.statusHistory.push({
          status: 'Phone Screen',
          changedAt: new Date(),
          changeSource: 'user',
          notes: 'Moved back from Ghosted status'
        });
        
        await appStatus.save();
        console.log(`   ✅ Application status also updated`);
      }
    }

    console.log(`\n✅ Successfully moved ${ghostedJobs.length} job(s) back to Phone Screen`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

moveGhostedToPhoneScreen();
