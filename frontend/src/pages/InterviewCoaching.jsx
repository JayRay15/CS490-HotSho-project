import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import {
  submitInterviewResponse,
  getInterviewResponses,
  getPracticeStats,
  generateInterviewQuestions,
  deleteInterviewResponse,
  compareResponseVersions
} from '../api/interviewCoaching';
import Card from '../components/Card';
import Button from '../components/Button';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const CATEGORIES = [
  'Behavioral',
  'Technical',
  'Situational',
  'Leadership',
  'Teamwork',
  'Problem-Solving',
  'Other'
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function InterviewCoaching() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('practice');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // Practice form state
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [category, setCategory] = useState('Behavioral');
  const [difficulty, setDifficulty] = useState('Medium');
  const [targetDuration, setTargetDuration] = useState(120);
  const [context, setContext] = useState({ jobTitle: '', company: '', industry: '' });
  
  // Feedback state
  const [feedback, setFeedback] = useState(null);
  const [submittedResponse, setSubmittedResponse] = useState(null);
  
  // History state
  const [responses, setResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  
  // Stats state
  const [stats, setStats] = useState(null);
  
  // Question generation state
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadResponses();
    } else if (activeTab === 'progress') {
      loadStats();
    }
  }, [activeTab]);

  const loadResponses = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);
      const { data } = await getInterviewResponses();
      setResponses(data.data.responses);
    } catch (err) {
      setError('Failed to load response history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);
      const { data } = await getPracticeStats();
      setStats(data.data);
    } catch (err) {
      setError('Failed to load practice statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim() || !response.trim()) {
      setError('Please provide both a question and response');
      return;
    }

    if (response.trim().split(/\s+/).length < 20) {
      setError('Response is too short. Please provide at least 20 words.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setFeedback(null);
      
      const token = await getToken();
      setAuthToken(token);
      
      const { data } = await submitInterviewResponse({
        question,
        response,
        category,
        difficulty,
        targetDuration,
        context: {
          jobTitle: context.jobTitle || undefined,
          company: context.company || undefined,
          industry: context.industry || undefined
        }
      });

      setFeedback(data.data.interviewResponse.feedback);
      setSubmittedResponse(data.data.interviewResponse);
      
      // Scroll to feedback
      setTimeout(() => {
        document.getElementById('feedback-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit response');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateQuestions = async () => {
    try {
      setGenerating(true);
      const token = await getToken();
      setAuthToken(token);
      const { data } = await generateInterviewQuestions({
        category,
        context: {
          jobTitle: context.jobTitle || undefined,
          company: context.company || undefined,
          industry: context.industry || undefined
        },
        count: 5
      });
      setGeneratedQuestions(data.data.questions);
    } catch (err) {
      setError('Failed to generate questions');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteResponse = async (id) => {
    if (!confirm('Are you sure you want to delete this response?')) return;
    
    try {
      const token = await getToken();
      setAuthToken(token);
      await deleteInterviewResponse(id);
      loadResponses();
    } catch (err) {
      setError('Failed to delete response');
      console.error(err);
    }
  };

  const handleReset = () => {
    setQuestion('');
    setResponse('');
    setFeedback(null);
    setSubmittedResponse(null);
    setError(null);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 75) return 'bg-blue-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Response Coaching</h1>
        <p className="text-gray-600">
          Practice your interview responses and get AI-powered feedback to improve your performance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('practice')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'practice'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Practice
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'progress'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Progress
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <XCircleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Practice Tab */}
      {activeTab === 'practice' && (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Practice Response</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateQuestions}
                disabled={generating || submitting}
                className="w-full sm:w-auto sm:min-w-[200px] whitespace-nowrap flex-shrink-0 inline-flex items-center justify-center"
              >
                {generating ? (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2" />
                    Generating...
                  </span>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="whitespace-nowrap">Generate Questions</span>
                  </>
                )}
              </Button>
            </div>
          </Card>

          {generatedQuestions.length > 0 && (
            <Card>
              <h3 className="font-medium text-blue-900 mb-4 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2" />
                Suggested Questions
              </h3>
              <div className="space-y-3">
                {generatedQuestions.map((q, idx) => (
                  <button
                    key={`question-${idx}-${q.text.substring(0, 20)}`}
                    onClick={() => {
                      setQuestion(q.text);
                      setDifficulty(q.difficulty);
                      setGeneratedQuestions([]);
                    }}
                    className="block w-full text-left p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border-2 border-blue-200 hover:border-blue-400"
                  >
                    <p className="text-gray-900 font-medium mb-2">{q.text}</p>
                    {q.tips && (
                      <p className="text-sm text-gray-600 italic">{q.tips}</p>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DIFFICULTIES.map(diff => (
                      <option key={diff} value={diff}>{diff}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(parseInt(e.target.value))}
                    min="30"
                    max="300"
                    step="15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={context.jobTitle}
                    onChange={(e) => setContext({ ...context, jobTitle: e.target.value })}
                    placeholder="e.g., Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    value={context.company}
                    onChange={(e) => setContext({ ...context, company: e.target.value })}
                    placeholder="e.g., Google"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry (Optional)
                  </label>
                  <input
                    type="text"
                    value={context.industry}
                    onChange={(e) => setContext({ ...context, industry: e.target.value })}
                    placeholder="e.g., Technology"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Question
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter the interview question you want to practice..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Response
                </label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Write your response here... (minimum 20 words)"
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Word count: {response.trim().split(/\s+/).filter(w => w).length}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={submitting || generating}
                  className="min-w-[160px] whitespace-nowrap flex-shrink-0 inline-flex items-center justify-center"
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                      Analyzing...
                    </span>
                  ) : (
                    <span className="whitespace-nowrap">Get Feedback</span>
                  )}
                </Button>
                {(feedback || response) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="min-w-[120px] whitespace-nowrap flex-shrink-0 inline-flex items-center justify-center"
                    disabled={submitting || generating}
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    <span className="whitespace-nowrap">Reset</span>
                  </Button>
                )}
              </div>
            </form>
          </Card>

          {/* Feedback Section */}
          {feedback && (
            <div id="feedback-section" className="space-y-6">
              {/* Overall Score */}
              <Card>
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overall Score</h2>
                  <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(feedback.overallScore)} mb-4`}>
                    <span className={`text-4xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                      {feedback.overallScore}
                    </span>
                  </div>
                  {submittedResponse?.improvementMetrics && (
                    <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
                      <span className="text-gray-600">
                        Attempt #{submittedResponse.improvementTracking.attempts}
                      </span>
                      {submittedResponse.improvementMetrics.scoreChange !== 0 && (
                        <span className={submittedResponse.improvementMetrics.scoreChange > 0 ? 'text-green-600' : 'text-red-600'}>
                          {submittedResponse.improvementMetrics.scoreChange > 0 ? '+' : ''}
                          {submittedResponse.improvementMetrics.scoreChange} points
                          ({submittedResponse.improvementMetrics.percentageImprovement > 0 ? '+' : ''}
                          {submittedResponse.improvementMetrics.percentageImprovement}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Score Breakdown */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Content', score: feedback.contentScore },
                    { label: 'Structure', score: feedback.structureScore },
                    { label: 'Clarity', score: feedback.clarityScore },
                    { label: 'Relevance', score: feedback.relevanceScore },
                    { label: 'Specificity', score: feedback.specificityScore },
                    { label: 'Impact', score: feedback.impactScore }
                  ].map(({ label, score }) => (
                    <div key={label} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">{label}</p>
                      <p className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <div className="flex items-center mb-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {feedback.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span className="text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card>
                  <div className="flex items-center mb-3">
                    <XCircleIcon className="w-6 h-6 text-red-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
                  </div>
                  <ul className="space-y-2">
                    {feedback.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span className="text-gray-700">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Suggestions */}
              <Card>
                <div className="flex items-center mb-3">
                  <LightBulbIcon className="w-6 h-6 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Suggestions</h3>
                </div>
                <ul className="space-y-2">
                  {feedback.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-yellow-600 mr-2">{idx + 1}.</span>
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Length Analysis */}
              {feedback.lengthAnalysis && (
                <Card>
                  <div className="flex items-center mb-3">
                    <ChartBarIcon className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Length Analysis</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Word Count:</span>
                      <span className="font-semibold">{feedback.lengthAnalysis.wordCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Estimated Duration:</span>
                      <span className="font-semibold">{feedback.lengthAnalysis.estimatedDuration}s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Recommendation:</span>
                      <span className={`font-semibold ${
                        feedback.lengthAnalysis.recommendation === 'Optimal' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {feedback.lengthAnalysis.recommendation}
                      </span>
                    </div>
                    {feedback.lengthAnalysis.adjustmentSuggestion && (
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {feedback.lengthAnalysis.adjustmentSuggestion}
                      </p>
                    )}
                  </div>
                </Card>
              )}

              {/* STAR Analysis */}
              {feedback.starAnalysis && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">STAR Method Analysis</h3>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 font-medium">Overall Adherence</span>
                      <span className={`text-xl font-bold ${getScoreColor(feedback.starAnalysis.overallAdherence)}`}>
                        {feedback.starAnalysis.overallAdherence}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${feedback.starAnalysis.overallAdherence}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {Object.entries(feedback.starAnalysis.components).map(([key, component]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900 capitalize">{key}</h4>
                          <span className={`text-lg font-bold ${component.present ? 'text-green-600' : 'text-red-600'}`}>
                            {component.present ? component.score : 0}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{component.feedback}</p>
                      </div>
                    ))}
                  </div>
                  
                  {feedback.starAnalysis.recommendations && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {feedback.starAnalysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <span className="text-blue-600 mr-2">→</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              )}

              {/* Weak Language Patterns */}
              {feedback.weakLanguagePatterns && feedback.weakLanguagePatterns.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Improvement</h3>
                  <div className="space-y-3">
                    {feedback.weakLanguagePatterns.map((pattern, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border-l-4 border-yellow-500">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-gray-900">"{pattern.pattern}"</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Context:</span> {pattern.context}
                        </p>
                        <p className="text-sm text-green-700 mb-2">
                          <span className="font-medium">Better:</span> {pattern.alternative}
                        </p>
                        <p className="text-xs text-gray-500 italic">{pattern.reason}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Alternative Approaches */}
              {feedback.alternativeApproaches && feedback.alternativeApproaches.length > 0 && (
                <Card>
                  <div className="flex items-center mb-4">
                    <SparklesIcon className="w-6 h-6 text-purple-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Alternative Approaches</h3>
                  </div>
                  <div className="space-y-4">
                    {feedback.alternativeApproaches.map((approach, idx) => (
                      <div key={idx} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-2">{approach.title}</h4>
                        <p className="text-gray-700 mb-3">{approach.description}</p>
                        <div className="bg-white p-3 rounded mb-2">
                          <p className="text-sm text-gray-600 mb-1 font-medium">Example:</p>
                          <p className="text-sm text-gray-800 italic">"{approach.example}"</p>
                        </div>
                        <p className="text-xs text-purple-700">
                          <span className="font-medium">When to use:</span> {approach.whenToUse}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading history...</p>
            </div>
          ) : responses.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-600">No practice responses yet. Start practicing to build your history!</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {responses.map((resp) => (
                <Card key={resp._id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {resp.question.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(resp.createdAt).toLocaleDateString()}
                        </span>
                        {resp.improvementTracking.attempts > 1 && (
                          <span className="text-sm text-purple-600 flex items-center">
                            <ArrowPathIcon className="w-4 h-4 mr-1" />
                            Attempt #{resp.improvementTracking.attempts}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 font-medium mb-2">{resp.question.text}</p>
                      <p className="text-gray-600 text-sm line-clamp-2">{resp.response}</p>
                      {resp.feedback && (
                        <div className="mt-3 flex items-center space-x-4">
                          <span className={`text-lg font-bold ${getScoreColor(resp.feedback.overallScore)}`}>
                            Score: {resp.feedback.overallScore}
                          </span>
                          {resp.improvementMetrics && resp.improvementMetrics.scoreChange !== 0 && (
                            <span className={resp.improvementMetrics.scoreChange > 0 ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                              {resp.improvementMetrics.scoreChange > 0 ? '+' : ''}
                              {resp.improvementMetrics.scoreChange} pts
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuestion(resp.question.text);
                          setCategory(resp.question.category);
                          setActiveTab('practice');
                        }}
                      >
                        Retry
                      </Button>
                      <button
                        onClick={() => handleDeleteResponse(resp._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading statistics...</p>
            </div>
          ) : !stats || stats.totalPracticed === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-600">No practice data yet. Complete some practice responses to see your progress!</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-1">Total Practiced</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalPracticed}</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-1">Average Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>
                      {stats.averageScore}
                    </p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-1">Average Improvement</p>
                    {stats.averageImprovement === 0 || isNaN(stats.averageImprovement) ? (
                      <div>
                        <p className="text-3xl font-bold text-gray-400">N/A</p>
                        <p className="text-xs text-gray-500 mt-1">Retry questions to track improvement</p>
                      </div>
                    ) : (
                      <p className={`text-3xl font-bold ${stats.averageImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.averageImprovement > 0 ? '+' : ''}{stats.averageImprovement}%
                      </p>
                    )}
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-1">Categories Practiced</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.byCategory.length}</p>
                  </div>
                </Card>
              </div>

              {/* Score Trend */}
              {stats.scoresTrend && stats.scoresTrend.length > 0 && (
                <Card>
                  <div className="flex items-center mb-4">
                    <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Recent Performance</h3>
                  </div>
                  <div className="h-64 flex items-end justify-between space-x-2 bg-gray-50 rounded p-4">
                    {stats.scoresTrend.map((point, idx) => {
                      const heightPercent = Math.max((point.score / 100) * 100, 10);
                      const barColor = point.score >= 75 ? 'bg-green-500 hover:bg-green-600' : 
                                       point.score >= 60 ? 'bg-blue-500 hover:bg-blue-600' : 
                                       point.score >= 50 ? 'bg-yellow-500 hover:bg-yellow-600' : 
                                       'bg-red-500 hover:bg-red-600';
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div className="text-xs font-semibold text-gray-700 mb-1">{point.score}</div>
                          <div 
                            className={`w-full ${barColor} rounded-t transition-all cursor-pointer shadow-sm`}
                            style={{ height: `${heightPercent}%`, minHeight: '20px' }}
                            title={`Score: ${point.score}\nDate: ${new Date(point.date).toLocaleDateString()}`}
                          />
                          <span className="text-xs text-gray-500 mt-2">
                            {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* By Category */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Category</h3>
                <div className="space-y-4">
                  {stats.byCategory.map((cat) => (
                    <div key={cat.category}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{cat.category}</h4>
                          <p className="text-sm text-gray-600">{cat.count} response{cat.count > 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${getScoreColor(cat.avgScore)}`}>{cat.avgScore}</p>
                          <p className="text-xs text-gray-500">Best: {cat.bestScore}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-gray-600">Content</p>
                          <p className="font-semibold">{cat.avgContentScore}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-gray-600">Structure</p>
                          <p className="font-semibold">{cat.avgStructureScore}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-gray-600">Impact</p>
                          <p className="font-semibold">{cat.avgImpactScore}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
