import { Job } from "../models/Job.js";
import { User } from "../models/User.js";
import { sendDeadlineReminderEmail } from "./email.js";

// Helper to normalize to local midnight for day-diff math
const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// Compute integer day difference (deadline - today)
const daysUntil = (deadline) => {
  if (!deadline) return null;
  const now = startOfDay(new Date());
  const end = startOfDay(new Date(deadline));
  return Math.round((end - now) / (1000 * 60 * 60 * 24));
};

/**
 * Collect jobs that match reminder thresholds and send consolidated emails per user
 * @param {Object} options
 * @param {number[]} options.thresholds - Days remaining that trigger reminders (e.g., [7,3,1,0,-1])
 * @returns {Promise<{processed:number, emailed:number}>}
 */
export const sendDeadlineRemindersNow = async ({ windowDays = 7, includeOverdueDays = 7 } = {}) => {
  // Fetch all jobs that have deadlines and are not archived
  const jobs = await Job.find({ deadline: { $ne: null }, archived: { $ne: true } });

  if (!jobs.length) return { processed: 0, emailed: 0 };

  // Group by userId when their jobs meet the digest window
  const byUser = new Map();
  for (const j of jobs) {
    const d = daysUntil(j.deadline);
    if (d === null) continue;
    // Include if deadline is within next windowDays or overdue within includeOverdueDays
    if (!(d <= windowDays && d >= -includeOverdueDays)) continue;
    if (!byUser.has(j.userId)) byUser.set(j.userId, []);
    byUser.get(j.userId).push({
      _id: j._id,
      title: j.title,
      company: j.company,
      deadline: j.deadline,
      days: d,
    });
  }

  if (byUser.size === 0) return { processed: jobs.length, emailed: 0 };

  // Load user details for contact info and guard field
  const userIds = Array.from(byUser.keys());
  const users = await User.find({ auth0Id: { $in: userIds } }, { email: 1, name: 1, auth0Id: 1, deadlineReminderLastSent: 1 });
  const userMap = new Map(users.map((u) => [u.auth0Id, u]));

  let emailed = 0;
  const today = startOfDay(new Date());
  const isSameLocalDay = (a, b) => !!a && !!b && startOfDay(a).getTime() === startOfDay(b).getTime();
  for (const [uid, items] of byUser.entries()) {
    const u = userMap.get(uid);
    if (!u || !u.email) continue;
    // Skip if we've already sent today
    if (isSameLocalDay(u.deadlineReminderLastSent, today)) continue;
    try {
      await sendDeadlineReminderEmail(u.email, u.name, items.sort((a, b) => a.days - b.days));
      emailed += 1;
      // Record last sent date (best-effort; don't block others on failure)
      try {
        await User.updateOne({ auth0Id: uid }, { $set: { deadlineReminderLastSent: new Date() } });
      } catch (updErr) {
        console.warn(`Could not update last reminder date for user ${uid}:`, updErr.message);
      }
    } catch (err) {
      // Log and continue with other users
      console.error(`Failed to email reminders to ${u.email}:`, err.message);
    }
  }

  return { processed: jobs.length, emailed };
};

/**
 * Start an interval-based schedule to send reminders once per day
 * Controlled via ENABLE_DEADLINE_REMINDERS env flag
 */
export const startDeadlineReminderSchedule = () => {
  const enabled = (process.env.ENABLE_DEADLINE_REMINDERS || 'false').toLowerCase() === 'true';
  if (!enabled) {
    console.log('⏸️  Deadline reminders are disabled (set ENABLE_DEADLINE_REMINDERS=true to enable)');
    return;
  }

  // Optional: run once at startup
  sendDeadlineRemindersNow().then(r => {
    console.log('📧 Initial deadline reminder run:', r);
  }).catch(err => console.error('📧 Initial reminder run failed:', err.message));

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    console.log('⏰ Running scheduled deadline reminders...');
    sendDeadlineRemindersNow()
      .then(r => console.log('✅ Reminders sent:', r))
      .catch(err => console.error('❌ Reminder run failed:', err.message));
  }, ONE_DAY_MS);

  console.log('📅 Deadline reminder schedule started: daily interval');
};

export default { sendDeadlineRemindersNow, startDeadlineReminderSchedule };
