/**
 * Tests for Cover Letter Tone and Style Configuration
 */

import { describe, it, expect } from '@jest/globals';
import {
  TONE_OPTIONS,
  INDUSTRY_SETTINGS,
  COMPANY_CULTURE,
  LENGTH_OPTIONS,
  WRITING_STYLE,
  validateToneConsistency,
  getRecommendedTone
} from '../coverLetterTones.js';

describe('coverLetterTones Configuration', () => {
  
  // ==================== Data Structure Tests ====================
  
  describe('TONE_OPTIONS', () => {
    it('should export all tone options', () => {
      expect(TONE_OPTIONS).toBeDefined();
      expect(Object.keys(TONE_OPTIONS)).toHaveLength(7);
    });

    it('should have all required tone types', () => {
      expect(TONE_OPTIONS.formal).toBeDefined();
      expect(TONE_OPTIONS.casual).toBeDefined();
      expect(TONE_OPTIONS.enthusiastic).toBeDefined();
      expect(TONE_OPTIONS.analytical).toBeDefined();
      expect(TONE_OPTIONS.creative).toBeDefined();
      expect(TONE_OPTIONS.technical).toBeDefined();
      expect(TONE_OPTIONS.executive).toBeDefined();
    });

    it('should have complete structure for each tone', () => {
      Object.values(TONE_OPTIONS).forEach(tone => {
        expect(tone).toHaveProperty('name');
        expect(tone).toHaveProperty('description');
        expect(tone).toHaveProperty('characteristics');
        expect(tone).toHaveProperty('guidelines');
        expect(Array.isArray(tone.characteristics)).toBe(true);
        expect(tone.characteristics.length).toBeGreaterThan(0);
      });
    });

    it('should have valid formal tone configuration', () => {
      expect(TONE_OPTIONS.formal.name).toBe('Formal');
      expect(TONE_OPTIONS.formal.characteristics).toContain('Traditional business language');
      expect(TONE_OPTIONS.formal.guidelines).toContain('formal language');
    });
  });

  describe('INDUSTRY_SETTINGS', () => {
    it('should export all industry settings', () => {
      expect(INDUSTRY_SETTINGS).toBeDefined();
      expect(Object.keys(INDUSTRY_SETTINGS)).toHaveLength(10);
    });

    it('should have all required industries', () => {
      expect(INDUSTRY_SETTINGS.technology).toBeDefined();
      expect(INDUSTRY_SETTINGS.finance).toBeDefined();
      expect(INDUSTRY_SETTINGS.healthcare).toBeDefined();
      expect(INDUSTRY_SETTINGS.marketing).toBeDefined();
      expect(INDUSTRY_SETTINGS.education).toBeDefined();
      expect(INDUSTRY_SETTINGS.sales).toBeDefined();
      expect(INDUSTRY_SETTINGS.consulting).toBeDefined();
      expect(INDUSTRY_SETTINGS.engineering).toBeDefined();
      expect(INDUSTRY_SETTINGS.creative).toBeDefined();
      expect(INDUSTRY_SETTINGS.general).toBeDefined();
    });

    it('should have complete structure for each industry', () => {
      Object.values(INDUSTRY_SETTINGS).forEach(industry => {
        expect(industry).toHaveProperty('name');
        expect(industry).toHaveProperty('keywords');
        expect(industry).toHaveProperty('terminology');
        expect(industry).toHaveProperty('focus');
        expect(Array.isArray(industry.keywords)).toBe(true);
        expect(Array.isArray(industry.terminology)).toBe(true);
      });
    });

    it('should have valid technology industry configuration', () => {
      expect(INDUSTRY_SETTINGS.technology.name).toBe('Technology');
      expect(INDUSTRY_SETTINGS.technology.keywords).toContain('innovation');
      expect(INDUSTRY_SETTINGS.technology.terminology).toContain('API');
    });
  });

  describe('COMPANY_CULTURE', () => {
    it('should export all company culture options', () => {
      expect(COMPANY_CULTURE).toBeDefined();
      expect(Object.keys(COMPANY_CULTURE)).toHaveLength(6);
    });

    it('should have all required cultures', () => {
      expect(COMPANY_CULTURE.startup).toBeDefined();
      expect(COMPANY_CULTURE.corporate).toBeDefined();
      expect(COMPANY_CULTURE.enterprise).toBeDefined();
      expect(COMPANY_CULTURE.agency).toBeDefined();
      expect(COMPANY_CULTURE.nonprofit).toBeDefined();
      expect(COMPANY_CULTURE.remote).toBeDefined();
    });

    it('should have complete structure for each culture', () => {
      Object.values(COMPANY_CULTURE).forEach(culture => {
        expect(culture).toHaveProperty('name');
        expect(culture).toHaveProperty('description');
        expect(culture).toHaveProperty('characteristics');
        expect(culture).toHaveProperty('language');
        expect(Array.isArray(culture.characteristics)).toBe(true);
        expect(culture.characteristics.length).toBeGreaterThan(0);
      });
    });

    it('should have valid startup culture configuration', () => {
      expect(COMPANY_CULTURE.startup.name).toBe('Startup');
      expect(COMPANY_CULTURE.startup.characteristics).toContain('Agility and adaptability');
      expect(COMPANY_CULTURE.startup.language).toContain('adaptability');
    });
  });

  describe('LENGTH_OPTIONS', () => {
    it('should export all length options', () => {
      expect(LENGTH_OPTIONS).toBeDefined();
      expect(Object.keys(LENGTH_OPTIONS)).toHaveLength(3);
    });

    it('should have all required length types', () => {
      expect(LENGTH_OPTIONS.brief).toBeDefined();
      expect(LENGTH_OPTIONS.standard).toBeDefined();
      expect(LENGTH_OPTIONS.detailed).toBeDefined();
    });

    it('should have complete structure for each length option', () => {
      Object.values(LENGTH_OPTIONS).forEach(length => {
        expect(length).toHaveProperty('name');
        expect(length).toHaveProperty('description');
        expect(length).toHaveProperty('wordCount');
        expect(length).toHaveProperty('paragraphs');
        expect(length).toHaveProperty('guidelines');
        expect(length.wordCount).toHaveProperty('min');
        expect(length.wordCount).toHaveProperty('max');
      });
    });

    it('should have valid brief length configuration', () => {
      expect(LENGTH_OPTIONS.brief.wordCount.min).toBe(250);
      expect(LENGTH_OPTIONS.brief.wordCount.max).toBe(300);
      expect(LENGTH_OPTIONS.brief.paragraphs).toBe(3);
    });

    it('should have progressive word counts', () => {
      expect(LENGTH_OPTIONS.brief.wordCount.max).toBeLessThan(LENGTH_OPTIONS.standard.wordCount.max);
      expect(LENGTH_OPTIONS.standard.wordCount.max).toBeLessThan(LENGTH_OPTIONS.detailed.wordCount.max);
    });
  });

  describe('WRITING_STYLE', () => {
    it('should export all writing styles', () => {
      expect(WRITING_STYLE).toBeDefined();
      expect(Object.keys(WRITING_STYLE)).toHaveLength(3);
    });

    it('should have all required styles', () => {
      expect(WRITING_STYLE.direct).toBeDefined();
      expect(WRITING_STYLE.narrative).toBeDefined();
      expect(WRITING_STYLE.hybrid).toBeDefined();
    });

    it('should have complete structure for each style', () => {
      Object.values(WRITING_STYLE).forEach(style => {
        expect(style).toHaveProperty('name');
        expect(style).toHaveProperty('description');
        expect(style).toHaveProperty('characteristics');
        expect(style).toHaveProperty('guidelines');
        expect(Array.isArray(style.characteristics)).toBe(true);
        expect(style.characteristics.length).toBeGreaterThan(0);
      });
    });

    it('should have valid direct style configuration', () => {
      expect(WRITING_STYLE.direct.name).toBe('Direct');
      expect(WRITING_STYLE.direct.characteristics).toContain('Clear and concise sentences');
    });
  });

  // ==================== Function Tests ====================

  describe('validateToneConsistency', () => {
    it('should be defined', () => {
      expect(validateToneConsistency).toBeDefined();
      expect(typeof validateToneConsistency).toBe('function');
    });

    it('should return empty array for compatible combinations', () => {
      const warnings = validateToneConsistency('formal', 'finance', 'corporate');
      expect(Array.isArray(warnings)).toBe(true);
      expect(warnings).toHaveLength(0);
    });

    it('should warn about formal tone with startup culture', () => {
      const warnings = validateToneConsistency('formal', 'technology', 'startup');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('Formal tone with startup culture');
    });

    it('should warn about casual tone in finance', () => {
      const warnings = validateToneConsistency('casual', 'finance', 'corporate');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('Casual tone in conservative industry'))).toBe(true);
    });

    it('should warn about casual tone in healthcare', () => {
      const warnings = validateToneConsistency('casual', 'healthcare', 'corporate');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('Casual tone in conservative industry'))).toBe(true);
    });

    it('should warn about casual tone with corporate culture', () => {
      const warnings = validateToneConsistency('casual', 'technology', 'corporate');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('Casual tone with corporate culture'))).toBe(true);
    });

    it('should warn about casual tone with enterprise culture', () => {
      const warnings = validateToneConsistency('casual', 'technology', 'enterprise');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('Casual tone with corporate culture'))).toBe(true);
    });

    it('should warn about creative tone in finance', () => {
      const warnings = validateToneConsistency('creative', 'finance', 'corporate');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('Creative tone in technical industry'))).toBe(true);
    });

    it('should warn about creative tone in engineering', () => {
      const warnings = validateToneConsistency('creative', 'engineering', 'corporate');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('Creative tone in technical industry'))).toBe(true);
    });

    it('should warn about technical tone with startup in non-tech industry', () => {
      const warnings = validateToneConsistency('technical', 'marketing', 'startup');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('Highly technical tone with startup culture'))).toBe(true);
    });

    it('should not warn about technical tone with startup in tech industry', () => {
      const warnings = validateToneConsistency('technical', 'technology', 'startup');
      expect(warnings).toHaveLength(0);
    });

    it('should handle multiple warnings for highly mismatched combinations', () => {
      const warnings = validateToneConsistency('casual', 'finance', 'enterprise');
      expect(warnings.length).toBe(2);
      expect(warnings.some(w => w.includes('Casual tone in conservative industry'))).toBe(true);
      expect(warnings.some(w => w.includes('Casual tone with corporate culture'))).toBe(true);
    });

    it('should return empty array for undefined tone', () => {
      const warnings = validateToneConsistency(undefined, 'technology', 'startup');
      expect(warnings).toHaveLength(0);
    });

    it('should return empty array for enthusiastic tone (no warnings configured)', () => {
      const warnings = validateToneConsistency('enthusiastic', 'technology', 'startup');
      expect(warnings).toHaveLength(0);
    });

    it('should return empty array for analytical tone (no warnings configured)', () => {
      const warnings = validateToneConsistency('analytical', 'finance', 'corporate');
      expect(warnings).toHaveLength(0);
    });

    it('should return empty array for executive tone (no warnings configured)', () => {
      const warnings = validateToneConsistency('executive', 'finance', 'enterprise');
      expect(warnings).toHaveLength(0);
    });
  });

  describe('getRecommendedTone', () => {
    it('should be defined', () => {
      expect(getRecommendedTone).toBeDefined();
      expect(typeof getRecommendedTone).toBe('function');
    });

    it('should recommend enthusiastic for technology + startup', () => {
      const tone = getRecommendedTone('technology', 'startup');
      expect(tone).toBe('enthusiastic');
    });

    it('should recommend formal for finance + corporate', () => {
      const tone = getRecommendedTone('finance', 'corporate');
      expect(tone).toBe('formal');
    });

    it('should recommend formal for finance + enterprise', () => {
      const tone = getRecommendedTone('finance', 'enterprise');
      expect(tone).toBe('formal');
    });

    it('should recommend formal for healthcare + corporate', () => {
      const tone = getRecommendedTone('healthcare', 'corporate');
      expect(tone).toBe('formal');
    });

    it('should recommend formal for healthcare + enterprise', () => {
      const tone = getRecommendedTone('healthcare', 'enterprise');
      expect(tone).toBe('formal');
    });

    it('should recommend creative for creative industry', () => {
      const tone = getRecommendedTone('creative', 'agency');
      expect(tone).toBe('creative');
    });

    it('should recommend technical for technology industry (non-startup)', () => {
      const tone = getRecommendedTone('technology', 'corporate');
      expect(tone).toBe('technical');
    });

    it('should recommend technical for engineering industry', () => {
      const tone = getRecommendedTone('engineering', 'corporate');
      expect(tone).toBe('technical');
    });

    it('should recommend executive for enterprise culture (non-finance/healthcare)', () => {
      const tone = getRecommendedTone('consulting', 'enterprise');
      expect(tone).toBe('executive');
    });

    it('should recommend executive for corporate culture (non-finance/healthcare)', () => {
      const tone = getRecommendedTone('consulting', 'corporate');
      expect(tone).toBe('executive');
    });

    it('should default to formal for unknown combinations', () => {
      const tone = getRecommendedTone('general', 'agency');
      expect(tone).toBe('formal');
    });

    it('should default to formal for undefined inputs', () => {
      const tone = getRecommendedTone(undefined, undefined);
      expect(tone).toBe('formal');
    });

    it('should prioritize technology + startup over other rules', () => {
      const tone = getRecommendedTone('technology', 'startup');
      expect(tone).toBe('enthusiastic');
    });

    it('should prioritize finance/healthcare + corporate/enterprise', () => {
      const tone = getRecommendedTone('finance', 'enterprise');
      expect(tone).toBe('formal');
    });

    it('should prioritize creative industry', () => {
      const tone = getRecommendedTone('creative', 'startup');
      expect(tone).toBe('creative');
    });

    it('should handle marketing industry', () => {
      const tone = getRecommendedTone('marketing', 'agency');
      expect(tone).toBe('formal');
    });

    it('should handle education industry', () => {
      const tone = getRecommendedTone('education', 'nonprofit');
      expect(tone).toBe('formal');
    });

    it('should handle sales industry', () => {
      const tone = getRecommendedTone('sales', 'corporate');
      expect(tone).toBe('executive');
    });

    it('should handle remote culture', () => {
      const tone = getRecommendedTone('technology', 'remote');
      expect(tone).toBe('technical');
    });

    it('should handle nonprofit culture', () => {
      const tone = getRecommendedTone('education', 'nonprofit');
      expect(tone).toBe('formal');
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration: Tone Validation with Recommendations', () => {
    it('should recommend compatible tone that produces no warnings', () => {
      const recommendedTone = getRecommendedTone('technology', 'startup');
      const warnings = validateToneConsistency(recommendedTone, 'technology', 'startup');
      expect(warnings).toHaveLength(0);
    });

    it('should recommend tone that avoids casual + finance warning', () => {
      const recommendedTone = getRecommendedTone('finance', 'corporate');
      const warnings = validateToneConsistency(recommendedTone, 'finance', 'corporate');
      expect(warnings).toHaveLength(0);
    });

    it('should recommend tone that works for enterprise healthcare', () => {
      const recommendedTone = getRecommendedTone('healthcare', 'enterprise');
      const warnings = validateToneConsistency(recommendedTone, 'healthcare', 'enterprise');
      expect(warnings).toHaveLength(0);
    });

    it('should recommend tone that works for creative industry', () => {
      const recommendedTone = getRecommendedTone('creative', 'agency');
      const warnings = validateToneConsistency(recommendedTone, 'creative', 'agency');
      expect(warnings).toHaveLength(0);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle null inputs for validateToneConsistency', () => {
      const warnings = validateToneConsistency(null, null, null);
      expect(Array.isArray(warnings)).toBe(true);
      expect(warnings).toHaveLength(0);
    });

    it('should handle empty strings for validateToneConsistency', () => {
      const warnings = validateToneConsistency('', '', '');
      expect(Array.isArray(warnings)).toBe(true);
      expect(warnings).toHaveLength(0);
    });

    it('should handle null inputs for getRecommendedTone', () => {
      const tone = getRecommendedTone(null, null);
      expect(tone).toBe('formal');
    });

    it('should handle empty strings for getRecommendedTone', () => {
      const tone = getRecommendedTone('', '');
      expect(tone).toBe('formal');
    });

    it('should handle unknown industry for getRecommendedTone', () => {
      const tone = getRecommendedTone('unknown-industry', 'corporate');
      expect(tone).toBe('executive');
    });

    it('should handle unknown culture for getRecommendedTone', () => {
      const tone = getRecommendedTone('technology', 'unknown-culture');
      expect(tone).toBe('technical');
    });

    it('should handle case sensitivity for validateToneConsistency', () => {
      const warnings1 = validateToneConsistency('formal', 'finance', 'startup');
      const warnings2 = validateToneConsistency('Formal', 'Finance', 'Startup');
      // Case-sensitive comparison, so different case = no warnings
      expect(Array.isArray(warnings2)).toBe(true);
    });
  });
});
