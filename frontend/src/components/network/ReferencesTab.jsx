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
                onEdit={() => {}} // Not implementing edit in this view
                onDelete={() => {}} // Not implementing delete in this view
                showControls={false}
                customActions={
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => handleRequestReference(reference)}
                      variant="outline"
                      className="flex-1"
                    >
                      Request Reference
                    </Button>
                    <Button
                      onClick={() => handleRemoveReference(reference._id)}
                      variant="outline"
                      className="flex-1 text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </Button>
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
        />
      )}

      {/* Reference Portfolio View */}
      {showPortfolio && (
        <ReferencePortfolio
          references={references.filter(ref => selectedForPortfolio.includes(ref._id))}
          onClose={() => setShowPortfolio(false)}
        />
      )}
    </div>
  );
}
