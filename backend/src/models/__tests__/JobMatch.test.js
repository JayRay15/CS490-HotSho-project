import { jest, describe, it, expect, beforeAll } from '@jest/globals';

// Use a fresh mongoose instance from the project's model
import mongoose from 'mongoose';

// Import the JobMatch model after loading mongoose
let JobMatch;

beforeAll(async () => {
  // Ensure mongoose has a connection-less state suitable for model creation
  // (creating models/document instances does not require an active DB connection)
  JobMatch = (await import('../JobMatch.js')).JobMatch;
});

describe('JobMatch model', () => {
  it('calculates matchGrade virtual from overallScore', () => {
    const doc = new JobMatch({ overallScore: 90, userId: 'u1', jobId: new mongoose.Types.ObjectId(), categoryScores: { skills: { score: 90, weight: 40 }, experience: { score: 80, weight: 30 }, education: { score: 70, weight: 15 }, additional: { score: 60, weight: 15 } } });
    expect(doc.matchGrade).toBe('Excellent');

    doc.overallScore = 75;
    expect(doc.matchGrade).toBe('Good');

    doc.overallScore = 60;
    expect(doc.matchGrade).toBe('Fair');

    doc.overallScore = 40;
    expect(doc.matchGrade).toBe('Poor');
  });

  it('recalculateOverallScore returns a rounded weighted average when customWeights provided', () => {
    const doc = new JobMatch({
      userId: 'u1',
      jobId: new mongoose.Types.ObjectId(),
      overallScore: 0,
      categoryScores: {
        skills: { score: 80, weight: 40 },
        experience: { score: 70, weight: 30 },
        education: { score: 60, weight: 15 },
        additional: { score: 50, weight: 15 },
      },
      customWeights: { skills: 40, experience: 30, education: 15, additional: 15 },
    });

    const result = doc.recalculateOverallScore();
    // (80*40 + 70*30 + 60*15 + 50*15)/100 = 69.5 -> rounded to 70
    expect(result).toBe(70);
    expect(doc.overallScore).toBe(70);
  });

  it('recalculateOverallScore without customWeights returns a numeric score', () => {
    const doc = new JobMatch({
      userId: 'u1',
      jobId: new mongoose.Types.ObjectId(),
      overallScore: 0,
      categoryScores: {
        skills: { score: 80, weight: 40 },
        experience: { score: 70, weight: 30 },
        education: { score: 60, weight: 15 },
        additional: { score: 50, weight: 15 },
      }
    });

    const result = doc.recalculateOverallScore();
    // Ensure a numeric overall score is produced (non-NaN, finite number between 0 and 100)
    expect(typeof result).toBe('number');
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});
