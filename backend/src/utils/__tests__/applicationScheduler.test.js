import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// We'll use ESM module mocking helpers to ensure mocks are in place before the
// module under test is imported (it constructs the transporter at module scope).
const mockCreateTransport = jest.fn();
const mockSendMail = jest.fn(() => Promise.resolve());
mockCreateTransport.mockReturnValue({ sendMail: mockSendMail });

// node-cron mock
const mockSchedule = jest.fn();

// Model mocks (we will set find implementations per-test)
const mockApplicationPackage = {
  find: jest.fn()
};

const mockJobModel = {
  findByIdAndUpdate: jest.fn(() => Promise.resolve())
};

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  jest.resetModules();
  // ensure env is reset between tests
  process.env = { ...ORIGINAL_ENV };
  mockSendMail.mockClear();
  mockSchedule.mockClear();
  mockApplicationPackage.find.mockReset();
  mockJobModel.findByIdAndUpdate.mockClear();
});

afterAll(() => {
  // restore environment and clear module registry so other tests are unaffected
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
});

describe('applicationScheduler', () => {
  it('does not start when ENABLE_APPLICATION_SCHEDULER is not true', async () => {
    process.env.ENABLE_APPLICATION_SCHEDULER = 'false';

  // Provide mocks before importing the module under test
  jest.unstable_mockModule('../../models/ApplicationPackage', () => ({ ApplicationPackage: mockApplicationPackage }));
  jest.unstable_mockModule('../../models/Job', () => ({ Job: mockJobModel }));
  jest.unstable_mockModule('nodemailer', () => ({ default: { createTransport: mockCreateTransport } }));
  jest.unstable_mockModule('node-cron', () => ({ default: { schedule: mockSchedule } }));

    const { startApplicationScheduler } = await import('../applicationScheduler.js');

    startApplicationScheduler();

    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('processes scheduled applications on startup and sends email when autoSubmit true', async () => {
    process.env.ENABLE_APPLICATION_SCHEDULER = 'true';
    process.env.RUN_SCHEDULER_ON_STARTUP = 'true';
    process.env.SMTP_USER = 'test@example.com';

    // Build a fake package returned from the chained populate() call
    const now = new Date();
    const user = { email: 'user@example.com', name: 'Test User' };
    const job = { _id: 'job1', title: 'Dev', company: 'Acme' };

    const fakePkg = {
      _id: 'pkg1',
      status: 'scheduled',
      scheduledFor: new Date(now.getTime() - 1000),
      metadata: { autoSubmit: true, applicationUrl: 'https://apply' },
      jobId: job,
      userId: user,
      save: jest.fn(() => Promise.resolve())
    };

    // mock find().populate().populate() chain
  mockApplicationPackage.find.mockImplementation(() => ({ populate: () => ({ populate: () => Promise.resolve([fakePkg]) }) }));

  jest.unstable_mockModule('../../models/ApplicationPackage', () => ({ ApplicationPackage: mockApplicationPackage }));
  jest.unstable_mockModule('../../models/Job', () => ({ Job: mockJobModel }));
  jest.unstable_mockModule('nodemailer', () => ({ default: { createTransport: mockCreateTransport } }));
  jest.unstable_mockModule('node-cron', () => ({ default: { schedule: mockSchedule } }));

    const { startApplicationScheduler } = await import('../applicationScheduler.js');

    startApplicationScheduler();

    // Because RUN_SCHEDULER_ON_STARTUP triggers an immediate call, ensure save and sendMail were used
    // wait a tick for async processing
    await new Promise(r => setImmediate(r));

    expect(fakePkg.save).toHaveBeenCalled();
    expect(mockJobModel.findByIdAndUpdate).toHaveBeenCalledWith(job._id, expect.objectContaining({ status: 'Applied' }));
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('sends follow-up reminders and marks packages as followed up', async () => {
    process.env.ENABLE_FOLLOWUP_SCHEDULER = 'true';
    process.env.RUN_SCHEDULER_ON_STARTUP = 'true';
    process.env.SMTP_USER = 'test@example.com';

    const now = new Date();
    const submittedAt = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000); // 8 days ago

    const user = { email: 'follow@example.com', name: 'Follow Up' };
    const job = { _id: 'job2', title: 'QA', company: 'Beta' };

    const pkg = {
      _id: 'pkg2',
      status: 'submitted',
      submittedAt,
      metadata: {},
      jobId: job,
      userId: user,
      save: jest.fn(() => Promise.resolve())
    };

  mockApplicationPackage.find.mockImplementation(() => ({ populate: () => ({ populate: () => Promise.resolve([pkg]) }) }));

  jest.unstable_mockModule('../../models/ApplicationPackage', () => ({ ApplicationPackage: mockApplicationPackage }));
  jest.unstable_mockModule('../../models/Job', () => ({ Job: mockJobModel }));
  jest.unstable_mockModule('nodemailer', () => ({ default: { createTransport: mockCreateTransport } }));
  jest.unstable_mockModule('node-cron', () => ({ default: { schedule: mockSchedule } }));

    const { startFollowUpScheduler } = await import('../applicationScheduler.js');

    startFollowUpScheduler();

    // wait a tick for async work
    await new Promise(r => setImmediate(r));

    expect(mockSendMail).toHaveBeenCalled();
    expect(pkg.metadata.followUpSent).toBe(true);
    expect(pkg.save).toHaveBeenCalled();
  });
});
