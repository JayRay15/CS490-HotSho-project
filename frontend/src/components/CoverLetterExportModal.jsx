/**
 * UC-054: Cover Letter Export Modal Component
 * Provides comprehensive export options for cover letters in multiple formats
 */

import React, { useState } from 'react';
import {
    exportCoverLetterAsPdf,
    exportCoverLetterAsDocx,
    exportCoverLetterAsHtml,
    exportCoverLetterAsText,
    generateEmailTemplate
} from '../api/coverLetters';

const CoverLetterExportModal = ({
    coverLetter,
    onClose,
    contactInfo = null,
    linkedJob = null
}) => {
    const [exportFormat, setExportFormat] = useState('pdf');
    const [isExporting, setIsExporting] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        // Letterhead options
        letterhead: {
            enabled: true,
            alignment: 'left', // left, center, right
            name: contactInfo?.name || '',
            address: contactInfo?.address || '',
            phone: contactInfo?.phone || '',
            email: contactInfo?.email || '',
            website: contactInfo?.website || ''
        },
        // Job details
        jobDetails: {
            company: linkedJob?.company || '',
            jobTitle: linkedJob?.jobTitle || '',
            hiringManager: linkedJob?.hiringManager || 'Hiring Manager',
            companyAddress: linkedJob?.companyAddress || ''
        },
        // Format options
        printOptimized: true,
        includeHeader: true
    });
    const [emailTemplate, setEmailTemplate] = useState(null);
    const [showEmailPreview, setShowEmailPreview] = useState(false);

    const formatOptions = [
        {
            value: 'pdf',
            label: 'PDF',
            icon: '📄',
            description: 'Professional format for submissions',
            recommended: true
        },
        {
            value: 'docx',
            label: 'Word Document',
            icon: '📝',
            description: 'Editable Microsoft Word format',
            recommended: false
        },
        {
            value: 'html',
            label: 'HTML',
            icon: '🌐',
            description: 'Web-ready format',
            recommended: false
        },
        {
            value: 'text',
            label: 'Plain Text',
            icon: '📋',
            description: 'For email applications',
            recommended: false
        }
    ];

    const formattingStyles = [
        { value: 'formal', label: 'Formal', description: 'Traditional business letter' },
        { value: 'modern', label: 'Modern', description: 'Contemporary professional' },
        { value: 'creative', label: 'Creative', description: 'Expressive and engaging' },
        { value: 'technical', label: 'Technical', description: 'Technical roles focus' },
        { value: 'executive', label: 'Executive', description: 'Senior leadership style' }
    ];

    const handleExport = async () => {
        setIsExporting(true);
        try {
            let response;
            const payload = {
                letterhead: exportOptions.letterhead,
                jobDetails: exportOptions.jobDetails,
                printOptimized: exportOptions.printOptimized,
                includeHeader: exportOptions.includeHeader
            };

            // Call appropriate export API based on format
            switch (exportFormat) {
                case 'pdf':
                    response = await exportCoverLetterAsPdf(coverLetter._id, payload);
                    break;
                case 'docx':
                    response = await exportCoverLetterAsDocx(coverLetter._id, payload);
                    break;
                case 'html':
                    response = await exportCoverLetterAsHtml(coverLetter._id, payload);
                    break;
                case 'text':
                    response = await exportCoverLetterAsText(coverLetter._id, payload);
                    break;
                default:
                    throw new Error('Invalid export format');
            }

            // Create download link
            const blob = new Blob([response.data], {
                type: response.headers['content-type']
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from Content-Disposition header or generate one
            const contentDisposition = response.headers['content-disposition'];
            let filename = `cover-letter.${exportFormat}`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            // Show success message
            alert(`Cover letter exported successfully as ${exportFormat.toUpperCase()}!`);
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Failed to export cover letter: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleGenerateEmailTemplate = async () => {
        setIsExporting(true);
        try {
            const payload = {
                jobDetails: exportOptions.jobDetails
            };

            const response = await generateEmailTemplate(coverLetter._id, payload);
            setEmailTemplate(response.data.data.emailTemplate);
            setShowEmailPreview(true);
        } catch (error) {
            console.error('Failed to generate email template:', error);
            alert(`Failed to generate email template: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
        });
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Export Cover Letter</h2>
                        <p className="text-sm text-gray-600 mt-1">{coverLetter.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isExporting}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-6">
                    {!showEmailPreview ? (
                        <>
                            {/* Format Selection */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Export Format</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {formatOptions.map((format) => (
                                        <button
                                            key={format.value}
                                            onClick={() => setExportFormat(format.value)}
                                            className={`relative p-4 border-2 rounded-lg text-left transition-all ${exportFormat === format.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-2xl">{format.icon}</span>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{format.label}</div>
                                                        <div className="text-sm text-gray-600">{format.description}</div>
                                                    </div>
                                                </div>
                                                {format.recommended && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                                        Recommended
                                                    </span>
                                                )}
                                            </div>
                                            {exportFormat === format.value && (
                                                <div className="absolute top-2 right-2">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Letterhead Options */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900">Letterhead Options</h3>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={exportOptions.letterhead.enabled}
                                            onChange={(e) => setExportOptions({
                                                ...exportOptions,
                                                letterhead: { ...exportOptions.letterhead, enabled: e.target.checked }
                                            })}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Include Letterhead</span>
                                    </label>
                                </div>

                                {exportOptions.letterhead.enabled && (
                                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                        {/* Alignment */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Alignment
                                            </label>
                                            <div className="flex space-x-2">
                                                {['left', 'center', 'right'].map((align) => (
                                                    <button
                                                        key={align}
                                                        onClick={() => setExportOptions({
                                                            ...exportOptions,
                                                            letterhead: { ...exportOptions.letterhead, alignment: align }
                                                        })}
                                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${exportOptions.letterhead.alignment === align
                                                                ? ''
                                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                        style={exportOptions.letterhead.alignment === align ? { backgroundColor: '#777C6D', color: '#FFFFFF' } : undefined}
                                                        onMouseOver={(e) => {
                                                            if (exportOptions.letterhead.alignment === align) return;
                                                            e.currentTarget.style.backgroundColor = '#F8F9F7';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            if (exportOptions.letterhead.alignment === align) return;
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }}
                                                    >
                                                        {align.charAt(0).toUpperCase() + align.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Contact Fields */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={exportOptions.letterhead.name}
                                                    onChange={(e) => setExportOptions({
                                                        ...exportOptions,
                                                        letterhead: { ...exportOptions.letterhead, name: e.target.value }
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Your Name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={exportOptions.letterhead.email}
                                                    onChange={(e) => setExportOptions({
                                                        ...exportOptions,
                                                        letterhead: { ...exportOptions.letterhead, email: e.target.value }
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="email@example.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Phone
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={exportOptions.letterhead.phone}
                                                    onChange={(e) => setExportOptions({
                                                        ...exportOptions,
                                                        letterhead: { ...exportOptions.letterhead, phone: e.target.value }
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="(123) 456-7890"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Website
                                                </label>
                                                <input
                                                    type="url"
                                                    value={exportOptions.letterhead.website}
                                                    onChange={(e) => setExportOptions({
                                                        ...exportOptions,
                                                        letterhead: { ...exportOptions.letterhead, website: e.target.value }
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="https://yourwebsite.com"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Address
                                                </label>
                                                <input
                                                    type="text"
                                                    value={exportOptions.letterhead.address}
                                                    onChange={(e) => setExportOptions({
                                                        ...exportOptions,
                                                        letterhead: { ...exportOptions.letterhead, address: e.target.value }
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="123 Main St, City, State 12345"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Job Details */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recipient Information</h3>
                                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Company Name
                                            </label>
                                            <input
                                                type="text"
                                                value={exportOptions.jobDetails.company}
                                                onChange={(e) => setExportOptions({
                                                    ...exportOptions,
                                                    jobDetails: { ...exportOptions.jobDetails, company: e.target.value }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Company Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Job Title
                                            </label>
                                            <input
                                                type="text"
                                                value={exportOptions.jobDetails.jobTitle}
                                                onChange={(e) => setExportOptions({
                                                    ...exportOptions,
                                                    jobDetails: { ...exportOptions.jobDetails, jobTitle: e.target.value }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Job Title"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Hiring Manager
                                            </label>
                                            <input
                                                type="text"
                                                value={exportOptions.jobDetails.hiringManager}
                                                onChange={(e) => setExportOptions({
                                                    ...exportOptions,
                                                    jobDetails: { ...exportOptions.jobDetails, hiringManager: e.target.value }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Hiring Manager"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Company Address
                                            </label>
                                            <input
                                                type="text"
                                                value={exportOptions.jobDetails.companyAddress}
                                                onChange={(e) => setExportOptions({
                                                    ...exportOptions,
                                                    jobDetails: { ...exportOptions.jobDetails, companyAddress: e.target.value }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Company Address"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Options */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Options</h3>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={exportOptions.printOptimized}
                                            onChange={(e) => setExportOptions({
                                                ...exportOptions,
                                                printOptimized: e.target.checked
                                            })}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Print-optimized layout</span>
                                    </label>
                                </div>
                            </div>

                            {/* Email Integration */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-blue-900 mb-1">Email Application</h4>
                                        <p className="text-sm text-blue-800 mb-3">
                                            Generate a ready-to-send email template with your cover letter
                                        </p>
                                        <button
                                            onClick={handleGenerateEmailTemplate}
                                            disabled={isExporting}
                                            className="px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 text-sm font-medium"
                                            style={{ backgroundColor: '#777C6D' }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                                        >
                                            Generate Email Template
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Email Preview */
                        <div className="space-y-4">
                            <button
                                onClick={() => setShowEmailPreview(false)}
                                className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to export options
                            </button>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Template</h3>

                                {/* Subject */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject:</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={emailTemplate?.subject || ''}
                                            readOnly
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(emailTemplate?.subject || '')}
                                            className="px-3 py-2 rounded-md transition-colors"
                                            title="Copy subject"
                                            style={{ backgroundColor: '#F3F4F2', color: '#4F5348' }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E8EAE6'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F3F4F2'}
                                        >
                                            📋
                                        </button>
                                    </div>
                                </div>

                                {/* Body */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">Body:</label>
                                        <button
                                            onClick={() => copyToClipboard(emailTemplate?.body || '')}
                                            className="px-3 py-1.5 text-sm rounded-md transition-colors"
                                            style={{ backgroundColor: '#777C6D', color: '#FFFFFF' }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                                        >
                                            Copy Body
                                        </button>
                                    </div>
                                    <textarea
                                        value={emailTemplate?.body || ''}
                                        readOnly
                                        rows={20}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                                    />
                                </div>

                                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-sm text-yellow-800">
                                        💡 <strong>Tip:</strong> Copy the subject and body to your email client. You can also export as plain text for a cleaner format.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {!showEmailPreview && (
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                        <button
                            onClick={onClose}
                            disabled={isExporting}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="px-6 py-2 text-white rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
                            style={{ backgroundColor: '#777C6D' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                        >
                            {isExporting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span>Export as {exportFormat.toUpperCase()}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoverLetterExportModal;
