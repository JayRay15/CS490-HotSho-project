import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import api, { setAuthToken } from "../api/axios";
import Card from "./Card";

export default function MaterialsHistory({ jobId, onClose }) {
  const { getToken } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [jobId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.get(`/api/materials/history/${jobId}`);
      setHistory(response.data.data.history || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch materials history:", err);
      setError(err.response?.data?.message || "Failed to load materials history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Loading history...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Materials History</h2>
              <p className="text-sm text-gray-600 mt-1">
                Track changes to resumes and cover letters for this application
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!error && history.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No materials history</h3>
              <p className="mt-1 text-sm text-gray-500">
                No resume or cover letter changes have been recorded for this job yet.
              </p>
            </div>
          )}

          {/* Timeline */}
          {!error && history.length > 0 && (
            <div className="space-y-6">
              <Card variant="elevated">
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  {/* Timeline items */}
                  <div className="space-y-6">
                    {history.map((item, index) => {
                      const isFirst = index === 0;
                      const resumeName = typeof item.resume === 'object' ? item.resume?.name : item.resume;
                      const coverLetterName = typeof item.coverLetter === 'object' ? item.coverLetter?.name : item.coverLetter;
                      
                      return (
                        <div key={item._id || index} className="relative pl-10 pb-6 last:pb-0">
                          {/* Timeline dot */}
                          <div className={`absolute left-2.5 w-3 h-3 rounded-full ${
                            isFirst ? 'bg-green-500 ring-4 ring-green-100' : 'bg-blue-500 ring-4 ring-blue-100'
                          }`}></div>
                          
                          {/* Content */}
                          <div className={`p-4 rounded-lg ${
                            isFirst ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {isFirst && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                                      Current
                                    </span>
                                  )}
                                  Materials Updated
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(item.changedAt).toLocaleDateString()} at{" "}
                                  {new Date(item.changedAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-2 mt-3">
                              {resumeName && (
                                <div className="flex items-center text-sm">
                                  <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-gray-600">Resume:</span>
                                  <span className="ml-2 font-medium text-gray-900">{resumeName}</span>
                                </div>
                              )}
                              
                              {coverLetterName && (
                                <div className="flex items-center text-sm">
                                  <svg className="w-4 h-4 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-gray-600">Cover Letter:</span>
                                  <span className="ml-2 font-medium text-gray-900">{coverLetterName}</span>
                                </div>
                              )}
                              
                              {!resumeName && !coverLetterName && (
                                <p className="text-sm text-gray-500 italic">No materials linked</p>
                              )}
                            </div>
                            
                            {item.reason && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-500 mb-1">Reason:</p>
                                <p className="text-sm text-gray-700">{item.reason}</p>
                              </div>
                            )}
                            
                            {item.changedBy && (
                              <p className="text-xs text-gray-400 mt-2">
                                Changed by: {item.changedBy}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
              
              {/* Summary */}
              <Card variant="info" title="Summary">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Changes</p>
                    <p className="text-2xl font-bold text-gray-900">{history.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">First Update</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(history[history.length - 1]?.changedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
