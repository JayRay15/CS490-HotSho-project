import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

// Stage color mapping for visual clarity
const STAGE_COLORS = {
  "Interested": "bg-gray-100 border-gray-300",
  "Applied": "bg-blue-50 border-blue-300",
  "Phone Screen": "bg-yellow-50 border-yellow-300",
  "Interview": "bg-purple-50 border-purple-300",
  "Offer": "bg-green-50 border-green-300",
  "Rejected": "bg-red-50 border-red-300",
};

const PRIORITY_COLORS = {
  "Low": "text-gray-500",
  "Medium": "text-yellow-600",
  "High": "text-red-600",
};

export default function JobCard({ job, onEdit, onDelete, onView, onStatusChange, isDragging, highlightTerms, isSelected, onToggleSelect, onArchive, onRestore, onScheduleInterview, onViewMatchScore, onOpenStatusModal, onOpenTimeline, onOpenEmailDetector, applicationStatus, onGenerateCoverLetter, onOpenInterviewChecklist }) {
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const formatSalary = (salary) => {
    if (!salary || (!salary.min && !salary.max)) return null;

    const format = (num) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: salary.currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    };

    if (salary.min && salary.max) {
      return `${format(salary.min)} - ${format(salary.max)}`;
    } else if (salary.min) {
      return `${format(salary.min)}+`;
    } else if (salary.max) {
      return `Up to ${format(salary.max)}`;
    }
  };

  const daysUntil = (date) => {
    if (!date) return null;
    const end = new Date(date);
    // zero out times for accurate day diff
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffMs = end - start;
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  const deadlineDays = daysUntil(job.deadline);
  const deadlineColor = (() => {
    if (deadlineDays == null) return null;
    if (deadlineDays <= 0) return "text-red-700 bg-red-100";
    if (deadlineDays <= 7) return "text-yellow-700 bg-yellow-100";
    return "text-green-700 bg-green-100";
  })();

  const highlightText = (text, highlights) => {
    if (!text) return text;
    const list = Array.isArray(highlights) ? highlights : [highlights];
    const terms = Array.from(
      new Set(
        list
          .filter(Boolean)
          .map((t) => `${t}`.trim())
          .filter((t) => t.length > 0)
      )
    );
    if (terms.length === 0) return text;

    // Escape regex special chars and sort by length desc to prefer longer matches first
    const escaped = terms
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .sort((a, b) => b.length - a.length);
    const re = new RegExp(`(${escaped.join("|")})`, "gi");
    const lowerSet = new Set(terms.map((t) => t.toLowerCase()));

    const parts = `${text}`.split(re);
    return (
      <>
        {parts.map((part, index) =>
          lowerSet.has(part.toLowerCase()) ? (
            <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  const cardColorClass = STAGE_COLORS[job.status] || "bg-white border-gray-200";

  return (
    <div
      className={`rounded-lg border-2 p-4 mb-3 transition-all ${cardColorClass} ${isDragging ? "opacity-50 rotate-2 shadow-lg" : "hover:shadow-md"
        } ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={!!isSelected}
              onChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="mt-1"
              title="Select for bulk actions"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {highlightText(job.title, highlightTerms)}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {highlightText(job.company, highlightTerms)}
            </p>
          </div>
        </div>
        {deadlineDays != null && (
          <span className={`ml-2 text-xs font-medium px-2 py-1 rounded ${deadlineColor}`} title={new Date(job.deadline).toLocaleDateString()}>
            {deadlineDays < 0 ? `Overdue ${Math.abs(deadlineDays)}d` : deadlineDays === 0 ? "Due today" : `${deadlineDays}d left`}
          </span>
        )}
        {job.priority && (
          <span className={`text-xs font-medium ml-2 ${PRIORITY_COLORS[job.priority]}`}>
            {job.priority === "High" && "🔴"}
            {job.priority === "Medium" && "🟡"}
            {job.priority === "Low" && "⚪"}
          </span>
        )}
      </div>

      {/* Application Status Badge */}
      {applicationStatus && (
        <div className="mb-2">
          {(() => {
            const getStatusBadge = (status) => {
              const statusMap = {
                'Not Applied': { label: '⭕ Not Applied', color: 'bg-gray-100 text-gray-700' },
                'Applied': { label: '📤 Applied', color: 'bg-blue-100 text-blue-700' },
                'Under Review': { label: '👀 Under Review', color: 'bg-indigo-100 text-indigo-700' },
                'Phone Screen': { label: '📞 Phone Screen', color: 'bg-yellow-100 text-yellow-700' },
                'Technical Interview': { label: '💻 Technical', color: 'bg-purple-100 text-purple-700' },
                'Onsite Interview': { label: '🏢 Onsite', color: 'bg-orange-100 text-orange-700' },
                'Final Interview': { label: '🎯 Final Round', color: 'bg-pink-100 text-pink-700' },
                'Offer Extended': { label: '🎉 Offer', color: 'bg-green-100 text-green-700' },
                'Offer Accepted': { label: '✅ Accepted', color: 'bg-green-200 text-green-800' },
                'Offer Declined': { label: '❌ Declined', color: 'bg-gray-200 text-gray-700' },
                'Rejected': { label: '⛔ Rejected', color: 'bg-red-100 text-red-700' },
                'Withdrawn': { label: '↩️ Withdrawn', color: 'bg-gray-200 text-gray-700' },
                'Ghosted': { label: '👻 Ghosted', color: 'bg-gray-300 text-gray-800' }
              };
              return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
            };
            
            const badge = getStatusBadge(applicationStatus.currentStatus);
            const daysSinceUpdate = Math.floor((new Date() - new Date(applicationStatus.lastStatusChange)) / (1000 * 60 * 60 * 24));
            
            return (
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded-full font-medium ${badge.color}`}>
                  {badge.label}
                </span>
                <span className="text-gray-500">
                  {daysSinceUpdate === 0 ? 'Updated today' : `${daysSinceUpdate}d ago`}
                </span>
                {applicationStatus.nextAction && (
                  <span className="text-indigo-600 truncate max-w-[150px]" title={applicationStatus.nextAction}>
                    → {applicationStatus.nextAction}
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Key Info */}
      <div className="space-y-1 text-sm text-gray-700 mb-3">
        {job.location && (
          <p className="flex items-center gap-1">
            <span className="text-gray-500">📍</span>
            <span className="truncate">{highlightText(job.location, highlightTerms)}</span>
          </p>
        )}
        {job.industry && (
          <p className="flex items-center gap-1">
            <span className="text-gray-500">🏢</span>
            <span>{job.industry}</span>
          </p>
        )}
        {formatSalary(job.salary) && (
          <p className="flex items-center gap-1">
            <span className="text-gray-500">💰</span>
            <span>{formatSalary(job.salary)}</span>
          </p>
        )}
        {job.workMode && (
          <p className="flex items-center gap-1">
            <span className="text-gray-500">💼</span>
            <span>{job.workMode}</span>
          </p>
        )}
      </div>

      {/* Days in Stage */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>{job.daysInStage || 0} days in stage</span>
        {job.applicationDate && <span>Applied: {formatDate(job.applicationDate)}</span>}
      </div>

      {/* Tags */}
      {job.tags && job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {job.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700"
            >
              {highlightText(tag, highlightTerms)}
            </span>
          ))}
          {job.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{job.tags.length - 3} more</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showDetails ? "Hide" : "Quick View"}
          </button>
          {onView && (
            <button
              onClick={() => onView(job)}
              className="text-xs text-green-600 hover:text-green-800 font-medium"
            >
              Full Details
            </button>
          )}
          {job.deadline && job._id && typeof window !== 'undefined' && (
            <button
              onClick={() => onStatusChange && onStatusChange(job._id, undefined, { extendDeadlineDays: 7 })}
              className="text-xs text-purple-700 hover:text-purple-900"
              title="Extend deadline by 7 days"
            >
              +7d
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(job)}
              className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              Edit
            </button>
          )}
          {onScheduleInterview && !job.archived && (job.status === "Interview" || job.status === "Phone Screen") && (
            <button
              onClick={() => onScheduleInterview(job)}
              className="text-xs px-2 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium"
            >
              📅 Schedule Interview
            </button>
          )}
          {/* Interview Checklist - Only for Interview stage */}
          {onOpenInterviewChecklist && !job.archived && job.status === "Interview" && (
            <button
              onClick={() => onOpenInterviewChecklist(job)}
              className="text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700 font-medium"
              title="Open interview preparation checklist"
            >
              ✅ Interview Checklist
            </button>
          )}
          {/* Generate Cover Letter */}
          {onGenerateCoverLetter && !job.archived && (
            <button
              onClick={() => onGenerateCoverLetter(job)}
              className="text-xs px-2 py-1 rounded bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 text-blue-700 font-medium"
              title="Generate AI-powered cover letter with experience highlighting"
            >
              ✨ Generate Cover Letter
            </button>
          )}
          {/* Status Tracking Actions */}
          {onOpenStatusModal && !job.archived && (
            <button
              onClick={() => onOpenStatusModal(job)}
              className="text-xs px-2 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium"
              title="Update application status"
            >
              📝 Update Status
            </button>
          )}
          {onOpenTimeline && !job.archived && applicationStatus && (
            <button
              onClick={() => onOpenTimeline(job)}
              className="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium"
              title="View status timeline"
            >
              📊 Timeline
            </button>
          )}
          {onOpenEmailDetector && !job.archived && (
            <button
              onClick={() => onOpenEmailDetector(job)}
              className="text-xs px-2 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium"
              title="Detect status from email"
            >
              ✨ Detect from Email
            </button>
          )}
          {/* UC-067: Salary Research button */}
          {!job.archived && (
            <button
              onClick={() => navigate(`/salary-research/${job._id}`)}
              className="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium"
              title="View salary research and benchmarks"
            >
              💰 Salary Research
            </button>
          )}
          {/* Skill Gap Analysis button */}
          {!job.archived && (
            <button
              onClick={() => navigate(`/skill-gap-analysis/${job._id}`)}
              className="text-xs px-2 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium"
              title="Analyze skill gaps for this job"
            >
              🎯 Skill Gaps
            </button>
          )}
          {/* UC-063: Job Match Score button */}
          {!job.archived && onViewMatchScore && (
            <button
              onClick={() => onViewMatchScore(job)}
              className="text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700 font-medium"
              title="View match score and analysis"
            >
              ✨ Match Score
            </button>
          )}
          {job.archived ? (
            onRestore && (
              <button
                onClick={() => onRestore(job._id)}
                className="text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700 font-medium"
              >
                ↩️ Restore
              </button>
            )
          ) : (
            onArchive && (
              <button
                onClick={() => onArchive(job)}
                className="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium"
              >
                📦 Archive
              </button>
            )
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm(`Delete "${job.title}" at ${job.company}?`)) {
                  onDelete(job._id);
                }
              }}
              className="text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm">
          {job.description && (
            <div>
              <p className="font-medium text-gray-700">Description:</p>
              <p className="text-gray-600 text-xs whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {job.requirements && job.requirements.length > 0 && (
            <div>
              <p className="font-medium text-gray-700">Requirements:</p>
              <ul className="list-disc list-inside text-xs text-gray-600">
                {job.requirements.slice(0, 5).map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {job.notes && (
            <div>
              <p className="font-medium text-gray-700">Notes:</p>
              <p className="text-gray-600 text-xs whitespace-pre-wrap">{job.notes}</p>
            </div>
          )}

          {job.url && (
            <div>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs"
              >
                View Job Posting →
              </a>
            </div>
          )}

          {job.contacts && job.contacts.length > 0 && (
            <div>
              <p className="font-medium text-gray-700">Contacts:</p>
              {job.contacts.map((contact, idx) => (
                <div key={idx} className="text-xs text-gray-600 ml-2">
                  <span className="font-medium">{contact.name}</span>
                  {contact.role && ` - ${contact.role}`}
                  {contact.email && ` (${contact.email})`}
                </div>
              ))}
            </div>
          )}

          {job.deadline && (
            <div className="text-xs">
              <span className="font-medium text-gray-700">Deadline: </span>
              <span className={`${new Date(job.deadline) < new Date() ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                {formatDate(job.deadline)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

JobCard.propTypes = {
  job: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    location: PropTypes.string,
    salary: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number,
      currency: PropTypes.string,
    }),
    workMode: PropTypes.string,
    jobType: PropTypes.string,
    industry: PropTypes.string,
    description: PropTypes.string,
    requirements: PropTypes.arrayOf(PropTypes.string),
    applicationDate: PropTypes.string,
    deadline: PropTypes.string,
    url: PropTypes.string,
    notes: PropTypes.string,
    contacts: PropTypes.arrayOf(PropTypes.object),
    tags: PropTypes.arrayOf(PropTypes.string),
    priority: PropTypes.string,
    daysInStage: PropTypes.number,
    archived: PropTypes.bool,
    archiveReason: PropTypes.string,
    archivedAt: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onStatusChange: PropTypes.func,
  isDragging: PropTypes.bool,
  highlightTerms: PropTypes.arrayOf(PropTypes.string),
  isSelected: PropTypes.bool,
  onToggleSelect: PropTypes.func,
  onArchive: PropTypes.func,
  onRestore: PropTypes.func,
  onScheduleInterview: PropTypes.func,
  onViewMatchScore: PropTypes.func,
  onOpenStatusModal: PropTypes.func,
  onOpenTimeline: PropTypes.func,
  onOpenEmailDetector: PropTypes.func,
  applicationStatus: PropTypes.object,
  onGenerateCoverLetter: PropTypes.func,
  onOpenInterviewChecklist: PropTypes.func,
};
