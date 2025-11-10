import { jest, describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// Jest tests for coverLetterExporter
// We mock heavy external deps (docx Packer and htmlToPdf) to keep tests deterministic and CI-friendly
jest.unstable_mockModule('docx', () => {
  const RealDate = Date;
  return {
    Document: class Document { constructor(cfg) { this.cfg = cfg; } },
    Packer: { toBuffer: async () => Buffer.from('DOCX') },
    Paragraph: class Paragraph { constructor(opts) { this.opts = opts; } },
    TextRun: class TextRun { constructor(opts) { this.opts = opts; } },
    HeadingLevel: {},
    AlignmentType: { CENTER: 'center', RIGHT: 'right', LEFT: 'left', JUSTIFIED: 'justified' },
    Header: class Header {},
    Footer: class Footer {},
    PageBreak: class PageBreak {}
  };
});

jest.unstable_mockModule('../htmlToPdf.js', () => ({
  htmlToPdf: async () => Buffer.from('PDF')
}));

describe('coverLetterExporter', () => {
  let exporter;
  // Fix date to make filenames and date outputs deterministic
  const RealDate = Date;
  beforeAll(async () => {
    // import the module after mocks
    exporter = await import('../coverLetterExporter.js');
  });

  afterEach(() => {
    // nothing for now
  });

  afterAll(() => {
    // restore Date if tests mess with it
    global.Date = RealDate;
  });

  test('generateCoverLetterFilename uses contactInfo and jobDetails and extension', () => {
    // freeze date
    const fixed = new RealDate('2020-01-02T12:34:56.000Z');
    // override global Date constructor
    // eslint-disable-next-line consistent-return
    global.Date = class extends RealDate {
      constructor(...args) {
        if (args.length === 0) return fixed;
        return new RealDate(...args);
      }
      static now() { return fixed.getTime(); }
    };

    const filename = exporter.generateCoverLetterFilename(
      { content: 'x' },
      { name: 'Jane Q Public' },
      { company: 'Acme, Inc.', jobTitle: 'Senior Developer' },
      'pdf'
    );

    expect(filename).toContain('Jane');
    expect(filename).toContain('Q');
    expect(filename).toContain('Public');
    expect(filename).toContain('CoverLetter');
    expect(filename).toContain('AcmeInc');
    expect(filename).toContain('SeniorDeveloper');
    expect(filename.endsWith('.pdf')).toBe(true);
    // date portion should be 20200102
    expect(filename).toMatch(/20200102/);
  });

  test('generateCoverLetterFilename falls back when no contactInfo', () => {
    const filename = exporter.generateCoverLetterFilename({ content: '' }, null, null, 'txt');
    expect(filename.startsWith('CoverLetter_')).toBe(true);
    expect(filename.endsWith('.txt')).toBe(true);
  });

  test('exportCoverLetterToHtml includes header, recipient, greeting and body', () => {
    // fixed date to a readable string
    const fixed = new RealDate('2020-01-02T00:00:00.000Z');
    global.Date = class extends RealDate { constructor(...a){ if(a.length===0) return fixed; return new RealDate(...a);} static now(){return fixed.getTime()} };

    const coverLetter = { name: 'My Letter', content: 'Dear Hiring Team\nI am writing to apply.\nSincerely,\nJane' };
    const html = exporter.exportCoverLetterToHtml(coverLetter, {
      contactInfo: { name: 'Jane Public', email: 'jane@example.com', phone: '555-1234' },
      jobDetails: { company: 'Acme', hiringManager: 'Hiring Manager', companyAddress: '1 Acme Way' }
    });

    expect(typeof html).toBe('string');
    expect(html).toContain('Jane Public');
    expect(html).toContain('Acme');
    expect(html).toContain('Dear Hiring Team');
    expect(html).toContain('I am writing to apply.');
    expect(html).toContain('Sincerely,');
    // date should be present in the HTML
    expect(html).toMatch(/2020/);
  });

  test('exportCoverLetterToPlainText produces readable plain text and includes header when requested', () => {
    const coverLetter = { content: 'Hi Team\nPlease consider me.\nBest,\nJohn' };
    const txt = exporter.exportCoverLetterToPlainText(coverLetter, {
      contactInfo: { name: 'John Doe', email: 'john@doe.com', phone: '111-222' },
      jobDetails: { company: 'BetaCorp', hiringManager: 'HR' },
      includeHeader: true
    });

    expect(txt).toContain('John Doe');
    expect(txt).toContain('john@doe.com');
    expect(txt).toContain('Hi Team');
    expect(txt).toContain('Best,');
    expect(txt).toContain('John');
  });

  test('exportCoverLetterToPlainText omits header when includeHeader is false', () => {
    const coverLetter = { content: 'Hello\nBody' };
    const txt = exporter.exportCoverLetterToPlainText(coverLetter, {
      contactInfo: { name: 'No Head', email: 'no@head.com' },
      includeHeader: false
    });
    // Should not include the header name
    expect(txt).not.toContain('No Head');
  });

  test('exportCoverLetterToHtml supports letterhead enabled and printOptimized margins', () => {
    const coverLetter = { content: 'Hi\nContent\nRegards\nAlex' };
    const html = exporter.exportCoverLetterToHtml(coverLetter, {
      letterhead: { enabled: true, name: 'Company Header', address: '123 Road', alignment: 'center', phone: '9-9' },
      contactInfo: { email: 'a@b.com', phone: '9-9' },
      jobDetails: { company: 'Delta' },
      template: { theme: { colors: { primary: '#ff0000', text: '#000' } } },
      printOptimized: true
    });

    expect(html).toContain('Company Header');
    expect(html).toContain('123 Road');
    // printOptimized should set 1in margin
    expect(html).toContain('margin: 1in');
  });

  test('exportCoverLetterToDocx handles letterhead and jobDetails without companyAddress branch', async () => {
    const coverLetter = { content: 'Hello\nBody\nRegards\nPat' };
    // letterhead enabled -> exercises letterhead branch in docx builder
    const buf = await exporter.exportCoverLetterToDocx(coverLetter, {
      letterhead: { enabled: true, name: 'LH Name', address: 'Addr Ln', alignment: 'right', phone: '000' },
      contactInfo: { name: 'Pat Person', email: 'pat@p.com' },
      jobDetails: { company: 'NoAddrCo', hiringManager: 'HM' }
    });

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.toString()).toBe('DOCX');
  });

  test('exportCoverLetterToDocx exercises various color formats for toDocxColor', async () => {
    const colors = [
      { primary: 'rgb(10,20,30)', text: 'rgb(5,6,7)' },
      { primary: '#abc', text: '#123' },
      { primary: '#112233', text: '#445566' },
      { primary: 'blue', text: 'red' },
      { primary: 'not-a-color', text: 'also-bad' }
    ];

    for (const themeColors of colors) {
      const buf = await exporter.exportCoverLetterToDocx({ content: 'Hi\npara1\npara2\nThanks\nSig' }, {
        template: { theme: { colors: themeColors } },
        contactInfo: { name: 'C' },
        jobDetails: { company: 'Col' }
      });
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.toString()).toBe('DOCX');
    }
  });

  test('exportCoverLetterToHtml includes companyAddress when provided and multiple body paragraphs render', () => {
    const coverLetter = { content: 'Hello\nFirst paragraph.\nSecond paragraph.\nRegards\nZ' };
    const html = exporter.exportCoverLetterToHtml(coverLetter, {
      contactInfo: { name: 'X' },
      jobDetails: { company: 'ACME', companyAddress: '100 Main St', hiringManager: 'HR' }
    });

    expect(html).toContain('100 Main St');
    // Should have two body paragraph elements
    const matches = html.match(/<p>.*?<\/p>/g);
    expect(matches && matches.length).toBeGreaterThanOrEqual(4); // date + recipient + 2 body paragraphs at least
  });

  test('generateEmailTemplate includes website if provided in contactInfo', () => {
    const coverLetter = { content: 'Hi\nI apply\nSincerely\nAlex' };
    const tmpl = exporter.generateEmailTemplate(coverLetter, {
      contactInfo: { name: 'Alex', email: 'a@b.com', website: 'https://alex.example' },
      jobDetails: { jobTitle: 'Designer' }
    });

    expect(tmpl.body).toContain('https://alex.example');
  });

  test('exportCoverLetterToPdf returns buffer from mocked htmlToPdf', async () => {
    const coverLetter = { content: 'Hello\nBody\nRegards' };
    const buf = await exporter.exportCoverLetterToPdf(coverLetter, {});
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.toString()).toBe('PDF');
  });

  test('exportCoverLetterToDocx returns buffer from mocked Packer', async () => {
    const coverLetter = { content: 'Hello\nDocx\nThanks' };
    const buf = await exporter.exportCoverLetterToDocx(coverLetter, {});
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.toString()).toBe('DOCX');
  });

  test('generateEmailTemplate creates subject and signature properly', () => {
    const coverLetter = { content: 'Hello\nI like this job\nSincerely\nSam' };
    const tmpl = exporter.generateEmailTemplate(coverLetter, {
      contactInfo: { name: 'Sam Smith', email: 'sam@smith.com', phone: '101-202' },
      jobDetails: { jobTitle: 'Engineer', company: 'Gamma' }
    });

    expect(tmpl.subject).toContain('Engineer');
    expect(tmpl.subject).toContain('Gamma');
    expect(tmpl.subject).toContain('Sam Smith');
    expect(tmpl.body).toContain('I like this job');
    expect(tmpl.body).toContain('sam@smith.com');
  });
});
