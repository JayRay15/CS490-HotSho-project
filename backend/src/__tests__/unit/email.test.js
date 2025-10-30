import { sendDeletionEmail, sendFinalDeletionEmail } from '../../utils/email.js';

describe('Email Utility Tests', () => {
  let originalLog, originalWarn, originalError;
  let logCalls = [];
  let warnCalls = [];

  beforeAll(() => {
    // Save original console methods
    originalLog = console.log;
    originalWarn = console.warn;
    originalError = console.error;
    
    // Mock console methods
    console.log = (...args) => {
      logCalls.push(args.join(' '));
    };
    console.warn = (...args) => {
      warnCalls.push(args.join(' '));
    };
    console.error = (...args) => {};
  });

  afterAll(() => {
    // Restore original console methods
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  });

  beforeEach(() => {
    logCalls = [];
    warnCalls = [];
    // Ensure SMTP is not configured for testing
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
    delete process.env.SMTP_SECURE;
  });

  describe('sendDeletionEmail', () => {
    test('should log warning when SMTP not configured', async () => {
      const toEmail = 'test@example.com';
      const fullName = 'Test User';
      const deletionDate = new Date('2024-12-31');

      await sendDeletionEmail(toEmail, fullName, deletionDate);

      expect(warnCalls.some(call => call.includes('SMTP not configured'))).toBe(true);
      expect(logCalls.some(call => call.includes('[MOCK EMAIL] Account Deletion Scheduled'))).toBe(true);
    });

    test('should include user email in mock email output', async () => {
      const toEmail = 'user@test.com';
      const fullName = 'John Doe';
      const deletionDate = new Date('2025-01-15');

      await sendDeletionEmail(toEmail, fullName, deletionDate);

      expect(logCalls.some(call => call.includes(`To: ${toEmail}`))).toBe(true);
    });

    test('should include deletion date in mock email output', async () => {
      const toEmail = 'test@example.com';
      const fullName = 'Test User';
      const deletionDate = new Date('2024-12-31');

      await sendDeletionEmail(toEmail, fullName, deletionDate);

      expect(logCalls.some(call => call.includes('Deletion Date'))).toBe(true);
    });

    test('should handle missing fullName gracefully', async () => {
      const toEmail = 'test@example.com';
      const deletionDate = new Date('2024-12-31');

      await sendDeletionEmail(toEmail, null, deletionDate);

      expect(logCalls.length).toBeGreaterThan(0);
      // Should not throw error
    });

    test('should include subject line in mock email', async () => {
      const toEmail = 'test@example.com';
      const fullName = 'Test User';
      const deletionDate = new Date('2024-12-31');

      await sendDeletionEmail(toEmail, fullName, deletionDate);

      expect(logCalls.some(call => call.includes('Subject:'))).toBe(true);
    });

    test('should include text content in mock email', async () => {
      const toEmail = 'test@example.com';
      const fullName = 'Test User';
      const deletionDate = new Date('2024-12-31');

      await sendDeletionEmail(toEmail, fullName, deletionDate);

      expect(logCalls.some(call => call.includes('Text Content'))).toBe(true);
    });

    test('should format deletion date properly', async () => {
      const toEmail = 'test@example.com';
      const fullName = 'Test User';
      const deletionDate = new Date('2024-12-25');

      await sendDeletionEmail(toEmail, fullName, deletionDate);

      // Date should be in the output
      const calls = logCalls.join(' ');
      expect(calls).toContain('2024');
    });

    test('should include 30-day grace period information', async () => {
      const toEmail = 'test@example.com';
      const fullName = 'Test User';
      const deletionDate = new Date('2024-12-31');

      await sendDeletionEmail(toEmail, fullName, deletionDate);

      const calls = logCalls.join(' ');
      expect(calls).toContain('30');
    });
  });

  describe('sendFinalDeletionEmail', () => {
    test('should log warning when SMTP not configured', async () => {
      const toEmail = 'test@example.com';
      const fullName = 'Test User';

      await sendFinalDeletionEmail(toEmail, fullName);

      expect(warnCalls.some(call => call.includes('SMTP not configured'))).toBe(true);
      expect(logCalls.some(call => call.includes('[MOCK EMAIL] Account Permanently Deleted'))).toBe(true);
    });

    test('should include user email in mock email output', async () => {
      const toEmail = 'final@test.com';
      const fullName = 'Jane Smith';

      await sendFinalDeletionEmail(toEmail, fullName);

      expect(logCalls.some(call => call.includes(`To: ${toEmail}`))).toBe(true);
    });

    test('should include subject line in mock email', async () => {
      const toEmail = 'test@example.com';
      const fullName = 'Test User';

      await sendFinalDeletionEmail(toEmail, fullName);

      expect(logCalls.some(call => call.includes('Subject:'))).toBe(true);
    });

    test('should handle missing fullName gracefully', async () => {
      const toEmail = 'test@example.com';

      await sendFinalDeletionEmail(toEmail, null);

      expect(logCalls.length).toBeGreaterThan(0);
      // Should not throw error
    });

    test('should include text content in mock email', async () => {
      const toEmail = 'test@example.com';
      const fullName = 'Test User';

      await sendFinalDeletionEmail(toEmail, fullName);

      expect(logCalls.some(call => call.includes('Text Content'))).toBe(true);
    });

    test('should include permanence warning', async () => {
      const toEmail = 'test@example.com';
      const fullName = 'Test User';

      await sendFinalDeletionEmail(toEmail, fullName);

      const calls = logCalls.join(' ');
      expect(calls.toLowerCase()).toContain('permanent');
    });

    test('should include current date', async () => {
      const toEmail = 'test@example.com';
      const fullName = 'Test User';

      await sendFinalDeletionEmail(toEmail, fullName);

      const calls = logCalls.join(' ');
      const currentYear = new Date().getFullYear().toString();
      expect(calls).toContain(currentYear);
    });
  });

  describe('SMTP Configuration', () => {
    test('should not call transporter when SMTP_HOST is missing', async () => {
      const toEmail = 'test@example.com';
      const fullName = 'Test User';
      const deletionDate = new Date('2024-12-31');

      // This should use mock/console output, not attempt SMTP
      await sendDeletionEmail(toEmail, fullName, deletionDate);

      expect(warnCalls.length).toBeGreaterThan(0);
      expect(logCalls.length).toBeGreaterThan(0);
    });

    test('should warn about missing SMTP configuration', async () => {
      const toEmail = 'test@example.com';
      const fullName = 'Test User';

      await sendFinalDeletionEmail(toEmail, fullName);

      expect(warnCalls.some(call => call.includes('SMTP not configured'))).toBe(true);
    });
  });
});


