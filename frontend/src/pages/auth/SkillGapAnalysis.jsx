import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { analyzeJobSkillGap, startSkillTracking } from '../../api/skillGaps';
import { setAuthToken } from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function SkillGapAnalysis() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [trackingSkills, setTrackingSkills] = useState(new Set());
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadAnalysis();
  }, [jobId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      setAuthToken(token);
      
      const result = await analyzeJobSkillGap(jobId);
      console.log('Skill gap analysis result:', result);
      
      // Handle different response structures
      const data = result.data?.data || result.data;
      console.log('Parsed data:', data);
      
      if (!data) {
        throw new Error('No data received from server');
      }
      
      setAnalysis(data);
    } catch (err) {
      console.error('Failed to load skill gap analysis:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTracking = async (skill) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      
      await startSkillTracking({
        skillName: skill.name,
        targetLevel: 'Advanced',
        resources: skill.resources || []
      });
      
      setTrackingSkills(prev => new Set([...prev, skill.name]));
      setSuccessMessage(`Started tracking ${skill.name}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to start tracking:', err);
      setError(err);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      'Beginner': 'text-gray-600 bg-gray-100',
      'Intermediate': 'text-yellow-700 bg-yellow-100',
      'Advanced': 'text-indigo-700 bg-indigo-100',
      'Expert': 'text-green-700 bg-green-100'
    };
    return colors[level] || 'text-gray-600 bg-gray-100';
  };

  const getPriorityColor = (priority) => {
    if (priority >= 15) return 'text-red-700 bg-red-50 border-red-200';
    if (priority >= 10) return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  };

  const getPriorityLabel = (priority) => {
    if (priority >= 15) return 'Critical';
    if (priority >= 10) return 'High';
    return 'Medium';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <p className="text-gray-600">No analysis data available</p>
        </Card>
      </div>
    );
  }

  const { job, analysis: gapData, learningResources, learningPath } = analysis;
  const allGaps = [...gapData.missing, ...gapData.weak];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">Skill Gap Analysis</h1>
        <p className="text-gray-600 mt-2">
          {job.title} at {job.company}
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {error && <ErrorMessage error={error} onDismiss={() => setError(null)} className="mb-6" />}

      {/* No Skills Message */}
      {gapData.totalRequired === 0 && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Skills Data Available</h3>
              <p className="text-yellow-800 mb-3">
                This job doesn't have any requirements or description data yet. To use skill gap analysis, please add:
              </p>
              <ul className="list-disc list-inside text-yellow-800 space-y-1 ml-2">
                <li>Job requirements (preferred) - Add specific skills and technologies needed</li>
                <li>Job description - Include skills mentioned in the job posting</li>
              </ul>
              <p className="text-yellow-800 mt-3 text-sm">
                💡 <strong>Tip:</strong> Edit the job details and add requirements like "React", "Python", "AWS", etc. 
                The analysis will automatically detect over 100+ common skills and technologies.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Match Score */}
      {gapData.totalRequired > 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {gapData.matchPercentage}% Match
              </h2>
              <p className="text-gray-600 mt-1">
                You match {gapData.summary.matched} out of {gapData.totalRequired} required skills
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{gapData.summary.matched}</div>
                <div className="text-sm text-gray-600">Matched</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{gapData.summary.weak}</div>
                <div className="text-sm text-gray-600">Weak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{gapData.summary.missing}</div>
                <div className="text-sm text-gray-600">Missing</div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${gapData.matchPercentage}%` }}
            />
          </div>
        </Card>
      )}

      {/* Tabs */}
      {gapData.totalRequired > 0 && (
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {['overview', 'learning-path', 'resources'].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  selectedTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'learning-path' && 'Learning Path'}
                {tab === 'resources' && 'Resources'}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Tab Content */}
      {gapData.totalRequired > 0 && selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Matched Skills */}
          {gapData.matched.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Matched Skills ({gapData.matched.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {gapData.matched.map((skill, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="font-medium text-gray-900">{skill.name}</span>
                    <span className={`px-2 py-1 text-xs rounded ${getLevelColor(skill.userLevel)}`}>
                      {skill.userLevel}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Missing Skills */}
          {gapData.missing.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Missing Skills ({gapData.missing.length})
              </h3>
              <div className="space-y-3">
                {gapData.missing.map((skill, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${getPriorityColor(skill.priority)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-900">{skill.name}</span>
                        <span className="px-2 py-1 text-xs rounded bg-white border">
                          {getPriorityLabel(skill.priority)} Priority
                        </span>
                        <span className="text-xs text-gray-600 capitalize">{skill.importance}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleStartTracking(skill)}
                        disabled={trackingSkills.has(skill.name)}
                      >
                        {trackingSkills.has(skill.name) ? 'Tracking' : 'Start Learning'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Weak Skills */}
          {gapData.weak.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Skills to Improve ({gapData.weak.length})
              </h3>
              <div className="space-y-3">
                {gapData.weak.map((skill, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-900">{skill.name}</span>
                        <span className={`px-2 py-1 text-xs rounded ${getLevelColor(skill.userLevel)}`}>
                          Current: {skill.userLevel}
                        </span>
                        <span className="text-xs text-gray-600">→ Recommended: Advanced+</span>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStartTracking(skill)}
                        disabled={trackingSkills.has(skill.name)}
                      >
                        {trackingSkills.has(skill.name) ? 'Tracking' : 'Improve Skill'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {gapData.totalRequired > 0 && selectedTab === 'learning-path' && learningPath && (
        <div className="space-y-6">
          {/* Duration Estimate */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Estimated Learning Time</h3>
                <p className="text-gray-600 mt-1">Based on 10 hours per week of study</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{learningPath.estimatedDuration.weeks}</div>
                <div className="text-sm text-gray-600">weeks ({learningPath.estimatedDuration.hours} hours)</div>
              </div>
            </div>
          </Card>

          {/* Learning Phases */}
          {learningPath.recommendations.map((phase, idx) => (
            <Card key={idx}>
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                  phase.priority === 'high' ? 'bg-red-500' :
                  phase.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{phase.title}</h3>
                  <p className="text-gray-600 mt-1">{phase.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {phase.skills.map((skill, skillIdx) => (
                      <span key={skillIdx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedTab('resources')}
                    >
                      View Learning Resources
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {gapData.totalRequired > 0 && selectedTab === 'resources' && learningResources && (
        <div className="space-y-6">
          {learningResources.map((resource, idx) => (
            <Card key={idx}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{resource.skill}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(resource.priority)}`}>
                      {getPriorityLabel(resource.priority)} Priority
                    </span>
                    <span className="text-sm text-gray-600 capitalize">{resource.importance}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleStartTracking({ name: resource.skill, resources: resource.resources })}
                  disabled={trackingSkills.has(resource.skill)}
                >
                  {trackingSkills.has(resource.skill) ? 'Tracking' : 'Start Learning'}
                </Button>
              </div>
              
              <div className="space-y-3">
                {resource.resources.map((res, resIdx) => (
                  <a
                    key={resIdx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold ${
                          res.type === 'documentation' ? 'bg-purple-500' : 'bg-blue-500'
                        }`}>
                          {res.type === 'documentation' ? 'DOC' : res.platform.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{res.title}</div>
                          <div className="text-sm text-gray-600">{res.platform}</div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
