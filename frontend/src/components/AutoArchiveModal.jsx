import { useState } from "react";
import Button from "./Button";

const PIPELINE_STAGES = ["Interested", "Applied", "Phone Screen", "Interview", "Offer", "Rejected"];

export default function AutoArchiveModal({ isOpen, onClose, onAutoArchive }) {
  const [daysInactive, setDaysInactive] = useState(90);
  const [selectedStatuses, setSelectedStatuses] = useState(["Rejected", "Offer"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleStatus = (status) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedStatuses.length === 0) {
      alert("Please select at least one status");
      return;
    }

    if (daysInactive < 1) {
      alert("Days must be at least 1");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAutoArchive(daysInactive, selectedStatuses);
      onClose();
    } catch (error) {
      console.error("Auto-archive error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Auto-Archive Jobs</h2>
            <p className="text-sm text-gray-600 mt-1">
              Archive jobs that haven&apos;t been updated in a while
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days Inactive
            </label>
            <input
              type="number"
              min="1"
              value={daysInactive}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setDaysInactive("");
                } else {
                  const num = parseInt(val, 10);
                  setDaysInactive(Number.isNaN(num) ? "" : Math.max(1, num));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Archive jobs that haven&apos;t been updated for this many days
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Statuses to Archive
            </label>
            <div className="space-y-2">
              {PIPELINE_STAGES.map((status) => (
                <label key={status} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="ml-2 text-sm text-gray-700">{status}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Only jobs with these statuses will be auto-archived
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  This will archive jobs with selected statuses that haven&apos;t been updated in {daysInactive} days. You can restore them later.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Run Auto-Archive'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
