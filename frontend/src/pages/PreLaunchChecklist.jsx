import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import * as checklistApi from '../api/preLaunchChecklist';

// Default checklist structure (used as fallback while loading)
const defaultChecklist = {
  criticalBugs: {
    title: '1. Critical Bug Fixes',
    description: 'All P0/P1 bugs must be resolved before launch',
    items: [
      { id: 'bug1', label: 'All P0/P1 bugs resolved', completed: false },
      { id: 'bug2', label: 'No critical errors in Sentry', completed: false },
      { id: 'bug3', label: 'User flow testing completed', completed: false },
      { id: 'bug4', label: 'Edge case handling verified', completed: false },
    ]
  },
  testing: {
    title: '2. Testing Verification',
    description: 'All tests must pass with adequate coverage',
    items: [
      { id: 'test1', label: 'Backend unit tests passing (80%+ coverage)', completed: false },
      { id: 'test2', label: 'Frontend unit tests passing (80%+ coverage)', completed: false },
      { id: 'test3', label: 'Integration tests passing', completed: false },
      { id: 'test4', label: 'E2E tests passing', completed: false },
      { id: 'test5', label: 'Performance tests completed', completed: false },
    ]
  },
  deployment: {
    title: '3. Production Deployment',
    description: 'Deployment configuration verified and stable',
    items: [
      { id: 'deploy1', label: 'Frontend deployed to Vercel', completed: false },
      { id: 'deploy2', label: 'Backend deployed to Render/Railway', completed: false },
      { id: 'deploy3', label: 'Database configured with production credentials', completed: false },
      { id: 'deploy4', label: 'Environment variables set correctly', completed: false },
      { id: 'deploy5', label: 'SSL/HTTPS enabled', completed: false },
      { id: 'deploy6', label: 'Health check endpoints responding', completed: false },
    ]
  },
  monitoring: {
    title: '4. Monitoring & Alerting',
    description: 'Monitoring and alerting systems configured',
    items: [
      { id: 'mon1', label: 'Sentry error tracking configured', completed: false },
      { id: 'mon2', label: 'Request/Response logging enabled', completed: false },
      { id: 'mon3', label: 'Health check endpoints implemented', completed: false },
      { id: 'mon4', label: 'System monitoring dashboard available', completed: false },
      { id: 'mon5', label: 'Error rate threshold alerts configured', completed: false },
      { id: 'mon6', label: 'Uptime monitoring active', completed: false },
    ]
  },
  security: {
    title: '5. Security Review',
    description: 'Security measures implemented and verified',
    items: [
      { id: 'sec1', label: 'CSRF protection enabled', completed: false },
      { id: 'sec2', label: 'XSS prevention implemented', completed: false },
      { id: 'sec3', label: 'SQL/NoSQL injection prevention verified', completed: false },
      { id: 'sec4', label: 'Secure session management', completed: false },
      { id: 'sec5', label: 'HTTP security headers configured', completed: false },
      { id: 'sec6', label: 'Rate limiting enabled', completed: false },
      { id: 'sec7', label: 'Dependency security audit passed', completed: false },
    ]
  },
  legal: {
    title: '6. Legal Documents',
    description: 'Terms of Service and Privacy Policy finalized',
    items: [
      { id: 'legal1', label: 'Terms of Service published', completed: false, link: '/terms' },
      { id: 'legal2', label: 'Privacy Policy published', completed: false, link: '/privacy' },
      { id: 'legal3', label: 'Cookie Policy included', completed: false },
      { id: 'legal4', label: 'GDPR compliance reviewed', completed: false },
      { id: 'legal5', label: 'CCPA compliance reviewed', completed: false },
    ]
  },
  marketing: {
    title: '7. Launch Announcement & Marketing',
    description: 'Marketing materials prepared for launch',
    items: [
      { id: 'mkt1', label: 'Launch blog post/announcement prepared', completed: false },
      { id: 'mkt2', label: 'Social media content created', completed: false },
      { id: 'mkt3', label: 'Product screenshots/demo ready', completed: false },
      { id: 'mkt4', label: 'Feature highlights documented', completed: false },
    ]
  },
  support: {
    title: '8. Customer Support Channels',
    description: 'Support infrastructure ready for users',
    items: [
      { id: 'sup1', label: 'Support email configured', completed: false },
      { id: 'sup2', label: 'Help documentation/FAQ created', completed: false },
      { id: 'sup3', label: 'In-app feedback mechanism working', completed: false },
      { id: 'sup4', label: 'Bug reporting process defined', completed: false },
      { id: 'sup5', label: 'Support team trained', completed: false },
      { id: 'sup6', label: 'Escalation procedures documented', completed: false },
    ]
  },
  teamReadiness: {
    title: '9. Team Readiness Review',
    description: 'Team prepared for launch and post-launch support',
    items: [
      { id: 'team1', label: 'All team members briefed on launch plan', completed: false },
      { id: 'team2', label: 'On-call schedule defined', completed: false },
      { id: 'team3', label: 'Communication channels established', completed: false },
      { id: 'team4', label: 'Rollback procedures documented', completed: false },
      { id: 'team5', label: 'Emergency contacts updated', completed: false },
    ]
  },
  postLaunch: {
    title: '10. Post-Launch Support Plan',
    description: 'Support plan documented for after launch',
    items: [
      { id: 'post1', label: 'Post-launch support plan documented', completed: false },
      { id: 'post2', label: 'Incident response playbooks created', completed: false },
      { id: 'post3', label: 'Success metrics defined', completed: false },
      { id: 'post4', label: 'Feedback collection process ready', completed: false },
    ]
  },
};

// Section keys in order
const sectionKeys = ['criticalBugs', 'testing', 'deployment', 'monitoring', 'security', 
                     'legal', 'marketing', 'support', 'teamReadiness', 'postLaunch'];

/**
 * Pre-Launch Checklist page for project managers to track launch readiness
 * State is persisted to database so all admins can see the same checklist state
 */
const PreLaunchChecklist = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  
  const [checklist, setChecklist] = useState(defaultChecklist);
  const [overallProgress, setOverallProgress] = useState(0);
  const [expandedSections, setExpandedSections] = useState({});
  const [adminSignoff, setAdminSignoff] = useState({ signed: false, date: '' });
  const [launchDecision, setLaunchDecision] = useState(null);
  const [lastModifiedBy, setLastModifiedBy] = useState(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Get user's display name
  const getUserName = useCallback(() => {
    if (user) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.primaryEmailAddress?.emailAddress || 'Admin';
    }
    return 'Admin';
  }, [user]);

  // Transform API data to frontend format
  const transformApiData = useCallback((apiData) => {
    if (!apiData) return defaultChecklist;
    
    const transformed = { ...defaultChecklist };
    
    sectionKeys.forEach(key => {
      if (apiData[key]?.items) {
        transformed[key] = {
          ...defaultChecklist[key],
          items: defaultChecklist[key].items.map(defaultItem => {
            const apiItem = apiData[key].items.find(i => i.id === defaultItem.id);
            return apiItem ? { ...defaultItem, completed: apiItem.completed } : defaultItem;
          })
        };
      }
    });
    
    return transformed;
  }, []);

  // Fetch checklist from API
  const fetchChecklist = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = await getToken();
      setAuthToken(token);
      
      const response = await checklistApi.getChecklist();
      
      if (response.success && response.data) {
        const data = response.data;
        setChecklist(transformApiData(data));
        
        if (data.adminSignoff) {
          setAdminSignoff({
            signed: data.adminSignoff.signed || false,
            date: data.adminSignoff.date ? new Date(data.adminSignoff.date).toLocaleDateString() : '',
            signedBy: data.adminSignoff.signedByName || ''
          });
        }
        
        // Only set launch decision if one was actually made (not 'pending')
        if (data.launchDecision?.decision && data.launchDecision.decision !== 'pending') {
          setLaunchDecision(data.launchDecision);
        } else {
          setLaunchDecision(null);
        }
        
        setLastModifiedBy(data.lastModifiedByName || null);
      }
    } catch (err) {
      console.error('Error fetching checklist:', err);
      setError('Failed to load checklist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, transformApiData]);

  // Load checklist on mount
  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  // Calculate overall progress
  useEffect(() => {
    let totalItems = 0;
    let completedItems = 0;

    Object.values(checklist).forEach(section => {
      section.items.forEach(item => {
        totalItems++;
        if (item.completed) completedItems++;
      });
    });

    setOverallProgress(Math.round((completedItems / totalItems) * 100));
  }, [checklist]);

  // Toggle item completion
  const toggleItem = async (sectionKey, itemId) => {
    try {
      setIsSaving(true);
      setError(null);
      
      const token = await getToken();
      setAuthToken(token);
      
      const response = await checklistApi.toggleItem(sectionKey, itemId, getUserName());
      
      if (response.success && response.data) {
        setChecklist(transformApiData(response.data));
        setLastModifiedBy(response.data.lastModifiedByName || getUserName());
      }
    } catch (err) {
      console.error('Error toggling item:', err);
      setError('Failed to update item. Please try again.');
      // Revert optimistic update by refetching
      fetchChecklist();
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Calculate section progress
  const getSectionProgress = (section) => {
    const completed = section.items.filter(item => item.completed).length;
    return {
      completed,
      total: section.items.length,
      percentage: Math.round((completed / section.items.length) * 100)
    };
  };

  // Get status color
  const getStatusColor = (percentage) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Handle admin sign-off
  const handleAdminSignoff = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const token = await getToken();
      setAuthToken(token);
      
      const response = await checklistApi.signOff(getUserName());
      
      if (response.success && response.data) {
        setAdminSignoff({
          signed: response.data.adminSignoff?.signed || true,
          date: new Date().toLocaleDateString(),
          signedBy: getUserName()
        });
        setLastModifiedBy(getUserName());
      }
    } catch (err) {
      console.error('Error signing off:', err);
      setError(err.response?.data?.message || 'Failed to sign off. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle launch decision
  const handleLaunchDecision = async (decision) => {
    const reason = decision === 'no-go' 
      ? window.prompt('Please provide a reason for delaying the launch:') 
      : null;
    
    if (decision === 'no-go' && !reason) {
      return; // User cancelled
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      const token = await getToken();
      setAuthToken(token);
      
      const response = await checklistApi.makeLaunchDecision(decision, reason, getUserName());
      
      if (response.success && response.data) {
        setLaunchDecision(response.data.launchDecision);
        setLastModifiedBy(getUserName());
      }
    } catch (err) {
      console.error('Error making launch decision:', err);
      setError(err.response?.data?.message || 'Failed to make launch decision. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset all checklist progress
  const handleResetChecklist = async () => {
    if (!window.confirm('Are you sure you want to reset all checklist progress? This cannot be undone.')) {
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      const token = await getToken();
      setAuthToken(token);
      
      const response = await checklistApi.resetChecklist(getUserName());
      
      if (response.success && response.data) {
        setChecklist(transformApiData(response.data));
        setAdminSignoff({ signed: false, date: '' });
        setLaunchDecision(null);
        setLastModifiedBy(getUserName());
      }
    } catch (err) {
      console.error('Error resetting checklist:', err);
      setError('Failed to reset checklist. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isReadyToLaunch = overallProgress === 100 && adminSignoff.signed;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Saving Indicator */}
        {isSaving && (
          <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span className="text-sm">Saving...</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pre-Launch Checklist</h1>
              <p className="text-gray-600 mt-1">Track all items before public release</p>
              {lastModifiedBy && (
                <p className="text-xs text-gray-400 mt-1">Last updated by {lastModifiedBy}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleResetChecklist}
                disabled={isSaving}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                title="Reset all progress"
              >
                Reset
              </button>
              <div className="text-right">
                <div className="text-sm text-gray-500">Overall Progress</div>
                <div className="text-2xl font-bold text-gray-900">{overallProgress}%</div>
              </div>
              <div className="w-24 h-24 relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={overallProgress === 100 ? '#10b981' : '#3b82f6'}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${overallProgress * 2.51} 251`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {overallProgress === 100 ? (
                    <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium text-gray-600">{overallProgress}%</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {isReadyToLaunch ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-green-900">Ready for Launch! 🚀</h3>
                <p className="text-sm text-green-700">All checklist items complete and signed off. GO decision approved.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-900">Not Ready for Launch</h3>
                <p className="text-sm text-yellow-700">
                  {overallProgress < 100 
                    ? `${100 - overallProgress}% of checklist items remaining.`
                    : 'All items complete. Waiting for sign-offs.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Checklist Sections */}
        <div className="space-y-4 mb-8">
          {Object.entries(checklist).map(([key, section]) => {
            const progress = getSectionProgress(section);
            const isExpanded = expandedSections[key] ?? true;

            return (
              <div key={key} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(progress.percentage)}`} />
                    <div className="text-left">
                      <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                      <p className="text-sm text-gray-500">{section.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-700">
                        {progress.completed}/{progress.total}
                      </span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(progress.percentage)}`}
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <div className="pt-4 space-y-3">
                      {section.items.map(item => (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 group ${isSaving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleItem(key, item.id)}
                            disabled={isSaving}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className={`flex-1 ${item.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                            {item.label}
                          </span>
                          {item.link && (
                            <Link
                              to={item.link}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View →
                            </Link>
                          )}
                          {item.completed && (
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Admin Sign-Off Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Sign-Off</h2>
          <p className="text-gray-600 mb-6">
            As an admin, review all checklist items above and sign off to confirm readiness for launch.
          </p>

          <div className="max-w-md">
            <div
              className={`p-6 rounded-lg border ${adminSignoff.signed ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900 text-lg">
                  Administrator Approval
                </span>
                {adminSignoff.signed && (
                  <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {adminSignoff.signed ? (
                <div className="text-sm text-green-700">
                  ✅ Signed off on {adminSignoff.date}{adminSignoff.signedBy ? ` by ${adminSignoff.signedBy}` : ''}
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Complete all checklist items (100%) before signing off.
                  </p>
                  <button
                    onClick={handleAdminSignoff}
                    disabled={overallProgress < 100 || isSaving}
                    className={`w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      overallProgress === 100 && !isSaving
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {overallProgress === 100 ? 'Sign Off as Admin' : `Complete checklist first (${overallProgress}%)`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Go/No-Go Decision */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Go/No-Go Decision</h2>
          
          {launchDecision?.decision && (launchDecision.decision === 'go' || launchDecision.decision === 'no-go') ? (
            <div className={`p-4 rounded-lg ${launchDecision.decision === 'go' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{launchDecision.decision === 'go' ? '🚀' : '⏸️'}</span>
                <div>
                  <h3 className={`font-semibold ${launchDecision.decision === 'go' ? 'text-green-900' : 'text-red-900'}`}>
                    {launchDecision.decision === 'go' ? 'Launch Approved!' : 'Launch Delayed'}
                  </h3>
                  <p className={`text-sm ${launchDecision.decision === 'go' ? 'text-green-700' : 'text-red-700'}`}>
                    Decided by {launchDecision.decidedByName} on {new Date(launchDecision.decidedAt).toLocaleDateString()}
                  </p>
                  {launchDecision.reason && (
                    <p className="text-sm text-gray-600 mt-1">Reason: {launchDecision.reason}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => handleLaunchDecision('go')}
                  disabled={!isReadyToLaunch || isSaving}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold text-lg transition-colors ${
                    isReadyToLaunch && !isSaving
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  🚀 GO - Launch Approved
                </button>
                <button
                  onClick={() => handleLaunchDecision('no-go')}
                  disabled={isSaving}
                  className="flex-1 py-3 px-6 rounded-lg font-semibold text-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  ⏸️ NO-GO - Delay Launch
                </button>
              </div>

              {!isReadyToLaunch && (
                <p className="mt-4 text-sm text-gray-500 text-center">
                  Complete all checklist items and obtain admin sign-off to enable GO decision.
                </p>
              )}
            </>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Documentation Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/terms"
              className="text-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm text-gray-700">Terms of Service</span>
            </a>
            <a
              href="/privacy"
              className="text-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm text-gray-700">Privacy Policy</span>
            </a>
            <a
              href="/admin/system-monitoring"
              className="text-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm text-gray-700">System Monitoring</span>
            </a>
            <a
              href="/admin/api-monitoring"
              className="text-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm text-gray-700">API Monitoring</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreLaunchChecklist;
