import { useState } from 'react';
import { Check, X, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { bulkUpdateStatuses, formatStatus } from '../api/applicationStatus';

const STATUS_OPTIONS = [
  'Interested',
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected'
];

const BulkStatusUpdate = ({ selectedJobs, isOpen, onClose, onUpdate }) => {
  const [bulkStatus, setBulkStatus] = useState('Applied');
  const [bulkNotes, setBulkNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      // Call the parent's update handler with the new status
      await onUpdate(bulkStatus);
      
      // Set success results
      setResults({
        total: selectedJobs.length,
        successful: selectedJobs.length,
        failed: 0,
        results: selectedJobs.map(job => ({
          jobId: job._id,
          success: true
        }))
      });
      
      // Wait a moment to show results, then close
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update statuses');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setBulkStatus('Applied');
    setBulkNotes('');
    setResults(null);
    setError('');
    onClose();
  };

  const statusInfo = formatStatus(bulkStatus);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Bulk Status Update</h3>
                <p className="text-sm text-indigo-100 mt-1">
                  Update {selectedJobs.length} selected application{selectedJobs.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {results ? (
              <div className="space-y-4">
                {/* Success Summary */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="text-green-600" size={32} />
                    <div>
                      <h4 className="text-lg font-semibold text-green-900">Update Complete!</h4>
                      <p className="text-sm text-green-700">
                        Successfully updated {results.successful} of {results.total} applications
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{results.successful}</p>
                      <p className="text-sm text-gray-600">Successful</p>
                    </div>
                    {results.failed > 0 && (
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                        <p className="text-sm text-gray-600">Failed</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Results List */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {results.results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        result.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {result.success ? (
                          <Check className="text-green-600 flex-shrink-0" size={20} />
                        ) : (
                          <X className="text-red-600 flex-shrink-0" size={20} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {selectedJobs.find(j => j._id === result.jobId)?.title || 'Unknown'}
                          </p>
                          {result.error && (
                            <p className="text-xs text-red-600 mt-1">{result.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleBulkUpdate} className="space-y-6">
                {/* Selected Jobs Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Applications ({selectedJobs.length})
                  </label>
                  <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <div className="space-y-2">
                      {selectedJobs.map((job, index) => (
                        <div
                          key={job._id}
                          className="flex items-center gap-3 text-sm"
                        >
                          <span className="text-gray-500">{index + 1}.</span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{job.title}</p>
                            <p className="text-gray-600 text-xs">{job.company}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status *
                  </label>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    {STATUS_OPTIONS.map(status => {
                      const info = formatStatus(status);
                      return (
                        <option key={status} value={status}>
                          {info.icon} {info.label}
                        </option>
                      );
                    })}
                  </select>
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                      statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Add notes that will be applied to all selected applications..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    If left empty, a default message will be added to each application
                  </p>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Bulk Update Warning</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      This will update {selectedJobs.length} application{selectedJobs.length !== 1 ? 's' : ''} to "{statusInfo.label}". 
                      This action cannot be undone, but you can manually change individual statuses later.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        Update {selectedJobs.length} Application{selectedJobs.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkStatusUpdate;
