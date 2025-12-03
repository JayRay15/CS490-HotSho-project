import React, { useState } from 'react';
import {
  Search, Users, Building2, ArrowRight, Target, User, Network,
  GraduationCap, Briefcase, MessageSquare, ChevronDown, ChevronUp,
  AlertCircle, Loader2, Sparkles, Link2, ExternalLink
} from 'lucide-react';
import {
  findConnectionPaths,
  PATH_TYPE_LABELS,
  STRENGTH_COLORS,
  DEGREE_LABELS
} from '../../api/connectionPaths';

const ConnectionPathFinder = ({ onSelectContact }) => {
  const [targetCompany, setTargetCompany] = useState('');
  const [targetPerson, setTargetPerson] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [expandedPaths, setExpandedPaths] = useState({});

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!targetCompany && !targetPerson) {
      setError('Please enter a company name or person name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await findConnectionPaths({
        targetCompany: targetCompany || undefined,
        targetPerson: targetPerson || undefined,
        targetRole: targetRole || undefined
      });

      setResults(response.data);
    } catch (err) {
      console.error('Error finding connection paths:', err);
      setError('Failed to find connection paths. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePathExpand = (index) => {
    setExpandedPaths(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'you': return <User className="h-4 w-4 text-blue-600" />;
      case 'contact': return <Users className="h-4 w-4 text-green-600" />;
      case 'network': return <Network className="h-4 w-4 text-purple-600" />;
      case 'potential': return <Target className="h-4 w-4 text-orange-600" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getPathTypeIcon = (pathType) => {
    switch (pathType) {
      case 'direct': return <Link2 className="h-5 w-5 text-green-600" />;
      case 'indirect': return <Users className="h-5 w-5 text-blue-600" />;
      case 'alumni_network': return <GraduationCap className="h-5 w-5 text-purple-600" />;
      case 'industry_group': return <Briefcase className="h-5 w-5 text-orange-600" />;
      default: return <Network className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-600" />
          Find Connection Paths
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Discover how you can reach people at your target companies
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="p-4 border-b bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="h-4 w-4 inline mr-1" />
              Target Company
            </label>
            <input
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              placeholder="e.g., Google, Microsoft"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="h-4 w-4 inline mr-1" />
              Target Person (Optional)
            </label>
            <input
              type="text"
              value={targetPerson}
              onChange={(e) => setTargetPerson(e.target.value)}
              placeholder="e.g., John Smith"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Briefcase className="h-4 w-4 inline mr-1" />
              Target Role (Optional)
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Engineering Manager"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading || (!targetCompany && !targetPerson)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Find Paths
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="p-4">
          {/* Summary */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{results.summary.directConnections}</p>
              <p className="text-sm text-green-700">Direct Connections</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{results.summary.indirectPaths}</p>
              <p className="text-sm text-blue-700">Indirect Paths</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{results.pathsFound}</p>
              <p className="text-sm text-purple-700">Total Paths Found</p>
            </div>
          </div>

          {/* Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Recommendations
              </h4>
              <div className="space-y-2">
                {results.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      rec.priority === 'high' ? 'bg-green-50 border border-green-200' :
                      rec.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{rec.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{rec.title}</p>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paths */}
          {results.paths && results.paths.length > 0 ? (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Connection Paths</h4>
              <div className="space-y-3">
                {results.paths.map((path, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Path Header */}
                    <div
                      className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer"
                      onClick={() => togglePathExpand(idx)}
                    >
                      <div className="flex items-center gap-3">
                        {getPathTypeIcon(path.pathType)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {PATH_TYPE_LABELS[path.pathType] || path.pathType}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STRENGTH_COLORS[path.strength]}`}>
                              {path.strength} connection
                            </span>
                            <span className="text-xs text-gray-500">
                              {DEGREE_LABELS[path.degree] || `${path.degree} degrees`}
                            </span>
                            {path.probability && (
                              <span className="text-xs text-gray-500">
                                • {Math.round(path.probability * 100)}% probability
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {expandedPaths[idx] ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    {/* Expanded Content */}
                    {expandedPaths[idx] && (
                      <div className="p-4 border-t">
                        {/* Path Visualization */}
                        <div className="flex items-center gap-2 flex-wrap mb-4">
                          {path.path.map((node, nodeIdx) => (
                            <React.Fragment key={nodeIdx}>
                              <div
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                  node.type === 'you' ? 'bg-blue-100' :
                                  node.type === 'contact' ? 'bg-green-100' :
                                  node.type === 'network' ? 'bg-purple-100' :
                                  'bg-orange-100'
                                }`}
                              >
                                {getNodeIcon(node.type)}
                                <div>
                                  <p className="text-sm font-medium">{node.name}</p>
                                  {node.company && (
                                    <p className="text-xs text-gray-500">{node.company}</p>
                                  )}
                                </div>
                              </div>
                              {nodeIdx < path.path.length - 1 && (
                                <ArrowRight className="h-5 w-5 text-gray-400" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>

                        {/* Recommendation */}
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <MessageSquare className="h-4 w-4 inline mr-1" />
                            {path.recommendation}
                          </p>
                        </div>

                        {/* Action Items */}
                        {path.actionItems && path.actionItems.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Suggested Actions:</p>
                            <ul className="space-y-1">
                              {path.actionItems.map((action, actionIdx) => (
                                <li key={actionIdx} className="flex items-start gap-2 text-sm text-gray-600">
                                  <span className="text-green-500 mt-1">•</span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Contact Action */}
                        {path.path.some(n => n.type === 'contact' && n.id) && (
                          <button
                            onClick={() => {
                              const contactNode = path.path.find(n => n.type === 'contact' && n.id);
                              if (contactNode && onSelectContact) {
                                onSelectContact(contactNode.id);
                              }
                            }}
                            className="mt-4 flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Contact Details
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Network className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No connection paths found</p>
              <p className="text-sm">Try different search terms or add more contacts</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !loading && (
        <div className="p-8 text-center text-gray-500">
          <Network className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>Enter a company or person name to find connection paths</p>
          <p className="text-sm mt-1">We'll show you the best ways to reach your target</p>
        </div>
      )}
    </div>
  );
};

export default ConnectionPathFinder;
