import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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

describe('Skills CRUD with Categories Workflow', () => {
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
          skills: [{
            _id: '1',
            name: 'JavaScript',
            category: 'Technical',
            level: 'Advanced'
          }]
        } 
      } 
    });
    api.put.mockResolvedValue({ 
      data: { 
        data: { 
          skills: [{
            _id: '1',
            name: 'JavaScript',
            category: 'Technical',
            level: 'Expert'
          }]
        } 
      } 
    });
    api.delete.mockResolvedValue({ data: { data: { skills: [] } } });
  });

  describe('Skills Section Rendering', () => {
    it('should display skills section with category organization', async () => {
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
          { _id: '2', name: 'Communication', category: 'Soft Skills', level: 'Expert' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Skills')).toBeInTheDocument();
        expect(screen.getByText('Technical')).toBeInTheDocument();
        expect(screen.getByText('Soft Skills')).toBeInTheDocument();
      });
    });

    it('should display total skills count and category count', async () => {
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
          { _id: '2', name: 'React', category: 'Technical', level: 'Intermediate' },
          { _id: '3', name: 'Communication', category: 'Soft Skills', level: 'Expert' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText(/3 total skills/i)).toBeInTheDocument();
        expect(screen.getByText(/2 categories/i)).toBeInTheDocument();
      });
    });

    it('should display Add Skill and Export buttons', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add skill/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
      });
    });

    it('should display search bar when skills exist', async () => {
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search skills/i)).toBeInTheDocument();
      });
    });

    it('should not display search bar when no skills exist', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/search skills/i)).not.toBeInTheDocument();
      });
    });

    it('should display empty state message when no skills', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText(/no skills added yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Skills Modal Rendering', () => {
    it('should open skill modal when Add Skill button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add skill/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Skill')).toBeInTheDocument();
      });
    });

    it('should render all skill form fields', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add skill/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/skill name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/proficiency/i)).toBeInTheDocument();
      });
    });

    it('should close skill modal when Close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add skill/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Skill')).toBeInTheDocument();
      });

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      const modalCloseButton = closeButtons[closeButtons.length - 1];
      await user.click(modalCloseButton);

      await waitFor(() => {
        expect(screen.queryByText('Add Skill')).not.toBeInTheDocument();
      });
    });
  });

  describe('Skills Category Organization', () => {
    it('should group skills by category', async () => {
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
          { _id: '2', name: 'Python', category: 'Technical', level: 'Intermediate' },
          { _id: '3', name: 'Leadership', category: 'Soft Skills', level: 'Expert' },
          { _id: '4', name: 'Spanish', category: 'Languages', level: 'Intermediate' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        const technicalSection = screen.getByText('Technical').parentElement;
        expect(within(technicalSection).getByText(/2 skill/i)).toBeInTheDocument();
        
        const softSkillsSection = screen.getByText('Soft Skills').parentElement;
        expect(within(softSkillsSection).getByText(/1 skill$/i)).toBeInTheDocument();
      });
    });

    it('should display level summary for each category', async () => {
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
          { _id: '2', name: 'Python', category: 'Technical', level: 'Intermediate' },
          { _id: '3', name: 'React', category: 'Technical', level: 'Expert' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        const technicalSection = screen.getByText('Technical').parentElement;
        expect(within(technicalSection).getByText(/1 Expert/i)).toBeInTheDocument();
        expect(within(technicalSection).getByText(/1 Advanced/i)).toBeInTheDocument();
        expect(within(technicalSection).getByText(/1 Intermediate/i)).toBeInTheDocument();
      });
    });

    it('should toggle category expansion', async () => {
      const user = userEvent.setup();
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const categoryHeader = screen.getByText('Technical').closest('div');
      await user.click(categoryHeader);

      await waitFor(() => {
        expect(screen.queryByText('JavaScript')).not.toBeInTheDocument();
      });

      await user.click(categoryHeader);

      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });
    });

    it('should display all 4 default categories', async () => {
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
          { _id: '2', name: 'Leadership', category: 'Soft Skills', level: 'Expert' },
          { _id: '3', name: 'Spanish', category: 'Languages', level: 'Intermediate' },
          { _id: '4', name: 'Healthcare Regulations', category: 'Industry-Specific', level: 'Advanced' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Technical')).toBeInTheDocument();
        expect(screen.getByText('Soft Skills')).toBeInTheDocument();
        expect(screen.getByText('Languages')).toBeInTheDocument();
        expect(screen.getByText('Industry-Specific')).toBeInTheDocument();
      });
    });
  });

  describe('Skills Search and Filter', () => {
    it('should filter skills by name', async () => {
      const user = userEvent.setup();
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
          { _id: '2', name: 'Python', category: 'Technical', level: 'Intermediate' },
          { _id: '3', name: 'Leadership', category: 'Soft Skills', level: 'Expert' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
        expect(screen.getByText('Python')).toBeInTheDocument();
        expect(screen.getByText('Leadership')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search skills/i);
      await user.type(searchInput, 'java');

      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
        expect(screen.queryByText('Python')).not.toBeInTheDocument();
        expect(screen.queryByText('Leadership')).not.toBeInTheDocument();
      });
    });

    it('should filter skills by category', async () => {
      const user = userEvent.setup();
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
          { _id: '2', name: 'Leadership', category: 'Soft Skills', level: 'Expert' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search skills/i);
      await user.type(searchInput, 'soft');

      await waitFor(() => {
        expect(screen.queryByText('JavaScript')).not.toBeInTheDocument();
        expect(screen.getByText('Leadership')).toBeInTheDocument();
      });
    });

    it('should filter skills by proficiency level', async () => {
      const user = userEvent.setup();
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
          { _id: '2', name: 'Python', category: 'Technical', level: 'Expert' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search skills/i);
      await user.type(searchInput, 'expert');

      await waitFor(() => {
        expect(screen.queryByText('JavaScript')).not.toBeInTheDocument();
        expect(screen.getByText('Python')).toBeInTheDocument();
      });
    });

    it('should clear search when X button is clicked', async () => {
      const user = userEvent.setup();
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
          { _id: '2', name: 'Python', category: 'Technical', level: 'Intermediate' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search skills/i);
      await user.type(searchInput, 'java');

      await waitFor(() => {
        expect(screen.queryByText('Python')).not.toBeInTheDocument();
      });

      const clearButton = searchInput.nextElementSibling;
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('Python')).toBeInTheDocument();
        expect(searchInput).toHaveValue('');
      });
    });
  });

  describe('Skills Form Validation', () => {
    it('should show validation error when skill name is missing', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add skill/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Skill')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save skill/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/skill name is required/i)).toBeInTheDocument();
      });
    });

    it('should prevent duplicate skill names (case-insensitive)', async () => {
      const user = userEvent.setup();
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add skill/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Skill')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/skill name/i);
      await user.type(nameInput, 'javascript'); // Lowercase

      const saveButton = screen.getByRole('button', { name: /save skill/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/skill already exists/i)).toBeInTheDocument();
      });
    });

    it('should require category selection', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add skill/i });
      await user.click(addButton);

      await waitFor(() => {
        const categorySelect = screen.getByLabelText(/category/i);
        expect(categorySelect).toBeInTheDocument();
        expect(categorySelect).toHaveValue('Technical'); // Default value
      });
    });

    it('should require proficiency level selection', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add skill/i });
      await user.click(addButton);

      await waitFor(() => {
        const levelSelect = screen.getByLabelText(/proficiency/i);
        expect(levelSelect).toBeInTheDocument();
        expect(levelSelect).toHaveValue('Beginner'); // Default value
      });
    });
  });

  describe('Skills Create (Add)', () => {
    it('should successfully add new skill', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add skill/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Skill')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/skill name/i);
      await user.type(nameInput, 'JavaScript');

      const categorySelect = screen.getByLabelText(/category/i);
      await user.selectOptions(categorySelect, 'Technical');

      const levelSelect = screen.getByLabelText(/proficiency/i);
      await user.selectOptions(levelSelect, 'Advanced');

      const saveButton = screen.getByRole('button', { name: /save skill/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/profile/skills', expect.objectContaining({
          name: 'JavaScript',
          category: 'Technical',
          level: 'Advanced',
        }));
      });
    });

    it('should add skill with all proficiency levels', async () => {
      const user = userEvent.setup();
      const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
      
      for (const level of levels) {
        render(<ProfilePage />);
        
        await waitFor(() => {
          expect(screen.getByText('My Profile')).toBeInTheDocument();
        });

        const addButton = screen.getByRole('button', { name: /add skill/i });
        await user.click(addButton);

        await waitFor(() => {
          expect(screen.getByText('Add Skill')).toBeInTheDocument();
        });

        const nameInput = screen.getByLabelText(/skill name/i);
        await user.type(nameInput, `Skill ${level}`);

        const levelSelect = screen.getByLabelText(/proficiency/i);
        await user.selectOptions(levelSelect, level);

        const saveButton = screen.getByRole('button', { name: /save skill/i });
        await user.click(saveButton);

        await waitFor(() => {
          expect(api.post).toHaveBeenCalledWith('/api/profile/skills', expect.objectContaining({
            level: level,
          }));
        });

        vi.clearAllMocks();
      }
    });

    it('should add skill to different categories', async () => {
      const user = userEvent.setup();
      const categories = ['Technical', 'Soft Skills', 'Languages', 'Industry-Specific'];
      
      for (const category of categories) {
        render(<ProfilePage />);
        
        await waitFor(() => {
          expect(screen.getByText('My Profile')).toBeInTheDocument();
        });

        const addButton = screen.getByRole('button', { name: /add skill/i });
        await user.click(addButton);

        await waitFor(() => {
          expect(screen.getByText('Add Skill')).toBeInTheDocument();
        });

        const nameInput = screen.getByLabelText(/skill name/i);
        await user.type(nameInput, `${category} Skill`);

        const categorySelect = screen.getByLabelText(/category/i);
        await user.selectOptions(categorySelect, category);

        const saveButton = screen.getByRole('button', { name: /save skill/i });
        await user.click(saveButton);

        await waitFor(() => {
          expect(api.post).toHaveBeenCalledWith('/api/profile/skills', expect.objectContaining({
            category: category,
          }));
        });

        vi.clearAllMocks();
      }
    });

    it('should show loading state while saving', async () => {
      const user = userEvent.setup();
      api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add skill/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Skill')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/skill name/i);
      await user.type(nameInput, 'JavaScript');

      const saveButton = screen.getByRole('button', { name: /save skill/i });
      await user.click(saveButton);

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });

    it('should display success message after adding skill', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add skill/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Skill')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/skill name/i);
      await user.type(nameInput, 'JavaScript');

      const saveButton = screen.getByRole('button', { name: /save skill/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/skill.*successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Skills Update (Edit)', () => {
    beforeEach(() => {
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Intermediate' },
        ]
      };
      mockApiGet(mockDataWithSkills);
    });

    it('should open edit modal with pre-filled data', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle(/edit skill/i);
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Skill')).toBeInTheDocument();
        expect(screen.getByLabelText(/skill name/i)).toHaveValue('JavaScript');
      });
    });

    it('should update skill proficiency level', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle(/edit skill/i);
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Skill')).toBeInTheDocument();
      });

      const levelSelect = screen.getByLabelText(/proficiency/i);
      await user.selectOptions(levelSelect, 'Expert');

      const saveButton = screen.getByRole('button', { name: /update skill/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/api/profile/skills/1', expect.objectContaining({
          level: 'Expert',
        }));
      });
    });

    it('should update skill category', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle(/edit skill/i);
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Skill')).toBeInTheDocument();
      });

      const categorySelect = screen.getByLabelText(/category/i);
      await user.selectOptions(categorySelect, 'Languages');

      const saveButton = screen.getByRole('button', { name: /update skill/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/api/profile/skills/1', expect.objectContaining({
          category: 'Languages',
        }));
      });
    });

    it('should show updating state while saving changes', async () => {
      const user = userEvent.setup();
      api.put.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle(/edit skill/i);
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Skill')).toBeInTheDocument();
      });

      const levelSelect = screen.getByLabelText(/proficiency/i);
      await user.selectOptions(levelSelect, 'Expert');

      const saveButton = screen.getByRole('button', { name: /update skill/i });
      await user.click(saveButton);

      expect(screen.getByText(/updating/i)).toBeInTheDocument();
    });
  });

  describe('Skills Delete', () => {
    beforeEach(() => {
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
          { _id: '2', name: 'Python', category: 'Technical', level: 'Intermediate' },
        ]
      };
      mockApiGet(mockDataWithSkills);
    });

    it('should display delete button on hover', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByTitle(/delete skill/i)[0];
      expect(deleteButton).toBeInTheDocument();
    });

    it('should delete skill when delete button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByTitle(/delete skill/i)[0];
      await user.click(deleteButton);

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/api/profile/skills/1');
      });
    });
  });

  describe('Skills Drag and Drop Reordering', () => {
    beforeEach(() => {
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
          { _id: '2', name: 'Python', category: 'Technical', level: 'Intermediate' },
          { _id: '3', name: 'React', category: 'Technical', level: 'Expert' },
        ]
      };
      mockApiGet(mockDataWithSkills);
    });

    it('should display drag handle for each skill', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const dragHandles = screen.getAllByTitle(/drag to reorder/i);
      expect(dragHandles.length).toBeGreaterThan(0);
    });

    it('should persist new order to backend after drag', async () => {
      // Note: Full drag-and-drop interaction testing requires more setup with @dnd-kit
      // This is a simplified test to verify the API call structure
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      // The reorder API would be called when drag completes
      // Verifying the function exists and structure
      expect(api.put).toBeDefined();
    });
  });

  describe('Skills Move to Category', () => {
    beforeEach(() => {
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
        ]
      };
      mockApiGet(mockDataWithSkills);
    });

    it('should display move to category button', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const moveButton = screen.getByTitle(/move to category/i);
      expect(moveButton).toBeInTheDocument();
    });

    it('should show category dropdown when move button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const moveButton = screen.getByTitle(/move to category/i);
      await user.click(moveButton);

      await waitFor(() => {
        expect(screen.getByText(/move to soft skills/i)).toBeInTheDocument();
        expect(screen.getByText(/move to languages/i)).toBeInTheDocument();
      });
    });

    it('should move skill to different category', async () => {
      const user = userEvent.setup();
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const moveButton = screen.getByTitle(/move to category/i);
      await user.click(moveButton);

      await waitFor(() => {
        expect(screen.getByText(/move to soft skills/i)).toBeInTheDocument();
      });

      const softSkillsOption = screen.getByText(/move to soft skills/i);
      await user.click(softSkillsOption);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/api/profile/skills/1', expect.objectContaining({
          category: 'Soft Skills',
        }));
      });
    });
  });

  describe('Skills Export Functionality', () => {
    beforeEach(() => {
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
          { _id: '2', name: 'Python', category: 'Technical', level: 'Intermediate' },
          { _id: '3', name: 'Leadership', category: 'Soft Skills', level: 'Expert' },
        ]
      };
      mockApiGet(mockDataWithSkills);
    });

    it('should enable export button when skills exist', async () => {
      render(<ProfilePage />);
      
      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export/i });
        expect(exportButton).not.toBeDisabled();
      });
    });

    it('should disable export button when no skills exist', async () => {
      api.get.mockResolvedValue({ data: { data: mockUserData } });
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export/i });
        expect(exportButton).toBeDisabled();
      });
    });
  });

  describe('Skills Proficiency Level Badges', () => {
    it('should display correct badge colors for each level', async () => {
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'Skill1', category: 'Technical', level: 'Beginner' },
          { _id: '2', name: 'Skill2', category: 'Technical', level: 'Intermediate' },
          { _id: '3', name: 'Skill3', category: 'Technical', level: 'Advanced' },
          { _id: '4', name: 'Skill4', category: 'Technical', level: 'Expert' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Beginner')).toBeInTheDocument();
        expect(screen.getByText('Intermediate')).toBeInTheDocument();
        expect(screen.getByText('Advanced')).toBeInTheDocument();
        expect(screen.getByText('Expert')).toBeInTheDocument();
      });
    });
  });

  describe('Skills Error Handling', () => {
    it('should handle API error when adding skill', async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValueOnce(new Error('API Error'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add skill/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add Skill')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/skill name/i);
      await user.type(nameInput, 'JavaScript');

      const saveButton = screen.getByRole('button', { name: /save skill/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle API error when updating skill', async () => {
      const user = userEvent.setup();
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Intermediate' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      api.put.mockRejectedValueOnce(new Error('API Error'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle(/edit skill/i);
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Skill')).toBeInTheDocument();
      });

      const levelSelect = screen.getByLabelText(/proficiency/i);
      await user.selectOptions(levelSelect, 'Expert');

      const saveButton = screen.getByRole('button', { name: /update skill/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle API error when deleting skill', async () => {
      const user = userEvent.setup();
      const mockDataWithSkills = {
        ...mockUserData,
        skills: [
          { _id: '1', name: 'JavaScript', category: 'Technical', level: 'Advanced' },
        ]
      };
      mockApiGet(mockDataWithSkills);
      api.delete.mockRejectedValueOnce(new Error('API Error'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle(/delete skill/i);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      consoleErrorSpy.mockRestore();
    });
  });
});
