import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getInterviewInsights } from "../api/jobs";
import LoadingSpinner from "./LoadingSpinner";
import Button from "./Button";
import Card from "./Card";

export default function InterviewInsights({ jobId, company, onClose }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [checklistState, setChecklistState] = useState({});

  useEffect(() => {
    fetchInsights();
  }, [jobId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getInterviewInsights(jobId);
      setInsights(response.data.data.insights);
      
      // Initialize checklist state
      const initialChecklistState = {};
      if (response.data.data.insights.checklist) {
        // Try to load saved checklist from localStorage
        const savedChecklist = localStorage.getItem(`checklist_${jobId}`);
        if (savedChecklist) {
          try {
            setChecklistState(JSON.parse(savedChecklist));
          } catch (e) {
            console.error("Error parsing saved checklist:", e);
            // If parsing fails, use fresh checklist
            Object.keys(response.data.data.insights.checklist).forEach(phase => {
              initialChecklistState[phase] = response.data.data.insights.checklist[phase].map(
                item => ({ ...item })
              );
            });
            setChecklistState(initialChecklistState);
          }
        } else {
          // No saved checklist, use fresh from API
          Object.keys(response.data.data.insights.checklist).forEach(phase => {
            initialChecklistState[phase] = response.data.data.insights.checklist[phase].map(
              item => ({ ...item })
            );
          });
          setChecklistState(initialChecklistState);
        }
      }
    } catch (err) {
      console.error("Error fetching interview insights:", err);
      setError(err.response?.data?.message || "Failed to load interview insights");
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklistItem = (phase, index) => {
    setChecklistState(prev => {
      const newState = {
        ...prev,
        [phase]: prev[phase].map((item, i) => 
          i === index ? { ...item, completed: !item.completed } : item
        )
      };
      
      // Save to localStorage
      localStorage.setItem(`checklist_${jobId}`, JSON.stringify(newState));
      
      return newState;
    });
  };

  const calculateChecklistProgress = () => {
    if (!checklistState || Object.keys(checklistState).length === 0) return 0;
    
    let total = 0;
    let completed = 0;
    
    Object.values(checklistState).forEach(phase => {
      phase.forEach(item => {
        total++;
        if (item.completed) completed++;
      });
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <Card className="w-full max-w-6xl mx-4 p-8">
          <LoadingSpinner />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <Card className="w-full max-w-6xl mx-4 p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={onClose} variant="secondary">Close</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!insights) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "process", label: "Interview Process", icon: "🔄" },
    { id: "questions", label: "Common Questions", icon: "❓" },
    { id: "preparation", label: "Preparation", icon: "📚" },
    { id: "tips", label: "Success Tips", icon: "⭐" },
    { id: "checklist", label: "Checklist", icon: "✅" }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-6xl my-8 h-[90vh] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Interview Insights</h2>
              <p className="text-gray-600 mt-1">
                {company} - {insights.jobTitle}
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
          
          {/* Data Source Info */}
          <div className={`text-sm px-3 py-2 rounded-lg ${
            insights.dataSource.basedOnRealData 
              ? 'bg-green-50 text-green-700' 
              : 'bg-yellow-50 text-yellow-700'
          }`}>
            <p className="font-medium">{insights.dataSource.note}</p>
          </div>
        </div>

        {/* Tabs - Fixed */}
        <div className="bg-white border-b border-gray-200 px-6 shrink-0">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          {activeTab === "overview" && (
            <OverviewTab insights={insights} />
          )}
          
          {activeTab === "process" && (
            <ProcessTab insights={insights} />
          )}
          
          {activeTab === "questions" && (
            <QuestionsTab insights={insights} />
          )}
          
          {activeTab === "preparation" && (
            <PreparationTab insights={insights} />
          )}
          
          {activeTab === "tips" && (
            <TipsTab insights={insights} />
          )}
          
          {activeTab === "checklist" && (
            <ChecklistTab 
              checklist={checklistState} 
              onToggle={toggleChecklistItem}
              progress={calculateChecklistProgress()}
            />
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Last updated: {new Date(insights.generatedAt).toLocaleString()}
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

InterviewInsights.propTypes = {
  jobId: PropTypes.string.isRequired,
  company: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

// Overview Tab Component
function OverviewTab({ insights }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Interview Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Process Type</h4>
            <p className="text-blue-700">{insights.processStages.processType}</p>
          </Card>
          <Card className="p-4 bg-green-50 border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Total Duration</h4>
            <p className="text-green-700">{insights.timeline.totalProcessDuration}</p>
          </Card>
          <Card className="p-4 bg-purple-50 border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">Interview Stages</h4>
            <p className="text-purple-700">{insights.processStages.totalStages}</p>
          </Card>
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-2">Competitiveness</h4>
            <p className="text-yellow-700">{insights.successMetrics.competitiveness}</p>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Success Metrics</h3>
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{insights.successMetrics.phoneScreenRate}</p>
              <p className="text-sm text-gray-600">Phone Screen Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{insights.successMetrics.interviewRate}</p>
              <p className="text-sm text-gray-600">Interview Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{insights.successMetrics.offerRate}</p>
              <p className="text-sm text-gray-600">Offer Rate</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">{insights.successMetrics.note}</p>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Timeline Expectations</h3>
        <Card className="p-4">
          <div className="space-y-3">
            <TimelineItem label="Application to First Response" duration={insights.timeline.applicationToFirstResponse} />
            <TimelineItem label="First Response to Phone Screen" duration={insights.timeline.firstResponseToPhoneScreen} />
            <TimelineItem label="Phone Screen to Technical" duration={insights.timeline.phoneScreenToTechnical} />
            <TimelineItem label="Technical to Onsite" duration={insights.timeline.technicalToOnsite} />
            <TimelineItem label="Onsite to Final Decision" duration={insights.timeline.onsiteToFinalDecision} />
          </div>
          <p className="text-xs text-gray-500 mt-4 italic">{insights.timeline.note}</p>
        </Card>
      </div>
    </div>
  );
}

OverviewTab.propTypes = {
  insights: PropTypes.object.isRequired
};

function TimelineItem({ label, duration }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-700">{label}</span>
      <span className="font-semibold text-blue-600">{duration}</span>
    </div>
  );
}

// ...existing code...

// Process Tab Component
function ProcessTab({ insights }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Interview Stages</h3>
        <div className="space-y-4">
          {insights.processStages.stages.map((stage, index) => (
            <Card key={index} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start">
                <div className="shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 mr-4">
                  {stage.order}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-gray-900 mb-1">{stage.name}</h4>
                  <p className="text-gray-600 mb-3">{stage.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Frequency:</span>
                      <span className="ml-2 font-medium text-green-600">{stage.frequency}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <span className="ml-2 font-medium text-blue-600">{stage.avgDuration}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Interview Formats</h3>
        <div className="space-y-3">
          {insights.interviewFormats.commonFormats.map((format, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{format.format}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  format.frequency === 'Very Common' ? 'bg-green-100 text-green-700' :
                  format.frequency === 'Common' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {format.frequency}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{format.description}</p>
              <p className="text-blue-600 text-sm">
                <strong>Duration:</strong> {format.duration}
              </p>
              <p className="text-gray-700 text-sm mt-2">
                <strong>Preparation:</strong> {format.preparation}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Typical Interviewers</h3>
        <div className="space-y-3">
          {insights.interviewerInfo.typicalInterviewers.map((interviewer, index) => (
            <Card key={index} className="p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{interviewer.role}</h4>
                <span className="text-sm text-gray-600 italic">{interviewer.stage}</span>
              </div>
              <p className="text-gray-700 text-sm mb-2">
                <strong>Focus:</strong> {interviewer.focus}
              </p>
              <p className="text-blue-600 text-sm">
                <strong>Tips:</strong> {interviewer.tips}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

ProcessTab.propTypes = {
  insights: PropTypes.object.isRequired
};

// Questions Tab Component
function QuestionsTab({ insights }) {
  const { commonQuestions } = insights;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">🗣️</span>
          Behavioral Questions
        </h3>
        <Card className="p-4">
          <ul className="space-y-2">
            {commonQuestions.behavioral.map((question, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-3 mt-1">•</span>
                <span className="text-gray-700">{question}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {commonQuestions.technical && commonQuestions.technical.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">💻</span>
            Technical Questions
          </h3>
          <Card className="p-4">
            <ul className="space-y-2">
              {commonQuestions.technical.map((question, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">•</span>
                  <span className="text-gray-700">{question}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {commonQuestions.roleSpecific && commonQuestions.roleSpecific.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Role-Specific Questions
          </h3>
          <Card className="p-4">
            <ul className="space-y-2">
              {commonQuestions.roleSpecific.map((question, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-purple-500 mr-3 mt-1">•</span>
                  <span className="text-gray-700">{question}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {commonQuestions.industrySpecific && commonQuestions.industrySpecific.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🏢</span>
            Industry-Specific Questions
          </h3>
          <Card className="p-4">
            <ul className="space-y-2">
              {commonQuestions.industrySpecific.map((question, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-500 mr-3 mt-1">•</span>
                  <span className="text-gray-700">{question}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tip: STAR Method</h4>
        <p className="text-blue-700 text-sm mb-2">
          Structure your answers using the STAR method:
        </p>
        <ul className="space-y-1 text-sm text-blue-700">
          <li><strong>S</strong>ituation - Set the context</li>
          <li><strong>T</strong>ask - Describe your responsibility</li>
          <li><strong>A</strong>ction - Explain what you did</li>
          <li><strong>R</strong>esult - Share the outcome with metrics</li>
        </ul>
      </Card>
    </div>
  );
}

QuestionsTab.propTypes = {
  insights: PropTypes.object.isRequired
};

// Preparation Tab Component
function PreparationTab({ insights }) {
  const { preparationRecs } = insights;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">General Preparation</h3>
        <div className="space-y-4">
          {preparationRecs.general.map((category, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg text-gray-900">{category.category}</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  category.priority === 'High' ? 'bg-red-100 text-red-700' :
                  category.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {category.priority} Priority
                </span>
              </div>
              <ul className="space-y-2">
                {category.tasks.map((task, taskIndex) => (
                  <li key={taskIndex} className="flex items-start">
                    <span className="text-blue-500 mr-3 mt-1">✓</span>
                    <span className="text-gray-700">{task}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>

      {preparationRecs.roleSpecific && preparationRecs.roleSpecific.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Role-Specific Preparation</h3>
          <div className="space-y-4">
            {preparationRecs.roleSpecific.map((category, index) => (
              <Card key={index} className="p-4 bg-purple-50 border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-lg text-purple-900">{category.category}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    category.priority === 'High' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {category.priority} Priority
                  </span>
                </div>
                <ul className="space-y-2">
                  {category.tasks.map((task, taskIndex) => (
                    <li key={taskIndex} className="flex items-start">
                      <span className="text-purple-600 mr-3 mt-1">✓</span>
                      <span className="text-gray-700">{task}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="p-4 bg-green-50 border-green-200">
        <h4 className="font-semibold text-green-900 mb-3">🎯 Research Tips</h4>
        <ul className="space-y-2">
          {insights.interviewerInfo.researchTips.map((tip, index) => (
            <li key={index} className="flex items-start">
              <span className="text-green-600 mr-3 mt-1">•</span>
              <span className="text-green-800">{tip}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

PreparationTab.propTypes = {
  insights: PropTypes.object.isRequired
};

// Tips Tab Component
function TipsTab({ insights }) {
  const { successTips } = insights;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Before the Interview</h3>
        <div className="grid gap-3">
          {successTips.beforeInterview.map((tip, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{tip.tip}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                  tip.importance === 'Critical' ? 'bg-red-100 text-red-700' :
                  tip.importance === 'High' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {tip.importance}
                </span>
              </div>
              <p className="text-gray-600 text-sm">{tip.details}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">During the Interview</h3>
        <div className="grid gap-3">
          {successTips.duringInterview.map((tip, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{tip.tip}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                  tip.importance === 'Critical' ? 'bg-red-100 text-red-700' :
                  tip.importance === 'High' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {tip.importance}
                </span>
              </div>
              <p className="text-gray-600 text-sm">{tip.details}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">After the Interview</h3>
        <div className="grid gap-3">
          {successTips.afterInterview.map((tip, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{tip.tip}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                  tip.importance === 'Critical' ? 'bg-red-100 text-red-700' :
                  tip.importance === 'High' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {tip.importance}
                </span>
              </div>
              <p className="text-gray-600 text-sm">{tip.details}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Common Mistakes to Avoid</h3>
        <Card className="p-4 bg-red-50 border-red-200">
          <ul className="space-y-2">
            {successTips.commonMistakes.map((mistake, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 mr-3 mt-1">✗</span>
                <span className="text-red-800">{mistake}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {successTips.dataInsights && successTips.dataInsights.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Data-Driven Insights</h3>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <ul className="space-y-2">
              {successTips.dataInsights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">📊</span>
                  <span className="text-blue-800">{insight}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

TipsTab.propTypes = {
  insights: PropTypes.object.isRequired
};

// Checklist Tab Component
function ChecklistTab({ checklist, onToggle, progress }) {
  const phases = [
    { id: 'oneWeekBefore', label: 'One Week Before', icon: '📅' },
    { id: 'threeDaysBefore', label: 'Three Days Before', icon: '📋' },
    { id: 'oneDayBefore', label: 'One Day Before', icon: '⏰' },
    { id: 'dayOf', label: 'Day Of Interview', icon: '🎯' },
    { id: 'afterInterview', label: 'After Interview', icon: '✉️' }
  ];

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="p-4 bg-linear-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Preparation Progress</h3>
          <span className="text-2xl font-bold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-linear-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* Checklist Phases */}
      {phases.map(phase => {
        const items = checklist[phase.id] || [];
        const completedCount = items.filter(item => item.completed).length;
        const phaseProgress = items.length > 0 
          ? Math.round((completedCount / items.length) * 100) 
          : 0;

        return (
          <div key={phase.id}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                <span className="mr-2">{phase.icon}</span>
                {phase.label}
              </h3>
              <span className="text-sm text-gray-600">
                {completedCount} / {items.length} completed
              </span>
            </div>
            
            <Card className="p-4">
              {/* Phase Progress */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${phaseProgress}%` }}
                  />
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-start p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onToggle(phase.id, index)}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => onToggle(phase.id, index)}
                      className="mt-1 mr-3 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className={`flex-1 ${
                      item.completed 
                        ? 'text-gray-500 line-through' 
                        : 'text-gray-900'
                    }`}>
                      {item.task}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
      })}

      <Card className="p-4 bg-green-50 border-green-200">
        <p className="text-green-800 text-sm">
          <strong>💡 Tip:</strong> Check off items as you complete them to track your preparation progress. 
          Being well-prepared significantly increases your chances of interview success!
        </p>
      </Card>
    </div>
  );
}

ChecklistTab.propTypes = {
  checklist: PropTypes.object.isRequired,
  onToggle: PropTypes.func.isRequired,
  progress: PropTypes.number.isRequired
};
