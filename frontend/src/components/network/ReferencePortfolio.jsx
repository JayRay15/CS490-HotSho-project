import { useRef } from 'react';
import Button from '../Button';

export default function ReferencePortfolio({ references, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print this document');
      return;
    }

    // Build the HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Professional References</title>
          <style>
            @page {
              size: letter;
              margin: 0.4in;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              color: #1f2937;
              line-height: 1.4;
              margin: 0;
              padding: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 16px;
              padding-bottom: 8px;
              border-bottom: 2px solid #d1d5db;
            }
            .header h1 {
              font-size: 24px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 4px;
            }
            .header p {
              color: #4b5563;
              margin: 2px 0;
              font-size: 13px;
            }
            .reference-item {
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 12px;
              margin-bottom: 12px;
              page-break-inside: avoid;
            }
            .reference-item:last-child {
              border-bottom: none;
            }
            .reference-name {
              font-size: 16px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 4px;
            }
            .reference-title {
              font-size: 14px;
              color: #374151;
              margin-bottom: 2px;
            }
            .reference-company {
              color: #4b5563;
              font-size: 13px;
              margin-bottom: 8px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-top: 8px;
            }
            .info-section h3 {
              font-size: 12px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 4px;
            }
            .info-row {
              display: flex;
              margin-bottom: 2px;
              font-size: 12px;
            }
            .info-label {
              font-weight: 500;
              color: #4b5563;
              min-width: 70px;
            }
            .info-value {
              color: #111827;
            }
            .notes {
              margin-top: 8px;
            }
            .notes h3 {
              font-size: 12px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 2px;
            }
            .notes p {
              font-size: 12px;
              color: #4b5563;
              font-style: italic;
            }
            .footer {
              margin-top: 16px;
              padding-top: 8px;
              border-top: 1px solid #d1d5db;
              text-align: center;
            }
            .footer p {
              font-size: 11px;
              color: #6b7280;
              margin: 2px 0;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Professional References</h1>
            <p>List of Professional References</p>
            <p style="font-size: 11px; color: #6b7280; margin-top: 4px;">
              Generated on ${new Date().toLocaleDateString()}
            </p>
          </div>

          <div class="references-list">
            ${references.map((ref, index) => `
              <div class="reference-item">
                <div class="reference-name">
                  ${index + 1}. ${ref.firstName || ''} ${ref.lastName || ''}
                </div>
                ${ref.jobTitle ? `<div class="reference-title">${ref.jobTitle}</div>` : ''}
                ${ref.company ? `<div class="reference-company">${ref.company}</div>` : ''}
                
                <div class="info-grid">
                  <div class="info-section">
                    <h3>Contact Information</h3>
                    ${ref.email ? `
                      <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${ref.email}</span>
                      </div>
                    ` : ''}
                    ${ref.phone ? `
                      <div class="info-row">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">${ref.phone}</span>
                      </div>
                    ` : ''}
                    ${ref.location ? `
                      <div class="info-row">
                        <span class="info-label">Location:</span>
                        <span class="info-value">${ref.location}</span>
                      </div>
                    ` : ''}
                    ${ref.linkedInUrl ? `
                      <div class="info-row">
                        <span class="info-label">LinkedIn:</span>
                        <span class="info-value" style="word-break: break-all; font-size: 12px;">${ref.linkedInUrl}</span>
                      </div>
                    ` : ''}
                  </div>
                  
                  <div class="info-section">
                    <h3>Relationship</h3>
                    <div class="info-row">
                      <span class="info-label">Type:</span>
                      <span class="info-value">${ref.relationshipType || 'Professional Contact'}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Strength:</span>
                      <span class="info-value">${ref.relationshipStrength || 'Medium'}</span>
                    </div>
                    ${ref.industry ? `
                      <div class="info-row">
                        <span class="info-label">Industry:</span>
                        <span class="info-value">${ref.industry}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>
                
                ${ref.notes ? `
                  <div class="notes">
                    <h3>Notes</h3>
                    <p>${ref.notes}</p>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>
              This document contains ${references.length} professional reference${references.length !== 1 ? 's' : ''}
            </p>
            <p>
              Please contact references directly using the information provided above
            </p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.afterprint = () => printWindow.close();
      }, 250);
    };
  };

  const handleCopyText = () => {
    const text = references.map(ref => {
      return `${ref.firstName} ${ref.lastName}
${ref.jobTitle || 'Professional Contact'}${ref.company ? ` at ${ref.company}` : ''}
Email: ${ref.email || 'Not provided'}
Phone: ${ref.phone || 'Not provided'}
Relationship: ${ref.relationshipType || 'Professional Contact'}

`;
    }).join('\n---\n\n');

    navigator.clipboard.writeText(text);
    alert('Reference list copied to clipboard!');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 flex items-center justify-center z-50 p-4 print:hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto print:hidden" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center print:hidden">
            <h3 className="text-xl font-bold">Reference Portfolio</h3>
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

          <div className="flex gap-3 mb-6 print:hidden px-6 pt-4">
            <Button onClick={handlePrint} className="bg-[#777C6D] hover:bg-[#656A5C] text-white">
              Print / Save as PDF
            </Button>
            <Button onClick={handleCopyText} variant="outline">
              Copy as Text
            </Button>
          </div>

          {/* Printable Content */}
          <div ref={printRef} className="px-6">
            <div className="px-6">
              {/* Header */}
              <div className="text-center mb-8 pb-4 border-b-2 border-gray-300">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional References</h1>
                <p className="text-gray-600">List of Professional References</p>
                <p className="text-sm text-gray-500 mt-2">Generated on {new Date().toLocaleDateString()}</p>
              </div>

              {/* References List */}
              <div className="space-y-6">
                {references.map((ref, index) => (
                  <div key={ref._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {index + 1}. {ref.firstName} {ref.lastName}
                        </h2>
                        {ref.jobTitle && (
                          <p className="text-lg text-gray-700 mt-1">
                            {ref.jobTitle}
                          </p>
                        )}
                        {ref.company && (
                          <p className="text-gray-600 mt-1">
                            {ref.company}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Contact Information */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Contact Information</h3>
                        <div className="space-y-1 text-sm">
                          {ref.email && (
                            <p className="flex items-center">
                              <span className="font-medium text-gray-600 w-16">Email:</span>
                              <span className="text-gray-900">{ref.email}</span>
                            </p>
                          )}
                          {ref.phone && (
                            <p className="flex items-center">
                              <span className="font-medium text-gray-600 w-16">Phone:</span>
                              <span className="text-gray-900">{ref.phone}</span>
                            </p>
                          )}
                          {ref.location && (
                            <p className="flex items-center">
                              <span className="font-medium text-gray-600 w-16">Location:</span>
                              <span className="text-gray-900">{ref.location}</span>
                            </p>
                          )}
                          {ref.linkedInUrl && (
                            <p className="flex items-center">
                              <span className="font-medium text-gray-600 w-16">LinkedIn:</span>
                              <span className="text-gray-900 text-xs break-all">{ref.linkedInUrl}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Relationship Details */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Relationship</h3>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center">
                            <span className="font-medium text-gray-600 w-20">Type:</span>
                            <span className="text-gray-900">{ref.relationshipType || 'Professional Contact'}</span>
                          </p>
                          <p className="flex items-center">
                            <span className="font-medium text-gray-600 w-20">Strength:</span>
                            <span className="text-gray-900">{ref.relationshipStrength || 'Medium'}</span>
                          </p>
                          {ref.industry && (
                            <p className="flex items-center">
                              <span className="font-medium text-gray-600 w-20">Industry:</span>
                              <span className="text-gray-900">{ref.industry}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {ref.notes && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">Notes</h3>
                        <p className="text-sm text-gray-600 italic">{ref.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-300 text-center">
                <p className="text-xs text-gray-500">
                  This document contains {references.length} professional reference{references.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Please contact references directly using the information provided above
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
