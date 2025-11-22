import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setAuthToken } from '../../api/axios';
import Container from '../../components/Container';
import Card from '../../components/Card';
import ContactStatsCards from '../../components/network/ContactStatsCards';
import Button from '../../components/Button';
import ContactCard from '../../components/network/ContactCard';
import ContactFormModal from '../../components/network/ContactFormModal';
import ContactImportModal from '../../components/network/ContactImportModal';
import DeleteContactModal from '../../components/network/DeleteContactModal';
import ReferralRequestModal from '../../components/network/ReferralRequestModal';
import ReferralList from '../../components/network/ReferralList';
import NetworkingEventList from '../../components/network/NetworkingEventList';
import ReferencesTab from '../../components/network/ReferencesTab';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function Network() {
  const { getToken } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const [sortBy, setSortBy] = useState('recent');
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [selectedContactForReferral, setSelectedContactForReferral] = useState(null);
  const [referralRefreshTrigger, setReferralRefreshTrigger] = useState(0);
  // Show all contacts or just 3
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  // Active tab: 'contacts', 'references', 'events'
  const [activeTab, setActiveTab] = useState('contacts');

  // Fetch contacts and stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);

      const [contactsRes, statsRes] = await Promise.all([
        api.get('/api/contacts', {
          params: {
            relationshipType: relationshipFilter !== 'All' ? relationshipFilter : undefined,
            sortBy
          }
        }),
        api.get('/api/contacts/stats')
      ]);

      setContacts(contactsRes.data.data);
      setFilteredContacts(contactsRes.data.data);
      setStats(statsRes.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.response?.data?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [getToken, relationshipFilter, sortBy]);

  // Filter contacts by search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(contact => {
      const searchLower = searchTerm.toLowerCase();
      return (
        contact.firstName?.toLowerCase().includes(searchLower) ||
        contact.lastName?.toLowerCase().includes(searchLower) ||
        contact.company?.toLowerCase().includes(searchLower) ||
        contact.jobTitle?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredContacts(filtered);
  }, [searchTerm, contacts]);

  const handleAddContact = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  // Open delete confirmation modal for a contact
  const handleDeleteContact = (contactIdOrObj) => {
    // Accept either id or full contact object
    const contactObj = typeof contactIdOrObj === 'string'
      ? contacts.find(c => c._id === contactIdOrObj)
      : contactIdOrObj;

    setContactToDelete(contactObj || { _id: contactIdOrObj, name: 'Contact' });
    setShowDeleteModal(true);
  };

  // Perform delete when user confirms
  const confirmDeleteContact = async () => {
    if (!contactToDelete?._id) return;
    setIsDeleting(true);
    try {
      const token = await getToken();
      setAuthToken(token);
      await api.delete(`/api/contacts/${contactToDelete._id}`);
      setShowDeleteModal(false);
      setContactToDelete(null);
      await fetchData();
    } catch (err) {
      console.error('Error deleting contact:', err);
      alert(err.response?.data?.message || 'Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleContactSaved = () => {
    fetchData();
    handleModalClose();
  };

  const handleRequestReferral = (contact) => {
    setSelectedContactForReferral(contact);
    setShowReferralModal(true);
  };

  const handleReferralSuccess = () => {
    setReferralRefreshTrigger(prev => prev + 1);
    setShowReferralModal(false);
    setSelectedContactForReferral(null);
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E4E6E0" }}>
      <Container level={1} className="pt-12 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: "#4F5348" }}>Professional Network</h1>
              <p style={{ color: "#656A5C" }}>Manage and expand your network</p>
            </div>
          <div className="flex gap-2">
            {activeTab === 'contacts' && (
              <>
                <Button onClick={() => setIsImportModalOpen(true)} variant="outline">
                  Import Contacts
                </Button>
                <Button onClick={handleAddContact} className="bg-[#777C6D] hover:bg-[#656A5C] text-white">
                  Add New Contact
                </Button>
              </>
            )}
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Statistics Cards (refactored) */}
        <ContactStatsCards stats={stats} onRefresh={fetchData} />

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('contacts')}
                className={`${
                  activeTab === 'contacts'
                    ? 'border-[#777C6D] text-[#777C6D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                My Contacts
              </button>
              <button
                onClick={() => setActiveTab('references')}
                className={`${
                  activeTab === 'references'
                    ? 'border-[#777C6D] text-[#777C6D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                References
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`${
                  activeTab === 'referrals'
                    ? 'border-[#777C6D] text-[#777C6D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Referrals
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`${
                  activeTab === 'events'
                    ? 'border-[#777C6D] text-[#777C6D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Events
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'contacts' && (
          <>
            {/* Filters and Search */}
            <Card className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Relationship Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Type</label>
                  <select
                    value={relationshipFilter}
                    onChange={(e) => setRelationshipFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="All">All Types</option>
                    <option value="Mentor">Mentor</option>
                    <option value="Peer">Peer</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Manager">Manager</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Alumni">Alumni</option>
                    <option value="Industry Contact">Industry Contact</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="company">Company</option>
                    <option value="lastContact">Last Contact</option>
                    <option value="nextFollowUp">Next Follow-up</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Contacts Grid */}
            {filteredContacts.length === 0 ? (
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || relationshipFilter !== 'All'
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first professional contact'}
                </p>
                {!searchTerm && relationshipFilter === 'All' && (
                  <Button onClick={handleAddContact}>Add Your First Contact</Button>
                )}
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {(showAllContacts ? filteredContacts : filteredContacts.slice(0, 3)).map((contact) => (
                    <ContactCard
                      key={contact._id}
                      contact={contact}
                      onEdit={handleEditContact}
                      onDelete={handleDeleteContact}
                      onRequestReferral={handleRequestReferral}
                    />
                  ))}
                </div>
                {filteredContacts.length > 3 && (
                  <div className="flex justify-center mt-2 mb-8">
                    <button
                      type="button"
                      onClick={() => setShowAllContacts(v => !v)}
                      className="px-6 py-2 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: '#777C6D' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#656A5C'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = '#777C6D'}
                    >
                      {showAllContacts ? 'View Less' : `View More (${filteredContacts.length - 3} more)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'references' && <ReferencesTab />}

        {activeTab === 'referrals' && (
          <div className="mt-6">
            <ReferralList refreshTrigger={referralRefreshTrigger} />
          </div>
        )}

        {activeTab === 'events' && (
          <div className="mt-6">
            <NetworkingEventList refreshTrigger={referralRefreshTrigger} />
          </div>
        )}
      </div>

      {/* Contact Form Modal */}
      {isModalOpen && (
        <ContactFormModal
          contact={editingContact}
          onClose={handleModalClose}
          onSave={handleContactSaved}
        />
      )}

      {/* Referral Request Modal */}
      {showReferralModal && selectedContactForReferral && (
        <ReferralRequestModal
          isOpen={showReferralModal}
          onClose={() => {
            setShowReferralModal(false);
            setSelectedContactForReferral(null);
          }}
          contact={selectedContactForReferral}
          onSuccess={handleReferralSuccess}
        />
      )}

      {/* Delete Confirmation Modal for contacts */}
      <DeleteContactModal
        showModal={showDeleteModal}
        contact={contactToDelete}
        onClose={() => { setShowDeleteModal(false); setContactToDelete(null); }}
        onConfirm={confirmDeleteContact}
        isDeleting={isDeleting}
      />

      {/* Import Contacts Modal */}
      {isImportModalOpen && (
        <ContactImportModal
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            setIsImportModalOpen(false);
            fetchData();
          }}
        />
      )}
      </Container>
    </div>
  );
}
