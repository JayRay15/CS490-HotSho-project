import { useState } from "react";
import PropTypes from "prop-types";
import JobCard from "./JobCard";

const PIPELINE_STAGES = [
  { id: "Interested", label: "Interested", color: "bg-gray-100 border-gray-300" },
  { id: "Applied", label: "Applied", color: "bg-blue-100 border-blue-300" },
  { id: "Phone Screen", label: "Phone Screen", color: "bg-yellow-100 border-yellow-300" },
  { id: "Interview", label: "Interview", color: "bg-purple-100 border-purple-300" },
  { id: "Offer", label: "Offer", color: "bg-green-100 border-green-300" },
  { id: "Rejected", label: "Rejected", color: "bg-red-100 border-red-300" },
];

export default function JobPipeline({ jobs, onJobStatusChange, onJobEdit, onJobDelete, onJobView, highlightTerms, selectedJobs = [], onToggleSelect, onJobArchive, onJobRestore, onScheduleInterview, onViewMatchScore }) {
  const [draggedJob, setDraggedJob] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // Group jobs by status
  const jobsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = jobs.filter((job) => job.status === stage.id);
    return acc;
  }, {});

  const handleDragStart = (e, job) => {
    setDraggedJob(job);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedJob || draggedJob.status === newStatus) {
      setDraggedJob(null);
      return;
    }

    // Call the status change handler
    await onJobStatusChange(draggedJob._id, newStatus);
    setDraggedJob(null);
  };

  const handleDragEnd = () => {
    setDraggedJob(null);
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stageJobs = jobsByStage[stage.id] || [];
        const isDropTarget = dragOverStage === stage.id;

        return (
          <div
            key={stage.id}
            className={`shrink-0 w-80 rounded-lg border-2 ${stage.color} ${isDropTarget ? "ring-4 ring-blue-400 ring-opacity-50" : ""
              }`}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Stage Header */}
            <div className="p-4 border-b-2 border-gray-300">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-gray-800">{stage.label}</h3>
                <div className="flex items-center gap-2">
                  {Array.isArray(selectedJobs) && typeof onToggleSelect === 'function' && (
                    (() => {
                      const allSelected = stageJobs.length > 0 && stageJobs.every(j => selectedJobs.includes(j._id));
                      const handleStageSelect = (e) => {
                        e.stopPropagation();
                        if (!stageJobs.length) return;
                        if (allSelected) {
                          // Clear all in stage
                          stageJobs.forEach(j => {
                            if (selectedJobs.includes(j._id)) onToggleSelect(j._id);
                          });
                        } else {
                          // Select all in stage
                          stageJobs.forEach(j => {
                            if (!selectedJobs.includes(j._id)) onToggleSelect(j._id);
                          });
                        }
                      };
                      return (
                        <button
                          type="button"
                          onClick={handleStageSelect}
                          className="text-xs px-2 py-1 rounded bg-white hover:bg-gray-100 border border-gray-300 text-gray-700"
                          title={allSelected ? 'Clear selection for this stage' : 'Select all in this stage'}
                        >
                          {allSelected ? 'Clear' : 'Select all'}
                        </button>
                      );
                    })()
                  )}
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-white text-gray-700">
                    {stageJobs.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Jobs in Stage */}
            <div
              className="p-4 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              {stageJobs.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                  No jobs in this stage
                </div>
              ) : (
                stageJobs.map((job) => (
                  <div
                    key={job._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, job)}
                    onDragEnd={handleDragEnd}
                    className="cursor-move"
                  >
                    <JobCard
                      job={job}
                      onEdit={onJobEdit}
                      onDelete={onJobDelete}
                      onView={onJobView}
                      onStatusChange={onJobStatusChange}
                      isSelected={Array.isArray(selectedJobs) && selectedJobs.includes(job._id)}
                      onToggleSelect={onToggleSelect ? () => onToggleSelect(job._id) : undefined}
                      isDragging={draggedJob?._id === job._id}
                      highlightTerms={highlightTerms}
                      onArchive={onJobArchive}
                      onRestore={onJobRestore}
                      onScheduleInterview={onScheduleInterview}
                      onViewMatchScore={onViewMatchScore}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

JobPipeline.propTypes = {
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      company: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  onJobStatusChange: PropTypes.func.isRequired,
  onJobEdit: PropTypes.func,
  onJobDelete: PropTypes.func,
  onJobView: PropTypes.func,
  highlightTerms: PropTypes.arrayOf(PropTypes.string),
  selectedJobs: PropTypes.arrayOf(PropTypes.string),
  onToggleSelect: PropTypes.func,
  onJobArchive: PropTypes.func,
  onJobRestore: PropTypes.func,
  onScheduleInterview: PropTypes.func,
  onViewMatchScore: PropTypes.func,
};
