import { InterviewQuestionBank } from "../models/InterviewQuestionBank.js";
import { Job } from "../models/Job.js";

function extractSkills(job) {
  const base = [];
  if (Array.isArray(job.requirements)) base.push(...job.requirements);
  if (typeof job.description === "string") {
    const tokens = job.description.split(/[^A-Za-z0-9+/#]+/).filter(t => t.length > 2);
    base.push(...tokens);
  }
  const normalized = base.map(s => s.trim().toLowerCase()).filter(Boolean);
  return Array.from(new Set(normalized)).slice(0, 40);
}

function buildStarGuide(prompt) {
  return {
    situation: `Describe a relevant context for: ${prompt}`,
    task: `Clarify the objective or challenge in that situation.`,
    action: `Outline specific steps you took, highlighting decision points.`,
    result: `Quantify outcomes and lessons learned.`,
  };
}

function generateQuestions(job, skills) {
  const role = job.title || "Role";
  const company = job.company || "Company";
  const industry = job.industry || "Industry";
  const coreSkills = skills.slice(0, 8);
  
  // Default technical skills if none found
  const defaultTechnicalSkills = ['problem-solving', 'communication', 'teamwork', 'time management'];
  const technicalSkills = coreSkills.length > 0 ? coreSkills : defaultTechnicalSkills;

  const behavioralPrompts = [
    `Handling conflict within a team while working on a ${industry} project`,
    `Demonstrating leadership to drive a ${role} initiative at ${company}`,
    `Resolving ambiguity in a high-impact ${industry} deliverable`,
    `Adapting to change during a product shift at ${company}`,
  ];
  const technicalPrompts = technicalSkills.map(s => `Applying '${s}' in a ${role} role at ${company}`);
  const situationalPrompts = [
    `Approach if first 90 days in ${role} at ${company}`,
    `Strategy for addressing a legacy system performance issue in ${industry}`,
    `Plan to improve cross-functional collaboration at ${company}`,
  ];

  const questions = [];
  behavioralPrompts.forEach(p => {
    questions.push({
      text: `Can you walk me through ${p}?`,
      category: "Behavioral",
      difficulty: "Medium",
      linkedSkills: coreSkills.slice(0, 4),
      companyContext: `${company} / ${industry}`,
      starGuide: buildStarGuide(p),
    });
  });
  technicalPrompts.forEach((p, idx) => {
    questions.push({
      text: `Explain your experience ${p}.`,
      category: "Technical",
      difficulty: idx < 2 ? "Easy" : idx < 4 ? "Medium" : "Hard",
      linkedSkills: [technicalSkills[idx % technicalSkills.length]].filter(Boolean),
      companyContext: `${company} / ${industry}`,
    });
  });
  situationalPrompts.forEach((p, idx) => {
    questions.push({
      text: `How would you approach ${p}?`,
      category: "Situational",
      difficulty: idx === 0 ? "Easy" : idx === 1 ? "Medium" : "Hard",
      linkedSkills: technicalSkills.slice(idx, idx + 2),
      companyContext: `${company} / ${industry}`,
    });
  });
  return questions;
}

function computeStats(questions) {
  const stats = {
    total: questions.length,
    practicedCount: questions.filter(q => q.practiced).length,
    byCategory: { Behavioral: 0, Technical: 0, Situational: 0 },
    byDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
  };
  questions.forEach(q => {
    if (stats.byCategory[q.category] !== undefined) stats.byCategory[q.category]++;
    if (stats.byDifficulty[q.difficulty] !== undefined) stats.byDifficulty[q.difficulty]++;
  });
  return stats;
}

export async function generateInterviewQuestionBank(req, res) {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: "jobId required" });
    const job = await Job.findById(jobId);
    if (!job || job.userId !== req.user?.id) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    const skills = extractSkills(job);
    const questions = generateQuestions(job, skills);
    const existing = await InterviewQuestionBank.findOne({ userId: req.user.id, jobId });
    let bank;
    if (existing) {
      existing.questions = questions;
      existing.stats = computeStats(questions);
      bank = await existing.save();
    } else {
      bank = await InterviewQuestionBank.create({
        userId: req.user.id,
        jobId: job._id,
        roleTitle: job.title,
        company: job.company,
        industry: job.industry,
        workMode: job.workMode,
        questions,
        stats: computeStats(questions),
      });
    }
    return res.status(201).json({ success: true, data: bank });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getQuestionBankByJob(req, res) {
  try {
    const { jobId } = req.params;
    const bank = await InterviewQuestionBank.findOne({ userId: req.user.id, jobId });
    if (!bank) return res.status(404).json({ success: false, message: "Question bank not found" });
    return res.json({ success: true, data: bank });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAllQuestionBanks(req, res) {
  try {
    const banks = await InterviewQuestionBank.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    return res.json({ success: true, data: banks });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updatePracticeStatus(req, res) {
  try {
    const { id, questionId } = req.params;
    const bank = await InterviewQuestionBank.findOne({ _id: id, userId: req.user.id });
    if (!bank) return res.status(404).json({ success: false, message: "Question bank not found" });
    const question = bank.questions.id(questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });
    question.practiced = !question.practiced;
    question.lastPracticedAt = question.practiced ? new Date() : null;
    bank.stats = computeStats(bank.questions);
    await bank.save();
    return res.json({ success: true, data: bank });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteQuestionBank(req, res) {
  try {
    const { id } = req.params;
    const bank = await InterviewQuestionBank.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!bank) return res.status(404).json({ success: false, message: "Question bank not found" });
    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
