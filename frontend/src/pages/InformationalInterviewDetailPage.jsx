import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Edit2,
  Loader2,
  User,
  Briefcase,
  Building
} from 'lucide-react';
import { 
  getInformationalInterviewById,
  updateInformationalInterview 
} from '../api/informationalInterview';
import { setAuthToken } from '../api/axios';
import Button from '../components/Button';
import Container from '../components/Container';
import OutreachGeneratorModal from '../components/OutreachGeneratorModal';
import InterviewPrepWorkspace from '../components/InterviewPrepWorkspace';
import InterviewInsightsSummary from '../components/InterviewInsightsSummary';
import { toast } from 'react-hot-toast';

const InformationalInterviewDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('prep');
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    targetRole: '',
    targetCompany: '',
    scheduledDate: '',
    status: ''
  });

  const tabs = [
    { id: 'prep', label: 'Preparation' },
    { id: 'insights', label: 'Insights & Follow-up' }
  ];

  const statuses = [
    'Identified',
    'Outreach Sent',
    'Scheduled',
    'Completed',
    'Followed Up',
    'Closed'
  ];

  // Helper to refresh auth token before API calls
  const refreshToken = async () => {
    const token = await getToken();
    setAuthToken(token);
    return token;
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      initializeAuth();
    }
  }, [id, isLoaded, isSignedIn]);

  const initializeAuth = async () => {
    try {
      await refreshToken();
      fetchInterview();
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Authentication failed');
      setLoading(false);
    }
  };

  const fetchInterview = async () => {
    setLoading(true);
    try {
      await refreshToken();
      const response = await getInformationalInterviewById(id);
      const interviewData = response.data?.interview || response.interview;
      setInterview(interviewData);
      setEditData({
        targetRole: interviewData?.targetRole || '',
        targetCompany: interviewData?.targetCompany || '',
        scheduledDate: interviewData?.scheduledDate 
          ? new Date(interviewData.scheduledDate).toISOString().slice(0, 16)
          : '',
        status: interviewData?.status
      });
    } catch (error) {
      console.error('Error fetching interview:', error);
      toast.error('Failed to load interview');
      navigate('/informational-interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await refreshToken();
      await updateInformationalInterview(id, {
        ...editData,
        scheduledDate: editData.scheduledDate || null
      });
      toast.success('Interview updated!');
      setIsEditing(false);
      fetchInterview();
    } catch (error) {
      console.error('Error updating interview:', error);
      toast.error(error.response?.data?.message || 'Failed to update interview');
    }
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

  if (!interview) {
    return (
      <Container>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Not Found</h2>
          <Button onClick={() => navigate('/informational-interviews')}>
            Back to Interviews
          </Button>
        </div>
      </Container>
    );
  }

  const contact = interview.contactId;
  const contactName = contact ? `${contact.firstName} ${contact.lastName || ''}`.trim() : 'Unknown Contact';

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/informational-interviews')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Interviews
          </button>
        </div>

        {/* Interview Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{contactName}</h1>
                {contact?.company && (
                  <p className="text-gray-600">{contact.company}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {interview.status === 'Identified' && (
                <Button
                  variant="outline"
                  onClick={() => setShowOutreachModal(true)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Generate Outreach
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={editData.targetRole}
                    onChange={(e) => setEditData({ ...editData, targetRole: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Company
                  </label>
                  <input
                    type="text"
                    value={editData.targetCompany}
                    onChange={(e) => setEditData({ ...editData, targetCompany: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date
                  </label>
                  <input
                    type="datetime-local"
                    value={editData.scheduledDate}
                    onChange={(e) => setEditData({ ...editData, scheduledDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSaveEdit}>Save Changes</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              {interview.targetRole && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Target Role</p>
                    <p className="text-sm font-medium text-gray-900">{interview.targetRole}</p>
                  </div>
                </div>
              )}
              {interview.targetCompany && (
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Target Company</p>
                    <p className="text-sm font-medium text-gray-900">{interview.targetCompany}</p>
                  </div>
                </div>
              )}
              {interview.scheduledDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Scheduled</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(interview.scheduledDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Badge */}
          <div className="mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              interview.status === 'Completed' ? 'bg-green-100 text-green-800' :
              interview.status === 'Scheduled' ? 'bg-purple-100 text-purple-800' :
              interview.status === 'Outreach Sent' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {interview.status}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'prep' && (
          <InterviewPrepWorkspace 
            interview={interview} 
            onUpdate={fetchInterview}
          />
        )}

        {activeTab === 'insights' && (
          <InterviewInsightsSummary 
            interview={interview} 
            onUpdate={fetchInterview}
          />
        )}
      </div>

      {/* Outreach Modal */}
      {showOutreachModal && (
        <OutreachGeneratorModal
          isOpen={showOutreachModal}
          onClose={() => setShowOutreachModal(false)}
          interview={interview}
          onSuccess={fetchInterview}
        />
      )}
    </Container>
  );
};

export default InformationalInterviewDetailPage;
