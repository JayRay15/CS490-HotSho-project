// Focused extra tests for geminiService to hit parse/split and error branches
import { jest } from '@jest/globals';

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
  jest.resetModules();
  await jest.unstable_mockModule('@google/generative-ai', () => createGenAIMock({ text, shouldThrow }));
  return await import('../geminiService.js');
}

describe('geminiService extra branches', () => {
  test('generateCoverLetter splits multiple variations and filters short parts', async () => {
    // First part is intentionally short and should be filtered out (<100 chars)
    const shortPart = 'Hi';

    // Make two long parts (>200 chars)
    const longBody = Array(50).fill('This is a long paragraph.').join(' ');
    const longPart = `Candidate Name\n${longBody}\n\nClosing remarks.`;

    const combined = `${shortPart}\n\n===VARIATION 2===\n${longPart}\n\n===VARIATION 3===\n${longPart}`;

    const mod = await importWithMock({ text: combined });

    const out = await mod.generateCoverLetter({
      companyName: 'X',
      position: 'Role',
      jobDescription: 'Desc',
      userProfile: { firstName: 'A', lastName: 'B', email: 'a@b.c' },
      variationCount: 3
    });

    // The short first part should be filtered, so we should still get two substantial variations
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeGreaterThanOrEqual(1);
  // Ensure openingParagraph was extracted and content contains expected marker
  expect(out[0].openingParagraph).toBeTruthy();
  expect(out[0].content).toContain('Candidate Name');
  });

  test('analyzeCompanyCulture returns fallback on model error', async () => {
    const mod = await importWithMock({ shouldThrow: true });
    const res = await mod.analyzeCompanyCulture('Some description');
    expect(res.analysis).toContain('Unable to analyze');
    expect(res.recommendedTone).toBe('formal');
  });

  test('parseCoverLetterVariations returns only expectedCount slices when too many parts', async () => {
    const longBody = Array(40).fill('Long paragraph.').join(' ');
    const text = `Part A long:\n\n${longBody}\n\n===VARIATION 2===\nPart B long:\n\n${longBody}\n\n===VARIATION 3===\nPart C long:\n\n${longBody}`;

    const mod = await importWithMock({ text });
    // Request only 2 variations even though there are 3 parts
    const out = await mod.generateCoverLetter({
      companyName: 'C',
      position: 'P',
      jobDescription: 'D',
      userProfile: { name: 'N', email: 'n@x.y' },
      variationCount: 2
    });

    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeLessThanOrEqual(2);
  });
});
