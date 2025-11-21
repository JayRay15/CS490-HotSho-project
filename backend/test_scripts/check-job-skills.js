import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Job } from '../src/models/Job.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkJobSkills() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
    
    const jobId = '69069fad14ad3c1e9a9aa154';
    const job = await Job.findById(jobId);
    
    if (!job) {
      console.log('❌ No job found for jobId:', jobId);
      process.exit(0);
    }
    
    console.log('\n📋 Job Details:');
    console.log('Title:', job.title);
    console.log('Company:', job.company);
    console.log('Industry:', job.industry);
    console.log('\n🔧 Requirements:', job.requirements);
    console.log('\n📝 Description length:', job.description?.length || 0);
    console.log('Description preview:', job.description?.substring(0, 200) || 'None');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkJobSkills();
