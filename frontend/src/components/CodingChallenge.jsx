import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import technicalPrepAPI from '../api/technicalPrep';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { 
  PlayIcon, 
  ClockIcon, 
  LightBulbIcon, 
  CheckCircleIcon,
  XCircleIcon,
  BookmarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

const CodingChallenge = () => {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [hintsUsed, setHintsUsed] = useState([]);
  const [currentHint, setCurrentHint] = useState(null);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);


  // Restore code from localStorage if available
  useEffect(() => {
    const savedCode = localStorage.getItem(`coding-challenge-code-${challengeId}-${language}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      loadChallenge();
    }
  }, [challengeId, language]);


  // Save code to localStorage on change
  useEffect(() => {
    if (challengeId && language) {
      localStorage.setItem(`coding-challenge-code-${challengeId}-${language}`, code);
    }
  }, [code, challengeId, language]);

  useEffect(() => {
    let interval;
    if (timerRunning && !results) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [timerRunning, results]);

  const loadChallenge = async () => {
    try {
      setLoading(true);
      const data = await technicalPrepAPI.getCodingChallenge(challengeId);
      setChallenge(data);
      
      // Set starter code
      const starterCode = data.starterCode?.[language] || '// Write your solution here\n';
      setCode(starterCode);
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const response = await technicalPrepAPI.submitCodingSolution(challengeId, {
        code,
        language,
        timeSpent,
        hintsUsed
      });
      
      console.log('Submission response:', response);
      setResults(response.results);
      setTimerRunning(false);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit solution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetHint = async () => {
    try {
      const hintIndex = hintsUsed.length;
      const response = await technicalPrepAPI.getHint(challengeId, hintIndex);
      setHintsUsed([...hintsUsed, hintIndex]);
      setCurrentHint({ index: hintIndex + 1, text: response.hint });
      setShowHintModal(true);
    } catch (err) {
      console.error('Hint error:', err);
      setCurrentHint({ index: null, text: 'No more hints available for this challenge.' });
      setShowHintModal(true);
    }
  };

  const handleViewSolution = async () => {
    try {
      const solutionData = await technicalPrepAPI.getSolution(challengeId);
      setSolution(solutionData);
      setShowSolution(true);
    } catch (err) {
      alert('Complete the challenge successfully to view the solution');
    }
  };

  const handleBookmark = async () => {
    try {
      const response = await technicalPrepAPI.bookmarkChallenge({
        challengeType: 'coding',
        challengeId
      });
      console.log('Bookmark response:', response);
      setIsBookmarked(response.bookmarked);
    } catch (err) {
      console.error('Failed to bookmark challenge:', err);
      setError('Failed to bookmark challenge. Please try again.');
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    const starterCode = challenge.starterCode?.[newLanguage] || '// Write your solution here\n';
    setCode(starterCode);
  };

  if (loading) return <LoadingSpinner />;
  if (error && !challenge) return <ErrorMessage message={error} />;
  if (!challenge) return <ErrorMessage message="Challenge not found" />;

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Easy: 'text-green-600 bg-green-100',
      Medium: 'text-yellow-600 bg-yellow-100',
      Hard: 'text-red-600 bg-red-100',
      Expert: 'text-purple-600 bg-purple-100'
    };
    return colors[difficulty] || 'text-gray-600 bg-gray-100';
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
                {challenge.title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium text-blue-600 bg-blue-100">
                  {challenge.category}
                </span>
                {challenge.techStack?.map((tech, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full text-sm font-medium text-gray-600 bg-gray-100">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span>{formatTime(timeSpent)} / {challenge.timeLimit}m</span>
              </div>
              <button
                onClick={handleBookmark}
                className="text-gray-600 hover:text-blue-600"
              >
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
          {/* Left Panel - Problem Statement */}
          <div className="bg-white rounded-lg shadow-sm p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <h2 className="text-xl font-semibold mb-4">Problem Statement</h2>
            
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 whitespace-pre-wrap">{challenge.problemStatement}</p>
            </div>

            {challenge.constraints?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Constraints:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {challenge.constraints.map((constraint, idx) => (
                    <li key={idx}>{constraint}</li>
                  ))}
                </ul>
              </div>
            )}

            {challenge.examples?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Examples:</h3>
                {challenge.examples.map((example, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Input:</span>
                      <pre className="mt-1 bg-white p-2 rounded border text-sm overflow-x-auto whitespace-pre-wrap wrap-break-word">{example.input}</pre>
                    </div>
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Output:</span>
                      <pre className="mt-1 bg-white p-2 rounded border text-sm overflow-x-auto whitespace-pre-wrap wrap-break-word">{example.output}</pre>
                    </div>
                    {example.explanation && (
                      <div>
                        <span className="font-medium text-gray-700">Explanation:</span>
                        <p className="mt-1 text-gray-600 text-sm">{example.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {challenge.relatedConcepts?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Related Concepts:</h3>
                <div className="flex flex-wrap gap-2">
                  {challenge.relatedConcepts.map((concept, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {challenge.realWorldApplication && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Real-World Application:</h3>
                <p className="text-blue-800 text-sm">{challenge.realWorldApplication}</p>
              </div>
            )}
          </div>

          {/* Right Panel - Code Editor */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Code Editor</h2>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="typescript">TypeScript</option>
              </select>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.target.selectionStart;
                  const end = e.target.selectionEnd;
                  const newCode = code.substring(0, start) + '  ' + code.substring(end);
                  setCode(newCode);
                  setTimeout(() => {
                    e.target.selectionStart = e.target.selectionEnd = start + 2;
                  }, 0);
                }
              }}
              className="w-full h-96 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Write your solution here..."
            />

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-3">
                <Button
                  onClick={handleGetHint}
                  variant="secondary"
                  disabled={hintsUsed.length >= (challenge.hints?.length || 0)}
                >
                  Get Hint ({hintsUsed.length}/{challenge.hints?.length || 0})
                </Button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || !code.trim()}
                className="flex items-center"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Running Tests...</span>
                  </>
                ) : (
                  <>Submit Solution</>
                )}
              </Button>
            </div>

            {/* Results */}
            {results && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Test Results</h3>
                
                <div className="mb-4">
                  <div className={`flex items-center justify-between p-4 rounded-lg ${
                    results.passed === results.total ? 'bg-green-50' : 'bg-yellow-50'
                  }`}>
                    <div className="flex items-center">
                      {results.passed === results.total ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
                      ) : (
                        <XCircleIcon className="h-6 w-6 text-yellow-600 mr-2" />
                      )}
                      <span className="font-semibold">
                        {results.passed} / {results.total} Tests Passed
                      </span>
                    </div>
                    <span className="text-2xl font-bold">
                      {Math.round((results.passed / results.total) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {results.testResults?.map((test, idx) => (
                    !test.isHidden && (
                      <div key={idx} className={`p-3 rounded-lg border ${
                        test.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Test Case {test.testCase}</span>
                          {test.passed ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">Input:</span> {JSON.stringify(test.input)}
                          </div>
                          {test.passed ? (
                            <div>
                              <span className="font-medium">Output:</span> {JSON.stringify(test.expectedOutput)}
                            </div>
                          ) : (
                            <>
                              <div>
                                <span className="font-medium">Expected:</span> {JSON.stringify(test.expectedOutput)}
                              </div>
                              <div>
                                <span className="font-medium">Got:</span> {test.actualOutput}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>

                <div className="p-4 bg-blue-50 rounded-lg mb-4">
                  <p className="text-blue-900">{results.feedback}</p>
                </div>

                {results.passed === results.total && (
                  <Button onClick={handleViewSolution} variant="secondary" className="w-full">
                    View Optimal Solution
                  </Button>
                )}
              </div>
            )}

            {/* Hint Modal */}
            {showHintModal && currentHint && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-xl w-full p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {currentHint.index ? `Hint ${currentHint.index}` : 'Hint'}
                    </h3>
                    <button
                      onClick={() => setShowHintModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{currentHint.text}</p>
                  <div className="mt-6">
                    <Button onClick={() => setShowHintModal(false)} className="w-full">
                      OK
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Solution Modal */}
            {showSolution && solution && (
              <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Optimal Solution</h3>
                    <button
                      onClick={() => setShowSolution(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Code ({solution.language}):</h4>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                      {solution.code}
                    </pre>
                  </div>

                  {solution.explanation && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Explanation:</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{solution.explanation}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {solution.timeComplexity && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <span className="font-semibold text-purple-900">Time Complexity:</span>
                        <p className="text-purple-700">{solution.timeComplexity}</p>
                      </div>
                    )}
                    {solution.spaceComplexity && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <span className="font-semibold text-blue-900">Space Complexity:</span>
                        <p className="text-blue-700">{solution.spaceComplexity}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingChallenge;
