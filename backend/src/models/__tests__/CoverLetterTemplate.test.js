import { CoverLetterTemplate } from '../CoverLetterTemplate.js';
import mongoose from 'mongoose';

describe('CoverLetterTemplate model schema', () => {
  test('model exists and required paths are present', () => {
    expect(CoverLetterTemplate).toBeDefined();
    expect(CoverLetterTemplate.modelName).toBe('CoverLetterTemplate');

    const paths = CoverLetterTemplate.schema.paths;
    expect(paths.userId).toBeDefined();
    expect(paths.userId.options.required).toBe(true);

    expect(paths.name).toBeDefined();
    expect(paths.name.options.required).toBe(true);

    expect(paths.content).toBeDefined();
    expect(paths.content.options.required).toBe(true);
  });

  test('industry field enum and default', () => {
    const industry = CoverLetterTemplate.schema.path('industry');
    expect(industry).toBeDefined();
    expect(industry.options.enum).toEqual(
      expect.arrayContaining(['general', 'technology', 'finance', 'healthcare', 'marketing', 'education', 'sales', 'consulting', 'engineering', 'creative'])
    );
    expect(industry.options.default).toBe('general');
  });

  test('style field enum and default', () => {
    const style = CoverLetterTemplate.schema.path('style');
    expect(style).toBeDefined();
    expect(style.options.enum).toEqual(
      expect.arrayContaining(['formal', 'casual', 'enthusiastic', 'analytical', 'creative', 'technical', 'executive'])
    );
    expect(style.options.default).toBe('formal');
  });

  test('booleans, array and usageCount defaults', () => {
    const isDefault = CoverLetterTemplate.schema.path('isDefault');
    const isShared = CoverLetterTemplate.schema.path('isShared');
    const sharedWith = CoverLetterTemplate.schema.path('sharedWith');
    const usageCount = CoverLetterTemplate.schema.path('usageCount');

    expect(isDefault.options.default).toBe(false);
    expect(isShared.options.default).toBe(false);
    // sharedWith should be an array path
    expect(sharedWith).toBeDefined();
    // Instance name on schema path is 'Array' for arrays
    expect(sharedWith.instance === 'Array' || sharedWith.instance === 'Mixed' || sharedWith.$isMongooseArray).toBeTruthy();
    expect(usageCount.options.default).toBe(0);
  });

  test('declared indexes', () => {
    const indexes = CoverLetterTemplate.schema.indexes();
    // indexes is an array of [fields, options]
    const hasUserDefault = indexes.some(([fields]) => fields.userId === 1 && fields.isDefault === 1);
    const hasIndustryStyle = indexes.some(([fields]) => fields.industry === 1 && fields.style === 1);

    expect(hasUserDefault).toBe(true);
    expect(hasIndustryStyle).toBe(true);
  });
});
