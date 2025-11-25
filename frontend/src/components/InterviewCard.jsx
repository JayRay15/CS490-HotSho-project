import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import Card from "./Card";
import Button from "./Button";
import { 
  rescheduleInterview, 
  cancelInterview, 
  confirmInterview,
  recordOutcome,
  updatePreparationTask,
  updateInterview,
  downloadInterviewICS,
} from "../api/interviews";

const STATUS_COLORS = {
  Scheduled: "bg-blue-100 text-blue-800",
  Confirmed: "bg-green-100 text-green-800",
  Rescheduled: "bg-yellow-100 text-yellow-800",
  Cancelled: "bg-red-100 text-red-800",
  Completed: "bg-gray-100 text-gray-800",
  "No-Show": "bg-red-100 text-red-800",
};

const TYPE_ICONS = {
  "Phone Screen": "📞",
  "Video Call": "🎥",
  "In-Person": "🏢",
  Technical: "💻",
  "Final Round": "🎯",
  Other: "📋",
  // Legacy support for old interview types
  Phone: "📞",
  Video: "🎥",
  Behavioral: "🗣️",
  Panel: "👥",
  Group: "👨‍👩‍👧‍👦",
  "Case Study": "📊",
};

export default function InterviewCard({ interview, onUpdate, onEdit, onDelete, compact = false }) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [outcomeData, setOutcomeData] = useState({
    result: "Pending",
    notes: "",
    feedback: "",
    rating: 3,
  });

  const interviewDate = new Date(interview.scheduledDate);
  const now = new Date();
  const isPast = interviewDate < now;
  const hoursUntil = Math.floor((interviewDate - now) / (1000 * 60 * 60));
  const daysUntil = Math.floor(hoursUntil / 24);
  
  const timeUntilText = isPast 
    ? "Past" 
    : daysUntil > 0 
    ? `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
    : hoursUntil > 0
    ? `${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`
    : "Soon";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await confirmInterview(interview._id);
      if (response.data?.success) {
        onUpdate(response.data.data.interview);
      }
    } catch (err) {
      console.error("Error confirming interview:", err);
      alert(err.response?.data?.message || "Failed to confirm interview");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    setLoading(true);
    try {
      const response = await cancelInterview(interview._id, cancelReason || "No reason provided");
      if (response.data?.success) {
        setShowCancelModal(false);
        setCancelReason("");
        // Call onDelete to remove from UI since cancelled interviews are filtered out
        if (onDelete) {
          onDelete();
        } else {
          onUpdate(response.data.data.interview);
        }
      }
    } catch (err) {
      console.error("Error cancelling interview:", err);
      alert("Failed to cancel interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordOutcome = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await recordOutcome(interview._id, outcomeData);
      if (response.data?.success) {
        onUpdate(response.data.data.interview);
        setShowOutcomeForm(false);
      }
    } catch (err) {
      console.error("Error recording outcome:", err);
      alert(err.response?.data?.message || "Failed to record outcome");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId, completed) => {
    try {
      const response = await updatePreparationTask(interview._id, taskId, { completed });
      if (response.data?.success) {
        onUpdate(response.data.data.interview);
      }
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const incompleteTasks = interview.preparationTasks?.filter(t => !t.completed).length || 0;
  const totalTasks = interview.preparationTasks?.length || 0;
  const completionPct = totalTasks === 0 ? 0 : Math.round(((totalTasks - incompleteTasks) / totalTasks) * 100);

  const handleDownloadICS = async () => {
    try {
      await downloadInterviewICS(interview._id);
    } catch (err) {
      console.error('ICS download failed', err);
      alert('Failed to download calendar file.');
    }
  };

  if (compact && !showDetails) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">{TYPE_ICONS[interview.interviewType]}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{interview.title}</h3>
                <p className="text-sm text-gray-600">{interview.company}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {interviewDate.toLocaleDateString()} at {interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            {!isPast && (
              <p className="text-xs text-blue-600 mt-1">In {timeUntilText}</p>
            )}
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[interview.status]}`}>
            {interview.status}
          </span>
        </div>
        <button
          onClick={() => setShowDetails(true)}
          className="text-sm text-primary hover:underline mt-2"
        >
          View Details →
        </button>
      </div>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <span className="text-3xl">{TYPE_ICONS[interview.interviewType]}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{interview.title}</h3>
              <p className="text-gray-600">{interview.company}</p>
              <p className="text-sm text-gray-500">{interview.interviewType} Interview</p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[interview.status]}`}>
              {interview.status}
            </span>
            {interview.conflictWarning?.hasConflict && (
              <span className="text-xs text-yellow-600 flex items-center">
                ⚠️ Conflict
              </span>
            )}
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-semibold text-gray-900">
                {interviewDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-gray-700">
                {interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-semibold text-gray-900">{interview.duration} minutes</p>
              {!isPast && (
                <p className="text-sm text-blue-600 font-medium mt-1">
                  {timeUntilText} away
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Location/Link */}
        {(interview.meetingLink || interview.location) && (
          <div>
            <p className="text-sm text-gray-500 mb-1">
              {interview.meetingLink ? "Meeting Link" : "Location"}
            </p>
            {interview.meetingLink ? (
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {interview.meetingLink}
              </a>
            ) : (
              <p className="text-gray-700">{interview.location}</p>
            )}
          </div>
        )}

        {/* Interviewer */}
        {interview.interviewer?.name && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Interviewer</p>
            <p className="font-medium text-gray-900">{interview.interviewer.name}</p>
            {interview.interviewer.title && (
              <p className="text-sm text-gray-600">{interview.interviewer.title}</p>
            )}
            {interview.interviewer.email && (
              <a href={`mailto:${interview.interviewer.email}`} className="text-sm text-primary hover:underline">
                {interview.interviewer.email}
              </a>
            )}
          </div>
        )}

        {/* Preparation Tasks */}
        {totalTasks > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                Preparation Tasks ({totalTasks - incompleteTasks}/{totalTasks} complete)
              </p>
              <span className="text-xs text-gray-500">{completionPct}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-300 ${completionPct === 100 ? 'bg-green-500' : 'bg-primary'}`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <div className="space-y-2">
              {interview.preparationTasks.slice(0, showDetails ? undefined : 3).map((task) => (
                <label key={task._id} className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => handleTaskToggle(task._id, e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                    {task.title}
                  </span>
                </label>
              ))}
              {!showDetails && totalTasks > 3 && (
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Show {totalTasks - 3} more tasks
                </button>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {showDetails && interview.notes && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Notes</p>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{interview.notes}</p>
          </div>
        )}

        {/* Outcome */}
        {interview.outcome?.result && interview.outcome.result !== "Pending" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-1">Outcome</p>
            <p className="font-semibold text-blue-900">{interview.outcome.result}</p>
            {interview.outcome.notes && (
              <p className="text-sm text-blue-800 mt-2">{interview.outcome.notes}</p>
            )}
            {interview.outcome.rating && (
              <p className="text-sm text-blue-800 mt-1">
                Rating: {"⭐".repeat(interview.outcome.rating)}
              </p>
            )}
          </div>
        )}

        {/* Outcome Form */}
        {showOutcomeForm && (
          <form onSubmit={handleRecordOutcome} className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">Record Outcome</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
              <select
                value={outcomeData.result}
                onChange={(e) => setOutcomeData({ ...outcomeData, result: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="Pending">Pending</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="Moved to Next Round">Moved to Next Round</option>
                <option value="Waiting for Feedback">Waiting for Feedback</option>
                <option value="Offer Extended">Offer Extended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <select
                value={outcomeData.rating}
                onChange={(e) => setOutcomeData({ ...outcomeData, rating: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{"⭐".repeat(n)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={outcomeData.notes}
                onChange={(e) => setOutcomeData({ ...outcomeData, notes: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="How did it go?"
              />
            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Outcome"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowOutcomeForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {/* Calendar sync status */}
          {interview.calendarSyncStatus && (
            <span className={`text-xs px-2 py-1 rounded border ${
              interview.calendarSyncStatus === 'synced' ? 'bg-green-50 border-green-300 text-green-700' :
              interview.calendarSyncStatus === 'failed' ? 'bg-red-50 border-red-300 text-red-700' :
              interview.calendarSyncStatus === 'pending' ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-gray-50 border-gray-300 text-gray-600'
            }`}>Cal: {interview.calendarSyncStatus}</span>
          )}
          {(interview.googleCalendarEventId || interview.outlookCalendarEventId) && (
            <Button onClick={handleDownloadICS} variant="secondary" size="sm" title="Download .ics calendar file">
              📥 ICS
            </Button>
          )}
          {/* Interview Prep Button: Only show if interview has a jobId */}
          {interview.jobId && (
            <Button
              onClick={() => {
                const raw = interview.jobId;
                const id = typeof raw === 'object' ? (raw._id || raw.id) : raw;
                if (id) {
                  try {
                    window.localStorage.setItem('activeJobId', id);
                    window.sessionStorage.setItem('activeJobId', id);
                  } catch (e) { /* ignore storage errors */ }
                  navigate(`/jobs/${id}/interview-prep`);
                }
              }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              title="Go to Interview Prep for this job"
            >
              🎤 Interview Prep
            </Button>
          )}
          {/* Company Research Button */}
          <Button
            onClick={() => navigate(`/interviews/${interview._id}/company-research`)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            title="View company research for this interview"
          >
            🔍 Company Research
          </Button>
          {interview.status === "Scheduled" && (
            <Button onClick={handleConfirm} disabled={loading} size="sm">
              Confirm
            </Button>
          )}
          
          {["Scheduled", "Confirmed", "Rescheduled"].includes(interview.status) && (
            <>
              <Button onClick={() => onEdit(interview)} variant="secondary" size="sm">
                Reschedule
              </Button>
              <Button onClick={handleCancelClick} variant="secondary" size="sm" disabled={loading}>
                Cancel
              </Button>
            </>
          )}
          
          {interview.status === "Completed" && !interview.outcome?.result && (
            <Button onClick={() => setShowOutcomeForm(true)} size="sm">
              Record Outcome
            </Button>
          )}

          {interview.status === "Completed" && !interview.thankYouNote?.sent && (
            <Button
              onClick={async () => {
                try {
                  const response = await updateInterview(interview._id, {
                    thankYouNote: { sent: true, sentAt: new Date() }
                  });
                  if (response.data?.success) {
                    onUpdate(response.data.data.interview);
                  }
                } catch (err) {
                  console.error("Error marking thank-you as sent:", err);
                  alert("Failed to update thank-you status");
                }
              }}
              variant="secondary"
              size="sm"
              title="Mark thank-you note as sent"
            >
              ✉️ Sent Thank-You
            </Button>
          )}
          
          {interview.status !== "Completed" && !showOutcomeForm && (
            <Button onClick={() => setShowOutcomeForm(true)} variant="secondary" size="sm">
              Mark Complete
            </Button>
          )}
          
          {!showDetails && (
            <Button onClick={() => setShowDetails(true)} variant="secondary" size="sm">
              Show More
            </Button>
          )}
          
          {showDetails && (
            <Button onClick={() => setShowDetails(false)} variant="secondary" size="sm">
              Show Less
            </Button>
          )}
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Interview</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to cancel this interview? This action cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Accepted another offer, Schedule conflict, etc."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason("");
                  }}
                  variant="secondary"
                  disabled={loading}
                >
                  Keep Interview
                </Button>
                <Button
                  onClick={handleCancelConfirm}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? "Cancelling..." : "Yes, Cancel Interview"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

InterviewCard.propTypes = {
  interview: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  compact: PropTypes.bool,
};
