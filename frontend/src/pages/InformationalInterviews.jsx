import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  getInformationalInterviews,
  deleteInformationalInterview,
  getInformationalInterviewAnalytics
} from '../api/informationalInterviews';
import { setAuthToken } from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';
import Container from '../components/Container';
import RequestInterviewModal from '../components/RequestInterviewModal';
import InterviewPreparationView from '../components/InterviewPreparationView';
import OutcomeModal from '../components/OutcomeModal';
import InformationalInterviewCard from '../components/InformationalInterviewCard';
import CandidateSuggestionModal from '../components/CandidateSuggestionModal';
import InsightsPanel from '../components/InsightsPanel';

const STATUS_COLUMNS = [
  { key: 'Identified', label: 'Identified', color: 'bg-gray-100' },
  { key: 'Outreach Sent', label: 'Outreach Sent', color: 'bg-blue-100' },
  { key: 'Scheduled', label: 'Scheduled', color: 'bg-yellow-100' },
  { key: 'Completed', label: 'Completed', color: 'bg-green-100' }
];

export default function InformationalInterviewsPage() {
  const { getToken } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  
  // Modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPreparationView, setShowPreparationView] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        setAuthToken(token);
        
        const [interviewsRes, analyticsRes] = await Promise.all([
          getInformationalInterviews({ archived: false }),
          getInformationalInterviewAnalytics()
        ]);
        
        setInterviews(interviewsRes.data.data.interviews || []);
        setAnalytics(analyticsRes.data.data.analytics);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load informational interviews');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Empty deps - only run once on mount

  const refreshData = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const [interviewsRes, analyticsRes] = await Promise.all([
        getInformationalInterviews({ archived: false }),
        getInformationalInterviewAnalytics()
      ]);
      
      setInterviews(interviewsRes.data.data.interviews || []);
      setAnalytics(analyticsRes.data.data.analytics);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this informational interview?')) {
      return;
    }
    
    try {
      const token = await getToken();
      setAuthToken(token);
      await deleteInformationalInterview(id);
      await refreshData();
    } catch (err) {
      console.error('Failed to delete interview:', err);
      alert('Failed to delete interview');
    }
  };

  const handlePrepare = (interview) => {
    setSelectedInterview(interview);
    setShowPreparationView(true);
  };

  const handleRecordOutcome = (interview) => {
    setSelectedInterview(interview);
    setShowOutcomeModal(true);
  };

  const handleModalClose = () => {
    setShowRequestModal(false);
    setShowPreparationView(false);
    setShowOutcomeModal(false);
    setShowSuggestionModal(false);
    setShowInsightsPanel(false);
    setSelectedInterview(null);
    refreshData();
  };

  const getInterviewsByStatus = (status) => {
    return interviews.filter(i => i.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E4E6E0' }}>
        <LoadingSpinner text="Loading informational interviews..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E4E6E0' }}>
      <Container level={1} className="pt-8 pb-12">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-heading font-bold" style={{ color: '#4F5348' }}>
                Informational Interviews
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Build relationships and gain industry insights
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowSuggestionModal(true)}
                className="px-4 py-2 bg-[#777C6D] hover:bg-[#656A5C] text-white rounded-lg transition shadow-md font-medium text-sm"
              >
                🔍 Find Candidates
              </button>
              <button
                onClick={() => setShowInsightsPanel(true)}
                className="px-4 py-2 bg-[#777C6D] hover:bg-[#656A5C] text-white rounded-lg transition shadow-md font-medium text-sm"
              >
                💡 View Insights
              </button>
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-4 py-2 bg-[#777C6D] hover:bg-[#656A5C] text-white rounded-lg transition shadow-md font-medium text-sm"
              >
                + Request Interview
              </button>
            </div>
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card variant="elevated" className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#4F5348' }}>{analytics.total}</div>
                <div className="text-sm text-gray-600 mt-1">Total Interviews</div>
              </Card>
              <Card variant="elevated" className="text-center">
                <div className="text-3xl font-bold text-green-600">{analytics.completed}</div>
                <div className="text-sm text-gray-600 mt-1">Completed</div>
              </Card>
              <Card variant="elevated" className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#656A5C' }}>{analytics.referralsObtained}</div>
                <div className="text-sm text-gray-600 mt-1">Referrals</div>
              </Card>
              <Card variant="elevated" className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#777C6D' }}>
                  {analytics.averageImpactScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Avg Impact</div>
              </Card>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === 'kanban'
                  ? 'bg-[#777C6D] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📊 Kanban View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-[#777C6D] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📋 List View
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUS_COLUMNS.map(column => (
              <div key={column.key} className="flex flex-col">
                <div className={`${column.color} rounded-t-lg px-4 py-3`}>
                  <h3 className="font-semibold text-gray-800">
                    {column.label}
                    <span className="ml-2 text-sm text-gray-600">
                      ({getInterviewsByStatus(column.key).length})
                    </span>
                  </h3>
                </div>
                <div className="bg-gray-50 rounded-b-lg p-2 space-y-2 min-h-[200px]">
                  {getInterviewsByStatus(column.key).map(interview => (
                    <InformationalInterviewCard
                      key={interview._id}
                      interview={interview}
                      onDelete={handleDelete}
                      onPrepare={handlePrepare}
                      onRecordOutcome={handleRecordOutcome}
                      onRefresh={refreshData}
                    />
                  ))}
                  {getInterviewsByStatus(column.key).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No interviews</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {interviews.length === 0 ? (
              <Card variant="elevated" className="text-center py-12">
                <p className="text-gray-600 mb-4">No informational interviews yet</p>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="px-6 py-2 bg-[#777C6D] hover:bg-[#656A5C] text-white rounded-lg transition"
                >
                  Request Your First Interview
                </button>
              </Card>
            ) : (
              interviews.map(interview => (
                <InformationalInterviewCard
                  key={interview._id}
                  interview={interview}
                  onDelete={handleDelete}
                  onPrepare={handlePrepare}
                  onRecordOutcome={handleRecordOutcome}
                  onRefresh={refreshData}
                  viewMode="list"
                />
              ))
            )}
          </div>
        )}
      </Container>

      {/* Modals */}
      {showRequestModal && (
        <RequestInterviewModal
          isOpen={showRequestModal}
          onClose={handleModalClose}
        />
      )}

      {showPreparationView && selectedInterview && (
        <InterviewPreparationView
          isOpen={showPreparationView}
          interview={selectedInterview}
          onClose={handleModalClose}
        />
      )}

      {showOutcomeModal && selectedInterview && (
        <OutcomeModal
          isOpen={showOutcomeModal}
          interview={selectedInterview}
          onClose={handleModalClose}
        />
      )}

      {showSuggestionModal && (
        <CandidateSuggestionModal
          isOpen={showSuggestionModal}
          onClose={handleModalClose}
        />
      )}

      {showInsightsPanel && (
        <InsightsPanel
          isOpen={showInsightsPanel}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
