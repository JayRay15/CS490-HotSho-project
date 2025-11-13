import * as svc from '../companyResearchService.js';

describe('companyResearchService additional formatting and quality tests', () => {
  test('formatResearchForCoverLetter returns empty for failed research', () => {
    const res = { researchSuccess: false };
    expect(svc.formatResearchForCoverLetter(res)).toBe('');
  });

  test('formatResearchForCoverLetter composes expected sections when data present', () => {
    const research = {
      researchSuccess: true,
      background: 'We build great products.',
      mission: 'Make the world better',
      values: ['Integrity', 'Innovation'],
      recentNews: ['Launched X', 'Raised Series B'],
      initiatives: ['Project A'],
      industryContext: 'Competing in cloud',
      size: '100-500',
      growth: 'growth',
      funding: 'Series B',
      competitive: 'Niche leader'
    };

    const text = svc.formatResearchForCoverLetter(research);
    expect(text).toContain('COMPANY RESEARCH INSIGHTS');
    expect(text).toContain('Company Background: We build great products.');
    expect(text).toContain('Mission: Make the world better');
    expect(text).toContain('Core Values: Integrity, Innovation');
    expect(text).toContain('Recent Achievements/News:');
    expect(text).toContain('Key Initiatives/Projects:');
    expect(text).toContain('Company Stage: 100-500, growth');
    expect(text).toContain('Funding/Expansion: Series B');
    expect(text).toContain('Competitive Position: Niche leader');
  });

  test('formatComprehensiveResearch produces correct sections for populated research', () => {
    const research = {
      summary: 'A short summary',
      basicInfo: { industry: 'Tech', size: '100-500', headquarters: 'NYC', founded: 2010 },
      missionAndCulture: { mission: 'Serve users', values: ['Customer-first'], culture: 'Fast-paced' },
      productsAndServices: { mainProducts: ['Product A', 'Product B'], technologies: ['Node.js'] },
      leadership: { executives: [{ name: 'Jane Doe', title: 'CEO' }], keyLeaders: ['John - CTO'] },
      competitive: { mainCompetitors: ['Comp1', 'Comp2'], marketPosition: 'Challenger', uniqueValue: 'Integration' },
      socialMedia: { platforms: { twitter: 'https://x.com/example' } }
    };

    const formatted = svc.formatComprehensiveResearch(research);
    expect(formatted.overview).toBe('A short summary');
    const titles = formatted.sections.map(s => s.title);
    expect(titles).toEqual(expect.arrayContaining(['Company Overview', 'Mission & Culture', 'Products & Services', 'Leadership Team', 'Competitive Landscape', 'Social Media Presence']));

    // Check items content
    const overview = formatted.sections.find(s => s.title === 'Company Overview');
    expect(overview.items).toEqual(expect.arrayContaining(['Industry: Tech', 'Size: 100-500', 'Headquarters: NYC', 'Founded: 2010']));

    const leadership = formatted.sections.find(s => s.title === 'Leadership Team');
    expect(leadership.items[0]).toBe('Jane Doe - CEO');
  });

  test('formatComprehensiveResearch returns empty sections for minimal research', () => {
    const research = {
      summary: 's',
      basicInfo: { industry: null, size: null, headquarters: null, founded: null },
      missionAndCulture: { mission: null, values: [], culture: null },
      productsAndServices: { mainProducts: [], technologies: [] },
      leadership: { executives: [], keyLeaders: [] },
      competitive: { mainCompetitors: [], marketPosition: null, uniqueValue: null },
      socialMedia: { platforms: {} }
    };

    const formatted = svc.formatComprehensiveResearch(research);
    expect(formatted.sections.length).toBe(0);
  });
  // The internal helpers (calculateDataQuality, getMinimalComprehensiveResearchData,
  // getDefaultAIResearch) are module-local and not exported. Those helpers are
  // exercised indirectly by the AI-integration tests which mock the AI client
  // before importing the module (see companyResearchService.ai.test.js).
  // This file focuses on formatting helpers which are exported.
});
