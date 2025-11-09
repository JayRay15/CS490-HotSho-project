import { jest } from '@jest/globals';

// Create an ESM-friendly mock for pdf-lib used by pdfGenerator
const createPdfLibMock = () => {
  const pageDrawRectangle = jest.fn();
  const pageDrawText = jest.fn();
  const pageDrawLine = jest.fn();

  const pages = [
    {
      getSize: () => ({ width: 600, height: 800 }),
      // provide compatibility methods used by pdfGenerator implementation
      getWidth: function() { return this.getSize().width; },
      getHeight: function() { return this.getSize().height; },
      drawRectangle: pageDrawRectangle,
      drawText: pageDrawText,
      drawLine: pageDrawLine
    }
  ];

  const fontMock = {
    widthOfTextAtSize: (text, size) => (text ? text.length * (size * 0.5) : 0)
  };

  const pdfDocMock = {
    getPages: () => pages,
    getPageCount: () => pages.length,
    embedFont: async (font) => fontMock,
    save: async () => new Uint8Array(Buffer.from('%PDF-generated-by-mock'))
  };

  const PDFDocument = {
    load: async (buffer) => pdfDocMock
  };

  const rgb = (r, g, b) => ({ r, g, b });
  const degrees = (d) => ({ deg: d });

  const StandardFonts = {
    Helvetica: 'Helvetica',
    HelveticaBold: 'Helvetica-Bold',
    HelveticaOblique: 'Helvetica-Oblique',
    HelveticaBoldOblique: 'Helvetica-BoldOblique',
    TimesRoman: 'Times-Roman',
    TimesBold: 'Times-Bold',
    TimesItalic: 'Times-Italic',
    TimesBoldItalic: 'Times-BoldItalic',
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

describe('pdfGenerator', () => {
  test('generatePdfFromTemplate throws when originalPdf missing', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    const template = { originalPdf: null, pdfLayout: { pages: [] } };
    await expect(mod.generatePdfFromTemplate(template, {}, {})).rejects.toThrow(/Template does not have original PDF stored/);
  });

  test('generatePdfFromTemplate throws for invalid pdf header', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    // Provide a buffer that does not start with %PDF
    const badBuf = Buffer.from('NOTPDF-0000');
    const template = { originalPdf: badBuf, pdfLayout: { pages: [{},] } };
    await expect(mod.generatePdfFromTemplate(template, {}, {})).rejects.toThrow(/Invalid PDF format/);
  });

  test('generatePdfFromTemplate processes buffer and inserts text, returns Buffer', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    // Create a fake PDF buffer with header
    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('rest-of-file')]);

    // Create a minimal layout with one page and one text region
    const pageLayout = {
      textRegions: [
        {
          text: 'Name',
          bbox: { x: 50, bottom: 700, top: 720, width: 200, height: 20 },
          font: { name: 'Helvetica', size: 18 },
          isHeader: true
        },
        {
          text: 'Email',
          bbox: { x: 50, bottom: 680, top: 696, width: 200, height: 14 },
          font: { name: 'Helvetica', size: 12 },
          isHeader: false
        }
      ],
      graphics: []
    };

    const template = {
      originalPdf: pdfBuf,
      pdfLayout: { pages: [pageLayout], fonts: [{ name: 'Helvetica', size: 12 }] , pagesMeta: []},
      sectionMapping: { contactInfo: [pageLayout.textRegions[0], pageLayout.textRegions[1]] }
    };

    const resumeData = { sections: { contactInfo: { name: 'Alice', email: 'a@b.com' } } };

    const result = await mod.generatePdfFromTemplate(template, resumeData, {});
    expect(Buffer.isBuffer(result)).toBe(true);

    // verify the mocked page drawing functions were called
    const mocks = pdfLibMock.__mocks;
    expect(mocks.pageDrawRectangle).toHaveBeenCalled();
    expect(mocks.pageDrawText).toHaveBeenCalled();
  });

  test('generatePdfFromTemplate accepts base64 originalPdf and applies watermark when enabled', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('pdf-data')]);
    const base64 = pdfBuf.toString('base64');

    const pageLayout = { textRegions: [], graphics: [] };
    const template = { originalPdf: base64, pdfLayout: { pages: [pageLayout], fonts: [] } };

    const result = await mod.generatePdfFromTemplate(template, { sections: {} }, { watermark: { enabled: true, text: 'SAMPLE' } });
    expect(Buffer.isBuffer(result)).toBe(true);

    // watermark drawText should be called on the page
    const mocks = pdfLibMock.__mocks;
    expect(mocks.pageDrawText).toHaveBeenCalled();
  });
});
