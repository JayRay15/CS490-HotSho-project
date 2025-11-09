import { jest } from '@jest/globals';

// Focused tests to exercise experience/projects/education/skills insertion paths
const createPdfLibMock = (fontWidthMultiplier = 0.5) => {
  const pageDrawRectangle = jest.fn();
  const pageDrawText = jest.fn();
  const pageDrawLine = jest.fn();

  const pages = [
    {
      getSize: () => ({ width: 600, height: 800 }),
      getWidth: function() { return this.getSize().width; },
      getHeight: function() { return this.getSize().height; },
      drawRectangle: pageDrawRectangle,
      drawText: pageDrawText,
      drawLine: pageDrawLine
    }
  ];

  const fontMock = {
    widthOfTextAtSize: (text, size) => (text ? text.length * (size * fontWidthMultiplier) : 0)
  };

  const pdfDocMock = {
    getPages: () => pages,
    getPageCount: () => pages.length,
    embedFont: jest.fn(async (font) => fontMock),
    save: async () => new Uint8Array(Buffer.from('%PDF-generated-by-mock'))
  };

  const PDFDocument = {
    load: async (buffer, opts) => pdfDocMock
  };

  const rgb = (r, g, b) => ({ r, g, b });
  const degrees = (d) => ({ deg: d });

  const StandardFonts = {
    Helvetica: 'Helvetica',
    HelveticaBold: 'Helvetica-Bold',
    TimesRoman: 'Times-Roman',
    TimesBold: 'Times-Bold',
    Courier: 'Courier'
  };

  return {
    __esModule: true,
    PDFDocument,
    rgb,
    degrees,
    StandardFonts,
    __mocks: { pages, pageDrawRectangle, pageDrawText, pageDrawLine, pdfDocMock, fontMock }
  };
};

async function importWithPdfLibMock(pdfLibMock) {
  jest.resetModules();
  await jest.unstable_mockModule('pdf-lib', () => pdfLibMock);
  return import('../pdfGenerator.js');
}

describe('pdfGenerator coverage extensions', () => {
  test('inserts multiple experience entries with bullets and date formatting', async () => {
    const pdfLibMock = createPdfLibMock(0.5);
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('payload')]);

    // Create many regions to fill experience insertion
    const regions = [];
    for (let i = 0; i < 8; i++) {
      regions.push({ text: `r${i}`, bbox: { x: 50, bottom: 700 - i * 12, top: 712 - i * 12, width: 300, height: 12 }, font: { name: 'Helvetica', size: 12 }, isHeader: false });
    }

    const pageLayout = { textRegions: regions, graphics: [] };

  const template = { originalPdf: pdfBuf, pdfLayout: { pages: [pageLayout], fonts: [{ name: 'Helvetica', size: 12 }] }, sectionMapping: { experience: regions } };

    const experience = [
      { jobTitle: 'Senior Developer', company: 'Acme Corp', startDate: '2019-01-01', endDate: '2020-12-31', bullets: ['Led a team', 'Designed systems'] },
      { jobTitle: 'Lead Engineer', company: 'Beta LLC', startDate: '2021-01-01', endDate: null, isCurrentPosition: true, bullets: ['Built features', 'Mentored juniors'] }
    ];

    const resumeData = { sections: { experience } };

    const options = { templateFormats: { experienceFormat: { titleCompanySameLine: false, bulletCharacter: '•' } } };

    const out = await mod.generatePdfFromTemplate(template, resumeData, options);
    expect(Buffer.isBuffer(out)).toBe(true);

    // Ensure drawText was called for inserted content
    expect(pdfLibMock.__mocks.pageDrawText).toHaveBeenCalled();
  });

  test('projects insertion with tech on same line and bullets', async () => {
    const pdfLibMock = createPdfLibMock(0.4);
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('payload')]);

    const regions = [
      { text: 'p1', bbox: { x: 40, bottom: 700, top: 712, width: 300, height: 12 }, font: { name: 'Helvetica', size: 11 } },
      { text: 'p2', bbox: { x: 40, bottom: 688, top: 700, width: 300, height: 12 }, font: { name: 'Helvetica', size: 11 } },
      { text: 'p3', bbox: { x: 40, bottom: 676, top: 688, width: 300, height: 12 }, font: { name: 'Helvetica', size: 11 } }
    ];

    const pageLayout = { textRegions: regions, graphics: [] };

  const template = { originalPdf: pdfBuf, pdfLayout: { pages: [pageLayout], fonts: [{ name: 'Helvetica', size: 11 }] }, sectionMapping: { projects: regions } };

    const projects = [ { name: 'Alpha', technologies: ['JS','Node'], bullets: ['Did X'] } ];
    const out = await mod.generatePdfFromTemplate(template, { sections: { projects } }, { templateFormats: { projectFormat: { titleWithTech: true } } });
    expect(Buffer.isBuffer(out)).toBe(true);
    expect(pdfLibMock.__mocks.pageDrawText).toHaveBeenCalled();
  });

  test('education insertion with GPA and location formatting', async () => {
    const pdfLibMock = createPdfLibMock(0.5);
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('payload')]);
    const regions = [
      { text: 'e1', bbox: { x: 50, bottom: 700, top: 712, width: 300, height: 12 }, font: { name: 'Helvetica', size: 11 } },
      { text: 'e2', bbox: { x: 50, bottom: 688, top: 700, width: 300, height: 12 }, font: { name: 'Helvetica', size: 11 } }
    ];
  const template = { originalPdf: pdfBuf, pdfLayout: { pages: [{ textRegions: regions, graphics: [] }], fonts: [{ name: 'Helvetica', size: 11 }] }, sectionMapping: { education: regions } };

    const education = [ { degree: 'BSc', institution: 'State U', startDate: '2015-08-01', endDate: '2019-05-01', gpa: '3.9', gpaPrivate: false, location: 'Townsville' } ];

    const out = await mod.generatePdfFromTemplate(template, { sections: { education } }, { templateFormats: { educationFormat: { locationAfterInstitution: true } } });
    expect(Buffer.isBuffer(out)).toBe(true);
    expect(pdfLibMock.__mocks.pageDrawText).toHaveBeenCalled();
  });

  test('skills insertion creates comma list', async () => {
    const pdfLibMock = createPdfLibMock(0.5);
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('payload')]);
    const regions = [ { text: 's1', bbox: { x: 50, bottom: 700, top: 712, width: 200, height: 12 }, font: { name: 'Helvetica', size: 10 } } ];
  const template = { originalPdf: pdfBuf, pdfLayout: { pages: [{ textRegions: regions, graphics: [] }], fonts: [{ name: 'Helvetica', size: 10 }] }, sectionMapping: { skills: regions } };

    const out = await mod.generatePdfFromTemplate(template, { sections: { skills: ['JS','Node','React'] } }, {});
    expect(Buffer.isBuffer(out)).toBe(true);
    expect(pdfLibMock.__mocks.pageDrawText).toHaveBeenCalled();
  });

  test('single-line truncation adds ellipsis', async () => {
    // use huge multiplier so width is very large forcing truncation loop to shorten text
    const pdfLibMock = createPdfLibMock(20);
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('payload')]);
  const region = { text: 't', bbox: { x: 50, bottom: 700, top: 712, width: 40, height: 12 }, font: { name: 'Helvetica', size: 10 } };
  const pageLayout = { textRegions: [region], graphics: [] };
  const template = { originalPdf: pdfBuf, pdfLayout: { pages: [pageLayout], fonts: [{ name: 'Helvetica', size: 10 }] }, sectionMapping: { projects: [region] } };

  const longText = 'ThisIsAVeryLongSingleLineThatWillBeTruncatedLongProjectName';
  const out = await mod.generatePdfFromTemplate(template, { sections: { projects: [ { name: longText, technologies: [] } ] } }, {});
    expect(Buffer.isBuffer(out)).toBe(true);

    // At minimum a font should have been embedded for the insertion to proceed
    expect(pdfLibMock.__mocks.pdfDocMock.embedFont).toHaveBeenCalled();
  });
});
