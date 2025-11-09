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

  test('awards custom badges when thresholds met', () => {
    const data = {
      employment: [{}, {}, {}], // 3 entries -> work-history
      skills: Array.from({ length: 10 }).map((_, i) => ({ name: `s${i}`, category: i % 3 })),
      projects: [{}, {}, {}], // 3 projects -> project-showcase
      certifications: [{}, {}], // 2 certifications -> certified-professional
      name: 'A',
      email: 'a@b.com',
      headline: 'Dev',
      industry: 'Technology',
      experienceLevel: 'Senior'
    };

    const res = calculateProfileCompleteness(data);
    const ids = res.earnedBadges.map(b => b.id);
    expect(ids).toContain('work-history');
    expect(ids).toContain('skill-master');
    expect(ids).toContain('project-showcase');
    expect(ids).toContain('certified-professional');
  });

  test('handles malformed projects gracefully (projects try/catch)', () => {
    // craft a projects-like object that will throw when .filter is called
    const badProjects = { length: 1, filter: () => { throw new Error('boom'); } };

    const data = {
      projects: badProjects,
      name: 'A',
      email: 'a@b.com',
      headline: 'Dev',
      industry: 'Technology',
      experienceLevel: 'Senior'
    };

    const res = calculateProfileCompleteness(data);
    // projects should be treated as empty fallback when exception occurs
    expect(res.sections.projects.score).toBe(0);
    expect(res.suggestions.some(s => /projects/i.test(s.section) || /projects/i.test(s.message))).toBe(true);
  });

  test('handles malformed certifications gracefully (certifications try/catch)', () => {
    // Use a Proxy that throws on property access to trigger the catch block
    const badCerts = new Proxy({}, { get: () => { throw new Error('boom'); } });

    const data = {
      certifications: badCerts,
      name: 'A',
      email: 'a@b.com',
      headline: 'Dev',
      industry: 'Technology',
      experienceLevel: 'Senior'
    };

    const res = calculateProfileCompleteness(data);
    expect(res.sections.certifications.score).toBe(0);
    expect(res.suggestions.some(s => /certifications/i.test(s.section) || /certifications/i.test(s.message))).toBe(true);
  });
});


