import { useState, useEffect } from 'react';
import { PieChart, TrendingUp, Clock, AlertTriangle, CheckCircle, Target, Mail } from 'lucide-react';
import { getStatusStatistics, formatStatus } from '../api/applicationStatus';

const StatusStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await getStatusStatistics();
      setStats(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-600" size={24} />
          <div>
            <p className="text-red-800 font-medium">Failed to load statistics</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Applications',
      value: stats.totalApplications,
      icon: Target,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Interview Rate',
      value: `${stats.conversionRates.toInterview.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      label: 'Offer Rate',
      value: `${stats.conversionRates.toOffer.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Avg Response Time',
      value: `${Math.round(stats.averageResponseTime)} days`,
      icon: Clock,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <PieChart className="text-indigo-600" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Application Statistics</h2>
          <p className="text-sm text-gray-600 mt-1">Track your job search progress and performance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bgColor} border-2 ${card.borderColor} rounded-xl p-6 hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center justify-between mb-4">
              <card.icon className={card.iconColor} size={28} />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
            <p className="text-sm font-medium text-gray-600">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart size={20} />
          Status Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.statusBreakdown.map((item) => {
            const statusInfo = formatStatus(item._id);
            const percentage = ((item.count / stats.totalApplications) * 100).toFixed(1);
            
            return (
              <div
                key={item._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${
                    statusInfo.color === 'green' ? 'bg-green-500' :
                    statusInfo.color === 'blue' ? 'bg-blue-500' :
                    statusInfo.color === 'yellow' ? 'bg-yellow-500' :
                    statusInfo.color === 'red' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {statusInfo.icon} {statusInfo.label}
                    </p>
                    <p className="text-xs text-gray-500">{percentage}%</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-900">{item.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stalled Applications Alert */}
      {stats.stalledApplications && stats.stalledApplications.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Stalled Applications ({stats.stalledApplications.length})
              </h3>
              <p className="text-sm text-yellow-800 mb-4">
                These applications haven't been updated in 14+ days. Consider following up or updating their status.
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {stats.stalledApplications.map((app) => {
                  const statusInfo = formatStatus(app.currentStatus);
                  const daysSince = Math.floor(
                    (new Date() - new Date(app.lastStatusChange)) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <div
                      key={app._id}
                      className="bg-white p-4 rounded-lg border border-yellow-200 hover:border-yellow-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {app.jobId?.title || 'Unknown Position'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {app.jobId?.company || 'Unknown Company'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                              statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {statusInfo.icon} {statusInfo.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              <Clock size={12} className="inline mr-1" />
                              {daysSince} days ago
                            </span>
                          </div>
                        </div>
                        {app.nextAction && (
                          <div className="flex items-start gap-1 text-xs text-gray-600 bg-blue-50 px-3 py-1 rounded-lg">
                            <Mail size={12} className="mt-0.5 flex-shrink-0" />
                            <span>{app.nextAction}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Rates Detail */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="text-blue-600" size={24} />
            <h4 className="font-semibold text-gray-900">Interview Conversion</h4>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-2">
            {stats.conversionRates.toInterview.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">
            Applications reaching interview stage
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="text-green-600" size={24} />
            <h4 className="font-semibold text-gray-900">Offer Conversion</h4>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-2">
            {stats.conversionRates.toOffer.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">
            Applications resulting in offers
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Target className="text-purple-600" size={24} />
            <h4 className="font-semibold text-gray-900">Acceptance Rate</h4>
          </div>
          <p className="text-3xl font-bold text-purple-600 mb-2">
            {stats.conversionRates.accepted.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">
            Offers accepted
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatusStatistics;
