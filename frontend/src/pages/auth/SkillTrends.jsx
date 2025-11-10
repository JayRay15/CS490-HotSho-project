import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { getSkillTrends } from '../../api/skillGaps';
import { setAuthToken } from '../../api/axios';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import Breadcrumb from '../../components/Breadcrumb';

export default function SkillTrends() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      setAuthToken(token);
      
      const result = await getSkillTrends();
      console.log('Skill trends result:', result);
      
      const data = result.data?.data || result.data;
      setTrends(data);
    } catch (err) {
      console.error('Failed to load skill trends:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyColor = (frequency, total) => {
    const percentage = (frequency / total) * 100;
    if (percentage >= 75) return 'bg-red-500';
    if (percentage >= 50) return 'bg-orange-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'required':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'preferred':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'nice-to-have':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading skill trends...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trends || trends.totalJobsAnalyzed === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb 
          items={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Skill Trends', path: '/skill-trends' }
          ]} 
        />
        
        <Card className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Jobs to Analyze</h2>
          <p className="text-gray-600 mb-6">
            Add some jobs with requirements to see skill trends across your opportunities.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb 
        items={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Skill Trends', path: '/skill-trends' }
        ]} 
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Skill Trends Analysis</h1>
        <p className="text-gray-600">
          Insights from {trends.totalJobsAnalyzed} job{trends.totalJobsAnalyzed !== 1 ? 's' : ''} in your pipeline
        </p>
      </div>

      {error && <ErrorMessage error={error} onDismiss={() => setError(null)} className="mb-6" />}

      {/* Recommendations */}
      {trends.recommendations && trends.recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {trends.recommendations.map((rec, idx) => (
            <Card key={idx} className={
              rec.type === 'strength' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }>
              <div className="flex items-start space-x-3">
                {rec.type === 'strength' ? (
                  <svg className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2 ${
                    rec.type === 'strength' ? 'text-green-900' : 'text-orange-900'
                  }`}>
                    {rec.type === 'strength' ? '🎯 Your Strengths' : '⚠️ Skill Gaps'}
                  </h3>
                  <p className={rec.type === 'strength' ? 'text-green-800' : 'text-orange-800'}>
                    {rec.message}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Critical Gaps */}
      {trends.criticalGaps && trends.criticalGaps.length > 0 && (
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">🚨 Critical Skill Gaps</h2>
              <p className="text-gray-600 mt-1">
                High-demand skills appearing in 50%+ of your target jobs
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trends.criticalGaps.map((skill, idx) => (
              <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 capitalize">{skill.skill}</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                    Critical
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Appears in {skill.frequency} jobs</span>
                  <span className="font-medium">{skill.percentage}%</span>
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{ width: `${skill.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Trending Skills */}
      {trends.trending && trends.trending.length > 0 && (
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">📈 Most In-Demand Skills</h2>
            <p className="text-gray-600 mt-1">
              Skills ranked by frequency across your target jobs
            </p>
          </div>

          <div className="space-y-4">
            {trends.trending.map((skill, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      idx < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 capitalize text-lg">{skill.skill}</span>
                        {skill.hasSkill && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 border border-green-200">
                            ✓ You have this
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm text-gray-600">
                          Appears in {skill.frequency} of {trends.totalJobsAnalyzed} jobs
                        </span>
                        <span className={`px-2 py-1 text-xs rounded border ${getImportanceColor(skill.importance)}`}>
                          {skill.importance}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{skill.percentage}%</div>
                    <div className="text-xs text-gray-600">frequency</div>
                  </div>
                </div>
                
                {/* Frequency bar */}
                <div className="relative">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getFrequencyColor(skill.frequency, trends.totalJobsAnalyzed)}`}
                      style={{ width: `${skill.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              💡 <strong>Tip:</strong> Focus on high-frequency skills you don't have yet to maximize your competitiveness across all target jobs.
            </p>
            <Button onClick={() => navigate('/dashboard')} variant="secondary">
              Back to Dashboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
