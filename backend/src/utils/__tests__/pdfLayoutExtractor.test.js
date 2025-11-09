import { jest } from '@jest/globals';

// ESM-safe helper to mock modules before importing the module under test
async function importWithMocks({ pdfLibMock, pdfjsMock } = {}) {
  jest.resetModules();
  if (pdfLibMock) {
    await jest.unstable_mockModule('pdf-lib', () => pdfLibMock);
  }
  if (pdfjsMock) {
    await jest.unstable_mockModule('pdfjs-dist/legacy/build/pdf.mjs', () => pdfjsMock);
  }
  return import('../pdfLayoutExtractor.js');
}

describe('pdfLayoutExtractor', () => {
  test('extractPdfLayout extracts fonts, pages and graphics from mocked PDF', async () => {
    // Prepare pdf-lib mock
    const fakePages = [ { dummy: true }, { dummy: true } ];
    const PDFDocumentMock = {
      __esModule: true,
      PDFDocument: {
        load: async (uint8) => ({
          getPages: () => fakePages,
          getPageCount: () => fakePages.length
        })
      }
    };

    // Prepare pdfjs mock: getDocument -> { promise: { getPage } }
    const pageTextItems = [
      {
        str: 'John Doe',
        transform: [1,0,0,1,50,750],
        height: 24,
        fontName: 'ABCDEF+TimesNewRoman',
        width: 80,
        color: [0,0,0],
        fontObj: { loadedName: 'TimesNewRomanPSMT', dict: { get: () => ({ name: 'TimesNewRoman' }) } }
      },
      {
        str: 'Experience',
        transform: [1,0,0,1,50,700],
        height: 14,
        fontName: 'Helvetica-Bold',
        width: 80
      },
      {
        str: '• Built feature X',
        transform: [1,0,0,1,60,680],
        height: 12,
        fontName: 'Helvetica',
        width: 120
      }
    ];

    const operatorList = {
      fnArray: [23, 32, 3, 4, 25, 35, 26],
      argsArray: [
        [[1,0,0]], // color
        [2], // linewidth
        [10, 100], // moveTo
        [100, 100], // lineTo
        [], // stroke
        [10, 20, 30, 40], // re rectangle
        [] // fill
      ]
    };

    const pdfjsMock = {
      __esModule: true,
      getDocument: ({ data }) => ({
        promise: Promise.resolve({
          getPage: async (n) => ({
            getViewport: ({ scale }) => ({ width: 600, height: 800 }),
            getTextContent: async () => ({ items: pageTextItems }),
            getOperatorList: async () => operatorList
          })
        })
      })
    };

    const mod = await importWithMocks({ pdfLibMock: PDFDocumentMock, pdfjsMock });

    // Call extractPdfLayout with dummy buffer
    const buffer = new Uint8Array([1,2,3]);
    const layout = await mod.extractPdfLayout(buffer);

    expect(layout).toBeDefined();
    expect(layout.pageCount).toBe(2);
    expect(Array.isArray(layout.pages)).toBe(true);
    expect(layout.pages.length).toBe(2);

    // Fonts were extracted and subset prefix removed
    expect(Array.isArray(layout.fonts)).toBe(true);
    expect(layout.fonts.length).toBeGreaterThan(0);
    const font = layout.fonts.find(f => f.originalName === 'ABCDEF+TimesNewRoman');
    expect(font).toBeDefined();
    expect(font.name.toLowerCase()).toContain('timesnewroman');

    // Graphics should contain at least one rectangle entry from op 35
    const page0 = layout.pages[0];
    expect(Array.isArray(page0.graphics)).toBe(true);
    const rect = page0.graphics.find(g => g.type === 'rectangle');
    expect(rect).toBeDefined();
    expect(rect.width).toBe(30);
  });

  test('mapTextRegionsToSections groups headers and contact', async () => {
    const { mapTextRegionsToSections } = await import('../pdfLayoutExtractor.js');

    const regions = [
      { text: 'Jane Smith', bbox: { bottom: 760 }, font: { size: 20 } },
      { text: 'SUMMARY', bbox: { bottom: 700 }, font: { size: 14 } },
      { text: 'Experienced engineer', bbox: { bottom: 680 }, font: { size: 12 } },
      { text: 'EXPERIENCE', bbox: { bottom: 640 }, font: { size: 14 } },
      { text: 'Company A - 2020', bbox: { bottom: 620 }, font: { size: 12 } }
    ];

    const pageText = regions.map(r => r.text).join('\n');
    const mapping = mapTextRegionsToSections(regions, pageText);

    expect(mapping.contactInfo.length).toBeGreaterThan(0);
    expect(mapping.summary.length).toBeGreaterThan(0);
    expect(mapping.experience.length).toBeGreaterThan(0);
    // Ensure headers are marked as isHeader
    const header = mapping.summary.find(r => r.isHeader === true);
    expect(header).toBeDefined();
  });

  test('extractPdfLayout throws on underlying errors', async () => {
    const PDFDocumentMock = {
      __esModule: true,
      PDFDocument: {
        load: async () => { throw new Error('bad pdf'); }
      }
    };
    const pdfjsMock = { __esModule: true, getDocument: () => ({ promise: Promise.resolve({}) }) };
    const mod = await importWithMocks({ pdfLibMock: PDFDocumentMock, pdfjsMock });
    await expect(mod.extractPdfLayout(new Uint8Array([0]))).rejects.toThrow(/Failed to extract PDF layout/);
  });
});
