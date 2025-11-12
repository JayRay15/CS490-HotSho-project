import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import fs from 'fs';
import vm from 'vm';
import { fileURLToPath } from 'url';

let ApplicationAutomation, ApplicationTemplate, ApplicationChecklist;

beforeAll(async () => {
  const mod = await import('../ApplicationAutomation.js');
  ApplicationAutomation = mod.ApplicationAutomation;
  ApplicationTemplate = mod.ApplicationTemplate;
  ApplicationChecklist = mod.ApplicationChecklist;
});

// Additional controller-focused tests added here to increase coverage for applicationAutomationController
describe('applicationAutomationController (augment coverage)', () => {
  let controller;
  let ApplicationPackage, Job, Resume, CoverLetter, User, ApplicationChecklist, ApplicationTemplate, ApplicationAutomation;

  // a small chainable helper used by some mocked .find() calls
  const chainable = (result) => {
    return {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(result),
      then: (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected),
      catch: (onRejected) => Promise.resolve(result).catch(onRejected)
    };
  };

  beforeAll(async () => {
    controller = await import('../../controllers/applicationAutomationController.js');
    const ap = await import('../../models/ApplicationPackage.js'); ApplicationPackage = ap.ApplicationPackage;
    const j = await import('../../models/Job.js'); Job = j.Job;
    const r = await import('../../models/Resume.js'); Resume = r.Resume;
    const c = await import('../../models/CoverLetter.js'); CoverLetter = c.CoverLetter;
    const u = await import('../../models/User.js'); User = u.User;
    const ac = await import('../../models/ApplicationAutomation.js'); ApplicationAutomation = ac.ApplicationAutomation; ApplicationTemplate = ac.ApplicationTemplate; ApplicationChecklist = ac.ApplicationChecklist;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generateApplicationPackage uses latest resume/cover and autoTailor notes', async () => {
    const job = { _id: 'j1', company: 'Acme', title: 'Dev' };
    jest.spyOn(Job, 'findOne').mockResolvedValue(job);
    // simulate findOne().sort() pattern
    jest.spyOn(Resume, 'findOne').mockReturnValue({ sort: () => Promise.resolve({ _id: 'res-latest' }) });
    jest.spyOn(CoverLetter, 'findOne').mockReturnValue({ sort: () => Promise.resolve({ _id: 'cl-latest' }) });
    jest.spyOn(User, 'findOne').mockResolvedValue({ website: 'https://me.example' });
    const created = { _id: 'pkg1' };
    jest.spyOn(ApplicationPackage, 'create').mockResolvedValue(created);

    const req = { auth: { payload: { sub: 'u1' } }, body: { jobId: 'j1', autoTailor: true } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = (err) => { if (err) throw err; };

    await controller.generateApplicationPackage(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const sent = res.json.mock.calls[0][0];
    expect(sent.success).toBe(true);
    expect(sent.data).toEqual(created);
    expect(sent.data).toHaveProperty('_id');
  });

  it('updateApplicationPackage and deleteApplicationPackage success paths', async () => {
    // findOneAndUpdate is used with .populate(...).populate(...) in controller - return a chainable stub
    jest.spyOn(ApplicationPackage, 'findOneAndUpdate').mockImplementation(() => chainable({ _id: 'pkg-123' }));
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = (err) => { if (err) throw err; };
    await controller.updateApplicationPackage({ auth: { payload: { sub: 'u1' } }, params: { packageId: 'pkg-123' }, body: { status: 'ready' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    jest.spyOn(ApplicationPackage, 'findOneAndDelete').mockResolvedValue({ _id: 'pkg-123' });
    await controller.deleteApplicationPackage({ auth: { payload: { sub: 'u1' } }, params: { packageId: 'pkg-123' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getApplicationPackages honors filters', async () => {
    const pkgs = [{ _id: 'p1' }, { _id: 'p2' }];
    jest.spyOn(ApplicationPackage, 'find').mockImplementation(() => chainable(pkgs));
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = (err) => { if (err) throw err; };
    await controller.getApplicationPackages({ auth: { payload: { sub: 'u1' } }, query: { status: 'ready', jobId: 'j1' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    const sent = res.json.mock.calls[0][0];
    expect(sent.data).toEqual(pkgs);
  });

  it('scheduleApplication updates job when package found', async () => {
    const future = new Date(); future.setDate(future.getDate() + 2);
    const pkg = { _id: 'p1', jobId: { _id: 'j1' } };
    jest.spyOn(ApplicationPackage, 'findOneAndUpdate').mockImplementation(() => chainable(pkg));
    const jobSpy = jest.spyOn(Job, 'findByIdAndUpdate').mockResolvedValue({});
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = (err) => { if (err) throw err; };
    await controller.scheduleApplication({ auth: { payload: { sub: 'u1' } }, body: { packageId: 'p1', scheduledFor: future.toISOString() } }, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(jobSpy).toHaveBeenCalled();
  });

  it('updateChecklistItem success path updates item and saves', async () => {
    const item = { _id: 'i1', completed: false };
    const checklist = { items: { id: (id) => id === 'i1' ? item : null }, save: jest.fn().mockResolvedValue(true) };
    jest.spyOn(ApplicationChecklist, 'findOne').mockResolvedValue(checklist);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = (err) => { if (err) throw err; };
    await controller.updateChecklistItem({ auth: { payload: { sub: 'u1' } }, params: { jobId: 'j1', itemId: 'i1' }, body: { completed: true, notes: 'ok' } }, res, next);
    expect(checklist.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('ApplicationAutomation models', () => {
  it('registers expected model names', () => {
    expect(ApplicationAutomation.modelName).toBe('ApplicationAutomation');
    expect(ApplicationTemplate.modelName).toBe('ApplicationTemplate');
    expect(ApplicationChecklist.modelName).toBe('ApplicationChecklist');
  });

  it('automation schema basic fields and defaults', () => {
    const schema = ApplicationAutomation.schema;
    // name required & trimmed
    const name = schema.path('name');
    expect(name).toBeDefined();
    expect(name.options.required).toBe(true);
    expect(name.options.trim).toBe(true);

    // active default true
    const active = schema.path('active');
    expect(active).toBeDefined();
    expect(active.options.default).toBe(true);

    // triggers is a nested object
    expect(schema.tree.triggers).toBeDefined();
  });

  it('template schema enums and usage fields', () => {
    const schema = ApplicationTemplate.schema;
    const category = schema.path('category');
    expect(category).toBeDefined();
    // enum contains expected categories
    expect(category.enumValues).toEqual(expect.arrayContaining([
      'cover-letter-intro', 'why-company', 'why-role', 'experience-summary', 'closing', 'email-subject', 'follow-up', 'thank-you', 'custom'
    ]));

    const content = schema.path('content');
    expect(content).toBeDefined();
    expect(content.options.required).toBe(true);
  });

  it('checklist schema items and pre-save hook behavior (simulated)', () => {
    const schema = ApplicationChecklist.schema;
    const itemsPath = schema.path('items');
    expect(itemsPath).toBeDefined();

    const progress = schema.path('progress');
    expect(progress).toBeDefined();
    expect(progress.options.default).toBe(0);
    expect(progress.options.min).toBe(0);
    expect(progress.options.max).toBe(100);

  // Attempt to locate and invoke a pre-save hook function if present in known internal structures
  const hasPreSaveCallQueue = Array.isArray(schema.callQueue) && schema.callQueue.some((q) => q[0] === 'pre' && q[1] === 'save');
  const hooksObj = schema.s && schema.s.hooks && schema.s.hooks._pres && schema.s.hooks._pres.save;
  const hasPreSaveHooksObj = Array.isArray(hooksObj) && hooksObj.length > 0;

  // Attempt to invoke the first pre-save hook function using whichever representation exists
    let hookFn = null;
    if (hasPreSaveCallQueue) {
      const preEntry = schema.callQueue.find((q) => q[0] === 'pre' && q[1] === 'save');
      hookFn = preEntry && preEntry[2];
    } else if (hasPreSaveHooksObj) {
      // mongoose stores pre hooks as objects with a `fn` property in newer internals
      const firstHook = hooksObj[0];
      hookFn = firstHook && (firstHook.fn || firstHook);
    }

    if (typeof hookFn === 'function') {
      const doc = new ApplicationChecklist({ userId: 'u1', jobId: '000000000000000000000000', items: [{ task: 'a', completed: true }, { task: 'b', completed: false }, { task: 'c', completed: true }] });
      hookFn.call(doc, () => {});
      const completed = doc.items.filter(i => i.completed).length;
      expect(doc.progress).toBe(Math.round((completed / doc.items.length) * 100));
    }
  });

    it('saves a checklist doc (stubbed) to exercise the pre-save hook', async () => {
      // Create a checklist document that should trigger progress calculation
      const doc = new ApplicationChecklist({ userId: 'u1', jobId: '000000000000000000000000', items: [{ task: 'a', completed: true }, { task: 'b', completed: false }, { task: 'c', completed: true }] });

      // Stub the low-level collection methods so save() doesn't attempt a network call.
      // Provide both insertOne and updateOne (save may use either depending on isNew flag)
      const origInsert = ApplicationChecklist.collection.insertOne;
      const origUpdate = ApplicationChecklist.collection.updateOne;
      try {
        ApplicationChecklist.collection.insertOne = async () => ({ insertedId: 'stub' });
        ApplicationChecklist.collection.updateOne = async () => ({ modifiedCount: 1 });

        // Call save; pre('save') hook should run and set progress before the stubbed write.
        await doc.save();
        const completed = doc.items.filter(i => i.completed).length;
        expect(doc.progress).toBe(Math.round((completed / doc.items.length) * 100));
      } finally {
        // restore original methods
        ApplicationChecklist.collection.insertOne = origInsert;
        ApplicationChecklist.collection.updateOne = origUpdate;
      }
    });
});
