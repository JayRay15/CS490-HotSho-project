import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isValidImageType, isValidImageSize, formatFileSize, resizeImage } from '../../utils/imageUtils';

describe('imageUtils basic validators', () => {
  it('validates image MIME types', () => {
    expect(isValidImageType({ type: 'image/jpeg' })).toBe(true);
    expect(isValidImageType({ type: 'image/png' })).toBe(true);
    expect(isValidImageType({ type: 'image/gif' })).toBe(true);
    expect(isValidImageType({ type: 'application/pdf' })).toBe(false);
  });

  it('validates image size threshold', () => {
    expect(isValidImageSize({ size: 5 * 1024 * 1024 }, 5)).toBe(true);
    expect(isValidImageSize({ size: 6 * 1024 * 1024 }, 5)).toBe(false);
  });

  it('formats file sizes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
  });
});

describe('resizeImage', () => {
  const originalImage = global.Image;
  const originalCreateElement = document.createElement;
  const originalFileReader = global.FileReader;

  beforeEach(() => {
    // Mock FileReader
    class MockFileReader {
      readAsDataURL(file) {
        setTimeout(() => {
          this.onload({ target: { result: 'data:image/png;base64,abc' } });
        }, 0);
      }
    }
    global.FileReader = MockFileReader;

    // Mock Image
    class MockImage {
      set src(_v) {
        setTimeout(() => {
          this.width = 1000;
          this.height = 500;
          this.onload();
        }, 0);
      }
    }
    global.Image = MockImage;

    // Mock canvas
    document.createElement = (tag) => {
      if (tag === 'canvas') {
        return {
          getContext: () => ({ drawImage: vi.fn() }),
          toBlob: (cb) => cb(new Blob(['x'], { type: 'image/png' })),
          set width(v) { this._w = v; },
          set height(v) { this._h = v; },
        };
      }
      return originalCreateElement.call(document, tag);
    };
  });

  it('resolves with a blob after resizing', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'img.png', { type: 'image/png' });
    const blob = await resizeImage(file, 512, 512, 0.9);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
  });
});


