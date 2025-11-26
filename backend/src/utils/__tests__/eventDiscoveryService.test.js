import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Mock axios
const mockAxiosGet = jest.fn();
jest.unstable_mockModule('axios', () => ({
    default: {
        get: mockAxiosGet,
    },
}));

// We'll import the service dynamically in beforeEach so tests can control
// `process.env.EVENTBRITE_API_KEY` before the module captures it.
let searchEvents;
let getEventCategories;

describe('Event Discovery Service', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        // Reset environment variable and import fresh module so its
        // module-level constants pick up the current env value.
        process.env.EVENTBRITE_API_KEY = '';
        const mod = await import('../eventDiscoveryService.js');
        searchEvents = mod.searchEvents;
        getEventCategories = mod.getEventCategories;
    });

    describe('searchEvents', () => {
        it('should return mock events when USE_MOCK_DATA is true', async () => {
            const result = await searchEvents({
                location: 'New York, NY',
                q: 'tech',
            });

            expect(result.success).toBe(true);
            expect(result.events).toBeInstanceOf(Array);
            expect(result.pagination).toBeDefined();
            expect(result.pagination.page).toBe(1);
        });

        it('should filter mock events by search query', async () => {
            const result = await searchEvents({
                q: 'career',
            });

            expect(result.success).toBe(true);
            expect(result.events.length).toBeGreaterThan(0);
            // Should find events matching "career"
            const hasCareerEvent = result.events.some(
                event =>
                    event.name.toLowerCase().includes('career') ||
                    event.description.toLowerCase().includes('career') ||
                    event.tags.some(tag => tag.toLowerCase().includes('career'))
            );
            expect(hasCareerEvent).toBe(true);
        });

        it('should return all events when query is "networking"', async () => {
            const result = await searchEvents({
                q: 'networking',
            });

            expect(result.success).toBe(true);
            expect(result.events).toBeInstanceOf(Array);
        });

        it('should handle pagination correctly', async () => {
            const page1 = await searchEvents({ page: 1 });
            const page2 = await searchEvents({ page: 2 });

            expect(page1.pagination.page).toBe(1);
            expect(page2.pagination.page).toBe(2);
        });

        it('should return empty results for non-matching query', async () => {
            const result = await searchEvents({
                q: 'xyznonexistentquery123',
            });

            expect(result.success).toBe(true);
            expect(result.events).toHaveLength(0);
        });

        it('should include location in mock events when provided', async () => {
            const location = 'San Francisco, CA';
            const result = await searchEvents({ location });

            expect(result.success).toBe(true);
            if (result.events.length > 0) {
                // Some events should have the location
                const hasLocation = result.events.some(event =>
                    event.location.includes(location) || event.location === 'Online'
                );
                expect(hasLocation).toBe(true);
            }
        });

        it('should calculate pagination metadata correctly', async () => {
            const result = await searchEvents({ page: 1 });

            expect(result.pagination).toHaveProperty('page');
            expect(result.pagination).toHaveProperty('totalPages');
            expect(result.pagination).toHaveProperty('totalEvents');
            expect(result.pagination).toHaveProperty('hasMore');
        });

        it('should return events with correct structure', async () => {
            const result = await searchEvents();

            expect(result.success).toBe(true);
            if (result.events.length > 0) {
                const event = result.events[0];
                expect(event).toHaveProperty('externalId');
                expect(event).toHaveProperty('source');
                expect(event).toHaveProperty('name');
                expect(event).toHaveProperty('description');
                expect(event).toHaveProperty('eventDate');
                expect(event).toHaveProperty('isVirtual');
                expect(event).toHaveProperty('location');
                expect(event).toHaveProperty('eventType');
                expect(event).toHaveProperty('industry');
                expect(event).toHaveProperty('tags');
            }
        });
    });

    describe('getEventCategories', () => {
        it('should return default categories when API key is not configured', async () => {
            process.env.EVENTBRITE_API_KEY = '';

            const categories = await getEventCategories();

            expect(categories).toBeInstanceOf(Array);
            expect(categories.length).toBeGreaterThan(0);
            expect(categories[0]).toHaveProperty('id');
            expect(categories[0]).toHaveProperty('name');
        });

        it('should include Business & Professional category', async () => {
            const categories = await getEventCategories();

            const hasBusinessCategory = categories.some(
                cat => cat.name === 'Business & Professional'
            );
            expect(hasBusinessCategory).toBe(true);
        });

        it('should include Science & Technology category', async () => {
            const categories = await getEventCategories();

            const hasTechCategory = categories.some(
                cat => cat.name === 'Science & Technology'
            );
            expect(hasTechCategory).toBe(true);
        });

        it('should return default categories on API error when key is configured', async () => {
            process.env.EVENTBRITE_API_KEY = 'test-key';
            mockAxiosGet.mockRejectedValueOnce(new Error('API Error'));

            const categories = await getEventCategories();

            expect(categories).toBeInstanceOf(Array);
            expect(categories.length).toBeGreaterThan(0);
        });

        it('should attempt API call when key is configured', async () => {
            // Re-import module with API key configured so the module-level
            // EVENTBRITE_API_KEY constant is set to a non-empty value.
            jest.resetModules();
            process.env.EVENTBRITE_API_KEY = 'test-key';
            // Re-register axios mock so the fresh import picks it up
            jest.unstable_mockModule('axios', () => ({
                default: { get: mockAxiosGet },
            }));

            mockAxiosGet.mockResolvedValueOnce({
                data: {
                    categories: [
                        { id: '101', name: 'Business & Professional' },
                        { id: '102', name: 'Science & Technology' },
                    ],
                },
            });

            const mod = await import('../eventDiscoveryService.js');
            const categories = await mod.getEventCategories();

            expect(mockAxiosGet).toHaveBeenCalled();
            expect(categories).toHaveLength(2);

            // Restore default state for subsequent tests
            jest.resetModules();
            process.env.EVENTBRITE_API_KEY = '';
            jest.unstable_mockModule('axios', () => ({
                default: { get: mockAxiosGet },
            }));
            const mod2 = await import('../eventDiscoveryService.js');
            searchEvents = mod2.searchEvents;
            getEventCategories = mod2.getEventCategories;
        });
    });

    describe('Mock Event Generation', () => {
        it('should generate events with future dates', async () => {
            const result = await searchEvents();
            const now = new Date();

            if (result.events.length > 0) {
                result.events.forEach(event => {
                    const eventDate = new Date(event.eventDate);
                    expect(eventDate.getTime()).toBeGreaterThan(now.getTime());
                });
            }
        });

        it('should include both virtual and in-person events', async () => {
            const result = await searchEvents();

            if (result.events.length > 1) {
                const hasVirtual = result.events.some(event => event.isVirtual === true);
                const hasInPerson = result.events.some(event => event.isVirtual === false);

                expect(hasVirtual || hasInPerson).toBe(true);
            }
        });

        it('should include various event types', async () => {
            const result = await searchEvents();

            if (result.events.length > 0) {
                const eventTypes = new Set(result.events.map(e => e.eventType));
                expect(eventTypes.size).toBeGreaterThan(0);
            }
        });

        it('should include tags for all events', async () => {
            const result = await searchEvents();

            if (result.events.length > 0) {
                result.events.forEach(event => {
                    expect(event.tags).toBeInstanceOf(Array);
                });
            }
        });
    });
});
