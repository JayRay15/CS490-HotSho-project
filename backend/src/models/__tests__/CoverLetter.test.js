import { jest } from '@jest/globals';

// Import the model module (top-level await supported in Jest ESM config)
const mod = await import('../CoverLetter.js');
const { CoverLetter } = mod;

describe('CoverLetter model', () => {
  test('exports a Mongoose model named CoverLetter', () => {
    expect(CoverLetter).toBeDefined();
    expect(CoverLetter.modelName).toBe('CoverLetter');
  });

  test('schema has expected paths and options', () => {
    const schema = CoverLetter.schema;
    // Required fields
    expect(schema.path('userId')).toBeDefined();
    expect(schema.path('userId').options.required).toBe(true);

    expect(schema.path('name')).toBeDefined();
    expect(schema.path('name').options.required).toBe(true);
    expect(schema.path('name').options.trim).toBe(true);

    expect(schema.path('content')).toBeDefined();
    expect(schema.path('content').options.required).toBe(true);

    // Style enum and default
    const stylePath = schema.path('style');
    expect(stylePath).toBeDefined();
    expect(Array.isArray(stylePath.options.enum)).toBe(true);
    expect(stylePath.options.default).toBe('formal');

    // Indexes include userId + createdAt and userId + isArchived
    const indexes = schema.indexes().map(([fields]) => fields);
    const hasUserCreatedAt = indexes.some(idx => idx.userId === 1 && idx.createdAt === -1);
    const hasUserIsArchived = indexes.some(idx => idx.userId === 1 && idx.isArchived === 1);
    expect(hasUserCreatedAt).toBe(true);
    expect(hasUserIsArchived).toBe(true);
  });

  test('defaults and trimming behave as expected and metadata default is object', () => {
    const inst = new CoverLetter({ userId: 'u1', name: '  Alice  ', content: 'Hello' });
    // Mongoose applies trimming/setters on creation
    expect(inst.name).toBe('Alice');
    // Defaults
    expect(inst.style).toBe('formal');
    expect(inst.isDefault).toBe(false);
    expect(inst.isArchived).toBe(false);
    // metadata default should be an object (not null)
    expect(typeof inst.metadata).toBe('object');
  });

  test('validation fails for invalid style enum', () => {
    const bad = new CoverLetter({ userId: 'u1', name: 'N', content: 'C', style: 'invalid-style' });
    const err = bad.validateSync();
    expect(err).toBeDefined();
    expect(err.errors).toBeDefined();
    expect(err.errors.style).toBeDefined();
  });
});
