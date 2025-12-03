import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthToken } from '../api/axios';
import {
  getDocuments,
  getDocument,
  getDocumentStats,
  createDocument,
  updateDocument,
  addDocumentVersion,
  restoreDocumentVersion,
  deleteDocument,
  fileToBase64,
  DOCUMENT_CATEGORIES,
  CATEGORY_ICONS
} from '../api/documents';
import {
  FolderOpen,
  FileText,
  Upload,
  Search,
  Filter,
  Star,
  StarOff,
  Clock,
  History,
  Trash2,
  Edit3,
  Download,
  Link,
  Eye,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Archive,
  Tag,
  File,
  MoreVertical
} from 'lucide-react';

const DocumentManagement = () => {
  const { getToken } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // Upload form
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'other',
    tags: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
    loadStats();
  }, [selectedCategory, searchQuery]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);
      
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      
      const response = await getDocuments(params);
      setDocuments(response.data?.documents || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await getDocumentStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        file,
        name: prev.name || file.name.replace(/\.[^/.]+$/, '')
      }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.name || !uploadForm.category) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);
      const token = await getToken();
      setAuthToken(token);

      const fileData = await fileToBase64(uploadForm.file);
      
      await createDocument({
        name: uploadForm.name,
        description: uploadForm.description,
        category: uploadForm.category,
        tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        fileName: uploadForm.file.name,
        fileSize: uploadForm.file.size,
        fileData,
        mimeType: uploadForm.file.type
      });

      setShowUploadModal(false);
      setUploadForm({ name: '', description: '', category: 'other', tags: '', file: null });
      loadDocuments();
      loadStats();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleFavorite = async (doc) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await updateDocument(doc._id, { isFavorite: !doc.isFavorite });
      loadDocuments();
    } catch (err) {
      console.error('Error updating favorite:', err);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.name}"?`)) return;
    
    try {
      const token = await getToken();
      setAuthToken(token);
      await deleteDocument(doc._id);
      loadDocuments();
      loadStats();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  };

  const handleViewDetails = async (doc) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const response = await getDocument(doc._id);
      setSelectedDocument(response.data?.document);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading document details:', err);
    }
  };

  const handleRestoreVersion = async (docId, versionNumber) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await restoreDocumentVersion(docId, versionNumber);
      loadDocuments();
      // Refresh selected document
      const response = await getDocument(docId);
      setSelectedDocument(response.data?.document);
    } catch (err) {
      console.error('Error restoring version:', err);
      setError('Failed to restore version');
    }
  };

  const handleAddVersion = async (docId, file) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const fileData = await fileToBase64(file);
      
      await addDocumentVersion(docId, {
        fileName: file.name,
        fileSize: file.size,
        fileData,
        mimeType: file.type,
        notes: 'New version uploaded'
      });

      loadDocuments();
      // Refresh selected document
      const response = await getDocument(docId);
      setSelectedDocument(response.data?.document);
    } catch (err) {
      console.error('Error adding version:', err);
      setError('Failed to add new version');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
            <p className="text-gray-600 mt-1">Organize and manage all your application materials</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.summary?.totalDocuments || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <History className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Versions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.summary?.totalVersions || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <File className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Size</p>
                  <p className="text-2xl font-bold text-gray-900">{formatFileSize(stats.summary?.totalSize)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Tag className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Categories Used</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.categoryBreakdown?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {CATEGORY_ICONS[key]} {label}
                </option>
              ))}
            </select>
            <button
              onClick={loadDocuments}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Documents Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-4">Upload your first document to get started</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div key={doc._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{CATEGORY_ICONS[doc.category]}</span>
                      <div>
                        <h3 className="font-medium text-gray-900 line-clamp-1">{doc.name}</h3>
                        <p className="text-sm text-gray-500">{DOCUMENT_CATEGORIES[doc.category]}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleFavorite(doc)}
                      className={`p-1 rounded ${doc.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                    >
                      {doc.isFavorite ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(doc.updatedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <History className="w-4 h-4" />
                      v{doc.currentVersion}
                    </span>
                    <span>{formatFileSize(doc.currentFileSize)}</span>
                  </div>

                  {doc.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {doc.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{doc.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleViewDetails(doc)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDocument(doc);
                        setShowVersionModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <History className="w-4 h-4" />
                      Versions
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Upload Document</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleUpload} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {uploadForm.file ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="w-8 h-8 text-blue-500" />
                          <span className="text-sm text-gray-700">{uploadForm.file.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-600">Click to select a file</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="My Resume"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(DOCUMENT_CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{CATEGORY_ICONS[key]} {label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Brief description of this document..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="software, engineering, 2024 (comma-separated)"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uploadForm.file}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Version History Modal */}
        {showVersionModal && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Version History: {selectedDocument.name}</h2>
                <button
                  onClick={() => {
                    setShowVersionModal(false);
                    setSelectedDocument(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload New Version</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleAddVersion(selectedDocument._id, e.target.files[0]);
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <div className="space-y-3">
                  {selectedDocument.versions?.slice().reverse().map((version, idx) => (
                    <div
                      key={version._id || idx}
                      className={`p-4 rounded-lg border ${
                        version.versionNumber === selectedDocument.currentVersion
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">Version {version.versionNumber}</span>
                            {version.versionNumber === selectedDocument.currentVersion && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{version.fileName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(version.createdAt)} • {formatFileSize(version.fileSize)}
                          </p>
                          {version.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">{version.notes}</p>
                          )}
                        </div>
                        {version.versionNumber !== selectedDocument.currentVersion && (
                          <button
                            onClick={() => handleRestoreVersion(selectedDocument._id, version.versionNumber)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Detail Modal */}
        {showDetailModal && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[selectedDocument.category]}</span>
                  <div>
                    <h2 className="text-lg font-semibold">{selectedDocument.name}</h2>
                    <p className="text-sm text-gray-500">{DOCUMENT_CATEGORIES[selectedDocument.category]}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDocument(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">Current Version</p>
                    <p className="font-medium">v{selectedDocument.currentVersion}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">File Size</p>
                    <p className="font-medium">{formatFileSize(selectedDocument.currentFileSize)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">Created</p>
                    <p className="font-medium">{formatDate(selectedDocument.createdAt)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase">Last Modified</p>
                    <p className="font-medium">{formatDate(selectedDocument.updatedAt)}</p>
                  </div>
                </div>

                {selectedDocument.description && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                    <p className="text-gray-600">{selectedDocument.description}</p>
                  </div>
                )}

                {selectedDocument.tags?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocument.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDocument.linkedJobs?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Linked Jobs</h3>
                    <div className="space-y-2">
                      {selectedDocument.linkedJobs.map((job, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <Link className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{job.title || 'Untitled Job'} at {job.company || 'Unknown Company'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Version History ({selectedDocument.versions?.length || 0} versions)</h3>
                  <div className="space-y-2">
                    {selectedDocument.versions?.slice(-3).reverse().map((version, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                        <span>v{version.versionNumber} - {version.fileName}</span>
                        <span className="text-gray-500">{formatDate(version.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManagement;
