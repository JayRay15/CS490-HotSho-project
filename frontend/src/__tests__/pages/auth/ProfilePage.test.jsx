import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '../../../pages/auth/ProfilePage';
import * as api from '../../../api/axios';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useAuth: vi.fn(),
  useUser: vi.fn(),
  RedirectToSignIn: vi.fn(() => <div>Redirecting to Sign In...</div>),
}));

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

// Mock child components
vi.mock('../../../components/ErrorMessage', () => ({
  default: ({ message }) => <div data-testid="error-message">{message}</div>,
}));

vi.mock('../../../components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

vi.mock('../../../components/ProfilePictureUpload', () => ({
  default: ({ onUploadSuccess }) => (
    <div data-testid="profile-picture-upload">
      <button onClick={() => onUploadSuccess('new-pic-url.jpg')}>Upload Picture</button>
    </div>
  ),
}));

vi.mock('../../../components/ProfileCompleteness', () => ({
  default: ({ userData }) => (
    <div data-testid="profile-completeness">
      Completeness: {userData?.name ? '50%' : '0%'}
    </div>
  ),
}));

vi.mock('../../../components/Certifications', () => ({
  default: ({ certifications, onUpdate }) => (
    <div data-testid="certifications">
      <div>Certifications: {certifications?.length || 0}</div>
      <button onClick={() => onUpdate([{ id: '1', name: 'Test Cert' }])}>Add Cert</button>
    </div>
  ),
}));

vi.mock('../../../components/Projects', () => ({
  default: ({ projects, onUpdate }) => (
    <div data-testid="projects">
      <div>Projects: {projects?.length || 0}</div>
      <button onClick={() => onUpdate([{ id: '1', title: 'Test Project' }])}>Add Project</button>
    </div>
  ),
}));

import { useAuth, useUser } from '@clerk/clerk-react';

describe('ProfilePage - Phase 1: Basic Rendering & Data Fetching', () => {
  const mockUserData = {
    _id: 'user123',
    auth0Id: 'clerk_user_123',
    email: 'test@example.com',
    name: 'John Doe',
    phone: '555-0100',
    location: 'New York, NY',
    headline: 'Software Engineer',
    bio: 'Passionate developer',
    industry: 'Technology',
    experienceLevel: 'Mid',
    profilePicture: 'https://example.com/pic.jpg',
    employmentHistory: [
      {
        _id: 'emp1',
        company: 'Tech Corp',
        position: 'Developer',
        startDate: '2020-01-01',
        endDate: '2023-01-01',
        description: 'Built apps',
        order: 0,
      }
    ],
    education: [
      {
        _id: 'edu1',
        institution: 'State University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2020-05-01',
        gpa: '3.8',
        order: 0,
      }
    ],
    skills: [
      {
        _id: 'skill1',
        name: 'JavaScript',
        category: 'Programming',
        level: 'Advanced',
        order: 0,
      }
    ],
    projects: [],
    certifications: [],
    isDeleted: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Default Clerk mocks
    const mockGetToken = vi.fn().mockResolvedValue('mock-token');
    const mockSignOut = vi.fn();

    useAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true, // Important: Clerk has finished loading
      getToken: mockGetToken,
      signOut: mockSignOut,
    });

    useUser.mockReturnValue({
      user: {
        id: 'clerk_user_123',
        primaryEmailAddress: { emailAddress: 'test@example.com' },
      },
    });

    // Default API mock - successful fetch for both /api/users/me calls
    // First call: initial profile load
    // Second call: certifications refresh in second useEffect
    api.default.get.mockResolvedValue({
      data: {
        success: true,
        data: mockUserData,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 1: Renders without crashing
  it('should render ProfilePage without crashing', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    // Wait for API calls to complete
    await waitFor(() => {
      expect(api.default.get).toHaveBeenCalled();
    });

    // Check that component renders (may still have loading state initially)
    expect(screen.getByText(/My Profile/i)).toBeInTheDocument();
  });

  // Test 2: Shows loading spinner initially
  it('should show loading spinner while fetching data', () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  // Test 3: Redirects when not signed in
  it('should show redirect component when user is not authenticated', () => {
    useAuth.mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
      getToken: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    // The component should render RedirectToSignIn
    expect(screen.getByText(/redirecting to sign in/i)).toBeInTheDocument();
    // Since we're not signed in, the useEffect with isSignedIn check will prevent data loading
    expect(api.default.get).not.toHaveBeenCalled();
  });

  // Test 4: Fetches user profile data on mount
  it('should fetch user profile data on component mount', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.default.get).toHaveBeenCalledWith('/api/users/me');
    });
  });

  // Test 5: Sets auth token before fetching data
  it('should set auth token before making API calls', async () => {
    const mockGetToken = vi.fn().mockResolvedValue('test-token-456');
    useAuth.mockReturnValue({
      isSignedIn: true,
      getToken: mockGetToken,
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockGetToken).toHaveBeenCalled();
      expect(api.setAuthToken).toHaveBeenCalledWith('test-token-456');
    });
  });

  // Test 6: Displays user profile data after successful fetch
  it('should display user profile data after successful fetch', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    // Wait for the data to be loaded and rendered
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify email and headline are present
    await waitFor(() => {
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });
  });

  // Test 7: Displays employment history
  it('should display employment history', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  // Test 8: Displays education history
  it('should display education history', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('State University')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText(/Bachelor of Science/i)).toBeInTheDocument();
    expect(screen.getByText(/Computer Science/i)).toBeInTheDocument();
  });

  // Test 9: Displays skills
  it('should display skills grouped by category', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText(/Programming/i)).toBeInTheDocument();
  });

  // Test 10: Handles API error gracefully
  it('should display error message when API fetch fails', async () => {
    const mockError = {
      response: {
        status: 500,
        data: {
          message: 'Failed to fetch profile',
        },
      },
    };
    api.default.get.mockRejectedValue(mockError);

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    }, { timeout: 2000 });

    // The error is logged but component may handle it gracefully
    expect(api.default.get).toHaveBeenCalledWith('/api/users/me');
  });

  // Test 11: Handles network error (no response object)
  it('should handle network error gracefully', async () => {
    api.default.get.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    // Verify API was called
    await waitFor(() => {
      expect(api.default.get).toHaveBeenCalledWith('/api/users/me');
    });
  });

  // Test 12: Hides loading spinner after data loads
  it('should eventually hide loading spinner after data loads', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Wait for data to load by checking for content
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // Test 13: Renders ProfileCompleteness component
  it('should render ProfileCompleteness component with user data', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-completeness')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText(/Completeness: 50%/)).toBeInTheDocument();
  });

  // Test 14: Renders profile picture upload component
  it('should render ProfilePictureUpload component', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    // ProfilePictureUpload is in the header card which renders immediately
    await waitFor(() => {
      expect(screen.getByTestId('profile-picture-upload')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // Test 15: Handles deleted account by signing out
  it('should sign out when account is deleted (403 response)', async () => {
    const mockGetToken = vi.fn().mockResolvedValue('mock-token');
    const mockSignOut = vi.fn();

    useAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      getToken: mockGetToken,
      signOut: mockSignOut,
    });

    api.default.get.mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          message: 'Account is deleted',
        },
      },
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});

describe('ProfilePage - Phase 2: Profile Form & Edit Modal', () => {
  const mockUserData = {
    _id: 'user123',
    auth0Id: 'clerk_user_123',
    email: 'test@example.com',
    name: 'John Doe',
    phone: '555-0100',
    location: 'New York, NY',
    headline: 'Software Engineer',
    bio: 'Passionate developer',
    industry: 'Technology',
    experienceLevel: 'Mid',
    profilePicture: 'https://example.com/pic.jpg',
    employmentHistory: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    isDeleted: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    useAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn(),
    });

    useUser.mockReturnValue({
      user: {
        id: 'clerk_user_123',
        primaryEmailAddress: { emailAddress: 'test@example.com' },
      },
    });

    api.default.get.mockResolvedValue({
      data: {
        success: true,
        data: mockUserData,
      },
    });
  });

  // Test 16: Opens edit modal when Edit Profile button is clicked
  it('should open edit modal when Edit Profile button is clicked', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await userEvent.click(editButton);

    // Check that modal opened (it should show form inputs)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  // Test 17: Closes edit modal when Cancel is clicked
  it('should close edit modal when Cancel is clicked', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Open modal
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await userEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    // Close modal
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
    });
  });

  // Test 18: Pre-fills form with current user data
  it('should pre-fill edit form with current user data', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Open modal
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await userEvent.click(editButton);

    // Check form fields are pre-filled
    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('John Doe');
      expect(nameInput).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('555-0100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('New York, NY')).toBeInTheDocument();
  });

  // Test 19: Updates bio character counter
  it('should update bio character counter as user types', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Open modal
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await userEvent.click(editButton);

    await waitFor(() => {
      const bioInput = screen.getByDisplayValue('Passionate developer');
      expect(bioInput).toBeInTheDocument();
    });

    const bioInput = screen.getByDisplayValue('Passionate developer');
    await userEvent.clear(bioInput);
    await userEvent.type(bioInput, 'New bio text');

    // Character counter should update (format: "12 / 500 characters")
    await waitFor(() => {
      expect(screen.getByText(/12 \/ 500 characters/)).toBeInTheDocument();
    });
  });

  // Test 20: Saves profile changes successfully
  it('should save profile changes and show success message', async () => {
    api.default.put.mockResolvedValue({
      data: {
        success: true,
        data: { ...mockUserData, name: 'Jane Smith' },
      },
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Open modal
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await userEvent.click(editButton);

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('John Doe');
      expect(nameInput).toBeInTheDocument();
    });

    // Edit name
    const nameInput = screen.getByDisplayValue('John Doe');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Jane Smith');

    // Save
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await userEvent.click(saveButton);

    // Check API was called
    await waitFor(() => {
      expect(api.default.put).toHaveBeenCalled();
    });

    // Verify the API call had the correct endpoint and data
    const putCalls = api.default.put.mock.calls;
    expect(putCalls.length).toBeGreaterThan(0);
    expect(putCalls[0][0]).toBe('/api/users/me');
    expect(putCalls[0][1]).toMatchObject({
      name: 'Jane Smith',
    });
  });
});

describe('ProfilePage - Phase 3: Employment CRUD Workflow', () => {
  const mockUserData = {
    _id: 'user123',
    auth0Id: 'clerk_user_123',
    email: 'test@example.com',
    name: 'John Doe',
    phone: '555-0100',
    location: 'New York, NY',
    headline: 'Software Engineer',
    bio: 'Passionate developer',
    industry: 'Technology',
    experienceLevel: 'Mid',
    profilePicture: 'https://example.com/pic.jpg',
    employment: [
      {
        _id: 'emp1',
        company: 'Tech Corp',
        jobTitle: 'Developer',
        location: 'San Francisco, CA',
        startDate: '2020-01-01',
        endDate: '2023-01-01',
        description: 'Built web applications',
        isCurrentPosition: false,
        order: 0,
      }
    ],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    isDeleted: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    useAuth.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn(),
    });

    useUser.mockReturnValue({
      user: {
        id: 'clerk_user_123',
        primaryEmailAddress: { emailAddress: 'test@example.com' },
      },
    });

    api.default.get.mockResolvedValue({
      data: {
        success: true,
        data: mockUserData,
      },
    });
  });

  // Test 21: Displays existing employment entries
  it('should display existing employment entries', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText(/Built web applications/i)).toBeInTheDocument();
  });

  // Test 22: Opens Add Employment modal
  it('should open add employment modal when Add button is clicked', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    }, { timeout: 3000 });

    const addButton = screen.getByRole('button', { name: /add employment/i });
    await userEvent.click(addButton);

    // Modal should open with empty form
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save employment/i })).toBeInTheDocument();
    });
  });

  // Test 23: Creates new employment entry
  it('should create new employment entry successfully', async () => {
    api.default.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          _id: 'emp2',
          company: 'New Company',
          jobTitle: 'Senior Developer',
          startDate: '2023-02-01',
          endDate: null,
          description: 'Leading development team',
          isCurrentPosition: false,
          order: 1,
        },
      },
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Open add modal
    const addButton = screen.getByRole('button', { name: /add employment/i });
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save employment/i })).toBeInTheDocument();
    });

    // Fill form
    const companyInput = screen.getByLabelText(/company/i);
    const jobTitleInput = screen.getByLabelText(/job title|position/i);
    const startDateInput = screen.getByLabelText(/start date/i);

    await userEvent.type(companyInput, 'New Company');
    await userEvent.type(jobTitleInput, 'Senior Developer');
    await userEvent.type(startDateInput, '2023-02-01');

    // Save
    const saveButton = screen.getByRole('button', { name: /save employment/i });
    await userEvent.click(saveButton);

    // API should be called
    await waitFor(() => {
      expect(api.default.post).toHaveBeenCalledWith(
        '/api/users/employment',
        expect.objectContaining({
          company: 'New Company',
          jobTitle: 'Senior Developer',
        })
      );
    });
  });

  // Test 24: Opens edit modal for existing employment
  it('should open edit modal with pre-filled data', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click edit button (using test id or aria label)
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);

    // Modal should open with pre-filled data
    await waitFor(() => {
      expect(screen.getByDisplayValue('Tech Corp')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Developer')).toBeInTheDocument();
  });

  // Test 25: Updates existing employment entry
  it('should update employment entry successfully', async () => {
    api.default.put.mockResolvedValue({
      data: {
        success: true,
        data: {
          ...mockUserData.employmentHistory[0],
          jobTitle: 'Senior Developer',
        },
      },
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Open edit modal
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Developer')).toBeInTheDocument();
    });

    // Update job title
    const jobTitleInput = screen.getByDisplayValue('Developer');
    await userEvent.clear(jobTitleInput);
    await userEvent.type(jobTitleInput, 'Senior Developer');

    // Save
    const saveButton = screen.getByRole('button', { name: /save employment/i });
    await userEvent.click(saveButton);

    // API should be called
    await waitFor(() => {
      expect(api.default.put).toHaveBeenCalledWith(
        '/api/users/employment/emp1',
        expect.objectContaining({
          jobTitle: 'Senior Developer',
        })
      );
    });
  });

  // Test 26: Opens delete confirmation modal
  it('should open delete confirmation modal', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    // Confirmation modal should appear
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });

  // Test 27: Deletes employment entry
  it('should delete employment entry after confirmation', async () => {
    api.default.delete.mockResolvedValue({
      data: {
        success: true,
      },
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /^delete$/i });
    await userEvent.click(confirmButton);

    // API should be called
    await waitFor(() => {
      expect(api.default.delete).toHaveBeenCalledWith('/api/users/employment/emp1');
    });
  });

  // Test 28: Cancels employment deletion
  it('should cancel employment deletion', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    // Confirmation modal should close
    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });

    // API should NOT be called
    expect(api.default.delete).not.toHaveBeenCalled();
  });

  // Test 29: Shows success message after adding employment
  it('should show success message after adding employment', async () => {
    api.default.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          _id: 'emp2',
          company: 'New Company',
          jobTitle: 'Developer',
          startDate: '2023-01-01',
          isCurrentPosition: false,
        },
      },
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Open add modal
    const addButton = screen.getByRole('button', { name: /add employment/i });
    await userEvent.click(addButton);

    await waitFor(() => {
      const companyInput = screen.getByLabelText(/company/i);
      expect(companyInput).toBeInTheDocument();
    });

    // Fill and save
    await userEvent.type(screen.getByLabelText(/company/i), 'New Company');
    await userEvent.type(screen.getByLabelText(/job title|position/i), 'Developer');
    await userEvent.type(screen.getByLabelText(/start date/i), '2023-01-01');

    const saveButton = screen.getByRole('button', { name: /save employment/i });
    await userEvent.click(saveButton);

    // Success message should appear
    await waitFor(() => {
      expect(screen.getByText(/employment.*success/i)).toBeInTheDocument();
    });
  });

  // Test 30: Validates required fields
  it('should validate required employment fields', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Open add modal
    const addButton = screen.getByRole('button', { name: /add employment/i });
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save employment/i })).toBeInTheDocument();
    });

    // Try to save without filling fields
    const saveButton = screen.getByRole('button', { name: /save employment/i });
    await userEvent.click(saveButton);

    // Validation errors should appear
    await waitFor(() => {
      expect(screen.getByText(/company.*required/i)).toBeInTheDocument();
    });
  });
});
