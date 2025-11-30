import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../../api/axios';
import Card from '../Card';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import CampaignCard from './CampaignCard';
import CampaignFormModal from './CampaignFormModal';
import CampaignDetailModal from './CampaignDetailModal';
import CampaignAnalyticsPanel from './CampaignAnalyticsPanel';
import { 
  getCampaigns, 
  deleteCampaign as deleteCampaignApi,
  getOverviewAnalytics 
} from '../../api/networkingCampaigns';
import { 
  Target, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Calendar,
  Plus,
  Filter,
  BarChart2
} from 'lucide-react';

/**
 * UC-094: Networking Campaign Management Tab
 * 
 * Main tab component for managing networking campaigns within the Network page.
 */
export default function CampaignsTab() {
  const { getToken } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [overviewAnalytics, setOverviewAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.campaignType = typeFilter;

      const response = await getCampaigns(params);
      // `getCampaigns` returns the server JSON: { success, message, timestamp, data: { campaigns, pagination, summary } }
      // Be defensive and support older/newer formats
      const serverResp = response || {};
      const payload = serverResp.data ?? serverResp;
      const campaignsList = payload?.campaigns ?? payload?.data?.campaigns ?? [];
      const summaryObj = payload?.summary ?? payload?.data?.summary ?? {};
      setCampaigns(campaignsList);
      setSummary(summaryObj);

      // Fetch overview analytics
      const analyticsResponse = await getOverviewAnalytics();
      setOverviewAnalytics(analyticsResponse.data);

      setError(null);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err.response?.data?.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [getToken, statusFilter, typeFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setShowCreateModal(true);
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setShowCreateModal(true);
  };

  const handleViewCampaign = (campaign) => {
    setSelectedCampaign(campaign);
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      const token = await getToken();
      setAuthToken(token);
      await deleteCampaignApi(campaignId);
      await fetchCampaigns();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      alert(err.response?.data?.message || 'Failed to delete campaign');
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingCampaign(null);
  };

  const handleCampaignSaved = () => {
    handleModalClose();
    fetchCampaigns();
  };

  const handleDetailClose = () => {
    setSelectedCampaign(null);
  };

  const handleCampaignUpdated = () => {
    fetchCampaigns();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card variant="outlined" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{summary?.total || 0}</div>
              <div className="text-sm text-gray-600">Total Campaigns</div>
            </div>
          </div>
        </Card>

        <Card variant="outlined" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{summary?.active || 0}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </div>
        </Card>

        <Card variant="outlined" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{summary?.totalOutreach || 0}</div>
              <div className="text-sm text-gray-600">Total Outreach</div>
            </div>
          </div>
        </Card>

        <Card variant="outlined" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{summary?.totalResponses || 0}</div>
              <div className="text-sm text-gray-600">Responses</div>
            </div>
          </div>
        </Card>

        <Card variant="outlined" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Calendar className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-teal-600">{summary?.totalMeetings || 0}</div>
              <div className="text-sm text-gray-600">Meetings</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      {overviewAnalytics?.recommendations?.length > 0 && (
        <Card variant="outlined" className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">💡 Recommendations</h3>
          <div className="space-y-2">
            {overviewAnalytics.recommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg text-sm ${
                  rec.priority === 'high' 
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : rec.priority === 'medium'
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}
              >
                {rec.message}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-2">
          <Button onClick={handleCreateCampaign} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2"
          >
            <BarChart2 className="w-4 h-4" />
            {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#777C6D]"
          >
            <option value="all">All Status</option>
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#777C6D]"
          >
            <option value="all">All Types</option>
            <option value="Company Targeting">Company Targeting</option>
            <option value="Industry Networking">Industry Networking</option>
            <option value="Role-based">Role-based</option>
            <option value="Event Follow-up">Event Follow-up</option>
            <option value="Alumni Outreach">Alumni Outreach</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && overviewAnalytics && (
        <CampaignAnalyticsPanel analytics={overviewAnalytics} />
      )}

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <Card className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-600 mb-4">
            {statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first networking campaign to start building relationships systematically'}
          </p>
          {statusFilter === 'all' && typeFilter === 'all' && (
            <Button onClick={handleCreateCampaign}>Create Your First Campaign</Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign._id}
              campaign={campaign}
              onView={handleViewCampaign}
              onEdit={handleEditCampaign}
              onDelete={handleDeleteCampaign}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CampaignFormModal
          campaign={editingCampaign}
          onClose={handleModalClose}
          onSave={handleCampaignSaved}
        />
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          onClose={handleDetailClose}
          onUpdate={handleCampaignUpdated}
        />
      )}
    </div>
  );
}
