import React from 'react';
import Card from '../Card';

export default function EmploymentHistory({
    employmentList,
    onAdd,
    onEdit,
    onDelete,
    successMessage
}) {
    return (
        <Card variant="default" title="Employment History">
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={onAdd}
                    className="px-4 py-2 text-white rounded-lg transition flex items-center space-x-2 ml-auto focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: '#777C6D' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Employment</span>
                </button>
            </div>

            {/* Employment Success Message */}
            {successMessage && (
                <div className="mb-4 p-4 border rounded-lg" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                    <p className="font-medium" style={{ color: '#166534' }}>{successMessage}</p>
                </div>
            )}

            {employmentList && employmentList.length > 0 ? (
                <div className="space-y-4">
                    {employmentList
                        .sort((a, b) => {
                            // Current positions first
                            if (a.isCurrentPosition && !b.isCurrentPosition) return -1;
                            if (!a.isCurrentPosition && b.isCurrentPosition) return 1;

                            // For current positions, sort by start date (most recent first)
                            if (a.isCurrentPosition && b.isCurrentPosition) {
                                return new Date(b.startDate) - new Date(a.startDate);
                            }

                            // For past positions, sort by end date (most recent first)
                            return new Date(b.endDate) - new Date(a.endDate);
                        })
                        .map((job, index) => (
                            <Card key={job._id || index} variant="outlined" interactive className="relative">
                                {/* Current Position Badge - Top Right */}
                                {job.isCurrentPosition && (
                                    <div className="absolute top-4 right-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#DCFCE7', color: '#166534', borderColor: '#BBF7D0' }}>
                                            Current Position
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-col">
                                    {/* Job Details */}
                                    <div className="flex-1 pr-32">
                                        <h3 className="text-lg font-heading font-semibold text-text-primary">{job.jobTitle}</h3>
                                        <p className="text-text-primary font-medium">{job.company}</p>
                                        <div className="flex items-center text-sm text-text-secondary mt-1 space-x-2">
                                            {job.location && (
                                                <>
                                                    <span>{job.location}</span>
                                                    <span>•</span>
                                                </>
                                            )}
                                            <span>
                                                {(() => {
                                                    const startDate = new Date(job.startDate);
                                                    const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
                                                    const startYear = startDate.getFullYear();
                                                    return `${startMonth}/${startYear}`;
                                                })()}
                                                {' - '}
                                                {job.isCurrentPosition
                                                    ? 'Present'
                                                    : (() => {
                                                        const endDate = new Date(job.endDate);
                                                        const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
                                                        const endYear = endDate.getFullYear();
                                                        return `${endMonth}/${endYear}`;
                                                    })()
                                                }
                                            </span>
                                        </div>
                                        {job.description && (
                                            <p className="mt-2 whitespace-pre-wrap" style={{ color: '#4F5348' }}>{job.description}</p>
                                        )}
                                    </div>

                                    {/* Action Buttons - Bottom Right */}
                                    <div className="flex justify-end mt-3 space-x-2">
                                        <button
                                            onClick={() => onEdit(job)}
                                            className="p-2 rounded-lg transition focus:outline-none focus:ring-2"
                                            style={{ color: '#6B7280' }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.color = '#777C6D';
                                                e.currentTarget.style.backgroundColor = '#F5F6F4';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.color = '#6B7280';
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                            title="Edit employment"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>

                                        {/* Hide delete button if only 1 entry */}
                                        {employmentList.length > 1 && (
                                            <button
                                                onClick={() => onDelete(job)}
                                                className="p-2 rounded-lg transition focus:outline-none focus:ring-2"
                                                style={{ color: '#6B7280' }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.color = '#EF4444';
                                                    e.currentTarget.style.backgroundColor = '#FEF2F2';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.color = '#6B7280';
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                                title="Delete employment"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}

                </div>
            ) : (
                <p className="italic" style={{ color: '#9CA3AF' }}>No employment history added yet.</p>
            )}
        </Card>
    );
}
