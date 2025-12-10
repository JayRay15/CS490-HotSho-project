import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import {
  compareOffers,
  analyzeScenarios,
  getCostOfLivingComparison,
  archiveDeclinedOffer,
  getArchivedOffers,
  calculateBenefitsValue,
  DECLINE_REASONS,
  DEFAULT_WEIGHTS,
  REMOTE_WORK_OPTIONS,
  HEALTH_INSURANCE_QUALITY
} from '../api/offerComparison';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Card from './Card';
import Button from './Button';
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

/**
 * UC-127: Offer Evaluation & Comparison Tool Component
 * 
 * Features:
 * - Input all offer details (salary, bonus, equity, benefits, location, remote policy)
 * - Calculate total compensation including benefits value
 * - Adjust for cost of living differences by location
 * - Score non-financial factors (culture fit, growth opportunities, work-life balance)
 * - Display side-by-side comparison matrix with weighted scores
 * - Provide negotiation recommendations for each offer
 * - Allow scenario analysis (e.g., "What if I negotiate 10% more salary?")
 * - Archive declined offers with reasons for future reference
 */

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Empty offer template
const emptyOffer = {
  company: '',
  title: '',
  location: '',
  baseSalary: '',
  signingBonus: '',
  performanceBonus: '',
  equityValue: '',
  benefits: {
    healthInsurance: false,
    healthInsuranceQuality: 'good',
    dentalInsurance: false,
    visionInsurance: false,
    retirement401k: false,
    retirementMatch: '',
    paidTimeOff: '',
    remoteWork: '',
    flexibleSchedule: false,
    professionalDevelopment: ''
  },
  nonFinancialFactors: {
    cultureFit: 5,
    growthOpportunities: 5,
    workLifeBalance: 5,
    locationDesirability: 5,
    jobSecurity: 5,
    companyReputation: 5
  }
};

const OfferComparison = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  // State for offers
  const [offers, setOffers] = useState([{ ...emptyOffer }, { ...emptyOffer }]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [scenarioAnalysis, setScenarioAnalysis] = useState(null);
  const [costOfLivingData, setCostOfLivingData] = useState(null);
  const [archivedOffers, setArchivedOffers] = useState([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState('input'); // input, comparison, scenarios, archive
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedOfferForScenario, setSelectedOfferForScenario] = useState(0);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [offerToArchive, setOfferToArchive] = useState(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [archiveNotes, setArchiveNotes] = useState('');
  const [futureConsideration, setFutureConsideration] = useState(false);
  
  // Custom weights state
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [showWeightsEditor, setShowWeightsEditor] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Set auth token on mount
  useEffect(() => {
    const setupAuth = async () => {
      try {
        const token = await getToken();
        if (token) {
          setAuthToken(token);
          setAuthReady(true);
        }
      } catch (err) {
        console.error('Error setting up authentication:', err);
      }
    };
    setupAuth();
  }, [getToken]);

  // Only fetch archived offers after auth is ready
  useEffect(() => {
    if (authReady) {
      fetchArchivedOffers();
    }
  }, [authReady]);

  const fetchArchivedOffers = async () => {
    try {
      const token = await getToken();
      if (token) {
        setAuthToken(token);
      }
      const response = await getArchivedOffers();
      setArchivedOffers(response.data.data.offers || []);
    } catch (err) {
      console.error('Error fetching archived offers:', err);
    }
  };

  const handleOfferChange = (index, field, value) => {
    setOffers(prev => {
      const updated = [...prev];
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        updated[index] = {
          ...updated[index],
          [parent]: {
            ...updated[index][parent],
            [child]: value
          }
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const addOffer = () => {
    setOffers(prev => [...prev, { ...emptyOffer }]);
  };

  const removeOffer = (index) => {
    if (offers.length <= 2) {
      setError('At least 2 offers are required for comparison');
      return;
    }
    setOffers(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompare = async () => {
    // Validate offers
    const validOffers = offers.filter(o => 
      o.company && o.title && o.baseSalary && parseInt(o.baseSalary) > 0
    );

    if (validOffers.length < 2) {
      setError('Please enter at least 2 complete offers (company, title, and base salary required)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Ensure auth token is set
      const token = await getToken();
      if (token) {
        setAuthToken(token);
      }
      
      // Format offers for API
      const formattedOffers = validOffers.map(offer => ({
        ...offer,
        baseSalary: parseInt(offer.baseSalary) || 0,
        signingBonus: parseInt(offer.signingBonus) || 0,
        performanceBonus: parseInt(offer.performanceBonus) || 0,
        equityValue: parseInt(offer.equityValue) || 0,
        benefits: {
          ...offer.benefits,
          paidTimeOff: parseInt(offer.benefits.paidTimeOff) || 0,
          retirementMatch: offer.benefits.retirementMatch || '0'
        }
      }));

      const response = await compareOffers(formattedOffers, weights);
      setComparisonResult(response.data.data);
      
      // Also get cost of living data
      const locations = validOffers.map(o => o.location).filter(Boolean);
      if (locations.length > 0) {
        const colResponse = await getCostOfLivingComparison(locations, Math.max(...validOffers.map(o => parseInt(o.baseSalary) || 0)));
        setCostOfLivingData(colResponse.data.data);
      }
      
      setActiveTab('comparison');
    } catch (err) {
      console.error('Error comparing offers:', err);
      setError(err.response?.data?.message || 'Failed to compare offers');
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioAnalysis = async () => {
    const offer = offers[selectedOfferForScenario];
    
    if (!offer.company || !offer.baseSalary) {
      setError('Please select a valid offer with company and salary');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Ensure auth token is set
      const token = await getToken();
      if (token) {
        setAuthToken(token);
      }
      
      const formattedOffer = {
        ...offer,
        baseSalary: parseInt(offer.baseSalary) || 0,
        signingBonus: parseInt(offer.signingBonus) || 0,
        performanceBonus: parseInt(offer.performanceBonus) || 0,
        equityValue: parseInt(offer.equityValue) || 0
      };

      const response = await analyzeScenarios(formattedOffer);
      setScenarioAnalysis(response.data.data);
      setActiveTab('scenarios');
    } catch (err) {
      console.error('Error analyzing scenarios:', err);
      setError(err.response?.data?.message || 'Failed to analyze scenarios');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveOffer = async () => {
    if (!offerToArchive || !archiveReason) {
      setError('Please select an offer and provide a decline reason');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Ensure auth token is set
      const token = await getToken();
      if (token) {
        setAuthToken(token);
      }
      
      await archiveDeclinedOffer(
        offerToArchive,
        archiveReason,
        archiveNotes,
        futureConsideration
      );
      
      setSuccessMessage('Offer archived successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh archived offers
      await fetchArchivedOffers();
      
      // Close modal and reset
      setShowArchiveModal(false);
      setOfferToArchive(null);
      setArchiveReason('');
      setArchiveNotes('');
      setFutureConsideration(false);
    } catch (err) {
      console.error('Error archiving offer:', err);
      setError(err.response?.data?.message || 'Failed to archive offer');
    } finally {
      setLoading(false);
    }
  };

  const openArchiveModal = (offer, index) => {
    setOfferToArchive({
      ...offer,
      baseSalary: parseInt(offer.baseSalary) || 0,
      totalCompensation: comparisonResult?.offers[index]?.totalCompensation || parseInt(offer.baseSalary) || 0
    });
    setShowArchiveModal(true);
  };

  // Render offer input form
  const renderOfferForm = (offer, index) => (
    <Card key={index} className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Offer {index + 1}</h3>
        {offers.length > 2 && (
          <button
            onClick={() => removeOffer(index)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Remove
          </button>
        )}
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
          <input
            type="text"
            value={offer.company}
            onChange={(e) => handleOfferChange(index, 'company', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Google"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
          <input
            type="text"
            value={offer.title}
            onChange={(e) => handleOfferChange(index, 'title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Software Engineer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={offer.location}
            onChange={(e) => handleOfferChange(index, 'location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., San Francisco, CA"
          />
        </div>
      </div>

      {/* Compensation */}
      <h4 className="font-semibold text-gray-800 mb-3">Compensation</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary *</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={offer.baseSalary}
              onChange={(e) => handleOfferChange(index, 'baseSalary', e.target.value)}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="100,000"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Signing Bonus</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={offer.signingBonus}
              onChange={(e) => handleOfferChange(index, 'signingBonus', e.target.value)}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="10,000"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Annual Bonus</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={offer.performanceBonus}
              onChange={(e) => handleOfferChange(index, 'performanceBonus', e.target.value)}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="15,000"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Equity/RSU Value</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={offer.equityValue}
              onChange={(e) => handleOfferChange(index, 'equityValue', e.target.value)}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="50,000"
            />
          </div>
        </div>
      </div>

      {/* Benefits */}
      <h4 className="font-semibold text-gray-800 mb-3">Benefits</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={offer.benefits.healthInsurance}
              onChange={(e) => handleOfferChange(index, 'benefits.healthInsurance', e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">Health Insurance</span>
          </label>
          {offer.benefits.healthInsurance && (
            <select
              value={offer.benefits.healthInsuranceQuality}
              onChange={(e) => handleOfferChange(index, 'benefits.healthInsuranceQuality', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {HEALTH_INSURANCE_QUALITY.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={offer.benefits.dentalInsurance}
              onChange={(e) => handleOfferChange(index, 'benefits.dentalInsurance', e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">Dental Insurance</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={offer.benefits.visionInsurance}
              onChange={(e) => handleOfferChange(index, 'benefits.visionInsurance', e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">Vision Insurance</span>
          </label>
        </div>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={offer.benefits.retirement401k}
              onChange={(e) => handleOfferChange(index, 'benefits.retirement401k', e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">401(k)</span>
          </label>
          {offer.benefits.retirement401k && (
            <div>
              <label className="text-xs text-gray-600">Match %</label>
              <input
                type="number"
                value={offer.benefits.retirementMatch}
                onChange={(e) => handleOfferChange(index, 'benefits.retirementMatch', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g., 4"
                min="0"
                max="100"
              />
            </div>
          )}
          <div>
            <label className="text-sm text-gray-700">PTO Days</label>
            <input
              type="number"
              value={offer.benefits.paidTimeOff}
              onChange={(e) => handleOfferChange(index, 'benefits.paidTimeOff', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="e.g., 15"
              min="0"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-700">Remote Work Policy</label>
            <select
              value={offer.benefits.remoteWork}
              onChange={(e) => handleOfferChange(index, 'benefits.remoteWork', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select...</option>
              {REMOTE_WORK_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={offer.benefits.flexibleSchedule}
              onChange={(e) => handleOfferChange(index, 'benefits.flexibleSchedule', e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">Flexible Schedule</span>
          </label>
          <div>
            <label className="text-sm text-gray-700">Prof. Dev Budget</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={offer.benefits.professionalDevelopment}
                onChange={(e) => handleOfferChange(index, 'benefits.professionalDevelopment', e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="2,500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Non-Financial Factors */}
      <h4 className="font-semibold text-gray-800 mb-3">Non-Financial Factors (Rate 1-10)</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { key: 'cultureFit', label: 'Culture Fit' },
          { key: 'growthOpportunities', label: 'Growth Opportunities' },
          { key: 'workLifeBalance', label: 'Work-Life Balance' },
          { key: 'locationDesirability', label: 'Location Desirability' },
          { key: 'jobSecurity', label: 'Job Security' },
          { key: 'companyReputation', label: 'Company Reputation' }
        ].map(factor => (
          <div key={factor.key}>
            <label className="text-sm text-gray-700">{factor.label}</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="10"
                value={offer.nonFinancialFactors[factor.key]}
                onChange={(e) => handleOfferChange(index, `nonFinancialFactors.${factor.key}`, parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-6 text-center">{offer.nonFinancialFactors[factor.key]}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  // Render comparison results
  const renderComparison = () => {
    if (!comparisonResult) return null;
    
    const { offers: scoredOffers, comparisonMatrix, winner } = comparisonResult;

    // Prepare radar chart data
    const radarData = scoredOffers.map(offer => ({
      company: offer.company,
      'Total Comp': offer.scoring.scores.totalCompensation.normalized,
      'Base Salary': offer.scoring.scores.baseSalary.normalized,
      'Benefits': offer.scoring.scores.benefits.normalized,
      'Culture': offer.scoring.scores.cultureFit.normalized,
      'Growth': offer.scoring.scores.growthOpportunities.normalized,
      'Work-Life': offer.scoring.scores.workLifeBalance.normalized
    }));

    // Prepare bar chart data for total compensation
    const compensationData = scoredOffers.map(offer => ({
      company: offer.company,
      baseSalary: offer.baseSalary,
      bonus: offer.signingBonus + offer.performanceBonus,
      equity: offer.equityValue,
      benefits: offer.benefitsValue
    }));

    return (
      <div className="space-y-8">
        {/* Winner Banner */}
        <Card className="p-6 bg-linear-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">🏆</span>
                <h2 className="text-2xl font-bold text-green-800">Top Recommendation</h2>
              </div>
              <p className="text-lg text-green-700">
                <span className="font-semibold">{winner.company}</span> - {winner.title}
              </p>
              <p className="text-green-600">
                Weighted Score: <span className="font-bold">{winner.score}/100</span>
                {winner.advantage > 0 && (
                  <span className="ml-2">({winner.advantage.toFixed(1)} points ahead)</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-600">Total Compensation</p>
              <p className="text-3xl font-bold text-green-800">
                ${winner.totalCompensation.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Side-by-Side Comparison Matrix */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Side-by-Side Comparison</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  {comparisonMatrix.data.map((offer, idx) => (
                    <th key={idx} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {offer.company}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparisonMatrix.categories.map((category, catIdx) => (
                  <tr key={catIdx} className={catIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {category}
                    </td>
                    {comparisonMatrix.data.map((offer, offerIdx) => {
                      const isHighest = offer.rawValues[catIdx] === Math.max(...comparisonMatrix.data.map(o => o.rawValues[catIdx]));
                      return (
                        <td
                          key={offerIdx}
                          className={`px-4 py-3 text-sm text-center ${isHighest ? 'font-bold text-green-600 bg-green-50' : 'text-gray-600'}`}
                        >
                          {offer.values[catIdx]}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Compensation Breakdown Chart */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Total Compensation Breakdown</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compensationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="company" />
                <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="baseSalary" stackId="a" fill="#3b82f6" name="Base Salary" />
                <Bar dataKey="bonus" stackId="a" fill="#10b981" name="Bonuses" />
                <Bar dataKey="equity" stackId="a" fill="#f59e0b" name="Equity" />
                <Bar dataKey="benefits" stackId="a" fill="#8b5cf6" name="Benefits Value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Radar Chart for Factor Comparison */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Multi-Factor Comparison</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[
                { factor: 'Total Comp', ...Object.fromEntries(radarData.map(d => [d.company, d['Total Comp']])) },
                { factor: 'Base Salary', ...Object.fromEntries(radarData.map(d => [d.company, d['Base Salary']])) },
                { factor: 'Benefits', ...Object.fromEntries(radarData.map(d => [d.company, d['Benefits']])) },
                { factor: 'Culture', ...Object.fromEntries(radarData.map(d => [d.company, d['Culture']])) },
                { factor: 'Growth', ...Object.fromEntries(radarData.map(d => [d.company, d['Growth']])) },
                { factor: 'Work-Life', ...Object.fromEntries(radarData.map(d => [d.company, d['Work-Life']])) }
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="factor" />
                <PolarRadiusAxis domain={[0, 100]} />
                {radarData.map((offer, idx) => (
                  <Radar
                    key={offer.company}
                    name={offer.company}
                    dataKey={offer.company}
                    stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    fillOpacity={0.3}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Cost of Living Adjustment */}
        {costOfLivingData && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Cost of Living Adjusted Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scoredOffers.map((offer, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">{offer.company}</h4>
                  <p className="text-sm text-gray-600">{offer.location || 'Location not specified'}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">COL Index:</span>
                      <span className="font-medium">{offer.costOfLiving.index}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Adjusted Value:</span>
                      <span className="font-medium text-green-600">
                        ${offer.costOfLiving.adjustedCompensation.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Adjustment:</span>
                      <span className={`font-medium ${offer.costOfLiving.index > 100 ? 'text-orange-600' : 'text-green-600'}`}>
                        {offer.costOfLiving.adjustment}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              * COL-adjusted compensation shows equivalent purchasing power normalized to the national average (index = 100)
            </p>
          </Card>
        )}

        {/* Negotiation Recommendations */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Negotiation Recommendations</h2>
          <div className="space-y-6">
            {scoredOffers.map((offer, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">{offer.company}</h4>
                <p className="text-sm text-gray-600 mb-3">{offer.negotiations.summary}</p>
                <div className="space-y-2">
                  {offer.negotiations.recommendations.slice(0, 3).map((rec, recIdx) => (
                    <div key={recIdx} className="flex items-start gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        rec.priority === 'High' ? 'bg-red-100 text-red-700' :
                        rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {rec.priority}
                      </span>
                      <p className="text-sm text-gray-700">{rec.recommendation}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedOfferForScenario(idx);
                      handleScenarioAnalysis();
                    }}
                  >
                    Analyze Scenarios
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => openArchiveModal(offer, idx)}
                  >
                    Archive/Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  // Render scenario analysis
  const renderScenarioAnalysis = () => {
    if (!scenarioAnalysis) return null;

    const { baseOffer, scenarios, bestScenario, summary } = scenarioAnalysis;

    return (
      <div className="space-y-8">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Scenario Analysis</h2>
          <p className="text-gray-600 mb-4">
            Base offer: <span className="font-semibold">{baseOffer.company}</span> - {baseOffer.title}
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Current Base Salary</p>
              <p className="text-2xl font-bold">${baseOffer.baseSalary.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Current Total Compensation</p>
              <p className="text-2xl font-bold">${baseOffer.totalCompensation.toLocaleString()}</p>
            </div>
          </div>

          {/* Best Scenario Highlight */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
            <h4 className="font-semibold text-green-800 mb-2">Best Negotiation Opportunity</h4>
            <p className="text-green-700">{bestScenario.scenario}</p>
            <p className="text-2xl font-bold text-green-800 mt-2">{bestScenario.impact.formatted}</p>
            <p className="text-sm text-green-600 mt-1">{bestScenario.recommendation}</p>
          </div>

          {/* All Scenarios */}
          <h4 className="font-semibold mb-4">All Scenarios</h4>
          <div className="space-y-3">
            {scenarios.map((scenario, idx) => (
              <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-gray-900">{scenario.scenario}</h5>
                    <p className="text-sm text-gray-600 mt-1">{scenario.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{scenario.impact.formatted}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      scenario.negotiationDifficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      scenario.negotiationDifficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {scenario.negotiationDifficulty}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Original:</span>
                    <span className="ml-2 font-medium">${scenario.original.totalCompensation.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Projected:</span>
                    <span className="ml-2 font-medium text-green-600">${scenario.projected.totalCompensation.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Increase:</span>
                    <span className="ml-2 font-medium text-green-600">+{scenario.impact.percentageIncrease}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  // Render archived offers
  const renderArchivedOffers = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Archived Offers</h2>
        {archivedOffers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No archived offers yet.</p>
        ) : (
          <div className="space-y-4">
            {archivedOffers.map((offer, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{offer.company}</h4>
                    <p className="text-gray-600">{offer.title}</p>
                    <p className="text-sm text-gray-500">{offer.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${(offer.baseSalary || 0).toLocaleString()}</p>
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                      Declined
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm">
                    <span className="text-gray-500">Reason:</span>
                    <span className="ml-2 font-medium">{offer.declineReason}</span>
                  </p>
                  {offer.declineNotes && (
                    <p className="text-sm text-gray-600 mt-1">{offer.declineNotes}</p>
                  )}
                  {offer.futureConsideration && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                      Open to future opportunities
                    </span>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Declined on {new Date(offer.declinedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <div className="mx-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <div className="mx-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg flex justify-between items-center">
            <p className="text-red-800 font-medium">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">×</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Offer Evaluation & Comparison</h1>
        <p className="text-gray-600">Compare job offers across all dimensions to make the best career decision</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        {[
          { id: 'input', label: 'Enter Offers' },
          { id: 'comparison', label: 'Comparison', disabled: !comparisonResult },
          { id: 'scenarios', label: 'Scenario Analysis', disabled: !scenarioAnalysis },
          { id: 'archive', label: `Archived (${archivedOffers.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-blue-600'
                : tab.disabled
                  ? 'text-gray-300 border-transparent cursor-not-allowed'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Processing...</p>
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <>
          {activeTab === 'input' && (
            <div>
              {/* Weight customization toggle */}
              <div className="mb-6">
                <button
                  onClick={() => setShowWeightsEditor(!showWeightsEditor)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showWeightsEditor ? '▼ Hide' : '▶ Show'} Scoring Weight Customization
                </button>
                {showWeightsEditor && (
                  <Card className="mt-4 p-4">
                    <h4 className="font-medium mb-3">Customize Scoring Weights</h4>
                    <p className="text-sm text-gray-500 mb-4">Adjust how much each factor contributes to the overall score (must sum to 1.0)</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(weights).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                          <input
                            type="number"
                            value={value}
                            onChange={(e) => setWeights(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-2 py-1 border rounded text-sm"
                            step="0.05"
                            min="0"
                            max="1"
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Offer Forms */}
              {offers.map((offer, index) => renderOfferForm(offer, index))}

              {/* Add Offer / Compare Buttons */}
              <div className="flex gap-4 mt-6">
                <Button variant="outline" onClick={addOffer}>
                  + Add Another Offer
                </Button>
                <Button onClick={handleCompare} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Compare Offers
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'comparison' && renderComparison()}
          {activeTab === 'scenarios' && renderScenarioAnalysis()}
          {activeTab === 'archive' && renderArchivedOffers()}
        </>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="text-xl font-bold mb-4">Archive Declined Offer</h3>
            <p className="text-gray-600 mb-4">
              {offerToArchive?.company} - {offerToArchive?.title}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Declining *</label>
                <select
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select a reason...</option>
                  {DECLINE_REASONS.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={archiveNotes}
                  onChange={(e) => setArchiveNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  placeholder="Any additional context..."
                />
              </div>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={futureConsideration}
                  onChange={(e) => setFutureConsideration(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">Open to future opportunities with this company</span>
              </label>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowArchiveModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleArchiveOffer}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!archiveReason}
              >
                Archive Offer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OfferComparison;
