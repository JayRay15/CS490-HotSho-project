import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import technicalPrepAPI from '../api/technicalPrep';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Button from './Button';
import {
  ArrowLeftIcon,
  BookmarkIcon as BookmarkIconOutline,
  LightBulbIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';

const CaseStudyPractice = () => {
  const { caseStudyId } = useParams();
  const navigate = useNavigate();
  const hasRestoredRef = useRef(false);
  
  const [caseStudy, setCaseStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize answers from localStorage if available
  const [answers, setAnswers] = useState(() => {
    if (caseStudyId) {
      const savedAnswers = localStorage.getItem(`case-study-answers-${caseStudyId}`);
      if (savedAnswers) {
        try {
          return JSON.parse(savedAnswers);
        } catch (e) {
          console.error('Failed to parse saved answers:', e);
        }
      }
    }
    return {};
  });
  
  const [showSampleSolution, setShowSampleSolution] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load case study when caseStudyId changes
  useEffect(() => {
    loadCaseStudy();
    hasRestoredRef.current = false;
    
    // Restore answers from localStorage
    if (caseStudyId) {
      const savedAnswers = localStorage.getItem(`case-study-answers-${caseStudyId}`);
      if (savedAnswers && !hasRestoredRef.current) {
        try {
          setAnswers(JSON.parse(savedAnswers));
          hasRestoredRef.current = true;
        } catch (e) {
          console.error('Failed to parse saved answers:', e);
        }
      }
    }
  }, [caseStudyId]);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (caseStudyId) {
      localStorage.setItem(`case-study-answers-${caseStudyId}`, JSON.stringify(answers));
    }
  }, [answers, caseStudyId]);

  const loadCaseStudy = async () => {
    try {
      setLoading(true);
      const data = await technicalPrepAPI.getCaseStudy(caseStudyId);
      setCaseStudy(data);
      setIsBookmarked(data.isBookmarked || false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load case study');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      const response = await technicalPrepAPI.submitCaseStudy(caseStudyId, {
        answers: Object.entries(answers).map(([index, answer]) => ({
          questionIndex: parseInt(index),
          answer
        }))
      });

      alert(`Case study submitted! Your analysis has been recorded.`);
      
      // Clear saved answers after successful submission
      localStorage.removeItem(`case-study-answers-${caseStudyId}`);
      
      navigate('/technical-prep');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit case study');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookmark = async () => {
    try {
      if (isBookmarked) {
        await technicalPrepAPI.removeBookmark(caseStudyId);
      } else {
        await technicalPrepAPI.bookmarkChallenge(caseStudyId);
      }
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!caseStudy) return <ErrorMessage message="Case study not found" />;

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
            Back to Technical Prep
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{caseStudy.title}</h1>
                <span className="px-3 py-1 rounded-full text-sm font-medium text-blue-600 bg-blue-100">
                  {caseStudy.type}
                </span>
              </div>
              <p className="text-gray-600">{caseStudy.industry}</p>
            </div>
            
            <button
              onClick={handleBookmark}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isBookmarked ? (
                <BookmarkIconSolid className="h-6 w-6 text-blue-600" />
              ) : (
                <BookmarkIconOutline className="h-6 w-6 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Scenario Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2 text-blue-600" />
              Scenario
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap mb-4">{caseStudy.scenario}</p>
            
            {caseStudy.context && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Context</h3>
                <p className="text-blue-800 whitespace-pre-wrap">{caseStudy.context}</p>
              </div>
            )}
          </div>

          {/* Data Card */}
          {caseStudy.data && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <ChartBarIcon className="h-6 w-6 mr-2 text-green-600" />
                Data & Metrics
              </h2>
              
              {caseStudy.data.currentMetrics && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Current Metrics:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {Object.entries(caseStudy.data.currentMetrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {caseStudy.data.industryBenchmarks && (
                <div>
                  <h3 className="font-semibold mb-2">Industry Benchmarks:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {Object.entries(caseStudy.data.industryBenchmarks).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Questions Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Questions to Address</h2>
            <div className="space-y-6">
              {caseStudy.questions?.map((question, idx) => (
                <div key={idx} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <label className="block font-medium text-gray-900 mb-2">
                    {idx + 1}. {question}
                  </label>
                  <textarea
                    value={answers[idx] || ''}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                    placeholder="Type your analysis here..."
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Framework Card */}
          {caseStudy.framework && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <LightBulbIcon className="h-6 w-6 mr-2 text-yellow-600" />
                Recommended Framework
              </h2>
              
              {caseStudy.framework.approach && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Approach:</h3>
                  <p className="text-gray-700">{caseStudy.framework.approach}</p>
                </div>
              )}
              
              {caseStudy.framework.keySteps?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Key Steps:</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    {caseStudy.framework.keySteps.map((step, idx) => (
                      <li key={idx} className="text-gray-700">{step}</li>
                    ))}
                  </ol>
                </div>
              )}
              
              {caseStudy.framework.analysisTools?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Analysis Tools:</h3>
                  <div className="flex flex-wrap gap-2">
                    {caseStudy.framework.analysisTools.map((tool, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button
              onClick={() => setShowSampleSolution(true)}
              variant="secondary"
            >
              View Sample Solution
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length === 0}
            >
              {submitting ? 'Submitting...' : 'Submit Analysis'}
            </Button>
          </div>
        </div>

        {/* Sample Solution Modal */}
        {showSampleSolution && (
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
                {caseStudy.sampleSolution ? (
                  <>
                    {caseStudy.sampleSolution.approach && (
                      <div>
                        <h4 className="font-semibold mb-2">Approach:</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{caseStudy.sampleSolution.approach}</p>
                      </div>
                    )}
                    {caseStudy.sampleSolution.analysis && (
                      <div>
                        <h4 className="font-semibold mb-2">Analysis:</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{caseStudy.sampleSolution.analysis}</p>
                      </div>
                    )}
                    {caseStudy.sampleSolution.recommendations?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Recommendations:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {caseStudy.sampleSolution.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-gray-700">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {caseStudy.sampleSolution.expectedOutcome && (
                      <div>
                        <h4 className="font-semibold mb-2">Expected Outcome:</h4>
                        <p className="text-gray-700">{caseStudy.sampleSolution.expectedOutcome}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500 text-center py-8">No sample solution available for this case study.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseStudyPractice;
