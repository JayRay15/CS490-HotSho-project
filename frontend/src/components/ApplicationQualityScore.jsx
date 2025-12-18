import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  Award,
  AlertCircle,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import Button from './Button';
import Card from './Card';
import { scoreApplicationPackage } from '../api/applications';

/**
 * ApplicationQualityScore Component
 * UC-122: Application Package Quality Scoring
 * 
 * Displays AI-powered quality analysis for job application packages
 */
const ApplicationQualityScore = ({ 
  jobId, 
  resumeId, 
  coverLetterId, 
  onScoreUpdate 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    categories: false,
    keywords: false,
    skills: false,
    suggestions: true,
    quickWins: true
  });

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await scoreApplicationPackage({
        jobId,
        resumeId,
        coverLetterId
      });
      
      setAnalysis(result.data);
      onScoreUpdate?.(result.data);
    } catch (err) {
      console.error('Failed to analyze application:', err);
      setError(err.response?.data?.message || 'Failed to analyze application package');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100 border-green-300';
    if (score >= 70) return 'bg-blue-100 border-blue-300';
    if (score >= 50) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  const getImportanceBadge = (importance) => {
    const colors = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-700'
    };
    return colors[importance] || colors.medium;
  };

  const getImpactBadge = (impact) => {
    const colors = {
      high: 'bg-green-100 text-green-700',
      medium: 'bg-blue-100 text-blue-700',
      low: 'bg-gray-100 text-gray-700'
    };
    return colors[impact] || colors.medium;
  };

  // Render the initial state - prompt to analyze
  if (!analysis && !loading) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <div className="text-center py-6">
          <Sparkles className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI-Powered Quality Score
          </h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            Get an instant analysis of your application package with personalized improvement suggestions.
          </p>
          <Button 
            variant="primary" 
            onClick={handleAnalyze}
            className="bg-gray-800 hover:bg-gray-900 text-white"
          >
            <Target className="w-4 h-4 mr-2" />
            Analyze Application Package
          </Button>
        </div>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your application package...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <div className="text-center py-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 mb-4">{error}</p>
          <Button variant="outline" onClick={handleAnalyze}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  const qa = analysis?.qualityAnalysis;
  if (!qa) return null;

  return (
    <div className="space-y-4">
      {/* Main Score Card */}
      <Card className={`${getScoreBgColor(qa.overallScore)} border-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold ${getScoreColor(qa.overallScore)}`}>
              {qa.overallScore}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Quality Score</h3>
                {qa.readyToSubmit ? (
                  <span className="px-2 py-1 text-xs font-medium bg-green-200 text-green-800 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Ready to Submit
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-200 text-yellow-800 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Needs Improvement
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{qa.readinessMessage}</p>
            </div>
          </div>
          <Button variant="ghost" size="small" onClick={handleAnalyze}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Re-analyze
          </Button>
        </div>

        {/* Historical Comparison */}
        {qa.comparisonToAverage && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${qa.comparisonToAverage.difference >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className="text-sm text-gray-700">{qa.comparisonToAverage.message}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Category Scores */}
      <Card>
        <button 
          className="w-full flex items-center justify-between"
          onClick={() => toggleSection('categories')}
        >
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            Category Breakdown
          </h4>
          {expandedSections.categories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.categories && qa.categoryScores && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Object.entries(qa.categoryScores).map(([category, score]) => (
              <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={`font-semibold ${getScoreColor(score)}`}>{score}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Wins */}
      {qa.quickWins && qa.quickWins.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <button 
            className="w-full flex items-center justify-between"
            onClick={() => toggleSection('quickWins')}
          >
            <h4 className="font-semibold text-green-800 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quick Wins ({qa.quickWins.length})
            </h4>
            {expandedSections.quickWins ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expandedSections.quickWins && (
            <div className="mt-3 space-y-2">
              {qa.quickWins.map((win, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-green-100">
                  <span className="text-sm text-gray-700">{win.action}</span>
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                    +{win.expectedScoreIncrease} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Suggestions */}
      {qa.suggestions && qa.suggestions.length > 0 && (
        <Card>
          <button 
            className="w-full flex items-center justify-between"
            onClick={() => toggleSection('suggestions')}
          >
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              Improvement Suggestions ({qa.suggestions.length})
            </h4>
            {expandedSections.suggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expandedSections.suggestions && (
            <div className="mt-3 space-y-3">
              {qa.suggestions.slice(0, 5).map((suggestion, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-600">#{suggestion.priority}</span>
                        <span className={`px-2 py-0.5 text-xs rounded ${getImpactBadge(suggestion.impact)}`}>
                          {suggestion.impact} impact
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                          {suggestion.effort} effort
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{suggestion.suggestion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Missing Keywords */}
      {qa.missingKeywords && qa.missingKeywords.length > 0 && (
        <Card>
          <button 
            className="w-full flex items-center justify-between"
            onClick={() => toggleSection('keywords')}
          >
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              Missing Keywords ({qa.missingKeywords.length})
            </h4>
            {expandedSections.keywords ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expandedSections.keywords && (
            <div className="mt-3 space-y-2">
              {qa.missingKeywords.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <div>
                    <span className="font-medium text-gray-800">{item.keyword}</span>
                    {item.context && (
                      <span className="text-xs text-gray-500 ml-2">→ {item.context}</span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded ${getImportanceBadge(item.importance)}`}>
                    {item.importance}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Missing Skills */}
      {qa.missingSkills && qa.missingSkills.length > 0 && (
        <Card>
          <button 
            className="w-full flex items-center justify-between"
            onClick={() => toggleSection('skills')}
          >
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-red-600" />
              Skills Gap ({qa.missingSkills.length})
            </h4>
            {expandedSections.skills ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expandedSections.skills && (
            <div className="mt-3 space-y-2">
              {qa.missingSkills.map((item, idx) => (
                <div key={idx} className="p-2 bg-red-50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">{item.skill}</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${getImportanceBadge(item.importance)}`}>
                      {item.importance}
                    </span>
                  </div>
                  {item.suggestion && (
                    <p className="text-xs text-gray-600">{item.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Strengths */}
      {qa.strengths && qa.strengths.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4" />
            Your Strengths
          </h4>
          <div className="flex flex-wrap gap-2">
            {qa.strengths.map((strength, idx) => (
              <span key={idx} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                {strength}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Formatting Issues */}
      {qa.formattingIssues && qa.formattingIssues.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <h4 className="font-semibold text-yellow-800 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" />
            Formatting Issues ({qa.formattingIssues.length})
          </h4>
          <div className="space-y-2">
            {qa.formattingIssues.map((issue, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-yellow-100">
                <div>
                  <span className="text-sm text-gray-700">{issue.issue}</span>
                  <span className="text-xs text-gray-500 ml-2">({issue.location})</span>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded ${getImportanceBadge(issue.severity)}`}>
                  {issue.severity}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ATS Score Estimate */}
      {qa.estimatedAtsScore && (
        <Card className="bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Estimated ATS Score</h4>
              <p className="text-xs text-gray-500">How well your application will pass automated screening</p>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(qa.estimatedAtsScore)}`}>
              {qa.estimatedAtsScore}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ApplicationQualityScore;
