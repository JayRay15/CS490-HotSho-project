import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getNegotiation,
  createNegotiation,
  generateTalkingPoints,
  generateNegotiationScript,
  addOffer,
  evaluateCounteroffer,
  addConfidenceExercise,
  completeExercise,
  completeNegotiation,
  getTimingStrategy
} from '../api/salary';
import { getProfile } from '../api/profile';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Card from './Card';
import Button from './Button';

/**
 * UC-083: Salary Negotiation Preparation Component
 * 
 * Comprehensive negotiation preparation tools including:
 * - Market data integration
 * - Talking points generation
 * - Negotiation scripts for different scenarios
 * - Counteroffer evaluation
 * - Confidence-building exercises
 * - Timing strategy recommendations
 * - Outcome tracking
 */
const SalaryNegotiationPrep = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [negotiation, setNegotiation] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [timingStrategy, setTimingStrategy] = useState(null);

  // Form states
  const [targetSalary, setTargetSalary] = useState('');
  const [minimumSalary, setMinimumSalary] = useState('');
  const [idealSalary, setIdealSalary] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('Initial Offer Too Low');
  const [customScenario, setCustomScenario] = useState('');
  const [offerForm, setOfferForm] = useState({
    type: 'Initial',
    baseSalary: '',
    signingBonus: '',
    performanceBonus: '',
    equity: '',
    benefits: {
      healthInsurance: false,
      dentalInsurance: false,
      visionInsurance: false,
      retirement401k: false,
      retirementMatch: '',
      paidTimeOff: '',
      sickDays: '',
      remoteWork: '',
      flexibleSchedule: false,
      professionalDevelopment: ''
    }
  });
  const [counterofferEval, setCounterofferEval] = useState(null);

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get existing negotiation
      try {
        const negResponse = await getNegotiation(jobId);
        setNegotiation(negResponse.data.data.negotiation);
        
        // Load timing strategy if negotiation exists
        if (negResponse.data.data.negotiation._id) {
          const timingResponse = await getTimingStrategy(negResponse.data.data.negotiation._id);
          setTimingStrategy(timingResponse.data.data);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setShowCreateModal(true);
        } else {
          throw err;
        }
      }

      // Get user profile for talking points generation
      const profileResponse = await getProfile();
      setUserProfile(profileResponse.data.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load negotiation data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNegotiation = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await createNegotiation({
        jobId,
        targetSalary: Number(targetSalary),
        minimumAcceptable: Number(minimumSalary),
        idealSalary: idealSalary ? Number(idealSalary) : undefined
      });
      setNegotiation(response.data.data.negotiation);
      setShowCreateModal(false);
      setError(null);
    } catch (err) {
      console.error('Error creating negotiation:', err);
      setError(err.response?.data?.message || 'Failed to create negotiation');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTalkingPoints = async () => {
    try {
      setLoading(true);
      const response = await generateTalkingPoints(negotiation._id, {
        achievements: userProfile?.achievements || [],
        skills: userProfile?.skills || [],
        education: userProfile?.education || [],
        certifications: userProfile?.certifications || []
      });
      
      // Refresh negotiation data
      await fetchData();
      setError(null);
    } catch (err) {
      console.error('Error generating talking points:', err);
      setError(err.response?.data?.message || 'Failed to generate talking points');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    try {
      setLoading(true);
      const response = await generateNegotiationScript(negotiation._id, {
        scenario: selectedScenario,
        customScenario: selectedScenario === 'Custom' ? customScenario : undefined
      });
      
      await fetchData();
      setError(null);
    } catch (err) {
      console.error('Error generating script:', err);
      setError(err.response?.data?.message || 'Failed to generate script');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOffer = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const totalComp = 
        Number(offerForm.baseSalary || 0) +
        Number(offerForm.signingBonus || 0) +
        Number(offerForm.performanceBonus || 0);

      await addOffer(negotiation._id, {
        ...offerForm,
        baseSalary: Number(offerForm.baseSalary),
        signingBonus: Number(offerForm.signingBonus || 0),
        performanceBonus: Number(offerForm.performanceBonus || 0),
        totalCompensation: totalComp,
        benefits: {
          ...offerForm.benefits,
          paidTimeOff: Number(offerForm.benefits.paidTimeOff || 0),
          sickDays: Number(offerForm.benefits.sickDays || 0)
        }
      });
      
      await fetchData();
      setOfferForm({
        type: 'Counter',
        baseSalary: '',
        signingBonus: '',
        performanceBonus: '',
        equity: '',
        benefits: {
          healthInsurance: false,
          dentalInsurance: false,
          visionInsurance: false,
          retirement401k: false,
          retirementMatch: '',
          paidTimeOff: '',
          sickDays: '',
          remoteWork: '',
          flexibleSchedule: false,
          professionalDevelopment: ''
        }
      });
      setError(null);
    } catch (err) {
      console.error('Error adding offer:', err);
      setError(err.response?.data?.message || 'Failed to add offer');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateCounteroffer = async () => {
    try {
      setLoading(true);
      const latestOffer = negotiation.offers[negotiation.offers.length - 1];
      
      const response = await evaluateCounteroffer(negotiation._id, {
        currentOffer: latestOffer
      });
      
      setCounterofferEval(response.data.data);
      setActiveTab('counteroffer');
      setError(null);
    } catch (err) {
      console.error('Error evaluating counteroffer:', err);
      setError(err.response?.data?.message || 'Failed to evaluate counteroffer');
    } finally {
      setLoading(false);
    }
  };

  const handleAddConfidenceExercises = async (exerciseType = null) => {
    try {
      setLoading(true);
      await addConfidenceExercise(negotiation._id, { exerciseType });
      await fetchData();
      setError(null);
    } catch (err) {
      console.error('Error adding exercises:', err);
      setError(err.response?.data?.message || 'Failed to add exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteExercise = async (exerciseId, notes = '') => {
    try {
      await completeExercise(negotiation._id, exerciseId, { notes });
      await fetchData();
    } catch (err) {
      console.error('Error completing exercise:', err);
      setError(err.response?.data?.message || 'Failed to complete exercise');
    }
  };

  if (loading && !negotiation) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (showCreateModal) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-4">Start Salary Negotiation Preparation</h2>
          <p className="text-gray-600 mb-6">
            Set your negotiation goals based on market research. This will help guide your preparation and strategy.
          </p>
          
          <form onSubmit={handleCreateNegotiation}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Salary *
                </label>
                <input
                  type="number"
                  value={targetSalary}
                  onChange={(e) => setTargetSalary(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 120000"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Your realistic goal based on market data</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Acceptable Salary *
                </label>
                <input
                  type="number"
                  value={minimumSalary}
                  onChange={(e) => setMinimumSalary(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 100000"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">The lowest salary you would accept</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ideal Salary (Optional)
                </label>
                <input
                  type="number"
                  value={idealSalary}
                  onChange={(e) => setIdealSalary(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 140000"
                />
                <p className="text-sm text-gray-500 mt-1">Your stretch goal (typically 15-20% above target)</p>
              </div>
            </div>

            {error && <ErrorMessage message={error} className="mt-4" />}

            <div className="flex gap-3 mt-6">
              <Button type="submit" className="flex-1">
                Start Preparation
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  if (!negotiation) return null;

  const progress = negotiation.talkingPoints?.length > 0 ? 25 : 0;
  const scriptProgress = negotiation.scripts?.length > 0 ? 25 : 0;
  const offerProgress = negotiation.offers?.length > 0 ? 25 : 0;
  const exerciseProgress = negotiation.confidenceExercises?.some(ex => ex.completed) ? 25 : 0;
  const totalProgress = progress + scriptProgress + offerProgress + exerciseProgress;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          ← Back
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Salary Negotiation Preparation
            </h1>
            <p className="text-gray-600">
              {negotiation.jobTitle} at {negotiation.company}
            </p>
            <div className="mt-2 flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                negotiation.status === 'Preparing' ? 'bg-blue-100 text-blue-800' :
                negotiation.status === 'In Negotiation' ? 'bg-yellow-100 text-yellow-800' :
                negotiation.status === 'Completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {negotiation.status}
              </span>
              <span className="text-sm text-gray-500">
                Progress: {totalProgress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {/* Progress Bar */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Preparation Progress</h3>
          <span className="text-sm text-gray-600">{totalProgress}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </Card>

      {/* Salary Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-linear-to-br from-red-50 to-red-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Minimum Acceptable</h3>
          <p className="text-3xl font-bold text-red-600">
            ${negotiation.minimumAcceptable.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6 bg-linear-to-br from-blue-50 to-blue-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Target Salary</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${negotiation.targetSalary.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6 bg-linear-to-br from-green-50 to-green-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Ideal Salary</h3>
          <p className="text-3xl font-bold text-green-600">
            ${negotiation.idealSalary?.toLocaleString() || 'Not Set'}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'talking-points', 'scripts', 'offers', 'counteroffer', 'confidence', 'timing'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {negotiation.marketResearch?.researched && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Market Research Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Industry Median</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${negotiation.marketResearch.industryMedian?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location Adjusted</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${negotiation.marketResearch.locationAdjusted?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Experience Level</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {negotiation.marketResearch.experienceLevel}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleGenerateTalkingPoints}
                disabled={loading || negotiation.talkingPoints?.length > 0}
                className="w-full"
              >
                {negotiation.talkingPoints?.length > 0 ? '✓ Talking Points Generated' : 'Generate Talking Points'}
              </Button>
              <Button
                onClick={() => setActiveTab('scripts')}
                variant="outline"
                className="w-full"
              >
                Create Negotiation Scripts
              </Button>
              <Button
                onClick={() => setActiveTab('offers')}
                variant="outline"
                className="w-full"
              >
                Track Offers
              </Button>
              <Button
                onClick={() => setActiveTab('confidence')}
                variant="outline"
                className="w-full"
              >
                Build Confidence
              </Button>
            </div>
          </Card>

          {negotiation.offers && negotiation.offers.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Recent Offers</h2>
              <div className="space-y-3">
                {negotiation.offers.slice(-3).reverse().map((offer, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          offer.type === 'Initial' ? 'bg-blue-100 text-blue-800' :
                          offer.type === 'Counter' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {offer.type}
                        </span>
                        <p className="mt-2 text-sm text-gray-600">
                          {new Date(offer.receivedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          ${offer.baseSalary.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Total: ${offer.totalCompensation.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'talking-points' && (
        <Card className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold">Negotiation Talking Points</h2>
              <p className="text-gray-600 mt-1">Key points to emphasize during negotiation</p>
            </div>
            <Button
              onClick={handleGenerateTalkingPoints}
              disabled={loading}
            >
              {negotiation.talkingPoints?.length > 0 ? 'Regenerate' : 'Generate'} Talking Points
            </Button>
          </div>

          {negotiation.talkingPoints && negotiation.talkingPoints.length > 0 ? (
            <div className="space-y-4">
              {negotiation.talkingPoints.map((point, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${
                    point.strength === 'High' ? 'bg-green-50 border-green-500' :
                    point.strength === 'Medium' ? 'bg-blue-50 border-blue-500' :
                    'bg-gray-50 border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
                      {point.category}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      point.strength === 'High' ? 'bg-green-200 text-green-800' :
                      point.strength === 'Medium' ? 'bg-blue-200 text-blue-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {point.strength} Impact
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">{point.description}</p>
                  {point.evidence && (
                    <p className="text-sm text-gray-600 italic">Evidence: {point.evidence}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No talking points generated yet</p>
              <p className="text-sm">Click "Generate Talking Points" to create personalized negotiation points based on your profile</p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'scripts' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Generate Negotiation Script</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Scenario
                </label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Initial Offer Too Low">Initial Offer Too Low</option>
                  <option value="Benefits Negotiation">Benefits Negotiation</option>
                  <option value="Equity Discussion">Equity Discussion</option>
                  <option value="Remote Work">Remote Work</option>
                  <option value="Sign-on Bonus">Sign-on Bonus</option>
                  <option value="Performance Review">Performance Review</option>
                  <option value="Promotion">Promotion</option>
                  <option value="Counter Offer">Counter Offer (from another company)</option>
                  <option value="Custom">Custom Scenario</option>
                </select>
              </div>

              {selectedScenario === 'Custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe Your Scenario
                  </label>
                  <textarea
                    value={customScenario}
                    onChange={(e) => setCustomScenario(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Describe the negotiation scenario..."
                  />
                </div>
              )}

              <Button onClick={handleGenerateScript} disabled={loading}>
                Generate Script
              </Button>
            </div>
          </Card>

          {negotiation.scripts && negotiation.scripts.length > 0 && (
            <div className="space-y-6">
              {negotiation.scripts.map((script, idx) => (
                <Card key={idx} className="p-6">
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {script.scenario}
                    </span>
                    {script.customScenario && (
                      <p className="text-sm text-gray-600 mt-2">{script.customScenario}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Opening Statement</h3>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{script.opening}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Key Points to Make</h3>
                      <ul className="list-disc list-inside space-y-2">
                        {script.keyPoints.map((point, pidx) => (
                          <li key={pidx} className="text-gray-700">{point}</li>
                        ))}
                      </ul>
                    </div>

                    {script.closingStatement && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Closing Statement</h3>
                        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{script.closingStatement}</p>
                      </div>
                    )}

                    {script.alternativeResponses && script.alternativeResponses.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">If They Say...</h3>
                        <div className="space-y-3">
                          {script.alternativeResponses.map((alt, aidx) => (
                            <div key={aidx} className="bg-yellow-50 p-4 rounded-lg">
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                "{alt.situation}"
                              </p>
                              <p className="text-sm text-gray-700">
                                <strong>Respond:</strong> {alt.response}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'offers' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Add Offer Details</h2>
            <form onSubmit={handleAddOffer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Type
                  </label>
                  <select
                    value={offerForm.type}
                    onChange={(e) => setOfferForm({ ...offerForm, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Initial">Initial Offer</option>
                    <option value="Counter">Counter Offer</option>
                    <option value="Final">Final Offer</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Salary *
                    </label>
                    <input
                      type="number"
                      value={offerForm.baseSalary}
                      onChange={(e) => setOfferForm({ ...offerForm, baseSalary: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signing Bonus
                    </label>
                    <input
                      type="number"
                      value={offerForm.signingBonus}
                      onChange={(e) => setOfferForm({ ...offerForm, signingBonus: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Performance Bonus
                    </label>
                    <input
                      type="number"
                      value={offerForm.performanceBonus}
                      onChange={(e) => setOfferForm({ ...offerForm, performanceBonus: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equity/Stock Options
                  </label>
                  <input
                    type="text"
                    value={offerForm.equity}
                    onChange={(e) => setOfferForm({ ...offerForm, equity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 10,000 RSUs over 4 years"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Benefits Package</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={offerForm.benefits.healthInsurance}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          benefits: { ...offerForm.benefits, healthInsurance: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">Health Insurance</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={offerForm.benefits.dentalInsurance}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          benefits: { ...offerForm.benefits, dentalInsurance: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">Dental Insurance</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={offerForm.benefits.visionInsurance}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          benefits: { ...offerForm.benefits, visionInsurance: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">Vision Insurance</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={offerForm.benefits.retirement401k}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          benefits: { ...offerForm.benefits, retirement401k: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">401(k)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={offerForm.benefits.flexibleSchedule}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          benefits: { ...offerForm.benefits, flexibleSchedule: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">Flexible Schedule</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PTO Days
                      </label>
                      <input
                        type="number"
                        value={offerForm.benefits.paidTimeOff}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          benefits: { ...offerForm.benefits, paidTimeOff: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Remote Work
                      </label>
                      <select
                        value={offerForm.benefits.remoteWork}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          benefits: { ...offerForm.benefits, remoteWork: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="Full">Full Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="None">On-site</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        401(k) Match
                      </label>
                      <input
                        type="text"
                        value={offerForm.benefits.retirementMatch}
                        onChange={(e) => setOfferForm({
                          ...offerForm,
                          benefits: { ...offerForm.benefits, retirementMatch: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 5% match"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  Add Offer
                </Button>
              </div>
            </form>
          </Card>

          {negotiation.offers && negotiation.offers.length > 0 && (
            <>
              <Card className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">Offer History</h2>
                  <Button
                    onClick={handleEvaluateCounteroffer}
                    variant="outline"
                    disabled={loading}
                  >
                    Evaluate Latest Offer
                  </Button>
                </div>
                <div className="space-y-4">
                  {negotiation.offers.map((offer, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            offer.type === 'Initial' ? 'bg-blue-100 text-blue-800' :
                            offer.type === 'Counter' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {offer.type} Offer
                          </span>
                          <p className="text-sm text-gray-600 mt-2">
                            {new Date(offer.receivedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            ${offer.totalCompensation.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Total Compensation</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                        <div>
                          <p className="text-xs text-gray-600">Base Salary</p>
                          <p className="font-semibold">${offer.baseSalary.toLocaleString()}</p>
                        </div>
                        {offer.signingBonus > 0 && (
                          <div>
                            <p className="text-xs text-gray-600">Signing Bonus</p>
                            <p className="font-semibold">${offer.signingBonus.toLocaleString()}</p>
                          </div>
                        )}
                        {offer.performanceBonus > 0 && (
                          <div>
                            <p className="text-xs text-gray-600">Performance Bonus</p>
                            <p className="font-semibold">${offer.performanceBonus.toLocaleString()}</p>
                          </div>
                        )}
                        {offer.equity && (
                          <div>
                            <p className="text-xs text-gray-600">Equity</p>
                            <p className="font-semibold text-sm">{offer.equity}</p>
                          </div>
                        )}
                      </div>

                      {offer.benefits && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-600 mb-2">Benefits</p>
                          <div className="flex flex-wrap gap-2">
                            {offer.benefits.healthInsurance && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Health</span>
                            )}
                            {offer.benefits.retirement401k && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">401(k)</span>
                            )}
                            {offer.benefits.paidTimeOff && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {offer.benefits.paidTimeOff} PTO days
                              </span>
                            )}
                            {offer.benefits.remoteWork && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                {offer.benefits.remoteWork} Remote
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === 'counteroffer' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Counteroffer Evaluation</h2>
          
          {counterofferEval ? (
            <div className="space-y-6">
              <div className={`p-6 rounded-lg ${
                counterofferEval.evaluation.recommendation === 'Accept' ? 'bg-green-50 border border-green-200' :
                counterofferEval.evaluation.recommendation.includes('Minor') ? 'bg-blue-50 border border-blue-200' :
                'bg-yellow-50 border border-yellow-200'
              }`}>
                <h3 className="text-lg font-bold mb-2">Recommendation: {counterofferEval.evaluation.recommendation}</h3>
                <p className="text-gray-700">{counterofferEval.evaluation.reasoning}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`p-4 ${counterofferEval.evaluation.meetsMinimum ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-sm text-gray-600 mb-1">Meets Minimum?</p>
                  <p className="text-xl font-bold">{counterofferEval.evaluation.meetsMinimum ? 'Yes ✓' : 'No ✗'}</p>
                </Card>
                <Card className={`p-4 ${counterofferEval.evaluation.meetsTarget ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <p className="text-sm text-gray-600 mb-1">Meets Target?</p>
                  <p className="text-xl font-bold">{counterofferEval.evaluation.meetsTarget ? 'Yes ✓' : 'No ✗'}</p>
                </Card>
                <Card className={`p-4 ${counterofferEval.evaluation.meetsIdeal ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <p className="text-sm text-gray-600 mb-1">Meets Ideal?</p>
                  <p className="text-xl font-bold">{counterofferEval.evaluation.meetsIdeal ? 'Yes ✓' : 'No ✗'}</p>
                </Card>
              </div>

              {counterofferEval.counterofferSuggestions && counterofferEval.counterofferSuggestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Counteroffer Suggestions</h3>
                  <div className="space-y-4">
                    {counterofferEval.counterofferSuggestions.map((suggestion, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{suggestion.type}</h4>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Current: ${suggestion.current?.toLocaleString() || suggestion.current}</p>
                            <p className="text-sm font-bold text-blue-600">
                              Proposed: ${suggestion.proposed?.toLocaleString() || suggestion.proposed}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{suggestion.justification}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Your Negotiation Goals</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Minimum</p>
                    <p className="font-bold">${counterofferEval.negotiationGoals.minimum.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Target</p>
                    <p className="font-bold">${counterofferEval.negotiationGoals.target.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ideal</p>
                    <p className="font-bold">${counterofferEval.negotiationGoals.ideal.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No offer evaluation yet</p>
              <p className="text-sm text-gray-500 mb-6">Add an offer first, then click "Evaluate Latest Offer"</p>
              <Button onClick={() => setActiveTab('offers')}>
                Go to Offers
              </Button>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'confidence' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">Confidence-Building Exercises</h2>
                <p className="text-gray-600 mt-1">Build your negotiation confidence with these exercises</p>
              </div>
              <Button onClick={() => handleAddConfidenceExercises(null)} disabled={loading}>
                Add All Exercises
              </Button>
            </div>

            {negotiation.confidenceExercises && negotiation.confidenceExercises.length > 0 ? (
              <div className="space-y-4">
                {negotiation.confidenceExercises.map((exercise, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      exercise.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={exercise.completed}
                          onChange={() => !exercise.completed && handleCompleteExercise(exercise._id)}
                          className="mt-1 rounded"
                          disabled={exercise.completed}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{exercise.exerciseType}</h3>
                          <p className="text-sm text-gray-700 mt-2">{exercise.description}</p>
                          {exercise.completed && exercise.completedDate && (
                            <p className="text-xs text-green-600 mt-2">
                              ✓ Completed on {new Date(exercise.completedDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">No exercises added yet</p>
                <p className="text-sm">Click "Add All Exercises" to get started with confidence-building activities</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'timing' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Negotiation Timing Strategy</h2>
          
          {timingStrategy ? (
            <div className="space-y-6">
              {timingStrategy.strategies.map((strategy, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900">{strategy.phase}</h3>
                    <span className="text-sm text-gray-600">{strategy.timing}</span>
                  </div>
                  <p className="text-sm font-medium text-blue-600 mb-2">{strategy.strategy}</p>
                  <ul className="list-disc list-inside space-y-1 mb-2">
                    {strategy.actions.map((action, aidx) => (
                      <li key={aidx} className="text-sm text-gray-700">{action}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-600 italic">{strategy.rationale}</p>
                </div>
              ))}

              {timingStrategy.deadlineAdvice && (
                <div className={`p-6 rounded-lg ${
                  timingStrategy.deadlineAdvice.urgency === 'High' ? 'bg-red-50 border border-red-200' :
                  timingStrategy.deadlineAdvice.urgency === 'Medium' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <h3 className="font-bold mb-2">Your Offer Deadline</h3>
                  <p className="text-2xl font-bold mb-2">
                    {timingStrategy.deadlineAdvice.daysRemaining} days remaining
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    Deadline: {new Date(timingStrategy.deadlineAdvice.deadline).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-medium">{timingStrategy.deadlineAdvice.recommendation}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold mb-3">General Timing Tips</h3>
                <ul className="space-y-2">
                  {timingStrategy.generalTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <LoadingSpinner />
              <p className="text-gray-600 mt-4">Loading timing strategies...</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default SalaryNegotiationPrep;
