import axios from 'axios';
import { trackAPICall, logAPIError } from './apiTrackingService.js';

/**
 * Event Discovery Service using Eventbrite API
 * 
 * NOTE: Eventbrite has deprecated their public event search endpoint.
 * This service now provides mock/example events for demonstration.
 * 
 * Alternative APIs you can use:
 * 1. Meetup.com API: https://www.meetup.com/api/
 * 2. Eventful API: http://api.eventful.com/
 * 3. PredictHQ: https://www.predicthq.com/
 * 
 * Original API Documentation: https://www.eventbrite.com/platform/api
 */

const EVENTBRITE_API_KEY = process.env.EVENTBRITE_API_KEY;
const EVENTBRITE_BASE_URL = 'https://www.eventbriteapi.com/v3';
const USE_MOCK_DATA = true; // Set to true to use mock data instead of API calls

/**
 * Search for events on Eventbrite
 * @param {Object} searchParams - Search parameters
 * @param {string} searchParams.location - Location (city, state, or "online")
 * @param {string} searchParams.q - Search query/keywords
 * @param {string} searchParams.categories - Comma-separated category IDs
 * @param {string} searchParams.startDate - Start date (ISO format)
 * @param {string} searchParams.endDate - End date (ISO format)
 * @param {number} searchParams.page - Page number (default: 1)
 * @returns {Promise<Object>} Search results with events
 */
export const searchEvents = async (searchParams = {}) => {
  // Use mock data since Eventbrite public search is deprecated
  if (USE_MOCK_DATA) {
    return getMockEvents(searchParams);
  }

  if (!EVENTBRITE_API_KEY) {
    throw new Error('Eventbrite API key is not configured. Please add EVENTBRITE_API_KEY to your .env file.');
  }

  try {
    const {
      location = '',
      q = 'networking',
      categories = '',
      startDate = '',
      endDate = '',
      page = 1
    } = searchParams;

    // Build query parameters for Eventbrite API v3
    const params = {
      q, // Search keywords
      'sort_by': 'date',
      page
    };

    // Add location if provided
    if (location && location.toLowerCase() !== 'online') {
      params['location.address'] = location;
      params['location.within'] = '50mi';
    }

    // Add date range
    if (startDate) {
      params['start_date.range_start'] = new Date(startDate).toISOString();
    }
    if (endDate) {
      params['start_date.range_end'] = new Date(endDate).toISOString();
    }

    // Add categories if provided
    if (categories) {
      params.categories = categories;
    }

    // Search for online events if specified
    if (location && location.toLowerCase() === 'online') {
      params['online_events_only'] = true;
    }

    const startTime = Date.now();
    const response = await axios.get(`${EVENTBRITE_BASE_URL}/destination/search/`, {
      params,
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_API_KEY}`
      },
      timeout: 10000
    });

    // Track successful API call
    trackAPICall({
      service: 'eventbrite',
      endpoint: '/destination/search/',
      method: 'GET',
      responseTime: Date.now() - startTime,
      statusCode: 200,
      success: true,
      responseSize: JSON.stringify(response.data || '').length
    }).catch(err => console.error('Eventbrite tracking error:', err.message));

    // Transform Eventbrite events to our format
    const events = response.data?.events?.results || response.data?.results || [];
    const transformedEvents = events.map(event => transformEventbriteEvent(event));

    return {
      success: true,
      events: transformedEvents,
      pagination: {
        page: response.data.pagination?.page_number || page,
        totalPages: response.data.pagination?.page_count || 1,
        totalEvents: response.data.pagination?.object_count || events.length,
        hasMore: response.data.pagination?.has_more_items || false
      }
    };
  } catch (error) {
    // Track failed API call
    logAPIError({
      service: 'eventbrite',
      endpoint: '/destination/search/',
      method: 'GET',
      errorType: error.code || 'UNKNOWN_ERROR',
      errorMessage: error.message,
      statusCode: error.response?.status || 500
    }).catch(err => console.error('Eventbrite error tracking failed:', err.message));

    console.error('Error searching Eventbrite events:', error.response?.data || error.message);
    console.error('API URL attempted:', `${EVENTBRITE_BASE_URL}/destination/search/`);
    console.error('Request params:', error.config?.params);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid Eventbrite API key. Please check your credentials.');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Eventbrite API endpoint not found. The API may have changed. Please contact support.');
    }
    
    throw new Error(error.response?.data?.error_description || 'Failed to search events on Eventbrite');
  }
};

/**
 * Get event categories from Eventbrite
 * @returns {Promise<Array>} List of event categories
 */
export const getEventCategories = async () => {
  if (!EVENTBRITE_API_KEY) {
    // Return default categories if API key is not configured
    return [
      { id: '101', name: 'Business & Professional' },
      { id: '102', name: 'Science & Technology' },
      { id: '103', name: 'Music' },
      { id: '104', name: 'Film, Media & Entertainment' },
      { id: '105', name: 'Performing & Visual Arts' },
      { id: '108', name: 'Sports & Fitness' },
      { id: '110', name: 'Food & Drink' },
      { id: '113', name: 'Community & Culture' },
      { id: '115', name: 'Fashion & Beauty' },
      { id: '116', name: 'Health & Wellness' }
    ];
  }

  try {
    const response = await axios.get(`${EVENTBRITE_BASE_URL}/categories/`, {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_API_KEY}`
      },
      timeout: 5000
    });

    return response.data.categories || [];
  } catch (error) {
    console.error('Error fetching Eventbrite categories:', error.message);
    // Return default categories on error
    return [
      { id: '101', name: 'Business & Professional' },
      { id: '102', name: 'Science & Technology' }
    ];
  }
};

/**
 * Transform Eventbrite event to our internal format
 * @param {Object} eventbriteEvent - Event from Eventbrite API
 * @returns {Object} Transformed event object
 */
const transformEventbriteEvent = (eventbriteEvent) => {
  const isOnline = eventbriteEvent.online_event || false;
  const venue = eventbriteEvent.venue;
  const category = eventbriteEvent.category;
  
  return {
    externalId: eventbriteEvent.id,
    source: 'eventbrite',
    name: eventbriteEvent.name?.text || 'Untitled Event',
    description: eventbriteEvent.description?.text || eventbriteEvent.summary || '',
    eventDate: eventbriteEvent.start?.utc || eventbriteEvent.start?.local,
    endDate: eventbriteEvent.end?.utc || eventbriteEvent.end?.local,
    isVirtual: isOnline,
    location: !isOnline && venue ? formatVenueAddress(venue) : 'Online',
    virtualLink: isOnline ? eventbriteEvent.url : null,
    eventType: mapEventbriteCategory(category?.name),
    industry: category?.name || 'Other',
    organizer: eventbriteEvent.organizer?.name || '',
    website: eventbriteEvent.url,
    cost: eventbriteEvent.is_free ? 0 : null,
    imageUrl: eventbriteEvent.logo?.url || null,
    tags: [category?.name].filter(Boolean)
  };
};

/**
 * Format venue address from Eventbrite venue object
 */
const formatVenueAddress = (venue) => {
  if (!venue) return '';
  
  const parts = [
    venue.name,
    venue.address?.localized_address_display
  ].filter(Boolean);
  
  return parts.join(', ') || 'Location TBD';
};

/**
 * Map Eventbrite category to our event types
 */
const mapEventbriteCategory = (categoryName) => {
  if (!categoryName) return 'Other';
  
  const categoryLower = categoryName.toLowerCase();
  
  if (categoryLower.includes('business') || categoryLower.includes('professional')) {
    return 'Conference';
  }
  if (categoryLower.includes('technology') || categoryLower.includes('science')) {
    return 'Meetup';
  }
  if (categoryLower.includes('community') || categoryLower.includes('networking')) {
    return 'Industry Mixer';
  }
  if (categoryLower.includes('workshop') || categoryLower.includes('class')) {
    return 'Workshop';
  }
  if (categoryLower.includes('career') || categoryLower.includes('job')) {
    return 'Career Fair';
  }
  
  return 'Other';
};

/**
 * Generate mock networking events for demonstration
 * (Since Eventbrite public search API is deprecated)
 */
const getMockEvents = async (searchParams = {}) => {
  const { location = '', q = 'networking', page = 1 } = searchParams;
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockEvents = [
    {
      externalId: 'mock-1',
      source: 'demo',
      name: 'Tech Networking Mixer 2025',
      description: 'Join us for an evening of networking with tech professionals, entrepreneurs, and industry leaders. Great opportunity to expand your professional network!',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      isVirtual: false,
      location: location || 'New York, NY',
      virtualLink: null,
      eventType: 'Industry Mixer',
      industry: 'Technology',
      organizer: 'TechConnect Events',
      website: 'https://example.com/event1',
      cost: 0,
      imageUrl: null,
      tags: ['Technology', 'Networking']
    },
    {
      externalId: 'mock-2',
      source: 'demo',
      name: 'Business Professional Networking Event',
      description: 'Connect with local business professionals in various industries. Perfect for building relationships and exploring collaboration opportunities.',
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      isVirtual: false,
      location: location || 'San Francisco, CA',
      virtualLink: null,
      eventType: 'Conference',
      industry: 'Business & Professional',
      organizer: 'Business Network International',
      website: 'https://example.com/event2',
      cost: 25,
      imageUrl: null,
      tags: ['Business', 'Professional Development']
    },
    {
      externalId: 'mock-3',
      source: 'demo',
      name: 'Virtual Career Fair & Networking',
      description: 'Online career fair featuring top employers and networking opportunities. Connect with recruiters and fellow job seekers from the comfort of your home.',
      eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      isVirtual: true,
      location: 'Online',
      virtualLink: 'https://example.com/virtual-event',
      eventType: 'Career Fair',
      industry: 'Multiple Industries',
      organizer: 'Virtual Events Co',
      website: 'https://example.com/event3',
      cost: 0,
      imageUrl: null,
      tags: ['Career', 'Job Search', 'Virtual']
    },
    {
      externalId: 'mock-4',
      source: 'demo',
      name: 'Women in Tech Networking Meetup',
      description: 'Monthly meetup for women in technology to network, share experiences, and support each other in their career journeys.',
      eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      isVirtual: false,
      location: location || 'Austin, TX',
      virtualLink: null,
      eventType: 'Meetup',
      industry: 'Technology',
      organizer: 'Women Who Code',
      website: 'https://example.com/event4',
      cost: 0,
      imageUrl: null,
      tags: ['Technology', 'Diversity', 'Women in Tech']
    },
    {
      externalId: 'mock-5',
      source: 'demo',
      name: 'Startup Founders Networking Night',
      description: 'Network with fellow entrepreneurs, startup founders, and investors. Share ideas, find co-founders, and learn from experienced founders.',
      eventDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      isVirtual: false,
      location: location || 'Boston, MA',
      virtualLink: null,
      eventType: 'Social Event',
      industry: 'Entrepreneurship',
      organizer: 'Startup Grind',
      website: 'https://example.com/event5',
      cost: 15,
      imageUrl: null,
      tags: ['Startups', 'Entrepreneurship', 'Founders']
    },
    {
      externalId: 'mock-6',
      source: 'demo',
      name: 'Data Science & AI Networking Workshop',
      description: 'Workshop and networking event for data scientists, ML engineers, and AI enthusiasts. Learn about latest trends and connect with peers.',
      eventDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      isVirtual: true,
      location: 'Online',
      virtualLink: 'https://example.com/ai-workshop',
      eventType: 'Workshop',
      industry: 'Data Science',
      organizer: 'AI & ML Community',
      website: 'https://example.com/event6',
      cost: 0,
      imageUrl: null,
      tags: ['Data Science', 'AI', 'Machine Learning']
    }
  ];

  // Filter by search query
  let filteredEvents = mockEvents;
  if (q && q.toLowerCase() !== 'networking') {
    filteredEvents = mockEvents.filter(event =>
      event.name.toLowerCase().includes(q.toLowerCase()) ||
      event.description.toLowerCase().includes(q.toLowerCase()) ||
      event.industry.toLowerCase().includes(q.toLowerCase()) ||
      event.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase()))
    );
  }

  // Simple pagination
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedEvents = filteredEvents.slice(start, end);

  return {
    success: true,
    events: paginatedEvents,
    pagination: {
      page,
      totalPages: Math.ceil(filteredEvents.length / pageSize),
      totalEvents: filteredEvents.length,
      hasMore: end < filteredEvents.length
    }
  };
};

export default {
  searchEvents,
  getEventCategories
};
