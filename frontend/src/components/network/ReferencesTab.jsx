import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setAuthToken } from '../../api/axios';
import Card from '../Card';
import Button from '../Button';
import ContactCard from './ContactCard';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import ReferenceRequestModal from './ReferenceRequestModal';
import ReferencePortfolio from './ReferencePortfolio';
import ReferenceFeedbackModal from './ReferenceFeedbackModal';
import ReferenceHistoryModal from './ReferenceHistoryModal';
import { Users, FileText, MessageSquare, ThumbsUp } from 'lucide-react';

export default function ReferencesTab() {
  const { getToken } = useAuth();
  const [references, setReferences] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedReference, setSelectedReference] = useState(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [selectedForPortfolio, setSelectedForPortfolio] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedForFeedback, setSelectedForFeedback] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedForHistory, setSelectedForHistory] = useState(null);
  const [stats, setStats] = useState(null);

  // Fetch references
  const fetchReferences = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      const response = await api.get('/api/contacts');
      const allContacts = response.data.data;

      // Filter for references
      const refs = allContacts.filter(contact => contact.isReference);
      setReferences(refs);
      setAllContacts(allContacts);

      // Fetch stats
      const statsResponse = await api.get('/api/contacts/stats');
      setStats(statsResponse.data.data);

      setError(null);
    } catch (err) {
      console.error('Error fetching references:', err);
      setError(err.response?.data?.message || 'Failed to load references');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, [getToken]);

  // Mark a contact as reference
  const handleAddReference = async (contactId) => {
    try {
      const token = await getToken();
      setAuthToken(token);

      await api.put(`/api/contacts/${contactId}`, {
        isReference: true
      });

      setShowAddModal(false);
      await fetchReferences();
    } catch (err) {
      console.error('Error adding reference:', err);
      alert(err.response?.data?.message || 'Failed to add reference');
    }
  };

  // Remove reference designation
  const handleRemoveReference = async (contactId) => {
    try {
      const token = await getToken();
      setAuthToken(token);

      await api.put(`/api/contacts/${contactId}`, {
        isReference: false
      });

      await fetchReferences();
    } catch (err) {
      console.error('Error removing reference:', err);
      alert(err.response?.data?.message || 'Failed to remove reference');
    }
  };

  const handleRequestReference = (reference) => {
    setSelectedReference(reference);
    setShowRequestModal(true);
  };

  const handleTogglePortfolioSelection = (referenceId) => {
    setSelectedForPortfolio(prev =>
      prev.includes(referenceId)
        ? prev.filter(id => id !== referenceId)
        : [...prev, referenceId]
    );
  };

  const handleGeneratePortfolio = () => {
    if (selectedForPortfolio.length === 0) {
      alert('Please select at least one reference to generate a portfolio');
      return;
    }
    setShowPortfolio(true);
  };

  const handleRecordFeedback = (reference) => {
    setSelectedForFeedback(reference);
    setShowFeedbackModal(true);
  };

  const handleViewHistory = (reference) => {
    setSelectedForHistory(reference);
    setShowHistoryModal(true);
  };

  const getLastUsedInfo = (reference) => {
    if (!reference.interactions || reference.interactions.length === 0) return null;

    // Find last reference request
    const requests = reference.interactions
      .filter(i => i.type === 'Reference Request')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (requests.length === 0) return null;

    const lastRequest = requests[0];
    const dateStr = new Date(lastRequest.date).toLocaleDateString();

    const job = reference.linkedJobIds?.find(j => j._id === lastRequest.jobId);

    if (job) {
      return `Last used: ${dateStr} for ${job.jobTitle} at ${job.company}`;
    }

    return `Last used: ${dateStr}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  const nonReferences = allContacts.filter(contact => !contact.isReference);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Professional References</h2>
          <p className="text-gray-600 mt-1">
            Manage your list of professional references for job applications
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
          >
            Add Reference
          </Button>
          {selectedForPortfolio.length > 0 && (
            <Button
              onClick={handleGeneratePortfolio}
              className="bg-[#777C6D] hover:bg-[#656A5C] text-white"
            >
              Generate Portfolio ({selectedForPortfolio.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalReferences || 0}</div>
                <div className="text-sm text-gray-600">Total References</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText size={24} className="text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.referenceRequests || 0}</div>
                <div className="text-sm text-gray-600">Requests Made</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare size={24} className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.referenceFeedback || 0}</div>
                <div className="text-sm text-gray-600">Feedback Recorded</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ThumbsUp size={24} className="text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.referenceRequests > 0
                    ? Math.round((stats.referenceFeedback / stats.referenceRequests) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Response Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* References List */}
      {references.length === 0 ? (
        <Card className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No references yet</h3>
          <p className="text-gray-600 mb-4">
            Add contacts from your network to designate them as professional references
          </p>
          <Button onClick={() => setShowAddModal(true)}>Add Your First Reference</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {references.map((reference) => (
            <div key={reference._id} className="relative">
              {/* Selection Checkbox for Portfolio */}
              <div className="absolute top-5 right-5 z-10">
                <input
                  type="checkbox"
                  checked={selectedForPortfolio.includes(reference._id)}
                  onChange={() => handleTogglePortfolioSelection(reference._id)}
                  className="w-5 h-5 text-[#777C6D] rounded focus:ring-2 focus:ring-[#777C6D]"
                />
              </div>

              <ContactCard
                contact={reference}
                onEdit={() => { }} // Not implementing edit in this view
                onDelete={() => { }} // Not implementing delete in this view
                showControls={false}
                customActions={
                  <div className="flex flex-col gap-2 mt-4">
                    {getLastUsedInfo(reference) && (
                      <div className="text-xs text-gray-500 italic mb-1">
                        {getLastUsedInfo(reference)}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRequestReference(reference)}
                        className="flex-1 text-xs px-2 bg-[#777C6D] hover:bg-[#656A5C] text-white flex items-center justify-center text-center"
                      >
                        Request
                      </Button>
                      <Button
                        onClick={() => handleRecordFeedback(reference)}
                        variant="outline"
                        className="flex-1 text-xs px-2 flex items-center justify-center text-center"
                      >
                        Feedback
                      </Button>
                      <Button
                        onClick={() => handleViewHistory(reference)}
                        variant="outline"
                        className="flex-1 text-xs px-2 flex items-center justify-center text-center"
                      >
                        History
                      </Button>
                      <Button
                        onClick={() => handleRemoveReference(reference._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs px-2 flex items-center justify-center text-center"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Reference Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Add Reference</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Select a contact from your network to designate as a professional reference:
              </p>

              {nonReferences.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  All your contacts are already marked as references. Add more contacts first.
                </p>
              ) : (
                <div className="space-y-3">
                  {nonReferences.map((contact) => (
                    <div
                      key={contact._id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAddReference(contact._id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {contact.jobTitle} {contact.company ? `at ${contact.company}` : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {contact.relationshipType} • {contact.relationshipStrength}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reference Request Modal */}
      {showRequestModal && selectedReference && (
        <ReferenceRequestModal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedReference(null);
          }}
          reference={selectedReference}
          onSuccess={fetchReferences}
        />
      )}

      {/* Reference Feedback Modal */}
      {showFeedbackModal && selectedForFeedback && (
        <ReferenceFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedForFeedback(null);
          }}
          reference={selectedForFeedback}
          onSuccess={fetchReferences}
        />
      )}

      {/* Reference Portfolio View */}
      {showPortfolio && (
        <ReferencePortfolio
          references={references.filter(ref => selectedForPortfolio.includes(ref._id))}
          onClose={() => setShowPortfolio(false)}
        />
      )}

      {/* Reference History Modal */}
      {showHistoryModal && selectedForHistory && (
        <ReferenceHistoryModal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedForHistory(null);
          }}
          reference={selectedForHistory}
        />
      )}
    </div>
  );
}
