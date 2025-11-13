import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mocks for models and email helper
jest.mock('../../models/Interview.js', () => ({
  Interview: {
    find: jest.fn(),
  },
}));

jest.mock('../../models/User.js', () => ({
  User: {
    findOne: jest.fn(),
  },
}));

jest.mock('../email.js', () => ({
  sendInterviewReminderEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({ stop: jest.fn() })),
}));

import { Interview } from '../../models/Interview.js';
import { User } from '../../models/User.js';
import * as email from '../email.js';

import * as reminders from '../../utils/interviewReminders.js';

describe('interviewReminders util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure deterministic logs don't interfere
    jest.spyOn(global.console, 'log').mockImplementation(() => {});
    jest.spyOn(global.console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sendInterviewRemindersNow handles already-sent, missing user, and sends one reminder', async () => {
    const now = new Date();

    // Prepare three calls to Interview.find().populate() (one per threshold)
    const interviewAlready = {
      _id: 'i-already',
      reminders: { remindersSent: [{ type: '24h', sentAt: now.toISOString() }] },
      userId: 'user-1',
    };

    const interviewNoUser = {
      _id: 'i-nouser',
      reminders: { remindersSent: [] },
      userId: 'user-missing',
    };

    const interviewToSend = {
      _id: 'i-send',
      reminders: { remindersSent: [] },
      userId: 'user-2',
      title: 'Interview Title',
      save: jest.fn().mockResolvedValue(true),
    };

    // Mock Interview.find(...).populate(...) to return different arrays across calls
    const populateMock = jest
      .fn()
      .mockResolvedValueOnce([interviewAlready])
      .mockResolvedValueOnce([interviewNoUser])
      .mockResolvedValueOnce([interviewToSend]);

    Interview.find = jest.fn(() => ({ populate: populateMock }));

    // User.findOne returns null for missing user, and a user object for user-2
    User.findOne = jest.fn(({ auth0Id }) => {
      if (auth0Id === 'user-2') return Promise.resolve({ email: 'u2@example.com', name: 'U2' });
      return Promise.resolve(null);
    });

  // sendInterviewReminderEmail is mocked at module-level to resolve

    const res = await reminders.sendInterviewRemindersNow();

    expect(res.success).toBe(true);
    // Only one reminder should have been sent (third interview)
    expect(res.remindersSent).toBe(1);
    // Ensure interview.save was called for the sent interview
    expect(interviewToSend.save).toHaveBeenCalled();
  });

  test('startInterviewReminderSchedule respects env flags', async () => {
    const origEnabled = process.env.INTERVIEW_REMINDERS_ENABLED;
    const origRunStartup = process.env.RUN_REMINDERS_ON_STARTUP;

    process.env.INTERVIEW_REMINDERS_ENABLED = 'false';
    const disabled = reminders.startInterviewReminderSchedule();
    expect(disabled).toBeNull();

    process.env.INTERVIEW_REMINDERS_ENABLED = 'true';
    process.env.RUN_REMINDERS_ON_STARTUP = 'true';

  // Restore console mocks so we can observe the startup log
  jest.restoreAllMocks();
  const logMock = jest.spyOn(global.console, 'log').mockImplementation(() => {});

  const task = reminders.startInterviewReminderSchedule();
  expect(task).not.toBeNull();
  expect(typeof task).toBe('object');
  // Should have logged that it's running an initial check on startup
  expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Running initial interview reminder check'));

    // restore env
    process.env.INTERVIEW_REMINDERS_ENABLED = origEnabled;
    process.env.RUN_REMINDERS_ON_STARTUP = origRunStartup;
  });

  test('checkForConflicts applies exclude filter and returns results', async () => {
    const fakeConflicts = [ { _id: 'c1' } ];
  Interview.find = jest.fn(() => ({ populate: jest.fn(() => ({ sort: jest.fn().mockResolvedValue(fakeConflicts) })) }));

    const res = await reminders.checkForConflicts('user-123', new Date(), 30, 'exclude-id');
    // Should return the mocked conflicts
    expect(res).toEqual(fakeConflicts);
    // Ensure Interview.find was called with a filter that includes _id: { $ne: 'exclude-id' }
    const lastCallArgs = Interview.find.mock.calls[0][0];
    expect(lastCallArgs._id).toBeDefined();
    expect(lastCallArgs._id.$ne).toBe('exclude-id');
  });

  test('getUpcomingInterviewSummary groups and computes stats', async () => {
    const now = new Date();
    const later = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const interviews = [
      {
        _id: 's1',
        userId: 'u1',
        scheduledDate: now.toISOString(),
        interviewType: 'Phone',
        status: 'Scheduled',
        preparationTasks: [ { completed: false }, { completed: true } ],
        conflictWarning: { hasConflict: true },
      },
      {
        _id: 's2',
        userId: 'u1',
        scheduledDate: later.toISOString(),
        interviewType: 'Onsite',
        status: 'Confirmed',
        preparationTasks: [],
        conflictWarning: { hasConflict: false },
      },
    ];

  Interview.find = jest.fn(() => ({ populate: jest.fn(() => ({ sort: jest.fn().mockResolvedValue(interviews) })) }));

    const summary = await reminders.getUpcomingInterviewSummary('u1', 7);

    expect(summary.interviews.length).toBe(2);
    expect(Object.keys(summary.byDay).length).toBeGreaterThanOrEqual(1);
    expect(summary.stats.total).toBe(2);
    expect(summary.stats.byType['Phone'] || summary.stats.byType['Onsite']).toBeDefined();
    expect(summary.stats.withIncompleteTasks).toBe(1);
    expect(summary.stats.withConflicts).toBe(1);
  });
});
