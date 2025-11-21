import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

/**
 * Negotiation Details Component
 * Main view for working with an active negotiation
 */
export function NegotiationDetails({
  negotiation,
  onUpdate,
  expandedSections,
  onToggleSection,
  formatCurrency,
  formatDate,
  onGenerateTalkingPoints,
  onMarkTalkingPointUsed,
  onMarkScenarioPracticed,
  onUpdateChecklistItem,
  onCompleteExercise,
  onAddCounteroffer,
  onAddConversation
}) {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {negotiation.offerDetails.position}
            </h2>
            <p className="text-gray-600">{negotiation.offerDetails.company}</p>
            <p className="text-sm text-gray-500 mt-2">
              {negotiation.offerDetails.location} • Deadline: {formatDate(negotiation.offerDetails.deadlineDate)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {formatCurrency(negotiation.offerDetails.initialOffer?.baseSalary)}
            </div>
            <p className="text-sm text-gray-600">Initial Base Salary</p>
          </div>
        </div>
      </Card>

      {/* Confidence Meter */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Confidence Level</h3>
            <p className="text-sm text-gray-600">Rate your confidence for this negotiation</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={negotiation.confidenceLevel}
              onChange={(e) => onUpdate({ confidenceLevel: parseInt(e.target.value) })}
              className="w-48"
            />
            <span className="text-2xl font-bold text-primary-600">
              {negotiation.confidenceLevel}/10
            </span>
          </div>
        </div>
      </Card>

      {/* Talking Points Section */}
      <CollapsibleSection
        title="💡 Talking Points"
        expanded={expandedSections.talkingPoints}
        onToggle={() => onToggleSection('talkingPoints')}
        badge={`${negotiation.talkingPoints?.filter(tp => !tp.isUsed).length || 0} unused`}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Personalized talking points based on your experience and market data
            </p>
            <Button size="sm" onClick={onGenerateTalkingPoints}>
              Regenerate
            </Button>
          </div>

          {negotiation.talkingPoints?.map((point, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                point.isUsed ? 'bg-gray-50 border-gray-200' : 'bg-white border-primary-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                      {point.category.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      point.confidence === 'high' ? 'bg-green-100 text-green-700' :
                      point.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {point.confidence} confidence
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 mb-1">{point.point}</p>
                  <p className="text-sm text-gray-600">{point.supporting_data}</p>
                </div>
                <button
                  onClick={() => onMarkTalkingPointUsed(index)}
                  className={`ml-4 px-3 py-1 text-sm rounded ${
                    point.isUsed
                      ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                  disabled={point.isUsed}
                >
                  {point.isUsed ? '✓ Used' : 'Mark Used'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Negotiation Scenarios */}
      <CollapsibleSection
        title="📝 Negotiation Scripts"
        expanded={expandedSections.scenarios}
        onToggle={() => onToggleSection('scenarios')}
        badge={`${negotiation.scenarios?.length || 0} scenarios`}
      >
        <div className="space-y-4">
          {negotiation.scenarios?.map((scenario, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-900">{scenario.title}</h4>
                  <button
                    onClick={() => onMarkScenarioPracticed(index)}
                    className={`px-3 py-1 text-sm rounded ${
                      scenario.isPracticed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {scenario.isPracticed ? '✓ Practiced' : 'Mark Practiced'}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  When to use: {scenario.whenToUse}
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Script:</p>
                  <p className="text-sm text-gray-900 italic bg-blue-50 p-3 rounded">
                    "{scenario.script}"
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Expected Response:</p>
                  <p className="text-sm text-gray-600">{scenario.expectedResponse}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Next Steps:</p>
                  <p className="text-sm text-gray-600">{scenario.nextSteps}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Preparation Checklist */}
      <CollapsibleSection
        title="✅ Preparation Checklist"
        expanded={expandedSections.checklist}
        onToggle={() => onToggleSection('checklist')}
        badge={`${negotiation.preparationChecklist?.filter(item => item.isCompleted).length || 0}/${negotiation.preparationChecklist?.length || 0} complete`}
      >
        <div className="space-y-2">
          {['research', 'documentation', 'practice', 'mindset', 'logistics'].map(category => {
            const items = negotiation.preparationChecklist?.filter(item => item.category === category) || [];
            if (items.length === 0) return null;
            
            return (
              <div key={category} className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2 capitalize">{category}</h4>
                <div className="space-y-2">
                  {items.map((item, index) => {
                    const globalIndex = negotiation.preparationChecklist.indexOf(item);
                    return (
                      <label
                        key={globalIndex}
                        className="flex items-start gap-3 p-3 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={(e) => onUpdateChecklistItem(globalIndex, e.target.checked)}
                          className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className={`flex-1 text-sm ${item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {item.item}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Confidence Building Exercises */}
      <CollapsibleSection
        title="💪 Confidence Building"
        expanded={expandedSections.confidence}
        onToggle={() => onToggleSection('confidence')}
        badge={`${negotiation.confidenceExercises?.filter(ex => ex.isCompleted).length || 0}/${negotiation.confidenceExercises?.length || 0} done`}
      >
        <div className="space-y-4">
          {negotiation.confidenceExercises?.map((exercise, index) => (
            <ExerciseCard
              key={index}
              exercise={exercise}
              onComplete={(reflection) => onCompleteExercise(index, reflection)}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Timing Strategy */}
      <CollapsibleSection
        title="⏰ Timing Strategy"
        expanded={expandedSections.timing}
        onToggle={() => onToggleSection('timing')}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Recommended Approach:</p>
            <p className="text-sm text-blue-800">{negotiation.timingStrategy?.recommendedApproach}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Follow-up Schedule:</h4>
            <div className="space-y-2">
              {negotiation.timingStrategy?.followUpSchedule?.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) => {
                      const updated = {...negotiation.timingStrategy};
                      updated.followUpSchedule[index].completed = e.target.checked;
                      onUpdate({ timingStrategy: updated });
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-gray-600">{formatDate(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

/**
 * Collapsible Section Component
 */
function CollapsibleSection({ title, expanded, onToggle, badge, children }) {
  return (
    <Card>
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center mb-4"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          {badge && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && <div>{children}</div>}
    </Card>
  );
}

/**
 * Exercise Card Component
 */
function ExerciseCard({ exercise, onComplete }) {
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState(exercise.reflection || '');

  return (
    <div className={`border rounded-lg p-4 ${exercise.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{exercise.exercise}</h4>
        {exercise.isCompleted && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            ✓ Completed
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-3">{exercise.description}</p>
      
      {!exercise.isCompleted && (
        <>
          {!showReflection ? (
            <Button size="sm" onClick={() => setShowReflection(true)}>
              Mark Complete
            </Button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Optional: Add your reflection on this exercise..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows="3"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onComplete(reflection)}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowReflection(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      
      {exercise.isCompleted && exercise.reflection && (
        <div className="mt-3 p-3 bg-white rounded border border-green-200">
          <p className="text-xs font-medium text-gray-700 mb-1">Your Reflection:</p>
          <p className="text-sm text-gray-600">{exercise.reflection}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Analytics View Component
 */
export function AnalyticsView({ analytics, onLoadProgression, progression, formatCurrency }) {
  useState(() => {
    if (!progression) {
      onLoadProgression();
    }
  }, []);

  if (!analytics) {
    return (
      <Card>
        <p className="text-center text-gray-500">No analytics data available yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">{analytics.total}</p>
            <p className="text-sm text-gray-600">Total Negotiations</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{analytics.successRate}%</p>
            <p className="text-sm text-gray-600">Success Rate</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{analytics.averageConfidence}</p>
            <p className="text-sm text-gray-600">Avg Confidence</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{formatCurrency(analytics.totalSalaryGained)}</p>
            <p className="text-sm text-gray-600">Total Gained</p>
          </div>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Negotiation Status</h3>
        <div className="space-y-2">
          {Object.entries(analytics.byStatus).map(([status, count]) => (
            <div key={status} className="flex justify-between items-center">
              <span className="text-gray-700 capitalize">{status.replace('_', ' ')}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Salary Progression */}
      {progression && progression.progression.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Salary Progression</h3>
          <div className="space-y-4">
            {progression.progression.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{item.position}</p>
                  <p className="text-sm text-gray-600">{item.company} • {new Date(item.date).getFullYear()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(item.baseSalary)}</p>
                  {item.improvement && (
                    <p className="text-sm text-green-600">
                      +{item.improvement.salaryIncreasePercent}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {progression.metrics && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary-600">
                    {progression.metrics.averageIncrease.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Avg Increase per Negotiation</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {progression.metrics.totalCompGrowth}%
                  </p>
                  <p className="text-sm text-gray-600">Total Career Growth</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default { NegotiationDetails, AnalyticsView };
