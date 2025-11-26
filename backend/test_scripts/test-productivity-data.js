/**
 * Test script to add sample time tracking data for productivity analysis testing
 * Usage: node backend/test_scripts/test-productivity-data.js <userId>
 * 
 * This script creates realistic time tracking entries for the past 3 days
 * to enable testing of the productivity analysis feature.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Import models
const TimeTrackingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: Date, required: true },
  entries: [{
    activity: String,
    customActivity: String,
    startTime: Date,
    endTime: Date,
    duration: Number,
    energyLevel: String,
    focusQuality: String,
    productivity: Number,
    distractions: Number,
    notes: String,
    tags: [String],
    outcomes: [{
      type: String,
      description: String,
      value: mongoose.Schema.Types.Mixed
    }]
  }],
  dailySummary: {
    totalHours: Number,
    productiveHours: Number,
    breakHours: Number,
    averageProductivity: Number,
    averageEnergy: String,
    averageFocus: String,
    totalOutcomes: Number,
    activityBreakdown: Map
  }
});

// Add the calculateDailySummary method
TimeTrackingSchema.methods.calculateDailySummary = function() {
  if (this.entries.length === 0) {
    this.dailySummary = {
      totalHours: 0,
      productiveHours: 0,
      breakHours: 0,
      averageProductivity: 0,
      averageEnergy: 'N/A',
      averageFocus: 'N/A',
      totalOutcomes: 0,
      activityBreakdown: new Map()
    };
    return;
  }

  let totalMinutes = 0;
  let productiveMinutes = 0;
  let breakMinutes = 0;
  let productivitySum = 0;
  const energyLevels = {};
  const focusLevels = {};
  let totalOutcomes = 0;
  const activityBreakdown = new Map();

  this.entries.forEach(entry => {
    if (entry.duration) {
      totalMinutes += entry.duration;
      
      if (entry.activity === 'Break') {
        breakMinutes += entry.duration;
      } else {
        productiveMinutes += entry.duration;
      }

      productivitySum += entry.productivity || 0;
      
      energyLevels[entry.energyLevel] = (energyLevels[entry.energyLevel] || 0) + 1;
      focusLevels[entry.focusQuality] = (focusLevels[entry.focusQuality] || 0) + 1;
      
      if (entry.outcomes) {
        totalOutcomes += entry.outcomes.length;
      }

      const activity = entry.activity === 'Other' && entry.customActivity 
        ? entry.customActivity 
        : entry.activity;
      
      activityBreakdown.set(
        activity, 
        (activityBreakdown.get(activity) || 0) + entry.duration
      );
    }
  });

  const mostCommonEnergy = Object.keys(energyLevels).reduce((a, b) => 
    energyLevels[a] > energyLevels[b] ? a : b, 'Medium'
  );
  
  const mostCommonFocus = Object.keys(focusLevels).reduce((a, b) => 
    focusLevels[a] > focusLevels[b] ? a : b, 'Good'
  );

  this.dailySummary = {
    totalHours: totalMinutes / 60,
    productiveHours: productiveMinutes / 60,
    breakHours: breakMinutes / 60,
    averageProductivity: this.entries.length > 0 ? productivitySum / this.entries.length : 0,
    averageEnergy: mostCommonEnergy,
    averageFocus: mostCommonFocus,
    totalOutcomes,
    activityBreakdown
  };
};

const TimeTracking = mongoose.model('TimeTracking', TimeTrackingSchema);

// Sample activities with realistic data
const SAMPLE_ACTIVITIES = [
  { activity: 'Job Application', energyLevel: 'High', focusQuality: 'Good', productivity: 7, duration: 30 },
  { activity: 'Resume Writing', energyLevel: 'Peak', focusQuality: 'Excellent', productivity: 8, duration: 45 },
  { activity: 'Cover Letter Writing', energyLevel: 'High', focusQuality: 'Good', productivity: 7, duration: 30 },
  { activity: 'Company Research', energyLevel: 'Medium', focusQuality: 'Good', productivity: 8, duration: 60 },
  { activity: 'Interview Preparation', energyLevel: 'Peak', focusQuality: 'Excellent', productivity: 9, duration: 90 },
  { activity: 'Networking', energyLevel: 'High', focusQuality: 'Fair', productivity: 6, duration: 45 },
  { activity: 'Skill Development', energyLevel: 'Medium', focusQuality: 'Good', productivity: 7, duration: 120 },
  { activity: 'LinkedIn Activity', energyLevel: 'Medium', focusQuality: 'Fair', productivity: 6, duration: 30 },
  { activity: 'Portfolio Work', energyLevel: 'Peak', focusQuality: 'Excellent', productivity: 9, duration: 90 },
  { activity: 'Mock Interviews', energyLevel: 'High', focusQuality: 'Good', productivity: 8, duration: 60 }
];

const NOTES_EXAMPLES = [
  'Applied to 3 positions at tech companies',
  'Updated resume with recent project experience',
  'Researched company culture and recent news',
  'Practiced behavioral interview questions',
  'Attended virtual networking event',
  'Completed online course module',
  'Updated LinkedIn profile and engaged with posts',
  'Built new feature for portfolio project',
  'Practiced technical interview questions'
];

async function generateTimeEntry(activity, baseDate, startHour, userId) {
  const startTime = new Date(baseDate);
  startTime.setHours(startHour, 0, 0, 0);
  
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + activity.duration);
  
  return {
    activity: activity.activity,
    startTime,
    endTime,
    duration: activity.duration,
    energyLevel: activity.energyLevel,
    focusQuality: activity.focusQuality,
    productivity: activity.productivity + Math.floor(Math.random() * 3) - 1, // Add some variance
    distractions: Math.floor(Math.random() * 3),
    notes: NOTES_EXAMPLES[Math.floor(Math.random() * NOTES_EXAMPLES.length)],
    tags: ['test-data'],
    outcomes: activity.activity !== 'Break' && Math.random() > 0.5 ? [
      { type: 'task_completed', description: 'Completed planned activity' }
    ] : []
  };
}

async function addTestProductivityData(userId) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Generate data for the last 3 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let dayOffset = 2; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - dayOffset);

      console.log(`\nGenerating data for ${targetDate.toISOString().split('T')[0]}...`);

      // Check if data already exists
      let timeRecord = await TimeTracking.findOne({ 
        userId, 
        date: targetDate 
      });

      if (timeRecord) {
        console.log(`  Data already exists for this date. Skipping...`);
        continue;
      }

      // Create new record
      timeRecord = new TimeTracking({
        userId,
        date: targetDate,
        entries: []
      });

      // Add 3-5 activities for this day
      const numActivities = 3 + Math.floor(Math.random() * 3);
      const selectedActivities = [];
      
      for (let i = 0; i < numActivities; i++) {
        const activity = SAMPLE_ACTIVITIES[Math.floor(Math.random() * SAMPLE_ACTIVITIES.length)];
        selectedActivities.push(activity);
      }

      // Generate entries with realistic time spacing
      let currentHour = 9; // Start at 9 AM
      for (const activity of selectedActivities) {
        const entry = await generateTimeEntry(activity, targetDate, currentHour, userId);
        timeRecord.entries.push(entry);
        
        // Move to next time slot with a break
        currentHour += Math.ceil(activity.duration / 60) + 1;
        
        console.log(`  Added: ${activity.activity} (${activity.duration} min)`);
      }

      // Calculate summary
      timeRecord.calculateDailySummary();

      // Save the record
      await timeRecord.save();
      console.log(`  ✓ Saved record with ${timeRecord.entries.length} entries`);
      console.log(`  Total hours: ${timeRecord.dailySummary.totalHours.toFixed(1)}h`);
    }

    console.log('\n✅ Test data generation complete!');
    console.log('\nYou can now:');
    console.log('1. Go to the Productivity page');
    console.log('2. Click "Generate New Analysis"');
    console.log('3. Select date range covering the last 3 days');
    console.log('4. View your productivity analysis\n');

  } catch (error) {
    console.error('Error adding test data:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Get userId from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('\n❌ Error: userId is required');
  console.log('\nUsage: node backend/test_scripts/test-productivity-data.js <userId>');
  console.log('\nExample:');
  console.log('  node backend/test_scripts/test-productivity-data.js user_2abc123xyz\n');
  process.exit(1);
}

console.log(`\n🚀 Generating test productivity data for user: ${userId}\n`);

addTestProductivityData(userId);
