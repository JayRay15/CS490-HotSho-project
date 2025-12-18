import { describe, it, expect } from '@jest/globals';
import { generateICSFile, getICSFilename } from '../icalendar.js';

describe('iCalendar Utility', () => {
  describe('generateICSFile', () => {
    const mockInterview = {
      scheduledDate: new Date('2024-12-25T10:00:00Z'),
      duration: 60, // 60 minutes
      title: 'Software Engineer',
      company: 'Tech Corp',
      interviewType: 'Technical',
      location: 'New York, NY',
      meetingLink: 'https://meet.example.com/interview',
      notes: 'Prepare for coding questions',
      interviewer: {
        name: 'John Doe',
        email: 'john.doe@techcorp.com',
        phone: '+1-555-1234'
      }
    };

    const mockUser = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    };

    it('should generate valid ICS file content', () => {
      const icsContent = generateICSFile(mockInterview, mockUser);

      expect(icsContent).toBeDefined();
      expect(typeof icsContent).toBe('string');
      expect(icsContent.length).toBeGreaterThan(0);
    });

    it('should include interview details in ICS content', () => {
      const icsContent = generateICSFile(mockInterview, mockUser);

      expect(icsContent).toContain('Tech Corp');
      expect(icsContent).toContain('Technical Interview');
      expect(icsContent).toContain('Software Engineer');
    });

    it('should include interviewer information', () => {
      const icsContent = generateICSFile(mockInterview, mockUser);

      expect(icsContent).toContain('John Doe');
      expect(icsContent).toContain('john.doe@techcorp.com');
    });

    it('should include meeting link when provided', () => {
      const icsContent = generateICSFile(mockInterview, mockUser);

      expect(icsContent).toContain('https://meet.example.com/interview');
    });

    it('should include notes when provided', () => {
      const icsContent = generateICSFile(mockInterview, mockUser);

      expect(icsContent).toContain('Prepare for coding questions');
    });

    it('should handle interview without interviewer', () => {
      const interviewWithoutInterviewer = {
        ...mockInterview,
        interviewer: null
      };

      expect(() => {
        generateICSFile(interviewWithoutInterviewer, mockUser);
      }).not.toThrow();
    });

    it('should handle interview without meeting link', () => {
      const interviewWithoutLink = {
        ...mockInterview,
        meetingLink: null
      };

      const icsContent = generateICSFile(interviewWithoutLink, mockUser);
      expect(icsContent).toBeDefined();
    });

    it('should handle interview without notes', () => {
      const interviewWithoutNotes = {
        ...mockInterview,
        notes: null
      };

      expect(() => {
        generateICSFile(interviewWithoutNotes, mockUser);
      }).not.toThrow();
    });

    it('should handle interview without location', () => {
      const interviewWithoutLocation = {
        ...mockInterview,
        location: null
      };

      const icsContent = generateICSFile(interviewWithoutLocation, mockUser);
      expect(icsContent).toBeDefined();
    });

    it('should use user name or default', () => {
      const userWithoutName = {
        email: 'user@example.com'
      };

      const icsContent = generateICSFile(mockInterview, userWithoutName);
      expect(icsContent).toBeDefined();
    });

    it('should calculate end time correctly based on duration', () => {
      const interview = {
        ...mockInterview,
        scheduledDate: new Date('2024-12-25T10:00:00Z'),
        duration: 90 // 90 minutes
      };

      const icsContent = generateICSFile(interview, mockUser);
      // The end time should be 90 minutes after start
      expect(icsContent).toBeDefined();
    });

    it('should include organizer information', () => {
      const icsContent = generateICSFile(mockInterview, mockUser);

      expect(icsContent).toContain('jane.smith@example.com');
    });

    it('should throw error on invalid input', () => {
      expect(() => {
        generateICSFile(null, mockUser);
      }).toThrow();
    });
  });

  describe('getICSFilename', () => {
    it('should generate filename with company, type, and date', () => {
      const interview = {
        company: 'Tech Corp',
        interviewType: 'Technical',
        scheduledDate: new Date('2024-12-25T10:00:00Z')
      };

      const filename = getICSFilename(interview);

      expect(filename).toContain('tech_corp');
      expect(filename).toContain('technical');
      expect(filename).toContain('2024-12-25');
      expect(filename).toMatch(/^interview_.*\.ics$/);
    });

    it('should sanitize special characters in company name', () => {
      const interview = {
        company: 'Tech & Co., Inc.',
        interviewType: 'Phone',
        scheduledDate: new Date('2024-12-25T10:00:00Z')
      };

      const filename = getICSFilename(interview);

      expect(filename).toContain('tech_co_inc');
      expect(filename).not.toContain('&');
      expect(filename).not.toContain(',');
      expect(filename).not.toContain('.');
    });

    it('should sanitize special characters in interview type', () => {
      const interview = {
        company: 'Tech Corp',
        interviewType: 'On-Site / Final',
        scheduledDate: new Date('2024-12-25T10:00:00Z')
      };

      const filename = getICSFilename(interview);

      expect(filename).toContain('on_site_final');
      expect(filename).not.toContain('/');
    });

    it('should convert to lowercase', () => {
      const interview = {
        company: 'TECH CORP',
        interviewType: 'TECHNICAL',
        scheduledDate: new Date('2024-12-25T10:00:00Z')
      };

      const filename = getICSFilename(interview);

      expect(filename).toContain('tech_corp');
      expect(filename).toContain('technical');
    });

    it('should format date correctly', () => {
      const interview = {
        company: 'Tech Corp',
        interviewType: 'Technical',
        scheduledDate: new Date('2024-01-05T10:00:00Z')
      };

      const filename = getICSFilename(interview);

      expect(filename).toContain('2024-01-05');
    });

    it('should handle different date formats', () => {
      const interview = {
        company: 'Tech Corp',
        interviewType: 'Technical',
        scheduledDate: new Date('2024-12-31T23:59:59Z')
      };

      const filename = getICSFilename(interview);

      expect(filename).toContain('2024-12-31');
    });
  });
});

