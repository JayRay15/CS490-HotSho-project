import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * UC-128: Career Simulation Results Display Component
 * Shows simulation outcomes with interactive visualizations
 */
const CareerSimulationResults = ({ simulation, onBack, onClose }) => {
  const [selectedPath, setSelectedPath] = useState(simulation.recommendedPath.pathId);
  const [selectedScenario, setSelectedScenario] = useState('realistic');

  const currentPath = simulation.paths.find(p => p.pathId === selectedPath);

  // Prepare timeline data for the selected path/scenario
  const timelineData = currentPath?.scenarios[selectedScenario]?.milestones?.map((milestone, index) => ({
    year: milestone.year,
    salary: milestone.salary,
    title: milestone.title,
    level: milestone.level
  })) || [];

  // Prepare comparison data across paths
  const pathComparisonData = simulation.paths.map(path => ({
    name: path.pathName.length > 20 ? path.pathName.substring(0, 20) + '...' : path.pathName,
    earnings: path.expectedLifetimeEarnings / 1000000, // Convert to millions
    risk: path.riskScore,
    success: path.successScore
  }));

  // Prepare characteristics radar data
  const characteristicsData = currentPath ? [{
    characteristic: 'Stability',
    value: currentPath.pathCharacteristics.stabilityScore
  }, {
    characteristic: 'Growth',
    value: currentPath.pathCharacteristics.growthPotential
  }, {
    characteristic: 'Learning',
    value: currentPath.pathCharacteristics.learningCurve
  }, {
    characteristic: 'Balance',
    value: currentPath.pathCharacteristics.workLifeBalance
  }, {
    characteristic: 'Demand',
    value: currentPath.pathCharacteristics.marketDemand
  }] : [];

  // Scenario comparison for selected path
  const scenarioComparisonData = currentPath ? [
    {
      scenario: 'Optimistic',
      earnings: currentPath.scenarios.optimistic.totalEarnings / 1000000,
      finalSalary: currentPath.scenarios.optimistic.finalSalary / 1000
    },
    {
      scenario: 'Realistic',
      earnings: currentPath.scenarios.realistic.totalEarnings / 1000000,
      finalSalary: currentPath.scenarios.realistic.finalSalary / 1000
    },
    {
      scenario: 'Pessimistic',
      earnings: currentPath.scenarios.pessimistic.totalEarnings / 1000000,
      finalSalary: currentPath.scenarios.pessimistic.finalSalary / 1000
    }
  ] : [];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getScenarioColor = (scenario) => {
    return {
      optimistic: '#10b981',
      realistic: '#3b82f6',
      pessimistic: '#f59e0b'
    }[scenario] || '#6b7280';
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Career Path Simulation Results</h2>
              <p className="text-sm text-gray-600 mt-1">
                {simulation.timeHorizon}-year outlook • {simulation.paths.length} paths analyzed
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onBack}
                className="px-4 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg font-semibold border-2 border-primary-300 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Recommended Path Banner */}
          <div className="bg-primary-100 border-2 border-primary-400 p-5 rounded-xl mb-6 shadow-md">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-gray-900">Recommended Path</h3>
                </div>
                <p className="text-xl font-bold text-primary-800">
                  {simulation.paths.find(p => p.pathId === simulation.recommendedPath.pathId)?.pathName}
                </p>
                <p className="text-sm mt-2 text-gray-700">{simulation.recommendedPath.reasoning}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-900">{formatCurrency(simulation.paths.find(p => p.pathId === simulation.recommendedPath.pathId)?.expectedLifetimeEarnings || 0)}</div>
                <div className="text-sm text-gray-700">Expected Lifetime Earnings</div>
              </div>
            </div>
          </div>

          {/* Path Selector */}
          <div className="mb-6 bg-gray-50 p-4 rounded-xl border-2 border-gray-300">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Select Path to Analyze
            </label>
            <div className="flex gap-3 flex-wrap">
              {simulation.paths.map(path => (
                <button
                  key={path.pathId}
                  onClick={() => setSelectedPath(path.pathId)}
                  className={`px-5 py-3 rounded-lg border-2 font-bold transition-all shadow-sm ${
                    selectedPath === path.pathId
                      ? 'bg-accent-200 text-gray-900 border-accent-500 shadow-md scale-105'
                      : 'bg-white text-gray-900 border-gray-600 hover:bg-gray-50 hover:border-gray-700'
                  }`}
                >
                  {path.pathName}
                  {path.pathId === simulation.recommendedPath.pathId && (
                    <span className="ml-2 text-xs font-semibold">(Recommended)</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-primary-50 p-5 rounded-xl border-2 border-primary-300 shadow-sm">
              <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Lifetime Earnings</div>
              <div className="text-xl font-bold text-primary-800">
                {formatCurrency(currentPath?.expectedLifetimeEarnings || 0)}
              </div>
            </div>
            <div className="bg-accent-50 p-5 rounded-xl border-2 border-accent-300 shadow-sm">
              <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Success Score</div>
              <div className="text-xl font-bold text-accent-800">
                {currentPath?.successScore || 0}/100
              </div>
            </div>
            <div className="bg-secondary-100 p-5 rounded-xl border-2 border-secondary-400 shadow-sm">
              <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Risk Score</div>
              <div className="text-xl font-bold text-secondary-800">
                {currentPath?.riskScore || 0}/100
              </div>
            </div>
            <div className="bg-primary-100 p-5 rounded-xl border-2 border-primary-400 shadow-sm">
              <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Avg Annual Growth</div>
              <div className="text-xl font-bold text-primary-900">
                {currentPath?.averageSalaryGrowthRate || 0}%
              </div>
            </div>
          </div>

          {/* Scenario Selector & Timeline */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Career Trajectory</h3>
              <div className="flex gap-2">
                {['optimistic', 'realistic', 'pessimistic'].map(scenario => (
                  <button
                    key={scenario}
                    onClick={() => setSelectedScenario(scenario)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      selectedScenario === scenario
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={selectedScenario === scenario ? { backgroundColor: getScenarioColor(scenario) } : {}}
                  >
                    {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="year"
                    label={{ value: 'Year', position: 'insideBottom', offset: -10, style: { fontSize: 14 } }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'Salary ($)', angle: -90, position: 'insideLeft', style: { fontSize: 14 } }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Year ${label}`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="salary"
                    stroke={getScenarioColor(selectedScenario)}
                    strokeWidth={3}
                    name="Salary"
                    dot={{ r: 5, fill: getScenarioColor(selectedScenario) }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Two-column layout for remaining visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scenario Comparison */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Scenario Comparison</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={scenarioComparisonData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="scenario" tick={{ fontSize: 12 }} />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    label={{ value: 'Total ($M)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    tick={{ fontSize: 11 }}
                    width={60}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Final Salary ($K)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                    tick={{ fontSize: 11 }}
                    width={60}
                  />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Bar yAxisId="left" dataKey="earnings" fill="#3b82f6" name="Total Earnings ($M)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="finalSalary" fill="#10b981" name="Final Salary ($K)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Path Characteristics Radar */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Path Characteristics</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={characteristicsData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="#d1d5db" />
                  <PolarAngleAxis dataKey="characteristic" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Radar
                    name="Scores"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.5}
                    strokeWidth={2}
                  />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Path Comparison Table */}
          <div className="mt-6 bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">All Paths Comparison</h3>
            <ResponsiveContainer width="100%" height={Math.max(200, simulation.paths.length * 60)}>
              <BarChart 
                data={pathComparisonData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => `$${value.toFixed(1)}M`}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={180}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value) => `$${value.toFixed(2)}M`}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar 
                  dataKey="earnings" 
                  fill="#3b82f6" 
                  name="Lifetime Earnings ($M)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Key Decision Points */}
          {currentPath?.scenarios[selectedScenario]?.keyDecisionPoints?.length > 0 && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Key Decision Points</h3>
              <div className="space-y-2">
                {currentPath.scenarios[selectedScenario].keyDecisionPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3 bg-white p-3 rounded">
                    <div className="shrink-0 w-16 text-center">
                      <div className="text-xs text-gray-500">Year {point.year}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{point.decision}</div>
                      <div className="text-sm text-gray-600 mt-1">{point.rationale}</div>
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      {point.impact > 0 ? '+' : ''}{point.impact}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerSimulationResults;
