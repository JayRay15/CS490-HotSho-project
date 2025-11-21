import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Check, X, Loader } from 'lucide-react';
import Papa from 'papaparse';
import Button from '../Button';
import { batchCreateContacts } from '../../api/contactApi';
import { toast } from 'react-hot-toast';

export default function ContactImportModal({ onClose, onSuccess }) {
    const [step, setStep] = useState('upload'); // upload, preview, importing, success
    const [file, setFile] = useState(null);
    const [parsedContacts, setParsedContacts] = useState([]);
    const [importStats, setImportStats] = useState({ total: 0, success: 0, failed: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                setError('Please upload a valid CSV file.');
                return;
            }
            setFile(selectedFile);
            setError(null);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file) => {
        setLoading(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setLoading(false);
                if (results.errors.length > 0) {
                    console.warn('CSV parsing errors:', results.errors);
                }

                // Map CSV fields to our schema
                // We'll try to be smart about common header names
                const mappedContacts = results.data.map(row => mapRowToContact(row)).filter(c => c.firstName || c.lastName || c.email);

                if (mappedContacts.length === 0) {
                    setError('No valid contacts found in the CSV file. Please check the format.');
                    setFile(null);
                    return;
                }

                setParsedContacts(mappedContacts);
                setStep('preview');
            },
            error: (err) => {
                setLoading(false);
                setError('Failed to parse CSV file: ' + err.message);
                setFile(null);
            }
        });
    };

    const mapRowToContact = (row) => {
        // Helper to find value case-insensitively
        const findVal = (keys) => {
            const key = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
            return key ? row[key]?.trim() : '';
        };

        return {
            firstName: findVal(['first name', 'firstname', 'given name', 'first']),
            middleName: findVal(['middle name', 'middlename', 'additional name']),
            lastName: findVal(['last name', 'lastname', 'family name', 'last']),
            phoneticFirstName: findVal(['phonetic first name', 'phonetic given name']),
            phoneticMiddleName: findVal(['phonetic middle name', 'phonetic additional name']),
            phoneticLastName: findVal(['phonetic last name', 'phonetic family name']),
            prefix: findVal(['name prefix', 'prefix']),
            suffix: findVal(['name suffix', 'suffix']),
            nickname: findVal(['nickname']),
            fileAs: findVal(['file as']),
            email: findVal(['e-mail 1 - value', 'email', 'e-mail', 'email address']),
            emailLabel: findVal(['e-mail 1 - label', 'email label', 'label']),
            phone: findVal(['phone', 'mobile', 'cell', 'phone number']),
            company: findVal(['organization name', 'company', 'organization', 'business']),
            department: findVal(['organization department', 'department']),
            jobTitle: findVal(['organization title', 'job title', 'title', 'position', 'role']),
            industry: findVal(['industry', 'sector']),
            location: findVal(['location', 'city', 'address']),
            birthday: findVal(['birthday']),
            photo: findVal(['photo']),
            linkedInUrl: findVal(['linkedin', 'linkedin url', 'linkedin profile']),
            notes: findVal(['notes', 'description', 'comments']),
            tags: findVal(['labels', 'tags']) ? findVal(['labels', 'tags']).split(' ::: ').join(', ') : '', // Handle Google Labels format if possible, or just comma
            relationshipType: 'Other', // Default
            relationshipStrength: 'New' // Default
        };
    };

    const handleImport = async () => {
        setLoading(true);
        try {
            const response = await batchCreateContacts(parsedContacts);
            setImportStats({
                total: parsedContacts.length,
                success: response.data?.data?.length || parsedContacts.length, // Assuming all success if no error thrown for now
                failed: 0
            });
            setStep('success');
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Import error:', err);
            setError(err.response?.data?.message || 'Failed to import contacts');
        } finally {
            setLoading(false);
        }
    };

    const renderUploadStep = () => (
        <div className="text-center py-8">
            <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 hover:border-primary-500 hover:bg-gray-50 transition cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upload CSV File
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                    Drag and drop or click to select a file from Google Contacts, Outlook, etc.
                </p>
                <Button type="button" variant="secondary">
                    Select File
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                />
            </div>

            <div className="mt-6 text-left bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Supported Columns
                </h4>
                <p className="text-xs text-blue-700">
                    First Name, Middle Name, Last Name, Email, Phone, Company, Job Title, Department, Industry, Location, Birthday, Notes, Labels
                </p>
            </div>
        </div>
    );

    const renderPreviewStep = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                    Preview Contacts ({parsedContacts.length})
                </h3>
                <Button
                    variant="secondary"
                    size="small"
                    onClick={() => {
                        setFile(null);
                        setParsedContacts([]);
                        setStep('upload');
                    }}
                >
                    Change File
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {parsedContacts.map((contact, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                    {contact.firstName} {contact.lastName}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">{contact.email}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{contact.company}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{contact.jobTitle}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Import Successful!</h3>
            <p className="text-gray-600 mb-6">
                Successfully imported {importStats.success} contacts.
            </p>
            <Button onClick={onClose} className="bg-[#777C6D] hover:bg-[#656A5C] text-white">
                Done
            </Button>
        </div>
    );

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Import Contacts</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {step === 'upload' && renderUploadStep()}
                    {step === 'preview' && renderPreviewStep()}
                    {step === 'success' && renderSuccessStep()}
                </div>

                {step === 'preview' && (
                    <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3">
                        <Button variant="secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={loading}
                            isLoading={loading}
                            className="bg-[#777C6D] hover:bg-[#656A5C] text-white"
                        >
                            Import {parsedContacts.length} Contacts
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
