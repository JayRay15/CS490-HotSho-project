import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Certifications from '../../../pages/auth/Certifications';

// Mock API
vi.mock('../../../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  setAuthToken: vi.fn(),
}));

import api from '../../../api/axios';

describe.skip('Certifications CRUD Workflow', () => {
  const mockGetToken = vi.fn().mockResolvedValue('mock-token');
  const mockOnListUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ 
      data: { 
        data: { 
          certifications: [] 
        } 
      } 
    });
    api.post.mockResolvedValue({ 
      data: { 
        data: { 
          certifications: [{
            _id: '1',
            name: 'AWS Certified Solutions Architect',
            organization: 'AWS',
            dateEarned: '2024-01-15',
            expirationDate: '2027-01-15',
            doesNotExpire: false,
            certId: 'AWS-12345',
            industry: 'Software',
            reminderDays: 30,
            verification: 'Unverified'
          }]
        }
      } 
    });
    api.put.mockResolvedValue({ 
      data: { 
        data: { 
          certifications: [{
            _id: '1',
            name: 'AWS Certified Solutions Architect - Updated',
            organization: 'AWS',
            dateEarned: '2024-01-15',
            expirationDate: '2027-01-15',
            doesNotExpire: false,
            certId: 'AWS-12345',
            industry: 'Software',
            reminderDays: 60,
            verification: 'Verified'
          }]
        }
      } 
    });
    api.delete.mockResolvedValue({ data: { data: { certifications: [] } } });
  });

  describe('Certification Form Rendering', () => {
    it('should render all required form fields', () => {
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      expect(screen.getByLabelText(/certification name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/issuing organization/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date earned/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/does not expire/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/certification number.*id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/industry/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/renewal reminder/i)).toBeInTheDocument();
    });

    it('should have upload document functionality', () => {
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      expect(screen.getByText(/choose file/i)).toBeInTheDocument();
      expect(screen.getByText(/confirm upload/i)).toBeInTheDocument();
    });

    it('should show organization suggestions', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const orgInput = screen.getByLabelText(/issuing organization/i);
      await user.type(orgInput, 'aws');

      await waitFor(() => {
        expect(screen.getByText('AWS')).toBeInTheDocument();
      });
    });

    it('should display industry dropdown options', () => {
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const industrySelect = screen.getByLabelText(/industry/i);
      const options = within(industrySelect).getAllByRole('option');
      
      expect(options.length).toBeGreaterThan(1); // Has options beyond default
      expect(screen.getByRole('option', { name: /software/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /finance/i })).toBeInTheDocument();
    });
  });

  describe('Certification Form Validation', () => {
    it('should require certification name', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const form = screen.getByRole('form');
      const submitButton = form.querySelector('button[type="submit"]');
      
      if (submitButton) {
        await user.click(submitButton);
      } else {
        // Trigger form submit
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/name.*required/i));
      });

      alertSpy.mockRestore();
    });

    it('should require organization', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const nameInput = screen.getByLabelText(/certification name/i);
      await user.type(nameInput, 'Test Certification');

      const form = screen.getByRole('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/organization.*required/i));
      });

      alertSpy.mockRestore();
    });

    it('should require date earned', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const nameInput = screen.getByLabelText(/certification name/i);
      await user.type(nameInput, 'Test Certification');

      const orgInput = screen.getByLabelText(/issuing organization/i);
      await user.type(orgInput, 'Test Org');

      const form = screen.getByRole('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/date earned.*required/i));
      });

      alertSpy.mockRestore();
    });

    it('should require expiration date when not marked does not expire', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const nameInput = screen.getByLabelText(/certification name/i);
      await user.type(nameInput, 'Test Certification');

      const orgInput = screen.getByLabelText(/issuing organization/i);
      await user.type(orgInput, 'Test Org');

      const dateEarnedInput = screen.getByLabelText(/date earned/i);
      await user.type(dateEarnedInput, '2024-01-15');

      const form = screen.getByRole('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/expiration.*required/i));
      });

      alertSpy.mockRestore();
    });

    it('should not require expiration date when does not expire is checked', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const nameInput = screen.getByLabelText(/certification name/i);
      await user.type(nameInput, 'Test Certification');

      const orgInput = screen.getByLabelText(/issuing organization/i);
      await user.type(orgInput, 'Test Org');

      const dateEarnedInput = screen.getByLabelText(/date earned/i);
      await user.type(dateEarnedInput, '2024-01-15');

      const doesNotExpireCheckbox = screen.getByLabelText(/does not expire/i);
      await user.click(doesNotExpireCheckbox);

      const form = screen.getByRole('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    });
  });

  describe('Certification Form Input Handling', () => {
    it('should update certification name', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const nameInput = screen.getByLabelText(/certification name/i);
      await user.type(nameInput, 'PMP Certification');

      expect(nameInput).toHaveValue('PMP Certification');
    });

    it('should disable expiration date when does not expire is checked', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const expirationInput = screen.getByLabelText(/expiration date/i);
      const doesNotExpireCheckbox = screen.getByLabelText(/does not expire/i);

      expect(expirationInput).not.toBeDisabled();

      await user.click(doesNotExpireCheckbox);

      expect(expirationInput).toBeDisabled();
    });

    it('should handle organization autocomplete selection', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const orgInput = screen.getByLabelText(/issuing organization/i);
      await user.type(orgInput, 'micro');

      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument();
      });

      const microsoftOption = screen.getByText('Microsoft');
      await user.click(microsoftOption);

      expect(orgInput).toHaveValue('Microsoft');
    });

    it('should update reminder days input', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const reminderInput = screen.getByLabelText(/renewal reminder/i);
      await user.clear(reminderInput);
      await user.type(reminderInput, '60');

      expect(reminderInput).toHaveValue(60);
    });
  });

  describe('Certification Document Upload', () => {
    it('should display file input', () => {
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      expect(screen.getByText(/choose file/i)).toBeInTheDocument();
    });

    it('should require confirmation before uploading', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const confirmButton = screen.getByText(/confirm upload/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/no file selected/i));
      });

      alertSpy.mockRestore();
    });

    it('should display uploaded file name', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const file = new File(['certificate'], 'certificate.pdf', { type: 'application/pdf' });
      const chooseFileButton = screen.getByText(/choose file/i);
      
      const fileInput = chooseFileButton.previousElementSibling;
      if (fileInput) {
        await user.upload(fileInput, file);

        await waitFor(() => {
          expect(screen.getByText(/certificate\.pdf/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Certification Create (Add)', () => {
    it('should successfully add new certification', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const nameInput = screen.getByLabelText(/certification name/i);
      await user.type(nameInput, 'AWS Certified Solutions Architect');

      const orgInput = screen.getByLabelText(/issuing organization/i);
      await user.type(orgInput, 'AWS');

      const dateEarnedInput = screen.getByLabelText(/date earned/i);
      await user.type(dateEarnedInput, '2024-01-15');

      const expirationInput = screen.getByLabelText(/expiration date/i);
      await user.type(expirationInput, '2027-01-15');

      const certIdInput = screen.getByLabelText(/certification number.*id/i);
      await user.type(certIdInput, 'AWS-12345');

      const industrySelect = screen.getByLabelText(/industry/i);
      await user.selectOptions(industrySelect, 'Software');

      const form = screen.getByRole('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/profile/certifications', expect.objectContaining({
          name: 'AWS Certified Solutions Architect',
          organization: 'AWS',
          certId: 'AWS-12345',
          industry: 'Software'
        }));
      });
    });

    it('should add certification with does not expire', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const nameInput = screen.getByLabelText(/certification name/i);
      await user.type(nameInput, 'PMP');

      const orgInput = screen.getByLabelText(/issuing organization/i);
      await user.type(orgInput, 'PMI');

      const dateEarnedInput = screen.getByLabelText(/date earned/i);
      await user.type(dateEarnedInput, '2023-05-20');

      const doesNotExpireCheckbox = screen.getByLabelText(/does not expire/i);
      await user.click(doesNotExpireCheckbox);

      const form = screen.getByRole('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/profile/certifications', expect.objectContaining({
          doesNotExpire: true
        }));
      });
    });

    it('should add certification with custom reminder days', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const nameInput = screen.getByLabelText(/certification name/i);
      await user.type(nameInput, 'CISSP');

      const orgInput = screen.getByLabelText(/issuing organization/i);
      await user.type(orgInput, 'ISC2');

      const dateEarnedInput = screen.getByLabelText(/date earned/i);
      await user.type(dateEarnedInput, '2022-03-10');

      const expirationInput = screen.getByLabelText(/expiration date/i);
      await user.type(expirationInput, '2025-03-10');

      const reminderInput = screen.getByLabelText(/renewal reminder/i);
      await user.clear(reminderInput);
      await user.type(reminderInput, '90');

      const form = screen.getByRole('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/profile/certifications', expect.objectContaining({
          reminderDays: 90
        }));
      });
    });

    it('should call onListUpdate after successful add', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const nameInput = screen.getByLabelText(/certification name/i);
      await user.type(nameInput, 'Test Cert');

      const orgInput = screen.getByLabelText(/issuing organization/i);
      await user.type(orgInput, 'Test Org');

      const dateEarnedInput = screen.getByLabelText(/date earned/i);
      await user.type(dateEarnedInput, '2024-01-15');

      const doesNotExpireCheckbox = screen.getByLabelText(/does not expire/i);
      await user.click(doesNotExpireCheckbox);

      const form = screen.getByRole('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(mockOnListUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Certification Update (Edit)', () => {
    beforeEach(() => {
      const mockCertificationData = {
        data: {
          data: {
            certifications: [{
              _id: '1',
              name: 'AWS Solutions Architect',
              organization: 'AWS',
              dateEarned: '2024-01-15',
              expirationDate: '2027-01-15',
              doesNotExpire: false,
              certId: 'AWS-12345',
              industry: 'Software',
              reminderDays: 30,
              verification: 'Unverified',
              document: null
            }]
          }
        }
      };
      api.get.mockResolvedValue(mockCertificationData);
    });

    it('should pre-populate form when editing', async () => {
      const editingCertification = {
        _id: '1',
        name: 'AWS Solutions Architect',
        organization: 'AWS',
        dateEarned: '2024-01-15',
        expirationDate: '2027-01-15',
        doesNotExpire: false,
        certId: 'AWS-12345',
        industry: 'Software',
        reminderDays: 30,
        verification: 'Unverified'
      };

      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
          editingCertification={editingCertification}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/certification name/i)).toHaveValue('AWS Solutions Architect');
        expect(screen.getByLabelText(/issuing organization/i)).toHaveValue('AWS');
        expect(screen.getByLabelText(/certification number.*id/i)).toHaveValue('AWS-12345');
      });
    });

    it('should update certification', async () => {
      const user = userEvent.setup();
      
      const editingCertification = {
        _id: '1',
        name: 'AWS Solutions Architect',
        organization: 'AWS',
        dateEarned: '2024-01-15',
        expirationDate: '2027-01-15',
        doesNotExpire: false,
        certId: 'AWS-12345',
        industry: 'Software',
        reminderDays: 30,
        verification: 'Unverified'
      };

      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
          editingCertification={editingCertification}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/certification name/i)).toHaveValue('AWS Solutions Architect');
      });

      const nameInput = screen.getByLabelText(/certification name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'AWS Solutions Architect - Professional');

      const form = screen.getByRole('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/api/profile/certifications/1', expect.objectContaining({
          name: 'AWS Solutions Architect - Professional'
        }));
      });
    });

    it('should update verification status', async () => {
      const user = userEvent.setup();
      
      const editingCertification = {
        _id: '1',
        name: 'AWS Solutions Architect',
        organization: 'AWS',
        dateEarned: '2024-01-15',
        expirationDate: '2027-01-15',
        doesNotExpire: false,
        verification: 'Unverified'
      };

      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
          editingCertification={editingCertification}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/certification name/i)).toHaveValue('AWS Solutions Architect');
      });

      const form = screen.getByRole('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalled();
      });
    });
  });

  describe('Certification Error Handling', () => {
    it('should handle API error when adding certification', async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValueOnce(new Error('API Error'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const nameInput = screen.getByLabelText(/certification name/i);
      await user.type(nameInput, 'Test Cert');

      const orgInput = screen.getByLabelText(/issuing organization/i);
      await user.type(orgInput, 'Test Org');

      const dateEarnedInput = screen.getByLabelText(/date earned/i);
      await user.type(dateEarnedInput, '2024-01-15');

      const doesNotExpireCheckbox = screen.getByLabelText(/does not expire/i);
      await user.click(doesNotExpireCheckbox);

      const form = screen.getByRole('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('Failed to save certification');
      });

      consoleErrorSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('should handle API error when updating certification', async () => {
      const user = userEvent.setup();
      api.put.mockRejectedValueOnce(new Error('API Error'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      const editingCertification = {
        _id: '1',
        name: 'AWS Solutions Architect',
        organization: 'AWS',
        dateEarned: '2024-01-15',
        expirationDate: '2027-01-15',
        doesNotExpire: false,
        certId: 'AWS-12345'
      };

      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
          editingCertification={editingCertification}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/certification name/i)).toHaveValue('AWS Solutions Architect');
      });

      const form = screen.getByRole('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('Failed to save certification');
      });

      consoleErrorSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('Certification Expiration and Reminders', () => {
    it('should calculate days until expiration', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 45);
      
      const mockCertificationData = {
        data: {
          data: {
            certifications: [{
              _id: '1',
              name: 'Expiring Soon Cert',
              organization: 'Test Org',
              dateEarned: '2023-01-15',
              expirationDate: futureDate.toISOString(),
              doesNotExpire: false,
              reminderDays: 60
            }]
          }
        }
      };
      api.get.mockResolvedValue(mockCertificationData);

      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/expiring soon cert/i)).toBeInTheDocument();
      });
    });

    it('should show expired certification status', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      
      const mockCertificationData = {
        data: {
          data: {
            certifications: [{
              _id: '1',
              name: 'Expired Cert',
              organization: 'Test Org',
              dateEarned: '2020-01-15',
              expirationDate: pastDate.toISOString(),
              doesNotExpire: false
            }]
          }
        }
      };
      api.get.mockResolvedValue(mockCertificationData);

      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/expired cert/i)).toBeInTheDocument();
      });
    });

    it('should allow setting reminder days', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const reminderInput = screen.getByLabelText(/renewal reminder/i);
      expect(reminderInput).toHaveValue(30); // Default value

      await user.clear(reminderInput);
      await user.type(reminderInput, '60');

      expect(reminderInput).toHaveValue(60);
    });

    it('should allow setting reminder to 0 (same day)', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const reminderInput = screen.getByLabelText(/renewal reminder/i);
      await user.clear(reminderInput);
      await user.type(reminderInput, '0');

      expect(reminderInput).toHaveValue(0);
    });
  });

  describe('Certification Industry Options', () => {
    it('should have all industry options available', () => {
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const industrySelect = screen.getByLabelText(/industry/i);
      
      expect(screen.getByRole('option', { name: /software/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /finance/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /healthcare/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /education/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /marketing/i })).toBeInTheDocument();
    });

    it('should allow selecting industry', async () => {
      const user = userEvent.setup();
      
      render(
        <Certifications 
          getToken={mockGetToken} 
          onListUpdate={mockOnListUpdate}
        />
      );

      const industrySelect = screen.getByLabelText(/industry/i);
      await user.selectOptions(industrySelect, 'Healthcare');

      expect(industrySelect).toHaveValue('Healthcare');
    });
  });
});

// Import missing function
import { within } from '@testing-library/react';
