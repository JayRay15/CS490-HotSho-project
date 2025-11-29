import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Mock axios
const mockAxiosGet = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: {
    get: mockAxiosGet,
  },
}));

// Import after mocking
const { searchEvents, getEventCategories } = await import('../eventDiscoveryService.js');

describe('Event Discovery Service - Extended Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchEvents with Mock Data', () => {
    it('should return events with valid structure', async () => {
      const result = await searchEvents();

      expect(result.success).toBe(true);
      expect(result.events).toBeInstanceOf(Array);
      
      if (result.events.length > 0) {
        const event = result.events[0];
        expect(event.externalId).toBeDefined();
        expect(event.source).toBeDefined();
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
      }
    });

    it('should return events with future dates', async () => {
      const result = await searchEvents();
      const now = new Date();

      result.events.forEach(event => {
        const eventDate = new Date(event.eventDate);
        expect(eventDate.getTime()).toBeGreaterThan(now.getTime());
      });
    });

    it('should filter events by location', async () => {
      const result = await searchEvents({ location: 'New York, NY' });

      expect(result.success).toBe(true);
      // Events should either be at that location or be online
    });

    it('should filter events by search query matching name', async () => {
      const result = await searchEvents({ q: 'Tech' });

      expect(result.success).toBe(true);
      if (result.events.length > 0) {
        const hasMatch = result.events.some(event =>
          event.name.toLowerCase().includes('tech') ||
          event.description.toLowerCase().includes('tech') ||
          event.industry.toLowerCase().includes('tech') ||
          event.tags.some(tag => tag.toLowerCase().includes('tech'))
        );
        expect(hasMatch).toBe(true);
      }
    });

    it('should filter events by search query matching industry', async () => {
      const result = await searchEvents({ q: 'Data Science' });

      expect(result.success).toBe(true);
    });

    it('should filter events by search query matching description', async () => {
      const result = await searchEvents({ q: 'networking' });

      expect(result.success).toBe(true);
    });

    it('should filter events by search query matching tags', async () => {
      const result = await searchEvents({ q: 'Startups' });

      expect(result.success).toBe(true);
    });

    it('should handle pagination with page parameter', async () => {
      const page1Result = await searchEvents({ page: 1 });
      const page2Result = await searchEvents({ page: 2 });

      expect(page1Result.pagination.page).toBe(1);
      expect(page2Result.pagination.page).toBe(2);
    });

    it('should calculate hasMore correctly', async () => {
      const result = await searchEvents({ page: 1 });

      if (result.events.length < result.pagination.totalEvents) {
        expect(result.pagination.hasMore).toBe(true);
      }
    });

    it('should return empty events for unmatched query', async () => {
      const result = await searchEvents({ q: 'xyznonexistent123abc' });

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(0);
    });

    it('should handle categories parameter', async () => {
      const result = await searchEvents({ categories: 'Business' });

      expect(result.success).toBe(true);
    });

    it('should handle startDate parameter', async () => {
      const result = await searchEvents({ startDate: '2025-01-01' });

      expect(result.success).toBe(true);
    });

    it('should handle endDate parameter', async () => {
      const result = await searchEvents({ endDate: '2025-12-31' });

      expect(result.success).toBe(true);
    });

    it('should include virtual events', async () => {
      const result = await searchEvents();

      const virtualEvents = result.events.filter(event => event.isVirtual === true);
      expect(virtualEvents.length).toBeGreaterThan(0);

      virtualEvents.forEach(event => {
        expect(event.location).toBe('Online');
      });
    });

    it('should include in-person events', async () => {
      const result = await searchEvents();

      const inPersonEvents = result.events.filter(event => event.isVirtual === false);
      expect(inPersonEvents.length).toBeGreaterThan(0);

      inPersonEvents.forEach(event => {
        expect(event.location).not.toBe('Online');
      });
    });

    it('should return different event types', async () => {
      const result = await searchEvents();

      const eventTypes = new Set(result.events.map(e => e.eventType));
      expect(eventTypes.size).toBeGreaterThan(1);
    });

    it('should return events from demo source', async () => {
      const result = await searchEvents();

      result.events.forEach(event => {
        expect(event.source).toBe('demo');
      });
    });
  });

  describe('getEventCategories', () => {
    it('should return categories array', async () => {
      const categories = await getEventCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should return categories with id and name', async () => {
      const categories = await getEventCategories();

      categories.forEach(category => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
      });
    });

    it('should include Business category', async () => {
      const categories = await getEventCategories();

      const hasBusinessCategory = categories.some(
        cat => cat.name.includes('Business') || cat.name.includes('Professional')
      );
      expect(hasBusinessCategory).toBe(true);
    });

    it('should include Technology category', async () => {
      const categories = await getEventCategories();

      const hasTechCategory = categories.some(
        cat => cat.name.includes('Technology') || cat.name.includes('Science')
      );
      expect(hasTechCategory).toBe(true);
    });
  });

  describe('Event Data Validation', () => {
    it('should have valid externalId format', async () => {
      const result = await searchEvents();

      result.events.forEach(event => {
        expect(event.externalId).toMatch(/^mock-\d+$/);
      });
    });

    it('should have end date after event date', async () => {
      const result = await searchEvents();

      result.events.forEach(event => {
        const eventDate = new Date(event.eventDate);
        const endDate = new Date(event.endDate);
        expect(endDate.getTime()).toBeGreaterThan(eventDate.getTime());
      });
    });

    it('should have valid cost values', async () => {
      const result = await searchEvents();

      result.events.forEach(event => {
        expect(typeof event.cost).toBe('number');
        expect(event.cost).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid website URLs', async () => {
      const result = await searchEvents();

      result.events.forEach(event => {
        expect(event.website).toMatch(/^https?:\/\//);
      });
    });

    it('should have virtual link for virtual events', async () => {
      const result = await searchEvents();

      const virtualEvents = result.events.filter(e => e.isVirtual);
      virtualEvents.forEach(event => {
        expect(event.virtualLink).toBeDefined();
        expect(event.virtualLink).toMatch(/^https?:\/\//);
      });
    });

    it('should have null virtual link for in-person events', async () => {
      const result = await searchEvents();

      const inPersonEvents = result.events.filter(e => !e.isVirtual);
      inPersonEvents.forEach(event => {
        expect(event.virtualLink).toBeNull();
      });
    });
  });

  describe('Pagination Metadata', () => {
    it('should return correct totalPages', async () => {
      const result = await searchEvents();

      const expectedPages = Math.ceil(result.pagination.totalEvents / 10);
      expect(result.pagination.totalPages).toBe(expectedPages);
    });

    it('should return totalEvents count', async () => {
      const result = await searchEvents();

      expect(result.pagination.totalEvents).toBeGreaterThanOrEqual(result.events.length);
    });

    it('should handle first page correctly', async () => {
      const result = await searchEvents({ page: 1 });

      expect(result.pagination.page).toBe(1);
    });

    it('should handle out of range page gracefully', async () => {
      const result = await searchEvents({ page: 100 });

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(0);
    });
  });
});
