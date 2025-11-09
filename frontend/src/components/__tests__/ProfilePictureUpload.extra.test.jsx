import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

// Mocks must be declared before importing the component so imports are mocked
vi.mock('../../api/axios', () => ({
  __esModule: true,
  default: { post: vi.fn(), delete: vi.fn() },
  setAuthToken: vi.fn(),
}));

vi.mock('@clerk/clerk-react', () => ({
  __esModule: true,
  ClerkProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue('tok'), isSignedIn: true, signOut: vi.fn() }),
}));

vi.mock('../../utils/imageUtils', () => ({
  resizeImage: vi.fn(),
  isValidImageType: vi.fn(),
  isValidImageSize: vi.fn(),
  formatFileSize: vi.fn(),
  blobToFile: vi.fn(),
}));

describe('ProfilePictureUpload - extra cases', () => {
  let ProfilePictureUpload;
  let api;
  let imgUtils;

  beforeAll(async () => {
    const mod = await import('../ProfilePictureUpload.jsx');
    ProfilePictureUpload = mod.default;
    api = (await import('../../api/axios')).default;
    imgUtils = await import('../../utils/imageUtils');
  });

  afterEach(() => {
    vi.clearAllMocks();
    // reset sessionStorage
    sessionStorage.clear();
  });

  test('opens modal and closes when clicking backdrop', async () => {
    const { container, queryByText } = render(<ProfilePictureUpload />);

    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    // modal should be visible
    expect(queryByText(/Edit Profile Picture/i)).toBeTruthy();

    // click the overlay backdrop (fixed inset-0)
    const overlay = container.querySelector('.fixed.inset-0');
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(queryByText(/Edit Profile Picture/i)).toBeNull();
    });
  });

  test('delete is cancelled when user dismisses confirm', async () => {
    api.delete.mockResolvedValue({});

    const onDeleteSuccess = vi.fn();
    const { container, getByText } = render(<ProfilePictureUpload currentPicture={'http://x'} onDeleteSuccess={onDeleteSuccess} />);

    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    // mock confirm to cancel
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const deleteBtn = getByText(/Delete Picture/i);
    fireEvent.click(deleteBtn);

    // delete should not have been called and callback not invoked
    expect(api.delete).not.toHaveBeenCalled();
    expect(onDeleteSuccess).not.toHaveBeenCalled();
  });

  test('upload failure sets error and stops uploading', async () => {
    // Prepare mocks so selection flows succeed
    imgUtils.isValidImageType.mockReturnValue(true);
    imgUtils.isValidImageSize.mockReturnValue(true);
    imgUtils.resizeImage.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
    imgUtils.blobToFile.mockImplementation((b, name) => new File([b], name, { type: b.type || 'image/png' }));
    global.URL.createObjectURL = vi.fn(() => 'blob:preview');

    // Make upload fail
    api.post.mockRejectedValue(new Error('upload failed'));

    const onUploadSuccess = vi.fn();
    const { container, getByText, findByAltText, findByText } = render(<ProfilePictureUpload onUploadSuccess={onUploadSuccess} />);

    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    const input = container.querySelector('#profile-picture-input-modal');
    const file = new File(['imgdata'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    // preview should show
    expect(await findByAltText('Preview')).toBeTruthy();

    // click Save Changes -> upload will fail
    const saveBtn = getByText(/Save Changes/i);
    fireEvent.click(saveBtn);

    // error should be displayed with message
    expect(await findByText(/upload failed/i)).toBeTruthy();
    expect(onUploadSuccess).not.toHaveBeenCalled();
  });

  test('hover overlay toggles opacity classes', async () => {
    const { container } = render(<ProfilePictureUpload />);
    const opener = container.querySelector('.group');

    // hover enter
    fireEvent.mouseEnter(opener);
    // overlay div is absolute inset-0
    const overlay = container.querySelector('.absolute.inset-0');
    expect(overlay.className).toContain('opacity-50');

    // hover leave
    fireEvent.mouseLeave(opener);
    expect(overlay.className).toContain('opacity-0');
  });

  test('clicking Save with no selected file closes modal', async () => {
    const { container, queryByText, getByText } = render(<ProfilePictureUpload />);
    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    expect(queryByText(/Edit Profile Picture/i)).toBeTruthy();

    const saveBtn = getByText(/Save Changes/i);
    // Save should be disabled when no file selected
    expect(saveBtn).toBeDisabled();

    // close modal via backdrop
    const overlay = container.querySelector('.fixed.inset-0');
    fireEvent.click(overlay);

    await waitFor(() => expect(queryByText(/Edit Profile Picture/i)).toBeNull());
  });

  test('mouseOver changes Choose New Picture background color when enabled', async () => {
    // prepare selection so the label is enabled
    imgUtils.isValidImageType.mockReturnValue(true);
    imgUtils.isValidImageSize.mockReturnValue(true);
    imgUtils.resizeImage.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
    imgUtils.blobToFile.mockImplementation((b, name) => new File([b], name, { type: b.type || 'image/png' }));
    global.URL.createObjectURL = vi.fn(() => 'blob:preview');

    const { container } = render(<ProfilePictureUpload />);
    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    const input = container.querySelector('#profile-picture-input-modal');
    const file = new File(['imgdata'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    // label should exist
    const label = container.querySelector('label[for="profile-picture-input-modal"]');
    // simulate mouse over and wait for style change
  fireEvent.mouseOver(label);
  // jsdom returns computed colors in rgb(...) format, assert normalized rgb values
  await waitFor(() => expect(label.style.backgroundColor).toBe('rgb(101, 106, 92)'));

  // mouse out should restore
  fireEvent.mouseOut(label);
  await waitFor(() => expect(label.style.backgroundColor).toBe('rgb(119, 124, 109)'));
  });

  test('hover overlay appears on mouse enter and hides on leave', async () => {
    const { container } = render(<ProfilePictureUpload />);
    const opener = container.querySelector('.group');

    // initially overlay should be opacity-0
    let overlay = container.querySelector('.absolute.inset-0');
    expect(overlay.className).toMatch(/opacity-0/);

    // mouse enter
    fireEvent.mouseEnter(opener);
    overlay = container.querySelector('.absolute.inset-0');
    expect(overlay.className).toMatch(/opacity-50/);

    // mouse leave
    fireEvent.mouseLeave(opener);
    overlay = container.querySelector('.absolute.inset-0');
    expect(overlay.className).toMatch(/opacity-0/);
  });

  test('save without selecting a file shows disabled Save and modal can be closed', async () => {
    const { container, queryByText, getByText } = render(<ProfilePictureUpload />);
    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    expect(queryByText(/Edit Profile Picture/i)).toBeTruthy();

    const saveBtn = getByText(/Save Changes/i);
    // Save should be disabled when no file selected
    expect(saveBtn).toBeDisabled();

    // close modal by clicking backdrop
    const overlay = container.querySelector('.fixed.inset-0');
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(queryByText(/Edit Profile Picture/i)).toBeNull();
    });
  });

  test('delete success calls onDeleteSuccess and closes modal', async () => {
    api.delete.mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const onDeleteSuccess = vi.fn();
    const { container, getByText, queryByText } = render(<ProfilePictureUpload currentPicture={'http://x'} onDeleteSuccess={onDeleteSuccess} />);

    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    const deleteBtn = getByText(/Delete Picture/i);
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/users/profile-picture');
      expect(onDeleteSuccess).toHaveBeenCalled();
      expect(queryByText(/Edit Profile Picture/i)).toBeNull();
    });
  });

  test('save success calls onUploadSuccess, resets input and closes modal', async () => {
    imgUtils.isValidImageType.mockReturnValue(true);
    imgUtils.isValidImageSize.mockReturnValue(true);
    imgUtils.resizeImage.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
    imgUtils.blobToFile.mockImplementation((b, name) => new File([b], name, { type: b.type || 'image/png' }));
    global.URL.createObjectURL = vi.fn(() => 'blob:preview');

    api.post.mockResolvedValue({ data: { data: { picture: 'http://example.com/new.png' } } });

    const onUploadSuccess = vi.fn();
    const { container, getByText, findByAltText, queryByText } = render(<ProfilePictureUpload onUploadSuccess={onUploadSuccess} />);

    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    const input = container.querySelector('#profile-picture-input-modal');
    const file = new File(['imgdata'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await findByAltText('Preview')).toBeTruthy();

    const saveBtn = getByText(/Save Changes/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalledWith('http://example.com/new.png');
      expect(queryByText(/Edit Profile Picture/i)).toBeNull();
      // file input should be cleared
      expect(input.value).toBe('');
    });
  });

  test('mouseover/mouseout handlers change inline styles on modal controls', async () => {
    // Prepare preview so Save/Delete enabled
    imgUtils.isValidImageType.mockReturnValue(true);
    imgUtils.isValidImageSize.mockReturnValue(true);
    imgUtils.resizeImage.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
    imgUtils.blobToFile.mockImplementation((b, name) => new File([b], name, { type: b.type || 'image/png' }));
    global.URL.createObjectURL = vi.fn(() => 'blob:preview');
    api.post.mockResolvedValue({ data: { data: { picture: 'http://example.com/new.png' } } });

    const { container, getByText, findByAltText } = render(<ProfilePictureUpload currentPicture={'http://x'} />);
    const opener = container.querySelector('.group');
    fireEvent.click(opener);

    const input = container.querySelector('#profile-picture-input-modal');
    const file = new File(['imgdata'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    // wait for preview
    expect(await findByAltText('Preview')).toBeTruthy();

    // Close (top-right) button color changes on mouseover/out
    const closeBtn = container.querySelector('button.absolute.top-3.right-3');
    const beforeColor = closeBtn.style.color;
    fireEvent.mouseOver(closeBtn);
    expect(closeBtn.style.color).not.toBe(beforeColor);
    fireEvent.mouseOut(closeBtn);

    // Label hover changes background color
    const label = container.querySelector('label[for="profile-picture-input-modal"]');
    const beforeBg = label.style.backgroundColor;
    fireEvent.mouseOver(label);
    expect(label.style.backgroundColor).not.toBe(beforeBg);
    fireEvent.mouseOut(label);

    // Delete and Save hover (ensure they exist and are enabled)
    const deleteBtn = getByText(/Delete Picture/i);
    fireEvent.mouseOver(deleteBtn);
    expect(deleteBtn.style.backgroundColor).not.toBe('');
    fireEvent.mouseOut(deleteBtn);

    const saveBtn = getByText(/Save Changes/i);
    fireEvent.mouseOver(saveBtn);
    expect(saveBtn.style.backgroundColor).not.toBe('');
    fireEvent.mouseOut(saveBtn);
  });
});
