import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Briefcase, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Copy,
  Star
} from 'lucide-react';
import { analyzeExperienceForCoverLetter } from '../api/coverLetters';
import Card from './Card';
import Button from './Button';

const ExperienceHighlighter = ({ jobId, analysisData, onSelectNarrative, onClose }) => {
  const [analysis, setAnalysis] = useState(analysisData || null);
  const [loading, setLoading] = useState(!analysisData);
  const [error, setError] = useState('');
  const [expandedExperience, setExpandedExperience] = useState(null);
  const [selectedNarratives, setSelectedNarratives] = useState({});

  useEffect(() => {
    if (analysisData) {
      setAnalysis(analysisData);
      setLoading(false);
      
      // Auto-select highest strength narratives
      const autoSelected = {};
      analysisData.selectedExperiences?.forEach((exp, idx) => {
        const highestStrength = exp.narratives?.find(n => n.strength === 'high') || exp.narratives?.[0];
        if (highestStrength) {
          autoSelected[idx] = highestStrength;
        }
      });
      setSelectedNarratives(autoSelected);
    } else if (jobId && !analysisData) {
      loadAnalysis();
    }
  }, [jobId, analysisData]);

  const loadAnalysis = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await analyzeExperienceForCoverLetter(jobId, 3);
      setAnalysis(response.data.data);
      
      // Auto-select highest strength narratives
      const autoSelected = {};
      response.data.data.selectedExperiences?.forEach((exp, idx) => {
        const highestStrength = exp.narratives?.find(n => n.strength === 'high') || exp.narratives?.[0];
        if (highestStrength) {
          autoSelected[idx] = highestStrength;
        }
      });
      setSelectedNarratives(autoSelected);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze experience');
    } finally {
      setLoading(false);
    }
  };

  const getRelevanceColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || colors.low;
  };

  const handleCopyNarrative = (text) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  const handleSelectNarrative = (expIndex, narrative) => {
    setSelectedNarratives(prev => ({
      ...prev,
      [expIndex]: narrative
    }));
  };

  const handleApplySelected = () => {
    const narrativesText = Object.values(selectedNarratives)
      .map(n => n.text)
      .join('\n\n');
    
    if (onSelectNarrative) {
      onSelectNarrative(narrativesText);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Analyzing your experience relevance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="error">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-red-800">Analysis Failed</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <Button onClick={loadAnalysis} className="mt-3" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overall Package Score */}
      <Card title="Experience Relevance Score" variant="elevated">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {analysis.packageScore.overallScore}%
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {analysis.packageScore.recommendation}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700">
              Job Coverage
            </div>
            <div className="text-2xl font-semibold text-blue-600">
              {analysis.packageScore.coverage}%
            </div>
          </div>
        </div>

        {/* Strengths */}
        {analysis.packageScore.strengths?.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" />
              Key Strengths
            </p>
            <ul className="space-y-1">
              {analysis.packageScore.strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <Star size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gaps */}
        {analysis.packageScore.gaps?.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-600" />
              Skill Gaps to Address
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.packageScore.gaps.map((gap, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full"
                >
                  {gap}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Selected Experiences */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Briefcase size={20} />
          Most Relevant Experiences
        </h3>

        <div className="space-y-4">
          {analysis.selectedExperiences?.map((expData, expIndex) => (
            <Card key={expIndex} variant="elevated">
              <div className="space-y-4">
                {/* Experience Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {expData.experience.title}
                    </h4>
                    <p className="text-sm text-gray-600">{expData.experience.company}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadge(expData.relevance.priority)}`}>
                      {expData.relevance.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRelevanceColor(expData.relevance.score)}`}>
                      {expData.relevance.score}% match
                    </span>
                  </div>
                </div>

                {/* Relevance Reasons */}
                {expData.relevance.reasons?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {expData.relevance.reasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}

                {/* Matched Skills */}
                {expData.relevance.matchedSkills?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Matched Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {expData.relevance.matchedSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Narrative Options */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Select Narrative Style
                  </p>
                  <div className="space-y-2">
                    {expData.narratives?.map((narrative, narIdx) => (
                      <div
                        key={narIdx}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedNarratives[expIndex]?.text === narrative.text
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => handleSelectNarrative(expIndex, narrative)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-gray-600 uppercase">
                                {narrative.style}
                              </span>
                              {narrative.strength === 'high' && (
                                <Award size={14} className="text-yellow-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{narrative.text}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyNarrative(narrative.text);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quantified Achievements */}
                {expData.quantifiedAchievements?.length > 0 && (
                  <div>
                    <button
                      onClick={() => setExpandedExperience(expandedExperience === expIndex ? null : expIndex)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      {expandedExperience === expIndex ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      Quantified Achievements ({expData.quantifiedAchievements.length})
                    </button>
                    {expandedExperience === expIndex && (
                      <ul className="mt-2 space-y-1 pl-6">
                        {expData.quantifiedAchievements.map((achievement, idx) => (
                          <li key={idx} className="text-sm text-gray-700 list-disc">
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations?.length > 0 && (
        <Card title="Recommendations" variant="info">
          <div className="space-y-3">
            {analysis.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <Lightbulb size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{rec.message}</p>
                  <p className="text-xs text-gray-600 mt-1">{rec.action}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Additional Suggestions */}
      {analysis.additionalSuggestions?.length > 0 && (
        <Card title="Additional Experience Suggestions" variant="elevated">
          <div className="space-y-2">
            {analysis.additionalSuggestions.map((suggestion, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {suggestion.experience.title} at {suggestion.experience.company}
                  </p>
                  <span className="text-xs font-medium text-gray-600">
                    {suggestion.relevanceScore}% match
                  </span>
                </div>
                <p className="text-xs text-gray-600">{suggestion.reason}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleApplySelected}
          disabled={Object.keys(selectedNarratives).length === 0}
        >
          Apply Selected Narratives to Cover Letter
        </Button>
      </div>
    </div>
  );
};

ExperienceHighlighter.propTypes = {
  jobId: PropTypes.string.isRequired,
  analysisData: PropTypes.object,
  onSelectNarrative: PropTypes.func,
  onClose: PropTypes.func
};

export default ExperienceHighlighter;
