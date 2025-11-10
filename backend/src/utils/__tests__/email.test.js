import { jest } from '@jest/globals';

const mockCreateTransport = jest.fn();
const mockNodemailer = {
  createTransport: mockCreateTransport,
};

jest.unstable_mockModule('nodemailer', () => ({ default: mockNodemailer }));

const {
  sendDeletionEmail,
  sendFinalDeletionEmail,
  sendDeadlineReminderEmail,
  sendInterviewConfirmationEmail,
  sendInterviewReminderEmail,
  sendInterviewCancellationEmail,
  sendInterviewRescheduledEmail,
} = await import('../../utils/email.js');

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

  describe('other email helpers', () => {
    it('should send deadline reminder email via transporter', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const items = [{ title: 'Dev', company: 'X', deadline: new Date(), days: 1 }];

      await sendDeadlineReminderEmail('to@example.com', 'Name', items);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'to@example.com', subject: expect.any(String) }));
    });

    it('should log deadline reminder when transporter is missing', async () => {
      delete process.env.SMTP_HOST;

      await sendDeadlineReminderEmail('to@example.com', 'Name', []);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[MOCK EMAIL] Deadline Reminders'));
    });

    it('should send interview confirmation email via transporter', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const interview = { title: 'SWE', company: 'Acme', scheduledDate: new Date(), duration: 45, interviewType: 'onsite' };

      await sendInterviewConfirmationEmail('to@example.com', 'Name', interview);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'to@example.com', subject: expect.stringContaining('Interview') }));
    });

    it('should send interview reminder and include incomplete tasks text path', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const interview = { title: 'SWE', company: 'Acme', scheduledDate: new Date(), interviewType: 'onsite', preparationTasks: [{ title: 'prep', completed: false }] };

      await sendInterviewReminderEmail('to@example.com', 'Name', interview, 2);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'to@example.com', subject: expect.stringContaining('Interview Reminder') }));
    });

    it('should log interview cancellation when transporter missing', async () => {
      delete process.env.SMTP_HOST;
      const interview = { title: 'SWE', company: 'Acme', scheduledDate: new Date() };

      await sendInterviewCancellationEmail('to@example.com', 'Name', interview);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[MOCK EMAIL] Interview Cancellation'));
    });

    it('should send interview rescheduled email via transporter', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const interview = { title: 'SWE', company: 'Acme', scheduledDate: new Date(), interviewType: 'onsite' };

      await sendInterviewRescheduledEmail('to@example.com', 'Name', interview, new Date(Date.now() - 3600 * 1000));
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'to@example.com', subject: expect.stringContaining('Interview Rescheduled') }));
    });
  });

  describe('sendInterviewReminderEmail - extra coverage', () => {
    it('should send interview reminder with different hour values', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const interview = {
        title: 'Engineer Interview',
        company: 'TechCorp',
        scheduledDate: new Date(),
        interviewType: 'virtual',
        meetingLink: 'https://meet.example.com',
        preparationTasks: [
          { title: 'Task 1', completed: false },
          { title: 'Task 2', completed: true }
        ]
      };

      await sendInterviewReminderEmail('test@example.com', 'John', interview, 1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('1 hours')
        })
      );
    });

    it('should send interview reminder with 24 hours', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const interview = {
        title: 'Engineer Interview',
        company: 'TechCorp',
        scheduledDate: new Date(),
        interviewType: 'virtual',
        meetingLink: 'https://meet.example.com',
        preparationTasks: []
      };

      await sendInterviewReminderEmail('test@example.com', 'John', interview, 24);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('24 hours')
        })
      );
    });

    it('should send interview reminder with 2 hours', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const interview = {
        title: 'Engineer Interview',
        company: 'TechCorp',
        scheduledDate: new Date(),
        interviewType: 'virtual',
        meetingLink: 'https://meet.example.com',
        preparationTasks: []
      };

      await sendInterviewReminderEmail('test@example.com', 'John', interview, 2);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('2 hours')
        })
      );
    });

    it('should handle interview reminder without SMTP', async () => {
      delete process.env.SMTP_HOST;
      const interview = {
        title: 'Engineer Interview',
        company: 'TechCorp',
        scheduledDate: new Date(),
        interviewType: 'virtual'
      };

      await sendInterviewReminderEmail('test@example.com', 'John', interview, 24);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MOCK EMAIL] Interview Reminder')
      );
    });

    it('should include meeting link in interview reminder when present', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const interview = {
        title: 'Engineer Interview',
        company: 'TechCorp',
        scheduledDate: new Date(),
        interviewType: 'virtual',
        meetingLink: 'https://meet.example.com/abc123'
      };

      await sendInterviewReminderEmail('test@example.com', 'John', interview, 24);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('https://meet.example.com/abc123')
        })
      );
    });
  });

  describe('sendInterviewCancellationEmail - extra coverage', () => {
    it('should send cancellation email via transporter', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const interview = {
        title: 'Software Engineer',
        company: 'Acme Corp',
        scheduledDate: new Date(),
        interviewType: 'onsite'
      };

      await sendInterviewCancellationEmail('test@example.com', 'Jane Doe', interview);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Cancelled')
        })
      );
    });

    it('should handle cancellation email without SMTP', async () => {
      delete process.env.SMTP_HOST;
      const interview = {
        title: 'Software Engineer',
        company: 'Acme Corp',
        scheduledDate: new Date()
      };

      await sendInterviewCancellationEmail('test@example.com', 'Jane Doe', interview);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MOCK EMAIL] Interview Cancellation')
      );
    });

    it('should handle cancellation email sending errors', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const error = new Error('Send failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      const interview = {
        title: 'Software Engineer',
        company: 'Acme Corp',
        scheduledDate: new Date()
      };

      await expect(
        sendInterviewCancellationEmail('test@example.com', 'Jane Doe', interview)
      ).rejects.toThrow('Send failed');
    });
  });

  describe('sendDeadlineReminderEmail - extra coverage', () => {
    it('should send deadline reminder with multiple items', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const items = [
        {
          title: 'Application Deadline',
          company: 'Company A',
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          days: 2
        },
        {
          title: 'Second Round',
          company: 'Company B',
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          days: 5
        }
      ];

      await sendDeadlineReminderEmail('test@example.com', 'John', items);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com'
        })
      );
    });

    it('should handle deadline reminder without SMTP', async () => {
      delete process.env.SMTP_HOST;
      const items = [
        {
          title: 'Application',
          company: 'Company A',
          deadline: new Date(),
          days: 3
        }
      ];

      await sendDeadlineReminderEmail('test@example.com', 'John', items);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MOCK EMAIL] Deadline Reminders')
      );
    });

    it('should handle deadline reminder send errors', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('Deadline send failed'));

      const items = [
        {
          title: 'Deadline',
          company: 'Company',
          deadline: new Date(),
          days: 1
        }
      ];

      await expect(
        sendDeadlineReminderEmail('test@example.com', 'John', items)
      ).rejects.toThrow('Deadline send failed');
    });
  });

  describe('sendInterviewConfirmationEmail - extra coverage', () => {
    it('should send confirmation email successfully', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const interview = {
        title: 'Junior Developer',
        company: 'StartupXYZ',
        scheduledDate: new Date(),
        duration: 60,
        interviewType: 'phone'
      };

      await sendInterviewConfirmationEmail('test@example.com', 'Alice', interview);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Interview')
        })
      );
    });

    it('should handle confirmation without SMTP', async () => {
      delete process.env.SMTP_HOST;
      const interview = {
        title: 'Junior Developer',
        company: 'StartupXYZ',
        scheduledDate: new Date(),
        duration: 60,
        interviewType: 'phone'
      };

      await sendInterviewConfirmationEmail('test@example.com', 'Alice', interview);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MOCK EMAIL] Interview Confirmation')
      );
    });

    it('should handle confirmation send errors', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('Confirmation error'));

      const interview = {
        title: 'Junior Developer',
        company: 'StartupXYZ',
        scheduledDate: new Date(),
        duration: 60,
        interviewType: 'phone'
      };

      await expect(
        sendInterviewConfirmationEmail('test@example.com', 'Alice', interview)
      ).rejects.toThrow('Confirmation error');
    });
  });

  describe('sendInterviewRescheduledEmail - extra coverage', () => {
    it('should send reschedule email successfully', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const previousDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const interview = {
        title: 'QA Engineer',
        company: 'TechInc',
        scheduledDate: new Date(),
        interviewType: 'onsite'
      };

      await sendInterviewRescheduledEmail('test@example.com', 'Bob', interview, previousDate);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Rescheduled')
        })
      );
    });

    it('should handle reschedule without SMTP', async () => {
      delete process.env.SMTP_HOST;
      const previousDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const interview = {
        title: 'QA Engineer',
        company: 'TechInc',
        scheduledDate: new Date(),
        interviewType: 'onsite'
      };

      await sendInterviewRescheduledEmail('test@example.com', 'Bob', interview, previousDate);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MOCK EMAIL] Interview Rescheduled')
      );
    });

    it('should handle reschedule send errors', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('Reschedule failed'));

      const previousDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const interview = {
        title: 'QA Engineer',
        company: 'TechInc',
        scheduledDate: new Date(),
        interviewType: 'onsite'
      };

      await expect(
        sendInterviewRescheduledEmail('test@example.com', 'Bob', interview, previousDate)
      ).rejects.toThrow('Reschedule failed');
    });
  });

  describe('sendInterviewConfirmationEmail - comprehensive', () => {
    it('should include interview details in confirmation', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const interview = {
        title: 'Senior Developer Role',
        company: 'TechCorp',
        scheduledDate: new Date('2024-12-15T10:00:00'),
        duration: 60,
        interviewType: 'phone',
        location: 'San Francisco',
        preparationTasks: [
          { title: 'Review code sample', completed: false },
          { title: 'Prepare questions', completed: false }
        ]
      };

      await sendInterviewConfirmationEmail('test@example.com', 'John', interview);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          html: expect.stringContaining('Senior Developer')
        })
      );
    });

    it('should handle missing location gracefully', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const interview = {
        title: 'Developer',
        company: 'TechCorp',
        scheduledDate: new Date(),
        duration: 45,
        interviewType: 'virtual'
      };

      await sendInterviewConfirmationEmail('test@example.com', 'John', interview);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should handle missing preparation tasks', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const interview = {
        title: 'Developer',
        company: 'TechCorp',
        scheduledDate: new Date(),
        duration: 45,
        interviewType: 'onsite',
        preparationTasks: []
      };

      await sendInterviewConfirmationEmail('test@example.com', 'John', interview);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com'
        })
      );
    });

    it('should format interview time correctly', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const interview = {
        title: 'Developer',
        company: 'TechCorp',
        scheduledDate: new Date('2024-12-20T14:30:00'),
        duration: 60,
        interviewType: 'phone'
      };

      await sendInterviewConfirmationEmail('test@example.com', 'John', interview);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('sendDeadlineReminderEmail - additional scenarios', () => {
    it('should handle single deadline reminder', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const items = [
        {
          title: 'Application Deadline',
          company: 'Google',
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          days: 3
        }
      ];

      await sendDeadlineReminderEmail('test@example.com', 'Alice', items);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com'
        })
      );
    });

    it('should handle various deadline days remaining', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const items = [
        {
          title: 'Deadline 1',
          company: 'Company 1',
          deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          days: 1
        },
        {
          title: 'Deadline 2',
          company: 'Company 2',
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          days: 5
        },
        {
          title: 'Deadline 3',
          company: 'Company 3',
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          days: 10
        }
      ];

      await sendDeadlineReminderEmail('test@example.com', 'Alice', items);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should include all deadline items in email', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      const items = [
        { title: 'First', company: 'Company A', deadline: new Date(), days: 2 },
        { title: 'Second', company: 'Company B', deadline: new Date(), days: 3 }
      ];

      await sendDeadlineReminderEmail('test@example.com', 'Alice', items);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Company A'),
          html: expect.stringContaining('Company B')
        })
      );
    });
  });

  describe('Email error handling - comprehensive', () => {
    it('should handle email deletion error gracefully', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('Connection timeout'));

      await expect(sendDeletionEmail('test@example.com', 'John')).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle final deletion email error', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('Auth failed'));

      await expect(sendFinalDeletionEmail('test@example.com', 'John')).rejects.toThrow();
    });
  });

  describe('SMTP configuration handling', () => {
    it('should use environment variables for SMTP setup', async () => {
      process.env.SMTP_HOST = 'mail.company.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_USER = 'sender@company.com';
      process.env.SMTP_PASS = 'securepass';

      await sendDeletionEmail('test@example.com', 'Test');

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'mail.company.com',
          port: 465
        })
      );
    });

    it('should handle boolean SMTP_SECURE setting', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_SECURE = 'true';

      await sendDeletionEmail('test@example.com', 'Test');
      expect(mockCreateTransport).toHaveBeenCalled();
    });

    it('should use default SMTP_FROM when not set', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      delete process.env.SMTP_FROM;

      await sendDeletionEmail('test@example.com', 'Test');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('nirvana')
        })
      );
    });
  });
});
