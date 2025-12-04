import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import RelationshipReminderCard from '../../components/network/RelationshipReminderCard';
import RelationshipActivityCard from '../../components/network/RelationshipActivityCard';
import RelationshipAnalytics from '../../components/network/RelationshipAnalytics';
import CreateReminderModal from '../../components/network/CreateReminderModal';
import LogActivityModal from '../../components/network/LogActivityModal';
import LoadingSpinner from '../../components/LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function RelationshipMaintenance() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('reminders');
  const [reminders, setReminders] = useState([]);
  const [activities, setActivities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadData();
  }, [activeTab, filterStatus, filterType]);

  // Load activity count on initial load for summary card
  useEffect(() => {
    loadActivityCount();
  }, []);

  // Auto-generate reminders on initial load
  useEffect(() => {
    const autoGenerateReminders = async () => {
      try {
        const token = await getToken();
        await axios.post(
          `${API_BASE_URL}/api/relationship-maintenance/reminders/generate`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error('Error auto-generating reminders:', error);
      }
    };
    autoGenerateReminders();
  }, []);

  const loadActivityCount = async () => {
    try {
      const token = await getToken();
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/relationship-maintenance/activities`,
        { ...config, params: { limit: 1000 } }
      );
      setActivities(response.data);
    } catch (error) {
      console.error('Error loading activity count:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (activeTab === 'reminders') {
        const params = {};
        if (filterStatus !== 'all') params.status = filterStatus;
        if (filterType !== 'all') params.reminderType = filterType;
        
        const response = await axios.get(
          `${API_BASE_URL}/api/relationship-maintenance/reminders`,
          { ...config, params }
        );
        setReminders(response.data);
      } else if (activeTab === 'activities') {
        const response = await axios.get(
          `${API_BASE_URL}/api/relationship-maintenance/activities`,
          { ...config, params: { limit: 50 } }
        );
        setActivities(response.data);
      } else if (activeTab === 'analytics') {
        const response = await axios.get(
          `${API_BASE_URL}/api/relationship-maintenance/activities/analytics`,
          config
        );
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReminders = async () => {
    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/api/relationship-maintenance/reminders/generate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadData();
    } catch (error) {
      console.error('Error generating reminders:', error);
    }
  };

  const handleCompleteReminder = async (reminderId, notes, logActivity) => {
    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/api/relationship-maintenance/reminders/${reminderId}/complete`,
        { notes, logActivity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadData();
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const handleSnoozeReminder = async (reminderId, days) => {
    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/api/relationship-maintenance/reminders/${reminderId}/snooze`,
        { days },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadData();
    } catch (error) {
      console.error('Error snoozing reminder:', error);
    }
  };

  const handleDismissReminder = async (reminderId) => {
    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/api/relationship-maintenance/reminders/${reminderId}/dismiss`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadData();
    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  };

  const upcomingReminders = reminders.filter(r => {
    const reminderDate = new Date(r.reminderDate);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return r.status === 'Pending' && reminderDate >= now && reminderDate <= sevenDaysFromNow;
  });

  const overdueReminders = reminders.filter(r => {
    if (r.status !== 'Pending') return false;
    const reminderDate = new Date(r.reminderDate);
    const today = new Date();
    // Compare UTC dates at midnight
    const reminderUTC = Date.UTC(reminderDate.getUTCFullYear(), reminderDate.getUTCMonth(), reminderDate.getUTCDate());
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    return reminderUTC < todayUTC;
  });

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Relationship Maintenance</h1>
        <p className="text-gray-600">
          Nurture your professional network with automated reminders and activity tracking
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Button onClick={() => setShowCreateModal(true)}>
          Create Reminder
        </Button>
        <Button onClick={() => setShowActivityModal(true)} variant="secondary">
          Log Activity
        </Button>
        <Button onClick={handleGenerateReminders} variant="outline">
          Generate Auto Reminders
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card variant="outlined" className="p-4">
          <div className="text-sm text-gray-600 mb-1">Upcoming Reminders</div>
          <div className="text-3xl font-bold text-blue-600">{upcomingReminders.length}</div>
          <div className="text-xs text-gray-500 mt-1">Next 7 days</div>
        </Card>
        <Card variant="outlined" className="p-4">
          <div className="text-sm text-gray-600 mb-1">Overdue</div>
          <div className="text-3xl font-bold text-red-600">{overdueReminders.length}</div>
          <div className="text-xs text-gray-500 mt-1">Needs attention</div>
        </Card>
        <Card variant="outlined" className="p-4">
          <div className="text-sm text-gray-600 mb-1">Total Activities</div>
          <div className="text-3xl font-bold text-green-600">{activities.length}</div>
          <div className="text-xs text-gray-500 mt-1">Logged interactions</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex flex-wrap gap-1 sm:gap-4 overflow-x-auto pb-1">
          {['reminders', 'activities', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                py-2 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm capitalize whitespace-nowrap
                ${activeTab === tab
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      {activeTab === 'reminders' && (
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Snoozed">Snoozed</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All Types</option>
              <option value="General Check-in">General Check-in</option>
              <option value="Birthday">Birthday</option>
              <option value="Industry News Share">Industry News Share</option>
              <option value="Congratulations">Congratulations</option>
              <option value="Thank You">Thank You</option>
              <option value="Coffee Chat">Coffee Chat</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              {reminders.length === 0 ? (
                <Card variant="outlined" className="p-8 text-center">
                  <p className="text-gray-600 mb-4">No reminders found</p>
                  <Button onClick={handleGenerateReminders}>
                    Generate Reminders
                  </Button>
                </Card>
              ) : (
                reminders.map(reminder => (
                  <RelationshipReminderCard
                    key={reminder._id}
                    reminder={reminder}
                    onComplete={handleCompleteReminder}
                    onSnooze={handleSnoozeReminder}
                    onDismiss={handleDismissReminder}
                    onRefresh={loadData}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-4">
              {activities.length === 0 ? (
                <Card variant="outlined" className="p-8 text-center">
                  <p className="text-gray-600 mb-4">No activities logged yet</p>
                  <Button onClick={() => setShowActivityModal(true)}>
                    Log Your First Activity
                  </Button>
                </Card>
              ) : (
                activities.map(activity => (
                  <RelationshipActivityCard
                    key={activity._id}
                    activity={activity}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'analytics' && analytics && (
            <RelationshipAnalytics analytics={analytics} />
          )}
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateReminderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {showActivityModal && (
        <LogActivityModal
          onClose={() => setShowActivityModal(false)}
          onSuccess={() => {
            setShowActivityModal(false);
            loadData();
          }}
        />
      )}
    </Container>
  );
}
