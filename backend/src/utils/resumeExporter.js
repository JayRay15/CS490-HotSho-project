/**
 * Resume Export Service (UC-51)
 * Handles export of resumes to multiple formats: DOCX, HTML, Plain Text
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

// Helper to convert various color inputs to 6-digit HEX for docx (no leading #)
const toDocxColor = (input) => {
  if (!input || typeof input !== 'string') return '000000';
  let c = input.trim().toLowerCase();

  // rgb/rgba(r,g,b[,a]) -> hex
  if (c.startsWith('rgb')) {
    const m = c.match(/rgba?\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*(?:\.\d+)?))?\)/);
    if (m) {
      const r = Math.max(0, Math.min(255, parseInt(m[1], 10)));
      const g = Math.max(0, Math.min(255, parseInt(m[2], 10)));
      const b = Math.max(0, Math.min(255, parseInt(m[3], 10)));
      const to2 = (n) => n.toString(16).padStart(2, '0');
      return `${to2(r)}${to2(g)}${to2(b)}`.toUpperCase();
    }
    return '000000';
  }

  // Remove leading # if present
  if (c.startsWith('#')) c = c.slice(1);

  // Expand 3-digit hex to 6-digit
  if (/^[0-9a-f]{3}$/.test(c)) {
    c = c.split('').map((ch) => ch + ch).join('');
  }

  // 6-digit hex
  if (/^[0-9a-f]{6}$/.test(c)) return c.toUpperCase();

  // Basic named colors mapping as fallback
  const NAMED = {
    black: '000000',
    white: 'FFFFFF',
    red: 'FF0000',
    blue: '0000FF',
    green: '008000',
    gray: '808080',
    grey: '808080',
  };
  if (NAMED[c]) return NAMED[c];

  // Default safe color
  return '000000';
};

/**
 * Export resume to DOCX format
 * @param {Object} resume - Resume data
 * @param {Object} template - Template with styling info
 * @returns {Promise<Buffer>} DOCX file buffer
 */
export async function exportToDocx(resume, template, watermarkOptions = null) {
  const sections = resume.sections || {};
  const theme = template?.theme || { colors: { primary: '#4F5348', text: '#222' } };
  
  const docSections = [];

  // Header with name
  if (sections.contactInfo) {
    const contact = sections.contactInfo;
    const nameText = contact.fullName || contact.name || resume.name || 'Your Name';
    docSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: nameText,
            bold: true,
            color: toDocxColor(theme.colors?.primary || '#4F5348'),
          })
        ],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    // Contact details
    const contactDetails = [];
    if (contact.email) contactDetails.push(contact.email);
    if (contact.phone) contactDetails.push(contact.phone);
    if (contact.location) contactDetails.push(contact.location);
    if (contact.linkedin) contactDetails.push(contact.linkedin);
    if (contact.website) contactDetails.push(contact.website);

    if (contactDetails.length > 0) {
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: contactDetails.join(' | '),
              color: toDocxColor(theme.colors?.text || '#222')
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );
    }
  }

  // Professional Summary
  if (sections.summary) {
    docSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PROFESSIONAL SUMMARY',
            bold: true,
            color: toDocxColor(theme.colors?.primary || '#4F5348')
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: sections.summary,
            color: toDocxColor(theme.colors?.text || '#222')
          })
        ],
        spacing: { after: 400 }
      })
    );
  }

  // Experience
  if (sections.experience && sections.experience.length > 0) {
    docSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'EXPERIENCE',
            bold: true,
            color: toDocxColor(theme.colors?.primary || '#4F5348')
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      })
    );

    sections.experience.forEach(exp => {
      // Job title and company
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.jobTitle || 'Job Title',
              bold: true,
              size: 24,
              color: toDocxColor(theme.colors?.text || '#222')
            }),
            new TextRun({
              text: ` | ${exp.company || 'Company'}`,
              size: 24,
              color: toDocxColor(theme.colors?.text || '#222')
            })
          ],
          spacing: { before: 200, after: 100 }
        })
      );

      // Location and dates
      const dateStr = `${exp.startDate || 'Start'} - ${exp.isCurrentPosition ? 'Present' : exp.endDate || 'End'}`;
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${exp.location || ''} | ${dateStr}`,
              italics: true,
              color: toDocxColor(theme.colors?.text || '#222')
            })
          ],
          spacing: { after: 100 }
        })
      );

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          docSections.push(
            new Paragraph({
              children: [new TextRun({ text: bullet, color: toDocxColor(theme.colors?.text || '#222') })],
              bullet: { level: 0 },
              spacing: { after: 100 }
            })
          );
        });
      }

      docSections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    });
  }

  // Skills
  if (sections.skills && sections.skills.length > 0) {
    docSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'SKILLS',
            bold: true,
            color: toDocxColor(theme.colors?.primary || '#4F5348')
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      })
    );

    const skillNames = sections.skills.map(skill => 
      typeof skill === 'string' ? skill : skill.name
    ).join(', ');

    docSections.push(
      new Paragraph({
        children: [new TextRun({ text: skillNames, color: toDocxColor(theme.colors?.text || '#222') })],
        spacing: { after: 400 }
      })
    );
  }

  // Education
  if (sections.education && sections.education.length > 0) {
    docSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'EDUCATION',
            bold: true,
            color: toDocxColor(theme.colors?.primary || '#4F5348')
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      })
    );

    sections.education.forEach(edu => {
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree || 'Degree',
              bold: true,
              color: toDocxColor(theme.colors?.text || '#222')
            }),
            new TextRun({
              text: ` | ${edu.institution || 'Institution'}`,
              color: toDocxColor(theme.colors?.text || '#222')
            })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Graduated: ${edu.graduationYear || edu.graduationDate || 'Year'} | GPA: ${edu.gpa || 'N/A'}`,
              italics: true,
              color: toDocxColor(theme.colors?.text || '#222')
            })
          ],
          spacing: { after: 200 }
        })
      );
    });
  }

  // Projects
  if (sections.projects && sections.projects.length > 0) {
    docSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PROJECTS',
            bold: true,
            color: toDocxColor(theme.colors?.primary || '#4F5348')
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      })
    );

    sections.projects.forEach(proj => {
      docSections.push(
        new Paragraph({
          text: proj.name || 'Project Name',
          bold: true,
          spacing: { after: 100 }
        })
      );

      if (proj.technologies && proj.technologies.length > 0) {
        docSections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Technologies: ${proj.technologies.join(', ')}`,
                italics: true,
                color: toDocxColor(theme.colors?.text || '#222')
              })
            ],
            spacing: { after: 100 }
          })
        );
      }

      if (proj.bullets && proj.bullets.length > 0) {
        proj.bullets.forEach(bullet => {
          docSections.push(
            new Paragraph({
              children: [new TextRun({ text: bullet, color: toDocxColor(theme.colors?.text || '#222') })],
              bullet: { level: 0 },
              spacing: { after: 100 }
            })
          );
        });
      }

      docSections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    });
  }

  // Certifications
  if (sections.certifications && sections.certifications.length > 0) {
    docSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'CERTIFICATIONS',
            bold: true,
            color: toDocxColor(theme.colors?.primary || '#4F5348')
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      })
    );

    sections.certifications.forEach(cert => {
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cert.name || 'Certification',
              bold: true,
              color: toDocxColor(theme.colors?.text || '#222')
            }),
            new TextRun({
              text: ` - ${cert.issuingOrganization || 'Organization'}`,
              color: toDocxColor(theme.colors?.text || '#222')
            }),
            new TextRun({
              text: cert.dateObtained ? ` (${cert.dateObtained})` : '',
              italics: true,
              color: toDocxColor(theme.colors?.text || '#222')
            })
          ],
          spacing: { after: 100 }
        })
      );
    });
  }

  // Create document with optional watermark
  const docConfig = {
    sections: [{
      properties: {},
      children: docSections
    }]
  };
  
  // UC-51: Add watermark if enabled
  if (watermarkOptions && watermarkOptions.enabled && watermarkOptions.text) {
    docConfig.sections[0].properties.watermark = {
      text: watermarkOptions.text,
      color: 'CCCCCC',
      opacity: 0.3
    };
  }
  
  const doc = new Document(docConfig);

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Export resume to HTML format
 * @param {Object} resume - Resume data
 * @param {Object} template - Template with styling info
 * @returns {string} HTML string
 */
export function exportToHtml(resume, template) {
  const sections = resume.sections || {};
  const theme = template?.theme || { colors: { primary: '#4F5348', text: '#222' } };
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${resume.name || 'Resume'}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      color: ${theme.colors.text || '#222'};
      line-height: 1.6;
    }
    h1 {
      color: ${theme.colors.primary || '#4F5348'};
      text-align: center;
      margin-bottom: 0.25in;
      font-size: 28px;
    }
    h2 {
      color: ${theme.colors.primary || '#4F5348'};
      border-bottom: 2px solid ${theme.colors.primary || '#4F5348'};
      padding-bottom: 5px;
      margin-top: 0.3in;
      margin-bottom: 0.15in;
      font-size: 18px;
      text-transform: uppercase;
    }
    .contact-info {
      text-align: center;
      margin-bottom: 0.3in;
      color: #666;
    }
    .job-header {
      font-weight: bold;
      font-size: 16px;
      margin-top: 0.15in;
    }
    .job-meta {
      color: #666;
      font-style: italic;
      margin-bottom: 0.1in;
    }
    ul {
      margin: 0;
      padding-left: 1.2em;
    }
    li {
      margin-bottom: 0.05in;
    }
    .section {
      margin-bottom: 0.2in;
    }
  </style>
</head>
<body>`;

  // Contact Info / Header
  if (sections.contactInfo) {
    const contact = sections.contactInfo;
    html += `
  <h1>${contact.fullName || contact.name || resume.name || 'Your Name'}</h1>
  <div class="contact-info">`;
    
    const contactDetails = [];
    if (contact.email) contactDetails.push(contact.email);
    if (contact.phone) contactDetails.push(contact.phone);
    if (contact.location) contactDetails.push(contact.location);
    if (contact.linkedin) contactDetails.push(`<a href="${contact.linkedin}">${contact.linkedin}</a>`);
    if (contact.website) contactDetails.push(`<a href="${contact.website}">${contact.website}</a>`);
    
    html += contactDetails.join(' | ');
    html += `
  </div>`;
  }

  // Summary
  if (sections.summary) {
    html += `
  <h2>Professional Summary</h2>
  <p>${sections.summary}</p>`;
  }

  // Experience
  if (sections.experience && sections.experience.length > 0) {
    html += `
  <h2>Experience</h2>`;
    
    sections.experience.forEach(exp => {
      const dateStr = `${exp.startDate || 'Start'} - ${exp.isCurrentPosition ? 'Present' : exp.endDate || 'End'}`;
      html += `
  <div class="section">
    <div class="job-header">${exp.jobTitle || 'Job Title'} | ${exp.company || 'Company'}</div>
    <div class="job-meta">${exp.location || ''} | ${dateStr}</div>`;
      
      if (exp.bullets && exp.bullets.length > 0) {
        html += `
    <ul>`;
        exp.bullets.forEach(bullet => {
          html += `
      <li>${bullet}</li>`;
        });
        html += `
    </ul>`;
      }
      html += `
  </div>`;
    });
  }

  // Skills
  if (sections.skills && sections.skills.length > 0) {
    html += `
  <h2>Skills</h2>
  <p>`;
    const skillNames = sections.skills.map(skill => 
      typeof skill === 'string' ? skill : skill.name
    ).join(', ');
    html += skillNames;
    html += `</p>`;
  }

  // Education
  if (sections.education && sections.education.length > 0) {
    html += `
  <h2>Education</h2>`;
    
    sections.education.forEach(edu => {
      html += `
  <div class="section">
    <div class="job-header">${edu.degree || 'Degree'} | ${edu.institution || 'Institution'}</div>
    <div class="job-meta">Graduated: ${edu.graduationYear || edu.graduationDate || 'Year'} | GPA: ${edu.gpa || 'N/A'}</div>
  </div>`;
    });
  }

  // Projects
  if (sections.projects && sections.projects.length > 0) {
    html += `
  <h2>Projects</h2>`;
    
    sections.projects.forEach(proj => {
      html += `
  <div class="section">
    <div class="job-header">${proj.name || 'Project Name'}</div>`;
      
      if (proj.technologies && proj.technologies.length > 0) {
        html += `
    <div class="job-meta">Technologies: ${proj.technologies.join(', ')}</div>`;
      }
      
      if (proj.bullets && proj.bullets.length > 0) {
        html += `
    <ul>`;
        proj.bullets.forEach(bullet => {
          html += `
      <li>${bullet}</li>`;
        });
        html += `
    </ul>`;
      }
      html += `
  </div>`;
    });
  }

  // Certifications
  if (sections.certifications && sections.certifications.length > 0) {
    html += `
  <h2>Certifications</h2>
  <ul>`;
    
    sections.certifications.forEach(cert => {
      html += `
    <li><strong>${cert.name || 'Certification'}</strong> - ${cert.issuingOrganization || 'Organization'}${cert.dateObtained ? ` (${cert.dateObtained})` : ''}</li>`;
    });
    
    html += `
  </ul>`;
  }

  html += `
</body>
</html>`;

  return html;
}

/**
 * Export resume to plain text format
 * @param {Object} resume - Resume data
 * @returns {string} Plain text string
 */
export function exportToPlainText(resume) {
  const sections = resume.sections || {};
  let text = '';

  // Contact Info / Header
  if (sections.contactInfo) {
    const contact = sections.contactInfo;
    const nameText = contact.fullName || contact.name || resume.name || 'Your Name';
    text += `${nameText}\n`;
    text += '='.repeat(nameText.length) + '\n\n';
    
    if (contact.email) text += `Email: ${contact.email}\n`;
    if (contact.phone) text += `Phone: ${contact.phone}\n`;
    if (contact.location) text += `Location: ${contact.location}\n`;
    if (contact.linkedin) text += `LinkedIn: ${contact.linkedin}\n`;
    if (contact.website) text += `Website: ${contact.website}\n`;
    text += '\n';
  }

  // Summary
  if (sections.summary) {
    text += 'PROFESSIONAL SUMMARY\n';
    text += '-------------------\n\n';
    text += sections.summary + '\n\n';
  }

  // Experience
  if (sections.experience && sections.experience.length > 0) {
    text += 'EXPERIENCE\n';
    text += '----------\n\n';
    
    sections.experience.forEach(exp => {
      const dateStr = `${exp.startDate || 'Start'} - ${exp.isCurrentPosition ? 'Present' : exp.endDate || 'End'}`;
      text += `${exp.jobTitle || 'Job Title'} | ${exp.company || 'Company'}\n`;
      text += `${exp.location || ''} | ${dateStr}\n`;
      
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          text += `  • ${bullet}\n`;
        });
      }
      text += '\n';
    });
  }

  // Skills
  if (sections.skills && sections.skills.length > 0) {
    text += 'SKILLS\n';
    text += '------\n\n';
    const skillNames = sections.skills.map(skill => 
      typeof skill === 'string' ? skill : skill.name
    ).join(', ');
    text += skillNames + '\n\n';
  }

  // Education
  if (sections.education && sections.education.length > 0) {
    text += 'EDUCATION\n';
    text += '---------\n\n';
    
    sections.education.forEach(edu => {
      text += `${edu.degree || 'Degree'} | ${edu.institution || 'Institution'}\n`;
      text += `Graduated: ${edu.graduationYear || edu.graduationDate || 'Year'} | GPA: ${edu.gpa || 'N/A'}\n\n`;
    });
  }

  // Projects
  if (sections.projects && sections.projects.length > 0) {
    text += 'PROJECTS\n';
    text += '--------\n\n';
    
    sections.projects.forEach(proj => {
      text += `${proj.name || 'Project Name'}\n`;
      
      if (proj.technologies && proj.technologies.length > 0) {
        text += `Technologies: ${proj.technologies.join(', ')}\n`;
      }
      
      if (proj.bullets && proj.bullets.length > 0) {
        proj.bullets.forEach(bullet => {
          text += `  • ${bullet}\n`;
        });
      }
      text += '\n';
    });
  }

  // Certifications
  if (sections.certifications && sections.certifications.length > 0) {
    text += 'CERTIFICATIONS\n';
    text += '--------------\n\n';
    
    sections.certifications.forEach(cert => {
      text += `  • ${cert.name || 'Certification'} - ${cert.issuingOrganization || 'Organization'}`;
      if (cert.dateObtained) text += ` (${cert.dateObtained})`;
      text += '\n';
    });
  }

  return text;
}
