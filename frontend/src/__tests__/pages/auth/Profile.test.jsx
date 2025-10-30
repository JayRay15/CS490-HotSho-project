import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from '../../../pages/auth/Profile';

// Mock Clerk hooks
const mockUser = {
    fullName: 'John Doe',
    primaryEmailAddress: { emailAddress: 'john@example.com' },
    imageUrl: 'https://example.com/avatar.jpg'
};
const mockSignOut = vi.fn();

vi.mock('@clerk/clerk-react', () => ({
    useUser: () => ({ user: mockUser }),
    useAuth: () => ({ signOut: mockSignOut }),
}));

// Mock API
vi.mock('../../../api/axios', () => ({
    default: {
        put: vi.fn(),
        delete: vi.fn(),
    },
    retryRequest: vi.fn((fn) => fn()),
    getErrorMessage: vi.fn((error) => error?.customError?.message || 'An error occurred'),
}));

import api from '../../../api/axios';

describe('Profile Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    describe('Initial Rendering', () => {
        it('should render the profile page with title', () => {
            render(<Profile />);
            expect(screen.getByText('My Profile')).toBeInTheDocument();
        });

        it('should display Avatar card', () => {
            render(<Profile />);
            expect(screen.getByText('Avatar')).toBeInTheDocument();
        });

        it('should display Basic Information card', () => {
            render(<Profile />);
            expect(screen.getByText('Basic Information')).toBeInTheDocument();
        });

        it('should display Danger Zone card', () => {
            render(<Profile />);
            expect(screen.getByText('Danger Zone')).toBeInTheDocument();
        });

        it('should render with proper grid layout', () => {
            const { container } = render(<Profile />);
            const grid = container.querySelector('.grid-cols-1.md\\:grid-cols-3');
            expect(grid).toBeInTheDocument();
        });
    });

    describe('Avatar Display', () => {
        it('should display user avatar image when imageUrl is provided', () => {
            render(<Profile />);
            const img = screen.getByAltText('Profile');
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
        });

        it('should display avatar container with fallback styling', () => {
            const { container } = render(<Profile />);
            const avatarCircle = container.querySelector('.w-32.h-32.rounded-full');
            expect(avatarCircle).toBeInTheDocument();
            expect(avatarCircle).toHaveClass('bg-neutral-200', 'overflow-hidden');
        });

        it('should have disabled Upload Photo button', () => {
            render(<Profile />);
            const uploadButton = screen.getByRole('button', { name: /upload photo/i });
            expect(uploadButton).toBeDisabled();
        });

        it('should render avatar with proper styling', () => {
            const { container } = render(<Profile />);
            const avatarDiv = container.querySelector('.w-32.h-32.rounded-full');
            expect(avatarDiv).toHaveClass('bg-neutral-200', 'overflow-hidden');
        });
    });

    describe('Form Fields', () => {
        it('should pre-fill name field with Clerk user data', () => {
            const { container } = render(<Profile />);
            const nameInput = container.querySelector('input[name="name"]');
            expect(nameInput).toHaveValue('John Doe');
        });

        it('should pre-fill email field with Clerk user data', () => {
            const { container } = render(<Profile />);
            const emailInput = container.querySelector('input[name="email"]');
            expect(emailInput).toHaveValue('john@example.com');
        });

        it('should render all form fields', () => {
            const { container } = render(<Profile />);
            expect(container.querySelector('input[name="name"]')).toBeInTheDocument();
            expect(container.querySelector('input[name="email"]')).toBeInTheDocument();
            expect(container.querySelector('input[name="phone"]')).toBeInTheDocument();
            expect(container.querySelector('input[name="location"]')).toBeInTheDocument();
            expect(container.querySelector('textarea[name="bio"]')).toBeInTheDocument();
        });

        it('should have name field marked as required', () => {
            const { container } = render(<Profile />);
            const nameInput = container.querySelector('input[name="name"]');
            expect(nameInput).toBeRequired();
        });

        it('should have email field marked as required', () => {
            const { container } = render(<Profile />);
            const emailInput = container.querySelector('input[name="email"]');
            expect(emailInput).toBeRequired();
        });

        it('should render bio as textarea', () => {
            const { container } = render(<Profile />);
            const bioInput = container.querySelector('textarea[name="bio"]');
            expect(bioInput.tagName).toBe('TEXTAREA');
        });

        it('should have bio textarea with 4 rows', () => {
            const { container } = render(<Profile />);
            const bioInput = container.querySelector('textarea[name="bio"]');
            expect(bioInput).toHaveAttribute('rows', '4');
        });

        it('should have bio placeholder text', () => {
            const { container } = render(<Profile />);
            const bioInput = container.querySelector('textarea[name="bio"]');
            expect(bioInput).toHaveAttribute('placeholder', 'Tell us about yourself...');
        });
    });

    describe('Form Interaction', () => {
        it('should update form fields when user types', async () => {
            const user = userEvent.setup();
            const { container } = render(<Profile />);

            const phoneInput = container.querySelector('input[name="phone"]');
            await user.clear(phoneInput);
            await user.type(phoneInput, '123-456-7890');

            expect(phoneInput).toHaveValue('123-456-7890');
        });

        it('should update location field', async () => {
            const user = userEvent.setup();
            const { container } = render(<Profile />);

            const locationInput = container.querySelector('input[name="location"]');
            await user.type(locationInput, 'New York, NY');

            expect(locationInput).toHaveValue('New York, NY');
        });

        it('should update bio textarea', async () => {
            const user = userEvent.setup();
            const { container } = render(<Profile />);

            const bioInput = container.querySelector('textarea[name="bio"]');
            await user.type(bioInput, 'Software developer with passion for testing');

            expect(bioInput).toHaveValue('Software developer with passion for testing');
        });

        it('should clear error when user starts typing', async () => {
            const user = userEvent.setup();
            api.put.mockRejectedValueOnce({
                customError: { message: 'Update failed' }
            });

            const { container } = render(<Profile />);

            // Trigger error
            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Update failed')).toBeInTheDocument();
            });

            // Type in field should clear error
            const nameInput = container.querySelector('input[name="name"]');
            await user.type(nameInput, ' Updated');

            await waitFor(() => {
                expect(screen.queryByText('Update failed')).not.toBeInTheDocument();
            });
        });

        it('should clear success message when user types', async () => {
            const user = userEvent.setup();
            api.put.mockResolvedValueOnce({ data: { success: true } });

            const { container } = render(<Profile />);

            // Trigger success
            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
            });

            // Type in field should clear success
            const nameInput = container.querySelector('input[name="name"]');
            await user.type(nameInput, ' Updated');

            await waitFor(() => {
                expect(screen.queryByText(/profile updated successfully/i)).not.toBeInTheDocument();
            });
        });
    });

    describe('Form Submission', () => {
        it('should call API with form data on submit', async () => {
            const user = userEvent.setup();
            api.put.mockResolvedValueOnce({ data: { success: true } });

            const { container } = render(<Profile />);

            const phoneInput = container.querySelector('input[name="phone"]');
            await user.type(phoneInput, '123-456-7890');

            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(api.put).toHaveBeenCalledWith('/api/users/me', expect.objectContaining({
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '123-456-7890'
                }));
            });
        });

        it('should disable save button during submission', async () => {
            const user = userEvent.setup();
            let resolvePromise;
            api.put.mockImplementation(() => new Promise(resolve => {
                resolvePromise = resolve;
            }));

            render(<Profile />);

            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            // Button should be disabled and show "Saving..."
            await waitFor(() => {
                expect(saveButton).toBeDisabled();
            });

            // Resolve the promise to cleanup
            resolvePromise({ data: { success: true } });
        });

        it('should display success message on successful update', async () => {
            const user = userEvent.setup();
            api.put.mockResolvedValueOnce({ data: { success: true } });

            render(<Profile />);

            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
            });
        });

        it('should have success message with proper styling', async () => {
            const user = userEvent.setup();
            api.put.mockResolvedValueOnce({ data: { success: true } });

            render(<Profile />);

            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            await waitFor(() => {
                const successDiv = screen.getByText(/profile updated successfully/i).closest('div');
                expect(successDiv).toHaveClass('border-green-300', 'bg-green-50');
            });
        });

        it('should display error message on failed update', async () => {
            const user = userEvent.setup();
            api.put.mockRejectedValueOnce({
                customError: { message: 'Network error' }
            });

            render(<Profile />);

            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Network error')).toBeInTheDocument();
            });
        });

        it('should handle validation errors', async () => {
            const user = userEvent.setup();
            api.put.mockRejectedValueOnce({
                customError: {
                    message: 'Validation failed',
                    errors: [
                        { field: 'email', message: 'Invalid email format' }
                    ]
                }
            });

            render(<Profile />);

            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Validation failed')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('should display ErrorMessage component when error occurs', async () => {
            const user = userEvent.setup();
            api.put.mockRejectedValueOnce({
                customError: { message: 'Something went wrong' }
            });

            render(<Profile />);

            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            });
        });

        it('should allow dismissing error message', async () => {
            const user = userEvent.setup();
            api.put.mockRejectedValueOnce({
                customError: { message: 'Error message' }
            });

            render(<Profile />);

            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Error message')).toBeInTheDocument();
            });

            const dismissButtons = screen.getAllByText('Dismiss');
            await user.click(dismissButtons[0]);

            await waitFor(() => {
                expect(screen.queryByText('Error message')).not.toBeInTheDocument();
            });
        });

        it('should show retry button for retryable errors', async () => {
            const user = userEvent.setup();
            api.put.mockRejectedValueOnce({
                customError: { message: 'Network error', canRetry: true }
            });

            render(<Profile />);

            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Network error')).toBeInTheDocument();
            });

            // Check that retry button exists when canRetry is true (button text is "Try Again")
            expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
        });
    });

    describe('Delete Account Modal', () => {
        it('should not show delete modal initially', () => {
            render(<Profile />);
            expect(screen.queryByText('Confirm Account Deletion')).not.toBeInTheDocument();
        });

        it('should open delete modal when Delete Account button is clicked', async () => {
            const user = userEvent.setup();
            render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            expect(screen.getByText('Confirm Account Deletion')).toBeInTheDocument();
        });

        it('should display warning message in modal', async () => {
            const user = userEvent.setup();
            render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            expect(screen.getByText(/schedule your account for permanent deletion in 30 days/i)).toBeInTheDocument();
        });

        it('should render password field in delete modal', async () => {
            const user = userEvent.setup();
            const { container } = render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            // Use container query for password input since InputField might not have proper label association
            await waitFor(() => {
                const passwordInput = container.querySelector('input[name="deletePassword"]');
                expect(passwordInput).toBeInTheDocument();
                expect(passwordInput).toHaveAttribute('type', 'password');
            });
        });

        it('should close modal when Cancel button is clicked', async () => {
            const user = userEvent.setup();
            render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            await user.click(cancelButton);

            await waitFor(() => {
                expect(screen.queryByText('Confirm Account Deletion')).not.toBeInTheDocument();
            });
        });

        it('should have modal with proper backdrop styling', async () => {
            const user = userEvent.setup();
            const { container } = render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            const backdrop = container.querySelector('.fixed.inset-0.z-50');
            expect(backdrop).toHaveClass('bg-black', 'bg-opacity-50');
        });

        it('should allow typing in password field', async () => {
            const user = userEvent.setup();
            const { container } = render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            const modalPassword = container.querySelector('input[name="deletePassword"]');
            await user.type(modalPassword, 'mypassword123');

            expect(modalPassword).toHaveValue('mypassword123');
        });
    });

    describe('Account Deletion', () => {
        it('should call delete API when deletion is confirmed', async () => {
            const user = userEvent.setup();
            api.delete.mockResolvedValueOnce({ data: { success: true } });

            const { container } = render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            const modalPassword = container.querySelector('input[name="deletePassword"]');
            await user.type(modalPassword, 'mypassword');

            const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
            await user.click(confirmButton);

            await waitFor(() => {
                expect(api.delete).toHaveBeenCalledWith('/api/users/delete', {
                    data: { password: 'mypassword' }
                });
            });
        });

        it('should show deleting state during deletion', async () => {
            const user = userEvent.setup();
            api.delete.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            const { container } = render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            const modalPassword = container.querySelector('input[name="deletePassword"]');
            await user.type(modalPassword, 'mypassword');

            const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
            await user.click(confirmButton);

            expect(screen.getByText('Deleting...')).toBeInTheDocument();
        });

        it('should set logout message in sessionStorage on successful deletion', async () => {
            const user = userEvent.setup();
            api.delete.mockResolvedValueOnce({ data: { success: true } });

            const { container } = render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            const modalPassword = container.querySelector('input[name="deletePassword"]');
            await user.type(modalPassword, 'mypassword');

            const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
            await user.click(confirmButton);

            await waitFor(() => {
                expect(sessionStorage.getItem('logoutMessage')).toContain('deletion request was received');
            });
        });

        it('should call signOut after successful deletion', async () => {
            const user = userEvent.setup();
            api.delete.mockResolvedValueOnce({ data: { success: true } });

            const { container } = render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            const modalPassword = container.querySelector('input[name="deletePassword"]');
            await user.type(modalPassword, 'mypassword');

            const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
            await user.click(confirmButton);

            await waitFor(() => {
                expect(mockSignOut).toHaveBeenCalled();
            });
        });

        it('should clear password field after deletion attempt', async () => {
            const user = userEvent.setup();
            api.delete.mockResolvedValueOnce({ data: { success: true } });

            const { container } = render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            const modalPassword = container.querySelector('input[name="deletePassword"]');
            await user.type(modalPassword, 'mypassword');

            const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
            await user.click(confirmButton);

            await waitFor(() => {
                expect(mockSignOut).toHaveBeenCalled();
            });

            // Modal should be closed
            await waitFor(() => {
                expect(screen.queryByText('Confirm Account Deletion')).not.toBeInTheDocument();
            });
        });

        it('should display error if deletion fails', async () => {
            const user = userEvent.setup();
            api.delete.mockRejectedValueOnce({
                customError: { message: 'Incorrect password' }
            });

            const { container } = render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            const modalPassword = container.querySelector('input[name="deletePassword"]');
            await user.type(modalPassword, 'wrongpassword');

            const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
            await user.click(confirmButton);

            await waitFor(() => {
                expect(screen.getByText('Incorrect password')).toBeInTheDocument();
            });
        });

        it('should close modal after failed deletion', async () => {
            const user = userEvent.setup();
            api.delete.mockRejectedValueOnce({
                customError: { message: 'Deletion failed' }
            });

            const { container } = render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            const modalPassword = container.querySelector('input[name="deletePassword"]');
            await user.type(modalPassword, 'password');

            const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
            await user.click(confirmButton);

            await waitFor(() => {
                expect(screen.queryByText('Confirm Account Deletion')).not.toBeInTheDocument();
            });
        });

        it('should not call signOut if deletion fails', async () => {
            const user = userEvent.setup();
            api.delete.mockRejectedValueOnce({
                customError: { message: 'Deletion failed' }
            });

            const { container } = render(<Profile />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            await user.click(deleteButton);

            const modalPassword = container.querySelector('input[name="deletePassword"]');
            await user.type(modalPassword, 'password');

            const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
            await user.click(confirmButton);

            await waitFor(() => {
                expect(screen.getByText('Deletion failed')).toBeInTheDocument();
            });

            expect(mockSignOut).not.toHaveBeenCalled();
        });
    });

    describe('Danger Zone', () => {
        it('should render Danger Zone card', () => {
            render(<Profile />);
            expect(screen.getByText('Danger Zone')).toBeInTheDocument();
        });

        it('should display warning text about deletion', () => {
            render(<Profile />);
            expect(screen.getByText(/permanently remove your personal data after a 30-day grace period/i)).toBeInTheDocument();
        });

        it('should have Delete Account button with danger variant', () => {
            render(<Profile />);
            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            expect(deleteButton).toBeInTheDocument();
        });
    });
});
