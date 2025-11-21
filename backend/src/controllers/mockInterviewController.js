import { MockInterviewSession } from "../models/MockInterviewSession.js";
import { InterviewQuestionBank } from "../models/InterviewQuestionBank.js";
import { Job } from "../models/Job.js";

function buildQuestionObjects(sourceQuestions, formats) {
  // Filter by selected formats and map categories: Situational => Case
  const mapped = sourceQuestions.filter(q => formats.includes(q.category === "Situational" ? "Case" : q.category))
    .map(q => {
      const category = q.category === "Situational" ? "Case" : q.category;
      // Basic guidance ranges
      let range;
      let pacing;
      switch (category) {
        case "Behavioral":
          range = { min: 120, max: 250 }; pacing = 180; break;
        case "Technical":
          range = { min: 80, max: 160 }; pacing = 150; break;
        case "Case":
          range = { min: 150, max: 300 }; pacing = 240; break;
        default:
          range = { min: 100, max: 200 }; pacing = 180;
      }
      return {
        text: q.text,
        category,
        difficulty: q.difficulty || "Medium",
        idealWordRange: range,
        pacingSeconds: pacing,
      };
    });
  return mapped;
}

function analyzeAnswer(answer, question) {
  const answerText = (answer || "").trim();
  const wc = answerText.length ? answerText.split(/\s+/).filter(Boolean).length : 0;
  const lowered = answerText.toLowerCase();
  const feedback = [];

  // Word count guidance
  if (question.idealWordRange?.min && wc < question.idealWordRange.min) {
    feedback.push(`Answer is ${question.idealWordRange.min - wc} words short; add context and outcomes.`);
  }
  if (question.idealWordRange?.max && wc > question.idealWordRange.max) {
    feedback.push(`Answer is ${wc - question.idealWordRange.max} words too long; tighten and remove filler.`);
  }

  // STAR detection for Behavioral
  const starComponents = {
    situation: ["situation", "context", "background", "scenario", "when"],
    task: ["task", "goal", "objective", "challenge", "problem"],
    action: ["action", "implemented", "created", "built", "led", "designed", "developed", "organized"],
    result: ["result", "outcome", "impact", "achieved", "improved", "increased", "decreased", "reduced"]
  };
  let starPresentCount = 0;
  const missingStar = [];
  if (question.category === "Behavioral") {
    Object.entries(starComponents).forEach(([k, list]) => {
      const found = list.some(w => lowered.includes(w));
      if (found) starPresentCount += 1; else missingStar.push(k);
    });
    if (missingStar.length) {
      feedback.push(`STAR incomplete: missing ${missingStar.join(", ")}. Add those elements for structure.`);
    }
  }

  // Metrics / quantification
  const metricsRegex = /\b(\d+(?:\.\d+)?%|\$\d+(?:,\d{3})*|\d+\s*(users|customers|people|hours|days|weeks|months|transactions|requests|instances))\b/gi;
  const hasMetrics = metricsRegex.test(answerText);
  if (question.category === "Behavioral" && !hasMetrics) {
    feedback.push("Add quantifiable metrics (%, $, counts) to show impact.");
  }

  // Technical depth indicators
  const technicalIndicators = ["because", "trade-off", "optimization", "complexity", "algorithm", "architecture", "scalable", "refactor", "profil", "latency", "throughput", "index", "cache"];
  const hasTechnicalDepth = technicalIndicators.some(t => lowered.includes(t));
  if (question.category === "Technical" && !hasTechnicalDepth) {
    feedback.push("Explain reasoning: trade-offs, design decisions, or performance considerations.");
  }

  // Case structure indicators
  const structureIndicators = ["first", "second", "third", "next", "then", "finally", "framework", "approach", "hypothesis", "assumption", "consider"];
  const hasStructure = structureIndicators.some(s => lowered.includes(s));
  const hasAssumption = lowered.includes("assumption") || lowered.includes("assume");
  if (question.category === "Case") {
    if (!hasStructure) feedback.push("Add structured sequencing (first, next, finally) or a framework.");
    if (!hasAssumption) feedback.push("State key assumptions up front before solving.");
  }

  // Action verbs & filler
  const actionVerbs = ["led", "built", "created", "implemented", "designed", "optimized", "improved", "refactored", "reduced", "increased", "migrated", "automated", "launched", "developed"];
  let actionVerbCount = 0;
  actionVerbs.forEach(v => { if (new RegExp(`\\b${v}\\b`, "i").test(answerText)) actionVerbCount += 1; });
  const fillerWords = ["um", "uh", "like", "you know", "actually", "basically", "sort of", "kind of", "just"];
  let fillerCount = 0;
  fillerWords.forEach(f => { if (lowered.includes(f)) fillerCount += 1; });
  if (fillerCount > 2) feedback.push("Reduce filler words to maintain professionalism.");

  // Passive voice (simple heuristic)
  const passiveMatches = answerText.match(/\b(was|were|is|are|been|being|be)\s+\w+(ed|en)\b/gi);
  const passiveCount = passiveMatches ? passiveMatches.length : 0;
  if (passiveCount > 3) feedback.push("Too much passive voice; favor active verbs for clarity.");

  // Repetition heuristic (words >3 letters appearing >=4 times)
  const tokenFreq = {};
  answerText.split(/\s+/).forEach(t => {
    const clean = t.toLowerCase().replace(/[^a-z]/g, "");
    if (clean.length > 3) tokenFreq[clean] = (tokenFreq[clean] || 0) + 1;
  });
  const repetitive = Object.entries(tokenFreq).filter(([, c]) => c >= 5).map(([w]) => w).slice(0, 3);
  if (repetitive.length) feedback.push(`Reduce repetition of: ${repetitive.join(", ")}.`);

  // Sentence length & vagueness
  if (wc) {
    const sentences = answerText.split(/[.!?]+/).filter(s => s.trim().length);
    const avgWordsPerSentence = sentences.length ? wc / sentences.length : wc;
    if (avgWordsPerSentence > 35) feedback.push("Shorten long sentences; target 15-25 words each.");
    const vagueWords = ["thing", "stuff", "kind of", "sort of", "really", "very", "nice"];
    const vagueCount = vagueWords.filter(v => lowered.includes(v)).length;
    if (vagueCount > 2) feedback.push("Replace vague terms with concrete specifics.");
  }

  // Limit feedback length for readability
  const trimmedFeedback = feedback.slice(0, 8);
  return {
    wordCount: wc,
    guidanceFeedback: trimmedFeedback,
    metrics: {
      actionVerbCount,
      fillerCount,
      passiveCount,
      hasMetrics,
      starPresentCount,
      hasStructure,
      hasAssumption
    }
  };
}

function buildSummary(session) {
  const total = session.questions.length;
  const byCategory = { Behavioral: 0, Technical: 0, Case: 0 };
  session.questions.forEach(q => { if (byCategory[q.category] !== undefined) byCategory[q.category]++; });

  // Re-run analysis to gather extended metrics
  let combinedFeedback = [];
  let totalWordCount = 0;
  let totalDuration = 0;
  let actionVerbSum = 0;
  let fillerSum = 0;
  let passiveSum = 0;
  let starFullCount = 0;
  let metricsUsedCount = 0;

  session.responses.forEach((resp, idx) => {
    const question = session.questions[idx];
    const analysis = analyzeAnswer(resp.answer || "", question);
    combinedFeedback = combinedFeedback.concat(analysis.guidanceFeedback);
    totalWordCount += analysis.wordCount;
    totalDuration += resp.durationSeconds || 0;
    actionVerbSum += analysis.metrics.actionVerbCount;
    fillerSum += analysis.metrics.fillerCount;
    passiveSum += analysis.metrics.passiveCount;
    if (question.category === "Behavioral" && analysis.metrics.starPresentCount === 4) starFullCount += 1;
    if (analysis.metrics.hasMetrics) metricsUsedCount += 1;
  });

  const avgWordCount = total ? Math.round(totalWordCount / total) : 0;
  const avgDuration = total ? Math.round(totalDuration / total) : 0;
  const improvementAreas = Array.from(new Set(combinedFeedback)).slice(0, 15);

  // Strength detection
  const strengths = [];
  if (actionVerbSum / (total || 1) >= 3) strengths.push("Strong use of action verbs");
  if (fillerSum / (total || 1) <= 1) strengths.push("Minimal filler language");
  if (starFullCount && starFullCount / (byCategory.Behavioral || 1) > 0.6) strengths.push("Consistent STAR structure in behavioral answers");
  if (metricsUsedCount / (total || 1) > 0.5) strengths.push("Good quantification of impact");
  if (avgWordCount >= 110 && avgWordCount <= 220) strengths.push("Balanced depth vs brevity");
  if (!strengths.length) strengths.push("Foundational structure present; refine for more impact");

  // Exercises generation based on feedback patterns
  const exercises = [];
  const fText = improvementAreas.join(" ").toLowerCase();
  if (fText.includes("star incomplete")) exercises.push("Pick 4 past examples and outline full STAR components.");
  if (fText.includes("quantifiable") || fText.includes("metrics")) exercises.push("Audit past projects; list 5 concrete metrics (%, $, counts).");
  if (fText.includes("too long")) exercises.push("Record an answer >3min then edit down to 2min focusing on impact.");
  if (fText.includes("words short")) exercises.push("Expand 3 answers by adding challenges + measurable results.");
  if (fText.includes("reduce filler")) exercises.push("Practice pausing silently instead of using filler words.");
  if (fText.includes("passive voice")) exercises.push("Rewrite passive sentences into active form (\"I led\" vs \"It was led\").");
  if (fText.includes("structured sequencing")) exercises.push("Use a framework (Problem → Analysis → Solution → Impact) in mock cases.");
  if (!exercises.length) exercises.push("Maintain strengths; simulate mixed-format interviews for consistency.");

  // Analysis metrics for summary
  const analysisMetrics = {
    averageActionVerbDensity: total ? +(actionVerbSum / total).toFixed(2) : 0,
    averageFillerCount: total ? +(fillerSum / total).toFixed(2) : 0,
    starCompletionRate: byCategory.Behavioral ? +(starFullCount / byCategory.Behavioral).toFixed(2) : 0,
    metricsUsageRate: total ? +(metricsUsedCount / total).toFixed(2) : 0,
  };

  return {
    totalQuestions: total,
    averageWordCount: avgWordCount,
    averageDurationSeconds: avgDuration,
    byCategory,
    improvementAreas,
    confidenceExercises: exercises.slice(0, 6),
    strengths: strengths.slice(0, 6),
    analysisMetrics,
  };
}

export async function startMockInterview(req, res) {
  try {
    const { jobId, formats = ["Behavioral", "Technical", "Case"], roleTitle, company } = req.body;
    let role = roleTitle; let comp = company; let sourceQuestions = [];
    if (jobId) {
      const job = await Job.findById(jobId);
      if (job && job.userId === req.user?.id) {
        role = role || job.title; comp = comp || job.company;
        const bank = await InterviewQuestionBank.findOne({ userId: req.user.id, jobId });
        if (bank) sourceQuestions = bank.questions;
      }
    }
    if (sourceQuestions.length === 0) {
      // Fallback generic questions
      sourceQuestions = [
        { text: `Describe a challenging project in your ${role || "recent"} experience.`, category: "Behavioral", difficulty: "Medium" },
        { text: `Explain a technical concept you recently mastered.`, category: "Technical", difficulty: "Medium" },
        { text: `How would you approach a market expansion for ${comp || "a company"}?`, category: "Situational", difficulty: "Medium" },
      ];
    }
    const questions = buildQuestionObjects(sourceQuestions, formats).slice(0, 12); // limit to 12
    const session = await MockInterviewSession.create({
      userId: req.user.id,
      jobId: jobId || undefined,
      roleTitle: role,
      company: comp,
      formats,
      questions,
    });
    return res.status(201).json({ success: true, data: session });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getSession(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await MockInterviewSession.findOne({ _id: sessionId, userId: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    return res.json({ success: true, data: session });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function answerQuestion(req, res) {
  try {
    const { sessionId } = req.params;
    const { answer, durationSeconds = 0 } = req.body;
    const session = await MockInterviewSession.findOne({ _id: sessionId, userId: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.status === "finished") return res.status(400).json({ success: false, message: "Session already finished" });
    const question = session.questions[session.currentIndex];
    if (!question) return res.status(400).json({ success: false, message: "No current question" });
    const analysis = analyzeAnswer(answer || '', question);
    session.responses.push({
      questionId: question._id,
      answer,
      wordCount: analysis.wordCount,
      durationSeconds,
      guidanceFeedback: analysis.guidanceFeedback,
    });
    // Advance index
    session.currentIndex += 1;
    if (session.currentIndex >= session.questions.length) {
      session.status = "finished";
      session.finishedAt = new Date();
      session.summary = buildSummary(session);
    }
    await session.save();
    return res.json({ success: true, data: session });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function finishSession(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await MockInterviewSession.findOne({ _id: sessionId, userId: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.status !== "finished") {
      session.status = "finished";
      session.finishedAt = new Date();
      session.summary = buildSummary(session);
      await session.save();
    }
    return res.json({ success: true, data: session });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getSummary(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await MockInterviewSession.findOne({ _id: sessionId, userId: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (!session.summary && session.status === "finished") {
      session.summary = buildSummary(session);
      await session.save();
    }
    return res.json({ success: true, data: session.summary || null });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
