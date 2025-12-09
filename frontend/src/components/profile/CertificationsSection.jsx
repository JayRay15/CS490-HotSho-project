import React from 'react';
import Card from '../Card';

export default function CertificationsSection({
    certList,
    onAdd,
    onEdit,
    onDelete,
    successMessage
}) {
    return (
        <Card variant="default" title="Certifications">
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
                    <span>Add Certification</span>
                </button>
            </div>

            {successMessage && (
                <div className="mb-4 p-4 border rounded-lg flex items-center" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', color: '#166534' }}>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {successMessage}
                </div>
            )}

            {/* Compact certifications list */}
            {certList && certList.length > 0 ? (
                <div className="space-y-4">
                    {certList.map((c, index) => {
                        const days = (() => {
                            if (c.doesNotExpire) return null;
                            if (!c.expirationDate) return null;
                            const d = new Date(c.expirationDate);
                            if (isNaN(d.getTime())) return null; // Invalid date
                            const now = new Date();
                            return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
                        })();
                        const expiringSoon = days !== null && days <= (c.reminderDays || 30) && days >= 0;
                        const expired = days !== null && days < 0;

                        // Format dates for display
                        const formatDate = (dateStr) => {
                            if (!dateStr) return '—';
                            const d = new Date(dateStr);
                            if (isNaN(d.getTime())) return '—';
                            return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                        };

                        return (
                            <div key={c._id || c.id || index} className="border rounded-lg p-4 hover:shadow-md transition relative">
                                <div className="flex justify-between">
                                    <div>
                                        <h3 className="text-lg font-heading font-semibold" style={{ color: '#4F5348' }}>{c.name}</h3>
                                        <p className="font-medium" style={{ color: '#656A5C' }}>{c.organization}</p>
                                        <div className="flex items-center text-sm mt-1 space-x-2" style={{ color: '#9CA3AF' }}>
                                            {c.certId && <span>ID: {c.certId}</span>}
                                            <span>•</span>
                                            <span>{c.industry || '—'}</span>
                                        </div>
                                        <div className="text-sm mt-2" style={{ color: '#656A5C' }}>Earned: {formatDate(c.dateEarned)} · {c.doesNotExpire ? 'Does not expire' : formatDate(c.expirationDate)}</div>
                                        <div className="text-sm mt-1" style={{ color: '#656A5C' }}>Verification: <strong className={`ml-2 ${c.verification === 'Verified' ? 'text-green-600' : c.verification === 'Pending' ? 'text-yellow-600' : 'text-gray-600'}`}>{c.verification}</strong></div>
                                        {c.document && <div className="mt-2"><a className="text-sm underline" style={{ color: '#777C6D' }} href={c.document.data} target="_blank" rel="noreferrer">View document ({c.document.name})</a></div>}
                                        <div className="mt-2 text-sm">
                                            {expired && <span className="text-red-600">Expired</span>}
                                            {expiringSoon && <span className="text-yellow-600">Expires in {days} day(s)</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <button
                                            onClick={() => onEdit(c)}
                                            className="p-2 rounded-lg transition"
                                            style={{ color: '#6B7280' }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.color = '#777C6D';
                                                e.currentTarget.style.backgroundColor = '#F5F6F4';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.color = '#6B7280';
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                            title="Edit certification"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onDelete(c)}
                                            className="p-2 rounded-lg transition"
                                            style={{ color: '#6B7280' }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.color = '#EF4444';
                                                e.currentTarget.style.backgroundColor = '#FEF2F2';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.color = '#6B7280';
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                            title="Delete certification"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="italic" style={{ color: '#9CA3AF' }}>No certifications added yet.</p>
            )}
        </Card>
    );
}
