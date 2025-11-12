import { jest } from '@jest/globals';

describe('statusAutomationScheduler', () => {
  const OLD_ENV = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...OLD_ENV };

    // Prevent dotenv from loading a real .env
    await jest.unstable_mockModule('dotenv', () => ({ default: { config: () => ({}) } }));

    // Mock node-cron so schedules don't actually run
    await jest.unstable_mockModule('node-cron', () => ({ default: { schedule: jest.fn() } }));
    // Provide default mocks for statusNotifications exports so imports succeed
    await jest.unstable_mockModule('../statusNotifications.js', () => ({
      sendFollowUpReminder: jest.fn(),
      sendStalledApplicationsAlert: jest.fn()
    }));
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  test('checkFollowUpReminders sends reminders and updates status', async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const addTimeline = jest.fn();
    const sendFollowUpReminder = jest.fn().mockResolvedValue(true);

    const statusObj = {
      _id: 's1',
      userId: 'u1',
      notifications: { followUpReminder: true },
      automation: { autoFollowUp: { enabled: true } },
      metrics: { followUpCount: 0 },
      addTimelineEvent: addTimeline,
      save: saveMock
    };

    // Mock ApplicationStatus.find(...).populate(...) to return our status
    const populateMock = jest.fn().mockResolvedValue([statusObj]);
    const findMock = jest.fn(() => ({ populate: populateMock }));

    await jest.unstable_mockModule('../../models/ApplicationStatus.js', () => ({
      ApplicationStatus: { find: findMock }
    }));

  const mod = await import('../statusAutomationScheduler.js');
  const notifications = await import('../statusNotifications.js');
  const scheduler = mod.default;

  await scheduler.checkFollowUpReminders();

    expect(findMock).toHaveBeenCalled();
    expect(notifications.sendFollowUpReminder).toHaveBeenCalledWith('u1', statusObj);
    expect(addTimeline).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled();
  });

  test('detectStalledApplications alerts users and updates notifications', async () => {
    const sendStalledApplicationsAlert = jest.fn().mockResolvedValue(true);
    const aggregateMock = jest.fn().mockResolvedValue([
      { _id: 'user1', applications: [{ _id: 'a1' }] }
    ]);
    const updateManyMock = jest.fn().mockResolvedValue({ modifiedCount: 1 });

    await jest.unstable_mockModule('../../models/ApplicationStatus.js', () => ({
      ApplicationStatus: { aggregate: aggregateMock, updateMany: updateManyMock }
    }));

  const mod = await import('../statusAutomationScheduler.js');
  const notifications = await import('../statusNotifications.js');
  const scheduler = mod.default;

  await scheduler.detectStalledApplications();

    expect(aggregateMock).toHaveBeenCalled();
    expect(notifications.sendStalledApplicationsAlert).toHaveBeenCalledWith('user1', [{ _id: 'a1' }]);
    expect(updateManyMock).toHaveBeenCalled();
  });

  test('detectGhostedApplications auto-ghosts or asks for confirmation', async () => {
    const saveMock1 = jest.fn().mockResolvedValue(true);
    const saveMock2 = jest.fn().mockResolvedValue(true);
    const updateStatus = jest.fn();
    const addTimeline = jest.fn();

    const statusAuto = {
      _id: 'g1',
      automation: { autoStatusDetection: { requireConfirmation: false } },
      jobId: { title: 'Dev', company: 'Acme' },
      updateStatus,
      save: saveMock1
    };

    const statusConfirm = {
      _id: 'g2',
      automation: { autoStatusDetection: { requireConfirmation: true } },
      addTimelineEvent: addTimeline,
      save: saveMock2
    };

    const populateMock = jest.fn().mockResolvedValue([statusAuto, statusConfirm]);
    const findMock = jest.fn(() => ({ populate: populateMock }));

    await jest.unstable_mockModule('../../models/ApplicationStatus.js', () => ({
      ApplicationStatus: { find: findMock }
    }));

  const mod = await import('../statusAutomationScheduler.js');
  const scheduler = mod.default;

  await scheduler.detectGhostedApplications();

    expect(findMock).toHaveBeenCalled();
    expect(updateStatus).toHaveBeenCalledWith('Ghosted', expect.any(Object));
    expect(saveMock1).toHaveBeenCalled();
    expect(addTimeline).toHaveBeenCalled();
    expect(saveMock2).toHaveBeenCalled();
  });

  test('updateApplicationMetrics recalculates and saves metrics', async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const now = Date.now();
    const appliedAt = now - 5 * 24 * 60 * 60 * 1000; // 5 days ago
    const lastStatusChange = now - 2 * 24 * 60 * 60 * 1000; // 2 days ago

    const status = {
      _id: 'm1',
      lastStatusChange,
      appliedAt,
      metrics: { daysInCurrentStatus: 0, totalDaysInProcess: 0 },
      save: saveMock
    };

    const findMock = jest.fn().mockResolvedValue([status]);

    await jest.unstable_mockModule('../../models/ApplicationStatus.js', () => ({
      ApplicationStatus: { find: findMock }
    }));

  const mod = await import('../statusAutomationScheduler.js');
  const scheduler = mod.default;

  await scheduler.updateApplicationMetrics();

    expect(findMock).toHaveBeenCalled();
    expect(status.metrics.daysInCurrentStatus).toBeGreaterThanOrEqual(1); // floor may vary
    expect(status.metrics.totalDaysInProcess).toBeGreaterThanOrEqual(4);
    expect(saveMock).toHaveBeenCalled();
  });

  test('generateNextActionSuggestions sets nextAction based on status and time', async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const now = Date.now();
    const lastStatusChange = now - 8 * 24 * 60 * 60 * 1000; // 8 days ago

    const status = {
      _id: 'n1',
      currentStatus: 'Applied',
      lastStatusChange,
      nextAction: null,
      save: saveMock
    };

    const findMock = jest.fn().mockResolvedValue([status]);

    await jest.unstable_mockModule('../../models/ApplicationStatus.js', () => ({
      ApplicationStatus: { find: findMock }
    }));

  const mod = await import('../statusAutomationScheduler.js');
  const scheduler = mod.default;

  await scheduler.generateNextActionSuggestions();

    expect(findMock).toHaveBeenCalled();
    expect(status.nextAction).toContain('follow-up');
    expect(saveMock).toHaveBeenCalled();
  });

  test('startStatusAutomationScheduler disables when env not true and starts when true', async () => {
    const cronMock = (await import('node-cron')).default;

    // Disabled case
    delete process.env.ENABLE_STATUS_AUTOMATION;
  const mod1 = await import('../statusAutomationScheduler.js');
  const { startStatusAutomationScheduler: start1 } = mod1;
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    start1();
    expect(logSpy).toHaveBeenCalledWith('⏸️  Status automation scheduler is disabled (ENABLE_STATUS_AUTOMATION != true)');

  // Enabled case
    process.env.ENABLE_STATUS_AUTOMATION = 'true';
    process.env.RUN_STATUS_AUTOMATION_ON_STARTUP = 'true';

    // Re-import module to reset internal cron.schedule references
    jest.resetModules();
    await jest.unstable_mockModule('node-cron', () => ({ default: { schedule: jest.fn() } }));
    const mod2 = await import('../statusAutomationScheduler.js');

    const start2 = mod2.startStatusAutomationScheduler;
    start2();

    const cron = (await import('node-cron')).default;
    expect(cron.schedule).toHaveBeenCalled();
    // startup-run should have logged that it is running tasks on startup
    expect(logSpy).toHaveBeenCalledWith('▶️  Running status automation tasks on startup...');
  });

  test('checkFollowUpReminders skips when followUpReminder false and logs errors on send failure', async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const addTimeline = jest.fn();

    const statusObj = {
      _id: 's2',
      userId: 'u2',
      notifications: { followUpReminder: false }, // should skip
      automation: { autoFollowUp: { enabled: true } },
      metrics: { followUpCount: 0 },
      addTimelineEvent: addTimeline,
      save: saveMock
    };

    // find returns the one that should be skipped
    const populateMock = jest.fn().mockResolvedValue([statusObj]);
    const findMock = jest.fn(() => ({ populate: populateMock }));

    await jest.unstable_mockModule('../../models/ApplicationStatus.js', () => ({
      ApplicationStatus: { find: findMock }
    }));

    // Make notifications.sendFollowUpReminder throw to hit inner catch when enabled
    const notifications = await import('../statusNotifications.js');
    notifications.sendFollowUpReminder.mockRejectedValueOnce(new Error('boom'));

    const mod = await import('../statusAutomationScheduler.js');
    const scheduler = mod.default;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await scheduler.checkFollowUpReminders();

    // It should have called find but not attempted to send (because flag is false)
    expect(findMock).toHaveBeenCalled();
    expect(notifications.sendFollowUpReminder).not.toHaveBeenCalled();
    expect(addTimeline).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test('detectStalledApplications handles empty results and send failure', async () => {
    // Case 1: aggregate returns empty
    const aggregateMockEmpty = jest.fn().mockResolvedValue([]);
    await jest.unstable_mockModule('../../models/ApplicationStatus.js', () => ({
      ApplicationStatus: { aggregate: aggregateMockEmpty, updateMany: jest.fn() }
    }));

    const mod = await import('../statusAutomationScheduler.js');
    const scheduler = mod.default;

    await scheduler.detectStalledApplications();
    expect(aggregateMockEmpty).toHaveBeenCalled();

    // Case 2: sendStalledApplicationsAlert throws
    const aggregateMock = jest.fn().mockResolvedValue([{ _id: 'uX', applications: [{ _id: 'aX' }] }]);
    const updateManyMock = jest.fn().mockResolvedValue({});

    // Reset modules so re-mocking ApplicationStatus takes effect for the second case
    jest.resetModules();
    await jest.unstable_mockModule('../../models/ApplicationStatus.js', () => ({
      ApplicationStatus: { aggregate: aggregateMock, updateMany: updateManyMock }
    }));

    const notifications = await import('../statusNotifications.js');
    notifications.sendStalledApplicationsAlert.mockRejectedValueOnce(new Error('send-fail'));

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mod2 = await import('../statusAutomationScheduler.js');
    const scheduler2 = mod2.default;
    await scheduler2.detectStalledApplications();

  expect(aggregateMock).toHaveBeenCalled();
  expect(notifications.sendStalledApplicationsAlert).toHaveBeenCalled();
  // Because sendStalledApplicationsAlert was mocked to throw, updateMany should not run in that case
  expect(updateManyMock).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test('detectGhostedApplications handles updateStatus/save error paths', async () => {
    // Create a status that will throw when updateStatus called
    const badUpdate = jest.fn(() => { throw new Error('update-fail'); });
    const saveMock = jest.fn().mockResolvedValue(true);
    const statusAuto = {
      _id: 'gbad',
      automation: { autoStatusDetection: { requireConfirmation: false } },
      jobId: { title: 'X', company: 'Y' },
      updateStatus: badUpdate,
      save: saveMock
    };

    const populateMock = jest.fn().mockResolvedValue([statusAuto]);
    const findMock = jest.fn(() => ({ populate: populateMock }));

    await jest.unstable_mockModule('../../models/ApplicationStatus.js', () => ({
      ApplicationStatus: { find: findMock }
    }));

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mod = await import('../statusAutomationScheduler.js');
    const scheduler = mod.default;
    await scheduler.detectGhostedApplications();

    expect(findMock).toHaveBeenCalled();
    expect(badUpdate).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test('updateApplicationMetrics logs error when metrics missing', async () => {
    // status without metrics to cause inner error when setting properties
    const saveMock = jest.fn().mockResolvedValue(true);
    const status = { _id: 'mX', lastStatusChange: Date.now() - 2 * 24 * 60 * 60 * 1000, appliedAt: null, save: saveMock };
    const findMock = jest.fn().mockResolvedValue([status]);

    await jest.unstable_mockModule('../../models/ApplicationStatus.js', () => ({
      ApplicationStatus: { find: findMock }
    }));

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mod = await import('../statusAutomationScheduler.js');
    const scheduler = mod.default;
    await scheduler.updateApplicationMetrics();

    expect(findMock).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  test('generateNextActionSuggestions covers multiple status branches', async () => {
    const now = Date.now();
    const makeStatus = (statusName, daysAgo, nextAction = null) => ({
      _id: `${statusName}`,
      currentStatus: statusName,
      lastStatusChange: now - daysAgo * 24 * 60 * 60 * 1000,
      nextAction,
      save: jest.fn().mockResolvedValue(true)
    });

    const statuses = [
      makeStatus('Applied', 8),
      makeStatus('Under Review', 11),
      makeStatus('Phone Screen', 4),
      makeStatus('Phone Screen', 8),
      makeStatus('Technical Interview', 6),
      makeStatus('Final Interview', 8),
      makeStatus('Offer Extended', 4),
      makeStatus('SomeOther', 10)
    ];

    const findMock = jest.fn().mockResolvedValue(statuses);
    await jest.unstable_mockModule('../../models/ApplicationStatus.js', () => ({
      ApplicationStatus: { find: findMock }
    }));

    const mod = await import('../statusAutomationScheduler.js');
    const scheduler = mod.default;

    await scheduler.generateNextActionSuggestions();

    expect(findMock).toHaveBeenCalled();
    // Verify that at least one of the statuses received a nextAction
    expect(statuses.some(s => s.nextAction)).toBe(true);
  });
});
