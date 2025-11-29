import { jest, beforeEach, afterEach, describe, it, expect } from '@jest/globals';

// Mock axios
const mockAxiosGet = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: {
    get: mockAxiosGet,
  },
}));

// Import after mocking
const { searchEvents, getEventCategories } = await import('../eventDiscoveryService.js');

describe('eventDiscoveryService - Full Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchEvents - API Mode Tests', () => {
    // Note: USE_MOCK_DATA is true by default, so these test the mock path
    
    it('should return mock events with default parameters', async () => {
      const result = await searchEvents();

      expect(result.success).toBe(true);
      expect(result.events).toBeInstanceOf(Array);
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
    });

    it('should filter events by search query', async () => {
      const result = await searchEvents({ q: 'Women in Tech' });

      expect(result.success).toBe(true);
      // Should return at least the Women in Tech event
      expect(result.events.some(e => e.name.includes('Women in Tech'))).toBe(true);
    });

    it('should filter events by industry keyword', async () => {
      const result = await searchEvents({ q: 'Data Science' });

      expect(result.success).toBe(true);
      expect(result.events.some(e => 
        e.industry.includes('Data Science') || 
        e.tags.some(t => t.includes('Data Science'))
      )).toBe(true);
    });

    it('should filter events by description keyword', async () => {
      const result = await searchEvents({ q: 'startup' });

      expect(result.success).toBe(true);
      expect(result.events.some(e => 
        e.description.toLowerCase().includes('startup')
      )).toBe(true);
    });

    it('should filter events by tags', async () => {
      const result = await searchEvents({ q: 'AI' });

      expect(result.success).toBe(true);
      expect(result.events.some(e => 
        e.tags.some(t => t.includes('AI'))
      )).toBe(true);
    });

    it('should use location parameter', async () => {
      const result = await searchEvents({ location: 'Chicago, IL' });

      expect(result.success).toBe(true);
      expect(result.events).toBeInstanceOf(Array);
      // Events should use the provided location
      expect(result.events.some(e => e.location === 'Chicago, IL' || e.location === 'Online')).toBe(true);
    });

    it('should handle pagination', async () => {
      const result = await searchEvents({ page: 1 });

      expect(result.success).toBe(true);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBeGreaterThanOrEqual(1);
      expect(result.pagination.totalEvents).toBeGreaterThan(0);
      expect(typeof result.pagination.hasMore).toBe('boolean');
    });

    it('should return empty for unmatched query', async () => {
      const result = await searchEvents({ q: 'xyznonexistent12345' });

      expect(result.success).toBe(true);
      expect(result.events).toEqual([]);
    });

    it('should handle empty search parameters', async () => {
      const result = await searchEvents({});

      expect(result.success).toBe(true);
      expect(result.events).toBeInstanceOf(Array);
    });

    it('should include all required event fields', async () => {
      const result = await searchEvents();

      expect(result.success).toBe(true);
      const event = result.events[0];
      expect(event.externalId).toBeDefined();
      expect(event.source).toBe('demo');
      expect(event.name).toBeDefined();
      expect(event.description).toBeDefined();
      expect(event.eventDate).toBeDefined();
      expect(event.endDate).toBeDefined();
      expect(typeof event.isVirtual).toBe('boolean');
      expect(event.location).toBeDefined();
      expect(event.eventType).toBeDefined();
      expect(event.industry).toBeDefined();
      expect(event.organizer).toBeDefined();
      expect(event.website).toBeDefined();
      expect(event.tags).toBeInstanceOf(Array);
    });

    it('should return virtual events', async () => {
      const result = await searchEvents({ q: 'Virtual' });

      expect(result.success).toBe(true);
      expect(result.events.some(e => e.isVirtual === true)).toBe(true);
    });

    it('should return in-person events', async () => {
      const result = await searchEvents();

      expect(result.success).toBe(true);
      expect(result.events.some(e => e.isVirtual === false)).toBe(true);
    });

    it('should include event types', async () => {
      const result = await searchEvents();

      const eventTypes = new Set(result.events.map(e => e.eventType));
      expect(eventTypes.size).toBeGreaterThan(0);
    });

    it('should return events from demo source', async () => {
      const result = await searchEvents();

      expect(result.events.every(e => e.source === 'demo')).toBe(true);
    });
  });

  describe('getEventCategories', () => {
    it('should return categories array when no API key', async () => {
      const result = await getEventCategories();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should have id and name for each category', async () => {
      const result = await getEventCategories();

      result.forEach(category => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
      });
    });

    it('should include Business category', async () => {
      const result = await getEventCategories();

      expect(result.some(c => c.name.includes('Business'))).toBe(true);
    });

    it('should include Technology category', async () => {
      const result = await getEventCategories();

      expect(result.some(c => c.name.includes('Technology'))).toBe(true);
    });

    it('should include Professional category', async () => {
      const result = await getEventCategories();

      expect(result.some(c => c.name.includes('Professional'))).toBe(true);
    });

    it('should return default categories list', async () => {
      const result = await getEventCategories();

      // Should have at least several categories
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Event Dates', () => {
    it('should return future events', async () => {
      const result = await searchEvents();
      const now = new Date();

      result.events.forEach(event => {
        const eventDate = new Date(event.eventDate);
        expect(eventDate.getTime()).toBeGreaterThan(now.getTime());
      });
    });

    it('should have end dates after start dates', async () => {
      const result = await searchEvents();

      result.events.forEach(event => {
        const startDate = new Date(event.eventDate);
        const endDate = new Date(event.endDate);
        expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
      });
    });
  });

  describe('Event Filtering', () => {
    it('should case-insensitive search', async () => {
      const result1 = await searchEvents({ q: 'WOMEN' });
      const result2 = await searchEvents({ q: 'women' });

      expect(result1.events.length).toBe(result2.events.length);
    });

    it('should match partial words', async () => {
      const result = await searchEvents({ q: 'tech' });

      expect(result.success).toBe(true);
      expect(result.events.length).toBeGreaterThan(0);
    });

    it('should return all events when query is networking', async () => {
      const result = await searchEvents({ q: 'networking' });

      expect(result.success).toBe(true);
      // 'networking' is the default, so returns all events
      expect(result.events.length).toBeGreaterThan(0);
    });
  });

  describe('Pagination Logic', () => {
    it('should calculate totalPages correctly', async () => {
      const result = await searchEvents();

      const expectedPages = Math.ceil(result.pagination.totalEvents / 10);
      expect(result.pagination.totalPages).toBe(expectedPages);
    });

    it('should set hasMore correctly', async () => {
      const result = await searchEvents();

      // With 6 mock events and page size 10, hasMore should be false
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should return empty for out of range page', async () => {
      const result = await searchEvents({ page: 100 });

      expect(result.events).toEqual([]);
    });
  });

  describe('Mock Events Structure', () => {
    it('should have varied event types', async () => {
      const result = await searchEvents();
      
      const types = new Set(result.events.map(e => e.eventType));
      expect(types.size).toBeGreaterThanOrEqual(3);
    });

    it('should have both free and paid events', async () => {
      const result = await searchEvents();
      
      const freeEvents = result.events.filter(e => e.cost === 0);
      const paidEvents = result.events.filter(e => e.cost > 0);
      
      expect(freeEvents.length).toBeGreaterThan(0);
      expect(paidEvents.length).toBeGreaterThan(0);
    });

    it('should have varied industries', async () => {
      const result = await searchEvents();
      
      const industries = new Set(result.events.map(e => e.industry));
      expect(industries.size).toBeGreaterThanOrEqual(3);
    });

    it('should have unique external IDs', async () => {
      const result = await searchEvents();
      
      const ids = result.events.map(e => e.externalId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have organizers for all events', async () => {
      const result = await searchEvents();
      
      result.events.forEach(event => {
        expect(event.organizer).toBeTruthy();
      });
    });

    it('should have websites for all events', async () => {
      const result = await searchEvents();
      
      result.events.forEach(event => {
        expect(event.website).toMatch(/^https?:\/\//);
      });
    });
  });

  describe('Virtual Events', () => {
    it('should have virtualLink for virtual events', async () => {
      const result = await searchEvents();
      
      const virtualEvents = result.events.filter(e => e.isVirtual);
      virtualEvents.forEach(event => {
        expect(event.virtualLink).toBeTruthy();
        expect(event.location).toBe('Online');
      });
    });

    it('should not have virtualLink for in-person events', async () => {
      const result = await searchEvents();
      
      const inPersonEvents = result.events.filter(e => !e.isVirtual);
      inPersonEvents.forEach(event => {
        expect(event.virtualLink).toBeNull();
      });
    });
  });
});
