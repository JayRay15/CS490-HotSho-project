import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setAuthToken } from '../../api/axios';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ContactCard from '../../components/network/ContactCard';
import ContactFormModal from '../../components/network/ContactFormModal';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('All');
  const [sortBy, setSortBy] = useState('recent');

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

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const token = await getToken();
      setAuthToken(token);
      await api.delete(`/api/contacts/${contactId}`);
      await fetchData();
    } catch (err) {
      console.error('Error deleting contact:', err);
      alert(err.response?.data?.message || 'Failed to delete contact');
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
    <Container>
      <div className="py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Network</h1>
            <p className="text-gray-600">Manage your professional contacts and relationships</p>
          </div>
          <Button onClick={handleAddContact} className="bg-[#777C6D] hover:bg-[#656A5C] text-white">
            Add New Contact
          </Button>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-blue-50">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Contacts</p>
              </div>
            </Card>
            <Card className="bg-green-50">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.recentInteractions}</p>
                <p className="text-sm text-gray-600">Recent Interactions</p>
              </div>
            </Card>
            <Card className="bg-purple-50">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{stats.withUpcomingFollowUps}</p>
                <p className="text-sm text-gray-600">Upcoming Follow-ups</p>
              </div>
            </Card>
            <Card className="bg-orange-50">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">
                  {stats.byRelationshipStrength?.Strong || 0}
                </p>
                <p className="text-sm text-gray-600">Strong Connections</p>
              </div>
            </Card>
          </div>
        )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact._id}
                contact={contact}
                onEdit={handleEditContact}
                onDelete={handleDeleteContact}
              />
            ))}
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
    </Container>
  );
}
