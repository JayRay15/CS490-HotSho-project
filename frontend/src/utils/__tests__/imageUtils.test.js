import { isValidImageType, isValidImageSize, formatFileSize, blobToFile, resizeImage } from '../imageUtils';

describe('imageUtils', () => {
  test('isValidImageType returns true for allowed types', () => {
    expect(isValidImageType({ type: 'image/jpeg' })).toBe(true);
    expect(isValidImageType({ type: 'image/png' })).toBe(true);
    expect(isValidImageType({ type: 'image/gif' })).toBe(true);
  });

  test('isValidImageType returns false for disallowed types', () => {
    expect(isValidImageType({ type: 'image/webp' })).toBe(false);
    expect(isValidImageType({ type: 'application/pdf' })).toBe(false);
  });

  test('isValidImageSize validates by MB threshold', () => {
    // 5MB threshold
    expect(isValidImageSize({ size: 5 * 1024 * 1024 })).toBe(true);
    expect(isValidImageSize({ size: 5 * 1024 * 1024 + 1 })).toBe(false);
    expect(isValidImageSize({ size: 1024 }, 1 / 1024)).toBe(true); // 1KB in MB
  });

  test('formatFileSize formats bytes into human readable units', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(500)).toBe('500 Bytes');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
  });

  test('blobToFile wraps a Blob into File with same type', () => {
    const blob = new Blob(['data'], { type: 'image/png' });
    const file = blobToFile(blob, 'test.png');
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('test.png');
    expect(file.type).toBe('image/png');
  });

  test('resizeImage rejects when FileReader fails', async () => {
    const realFileReader = global.FileReader;
    class FRMock {
      readAsDataURL() { setTimeout(() => { this.onerror && this.onerror(new Error('fail')); }, 0); }
    }
    // @ts-ignore
    global.FileReader = FRMock;
    await expect(resizeImage(new File([new Blob()], 'x.jpg', { type: 'image/jpeg' }))).rejects.toThrow('Failed to read file');
    global.FileReader = realFileReader;
  });

  test('resizeImage resolves and returns a Blob (width scaling)', async () => {
    const realFileReader = global.FileReader;
    const realImage = global.Image;
    const realCreateElement = document.createElement;

    // Mock FileReader to trigger onload
    class FRMock {
      constructor() { this.onload = null; this.onerror = null; }
      readAsDataURL() { setTimeout(() => { this.onload && this.onload({ target: { result: 'data:fake' } }); }, 0); }
    }

    // Mock Image to set large width -> triggers width scaling branch
    class ImgMock {
      constructor() { this.onload = null; this.onerror = null; this.width = 2000; this.height = 1000; }
      set src(_) { setTimeout(() => { this.onload && this.onload(); }, 0); }
    }

    // Mock canvas and toBlob
    function CanvasMock() {
      this.width = 0; this.height = 0;
      this.getContext = () => ({ drawImage: () => {} });
      this.toBlob = (cb, type) => { cb(new Blob(['x'], { type: type || 'image/png' })); };
    }

    // Apply mocks
    // @ts-ignore
    global.FileReader = FRMock;
    // @ts-ignore
    global.Image = ImgMock;
    document.createElement = (tag) => { if (tag === 'canvas') return new CanvasMock(); return realCreateElement.call(document, tag); };

    const file = new File(['data'], 'pic.png', { type: 'image/png' });
    const blob = await resizeImage(file, 512, 512, 0.8);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');

    // restore
    global.FileReader = realFileReader;
    global.Image = realImage;
    document.createElement = realCreateElement;
  });

  test('resizeImage resolves and returns a Blob (height scaling)', async () => {
    const realFileReader = global.FileReader;
    const realImage = global.Image;
    const realCreateElement = document.createElement;

    // Mock FileReader to trigger onload
    class FRMock {
      constructor() { this.onload = null; this.onerror = null; }
      readAsDataURL() { setTimeout(() => { this.onload && this.onload({ target: { result: 'data:fake' } }); }, 0); }
    }

    // Mock Image to set tall height -> triggers height scaling branch
    class ImgMock {
      constructor() { this.onload = null; this.onerror = null; this.width = 300; this.height = 2000; }
      set src(_) { setTimeout(() => { this.onload && this.onload(); }, 0); }
    }

    // Mock canvas and toBlob
    function CanvasMock() {
      this.width = 0; this.height = 0;
      this.getContext = () => ({ drawImage: () => {} });
      this.toBlob = (cb, type) => { cb(new Blob(['y'], { type: type || 'image/png' })); };
    }

    // Apply mocks
    // @ts-ignore
    global.FileReader = FRMock;
    // @ts-ignore
    global.Image = ImgMock;
    document.createElement = (tag) => { if (tag === 'canvas') return new CanvasMock(); return realCreateElement.call(document, tag); };

    const file = new File(['data'], 'portrait.png', { type: 'image/png' });
    const blob = await resizeImage(file, 512, 512, 0.8);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');

    // restore
    global.FileReader = realFileReader;
    global.Image = realImage;
    document.createElement = realCreateElement;
  });

  test('resizeImage rejects when canvas.toBlob returns null', async () => {
    const realFileReader = global.FileReader;
    const realImage = global.Image;
    const realCreateElement = document.createElement;

    class FRMock { constructor() { this.onload = null; this.onerror = null; } readAsDataURL() { setTimeout(() => { this.onload && this.onload({ target: { result: 'data:fake' } }); }, 0); } }
    class ImgMock { constructor() { this.onload = null; this.onerror = null; this.width = 100; this.height = 50; } set src(_) { setTimeout(() => { this.onload && this.onload(); }, 0); } }
    function CanvasMock() { this.width = 0; this.height = 0; this.getContext = () => ({ drawImage: () => {} }); this.toBlob = (cb) => { cb(null); }; }

    // @ts-ignore
    global.FileReader = FRMock;
    // @ts-ignore
    global.Image = ImgMock;
    document.createElement = (tag) => { if (tag === 'canvas') return new CanvasMock(); return realCreateElement.call(document, tag); };

    await expect(resizeImage(new File(['data'], 'pic.png', { type: 'image/png' }))).rejects.toThrow('Failed to create blob from canvas');

    global.FileReader = realFileReader;
    global.Image = realImage;
    document.createElement = realCreateElement;
  });

  test('resizeImage rejects when image load fails', async () => {
    const realFileReader = global.FileReader;
    const realImage = global.Image;

    class FRMock { constructor() { this.onload = null; this.onerror = null; } readAsDataURL() { setTimeout(() => { this.onload && this.onload({ target: { result: 'data:fake' } }); }, 0); } }
    class ImgMock { constructor() { this.onload = null; this.onerror = null; } set src(_) { setTimeout(() => { this.onerror && this.onerror(); }, 0); } }

    // @ts-ignore
    global.FileReader = FRMock;
    // @ts-ignore
    global.Image = ImgMock;

    await expect(resizeImage(new File(['data'], 'pic.png', { type: 'image/png' }))).rejects.toThrow('Failed to load image');

    global.FileReader = realFileReader;
    global.Image = realImage;
  });
});


