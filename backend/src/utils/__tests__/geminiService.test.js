// Ensure mock is registered before importing the module under test
import { jest } from '@jest/globals';

// Helper to create a mock factory for @google/generative-ai
function createGenAIMock({ text = '', shouldThrow = false } = {}) {
  return {
    __esModule: true,
    GoogleGenerativeAI: class {
      constructor() {}
      getGenerativeModel() {
        return {
          generateContent: async () => {
            if (shouldThrow) throw new Error('model failure');
            return { response: Promise.resolve({ text: () => text }) };
          }
        };
      }
    }
  };
}

async function importWithMock({ text = '', shouldThrow = false } = {}) {
  // reset module registry so geminiService picks up the mock
  jest.resetModules();
  // For ESM environment use unstable_mockModule to mock before dynamic import
  await jest.unstable_mockModule('@google/generative-ai', () => createGenAIMock({ text, shouldThrow }));
  return await import('../geminiService.js');
}

describe('geminiService', () => {
  const jobPosting = { title: 'SWE', company: 'Acme', description: 'Do things', requirements: 'JS' };
  const userProfile = { employment: [], skills: [], education: [], projects: [], certifications: [] };
  const template = { layout: { projectFormat: { titleWithTech: false, hasBullets: true, bulletCharacter: '•' }, experienceFormat: { titleCompanySameLine: false, datesOnRight: false, hasBullets: true, bulletCharacter: '•', bulletIndentation: 2 }, educationFormat: { order: ['degree','institution','dates'], datesOnRight: false, locationAfterInstitution: false, gpaSeparateLine: false } } };

  test('generateResumeContentVariations parses plain JSON response', async () => {
    const mockText = JSON.stringify({ variations: [{ variationNumber: 1, emphasis: 'Technical' }] });
    const mod = await importWithMock({ text: mockText });
    const res = await mod.generateResumeContentVariations(jobPosting, userProfile, template, 1);
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].variationNumber).toBe(1);
  });

  test('generateResumeContentVariations handles fenced code block JSON', async () => {
    const mockText = '```json' + JSON.stringify({ variations: [{ variationNumber: 2 }] }) + '```';
    const mod = await importWithMock({ text: mockText });
    const res = await mod.generateResumeContentVariations(jobPosting, userProfile, template, 1);
    expect(res[0].variationNumber).toBe(2);
  });

  test('generateResumeContent throws when required args missing', async () => {
    const mod = await importWithMock({ text: '{}' });
    await expect(mod.generateResumeContent(null, null, null)).rejects.toThrow('jobPosting and userProfile are required');
  });

  test('generateResumeContent returns parsed JSON and accepts null template', async () => {
    const mod = await importWithMock({ text: JSON.stringify({ summary: 'x' }) });
    const out = await mod.generateResumeContent(jobPosting, userProfile, null);
    expect(out.summary).toBe('x');
  });

  test('generateResumeContent surfaces model errors as thrown Error', async () => {
    const mod = await importWithMock({ shouldThrow: true });
    await expect(mod.generateResumeContent(jobPosting, userProfile, template)).rejects.toThrow(/Failed to generate resume content/);
  });

  test('regenerateSection summary returns plain text wrapped as object', async () => {
    const mod = await importWithMock({ text: 'A fresh summary from model.' });
    const out = await mod.regenerateSection('summary', jobPosting, userProfile, { summary: 'old' });
    expect(out.summary).toContain('fresh summary');
  });

  test('regenerateSection experience returns JSON parsed bullets', async () => {
    const mod = await importWithMock({ text: JSON.stringify({ job0: ['b1', 'b2'] }) });
    const out = await mod.regenerateSection('experience', jobPosting, userProfile, {});
    expect(out.job0).toEqual(['b1', 'b2']);
  });

  test('regenerateSection skills returns JSON array', async () => {
    const mod = await importWithMock({ text: JSON.stringify(['s1', 's2']) });
    const out = await mod.regenerateSection('skills', jobPosting, userProfile, { skills: ['old'] });
    expect(Array.isArray(out)).toBe(true);
  });

  test('regenerateSection invalid section throws', async () => {
    const mod = await importWithMock({ text: '{}' });
    await expect(mod.regenerateSection('invalid', jobPosting, userProfile, {})).rejects.toThrow('Invalid section');
  });

  test('analyzeATSCompatibility returns parsed JSON', async () => {
    const mod = await importWithMock({ text: JSON.stringify({ score: 85, missingKeywords: [], keywordDensity: 'optimal', suggestions: [], matchedKeywords: [] }) });
    const out = await mod.analyzeATSCompatibility({ summary: 's', relevantSkills: [] }, jobPosting);
    expect(out.score).toBe(85);
  });

  test('optimizeResumeSkills returns parsed JSON', async () => {
    const mod = await importWithMock({ text: JSON.stringify({ matchScore: 90, optimizedSkills: [] }) });
    const out = await mod.optimizeResumeSkills({ sections: { skills: [] } }, jobPosting, userProfile);
    expect(out.matchScore).toBe(90);
  });

  test('tailorExperience returns parsed JSON structure', async () => {
    const mod = await importWithMock({ text: JSON.stringify({ experiences: [{ experienceIndex: 0, jobTitle: 'x', relevanceScore: 80 }], summary: 'ok' }) });
    const out = await mod.tailorExperience({ sections: { experience: [] } }, jobPosting, { employment: [] });
    expect(Array.isArray(out.experiences)).toBe(true);
    expect(out.summary).toBe('ok');
  });

  test('generateResumeContentVariations rejects when JSON is invalid (parse-fallback exercised)', async () => {
    const badJson = '{"variations":[{"variationNumber":1,},],}';
    const mod = await importWithMock({ text: badJson });
    await expect(mod.generateResumeContentVariations(jobPosting, userProfile, template, 1)).rejects.toThrow(/Failed to generate resume content variations/);
  });

  test('generateResumeContent uses projectFormat.titleWithTech true branch in prompt and parses response', async () => {
    const tpl = JSON.parse(JSON.stringify(template));
    tpl.layout.projectFormat.titleWithTech = true;
    const mod = await importWithMock({ text: JSON.stringify({ summary: 'x', projects: [] }) });
    const out = await mod.generateResumeContent(jobPosting, userProfile, tpl);
    expect(out.summary).toBe('x');
  });

  test('regenerateSection summary returns parsed JSON when model returns JSON', async () => {
    const mod = await importWithMock({ text: JSON.stringify({ summary: 'fresh JSON summary' }) });
    const out = await mod.regenerateSection('summary', jobPosting, userProfile, { summary: 'old' });
    expect(out.summary).toBe('fresh JSON summary');
  });

  test('analyzeATSCompatibility rejects when JSON is invalid (parse-fallback exercised)', async () => {
    const bad = '{"score":85,}';
    const mod = await importWithMock({ text: bad });
    await expect(mod.analyzeATSCompatibility({ summary: 's', relevantSkills: [] }, jobPosting)).rejects.toThrow(/Failed to analyze ATS compatibility/);
  });

  test('generateResumeContent exercises multiple template branches and userProfile shapes', async () => {
    const detailedProfile = {
      employment: [
        { jobTitle: 'Engineer', company: 'A', startDate: '2020-01-01', endDate: '2021-01-01', description: 'Did X', isCurrentPosition: false },
        { jobTitle: 'Senior Engineer', company: 'B', startDate: '2021-02-01', isCurrentPosition: true, description: 'Led Y' }
      ],
      skills: [{ name: 'JavaScript', level: 'Advanced' }, { name: 'Node.js', level: 'Advanced' }],
      education: [{ degree: 'BS', fieldOfStudy: 'CS', institution: 'Uni', graduationYear: 2019 }],
      projects: [{ name: 'Proj', description: 'Desc', technologies: ['JS', 'Node'] }],
      certifications: [{ name: 'Cert', issuingOrganization: 'Org' }]
    };

    // Case A: no template (should use default branches)
    const modA = await importWithMock({ text: JSON.stringify({ summary: 'A' }) });
    const outA = await modA.generateResumeContent(jobPosting, detailedProfile, null);
    expect(outA.summary).toBe('A');

    // Case B: template with projectFormat.titleWithTech = true
    const tplB = JSON.parse(JSON.stringify(template));
    tplB.layout.projectFormat.titleWithTech = true;
    const modB = await importWithMock({ text: JSON.stringify({ summary: 'B' }) });
    const outB = await modB.generateResumeContent(jobPosting, detailedProfile, tplB);
    expect(outB.summary).toBe('B');

  // Case C: template missing projectFormat to hit the else branch
  // Provide educationFormat.order so prompt-building doesn't throw when joining
  const tplC = { layout: { experienceFormat: {}, educationFormat: { order: ['degree','institution','dates'], datesOnRight: false, locationAfterInstitution: false, gpaSeparateLine: false } } };
    const modC = await importWithMock({ text: JSON.stringify({ summary: 'C' }) });
    const outC = await modC.generateResumeContent(jobPosting, detailedProfile, tplC);
    expect(outC.summary).toBe('C');
  });

  test('generateResumeContent repairs trailing commas and parses', async () => {
    const badJson = '{"summary":"fixed",}';
    const mod = await importWithMock({ text: badJson });
    const out = await mod.generateResumeContent(jobPosting, userProfile, template);
    expect(out.summary).toBe('fixed');
  });

  test('generateResumeContent rejects when response is unrecoverable invalid JSON', async () => {
    const mod = await importWithMock({ text: 'not a json at all!!!' });
    await expect(mod.generateResumeContent(jobPosting, userProfile, template)).rejects.toThrow(/Failed to generate resume content/);
  });

  test('analyzeATSCompatibility rejects on invalid JSON (no repair path)', async () => {
    const bad = '{"score":85,}';
    const mod = await importWithMock({ text: bad });
    await expect(mod.analyzeATSCompatibility({ summary: 's', relevantSkills: [] }, jobPosting)).rejects.toThrow(/Failed to analyze ATS compatibility/);
  });

  test('optimizeResumeSkills surfaces model errors as thrown Error', async () => {
    const mod = await importWithMock({ shouldThrow: true });
    await expect(mod.optimizeResumeSkills({ sections: { skills: [] } }, jobPosting, userProfile)).rejects.toThrow(/Failed to optimize skills/);
  });

  test('tailorExperience throws when model returns invalid JSON', async () => {
    const mod = await importWithMock({ text: '### not json ###' });
    await expect(mod.tailorExperience({ sections: { experience: [] } }, jobPosting, userProfile)).rejects.toThrow(/Failed to tailor experience/);
  });

  test('analyzeATSCompatibility handles fenced ```json response', async () => {
    const mockText = '```json' + JSON.stringify({ score: 90, missingKeywords: [], keywordDensity: 'good', suggestions: [], matchedKeywords: [] }) + '```';
    const mod = await importWithMock({ text: mockText });
    const out = await mod.analyzeATSCompatibility({ summary: 's', relevantSkills: [] }, jobPosting);
    expect(out.score).toBe(90);
  });

  test('optimizeResumeSkills handles fenced ``` response', async () => {
    const mockText = '```' + JSON.stringify({ matchScore: 77, optimizedSkills: [] }) + '```';
    const mod = await importWithMock({ text: mockText });
    const out = await mod.optimizeResumeSkills({ sections: { skills: [] } }, jobPosting, userProfile);
    expect(out.matchScore).toBe(77);
  });

  test('tailorExperience handles fenced ```json response', async () => {
    const mockText = '```json' + JSON.stringify({ experiences: [{ experienceIndex: 0, jobTitle: 'Z', relevanceScore: 50 }], summary: 'ok2' }) + '```';
    const mod = await importWithMock({ text: mockText });
    const out = await mod.tailorExperience({ sections: { experience: [] } }, jobPosting, { employment: [] });
    expect(out.summary).toBe('ok2');
  });

  test('regenerateSection experience handles fenced code block JSON', async () => {
    const mockText = '```json' + JSON.stringify({ job0: ['f1', 'f2'] }) + '```';
    const mod = await importWithMock({ text: mockText });
    const out = await mod.regenerateSection('experience', jobPosting, userProfile, {});
    expect(out.job0).toEqual(['f1', 'f2']);
  });

  test('regenerateSection summary handles fenced code block JSON', async () => {
    const mockText = '```json' + JSON.stringify({ summary: 'fenced summary' }) + '```';
    const mod = await importWithMock({ text: mockText });
    const out = await mod.regenerateSection('summary', jobPosting, userProfile, { summary: 'old' });
    expect(out.summary).toBe('fenced summary');
  });
});
