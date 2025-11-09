import { ResumeTemplate } from '../ResumeTemplate.js';

describe('ResumeTemplate model schema', () => {
  test('model has expected paths and nested defaults', () => {
    expect(ResumeTemplate).toBeDefined();
    expect(ResumeTemplate.modelName).toBe('ResumeTemplate');

    const paths = ResumeTemplate.schema.paths;

    // Core fields
    expect(paths.userId).toBeDefined();
    expect(paths.userId.options.required).toBe(true);
    expect(paths.name).toBeDefined();
    expect(paths.name.options.required).toBe(true);
    expect(paths.type).toBeDefined();
    expect(paths.type.options.enum).toEqual(expect.arrayContaining(['chronological','functional','hybrid']));

    // layout and theme nested schemas
    const layout = ResumeTemplate.schema.path('layout');
    const theme = ResumeTemplate.schema.path('theme');
    expect(layout).toBeDefined();
    expect(theme).toBeDefined();

  // Instantiate a document to exercise nested schema defaults
  const instance = new ResumeTemplate({ userId: 'u1', name: 'Template', type: 'chronological' });
  expect(instance.layout).toBeDefined();
  expect(Array.isArray(instance.layout.sectionsOrder)).toBe(true);
  expect(instance.theme).toBeDefined();
  expect(instance.theme.spacing).toBeDefined();

    // originalPdf should be a Buffer and should not be selected by default
    expect(paths.originalPdf).toBeDefined();
    expect(paths.originalPdf.instance).toBe('Buffer');
    expect(paths.originalPdf.options.select).toBe(false);

    // indexes declared
    const indexes = ResumeTemplate.schema.indexes();
    const hasUserDefault = indexes.some(([fields]) => fields.userId === 1 && fields.isDefault === 1);
    expect(hasUserDefault).toBe(true);
  });
});
