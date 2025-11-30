import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../../api/axios';
import { 
  getCampaign, 
  updateCampaign, 
  addOutreach, 
  updateOutreach, 
  deleteOutreach,
  createABTest,
  completeABTest,
  getCampaignAnalytics
} from '../../api/networkingCampaigns';
import Card from '../Card';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import { 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle,
  Send,
  MessageCircle,
  Calendar,
  Users,
  TrendingUp,
  Target,
  Beaker,
  BarChart2,
  Clock,
  Mail,
  Phone,
  Linkedin,
  Building
} from 'lucide-react';

/**
 * Campaign Detail Modal
 * 
 * Full-featured modal for viewing and managing a campaign including:
 * - Outreach tracking
 * - A/B testing
 * - Analytics
 * - Status management
 */
export default function CampaignDetailModal({ campaign: initialCampaign, onClose, onUpdate }) {
  const { getToken } = useAuth();
  const [campaign, setCampaign] = useState(initialCampaign);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('outreach');
  
  // Outreach form state
  const [showOutreachForm, setShowOutreachForm] = useState(false);
  const [outreachForm, setOutreachForm] = useState({
    contactName: '',
    contactCompany: '',
    contactRole: '',
    method: 'LinkedIn',
    messageTemplate: 'Control',
    status: 'Pending',
    notes: ''
  });
  
  // A/B Test form state
  const [showABTestForm, setShowABTestForm] = useState(false);
  const [abTestForm, setABTestForm] = useState({
    name: '',
    templateA: { subject: '', message: '' },
    templateB: { subject: '', message: '' }
  });

  const [saving, setSaving] = useState(false);

  const fetchCampaignData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      const [campaignRes, analyticsRes] = await Promise.all([
        getCampaign(initialCampaign._id),
        getCampaignAnalytics(initialCampaign._id)
      ]);

      setCampaign(campaignRes.data.campaign);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Error fetching campaign data:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, initialCampaign._id]);

  useEffect(() => {
    fetchCampaignData();
  }, [fetchCampaignData]);

  const handleStatusChange = async (newStatus) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await updateCampaign(campaign._id, { status: newStatus });
      await fetchCampaignData();
      onUpdate();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update campaign status');
    }
  };

  const handleAddOutreach = async (e) => {
    e.preventDefault();
    if (!outreachForm.contactName.trim()) return;

    try {
      setSaving(true);
      const token = await getToken();
      setAuthToken(token);
      
      await addOutreach(campaign._id, outreachForm);
      
      setOutreachForm({
        contactName: '',
        contactCompany: '',
        contactRole: '',
        method: 'LinkedIn',
        messageTemplate: 'Control',
        status: 'Pending',
        notes: ''
      });
      setShowOutreachForm(false);
      await fetchCampaignData();
      onUpdate();
    } catch (err) {
      console.error('Error adding outreach:', err);
      alert('Failed to add outreach');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateOutreachStatus = async (outreachId, status, outcome = null) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await updateOutreach(campaign._id, outreachId, { status, outcome });
      await fetchCampaignData();
      onUpdate();
    } catch (err) {
      console.error('Error updating outreach:', err);
      alert('Failed to update outreach');
    }
  };

  const handleDeleteOutreach = async (outreachId) => {
    if (!window.confirm('Delete this outreach entry?')) return;

    try {
      const token = await getToken();
      setAuthToken(token);
      await deleteOutreach(campaign._id, outreachId);
      await fetchCampaignData();
      onUpdate();
    } catch (err) {
      console.error('Error deleting outreach:', err);
      alert('Failed to delete outreach');
    }
  };

  const handleCreateABTest = async (e) => {
    e.preventDefault();
    if (!abTestForm.name || !abTestForm.templateA.message || !abTestForm.templateB.message) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const token = await getToken();
      setAuthToken(token);
      await createABTest(campaign._id, abTestForm);
      
      setAbTestForm({
        name: '',
        templateA: { subject: '', message: '' },
        templateB: { subject: '', message: '' }
      });
      setShowABTestForm(false);
      await fetchCampaignData();
    } catch (err) {
      console.error('Error creating A/B test:', err);
      alert('Failed to create A/B test');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteABTest = async (testId) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const result = await completeABTest(campaign._id, testId);
      alert(result.data.analysis.recommendation);
      await fetchCampaignData();
    } catch (err) {
      console.error('Error completing A/B test:', err);
      alert('Failed to complete A/B test');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-gray-100 text-gray-700',
      'Sent': 'bg-blue-100 text-blue-700',
      'Responded': 'bg-green-100 text-green-700',
      'Meeting Scheduled': 'bg-purple-100 text-purple-700',
      'Connected': 'bg-teal-100 text-teal-700',
      'No Response': 'bg-yellow-100 text-yellow-700',
      'Declined': 'bg-red-100 text-red-700'
    };
    return colors[status] || colors['Pending'];
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'LinkedIn': return <Linkedin className="w-4 h-4" />;
      case 'Email': return <Mail className="w-4 h-4" />;
      case 'Phone': return <Phone className="w-4 h-4" />;
      case 'In-person': return <Users className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl p-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'outreach', label: 'Outreach', icon: MessageCircle },
    { id: 'ab-testing', label: 'A/B Testing', icon: Beaker },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">{campaign.name}</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                campaign.status === 'Active' ? 'bg-green-100 text-green-700' :
                campaign.status === 'Paused' ? 'bg-yellow-100 text-yellow-700' :
                campaign.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {campaign.status}
              </span>
            </div>
            {campaign.description && (
              <p className="text-sm text-gray-600">{campaign.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status Actions */}
            {campaign.status === 'Planning' && (
              <Button size="small" onClick={() => handleStatusChange('Active')}>
                <Play className="w-4 h-4 mr-1" /> Start
              </Button>
            )}
            {campaign.status === 'Active' && (
              <Button size="small" variant="outline" onClick={() => handleStatusChange('Paused')}>
                <Pause className="w-4 h-4 mr-1" /> Pause
              </Button>
            )}
            {campaign.status === 'Paused' && (
              <Button size="small" onClick={() => handleStatusChange('Active')}>
                <Play className="w-4 h-4 mr-1" /> Resume
              </Button>
            )}
            {['Active', 'Paused'].includes(campaign.status) && (
              <Button size="small" variant="tertiary" onClick={() => handleStatusChange('Completed')}>
                <CheckCircle className="w-4 h-4 mr-1" /> Complete
              </Button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 border-b">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{campaign.metrics?.totalOutreach || 0}</div>
            <div className="text-xs text-gray-500">Outreach</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{campaign.metrics?.sent || 0}</div>
            <div className="text-xs text-gray-500">Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{campaign.metrics?.responses || 0}</div>
            <div className="text-xs text-gray-500">Responses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{campaign.metrics?.meetings || 0}</div>
            <div className="text-xs text-gray-500">Meetings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-600">{campaign.metrics?.responseRate || 0}%</div>
            <div className="text-xs text-gray-500">Response Rate</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#777C6D] text-[#777C6D]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Outreach Tab */}
          {activeTab === 'outreach' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Outreach Tracking</h3>
                <Button size="small" onClick={() => setShowOutreachForm(!showOutreachForm)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Outreach
                </Button>
              </div>

              {/* Add Outreach Form */}
              {showOutreachForm && (
                <Card variant="outlined" className="p-4">
                  <form onSubmit={handleAddOutreach} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Name *
                        </label>
                        <input
                          type="text"
                          value={outreachForm.contactName}
                          onChange={(e) => setOutreachForm(prev => ({ ...prev, contactName: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company
                        </label>
                        <input
                          type="text"
                          value={outreachForm.contactCompany}
                          onChange={(e) => setOutreachForm(prev => ({ ...prev, contactCompany: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role
                        </label>
                        <input
                          type="text"
                          value={outreachForm.contactRole}
                          onChange={(e) => setOutreachForm(prev => ({ ...prev, contactRole: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Method
                        </label>
                        <select
                          value={outreachForm.method}
                          onChange={(e) => setOutreachForm(prev => ({ ...prev, method: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        >
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Email">Email</option>
                          <option value="Phone">Phone</option>
                          <option value="In-person">In-person</option>
                          <option value="Event">Event</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={outreachForm.status}
                          onChange={(e) => setOutreachForm(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Sent">Sent</option>
                          <option value="Responded">Responded</option>
                          <option value="Meeting Scheduled">Meeting Scheduled</option>
                          <option value="Connected">Connected</option>
                          <option value="No Response">No Response</option>
                          <option value="Declined">Declined</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          A/B Template
                        </label>
                        <select
                          value={outreachForm.messageTemplate}
                          onChange={(e) => setOutreachForm(prev => ({ ...prev, messageTemplate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        >
                          <option value="Control">Control (No test)</option>
                          <option value="A">Template A</option>
                          <option value="B">Template B</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={outreachForm.notes}
                        onChange={(e) => setOutreachForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowOutreachForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" isLoading={saving}>
                        Add Outreach
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Outreach List */}
              {campaign.outreaches?.length === 0 ? (
                <Card variant="outlined" className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No outreach tracked yet</p>
                  <p className="text-sm text-gray-500">Add your first outreach to start tracking</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {campaign.outreaches?.map((outreach) => (
                    <Card key={outreach._id} variant="outlined" className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getMethodIcon(outreach.method)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{outreach.contactName}</div>
                            {(outreach.contactCompany || outreach.contactRole) && (
                              <div className="text-sm text-gray-600">
                                {outreach.contactRole && <span>{outreach.contactRole}</span>}
                                {outreach.contactRole && outreach.contactCompany && <span> at </span>}
                                {outreach.contactCompany && <span className="font-medium">{outreach.contactCompany}</span>}
                              </div>
                            )}
                            {outreach.notes && (
                              <p className="text-sm text-gray-500 mt-1">{outreach.notes}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(outreach.status)}`}>
                            {outreach.status}
                          </span>
                          
                          {/* Quick Status Update */}
                          <select
                            value={outreach.status}
                            onChange={(e) => handleUpdateOutreachStatus(outreach._id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Sent">Sent</option>
                            <option value="Responded">Responded</option>
                            <option value="Meeting Scheduled">Meeting Scheduled</option>
                            <option value="Connected">Connected</option>
                            <option value="No Response">No Response</option>
                            <option value="Declined">Declined</option>
                          </select>
                          
                          <button
                            onClick={() => handleDeleteOutreach(outreach._id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          {getMethodIcon(outreach.method)}
                          {outreach.method}
                        </span>
                        {outreach.messageTemplate !== 'Control' && (
                          <span className="flex items-center gap-1">
                            <Beaker className="w-3 h-3" />
                            Template {outreach.messageTemplate}
                          </span>
                        )}
                        {outreach.sentAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Sent: {new Date(outreach.sentAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* A/B Testing Tab */}
          {activeTab === 'ab-testing' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">A/B Testing</h3>
                <Button size="small" onClick={() => setShowABTestForm(!showABTestForm)}>
                  <Plus className="w-4 h-4 mr-1" /> New A/B Test
                </Button>
              </div>

              <p className="text-sm text-gray-600">
                Test different outreach messages to see which performs better. When adding outreach,
                select Template A or B to track performance.
              </p>

              {/* Create A/B Test Form */}
              {showABTestForm && (
                <Card variant="outlined" className="p-4">
                  <form onSubmit={handleCreateABTest} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Test Name *
                      </label>
                      <input
                        type="text"
                        value={abTestForm.name}
                        onChange={(e) => setABTestForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Connection Request Test"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-700">Template A</h4>
                        <input
                          type="text"
                          value={abTestForm.templateA.subject}
                          onChange={(e) => setABTestForm(prev => ({
                            ...prev,
                            templateA: { ...prev.templateA, subject: e.target.value }
                          }))}
                          placeholder="Subject (optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        />
                        <textarea
                          value={abTestForm.templateA.message}
                          onChange={(e) => setABTestForm(prev => ({
                            ...prev,
                            templateA: { ...prev.templateA, message: e.target.value }
                          }))}
                          placeholder="Message content *"
                          required
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-700">Template B</h4>
                        <input
                          type="text"
                          value={abTestForm.templateB.subject}
                          onChange={(e) => setABTestForm(prev => ({
                            ...prev,
                            templateB: { ...prev.templateB, subject: e.target.value }
                          }))}
                          placeholder="Subject (optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        />
                        <textarea
                          value={abTestForm.templateB.message}
                          onChange={(e) => setABTestForm(prev => ({
                            ...prev,
                            templateB: { ...prev.templateB, message: e.target.value }
                          }))}
                          placeholder="Message content *"
                          required
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#777C6D] focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowABTestForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" isLoading={saving}>
                        Create Test
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* A/B Tests List */}
              {campaign.abTests?.length === 0 ? (
                <Card variant="outlined" className="p-8 text-center">
                  <Beaker className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No A/B tests yet</p>
                  <p className="text-sm text-gray-500">Create a test to optimize your outreach</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {campaign.abTests?.map((test) => (
                    <Card key={test._id} variant="outlined" className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{test.name}</h4>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                            test.status === 'Active' ? 'bg-green-100 text-green-700' :
                            test.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {test.status}
                            {test.winner && test.status === 'Completed' && ` - Winner: Template ${test.winner}`}
                          </span>
                        </div>
                        {test.status === 'Active' && (
                          <Button size="small" variant="outline" onClick={() => handleCompleteABTest(test._id)}>
                            Complete Test
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded-lg ${test.winner === 'A' ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-blue-700">Template A</span>
                            {test.winner === 'A' && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Winner</span>}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Sent: {test.templateA.sentCount}</div>
                            <div>Responses: {test.templateA.responseCount}</div>
                            <div>Response Rate: {test.templateA.sentCount > 0 
                              ? Math.round((test.templateA.responseCount / test.templateA.sentCount) * 100) 
                              : 0}%</div>
                          </div>
                        </div>
                        
                        <div className={`p-3 rounded-lg ${test.winner === 'B' ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-green-700">Template B</span>
                            {test.winner === 'B' && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Winner</span>}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Sent: {test.templateB.sentCount}</div>
                            <div>Responses: {test.templateB.responseCount}</div>
                            <div>Response Rate: {test.templateB.sentCount > 0 
                              ? Math.round((test.templateB.responseCount / test.templateB.sentCount) * 100) 
                              : 0}%</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-800">Campaign Analytics</h3>

              {/* Goal Progress */}
              <Card variant="outlined" className="p-4">
                <h4 className="font-medium text-gray-800 mb-4">Goal Progress</h4>
                <div className="space-y-4">
                  {Object.entries(analytics.goalProgress || {}).map(([key, data]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-gray-900">{data.current} / {data.target} ({data.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            data.percentage >= 100 ? 'bg-green-500' :
                            data.percentage >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, data.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* By Method */}
              <Card variant="outlined" className="p-4">
                <h4 className="font-medium text-gray-800 mb-4">Performance by Method</h4>
                <div className="space-y-3">
                  {Object.entries(analytics.byMethod || {}).map(([method, data]) => (
                    <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(method)}
                        <span className="font-medium">{method}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>{data.total} sent</span>
                        <span className="mx-2">•</span>
                        <span>{data.responded} responded</span>
                        <span className="mx-2">•</span>
                        <span className="font-medium text-green-600">
                          {data.total > 0 ? Math.round((data.responded / data.total) * 100) : 0}% rate
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top Companies */}
              {analytics.byCompany?.length > 0 && (
                <Card variant="outlined" className="p-4">
                  <h4 className="font-medium text-gray-800 mb-4">Top Companies</h4>
                  <div className="space-y-2">
                    {analytics.byCompany.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span>{item.company}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.responded}/{item.total} responded
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
