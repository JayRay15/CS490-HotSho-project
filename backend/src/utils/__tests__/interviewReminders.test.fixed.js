import { jest } from '@jest/globals';

// Mock models and email util
const mockInterview = { find: jest.fn() };
const mockUser = { findOne: jest.fn() };
const mockSendInterviewReminderEmail = jest.fn();

jest.unstable_mockModule('../../models/Interview.js', () => ({ Interview: mockInterview }));
jest.unstable_mockModule('../../models/User.js', () => ({ User: mockUser }));
jest.unstable_mockModule('../email.js', () => ({ sendInterviewReminderEmail: mockSendInterviewReminderEmail }));

const { Interview } = await import('../../models/Interview.js');
const { User } = await import('../../models/User.js');
const { sendInterviewReminderEmail } = await import('../email.js');
const {
  sendInterviewRemindersNow,
  startInterviewReminderSchedule,
  checkForConflicts,
  getUpcomingInterviewSummary,
} = await import('../interviewReminders.js');

describe('interviewReminders util (fixed)', () => {
  let logSpy;
  let errSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    errSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.useFakeTimers();
  });

  afterEach(() => {
    logSpy.mockRestore();
    errSpy.mockRestore();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('returns success with zero reminders when none found', async () => {
    mockInterview.find.mockImplementation(() => ({ populate: () => Promise.resolve([]) }));
    const res = await sendInterviewRemindersNow();
    expect(res.success).toBe(true);
    expect(res.remindersSent).toBe(0);
  });

  it('sends a reminder when interview in window and user exists', async () => {
    const now = new Date();
    const scheduledDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const interviewObj = {
      _id: 'i1',
      userId: 'u1',
      title: 'SWE Interview',
      scheduledDate,
      reminders: { enabled: true, remindersSent: [] },
      save: jest.fn().mockResolvedValue(true),
    };
    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interviewObj]) }))
      .mockImplementation(() => ({ populate: () => Promise.resolve([]) }));
    mockUser.findOne.mockResolvedValue({ auth0Id: 'u1', email: 'u1@example.com', name: 'U One' });
    mockSendInterviewReminderEmail.mockResolvedValue();

    const res = await sendInterviewRemindersNow();

    expect(res.success).toBe(true);
    expect(res.remindersSent).toBe(1);
    expect(mockSendInterviewReminderEmail).toHaveBeenCalled();
    expect(interviewObj.save).toHaveBeenCalled();
  });

  it('skips reminders already sent today', async () => {
    const now = new Date();
    const scheduledDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const interviewObj = {
      _id: 'i2',
      userId: 'u2',
      title: 'SWE Interview',
      scheduledDate,
      reminders: { enabled: true, remindersSent: [{ type: '24h', sentAt: now.toISOString() }] },
      save: jest.fn().mockResolvedValue(true),
    };
    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interviewObj]) }))
      .mockImplementation(() => ({ populate: () => Promise.resolve([]) }));

    const res = await sendInterviewRemindersNow();
    expect(res.success).toBe(true);
    expect(res.remindersSent).toBe(0);
  });

  it('checkForConflicts returns matching interviews', async () => {
    const proposed = new Date();
    const conflicts = [{ _id: 'c1', scheduledDate: proposed }];
    mockInterview.find.mockImplementation(() => ({ populate: () => ({ sort: () => Promise.resolve(conflicts) }) }));
    const res = await checkForConflicts('user1', proposed, 60, null);
    expect(res).toEqual(conflicts);
  });

  it('getUpcomingInterviewSummary groups and computes stats', async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const interviews = [
      { _id: 'i1', userId: 'u1', title: 'A', company: 'X', scheduledDate: future, interviewType: 'phone', status: 'Scheduled', preparationTasks: [{ title: 't1', completed: false }], conflictWarning: { hasConflict: true } },
    ];
    mockInterview.find.mockImplementation(() => ({ populate: () => ({ sort: () => Promise.resolve(interviews) }) }));
    const res = await getUpcomingInterviewSummary('u1', 7);
    expect(res.interviews).toEqual(interviews);
    expect(res.stats.total).toBe(1);
    expect(res.stats.withIncompleteTasks).toBe(1);
    expect(res.stats.withConflicts).toBe(1);
  });

  it('startInterviewReminderSchedule returns null when disabled', () => {
    process.env.INTERVIEW_REMINDERS_ENABLED = 'false';
    const task = startInterviewReminderSchedule();
    expect(task).toBeNull();
  });
});
