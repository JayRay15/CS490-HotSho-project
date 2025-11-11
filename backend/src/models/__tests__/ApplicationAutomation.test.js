import { describe, it, expect, beforeAll } from '@jest/globals';
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
