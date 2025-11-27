import { useState, useEffect } from 'react';
import { Search, Filter, Users, Building2, MapPin, GraduationCap, Sparkles, 
         ExternalLink, UserPlus, ChevronDown, ChevronUp, Star, Briefcase,
         Globe, Award, TrendingUp, RefreshCw } from 'lucide-react';
import { discoverContacts, getDiscoveryFilters, getSuggestedContacts, createContact, trackDiscoveryAction } from '../../api/contactApi';
import { toast } from 'react-hot-toast';
import Button from '../Button';

const ConnectionTypeBadge = ({ type }) => {
  const colors = {
    '2nd Degree': 'bg-blue-100 text-blue-700',
    '3rd Degree': 'bg-gray-100 text-gray-700',
    'Alumni': 'bg-purple-100 text-purple-700',
    'Industry Leader': 'bg-yellow-100 text-yellow-700',
    'Conference Speaker': 'bg-green-100 text-green-700',
    'Company Employee': 'bg-indigo-100 text-indigo-700',
    'Diversity Network': 'bg-pink-100 text-pink-700'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
      {type}
    </span>
  );
};

const DiscoveredContactCard = ({ contact, onAddToNetwork, isAdding }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
            {contact.firstName[0]}{contact.lastName[0]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{contact.fullName}</h3>
            <p className="text-sm text-gray-600">{contact.jobTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className="text-green-500" />
              <span className="font-medium text-green-600">{contact.matchScore}%</span>
            </div>
            <span className="text-xs text-gray-500">Match</span>
          </div>
        </div>
      </div>

      {/* Company and Location */}
      <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Building2 size={14} />
          <span>{contact.company}</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin size={14} />
          <span>{contact.location}</span>
        </div>
        {contact.yearsExperience && (
          <div className="flex items-center gap-1">
            <Briefcase size={14} />
            <span>{contact.yearsExperience} years</span>
          </div>
        )}
      </div>

      {/* Connection Type & Mutual Connections */}
      <div className="flex items-center gap-2 mb-3">
        <ConnectionTypeBadge type={contact.connectionType} />
        {contact.mutualConnectionCount > 0 && (
          <span className="text-xs text-gray-500">
            {contact.mutualConnectionCount} mutual connection{contact.mutualConnectionCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Interests */}
      {contact.interests && contact.interests.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {contact.interests.slice(0, 3).map((interest, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {interest}
            </span>
          ))}
          {contact.interests.length > 3 && (
            <span className="px-2 py-0.5 text-gray-500 text-xs">
              +{contact.interests.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Outreach Suggestion */}
      <div className="bg-blue-50 rounded-lg p-2 mb-3">
        <div className="flex items-start gap-2">
          <Sparkles size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">{contact.suggestedOutreach}</p>
        </div>
      </div>

      {/* Expandable Details */}
      {expanded && (
        <div className="border-t pt-3 mt-3 space-y-3">
          {/* Mutual Connections */}
          {contact.mutualConnections && contact.mutualConnections.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Mutual Connections</h4>
              <div className="flex flex-wrap gap-1">
                {contact.mutualConnections.map((conn, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                    {conn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* University */}
          {contact.university && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <GraduationCap size={14} />
              <span>{contact.university}</span>
            </div>
          )}

          {/* Diversity Groups */}
          {contact.diversityGroups && contact.diversityGroups.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Professional Groups</h4>
              <div className="flex flex-wrap gap-1">
                {contact.diversityGroups.map((group, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-pink-50 text-pink-700 rounded text-xs">
                    {group}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Speaker Topics */}
          {contact.speakerTopics && contact.speakerTopics.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Speaker Topics</h4>
              <div className="flex flex-wrap gap-1">
                {contact.speakerTopics.map((topic, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {contact.recentActivity && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Recent activity:</span> {contact.recentActivity}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? 'Less' : 'More'} details
        </button>
        <div className="flex items-center gap-2">
          {contact.linkedInUrl && (
            <a
              href={contact.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="View LinkedIn Profile"
            >
              <ExternalLink size={16} />
            </a>
          )}
          <Button
            onClick={() => onAddToNetwork(contact)}
            disabled={isAdding}
            size="sm"
            className="flex items-center gap-2 px-4 py-2 whitespace-nowrap"
          >
            <UserPlus size={16} />
            <span className="truncate">Add to Network</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function ContactDiscoveryTab({ onContactAdded }) {
  const [contacts, setContacts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingContact, setAddingContact] = useState(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedConnectionType, setSelectedConnectionType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  
  // View mode
  const [viewMode, setViewMode] = useState('suggestions'); // 'suggestions' or 'search'

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [filtersRes, suggestionsRes] = await Promise.all([
        getDiscoveryFilters(),
        getSuggestedContacts()
      ]);
      
      setFilters(filtersRes.data?.data || null);
      setSuggestions(suggestionsRes.data?.data || []);
    } catch (error) {
      console.error('Error loading discovery data:', error);
      toast.error('Failed to load contact discovery');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (resetPage = true) => {
    setSearchLoading(true);
    setViewMode('search');
    
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    try {
      const params = {
        page: currentPage,
        limit: 12
      };
      
      if (searchQuery) params.q = searchQuery;
      if (selectedIndustry) params.industry = selectedIndustry;
      if (selectedConnectionType) params.connectionType = selectedConnectionType;
      if (selectedLocation) params.location = selectedLocation;
      if (selectedUniversity) params.university = selectedUniversity;

      const response = await discoverContacts(params);
      setContacts(response.data?.data || []);
      setPagination(response.data?.pagination || null);
    } catch (error) {
      console.error('Error searching contacts:', error);
      toast.error('Failed to search contacts');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddToNetwork = async (contact) => {
    setAddingContact(contact.id);
    try {
      // Prepare contact data for creation
      const contactData = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        company: contact.company,
        jobTitle: contact.jobTitle,
        industry: contact.industry,
        location: contact.location,
        linkedInUrl: contact.linkedInUrl,
        relationshipType: contact.connectionType === 'Alumni' ? 'Alumni' : 
                          contact.connectionType === 'Industry Leader' ? 'Industry Contact' : 
                          'Other',
        relationshipStrength: 'New',
        notes: `Discovered via ${contact.connectionType}. ${contact.suggestedOutreach}`,
        professionalInterests: contact.interests?.join(', ') || '',
        mutualConnections: contact.mutualConnections || [],
        tags: [contact.connectionType, contact.industry, 'Discovered'].filter(Boolean)
      };

      await createContact(contactData);
      
      // Track the discovery action
      await trackDiscoveryAction({
        discoveredContactId: contact.id,
        action: 'added_to_network',
        notes: `Added ${contact.fullName} from ${contact.company}`
      });

      toast.success(`${contact.fullName} added to your network!`);
      
      // Notify parent component
      if (onContactAdded) {
        onContactAdded();
      }

      // Remove from current list
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      setSuggestions(prev => prev.filter(c => c.id !== contact.id));
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact to network');
    } finally {
      setAddingContact(null);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    handleSearch(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('');
    setSelectedConnectionType('');
    setSelectedLocation('');
    setSelectedUniversity('');
    setViewMode('suggestions');
    setContacts([]);
    setPagination(null);
  };

  const displayedContacts = viewMode === 'suggestions' ? suggestions : contacts;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discover Contacts</h2>
          <p className="text-gray-600 mt-1">Find and connect with professionals in your target industry</p>
        </div>
        <button
          onClick={loadInitialData}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, company, role, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
                showFilters ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              Filters
              {(selectedIndustry || selectedConnectionType || selectedLocation || selectedUniversity) && (
                <span className="ml-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                  {[selectedIndustry, selectedConnectionType, selectedLocation, selectedUniversity].filter(Boolean).length}
                </span>
              )}
            </button>
            <Button onClick={() => handleSearch()} disabled={searchLoading}>
              {searchLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && filters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Industries</option>
                {filters.industries?.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Connection Type</label>
              <select
                value={selectedConnectionType}
                onChange={(e) => setSelectedConnectionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                {filters.connectionTypes?.map((type) => (
                  <option key={type.type || type} value={type.type || type}>
                    {type.type || type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Locations</option>
                {filters.locations?.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University/Alumni</label>
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Universities</option>
                {filters.universities?.map((uni) => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-4 border-b">
        <button
          onClick={() => setViewMode('suggestions')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
            viewMode === 'suggestions'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            Suggested for You
            {suggestions.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                {suggestions.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => viewMode !== 'search' && handleSearch()}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
            viewMode === 'search'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Search size={16} />
            Search Results
            {pagination && (
              <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                {pagination.totalContacts}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Results */}
      {searchLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : displayedContacts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {viewMode === 'suggestions' ? 'No Suggestions Yet' : 'No Results Found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {viewMode === 'suggestions'
              ? 'Add some job applications to get personalized contact suggestions'
              : 'Try adjusting your search filters or keywords'}
          </p>
          {viewMode === 'search' && (
            <Button onClick={clearFilters} variant="secondary">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedContacts.map((contact) => (
              <DiscoveredContactCard
                key={contact.id}
                contact={contact}
                onAddToNetwork={handleAddToNetwork}
                isAdding={addingContact === contact.id}
              />
            ))}
          </div>

          {/* Load More */}
          {viewMode === 'search' && pagination?.hasMore && (
            <div className="flex justify-center mt-6">
              <Button onClick={handleLoadMore} variant="secondary">
                Load More
              </Button>
            </div>
          )}
        </>
      )}

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Award size={20} className="text-purple-600" />
          Networking Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs flex-shrink-0">1</div>
            <p>Start with 2nd-degree connections for warmer introductions</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium text-xs flex-shrink-0">2</div>
            <p>Mention shared interests or experiences in your outreach</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-medium text-xs flex-shrink-0">3</div>
            <p>Follow up within 48 hours of making a new connection</p>
          </div>
        </div>
      </div>
    </div>
  );
}
