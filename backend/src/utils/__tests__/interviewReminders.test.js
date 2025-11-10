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

describe('interviewReminders util', () => {
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
    // Interview.find will be called three times (one per threshold)
    // For sendInterviewRemindersNow, populate should resolve directly to an array
    mockInterview.find.mockImplementation(() => ({ populate: () => Promise.resolve([]) }));

    const res = await sendInterviewRemindersNow();

    expect(res.success).toBe(true);
    expect(res.remindersSent).toBe(0);
  });

  it('sends a reminder when interview in window and user exists', async () => {
    const now = new Date();
    const scheduledDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    const interviewObj = {
      _id: 'i1',
      userId: 'u1',
      title: 'SWE Interview',
      scheduledDate,
      reminders: { enabled: true, remindersSent: [] },
      save: jest.fn().mockResolvedValue(true),
    };

    // First threshold returns the interview, others return empty
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
    expect(mockInterview.find).toHaveBeenCalled();
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

  it('skips sending when user not found or has no email', async () => {
    const now = new Date();
    const scheduledDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    const interviewObj = {
      _id: 'i3',
      userId: 'u3',
      title: 'No User Interview',
      scheduledDate,
      reminders: { enabled: true, remindersSent: [] },
      save: jest.fn().mockResolvedValue(true),
    };

    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interviewObj]) }))
      .mockImplementation(() => ({ populate: () => Promise.resolve([]) }));

    mockUser.findOne.mockResolvedValue(null); // user not found

    const res = await sendInterviewRemindersNow();

    expect(res.success).toBe(true);
    expect(res.remindersSent).toBe(0);
    expect(mockUser.findOne).toHaveBeenCalled();
  });

  it('continues when sendInterviewReminderEmail throws', async () => {
    const now = new Date();
    const scheduledDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    const interviewObj = {
      _id: 'i4',
      userId: 'u4',
      title: 'Failing Email Interview',
      scheduledDate,
      reminders: { enabled: true, remindersSent: [] },
      save: jest.fn().mockResolvedValue(true),
    };

    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interviewObj]) }))
      .mockImplementation(() => ({ populate: () => Promise.resolve([]) }));

    mockUser.findOne.mockResolvedValue({ auth0Id: 'u4', email: 'u4@example.com', name: 'U Four' });
    mockSendInterviewReminderEmail.mockRejectedValue(new Error('SMTP down'));

    const res = await sendInterviewRemindersNow();

    expect(res.success).toBe(true);
    // Should not increment remindersSent when email fails
    expect(res.remindersSent).toBe(0);
    expect(errSpy).toHaveBeenCalled();
  });

  it('startInterviewReminderSchedule returns a task when enabled', () => {
    process.env.INTERVIEW_REMINDERS_ENABLED = 'true';
    delete process.env.RUN_REMINDERS_ON_STARTUP;
    const task = startInterviewReminderSchedule();
    // node-cron returns a ScheduledTask-like object with stop method
    expect(task).toBeTruthy();
    if (task && typeof task.stop === 'function') {
      task.stop();
    }
  });

  it('checkForConflicts throws when DB errors', async () => {
    const proposed = new Date();
    mockInterview.find.mockImplementation(() => { throw new Error('DB down'); });

    await expect(checkForConflicts('user1', proposed, 60, null)).rejects.toThrow('DB down');
  });

  it('getUpcomingInterviewSummary throws when DB errors', async () => {
    mockInterview.find.mockImplementation(() => { throw new Error('DB fail'); });
    await expect(getUpcomingInterviewSummary('u1', 7)).rejects.toThrow('DB fail');
  });

  it('returns failure object when sendInterviewRemindersNow top-level find throws', async () => {
    mockInterview.find.mockImplementation(() => { throw new Error('find failed'); });

    const res = await sendInterviewRemindersNow();

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/find failed/);
    expect(errSpy).toHaveBeenCalled();
  });

  it('sends a reminder and initializes remindersSent when missing', async () => {
    const now = new Date();
    const scheduledDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    const interviewObj = {
      _id: 'i5',
      userId: 'u5',
      title: 'Init Reminders Interview',
      scheduledDate,
      reminders: { enabled: true }, // no remindersSent property
      save: jest.fn().mockResolvedValue(true),
    };

    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interviewObj]) }))
      .mockImplementation(() => ({ populate: () => Promise.resolve([]) }));
    mockUser.findOne.mockResolvedValue({ auth0Id: 'u5', email: 'u5@example.com', name: 'U Five' });
    mockSendInterviewReminderEmail.mockResolvedValue();

    const res = await sendInterviewRemindersNow();

    expect(res.success).toBe(true);
    expect(res.remindersSent).toBe(1);
    expect(interviewObj.reminders.remindersSent).toBeDefined();
    expect(interviewObj.save).toHaveBeenCalled();
  });

  it('checkForConflicts respects excludeInterviewId', async () => {
    const proposed = new Date();
    mockInterview.find.mockImplementation(() => ({ populate: () => ({ sort: () => Promise.resolve([]) }) }));

    const res = await checkForConflicts('userX', proposed, 60, 'exclude123');
    expect(res).toEqual([]);
    expect(mockInterview.find).toHaveBeenCalled();
  });

  it('startInterviewReminderSchedule executes scheduled callback and initial run when configured', async () => {
    // We need to import a fresh copy of the module with a mocked cron that immediately invokes the callback
    jest.resetModules();

    const fakeInterview = { find: jest.fn(() => ({ populate: () => Promise.resolve([]) })) };
    const fakeUser = { findOne: jest.fn() };
    const fakeEmail = { sendInterviewReminderEmail: jest.fn() };

    // Mock cron to immediately run the provided function and return a task-like object
    const cronMock = {
      schedule: jest.fn((_, fn) => {
        // run immediately to exercise the callback body
        const p = fn();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        return { stop: jest.fn() };
      }),
    };

    jest.unstable_mockModule('../../models/Interview.js', () => ({ Interview: fakeInterview }));
    jest.unstable_mockModule('../../models/User.js', () => ({ User: fakeUser }));
    jest.unstable_mockModule('../email.js', () => fakeEmail);
  jest.unstable_mockModule('node-cron', () => ({ default: cronMock }));

  // Set env to trigger initial run and force the send function to throw so the startup .catch is exercised
  process.env.INTERVIEW_REMINDERS_ENABLED = 'true';
  process.env.RUN_REMINDERS_ON_STARTUP = 'true';
  process.env.FORCE_REMINDER_SEND_ERROR = 'true';

    const { startInterviewReminderSchedule } = await import('../interviewReminders.js');

    const task = startInterviewReminderSchedule();
    expect(task).toBeTruthy();
    if (task && typeof task.stop === 'function') task.stop();

  // cleanup
  delete process.env.RUN_REMINDERS_ON_STARTUP;
  delete process.env.INTERVIEW_REMINDERS_ENABLED;
  delete process.env.FORCE_REMINDER_SEND_ERROR;
  });
});
