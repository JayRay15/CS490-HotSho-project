import { jest } from '@jest/globals';

const mockCreateTransport = jest.fn();
const mockNodemailer = {
  createTransport: mockCreateTransport,
};

jest.unstable_mockModule('nodemailer', () => ({ default: mockNodemailer }));

const { sendAccountDeletionEmail } = await import('../../utils/emailService.js');

describe('emailService utility', () => {
  let mockTransporter;
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      EMAIL_USER: 'test@gmail.com',
      EMAIL_PASS: 'test-password',
    };

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    };

    mockCreateTransport.mockReturnValue(mockTransporter);
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendAccountDeletionEmail', () => {
    it('should send account deletion email successfully', async () => {
      await sendAccountDeletionEmail('user@example.com', 'Test User');

      expect(mockCreateTransport).toHaveBeenCalledWith({
        service: 'gmail',
        auth: {
          user: 'test@gmail.com',
          pass: 'test-password',
        },
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@gmail.com',
        to: 'user@example.com',
        subject: 'Your Nirvana Account Has Been Permanently Deleted',
        html: expect.stringContaining('Test User'),
      });
    });

    it('should handle missing user name', async () => {
      await sendAccountDeletionEmail('user@example.com', null);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Hi User'),
        })
      );
    });

    it('should include email address in content', async () => {
      await sendAccountDeletionEmail('user@example.com', 'Test User');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          html: expect.stringContaining('permanently removed'),
        })
      );
    });

    it('should include warning about irreversibility', async () => {
      await sendAccountDeletionEmail('user@example.com', 'Test User');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('cannot be undone'),
        })
      );
    });

    it('should include support contact information', async () => {
      await sendAccountDeletionEmail('user@example.com', 'Test User');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('support@nirvanaprofile.com'),
        })
      );
    });

    it('should throw error if email sending fails', async () => {
      const error = new Error('Email sending failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        sendAccountDeletionEmail('user@example.com', 'Test User')
      ).rejects.toThrow('Email sending failed');
    });
  });
});
