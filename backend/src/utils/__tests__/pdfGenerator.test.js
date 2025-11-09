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

  test('generatePdfFromTemplate supports mongoose Buffer object and redraws rectangle graphics', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('pdf-data')]);
    // Mongoose-style buffer
    const mongooseBuf = { type: 'Buffer', data: Array.from(pdfBuf) };

    const pageLayout = {
      textRegions: [],
      graphics: [
        { type: 'rectangle', x: 10, y: 10, width: 100, height: 2, strokeColor: '#ff0000', lineWidth: 2 }
      ]
    };

    const template = { originalPdf: mongooseBuf, pdfLayout: { pages: [pageLayout], fonts: [] } };

    const result = await mod.generatePdfFromTemplate(template, { sections: {} }, {});
    expect(Buffer.isBuffer(result)).toBe(true);

    const mocks = pdfLibMock.__mocks;
    // rectangle redraw should call page.drawRectangle
    expect(mocks.pageDrawRectangle).toHaveBeenCalled();
  });

  test('generatePdfFromTemplate supports array originalPdf and redraws path graphics', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('pdf-data')]);
    const arr = Array.from(pdfBuf);

    const pageLayout = {
      textRegions: [],
      graphics: [
        { type: 'path', path: [{ x: 0, y: 0 }, { x: 50, y: 50 }], strokeColor: '#000000', lineWidth: 1 }
      ]
    };

    const template = { originalPdf: arr, pdfLayout: { pages: [pageLayout], fonts: [] } };

    const result = await mod.generatePdfFromTemplate(template, { sections: {} }, {});
    expect(Buffer.isBuffer(result)).toBe(true);

    const mocks = pdfLibMock.__mocks;
    // path redraw should call page.drawLine
    expect(mocks.pageDrawLine).toHaveBeenCalled();
  });

  test('generatePdfFromTemplate throws for unsupported object originalPdf format', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = { foo: 'bar' };
    const template = { originalPdf: pdfBuf, pdfLayout: { pages: [{}], fonts: [] } };

    await expect(mod.generatePdfFromTemplate(template, {}, {})).rejects.toThrow(/unsupported object format/);
  });

  test('generatePdfFromTemplate throws on empty PDF buffer', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    const emptyBuf = Buffer.from([]);
    const template = { originalPdf: emptyBuf, pdfLayout: { pages: [{}], fonts: [] } };

    await expect(mod.generatePdfFromTemplate(template, {}, {})).rejects.toThrow(/Template PDF buffer is empty/);
  });

  test('generatePdfFromTemplate surfaces PDF load errors', async () => {
    // Create a mock where PDFDocument.load throws
    const pdfLibMock = createPdfLibMock();
    pdfLibMock.PDFDocument = {
      load: async () => { throw new Error('simulated load failure'); }
    };

    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('pdf-data')]);
    const template = { originalPdf: pdfBuf, pdfLayout: { pages: [{}], fonts: [] } };

    await expect(mod.generatePdfFromTemplate(template, {}, {})).rejects.toThrow(/Failed to load PDF template/);
  });

  test('insertTextAtRegion falls back to available font when region.font not found', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('pdf-data')]);

    const pageLayout = {
      textRegions: [
        // Ensure this region is NOT treated as a section header by leaving text empty
        { text: '', bbox: { x: 10, bottom: 700, top: 720, width: 300, height: 20 }, font: { name: 'MissingFont', size: 12 }, isHeader: false }
      ],
      graphics: []
    };

    const template = { originalPdf: pdfBuf, pdfLayout: { pages: [pageLayout], fonts: [] }, sectionMapping: { summary: [pageLayout.textRegions[0]] } };

    const resumeData = { sections: { summary: 'This is a short summary' } };

    const result = await mod.generatePdfFromTemplate(template, resumeData, {});
    expect(Buffer.isBuffer(result)).toBe(true);
    const mocks = pdfLibMock.__mocks;
    expect(mocks.pageDrawText).toHaveBeenCalled();
  });

  test('generatePdfFromTemplate wraps long summary and truncates with ellipsis', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('pdf-data')]);

    const pageLayout = {
      textRegions: [
        // make a tiny width to force wrapping/truncation
        { text: '', bbox: { x: 10, bottom: 700, top: 720, width: 10, height: 20 }, font: { name: 'Helvetica', size: 12 }, isHeader: false }
      ],
      graphics: []
    };

    const template = { originalPdf: pdfBuf, pdfLayout: { pages: [pageLayout], fonts: [{ name: 'Helvetica', size: 12 }] }, sectionMapping: { summary: [pageLayout.textRegions[0]] } };

    const longText = Array(100).fill('word').join(' ');
    const resumeData = { sections: { summary: longText } };

    const result = await mod.generatePdfFromTemplate(template, resumeData, {});
    expect(Buffer.isBuffer(result)).toBe(true);
    const mocks = pdfLibMock.__mocks;
    // ensure drawText was called with truncated text (ellipsis expected)
    const calls = mocks.pageDrawText.mock.calls.map(c => c[0]);
    const calledWithEllipsis = calls.some(arg => typeof arg === 'string' && arg.includes('...'));
    expect(calledWithEllipsis).toBe(true);
  });

  test('insertTextAtRegion uses fallback baseline calculation when bbox lacks bottom/y', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('pdf-data')]);

    const pageLayout = {
      textRegions: [
        { text: 'FallbackY', bbox: { x: 20, screenBottom: 100, width: 200, height: 14 }, font: { name: 'Helvetica', size: 12 }, isHeader: false }
      ],
      graphics: []
    };

    const template = { originalPdf: pdfBuf, pdfLayout: { pages: [pageLayout], fonts: [{ name: 'Helvetica', size: 12 }] }, sectionMapping: { contactInfo: [pageLayout.textRegions[0]] } };

    const resumeData = { sections: { contactInfo: { name: 'Bob' } } };

    const result = await mod.generatePdfFromTemplate(template, resumeData, {});
    expect(Buffer.isBuffer(result)).toBe(true);
    const mocks = pdfLibMock.__mocks;
    expect(mocks.pageDrawText).toHaveBeenCalled();
  });

  test('insertTextAtRegion matches font name case-insensitively and uses mapped font', async () => {
    const pdfLibMock = createPdfLibMock();
    const mod = await importWithPdfLibMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('pdf-data')]);

    const pageLayout = {
      textRegions: [
        { text: '', bbox: { x: 30, bottom: 700, top: 720, width: 300, height: 20 }, font: { name: 'helvetica', size: 12 }, isHeader: false }
      ],
      graphics: []
    };

    // Provide font metadata so getFontsForDocument will embed 'Helvetica'
    const template = { originalPdf: pdfBuf, pdfLayout: { pages: [pageLayout], fonts: [{ name: 'Helvetica', size: 12 }] }, sectionMapping: { contactInfo: [pageLayout.textRegions[0]] } };

    const resumeData = { sections: { contactInfo: { name: 'Case' } } };

    const result = await mod.generatePdfFromTemplate(template, resumeData, {});
    expect(Buffer.isBuffer(result)).toBe(true);
    const mocks = pdfLibMock.__mocks;
    expect(mocks.pageDrawText).toHaveBeenCalled();
  });
});
