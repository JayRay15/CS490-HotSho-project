import { jest } from '@jest/globals';

describe('statusNotifications', () => {
  let sendMailMock;
  let createTransportMock;
  let findOneMock;
  const OLD_ENV = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...OLD_ENV };

    sendMailMock = jest.fn().mockResolvedValue({ messageId: 'ok' });
    createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));
    findOneMock = jest.fn();

    // Mock dotenv so it doesn't inject a real .env during tests
    await jest.unstable_mockModule('dotenv', () => ({
      default: { config: () => ({}) }
    }));

    // Mock nodemailer and User model before importing the module
    await jest.unstable_mockModule('nodemailer', () => ({
      default: { createTransport: createTransportMock }
    }));

    await jest.unstable_mockModule('../../models/User.js', () => ({
      User: { findOne: findOneMock }
    }));
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  test('skips sending when SMTP not configured', async () => {
    // Ensure SMTP_USER is not set
    delete process.env.SMTP_USER;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const mod = await import('../statusNotifications.js');
    const { sendStatusChangeNotification } = mod;

    const appStatus = { populate: jest.fn().mockResolvedValue(undefined) };

    await sendStatusChangeNotification('user123', appStatus, 'user');

    expect(consoleSpy).toHaveBeenCalledWith('[Status Notifications] SMTP not configured, skipping email');
    expect(createTransportMock).toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  test('does not send when user not found', async () => {
    process.env.SMTP_USER = 'yes';
    findOneMock.mockResolvedValue(null);

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const mod = await import('../statusNotifications.js');
    const { sendStatusChangeNotification } = mod;

    const appStatus = { populate: jest.fn().mockResolvedValue(undefined) };

    await sendStatusChangeNotification('user123', appStatus, 'user');

    expect(findOneMock).toHaveBeenCalledWith({ auth0Id: 'user123' });
    expect(consoleSpy).toHaveBeenCalledWith('[Status Notifications] User email not found');
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  test('sends status change notification with expected subject and html', async () => {
    process.env.SMTP_USER = 'yes';
    findOneMock.mockResolvedValue({ email: 'tester@example.com', name: 'Tester' });

    const mod = await import('../statusNotifications.js');
    const { sendStatusChangeNotification } = mod;

    const applicationStatus = {
      populate: jest.fn().mockResolvedValue(undefined),
      jobId: { title: 'Developer', company: 'Acme', url: 'http://acme' },
      statusHistory: [
        { previousStatus: 'Applied', status: 'Phone Screen', notes: 'Great interview', sourceEmail: { from: 'hr@acme.com', subject: 'Interview' } }
      ],
      metrics: { daysInCurrentStatus: 5, totalDaysInProcess: 12 },
      responseTime: 3
    };

    await sendStatusChangeNotification('user123', applicationStatus, 'email-detection');

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const args = sendMailMock.mock.calls[0][0];
    expect(args.to).toBe('tester@example.com');
    expect(args.subject).toContain('Developer');
    expect(args.subject).toContain('Acme');
    expect(args.html).toContain('Auto-detected from email');
    expect(args.html).toContain('Great interview');
  });

  test('sendFollowUpReminder sends when configured', async () => {
    process.env.SMTP_USER = 'yes';
    findOneMock.mockResolvedValue({ email: 'follow@example.com', name: 'Follower' });

    const mod = await import('../statusNotifications.js');
    const { sendFollowUpReminder } = mod;

    const applicationStatus = {
      populate: jest.fn().mockResolvedValue(undefined),
      jobId: { title: 'Engineer', company: 'Globex', url: '' },
      daysSinceStatusChange: 15,
      currentStatus: 'Applied'
    };

    await sendFollowUpReminder('user123', applicationStatus);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const args = sendMailMock.mock.calls[0][0];
    expect(args.to).toBe('follow@example.com');
    expect(args.subject).toContain('Follow up');
    expect(args.html).toContain('Follow-Up Reminder');
    expect(args.html).toContain('Suggested Action');
  });

  test('sendStalledApplicationsAlert skips when empty or SMTP not set', async () => {
    // Case 1: SMTP not set
    delete process.env.SMTP_USER;
    const mod1 = await import('../statusNotifications.js');
    const { sendStalledApplicationsAlert: skip1 } = mod1;
    await skip1('userX', []);
    expect(sendMailMock).not.toHaveBeenCalled();

    // Case 2: empty list even if SMTP set
    process.env.SMTP_USER = 'yes';
    findOneMock.mockResolvedValue({ email: 's@example.com' });
    const mod2 = await import('../statusNotifications.js');
    const { sendStalledApplicationsAlert: skip2 } = mod2;
    await skip2('userX', []);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  test('sendStalledApplicationsAlert sends when there are stalled apps', async () => {
    process.env.SMTP_USER = 'yes';
    findOneMock.mockResolvedValue({ email: 'alert@example.com' });

    const mod = await import('../statusNotifications.js');
    const { sendStalledApplicationsAlert } = mod;

    const stalled = [
      { jobId: { title: 'Dev', company: 'Acme' }, currentStatus: 'Applied', daysSinceStatusChange: 20 }
    ];

    await sendStalledApplicationsAlert('user123', stalled);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const args = sendMailMock.mock.calls[0][0];
    expect(args.to).toBe('alert@example.com');
    expect(args.subject).toContain('Stalled');
    expect(args.html).toContain('⚠️ Stalled Applications Alert');
  });

  test('errors in transporter are logged', async () => {
    process.env.SMTP_USER = 'yes';
    findOneMock.mockResolvedValue({ email: 'err@example.com' });
    sendMailMock = jest.fn().mockRejectedValue(new Error('smtp fail'));
    createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));

    // re-mock nodemailer with failing sendMail
    await jest.unstable_mockModule('nodemailer', () => ({
      default: { createTransport: createTransportMock }
    }));

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mod = await import('../statusNotifications.js');
    const { sendStalledApplicationsAlert } = mod;

    const stalled = [
      { jobId: { title: 'Dev', company: 'Acme' }, currentStatus: 'Applied', daysSinceStatusChange: 20 }
    ];

    await sendStalledApplicationsAlert('user123', stalled);

    expect(errorSpy).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalled();
  });
});
