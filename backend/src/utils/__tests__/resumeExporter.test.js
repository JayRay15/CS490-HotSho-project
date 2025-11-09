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
