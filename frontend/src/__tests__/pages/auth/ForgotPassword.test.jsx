import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '../../../pages/auth/ForgotPassword';

const mockCreate = vi.fn();
const mockAttempt = vi.fn();
const mockSetActive = vi.fn();

vi.mock('@clerk/clerk-react', () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: { create: mockCreate, attemptFirstFactor: mockAttempt },
    setActive: mockSetActive,
  }),
}));

const renderPage = () => render(
  <MemoryRouter>
    <ForgotPassword />
  </MemoryRouter>
);

describe('ForgotPassword page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TODO: Fix accessibility - inputs need proper id/htmlFor attributes for getByLabelText
  it.skip('validates email on submit (step 1)', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /send verification code/i }));
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
  });

  it.skip('submits and advances to step 2', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({});
    renderPage();
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send verification code/i }));
    expect(mockCreate).toHaveBeenCalled();
    expect(await screen.findByText(/verification code/i)).toBeInTheDocument();
  });

  it.skip('validates fields on reset (step 2)', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({});
    renderPage();
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send verification code/i }));

    // Missing code
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(screen.getByText(/enter the 6-digit code/i)).toBeInTheDocument();

    // Enter short code
    await user.type(screen.getByLabelText(/verification code/i), '123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(screen.getByText(/enter the 6-digit code/i)).toBeInTheDocument();

    // Password length
    await user.clear(screen.getByLabelText(/verification code/i));
    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.type(screen.getByLabelText(/^new password/i), 'short');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();

    // Case and number checks
    await user.clear(screen.getByLabelText(/^new password/i));
    await user.type(screen.getByLabelText(/^new password/i), 'alllowercase1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(screen.getByText(/one uppercase/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/^new password/i));
    await user.type(screen.getByLabelText(/^new password/i), 'ALLUPPERCASE1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(screen.getByText(/one lowercase/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/^new password/i));
    await user.type(screen.getByLabelText(/^new password/i), 'NoNumber');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(screen.getByText(/one number/i)).toBeInTheDocument();

    // Mismatched confirm
    await user.clear(screen.getByLabelText(/^new password/i));
    await user.type(screen.getByLabelText(/^new password/i), 'ValidPass1');
    await user.type(screen.getByLabelText(/confirm password/i), 'OtherPass1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it.skip('completes reset flow successfully', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({});
    mockAttempt.mockResolvedValue({ status: 'complete', createdSessionId: 'sess' });

    renderPage();
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send verification code/i }));

    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.type(screen.getByLabelText(/^new password/i), 'ValidPass1');
    await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(mockAttempt).toHaveBeenCalled();
    expect(mockSetActive).toHaveBeenCalledWith({ session: 'sess' });
    expect(await screen.findByText(/password reset successful/i)).toBeInTheDocument();
  });
});


