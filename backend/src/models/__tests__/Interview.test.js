import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { Interview } from '../Interview.js';

describe('Interview model virtuals and methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('timeUntilInterview virtual returns future time info and not past', () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 30 * 60 * 1000); // 3 days, 2 hours, 30 minutes
    const doc = new Interview({ userId: 'u1', jobId: new mongoose.Types.ObjectId(), title: 'Dev', company: 'C', interviewType: 'Video Call', scheduledDate: future });
    const tu = doc.timeUntilInterview;
    expect(tu).toHaveProperty('isPast', false);
    expect(tu.hours).toBeGreaterThanOrEqual(2);
    expect(tu.days).toBeGreaterThanOrEqual(3 - 1); // allow rounding
    expect(typeof tu.minutes).toBe('number');
  });

  it('formattedDate virtual returns a localized string containing weekday', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const doc = new Interview({ userId: 'u1', jobId: new mongoose.Types.ObjectId(), title: 'Dev', company: 'C', interviewType: 'Video Call', scheduledDate: future });
    const fd = doc.formattedDate;
    expect(typeof fd).toBe('string');
    // Should contain a weekday name like Monday, Tuesday, etc.
    expect(fd.match(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/)).toBeTruthy();
  });

  it('generatePreparationTasks includes base tasks and type-specific tasks for Technical', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const doc = new Interview({ userId: 'u1', jobId: new mongoose.Types.ObjectId(), title: 'Dev', company: 'C', interviewType: 'Technical', scheduledDate: future, duration: 60 });
    const tasks = doc.generatePreparationTasks();
    expect(Array.isArray(tasks)).toBe(true);
    // base tasks should be present
    expect(tasks.some(t => t.title && t.title.includes('Research the company'))).toBe(true);
    // technical-specific task
    expect(tasks.some(t => t.title && t.title.includes('Review technical concepts'))).toBe(true);
    // Ensure dueDate values are Date objects and relative to scheduledDate
    expect(tasks.every(t => t.dueDate instanceof Date)).toBe(true);
  });

  it('generatePreparationTasks includes phone-specific tasks for Phone Screen', () => {
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const doc = new Interview({ userId: 'u1', jobId: new mongoose.Types.ObjectId(), title: 'Dev', company: 'C', interviewType: 'Phone Screen', scheduledDate: future });
    const tasks = doc.generatePreparationTasks();
    expect(tasks.some(t => t.title && t.title.includes('Find a quiet location'))).toBe(true);
  });

  it('checkConflict returns false and clears conflictWarning when no conflicting interviews', async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const doc = new Interview({ _id: new mongoose.Types.ObjectId(), userId: 'user123', jobId: new mongoose.Types.ObjectId(), title: 'Dev', company: 'C', interviewType: 'Video Call', scheduledDate: future, duration: 60 });

    // Mock Interview.find to return empty array
    const spy = jest.spyOn(Interview, 'find').mockResolvedValue([]);

    const res = await doc.checkConflict();
    expect(res).toBe(false);
    expect(doc.conflictWarning.hasConflict).toBe(false);
    expect(doc.conflictWarning.conflictDetails).toBe('');
    spy.mockRestore();
  });

  it('checkConflict detects conflicts and sets conflictWarning', async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const doc = new Interview({ _id: new mongoose.Types.ObjectId(), userId: 'user123', jobId: new mongoose.Types.ObjectId(), title: 'Dev', company: 'C', interviewType: 'Video Call', scheduledDate: future, duration: 60 });

    // Mock Interview.find to return one conflicting interview
    const conflictDoc = { _id: new mongoose.Types.ObjectId(), scheduledDate: new Date(future.getTime() + 30 * 60 * 1000) };
    const spy = jest.spyOn(Interview, 'find').mockResolvedValue([conflictDoc]);

    const res = await doc.checkConflict();
    expect(res).toBe(true);
    expect(doc.conflictWarning.hasConflict).toBe(true);
    expect(doc.conflictWarning.conflictDetails).toMatch(/You have 1 other interview/);
    spy.mockRestore();
  });
});
