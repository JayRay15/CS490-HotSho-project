import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Job } from '../src/models/Job.js';
import { InterviewQuestionBank } from '../src/models/InterviewQuestionBank.js';
import { generateInterviewQuestionBank, getQuestionBankByJob, getAllQuestionBanks, updatePracticeStatus } from '../src/controllers/interviewQuestionBankController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hot-sho-db';
// Reuse dev user id or fallback
const TEST_USER_ID = process.env.TEST_USER_ID || 'user_34g1tadCH6EapHT5gzS9rsTSJ8J';

function banner(title) {
  console.log('\n' + '═'.repeat(80));
  console.log(title);
  console.log('═'.repeat(80));
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

// Minimal mock response object
function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

async function ensureTestJob() {
  let job = await Job.findOne({ userId: TEST_USER_ID }).sort({ createdAt: -1 });
  if (!job) {
    job = await Job.create({
      userId: TEST_USER_ID,
      title: 'Backend Engineer',
      company: 'PrepCo',
      industry: 'Technology',
      workMode: 'Remote',
      description: 'Seeking backend engineer proficient in Node.js, API design, MongoDB, caching, scalability.',
      requirements: [
        'Node.js', 'API Design', 'MongoDB', 'System Design', 'Scalability', 'Caching', 'Testing'
      ],
      status: 'Interested'
    });
    console.log('✅ Created test job:', job._id.toString());
  } else {
    console.log('ℹ️ Using existing job:', job._id.toString());
  }
  return job;
}

async function invokeGenerate(job) {
  banner('TEST 1: Generate Interview Question Bank');
  const req = { body: { jobId: job._id.toString() }, user: { id: TEST_USER_ID } };
  const res = mockRes();
  await generateInterviewQuestionBank(req, res);
  if (!res.body?.success) throw new Error('Generation failed: ' + res.body?.message);
  const bank = res.body.data;
  console.log(`✅ Generated bank with ${bank.questions.length} questions`);
  console.log('   Categories:', bank.stats.byCategory);
  console.log('   Difficulty:', bank.stats.byDifficulty);
  return bank;
}

async function invokeGetByJob(job) {
  banner('TEST 2: Fetch Question Bank By Job');
  const req = { params: { jobId: job._id.toString() }, user: { id: TEST_USER_ID } };
  const res = mockRes();
  await getQuestionBankByJob(req, res);
  if (!res.body?.success) throw new Error('Fetch by job failed');
  const bank = res.body.data;
  console.log('✅ Retrieved bank questions:', bank.questions.length);
  return bank;
}

async function validateStructure(bank) {
  banner('TEST 3: Validate Structure & Acceptance Criteria');
  const cats = new Set(bank.questions.map(q => q.category));
  const hasBehavioralStar = bank.questions.some(q => q.category === 'Behavioral' && q.starGuide && q.starGuide.situation);
  const difficulties = new Set(bank.questions.map(q => q.difficulty));
  const skillLinked = bank.questions.some(q => q.linkedSkills && q.linkedSkills.length > 0);

  console.log(`   Categories present: ${Array.from(cats).join(', ')}`);
  console.log(`   STAR guidance present (behavioral): ${hasBehavioralStar}`);
  console.log(`   Difficulty levels present: ${Array.from(difficulties).join(', ')}`);
  console.log(`   Any linked skills: ${skillLinked}`);
  const pass = cats.has('Behavioral') && cats.has('Technical') && cats.has('Situational') && hasBehavioralStar && difficulties.size >= 2 && skillLinked;
  console.log(pass ? '✅ Structure meets criteria' : '❌ Missing required criteria');
  return pass;
}

async function testPracticeToggle(bank) {
  banner('TEST 4: Practice Toggle Functionality');
  const first = bank.questions[0];
  const req1 = { params: { id: bank._id.toString(), questionId: first._id.toString() }, user: { id: TEST_USER_ID } };
  const res1 = mockRes();
  await updatePracticeStatus(req1, res1);
  if (!res1.body?.success) throw new Error('Practice toggle failed');
  const afterToggle = res1.body.data.questions.id(first._id.toString());
  console.log(`   Toggled practiced -> ${afterToggle.practiced}`);
  const req2 = { params: { id: bank._id.toString(), questionId: first._id.toString() }, user: { id: TEST_USER_ID } };
  const res2 = mockRes();
  await updatePracticeStatus(req2, res2);
  const afterSecond = res2.body.data.questions.id(first._id.toString());
  console.log(`   Second toggle practiced -> ${afterSecond.practiced}`);
  const pass = typeof afterToggle.practiced === 'boolean' && afterSecond.practiced === false;
  console.log(pass ? '✅ Practice toggling works' : '❌ Practice toggling malfunction');
  return pass;
}

async function testGetAll() {
  banner('TEST 5: Fetch All Question Banks');
  const req = { user: { id: TEST_USER_ID } };
  const res = mockRes();
  await getAllQuestionBanks(req, res);
  if (!res.body?.success) throw new Error('Get all failed');
  console.log(`   Retrieved total banks: ${res.body.data.length}`);
  return res.body.data.length >= 1;
}

async function run() {
  banner('INTERVIEW QUESTION BANK FEATURE TEST');
  await connectDB();
  try {
    const job = await ensureTestJob();
    const generated = await invokeGenerate(job);
    const fetched = await invokeGetByJob(job);
    const structureOk = await validateStructure(fetched);
    const practiceOk = await testPracticeToggle(fetched);
    const allOk = await testGetAll();

    banner('TEST SUMMARY');
    console.log(`   Generation: ${generated.questions.length > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`   Structure: ${structureOk ? 'PASS' : 'FAIL'}`);
    console.log(`   Practice Toggle: ${practiceOk ? 'PASS' : 'FAIL'}`);
    console.log(`   List All: ${allOk ? 'PASS' : 'FAIL'}`);
    const overall = structureOk && practiceOk && allOk;
    console.log('\nOverall:', overall ? '✅ PASS' : '❌ FAIL');
  } catch (err) {
    console.error('❌ Test error:', err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

run();
