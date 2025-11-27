import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Mock the contactDiscoveryService
const mockDiscoverContacts = jest.fn();
const mockGetDiscoveryFilters = jest.fn();
const mockGetSuggestedContacts = jest.fn();

jest.unstable_mockModule('../contactDiscoveryService.js', () => ({
  discoverContacts: mockDiscoverContacts,
  getDiscoveryFilters: mockGetDiscoveryFilters,
  getSuggestedContacts: mockGetSuggestedContacts
}));

describe('ContactDiscoveryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('discoverContacts', () => {
    it('should return discovered contacts with pagination', async () => {
      const { discoverContacts } = await import('../contactDiscoveryService.js');
      
      const result = await discoverContacts({
        industry: 'Technology',
        page: 1,
        limit: 12
      });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('totalPages');
      expect(result.pagination).toHaveProperty('totalContacts');
    });

    it('should filter contacts by industry', async () => {
      const { discoverContacts } = await import('../contactDiscoveryService.js');
      
      const result = await discoverContacts({
        industry: 'Finance',
        page: 1,
        limit: 12
      });

      expect(result.success).toBe(true);
      // All contacts should be from Finance industry
      result.data.forEach(contact => {
        expect(contact.industry).toBe('Finance');
      });
    });

    it('should filter contacts by connection type', async () => {
      const { discoverContacts } = await import('../contactDiscoveryService.js');
      
      const result = await discoverContacts({
        connectionType: 'Alumni',
        page: 1,
        limit: 12
      });

      expect(result.success).toBe(true);
      result.data.forEach(contact => {
        expect(contact.connectionType).toBe('Alumni');
      });
    });

    it('should filter contacts by search query', async () => {
      const { discoverContacts } = await import('../contactDiscoveryService.js');
      
      const result = await discoverContacts({
        q: 'Google',
        page: 1,
        limit: 12
      });

      expect(result.success).toBe(true);
      // Contacts should match the search query
      result.data.forEach(contact => {
        const matchesQuery = 
          contact.fullName.toLowerCase().includes('google') ||
          contact.company.toLowerCase().includes('google') ||
          contact.jobTitle.toLowerCase().includes('google') ||
          contact.industry.toLowerCase().includes('google') ||
          contact.interests.some(i => i.toLowerCase().includes('google'));
        expect(matchesQuery).toBe(true);
      });
    });

    it('should return proper contact structure', async () => {
      const { discoverContacts } = await import('../contactDiscoveryService.js');
      
      const result = await discoverContacts({ page: 1, limit: 1 });

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      const contact = result.data[0];
      expect(contact).toHaveProperty('id');
      expect(contact).toHaveProperty('firstName');
      expect(contact).toHaveProperty('lastName');
      expect(contact).toHaveProperty('fullName');
      expect(contact).toHaveProperty('company');
      expect(contact).toHaveProperty('jobTitle');
      expect(contact).toHaveProperty('industry');
      expect(contact).toHaveProperty('location');
      expect(contact).toHaveProperty('connectionType');
      expect(contact).toHaveProperty('connectionDescription');
      expect(contact).toHaveProperty('mutualConnections');
      expect(contact).toHaveProperty('matchScore');
      expect(contact).toHaveProperty('suggestedOutreach');
    });

    it('should sort contacts by match score', async () => {
      const { discoverContacts } = await import('../contactDiscoveryService.js');
      
      const result = await discoverContacts({ page: 1, limit: 12 });

      expect(result.success).toBe(true);
      
      // Verify contacts are sorted by matchScore descending
      for (let i = 0; i < result.data.length - 1; i++) {
        expect(result.data[i].matchScore).toBeGreaterThanOrEqual(result.data[i + 1].matchScore);
      }
    });

    it('should handle pagination correctly', async () => {
      const { discoverContacts } = await import('../contactDiscoveryService.js');
      
      const page1 = await discoverContacts({ page: 1, limit: 5 });
      const page2 = await discoverContacts({ page: 2, limit: 5 });

      expect(page1.pagination.page).toBe(1);
      expect(page2.pagination.page).toBe(2);
      
      // Page 1 and 2 should have different contacts
      const page1Ids = page1.data.map(c => c.id);
      const page2Ids = page2.data.map(c => c.id);
      
      page2Ids.forEach(id => {
        expect(page1Ids).not.toContain(id);
      });
    });
  });

  describe('getDiscoveryFilters', () => {
    it('should return available filter options', async () => {
      const { getDiscoveryFilters } = await import('../contactDiscoveryService.js');
      
      const result = await getDiscoveryFilters();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('industries');
      expect(result.data).toHaveProperty('connectionTypes');
      expect(result.data).toHaveProperty('universities');
      expect(result.data).toHaveProperty('locations');
      expect(result.data).toHaveProperty('diversityGroups');
    });

    it('should return arrays for all filter types', async () => {
      const { getDiscoveryFilters } = await import('../contactDiscoveryService.js');
      
      const result = await getDiscoveryFilters();

      expect(Array.isArray(result.data.industries)).toBe(true);
      expect(Array.isArray(result.data.connectionTypes)).toBe(true);
      expect(Array.isArray(result.data.universities)).toBe(true);
      expect(Array.isArray(result.data.locations)).toBe(true);
      expect(Array.isArray(result.data.diversityGroups)).toBe(true);
    });

    it('should include expected industries', async () => {
      const { getDiscoveryFilters } = await import('../contactDiscoveryService.js');
      
      const result = await getDiscoveryFilters();

      expect(result.data.industries).toContain('Technology');
      expect(result.data.industries).toContain('Finance');
      expect(result.data.industries).toContain('Healthcare');
      expect(result.data.industries).toContain('Consulting');
    });

    it('should include connection type descriptions', async () => {
      const { getDiscoveryFilters } = await import('../contactDiscoveryService.js');
      
      const result = await getDiscoveryFilters();

      result.data.connectionTypes.forEach(ct => {
        expect(ct).toHaveProperty('type');
        expect(ct).toHaveProperty('description');
      });
    });
  });

  describe('getSuggestedContacts', () => {
    it('should return personalized suggestions', async () => {
      const { getSuggestedContacts } = await import('../contactDiscoveryService.js');
      
      const result = await getSuggestedContacts({
        targetCompanies: ['Google', 'Microsoft'],
        targetIndustries: ['Technology'],
        targetRoles: ['Software Engineer'],
        university: 'MIT'
      });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('categories');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return category breakdown', async () => {
      const { getSuggestedContacts } = await import('../contactDiscoveryService.js');
      
      const result = await getSuggestedContacts({
        targetCompanies: ['Google'],
        targetIndustries: ['Technology'],
        university: 'Stanford University'
      });

      expect(Array.isArray(result.categories)).toBe(true);
      result.categories.forEach(cat => {
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('count');
      });
    });

    it('should include alumni suggestions when university is provided', async () => {
      const { getSuggestedContacts } = await import('../contactDiscoveryService.js');
      
      const result = await getSuggestedContacts({
        targetCompanies: [],
        targetIndustries: [],
        university: 'NJIT'
      });

      expect(result.success).toBe(true);
      
      // Should have alumni connections
      const alumniContacts = result.data.filter(c => c.connectionType === 'Alumni');
      expect(alumniContacts.length).toBeGreaterThan(0);
    });

    it('should include diversity network suggestions', async () => {
      const { getSuggestedContacts } = await import('../contactDiscoveryService.js');
      
      const result = await getSuggestedContacts({
        targetCompanies: [],
        targetIndustries: []
      });

      expect(result.success).toBe(true);
      
      // Should have diversity network connections
      const diversityContacts = result.data.filter(c => c.connectionType === 'Diversity Network');
      expect(diversityContacts.length).toBeGreaterThan(0);
    });

    it('should limit suggestions to 12', async () => {
      const { getSuggestedContacts } = await import('../contactDiscoveryService.js');
      
      const result = await getSuggestedContacts({
        targetCompanies: ['Google', 'Microsoft', 'Apple', 'Amazon'],
        targetIndustries: ['Technology', 'Finance'],
        university: 'MIT'
      });

      expect(result.data.length).toBeLessThanOrEqual(12);
    });
  });

  describe('Contact data quality', () => {
    it('should generate valid email format', async () => {
      const { discoverContacts } = await import('../contactDiscoveryService.js');
      
      const result = await discoverContacts({ page: 1, limit: 10 });

      result.data.forEach(contact => {
        expect(contact.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('should generate valid LinkedIn URLs', async () => {
      const { discoverContacts } = await import('../contactDiscoveryService.js');
      
      const result = await discoverContacts({ page: 1, limit: 10 });

      result.data.forEach(contact => {
        expect(contact.linkedInUrl).toMatch(/^https:\/\/linkedin\.com\/in\/.+$/);
      });
    });

    it('should have match scores between 60 and 100', async () => {
      const { discoverContacts } = await import('../contactDiscoveryService.js');
      
      const result = await discoverContacts({ page: 1, limit: 20 });

      result.data.forEach(contact => {
        expect(contact.matchScore).toBeGreaterThanOrEqual(60);
        expect(contact.matchScore).toBeLessThanOrEqual(100);
      });
    });

    it('should have years experience between 2 and 22', async () => {
      const { discoverContacts } = await import('../contactDiscoveryService.js');
      
      const result = await discoverContacts({ page: 1, limit: 20 });

      result.data.forEach(contact => {
        expect(contact.yearsExperience).toBeGreaterThanOrEqual(2);
        expect(contact.yearsExperience).toBeLessThanOrEqual(22);
      });
    });

    it('should have at least 2 interests', async () => {
      const { discoverContacts } = await import('../contactDiscoveryService.js');
      
      const result = await discoverContacts({ page: 1, limit: 10 });

      result.data.forEach(contact => {
        expect(contact.interests.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
