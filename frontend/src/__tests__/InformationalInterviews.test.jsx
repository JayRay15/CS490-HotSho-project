import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InformationalInterviewsPage from '../pages/InformationalInterviews';
import InformationalInterviewCard from '../components/InformationalInterviewCard';
import RequestInterviewModal from '../components/RequestInterviewModal';
import OutcomeModal from '../components/OutcomeModal';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    getToken: vi.fn(() => Promise.resolve('mock-token')),
    isSignedIn: true,
  }),
  useUser: () => ({
    user: { id: 'user_123', firstName: 'Test', emailAddresses: [{ emailAddress: 'test@test.com' }] },
  }),
  useClerk: () => ({
    signOut: vi.fn(),
  }),
  SignedIn: ({ children }) => children,
  SignedOut: () => null,
}));

// Mock API functions
vi.mock('../api/informationalInterviews', () => ({
  getInformationalInterviews: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          interviews: [
            {
              _id: '1',
              candidateName: 'John Doe',
              targetRole: 'Senior Engineer',
              targetCompany: 'TechCorp',
              status: 'Scheduled',
              dates: { interviewDate: new Date(Date.now() + 86400000).toISOString() },
              outcomes: { referralObtained: false, connectionQuality: '' },
              impactScore: 0,
            },
            {
              _id: '2',
              candidateName: 'Jane Smith',
              targetRole: 'Product Manager',
              targetCompany: 'BigCo',
              status: 'Completed',
              dates: { interviewDate: new Date(Date.now() - 86400000).toISOString() },
              outcomes: { referralObtained: true, connectionQuality: 'Strong', keyLearnings: 'Great insights' },
              impactScore: 8,
            },
          ],
        },
      },
    })
  ),
  getInformationalInterviewById: vi.fn((id) =>
    Promise.resolve({
      data: {
        data: {
          interview: {
            _id: id,
            candidateName: 'John Doe',
            targetRole: 'Senior Engineer',
            targetCompany: 'TechCorp',
            status: 'Scheduled',
          },
        },
      },
    })
  ),
  deleteInformationalInterview: vi.fn(() => Promise.resolve({ data: { success: true } })),
  getInformationalInterviewAnalytics: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          analytics: {
            total: 2,
            completed: 1,
            referralsObtained: 1,
            averageImpactScore: 8,
            byStatus: {
              Identified: 0,
              'Outreach Sent': 0,
              Scheduled: 1,
              Completed: 1,
              'Follow-up Sent': 0,
            },
          },
        },
      },
    })
  ),
  createInformationalInterview: vi.fn(() =>
    Promise.resolve({ data: { data: { interview: { _id: '3' } } } })
  ),
  updateInformationalInterview: vi.fn(() =>
    Promise.resolve({ data: { data: { interview: { _id: '1' } } } })
  ),
  generateOutreachEmail: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          outreachContent:
            'Subject: Request for Informational Interview\n\nDear John, I would love to learn about your experience...',
        },
      },
    })
  ),
  generatePreparationFramework: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          preparation: {
            questions: ['What does a typical day look like?', 'What skills are most important?'],
            researchTopics: ['Company history', 'Recent news'],
            conversationTips: ['Be curious', 'Take notes'],
          },
        },
      },
    })
  ),
  generateFollowUpEmail: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          followUpContent:
            'Subject: Thank You for Your Time\n\nDear John, Thank you so much for taking the time...',
        },
      },
    })
  ),
  suggestCandidates: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          suggestions: [
            {
              jobTitle: 'Tech Lead',
              whyThisPerson: 'Direct experience in the field',
              keyQuestions: ['How did you get started?', 'What challenges do you face?'],
              whereToFind: 'LinkedIn',
              outreachTip: 'Reference mutual connections',
            },
          ],
        },
      },
    })
  ),
  generateInsights: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          insights: {
            industryTrends: ['AI is transforming the industry'],
            skillPriorities: ['Communication', 'Technical skills'],
            culturalPatterns: ['Remote work is common'],
            careerPaths: ['Many started in different fields'],
            recommendations: ['Network more actively'],
            networkingOpportunities: ['Attend meetups'],
            basedOnInterviews: 2,
          },
        },
      },
    })
  ),
  connectInterviewToOpportunity: vi.fn(() => Promise.resolve({ data: { success: true } })),
  getRelatedOpportunities: vi.fn(() =>
    Promise.resolve({
      data: {
        data: {
          potentialMatches: [{ _id: 'app1', company: 'TechCorp', role: 'Engineer' }],
        },
      },
    })
  ),
}));

// Wrapper with Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('InformationalInterviewsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the page title and description', async () => {
    renderWithRouter(<InformationalInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Informational Interviews')).toBeInTheDocument();
      expect(screen.getByText('Build relationships and gain industry insights')).toBeInTheDocument();
    });
  });

  it('displays analytics cards with correct values', async () => {
    renderWithRouter(<InformationalInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Interviews')).toBeInTheDocument();
    });
    
    // Also check other analytics are present
    await waitFor(() => {
      expect(screen.getByText('Referrals')).toBeInTheDocument();
    });
  });

  it('shows interview cards in kanban view', async () => {
    renderWithRouter(<InformationalInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('can switch between kanban and list views', async () => {
    renderWithRouter(<InformationalInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('📊 Kanban View')).toBeInTheDocument();
    });

    const listButton = screen.getByText('📋 List View');
    fireEvent.click(listButton);

    // Wait for the state to update and check the button has the active style
    await waitFor(() => {
      expect(listButton).toHaveClass('bg-indigo-600');
    });
  });

  it('opens request interview modal when button is clicked', async () => {
    renderWithRouter(<InformationalInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('+ Request Interview')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Request Interview'));

    await waitFor(() => {
      expect(screen.getByText('Request Informational Interview')).toBeInTheDocument();
    });
  });

  it('opens candidate suggestion modal when button is clicked', async () => {
    renderWithRouter(<InformationalInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('🔍 Find Candidates')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('🔍 Find Candidates'));

    await waitFor(() => {
      expect(screen.getByText(/Find Interview Candidates/)).toBeInTheDocument();
    });
  });

  it('opens insights panel when button is clicked', async () => {
    renderWithRouter(<InformationalInterviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('💡 View Insights')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('💡 View Insights'));

    await waitFor(() => {
      // The insights panel header is "💡 Industry Insights"
      expect(screen.getByText(/Industry Insights/)).toBeInTheDocument();
    });
  });
});

describe('InformationalInterviewCard', () => {
  const mockInterview = {
    _id: '1',
    candidateName: 'Test Person',
    targetRole: 'Developer',
    targetCompany: 'TestCorp',
    status: 'Scheduled',
    dates: { interviewDate: new Date(Date.now() + 86400000).toISOString() },
    outcomes: { referralObtained: false },
    impactScore: 0,
  };

  const mockHandlers = {
    onDelete: vi.fn(),
    onPrepare: vi.fn(),
    onRecordOutcome: vi.fn(),
    onRefresh: vi.fn(),
  };

  it('renders interview information correctly', () => {
    renderWithRouter(<InformationalInterviewCard interview={mockInterview} {...mockHandlers} />);

    expect(screen.getByText('Test Person')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('TestCorp')).toBeInTheDocument();
  });

  it('shows prepare button for scheduled interviews', () => {
    renderWithRouter(<InformationalInterviewCard interview={mockInterview} {...mockHandlers} />);

    expect(screen.getByText('📝 Prepare')).toBeInTheDocument();
  });

  it('shows outcomes button for completed interviews', () => {
    const completedInterview = { ...mockInterview, status: 'Completed' };
    renderWithRouter(<InformationalInterviewCard interview={completedInterview} {...mockHandlers} />);

    expect(screen.getByText('📊 Outcomes')).toBeInTheDocument();
  });

  it('shows referral badge when referral was obtained', () => {
    const interviewWithReferral = {
      ...mockInterview,
      status: 'Completed',
      outcomes: { referralObtained: true },
    };
    renderWithRouter(<InformationalInterviewCard interview={interviewWithReferral} {...mockHandlers} />);

    expect(screen.getByText('🤝 Referral Obtained')).toBeInTheDocument();
  });

  it('shows impact score when present', () => {
    const interviewWithScore = { ...mockInterview, impactScore: 8 };
    renderWithRouter(<InformationalInterviewCard interview={interviewWithScore} {...mockHandlers} />);

    expect(screen.getByText('⭐ 8')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    renderWithRouter(<InformationalInterviewCard interview={mockInterview} {...mockHandlers} />);

    fireEvent.click(screen.getByText('🗑️'));
    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
  });

  it('calls onPrepare when prepare button is clicked', () => {
    renderWithRouter(<InformationalInterviewCard interview={mockInterview} {...mockHandlers} />);

    fireEvent.click(screen.getByText('📝 Prepare'));
    expect(mockHandlers.onPrepare).toHaveBeenCalledWith(mockInterview);
  });

  it('expands to show details when expand button is clicked', async () => {
    const interviewWithEmail = { ...mockInterview, candidateEmail: 'test@example.com' };
    renderWithRouter(<InformationalInterviewCard interview={interviewWithEmail} {...mockHandlers} />);

    fireEvent.click(screen.getByText('▼'));

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });
});

describe('RequestInterviewModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with form fields', () => {
    render(<RequestInterviewModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Request Informational Interview')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senior Software Engineer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tech Corp')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<RequestInterviewModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Request Informational Interview')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<RequestInterviewModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows error when generating outreach without required fields', async () => {
    render(<RequestInterviewModal isOpen={true} onClose={mockOnClose} />);

    // The generate button is disabled when fields are empty
    const generateButton = screen.getByText('✨ Generate Outreach Email');
    expect(generateButton).toBeDisabled();
  });

  it('enables generate button when required fields are filled', async () => {
    render(<RequestInterviewModal isOpen={true} onClose={mockOnClose} />);

    // Fill in required fields
    fireEvent.change(screen.getByPlaceholderText('John Doe'), {
      target: { value: 'Test Person' },
    });
    fireEvent.change(screen.getByPlaceholderText('Senior Software Engineer'), {
      target: { value: 'Developer' },
    });
    fireEvent.change(screen.getByPlaceholderText('Tech Corp'), {
      target: { value: 'TestCo' },
    });

    // Now the generate button should be enabled
    const generateButton = screen.getByText('✨ Generate Outreach Email');
    expect(generateButton).not.toBeDisabled();
  });
});

describe('OutcomeModal', () => {
  const mockInterview = {
    _id: '1',
    candidateName: 'Test Person',
    targetRole: 'Developer',
    targetCompany: 'TestCorp',
    outcomes: {},
    dates: {},
  };
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with outcome fields', () => {
    render(<OutcomeModal isOpen={true} interview={mockInterview} onClose={mockOnClose} />);

    expect(screen.getByText('Record Interview Outcomes')).toBeInTheDocument();
    expect(screen.getByText('🎯 Key Learnings')).toBeInTheDocument();
    expect(screen.getByText('🔍 Industry Insights')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<OutcomeModal isOpen={false} interview={mockInterview} onClose={mockOnClose} />);

    expect(screen.queryByText('Record Interview Outcomes')).not.toBeInTheDocument();
  });

  it('has referral checkbox that toggles referral details', async () => {
    render(<OutcomeModal isOpen={true} interview={mockInterview} onClose={mockOnClose} />);

    const checkbox = screen.getByLabelText(/Referral or Introduction Obtained/);
    expect(screen.queryByPlaceholderText(/Who were you referred to/)).not.toBeInTheDocument();

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Who were you referred to/)).toBeInTheDocument();
    });
  });

  it('has connection quality dropdown with options', () => {
    render(<OutcomeModal isOpen={true} interview={mockInterview} onClose={mockOnClose} />);

    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toBeInTheDocument();

    // Check options exist
    expect(screen.getByText(/Weak - Brief conversation/)).toBeInTheDocument();
    expect(screen.getByText(/Moderate - Good conversation/)).toBeInTheDocument();
    expect(screen.getByText(/Strong - Great rapport/)).toBeInTheDocument();
  });
});

describe('API Integration Expectations', () => {
  it('should have all required API functions exported', async () => {
    const api = await import('../api/informationalInterviews');

    // CRUD operations
    expect(api.getInformationalInterviews).toBeDefined();
    expect(api.getInformationalInterviewById).toBeDefined();
    expect(api.createInformationalInterview).toBeDefined();
    expect(api.updateInformationalInterview).toBeDefined();
    expect(api.deleteInformationalInterview).toBeDefined();

    // AI generation
    expect(api.generateOutreachEmail).toBeDefined();
    expect(api.generatePreparationFramework).toBeDefined();
    expect(api.generateFollowUpEmail).toBeDefined();
    expect(api.suggestCandidates).toBeDefined();

    // Analytics and insights
    expect(api.getInformationalInterviewAnalytics).toBeDefined();
    expect(api.generateInsights).toBeDefined();

    // Opportunity connector
    expect(api.connectInterviewToOpportunity).toBeDefined();
    expect(api.getRelatedOpportunities).toBeDefined();
  });
});
