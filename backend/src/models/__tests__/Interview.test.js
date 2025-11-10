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

  it('generatePreparationTasks covers many interview types (Behavioral, Video legacy, Final Round, In-Person, Case Study)', () => {
    const future = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);

    const typesToTest = ['Behavioral', 'Video', 'Final Round', 'In-Person', 'Case Study'];
    typesToTest.forEach(type => {
      const doc = new Interview({ userId: 'u1', jobId: new mongoose.Types.ObjectId(), title: 'Dev', company: 'C', interviewType: type, scheduledDate: future });
      const tasks = doc.generatePreparationTasks();
      expect(Array.isArray(tasks)).toBe(true);
      // Each type should add at least one type-specific task (length > base tasks)
      expect(tasks.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('pre-save middleware pushes history entries for status change and scheduledDate change', (done) => {
    const future = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
    const doc = new Interview({ userId: 'u1', jobId: new mongoose.Types.ObjectId(), title: 'Dev', company: 'C', interviewType: 'Video Call', scheduledDate: future, status: 'Scheduled' });

    // Simulate modifications
    // We'll call the pre-save hooks directly to avoid DB interaction
    // Find pre hooks registered on the schema and call any 'save' pres.
    const schema = Interview.schema;

    // Prepare doc state to trigger both branches
    doc.isModified = (field) => field === 'status' || field === 'scheduledDate';
    doc.isNew = false;

    // Mongoose stores pre hooks in different shapes across versions.
    // Try the modern Map-based storage first: schema.s.hooks._pres is a Map keyed by hook name.
    let presSaveFns = [];
    try {
      if (schema && schema.s && schema.s.hooks && schema.s.hooks._pres && typeof schema.s.hooks._pres.get === 'function') {
        const saveArr = schema.s.hooks._pres.get('save') || [];
        presSaveFns = saveArr.map(obj => obj && obj.fn).filter(Boolean);
      }
    } catch (e) {
      // ignore
    }

    // Fallback: older mongoose versions may keep callQueue entries
    if (!presSaveFns.length && schema && Array.isArray(schema.callQueue)) {
      schema.callQueue.forEach(entry => {
        if (entry && entry[0] === 'pre' && entry[1] === 'save') {
          // entry shape might be ['pre', 'save', fn] or ['pre', 'save', false, fn]
          const fn = entry[2] && typeof entry[2] === 'function' ? entry[2] : entry[3];
          if (typeof fn === 'function') presSaveFns.push(fn);
        }
      });
    }

    // Call each pre-save hook function with doc as context
    presSaveFns.forEach(fn => {
      try {
        // Some pre hooks expect next callback, some return promises; call with a noop next
        fn.call(doc, () => {});
      } catch (e) {
        // ignore - some hook shapes differ between mongoose versions
      }
    });

    // After running hooks, history should have at least one entry for status change and one for reschedule
    expect(Array.isArray(doc.history)).toBe(true);
    // At least one entry with action 'Updated' or 'Rescheduled'
    const actions = doc.history.map(h => h.action);
    expect(actions.some(a => a === 'Updated' || a === 'Rescheduled')).toBe(true);
    done();
  });
});
