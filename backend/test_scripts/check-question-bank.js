import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { InterviewQuestionBank } from '../src/models/InterviewQuestionBank.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkQuestionBank() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
    
    const jobId = '69069fad14ad3c1e9a9aa154';
    const bank = await InterviewQuestionBank.findOne({ jobId });
    
    if (!bank) {
      console.log('❌ No question bank found for jobId:', jobId);
      process.exit(0);
    }
    
    console.log('\n📊 Question Bank Stats:');
    console.log('Total questions:', bank.questions.length);
    console.log('Stats:', JSON.stringify(bank.stats, null, 2));
    
    console.log('\n📝 Questions by Category:');
    const byCategory = {};
    bank.questions.forEach(q => {
      if (!byCategory[q.category]) byCategory[q.category] = [];
      byCategory[q.category].push(q.text.substring(0, 80) + '...');
    });
    
    Object.keys(byCategory).forEach(cat => {
      console.log(`\n${cat} (${byCategory[cat].length}):`);
      byCategory[cat].forEach((text, i) => {
        console.log(`  ${i + 1}. ${text}`);
      });
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkQuestionBank();
