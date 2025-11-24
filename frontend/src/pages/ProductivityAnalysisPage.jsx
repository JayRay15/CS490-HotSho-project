import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { productivityApi } from '../api/productivity';
import ProductivityDashboard from '../components/ProductivityDashboard';
import TimeTracker from '../components/TimeTracker';
import Card from '../components/Card';
import Button from '../components/Button';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ProductivityAnalysisPage() {
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState('dashboard');
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  
  const [analysisForm, setAnalysisForm] = useState({
    startDate: '',
    endDate: '',
    periodType: 'Custom'
  });

  useEffect(() => {
    if (analysisId) {
      loadAnalysis(analysisId);
      setView('analysis');
    } else if (location.pathname.includes('/tracker')) {
      setView('tracker');
    } else {
      loadAnalyses();
      setView('dashboard');
    }
  }, [analysisId, location.pathname]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const response = await productivityApi.getUserAnalyses(null, 20);
      setAnalyses(response.analyses || []);
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async (id) => {
    try {
      setLoading(true);
      const response = await productivityApi.getAnalysis(id);
      setSelectedAnalysis(response.analysis);
    } catch (error) {
      console.error('Failed to load analysis:', error);
      alert('Failed to load analysis. Redirecting to dashboard.');
      navigate('/productivity');
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    if (!analysisForm.startDate || !analysisForm.endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    const start = new Date(analysisForm.startDate);
    const end = new Date(analysisForm.endDate);
    
    if (start >= end) {
      alert('End date must be after start date.');
      return;
    }

    try {
      setGeneratingAnalysis(true);
      const response = await productivityApi.generateAnalysis(
        analysisForm.startDate,
        analysisForm.endDate,
        analysisForm.periodType
      );
      
      setSelectedAnalysis(response.analysis);
      setShowAnalysisForm(false);
      setAnalysisForm({ startDate: '', endDate: '', periodType: 'Custom' });
      setView('analysis');
      
      await loadAnalyses();
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      const errorMessage = error.response?.data?.message || error.message;
      
      if (errorMessage.includes('No time tracking data')) {
        alert(
          'No time tracking data found for the selected period.\n\n' +
          'To generate an analysis:\n' +
          '1. Click "Time Tracker" button (top right)\n' +
          '2. Start and stop at least 2-3 activities\n' +
          '3. Come back and try generating the analysis again\n\n' +
          'Note: Only completed activities (with start AND stop times) are included.'
        );
      } else {
        alert(`Failed to generate analysis: ${errorMessage}`);
      }
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const quickAnalysis = (days, type) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setAnalysisForm({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      periodType: type
    });
    setShowAnalysisForm(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Critical': return 'text-red-600';
      case 'High': return 'text-orange-600';
      case 'Moderate': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const handleExportPDF = () => {
    if (!selectedAnalysis) {
      alert('No analysis data to export');
      return;
    }
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(`${selectedAnalysis.period.type} Productivity Analysis`, 14, 20);

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Period: ${new Date(selectedAnalysis.period.startDate).toLocaleDateString()} - ${new Date(selectedAnalysis.period.endDate).toLocaleDateString()}`,
        14,
        28
      );

      // Summary Metrics
      autoTable(doc, {
        startY: 35,
        head: [['Metric', 'Value']],
        body: [
          ['Total Hours', `${selectedAnalysis.timeInvestment?.totalHours?.toFixed(1) || 0}h`],
          ['Productive Hours', `${selectedAnalysis.timeInvestment?.productiveHours?.toFixed(1) || 0}h`],
          ['Average Productivity', `${selectedAnalysis.productivityMetrics?.averageProductivity?.toFixed(1) || 'N/A'}/10`],
          ['Efficiency Rating', selectedAnalysis.productivityMetrics?.efficiencyRating || 'N/A'],
          ['Efficiency Score', `${selectedAnalysis.efficiencyScore || 0}%`],
          ['Total Outcomes', `${selectedAnalysis.outcomeAnalysis?.totalOutcomes || 0}`],
          ['Outcomes per Hour', selectedAnalysis.outcomeAnalysis?.outcomesPerHour?.toFixed(2) || '0'],
          ['Burnout Risk Level', selectedAnalysis.burnoutIndicators?.riskLevel || 'Unknown'],
          ['Work-Life Balance', selectedAnalysis.workLifeBalance || 'N/A'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] },
      });

      // Warnings
      if (selectedAnalysis.burnoutIndicators?.warnings?.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Health & Wellness Alerts', 14, doc.lastAutoTable.finalY + 10);

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 15,
          head: [['Severity', 'Message']],
          body: selectedAnalysis.burnoutIndicators.warnings.map(w => [
            w.severity,
            w.message
          ]),
          theme: 'grid',
          headStyles: { fillColor: [71, 85, 105] },
        });
      }

      // Recommendations
      if (selectedAnalysis.recommendations?.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Recommendations', 14, doc.lastAutoTable.finalY + 10);

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 15,
          head: [['Priority', 'Title', 'Description']],
          body: selectedAnalysis.recommendations.map(r => [
            r.priority,
            r.title,
            r.description
          ]),
          theme: 'grid',
          headStyles: { fillColor: [71, 85, 105] },
          columnStyles: {
            2: { cellWidth: 'wrap' }
          }
        });
      }

      // Time Investment Breakdown
      if (selectedAnalysis.timeInvestment?.topActivities?.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Time Investment Breakdown', 14, doc.lastAutoTable.finalY + 10);

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 15,
          head: [['Activity', 'Hours', 'Percentage']],
          body: selectedAnalysis.timeInvestment.topActivities.map(a => [
            a.activity,
            `${a.hours}h`,
            `${a.percentage}%`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [71, 85, 105] },
        });
      }

      // Save PDF
      const fileName = `Productivity_Analysis_${selectedAnalysis.period.type}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  if (loading && !selectedAnalysis) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {view === 'dashboard' && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900">Productivity Analysis</h1>
              <p className="text-gray-600 mt-1">Track your time and analyze your productivity patterns</p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setView('tracker');
                navigate('/productivity/tracker');
              }}
            >
              Time Tracker
            </Button>
          </div>

          <ProductivityDashboard />
          
          <div className="mt-8">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-heading font-semibold">Analysis History</h3>
                <Button
                  variant="primary"
                  onClick={() => setShowAnalysisForm(true)}
                >
                  Generate New Analysis
                </Button>
              </div>

              {showAnalysisForm && (
                <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-4">Generate Productivity Analysis</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => quickAnalysis(7, 'Weekly')}
                    >
                      Last Week
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => quickAnalysis(30, 'Monthly')}
                    >
                      Last Month
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => quickAnalysis(90, 'Quarterly')}
                    >
                      Last Quarter
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setDate(start.getDate() - 14);
                        setAnalysisForm({
                          startDate: start.toISOString().split('T')[0],
                          endDate: end.toISOString().split('T')[0],
                          periodType: 'Custom'
                        });
                      }}
                    >
                      Custom Range
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={analysisForm.startDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setAnalysisForm(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={analysisForm.endDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setAnalysisForm(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Period Type
                      </label>
                      <select
                        value={analysisForm.periodType}
                        onChange={(e) => setAnalysisForm(prev => ({ ...prev, periodType: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={generateAnalysis}
                      isLoading={generatingAnalysis}
                      disabled={!analysisForm.startDate || !analysisForm.endDate}
                    >
                      Generate Analysis
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAnalysisForm(false);
                        setAnalysisForm({ startDate: '', endDate: '', periodType: 'Custom' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {analyses.length === 0 ? (
                <div className="text-center py-12">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">
                    No Analyses Yet
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Generate your first productivity analysis to get insights and recommendations.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowAnalysisForm(true)}
                  >
                    Generate Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {analyses.map(analysis => (
                    <div
                      key={analysis._id}
                      onClick={() => {
                        setSelectedAnalysis(analysis);
                        setView('analysis');
                        navigate(`/productivity/analysis/${analysis._id}`);
                      }}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {analysis.period.type} Analysis
                            </h4>
                            <span className="text-sm text-gray-600">
                              {new Date(analysis.period.startDate).toLocaleDateString()} - {' '}
                              {new Date(analysis.period.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Total Hours: </span>
                              <span className="font-semibold">{analysis.timeInvestment?.totalHours?.toFixed(1) || 0}h</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Productivity: </span>
                              <span className="font-semibold">{analysis.productivityMetrics?.averageProductivity?.toFixed(1) || 'N/A'}/10</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Efficiency: </span>
                              <span className="font-semibold">{analysis.productivityMetrics?.efficiencyRating || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Outcomes: </span>
                              <span className="font-semibold">{analysis.outcomeAnalysis?.totalOutcomes || 0}</span>
                            </div>
                          </div>
                        </div>
                        
                        {analysis.burnoutIndicators?.riskLevel && 
                         analysis.burnoutIndicators.riskLevel !== 'Low' && (
                          <div className={`ml-4 flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                            analysis.burnoutIndicators.riskLevel === 'Critical' 
                              ? 'bg-red-100 text-red-800'
                              : analysis.burnoutIndicators.riskLevel === 'High'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <AlertTriangle className="w-4 h-4" />
                            {analysis.burnoutIndicators.riskLevel} Risk
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {view === 'analysis' && selectedAnalysis && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setView('dashboard');
                setSelectedAnalysis(null);
                navigate('/productivity');
              }}
              className="flex items-center gap-2 text-primary hover:text-primary-600"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            
            <div className="flex gap-2">
              <Button variant="outline" size="small" onClick={handleExportPDF}>
                Export Report
              </Button>
            </div>
          </div>

          <Card variant="elevated">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-heading font-bold text-gray-900">
                  {selectedAnalysis.period.type} Analysis
                </h2>
                <p className="text-gray-600">
                  {new Date(selectedAnalysis.period.startDate).toLocaleDateString()} - {' '}
                  {new Date(selectedAnalysis.period.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {selectedAnalysis.productivityMetrics?.averageProductivity?.toFixed(1) || 'N/A'}/10
                </div>
                <div className="text-sm text-gray-600">
                  {selectedAnalysis.productivityMetrics?.efficiencyRating || 'N/A'} Efficiency
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Total Hours</div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedAnalysis.timeInvestment?.totalHours?.toFixed(1) || 0}h
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedAnalysis.timeInvestment?.productiveHours?.toFixed(1) || 0}h productive
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Efficiency Score</div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedAnalysis.efficiencyScore || 0}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Focus: {selectedAnalysis.productivityMetrics?.focusScore || 0}%
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Outcomes</div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedAnalysis.outcomeAnalysis?.totalOutcomes || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedAnalysis.outcomeAnalysis?.outcomesPerHour?.toFixed(2) || 0} per hour
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Burnout Risk</div>
                <div className={`text-2xl font-bold ${getRiskColor(selectedAnalysis.burnoutIndicators?.riskLevel)}`}>
                  {selectedAnalysis.burnoutIndicators?.riskLevel || 'Unknown'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedAnalysis.burnoutIndicators?.workloadBalance || 'N/A'}
                </div>
              </div>
            </div>
          </Card>

          {selectedAnalysis.burnoutIndicators?.warnings && 
           selectedAnalysis.burnoutIndicators.warnings.length > 0 && (
            <Card variant="elevated" className="border-l-4 border-orange-500">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Health & Wellness Alerts
                  </h3>
                  <div className="space-y-2">
                    {selectedAnalysis.burnoutIndicators.warnings.map((warning, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          warning.severity === 'Critical'
                            ? 'bg-red-50 border border-red-200'
                            : warning.severity === 'Warning'
                            ? 'bg-orange-50 border border-orange-200'
                            : 'bg-blue-50 border border-blue-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-sm font-semibold ${
                            warning.severity === 'Critical'
                              ? 'text-red-800'
                              : warning.severity === 'Warning'
                              ? 'text-orange-800'
                              : 'text-blue-800'
                          }`}>
                            [{warning.severity}]
                          </span>
                          <p className="text-sm text-gray-700">{warning.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {selectedAnalysis.recommendations && selectedAnalysis.recommendations.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
              
              <div className="space-y-4">
                {selectedAnalysis.recommendations
                  .sort((a, b) => {
                    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
                    return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
                  })
                  .map((rec, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(rec.priority)}`}>
                          {rec.priority}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                          <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                          
                          {rec.actionItems && rec.actionItems.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">Action Items:</p>
                              <ul className="space-y-1">
                                {rec.actionItems.map((item, idx) => (
                                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="mt-2 text-xs text-gray-500">
                            Expected Impact: {rec.expectedImpact || 'Medium'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {selectedAnalysis.timeInvestment?.topActivities && 
           selectedAnalysis.timeInvestment.topActivities.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Time Investment Breakdown</h3>
              
              <div className="space-y-3">
                {selectedAnalysis.timeInvestment.topActivities.map((activity, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{activity.activity}</span>
                      <span className="text-gray-600">
                        {activity.hours}h ({activity.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${activity.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {selectedAnalysis.performancePatterns?.bestPerformingActivities && 
           selectedAnalysis.performancePatterns.bestPerformingActivities.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Best Performing Activities</h3>
              
              <div className="space-y-3">
                {selectedAnalysis.performancePatterns.bestPerformingActivities.map((activity, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-900">{activity.activity}</h4>
                        <p className="text-sm text-gray-600">
                          {activity.totalOutcomes} outcomes generated
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {activity.averageProductivity.toFixed(1)}/10
                        </div>
                        <div className="text-xs text-gray-600">Productivity</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {selectedAnalysis.productivityMetrics?.peakProductivityTime && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Performance Patterns</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Peak Productivity Time</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedAnalysis.productivityMetrics.peakProductivityTime.label}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Schedule your most important tasks during this time
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Optimal Working Hours</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedAnalysis.productivityMetrics.optimalWorkingHours?.start || 'N/A'}:00 - {' '}
                    {selectedAnalysis.productivityMetrics.optimalWorkingHours?.end || 'N/A'}:00
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Your most productive time window
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Consistency Score</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedAnalysis.productivityMetrics.consistencyScore || 0}%
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    How regularly you track activities
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Work-Life Balance</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedAnalysis.workLifeBalance || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Avg {selectedAnalysis.burnoutIndicators?.averageDailyHours?.toFixed(1) || 0}h per day
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {view === 'tracker' && (
        <div className="space-y-6">
          <button
            onClick={() => {
              setView('dashboard');
              navigate('/productivity');
            }}
            className="flex items-center gap-2 text-primary hover:text-primary-600 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <TimeTracker />
        </div>
      )}
    </div>
  );
}
