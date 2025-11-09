import { jest } from '@jest/globals';

// We'll mock the 'docx' module to capture Document config and return a fake buffer
async function importWithDocxMock(docxMock) {
  jest.resetModules();
  await jest.unstable_mockModule('docx', () => docxMock);
  return import('../resumeExporter.js');
}

describe('resumeExporter utilities', () => {
  test('exportToHtml includes all provided sections and links', async () => {
    const { exportToHtml } = await import('../resumeExporter.js');

    const resume = {
      name: 'Jane Doe',
      sections: {
        contactInfo: { fullName: 'Jane Doe', email: 'jane@example.com', phone: '555-1234', linkedin: 'https://lnkd.in/jane', website: 'https://jane.dev' },
        summary: 'Experienced developer',
        experience: [{ jobTitle: 'Dev', company: 'Acme', startDate: '2020', endDate: '2021', location: 'City', bullets: ['Did X'] }],
        skills: ['JS','Node'],
        education: [{ degree: 'BSc', institution: 'State U', graduationYear: '2019', gpa: '3.9' }],
        projects: [{ name: 'Proj', technologies: ['React'], bullets: ['Built it'] }],
        certifications: [{ name: 'Cert', issuingOrganization: 'Org', dateObtained: '2020-01-01' }]
      }
    };

    const html = exportToHtml(resume, { theme: { colors: { primary: '#112233', text: '#445566' } } });

    expect(html).toContain('<h1>Jane Doe</h1>');
    expect(html).toContain('jane@example.com');
    expect(html).toContain('Experienced developer');
  // HTML headings are title-cased
  expect(html).toContain('Experience');
  expect(html).toContain('Skills');
  expect(html).toContain('Education');
  expect(html).toContain('Projects');
  expect(html).toContain('Certifications');
    // links should be anchor tags
    expect(html).toContain('<a href="https://lnkd.in/jane">');
    expect(html).toContain('<a href="https://jane.dev">');
  });

  test('exportToPlainText formats plain text output including bullets and GPA', async () => {
    const { exportToPlainText } = await import('../resumeExporter.js');

    const resume = {
      name: 'Joe Bloggs',
      sections: {
        contactInfo: { fullName: 'Joe Bloggs', email: 'joe@example.com', phone: '111-222' },
        summary: 'Sums',
        experience: [{ jobTitle: 'Eng', company: 'Co', startDate: '2018', endDate: '2019', location: 'Nowhere', bullets: ['X','Y'] }],
        skills: ['A','B'],
        education: [{ degree: 'MS', institution: 'Uni', graduationYear: '2020', gpa: '4.0' }],
        projects: [{ name: 'P', technologies: ['T1'], bullets: ['One'] }],
        certifications: [{ name: 'Cert' }]
      }
    };

    const txt = exportToPlainText(resume);
    expect(txt).toContain('Joe Bloggs');
    expect(txt).toContain('Email: joe@example.com');
    expect(txt).toContain('PROFESSIONAL SUMMARY');
    expect(txt).toContain('EXPERIENCE');
    expect(txt).toContain('  • X');
    expect(txt).toContain('SKILLS');
    expect(txt).toContain('EDUCATION');
    expect(txt).toContain('GPA: 4.0');
    expect(txt).toContain('PROJECTS');
    expect(txt).toContain('CERTIFICATIONS');
  });

  test('exportToDocx returns a Buffer and respects watermark and color formats', async () => {
    // Build a mock for docx that captures the Document config passed in
    const captured = { docConfig: null };

    const docxMock = {
      __esModule: true,
      Document: function(conf) { captured.docConfig = conf; return { _conf: conf }; },
      Paragraph: function(obj) { return obj; },
      TextRun: function(obj) { return obj; },
      HeadingLevel: { HEADING_1: 'h1', HEADING_2: 'h2' },
      AlignmentType: { CENTER: 'center' },
      Packer: { toBuffer: async (doc) => new Uint8Array(Buffer.from('docx-mock')) }
    };

    const mod = await importWithDocxMock(docxMock);

    const resume = {
      name: 'Docx Person',
      sections: {
        contactInfo: { fullName: 'Docx Person', email: 'd@x.com' },
        summary: 'S',
        skills: ['X']
      }
    };

    // Use various color formats to exercise toDocxColor
    const template = { theme: { colors: { primary: 'rgb(10,20,30)', text: '#abc' } } };

    const buf = await mod.exportToDocx(resume, template, { enabled: true, text: 'SAMPLE' });
  // Packer.toBuffer mock returns a Uint8Array; accept either Buffer or Uint8Array
  expect(Buffer.isBuffer(buf) || buf instanceof Uint8Array).toBe(true);
    // Document config should include watermark property set
    expect(captured.docConfig).not.toBeNull();
    expect(captured.docConfig.sections[0].properties.watermark).toBeDefined();
    expect(captured.docConfig.sections[0].properties.watermark.text).toBe('SAMPLE');

    // Colors in children should have been converted to 6-digit hex strings somewhere in the captured children
    const children = captured.docConfig.sections[0].children || [];
    const colorValues = JSON.stringify(children);
    expect(colorValues).toMatch(/[0-9A-F]{6}/);
  });

  test('exportToDocx with full sections exercises experience/projects/education/certifications', async () => {
    const captured = { docConfig: null };
    const docxMock = {
      __esModule: true,
      Document: function(conf) { captured.docConfig = conf; return { _conf: conf }; },
      Paragraph: function(obj) { return obj; },
      TextRun: function(obj) { return obj; },
      HeadingLevel: { HEADING_1: 'h1', HEADING_2: 'h2' },
      AlignmentType: { CENTER: 'center' },
      Packer: { toBuffer: async (doc) => new Uint8Array(Buffer.from('docx-full')) }
    };

    const mod = await importWithDocxMock(docxMock);

    const resume = {
      sections: {
        contactInfo: { fullName: 'Full Name' },
        summary: 'A long summary',
        experience: [
          { jobTitle: 'Dev', company: 'AC', startDate: '2017-01', endDate: '2018-01', location: 'L1', bullets: ['One','Two'] },
          { jobTitle: 'SWE', company: 'BC', startDate: '2019-01', isCurrentPosition: true, location: 'L2', bullets: [] }
        ],
        skills: [ { name: 'JavaScript' }, 'TypeScript' ],
        education: [ { degree: 'PhD', institution: 'Uni', graduationDate: '2022', gpa: '3.8' } ],
        projects: [ { name: 'ProjX', technologies: ['T1','T2'], bullets: ['Did it'] } ],
        certifications: [ { name: 'CertX', issuingOrganization: 'OrgX', dateObtained: '2021-05-05' } ]
      }
    };

    const template = { theme: { colors: { primary: '#abc', text: 'rgb(200,10,10)' } } };
    const out = await mod.exportToDocx(resume, template, null);
    expect(out instanceof Uint8Array || Buffer.isBuffer(out)).toBe(true);

    // Verify that job titles and project names appear in the captured children
    const children = JSON.stringify(captured.docConfig.sections[0].children || []);
    expect(children).toContain('Dev');
    expect(children).toContain('SWE');
    expect(children).toContain('ProjX');
    expect(children).toContain('PhD');
    expect(children).toContain('CertX');
  });
});
import { exportToHtml, exportToPlainText } from '../resumeExporter.js';

describe('resumeExporter', () => {
  const resume = {
    name: 'Jane Doe',
    sections: {
      contactInfo: { fullName: 'Jane Doe', email: 'jane@example.com', phone: '123-456-7890', linkedin: 'https://linkedin.example' },
      summary: 'Experienced developer',
      experience: [ { jobTitle: 'Engineer', company: 'Acme', location: 'NY', startDate: 'Jan 2020', endDate: 'Dec 2021', bullets: ['Did X','Did Y'] } ],
      skills: ['JS','Node'],
      education: [ { degree: 'BSc', institution: 'Uni', graduationYear: '2020', gpa: '3.9' } ],
      projects: [ { name: 'Proj', technologies: ['React'], bullets: ['Built UI'] } ],
      certifications: [ { name: 'Cert', issuingOrganization: 'Org', dateObtained: '2021' } ]
    }
  };

  const template = { theme: { colors: { primary: '#123456', text: '#222222' } } };

  it('generates HTML containing key sections and contact info', () => {
    const html = exportToHtml(resume, template);
    expect(html).toContain('Jane Doe');
    expect(html).toContain('jane@example.com');
  expect(html).toContain('Experienced developer');
  expect(html).toContain('Engineer');
  expect(html).toContain('<h2>Skills</h2>');
    // Basic HTML structure
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<h2>Experience</h2>');
  });

  it('generates plain text with bullets and headers', () => {
    const txt = exportToPlainText(resume);
    expect(txt).toContain('Jane Doe');
    expect(txt).toContain('PROFESSIONAL SUMMARY');
    expect(txt).toContain('EXPERIENCE');
    expect(txt).toContain('Engineer | Acme');
    expect(txt).toContain('• Did X');
    expect(txt).toContain('SKILLS');
    expect(txt).toContain('EDUCATION');
  });
});
