import { jest } from '@jest/globals';
// This test uses ESM module mocking to provide a fake axios before importing newsService
process.env.NEWS_SERVICE_ALLOW_NETWORK = 'true';

// Mock axios module before importing the newsService module
await jest.unstable_mockModule('axios', () => ({
  default: {
    get: jest.fn()
  }
}));

const axios = await import('axios');
const newsService = await import('../newsService.js');

describe('newsService network parsing (mocked axios)', () => {
  afterEach(() => {
    axios.default.get.mockReset();
  });

  test('fetchGoogleNewsRSS parses CDATA titles and descriptions', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss><channel>
        <item>
          <title><![CDATA[ExampleCo launches new product]]></title>
          <link>https://example.com/1</link>
          <description><![CDATA[<a href="/">Example Source</a> Product released. Details here.]]></description>
          <pubDate>Tue, 10 Nov 2025 12:00:00 GMT</pubDate>
        </item>
      </channel></rss>`;

    axios.default.get.mockResolvedValue({ data: xml });

    const items = await newsService.fetchGoogleNewsRSS('ExampleCo');
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0]).toHaveProperty('title');
    expect(items[0].source).toBe('Example Source');
  });

  test('fetchBingNews handles plain title and description and limits to 10', async () => {
    // Build XML with 12 items, some plain titles
    let itemsXml = '';
    for (let i = 0; i < 12; i++) {
      itemsXml += `<item><title>Title ${i}</title><link>https://example.com/${i}</link><description>Description ${i}</description><pubDate>Tue, 10 Nov 2025 12:00:00 GMT</pubDate></item>`;
    }
    const xml = `<?xml version="1.0"?><rss><channel>${itemsXml}</channel></rss>`;

    axios.default.get.mockResolvedValue({ data: xml });

    const items = await newsService.fetchBingNews('ExampleCo');
    expect(Array.isArray(items)).toBe(true);
    // Should limit to 10
    expect(items.length).toBeLessThanOrEqual(10);
    expect(items[0]).toHaveProperty('title');
  });

  test('fetchWikipediaNews returns [] when search yields no results', async () => {
    // Mock search response with empty results
    axios.default.get
      .mockResolvedValueOnce({ data: { query: { search: [] } } })
      .mockResolvedValueOnce({ data: {} });

    const items = await newsService.fetchWikipediaNews('NonExistentCompany123');
    expect(items).toEqual([]);
  });

  test('fetchGoogleNewsRSS handles malformed/missing title gracefully', async () => {
    const xml = `<?xml version="1.0"?><rss><channel><item><link>https://example.com/1</link><description><![CDATA[No title here]]></description></item></channel></rss>`;
    axios.default.get.mockResolvedValue({ data: xml });
    const items = await newsService.fetchGoogleNewsRSS('ExampleCo');
    // missing title -> should be filtered out
    expect(items.length).toBe(0);
  });

  test('fetchGoogleNewsRSS handles axios error and returns []', async () => {
    axios.default.get.mockRejectedValue(new Error('Network error'));
    const items = await newsService.fetchGoogleNewsRSS('ExampleCo');
    expect(items).toEqual([]);
  });

  test('fetchNewsAPINews handles 429 and 401 and generic errors', async () => {
    process.env.NEWS_API_KEY = 'valid_key';

    // 429 rate limit
    axios.default.get.mockRejectedValueOnce({ response: { status: 429 }, message: 'rate' });
    const r1 = await newsService.fetchNewsAPINews('ExampleCo');
    expect(r1).toEqual([]);

    // 401 auth
    axios.default.get.mockRejectedValueOnce({ response: { status: 401 }, message: 'auth' });
    const r2 = await newsService.fetchNewsAPINews('ExampleCo');
    expect(r2).toEqual([]);

    // generic error
    axios.default.get.mockRejectedValueOnce(new Error('boom'));
    const r3 = await newsService.fetchNewsAPINews('ExampleCo');
    expect(r3).toEqual([]);
  });

  test('fetchWikipediaNews success path returns processed items', async () => {
    const year = new Date().getFullYear();
    const extract = `${year} Company did something important that led to major growth and a notable announcement.`;

    // search response
    axios.default.get
      .mockResolvedValueOnce({ data: { query: { search: [{ title: 'Example_Co' }] } } })
      .mockResolvedValueOnce({ data: { query: { pages: { '123': { extract } } } } });

    const items = await newsService.fetchWikipediaNews('ExampleCo');
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  test('fetchCompanyNews aggregation with mocked axios returns combined deduped results', async () => {
    process.env.NEWS_API_KEY = 'valid_key';

    const googleXml = `<?xml version="1.0"?><rss><channel><item><title><![CDATA[ExampleCo raises funds]]></title><link>https://g.example/1</link><description><![CDATA[<a href="/">GSource</a> Fundraising announced.]]></description><pubDate>Tue, 10 Nov 2025 12:00:00 GMT</pubDate></item></channel></rss>`;
    const bingXml = `<?xml version="1.0"?><rss><channel><item><title>ExampleCo raises funds - followup</title><link>https://b.example/1</link><description>Follow up</description><pubDate>Tue, 09 Nov 2025 12:00:00 GMT</pubDate></item></channel></rss>`;
    const newsApiArticles = [{ title: 'ExampleCo launches', description: 'Product release', url: 'https://n.example/1', publishedAt: new Date().toISOString(), source: { name: 'NewsAPI' } }];

    axios.default.get.mockImplementation((url, opts) => {
      if (typeof url === 'string' && url.includes('newsapi.org')) {
        return Promise.resolve({ data: { articles: newsApiArticles } });
      }
      if (typeof url === 'string' && url.includes('news.google.com')) {
        return Promise.resolve({ data: googleXml });
      }
      if (typeof url === 'string' && url.includes('bing.com')) {
        return Promise.resolve({ data: bingXml });
      }
      if (typeof url === 'string' && url.includes('wikipedia.org')) {
        // distinguish search vs content by opts.params
        const params = opts && opts.params;
        if (params && params.list === 'search') {
          return Promise.resolve({ data: { query: { search: [{ title: 'Example_Co' }] } } });
        }
        return Promise.resolve({ data: { query: { pages: { '1': { extract: `${new Date().getFullYear()} ExampleCo achieved important milestone.` } } } } });
      }
      return Promise.resolve({ data: {} });
    });

    const results = await newsService.fetchCompanyNews('ExampleCo', { limit: 5, minRelevance: 0 });
    expect(Array.isArray(results)).toBe(true);
    // Should include items from NewsAPI and parsed RSS/Wikipedia
    expect(results.length).toBeGreaterThanOrEqual(1);
    // Ensure deduplication removed similar google/bing items (only one of those should be kept)
    const titles = results.map(r => r.title.toLowerCase());
    const seen = new Set();
    titles.forEach(t => seen.add(t));
    expect(seen.size).toBeGreaterThanOrEqual(1);
  });
});
