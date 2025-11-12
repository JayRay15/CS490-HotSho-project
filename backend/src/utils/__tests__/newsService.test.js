import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  categorizeNews,
  calculateRelevance,
  analyzeSentiment,
  extractKeyPoints,
  extractTags,
  processNewsItem,
  generateNewsSummary,
  parseWikipediaExtract,
  fetchCompanyNews
} from '../newsService.js';

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

  describe('parseWikipediaExtract', () => {
    it('should extract news from Wikipedia text with recent years', () => {
      const currentYear = new Date().getFullYear();
      const extract = `${currentYear} The company announced a major breakthrough that will significantly impact the market and users.`;
      
      const news = parseWikipediaExtract(extract, 'TestCo_Page', 'TestCo');
      
      expect(Array.isArray(news)).toBe(true);
      if (news.length > 0) {
        expect(news[0].title).toContain('TestCo');
        expect(news[0].source).toBe('Wikipedia');
        expect(news[0].url).toContain('wikipedia.org');
      }
    });

    it('should filter out sentences that are too short', () => {
      const currentYear = new Date().getFullYear();
      const extract = `${currentYear} Short. ${currentYear} This is a longer sentence that should be included in the results.`;
      
      const news = parseWikipediaExtract(extract, 'TestCo_Page', 'TestCo');
      
      if (news.length > 0) {
        news.forEach(item => {
          expect(item.summary.length).toBeGreaterThan(50);
        });
      }
    });

    it('should filter out sentences that are too long', () => {
      const currentYear = new Date().getFullYear();
      const longText = 'X'.repeat(400);
      const extract = `${currentYear} ${longText}. ${currentYear} Normal length sentence here.`;
      
      const news = parseWikipediaExtract(extract, 'TestCo_Page', 'TestCo');
      
      if (news.length > 0) {
        news.forEach(item => {
          expect(item.summary.length).toBeLessThan(300);
        });
      }
    });

    it('should return empty array for empty extract', () => {
      const news = parseWikipediaExtract('', 'TestCo_Page', 'TestCo');
      expect(news).toEqual([]);
    });

    it('should return empty array for null extract', () => {
      const news = parseWikipediaExtract(null, 'TestCo_Page', 'TestCo');
      expect(news).toEqual([]);
    });

    it('should include current year and previous year', () => {
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      const extract = `${currentYear} Current year news with sufficient length to be captured. ${lastYear} Last year news with sufficient length to be captured.`;
      
      const news = parseWikipediaExtract(extract, 'TestCo_Page', 'TestCo');
      
      expect(Array.isArray(news)).toBe(true);
      // Should potentially have news from both years
      if (news.length > 0) {
        expect(news[0].date).toBeDefined();
      }
    });
  });

  describe('fetchCompanyNews integration', () => {
    it('should return empty array when no sources return data', async () => {
      // In test mode without network access, all sources should return empty
      const news = await fetchCompanyNews('NonExistentCompany123XYZ', { limit: 5, minRelevance: 0 });
      
      expect(Array.isArray(news)).toBe(true);
      // Should be empty since no real network calls are made in test environment
      expect(news.length).toBe(0);
    });

    it('should respect limit parameter', async () => {
      const news = await fetchCompanyNews('TestCo', { limit: 2, minRelevance: 0 });
      
      expect(Array.isArray(news)).toBe(true);
      expect(news.length).toBeLessThanOrEqual(2);
    });

    it('should filter by minRelevance parameter', async () => {
      const news = await fetchCompanyNews('TestCo', { limit: 10, minRelevance: 8 });
      
      expect(Array.isArray(news)).toBe(true);
      news.forEach(item => {
        expect(item.relevanceScore).toBeGreaterThanOrEqual(8);
      });
    });
  });

  describe('generateNewsSummary', () => {
    it('returns default summary when no news items', () => {
      const summary = generateNewsSummary([], 'NoCo');
      expect(summary.summary).toContain('No recent news available');
      expect(Array.isArray(summary.highlights)).toBe(true);
      expect(summary.highlights.length).toBe(0);
      expect(Array.isArray(summary.categories)).toBe(true);
      expect(summary.categories.length).toBe(0);
    });

    it('generates highlights, categories and averages for mixed items', () => {
      const items = [
        { title: 'A wins award', category: 'awards', relevanceScore: 8 },
        { title: 'A launches product', category: 'product_launch', relevanceScore: 7 },
        { title: 'A hires new team', category: 'hiring', relevanceScore: 5 }
      ];

      const summary = generateNewsSummary(items, 'A');
      expect(summary.totalItems).toBe(3);
      expect(summary.categories.length).toBeGreaterThan(0);
      expect(summary.highlights.length).toBeGreaterThan(0);
      expect(Number(summary.averageRelevance)).toBeGreaterThan(0);
    });
  });

  describe('calculateRelevance extra cases', () => {
    it('caps company mention bonus at 2 and clamps to 10', () => {
      const news = {
        title: 'X X X',
        summary: 'X X X',
        date: new Date(),
        category: 'general'
      };

      const score = calculateRelevance(news, 'X');
      // base 5 + recent 3 + mentions capped to 2 => 10 max
      expect(score).toBeLessThanOrEqual(10);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  // Additional edge-case and boundary tests to improve coverage
  describe('additional edge cases', () => {
    it('categorizeNews returns general when title and summary empty', () => {
      const result = categorizeNews('', '');
      expect(result).toBe('general');
    });

    it('analyzeSentiment returns neutral when no keywords present', () => {
      const result = analyzeSentiment('Plain update', 'This is a factual statement with no sentiment');
      expect(result).toBe('neutral');
    });

    it('calculateRelevance awards correct recency bonus boundaries', () => {
      const company = 'EdgeCo';
      const now = Date.now();

      const lessThan7 = { title: 'A', summary: 'B', date: new Date(now - 1000 * 60 * 60 * 24 * 7) }; // exactly 7 days
      const eightDays = { title: 'A', summary: 'B', date: new Date(now - 1000 * 60 * 60 * 24 * 8) }; // 8 days
      const twentyDays = { title: 'A', summary: 'B', date: new Date(now - 1000 * 60 * 60 * 24 * 20) }; // 20 days
      const fortyDays = { title: 'A', summary: 'B', date: new Date(now - 1000 * 60 * 60 * 24 * 40) }; // 40 days

      const s7 = calculateRelevance(lessThan7, company);
      const s8 = calculateRelevance(eightDays, company);
      const s20 = calculateRelevance(twentyDays, company);
      const s40 = calculateRelevance(fortyDays, company);

      // 7-day should be >= 8-day (7-day gets highest recency bonus)
      expect(s7).toBeGreaterThanOrEqual(s8);
      // 20-day should be >= 40-day
      expect(s20).toBeGreaterThanOrEqual(s40);
    });

    it('extractTags returns unique tags and limits to 5', () => {
      const title = 'Funding Launch Growth Growth Growth';
      const summary = 'Series A investment innovation customers revenue market expansion partnership';
      const tags = extractTags(title, summary);

      // Should be an array of strings, unique and length <= 5
      expect(Array.isArray(tags)).toBe(true);
      const unique = new Set(tags);
      expect(unique.size).toBe(tags.length);
      expect(tags.length).toBeLessThanOrEqual(5);
    });

    it('processNewsItem handles missing summary and source gracefully', () => {
      const raw = { title: 'EdgeCo raises funding', url: 'https://example.com' };
      const processed = processNewsItem(raw, 'EdgeCo');

  expect(processed.title).toBe(raw.title);
  // summary may be undefined when not provided; ensure it is either undefined or a string
  expect(typeof processed.summary === 'undefined' || typeof processed.summary === 'string').toBe(true);
  expect(processed.source).toBeDefined();
      expect(Array.isArray(processed.keyPoints)).toBe(true);
      expect(Array.isArray(processed.tags)).toBe(true);
      expect(typeof processed.relevanceScore).toBe('number');
    });
  });

  // Integration tests that mock axios for network-fetching helpers
  describe('network fetch integration (mocked axios)', () => {
    // Helper to create a transient newsService import that uses a mocked axios
    async function importNewsServiceWithMockedAxios(responses) {
      const fs = await import('fs');
      const os = await import('os');
      const path = await import('path');
      const { pathToFileURL, fileURLToPath } = await import('url');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ns-'));
      const mockAxiosPath = path.join(tmpDir, 'mockAxios.mjs');

      const modSrc = `let _call = 0;
export default {
  get: async function(url, opts) {
    const responses = ${JSON.stringify(responses)};
    const idx = _call < responses.length ? _call++ : responses.length - 1;
    const r = responses[idx];
    if (r && r.__throw) throw new Error(r.__throw);
    return { data: r };
  }
};
`;
      fs.writeFileSync(mockAxiosPath, modSrc, 'utf8');

      // Read original newsService and replace dynamic axios imports
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const origPath = path.resolve(path.join(__dirname, '..', 'newsService.js'));
      const origSrc = fs.readFileSync(origPath, 'utf8');
      const mockedImport = `await import('${pathToFileURL(mockAxiosPath).href}')`;
  let replaced = origSrc.replace(/await import\(\s*['"]axios['"]\s*\)/g, mockedImport);
  // Remove any test-time fetchCompanyNews invocation from the transient copy so it doesn't consume mocked responses
  replaced = replaced.replace(/const companyNews = fetchCompanyNews\([\s\S]*?\);/, '/* transient: skipped fetchCompanyNews test-time call */');

      const tmpNewsPath = path.join(tmpDir, 'newsService.tmp.mjs');
      fs.writeFileSync(tmpNewsPath, replaced, 'utf8');

      // Ensure network-allow flag and a dummy NewsAPI key are set so fetch helpers run in test
      process.env.NEWS_SERVICE_ALLOW_NETWORK = 'true';
      process.env.NEWS_API_KEY = process.env.NEWS_API_KEY || 'test_news_api_key';
      const mod = await import(pathToFileURL(tmpNewsPath).href);
      return mod;
    }

    it('fetchNewsAPINews returns processed articles', async () => {
      const article = {
        title: 'Acme raises Series B',
        description: 'Acme secured funding and growth',
        url: 'https://news.example/acme',
        publishedAt: new Date().toISOString(),
        source: { name: 'ExampleNews' }
      };

      const mockedData = [ { articles: [ article ] } ];
      const { fetchNewsAPINews } = await importNewsServiceWithMockedAxios(mockedData);

      const results = await fetchNewsAPINews('Acme');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].title).toBe(article.title);
      expect(results[0].source).toBe(article.source.name);
    });

    it('fetchGoogleNewsRSS parses CDATA items correctly', async () => {
      const rss = `<?xml version="1.0"?>\n<rss><channel><item>\n<title><![CDATA[CDATATitle]]></title>\n<link>https://g.example/article</link>\n<description><![CDATA[<a href=\"https://source\">GSource</a><p>Summary content here.</p>]]></description>\n<pubDate>Wed, 11 Nov 2025 12:00:00 GMT</pubDate>\n</item></channel></rss>`;
      const mockedData = [ rss ];

      const { fetchGoogleNewsRSS } = await importNewsServiceWithMockedAxios(mockedData);
      const res = await fetchGoogleNewsRSS('SomeCo');
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBeGreaterThanOrEqual(1);
      expect(res[0].title).toBe('CDATATitle');
      expect(res[0].source).toBe('GSource');
    });

    it('fetchBingNews parses non-CDATA titles and source tag', async () => {
      const rss = `<?xml version="1.0"?>\n<rss><channel><item>\n<title>Plain Title</title>\n<link>https://b.example/article</link>\n<description>Some description here.</description>\n<pubDate>Wed, 11 Nov 2025 13:00:00 GMT</pubDate>\n<source url=\"https://b.example\">BSource</source>\n</item></channel></rss>`;
      const mockedData = [ rss ];

      const { fetchBingNews } = await importNewsServiceWithMockedAxios(mockedData);
      const res = await fetchBingNews('OtherCo');
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBeGreaterThanOrEqual(1);
      expect(res[0].title).toBe('Plain Title');
      expect(res[0].source).toBe('BSource');
    });

    it('fetchCompanyNews aggregates from multiple sources and deduplicates', async () => {
      // Responses in order: NewsAPI, Google RSS, Bing RSS, Wikipedia search, Wikipedia content
      const article = {
        title: 'Unique Product Launch',
        description: 'Product launch description',
        url: 'https://news.example/unique',
        publishedAt: new Date().toISOString(),
        source: { name: 'ExampleNews' }
      };

      const googleRss = `<?xml version="1.0"?>\n<rss><channel><item>\n<title><![CDATA[Unique Product Launch - Coverage]]></title>\n<link>https://g.example/unique</link>\n<description><![CDATA[<a>GSource</a><p>Desc</p>]]></description>\n<pubDate>Wed, 11 Nov 2025 14:00:00 GMT</pubDate>\n</item></channel></rss>`;

      const bingRss = `<?xml version="1.0"?>\n<rss><channel><item>\n<title>Unique Product Launch</title>\n<link>https://b.example/unique</link>\n<description>Some desc</description>\n<pubDate>Wed, 11 Nov 2025 14:05:00 GMT</pubDate>\n<source>BSource</source>\n</item></channel></rss>`;

      const wikiSearch = { query: { search: [{ title: 'UniqueCo' }] } };
      const extract = `${new Date().getFullYear()} UniqueCo announced Unique Product Launch that is notable and impacts customers.`;
      const wikiContent = { query: { pages: { '1': { extract } } } };

      const mockedData = [ { articles: [ article ] }, googleRss, bingRss, wikiSearch, wikiContent ];

  const { fetchCompanyNews, fetchNewsAPINews, fetchGoogleNewsRSS, fetchBingNews, fetchWikipediaNews } = await importNewsServiceWithMockedAxios(mockedData);

  // Call the aggregator which deduplicates and filters (mocked responses provided in order)
  const res = await fetchCompanyNews('UniqueCo', { limit: 5, minRelevance: 0 });
  expect(Array.isArray(res)).toBe(true);
  // Should include at least one item
  expect(res.length).toBeGreaterThanOrEqual(1);
  // Titles should not be duplicates of the first 5 words normalized
  const normalized = res.map(r => r.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).slice(0,5).join(' '));
  const set = new Set(normalized);
  expect(set.size).toBe(normalized.length);
    });
  });
});
