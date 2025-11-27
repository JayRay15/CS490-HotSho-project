import React, { useState } from 'react';

export default function ImportTemplateModal({ isOpen, onClose, onImport }) {
    const [importMethod, setImportMethod] = useState("file");
    const [importFile, setImportFile] = useState(null);
    const [importJson, setImportJson] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onImport({ method: importMethod, file: importFile, json: importJson });
    };

    const handleClose = () => {
        setImportMethod("file");
        setImportFile(null);
        setImportJson("");
        onClose();
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[60] p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                    <h3 className="text-2xl font-heading font-semibold">Import Template (JSON)</h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Import Method Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Import Method
                            </label>
                            <div className="flex space-x-4">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="importMethod"
                                        value="file"
                                        checked={importMethod === "file"}
                                        onChange={(e) => setImportMethod(e.target.value)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Upload Resume File</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="importMethod"
                                        value="json"
                                        checked={importMethod === "json"}
                                        onChange={(e) => setImportMethod(e.target.value)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Paste JSON</span>
                                </label>
                            </div>
                        </div>

                        {/* File Upload Section */}
                        {importMethod === "file" && (
                            <div>
                                <label htmlFor="importFile" className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Resume File <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="file"
                                        id="importFile"
                                        accept=".pdf,.doc,.docx,.txt"
                                        onChange={(e) => setImportFile(e.target.files[0])}
                                        className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-gray-100 file:text-gray-700
                      hover:file:bg-gray-200 file:cursor-pointer
                      cursor-pointer"
                                        required
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
                                    </p>
                                    {importFile && (
                                        <p className="mt-2 text-sm text-green-600">
                                            Selected: {importFile.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* JSON Input Section */}
                        {importMethod === "json" && (
                            <div>
                                <label htmlFor="importJson" className="block text-sm font-medium text-gray-700 mb-2">
                                    Paste Template JSON <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="importJson"
                                    className="w-full border border-gray-300 rounded-lg p-4 h-64 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder='{"name":"My Template","type":"hybrid","layout":{"sectionsOrder":["summary","skills","experience"]},"theme":{"colors":{"primary":"#2a7"}}}'
                                    value={importJson}
                                    onChange={(e) => setImportJson(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 -mx-6 -mb-6 border-t">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-white rounded-lg transition"
                                style={{ backgroundColor: '#777C6D' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                            >
                                Import Template
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
