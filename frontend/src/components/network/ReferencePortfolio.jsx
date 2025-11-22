import { useRef } from 'react';
import Button from '../Button';

export default function ReferencePortfolio({ references, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
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
          <div ref={printRef} className="print:p-8 px-6">
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .printable-content, .printable-content * {
                  visibility: visible;
                }
                .printable-content {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
                .print-hide {
                  display: none !important;
                }
              }
            `}</style>

            <div className="printable-content px-6">
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

      {/* Print-specific styles */}
      <style>{`
        @page {
          size: letter;
          margin: 0.5in;
        }
        
        @media print {
          .print-hide {
            display: none !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
}
