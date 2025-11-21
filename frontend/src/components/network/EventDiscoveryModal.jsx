import { useState, useEffect } from 'react';
import { X, Search, MapPin, Calendar, ExternalLink, Globe, Loader } from 'lucide-react';
import { discoverEvents, getEventCategories } from '../../api/networkingEventApi';
import { toast } from 'react-hot-toast';
import Button from '../Button';

export default function EventDiscoveryModal({ onClose, onImport }) {
  // Close modal when clicking on backdrop (but not when clicking modal content)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  const [searchParams, setSearchParams] = useState({
    location: '',
    q: 'networking',
    categories: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalEvents: 0,
    hasMore: false
  });
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadCategories();
    // Perform initial search
    handleSearch();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getEventCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSearch = async (page = 1) => {
    setSearching(true);
    try {
      const response = await discoverEvents({
        ...searchParams,
        page
      });

      setEvents(response.data || []);
      setPagination(response.pagination || {
        page: 1,
        totalPages: 1,
        totalEvents: 0,
        hasMore: false
      });
    } catch (error) {
      console.error('Error searching events:', error);
      toast.error(error.message || 'Failed to search events. Please check your API key.');
      setEvents([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImport = async (event) => {
    setLoading(true);
    try {
      // Prepare event data for import
      const importData = {
        name: event.name,
        description: event.description,
        eventDate: event.eventDate,
        endDate: event.endDate,
        location: event.location,
        eventType: event.eventType,
        isVirtual: event.isVirtual,
        virtualLink: event.virtualLink,
        industry: event.industry,
        organizer: event.organizer,
        website: event.website,
        cost: event.cost,
        tags: event.tags || [],
        attendanceStatus: 'Planning to Attend'
      };

      await onImport(importData);
      toast.success('Event imported successfully!');
      onClose();
    } catch (error) {
      console.error('Error importing event:', error);
      toast.error('Failed to import event');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Discover Networking Events</h2>
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

        <div className="p-6">
          {/* Search Form */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={16} className="inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={searchParams.location}
                  onChange={handleInputChange}
                  placeholder="City, State or 'online'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Search size={16} className="inline mr-1" />
                  Keywords
                </label>
                <input
                  type="text"
                  name="q"
                  value={searchParams.q}
                  onChange={handleInputChange}
                  placeholder="networking, tech, business..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="categories"
                  value={searchParams.categories}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={searchParams.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={searchParams.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => handleSearch(1)}
                  disabled={searching}
                  className="w-full bg-[#777C6D] hover:bg-[#656A5C] text-white"
                >
                  {searching ? (
                    <>
                      <Loader size={16} className="animate-spin mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={16} className="mr-2" />
                      Search Events
                    </>
                  )}
                </Button>
              </div>
            </div>

            {pagination.totalEvents > 0 && (
              <div className="text-sm text-gray-600">
                Found {pagination.totalEvents} events
              </div>
            )}
          </div>

          {/* Results */}
          {searching ? (
            <div className="flex justify-center items-center py-12">
              <Loader size={48} className="animate-spin text-blue-600" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or location
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition"
                >
                  <div className="flex gap-4">
                    {event.imageUrl && (
                      <img
                        src={event.imageUrl}
                        alt={event.name}
                        className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {event.name}
                          </h3>
                          {event.organizer && (
                            <p className="text-sm text-gray-600 mb-1">
                              by {event.organizer}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {event.website && (
                            <a
                              href={event.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-gray-100 rounded-lg transition"
                              title="View on Eventbrite"
                            >
                              <ExternalLink size={18} />
                            </a>
                          )}
                          <Button
                            onClick={() => handleImport(event)}
                            disabled={loading}
                            size="small"
                            className="bg-[#777C6D] hover:bg-[#656A5C] text-white"
                          >
                            Import
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {event.eventType}
                        </span>
                        {event.isVirtual && (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium flex items-center gap-1">
                            <Globe size={12} />
                            Virtual
                          </span>
                        )}
                        {event.cost === 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Free
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{formatDate(event.eventDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => handleSearch(pagination.page - 1)}
                    disabled={pagination.page === 1 || searching}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => handleSearch(pagination.page + 1)}
                    disabled={!pagination.hasMore || searching}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
