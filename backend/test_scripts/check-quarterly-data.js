import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Interview } from '../src/models/Interview.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function checkQuarterlyData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // Get all interviews
    const interviews = await Interview.find({ userId: 'user_2oNz02iNkcx2sROF8yFjnCEGfNa' })
      .sort({ scheduledDate: 1 });
    
    console.log('Total interviews:', interviews.length);
    console.log('\n=== Interviews by Quarter ===\n');
    
    const byQuarter = {};
    interviews.forEach(interview => {
      const date = new Date(interview.scheduledDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      const quarter = Math.floor(month / 3) + 1;
      const key = `${year}-Q${quarter}`;
      
      if (!byQuarter[key]) {
        byQuarter[key] = { total: 0, withOutcome: 0, positive: 0, interviews: [] };
      }
      byQuarter[key].total++;
      
      const outcomeResult = interview.outcome?.result || 'null';
      byQuarter[key].interviews.push({
        date: interview.scheduledDate.toISOString().split('T')[0],
        type: interview.interviewType,
        outcome: outcomeResult
      });
      
      if (interview.outcome && interview.outcome.result) {
        byQuarter[key].withOutcome++;
        if (['Moved to Next Round', 'Offer Extended'].includes(interview.outcome.result)) {
          byQuarter[key].positive++;
        }
      }
    });
    
    // Print detailed quarter info
    const quarters = Object.keys(byQuarter).sort();
    quarters.forEach(quarter => {
      const data = byQuarter[quarter];
      const rate = data.withOutcome > 0 ? (data.positive / data.withOutcome * 100).toFixed(1) : 0;
      
      console.log(`${quarter}:`);
      console.log(`  Total: ${data.total}`);
      console.log(`  With outcomes: ${data.withOutcome}`);
      console.log(`  Positive outcomes: ${data.positive}`);
      console.log(`  Success rate: ${rate}%`);
      console.log('  Interviews:');
      data.interviews.forEach(int => {
        console.log(`    - ${int.date}: ${int.type} → ${int.outcome}`);
      });
      console.log();
    });
    
    // Calculate improvement
    if (quarters.length >= 2) {
      const firstQuarter = byQuarter[quarters[0]];
      const lastQuarter = byQuarter[quarters[quarters.length - 1]];
      
      const firstRate = firstQuarter.withOutcome > 0 
        ? (firstQuarter.positive / firstQuarter.withOutcome * 100)
        : 0;
      const lastRate = lastQuarter.withOutcome > 0
        ? (lastQuarter.positive / lastQuarter.withOutcome * 100)
        : 0;
      
      console.log('=== Improvement Calculation ===');
      console.log(`First quarter (${quarters[0]}): ${firstRate.toFixed(1)}% (${firstQuarter.positive}/${firstQuarter.withOutcome})`);
      console.log(`Last quarter (${quarters[quarters.length - 1]}): ${lastRate.toFixed(1)}% (${lastQuarter.positive}/${lastQuarter.withOutcome})`);
      
      if (firstRate === 0 && lastRate === 0) {
        console.log('Overall improvement: 0% (both quarters have 0% success rate)');
      } else if (firstRate === 0) {
        console.log('Overall improvement: Cannot calculate (first quarter is 0%)');
      } else {
        const improvement = ((lastRate - firstRate) / firstRate * 100).toFixed(1);
        console.log(`Overall improvement: ${improvement}%`);
      }
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkQuarterlyData();
