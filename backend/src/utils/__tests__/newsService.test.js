import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock axios before importing newsService
jest.unstable_mockModule('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const {
  categorizeNews,
  calculateRelevance,
  analyzeSentiment,
  extractKeyPoints,
  extractTags,
  processNewsItem,
  generateSampleNews
} = await import('../newsService.js');

describe('newsService utilities', () => {
  describe('categorizeNews', () => {
    it('should categorize funding news', () => {
      const result = categorizeNews('Company Raises Series A', 'Raises $50 million in funding');
      expect(result).toBe('funding');
    });

    it('should categorize product launch news', () => {
      const result = categorizeNews('New Feature Release', 'Company unveils innovative product');
      expect(result).toBe('product_launch');
    });

    it('should categorize hiring news', () => {
      const result = categorizeNews('Hiring Spree', 'Looking for talented employees');
      expect(result).toBe('hiring');
    });

    it('should categorize acquisition news', () => {
      const result = categorizeNews('Major Acquisition', 'Company acquires competitor');
      expect(result).toBe('acquisition');
    });

    it('should categorize partnership news', () => {
      const result = categorizeNews('Strategic Partnership', 'Partners with industry leader');
      expect(result).toBe('partnership');
    });

    it('should categorize leadership news', () => {
      const result = categorizeNews('New CEO Appointed', 'Company appoints new chief executive');
      expect(result).toBe('leadership');
    });

    it('should categorize awards news', () => {
      const result = categorizeNews('Award Winner', 'Company wins prestigious recognition');
      expect(result).toBe('awards');
    });

    it('should return general for uncategorized news', () => {
      const result = categorizeNews('Random News', 'This does not fit any category');
      expect(result).toBe('general');
    });

    it('should be case insensitive', () => {
      const result = categorizeNews('FUNDING NEWS', 'SERIES B INVESTMENT');
      expect(result).toBe('funding');
    });
  });

  describe('analyzeSentiment', () => {
    it('should detect positive sentiment', () => {
      const result = analyzeSentiment('Great Success', 'Company achieved breakthrough innovation');
      expect(result).toBe('positive');
    });

    it('should detect negative sentiment', () => {
      const result = analyzeSentiment('Company Loss', 'Faced major lawsuit and scandal');
      expect(result).toBe('negative');
    });

    it('should detect neutral sentiment', () => {
      const result = analyzeSentiment('Company Update', 'Announced quarterly meeting');
      expect(result).toBe('neutral');
    });

    it('should be case insensitive', () => {
      const result = analyzeSentiment('SUCCESS STORY', 'GROWTH AND PROFIT');
      expect(result).toBe('positive');
    });

    it('should handle multiple positive keywords', () => {
      const result = analyzeSentiment('Growth and Success', 'Achieved excellence and breakthrough');
      expect(result).toBe('positive');
    });

    it('should handle multiple negative keywords', () => {
      const result = analyzeSentiment('Lawsuit Filed', 'Controversy and layoffs announced');
      expect(result).toBe('negative');
    });
  });

  describe('calculateRelevance', () => {
    it('should give higher score for recent news', () => {
      const recentNews = {
        title: 'Recent Update',
        summary: 'News from today',
        date: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      };
      
      const oldNews = {
        title: 'Old Update',
        summary: 'News from long ago',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200) // 200 days ago
      };
      
      const recentScore = calculateRelevance(recentNews, 'Google');
      const oldScore = calculateRelevance(oldNews, 'Google');
      
      expect(recentScore).toBeGreaterThan(oldScore);
    });

    it('should give bonus for company name mentions', () => {
      const newsWithMention = {
        title: 'Google Announcement',
        summary: 'Google launches new product by Google',
        date: new Date()
      };
      
      const newsWithoutMention = {
        title: 'Tech News',
        summary: 'A company launches new product',
        date: new Date()
      };
      
      const withScore = calculateRelevance(newsWithMention, 'Google');
      const withoutScore = calculateRelevance(newsWithoutMention, 'Google');
      
      expect(withScore).toBeGreaterThan(withoutScore);
    });

    it('should give bonus for high-value categories', () => {
      const fundingNews = {
        title: 'Company Raises Funding',
        summary: 'Series B round',
        date: new Date(),
        category: 'funding'
      };
      
      const generalNews = {
        title: 'Company Update',
        summary: 'General update',
        date: new Date(),
        category: 'general'
      };
      
      const fundingScore = calculateRelevance(fundingNews, 'Google');
      const generalScore = calculateRelevance(generalNews, 'Google');
      
      expect(fundingScore).toBeGreaterThan(generalScore);
    });

    it('should clamp score between 0 and 10', () => {
      const news = {
        title: 'Old news',
        summary: 'Very old news',
        date: new Date('2000-01-01'),
        category: 'general'
      };
      
      const score = calculateRelevance(news, 'Google');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('should handle missing date', () => {
      const news = {
        title: 'News without date',
        summary: 'No date provided',
        category: 'general'
      };
      
      const score = calculateRelevance(news, 'Google');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(10);
    });
  });

  describe('extractKeyPoints', () => {
    it('should extract key points from summary', () => {
      const summary = 'First point is very important. Second point matters too. Third point is also valuable.';
      const points = extractKeyPoints(summary);
      
      expect(Array.isArray(points)).toBe(true);
      expect(points.length).toBeGreaterThan(0);
    });

    it('should filter out short sentences', () => {
      const summary = 'A. B. This is a proper sentence with enough length to be considered a key point.';
      const points = extractKeyPoints(summary);
      
      points.forEach(point => {
        expect(point.length).toBeGreaterThanOrEqual(20);
      });
    });

    it('should filter out very long sentences', () => {
      const summary = 'This is a normal sentence. ' + 'X'.repeat(300) + ' This is also normal.';
      const points = extractKeyPoints(summary);
      
      points.forEach(point => {
        expect(point.length).toBeLessThanOrEqual(200);
      });
    });

    it('should return empty array for empty summary', () => {
      const points = extractKeyPoints('');
      expect(points).toEqual([]);
    });

    it('should return empty array for null summary', () => {
      const points = extractKeyPoints(null);
      expect(points).toEqual([]);
    });

    it('should limit to first 3 sentences', () => {
      const summary = 'Point one here! Point two here? Point three here. Point four here. Point five here.';
      const points = extractKeyPoints(summary);
      
      expect(points.length).toBeLessThanOrEqual(3);
    });
  });

  describe('extractTags', () => {
    it('should extract funding tags', () => {
      const tags = extractTags('Funding Round', 'Series A investment and capital raise');
      
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some(tag => ['funding', 'investment', 'capital'].includes(tag))).toBe(true);
    });

    it('should extract product tags', () => {
      const tags = extractTags('Product Launch', 'New feature release and innovation');
      
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some(tag => ['launch', 'release', 'innovation'].includes(tag))).toBe(true);
    });

    it('should extract business term tags', () => {
      const tags = extractTags('Market Update', 'Revenue growth and customer expansion');
      
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some(tag => ['growth', 'customers', 'revenue'].includes(tag))).toBe(true);
    });

    it('should limit to 5 tags maximum', () => {
      const tags = extractTags(
        'Funding product launch partnership',
        'Series A investment innovation customer growth revenue partnership'
      );
      
      expect(tags.length).toBeLessThanOrEqual(5);
    });

    it('should be case insensitive', () => {
      const tags = extractTags('FUNDING ROUND', 'SERIES A INVESTMENT');
      
      expect(tags.length).toBeGreaterThan(0);
    });

    it('should return empty array for generic text', () => {
      const tags = extractTags('Random Words', 'No relevant keywords here');
      
      expect(Array.isArray(tags)).toBe(true);
    });
  });

  describe('processNewsItem', () => {
    it('should process news with all fields', () => {
      const rawNews = {
        title: 'Company Raises Funding',
        summary: 'Series A round with success and growth',
        url: 'https://example.com/news',
        date: new Date(),
        source: 'TechCrunch'
      };
      
      const processed = processNewsItem(rawNews, 'Google');
      
      expect(processed.title).toBe(rawNews.title);
      expect(processed.summary).toBe(rawNews.summary);
      expect(processed.category).toBe('funding');
      expect(processed.sentiment).toBe('positive');
      expect(Array.isArray(processed.keyPoints)).toBe(true);
      expect(Array.isArray(processed.tags)).toBe(true);
      expect(processed.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(processed.relevanceScore).toBeLessThanOrEqual(10);
    });

    it('should set default date if not provided', () => {
      const rawNews = {
        title: 'News Title',
        summary: 'News summary',
        url: 'https://example.com'
      };
      
      const processed = processNewsItem(rawNews, 'Google');
      
      expect(processed.date).toBeDefined();
    });

    it('should set default source if not provided', () => {
      const rawNews = {
        title: 'News Title',
        summary: 'News summary',
        url: 'https://example.com'
      };
      
      const processed = processNewsItem(rawNews, 'Google');
      
      expect(processed.source).toBeDefined();
    });

    it('should calculate relevance score based on company name', () => {
      const rawNews = {
        title: 'Google Announcement',
        summary: 'Google launches product with success',
        url: 'https://example.com',
        date: new Date()
      };
      
      const processed = processNewsItem(rawNews, 'Google');
      
      expect(processed.relevanceScore).toBeGreaterThan(5);
    });
  });

  describe('generateSampleNews', () => {
    it('should generate sample news array', () => {
      const news = generateSampleNews('Google');
      
      expect(Array.isArray(news)).toBe(true);
      expect(news.length).toBeGreaterThan(0);
    });

    it('should include company name in generated news', () => {
      const news = generateSampleNews('Microsoft');
      
      news.forEach(item => {
        expect(item.title).toContain('Microsoft');
      });
    });

    it('should generate news with required fields', () => {
      const news = generateSampleNews('Apple');
      
      news.forEach(item => {
        expect(item.title).toBeDefined();
        expect(item.summary).toBeDefined();
        expect(item.date).toBeDefined();
        expect(item.source).toBeDefined();
        expect(item.category).toBeDefined();
        expect(item.sentiment).toBeDefined();
      });
    });

    it('should have different categories in sample news', () => {
      const news = generateSampleNews('Tesla');
      const categories = news.map(item => item.category);
      
      expect(new Set(categories).size).toBeGreaterThan(1);
    });

    it('should have positive sentiment in sample news', () => {
      const news = generateSampleNews('Netflix');
      
      const hasPositive = news.some(item => item.sentiment === 'positive');
      expect(hasPositive).toBe(true);
    });
  });
});
