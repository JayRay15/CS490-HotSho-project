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
  
  const answeredCount = session.responses.length;
  const unansweredCount = total - answeredCount;

  // Strength detection
  const strengths = [];
  if (answeredCount > 0) {
    if (actionVerbSum / answeredCount >= 3) strengths.push("Strong use of action verbs");
    if (fillerSum / answeredCount <= 1) strengths.push("Minimal filler language");
    if (starFullCount && byCategory.Behavioral && starFullCount / byCategory.Behavioral > 0.6) strengths.push("Consistent STAR structure in behavioral answers");
    if (metricsUsedCount / answeredCount > 0.5) strengths.push("Good quantification of impact");
    if (avgWordCount >= 110 && avgWordCount <= 220) strengths.push("Balanced depth vs brevity");
  }
  
  // For incomplete sessions, provide preparatory guidance
  if (unansweredCount > 0) {
    improvementAreas.push(`Complete the full interview next time - you skipped ${unansweredCount} question(s). Practice builds confidence!`);
  }
  
  if (!strengths.length && answeredCount === 0) {
    strengths.push("Session started but not completed - try a full practice run to get personalized feedback");
  } else if (!strengths.length) {
    strengths.push("Foundational structure present; refine for more impact");
  }

  // Exercises generation based on feedback patterns and question types
  const exercises = [];
  const fText = improvementAreas.join(" ").toLowerCase();
  
  // Role-specific exercises based on question types in session
  const roleLower = (session.roleTitle || "").toLowerCase();
  const isServiceRetail = /cashier|retail|sales associate|server|barista|clerk|customer service|receptionist/i.test(session.roleTitle || "");
  const isTechnical = /engineer|developer|architect|analyst|scientist|programmer/i.test(session.roleTitle || "");
  
  if (answeredCount === 0) {
    // Provide starter exercises for unanswered sessions based on role
    if (isServiceRetail) {
      exercises.push("Practice 3 customer service stories using STAR method (Situation, Task, Action, Result).");
      exercises.push("Prepare examples of: handling difficult customers, working under pressure, and going the extra mile.");
      exercises.push("Think of specific times you resolved conflicts or made customers happy - include what you said and did.");
    } else if (isTechnical) {
      exercises.push("Prepare 3-4 technical stories: a bug you debugged, a feature you built, and a system you improved.");
      exercises.push("Practice explaining technical decisions: What problem? Why this solution? What were the trade-offs?");
      exercises.push("Have specific metrics ready: performance gains, user impact, time saved.");
    } else {
      exercises.push("Prepare 4-5 STAR stories covering: teamwork, problem-solving, leadership, and handling challenges.");
      exercises.push("Practice speaking concisely: 2-3 minutes per answer with clear structure.");
      exercises.push("Include quantifiable outcomes in your examples (%, $, time, users, etc.).");
    }
    
    if (byCategory.Behavioral > 0) exercises.push("For behavioral questions: Focus on YOUR actions and specific results, not team generalities.");
    if (byCategory.Technical > 0) exercises.push("For technical questions: Explain the 'why' behind decisions, not just the 'what'.");
    if (byCategory.Case > 0) exercises.push("For case questions: State assumptions first, then walk through your logic step-by-step.");
  } else {
    // Feedback-based exercises for answered sessions
    if (fText.includes("star incomplete")) exercises.push("Pick 4 past examples and outline full STAR components.");
    if (fText.includes("quantifiable") || fText.includes("metrics")) exercises.push("Audit past work; list 5 concrete metrics (%, $, counts).");
    if (fText.includes("too long")) exercises.push("Record an answer >3min then edit down to 2min focusing on impact.");
    if (fText.includes("words short")) exercises.push("Expand 3 answers by adding challenges + measurable results.");
    if (fText.includes("reduce filler")) exercises.push("Practice pausing silently instead of using filler words.");
    if (fText.includes("passive voice")) exercises.push("Rewrite passive sentences into active form (\"I led\" vs \"It was led\").");
    if (fText.includes("structured sequencing")) exercises.push("Use a framework (Problem → Analysis → Solution → Impact) in mock cases.");
  }
  
  if (!exercises.length) exercises.push("Complete a full practice session to get tailored feedback and exercises.");

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
      // Fallback role-appropriate questions - only generate for selected formats
      const roleLower = (role || "").toLowerCase();
      const isServiceRetail = /cashier|retail|sales associate|server|barista|clerk|customer service|receptionist/i.test(role || "");
      const isTechnical = /engineer|developer|architect|analyst|scientist|programmer/i.test(role || "");
      
      sourceQuestions = [];
      
      // Behavioral questions tailored to role type - only if Behavioral is selected
      if (formats.includes("Behavioral")) {
        if (isServiceRetail) {
          sourceQuestions.push(
            { text: `Tell me about a time you dealt with a difficult customer at ${comp || "work"}. How did you handle it?`, category: "Behavioral", difficulty: "Medium" },
            { text: `Describe a situation where you had to work quickly during a busy shift. What did you do?`, category: "Behavioral", difficulty: "Medium" },
            { text: `Give an example of when you went above and beyond for a customer.`, category: "Behavioral", difficulty: "Medium" },
            { text: `Tell me about a time you had to handle multiple customers at once. How did you prioritize?`, category: "Behavioral", difficulty: "Medium" }
          );
        } else if (isTechnical) {
          sourceQuestions.push(
            { text: `Describe a challenging technical problem you solved in your ${role || "recent"} experience.`, category: "Behavioral", difficulty: "Medium" },
            { text: `Tell me about a time you had to debug a complex issue. What was your approach?`, category: "Behavioral", difficulty: "Medium" },
            { text: `Give an example of when you improved system performance or efficiency.`, category: "Behavioral", difficulty: "Medium" },
            { text: `Describe a time you had to make a difficult technical trade-off. What did you consider?`, category: "Behavioral", difficulty: "Medium" }
          );
        } else {
          sourceQuestions.push(
            { text: `Describe a challenging situation you faced in your ${role || "recent"} experience. How did you handle it?`, category: "Behavioral", difficulty: "Medium" },
            { text: `Tell me about a time you had to meet a tight deadline. What did you do?`, category: "Behavioral", difficulty: "Medium" },
            { text: `Give an example of when you worked effectively with a team.`, category: "Behavioral", difficulty: "Medium" },
            { text: `Describe a time you received critical feedback. How did you respond?`, category: "Behavioral", difficulty: "Medium" }
          );
        }
      }
      
      // Technical questions - only if Technical is selected
      if (formats.includes("Technical")) {
        if (isTechnical) {
          sourceQuestions.push(
            { text: `Explain a technical concept or technology you recently used and why you chose it.`, category: "Technical", difficulty: "Medium" },
            { text: `How would you design a scalable system for ${comp || "a company"}?`, category: "Technical", difficulty: "Medium" },
            { text: `What are the trade-offs between SQL and NoSQL databases? When would you use each?`, category: "Technical", difficulty: "Medium" },
            { text: `Explain how you would optimize a slow-running query or API endpoint.`, category: "Technical", difficulty: "Medium" }
          );
        } else if (isServiceRetail) {
          sourceQuestions.push(
            { text: `How would you handle a situation where the register system goes down during peak hours?`, category: "Technical", difficulty: "Easy" },
            { text: `What steps would you take to ensure accurate cash handling at the end of your shift?`, category: "Technical", difficulty: "Easy" },
            { text: `Walk me through how you would process a return without the original receipt.`, category: "Technical", difficulty: "Easy" }
          );
        } else {
          sourceQuestions.push(
            { text: `How would you approach learning a new tool or process required for this ${role || "role"}?`, category: "Technical", difficulty: "Medium" },
            { text: `What methods do you use to stay organized and manage your workload?`, category: "Technical", difficulty: "Medium" }
          );
        }
      }
      
      // Case/Situational questions - only if Case is selected
      if (formats.includes("Case")) {
        if (isServiceRetail) {
          sourceQuestions.push(
            { text: `If a customer complained about waiting too long, how would you respond?`, category: "Situational", difficulty: "Easy" },
            { text: `How would you handle a situation where you suspected a customer was being dishonest?`, category: "Situational", difficulty: "Medium" },
            { text: `A coworker calls in sick during your busiest day. How do you handle the workload?`, category: "Situational", difficulty: "Medium" }
          );
        } else if (isTechnical) {
          sourceQuestions.push(
            { text: `How would you approach architecting a new feature for ${comp || "a company"} with limited resources?`, category: "Situational", difficulty: "Medium" },
            { text: `Your team disagrees on a technical approach. How would you resolve it?`, category: "Situational", difficulty: "Medium" },
            { text: `You discover a critical bug in production. Walk through your response plan.`, category: "Situational", difficulty: "Medium" }
          );
        } else {
          sourceQuestions.push(
            { text: `How would you prioritize competing demands from multiple stakeholders?`, category: "Situational", difficulty: "Medium" },
            { text: `If you disagreed with your manager's decision, how would you handle it?`, category: "Situational", difficulty: "Medium" }
          );
        }
      }
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

export async function getUserSessions(req, res) {
  try {
    const sessions = await MockInterviewSession.find({ userId: req.user.id })
      .sort({ startedAt: -1 })
      .select('_id roleTitle company formats status startedAt finishedAt summary.totalQuestions summary.averageWordCount responses')
      .limit(50);
    return res.json({ success: true, data: sessions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
