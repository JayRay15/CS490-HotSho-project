import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ApplicationTiming } from '../src/models/ApplicationTiming.js';
import { Job } from '../src/models/Job.js';
import { User } from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

await mongoose.connect(process.env.MONGO_URI);

const seedTimingData = async () => {
  try {
    // Get a test user (or specify a clerkId)
    const user = await User.findOne();
    if (!user) {
      console.error('❌ No user found. Create a user first.');
      process.exit(1);
    }

    console.log(`✅ Using user: ${user.name || user.email} (${user.clerkId})`);

    // Get user's jobs
    const jobs = await Job.find({ userId: user.clerkId }).limit(20);
    if (jobs.length === 0) {
      console.error('❌ No jobs found. Create some jobs first.');
      process.exit(1);
    }

    console.log(`📊 Found ${jobs.length} jobs. Seeding timing data...\n`);

    const industries = ['Finance', 'Technology', 'Healthcare', 'Consulting', 'Retail', 'Education'];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const responseTypes = ['positive', 'neutral', 'negative'];

    let successCount = 0;

    for (const job of jobs) {
      try {
        // Use actual job industry or random
        const industry = job.industry || industries[Math.floor(Math.random() * industries.length)];

        // Determine best times based on industry
        let bestDay = 'Tuesday';
        let bestHour = 10;
        
        switch (industry) {
          case 'Finance':
            bestDay = daysOfWeek[Math.floor(Math.random() * 3) + 1]; // Tue-Thu
            bestHour = 8 + Math.floor(Math.random() * 3); // 8-10 AM
            break;
          case 'Technology':
            bestDay = daysOfWeek[Math.floor(Math.random() * 2) + 1]; // Tue-Wed
            bestHour = 10 + Math.floor(Math.random() * 2); // 10-11 AM
            break;
          case 'Healthcare':
            bestDay = daysOfWeek[Math.floor(Math.random() * 3)]; // Mon-Wed
            bestHour = 9 + Math.floor(Math.random() * 2); // 9-10 AM
            break;
          case 'Consulting':
            bestDay = daysOfWeek[Math.floor(Math.random() * 3) + 1]; // Tue-Thu
            bestHour = 11 + Math.floor(Math.random() * 4); // 11 AM-2 PM
            break;
          case 'Retail':
            bestDay = daysOfWeek[Math.floor(Math.random() * 2) + 1]; // Tue-Wed
            bestHour = 14 + Math.floor(Math.random() * 2); // 2-3 PM
            break;
          case 'Education':
            bestDay = daysOfWeek[Math.floor(Math.random() * 4)]; // Mon-Thu
            bestHour = 9 + Math.floor(Math.random() * 2); // 9-10 AM
            break;
        }

        // Create or update timing record
        const timing = await ApplicationTiming.findOneAndUpdate(
          { userId: user.clerkId, jobId: job._id },
          {
            userId: user.clerkId,
            jobId: job._id,
            industry: industry,
            companySize: job.companySize || 'medium',
            recommendation: {
              bestDay: bestDay,
              bestHour: bestHour,
              confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
              reasoning: `Optimal timing based on ${industry} industry patterns and historical data`,
              factors: {
                industryPattern: 0.4,
                historicalData: 0.3,
                dayOfWeek: 0.2,
                timeOfDay: 0.1
              }
            },
            currentRecommendation: {
              action: Math.random() > 0.3 ? 'submit' : 'wait',
              timing: `${bestDay} at ${bestHour}:00`,
              confidence: Math.floor(Math.random() * 30) + 70,
              reasoning: `Based on ${industry} hiring patterns`
            }
          },
          { upsert: true, new: true }
        );

        // Generate 1-3 submissions for variety
        const numSubmissions = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < numSubmissions; i++) {
          // Random date in the past 60 days
          const submissionDate = new Date();
          submissionDate.setDate(submissionDate.getDate() - Math.floor(Math.random() * 60));
          
          // Random hour (6 AM - 8 PM)
          const hour = Math.floor(Math.random() * 15) + 6;
          submissionDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

          const dayOfWeek = submissionDate.toLocaleDateString('en-US', { weekday: 'long' });
          
          // 70% chance followed recommendation if day/hour matches
          const followedRecommendation = (dayOfWeek === bestDay && hour === bestHour) 
            ? Math.random() > 0.3
            : Math.random() > 0.7;

          // Record submission
          await timing.recordSubmission({
            submittedAt: submissionDate,
            dayOfWeek: dayOfWeek,
            hourOfDay: hour,
            wasScheduled: Math.random() > 0.5,
            followedRecommendation: followedRecommendation
          });

          // 65% chance of getting a response
          if (Math.random() > 0.35) {
            // Response comes 1-14 days later
            const responseDate = new Date(submissionDate);
            responseDate.setDate(responseDate.getDate() + Math.floor(Math.random() * 14) + 1);
            
            // Higher chance of positive response if followed recommendation
            let responseType;
            if (followedRecommendation) {
              const rand = Math.random();
              responseType = rand > 0.7 ? 'positive' : rand > 0.4 ? 'neutral' : 'negative';
            } else {
              const rand = Math.random();
              responseType = rand > 0.85 ? 'positive' : rand > 0.5 ? 'neutral' : 'negative';
            }

            // Get the index of the submission we just added
            const submissionIndex = timing.submissionHistory.length - 1;

            // Record response
            await timing.recordResponse(submissionIndex, {
              responseType: responseType,
              respondedAt: responseDate
            });
          }
        }

        // Update metrics
        await timing.updateMetrics();
        await timing.save();

        successCount++;
        console.log(`✓ [${successCount}/${jobs.length}] ${job.title} at ${job.company} (${industry}) - ${numSubmissions} submission(s)`);
      } catch (err) {
        console.error(`✗ Error seeding ${job.title}: ${err.message}`);
      }
    }

    // Show summary stats
    console.log('\n📈 Summary Statistics:');
    const allTimings = await ApplicationTiming.find({ userId: user.clerkId });
    
    let totalSubmissions = 0;
    let totalResponses = 0;
    let totalOptimalSubmissions = 0;
    let totalOptimalResponses = 0;

    for (const timing of allTimings) {
      totalSubmissions += timing.submissionHistory.length;
      totalResponses += timing.submissionHistory.filter(s => s.responseReceived).length;
      totalOptimalSubmissions += timing.submissionHistory.filter(s => s.followedRecommendation).length;
      totalOptimalResponses += timing.submissionHistory.filter(s => s.followedRecommendation && s.responseReceived && s.responseType === 'positive').length;
    }

    const overallResponseRate = totalSubmissions > 0 ? ((totalResponses / totalSubmissions) * 100).toFixed(1) : 0;
    const optimalSuccessRate = totalOptimalSubmissions > 0 ? ((totalOptimalResponses / totalOptimalSubmissions) * 100).toFixed(1) : 0;

    console.log(`  Total Jobs: ${allTimings.length}`);
    console.log(`  Total Submissions: ${totalSubmissions}`);
    console.log(`  Total Responses: ${totalResponses}`);
    console.log(`  Overall Response Rate: ${overallResponseRate}%`);
    console.log(`  Optimal Time Submissions: ${totalOptimalSubmissions}`);
    console.log(`  Optimal Time Success Rate: ${optimalSuccessRate}%`);

    console.log('\n✅ Timing data seeded successfully!');
    console.log('🎯 Open the Timing Optimizer modal to see your metrics!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding timing data:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seedTimingData();
