import Card from '../Card';
import { 
  TrendingUp, 
  Target, 
  Users, 
  MessageCircle,
  Award,
  AlertCircle
} from 'lucide-react';

/**
 * Campaign Analytics Panel
 * 
 * Displays overview analytics across all campaigns.
 */
export default function CampaignAnalyticsPanel({ analytics }) {
  if (!analytics) return null;

  const { totals, campaignPerformance, methodPerformance } = analytics;

  return (
    <Card variant="outlined" className="p-6">
      <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Overall Campaign Analytics
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aggregate Stats */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Totals</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{totals?.campaigns || 0}</div>
              <div className="text-xs text-blue-600">Total Campaigns</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{totals?.activeCampaigns || 0}</div>
              <div className="text-xs text-green-600">Active</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{totals?.totalOutreach || 0}</div>
              <div className="text-xs text-purple-600">Total Outreach</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">{totals?.totalResponses || 0}</div>
              <div className="text-xs text-orange-600">Responses</div>
            </div>
            <div className="p-3 bg-teal-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-700">{totals?.totalMeetings || 0}</div>
              <div className="text-xs text-teal-600">Meetings</div>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-700">{totals?.overallResponseRate || 0}%</div>
              <div className="text-xs text-indigo-600">Response Rate</div>
            </div>
          </div>
        </div>

        {/* Top Performing Campaigns */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide flex items-center gap-2">
            <Award className="w-4 h-4" />
            Top Campaigns
          </h4>
          {campaignPerformance?.length > 0 ? (
            <div className="space-y-2">
              {campaignPerformance.slice(0, 5).map((campaign, idx) => (
                <div 
                  key={campaign._id} 
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      idx === 2 ? 'bg-orange-300 text-orange-900' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-medium text-sm text-gray-900 truncate max-w-[150px]">
                        {campaign.name}
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        campaign.status === 'Active' ? 'bg-green-100 text-green-700' :
                        campaign.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">{campaign.responseRate}%</div>
                    <div className="text-xs text-gray-500">response rate</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No campaign data yet</p>
            </div>
          )}
        </div>

        {/* Method Performance */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Method Performance
          </h4>
          {methodPerformance?.length > 0 ? (
            <div className="space-y-3">
              {methodPerformance.map((method, idx) => (
                <div key={method.method}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{method.method}</span>
                    <span className="text-gray-600">
                      {method.responses}/{method.total} ({method.responseRate}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        idx === 0 ? 'bg-green-500' :
                        idx === 1 ? 'bg-blue-500' :
                        idx === 2 ? 'bg-purple-500' :
                        'bg-gray-400'
                      }`}
                      style={{ width: `${method.responseRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No outreach data yet</p>
            </div>
          )}
          
          {methodPerformance?.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-700">
                  <strong>{methodPerformance[0]?.method}</strong> is your most effective 
                  outreach method with a {methodPerformance[0]?.responseRate}% response rate.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
