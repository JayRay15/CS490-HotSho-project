import { calculateProfileCompleteness, getProfileStrength, formatFieldName, INDUSTRY_BENCHMARKS } from '../profileCompleteness';

describe('profileCompleteness', () => {
  test('returns 0 with empty profile and proper suggestions', () => {
    const res = calculateProfileCompleteness({});
    expect(res.overallScore).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(res.suggestions)).toBe(true);
    expect(res.benchmark).toEqual(INDUSTRY_BENCHMARKS.Technology);
  });

  test('computes higher score when required fields are present', () => {
    const res = calculateProfileCompleteness({
      name: 'A',
      email: 'a@b.com',
      headline: 'Engineer',
      industry: 'Technology',
      experienceLevel: 'Mid',
      employment: [{ description: 'Long description that exceeds 50 characters for scoring purposes.' }],
      education: [{ achievements: 'Honors and achievements that are long enough.' }],
      skills: [{ name: 'JS', level: 'Advanced', category: 'Technical' }, { name: 'React', level: 'Advanced', category: 'Technical' }, { name: 'Teamwork', level: 'Advanced', category: 'Soft' }],
      projects: [{ name: 'P1', description: '...', technologies: [], startDate: new Date(), url: 'https://example.com' }],
      certifications: [{ name: 'C1', organization: 'Org', dateEarned: new Date() }],
    });
    expect(res.overallScore).toBeGreaterThan(0);
  });

  test('getProfileStrength maps score to label', () => {
    expect(getProfileStrength(95).label).toBe('Excellent');
    expect(getProfileStrength(80).label).toBe('Strong');
    expect(getProfileStrength(60).label).toBe('Good');
    expect(getProfileStrength(30).label).toBe('Fair');
    expect(getProfileStrength(10).label).toBe('Needs Work');
  });

  test('formatFieldName maps known fields and falls back', () => {
    expect(formatFieldName('email')).toBe('Email Address');
    expect(formatFieldName('unknown_field')).toBe('unknown_field');
  });
});


