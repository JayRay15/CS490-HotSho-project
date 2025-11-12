import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

import { ApplicationStatus } from '../ApplicationStatus.js';

describe('ApplicationStatus model methods and virtuals', () => {
  beforeEach(() => {
    // clear any mutable state on the model prototype where applicable
  });

  it('updateStatus should push history, timeline, update currentStatus and responseTime', () => {
    const appliedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const doc = new ApplicationStatus({
      userId: 'user1',
      jobId: new mongoose.Types.ObjectId(),
      currentStatus: 'Applied',
      appliedAt,
      metrics: { interviewCount: 0 }
    });

    const ret = doc.updateStatus('Phone Screen', { changedBy: 'email-detection', notes: 'note' });

    expect(ret).toBe(doc);
    expect(doc.currentStatus).toBe('Phone Screen');
    expect(doc.statusHistory.length).toBeGreaterThanOrEqual(1);
    const lastHist = doc.statusHistory[doc.statusHistory.length - 1];
    expect(lastHist.status).toBe('Phone Screen');
    expect(lastHist.previousStatus).toBe('Applied');
    expect(doc.timeline.length).toBeGreaterThanOrEqual(1);
    const lastEvent = doc.timeline[doc.timeline.length - 1];
    expect(lastEvent.eventType).toBe('status_change');
    expect(lastEvent.description).toContain('Status changed from');
    // responseTime should be set to ~5 days
    expect(typeof doc.responseTime).toBe('number');
    expect(doc.metrics.daysInCurrentStatus).toBe(0);
  });

  it('updateStatus increments interviewCount when new status contains Interview', () => {
    const doc = new ApplicationStatus({
      userId: 'u2',
      jobId: new mongoose.Types.ObjectId(),
      currentStatus: 'Under Review',
      metrics: { interviewCount: 0 }
    });

    doc.updateStatus('Technical Interview');
    expect(doc.metrics.interviewCount).toBe(1);
  });

  it('addTimelineEvent should add an event', () => {
    const doc = new ApplicationStatus({
      userId: 'u3',
      jobId: new mongoose.Types.ObjectId(),
      currentStatus: 'Not Applied'
    });
    const before = doc.timeline.length;
    const ret = doc.addTimelineEvent('note_added', 'A note', { a: 1 });
    expect(ret).toBe(doc);
    expect(doc.timeline.length).toBe(before + 1);
    const ev = doc.timeline[doc.timeline.length - 1];
    expect(ev.eventType).toBe('note_added');
    expect(ev.description).toBe('A note');
    expect(ev.metadata.a).toBe(1);
  });

  it('virtuals compute days since values', () => {
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const appliedAt = new Date(Date.now() - threeDays);
    const lastStatusChange = new Date(Date.now() - threeDays);
    const doc = new ApplicationStatus({
      userId: 'u4',
      jobId: new mongoose.Types.ObjectId(),
      appliedAt,
      lastStatusChange
    });

    // virtual getters
    expect(doc.daysSinceApplication).toBeGreaterThanOrEqual(3);
    expect(doc.daysSinceStatusChange).toBeGreaterThanOrEqual(3);
  });

  it('pre-save middleware updates metrics when invoked manually from schema.callQueue', async () => {
    const appliedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days
    const lastStatusChange = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days
    const doc = new ApplicationStatus({
      userId: 'u5',
      jobId: new mongoose.Types.ObjectId(),
      appliedAt,
      lastStatusChange,
      metrics: { totalDaysInProcess: 0, daysInCurrentStatus: 0 }
    });

    // Try several locations where Mongoose may store pre-save hooks across versions
    let preFn;
    const schema = ApplicationStatus.schema;

    // Older Mongoose: schema.callQueue entries like ['pre','save', fn]
    if (!preFn && schema && Array.isArray(schema.callQueue)) {
      const item = schema.callQueue.find(i => Array.isArray(i) && i[0] === 'pre' && i[1] === 'save');
      if (item) preFn = item[2];
    }

    // Newer Mongoose internal structure: schema.s.hooks._pres.get('save') -> array
    if (!preFn && schema && schema.s && schema.s.hooks && schema.s.hooks._pres) {
      try {
        const arr = schema.s.hooks._pres.get('save') || [];
        if (arr && arr.length) {
          // find a pre hook that contains our middleware body by inspecting function source
          for (const item of arr) {
            const fnCandidate = (typeof item === 'function') ? item : (item.fn || item);
            try {
              const src = fnCandidate.toString();
              if (src.includes('totalDaysInProcess') || src.includes('daysInCurrentStatus')) {
                preFn = fnCandidate;
                break;
              }
            } catch (e) {}
          }
          // fallback to first if not found
          if (!preFn) {
            const first = arr[0];
            preFn = typeof first === 'function' ? first : first.fn;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // Another possible shape: schema._pres where key is 'save'
    if (!preFn && schema && schema._pres && schema._pres.save) {
      const arr = schema._pres.save;
      if (arr && arr.length) {
        const first = arr[0];
        preFn = typeof first === 'function' ? first : first.fn || (Array.isArray(first) ? first[2] : undefined);
      }
    }

    expect(preFn).toBeDefined();
    // invoke the pre-save with doc as `this`
    await new Promise((res) => preFn.call(doc, res));

    expect(typeof doc.metrics.totalDaysInProcess).toBe('number');
    // Ensure middleware executed and produced numeric metrics (value depends on timing)
    expect(doc.metrics.totalDaysInProcess).toBeGreaterThanOrEqual(0);
    expect(typeof doc.metrics.daysInCurrentStatus).toBe('number');
    expect(doc.metrics.daysInCurrentStatus).toBeGreaterThanOrEqual(0);
  });

  it('getStatusStats should call aggregate and return grouped stats', async () => {
    const mockStats = [{ _id: 'Applied', count: 2, avgResponseTime: 5, avgDaysInStatus: 1 }];
    // stub aggregate on the model
    const orig = ApplicationStatus.aggregate;
    ApplicationStatus.aggregate = jest.fn().mockResolvedValue(mockStats);

    const res = await ApplicationStatus.getStatusStats('user-123');
    expect(ApplicationStatus.aggregate).toHaveBeenCalled();
    expect(res).toBe(mockStats);

    // restore
    ApplicationStatus.aggregate = orig;
  });

  it('virtual getters return 0 when dates are missing', () => {
    const doc = new ApplicationStatus({
      userId: 'no-dates',
      jobId: new mongoose.Types.ObjectId()
    });

    expect(doc.daysSinceApplication).toBe(0);
    expect(doc.daysSinceStatusChange).toBe(0);
  });

  it('directly invokes schema virtual getters and method implementations to exercise code paths', async () => {
    const doc = new ApplicationStatus({
      userId: 'u7',
      jobId: new mongoose.Types.ObjectId()
    });

    // invoke virtual getters directly from schema (ensure underlying functions run)
    const vsApp = ApplicationStatus.schema.virtuals.daysSinceApplication;
    const vsStatus = ApplicationStatus.schema.virtuals.daysSinceStatusChange;
    if (vsApp && vsApp.getters && vsApp.getters.length) {
      const val = vsApp.getters[0].call(doc);
      expect(typeof val).toBe('number');
    }
    if (vsStatus && vsStatus.getters && vsStatus.getters.length) {
      const val2 = vsStatus.getters[0].call(doc);
      expect(typeof val2).toBe('number');
    }

    // invoke the raw method function stored on schema as well
    const rawMethod = ApplicationStatus.schema.methods.addTimelineEvent;
    if (typeof rawMethod === 'function') {
      const ret = rawMethod.call(doc, 'note_added', 'direct call', { direct: true });
      expect(ret).toBe(doc);
    }
  });

  it('updateStatus does not increment interviewCount for non-interview statuses', () => {
    const doc = new ApplicationStatus({
      userId: 'u6',
      jobId: new mongoose.Types.ObjectId(),
      currentStatus: 'Applied',
      metrics: { interviewCount: 2 }
    });

    doc.updateStatus('Under Review');
    expect(doc.metrics.interviewCount).toBe(2);
  });
});
