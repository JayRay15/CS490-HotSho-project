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

  it('handles errors in sendInterviewRemindersNow gracefully', async () => {
    mockInterview.find.mockImplementation(() => {
      throw new Error('Database error');
    });

    const res = await sendInterviewRemindersNow();

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('reminder'));
  });

  it('sends multiple reminders if multiple interviews match', async () => {
    const now = new Date();
    const future24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const interview1 = {
      _id: 'i1',
      userId: 'u1',
      title: 'Interview 1',
      company: 'Company A',
      scheduledDate: future24h,
      reminders: { enabled: true, remindersSent: [] },
      save: jest.fn().mockResolvedValue(true),
    };

    const interview2 = {
      _id: 'i2',
      userId: 'u2',
      title: 'Interview 2',
      company: 'Company B',
      scheduledDate: future24h,
      reminders: { enabled: true, remindersSent: [] },
      save: jest.fn().mockResolvedValue(true),
    };

    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interview1, interview2]) }))
      .mockImplementation(() => ({ populate: () => Promise.resolve([]) }));

    mockUser.findOne.mockResolvedValue({ auth0Id: 'user', email: 'user@example.com', name: 'User' });
    mockSendInterviewReminderEmail.mockResolvedValue();

    const res = await sendInterviewRemindersNow();

    expect(res.remindersSent).toBe(2);
    expect(mockSendInterviewReminderEmail).toHaveBeenCalledTimes(2);
  });

  it('sends reminders for 2-hour window', async () => {
    const now = new Date();
    const future2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const interviewObj = {
      _id: 'i1',
      userId: 'u1',
      title: 'Interview Soon',
      company: 'Company',
      scheduledDate: future2h,
      reminders: { enabled: true, remindersSent: [] },
      save: jest.fn().mockResolvedValue(true),
    };

    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([]) }))
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interviewObj]) }))
      .mockImplementation(() => ({ populate: () => Promise.resolve([]) }));

    mockUser.findOne.mockResolvedValue({ auth0Id: 'u1', email: 'u1@example.com', name: 'User' });
    mockSendInterviewReminderEmail.mockResolvedValue();

    const res = await sendInterviewRemindersNow();

    expect(res.remindersSent).toBe(1);
    expect(mockSendInterviewReminderEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      2
    );
  });

  it('sends reminders for 1-hour window', async () => {
    const now = new Date();
    const future1h = new Date(now.getTime() + 60 * 60 * 1000);

    const interviewObj = {
      _id: 'i1',
      userId: 'u1',
      title: 'Interview Very Soon',
      company: 'Company',
      scheduledDate: future1h,
      reminders: { enabled: true, remindersSent: [] },
      save: jest.fn().mockResolvedValue(true),
    };

    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([]) }))
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([]) }))
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interviewObj]) }));

    mockUser.findOne.mockResolvedValue({ auth0Id: 'u1', email: 'u1@example.com', name: 'User' });
    mockSendInterviewReminderEmail.mockResolvedValue();

    const res = await sendInterviewRemindersNow();

    expect(res.remindersSent).toBe(1);
    expect(mockSendInterviewReminderEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      1
    );
  });

  it('handles user not found gracefully', async () => {
    const now = new Date();
    const future24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const interviewObj = {
      _id: 'i1',
      userId: 'u1',
      title: 'Interview',
      scheduledDate: future24h,
      reminders: { enabled: true, remindersSent: [] },
      save: jest.fn().mockResolvedValue(true),
    };

    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interviewObj]) }))
      .mockImplementation(() => ({ populate: () => Promise.resolve([]) }));

    mockUser.findOne.mockResolvedValue(null);

    const res = await sendInterviewRemindersNow();

    expect(res.success).toBe(true);
    expect(res.remindersSent).toBe(0);
  });

  it('handles email sending errors gracefully', async () => {
    const now = new Date();
    const future24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const interviewObj = {
      _id: 'i1',
      userId: 'u1',
      title: 'Interview',
      scheduledDate: future24h,
      reminders: { enabled: true, remindersSent: [] },
      save: jest.fn().mockResolvedValue(true),
    };

    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interviewObj]) }))
      .mockImplementation(() => ({ populate: () => Promise.resolve([]) }));

    mockUser.findOne.mockResolvedValue({ auth0Id: 'u1', email: 'u1@example.com', name: 'User' });
    mockSendInterviewReminderEmail.mockRejectedValue(new Error('Email error'));

    const res = await sendInterviewRemindersNow();

    expect(res.success).toBe(true);
    expect(errSpy).toHaveBeenCalled();
  });

  it('checkForConflicts handles empty results', async () => {
    const proposed = new Date();
    mockInterview.find.mockImplementation(() => ({ populate: () => ({ sort: () => Promise.resolve([]) }) }));

    const res = await checkForConflicts('user1', proposed, 60);
    expect(res).toEqual([]);
  });

  it('checkForConflicts with exclusion parameter', async () => {
    const proposed = new Date();
    mockInterview.find.mockImplementation(() => ({ populate: () => ({ sort: () => Promise.resolve([]) }) }));

    await checkForConflicts('user1', proposed, 90, 'excludedId');
    expect(mockInterview.find).toHaveBeenCalled();
  });

  it('getUpcomingInterviewSummary with empty results', async () => {
    mockInterview.find.mockImplementation(() => ({ populate: () => ({ sort: () => Promise.resolve([]) }) }));

    const res = await getUpcomingInterviewSummary('u1', 7);

    expect(res.interviews).toEqual([]);
    expect(res.stats.total).toBe(0);
    expect(res.stats.withIncompleteTasks).toBe(0);
  });

  it('getUpcomingInterviewSummary counts incomplete tasks correctly', async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const interview1 = {
      _id: 'i1',
      userId: 'u1',
      title: 'Interview 1',
      company: 'Company A',
      scheduledDate: future,
      preparationTasks: [
        { title: 'Task 1', completed: false },
        { title: 'Task 2', completed: false },
      ],
    };

    const interview2 = {
      _id: 'i2',
      userId: 'u1',
      title: 'Interview 2',
      company: 'Company B',
      scheduledDate: future,
      preparationTasks: [
        { title: 'Task 1', completed: true },
        { title: 'Task 2', completed: true },
      ],
    };

    mockInterview.find.mockImplementation(() => ({ populate: () => ({ sort: () => Promise.resolve([interview1, interview2]) }) }));

    const res = await getUpcomingInterviewSummary('u1', 7);

    expect(res.stats.total).toBe(2);
    expect(res.stats.withIncompleteTasks).toBe(1);
  });

  it('getUpcomingInterviewSummary counts conflicts correctly', async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const interviews = [
      {
        _id: 'i1',
        userId: 'u1',
        title: 'Interview 1',
        company: 'Company A',
        scheduledDate: future,
        conflictWarning: { hasConflict: true },
        preparationTasks: [],
      },
      {
        _id: 'i2',
        userId: 'u1',
        title: 'Interview 2',
        company: 'Company B',
        scheduledDate: future,
        conflictWarning: { hasConflict: false },
        preparationTasks: [],
      },
    ];

    mockInterview.find.mockImplementation(() => ({ populate: () => ({ sort: () => Promise.resolve(interviews) }) }));

    const res = await getUpcomingInterviewSummary('u1', 7);

    expect(res.stats.total).toBe(2);
    expect(res.stats.withConflicts).toBe(1);
  });

  it('startInterviewReminderSchedule returns task when enabled', () => {
    process.env.INTERVIEW_REMINDERS_ENABLED = 'true';
    const task = startInterviewReminderSchedule();
    expect(task).not.toBeNull();
    if (task) task.stop();
  });

  it('startInterviewReminderSchedule handles missing env variable', () => {
    delete process.env.INTERVIEW_REMINDERS_ENABLED;
    const task = startInterviewReminderSchedule();
    expect(task).toBeDefined();
    if (task && typeof task.stop === 'function') task.stop();
  });

  it('sendInterviewRemindersNow initializes remindersSent array if missing', async () => {
    const now = new Date();
    const future24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const interviewObj = {
      _id: 'i1',
      userId: 'u1',
      title: 'Interview',
      scheduledDate: future24h,
      reminders: { enabled: true },
      save: jest.fn().mockResolvedValue(true),
    };

    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interviewObj]) }))
      .mockImplementation(() => ({ populate: () => Promise.resolve([]) }));

    mockUser.findOne.mockResolvedValue({ auth0Id: 'u1', email: 'u1@example.com', name: 'User' });
    mockSendInterviewReminderEmail.mockResolvedValue();

    const res = await sendInterviewRemindersNow();

    expect(res.remindersSent).toBe(1);
    expect(interviewObj.save).toHaveBeenCalled();
  });

  it('sendInterviewRemindersNow records lastReminderSent timestamp', async () => {
    const now = new Date();
    const future24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const interviewObj = {
      _id: 'i1',
      userId: 'u1',
      title: 'Interview',
      scheduledDate: future24h,
      reminders: { enabled: true, remindersSent: [] },
      save: jest.fn().mockResolvedValue(true),
    };

    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interviewObj]) }))
      .mockImplementation(() => ({ populate: () => Promise.resolve([]) }));

    mockUser.findOne.mockResolvedValue({ auth0Id: 'u1', email: 'u1@example.com', name: 'User' });
    mockSendInterviewReminderEmail.mockResolvedValue();

    await sendInterviewRemindersNow();

    expect(interviewObj.reminders.lastReminderSent).toBeDefined();
  });

  it('checkForConflicts handles default duration parameter', async () => {
    const proposed = new Date();
    mockInterview.find.mockImplementation(() => ({ populate: () => ({ sort: () => Promise.resolve([]) }) }));

    const res = await checkForConflicts('user1', proposed);
    expect(res).toEqual([]);
    expect(mockInterview.find).toHaveBeenCalled();
  });

  it('getUpcomingInterviewSummary filters within provided day range', async () => {
    const now = new Date();
    const future14d = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const interview = {
      _id: 'i1',
      userId: 'u1',
      title: 'Future Interview',
      scheduledDate: future14d,
      preparationTasks: [],
    };

    mockInterview.find.mockImplementation(() => ({ populate: () => ({ sort: () => Promise.resolve([interview]) }) }));

    const res = await getUpcomingInterviewSummary('u1', 14);
    expect(res.interviews.length).toBeGreaterThan(0);
  });

  it('sendInterviewRemindersNow returns success with timestamp', async () => {
    mockInterview.find.mockImplementation(() => ({ populate: () => Promise.resolve([]) }));

    const res = await sendInterviewRemindersNow();

    expect(res.success).toBe(true);
    expect(res.timestamp).toBeDefined();
    expect(new Date(res.timestamp)).toBeInstanceOf(Date);
  });

  it('logs success message when reminders sent', async () => {
    const now = new Date();
    const future24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const interviewObj = {
      _id: 'i1',
      userId: 'u1',
      title: 'Interview',
      company: 'Company',
      scheduledDate: future24h,
      reminders: { enabled: true, remindersSent: [] },
      save: jest.fn().mockResolvedValue(true),
    };

    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interviewObj]) }))
      .mockImplementation(() => ({ populate: () => Promise.resolve([]) }));

    mockUser.findOne.mockResolvedValue({ auth0Id: 'u1', email: 'u1@example.com', name: 'User' });
    mockSendInterviewReminderEmail.mockResolvedValue();

    await sendInterviewRemindersNow();

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Sent'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('completed'));
  });

  it('logs error message when reminder fails to send', async () => {
    const now = new Date();
    const future24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const interviewObj = {
      _id: 'i1',
      userId: 'u1',
      title: 'Interview',
      scheduledDate: future24h,
      reminders: { enabled: true, remindersSent: [] },
      save: jest.fn().mockRejectedValue(new Error('Save failed')),
    };

    mockInterview.find
      .mockImplementationOnce(() => ({ populate: () => Promise.resolve([interviewObj]) }))
      .mockImplementation(() => ({ populate: () => Promise.resolve([]) }));

    mockUser.findOne.mockResolvedValue({ auth0Id: 'u1', email: 'u1@example.com', name: 'User' });
    mockSendInterviewReminderEmail.mockResolvedValue();

    await sendInterviewRemindersNow();

    expect(errSpy).toHaveBeenCalled();
  });

  it('getUpcomingInterviewSummary includes all returned interviews', async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const interviews = [
      { _id: 'i1', userId: 'u1', title: 'First', scheduledDate: future, preparationTasks: [] },
      { _id: 'i2', userId: 'u1', title: 'Second', scheduledDate: new Date(future.getTime() + 24 * 60 * 60 * 1000), preparationTasks: [] },
      { _id: 'i3', userId: 'u1', title: 'Third', scheduledDate: new Date(future.getTime() + 2 * 24 * 60 * 60 * 1000), preparationTasks: [] },
    ];

    mockInterview.find.mockImplementation(() => ({ populate: () => ({ sort: () => Promise.resolve(interviews) }) }));

    const res = await getUpcomingInterviewSummary('u1', 14);

    expect(res.interviews.length).toBe(3);
    expect(res.stats.total).toBe(3);
  });
});
