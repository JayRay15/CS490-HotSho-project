import { jest } from '@jest/globals';
import * as detector from '../emailStatusDetector.js';

describe('emailStatusDetector', () => {
  test('detects Rejected from negative language', async () => {
    const subject = 'We regret to inform you';
    const body = 'Unfortunately we have decided to pursue other candidates and are unable to offer you the role.';

    const result = await detector.detectStatusFromEmail(subject, body);

    expect(result.status).toBe('Rejected');
    expect(result.confidence).toBeGreaterThanOrEqual(35);
    expect(result.reason).toContain('Detected based on keywords');
    expect(result.matchedKeywords.length).toBeGreaterThan(0);
  });

  test('detects Offer Extended and boosts with positive sentiment', async () => {
    const subject = 'Congratulations - offer letter';
    const body = 'We are pleased to offer you the position. We are delighted and excited to welcome you.';

    const result = await detector.detectStatusFromEmail(subject, body);

    expect(result.status).toBe('Offer'); // mapped to pipeline status
    expect(result.confidence).toBeGreaterThanOrEqual(35);
    expect(result.reason).toContain('Detected');
  });

  test('detects Phone Screen from interview text', async () => {
    const subject = 'Schedule a phone interview';
    const body = 'Would you be available for a phone screen next week?';

    const result = await detector.detectStatusFromEmail(subject, body);

    expect(result.status).toBe('Phone Screen');
    expect(result.confidence).toBeGreaterThanOrEqual(70);
  });

  test('detects Technical Interview when coding mentioned', async () => {
    const subject = 'Coding interview invite';
    const body = 'We would like to schedule a technical interview and a coding challenge.';

    const result = await detector.detectStatusFromEmail(subject, body);

    expect(result.status).toBe('Interview'); // technical maps to Interview
    // at minimum we should detect 'technical'
    expect(result.matchedKeywords).toEqual(expect.arrayContaining(['technical']));
  });

  test('isCompanyEmail true for company domain and recruiter patterns', () => {
    expect(detector.isCompanyEmail('recruiter@acme.com', ['acme.com'])).toBe(true);
    expect(detector.isCompanyEmail('john.recruit@somecompany.com')).toBe(true);
    expect(detector.isCompanyEmail('hr@example.org')).toBe(true);
    expect(detector.isCompanyEmail('', ['acme.com'])).toBe(false);
  });

  test('extractCompanyFromEmail extracts company reasonably', () => {
    expect(detector.extractCompanyFromEmail('recruiter@acme.com')).toBe('Acme');
  // function extracts the first domain token after removing common tlds/subdomains
  expect(detector.extractCompanyFromEmail('noreply@jobs.bigco.io')).toBe('Jobs');
    expect(detector.extractCompanyFromEmail('no-match')).toBeNull();
    expect(detector.extractCompanyFromEmail('')).toBeNull();
  });

  test('suggestNextAction returns shouldAct correctly', () => {
    const s1 = detector.suggestNextAction('Applied', 7);
    expect(s1.shouldAct).toBe(true);
    const s2 = detector.suggestNextAction('Applied', 3);
    expect(s2.shouldAct).toBe(false);
    const s3 = detector.suggestNextAction('UnknownStatus', 10);
    expect(s3.shouldAct).toBe(false);
  });

  test('categorizeEmailUrgency returns high/medium/low', () => {
    expect(detector.categorizeEmailUrgency('Urgent: decision', '')).toBe('high');
    expect(detector.categorizeEmailUrgency('Interview scheduled', '')).toBe('medium');
    expect(detector.categorizeEmailUrgency('Hello there', 'Just a note')).toBe('low');
  });
});
