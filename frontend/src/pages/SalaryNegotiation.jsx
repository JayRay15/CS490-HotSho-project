import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Container from '../components/Container';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import {
  createNegotiation,
  getNegotiations,
  getNegotiationById,
  updateNegotiation,
  deleteNegotiation,
  generateTalkingPoints,
  addCounteroffer,
  addConversation,
  getSalaryProgression,
  getNegotiationAnalytics,
  updateChecklistItem,
  completeConfidenceExercise,
  markScenarioPracticed,
  markTalkingPointUsed
} from '../api/negotiation';
import { getSalaryResearch } from '../api/salary';
import { setAuthToken } from '../api/axios';
import { NegotiationList, CreateNegotiationForm } from '../components/SalaryNegotiationComponents';
import { NegotiationDetails, AnalyticsView } from '../components/SalaryNegotiationDetails';

/**
 * UC-083: Salary Negotiation Guidance and Tools
 * 
 * Comprehensive salary negotiation interface providing:
 * - Market data research
 * - Personalized talking points
 * - Negotiation scripts and scenarios
 * - Total compensation evaluation
 * - Timing strategies
 * - Counteroffer evaluation
 * - Confidence building exercises
 * - Outcome tracking
 */

export default function SalaryNegotiation() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // list, create, details
  
  // Data states
  const [negotiations, setNegotiations] = useState([]);
  const [currentNegotiation, setCurrentNegotiation] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [progression, setProgression] = useState(null);
  
  // Form states for creating new negotiation
  const [formData, setFormData] = useState({
    offerDetails: {
      company: '',
      position: '',
      location: '',
      receivedDate: new Date().toISOString().split('T')[0],
      deadlineDate: '',
      initialOffer: {
        baseSalary: '',
        signingBonus: '',
        equityValue: '',
        performanceBonus: '',
        benefits: '',
        otherPerks: '',
        totalCompensation: ''
      }
    },
    context: {
      currentSalary: '',
      desiredSalary: '',
      minimumAcceptable: '',
      yearsExperience: '',
      specializations: [],
      certifications: [],
      uniqueSkills: [],
      achievements: [],
      competingOffers: []
    }
  });

  // UI states
  const [expandedSections, setExpandedSections] = useState({
    talkingPoints: true,
    scenarios: false,
    compensation: false,
    timing: false,
    checklist: false,
    confidence: false,
    counteroffers: false,
    conversations: false
  });

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      
      await Promise.all([
        loadNegotiations(),
        loadAnalytics()
      ]);
      
      // If jobId provided, pre-fill form with job data
      if (jobId) {
        await prefillFromJob(jobId);
        setActiveTab('create');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error initializing:', err);
      setError(err.response?.data?.message || 'Failed to load negotiation data');
      setLoading(false);
    }
  };

  const loadNegotiations = async () => {
    try {
      console.log('Loading negotiations...');
      const response = await getNegotiations();
      console.log('Negotiations response:', response);
      console.log('Response.data:', response.data);
      console.log('Response.data.data:', response.data?.data);
      
      // Handle both response formats
      const loadedNegotiations = response.data?.negotiations || response.data?.data?.negotiations || [];
      console.log('Loaded negotiations count:', loadedNegotiations.length);
      console.log('Loaded negotiations:', loadedNegotiations);
      
      setNegotiations(loadedNegotiations);
      return loadedNegotiations;
    } catch (err) {
      console.error('Error loading negotiations:', err);
      console.error('Error details:', err.response?.data);
      return [];
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await getNegotiationAnalytics();
      setAnalytics(response.data.analytics);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  const prefillFromJob = async (jobId) => {
    try {
      const response = await getSalaryResearch(jobId);
      const { job, marketData } = response.data;
      
      setFormData(prev => ({
        ...prev,
        offerDetails: {
          ...prev.offerDetails,
          company: job.company || '',
          position: job.title || '',
          location: job.location || '',
          initialOffer: {
            ...prev.offerDetails.initialOffer,
            baseSalary: job.providedSalary?.min || ''
          },
          marketData: {
            medianSalary: marketData.companySizeAdjusted.median,
            minSalary: marketData.companySizeAdjusted.min,
            maxSalary: marketData.companySizeAdjusted.max,
            source: 'Market Research'
          }
        }
      }));
    } catch (err) {
      console.error('Error prefilling from job:', err);
    }
  };

  const handleCreateNegotiation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Calculate total compensation
      const { baseSalary, signingBonus, equityValue, performanceBonus } = formData.offerDetails.initialOffer;
      const totalComp = 
        (parseFloat(baseSalary) || 0) + 
        (parseFloat(signingBonus) || 0) + 
        (parseFloat(equityValue) || 0) + 
        (parseFloat(performanceBonus) || 0);
      
      // Convert numeric strings to numbers
      const dataToSubmit = {
        jobId: jobId || undefined,
        offerDetails: {
          company: formData.offerDetails.company,
          position: formData.offerDetails.position,
          location: formData.offerDetails.location || undefined,
          receivedDate: formData.offerDetails.receivedDate ? new Date(formData.offerDetails.receivedDate) : new Date(),
          deadlineDate: formData.offerDetails.deadlineDate ? new Date(formData.offerDetails.deadlineDate) : undefined,
          initialOffer: {
            baseSalary: parseFloat(baseSalary) || 0,
            signingBonus: parseFloat(signingBonus) || undefined,
            equityValue: parseFloat(equityValue) || undefined,
            performanceBonus: parseFloat(performanceBonus) || undefined,
            benefits: formData.offerDetails.initialOffer.benefits || undefined,
            otherPerks: formData.offerDetails.initialOffer.otherPerks || undefined,
            totalCompensation: totalComp
          },
          marketData: formData.offerDetails.marketData || undefined
        },
        context: {
          currentSalary: parseFloat(formData.context.currentSalary) || undefined,
          desiredSalary: parseFloat(formData.context.desiredSalary) || undefined,
          minimumAcceptable: parseFloat(formData.context.minimumAcceptable) || undefined,
          yearsExperience: parseInt(formData.context.yearsExperience) || undefined,
          specializations: formData.context.specializations || [],
          certifications: formData.context.certifications || [],
          uniqueSkills: formData.context.uniqueSkills || [],
          achievements: formData.context.achievements || [],
          competingOffers: formData.context.competingOffers || []
        }
      };

      console.log('Submitting negotiation data:', dataToSubmit);
      const response = await createNegotiation(dataToSubmit);
      console.log('Negotiation created response:', response);
      console.log('Response data:', response.data);
      
      // Handle both response formats: response.data.negotiation or response.data.data.negotiation
      const newNegotiation = response.data?.negotiation || response.data?.data?.negotiation;
      
      if (!newNegotiation) {
        console.error('No negotiation in response:', response.data);
        throw new Error('Invalid response format from server');
      }
      
      console.log('New negotiation object:', newNegotiation);
      
      // Reload the full list from backend to ensure consistency
      await loadNegotiations();
      
      setCurrentNegotiation(newNegotiation);
      setSuccess(`Negotiation session created for ${newNegotiation.offerDetails?.position || 'position'} at ${newNegotiation.offerDetails?.company || 'company'}!`);
      setActiveTab('details');
      setLoading(false);
      
      // Clear form
      setFormData({
        offerDetails: {
          company: '',
          position: '',
          location: '',
          receivedDate: '',
          deadlineDate: '',
          initialOffer: {
            baseSalary: '',
            signingBonus: '',
            equityValue: '',
            performanceBonus: '',
            benefits: '',
            otherPerks: ''
          },
          marketData: null
        },
        context: {
          currentSalary: '',
          desiredSalary: '',
          minimumAcceptable: '',
          yearsExperience: '',
          specializations: [],
          certifications: [],
          uniqueSkills: [],
          achievements: [],
          competingOffers: []
        }
      });
    } catch (err) {
      console.error('Error creating negotiation:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to create negotiation session');
      setLoading(false);
    }
  };

  const handleSelectNegotiation = async (id) => {
    setLoading(true);
    setError('');

    try {
      const response = await getNegotiationById(id);
      setCurrentNegotiation(response.data.negotiation);
      setActiveTab('details');
      setLoading(false);
    } catch (err) {
      console.error('Error loading negotiation:', err);
      setError(err.response?.data?.message || 'Failed to load negotiation');
      setLoading(false);
    }
  };

  const handleUpdateNegotiation = async (updates) => {
    try {
      const response = await updateNegotiation(currentNegotiation._id, updates);
      setCurrentNegotiation(response.data.negotiation);
      await loadNegotiations(); // Refresh list
    } catch (err) {
      console.error('Error updating negotiation:', err);
      setError(err.response?.data?.message || 'Failed to update negotiation');
    }
  };

  const handleDeleteNegotiation = async (id) => {
    if (!confirm('Are you sure you want to delete this negotiation session?')) return;

    try {
      await deleteNegotiation(id);
      setNegotiations(negotiations.filter(n => n._id !== id));
      if (currentNegotiation?._id === id) {
        setCurrentNegotiation(null);
        setActiveTab('list');
      }
    } catch (err) {
      console.error('Error deleting negotiation:', err);
      setError(err.response?.data?.message || 'Failed to delete negotiation');
    }
  };

  const handleToggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return `$${parseFloat(value).toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (loading && !currentNegotiation) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💼 Salary Negotiation Guidance
          </h1>
          <p className="text-gray-600">
            Confidently negotiate competitive compensation with personalized guidance, market data, and proven strategies
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onDismiss={() => setError('')} />
          </div>
        )}

        {success && (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start justify-between">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800">{success}</p>
                  <button
                    onClick={() => {
                      setSuccess('');
                      setActiveTab('list');
                    }}
                    className="mt-2 text-sm text-green-700 hover:text-green-900 underline"
                  >
                    View all negotiations →
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSuccess('')}
                className="text-green-600 hover:text-green-800"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('list');
                setSuccess('');
                setError('');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Negotiations
              {negotiations.length > 0 && (
                <span className="ml-2 bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs">
                  {negotiations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('create');
                setSuccess('');
                setError('');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              New Negotiation
            </button>
            {currentNegotiation && (
              <button
                onClick={() => {
                  setActiveTab('details');
                  setSuccess('');
                  setError('');
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Current Session
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab('analytics');
                setSuccess('');
                setError('');
                loadAnalyticsData();
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'list' && (
            <NegotiationList
              negotiations={negotiations}
              onSelect={handleSelectNegotiation}
              onDelete={handleDeleteNegotiation}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'create' && (
            <CreateNegotiationForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateNegotiation}
              loading={loading}
            />
          )}

          {activeTab === 'details' && currentNegotiation && (
            <NegotiationDetails
              negotiation={currentNegotiation}
              onUpdate={handleUpdateNegotiation}
              expandedSections={expandedSections}
              onToggleSection={handleToggleSection}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onGenerateTalkingPoints={async () => {
                try {
                  const response = await generateTalkingPoints(currentNegotiation._id);
                  setCurrentNegotiation(prev => ({
                    ...prev,
                    talkingPoints: response.data.talkingPoints
                  }));
                } catch (err) {
                  setError('Failed to generate talking points');
                }
              }}
              onMarkTalkingPointUsed={async (index) => {
                try {
                  await markTalkingPointUsed(currentNegotiation._id, index);
                  setCurrentNegotiation(prev => {
                    const updated = { ...prev };
                    updated.talkingPoints[index].isUsed = true;
                    return updated;
                  });
                } catch (err) {
                  setError('Failed to update talking point');
                }
              }}
              onMarkScenarioPracticed={async (index) => {
                try {
                  await markScenarioPracticed(currentNegotiation._id, index);
                  setCurrentNegotiation(prev => {
                    const updated = { ...prev };
                    updated.scenarios[index].isPracticed = true;
                    return updated;
                  });
                } catch (err) {
                  setError('Failed to update scenario');
                }
              }}
              onUpdateChecklistItem={async (index, completed) => {
                try {
                  await updateChecklistItem(currentNegotiation._id, index, completed);
                  setCurrentNegotiation(prev => {
                    const updated = { ...prev };
                    updated.preparationChecklist[index].isCompleted = completed;
                    return updated;
                  });
                } catch (err) {
                  setError('Failed to update checklist');
                }
              }}
              onCompleteExercise={async (index, reflection) => {
                try {
                  await completeConfidenceExercise(currentNegotiation._id, index, reflection);
                  setCurrentNegotiation(prev => {
                    const updated = { ...prev };
                    updated.confidenceExercises[index].isCompleted = true;
                    updated.confidenceExercises[index].completedDate = new Date();
                    if (reflection) {
                      updated.confidenceExercises[index].reflection = reflection;
                    }
                    return updated;
                  });
                } catch (err) {
                  setError('Failed to complete exercise');
                }
              }}
              onAddCounteroffer={async (data) => {
                try {
                  const response = await addCounteroffer(currentNegotiation._id, data);
                  setCurrentNegotiation(prev => ({
                    ...prev,
                    counteroffers: [...prev.counteroffers, response.data.counteroffer]
                  }));
                } catch (err) {
                  setError('Failed to add counteroffer');
                }
              }}
              onAddConversation={async (data) => {
                try {
                  const response = await addConversation(currentNegotiation._id, data);
                  setCurrentNegotiation(prev => ({
                    ...prev,
                    conversations: [...prev.conversations, response.data.conversation]
                  }));
                } catch (err) {
                  setError('Failed to log conversation');
                }
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              analytics={analytics}
              onLoadProgression={async () => {
                try {
                  const response = await getSalaryProgression();
                  setProgression(response.data);
                } catch (err) {
                  setError('Failed to load progression data');
                }
              }}
              progression={progression}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      </div>
    </Container>
  );
}
