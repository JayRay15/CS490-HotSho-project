import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
// We'll import the component after setting up module mocks so the mocks are applied

// Mock axios API module
vi.mock('../../api/axios', () => ({
  __esModule: true,
  default: { post: vi.fn(), delete: vi.fn() },
  setAuthToken: vi.fn(),
}));

// Mock clerk auth
vi.mock('@clerk/clerk-react', () => ({
  __esModule: true,
  ClerkProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue('tok'), isSignedIn: true, signOut: vi.fn() }),
}));

// Mock image utilities
vi.mock('../../utils/imageUtils', () => ({
  resizeImage: vi.fn(),
  isValidImageType: vi.fn(),
  isValidImageSize: vi.fn(),
  formatFileSize: vi.fn((bytes) => `${Math.round(bytes / 1024)} KB`),
  blobToFile: vi.fn((b, name) => new File([b], name, { type: b.type || 'image/png' })),
}));

describe('ProfilePictureUpload - intensive', () => {
  // import the component and the mocked modules after mocks so that its imports are mocked
  let ProfilePictureUpload;
  let imgUtils;
  let api;

  beforeAll(async () => {
    // dynamic imports will return the modules mocked by vi.mock above
    const mod = await import('../ProfilePictureUpload.jsx');
    ProfilePictureUpload = mod.default;
    imgUtils = (await import('../../utils/imageUtils'));
    api = (await import('../../api/axios')).default;
  });

  beforeEach(() => {
    // reset/mockReturnValue on the mocked functions
    if (imgUtils.isValidImageType?.mockReturnValue) imgUtils.isValidImageType.mockReturnValue(true);
    if (imgUtils.isValidImageSize?.mockReturnValue) imgUtils.isValidImageSize.mockReturnValue(true);
    if (imgUtils.resizeImage?.mockResolvedValue) imgUtils.resizeImage.mockResolvedValue(new Blob(['data'], { type: 'image/png' }));
    if (imgUtils.formatFileSize?.mockReturnValue) imgUtils.formatFileSize.mockReturnValue(`${Math.round(6 * 1024)} KB`);
    if (imgUtils.blobToFile?.mockImplementation) imgUtils.blobToFile.mockImplementation((b, name) => new File([b], name, { type: b.type || 'image/png' }));
    // mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:preview');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  test('shows error for invalid file type', async () => {
    // make image type invalid for this case
    imgUtils.isValidImageType.mockReturnValue(false);

    const { container, findByText } = render(<ProfilePictureUpload />);
    // open modal
    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    const input = container.querySelector('#profile-picture-input-modal');
    const file = new File(['x'], 'file.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await findByText(/Invalid file type/i)).toBeTruthy();
  });

  test('shows error for oversized file', async () => {
    imgUtils.isValidImageType.mockReturnValue(true);
    imgUtils.isValidImageSize.mockReturnValue(false);
    imgUtils.formatFileSize.mockReturnValue('6 MB');

    const { container, findByText } = render(<ProfilePictureUpload />);
    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    const input = container.querySelector('#profile-picture-input-modal');
    const file = new File(['x'.repeat(1024)], 'big.png', { type: 'image/png', size: 6 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await findByText(/File is too large/i)).toBeTruthy();
  });

  test('handles resize failure gracefully', async () => {
    imgUtils.resizeImage.mockRejectedValue(new Error('resize failed'));

    const { container, findByText } = render(<ProfilePictureUpload />);
    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    const input = container.querySelector('#profile-picture-input-modal');
    const file = new File(['x'], 'img.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await findByText(/Failed to process image/i)).toBeTruthy();
  });

  test('creates preview and saves successfully', async () => {
    api.post.mockResolvedValue({ data: { data: { picture: 'http://example.com/pic.png' } } });

    const onUploadSuccess = vi.fn();

    const { container, getByText, findByAltText, queryByText } = render(
      <ProfilePictureUpload onUploadSuccess={onUploadSuccess} />
    );

    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    const input = container.querySelector('#profile-picture-input-modal');
    const file = new File(['imgdata'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    // wait for preview to appear
    expect(await findByAltText('Preview')).toBeTruthy();

    // click Save Changes
    const saveBtn = getByText(/Save Changes/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalledWith('http://example.com/pic.png');
      // modal should be closed
      expect(queryByText(/Edit Profile Picture/)).toBeNull();
    });
  });

  test('delete flow calls onDeleteSuccess when confirmed', async () => {
    api.delete.mockResolvedValue({});

    const onDeleteSuccess = vi.fn();

    // provide a currentPicture so Delete button is visible
    const { container, getByText, queryByText } = render(
      <ProfilePictureUpload currentPicture={'http://example.com/me.png'} onDeleteSuccess={onDeleteSuccess} />
    );

    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    // mock confirm to accept
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const deleteBtn = getByText(/Delete Picture/i);
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(onDeleteSuccess).toHaveBeenCalled();
      expect(queryByText(/Edit Profile Picture/)).toBeNull();
    });
  });
});
