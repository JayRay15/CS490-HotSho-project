import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setAuthToken } from '../../api/axios';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';

export default function ReferenceFeedbackModal({ isOpen, onClose, reference, onSuccess }) {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [outcome, setOutcome] = useState('Positive'); // Positive, Neutral, Negative
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.trim()) {
            setError('Please enter some feedback');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const token = await getToken();
            setAuthToken(token);

            await api.post(`/api/contacts/${reference._id}/interactions`, {
                type: 'Reference Feedback',
                notes: `[${outcome}] ${feedback}`,
                date: new Date()
            });

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error recording feedback:', err);
            setError(err.response?.data?.message || 'Failed to record feedback');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-lg">
                    <h3 className="text-xl font-bold">Record Feedback</h3>
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

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Outcome
                        </label>
                        <select
                            value={outcome}
                            onChange={(e) => setOutcome(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="Positive">Positive (Agreed/Good Review)</option>
                            <option value="Neutral">Neutral (No Response/Average)</option>
                            <option value="Negative">Negative (Declined/Bad Review)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Feedback / Notes
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="e.g., Agreed to be a reference for the Google application..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" onClick={onClose} variant="outline">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-[#777C6D] hover:bg-[#656A5C] text-white"
                        >
                            {loading ? 'Saving...' : 'Save Feedback'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
