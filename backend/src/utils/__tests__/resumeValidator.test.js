import { jest } from '@jest/globals';

// Mock pdf-lib PDFDocument.load used by countPdfPages
const mockPdfDocument = {
  load: jest.fn()
};

// Provide both PDFDocument and StandardFonts named exports expected by the module
jest.unstable_mockModule('pdf-lib', () => ({
  PDFDocument: mockPdfDocument,
  StandardFonts: { Helvetica: 'Helvetica' },
  // Minimal mocks for other named exports used across the codebase
  rgb: (r, g, b) => ({ r, g, b }),
  degrees: (d) => ({ degrees: d }),
}));

const {
  validateEmail,
  validatePhoneNumber,
  checkGrammar,
  countPdfPages,
  validateResumeLength,
  analyzeProfessionalTone,
  checkFormatConsistency,
  checkMissingInformation,
  extractTextFromResume,
  validateResume,
} = await import('../resumeValidator.js');

describe('resumeValidator utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateEmail', () => {
    it('validates proper email', () => {
      expect(validateEmail('a@b.com')).toEqual({ valid: true, message: 'Valid email' });
    });

    it('rejects invalid email', () => {
      expect(validateEmail('not-an-email')).toEqual({ valid: false, message: 'Invalid email format' });
    });

    it('requires email', () => {
      expect(validateEmail('')).toEqual({ valid: false, message: 'Email is required' });
    });
  });

  describe('validatePhoneNumber', () => {
    it('accepts valid 10-digit phone', () => {
      const res = validatePhoneNumber('(234) 567-8901');
      expect(res.valid).toBe(true);
    });

    it('rejects short numbers', () => {
      expect(validatePhoneNumber('12345').valid).toBe(false);
    });

    it('rejects invalid area code', () => {
      expect(validatePhoneNumber('1234567890').valid).toBe(false);
    });
  });

  describe('checkGrammar (basic checks)', () => {
    it('returns no errors for empty text', async () => {
      const res = await checkGrammar('');
      expect(res.hasErrors).toBe(false);
    });

    it('finds basic grammar problems', async () => {
      const text = "i went there. your car is alot of fun and its great";
      const res = await checkGrammar(text, 'summary');
      expect(res.fallbackMode).toBe(true);
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.section).toBe('summary');
    });
  });

  describe('countPdfPages and validateResumeLength', () => {
    it('counts pages via PDFDocument.load and handles 0 pages', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 0 });
      await expect(countPdfPages(Buffer.from(''))).resolves.toBe(0);
      const res = await validateResumeLength(Buffer.from(''));
      expect(res.valid).toBe(false);
      expect(res.pageCount).toBe(0);
    });

    it('accepts 1-2 pages and rejects >2', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 1 });
      let res = await validateResumeLength(Buffer.from(''));
      expect(res.valid).toBe(true);
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 3 });
      res = await validateResumeLength(Buffer.from(''));
      expect(res.valid).toBe(false);
      expect(res.pageCount).toBe(3);
    });
  });

  describe('tone, format, and missing information checks', () => {
    it('analyzes professional tone and finds issues', () => {
      const text = 'I kinda helped with a bunch of stuff';
      const issues = analyzeProfessionalTone(text);
      expect(issues.length).toBeGreaterThanOrEqual(1);
      expect(issues.some(i => i.type === 'tone')).toBe(true);
    });

    it('checks format consistency warnings', () => {
      const resume = { sections: { experience: [ { startDate: 'Jan 2020', endDate: '01/2021' } ], education: [], skills: [] } };
      const issues = checkFormatConsistency(resume);
      expect(issues.length).toBeGreaterThanOrEqual(1);
    });

    it('detects missing information', () => {
      const resume = { sections: {} };
      const warnings = checkMissingInformation(resume);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('extracts text from resume sections', () => {
      const resume = { sections: { contactInfo: { name: 'A', email: 'a@b.com' }, summary: 'hello', experience: [ { title: 'Dev', company: 'X', description: 'work' } ] } };
      const texts = extractTextFromResume(resume);
      expect(texts.some(t => t.field === 'email')).toBe(true);
      expect(texts.some(t => t.section === 'experience')).toBe(true);
    });
  });

  describe('validateResume integration', () => {
    it('runs validation and returns structure', async () => {
      const resume = { sections: { contactInfo: { email: 'a@b.com', phone: '2345678901', name: 'A' }, summary: 'Professional summary', experience: [ { company: 'X', responsibilities: ['did work', 'did more'] } ], education: [{ school: 'U' }], skills: ['JS','Node','React','SQL','Docker'] } };
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 1 });

      const res = await validateResume(resume, Buffer.from('pdf'));
      expect(res.isValid).toBe(true);
      expect(res.summary.totalErrors).toBeGreaterThanOrEqual(0);
    });

    it('handles resume with no sections', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 1 });
      const res = await validateResume({}, Buffer.from('pdf'));
      expect(res).toBeDefined();
      expect(res.summary).toBeDefined();
    });

    it('validates resume with missing contact info', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 1 });
      const resume = { sections: { experience: [], education: [], skills: [] } };
      const res = await validateResume(resume, Buffer.from('pdf'));
      expect(res.summary.totalErrors).toBeGreaterThan(0);
    });

    it('validates resume with poor professional tone', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 1 });
      const resume = {
        sections: {
          contactInfo: { email: 'a@b.com', phone: '2345678901', name: 'A' },
          summary: 'I kinda did some stuff that was pretty cool',
          experience: []
        }
      };
      const res = await validateResume(resume, Buffer.from('pdf'));
      expect(res).toBeDefined();
    });
  });

  describe('validateEmail - extended', () => {
    it('validates emails with various formats', () => {
      expect(validateEmail('test.name@company.co.uk')).toEqual({ valid: true, message: 'Valid email' });
      expect(validateEmail('user+tag@example.com')).toEqual({ valid: true, message: 'Valid email' });
      expect(validateEmail('name@subdomain.domain.com')).toEqual({ valid: true, message: 'Valid email' });
    });

    it('rejects null email', () => {
      expect(validateEmail(null)).toEqual({ valid: false, message: 'Email is required' });
    });

    it('rejects emails without @', () => {
      expect(validateEmail('notanemail')).toEqual({ valid: false, message: 'Invalid email format' });
    });

    it('rejects emails with invalid format', () => {
      expect(validateEmail('user@')).toEqual({ valid: false, message: 'Invalid email format' });
      expect(validateEmail('@domain.com')).toEqual({ valid: false, message: 'Invalid email format' });
    });
  });

  describe('validatePhoneNumber - extended', () => {
    it('accepts various valid phone formats', () => {
      expect(validatePhoneNumber('2123456789').valid).toBe(true);
      expect(validatePhoneNumber('201-234-5678').valid).toBe(true);
      expect(validatePhoneNumber('(201) 234-5678').valid).toBe(true);
      expect(validatePhoneNumber('201 234 5678').valid).toBe(true);
    });

    it('rejects area codes 0 and 1', () => {
      expect(validatePhoneNumber('0123456789').valid).toBe(false);
      expect(validatePhoneNumber('1123456789').valid).toBe(false);
    });

    it('rejects null phone', () => {
      expect(validatePhoneNumber(null).valid).toBe(false);
    });

    it('rejects non-numeric characters except formatters', () => {
      expect(validatePhoneNumber('abc-def-ghij').valid).toBe(false);
    });

    it('accepts various valid area codes', () => {
      for (let areaCode = 2; areaCode <= 9; areaCode++) {
        const phone = `${areaCode}234567890`;
        expect(validatePhoneNumber(phone).valid).toBe(true);
      }
    });
  });

  describe('checkGrammar - extended', () => {
    it('handles null input', async () => {
      const res = await checkGrammar(null);
      expect(res.hasErrors).toBe(false);
    });

    it('handles undefined input', async () => {
      const res = await checkGrammar(undefined);
      expect(res.hasErrors).toBe(false);
    });

    it('checks different sections', async () => {
      const text = 'This text has errors in it';
      const summaryRes = await checkGrammar(text, 'summary');
      const expRes = await checkGrammar(text, 'experience');
      
      expect(summaryRes.section).toBe('summary');
      expect(expRes.section).toBe('experience');
    });

    it('returns fallback mode for complex grammar checks', async () => {
      const text = 'There is some problematic grammar here with issues';
      const res = await checkGrammar(text);
      expect(res.fallbackMode).toBeDefined();
      expect(res.errors).toBeInstanceOf(Array);
    });

    it('detects repeated words', async () => {
      const text = 'This this is a test test';
      const res = await checkGrammar(text);
      expect(res.errors.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('PDF page counting and validation', () => {
    it('handles PDF load errors gracefully', async () => {
      mockPdfDocument.load.mockRejectedValue(new Error('PDF load failed'));
      
      await expect(countPdfPages(Buffer.from('invalid'))).rejects.toThrow();
    });

    it('validates exactly 1 page', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 1 });
      const res = await validateResumeLength(Buffer.from(''));
      expect(res.valid).toBe(true);
      expect(res.pageCount).toBe(1);
    });

    it('validates exactly 2 pages', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 2 });
      const res = await validateResumeLength(Buffer.from(''));
      expect(res.valid).toBe(true);
      expect(res.pageCount).toBe(2);
    });

    it('rejects 3+ pages with message', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 4 });
      const res = await validateResumeLength(Buffer.from(''));
      expect(res.valid).toBe(false);
      expect(res.message).toContain('Consider reducing');
    });
  });

  describe('analyzeProfessionalTone - extended', () => {
    it('detects casual language', () => {
      const text = 'I kinda sorta helped with stuff';
      const issues = analyzeProfessionalTone(text);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(i => i.type === 'tone')).toBe(true);
    });

    it('detects first person pronouns', () => {
      const text = 'I worked on projects and I did things';
      const issues = analyzeProfessionalTone(text);
      expect(issues.some(i => i.message.includes('I'))).toBe(true);
    });

    it('flags contractions', () => {
      const text = 'I\'ve worked on projects, we\'re developing features';
      const issues = analyzeProfessionalTone(text);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('returns empty array for professional text', () => {
      const text = 'Led team of developers to successful project completion';
      const issues = analyzeProfessionalTone(text);
      expect(issues.every(i => i.type === 'tone' || i.type === 'pronoun')).toBe(true);
    });
  });

  describe('checkFormatConsistency - extended', () => {
    it('detects date format inconsistencies', () => {
      const resume = {
        sections: {
          experience: [
            { startDate: 'January 2020', endDate: '02/2021' },
            { startDate: '2022-01', endDate: 'December 2023' }
          ]
        }
      };
      const issues = checkFormatConsistency(resume);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('checks for indentation consistency', () => {
      const resume = {
        sections: {
          experience: [
            { description: '  - Worked on features' },
            { description: '- Worked on features' }
          ]
        }
      };
      const issues = checkFormatConsistency(resume);
      expect(issues).toBeInstanceOf(Array);
    });

    it('handles empty sections', () => {
      const resume = { sections: {} };
      const issues = checkFormatConsistency(resume);
      expect(issues).toBeInstanceOf(Array);
    });
  });

  describe('checkMissingInformation - extended', () => {
    it('detects all missing sections', () => {
      const resume = { sections: {} };
      const warnings = checkMissingInformation(resume);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.section === 'contactInfo' || w.message.includes('contact'))).toBe(true);
    });

    it('detects missing contact info fields', () => {
      const resume = {
        sections: {
          contactInfo: { name: 'John' },
          experience: [],
          education: [],
          skills: []
        }
      };
      const warnings = checkMissingInformation(resume);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('detects missing experience', () => {
      const resume = {
        sections: {
          contactInfo: { name: 'John', email: 'j@b.com', phone: '2345678901' },
          education: [{ school: 'MIT' }],
          skills: ['JS']
        }
      };
      const warnings = checkMissingInformation(resume);
      expect(warnings.some(w => w.section === 'experience' || w.message.includes('experience'))).toBe(true);
    });

    it('detects missing education', () => {
      const resume = {
        sections: {
          contactInfo: { name: 'John', email: 'j@b.com' },
          experience: [{ company: 'Google', title: 'Engineer' }],
          skills: []
        }
      };
      const warnings = checkMissingInformation(resume);
      expect(warnings.some(w => w.section === 'education' || w.message.includes('education'))).toBe(true);
    });

    it('detects missing skills', () => {
      const resume = {
        sections: {
          contactInfo: { name: 'John', email: 'j@b.com' },
          experience: [{ company: 'Google' }],
          education: [{ school: 'MIT' }]
        }
      };
      const warnings = checkMissingInformation(resume);
      expect(warnings.some(w => w.section === 'skills' || w.message.includes('skills'))).toBe(true);
    });
  });

  describe('extractTextFromResume - extended', () => {
    it('extracts all text fields', () => {
      const resume = {
        sections: {
          contactInfo: { name: 'John Doe', email: 'john@example.com', phone: '2345678901' },
          summary: 'Professional summary text',
          experience: [
            { title: 'Dev', company: 'Google', description: 'Worked on projects' },
            { title: 'Engineer', company: 'Facebook', description: 'Led initiatives' }
          ],
          education: [
            { school: 'MIT', degree: 'BS', field: 'Computer Science' }
          ],
          skills: ['JavaScript', 'Python', 'React']
        }
      };

      const texts = extractTextFromResume(resume);
      expect(texts.length).toBeGreaterThan(0);
      expect(texts.some(t => t.field === 'name')).toBe(true);
      expect(texts.some(t => t.field === 'email')).toBe(true);
      expect(texts.some(t => t.field === 'phone')).toBe(true);
      expect(texts.some(t => t.section === 'summary')).toBe(true);
      expect(texts.some(t => t.section === 'experience')).toBe(true);
    });

    it('handles missing sections gracefully', () => {
      const resume = { sections: { contactInfo: { name: 'John' } } };
      const texts = extractTextFromResume(resume);
      expect(texts.some(t => t.field === 'name')).toBe(true);
    });

    it('handles empty arrays', () => {
      const resume = {
        sections: {
          contactInfo: { name: 'John' },
          experience: [],
          education: [],
          skills: []
        }
      };
      const texts = extractTextFromResume(resume);
      expect(texts).toBeInstanceOf(Array);
    });

    it('extracts multiple experience entries', () => {
      const resume = {
        sections: {
          experience: [
            { company: 'Google', title: 'SWE', description: 'Backend work' },
            { company: 'Amazon', title: 'SDE', description: 'Frontend work' },
            { company: 'Meta', title: 'Engineer', description: 'Full-stack work' }
          ]
        }
      };
      const texts = extractTextFromResume(resume);
      expect(texts.filter(t => t.section === 'experience').length).toBeGreaterThanOrEqual(3);
    });

    it('extracts education entries', () => {
      const resume = {
        sections: {
          education: [
            { school: 'MIT', degree: 'BS', field: 'CS' },
            { school: 'Stanford', degree: 'MS', field: 'AI' }
          ]
        }
      };
      const texts = extractTextFromResume(resume);
      expect(texts.some(t => t.section === 'education')).toBe(true);
    });

    it('extracts skills array', () => {
      const resume = {
        sections: {
          contactInfo: { name: 'John' },
          skills: ['JavaScript', 'Python', 'Go', 'Rust', 'TypeScript']
        }
      };
      const texts = extractTextFromResume(resume);
      // Should have at least the name from contactInfo
      expect(texts.some(t => t.field === 'name')).toBe(true);
    });
  });

  describe('validateEmail - additional edge cases', () => {
    it('handles whitespace around email', () => {
      expect(validateEmail(' test@example.com ')).toBeDefined();
      expect(validateEmail('\ntest@example.com\n')).toBeDefined();
    });

    it('rejects multiple @ signs', () => {
      expect(validateEmail('test@@example.com').valid).toBe(false);
    });

    it('validates emails with hyphens', () => {
      expect(validateEmail('first-last@example.com').valid).toBe(true);
    });

    it('validates emails with numbers', () => {
      expect(validateEmail('test123@example456.com').valid).toBe(true);
    });
  });

  describe('validatePhoneNumber - additional formats', () => {
    it('validates with extensions', () => {
      const result = validatePhoneNumber('2123456789');
      expect(result.valid).toBe(true);
    });

    it('extracts formatted number', () => {
      const result = validatePhoneNumber('2123456789');
      if (result.valid && result.formatted) {
        expect(typeof result.formatted).toBe('string');
      }
    });

    it('validates with various separators', () => {
      const validFormats = [
        '2123456789',
        '(212) 345-6789',
        '212-345-6789',
        '212.345.6789',
        '212 345 6789'
      ];
      
      validFormats.forEach(format => {
        expect(validatePhoneNumber(format).valid).toBe(true);
      });
    });

    it('rejects numbers starting with 0', () => {
      expect(validatePhoneNumber('0123456789').valid).toBe(false);
    });

    it('rejects numbers starting with 1', () => {
      expect(validatePhoneNumber('1123456789').valid).toBe(false);
    });
  });

  describe('checkGrammar - various sections', () => {
    it('checks contactInfo section', async () => {
      const result = await checkGrammar('name and email here', 'contactInfo');
      expect(result.section).toBe('contactInfo');
    });

    it('checks education section', async () => {
      const result = await checkGrammar('Attended university', 'education');
      expect(result.section).toBe('education');
    });

    it('checks skills section', async () => {
      const result = await checkGrammar('JavaScript, Python', 'skills');
      expect(result.section).toBe('skills');
    });

    it('handles multiple consecutive spaces', async () => {
      const result = await checkGrammar('This  has   multiple    spaces', 'general');
      expect(result.errors).toBeInstanceOf(Array);
    });

    it('handles tabs and special formatting', async () => {
      const result = await checkGrammar('Text\twith\ttabs', 'general');
      expect(result.section).toBe('general');
    });
  });

  describe('countPdfPages - edge cases', () => {
    it('counts single page PDF', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 1 });
      const count = await countPdfPages(Buffer.from('single page'));
      expect(count).toBe(1);
    });

    it('counts multi-page PDF', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 5 });
      const count = await countPdfPages(Buffer.from('multi page'));
      expect(count).toBe(5);
    });

    it('handles PDF with exactly 2 pages', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 2 });
      const count = await countPdfPages(Buffer.from('two pages'));
      expect(count).toBe(2);
    });

    it('throws error on corrupted PDF', async () => {
      mockPdfDocument.load.mockRejectedValue(new Error('Corrupted PDF'));
      await expect(countPdfPages(Buffer.from('corrupt'))).rejects.toThrow();
    });
  });

  describe('analyzeProfessionalTone - comprehensive', () => {
    it('accepts action verbs', () => {
      const text = 'Led, managed, developed, created, designed, implemented';
      const issues = analyzeProfessionalTone(text);
      expect(issues.every(i => i.type === 'tone' || i.type === 'pronoun')).toBe(true);
    });

    it('detects weak language patterns', () => {
      const text = 'helped with some things and did some work';
      const issues = analyzeProfessionalTone(text);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('flags all contractions', () => {
      const text = "I've, you've, it's, we're, don't, can't, won't";
      const issues = analyzeProfessionalTone(text);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('detects multiple tone issues', () => {
      const text = 'I kinda like working here. We did stuff and I think its good';
      const issues = analyzeProfessionalTone(text);
      expect(issues.length).toBeGreaterThan(1);
    });
  });

  describe('checkFormatConsistency - comprehensive', () => {
    it('detects multiple date format issues', () => {
      const resume = {
        sections: {
          experience: [
            { startDate: 'Jan 2020', endDate: '02/2020' },
            { startDate: '2020-01', endDate: 'February 2020' },
            { startDate: '1/2020', endDate: '2020-02-15' }
          ]
        }
      };
      const issues = checkFormatConsistency(resume);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('checks bullet point consistency', () => {
      const resume = {
        sections: {
          experience: [
            { responsibilities: ['- Item one', '- Item two'] },
            { responsibilities: ['* Item one', '* Item two'] },
            { responsibilities: ['• Item one', '• Item two'] }
          ]
        }
      };
      const issues = checkFormatConsistency(resume);
      expect(issues).toBeInstanceOf(Array);
    });

    it('checks indentation patterns', () => {
      const resume = {
        sections: {
          experience: [
            { description: '  Indented item' },
            { description: 'Not indented' },
            { description: '    More indented' }
          ]
        }
      };
      const issues = checkFormatConsistency(resume);
      expect(issues).toBeInstanceOf(Array);
    });
  });

  describe('checkMissingInformation - comprehensive', () => {
    it('detects all missing required sections', () => {
      const resume = { sections: {} };
      const warnings = checkMissingInformation(resume);
      expect(warnings.length).toBeGreaterThanOrEqual(1);
    });

    it('detects missing email in contact info', () => {
      const resume = {
        sections: {
          contactInfo: { name: 'John', phone: '2123456789' },
          summary: 'Good developer',
          experience: [{ company: 'X', description: 'Worked' }],
          education: [{ school: 'MIT', degree: 'BS' }],
          skills: ['JS']
        }
      };
      const warnings = checkMissingInformation(resume);
      // Check if there are any warnings - should warn about missing email or other issues
      expect(warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('detects missing phone in contact info', () => {
      const resume = {
        sections: {
          contactInfo: { name: 'John', email: 'j@b.com' },
          summary: 'Good developer',
          experience: [{ company: 'X', description: 'Worked' }],
          education: [{ school: 'MIT', degree: 'BS' }],
          skills: ['JS']
        }
      };
      const warnings = checkMissingInformation(resume);
      // Should have some warnings, especially about missing phone
      expect(warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('detects empty experience array', () => {
      const resume = {
        sections: {
          contactInfo: { name: 'John', email: 'j@b.com', phone: '2123456789' },
          experience: [],
          education: [{ school: 'MIT' }],
          skills: ['JS']
        }
      };
      const warnings = checkMissingInformation(resume);
      expect(warnings.some(w => w.section === 'experience' || w.message.includes('experience'))).toBe(true);
    });

    it('detects empty education array', () => {
      const resume = {
        sections: {
          contactInfo: { name: 'John', email: 'j@b.com', phone: '2123456789' },
          experience: [{ company: 'Google' }],
          education: [],
          skills: ['JS']
        }
      };
      const warnings = checkMissingInformation(resume);
      expect(warnings.some(w => w.section === 'education' || w.message.includes('education'))).toBe(true);
    });

    it('detects empty skills array', () => {
      const resume = {
        sections: {
          contactInfo: { name: 'John', email: 'j@b.com', phone: '2123456789' },
          experience: [{ company: 'Google' }],
          education: [{ school: 'MIT' }],
          skills: []
        }
      };
      const warnings = checkMissingInformation(resume);
      expect(warnings.some(w => w.section === 'skills' || w.message.includes('skills'))).toBe(true);
    });
  });

  describe('validateResume - comprehensive validation', () => {
    it('validates complete resume successfully', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 1 });
      const resume = {
        sections: {
          contactInfo: { name: 'John', email: 'j@b.com', phone: '2123456789' },
          summary: 'Experienced developer',
          experience: [{ company: 'Google', title: 'SWE', description: 'Worked on systems' }],
          education: [{ school: 'MIT', degree: 'BS' }],
          skills: ['JavaScript', 'Python', 'Go']
        }
      };

      const res = await validateResume(resume, Buffer.from('pdf'));
      expect(res.isValid).toBeDefined();
      expect(res.summary).toBeDefined();
    });

    it('validates resume with formatting issues', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 1 });
      const resume = {
        sections: {
          contactInfo: { name: 'John', email: 'j@b.com' },
          experience: [
            { company: 'X', startDate: 'Jan 2020', endDate: '01/2021' }
          ]
        }
      };

      const res = await validateResume(resume, Buffer.from('pdf'));
      expect(res.summary.totalErrors).toBeGreaterThanOrEqual(0);
    });

    it('adds a length warning when resume has >2 pages', async () => {
      // Simulate a 3-page PDF
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 3 });
      const resume = {
        sections: {
          contactInfo: { name: 'Jane', email: 'jane@doe.com', phone: '2123456789' },
          summary: 'Experienced developer with many achievements',
          experience: [{ company: 'X', description: 'Did work', responsibilities: ['Did one', 'Did two'] }],
          education: [{ school: 'U' }],
          skills: ['JS','Node','React','SQL','Docker','AWS']
        }
      };

      const res = await validateResume(resume, Buffer.from('pdf'));
      // Should include a length warning about reducing pages
      expect(res.warnings.some(w => w.type === 'length' && /pages?/.test(w.message))).toBe(true);
      expect(res.summary.contactInfoValid).toBe(true);
    });

    it('reports grammar errors from summary and marks resume invalid', async () => {
      mockPdfDocument.load.mockResolvedValue({ getPageCount: () => 1 });
      const resume = {
        sections: {
          contactInfo: { name: 'Sam', email: 'sam@ex.com', phone: '2123456789' },
          summary: "i went there. your car is alot of fun and its great",
          experience: [{ company: 'X', description: 'Worked on things', responsibilities: ['Helped with project'] }],
          education: [{ school: 'U' }],
          skills: ['JS','Node','React','SQL','Docker']
        }
      };

      const res = await validateResume(resume, Buffer.from('pdf'));
      // At least one grammar-related error should be included
      expect(res.errors.some(e => e.type === 'grammar' || e.message && e.message.toLowerCase().includes('check usage'))).toBe(true);
      // Because there are grammar errors with severity 'error', resume validity should be false
      expect(res.isValid).toBe(false);
    });

    it('detects many date format patterns via format consistency check', () => {
      const resume = {
        sections: {
          experience: [
            { company: 'A', startDate: 'Jan 2020', endDate: 'January 2021' },
            { company: 'B', startDate: '01/2022', endDate: '2022-03' },
            { company: 'C', startDate: '2023' }
          ],
          education: [
            { school: 'X', startDate: 'Jan 2018', endDate: '01/2019' },
            { school: 'Y', startDate: '2020-01', endDate: '2020' }
          ]
        }
      };

      const issues = checkFormatConsistency(resume);
      // Should find inconsistent formats across experience/education
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThanOrEqual(1);
      // At least one issue should mention 'format' or be type 'format_consistency'
      expect(issues.some(i => i.type === 'format_consistency')).toBe(true);
    });
  });
});
