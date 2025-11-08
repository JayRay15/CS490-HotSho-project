/**
 * Cover Letter Export Service (UC-054)
 * Handles export of cover letters to multiple formats: PDF, DOCX, HTML, Plain Text
 * Supports custom letterheads, multiple formatting styles, and email integration
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer, PageBreak } from 'docx';
import { htmlToPdf } from './htmlToPdf.js';

/**
 * Formatting styles for cover letters
 */
const COVER_LETTER_STYLES = {
    formal: {
        fontFamily: 'Times New Roman',
        fontSize: 12,
        lineSpacing: 1.15,
        paragraphSpacing: 12,
        marginTop: 72, // 1 inch
        marginBottom: 72,
        marginLeft: 72,
        marginRight: 72
    },
    modern: {
        fontFamily: 'Calibri',
        fontSize: 11,
        lineSpacing: 1.15,
        paragraphSpacing: 10,
        marginTop: 54, // 0.75 inch
        marginBottom: 54,
        marginLeft: 54,
        marginRight: 54
    },
    creative: {
        fontFamily: 'Arial',
        fontSize: 11,
        lineSpacing: 1.2,
        paragraphSpacing: 14,
        marginTop: 54,
        marginBottom: 54,
        marginLeft: 54,
        marginRight: 54
    },
    technical: {
        fontFamily: 'Arial',
        fontSize: 11,
        lineSpacing: 1.15,
        paragraphSpacing: 10,
        marginTop: 72,
        marginBottom: 72,
        marginLeft: 72,
        marginRight: 72
    },
    executive: {
        fontFamily: 'Georgia',
        fontSize: 12,
        lineSpacing: 1.2,
        paragraphSpacing: 14,
        marginTop: 72,
        marginBottom: 72,
        marginLeft: 90,
        marginRight: 90
    }
};

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
 * Generate filename for cover letter export
 * Format: FirstName_LastName_CoverLetter_CompanyName_JobTitle_YYYYMMDD.ext
 * @param {Object} coverLetter - Cover letter data
 * @param {Object} contactInfo - Contact information
 * @param {Object} jobDetails - Optional job details
 * @param {String} extension - File extension (pdf, docx, html, txt)
 * @returns {String} Generated filename
 */
export function generateCoverLetterFilename(coverLetter, contactInfo, jobDetails, extension) {
    const parts = [];

    // Add name
    if (contactInfo?.name) {
        const nameParts = contactInfo.name.split(' ').filter(Boolean);
        parts.push(...nameParts);
    } else {
        parts.push('CoverLetter');
    }

    // Add type
    parts.push('CoverLetter');

    // Add company and job title if available
    if (jobDetails?.company) {
        parts.push(jobDetails.company.replace(/[^a-zA-Z0-9]/g, ''));
    }
    if (jobDetails?.jobTitle) {
        parts.push(jobDetails.jobTitle.replace(/[^a-zA-Z0-9]/g, ''));
    }

    // Add date
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    parts.push(date);

    // Combine and add extension
    const filename = parts.join('_') + `.${extension}`;

    // Ensure filename is not too long (max 200 chars)
    return filename.length > 200 ? filename.substring(0, 196) + `.${extension}` : filename;
}

/**
 * Parse cover letter content to extract structured data
 * @param {String} content - Cover letter content
 * @returns {Object} Parsed content with sections
 */
function parseCoverLetterContent(content) {
    if (!content) return { body: '' };

    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);

    // Try to identify sections
    const parsed = {
        greeting: null,
        body: [],
        closing: null,
        signature: null
    };

    // First line is often greeting
    if (lines.length > 0 && (lines[0].toLowerCase().startsWith('dear') ||
        lines[0].toLowerCase().startsWith('hi') ||
        lines[0].toLowerCase().startsWith('hello'))) {
        parsed.greeting = lines[0];
        lines.shift();
    }

    // Last 1-2 lines are often closing and signature
    if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        const secondLastLine = lines.length > 1 ? lines[lines.length - 2] : null;

        // Check if last line looks like a name
        if (lastLine.split(' ').length <= 4 && !lastLine.endsWith('.')) {
            parsed.signature = lastLine;
            lines.pop();
        }

        // Check if second-to-last line is a closing
        if (secondLastLine && (secondLastLine.toLowerCase().includes('sincerely') ||
            secondLastLine.toLowerCase().includes('regards') ||
            secondLastLine.toLowerCase().includes('best') ||
            secondLastLine.toLowerCase().includes('yours'))) {
            parsed.closing = lines.pop();
        }
    }

    // Remaining lines are body
    parsed.body = lines;

    return parsed;
}

/**
 * Export cover letter to DOCX format
 * @param {Object} coverLetter - Cover letter data
 * @param {Object} options - Export options (style, letterhead, etc.)
 * @returns {Promise<Buffer>} DOCX file buffer
 */
export async function exportCoverLetterToDocx(coverLetter, options = {}) {
    const {
        style = coverLetter.style || 'formal',
        letterhead = null,
        contactInfo = null,
        jobDetails = null,
        template = null,
        printOptimized = false
    } = options;

    const styleConfig = COVER_LETTER_STYLES[style] || COVER_LETTER_STYLES.formal;
    const theme = template?.theme || { colors: { primary: '#4F5348', text: '#222' } };

    const sections = [];

    // Create letterhead if provided
    if (letterhead && letterhead.enabled) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: letterhead.name || contactInfo?.name || '',
                        bold: true,
                        size: 28,
                        color: toDocxColor(theme.colors?.primary || '#4F5348')
                    })
                ],
                alignment: letterhead.alignment === 'center' ? AlignmentType.CENTER :
                    letterhead.alignment === 'right' ? AlignmentType.RIGHT :
                        AlignmentType.LEFT,
                spacing: { after: 100 }
            })
        );

        if (letterhead.address || contactInfo?.address) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: letterhead.address || contactInfo?.address || '',
                            size: 20,
                            color: toDocxColor(theme.colors?.text || '#222')
                        })
                    ],
                    alignment: letterhead.alignment === 'center' ? AlignmentType.CENTER :
                        letterhead.alignment === 'right' ? AlignmentType.RIGHT :
                            AlignmentType.LEFT,
                    spacing: { after: 50 }
                })
            );
        }

        // Contact details
        const contactDetails = [];
        if (contactInfo?.phone || letterhead.phone) contactDetails.push(contactInfo?.phone || letterhead.phone);
        if (contactInfo?.email || letterhead.email) contactDetails.push(contactInfo?.email || letterhead.email);
        if (contactInfo?.website || letterhead.website) contactDetails.push(contactInfo?.website || letterhead.website);

        if (contactDetails.length > 0) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: contactDetails.join(' | '),
                            size: 20,
                            color: toDocxColor(theme.colors?.text || '#222')
                        })
                    ],
                    alignment: letterhead.alignment === 'center' ? AlignmentType.CENTER :
                        letterhead.alignment === 'right' ? AlignmentType.RIGHT :
                            AlignmentType.LEFT,
                    spacing: { after: 400 }
                })
            );
        }
    } else if (contactInfo) {
        // Default header without custom letterhead
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: contactInfo.name || '',
                        bold: true,
                        size: 24,
                        color: toDocxColor(theme.colors?.primary || '#4F5348')
                    })
                ],
                spacing: { after: 100 }
            })
        );

        const contactDetails = [];
        if (contactInfo.email) contactDetails.push(contactInfo.email);
        if (contactInfo.phone) contactDetails.push(contactInfo.phone);
        if (contactInfo.address) contactDetails.push(contactInfo.address);

        if (contactDetails.length > 0) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: contactDetails.join(' | '),
                            size: 20,
                            color: toDocxColor(theme.colors?.text || '#222')
                        })
                    ],
                    spacing: { after: 200 }
                })
            );
        }
    }

    // Add date
    const date = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: date,
                    size: 22,
                    color: toDocxColor(theme.colors?.text || '#222')
                })
            ],
            spacing: { after: 200 }
        })
    );

    // Add recipient information if job details provided
    if (jobDetails && jobDetails.company) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: jobDetails.hiringManager || 'Hiring Manager',
                        size: 22,
                        color: toDocxColor(theme.colors?.text || '#222')
                    })
                ],
                spacing: { after: 50 }
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: jobDetails.company,
                        size: 22,
                        color: toDocxColor(theme.colors?.text || '#222')
                    })
                ],
                spacing: { after: 50 }
            })
        );

        if (jobDetails.companyAddress) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: jobDetails.companyAddress,
                            size: 22,
                            color: toDocxColor(theme.colors?.text || '#222')
                        })
                    ],
                    spacing: { after: 200 }
                })
            );
        } else {
            sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        }
    }

    // Parse and add content
    const parsed = parseCoverLetterContent(coverLetter.content);

    // Greeting
    if (parsed.greeting) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: parsed.greeting,
                        size: 22,
                        color: toDocxColor(theme.colors?.text || '#222')
                    })
                ],
                spacing: { after: 200 }
            })
        );
    }

    // Body paragraphs
    parsed.body.forEach((paragraph, index) => {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: paragraph,
                        size: 22,
                        color: toDocxColor(theme.colors?.text || '#222')
                    })
                ],
                spacing: {
                    after: index < parsed.body.length - 1 ? styleConfig.paragraphSpacing * 10 : 200
                },
                alignment: AlignmentType.JUSTIFIED
            })
        );
    });

    // Closing
    if (parsed.closing) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: parsed.closing,
                        size: 22,
                        color: toDocxColor(theme.colors?.text || '#222')
                    })
                ],
                spacing: { after: 200 }
            })
        );
    }

    // Signature
    if (parsed.signature) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: parsed.signature,
                        size: 22,
                        color: toDocxColor(theme.colors?.text || '#222')
                    })
                ]
            })
        );
    }

    // Create document
    const docConfig = {
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: printOptimized ? styleConfig.marginTop : styleConfig.marginTop - 360,
                        bottom: printOptimized ? styleConfig.marginBottom : styleConfig.marginBottom - 360,
                        left: styleConfig.marginLeft,
                        right: styleConfig.marginRight
                    }
                }
            },
            children: sections
        }]
    };

    const doc = new Document(docConfig);

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);
    return buffer;
}

/**
 * Export cover letter to HTML format
 * @param {Object} coverLetter - Cover letter data
 * @param {Object} options - Export options
 * @returns {String} HTML string
 */
export function exportCoverLetterToHtml(coverLetter, options = {}) {
    const {
        style = coverLetter.style || 'formal',
        letterhead = null,
        contactInfo = null,
        jobDetails = null,
        template = null,
        printOptimized = false
    } = options;

    const styleConfig = COVER_LETTER_STYLES[style] || COVER_LETTER_STYLES.formal;
    const theme = template?.theme || { colors: { primary: '#4F5348', text: '#222' } };

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${coverLetter.name || 'Cover Letter'}</title>
  <style>
    @page {
      size: letter;
      margin: ${printOptimized ? '1in' : '0.5in'};
    }
    body {
      font-family: '${styleConfig.fontFamily}', serif;
      font-size: ${styleConfig.fontSize}pt;
      line-height: ${styleConfig.lineSpacing};
      color: ${theme.colors.text || '#222'};
      max-width: ${printOptimized ? '100%' : '8.5in'};
      margin: 0 auto;
      padding: ${printOptimized ? '0' : '0.5in'};
    }
    .letterhead {
      margin-bottom: 2em;
      text-align: ${letterhead?.alignment || 'left'};
    }
    .letterhead h1 {
      color: ${theme.colors.primary || '#4F5348'};
      font-size: 18pt;
      margin: 0 0 0.25em 0;
    }
    .letterhead p {
      margin: 0.25em 0;
      font-size: 10pt;
    }
    .date {
      margin: 1em 0;
    }
    .recipient {
      margin: 1em 0 2em 0;
    }
    .recipient p {
      margin: 0.25em 0;
    }
    .greeting {
      margin: 1em 0;
    }
    .body p {
      margin: ${styleConfig.paragraphSpacing}pt 0;
      text-align: justify;
    }
    .closing {
      margin: 1em 0 0.5em 0;
    }
    .signature {
      margin: 0.5em 0;
    }
    @media print {
      body {
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>`;

    // Letterhead
    if (letterhead && letterhead.enabled) {
        html += `
  <div class="letterhead">
    <h1>${letterhead.name || contactInfo?.name || ''}</h1>`;

        if (letterhead.address || contactInfo?.address) {
            html += `
    <p>${letterhead.address || contactInfo?.address || ''}</p>`;
        }

        const contactDetails = [];
        if (contactInfo?.phone || letterhead.phone) contactDetails.push(contactInfo?.phone || letterhead.phone);
        if (contactInfo?.email || letterhead.email) contactDetails.push(contactInfo?.email || letterhead.email);
        if (contactInfo?.website || letterhead.website) contactDetails.push(contactInfo?.website || letterhead.website);

        if (contactDetails.length > 0) {
            html += `
    <p>${contactDetails.join(' | ')}</p>`;
        }

        html += `
  </div>`;
    } else if (contactInfo) {
        // Default header
        html += `
  <div class="letterhead">
    <h1>${contactInfo.name || ''}</h1>`;

        const contactDetails = [];
        if (contactInfo.email) contactDetails.push(contactInfo.email);
        if (contactInfo.phone) contactDetails.push(contactInfo.phone);
        if (contactInfo.address) contactDetails.push(contactInfo.address);

        if (contactDetails.length > 0) {
            html += `
    <p>${contactDetails.join(' | ')}</p>`;
        }

        html += `
  </div>`;
    }

    // Date
    const date = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    html += `
  <div class="date">
    <p>${date}</p>
  </div>`;

    // Recipient
    if (jobDetails && jobDetails.company) {
        html += `
  <div class="recipient">
    <p>${jobDetails.hiringManager || 'Hiring Manager'}</p>
    <p>${jobDetails.company}</p>`;

        if (jobDetails.companyAddress) {
            html += `
    <p>${jobDetails.companyAddress}</p>`;
        }

        html += `
  </div>`;
    }

    // Parse content
    const parsed = parseCoverLetterContent(coverLetter.content);

    // Greeting
    if (parsed.greeting) {
        html += `
  <div class="greeting">
    <p>${parsed.greeting}</p>
  </div>`;
    }

    // Body
    html += `
  <div class="body">`;
    parsed.body.forEach(paragraph => {
        html += `
    <p>${paragraph}</p>`;
    });
    html += `
  </div>`;

    // Closing
    if (parsed.closing) {
        html += `
  <div class="closing">
    <p>${parsed.closing}</p>
  </div>`;
    }

    // Signature
    if (parsed.signature) {
        html += `
  <div class="signature">
    <p>${parsed.signature}</p>
  </div>`;
    }

    html += `
</body>
</html>`;

    return html;
}

/**
 * Export cover letter to PDF format
 * @param {Object} coverLetter - Cover letter data
 * @param {Object} options - Export options
 * @returns {Promise<Buffer>} PDF file buffer
 */
export async function exportCoverLetterToPdf(coverLetter, options = {}) {
    // Generate HTML first
    const html = exportCoverLetterToHtml(coverLetter, { ...options, printOptimized: true });

    // Convert to PDF
    const pdfBuffer = await htmlToPdf(html, {
        format: 'Letter',
        margin: {
            top: '1in',
            bottom: '1in',
            left: '1in',
            right: '1in'
        },
        printBackground: true,
        preferCSSPageSize: true
    });

    return pdfBuffer;
}

/**
 * Export cover letter to plain text format (for email applications)
 * @param {Object} coverLetter - Cover letter data
 * @param {Object} options - Export options
 * @returns {String} Plain text string
 */
export function exportCoverLetterToPlainText(coverLetter, options = {}) {
    const {
        contactInfo = null,
        jobDetails = null,
        includeHeader = true
    } = options;

    let text = '';

    // Header
    if (includeHeader && contactInfo) {
        text += `${contactInfo.name || ''}\n`;

        const contactDetails = [];
        if (contactInfo.email) contactDetails.push(contactInfo.email);
        if (contactInfo.phone) contactDetails.push(contactInfo.phone);
        if (contactInfo.address) contactDetails.push(contactInfo.address);

        if (contactDetails.length > 0) {
            text += contactDetails.join(' | ') + '\n';
        }
        text += '\n';
    }

    // Date
    const date = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    text += `${date}\n\n`;

    // Recipient
    if (jobDetails && jobDetails.company) {
        text += `${jobDetails.hiringManager || 'Hiring Manager'}\n`;
        text += `${jobDetails.company}\n`;
        if (jobDetails.companyAddress) {
            text += `${jobDetails.companyAddress}\n`;
        }
        text += '\n';
    }

    // Content
    const parsed = parseCoverLetterContent(coverLetter.content);

    // Greeting
    if (parsed.greeting) {
        text += `${parsed.greeting}\n\n`;
    }

    // Body
    parsed.body.forEach(paragraph => {
        text += `${paragraph}\n\n`;
    });

    // Closing
    if (parsed.closing) {
        text += `${parsed.closing}\n`;
    }

    // Signature
    if (parsed.signature) {
        text += `${parsed.signature}\n`;
    }

    return text;
}

/**
 * Generate email template with cover letter content
 * @param {Object} coverLetter - Cover letter data
 * @param {Object} options - Email template options
 * @returns {Object} Email template with subject and body
 */
export function generateEmailTemplate(coverLetter, options = {}) {
    const {
        contactInfo = null,
        jobDetails = null
    } = options;

    // Generate subject line
    let subject = 'Application for ';
    if (jobDetails?.jobTitle) {
        subject += jobDetails.jobTitle;
    } else {
        subject += 'Position';
    }
    if (jobDetails?.company) {
        subject += ` at ${jobDetails.company}`;
    }
    if (contactInfo?.name) {
        subject += ` - ${contactInfo.name}`;
    }

    // Generate body (plain text)
    const body = exportCoverLetterToPlainText(coverLetter, {
        ...options,
        includeHeader: false // Don't include header in email body
    });

    // Generate signature
    let signature = '\n\n---\n';
    if (contactInfo?.name) {
        signature += `${contactInfo.name}\n`;
    }
    if (contactInfo?.email) {
        signature += `${contactInfo.email}\n`;
    }
    if (contactInfo?.phone) {
        signature += `${contactInfo.phone}\n`;
    }
    if (contactInfo?.website) {
        signature += `${contactInfo.website}\n`;
    }

    return {
        subject,
        body: body + signature,
        attachments: []
    };
}
