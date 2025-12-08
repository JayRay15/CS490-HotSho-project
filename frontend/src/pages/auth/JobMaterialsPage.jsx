import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import Container from "../../components/Container";
import Card from "../../components/Card";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import ResumeSectionsDisplay from "../../components/resume/ResumeSectionsDisplay";
import { setAuthToken } from "../../api/axios";
import { getJob, linkResumeToJob, linkCoverLetterToJob, addAdditionalDocument, removeAdditionalDocument } from "../../api/jobs";
import { fetchResumes } from "../../api/resumes";
import { fetchCoverLetters } from "../../api/coverLetters";
import { fetchTemplates } from "../../api/resumeTemplates";

// Utility function to format plain text into HTML paragraphs (same as ResumeTemplates.jsx)
const formatCoverLetterContent = (content) => {
    if (!content) return '';
    if (content.includes('<p>') || content.includes('<div>') || content.includes('<br')) {
        return content;
    }
    const lines = content.split('\n');
    const result = [];
    let currentParagraph = [];
    let inBody = false;

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) {
            if (currentParagraph.length > 0) {
                result.push(`<p>${currentParagraph.join(' ')}</p>`);
                currentParagraph = [];
            }
            return;
        }
        const isHeaderLine = !inBody && (
            trimmedLine.length < 80 && (
                trimmedLine.includes('@') ||
                trimmedLine.match(/^\d{10}/) ||
                trimmedLine.match(/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) ||
                trimmedLine.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) ||
                trimmedLine.match(/^[A-Z][a-z]+ \d{1,2}, \d{4}/) ||
                trimmedLine.match(/^[A-Z][a-z]+(?: [A-Z][a-z]+)*,? [A-Z]{2}$/) ||
                trimmedLine.match(/^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/) ||
                trimmedLine.toLowerCase().trim() === 'hiring manager' ||
                trimmedLine.toLowerCase().startsWith('dear ') ||
                trimmedLine.endsWith(':') ||
                trimmedLine.endsWith(',') ||
                index < 15
            )
        );
        const startsBody = trimmedLine.length > 80 || trimmedLine.split(/[.!?]/).length > 2;
        if (isHeaderLine && !startsBody) {
            if (currentParagraph.length > 0) {
                result.push(`<p>${currentParagraph.join(' ')}</p>`);
                currentParagraph = [];
            }
            result.push(`<p>${trimmedLine}</p>`);
        } else {
            inBody = true;
            currentParagraph.push(trimmedLine);
            const combinedText = currentParagraph.join(' ');
            const sentenceCount = combinedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
            if (sentenceCount >= 3) {
                result.push(`<p>${combinedText}</p>`);
                currentParagraph = [];
            }
        }
    });
    if (currentParagraph.length > 0) {
        result.push(`<p>${currentParagraph.join(' ')}</p>`);
    }
    return result.join('');
};

/**
 * Job Materials Page
 * Displays and manages resumes and cover letters linked to a specific job application
 * UC-042: Job Application Materials Tracking
 */
export default function JobMaterialsPage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { getToken } = useAuth();

    // Check if user came from documents page
    const fromDocuments = new URLSearchParams(location.search).get('from') === 'documents';

    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [coverLetters, setCoverLetters] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [linkedResume, setLinkedResume] = useState(null);
    const [linkedCoverLetter, setLinkedCoverLetter] = useState(null);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [showResumeSelector, setShowResumeSelector] = useState(false);
    const [showCoverLetterSelector, setShowCoverLetterSelector] = useState(false);
    const [showResumePreview, setShowResumePreview] = useState(false);
    const [showCoverLetterPreview, setShowCoverLetterPreview] = useState(false);

    // Additional documents state
    const [showAddDocModal, setShowAddDocModal] = useState(false);
    const [newDocForm, setNewDocForm] = useState({ name: '', documentType: 'other', notes: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [addingDoc, setAddingDoc] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, docIndex: null, docName: '' });

    useEffect(() => {
        loadData();
    }, [jobId]);

    const authWrap = async () => {
        const token = await getToken();
        setAuthToken(token);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            await authWrap();

            // Fetch job details
            const jobRes = await getJob(jobId);
            const jobData = jobRes.data?.data?.job || jobRes.data?.job;
            setJob(jobData);

            // Fetch resumes
            const resumeRes = await fetchResumes();
            const resumeList = resumeRes.data?.data?.resumes || resumeRes.data?.resumes || [];
            setResumes(resumeList);

            // Fetch templates for resume display
            const templatesRes = await fetchTemplates();
            const templatesList = templatesRes.data?.data?.templates || templatesRes.data?.templates || [];
            setTemplates(templatesList);

            // Find linked resume
            if (jobData?.linkedResumeId) {
                const linked = resumeList.find(r => r._id === jobData.linkedResumeId);
                setLinkedResume(linked || null);
            }

            // Fetch cover letters
            const clRes = await fetchCoverLetters();
            const clList = clRes.data?.data?.coverLetters || clRes.data?.coverLetters || [];
            setCoverLetters(clList);

            // Find linked cover letter
            if (jobData?.linkedCoverLetterId) {
                const linkedCL = clList.find(cl => cl._id === jobData.linkedCoverLetterId);
                setLinkedCoverLetter(linkedCL || null);
            }
        } catch (error) {
            console.error("Error loading job materials:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLinkResume = async (resumeId) => {
        try {
            setSaving(true);
            await authWrap();
            await linkResumeToJob(jobId, resumeId);
            const linked = resumes.find(r => r._id === resumeId);
            setLinkedResume(linked || null);
            setShowResumeSelector(false);
            setSuccessMessage("Resume linked successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error("Error linking resume:", error);
            alert("Failed to link resume. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleUnlinkResume = async () => {
        try {
            setSaving(true);
            await authWrap();
            await linkResumeToJob(jobId, null);
            setLinkedResume(null);
            setSuccessMessage("Resume unlinked successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error("Error unlinking resume:", error);
            alert("Failed to unlink resume. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleLinkCoverLetter = async (coverLetterId) => {
        try {
            setSaving(true);
            await authWrap();
            await linkCoverLetterToJob(jobId, coverLetterId);
            const linked = coverLetters.find(cl => cl._id === coverLetterId);
            setLinkedCoverLetter(linked || null);
            setShowCoverLetterSelector(false);
            setSuccessMessage("Cover letter linked successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error("Error linking cover letter:", error);
            alert("Failed to link cover letter. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleUnlinkCoverLetter = async () => {
        try {
            setSaving(true);
            await authWrap();
            await linkCoverLetterToJob(jobId, null);
            setLinkedCoverLetter(null);
            setSuccessMessage("Cover letter unlinked successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error("Error unlinking cover letter:", error);
            alert("Failed to unlink cover letter. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // Get resume template for styling
    const getResumeTemplate = () => {
        if (!linkedResume) return {};
        return templates.find(t => t._id === linkedResume.templateId) || {};
    };

    // Handle adding additional document
    const handleAddDocument = async () => {
        if (!newDocForm.name.trim()) return;
        try {
            setAddingDoc(true);
            await authWrap();

            const payload = {
                ...newDocForm,
                fileName: selectedFile ? selectedFile.name : null,
                fileData: null
            };

            if (selectedFile) {
                // Convert file to Base64
                const reader = new FileReader();
                reader.readAsDataURL(selectedFile);
                reader.onload = async () => {
                    payload.fileData = reader.result;
                    await submitDocument(payload);
                };
                reader.onerror = (error) => {
                    console.error("Error reading file:", error);
                    alert("Failed to read file. Please try again.");
                    setAddingDoc(false);
                };
            } else {
                await submitDocument(payload);
            }
        } catch (error) {
            console.error("Error adding document:", error);
            alert("Failed to add document. Please try again.");
            setAddingDoc(false);
        }
    };

    const submitDocument = async (payload) => {
        try {
            await addAdditionalDocument(jobId, payload);
            setShowAddDocModal(false);
            setNewDocForm({ name: '', documentType: 'other', notes: '' });
            setSelectedFile(null);
            setSuccessMessage("Document added successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
            // Reload job data
            await loadData();
        } catch (error) {
            console.error("Error submitting document:", error);
            alert("Failed to add document. Please try again.");
        } finally {
            setAddingDoc(false);
        }
    };
    const handleRemoveDocument = async (docIndex) => {
        try {
            await authWrap();
            await removeAdditionalDocument(jobId, docIndex);
            setSuccessMessage("Document removed successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
            // Reload job data
            await loadData();
        } catch (error) {
            console.error("Error removing document:", error);
            alert("Failed to remove document. Please try again.");
        }
    };

    if (loading) {
        return (
            <Container>
                <div className="flex items-center justify-center min-h-[400px]">
                    <LoadingSpinner size="lg" />
                </div>
            </Container>
        );
    }

    if (!job) {
        return (
            <Container>
                <div className="py-8">
                    <p className="text-gray-500">Job not found.</p>
                    <Button variant="outline" onClick={() => navigate("/jobs")} className="mt-4">
                        ← Back to Jobs
                    </Button>
                </div>
            </Container>
        );
    }

    const resumeTemplate = getResumeTemplate();
    const theme = resumeTemplate.theme || {
        colors: { primary: "#4F5348", text: "#222", muted: "#666" },
        fonts: {
            body: "Inter, sans-serif",
            heading: "Inter, sans-serif",
            sizes: {
                name: "36px",
                sectionHeader: "18px",
                jobTitle: "16px",
                body: "14px",
                small: "12px"
            }
        }
    };

    return (
        <Container>
            <div className="py-8">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => fromDocuments ? navigate("/documents?tab=packages") : navigate("/jobs")}
                    className="mb-6 text-gray-600 hover:text-gray-800"
                >
                    ← {fromDocuments ? "Back to Documents" : "Back to Jobs"}
                </Button>

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        📁 Job Materials for {job.title}
                    </h1>
                    <p className="text-gray-600">
                        at <span className="font-medium">{job.company}</span>
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg">
                        ✅ {successMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Linked Resume Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">📄 Linked Resume</h2>
                            <Button
                                variant="outline"
                                size="small"
                                onClick={() => setShowResumeSelector(!showResumeSelector)}
                            >
                                {linkedResume ? "Change" : "Link Resume"}
                            </Button>
                        </div>

                        {linkedResume ? (
                            <Card variant="outlined" interactive className="overflow-hidden !p-0">
                                {/* Resume Tile Preview */}
                                <div
                                    className="h-64 p-4 flex flex-col justify-start border-b cursor-pointer"
                                    style={{ backgroundColor: "#F9F9F9" }}
                                    onClick={() => setShowResumePreview(true)}
                                >
                                    <div className="text-xs font-bold mb-2" style={{ color: '#4F5348' }}>
                                        {linkedResume.name || "Untitled Resume"}
                                    </div>
                                    <div className="flex-1 space-y-2 overflow-hidden">
                                        {linkedResume.sections?.contactInfo && (
                                            <div className="text-[8px] text-gray-700 font-semibold">
                                                {linkedResume.sections.contactInfo.name || "Name"}
                                            </div>
                                        )}
                                        {linkedResume.sections?.summary && (
                                            <div className="text-[7px] text-gray-600 leading-tight line-clamp-2">
                                                {linkedResume.sections.summary.substring(0, 100)}...
                                            </div>
                                        )}
                                        {linkedResume.sections?.experience && linkedResume.sections.experience.length > 0 && (
                                            <div className="mt-2">
                                                <div className="text-[7px] text-gray-700 font-semibold">
                                                    {linkedResume.sections.experience[0].company}
                                                </div>
                                                <div className="text-[6px] text-gray-500 italic">
                                                    {linkedResume.sections.experience[0].title}
                                                </div>
                                            </div>
                                        )}
                                        {linkedResume.sections?.skills && linkedResume.sections.skills.length > 0 && (
                                            <div className="mt-2 text-[6px] text-gray-600">
                                                {linkedResume.sections.skills.slice(0, 3).join(' • ')}
                                                {linkedResume.sections.skills.length > 3 && ' ...'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Info & Actions */}
                                <div className="px-2 pt-2 pb-2">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 min-w-0">
                                            {linkedResume.name}
                                        </p>
                                        {linkedResume.isArchived && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded">
                                                ARCHIVED
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500">
                                            Modified {new Date(linkedResume.updatedAt).toLocaleDateString()}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {/* View Button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowResumePreview(true); }}
                                                className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                                title="View Resume"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            {/* Unlink Button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleUnlinkResume(); }}
                                                className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 text-gray-600 font-medium"
                                                title="Unlink Resume"
                                            >
                                                Unlink
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <Card className="text-center py-12">
                                <div className="text-4xl mb-3">📄</div>
                                <p className="text-gray-500 mb-4">No resume linked yet</p>
                                <Button variant="primary" onClick={() => setShowResumeSelector(true)}>
                                    Link a Resume
                                </Button>
                            </Card>
                        )}

                        {/* Resume Selector */}
                        {showResumeSelector && (
                            <Card className="mt-4" title="Select a Resume">
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {resumes.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">No resumes available</p>
                                    ) : (
                                        resumes.map((resume) => (
                                            <div
                                                key={resume._id}
                                                onClick={() => handleLinkResume(resume._id)}
                                                className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50 ${linkedResume?._id === resume._id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                                                    }`}
                                            >
                                                <p className="font-medium text-gray-900">{resume.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    Updated: {new Date(resume.updatedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Linked Cover Letter Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">✉️ Linked Cover Letter</h2>
                            <Button
                                variant="outline"
                                size="small"
                                onClick={() => setShowCoverLetterSelector(!showCoverLetterSelector)}
                            >
                                {linkedCoverLetter ? "Change" : "Link Cover Letter"}
                            </Button>
                        </div>

                        {linkedCoverLetter ? (
                            <Card variant="outlined" interactive className="overflow-hidden !p-0">
                                {/* Cover Letter Tile */}
                                <div
                                    className="h-64 p-4 flex flex-col justify-start border-b cursor-pointer"
                                    style={{ backgroundColor: "#F5FFF5" }}
                                    onClick={() => setShowCoverLetterPreview(true)}
                                >
                                    <div className="text-xs font-bold mb-2 text-green-700">
                                        {linkedCoverLetter.name || "Untitled Cover Letter"}
                                    </div>
                                    <div className="flex-1 space-y-2 overflow-hidden">
                                        {linkedCoverLetter.jobTitle && (
                                            <div className="text-[8px] text-gray-700 font-semibold">
                                                For: {linkedCoverLetter.jobTitle}
                                            </div>
                                        )}
                                        {linkedCoverLetter.company && (
                                            <div className="text-[7px] text-gray-600">
                                                Company: {linkedCoverLetter.company}
                                            </div>
                                        )}
                                        {linkedCoverLetter.content && (
                                            <div className="text-[7px] text-gray-600 leading-tight line-clamp-6">
                                                {linkedCoverLetter.content.substring(0, 300)}...
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="px-2 pt-2 pb-2">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 min-w-0">
                                            {linkedCoverLetter.name || "Untitled Cover Letter"}
                                        </p>
                                        {linkedCoverLetter.isArchived && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded">
                                                ARCHIVED
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500">
                                            Modified {new Date(linkedCoverLetter.updatedAt || linkedCoverLetter.createdAt).toLocaleDateString()}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {/* View Button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowCoverLetterPreview(true); }}
                                                className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50"
                                                title="View Cover Letter"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            {/* Unlink Button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleUnlinkCoverLetter(); }}
                                                className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 text-gray-600 font-medium"
                                                title="Unlink Cover Letter"
                                            >
                                                Unlink
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <Card className="text-center py-12">
                                <div className="text-4xl mb-3">✉️</div>
                                <p className="text-gray-500 mb-4">No cover letter linked yet</p>
                                <Button variant="primary" onClick={() => setShowCoverLetterSelector(true)}>
                                    Link a Cover Letter
                                </Button>
                            </Card>
                        )}

                        {/* Cover Letter Selector */}
                        {showCoverLetterSelector && (
                            <Card className="mt-4" title="Select a Cover Letter">
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {coverLetters.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">No cover letters available</p>
                                    ) : (
                                        coverLetters.map((cl) => (
                                            <div
                                                key={cl._id}
                                                onClick={() => handleLinkCoverLetter(cl._id)}
                                                className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-green-400 hover:bg-green-50 ${linkedCoverLetter?._id === cl._id ? "border-green-500 bg-green-50" : "border-gray-200"
                                                    }`}
                                            >
                                                <p className="font-medium text-gray-900">{cl.name || "Untitled Cover Letter"}</p>
                                                {cl.jobTitle && (
                                                    <p className="text-xs text-gray-600">For: {cl.jobTitle}</p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    Updated: {new Date(cl.updatedAt || cl.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Additional Documents Section */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">📎 Additional Documents</h2>
                        <Button
                            variant="outline"
                            size="small"
                            onClick={() => setShowAddDocModal(true)}
                        >
                            + Add Document
                        </Button>
                    </div>

                    <Card>
                        {job.linkedAdditionalDocuments && job.linkedAdditionalDocuments.length > 0 ? (
                            <div className="space-y-2">
                                {job.linkedAdditionalDocuments.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span>📎</span>
                                            <div>
                                                <p className="font-medium text-orange-800">{doc.name}</p>
                                                <p className="text-xs text-orange-600">{doc.documentType}</p>
                                                {doc.notes && <p className="text-xs text-gray-500 mt-1">{doc.notes}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {doc.fileData && (
                                                <a
                                                    href={doc.fileData}
                                                    download={doc.fileName || doc.name}
                                                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                >
                                                    Download
                                                </a>
                                            )}
                                            <button
                                                onClick={() => setDeleteConfirm({ show: true, docIndex: idx, docName: doc.name })}
                                                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-3">📎</div>
                                <p className="text-gray-500 mb-4">No additional documents yet</p>
                                <Button variant="primary" onClick={() => setShowAddDocModal(true)}>
                                    Add Your First Document
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Add Document Modal */}
            {showAddDocModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={() => setShowAddDocModal(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold">Add Document to Package</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                                <input
                                    type="text"
                                    value={newDocForm.name}
                                    onChange={e => setNewDocForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    placeholder="e.g., AWS Certification"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                                <select
                                    value={newDocForm.documentType}
                                    onChange={e => setNewDocForm(prev => ({ ...prev, documentType: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="certificate">Certificate</option>
                                    <option value="portfolio">Portfolio</option>
                                    <option value="reference">Reference</option>
                                    <option value="transcript">Transcript</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                                <textarea
                                    value={newDocForm.notes}
                                    onChange={e => setNewDocForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    rows={2}
                                    placeholder="Any additional notes..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload File (optional)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={e => setSelectedFile(e.target.files[0] || null)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                />
                                {selectedFile && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ Selected: {selectedFile.name}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Accepted: PDF, DOC, DOCX, JPG, PNG (max 10MB)
                                </p>
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <button
                                onClick={() => setShowAddDocModal(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddDocument}
                                disabled={addingDoc || !newDocForm.name.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {addingDoc ? 'Adding...' : 'Add Document'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resume Preview Modal - Matches ResumeTemplates.jsx View Resume Modal */}
            {showResumePreview && linkedResume && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 print:hidden"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={() => setShowResumePreview(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl w-full mx-4 border border-gray-200 overflow-hidden flex flex-col"
                        style={{ maxWidth: '960px', height: '95vh' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header - Same as ResumeTemplates.jsx */}
                        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <svg className="w-6 h-6 text-[#777C6D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="text-lg font-heading font-semibold text-gray-900">{linkedResume.name}</h3>
                            </div>
                            <button
                                onClick={() => setShowResumePreview(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content - Same layout as ResumeTemplates.jsx */}
                        <div className="flex-1 overflow-y-auto py-4 px-4" style={{ backgroundColor: '#525252' }}>
                            {/* Resume Paper */}
                            <div
                                className="mx-auto bg-white shadow-lg"
                                style={{
                                    width: '8.5in',
                                    minHeight: '11in',
                                    padding: '0.75in',
                                    fontFamily: theme.fonts?.body || 'Inter, sans-serif'
                                }}
                            >
                                {/* Contact Info / Header */}
                                {linkedResume.sections?.contactInfo && (
                                    <div className="text-center mb-6">
                                        <h1
                                            className="font-bold"
                                            style={{
                                                fontSize: theme.fonts?.sizes?.name || '36px',
                                                color: theme.colors?.primary || '#4F5348',
                                                fontFamily: theme.fonts?.heading || 'Inter, sans-serif'
                                            }}
                                        >
                                            {linkedResume.sections.contactInfo.name}
                                        </h1>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {[
                                                linkedResume.sections.contactInfo.email,
                                                linkedResume.sections.contactInfo.phone,
                                                linkedResume.sections.contactInfo.location
                                            ].filter(Boolean).join(' • ')}
                                        </p>
                                        {linkedResume.sections.contactInfo.linkedin && (
                                            <p className="text-sm text-blue-600 mt-1">
                                                {linkedResume.sections.contactInfo.linkedin}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Summary */}
                                {linkedResume.sections?.summary && (
                                    <div className="mb-6">
                                        <h2
                                            className="font-semibold border-b-2 pb-1 mb-3"
                                            style={{
                                                fontSize: theme.fonts?.sizes?.sectionHeader || '18px',
                                                color: theme.colors?.primary || '#4F5348',
                                                borderColor: theme.colors?.primary || '#4F5348'
                                            }}
                                        >
                                            PROFESSIONAL SUMMARY
                                        </h2>
                                        <p className="text-sm leading-relaxed" style={{ color: theme.colors?.text || '#222' }}>
                                            {linkedResume.sections.summary}
                                        </p>
                                    </div>
                                )}

                                {/* Experience */}
                                {linkedResume.sections?.experience && linkedResume.sections.experience.length > 0 && (
                                    <div className="mb-6">
                                        <h2
                                            className="font-semibold border-b-2 pb-1 mb-3"
                                            style={{
                                                fontSize: theme.fonts?.sizes?.sectionHeader || '18px',
                                                color: theme.colors?.primary || '#4F5348',
                                                borderColor: theme.colors?.primary || '#4F5348'
                                            }}
                                        >
                                            EXPERIENCE
                                        </h2>
                                        {linkedResume.sections.experience.map((exp, idx) => (
                                            <div key={idx} className="mb-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p
                                                            className="font-semibold"
                                                            style={{
                                                                fontSize: theme.fonts?.sizes?.jobTitle || '16px',
                                                                color: theme.colors?.text || '#222'
                                                            }}
                                                        >
                                                            {exp.title}
                                                        </p>
                                                        <p className="text-sm text-gray-600 italic">{exp.company}</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
                                                </div>
                                                {exp.description && (
                                                    <p
                                                        className="mt-2 text-sm whitespace-pre-line"
                                                        style={{ color: theme.colors?.muted || '#666' }}
                                                    >
                                                        {exp.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Education */}
                                {linkedResume.sections?.education && linkedResume.sections.education.length > 0 && (
                                    <div className="mb-6">
                                        <h2
                                            className="font-semibold border-b-2 pb-1 mb-3"
                                            style={{
                                                fontSize: theme.fonts?.sizes?.sectionHeader || '18px',
                                                color: theme.colors?.primary || '#4F5348',
                                                borderColor: theme.colors?.primary || '#4F5348'
                                            }}
                                        >
                                            EDUCATION
                                        </h2>
                                        {linkedResume.sections.education.map((edu, idx) => (
                                            <div key={idx} className="mb-3">
                                                <p
                                                    className="font-semibold"
                                                    style={{ color: theme.colors?.text || '#222' }}
                                                >
                                                    {edu.degree}
                                                </p>
                                                <p className="text-sm text-gray-600">{edu.school}</p>
                                                {edu.graduationDate && <p className="text-xs text-gray-500">{edu.graduationDate}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Skills */}
                                {linkedResume.sections?.skills && linkedResume.sections.skills.length > 0 && (
                                    <div className="mb-6">
                                        <h2
                                            className="font-semibold border-b-2 pb-1 mb-3"
                                            style={{
                                                fontSize: theme.fonts?.sizes?.sectionHeader || '18px',
                                                color: theme.colors?.primary || '#4F5348',
                                                borderColor: theme.colors?.primary || '#4F5348'
                                            }}
                                        >
                                            SKILLS
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {linkedResume.sections.skills.map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 text-xs rounded"
                                                    style={{
                                                        backgroundColor: `${theme.colors?.primary || '#4F5348'}15`,
                                                        color: theme.colors?.primary || '#4F5348'
                                                    }}
                                                >
                                                    {typeof skill === 'string' ? skill : skill.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Certifications */}
                                {linkedResume.sections?.certifications && linkedResume.sections.certifications.length > 0 && (
                                    <div className="mb-6">
                                        <h2
                                            className="font-semibold border-b-2 pb-1 mb-3"
                                            style={{
                                                fontSize: theme.fonts?.sizes?.sectionHeader || '18px',
                                                color: theme.colors?.primary || '#4F5348',
                                                borderColor: theme.colors?.primary || '#4F5348'
                                            }}
                                        >
                                            CERTIFICATIONS
                                        </h2>
                                        {linkedResume.sections.certifications.map((cert, idx) => (
                                            <p key={idx} className="text-sm mb-1" style={{ color: theme.colors?.text || '#222' }}>
                                                • {typeof cert === 'string' ? cert : cert.name}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cover Letter Preview Modal - Matches ViewEditCoverLetterModal styling */}
            {showCoverLetterPreview && linkedCoverLetter && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
                    onClick={() => setShowCoverLetterPreview(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold" style={{ color: "#4F5348" }}>
                                    View Cover Letter
                                </h2>
                                <button
                                    onClick={() => setShowCoverLetterPreview(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* View Mode - Same as ViewEditCoverLetterModal */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cover Letter Name
                                </label>
                                <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50">
                                    {linkedCoverLetter.name || "Untitled Cover Letter"}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cover Letter Style
                                </label>
                                <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 capitalize">
                                    {linkedCoverLetter.style || "formal"}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cover Letter Content
                                </label>
                                <div
                                    className="cover-letter-content w-full p-4 border border-gray-300 rounded-lg bg-gray-50 min-h-[400px]"
                                    dangerouslySetInnerHTML={{ __html: formatCoverLetterContent(linkedCoverLetter.content) }}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowCoverLetterPreview(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={() => setDeleteConfirm({ show: false, docIndex: null, docName: '' })}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                        </div>
                        <div className="p-4">
                            <p className="text-gray-700">
                                Are you sure you want to remove <strong>{deleteConfirm.docName}</strong> from this job package?
                            </p>
                            <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteConfirm({ show: false, docIndex: null, docName: '' })}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    await handleRemoveDocument(deleteConfirm.docIndex);
                                    setDeleteConfirm({ show: false, docIndex: null, docName: '' });
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Container>
    );
}
