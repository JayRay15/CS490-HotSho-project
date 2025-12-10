import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getOverdueApplications, markOverdueAlertSent } from '../api/responseTimePrediction';

/**
 * OverdueApplicationsAlert Component
 * Shows notification badge/panel for overdue applications
 */
const OverdueApplicationsAlert = ({ showPanel = false }) => {
  const navigate = useNavigate();
  const [overdueApps, setOverdueApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    loadOverdueApps();
    // Check for overdue apps periodically (every 5 minutes)
    const interval = setInterval(loadOverdueApps, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadOverdueApps = async () => {
    try {
      setLoading(true);
      const response = await getOverdueApplications();
      setOverdueApps(response.overdueApplications || []);
    } catch (err) {
      console.error('Error loading overdue applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (app) => {
    try {
      await markOverdueAlertSent(app.job?._id || app.predictionId);
      setDismissed(prev => new Set([...prev, app.predictionId]));
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const visibleApps = overdueApps.filter(app => !dismissed.has(app.predictionId));
  const overdueCount = visibleApps.length;

  if (loading || overdueCount === 0) {
    return null;
  }

  // Simple badge view (for navbar)
  if (!showPanel) {
    return (
      <button
        onClick={() => navigate('/response-time')}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title={`${overdueCount} overdue application${overdueCount !== 1 ? 's' : ''}`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {overdueCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {overdueCount > 9 ? '9+' : overdueCount}
          </span>
        )}
      </button>
    );
  }

  // Full panel view
  return (
    <div className="relative">
      {/* Alert Banner */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-red-800 font-medium">
              {overdueCount} Application{overdueCount !== 1 ? 's' : ''} Overdue
            </h3>
            <p className="text-red-700 text-sm mt-1">
              Some employers haven&apos;t responded within the expected timeframe.
            </p>
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="text-red-600 text-sm font-medium mt-2 hover:text-red-800"
            >
              {panelOpen ? 'Hide Details ▲' : 'View Details ▼'}
            </button>
          </div>
          <button
            onClick={() => navigate('/response-time')}
            className="ml-3 px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            View All
          </button>
        </div>

        {/* Expanded Panel */}
        {panelOpen && (
          <div className="mt-4 space-y-3">
            {visibleApps.map((app) => (
              <div 
                key={app.predictionId}
                className="bg-white rounded-lg border border-red-200 p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {app.job?.title || 'Unknown Position'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {app.companyName}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {app.daysOverdue} day{app.daysOverdue !== 1 ? 's' : ''} overdue • 
                    Expected within {app.predictedMax} days
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/response-time')}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Follow Up
                  </button>
                  <button
                    onClick={() => handleDismiss(app)}
                    className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
                    title="Dismiss alert"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

OverdueApplicationsAlert.propTypes = {
  showPanel: PropTypes.bool
};

export default OverdueApplicationsAlert;
