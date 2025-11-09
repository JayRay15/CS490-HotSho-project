import { jest } from '@jest/globals';

// Mock the Google Generative AI package used by geminiService
jest.unstable_mockModule('@google/generative-ai', () => {
  class MockModel {
    constructor() {}
    generateContent(prompt) {
      // Determine response based on prompt contents
      let text = '';
      // Special test hooks
      if (prompt.includes('__THROW__')) {
        throw new Error('Simulated AI failure');
      }

      if (prompt.includes('__INVALID_JSON__')) {
        // Return malformed JSON with trailing commas to exercise the parser-fix path
        const bad = '```json' + '{ "variations": [ { "variationNumber": 1, "summary": "S1", }, ], }' + '```';
        return { response: Promise.resolve({ text: () => bad }) };
      }

      // Specific detectors first
      if (prompt.includes('variationNumber') || prompt.includes('Generate multiple variations')) {
        // Return JSON wrapped in code fences to test cleanup
        text = '```json' + JSON.stringify({ variations: [ { variationNumber: 1, summary: 'S1' } ] }) + '```';
        return { response: Promise.resolve({ text: () => text }) };
      }

      if (prompt.includes('Generate an alternative professional summary') || prompt.includes('Generate an alternative professional summary')) {
        // summary: plain text (not JSON)
        text = 'A refreshed professional summary focused on leadership and impact.';
        return { response: Promise.resolve({ text: () => text }) };
      }
      if (prompt.includes('Analyze this resume content for ATS')) {
        text = JSON.stringify({ score: 80, missingKeywords: ['k1'], keywordDensity: 'optimal', suggestions: ['s1'], matchedKeywords: ['k2'] });
        return { response: Promise.resolve({ text: () => text }) };
      }

      if (prompt.includes('You are an expert resume optimization specialist')) {
        text = JSON.stringify({ matchScore: 90, optimizedSkills: [{ name: 'JS', level: 'Expert', relevance: 'high' }], technicalSkills: ['JS'], softSkills: ['communication'] });
        return { response: Promise.resolve({ text: () => text }) };
      }

      if (prompt.includes('You are an expert resume writer specializing in experience optimization')) {
        text = JSON.stringify({ experiences: [ { experienceIndex: 0, jobTitle: 'Dev', relevanceScore: 80, bullets: [] } ], summary: 'ok' });
        return { response: Promise.resolve({ text: () => text }) };
      }

      // Generic JSON responders for sections expecting JSON arrays/objects
      if (prompt.includes('Return as JSON with keys') || prompt.includes('Return only a JSON array') || prompt.includes('Return as JSON:') || prompt.includes('Return as JSON')) {
        // Return a simple JSON object for experience/skills responses
        text = JSON.stringify({ job0: ['bul1','bul2'], job1: ['bul1'] });
        return { response: Promise.resolve({ text: () => text }) };
      }

      // Default fallback
      text = JSON.stringify({ result: 'default' });
      return { response: Promise.resolve({ text: () => text }) };
    }
  }

  return { GoogleGenerativeAI: class { constructor() { return { getGenerativeModel: () => new MockModel() }; } } };
});

// Now import the module under test
const {
  generateResumeContentVariations,
  generateResumeContent,
  regenerateSection,
  analyzeATSCompatibility,
  optimizeResumeSkills,
  tailorExperience,
} = await import('../geminiService.js');

describe('geminiService (mocked GoogleGenerativeAI)', () => {
  it('generateResumeContentVariations parses JSON wrapped in code fences', async () => {
    const job = { title: 'Dev', company: 'X', description: 'desc' };
    const user = { employment: [], skills: [], education: [], projects: [], certifications: [] };
    const template = { layout: {} };

    const vars = await generateResumeContentVariations(job, user, template, 3);
    expect(Array.isArray(vars)).toBe(true);
    expect(vars.length).toBeGreaterThan(0);
    expect(vars[0]).toHaveProperty('variationNumber', 1);
  });

  it('generateResumeContent handles AI errors as thrown', async () => {
    const job = { title: 'Dev', company: 'X', description: '__THROW__' };
    const user = { employment: [], skills: [], education: [], projects: [], certifications: [] };
    const template = { layout: {} };
    await expect(generateResumeContentVariations(job, user, template, 3)).rejects.toThrow('Simulated AI failure');
  });

  it('generateResumeContent throws when inputs missing', async () => {
    await expect(generateResumeContent(null, null, null)).rejects.toThrow('jobPosting and userProfile are required');
  });

  it('regenerateSection returns plain summary when model returns text', async () => {
    const section = 'summary';
    const job = { title: 'Dev', company: 'X', description: 'desc' };
    const user = { employment: [{ jobTitle: 'Dev', company: 'X' }], skills: [] };
    const current = { summary: 'Old summary' };

    const res = await regenerateSection(section, job, user, current);
    expect(res).toHaveProperty('summary');
    expect(typeof res.summary).toBe('string');
    expect(res.summary.length).toBeGreaterThan(0);
  });

  it('regenerateSection for experience returns parsed JSON object', async () => {
    const section = 'experience';
    const job = { title: 'Dev', company: 'X', description: 'desc' };
    const user = { employment: [{ jobTitle: 'Dev', company: 'X', description: 'd' }] };
    const current = { };

    const res = await regenerateSection(section, job, user, current);
    expect(res).toHaveProperty('job0');
  });

  it('analyzeATSCompatibility parses JSON response', async () => {
    const resumeContent = { summary: 's', relevantSkills: ['a'], experienceBullets: {} };
    const job = { title: 'Dev', company: 'X', requirements: 'req' };
    const res = await analyzeATSCompatibility(resumeContent, job);
    expect(res).toHaveProperty('score');
    expect(typeof res.score).toBe('number');
  });

  it('optimizeResumeSkills returns optimization object', async () => {
    const resume = { sections: { skills: [{ name: 'JS' }] } };
    const job = { title: 'Dev', company: 'X', description: 'desc' };
    const user = { skills: [{ name: 'JS', level: 'Expert', yearsOfExperience: 5 }] };
    const res = await optimizeResumeSkills(resume, job, user);
    expect(res).toHaveProperty('matchScore');
    expect(res.optimizedSkills).toBeDefined();
  });

  it('tailorExperience returns experiences array', async () => {
    const resume = { sections: { experience: [{ jobTitle: 'Dev', company: 'X', startDate: '2020', endDate: '2021', bullets: [] }] } };
    const job = { title: 'Dev', company: 'X', description: 'desc' };
    const user = { employment: [{ jobTitle: 'Dev', company: 'X' }] };
    const res = await tailorExperience(resume, job, user);
    expect(res).toHaveProperty('experiences');
    expect(Array.isArray(res.experiences)).toBe(true);
  });

  // Additional tests to increase coverage for parsing and error branches
  it('generateResumeContent returns parsed object for normal response', async () => {
    const job = { title: 'Dev', company: 'X', description: 'desc' };
    const user = { employment: [], skills: [], education: [], projects: [], certifications: [] };
    const template = { layout: {} };

    const res = await generateResumeContent(job, user, template);
    expect(res).toBeDefined();
    expect(typeof res).toBe('object');
    expect(res).toHaveProperty('result');
  });

  it('generateResumeContent repairs malformed JSON and parses successfully', async () => {
    const job = { title: 'Dev', company: 'X', description: '__INVALID_JSON__' };
    const user = { employment: [], skills: [], education: [], projects: [], certifications: [] };
    const template = { layout: {} };

    const res = await generateResumeContent(job, user, template);
    // Our mock invalid JSON contains a "variations" key
    expect(res).toBeDefined();
    expect(typeof res).toBe('object');
    // Either variations or result may be present depending on mock
    expect(res.variations || res.result).toBeTruthy();
  });

  it('regenerateSection returns parsed array/object for skills section', async () => {
    const section = 'skills';
    const job = { title: 'Dev', company: 'X', description: 'desc' };
    const user = { employment: [{ jobTitle: 'Dev', company: 'X' }], skills: [{ name: 'JS' }, { name: 'React' }] };
    const current = { skills: ['JS'] };

    const res = await regenerateSection(section, job, user, current);
    // Our mock returns an object mapping job keys; accept object or array
    expect(res).toBeDefined();
    expect(typeof res === 'object' || Array.isArray(res)).toBe(true);
  });

  it('regenerateSection throws for invalid section name', async () => {
    const section = 'not-a-section';
    const job = { title: 'Dev', company: 'X', description: 'desc' };
    const user = { employment: [], skills: [] };
    const current = {};

    await expect(regenerateSection(section, job, user, current)).rejects.toThrow(/Invalid section/);
  });

  it('optimizeResumeSkills surfaces AI errors as rejected promise', async () => {
    const resume = { sections: { skills: [{ name: 'JS' }] } };
    const job = { title: 'Dev', company: 'X', description: '__THROW__' };
    const user = { skills: [{ name: 'JS', level: 'Expert', yearsOfExperience: 5 }] };

    await expect(optimizeResumeSkills(resume, job, user)).rejects.toThrow(/Failed to optimize skills/);
  });
});
