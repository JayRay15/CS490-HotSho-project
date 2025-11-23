import Button from '../Button';

export default function ReferenceHistoryModal({ isOpen, onClose, reference }) {
    if (!isOpen) return null;

    // Filter for reference-related interactions
    const history = reference.interactions
        ?.filter(i => ['Reference Request', 'Reference Feedback'].includes(i.type))
        .sort((a, b) => new Date(b.date) - new Date(a.date)) || [];

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getJobInfo = (interaction) => {
        if (!interaction.jobId) return null;
        // Try to find job details in linkedJobIds if populated
        const job = reference.linkedJobIds?.find(j => j._id === interaction.jobId);
        return job ? `${job.jobTitle} at ${job.company}` : 'Job Application';
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold">Reference History</h3>
                        <p className="text-sm text-gray-600">{reference.firstName} {reference.lastName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Close modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No reference history found.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {history.map((item, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full mt-1.5 ${item.type === 'Reference Request' ? 'bg-blue-500' : 'bg-green-500'
                                            }`} />
                                        {index !== history.length - 1 && (
                                            <div className="w-0.5 h-full bg-gray-200 my-1" />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-medium text-gray-900">{item.type}</h4>
                                            <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                                        </div>

                                        {item.jobId && (
                                            <p className="text-sm text-gray-600 mt-1 font-medium">
                                                For: {getJobInfo(item)}
                                            </p>
                                        )}

                                        {item.notes && (
                                            <div className="mt-2 bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap">
                                                {item.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end">
                    <Button onClick={onClose} variant="outline">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
