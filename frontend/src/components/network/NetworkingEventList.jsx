import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, Target } from 'lucide-react';
import {
  getNetworkingEvents,
  getNetworkingStats,
  createNetworkingEvent,
  updateNetworkingEvent,
  deleteNetworkingEvent
} from '../../api/networkingEventApi';
import { toast } from 'react-hot-toast';
import NetworkingEventCard from './NetworkingEventCard';
import NetworkingEventModal from './NetworkingEventModal';
import EventDiscoveryModal from './EventDiscoveryModal';
import DeleteConfirmationModal from '../resume/DeleteConfirmationModal';

const NetworkingEventList = ({ refreshTrigger }) => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterTime, setFilterTime] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('eventDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAll, setShowAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshTrigger, filterTime, filterType, filterStatus, sortBy, sortOrder]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters = {
        sortBy,
        sortOrder
      };

      if (filterTime !== 'all') {
        filters.timeFilter = filterTime;
      }
      if (filterType !== 'all') {
        filters.eventType = filterType;
      }
      if (filterStatus !== 'all') {
        filters.attendanceStatus = filterStatus;
      }

      const [eventsResponse, statsResponse] = await Promise.all([
        getNetworkingEvents(filters),
        getNetworkingStats()
      ]);

      setEvents(Array.isArray(eventsResponse?.data) ? eventsResponse.data : []);
      setStats(statsResponse?.data || null);
    } catch (error) {
      console.error('Error loading networking events:', error);
      toast.error('Failed to load networking events');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (editingEvent) {
        await updateNetworkingEvent(editingEvent._id, eventData);
        toast.success('Event updated successfully');
      } else {
        await createNetworkingEvent(eventData);
        toast.success('Event created successfully');
      }
      setShowModal(false);
      setEditingEvent(null);
      loadData();
    } catch (error) {
      console.error('Error saving event:', error);
      throw error;
    }
  };

  const handleImportEvent = async (eventData) => {
    try {
      await createNetworkingEvent(eventData);
      setShowDiscoveryModal(false);
      loadData();
    } catch (error) {
      console.error('Error importing event:', error);
      throw error;
    }
  };

  const handleDeleteEvent = (event) => {
    setDeletingEvent(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);
    try {
      const idToDelete = typeof deletingEvent === 'string'
        ? deletingEvent
        : deletingEvent._id || deletingEvent.id;

      if (!idToDelete) throw new Error('Invalid event id');

      await deleteNetworkingEvent(idToDelete);
      toast.success('Event deleted successfully');
      setShowDeleteModal(false);
      setDeletingEvent(null);
      loadData();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Networking Events</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDiscoveryModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
          >
            Discover Events
          </button>
          <button
            onClick={handleAddEvent}
            className="px-4 py-2 bg-[#777C6D] hover:bg-[#656A5C] text-white rounded-lg transition font-medium"
          >
            + Add Event
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar size={24} className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</div>
                <div className="text-sm text-gray-600">Upcoming</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar size={24} className="text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.attendedEvents}</div>
                <div className="text-sm text-gray-600">Attended</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users size={24} className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalConnections}</div>
                <div className="text-sm text-gray-600">Connections</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Target size={24} className="text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.goalCompletionRate}%</div>
                <div className="text-sm text-gray-600">Goals Achieved</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Time Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="Conference">Conference</option>
              <option value="Meetup">Meetup</option>
              <option value="Career Fair">Career Fair</option>
              <option value="Workshop">Workshop</option>
              <option value="Webinar">Webinar</option>
              <option value="Social Event">Social Event</option>
              <option value="Industry Mixer">Industry Mixer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="Planning to Attend">Planning to Attend</option>
              <option value="Registered">Registered</option>
              <option value="Attended">Attended</option>
              <option value="Missed">Missed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="eventDate">Event Date</option>
              <option value="name">Name</option>
              <option value="createdAt">Date Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Networking Events Yet</h3>
          <p className="text-gray-600 mb-4">
            {filterTime !== 'all' || filterType !== 'all' || filterStatus !== 'all'
              ? 'No events match your filters'
              : 'Start tracking networking events to build strategic professional relationships'}
          </p>
          <button
            onClick={handleAddEvent}
            className="px-6 py-2 bg-[#777C6D] hover:bg-[#656A5C] text-white rounded-lg transition font-medium"
          >
            Add Your First Event
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showAll ? events : events.slice(0, 3)).map((event) => (
              <NetworkingEventCard
                key={event._id}
                event={event}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>
          {events.length > 3 && (
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={() => setShowAll(v => !v)}
                className="px-6 py-2 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: '#777C6D' }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#656A5C'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#777C6D'}
              >
                {showAll ? 'View Less' : `View More (${events.length - 3} more)`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Event Modal */}
      {showModal && (
        <NetworkingEventModal
          event={editingEvent}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
        />
      )}

      {/* Discovery Modal */}
      {showDiscoveryModal && (
        <EventDiscoveryModal
          onClose={() => setShowDiscoveryModal(false)}
          onImport={handleImportEvent}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        showModal={showDeleteModal}
        itemToDelete={deletingEvent}
        itemType="networking event"
        itemDetails={{
          name: deletingEvent?.name || '',
          subtitle: deletingEvent?.eventDate 
            ? new Date(deletingEvent.eventDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })
            : ''
        }}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingEvent(null);
        }}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default NetworkingEventList;
