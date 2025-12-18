import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import technicalPrepAPI from '../api/technicalPrep';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import api from '../api/axios';
import { 
  CodeBracketIcon,
  ServerIcon,
  DocumentTextIcon,
  BookmarkIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
  FireIcon,
  SparklesIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const TechnicalInterviewPrep = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('coding');
  const [codingChallenges, setCodingChallenges] = useState([]);
  const [systemDesignQuestions, setSystemDesignQuestions] = useState([]);
  const [caseStudies, setCaseStudies] = useState([]);
  const [bookmarkedChallenges, setBookmarkedChallenges] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Generation state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [userJobs, setUserJobs] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    loadData();
    loadPerformance();
  }, []);

  useEffect(() => {
    if (activeTab === 'coding') {
      loadCodingChallenges();
    } else if (activeTab === 'system-design') {
      loadSystemDesignQuestions();
    } else if (activeTab === 'case-studies') {
      loadCaseStudies();
    } else if (activeTab === 'bookmarks') {
      loadBookmarks();
    }
  }, [activeTab, searchQuery, difficultyFilter, categoryFilter, levelFilter, typeFilter, showCompleted]);

  const loadData = async () => {
    try {
      setLoading(true);
      await loadCodingChallenges();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const loadCodingChallenges = async () => {
    try {
      const params = {
        search: searchQuery,
        difficulty: difficultyFilter,
        category: categoryFilter,
        completed: showCompleted,
        limit: 20
      };
      const data = await technicalPrepAPI.getCodingChallenges(params);
      setCodingChallenges(data.challenges);
    } catch (err) {
      console.error('Failed to load coding challenges:', err);
    }
  };

  const loadSystemDesignQuestions = async () => {
    try {
      const params = {
        search: searchQuery,
        level: levelFilter,
        completed: showCompleted,
        limit: 20
      };
      const data = await technicalPrepAPI.getSystemDesignQuestions(params);
      setSystemDesignQuestions(data.questions);
    } catch (err) {
      console.error('Failed to load system design questions:', err);
    }
  };

  const loadCaseStudies = async () => {
    try {
      const params = {
        search: searchQuery,
        type: typeFilter,
        completed: showCompleted,
        limit: 20
      };
      const data = await technicalPrepAPI.getCaseStudies(params);
      setCaseStudies(data.caseStudies);
    } catch (err) {
      console.error('Failed to load case studies:', err);
    }
  };

  const loadBookmarks = async () => {
    try {
      const data = await technicalPrepAPI.getBookmarkedChallenges();
      setBookmarkedChallenges(data.challenges);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  };

  const loadPerformance = async () => {
    try {
      const data = await technicalPrepAPI.getPerformanceAnalytics();
      setPerformance(data.performance);
    } catch (err) {
      console.error('Failed to load performance:', err);
    }
  };

  const loadUserJobs = async () => {
    try {
      const response = await api.get('/api/jobs');
      setUserJobs(response.data.data?.jobs || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  };

  const handleGenerateFromJob = async (jobId) => {
    try {
      setGenerating(true);
      setGenerateError(null);
      
      const data = await technicalPrepAPI.getJobSpecificChallenges(jobId);
      
      // Refresh the current tab's data
      if (activeTab === 'coding') {
        await loadCodingChallenges();
      } else if (activeTab === 'system-design') {
        await loadSystemDesignQuestions();
      } else if (activeTab === 'case-studies') {
        await loadCaseStudies();
      }
      
      setShowGenerateModal(false);
      setGenerationResult(data);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Failed to generate challenges:', err);
      setGenerateError(err.response?.data?.message || 'Failed to generate challenges');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteChallenge = async (id, type) => {
    setItemToDelete({ id, type });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    const { id, type } = itemToDelete;

    try {
      console.log('Deleting item:', { id, type });
      
      if (type === 'coding') {
        await technicalPrepAPI.deleteCodingChallenge(id);
        console.log('Successfully deleted coding challenge');
        await loadCodingChallenges();
      } else if (type === 'system-design') {
        await technicalPrepAPI.deleteSystemDesignQuestion(id);
        console.log('Successfully deleted system design question');
        await loadSystemDesignQuestions();
      } else if (type === 'case-study') {
        await technicalPrepAPI.deleteCaseStudy(id);
        console.log('Successfully deleted case study');
        await loadCaseStudies();
      }
      
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to delete:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to delete');
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
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

  const renderPerformanceStats = () => {
    if (!performance) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Completed</p>
              <p className="text-3xl font-bold text-blue-600">{performance.totalChallengesCompleted}</p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-green-600">{Math.round(performance.averageScore)}%</p>
            </div>
            <TrophyIcon className="h-12 w-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Time Spent</p>
              <p className="text-3xl font-bold text-purple-600">
                {Math.round(performance.totalTimeSpent / 60)}h
              </p>
            </div>
            <ClockIcon className="h-12 w-12 text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600">{performance.currentStreak || 0} days</p>
            </div>
            <FireIcon className="h-12 w-12 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>
    );
  };

  const renderCodingChallenges = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {codingChallenges.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <CodeBracketIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No coding challenges found</p>
        </div>
      ) : (
        codingChallenges.map((challenge) => (
          <div
            key={challenge._id}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all relative group overflow-hidden"
          >
            <div
              className="cursor-pointer p-6"
              onClick={() => navigate(`/technical-prep/coding/${challenge._id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
                  {challenge.title}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {challenge.description}
              </p>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {challenge.category}
                </span>
                <div className="flex items-center text-gray-500 text-sm">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {challenge.timeLimit}m
                </div>
              </div>

              {challenge.techStack?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {challenge.techStack.slice(0, 3).map((tech, idx) => (
                    <span key={idx} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {tech}
                    </span>
                  ))}
                  {challenge.techStack.length > 3 && (
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      +{challenge.techStack.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="absolute bottom-3 right-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChallenge(challenge._id, 'coding');
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white p-2 rounded-lg shadow-md hover:shadow-lg hover:bg-red-50 border border-gray-200 hover:border-red-300"
                title="Delete challenge"
              >
                <TrashIcon className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderSystemDesignQuestions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {systemDesignQuestions.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <ServerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No system design questions found</p>
        </div>
      ) : (
        systemDesignQuestions.map((question) => (
          <div
            key={question._id}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all relative group overflow-hidden"
          >
            <div
              className="cursor-pointer p-6"
              onClick={() => navigate(`/technical-prep/system-design/${question._id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
                  {question.title}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getLevelColor(question.level)}`}>
                  {question.level}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {question.scenario}
              </p>

              {question.keyComponents?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {question.keyComponents.slice(0, 4).map((component, idx) => (
                    <span key={idx} className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      {component}
                    </span>
                  ))}
                  {question.keyComponents.length > 4 && (
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      +{question.keyComponents.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="absolute bottom-3 right-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChallenge(question._id, 'system-design');
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white p-2 rounded-lg shadow-md hover:shadow-lg hover:bg-red-50 border border-gray-200 hover:border-red-300"
                title="Delete question"
              >
                <TrashIcon className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderCaseStudies = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {caseStudies.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No case studies found</p>
        </div>
      ) : (
        caseStudies.map((caseStudy) => (
          <div
            key={caseStudy._id}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all relative group overflow-hidden"
          >
            <div
              className="cursor-pointer p-6"
              onClick={() => navigate(`/technical-prep/case-study/${caseStudy._id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
                  {caseStudy.title}
                </h3>
                <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100 whitespace-nowrap">
                  {caseStudy.type}
                </span>
              </div>
              
              <p className="text-sm text-gray-500 mb-2">{caseStudy.industry}</p>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {caseStudy.scenario}
              </p>

              {caseStudy.questions?.length > 0 && (
                <div className="text-sm text-gray-500">
                  {caseStudy.questions.length} questions
                </div>
              )}
            </div>
            
            <div className="absolute bottom-3 right-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChallenge(caseStudy._id, 'case-study');
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white p-2 rounded-lg shadow-md hover:shadow-lg hover:bg-red-50 border border-gray-200 hover:border-red-300"
                title="Delete case study"
              >
                <TrashIcon className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderBookmarks = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bookmarkedChallenges.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <BookmarkIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No bookmarked challenges</p>
        </div>
      ) : (
        bookmarkedChallenges.map((challenge) => (
          <div
            key={challenge._id}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              if (challenge.type === 'coding') {
                navigate(`/technical-prep/coding/${challenge._id}`);
              } else if (challenge.type === 'systemDesign') {
                navigate(`/technical-prep/system-design/${challenge._id}`);
              } else if (challenge.type === 'caseStudy') {
                navigate(`/technical-prep/case-study/${challenge._id}`);
              }
            }}
          >
            <div className="flex items-center mb-2">
              {challenge.type === 'coding' && <CodeBracketIcon className="h-5 w-5 text-blue-600 mr-2" />}
              {challenge.type === 'systemDesign' && <ServerIcon className="h-5 w-5 text-purple-600 mr-2" />}
              {challenge.type === 'caseStudy' && <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />}
              <span className="text-xs font-medium text-gray-500 uppercase">{challenge.type}</span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {challenge.title}
            </h3>
            
            <p className="text-gray-600 text-sm line-clamp-2">
              {challenge.description || challenge.scenario}
            </p>
          </div>
        ))
      )}
    </div>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Technical Interview Preparation
            </h1>
            <p className="text-gray-600">
              Practice coding challenges, system design, and case studies to ace your interviews
            </p>
          </div>
          <Button
            onClick={() => {
              loadUserJobs();
              setShowGenerateModal(true);
            }}
            className="flex items-center"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            Generate from Job
          </Button>
        </div>

        {/* Success Modal */}
        {showSuccessModal && generationResult && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <CheckCircleIcon className="h-10 w-10 text-green-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Successfully Generated!
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Technical prep content for <span className="font-semibold">{generationResult.jobTitle}</span>
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CodeBracketIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-gray-700">Coding Challenges</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {generationResult.codingChallenges?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ServerIcon className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-gray-700">System Design Questions</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">
                      {generationResult.systemDesignQuestions?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-gray-700">Case Studies</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {generationResult.caseStudies?.length || 0}
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    setShowSuccessModal(false);
                    setGenerationResult(null);
                  }}
                  className="w-full"
                >
                  Start Practicing
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <TrashIcon className="h-10 w-10 text-red-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Delete Confirmation
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setItemToDelete(null);
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Generate Technical Prep from Job</h2>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Select a job to generate personalized coding challenges, system design questions, and case studies based on the role requirements.
              </p>

              {generateError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                  {generateError}
                </div>
              )}

              {generating ? (
                <div className="text-center py-12">
                  <LoadingSpinner />
                  <p className="text-gray-600 mt-4">Generating technical prep content... This may take a moment.</p>
                </div>
              ) : userJobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No jobs found. Add jobs to your tracker first.</p>
                  <Button onClick={() => navigate('/jobs')}>Go to Jobs</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {userJobs.map((job) => (
                    <div
                      key={job._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                      onClick={() => handleGenerateFromJob(job._id)}
                    >
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.company}</p>
                      {job.techStack && job.techStack.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {job.techStack.slice(0, 5).map((tech, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {tech}
                            </span>
                          ))}
                          {job.techStack.length > 5 && (
                            <span className="text-xs text-gray-600">+{job.techStack.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Stats */}
        {renderPerformanceStats()}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search challenges..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="secondary"
              className="flex items-center justify-center gap-2 px-6"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              Filters
              {(difficultyFilter || categoryFilter || levelFilter || typeFilter || showCompleted) && (
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {[difficultyFilter, categoryFilter, levelFilter, typeFilter, showCompleted].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {activeTab === 'coding' && (
                  <>
                    <div>
                      <label htmlFor="difficulty-filter-select" className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                      <select
                        id="difficulty-filter-select"
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">All Difficulties</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="category-filter-select" className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        id="category-filter-select"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">All Categories</option>
                        <option value="Data Structures">Data Structures</option>
                        <option value="Algorithms">Algorithms</option>
                        <option value="Database">Database</option>
                        <option value="API Design">API Design</option>
                        <option value="Frontend">Frontend</option>
                        <option value="Backend">Backend</option>
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'system-design' && (
                  <div>
                    <label htmlFor="level-filter-select" className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                    <select
                      id="level-filter-select"
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">All Levels</option>
                      <option value="Junior">Junior</option>
                      <option value="Mid-Level">Mid-Level</option>
                      <option value="Senior">Senior</option>
                      <option value="Staff">Staff</option>
                      <option value="Principal">Principal</option>
                    </select>
                  </div>
                )}

                {activeTab === 'case-studies' && (
                  <div>
                    <label htmlFor="type-filter-select" className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      id="type-filter-select"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">All Types</option>
                      <option value="Business">Business</option>
                      <option value="Technical">Technical</option>
                      <option value="Product">Product</option>
                      <option value="Consulting">Consulting</option>
                    </select>
                  </div>
                )}

                <div>
                  <span id="status-filter-label" className="block text-sm font-medium text-gray-700 mb-2">Status</span>
                  <label htmlFor="show-completed-checkbox" className="flex items-center px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                    <input
                      id="show-completed-checkbox"
                      type="checkbox"
                      checked={showCompleted}
                      onChange={(e) => setShowCompleted(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 font-medium">Show Completed Only</span>
                  </label>
                </div>
              </div>
                
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setDifficultyFilter('');
                    setCategoryFilter('');
                    setLevelFilter('');
                    setTypeFilter('');
                    setSearchQuery('');
                    setShowCompleted(false);
                  }}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex flex-wrap gap-1 sm:gap-4 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('coding')}
              className={`py-2 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                activeTab === 'coding'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CodeBracketIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Coding Challenges</span>
              <span className="sm:hidden">Coding</span>
            </button>
            
            <button
              onClick={() => setActiveTab('system-design')}
              className={`py-2 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                activeTab === 'system-design'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ServerIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">System Design</span>
              <span className="sm:hidden">System</span>
            </button>
            
            <button
              onClick={() => setActiveTab('case-studies')}
              className={`py-2 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                activeTab === 'case-studies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Case Studies</span>
              <span className="sm:hidden">Cases</span>
            </button>
            
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`py-2 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                activeTab === 'bookmarks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookmarkIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Bookmarked</span>
              <span className="sm:hidden">Saved</span>
            </button>
            
            <button
              onClick={() => navigate('/prep/performance')}
              className="py-2 sm:py-4 px-2 sm:px-3 border-b-2 border-transparent font-medium text-xs sm:text-sm flex items-center text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Performance
            </button>
          </nav>
        </div>

        {/* Content */}
        {error && <ErrorMessage message={error} className="mb-6" />}
        
        {activeTab === 'coding' && renderCodingChallenges()}
        {activeTab === 'system-design' && renderSystemDesignQuestions()}
        {activeTab === 'case-studies' && renderCaseStudies()}
        {activeTab === 'bookmarks' && renderBookmarks()}
      </div>
    </div>
  );
};

export default TechnicalInterviewPrep;
