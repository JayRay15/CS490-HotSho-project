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
  });
});
