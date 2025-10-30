import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectModal from '../../../pages/auth/Projects';

// Mock API
vi.mock('../../../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
  setAuthToken: vi.fn(),
}));

// Import mocked API after mock is set up
import api from '../../../api/axios';

describe('Projects Modal', () => {
  const mockGetToken = vi.fn().mockResolvedValue('mock-token');
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { data: { projects: [] } } });
    api.post.mockResolvedValue({ data: { success: true } });
    api.put.mockResolvedValue({ data: { success: true } });
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <ProjectModal 
          isOpen={false} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      expect(screen.queryByText('Add Project')).not.toBeInTheDocument();
    });

    it('should render Add Project modal when isOpen is true', () => {
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      expect(screen.getByText('Add Project')).toBeInTheDocument();
    });

    it('should render Edit Project modal when editing', () => {
      const editingProject = {
        _id: '123',
        name: 'Test Project',
        description: 'Test Description',
        role: 'Developer',
      };

      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken}
          editingProject={editingProject}
        />
      );
      
      expect(screen.getByText('Edit Project')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/technologies/i)).toBeInTheDocument();
    });

    it('should show Close and Save Project buttons', () => {
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save project/i })).toBeInTheDocument();
    });
  });

  describe('Form Initialization', () => {
    it('should initialize with empty form in add mode', () => {
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const nameInput = screen.getByLabelText(/project name/i);
      expect(nameInput).toHaveValue('');
    });

    it('should populate form with existing data in edit mode', () => {
      const editingProject = {
        _id: '123',
        name: 'Existing Project',
        description: 'Existing Description',
        role: 'Lead Developer',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        technologies: ['React', 'Node.js'],
        projectUrl: 'https://example.com',
        teamSize: 5,
        collaboration: 'Agile team',
        outcomes: 'Successful launch',
        industry: 'Software',
        status: 'Completed',
      };

      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken}
          editingProject={editingProject}
        />
      );
      
      expect(screen.getByLabelText(/project name/i)).toHaveValue('Existing Project');
      expect(screen.getByLabelText(/role/i)).toHaveValue('Lead Developer');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Existing Description');
    });
  });

  describe('Form Interaction', () => {
    it('should update form fields when user types', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const nameInput = screen.getByLabelText(/project name/i);
      await user.type(nameInput, 'New Project');
      
      expect(nameInput).toHaveValue('New Project');
    });

    it('should update role field', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const roleInput = screen.getByLabelText(/role/i);
      await user.type(roleInput, 'Full Stack Developer');
      
      expect(roleInput).toHaveValue('Full Stack Developer');
    });

    it('should update description field', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, 'A great project');
      
      expect(descInput).toHaveValue('A great project');
    });

    it('should update status dropdown', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, 'Ongoing');
      
      expect(statusSelect).toHaveValue('Ongoing');
    });

    it('should update industry dropdown', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const industrySelect = screen.getByLabelText(/industry/i);
      await user.selectOptions(industrySelect, 'Healthcare');
      
      expect(industrySelect).toHaveValue('Healthcare');
    });
  });

  describe('Form Validation', () => {
    it('should show error when project name is missing', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const saveButton = screen.getByRole('button', { name: /save project/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when description is missing', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const nameInput = screen.getByLabelText(/project name/i);
      await user.type(nameInput, 'Test Project');
      
      const saveButton = screen.getByRole('button', { name: /save project/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when role is missing', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const nameInput = screen.getByLabelText(/project name/i);
      await user.type(nameInput, 'Test Project');
      
      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, 'Test Description');
      
      const saveButton = screen.getByRole('button', { name: /save project/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/role is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call API to create new project', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      // Fill required fields
      await user.type(screen.getByLabelText(/project name/i), 'New Project');
      await user.type(screen.getByLabelText(/description/i), 'Project Description');
      await user.type(screen.getByLabelText(/role/i), 'Developer');
      
      // Set start date
      const startDate = screen.getByLabelText(/start date/i);
      await user.type(startDate, '2024-01-01');
      
      const saveButton = screen.getByRole('button', { name: /save project/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/profile/projects', expect.objectContaining({
          name: 'New Project',
          description: 'Project Description',
          role: 'Developer',
        }));
      });
    });

    it('should call API to update existing project', async () => {
      const user = userEvent.setup();
      const editingProject = {
        _id: '123',
        name: 'Old Name',
        description: 'Old Description',
        role: 'Developer',
        startDate: '2024-01-01',
      };

      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken}
          editingProject={editingProject}
        />
      );
      
      // Update name
      const nameInput = screen.getByLabelText(/project name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      
      const saveButton = screen.getByRole('button', { name: /update project/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/api/profile/projects/123', expect.objectContaining({
          name: 'Updated Name',
        }));
      });
    });

    it('should call onSuccess after successful save', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      await user.type(screen.getByLabelText(/project name/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Test Desc');
      await user.type(screen.getByLabelText(/role/i), 'Dev');
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      
      const saveButton = screen.getByRole('button', { name: /save project/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      await user.type(screen.getByLabelText(/project name/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Test');
      await user.type(screen.getByLabelText(/role/i), 'Dev');
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      
      const saveButton = screen.getByRole('button', { name: /save project/i });
      await user.click(saveButton);
      
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  describe('Modal Controls', () => {
    it('should close modal when Close button clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when X button clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const xButton = screen.getByRole('button', { name: '' }); // X button with SVG
      await user.click(xButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when clicking backdrop', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const backdrop = container.firstChild;
      await user.click(backdrop);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should NOT close when clicking modal content', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const modalContent = screen.getByText('Add Project').closest('div');
      await user.click(modalContent);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValueOnce(new Error('API Error'));
      
      // Spy on console.error and alert
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      await user.type(screen.getByLabelText(/project name/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Test');
      await user.type(screen.getByLabelText(/role/i), 'Dev');
      await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
      
      const saveButton = screen.getByRole('button', { name: /save project/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to save project/i)).toBeInTheDocument();
      });
      
      consoleErrorSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('Additional Fields', () => {
    it('should handle team size input', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const teamSizeInput = screen.getByLabelText(/team size/i);
      await user.clear(teamSizeInput);
      await user.type(teamSizeInput, '10');
      
      expect(teamSizeInput).toHaveValue(10);
    });

    it('should handle technologies input', async () => {
      const user = userEvent.setup();
      
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      const techInput = screen.getByLabelText(/technologies/i);
      await user.type(techInput, 'React, Node.js, MongoDB');
      
      expect(techInput).toHaveValue('React, Node.js, MongoDB');
    });

    it('should show technology suggestions', () => {
      render(
        <ProjectModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          getToken={mockGetToken} 
        />
      );
      
      expect(screen.getByText(/react, node\.js, python/i)).toBeInTheDocument();
    });
  });
});
