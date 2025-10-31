import { useState } from "react";
import PropTypes from "prop-types";

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

export default function JobCard({ job, onEdit, onDelete, onView, onStatusChange, isDragging, searchTerm }) {
  const [showDetails, setShowDetails] = useState(false);

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

  const highlightText = (text, highlight) => {
    if (!highlight || !text) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const cardColorClass = STAGE_COLORS[job.status] || "bg-white border-gray-200";
  
  return (
    <div
      className={`rounded-lg border-2 p-4 mb-3 transition-all ${cardColorClass} ${
        isDragging ? "opacity-50 rotate-2 shadow-lg" : "hover:shadow-md"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 truncate">
            {highlightText(job.title, searchTerm)}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {highlightText(job.company, searchTerm)}
          </p>
        </div>
        {job.priority && (
          <span className={`text-xs font-medium ml-2 ${PRIORITY_COLORS[job.priority]}`}>
            {job.priority === "High" && "🔴"}
            {job.priority === "Medium" && "🟡"}
            {job.priority === "Low" && "⚪"}
          </span>
        )}
      </div>

      {/* Key Info */}
      <div className="space-y-1 text-sm text-gray-700 mb-3">
        {job.location && (
          <p className="flex items-center gap-1">
            <span className="text-gray-500">📍</span>
            <span className="truncate">{highlightText(job.location, searchTerm)}</span>
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
              {tag}
            </span>
          ))}
          {job.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{job.tags.length - 3} more</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200">
        <div className="flex gap-2">
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
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(job)}
              className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              Edit
            </button>
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
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onStatusChange: PropTypes.func,
  isDragging: PropTypes.bool,
  searchTerm: PropTypes.string,
};
