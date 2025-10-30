import { jest } from '@jest/globals';

const mockCreateTransport = jest.fn();
const mockNodemailer = {
  createTransport: mockCreateTransport,
};

jest.unstable_mockModule('nodemailer', () => ({ default: mockNodemailer }));

const { sendDeletionEmail, sendFinalDeletionEmail } = await import('../../utils/email.js');

describe('email utility', () => {
  let mockTransporter;
  let originalEnv;
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    };
    
    mockCreateTransport.mockReturnValue(mockTransporter);
    
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('sendDeletionEmail', () => {
    it('should send deletion email successfully', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'password';
      process.env.SMTP_FROM = '"Nirvana" <no-reply@nirvana.com>';

      await sendDeletionEmail('test@example.com', 'Test User');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Nirvana" <no-reply@nirvana.com>',
          to: 'test@example.com',
          subject: expect.stringContaining('Permanently Deleted'),
          text: expect.stringContaining('Test User'),
          html: expect.stringContaining('Test User'),
        })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Deletion confirmation email sent'),
        'test@example.com'
      );
    });

    it('should use default SMTP_FROM if not provided', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      delete process.env.SMTP_FROM;

      await sendDeletionEmail('test@example.com', 'Test User');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Nirvana" <no-reply@nirvanaprofile.com>',
        })
      );
    });

    it('should log to console if SMTP is not configured', async () => {
      delete process.env.SMTP_HOST;

      await sendDeletionEmail('test@example.com', 'Test User');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('SMTP not configured')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MOCK EMAIL]')
      );
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should handle email sending errors', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const error = new Error('SMTP error');
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(sendDeletionEmail('test@example.com', 'Test User')).rejects.toThrow(
        'SMTP error'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send deletion email'),
        'SMTP error'
      );
    });

    it('should include email address in email content', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';

      await sendDeletionEmail('test@example.com', 'Test User');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('test@example.com'),
          html: expect.stringContaining('test@example.com'),
        })
      );
    });

    it('should include deletion timestamp in email content', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';

      await sendDeletionEmail('test@example.com', 'Test User');

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.text).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Date format
      expect(call.html).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle missing user name gracefully', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';

      await sendDeletionEmail('test@example.com', null);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Hello there'),
          html: expect.stringContaining('there'),
        })
      );
    });
  });

  describe('sendFinalDeletionEmail', () => {
    it('should send final deletion email successfully', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';

      await sendFinalDeletionEmail('test@example.com', 'Test User');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Permanently Deleted'),
          text: expect.stringContaining('Test User'),
          html: expect.stringContaining('Test User'),
        })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Final deletion email sent'),
        'test@example.com'
      );
    });

    it('should log to console if SMTP is not configured', async () => {
      delete process.env.SMTP_HOST;

      await sendFinalDeletionEmail('test@example.com', 'Test User');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MOCK EMAIL]')
      );
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should handle email sending errors', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const error = new Error('SMTP error');
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        sendFinalDeletionEmail('test@example.com', 'Test User')
      ).rejects.toThrow('SMTP error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send final deletion email'),
        'SMTP error'
      );
    });
  });

  describe('createTransporter', () => {
    it('should create transporter with correct SMTP configuration', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_SECURE = 'false';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'password';

      await sendDeletionEmail('test@example.com', 'Test User');

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          auth: {
            user: 'user@example.com',
            pass: 'password',
          },
        })
      );
    });

    it('should use default port if not specified', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      delete process.env.SMTP_PORT;

      await sendDeletionEmail('test@example.com', 'Test User');

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 587,
        })
      );
    });

    it('should handle secure connection for port 465', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_SECURE = 'true';

      await sendDeletionEmail('test@example.com', 'Test User');

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: true,
        })
      );
    });

    it('should not include auth if SMTP_USER is not provided', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      delete process.env.SMTP_USER;

      await sendDeletionEmail('test@example.com', 'Test User');

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: undefined,
        })
      );
    });
  });
});
