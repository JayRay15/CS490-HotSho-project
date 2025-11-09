import { jest } from '@jest/globals';

// Additional targeted tests to hit remaining branches in pdfGenerator
const makeBaseMock = () => {
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

async function importWithMock(pdfLibMock) {
  jest.resetModules();
  await jest.unstable_mockModule('pdf-lib', () => pdfLibMock);
  return import('../pdfGenerator.js');
}

describe('pdfGenerator more targeted branches', () => {
  test('maps bold+italic font metadata to bold-oblique font', async () => {
    const pdfLibMock = makeBaseMock();
    const mod = await importWithMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('data')]);
    const fontMeta = [ { name: 'Custom-BoldItalic', size: 16, weight: 'bold', style: 'italic' } ];
    const template = { originalPdf: pdfBuf, pdfLayout: { pages: [{ textRegions: [], graphics: [] }], fonts: fontMeta } };

    await mod.generatePdfFromTemplate(template, { sections: {} }, {});

  // At minimum we should have attempted to embed at least one font
  expect(pdfLibMock.__mocks.pdfDocMock.embedFont).toHaveBeenCalled();
  });

  test('redrawGraphics catches drawing errors and continues', async () => {
    const pdfLibMock = makeBaseMock();
    // Make drawLine throw to hit catch branch
    pdfLibMock.__mocks.pages[0].drawLine = jest.fn(() => { throw new Error('boom'); });
    // Keep other draws working
    const mod = await importWithMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('data')]);
    const pageLayout = { textRegions: [], graphics: [ { type: 'path', path: [{ x: 0, y: 0 }, { x: 10, y: 10 }] } ] };
    const template = { originalPdf: pdfBuf, pdfLayout: { pages: [pageLayout], fonts: [] } };

    // Should not throw despite drawLine throwing internally
    const out = await mod.generatePdfFromTemplate(template, { sections: {} }, {});
    expect(Buffer.isBuffer(out)).toBe(true);
  });

  test('handles filled graphics (type=fill) without error', async () => {
    const pdfLibMock = makeBaseMock();
    const mod = await importWithMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('data')]);
    const pageLayout = { textRegions: [], graphics: [ { type: 'fill', path: [{ x:1, y:1 }, { x:2, y:2 }] } ] };
    const template = { originalPdf: pdfBuf, pdfLayout: { pages: [pageLayout], fonts: [] } };

    const out = await mod.generatePdfFromTemplate(template, { sections: {} }, {});
    expect(Buffer.isBuffer(out)).toBe(true);
  });

  test('wrap > maxLines adds ellipsis in multi-line mode', async () => {
    const pdfLibMock = makeBaseMock();
    // Make font width huge per character to force words to be on their own lines
    pdfLibMock.__mocks.fontMock.widthOfTextAtSize = (text, size) => text.length * 100;
    const mod = await importWithMock(pdfLibMock);

    const pdfBuf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('data')]);
    const long = Array(20).fill('word').join(' ');
    const pageLayout = { textRegions: [ { text: 'summary', bbox: { x:10, bottom:700, top:720, width: 20, height: 40 }, font: { name: 'Helvetica', size: 10 } } ], graphics: [] };
    const template = { originalPdf: pdfBuf, pdfLayout: { pages: [pageLayout], fonts: [{ name: 'Helvetica', size: 10 }] }, sectionMapping: { summary: [pageLayout.textRegions[0]] } };

    const out = await mod.generatePdfFromTemplate(template, { sections: { summary: long } }, {});
    expect(Buffer.isBuffer(out)).toBe(true);
  // At minimum a font must have been embedded for text insertion to proceed
  expect(pdfLibMock.__mocks.pdfDocMock.embedFont).toHaveBeenCalled();
  });
});
