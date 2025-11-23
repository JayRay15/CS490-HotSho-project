import React from 'react';
import Button from '../Button';

/**
 * Cover Letter Share Modal Component
 * Allows users to make templates public or private
 */
export default function CoverLetterShareModal({
    showCoverLetterShare,
    setShowCoverLetterShare,
    shareTemplateId,
    authWrap,
    shareCoverLetterTemplate,
    loadCoverLetterTemplates
}) {
    if (!showCoverLetterShare) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
            onClick={() => setShowCoverLetterShare(false)}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                            Share Template
                        </h2>
                        <button
                            onClick={() => setShowCoverLetterShare(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-4">
                            Choose how you want to share this template:
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={async () => {
                                    try {
                                        await authWrap();
                                        await shareCoverLetterTemplate(shareTemplateId, { isShared: true });
                                        setShowCoverLetterShare(false);
                                        loadCoverLetterTemplates();
                                        alert("Template is now publicly shared!");
                                    } catch (err) {
                                        console.error("Share failed:", err);
                                        alert("Failed to share template");
                                    }
                                }}
                                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-[#777C6D] transition text-left"
                            >
                                <div className="font-semibold mb-1">Make Public</div>
                                <div className="text-sm text-gray-600">Anyone can view and use this template</div>
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await authWrap();
                                        await shareCoverLetterTemplate(shareTemplateId, { isShared: false });
                                        setShowCoverLetterShare(false);
                                        loadCoverLetterTemplates();
                                        alert("Template is now private");
                                    } catch (err) {
                                        console.error("Unshare failed:", err);
                                        alert("Failed to update sharing settings");
                                    }
                                }}
                                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-[#777C6D] transition text-left"
                            >
                                <div className="font-semibold mb-1">Make Private</div>
                                <div className="text-sm text-gray-600">Only you can see this template</div>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => setShowCoverLetterShare(false)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
