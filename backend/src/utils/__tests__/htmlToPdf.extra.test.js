import { jest } from '@jest/globals';

beforeEach(() => jest.resetModules());

// Create a DOM shim so the evaluate() function can run in Node when we invoke it
function createDomShim() {
  const appendChild = jest.fn();
  global.document = {
    createElement: (tag) => {
      return { textContent: '', style: { cssText: '' } };
    },
    body: { appendChild },
  };
  return { appendChild };
}

test('watermark evaluate actually runs and manipulates document', async () => {
  const appendChildSpy = createDomShim().appendChild;

  // Mock puppeteer but make evaluate execute the passed function in this Node context
  const mockPage = {
    setViewport: jest.fn().mockResolvedValue(undefined),
    setContent: jest.fn().mockResolvedValue(undefined),
    evaluate: jest.fn().mockImplementation(async (fn, arg) => {
      // execute the function in Node so coverage marks its lines executed
      return fn(arg);
    }),
    pdf: jest.fn().mockResolvedValue(Buffer.from('PDF_BYTES')),
  };

  const mockBrowser = {
    newPage: jest.fn().mockResolvedValue(mockPage),
    close: jest.fn().mockResolvedValue(undefined),
  };

  jest.unstable_mockModule('puppeteer', () => ({
    default: { launch: jest.fn().mockResolvedValue(mockBrowser) },
  }));

  const { htmlToPdf } = await import('../htmlToPdf.js');

  const opts = { watermark: { enabled: true, text: 'COVER' } };
  const buf = await htmlToPdf('<html><body></body></html>', opts);
  expect(Buffer.isBuffer(buf)).toBe(true);
  expect(buf.toString()).toBe('PDF_BYTES');

  // ensure the evaluate actually appended an element to the body
  expect(mockPage.evaluate).toHaveBeenCalled();
  expect(appendChildSpy).toHaveBeenCalled();

  // cleanup DOM shim
  delete global.document;
});
