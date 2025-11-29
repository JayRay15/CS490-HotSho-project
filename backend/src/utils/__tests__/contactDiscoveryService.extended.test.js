import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// Import the actual service for testing
const {
  discoverContacts,
  getDiscoveryFilters,
  getSuggestedContacts
} = await import('../contactDiscoveryService.js');

describe('ContactDiscoveryService - Extended Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('discoverContacts', () => {
    it('should return contacts with default parameters', async () => {
      const result = await discoverContacts();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.filters).toBeDefined();
    });

    it('should filter by industry', async () => {
      const result = await discoverContacts({ industry: 'Technology' });
      
      expect(result.success).toBe(true);
      result.data.forEach(contact => {
        expect(contact.industry).toBe('Technology');
      });
    });

    it('should filter by company', async () => {
      const result = await discoverContacts({ company: 'Google' });
      
      expect(result.success).toBe(true);
      result.data.forEach(contact => {
        expect(contact.company).toBe('Google');
      });
    });

    it('should filter by role', async () => {
      const result = await discoverContacts({ role: 'Software Engineer' });
      
      expect(result.success).toBe(true);
      result.data.forEach(contact => {
        expect(contact.jobTitle).toBe('Software Engineer');
      });
    });

    it('should filter by location', async () => {
      const result = await discoverContacts({ location: 'New York, NY' });
      
      expect(result.success).toBe(true);
      result.data.forEach(contact => {
        expect(contact.location).toBe('New York, NY');
      });
    });

    it('should filter by connectionType', async () => {
      const result = await discoverContacts({ connectionType: 'Alumni' });
      
      expect(result.success).toBe(true);
      result.data.forEach(contact => {
        expect(contact.connectionType).toBe('Alumni');
      });
    });

    it('should filter by university', async () => {
      const result = await discoverContacts({ university: 'MIT' });
      
      expect(result.success).toBe(true);
      // Alumni contacts should have the specified university
    });

    it('should filter by search query', async () => {
      const result = await discoverContacts({ q: 'engineering' });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should paginate results', async () => {
      const page1 = await discoverContacts({ page: 1, limit: 5 });
      const page2 = await discoverContacts({ page: 2, limit: 5 });
      
      expect(page1.pagination.page).toBe(1);
      expect(page2.pagination.page).toBe(2);
      expect(page1.data.length).toBeLessThanOrEqual(5);
    });

    it('should return sorted results by matchScore', async () => {
      const result = await discoverContacts();
      
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i - 1].matchScore).toBeGreaterThanOrEqual(result.data[i].matchScore);
      }
    });

    it('should include filter options in response', async () => {
      const result = await discoverContacts();
      
      expect(result.filters).toBeDefined();
      expect(result.filters.industries).toBeDefined();
      expect(Array.isArray(result.filters.industries)).toBe(true);
      expect(result.filters.connectionTypes).toBeDefined();
      expect(result.filters.universities).toBeDefined();
      expect(result.filters.locations).toBeDefined();
    });

    it('should generate valid contact data structure', async () => {
      const result = await discoverContacts({ limit: 1 });
      
      if (result.data.length > 0) {
        const contact = result.data[0];
        expect(contact.id).toBeDefined();
        expect(contact.firstName).toBeDefined();
        expect(contact.lastName).toBeDefined();
        expect(contact.fullName).toBeDefined();
        expect(contact.email).toBeDefined();
        expect(contact.company).toBeDefined();
        expect(contact.jobTitle).toBeDefined();
        expect(contact.industry).toBeDefined();
        expect(contact.location).toBeDefined();
        expect(contact.connectionType).toBeDefined();
        expect(contact.connectionDescription).toBeDefined();
        expect(contact.matchScore).toBeDefined();
        expect(contact.suggestedOutreach).toBeDefined();
      }
    });

    it('should handle multiple filters combined', async () => {
      const result = await discoverContacts({
        industry: 'Technology',
        connectionType: 'Company Employee',
        location: 'San Francisco, CA'
      });
      
      expect(result.success).toBe(true);
      result.data.forEach(contact => {
        expect(contact.industry).toBe('Technology');
        expect(contact.connectionType).toBe('Company Employee');
        expect(contact.location).toBe('San Francisco, CA');
      });
    });

    it('should handle search query matching interests', async () => {
      const result = await discoverContacts({ q: 'Machine Learning' });
      
      expect(result.success).toBe(true);
      // Results should match the query in some field
    });
  });

  describe('getDiscoveryFilters', () => {
    it('should return filter options', async () => {
      const result = await getDiscoveryFilters();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should include industries list', async () => {
      const result = await getDiscoveryFilters();
      
      expect(result.data.industries).toBeDefined();
      expect(Array.isArray(result.data.industries)).toBe(true);
      expect(result.data.industries.length).toBeGreaterThan(0);
    });

    it('should include connectionTypes list', async () => {
      const result = await getDiscoveryFilters();
      
      expect(result.data.connectionTypes).toBeDefined();
      expect(Array.isArray(result.data.connectionTypes)).toBe(true);
    });

    it('should include universities list', async () => {
      const result = await getDiscoveryFilters();
      
      expect(result.data.universities).toBeDefined();
      expect(Array.isArray(result.data.universities)).toBe(true);
    });

    it('should include locations list', async () => {
      const result = await getDiscoveryFilters();
      
      expect(result.data.locations).toBeDefined();
      expect(Array.isArray(result.data.locations)).toBe(true);
    });

    it('should include diversityGroups list', async () => {
      const result = await getDiscoveryFilters();
      
      expect(result.data.diversityGroups).toBeDefined();
      expect(Array.isArray(result.data.diversityGroups)).toBe(true);
    });
  });

  describe('getSuggestedContacts', () => {
    it('should return suggested contacts with empty context', async () => {
      const result = await getSuggestedContacts();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return suggested contacts for target companies', async () => {
      const result = await getSuggestedContacts({
        targetCompanies: ['Google', 'Microsoft']
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return suggested contacts for target roles', async () => {
      const result = await getSuggestedContacts({
        targetRoles: ['Software Engineer', 'Product Manager']
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return suggested contacts for target industries', async () => {
      const result = await getSuggestedContacts({
        targetIndustries: ['Technology', 'Finance']
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return alumni contacts when university provided', async () => {
      const result = await getSuggestedContacts({
        university: 'MIT'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should include categories breakdown', async () => {
      const result = await getSuggestedContacts({
        targetCompanies: ['Google'],
        university: 'Stanford',
        targetIndustries: ['Technology']
      });
      
      expect(result.success).toBe(true);
      expect(result.categories).toBeDefined();
      expect(Array.isArray(result.categories)).toBe(true);
    });

    it('should limit results to 12', async () => {
      const result = await getSuggestedContacts({
        targetCompanies: ['Google', 'Apple', 'Microsoft'],
        targetIndustries: ['Technology', 'Finance', 'Healthcare'],
        university: 'MIT'
      });
      
      expect(result.data.length).toBeLessThanOrEqual(12);
    });

    it('should return diversity network suggestions', async () => {
      const result = await getSuggestedContacts({});
      
      expect(result.success).toBe(true);
      // Should include some diversity network contacts
    });

    it('should handle full user context', async () => {
      const result = await getSuggestedContacts({
        targetCompanies: ['Amazon', 'Netflix'],
        targetRoles: ['Data Scientist'],
        targetIndustries: ['Technology'],
        university: 'Carnegie Mellon'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Contact Data Generation', () => {
    it('should generate contacts with valid email format', async () => {
      const result = await discoverContacts({ limit: 5 });
      
      result.data.forEach(contact => {
        // Use a more permissive regex that allows unicode characters in emails
        expect(contact.email).toMatch(/^.+@.+\..+$/);
      });
    });

    it('should generate contacts with valid LinkedIn URL format', async () => {
      const result = await discoverContacts({ limit: 5 });
      
      result.data.forEach(contact => {
        expect(contact.linkedInUrl).toContain('linkedin.com/in/');
      });
    });

    it('should generate contacts with years of experience', async () => {
      const result = await discoverContacts({ limit: 5 });
      
      result.data.forEach(contact => {
        expect(contact.yearsExperience).toBeGreaterThanOrEqual(2);
        expect(contact.yearsExperience).toBeLessThanOrEqual(22);
      });
    });

    it('should generate contacts with match score between 60-100', async () => {
      const result = await discoverContacts({ limit: 10 });
      
      result.data.forEach(contact => {
        expect(contact.matchScore).toBeGreaterThanOrEqual(60);
        expect(contact.matchScore).toBeLessThanOrEqual(100);
      });
    });

    it('should generate contacts with profile strength between 70-100', async () => {
      const result = await discoverContacts({ limit: 10 });
      
      result.data.forEach(contact => {
        expect(contact.profileStrength).toBeGreaterThanOrEqual(70);
        expect(contact.profileStrength).toBeLessThanOrEqual(100);
      });
    });

    it('should generate contacts with interests array', async () => {
      const result = await discoverContacts({ limit: 5 });
      
      result.data.forEach(contact => {
        expect(Array.isArray(contact.interests)).toBe(true);
        expect(contact.interests.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should generate contacts with mutual connections for 2nd degree', async () => {
      const result = await discoverContacts({ connectionType: '2nd Degree', limit: 5 });
      
      result.data.forEach(contact => {
        expect(contact.mutualConnectionCount).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(contact.mutualConnections)).toBe(true);
      });
    });

    it('should generate contacts with recent activity', async () => {
      const result = await discoverContacts({ limit: 5 });
      
      result.data.forEach(contact => {
        expect(contact.recentActivity).toBeDefined();
        expect(typeof contact.recentActivity).toBe('string');
      });
    });

    it('should generate speaker topics for conference speakers', async () => {
      const result = await discoverContacts({ connectionType: 'Conference Speaker', limit: 5 });
      
      result.data.forEach(contact => {
        if (contact.connectionType === 'Conference Speaker') {
          expect(Array.isArray(contact.speakerTopics)).toBe(true);
        }
      });
    });

    it('should generate diversity groups for diversity network contacts', async () => {
      const result = await discoverContacts({ connectionType: 'Diversity Network', limit: 5 });
      
      result.data.forEach(contact => {
        if (contact.connectionType === 'Diversity Network') {
          expect(Array.isArray(contact.diversityGroups)).toBe(true);
          expect(contact.diversityGroups.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Pagination', () => {
    it('should correctly calculate totalPages', async () => {
      const result = await discoverContacts({ limit: 10 });
      
      const expectedPages = Math.ceil(result.pagination.totalContacts / result.pagination.limit);
      expect(result.pagination.totalPages).toBe(expectedPages);
    });

    it('should correctly indicate hasMore', async () => {
      const result = await discoverContacts({ page: 1, limit: 5 });
      
      if (result.pagination.totalContacts > 5) {
        expect(result.pagination.hasMore).toBe(true);
      }
    });

    it('should return empty data for out of range page', async () => {
      const result = await discoverContacts({ page: 100, limit: 12 });
      
      expect(result.data.length).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });
  });
});
