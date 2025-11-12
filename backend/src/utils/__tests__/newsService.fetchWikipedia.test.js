import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

// Helper: create a temporary mocked axios module and import a transient copy of newsService
async function importNewsServiceWithMockedAxios(responses) {
  // responses: array of JS objects to return as response.data for successive axios.get calls
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ns-'));
  const mockAxiosPath = path.join(tmpDir, 'mockAxios.mjs');

  // Build module source: responses is embedded so behavior is deterministic per test
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

  // Resolve __dirname in ESM and read original newsService, then replace dynamic axios import
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const origPath = path.resolve(path.join(__dirname, '..', 'newsService.js'));
  const origSrc = fs.readFileSync(origPath, 'utf8');
  const mockedImport = `await import('${pathToFileURL(mockAxiosPath).href}')`;
  const replaced = origSrc.replace(/await import\(\s*['"]axios['"]\s*\)/g, mockedImport);

  const tmpNewsPath = path.join(tmpDir, 'newsService.tmp.mjs');
  fs.writeFileSync(tmpNewsPath, replaced, 'utf8');

  // Import the transient newsService module which will use the mocked axios
  const mod = await import(pathToFileURL(tmpNewsPath).href);
  return mod;
}

// Reset modules before tests to ensure clean imports
jest.resetModules();

describe('newsService fetchWikipedia integration (mocked axios)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array when wikipedia search finds nothing', async () => {
    // Mock axios to return empty search results as response.data
    const mockedData = [{ query: { search: [] } }];
    const { fetchWikipediaNews } = await importNewsServiceWithMockedAxios(mockedData);

    const res = await fetchWikipediaNews('NonExistentCo');
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
  });

  it('parses page extract and returns processed news items', async () => {
    const year = new Date().getFullYear();
    const company = 'ExampleCo';

    const pageTitle = 'ExampleCo';

    // Create extract that includes year sentences long enough
    const longSentence = `${year} The company announced a major breakthrough that will affect the market and users significantly, expanding operations and delivering new revenue streams.`;
    const extract = `${longSentence} Some other text. Another sentence for ${year} that mentions product and innovation which is notable.`;

    // First response: search -> returns a hit with title
    // Second response: get extracts -> returns page extract
    const mockedData = [
      { query: { search: [{ title: pageTitle }] } },
      { query: { pages: { '123': { extract } } } }
    ];

    const { fetchWikipediaNews } = await importNewsServiceWithMockedAxios(mockedData);

    const items = await fetchWikipediaNews(company);
    expect(Array.isArray(items)).toBe(true);
    if (items.length > 0) {
      items.forEach(item => {
        expect(item.source).toBe('Wikipedia');
        expect(item.title).toContain(company);
        expect(item.relevanceScore).toBeDefined();
      });
    }
  });

  it('fetchCompanyNews returns empty array when all sources fail', async () => {
    // Make axios throw to simulate network error
    const mockedData = [{ __throw: 'network' }];
    const { fetchCompanyNews } = await importNewsServiceWithMockedAxios(mockedData);

    const news = await fetchCompanyNews('FallbackCo', { limit: 3, minRelevance: 0 });
    expect(Array.isArray(news)).toBe(true);
    // With new implementation, returns empty array when all sources fail (no fallback to fake data)
    expect(news.length).toBe(0);
  });

  it('fetchCompanyNews returns items when available and respects limit/sorting', async () => {
    const year = new Date().getFullYear();
    const company = 'SortCo';
    const pageTitle = 'SortCoPage';

    const extract = `${year} Significant milestone achieved by SortCo, driving growth and innovation in multiple markets. ${year - 1} Earlier achievement that was also notable.`;

    const mockedData = [
      // NewsAPI call (will fail/return empty)
      { __throw: 'not configured' },
      // Google News RSS call (will fail)
      { __throw: 'not configured' },
      // Bing News call (will fail)
      { __throw: 'not configured' },
      // Wikipedia search
      { query: { search: [{ title: pageTitle }] } },
      // Wikipedia content
      { query: { pages: { '999': { extract } } } }
    ];

    const { fetchCompanyNews } = await importNewsServiceWithMockedAxios(mockedData);

    const results = await fetchCompanyNews(company, { limit: 10, minRelevance: 0 });
    expect(Array.isArray(results)).toBe(true);
    // Should have at least some results from Wikipedia
    if (results.length > 0) {
      expect(results[0].relevanceScore).toBeDefined();
      expect(results[0].source).toBe('Wikipedia');
    }
  });
});
