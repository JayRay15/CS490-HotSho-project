import { jest } from '@jest/globals';

// Extra tests to exercise more branches in pdfGenerator.js
const createPdfLibMock = () => {
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
    widthOfTextAtSize: (text, size) => (text ? text.length * (size * 0.5) : 0)
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
    HelveticaOblique: 'Helvetica-Oblique',
    HelveticaBoldOblique: 'Helvetica-BoldOblique',
    TimesRoman: 'Times-Roman',
    TimesBold: 'Times-Bold',
    TimesItalic: 'Times-Italic',
    TimesBoldItalic: 'Times-BoldItalic',
    Courier: 'Courier',
    CourierBold: 'Courier-Bold',
    CourierOblique: 'Courier-Oblique',
    CourierBoldOblique: 'Courier-BoldOblique'
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

describe('pdfGenerator extra branches', () => {
  test('maps Times and Courier font names to appropriate embedded fonts', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    // font metadata should trigger Times and Courier mappings
    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('payload')]);
    const fontMeta = [
      { name: 'Times-New-Roman', size: 22 }, // should map to TimesBold (large)
      { name: 'Courier', size: 12 }
    ];

    const template = {
      originalPdf: pdfBuf,
      pdfLayout: { pages: [{ textRegions: [], graphics: [] }], fonts: fontMeta }
    };

    await mod.generatePdfFromTemplate(template, { sections: {} }, {});

    const embedCalls = pdfLibMock.__mocks.pdfDocMock.embedFont.mock.calls.map(c => c[0]);
    // At least one Times* and one Courier or Helvetica mapping should be requested
    expect(embedCalls.some(v => /Times/.test(String(v)))).toBe(true);
    expect(embedCalls.some(v => /Courier|Helvetica/.test(String(v)))).toBe(true);
  });

  test('redrawGraphics draws path and rectangle types', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('payload')]);

    // Create a text region overlapping a graphic path point to force overlapsGraphic true
    const pageLayout = {
      textRegions: [
        { text: 'X', bbox: { x: 10, bottom: 10, top: 20, width: 10, height: 10 }, font: { name: 'Helvetica', size: 10 }, isHeader: false }
      ],
      graphics: [
        { type: 'path', path: [{ x: 12, y: 12 }, { x: 30, y: 30 }] },
        { type: 'rectangle', x: 40, y: 40, width: 20, height: 10 }
      ]
    };

    const template = { originalPdf: pdfBuf, pdfLayout: { pages: [pageLayout], fonts: [] } };
    await mod.generatePdfFromTemplate(template, { sections: {} }, {});

    const mocks = pdfLibMock.__mocks;
    // drawLine should be called for path segments and drawRectangle for rectangle
    expect(mocks.pageDrawLine).toHaveBeenCalled();
    expect(mocks.pageDrawRectangle).toHaveBeenCalled();
  });

  test('wrap behavior for summary insertion (multi-line)', async () => {
    const pdfLibMock = createPdfLibMock();
    // make font width small to force wrap
    pdfLibMock.__mocks.fontMock.widthOfTextAtSize = (text, size) => 200; // large width so wrapText splits
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('payload')]);
    const pageLayout = {
      textRegions: [
        { text: 'Summary header', bbox: { x: 50, bottom: 700, top: 720, width: 50, height: 20 }, font: { name: 'Helvetica', size: 10 }, isHeader: true },
        // Use a non-header text so the mapper doesn't treat it as a section header
        { text: 'profile summary placeholder', bbox: { x: 50, bottom: 680, top: 700, width: 100, height: 40 }, font: { name: 'Helvetica', size: 10 }, isHeader: false }
      ],
      graphics: []
    };

    const template = { originalPdf: pdfBuf, pdfLayout: { pages: [pageLayout], fonts: [{ name: 'Helvetica', size: 10 }], pagesMeta: [] }, sectionMapping: { summary: [pageLayout.textRegions[1]] } };
    const summaryText = 'This is a very long summary text that should wrap into multiple lines when inserted into the template region.';
    const result = await mod.generatePdfFromTemplate(template, { sections: { summary: summaryText } }, {});
    expect(Buffer.isBuffer(result)).toBe(true);
    // ensure fonts were embedded (indicates text insertion path exercised)
    expect(pdfLibMock.__mocks.pdfDocMock.embedFont).toHaveBeenCalled();
  });

  test('throws when PDFDocument.load fails', async () => {
  const pdfLibMock = createPdfLibMock();
  // override load to throw
  pdfLibMock.PDFDocument = { load: async () => { throw new Error('corrupt'); } };
  jest.resetModules();
  await jest.unstable_mockModule('pdf-lib', () => pdfLibMock);
  const mod = await import('../pdfGenerator.js');

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('payload')]);
    const template = { originalPdf: pdfBuf, pdfLayout: { pages: [{ textRegions: [], graphics: [] }], fonts: [] } };
    await expect(mod.generatePdfFromTemplate(template, { sections: {} }, {})).rejects.toThrow(/Failed to load PDF template/);
  });

  test('accepts mongoose-style object and array originalPdf formats', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    const raw = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('payload')]);
    const mongooseObj = { type: 'Buffer', data: Array.from(raw) };
    const arrayForm = Array.from(raw);

    const template1 = { originalPdf: mongooseObj, pdfLayout: { pages: [{ textRegions: [], graphics: [] }], fonts: [] } };
    const template2 = { originalPdf: arrayForm, pdfLayout: { pages: [{ textRegions: [], graphics: [] }], fonts: [] } };

    const r1 = await mod.generatePdfFromTemplate(template1, { sections: {} }, {});
    const r2 = await mod.generatePdfFromTemplate(template2, { sections: {} }, {});

    expect(Buffer.isBuffer(r1)).toBe(true);
    expect(Buffer.isBuffer(r2)).toBe(true);
  });
});
