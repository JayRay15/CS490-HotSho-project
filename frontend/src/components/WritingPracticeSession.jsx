import React, { useState, useEffect } from 'react';
import { 
  getBehavioralQuestions, 
  createPracticeSession, 
  submitResponse,
  completePracticeSession,
  getWritingTips 
} from '../api/writingPractice';
import { Clock, Play, Pause, CheckCircle, AlertCircle, Lightbulb, Target, TrendingUp } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const WritingPracticeSession = ({ setActiveTab }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  // Session setup
  const [sessionType, setSessionType] = useState('Individual Question');
  const [targetRole, setTargetRole] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('Mid-Level');
  const [questionCount, setQuestionCount] = useState(1);
  
  // Questions and session
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [session, setSession] = useState(null);
  
  // Response state
  const [response, setResponse] = useState('');
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  
  // Feedback state
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  
  // Tips
  const [tips, setTips] = useState(null);
  const [showTips, setShowTips] = useState(false);

  const categories = [
    'Leadership',
    'Teamwork',
    'Problem Solving',
    'Conflict Resolution',
    'Time Management',
    'Communication',
    'Adaptability',
    'Initiative',
    'Customer Focus',
    'Achievement',
    'Technical',
    'Cultural Fit'
  ];

  const difficulties = ['Entry', 'Mid-Level', 'Senior', 'Executive'];

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Load tips
  useEffect(() => {
    const loadTips = async () => {
      try {
        const tipsData = await getWritingTips(category || null);
        setTips(tipsData);
      } catch (err) {
        console.error('Error loading tips:', err);
      }
    };
    loadTips();
  }, [category]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSession = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch questions
      const params = {
        limit: questionCount,
        random: true
      };
      
      if (category) params.category = category;
      if (difficulty) params.difficulty = difficulty;
      if (targetRole) params.role = targetRole;
      
      const { questions: fetchedQuestions } = await getBehavioralQuestions(params);
      
      if (!fetchedQuestions || fetchedQuestions.length === 0) {
        throw new Error('No questions found matching your criteria');
      }
      
      setQuestions(fetchedQuestions);
      
      // Create session
      const sessionData = {
        sessionType,
        targetRole: targetRole || undefined,
        sessionGoal: `Practice ${category || 'behavioral'} questions`,
        questionIds: fetchedQuestions.map(q => q._id)
      };
      
      const { session: newSession } = await createPracticeSession(sessionData);
      setSession(newSession);
      setSessionStarted(true);
      
      // Start timer
      setIsTimerRunning(true);
      setStartTime(Date.now());
      
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      setError('Please write a response before submitting');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const timeSpent = timer;
      const currentQuestion = questions[currentQuestionIndex];
      
      const responseData = {
        response: response.trim(),
        timeSpent
      };
      
      const result = await submitResponse(session._id, currentQuestion._id, responseData);
      
      setCurrentFeedback(result.feedback);
      setIsTimerRunning(false);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setResponse('');
      setCurrentFeedback(null);
      setTimer(0);
      setIsTimerRunning(true);
      setStartTime(Date.now());
    } else {
      handleCompleteSession();
    }
  };

  const handleCompleteSession = async () => {
    setLoading(true);
    
    try {
      const result = await completePracticeSession(session._id);
      setSessionSummary(result.session.sessionFeedback);
      setSessionCompleted(true);
      setIsTimerRunning(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete session');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setSessionStarted(false);
    setSessionCompleted(false);
    setSession(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setResponse('');
    setTimer(0);
    setIsTimerRunning(false);
    setCurrentFeedback(null);
    setSessionSummary(null);
    setError(null);
  };

  if (loading && !sessionStarted) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  // Session completed view
  if (sessionCompleted && sessionSummary) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card variant="primary">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h2>
            <p className="text-gray-600">{sessionSummary.overallPerformance}</p>
          </div>

          {/* Session Score */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {typeof session.sessionScore === 'number' && !isNaN(session.sessionScore)
                  ? session.sessionScore.toFixed(1)
                  : <span className="text-gray-400 text-lg">No score available</span>}
              </div>
              <div className="text-gray-600">Session Score</div>
              {session.performance?.averageScore !== undefined && (
                <div className="mt-2 text-lg text-primary font-semibold">
                  Overall Average: {session.performance.averageScore.toFixed(1)}
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicators */}
          {sessionSummary.progressIndicators && sessionSummary.progressIndicators.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Session Statistics
              </h3>
              <ul className="space-y-2">
                {sessionSummary.progressIndicators.map((indicator, idx) => (
                  <li key={idx} className="text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Strengths */}
          {sessionSummary.keyStrengths && sessionSummary.keyStrengths.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Key Strengths
              </h3>
              <ul className="space-y-2">
                {sessionSummary.keyStrengths.map((strength, idx) => (
                  <li key={idx} className="text-gray-700 bg-green-50 border border-green-200 rounded p-3">
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {sessionSummary.areasForImprovement && sessionSummary.areasForImprovement.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {sessionSummary.areasForImprovement.map((area, idx) => (
                  <li key={idx} className="text-gray-700 bg-orange-50 border border-orange-200 rounded p-3">
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          {sessionSummary.nextSteps && sessionSummary.nextSteps.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Next Steps
              </h3>
              <ul className="space-y-2">
                {sessionSummary.nextSteps.map((step, idx) => (
                  <li key={idx} className="text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600 font-bold">{idx + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={handleRestart} variant="primary" className="flex-1">
              Start New Session
            </Button>
            <Button onClick={() => setActiveTab && setActiveTab('performance')} variant="secondary" className="flex-1">
              View Full Performance
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Active session view
  if (sessionStarted && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const wordCount = response.trim().split(/\s+/).filter(Boolean).length;

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

        {/* Header */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h2>
              <p className="text-sm text-gray-600">
                {currentQuestion.category} • {currentQuestion.difficulty}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-mono text-lg font-semibold text-blue-600">
                  {formatTime(timer)}
                </span>
              </div>
              <Button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                variant="secondary"
                size="sm"
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Question */}
          <div className="bg-white border border-primary-100 rounded-xl p-6 mb-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {currentQuestion.question}
            </h3>
            
            {currentQuestion.starGuidance && (
              <div className="bg-primary-50 rounded-xl p-4 mb-4 border border-primary-100">
                <h4 className="font-semibold text-gray-700 mb-2">STAR Framework Guidance:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><strong>Situation:</strong> {currentQuestion.starGuidance.situation}</li>
                  <li><strong>Task:</strong> {currentQuestion.starGuidance.task}</li>
                  <li><strong>Action:</strong> {currentQuestion.starGuidance.action}</li>
                  <li><strong>Result:</strong> {currentQuestion.starGuidance.result}</li>
                </ul>
              </div>
            )}

            <div className="flex gap-4 text-sm text-gray-600">
              <span>Target: {currentQuestion.idealResponseLength.min}-{currentQuestion.idealResponseLength.max} words</span>
              <span>Time limit: {currentQuestion.timeLimit} minutes</span>
            </div>
          </div>

          {/* Tips toggle */}
          {currentQuestion.tips && currentQuestion.tips.length > 0 && (
            <div className="mb-4">
              <Button
                onClick={() => setShowTips(!showTips)}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                {showTips ? 'Hide' : 'Show'} Tips
              </Button>
              
              {showTips && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <ul className="space-y-2 text-sm text-gray-700">
                    {currentQuestion.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Response area */}
          {!currentFeedback && (
            <>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write your response here using the STAR method..."
                className="w-full h-64 px-4 py-3 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-gray-50"
                disabled={submitting}
              />
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Word count: {wordCount}
                  {currentQuestion.idealResponseLength && (
                    <span className={wordCount < currentQuestion.idealResponseLength.min ? 'text-orange-600' : wordCount > currentQuestion.idealResponseLength.max ? 'text-red-600' : 'text-green-600'}>
                      {' '}({currentQuestion.idealResponseLength.min}-{currentQuestion.idealResponseLength.max} target)
                    </span>
                  )}
                </div>
                
                <Button
                  onClick={handleSubmitResponse}
                  disabled={!response.trim() || submitting}
                  variant="primary"
                >
                  {submitting ? 'Analyzing...' : 'Submit Response'}
                </Button>
              </div>
            </>
          )}

          {/* Feedback */}
          {currentFeedback && (
            <div className="space-y-4">
              {/* Overall Score */}
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {currentFeedback.overallScore}
                  </div>
                  <div className="text-gray-700 font-medium">Overall Score</div>
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <ScoreItem label="Clarity" score={currentFeedback.clarityScore} />
                  <ScoreItem label="Professionalism" score={currentFeedback.professionalismScore} />
                  <ScoreItem label="Structure" score={currentFeedback.structureScore} />
                  <ScoreItem label="Relevance" score={currentFeedback.relevanceScore} />
                  <ScoreItem label="Impact" score={currentFeedback.impactScore} />
                  <ScoreItem label="STAR Adherence" score={currentFeedback.starAdherence.score} />
                </div>
              </div>

              {/* STAR Analysis */}
              {currentFeedback.starAdherence && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">STAR Framework Analysis</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <STARComponent label="Situation" present={currentFeedback.starAdherence.hasSituation} />
                    <STARComponent label="Task" present={currentFeedback.starAdherence.hasTask} />
                    <STARComponent label="Action" present={currentFeedback.starAdherence.hasAction} />
                    <STARComponent label="Result" present={currentFeedback.starAdherence.hasResult} />
                  </div>
                </div>
              )}

              {/* Communication Quality */}
              {currentFeedback.communicationQuality && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Communication Quality</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><strong>Tone:</strong> {currentFeedback.communicationQuality.tone}</div>
                    <div><strong>Confidence:</strong> {currentFeedback.communicationQuality.confidence}</div>
                    <div><strong>Conciseness:</strong> {currentFeedback.communicationQuality.conciseness}</div>
                    <div><strong>Engagement:</strong> {currentFeedback.communicationQuality.engagement}</div>
                  </div>
                </div>
              )}

              {/* Strengths */}
              {currentFeedback.strengths && currentFeedback.strengths.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {currentFeedback.strengths.map((strength, idx) => (
                      <li key={idx} className="text-gray-700 bg-green-50 border border-green-200 rounded p-3 text-sm">
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {currentFeedback.improvements && currentFeedback.improvements.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Suggested Improvements
                  </h4>
                  <ul className="space-y-2">
                    {currentFeedback.improvements.map((improvement, idx) => (
                      <li key={idx} className="text-gray-700 bg-orange-50 border border-orange-200 rounded p-3 text-sm">
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Alternative Approaches */}
              {currentFeedback.alternativeApproaches && currentFeedback.alternativeApproaches.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                    Alternative Approaches
                  </h4>
                  <ul className="space-y-2">
                    {currentFeedback.alternativeApproaches.map((approach, idx) => (
                      <li key={idx} className="text-gray-700 bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                        {approach}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next button */}
              <div className="flex justify-end">
                <Button onClick={handleNextQuestion} variant="primary">
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Session'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Setup view
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Start Writing Practice Session</h2>
        
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Type
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Individual Question">Individual Question</option>
              <option value="Timed Challenge">Timed Challenge</option>
              <option value="Mock Interview">Mock Interview</option>
              <option value="Targeted Practice">Targeted Practice</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Role (Optional)
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Software Engineer, Product Manager"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {difficulties.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button
            onClick={handleStartSession}
            disabled={loading}
            variant="primary"
            className="w-full"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Start Practice Session'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Helper components
const ScoreItem = ({ label, score }) => (
  <div className="bg-white rounded p-3">
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="text-sm font-semibold text-gray-700">{score}</div>
    </div>
  </div>
);

const STARComponent = ({ label, present }) => (
  <div className={`flex items-center gap-2 p-2 rounded ${present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
    {present ? (
      <CheckCircle className="w-4 h-4" />
    ) : (
      <AlertCircle className="w-4 h-4" />
    )}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default WritingPracticeSession;
