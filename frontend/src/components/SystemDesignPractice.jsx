import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import technicalPrepAPI from '../api/technicalPrep';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { 
  ArrowLeftIcon,
  ClockIcon,
  BookmarkIcon,
  CheckCircleIcon,
  ServerIcon,
  CircleStackIcon,
  CloudIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

const SystemDesignPractice = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const hasRestoredRef = useRef(false);
  
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize solution from localStorage if available
  const [solution, setSolution] = useState(() => {
    if (questionId) {
      const savedSolution = localStorage.getItem(`system-design-solution-${questionId}`);
      if (savedSolution) {
        try {
          return JSON.parse(savedSolution);
        } catch (e) {
          console.error('Failed to parse saved solution:', e);
        }
      }
    }
    return {
      architecture: '',
      components: [],
      dataFlow: '',
      scalingStrategy: '',
      tradeoffs: []
    };
  });
  
  const [componentInput, setComponentInput] = useState({ name: '', description: '', technology: '' });
  const [tradeoffInput, setTradeoffInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSampleSolution, setShowSampleSolution] = useState(false);

  // Load question when questionId changes
  useEffect(() => {
    loadQuestion();
    hasRestoredRef.current = false;
    
    // Restore solution from localStorage
    if (questionId) {
      const savedSolution = localStorage.getItem(`system-design-solution-${questionId}`);
      if (savedSolution && !hasRestoredRef.current) {
        try {
          setSolution(JSON.parse(savedSolution));
          hasRestoredRef.current = true;
        } catch (e) {
          console.error('Failed to parse saved solution:', e);
        }
      }
    }
  }, [questionId]);

  // Save solution to localStorage whenever it changes
  useEffect(() => {
    if (questionId) {
      localStorage.setItem(`system-design-solution-${questionId}`, JSON.stringify(solution));
    }
  }, [solution, questionId]);

  useEffect(() => {
    let interval;
    if (timerRunning && !evaluation) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, evaluation]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const data = await technicalPrepAPI.getSystemDesignQuestion(questionId);
      setQuestion(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComponent = () => {
    if (componentInput.name && componentInput.description) {
      setSolution({
        ...solution,
        components: [...solution.components, { ...componentInput }]
      });
      setComponentInput({ name: '', description: '', technology: '' });
    }
  };

  const handleRemoveComponent = (index) => {
    setSolution({
      ...solution,
      components: solution.components.filter((_, idx) => idx !== index)
    });
  };

  const handleAddTradeoff = () => {
    if (tradeoffInput.trim()) {
      setSolution({
        ...solution,
        tradeoffs: [...solution.tradeoffs, tradeoffInput]
      });
      setTradeoffInput('');
    }
  };

  const handleRemoveTradeoff = (index) => {
    setSolution({
      ...solution,
      tradeoffs: solution.tradeoffs.filter((_, idx) => idx !== index)
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await technicalPrepAPI.submitSystemDesignSolution(questionId, {
        solution,
        timeSpent
      });
      
      setEvaluation(response.evaluation);
      setTimerRunning(false);
      
      // Clear saved solution after successful submission
      localStorage.removeItem(`system-design-solution-${questionId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit solution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookmark = async () => {
    try {
      if (isBookmarked) {
        await technicalPrepAPI.removeBookmark(questionId);
      } else {
        await technicalPrepAPI.bookmarkChallenge(questionId);
      }
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error('Failed to bookmark question:', err);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !question) return <ErrorMessage message={error} />;
  if (!question) return <ErrorMessage message="Question not found" />;

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getLevelColor = (level) => {
    const colors = {
      Junior: 'text-green-600 bg-green-100',
      'Mid-Level': 'text-blue-600 bg-blue-100',
      Senior: 'text-purple-600 bg-purple-100',
      Staff: 'text-orange-600 bg-orange-100',
      Principal: 'text-red-600 bg-red-100'
    };
    return colors[level] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/technical-prep')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Challenges
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {question.title}
              </h1>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(question.level)}`}>
                  {question.level}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium text-blue-600 bg-blue-100">
                  System Design
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span>{formatTime(timeSpent)}</span>
              </div>
              <button onClick={handleBookmark} className="text-gray-600 hover:text-blue-600">
                {isBookmarked ? (
                  <BookmarkSolidIcon className="h-6 w-6 text-blue-600" />
                ) : (
                  <BookmarkIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Problem Description */}
          <div className="bg-white rounded-lg shadow-sm p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <h2 className="text-xl font-semibold mb-4">Problem Description</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Scenario:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{question.scenario}</p>
            </div>

            {/* Requirements */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Requirements:</h3>
              
              {question.requirements?.functional?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">Functional:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {question.requirements.functional.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {question.requirements?.nonFunctional?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">Non-Functional:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {question.requirements.nonFunctional.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {question.requirements?.constraints?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Constraints:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {question.requirements.constraints.map((constraint, idx) => (
                      <li key={idx}>{constraint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Scale */}
            {question.scale && (
              <div className="mb-6 bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Scale:</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {question.scale.users && (
                    <div className="flex justify-between">
                      <span className="text-blue-800">Users:</span>
                      <span className="font-medium text-blue-900">{question.scale.users}</span>
                    </div>
                  )}
                  {question.scale.requests && (
                    <div className="flex justify-between">
                      <span className="text-blue-800">Requests:</span>
                      <span className="font-medium text-blue-900">{question.scale.requests}</span>
                    </div>
                  )}
                  {question.scale.storage && (
                    <div className="flex justify-between">
                      <span className="text-blue-800">Storage:</span>
                      <span className="font-medium text-blue-900">{question.scale.storage}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key Components */}
            {question.keyComponents?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Key Components to Consider:</h3>
                <div className="flex flex-wrap gap-2">
                  {question.keyComponents.map((component, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                      {component}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Considerations */}
            {question.considerations?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Important Considerations:</h3>
                <ul className="space-y-2">
                  {question.considerations.map((consideration, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span className="text-gray-700">{consideration}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up Questions */}
            {question.followUpQuestions?.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Follow-up Questions:</h3>
                <ul className="space-y-2 text-sm">
                  {question.followUpQuestions.map((q, idx) => (
                    <li key={idx} className="text-yellow-800">
                      {idx + 1}. {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Panel - Solution Design */}
          <div className="bg-white rounded-lg shadow-sm p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <h2 className="text-xl font-semibold mb-4">Your Solution</h2>

            {/* Architecture Overview */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Architecture Overview
              </label>
              <textarea
                value={solution.architecture}
                onChange={(e) => setSolution({ ...solution, architecture: e.target.value })}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your high-level architecture..."
                disabled={evaluation !== null}
              />
            </div>

            {/* Components */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Components
              </label>
              
              {solution.components.map((component, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 mb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <ServerIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium">{component.name}</span>
                    </div>
                    {!evaluation && (
                      <button
                        onClick={() => handleRemoveComponent(idx)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{component.description}</p>
                  {component.technology && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {component.technology}
                    </span>
                  )}
                </div>
              ))}

              {!evaluation && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <input
                    type="text"
                    value={componentInput.name}
                    onChange={(e) => setComponentInput({ ...componentInput, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Component name (e.g., Load Balancer)"
                  />
                  <input
                    type="text"
                    value={componentInput.description}
                    onChange={(e) => setComponentInput({ ...componentInput, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Description"
                  />
                  <input
                    type="text"
                    value={componentInput.technology}
                    onChange={(e) => setComponentInput({ ...componentInput, technology: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Technology (e.g., NGINX, Redis)"
                  />
                  <Button onClick={handleAddComponent} variant="secondary" size="small">
                    Add Component
                  </Button>
                </div>
              )}
            </div>

            {/* Data Flow */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Flow
              </label>
              <textarea
                value={solution.dataFlow}
                onChange={(e) => setSolution({ ...solution, dataFlow: e.target.value })}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe how data flows through your system..."
                disabled={evaluation !== null}
              />
            </div>

            {/* Scaling Strategy */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scaling Strategy
              </label>
              <textarea
                value={solution.scalingStrategy}
                onChange={(e) => setSolution({ ...solution, scalingStrategy: e.target.value })}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="How will your system scale to meet demand?"
                disabled={evaluation !== null}
              />
            </div>

            {/* Trade-offs */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trade-offs
              </label>
              
              {solution.tradeoffs.map((tradeoff, idx) => (
                <div key={idx} className="bg-yellow-50 rounded-lg p-3 mb-2 flex justify-between items-center">
                  <span className="text-sm text-gray-700">{tradeoff}</span>
                  {!evaluation && (
                    <button
                      onClick={() => handleRemoveTradeoff(idx)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              {!evaluation && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tradeoffInput}
                    onChange={(e) => setTradeoffInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Add a trade-off consideration..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTradeoff()}
                  />
                  <Button onClick={handleAddTradeoff} variant="secondary" size="small">
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            {!evaluation && (
              <Button
                onClick={handleSubmit}
                disabled={submitting || !solution.architecture.trim()}
                className="w-full"
              >
                {submitting ? 'Submitting...' : 'Submit Design'}
              </Button>
            )}

            {/* Evaluation Results */}
            {evaluation && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Evaluation</h3>
                
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-900">Overall Score</span>
                    <span className="text-3xl font-bold text-blue-600">{Math.round(evaluation.score)}%</span>
                  </div>
                  {evaluation.score >= 80 && (
                    <CheckCircleIcon className="h-6 w-6 text-green-600 mx-auto mt-2" />
                  )}
                </div>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Feedback:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{evaluation.feedback}</p>
                </div>

                {evaluation.mentionedComponents?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-green-700 mb-2">✓ Components Covered:</h4>
                    <div className="flex flex-wrap gap-2">
                      {evaluation.mentionedComponents.map((comp, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {evaluation.missingComponents?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-orange-700 mb-2">⚠ Missing Components:</h4>
                    <div className="flex flex-wrap gap-2">
                      {evaluation.missingComponents.map((comp, idx) => (
                        <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setShowSampleSolution(true)}
                  variant="secondary"
                  className="w-full mt-4"
                >
                  View Sample Solution
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sample Solution Modal */}
        {showSampleSolution && question.solutionFramework && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Sample Solution</h3>
                <button
                  onClick={() => setShowSampleSolution(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {question.solutionFramework.architecture && (
                  <div>
                    <h4 className="font-semibold mb-2">Architecture:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {question.solutionFramework.architecture}
                    </p>
                  </div>
                )}

                {question.solutionFramework.components?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Components:</h4>
                    <div className="space-y-3">
                      {question.solutionFramework.components.map((comp, idx) => (
                        <div key={idx} className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <CloudIcon className="h-5 w-5 text-blue-600 mr-2" />
                            <span className="font-medium text-blue-900">{comp.name}</span>
                          </div>
                          <p className="text-blue-800 text-sm mb-2">{comp.description}</p>
                          {comp.technology && (
                            <span className="text-xs text-blue-600 bg-white px-2 py-1 rounded">
                              {comp.technology}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {question.solutionFramework.dataFlow && (
                  <div>
                    <h4 className="font-semibold mb-2">Data Flow:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {question.solutionFramework.dataFlow}
                    </p>
                  </div>
                )}

                {question.solutionFramework.scalingStrategy && (
                  <div>
                    <h4 className="font-semibold mb-2">Scaling Strategy:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {question.solutionFramework.scalingStrategy}
                    </p>
                  </div>
                )}

                {question.solutionFramework.tradeOffs?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Trade-offs:</h4>
                    <ul className="space-y-2">
                      {question.solutionFramework.tradeOffs.map((tradeoff, idx) => (
                        <li key={idx} className="bg-yellow-50 p-3 rounded-lg text-gray-700">
                          {tradeoff}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemDesignPractice;
