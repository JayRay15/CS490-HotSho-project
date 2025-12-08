import React, { useState, useEffect } from 'react';
import { getJobs, linkResumeToJob, linkCoverLetterToJob } from '../../api/jobs';
import LoadingSpinner from '../LoadingSpinner';

export default function LinkedJobsModal({ isOpen, onClose, documentId, documentType, documentName }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unlinkingId, setUnlinkingId] = useState(null);

    useEffect(() => {
        if (isOpen && documentId) {
            fetchLinkedJobs();
        }
    }, [isOpen, documentId]);

    const fetchLinkedJobs = async () => {
        try {
            setLoading(true);
            const params = {};
            if (documentType === 'resume') {
                params.resumeId = documentId;
            } else {
                params.coverLetterId = documentId;
            }

            console.log("Fetching linked jobs with params:", params);
            const response = await getJobs(params);
            setJobs(response.data?.data?.jobs || response.data?.jobs || []);
        } catch (error) {
            console.error("Error fetching linked jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlink = async (jobId) => {
        try {
            setUnlinkingId(jobId);
            if (documentType === 'resume') {
                await linkResumeToJob(jobId, null);
            } else {
                await linkCoverLetterToJob(jobId, null);
            }
            // Remove job from list
            setJobs(prev => prev.filter(job => job._id !== jobId));
        } catch (error) {
            console.error("Error unlinking job:", error);
            alert("Failed to unlink job. Please try again.");
        } finally {
            setUnlinkingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[60] p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Jobs Linked to "{documentName}"
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner size="md" />
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No jobs are currently linked to this {documentType === 'resume' ? 'resume' : 'cover letter'}.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {jobs.map(job => (
                                <div key={job._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div>
                                        <div className="font-medium text-gray-900">{job.title}</div>
                                        <div className="text-sm text-gray-600">{job.company}</div>
                                    </div>
                                    <button
                                        onClick={() => handleUnlink(job._id)}
                                        disabled={unlinkingId === job._id}
                                        className="text-sm px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition disabled:opacity-50"
                                    >
                                        {unlinkingId === job._id ? 'Unlinking...' : 'Unlink'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
