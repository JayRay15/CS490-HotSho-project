// Mock the GoogleGenerativeAI before importing the service so internal AI calls are deterministic
import { jest } from '@jest/globals';

await jest.unstable_mockModule('@google/generative-ai', () => ({
  GoogleGenerativeAI: function(apiKey) {
    return {
      getGenerativeModel: () => ({
        generateContent: async (prompt) => {
          // If job description contains CAUSE_ERROR, simulate a failure
          if (prompt && prompt.includes('CAUSE_ERROR')) {
            throw new Error('simulated AI failure');
          }

          let json = {};
          if (prompt && prompt.includes('Provide basic information about')) {
            json = { name: 'ExampleCo', website: 'https://example.com', logo: null, size:'100-500', industry:'Tech', headquarters:'NY', founded:2000, mission:'To serve' };
          } else if (prompt && prompt.includes('Conduct comprehensive research about')) {
            json = {
              size:'100-500', industry:'Tech', headquarters:'NY', founded:2000, companyType:'Private', stockTicker:null, revenue:null,
              description:'desc', mission:'To serve', values:['v1','v2'], culture:'culture', workEnvironment:'env', mainProducts:['P1'], services:['S1'], technologies:['T1'], innovations:['I1'], competitors:['C1'], marketPosition:'leader', uniqueValue:'UV', industryTrends:['trend1'], pressReleases:[{"title":"pr","summary":"s","date":"2025-11-10"}], majorAnnouncements:['a'], leadershipInfo:'lead'
            };
          } else if (prompt && prompt.includes('official social media')) {
            json = { linkedin:'https://linkedin.com/example', twitter:null, facebook:null, instagram:null, youtube:null, github:null };
          } else if (prompt && prompt.includes('List the key executives')) {
            json = { executives: [{ name:'Jane Doe', title:'CEO', background:'bg' }], keyLeaders:['Jane Doe - CEO'] };
          } else if (prompt && prompt.includes('provide a comprehensive company research report')) {
            json = { companyName:'ExampleCo', background:'bg', recentNews:['n'], mission:'m', values:['v'], initiatives:['i'], industryContext:'ic', size:'100-500', growth:'growth', funding:'f', competitive:'comp', researchSuccess:true };
          }

          return { response: Promise.resolve({ text: () => JSON.stringify(json) }) };
        }
      })
    };
  }
}));

const svc = await import('../companyResearchService.js');

describe('companyResearchService AI-integration (mocked)', () => {
  test('conductComprehensiveResearch returns populated comprehensive object', async () => {
    const res = await svc.conductComprehensiveResearch('ExampleCo', 'some job', 'https://example.com');
    expect(res).toHaveProperty('companyName', 'ExampleCo');
    expect(res).toHaveProperty('basicInfo');
    expect(res.basicInfo).toHaveProperty('name', 'ExampleCo');
    expect(res.leadership.executives.length).toBeGreaterThanOrEqual(1);
    expect(res.socialMedia.platforms).toHaveProperty('linkedin');
    expect(res.metadata.researchSuccess).toBe(true);
    expect(typeof res.metadata.dataQuality).toBe('number');
  });

  test('researchCompany returns minimal data when AI generation fails', async () => {
    const res = await svc.researchCompany('BadCo', 'CAUSE_ERROR');
    expect(res).toHaveProperty('companyName', 'BadCo');
    expect(res.researchSuccess).toBe(false);
    expect(res.background).toContain('BadCo');
  });
});
