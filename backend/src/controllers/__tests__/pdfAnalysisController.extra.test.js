import { jest } from '@jest/globals';

// Small, focused tests to exercise uncovered branches in pdfAnalysisController
// (only test files are changed per request)

async function makeControllerWithMocks(pdfjsMock, layoutMock = { extractPdfLayout: jest.fn().mockResolvedValue({ pages: [] }), mapTextRegionsToSections: jest.fn() }) {
  jest.resetModules();
  jest.unstable_mockModule('../../utils/pdfLayoutExtractor.js', () => layoutMock);
  jest.unstable_mockModule('pdfjs-dist/legacy/build/pdf.mjs', () => pdfjsMock);
  const { analyzePDF } = await import('../pdfAnalysisController.js');
  return analyzePDF;
}

describe('pdfAnalysisController extra focused tests', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockReq = { file: null };
  });

  it('calculates sectionSpacing and sets textAlignment when many first lines present', async () => {
    const pdfjsMock = {
      OPS: { setFillRGBColor: 1, setStrokeRGBColor: 2, setFillColorN: 3, setStrokeColorN: 4, setFillColor: 5, setStrokeColor: 6 },
      getDocument: ({ data }) => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async () => ({
            getTextContent: async () => ({
              items: [
                // Create a sequence of first-lines with varying y positions to produce spacings
                { str: 'LINE1', transform: [1,0,0,1,100,760] },
                { str: 'LINE2', transform: [1,0,0,1,100,740] },
                { str: 'LINE3', transform: [1,0,0,1,100,700] },
                { str: 'LINE4', transform: [1,0,0,1,100,660] },
                { str: 'body line a', transform: [1,0,0,1,80,640] },
                { str: 'body line b', transform: [1,0,0,1,90,620] }
              ]
            }),
            getViewport: ({ scale }) => ({ width: 600, height: 800 }),
            getOperatorList: async () => ({ fnArray: [], argsArray: [] })
          })
        })
      })
    };

    const analyzePDF = await makeControllerWithMocks(pdfjsMock);

    mockReq.file = { buffer: Buffer.from('%PDF', 'utf8'), mimetype: 'application/pdf', originalname: 'spacing.pdf' };
    await analyzePDF(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalled();
    const sent = mockRes.json.mock.calls[0][0];
    // sectionSpacing should be computed and differ from default 24 when spacings exist
    expect(sent.suggestions.layout.sectionSpacing).toBeDefined();
    expect(typeof sent.suggestions.layout.sectionSpacing).toBe('number');
    expect(sent.suggestions.layout.sectionSpacing).not.toBe(24);
    // textAlignment should be present and one of expected strings
    expect(['left','right','justify','center']).toContain(sent.suggestions.layout.textAlignment);
  });

  it('maps a custom cleaned font name (formattedName path) when detailed fonts are provided', async () => {
    // Provide detailed layout with a Map of fonts containing a custom font name without special chars
    const fontsMap = new Map();
    fontsMap.set('f1', { name: 'MyCustomFont', size: 30 });

    const layoutMock = {
      extractPdfLayout: jest.fn().mockResolvedValue({ pages: [ { textRegions: [], fonts: fontsMap } ], fonts: fontsMap }),
      mapTextRegionsToSections: jest.fn()
    };

    const pdfjsMock = {
      OPS: { setFillRGBColor: 1, setStrokeRGBColor: 2, setFillColorN: 3, setStrokeColorN: 4, setFillColor: 5, setStrokeColor: 6 },
      getDocument: ({ data }) => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async () => ({
            getTextContent: async () => ({ items: [ { str: 'NAME', transform: [1,0,0,1,100,700] } ] }),
            getViewport: ({ scale }) => ({ width: 612, height: 792 }),
            getOperatorList: async () => ({ fnArray: [], argsArray: [] })
          })
        })
      })
    };

    const analyzePDF = await makeControllerWithMocks(pdfjsMock, layoutMock);

    mockReq.file = { buffer: Buffer.from('%PDF fonts', 'utf8'), mimetype: 'application/pdf', originalname: 'fonts.pdf' };
    await analyzePDF(mockReq, mockRes);

    const sent = mockRes.json.mock.calls[0][0];
    expect(sent.suggestions.fonts).toBeDefined();
    expect(sent.suggestions.fonts.heading).toBeDefined();
    // Our mapping should include the cleaned/Formatted font name (MyCustomFont -> Mycustomfont)
    expect(sent.suggestions.fonts.heading.toLowerCase()).toContain('mycustomfont');
  });

  it('detects education format flags (datesOnRight, locationAfterInstitution, gpaSeparateLine)', async () => {
    // Provide a pdfjs that returns text items representing an education section with dates, location and GPA
    const pdfjsMock = {
      OPS: { setFillRGBColor: 1, setStrokeRGBColor: 2, setFillColorN: 3, setStrokeColorN: 4, setFillColor: 5, setStrokeColor: 6 },
      getDocument: ({ data }) => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async () => ({
            getTextContent: async () => ({
              items: [
                { str: 'EDUCATION', transform: [1,0,0,1,50,700] },
                { str: "Bachelor of Science in Computer Science", transform: [1,0,0,1,50,680] },
                { str: 'University of Somewhere', transform: [1,0,0,1,50,660] },
                { str: 'Cityname, ST', transform: [1,0,0,1,50,640] },
                { str: '2019', transform: [1,0,0,1,400,660] },
                { str: 'GPA: 3.8', transform: [1,0,0,1,50,620] }
              ]
            }),
            getViewport: ({ scale }) => ({ width: 612, height: 792 }),
            getOperatorList: async () => ({ fnArray: [], argsArray: [] })
          })
        })
      })
    };

    const analyzePDF = await makeControllerWithMocks(pdfjsMock);

    mockReq.file = { buffer: Buffer.from('%PDF education', 'utf8'), mimetype: 'application/pdf', originalname: 'edu.pdf' };
    await analyzePDF(mockReq, mockRes);

    const sent = mockRes.json.mock.calls[0][0];
    expect(sent.suggestions.layout.educationFormat).toBeDefined();
    const ef = sent.suggestions.layout.educationFormat;
    expect(ef.datesOnRight).toBeTruthy();
    expect(ef.locationAfterInstitution).toBeTruthy();
    expect(ef.gpaSeparateLine).toBeTruthy();
  });
});
