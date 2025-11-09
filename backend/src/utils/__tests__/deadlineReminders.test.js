import { jest } from '@jest/globals';

// Mock models and email util before importing the module under test
const mockJob = { find: jest.fn() };
const mockUser = { find: jest.fn(), updateOne: jest.fn() };
const mockSendDeadlineReminderEmail = jest.fn();

jest.unstable_mockModule('../../models/Job.js', () => ({
  Job: mockJob,
}));

jest.unstable_mockModule('../../models/User.js', () => ({
  User: mockUser,
}));

jest.unstable_mockModule('../email.js', () => ({
  sendDeadlineReminderEmail: mockSendDeadlineReminderEmail,
}));

const { Job } = await import('../../models/Job.js');
const { User } = await import('../../models/User.js');
const { sendDeadlineReminderEmail } = await import('../email.js');
const { sendDeadlineRemindersNow, startDeadlineReminderSchedule } = await import('../deadlineReminders.js');

describe('deadlineReminders util', () => {
  let logSpy;
  let warnSpy;
  let errSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    errSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.useFakeTimers();
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errSpy.mockRestore();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('returns zero when there are no jobs', async () => {
    Job.find.mockResolvedValue([]);

    const res = await sendDeadlineRemindersNow();

    expect(res).toEqual({ processed: 0, emailed: 0 });
  });

  it('processes jobs but sends no emails when none in window', async () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 100);
    Job.find.mockResolvedValue([
      { _id: 'j1', userId: 'u1', title: 'Job 1', company: 'Co', deadline: farFuture },
    ]);

    const res = await sendDeadlineRemindersNow({ windowDays: 1 });

    expect(res).toEqual({ processed: 1, emailed: 0 });
  });

  it('emails users with upcoming jobs and updates last sent date', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    Job.find.mockResolvedValue([
      { _id: 'j1', userId: 'u1', title: 'Job 1', company: 'Co', deadline: tomorrow, },
    ]);

    User.find.mockResolvedValue([{ auth0Id: 'u1', email: 'u1@example.com', name: 'U One', deadlineReminderLastSent: null }]);
    sendDeadlineReminderEmail.mockResolvedValue();
    User.updateOne.mockResolvedValue({});

    const res = await sendDeadlineRemindersNow({ windowDays: 2 });

    expect(res).toEqual({ processed: 1, emailed: 1 });
    expect(sendDeadlineReminderEmail).toHaveBeenCalledWith('u1@example.com', 'U One', expect.any(Array));
    expect(User.updateOne).toHaveBeenCalledWith({ auth0Id: 'u1' }, { $set: { deadlineReminderLastSent: expect.any(Date) } });
  });

  it('continues other users when email sending fails', async () => {
    const inWindow = new Date();
    inWindow.setDate(inWindow.getDate() + 1);
    Job.find.mockResolvedValue([
      { _id: 'j1', userId: 'u1', title: 'Job 1', company: 'Co', deadline: inWindow, },
      { _id: 'j2', userId: 'u2', title: 'Job 2', company: 'Co', deadline: inWindow, },
    ]);

    User.find.mockResolvedValue([
      { auth0Id: 'u1', email: 'u1@example.com', name: 'U One', deadlineReminderLastSent: null },
      { auth0Id: 'u2', email: 'u2@example.com', name: 'U Two', deadlineReminderLastSent: null },
    ]);

    sendDeadlineReminderEmail
      .mockRejectedValueOnce(new Error('SMTP down'))
      .mockResolvedValueOnce();

    User.updateOne.mockResolvedValue({});

    const res = await sendDeadlineRemindersNow({ windowDays: 2 });

    expect(res.processed).toBe(2);
    // one of the two should have succeeded
    expect(res.emailed).toBe(1);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to email reminders to'), expect.any(String));
  });

  it('warns if updating last-sent date fails but still counts email', async () => {
    const inWindow = new Date();
    inWindow.setDate(inWindow.getDate() + 1);
    Job.find.mockResolvedValue([{ _id: 'j1', userId: 'u1', title: 'Job 1', company: 'Co', deadline: inWindow }]);

    User.find.mockResolvedValue([{ auth0Id: 'u1', email: 'u1@example.com', name: 'U One', deadlineReminderLastSent: null }]);
    sendDeadlineReminderEmail.mockResolvedValue();
    User.updateOne.mockRejectedValue(new Error('DB write failed'));

    const res = await sendDeadlineRemindersNow({ windowDays: 2 });

    expect(res).toEqual({ processed: 1, emailed: 1 });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not update last reminder date for user'), expect.any(String));
  });

  describe('startDeadlineReminderSchedule', () => {
    it('logs when disabled via env flag', () => {
      process.env.ENABLE_DEADLINE_REMINDERS = 'false';
      startDeadlineReminderSchedule();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Deadline reminders are disabled'));
    });

    it('starts schedule when enabled and runs initial send (no jobs)', async () => {
      process.env.ENABLE_DEADLINE_REMINDERS = 'true';
      // no jobs so initial run will return processed 0
      Job.find.mockResolvedValue([]);

      // Temporarily use real timers so the module's setImmediate/setInterval run
      jest.useRealTimers();
      try {
        // Prevent setInterval from creating a real scheduled timer handle
        const origSetInterval = global.setInterval;
        global.setInterval = jest.fn();

        startDeadlineReminderSchedule();
        // allow the initial async call to resolve
        await new Promise((res) => setImmediate(res));

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Deadline reminder schedule started'));
        // The initial run logs with two args (label and result object); check the first arg of calls
        const hadInitial = logSpy.mock.calls.some(c => String(c[0]).includes('Initial deadline reminder run'));
        expect(hadInitial).toBe(true);

        // restore original setInterval
        global.setInterval = origSetInterval;
      } finally {
        // restore fake timers for other tests
        jest.useFakeTimers();
      }
    });
  });

  it('skips users with no user record or missing email', async () => {
    const inWindow = new Date();
    inWindow.setDate(inWindow.getDate() + 1);
    Job.find.mockResolvedValue([{ _id: 'j1', userId: 'uX', title: 'Job X', company: 'C', deadline: inWindow }]);
    // no user returned
    User.find.mockResolvedValue([]);

    const res = await sendDeadlineRemindersNow({ windowDays: 2 });
    expect(res).toEqual({ processed: 1, emailed: 0 });
  });

  it('skips sending if deadlineReminderLastSent is same local day', async () => {
    const inWindow = new Date();
    inWindow.setDate(inWindow.getDate() + 1);
    Job.find.mockResolvedValue([{ _id: 'j1', userId: 'u1', title: 'Job 1', company: 'Co', deadline: inWindow }]);

    const today = new Date();
    User.find.mockResolvedValue([{ auth0Id: 'u1', email: 'u1@example.com', name: 'U One', deadlineReminderLastSent: today }]);

    const res = await sendDeadlineRemindersNow({ windowDays: 2 });
    expect(res).toEqual({ processed: 1, emailed: 0 });
  });
});
