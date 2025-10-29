import { useState } from 'react';
import { 
  calculateProfileCompleteness, 
  getProfileStrength, 
  formatFieldName,
  SECTION_TIPS,
  INDUSTRY_BENCHMARKS
} from '../utils/profileCompleteness';

export default function ProfileCompleteness({ userData }) {
  const [showDetails, setShowDetails] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  if (!userData) return null;

  const completeness = calculateProfileCompleteness(userData);
  const strength = getProfileStrength(completeness.overallScore);
  
  // Get colors for progress bar based on score
  const getProgressColor = (score) => {
    if (score >= 90) return '#10B981'; // green
    if (score >= 75) return '#3B82F6'; // blue
    if (score >= 50) return '#F59E0B'; // yellow
    if (score >= 25) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  const toggleSection = (sectionKey) => {
    setExpandedSection(expandedSection === sectionKey ? null : sectionKey);
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className={`rounded-xl p-6 border-2 ${strength.borderColor} ${strength.bgColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-heading font-bold text-gray-900">Profile Completeness</h3>
            <p className="text-sm text-gray-600 mt-1">
              Complete your profile to stand out to potential employers
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold" style={{ color: getProgressColor(completeness.overallScore) }}>
              {completeness.overallScore}
            </div>
            <div className={`text-sm font-semibold ${strength.color}`}>
              {strength.label}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full"
            style={{
              width: `${completeness.overallScore}%`,
              backgroundColor: getProgressColor(completeness.overallScore)
            }}
          />
          {/* Milestone markers */}
          <div className="absolute top-0 left-1/4 w-0.5 h-full bg-gray-300" />
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-300" />
          <div className="absolute top-0 left-3/4 w-0.5 h-full bg-gray-300" />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>

        {/* Industry Comparison */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Industry Comparison</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {userData.industry || 'Technology'} industry
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${
                completeness.industryComparison === 'Excellent' ? 'text-green-600' :
                completeness.industryComparison === 'Above Average' ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {completeness.industryComparison}
              </p>
              <p className="text-xs text-gray-500">
                Avg: {completeness.benchmark.average}% | Top: {completeness.benchmark.excellent}%
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 w-full py-2 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center space-x-2"
        >
          <span className="font-medium text-gray-700">
            {showDetails ? 'Hide Details' : 'View Detailed Breakdown'}
          </span>
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <>
          {/* Section Breakdown */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h4 className="text-lg font-heading font-semibold text-gray-900 mb-4">
              Section Breakdown
            </h4>
            <div className="space-y-4">
              {Object.keys(completeness.sections).map(sectionKey => {
                const section = completeness.sections[sectionKey];
                const sectionInfo = SECTION_TIPS[sectionKey];
                const isExpanded = expandedSection === sectionKey;
                const sectionScore = section.score;
                
                return (
                  <div key={sectionKey} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Section Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => toggleSection(sectionKey)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {sectionKey === 'basicInfo' ? '👤' :
                             sectionKey === 'professionalInfo' ? '💼' :
                             sectionKey === 'employment' ? '🏢' :
                             sectionKey === 'education' ? '🎓' :
                             sectionKey === 'skills' ? '⚡' :
                             sectionKey === 'projects' ? '🚀' :
                             '📜'}
                          </span>
                          <div>
                            <h5 className="font-semibold text-gray-900">{sectionInfo?.title}</h5>
                            <p className="text-xs text-gray-500">
                              {section.missing.length > 0 && (
                                <span className="text-red-600 font-medium">
                                  {section.missing.length} required field{section.missing.length !== 1 ? 's' : ''} missing
                                </span>
                              )}
                              {section.missing.length > 0 && section.optional.length > 0 && ' • '}
                              {section.optional.length > 0 && (
                                <span className="text-yellow-600">
                                  {section.optional.length} optional field{section.optional.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              {section.missing.length === 0 && section.optional.length === 0 && (
                                <span className="text-green-600">✓ Complete</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <span className={`text-2xl font-bold ${
                              sectionScore >= 90 ? 'text-green-600' :
                              sectionScore >= 75 ? 'text-blue-600' :
                              sectionScore >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {Math.round(sectionScore)}%
                            </span>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Section Progress Bar */}
                      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full transition-all duration-300 rounded-full"
                          style={{
                            width: `${sectionScore}%`,
                            backgroundColor: getProgressColor(sectionScore)
                          }}
                        />
                      </div>
                    </div>

                    {/* Expanded Section Details */}
                    {isExpanded && (
                      <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
                        {/* Missing Required Fields */}
                        {section.missing.length > 0 && (
                          <div>
                            <h6 className="text-sm font-semibold text-red-700 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Required Fields
                            </h6>
                            <ul className="space-y-1">
                              {section.missing.map((item, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start">
                                  <span className="text-red-500 mr-2">•</span>
                                  <span>{formatFieldName(item.field)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Optional Fields */}
                        {section.optional.length > 0 && (
                          <div>
                            <h6 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              Recommended
                            </h6>
                            <ul className="space-y-1">
                              {section.optional.map((item, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start">
                                  <span className="text-yellow-500 mr-2">•</span>
                                  <span>
                                    {item.count 
                                      ? `Add ${item.count} more ${formatFieldName(item.field)}` 
                                      : formatFieldName(item.field)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tips for this section */}
                        {sectionInfo?.tips && (
                          <div>
                            <h6 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Best Practices
                            </h6>
                            <ul className="space-y-2">
                              {sectionInfo.tips.map((tip, idx) => (
                                <li key={idx} className="text-sm text-gray-600 flex items-start">
                                  <span className="text-blue-500 mr-2 mt-0.5">→</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Suggestions */}
          {completeness.suggestions.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h4 className="text-lg font-heading font-semibold text-gray-900 mb-4">
                💡 Top Suggestions for Improvement
              </h4>
              <div className="space-y-3">
                {completeness.suggestions.slice(0, 5).map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      suggestion.priority === 'high'
                        ? 'bg-red-50 border-red-500'
                        : 'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`font-medium ${
                          suggestion.priority === 'high' ? 'text-red-800' : 'text-yellow-800'
                        }`}>
                          {suggestion.message}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Section: {SECTION_TIPS[suggestion.section]?.title}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <span className={`text-sm font-semibold ${
                          suggestion.priority === 'high' ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                          +{suggestion.impact}%
                        </span>
                        <p className="text-xs text-gray-500">impact</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {completeness.suggestions.length > 5 && (
                <p className="text-sm text-gray-500 text-center mt-4">
                  +{completeness.suggestions.length - 5} more suggestions
                </p>
              )}
            </div>
          )}

          {/* Achievement Badges */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h4 className="text-lg font-heading font-semibold text-gray-900 mb-4">
              🏆 Achievement Badges
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {completeness.earnedBadges.map(badge => (
                <div
                  key={badge.id}
                  className="p-4 rounded-lg border border-green-200 text-center"
                  style={{
                    background: 'linear-gradient(to bottom right, rgb(240, 253, 244), rgb(220, 252, 231))'
                  }}
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h5 className="font-semibold text-gray-900 text-sm">{badge.name}</h5>
                  <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                </div>
              ))}
            </div>
            {completeness.earnedBadges.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-3">🎯</div>
                <p className="text-gray-500">Complete your profile to earn badges!</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
