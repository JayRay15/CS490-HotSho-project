import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '../../../pages/auth/ProfilePage';

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

// Helper function to mock API with proper account-status endpoint
const mockApiGet = (userData) => {
  api.get.mockImplementation((url) => {
    if (url === '/api/profile/account-status') {
      return Promise.resolve({ data: { status: 'active' } });
    }
    return Promise.resolve({ data: { data: userData } });
  });
};

describe.skip('Education CRUD Workflow', () => {
  const mockGetToken = vi.fn().mockResolvedValue('mock-token');
  const mockUserData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    location: 'Test City',
    headline: 'Test Headline',
    bio: 'Test Bio',
    industry: 'Technology',
    experienceLevel: 'Mid',
    education: [],
    employment: [],
    skills: [],
    certifications: [],
    projects: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API to return consistent data and prevent re-render loops
    api.get.mockImplementation((url) => {
      if (url === '/api/profile/account-status') {
        return Promise.resolve({ data: { status: 'active' } });
      }
      return Promise.resolve({ data: { data: mockUserData } });
    });
    
    api.post.mockResolvedValue({ 
      data: { 
        data: { 
          education: [{
            _id: '1',
            institution: 'Test University',
            degree: "Bachelor's",
            fieldOfStudy: 'Computer Science',
            startDate: '2020-09-01',
            endDate: '2024-06-01',
            current: false,
            gpa: 3.5,
            gpaPrivate: false,
            achievements: 'Dean\'s List'
          }]
        } 
      } 
    });
    api.put.mockResolvedValue({ 
      data: { 
        data: { 
          education: [{
            _id: '1',
            institution: 'Updated University',
            degree: "Master's",
            fieldOfStudy: 'Software Engineering',
            startDate: '2024-09-01',
            endDate: null,
            current: true,
            gpa: 3.8,
            gpaPrivate: true,
            achievements: 'Research Assistant'
          }]
        } 
      } 
    });
    api.delete.mockResolvedValue({ data: { data: { education: [] } } });
  });

  describe('Education Modal Rendering', () => {
    it('should open education modal when Add Education button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      // Wait for profile page to fully load
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });
    });

    it('should render all required form fields in education modal', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/institution/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/degree/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/field of study/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/graduation date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/currently enrolled/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/gpa/i)).toBeInTheDocument();
      });
    });

    it('should close education modal when Close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const closeButton = screen.getAllByRole('button', { name: /close/i })[1]; // Get modal close button
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Add Education')).not.toBeInTheDocument();
      });
    });

    it('should close education modal when clicking backdrop', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      // Click on backdrop (the parent div with backdrop styling)
      const backdrop = screen.getByText('Add Education').closest('div').parentElement;
      await user.click(backdrop);

      await waitFor(() => {
        expect(screen.queryByText('Add Education')).not.toBeInTheDocument();
      });
    });
  });

  describe('Education Form Validation', () => {
    it('should show validation error when institution is missing', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/institution is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error when degree is missing', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.type(institutionInput, 'Test University');

      const saveButton = screen.getByRole('button', { name: /save education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/degree is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error when field of study is missing', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.type(institutionInput, 'Test University');

      const degreeSelect = screen.getByLabelText(/degree/i);
      await user.selectOptions(degreeSelect, "Bachelor's");

      const saveButton = screen.getByRole('button', { name: /save education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/field of study is required/i)).toBeInTheDocument();
      });
    });

    it('should validate start date format', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.type(institutionInput, 'Test University');

      const degreeSelect = screen.getByLabelText(/degree/i);
      await user.selectOptions(degreeSelect, "Bachelor's");

      const fieldInput = screen.getByLabelText(/field of study/i);
      await user.type(fieldInput, 'Computer Science');

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '13/2020'); // Invalid month

      const saveButton = screen.getByRole('button', { name: /save education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid.*start date/i)).toBeInTheDocument();
      });
    });

    it('should require graduation date when not currently enrolled', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.type(institutionInput, 'Test University');

      const degreeSelect = screen.getByLabelText(/degree/i);
      await user.selectOptions(degreeSelect, "Bachelor's");

      const fieldInput = screen.getByLabelText(/field of study/i);
      await user.type(fieldInput, 'Computer Science');

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '092020');

      const saveButton = screen.getByRole('button', { name: /save education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/graduation date.*required/i)).toBeInTheDocument();
      });
    });

    it('should validate graduation date is after start date', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.type(institutionInput, 'Test University');

      const degreeSelect = screen.getByLabelText(/degree/i);
      await user.selectOptions(degreeSelect, "Bachelor's");

      const fieldInput = screen.getByLabelText(/field of study/i);
      await user.type(fieldInput, 'Computer Science');

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '092024');

      const endDateInput = screen.getByLabelText(/graduation date/i);
      await user.type(endDateInput, '062020'); // Before start date

      const saveButton = screen.getByRole('button', { name: /save education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/graduation date must be after start date/i)).toBeInTheDocument();
      });
    });

    it('should validate GPA is within valid range', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.type(institutionInput, 'Test University');

      const degreeSelect = screen.getByLabelText(/degree/i);
      await user.selectOptions(degreeSelect, "Bachelor's");

      const fieldInput = screen.getByLabelText(/field of study/i);
      await user.type(fieldInput, 'Computer Science');

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '092020');

      const endDateInput = screen.getByLabelText(/graduation date/i);
      await user.type(endDateInput, '062024');

      const gpaInput = screen.getByLabelText(/gpa/i);
      await user.type(gpaInput, '5.0'); // Invalid GPA > 4.5

      const saveButton = screen.getByRole('button', { name: /save education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/gpa must be.*between 0\.0 and 4\.5/i)).toBeInTheDocument();
      });
    });
  });

  describe('Education Form Input Handling', () => {
    it('should update institution field when user types', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.type(institutionInput, 'Harvard University');

      expect(institutionInput).toHaveValue('Harvard University');
    });

    it('should format date input as MM/YYYY', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '092020');

      expect(startDateInput).toHaveValue('09/2020');
    });

    it('should disable graduation date when currently enrolled is checked', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const currentCheckbox = screen.getByLabelText(/currently enrolled/i);
      const endDateInput = screen.getByLabelText(/graduation date/i);

      expect(endDateInput).not.toBeDisabled();

      await user.click(currentCheckbox);

      expect(endDateInput).toBeDisabled();
    });

    it('should update GPA private checkbox', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const gpaPrivateCheckbox = screen.getByLabelText(/keep gpa private/i);
      
      expect(gpaPrivateCheckbox).toBeChecked(); // Default is checked

      await user.click(gpaPrivateCheckbox);

      expect(gpaPrivateCheckbox).not.toBeChecked();
    });
  });

  describe('Education Create (Add)', () => {
    it('should successfully add new education entry', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      // Fill in required fields
      const institutionInput = screen.getByLabelText(/institution/i);
      await user.type(institutionInput, 'Test University');

      const degreeSelect = screen.getByLabelText(/degree/i);
      await user.selectOptions(degreeSelect, "Bachelor's");

      const fieldInput = screen.getByLabelText(/field of study/i);
      await user.type(fieldInput, 'Computer Science');

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '092020');

      const endDateInput = screen.getByLabelText(/graduation date/i);
      await user.type(endDateInput, '062024');

      const saveButton = screen.getByRole('button', { name: /save education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/profile/education', expect.objectContaining({
          institution: 'Test University',
          degree: "Bachelor's",
          fieldOfStudy: 'Computer Science',
        }));
      });
    });

    it('should add education with GPA', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.type(institutionInput, 'Test University');

      const degreeSelect = screen.getByLabelText(/degree/i);
      await user.selectOptions(degreeSelect, "Bachelor's");

      const fieldInput = screen.getByLabelText(/field of study/i);
      await user.type(fieldInput, 'Computer Science');

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '092020');

      const endDateInput = screen.getByLabelText(/graduation date/i);
      await user.type(endDateInput, '062024');

      const gpaInput = screen.getByLabelText(/gpa/i);
      await user.type(gpaInput, '3.75');

      const saveButton = screen.getByRole('button', { name: /save education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/profile/education', expect.objectContaining({
          gpa: 3.75,
        }));
      });
    });

    it('should add education with achievements', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.type(institutionInput, 'Test University');

      const degreeSelect = screen.getByLabelText(/degree/i);
      await user.selectOptions(degreeSelect, "Bachelor's");

      const fieldInput = screen.getByLabelText(/field of study/i);
      await user.type(fieldInput, 'Computer Science');

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '092020');

      const endDateInput = screen.getByLabelText(/graduation date/i);
      await user.type(endDateInput, '062024');

      const achievementsInput = screen.getByLabelText(/honors.*achievements/i);
      await user.type(achievementsInput, 'Dean\'s List, Summa Cum Laude');

      const saveButton = screen.getByRole('button', { name: /save education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/profile/education', expect.objectContaining({
          achievements: 'Dean\'s List, Summa Cum Laude',
        }));
      });
    });

    it('should add currently enrolled education', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.type(institutionInput, 'Test University');

      const degreeSelect = screen.getByLabelText(/degree/i);
      await user.selectOptions(degreeSelect, "Master's");

      const fieldInput = screen.getByLabelText(/field of study/i);
      await user.type(fieldInput, 'Data Science');

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '092024');

      const currentCheckbox = screen.getByLabelText(/currently enrolled/i);
      await user.click(currentCheckbox);

      const saveButton = screen.getByRole('button', { name: /save education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/profile/education', expect.objectContaining({
          current: true,
          endDate: null,
        }));
      });
    });

    it('should show loading state while saving', async () => {
      const user = userEvent.setup();
      api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.type(institutionInput, 'Test University');

      const degreeSelect = screen.getByLabelText(/degree/i);
      await user.selectOptions(degreeSelect, "Bachelor's");

      const fieldInput = screen.getByLabelText(/field of study/i);
      await user.type(fieldInput, 'Computer Science');

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '092020');

      const endDateInput = screen.getByLabelText(/graduation date/i);
      await user.type(endDateInput, '062024');

      const saveButton = screen.getByRole('button', { name: /save education/i });
      await user.click(saveButton);

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  describe('Education Update (Edit)', () => {
    beforeEach(() => {
      const mockDataWithEducation = {
        ...mockUserData,
        education: [{
          _id: '1',
          institution: 'Test University',
          degree: "Bachelor's",
          fieldOfStudy: 'Computer Science',
          startDate: '2020-09-01',
          endDate: '2024-06-01',
          current: false,
          gpa: 3.5,
          gpaPrivate: false,
          achievements: 'Dean\'s List'
        }]
      };
      mockApiGet(mockDataWithEducation);
    });

    it('should open edit modal with pre-filled data', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test University')).toBeInTheDocument();
      });

      const editButton = screen.getAllByTitle(/edit education/i)[0];
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Education')).toBeInTheDocument();
        expect(screen.getByLabelText(/institution/i)).toHaveValue('Test University');
      });
    });

    it('should update education entry', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test University')).toBeInTheDocument();
      });

      const editButton = screen.getAllByTitle(/edit education/i)[0];
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.clear(institutionInput);
      await user.type(institutionInput, 'Updated University');

      const saveButton = screen.getByRole('button', { name: /update education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/api/profile/education/1', expect.objectContaining({
          institution: 'Updated University',
        }));
      });
    });

    it('should show updating state while saving changes', async () => {
      const user = userEvent.setup();
      api.put.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test University')).toBeInTheDocument();
      });

      const editButton = screen.getAllByTitle(/edit education/i)[0];
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.clear(institutionInput);
      await user.type(institutionInput, 'Updated University');

      const saveButton = screen.getByRole('button', { name: /update education/i });
      await user.click(saveButton);

      expect(screen.getByText(/updating/i)).toBeInTheDocument();
    });
  });

  describe('Education Delete', () => {
    beforeEach(() => {
      const mockDataWithEducation = {
        ...mockUserData,
        education: [
          {
            _id: '1',
            institution: 'Test University',
            degree: "Bachelor's",
            fieldOfStudy: 'Computer Science',
            startDate: '2020-09-01',
            endDate: '2024-06-01',
            current: false,
            gpa: 3.5,
            gpaPrivate: false,
            achievements: 'Dean\'s List'
          },
          {
            _id: '2',
            institution: 'Another University',
            degree: "Master's",
            fieldOfStudy: 'Software Engineering',
            startDate: '2024-09-01',
            endDate: null,
            current: true,
            gpa: 3.8,
            gpaPrivate: true,
            achievements: ''
          }
        ]
      };
      mockApiGet(mockDataWithEducation);
    });

    it('should open delete confirmation modal', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test University')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByTitle(/delete education/i)[0];
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
        expect(screen.getByText(/are you sure.*delete.*education/i)).toBeInTheDocument();
      });
    });

    it('should close delete modal when Cancel is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test University')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByTitle(/delete education/i)[0];
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/confirm deletion/i)).not.toBeInTheDocument();
      });
    });

    it('should delete education entry', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test University')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByTitle(/delete education/i)[0];
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/api/profile/education/1');
      });
    });

    it('should show deleting state during delete operation', async () => {
      const user = userEvent.setup();
      api.delete.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test University')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByTitle(/delete education/i)[0];
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      expect(screen.getByText(/deleting/i)).toBeInTheDocument();
    });

    it('should hide delete button when only one education entry exists', async () => {
      const mockDataWithOneEducation = {
        ...mockUserData,
        education: [{
          _id: '1',
          institution: 'Test University',
          degree: "Bachelor's",
          fieldOfStudy: 'Computer Science',
          startDate: '2020-09-01',
          endDate: '2024-06-01',
          current: false,
        }]
      };
      mockApiGet(mockDataWithOneEducation);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test University')).toBeInTheDocument();
      });

      const deleteButtons = screen.queryAllByTitle(/delete education/i);
      expect(deleteButtons).toHaveLength(0);
    });
  });

  describe('Education Error Handling', () => {
    it('should handle API error when adding education', async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValueOnce(new Error('API Error'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
      });

      const addButton = await screen.findByRole('button', { name: /add education/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.type(institutionInput, 'Test University');

      const degreeSelect = screen.getByLabelText(/degree/i);
      await user.selectOptions(degreeSelect, "Bachelor's");

      const fieldInput = screen.getByLabelText(/field of study/i);
      await user.type(fieldInput, 'Computer Science');

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '092020');

      const endDateInput = screen.getByLabelText(/graduation date/i);
      await user.type(endDateInput, '062024');

      const saveButton = screen.getByRole('button', { name: /save education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle API error when updating education', async () => {
      const user = userEvent.setup();
      const mockDataWithEducation = {
        ...mockUserData,
        education: [{
          _id: '1',
          institution: 'Test University',
          degree: "Bachelor's",
          fieldOfStudy: 'Computer Science',
          startDate: '2020-09-01',
          endDate: '2024-06-01',
          current: false,
        }]
      };
      mockApiGet(mockDataWithEducation);
      api.put.mockRejectedValueOnce(new Error('API Error'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test University')).toBeInTheDocument();
      });

      const editButton = screen.getAllByTitle(/edit education/i)[0];
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Education')).toBeInTheDocument();
      });

      const institutionInput = screen.getByLabelText(/institution/i);
      await user.clear(institutionInput);
      await user.type(institutionInput, 'Updated University');

      const saveButton = screen.getByRole('button', { name: /update education/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle API error when deleting education', async () => {
      const user = userEvent.setup();
      const mockDataWithEducation = {
        ...mockUserData,
        education: [
          {
            _id: '1',
            institution: 'Test University',
            degree: "Bachelor's",
            fieldOfStudy: 'Computer Science',
            startDate: '2020-09-01',
            endDate: '2024-06-01',
            current: false,
          },
          {
            _id: '2',
            institution: 'Another University',
            degree: "Master's",
            fieldOfStudy: 'Software Engineering',
            startDate: '2024-09-01',
            endDate: null,
            current: true,
          }
        ]
      };
      mockApiGet(mockDataWithEducation);
      api.delete.mockRejectedValueOnce(new Error('API Error'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test University')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByTitle(/delete education/i)[0];
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Education Display', () => {
    it('should display education entries in reverse chronological order', async () => {
      const mockDataWithEducation = {
        ...mockUserData,
        education: [
          {
            _id: '1',
            institution: 'Old University',
            degree: "Bachelor's",
            fieldOfStudy: 'Computer Science',
            startDate: '2016-09-01',
            endDate: '2020-06-01',
            current: false,
          },
          {
            _id: '2',
            institution: 'Current University',
            degree: "Master's",
            fieldOfStudy: 'Software Engineering',
            startDate: '2024-09-01',
            endDate: null,
            current: true,
          }
        ]
      };
      mockApiGet(mockDataWithEducation);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        const educationSection = screen.getByText('Education').parentElement;
        const institutions = screen.getAllByText(/university/i);
        
        // Current education should appear first
        expect(institutions[0]).toHaveTextContent('Current University');
      });
    });

    it('should display ongoing badge for current education', async () => {
      const mockDataWithEducation = {
        ...mockUserData,
        education: [{
          _id: '1',
          institution: 'Test University',
          degree: "Master's",
          fieldOfStudy: 'Data Science',
          startDate: '2024-09-01',
          endDate: null,
          current: true,
        }]
      };
      mockApiGet(mockDataWithEducation);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Ongoing')).toBeInTheDocument();
      });
    });

    it('should display completed badge for past education', async () => {
      const mockDataWithEducation = {
        ...mockUserData,
        education: [{
          _id: '1',
          institution: 'Test University',
          degree: "Bachelor's",
          fieldOfStudy: 'Computer Science',
          startDate: '2020-09-01',
          endDate: '2024-06-01',
          current: false,
        }]
      };
      mockApiGet(mockDataWithEducation);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('should display GPA when not private', async () => {
      const mockDataWithEducation = {
        ...mockUserData,
        education: [{
          _id: '1',
          institution: 'Test University',
          degree: "Bachelor's",
          fieldOfStudy: 'Computer Science',
          startDate: '2020-09-01',
          endDate: '2024-06-01',
          current: false,
          gpa: 3.75,
          gpaPrivate: false,
        }]
      };
      mockApiGet(mockDataWithEducation);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText(/GPA: 3\.75/i)).toBeInTheDocument();
      });
    });

    it('should display Private when GPA is private', async () => {
      const mockDataWithEducation = {
        ...mockUserData,
        education: [{
          _id: '1',
          institution: 'Test University',
          degree: "Bachelor's",
          fieldOfStudy: 'Computer Science',
          startDate: '2020-09-01',
          endDate: '2024-06-01',
          current: false,
          gpa: 3.75,
          gpaPrivate: true,
        }]
      };
      mockApiGet(mockDataWithEducation);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText(/GPA: Private/i)).toBeInTheDocument();
      });
    });

    it('should display achievements when present', async () => {
      const mockDataWithEducation = {
        ...mockUserData,
        education: [{
          _id: '1',
          institution: 'Test University',
          degree: "Bachelor's",
          fieldOfStudy: 'Computer Science',
          startDate: '2020-09-01',
          endDate: '2024-06-01',
          current: false,
          achievements: 'Dean\'s List, Summa Cum Laude, Research Award',
        }]
      };
      mockApiGet(mockDataWithEducation);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Dean's List/i)).toBeInTheDocument();
        expect(screen.getByText(/Summa Cum Laude/i)).toBeInTheDocument();
      });
    });
  });
});
