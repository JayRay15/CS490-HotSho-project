import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { 
  Plus, 
  Mail, 
  Calendar, 
  CheckCircle, 
  Archive,
  TrendingUp,
  Loader2,
  Eye,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { 
  getInformationalInterviews, 
  deleteInformationalInterview,
  getInterviewStats 
} from '../api/informationalInterview';
import { getContacts } from '../api/contactApi';
import { setAuthToken } from '../api/axios';
import Button from '../components/Button';
import Container from '../components/Container';
import OutreachGeneratorModal from '../components/OutreachGeneratorModal';
import { toast } from 'react-hot-toast';

const InformationalInterviewsPage = () => {
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [showNewInterviewForm, setShowNewInterviewForm] = useState(false);
  const [newInterview, setNewInterview] = useState({
    contactId: '',
    targetRole: '',
    targetCompany: '',
    scheduledDate: ''
  });
  const [activeMenu, setActiveMenu] = useState(null);

  const columns = [
    { id: 'Identified', title: 'Potential', color: 'gray' },
    { id: 'Outreach Sent', title: 'Outreach Sent', color: 'blue' },
    { id: 'Scheduled', title: 'Scheduled', color: 'purple' },
    { id: 'Completed', title: 'Completed', color: 'green' }
  ];

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      initializeAuth();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const initializeAuth = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No auth token available');
        toast.error('Please sign in to continue');
        setLoading(false);
        return;
      }
      setAuthToken(token);
      
      // Fetch contacts first (needed for the form)
      await fetchContacts();
      // Then fetch interviews and stats
      await fetchData();
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Authentication failed');
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await getContacts();
      const contactsList = response.data?.data || response.data || [];
      setContacts(Array.isArray(contactsList) ? contactsList : []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      setAuthToken(token);
      
      // Fetch interviews and stats separately to avoid race issues
      try {
        const interviewsRes = await getInformationalInterviews();
        console.log('Interviews response:', interviewsRes);
        setInterviews(interviewsRes.data?.interviews || interviewsRes.interviews || []);
      } catch (err) {
        console.error('Error fetching interviews:', err);
        setInterviews([]);
      }
      
      try {
        const statsRes = await getInterviewStats();
        console.log('Stats response:', statsRes);
        setStats(statsRes.data?.stats || statsRes.stats || null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setStats(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load interviews');
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInterview = async () => {
    if (!newInterview.contactId) {
      toast.error('Please select a contact');
      return;
    }

    setCreating(true);
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const { createInformationalInterview } = await import('../api/informationalInterview');
      const result = await createInformationalInterview(newInterview);
      console.log('Create result:', result);
      
      toast.success('Interview created!');
      setShowNewInterviewForm(false);
      setNewInterview({ contactId: '', targetRole: '', targetCompany: '', scheduledDate: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating interview:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create interview');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (interviewId) => {
    if (!confirm('Are you sure you want to delete this interview?')) return;

    try {
      const token = await getToken();
      setAuthToken(token);
      await deleteInformationalInterview(interviewId);
      toast.success('Interview deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting interview:', error);
      toast.error('Failed to delete interview');
    }
  };

  const getInterviewsByStatus = (status) => {
    return interviews.filter(interview => interview.status === status);
  };

  const getContactName = (interview) => {
    const contact = interview.contactId;
    if (!contact) return 'Unknown Contact';
    return `${contact.firstName} ${contact.lastName || ''}`.trim();
  };

  const getStatusColor = (status) => {
    const column = columns.find(col => col.id === status);
    return column?.color || 'gray';
  };

  // Show loading while Clerk is loading or while fetching data
  if (!isLoaded || loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Informational Interviews</h1>
            <p className="text-gray-600 mt-1">
              Build relationships and gain industry insights
            </p>
          </div>
          <Button
            onClick={() => setShowNewInterviewForm(!showNewInterviewForm)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Interview
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.byStatus?.Completed || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Led to Opportunities</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.withOpportunities}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.conversionRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
          </div>
        )}

        {/* New Interview Form */}
        {showNewInterviewForm && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Interview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact *
                </label>
                <select
                  value={newInterview.contactId}
                  onChange={(e) => setNewInterview({ ...newInterview, contactId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a contact...</option>
                  {contacts.map(contact => (
                    <option key={contact._id} value={contact._id}>
                      {contact.firstName} {contact.lastName} {contact.company ? `(${contact.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Role
                </label>
                <input
                  type="text"
                  value={newInterview.targetRole}
                  onChange={(e) => setNewInterview({ ...newInterview, targetRole: e.target.value })}
                  placeholder="e.g., Product Manager"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Company
                </label>
                <input
                  type="text"
                  value={newInterview.targetCompany}
                  onChange={(e) => setNewInterview({ ...newInterview, targetCompany: e.target.value })}
                  placeholder="e.g., Google"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newInterview.scheduledDate}
                  onChange={(e) => setNewInterview({ ...newInterview, scheduledDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleCreateInterview} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Interview'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewInterviewForm(false)}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {columns.map(column => (
            <div key={column.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${column.color}-100 text-${column.color}-700`}>
                  {getInterviewsByStatus(column.id).length}
                </span>
              </div>
              <div className="space-y-3">
                {getInterviewsByStatus(column.id).map(interview => (
                  <div
                    key={interview._id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 line-clamp-1">
                        {getContactName(interview)}
                      </h4>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === interview._id ? null : interview._id);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenu === interview._id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/informational-interviews/${interview._id}`);
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            {interview.status === 'Identified' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedInterview(interview);
                                  setShowOutreachModal(true);
                                  setActiveMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Mail className="w-4 h-4" />
                                Generate Outreach
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(interview._id);
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {interview.targetRole && (
                      <p className="text-sm text-gray-600 mb-1">
                        Role: {interview.targetRole}
                      </p>
                    )}
                    
                    {interview.targetCompany && (
                      <p className="text-sm text-gray-600 mb-2">
                        Company: {interview.targetCompany}
                      </p>
                    )}
                    
                    {interview.scheduledDate && (
                      <div className="flex items-center gap-1 text-xs text-indigo-600 mt-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(interview.scheduledDate).toLocaleDateString()}
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => navigate(`/informational-interviews/${interview._id}`)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}

                {getInterviewsByStatus(column.id).length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No interviews
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outreach Generator Modal */}
      {showOutreachModal && selectedInterview && (
        <OutreachGeneratorModal
          isOpen={showOutreachModal}
          onClose={() => {
            setShowOutreachModal(false);
            setSelectedInterview(null);
          }}
          interview={selectedInterview}
          onSuccess={fetchData}
        />
      )}
    </Container>
  );
};

export default InformationalInterviewsPage;
