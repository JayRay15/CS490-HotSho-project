import { jest } from '@jest/globals';

// Mock puppeteer before importing the module under test
const mockPage = {
  setViewport: jest.fn().mockResolvedValue(undefined),
  setContent: jest.fn().mockResolvedValue(undefined),
  evaluate: jest.fn().mockResolvedValue(undefined),
  pdf: jest.fn().mockResolvedValue(Buffer.from('PDF_BYTES')),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(undefined),
};

jest.unstable_mockModule('puppeteer', () => ({
  default: {
    launch: jest.fn().mockResolvedValue(mockBrowser),
  }
}));

const { htmlToPdf } = await import('../htmlToPdf.js');

describe('htmlToPdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders HTML and returns a Buffer', async () => {
    const buf = await htmlToPdf('<html><body>hi</body></html>');
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.toString()).toBe('PDF_BYTES');

    // browser and page methods should have been called
    expect(mockBrowser.newPage).toHaveBeenCalled();
    expect(mockPage.setViewport).toHaveBeenCalled();
    expect(mockPage.setContent).toHaveBeenCalled();
    expect(mockPage.pdf).toHaveBeenCalled();
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  it('injects watermark when options.watermark provided', async () => {
    const opts = { watermark: { enabled: true, text: 'SECRET' } };
    await htmlToPdf('<html></html>', opts);
    expect(mockPage.evaluate).toHaveBeenCalled();
    // ensure evaluate was called with the watermark text as argument
    const callArgs = mockPage.evaluate.mock.calls[0][1];
    expect(callArgs).toBe('SECRET');
  });

  it('closes browser on pdf() throw', async () => {
    // Make pdf throw
    mockPage.pdf.mockRejectedValueOnce(new Error('pdf-failure'));
    await expect(htmlToPdf('<html></html>')).rejects.toThrow('pdf-failure');
    expect(mockBrowser.close).toHaveBeenCalled();
  });
});
