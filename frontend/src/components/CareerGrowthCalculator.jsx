import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * UC-128: Career Growth Calculator
 * Calculate potential salary growth and career progression to compare job opportunities
 */
const CareerGrowthCalculator = ({ job, onClose }) => {
  const [scenarios, setScenarios] = useState([]);
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);

  // Default scenario based on job
  const createDefaultScenario = () => ({
    id: Date.now(),
    name: job ? `${job.company} - ${job.title}` : 'Scenario 1',
    startingSalary: job?.salary?.max || job?.salary?.min || 80000,
    raiseType: 'expected', // conservative, expected, optimistic
    annualRaisePercent: {
      conservative: 3,
      expected: 5,
      optimistic: 8
    },
    bonus: {
      year1: 0,
      annual: 10, // percentage
    },
    equity: {
      totalValue: 0,
      vestingYears: 4,
    },
    milestones: [],
    notes: '',
    color: '#3b82f6'
  });

  useEffect(() => {
    // Load saved scenarios from localStorage
    const savedScenarios = localStorage.getItem('careerGrowthScenarios');
    if (savedScenarios) {
      try {
        setScenarios(JSON.parse(savedScenarios));
      } catch (e) {
        setScenarios([createDefaultScenario()]);
      }
    } else if (scenarios.length === 0) {
      setScenarios([createDefaultScenario()]);
    }
  }, []);

  // Save scenarios to localStorage whenever they change
  useEffect(() => {
    if (scenarios.length > 0) {
      localStorage.setItem('careerGrowthScenarios', JSON.stringify(scenarios));
    }
  }, [scenarios]);

  const addScenario = () => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const newScenario = {
      ...createDefaultScenario(),
      id: Date.now(),
      name: `Scenario ${scenarios.length + 1}`,
      color: colors[scenarios.length % colors.length]
    };
    setScenarios([...scenarios, newScenario]);
    setActiveScenarioIndex(scenarios.length);
  };

  const removeScenario = (index) => {
    if (scenarios.length > 1) {
      const newScenarios = scenarios.filter((_, i) => i !== index);
      setScenarios(newScenarios);
      if (activeScenarioIndex >= newScenarios.length) {
        setActiveScenarioIndex(newScenarios.length - 1);
      }
    }
  };

  const updateScenario = (index, field, value) => {
    const newScenarios = [...scenarios];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newScenarios[index][parent][child] = value;
    } else {
      newScenarios[index][field] = value;
    }
    setScenarios(newScenarios);
  };

  const addMilestone = (scenarioIndex) => {
    const newScenarios = [...scenarios];
    newScenarios[scenarioIndex].milestones.push({
      id: Date.now(),
      year: 2,
      title: 'Promotion',
      salaryIncrease: 15, // percentage
      newTitle: ''
    });
    setScenarios(newScenarios);
  };

  const updateMilestone = (scenarioIndex, milestoneIndex, field, value) => {
    const newScenarios = [...scenarios];
    newScenarios[scenarioIndex].milestones[milestoneIndex][field] = value;
    setScenarios(newScenarios);
  };

  const removeMilestone = (scenarioIndex, milestoneIndex) => {
    const newScenarios = [...scenarios];
    newScenarios[scenarioIndex].milestones.splice(milestoneIndex, 1);
    setScenarios(newScenarios);
  };

  // Calculate projections
  const calculateProjections = (scenario, years = 10) => {
    const projections = [];
    let currentSalary = scenario.startingSalary;
    
    for (let year = 0; year <= years; year++) {
      let yearSalary = currentSalary;
      let yearBonus = 0;
      let yearEquity = 0;
      let milestone = null;

      if (year > 0) {
        // Check for milestones
        const yearMilestone = scenario.milestones.find(m => m.year === year);
        if (yearMilestone) {
          yearSalary = currentSalary * (1 + yearMilestone.salaryIncrease / 100);
          milestone = yearMilestone.title;
        } else {
          // Apply annual raise based on scenario type
          const raisePercent = scenario.annualRaisePercent[scenario.raiseType] / 100;
          yearSalary = currentSalary * (1 + raisePercent);
        }
        
        currentSalary = yearSalary;
      }

      // Calculate bonus (starts year 1 for first year, then annual)
      if (year === 1) {
        yearBonus = yearSalary * (scenario.bonus.year1 / 100);
      } else if (year > 1) {
        yearBonus = yearSalary * (scenario.bonus.annual / 100);
      }

      // Calculate equity vesting
      if (scenario.equity.totalValue > 0 && year > 0 && year <= scenario.equity.vestingYears) {
        yearEquity = scenario.equity.totalValue / scenario.equity.vestingYears;
      }

      const totalComp = yearSalary + yearBonus + yearEquity;

      projections.push({
        year: year,
        salary: Math.round(yearSalary),
        bonus: Math.round(yearBonus),
        equity: Math.round(yearEquity),
        total: Math.round(totalComp),
        milestone
      });
    }

    return projections;
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (comparisonMode) {
      // Combine all scenarios
      const years = 10;
      const chartData = [];
      
      for (let year = 0; year <= years; year++) {
        const dataPoint = { year: year === 0 ? 'Now' : `Year ${year}` };
        scenarios.forEach((scenario, index) => {
          const projections = calculateProjections(scenario, years);
          dataPoint[`scenario${index}`] = projections[year].total;
        });
        chartData.push(dataPoint);
      }
      
      return chartData;
    } else {
      // Single scenario with breakdown
      const scenario = scenarios[activeScenarioIndex];
      if (!scenario) return [];
      const projections = calculateProjections(scenario, 10);
      
      return projections.map(p => ({
        year: p.year === 0 ? 'Now' : `Year ${p.year}`,
        'Base Salary': p.salary,
        'Bonus': p.bonus,
        'Equity': p.equity,
        'Total': p.total
      }));
    }
  };

  const activeScenario = scenarios[activeScenarioIndex];
  const chartData = prepareChartData();
  const projections5Year = activeScenario ? calculateProjections(activeScenario, 5) : [];
  const projections10Year = activeScenario ? calculateProjections(activeScenario, 10) : [];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Career Growth Calculator</h2>
              <p className="text-gray-600 mt-1">
                Compare salary projections across different opportunities and scenarios
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Scenario Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {scenarios.map((scenario, index) => (
              <div key={scenario.id} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setActiveScenarioIndex(index)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeScenarioIndex === index
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={activeScenarioIndex === index ? { backgroundColor: scenario.color } : {}}
                >
                  {scenario.name}
                </button>
                {scenarios.length > 1 && (
                  <button
                    onClick={() => removeScenario(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Remove scenario"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addScenario}
              className="px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800 rounded-lg font-medium transition-colors shrink-0"
            >
              + Add Scenario
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setComparisonMode(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !comparisonMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Single View
            </button>
            <button
              onClick={() => setComparisonMode(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                comparisonMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={scenarios.length < 2}
            >
              Compare All ({scenarios.length})
            </button>
          </div>

          {!comparisonMode && activeScenario && (
            <>
              {/* Input Form */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Scenario Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scenario Name
                    </label>
                    <input
                      type="text"
                      value={activeScenario.name}
                      onChange={(e) => updateScenario(activeScenarioIndex, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    />
                  </div>

                  {/* Starting Salary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Starting Salary ($)
                    </label>
                    <input
                      type="number"
                      value={activeScenario.startingSalary || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                        updateScenario(activeScenarioIndex, 'startingSalary', isNaN(value) ? 0 : value);
                      }}
                      onFocus={(e) => {
                        if (activeScenario.startingSalary === 0) {
                          e.target.select();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    />
                  </div>

                  {/* Raise Scenario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raise Scenario
                    </label>
                    <select
                      value={activeScenario.raiseType}
                      onChange={(e) => updateScenario(activeScenarioIndex, 'raiseType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    >
                      <option value="conservative">Conservative ({activeScenario.annualRaisePercent.conservative}% annual)</option>
                      <option value="expected">Expected ({activeScenario.annualRaisePercent.expected}% annual)</option>
                      <option value="optimistic">Optimistic ({activeScenario.annualRaisePercent.optimistic}% annual)</option>
                    </select>
                  </div>

                  {/* Annual Bonus */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Annual Bonus (%)
                    </label>
                    <input
                      type="number"
                      value={activeScenario.bonus.annual || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        updateScenario(activeScenarioIndex, 'bonus.annual', isNaN(value) ? 0 : value);
                      }}
                      onFocus={(e) => {
                        if (activeScenario.bonus.annual === 0) {
                          e.target.select();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    />
                  </div>

                  {/* Equity Total Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Equity Value ($)
                    </label>
                    <input
                      type="number"
                      value={activeScenario.equity.totalValue || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                        updateScenario(activeScenarioIndex, 'equity.totalValue', isNaN(value) ? 0 : value);
                      }}
                      onFocus={(e) => {
                        if (activeScenario.equity.totalValue === 0) {
                          e.target.select();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    />
                  </div>

                  {/* Equity Vesting Years */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Equity Vesting Period (years)
                    </label>
                    <input
                      type="number"
                      value={activeScenario.equity.vestingYears || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                        updateScenario(activeScenarioIndex, 'equity.vestingYears', isNaN(value) ? 0 : value);
                      }}
                      onFocus={(e) => {
                        if (activeScenario.equity.vestingYears === 4 || activeScenario.equity.vestingYears === 0) {
                          e.target.select();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Non-Financial Goals)
                  </label>
                  <textarea
                    value={activeScenario.notes}
                    onChange={(e) => updateScenario(activeScenarioIndex, 'notes', e.target.value)}
                    placeholder="e.g., Work-life balance, learning opportunities, company culture, remote flexibility..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    rows="3"
                  />
                </div>

                {/* Milestones Section */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <button
                      onClick={() => setShowMilestones(!showMilestones)}
                      className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${showMilestones ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Career Milestones (Promotions, Title Changes)
                    </button>
                    {showMilestones && (
                      <button
                        onClick={() => addMilestone(activeScenarioIndex)}
                        className="px-3 py-1 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900"
                      >
                        + Add Milestone
                      </button>
                    )}
                  </div>

                  {showMilestones && (
                    <div className="space-y-3">
                      {activeScenario.milestones.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          No milestones added. Click "Add Milestone" to include promotions or title changes.
                        </p>
                      ) : (
                        activeScenario.milestones.map((milestone, mIndex) => (
                          <div key={milestone.id} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                                <input
                                  type="number"
                                  value={milestone.year}
                                  onChange={(e) => updateMilestone(activeScenarioIndex, mIndex, 'year', parseInt(e.target.value))}
                                  min="1"
                                  max="10"
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Milestone</label>
                                <input
                                  type="text"
                                  value={milestone.title}
                                  onChange={(e) => updateMilestone(activeScenarioIndex, mIndex, 'title', e.target.value)}
                                  placeholder="e.g., Promotion"
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Salary Increase (%)</label>
                                <input
                                  type="number"
                                  value={milestone.salaryIncrease}
                                  onChange={(e) => updateMilestone(activeScenarioIndex, mIndex, 'salaryIncrease', parseFloat(e.target.value))}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div className="flex items-end">
                                <button
                                  onClick={() => removeMilestone(activeScenarioIndex, mIndex)}
                                  className="w-full px-2 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Key Projections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">5-Year Projection</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    ${projections5Year[5]?.total.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Total compensation in year 5
                  </p>
                  <div className="mt-3 text-xs text-gray-600 space-y-1">
                    <div>Base: ${projections5Year[5]?.salary.toLocaleString()}</div>
                    <div>Bonus: ${projections5Year[5]?.bonus.toLocaleString()}</div>
                    <div>Equity: ${projections5Year[5]?.equity.toLocaleString()}</div>
                  </div>
                </div>

                <div className="bg-linear-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">10-Year Projection</h3>
                  <p className="text-3xl font-bold text-green-600">
                    ${projections10Year[10]?.total.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Total compensation in year 10
                  </p>
                  <div className="mt-3 text-xs text-gray-600 space-y-1">
                    <div>Base: ${projections10Year[10]?.salary.toLocaleString()}</div>
                    <div>Bonus: ${projections10Year[10]?.bonus.toLocaleString()}</div>
                    <div>Equity: ${projections10Year[10]?.equity.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {comparisonMode ? 'Scenario Comparison' : 'Salary Growth Trajectory'}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              {comparisonMode ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  {scenarios.map((scenario, index) => (
                    <Line
                      key={scenario.id}
                      type="monotone"
                      dataKey={`scenario${index}`}
                      name={scenario.name}
                      stroke={scenario.color}
                      strokeWidth={2}
                      dot={{ fill: scenario.color, r: 4 }}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="Base Salary" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Bonus" stackId="a" fill="#10b981" />
                  <Bar dataKey="Equity" stackId="a" fill="#f59e0b" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Summary Table */}
          {!comparisonMode && activeScenario && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Year</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Base Salary</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Bonus</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Equity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Total Comp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Milestone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projections10Year.map((projection) => (
                      <tr key={projection.year} className={projection.milestone ? 'bg-yellow-50' : ''}>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {projection.year === 0 ? 'Now' : `Year ${projection.year}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ${projection.salary.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ${projection.bonus.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ${projection.equity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          ${projection.total.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {projection.milestone && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {projection.milestone}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes Display */}
          {!comparisonMode && activeScenario && activeScenario.notes && (
            <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Non-Financial Considerations</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{activeScenario.notes}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

CareerGrowthCalculator.propTypes = {
  job: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    company: PropTypes.string,
    salary: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number
    }),
    industry: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired
};

export default CareerGrowthCalculator;
