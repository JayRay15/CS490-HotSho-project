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
});


