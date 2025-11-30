import { useState } from 'react';
import Card from '../Card';
import Button from '../Button';
import { 
  Target, 
  MoreVertical, 
  Play, 
  Pause, 
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Users,
  MessageCircle,
  Calendar as CalendarIcon
} from 'lucide-react';

/**
 * Campaign Card Component
 * 
 * Displays a single campaign with its key metrics and actions.
 */
export default function CampaignCard({ campaign, onView, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      'Planning': 'bg-gray-100 text-gray-700',
      'Active': 'bg-green-100 text-green-700',
      'Paused': 'bg-yellow-100 text-yellow-700',
      'Completed': 'bg-blue-100 text-blue-700',
      'Archived': 'bg-gray-100 text-gray-500'
    };
    return colors[status] || colors['Planning'];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <Play className="w-3 h-3" />;
      case 'Paused': return <Pause className="w-3 h-3" />;
      case 'Completed': return <CheckCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getCampaignTypeIcon = (type) => {
    switch (type) {
      case 'Company Targeting': return '🏢';
      case 'Industry Networking': return '🌐';
      case 'Role-based': return '💼';
      case 'Event Follow-up': return '📅';
      case 'Alumni Outreach': return '🎓';
      default: return '🎯';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const progressPercentage = campaign.progress || 0;
  const healthScore = campaign.healthScore || 0;

  const getHealthColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card variant="outlined" className="p-5 relative hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{getCampaignTypeIcon(campaign.campaignType)}</div>
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{campaign.name}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(campaign.status)}`}>
              {getStatusIcon(campaign.status)}
              {campaign.status}
            </span>
          </div>
        </div>
        
        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => { setShowMenu(false); onView(campaign); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={() => { setShowMenu(false); onEdit(campaign); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => { setShowMenu(false); onDelete(campaign._id); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {campaign.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{campaign.description}</p>
      )}

      {/* Targets */}
      <div className="flex flex-wrap gap-1 mb-4">
        {campaign.targetCompanies?.slice(0, 3).map((company, idx) => (
          <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
            {company}
          </span>
        ))}
        {campaign.targetCompanies?.length > 3 && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
            +{campaign.targetCompanies.length - 3} more
          </span>
        )}
        {campaign.targetIndustries?.slice(0, 2).map((industry, idx) => (
          <span key={`ind-${idx}`} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
            {industry}
          </span>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#777C6D] rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center">
            <MessageCircle className="w-3 h-3 text-gray-400 mr-1" />
            <span className="text-lg font-semibold text-gray-900">{campaign.metrics?.totalOutreach || 0}</span>
          </div>
          <div className="text-xs text-gray-500">Outreach</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center">
            <Users className="w-3 h-3 text-gray-400 mr-1" />
            <span className="text-lg font-semibold text-gray-900">{campaign.metrics?.responses || 0}</span>
          </div>
          <div className="text-xs text-gray-500">Responses</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center">
            <CalendarIcon className="w-3 h-3 text-gray-400 mr-1" />
            <span className="text-lg font-semibold text-gray-900">{campaign.metrics?.meetings || 0}</span>
          </div>
          <div className="text-xs text-gray-500">Meetings</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center">
            <TrendingUp className="w-3 h-3 text-gray-400 mr-1" />
            <span className={`text-lg font-semibold ${getHealthColor(healthScore)}`}>{healthScore}%</span>
          </div>
          <div className="text-xs text-gray-500">Health</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {campaign.daysRemaining !== null && campaign.daysRemaining !== undefined ? (
            campaign.daysRemaining > 0 ? (
              <span>{campaign.daysRemaining} days left</span>
            ) : (
              <span className="text-red-600">Campaign ended</span>
            )
          ) : (
            <span>Started {formatDate(campaign.startDate)}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="small"
          onClick={() => onView(campaign)}
          className="text-sm"
        >
          View Details →
        </Button>
      </div>
    </Card>
  );
}
