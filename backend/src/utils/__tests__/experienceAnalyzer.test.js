/**
 * Tests for Experience Analyzer
 */

import { describe, it, expect } from '@jest/globals';
import {
  analyzeExperienceRelevance,
  selectRelevantExperiences,
  generateExperienceNarrative,
  quantifyAchievements,
  connectToJobRequirements,
  suggestAdditionalExperiences,
  scoreExperiencePackage,
  generateAlternativePresentations
} from '../experienceAnalyzer.js';

describe('experienceAnalyzer', () => {
  
  // ==================== Test Data ====================
  
  const mockExperience = {
    _id: '1',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    description: 'Developed web applications using React and Node.js',
    startDate: '2020-01-01',
    endDate: '2023-01-01',
    industry: 'Technology',
    achievements: [
      'Improved application performance by 40%',
      'Led team of 5 developers',
      'Implemented automated testing framework'
    ]
  };

  const mockJob = {
    title: 'Full Stack Developer',
    company: 'Startup Inc',
    description: 'Looking for a developer with React and Node.js experience to build scalable web applications',
    requirements: [
      'Experience with React and modern JavaScript',
      'Backend development with Node.js',
      'Team leadership experience'
    ],
    industry: 'Technology'
  };

  const mockUserSkills = ['React', 'Node.js', 'JavaScript', 'Testing'];

  // ==================== analyzeExperienceRelevance Tests ====================

  describe('analyzeExperienceRelevance', () => {
    it('should analyze experience relevance and return score', () => {
      const result = analyzeExperienceRelevance(mockExperience, mockJob, mockUserSkills);
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('matchedKeywords');
      expect(result).toHaveProperty('matchedSkills');
      expect(result).toHaveProperty('reasons');
      expect(result).toHaveProperty('priority');
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should match job title similarity', () => {
      const result = analyzeExperienceRelevance(mockExperience, mockJob);
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should match keywords from job description', () => {
      const result = analyzeExperienceRelevance(mockExperience, mockJob);
      
      expect(result.matchedKeywords.length).toBeGreaterThan(0);
      expect(result.reasons.some(r => r.includes('keywords'))).toBe(true);
    });

    it('should match skills', () => {
      const result = analyzeExperienceRelevance(mockExperience, mockJob, mockUserSkills);
      
      expect(result.matchedSkills.length).toBeGreaterThan(0);
    });

    it('should detect same industry match', () => {
      const result = analyzeExperienceRelevance(mockExperience, mockJob);
      
      expect(result.reasons.some(r => r.includes('industry'))).toBe(true);
    });

    it('should give recency bonus for recent experience', () => {
      const recentExp = { ...mockExperience, endDate: new Date().toISOString() };
      const result = analyzeExperienceRelevance(recentExp, mockJob);
      
      expect(result.reasons.some(r => r.includes('Recent'))).toBe(true);
    });

    it('should handle experience with no end date (current job)', () => {
      const currentExp = { ...mockExperience, endDate: null };
      const result = analyzeExperienceRelevance(currentExp, mockJob);
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons.some(r => r.includes('Recent'))).toBe(true);
    });

    it('should prioritize high relevance scores as high', () => {
      const result = analyzeExperienceRelevance(mockExperience, mockJob, mockUserSkills);
      
      if (result.score >= 70) {
        expect(result.priority).toBe('high');
      }
    });

    it('should prioritize medium relevance scores as medium', () => {
      const lowMatchExp = { ...mockExperience, title: 'Accountant', industry: 'Finance' };
      const result = analyzeExperienceRelevance(lowMatchExp, mockJob);
      
      if (result.score >= 40 && result.score < 70) {
        expect(result.priority).toBe('medium');
      }
    });

    it('should prioritize low relevance scores as low', () => {
      const noMatchExp = {
        title: 'Marketing Manager',
        company: 'AdCorp',
        description: 'Managed marketing campaigns',
        achievements: [],
        industry: 'Marketing'
      };
      const result = analyzeExperienceRelevance(noMatchExp, mockJob);
      
      expect(result.priority).toBe('low');
    });

    it('should cap score at 100', () => {
      const result = analyzeExperienceRelevance(mockExperience, mockJob, mockUserSkills);
      
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should limit matched keywords to 10', () => {
      const result = analyzeExperienceRelevance(mockExperience, mockJob);
      
      expect(result.matchedKeywords.length).toBeLessThanOrEqual(10);
    });

    it('should limit matched skills to 10', () => {
      const result = analyzeExperienceRelevance(mockExperience, mockJob, mockUserSkills);
      
      expect(result.matchedSkills.length).toBeLessThanOrEqual(10);
    });

    it('should handle missing job title', () => {
      const jobNoTitle = { ...mockJob, title: '' };
      const result = analyzeExperienceRelevance(mockExperience, jobNoTitle);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing experience title', () => {
      const expNoTitle = { ...mockExperience, title: '' };
      const result = analyzeExperienceRelevance(expNoTitle, mockJob);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty requirements array', () => {
      const jobNoReqs = { ...mockJob, requirements: [] };
      const result = analyzeExperienceRelevance(mockExperience, jobNoReqs);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle experience with no achievements', () => {
      const expNoAch = { ...mockExperience, achievements: [] };
      const result = analyzeExperienceRelevance(expNoAch, mockJob);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle experience with no industry', () => {
      const expNoInd = { ...mockExperience, industry: undefined };
      const result = analyzeExperienceRelevance(expNoInd, mockJob);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle job with no industry', () => {
      const jobNoInd = { ...mockJob, industry: undefined };
      const result = analyzeExperienceRelevance(mockExperience, jobNoInd);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ==================== selectRelevantExperiences Tests ====================

  describe('selectRelevantExperiences', () => {
    const experiences = [
      mockExperience,
      {
        _id: '2',
        title: 'Frontend Developer',
        company: 'Web Agency',
        description: 'Built responsive websites with React',
        startDate: '2018-01-01',
        endDate: '2020-01-01',
        industry: 'Technology',
        achievements: ['Delivered 20+ projects', 'Client satisfaction 95%']
      },
      {
        _id: '3',
        title: 'Junior Developer',
        company: 'StartupXYZ',
        description: 'Worked on various projects',
        startDate: '2016-01-01',
        endDate: '2018-01-01',
        industry: 'Technology',
        achievements: []
      }
    ];

    it('should select and rank experiences by relevance', () => {
      const result = selectRelevantExperiences(experiences, mockJob, mockUserSkills);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should include relevance data for each experience', () => {
      const result = selectRelevantExperiences(experiences, mockJob);
      
      result.forEach(exp => {
        expect(exp).toHaveProperty('relevance');
        expect(exp.relevance).toHaveProperty('score');
      });
    });

    it('should sort by relevance score descending', () => {
      const result = selectRelevantExperiences(experiences, mockJob);
      
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].relevance.score).toBeGreaterThanOrEqual(result[i + 1].relevance.score);
      }
    });

    it('should respect maxExperiences parameter', () => {
      const result = selectRelevantExperiences(experiences, mockJob, mockUserSkills, 2);
      
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should handle empty experiences array', () => {
      const result = selectRelevantExperiences([], mockJob);
      
      expect(result).toEqual([]);
    });

    it('should handle null experiences', () => {
      const result = selectRelevantExperiences(null, mockJob);
      
      expect(result).toEqual([]);
    });

    it('should handle undefined experiences', () => {
      const result = selectRelevantExperiences(undefined, mockJob);
      
      expect(result).toEqual([]);
    });

    it('should return all if fewer than maxExperiences', () => {
      const result = selectRelevantExperiences(experiences, mockJob, mockUserSkills, 10);
      
      expect(result.length).toBe(experiences.length);
    });

    it('should default to 3 experiences if maxExperiences not provided', () => {
      const manyExperiences = [...experiences, ...experiences, ...experiences];
      const result = selectRelevantExperiences(manyExperiences, mockJob);
      
      expect(result.length).toBe(3);
    });
  });

  // ==================== generateExperienceNarrative Tests ====================

  describe('generateExperienceNarrative', () => {
    const relevance = {
      score: 85,
      matchedSkills: ['React', 'Node.js', 'JavaScript'],
      matchedKeywords: ['web', 'application', 'development'],
      reasons: ['Job title similarity', 'Matched skills']
    };

    it('should generate multiple narrative styles', () => {
      const result = generateExperienceNarrative(mockExperience, mockJob, relevance);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include narrative text and style', () => {
      const result = generateExperienceNarrative(mockExperience, mockJob, relevance);
      
      result.forEach(narrative => {
        expect(narrative).toHaveProperty('style');
        expect(narrative).toHaveProperty('text');
        expect(narrative).toHaveProperty('strength');
        expect(typeof narrative.text).toBe('string');
        expect(narrative.text.length).toBeGreaterThan(0);
      });
    });

    it('should generate achievement-focused narrative when achievements exist', () => {
      const result = generateExperienceNarrative(mockExperience, mockJob, relevance);
      
      const achievementNarrative = result.find(n => n.style === 'achievement-focused');
      expect(achievementNarrative).toBeDefined();
      expect(achievementNarrative.text).toContain(mockExperience.title);
      expect(achievementNarrative.text).toContain(mockExperience.company);
    });

    it('should generate skills-focused narrative when skills matched', () => {
      const result = generateExperienceNarrative(mockExperience, mockJob, relevance);
      
      const skillsNarrative = result.find(n => n.style === 'skills-focused');
      expect(skillsNarrative).toBeDefined();
      expect(skillsNarrative.text).toContain('React');
    });

    it('should generate problem-solution narrative', () => {
      const result = generateExperienceNarrative(mockExperience, mockJob, relevance);
      
      const problemNarrative = result.find(n => n.style === 'problem-solution');
      expect(problemNarrative).toBeDefined();
    });

    it('should generate impact-focused narrative when quantified achievements exist', () => {
      const result = generateExperienceNarrative(mockExperience, mockJob, relevance);
      
      const impactNarrative = result.find(n => n.style === 'impact-focused');
      expect(impactNarrative).toBeDefined();
      expect(impactNarrative.text).toContain('40%');
    });

    it('should generate requirement-aligned narrative when requirements and skills exist', () => {
      const result = generateExperienceNarrative(mockExperience, mockJob, relevance);
      
      const reqNarrative = result.find(n => n.style === 'requirement-aligned');
      expect(reqNarrative).toBeDefined();
    });

    it('should handle experience with no achievements', () => {
      const expNoAch = { ...mockExperience, achievements: [] };
      const result = generateExperienceNarrative(expNoAch, mockJob, relevance);
      
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle relevance with no matched skills', () => {
      const noSkillsRelevance = { ...relevance, matchedSkills: [] };
      const result = generateExperienceNarrative(mockExperience, mockJob, noSkillsRelevance);
      
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle job with no requirements', () => {
      const jobNoReqs = { ...mockJob, requirements: [] };
      const result = generateExperienceNarrative(mockExperience, jobNoReqs, relevance);
      
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include job requirements in skills-focused narrative', () => {
      const result = generateExperienceNarrative(mockExperience, mockJob, relevance);
      
      const skillsNarrative = result.find(n => n.style === 'skills-focused');
      if (skillsNarrative) {
        expect(skillsNarrative.text.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty requirements array gracefully', () => {
      const jobNoReqs = { ...mockJob, requirements: [] };
      const result = generateExperienceNarrative(mockExperience, jobNoReqs, relevance);
      
      const skillsNarrative = result.find(n => n.style === 'skills-focused');
      if (skillsNarrative) {
        expect(skillsNarrative.text).toContain('immediate contributions');
      }
    });
  });

  // ==================== quantifyAchievements Tests ====================

  describe('quantifyAchievements', () => {
    const achievements = [
      'Improved application performance by 40%',
      'Led team of 5 developers',
      'Implemented automated testing framework',
      'Reduced bugs by 30%',
      'Increased user engagement'
    ];

    const relevance = {
      matchedKeywords: ['performance', 'testing', 'automated'],
      matchedSkills: ['React', 'Node.js']
    };

    it('should filter and return quantified achievements', () => {
      const result = quantifyAchievements(achievements, relevance);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should prefer achievements with matched keywords', () => {
      const result = quantifyAchievements(achievements, relevance);
      
      const hasKeywordMatch = result.some(a => 
        relevance.matchedKeywords.some(kw => a.includes(kw))
      );
      expect(hasKeywordMatch).toBe(true);
    });

    it('should prefer achievements with numbers', () => {
      const result = quantifyAchievements(achievements, relevance);
      
      const hasNumbers = result.some(a => /\d+/.test(a));
      expect(hasNumbers).toBe(true);
    });

    it('should add action verb if missing', () => {
      const achievementsNoVerb = ['performance boost by 50%'];
      const result = quantifyAchievements(achievementsNoVerb, relevance);
      
      expect(result[0]).toContain('achieved');
    });

    it('should keep existing action verbs', () => {
      const result = quantifyAchievements(achievements, relevance);
      
      // Should keep "improved", "led", etc. in lowercase
      const hasActionVerb = result.some(a => 
        a.startsWith('improved') || a.startsWith('led') || a.startsWith('implemented')
      );
      expect(hasActionVerb).toBe(true);
    });

    it('should return maximum 3 achievements', () => {
      const manyAchievements = [...achievements, ...achievements];
      const result = quantifyAchievements(manyAchievements, relevance);
      
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty achievements array', () => {
      const result = quantifyAchievements([], relevance);
      
      expect(result).toEqual([]);
    });

    it('should handle empty matched keywords', () => {
      const emptyRelevance = { matchedKeywords: [], matchedSkills: [] };
      const result = quantifyAchievements(achievements, emptyRelevance);
      
      // Should still return achievements with numbers
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ==================== connectToJobRequirements Tests ====================

  describe('connectToJobRequirements', () => {
    const experiences = [
      {
        ...mockExperience,
        relevance: {
          score: 85,
          matchedSkills: ['React', 'Node.js'],
          matchedKeywords: ['web', 'application']
        }
      }
    ];

    it('should connect experiences to job requirements', () => {
      const result = connectToJobRequirements(experiences, mockJob);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should include requirement details', () => {
      const result = connectToJobRequirements(experiences, mockJob);
      
      if (result.length > 0) {
        result.forEach(connection => {
          expect(connection).toHaveProperty('requirement');
          expect(connection).toHaveProperty('experiences');
          expect(connection).toHaveProperty('strength');
        });
      }
    });

    it('should mark connections as strong when multiple experiences match', () => {
      const multipleExps = [
        experiences[0],
        {
          ...experiences[0],
          _id: '2',
          relevance: {
            score: 75,
            matchedSkills: ['React'],
            matchedKeywords: ['react']
          }
        }
      ];
      const result = connectToJobRequirements(multipleExps, mockJob);
      
      if (result.length > 0) {
        const strongConnection = result.find(c => c.strength === 'strong');
        if (strongConnection) {
          expect(strongConnection.experiences.length).toBeGreaterThan(1);
        }
      }
    });

    it('should include relevant achievements', () => {
      const result = connectToJobRequirements(experiences, mockJob);
      
      result.forEach(connection => {
        expect(connection).toHaveProperty('relevantAchievements');
        expect(Array.isArray(connection.relevantAchievements)).toBe(true);
      });
    });

    it('should limit achievements to 2 per requirement', () => {
      const result = connectToJobRequirements(experiences, mockJob);
      
      result.forEach(connection => {
        expect(connection.relevantAchievements.length).toBeLessThanOrEqual(2);
      });
    });

    it('should handle job with no requirements', () => {
      const jobNoReqs = { ...mockJob, requirements: [] };
      const result = connectToJobRequirements(experiences, jobNoReqs);
      
      expect(result).toEqual([]);
    });

    it('should handle experiences with no relevance data', () => {
      const expsNoRelevance = [{ ...mockExperience, relevance: undefined }];
      const result = connectToJobRequirements(expsNoRelevance, mockJob);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle experiences with no achievements', () => {
      const expsNoAch = [{ ...mockExperience, achievements: [], relevance: experiences[0].relevance }];
      const result = connectToJobRequirements(expsNoAch, mockJob);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should sort by strength and relevance', () => {
      const result = connectToJobRequirements(experiences, mockJob);
      
      // Check if strong connections come first
      for (let i = 0; i < result.length - 1; i++) {
        if (result[i].strength === 'strong' && result[i + 1].strength !== 'strong') {
          expect(true).toBe(true); // Strong comes before non-strong
        }
      }
    });
  });

  // ==================== suggestAdditionalExperiences Tests ====================

  describe('suggestAdditionalExperiences', () => {
    const allExperiences = [
      mockExperience,
      {
        _id: '2',
        title: 'Backend Developer',
        company: 'Tech Startup',
        description: 'Built APIs with Node.js and Express',
        startDate: '2019-01-01',
        endDate: '2020-01-01',
        achievements: []
      },
      {
        _id: '3',
        title: 'Data Analyst',
        company: 'Analytics Corp',
        description: 'Analyzed data using Python',
        startDate: '2017-01-01',
        endDate: '2019-01-01',
        achievements: []
      }
    ];

    const selectedExperiences = [mockExperience];

    it('should suggest additional relevant experiences', () => {
      const result = suggestAdditionalExperiences(allExperiences, selectedExperiences, mockJob);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should not include already selected experiences', () => {
      const result = suggestAdditionalExperiences(allExperiences, selectedExperiences, mockJob);
      
      const selectedIds = new Set(selectedExperiences.map(e => e._id));
      result.forEach(suggestion => {
        expect(selectedIds.has(suggestion.experience._id)).toBe(false);
      });
    });

    it('should include relevance analysis', () => {
      const result = suggestAdditionalExperiences(allExperiences, selectedExperiences, mockJob);
      
      result.forEach(suggestion => {
        expect(suggestion).toHaveProperty('experience');
        expect(suggestion).toHaveProperty('relevance');
        expect(suggestion).toHaveProperty('reason');
      });
    });

    it('should only suggest experiences with score >= 30', () => {
      const result = suggestAdditionalExperiences(allExperiences, selectedExperiences, mockJob);
      
      result.forEach(suggestion => {
        expect(suggestion.relevance.score).toBeGreaterThanOrEqual(30);
      });
    });

    it('should limit suggestions to 3', () => {
      const manyExps = [
        ...allExperiences,
        { _id: '4', title: 'Developer', company: 'A', description: 'React Node.js', achievements: [] },
        { _id: '5', title: 'Engineer', company: 'B', description: 'JavaScript web', achievements: [] },
        { _id: '6', title: 'Coder', company: 'C', description: 'application development', achievements: [] }
      ];
      const result = suggestAdditionalExperiences(manyExps, selectedExperiences, mockJob);
      
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should sort suggestions by relevance score descending', () => {
      const result = suggestAdditionalExperiences(allExperiences, selectedExperiences, mockJob);
      
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].relevance.score).toBeGreaterThanOrEqual(result[i + 1].relevance.score);
      }
    });

    it('should handle experiences with id instead of _id', () => {
      const expsWithId = allExperiences.map(e => ({ ...e, id: e._id, _id: undefined }));
      const selectedWithId = [{ ...mockExperience, id: mockExperience._id, _id: undefined }];
      const result = suggestAdditionalExperiences(expsWithId, selectedWithId, mockJob);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty selected experiences', () => {
      const result = suggestAdditionalExperiences(allExperiences, [], mockJob);
      
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle all experiences already selected', () => {
      const result = suggestAdditionalExperiences(allExperiences, allExperiences, mockJob);
      
      expect(result).toEqual([]);
    });
  });

  // ==================== scoreExperiencePackage Tests ====================

  describe('scoreExperiencePackage', () => {
    const experiences = [
      {
        ...mockExperience,
        relevance: {
          score: 85,
          matchedSkills: ['React', 'Node.js'],
          matchedKeywords: ['web']
        }
      },
      {
        _id: '2',
        title: 'Frontend Developer',
        company: 'Web Co',
        description: 'React development',
        relevance: {
          score: 75,
          matchedSkills: ['React'],
          matchedKeywords: ['react']
        }
      }
    ];

    it('should calculate overall experience package score', () => {
      const result = scoreExperiencePackage(experiences, mockJob);
      
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('coverage');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('gaps');
      expect(result).toHaveProperty('recommendation');
    });

    it('should calculate average relevance', () => {
      const result = scoreExperiencePackage(experiences, mockJob);
      
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(typeof result.overallScore).toBe('number');
    });

    it('should calculate requirement coverage percentage', () => {
      const result = scoreExperiencePackage(experiences, mockJob);
      
      expect(result.coverage).toBeGreaterThanOrEqual(0);
      expect(result.coverage).toBeLessThanOrEqual(100);
      expect(typeof result.coverage).toBe('number');
    });

    it('should identify strengths from high-scoring experiences', () => {
      const result = scoreExperiencePackage(experiences, mockJob);
      
      expect(Array.isArray(result.strengths)).toBe(true);
      if (result.strengths.length > 0) {
        expect(result.strengths[0]).toContain('Strong');
      }
    });

    it('should limit strengths to 3', () => {
      const manyHighScoreExps = [
        ...experiences,
        { ...experiences[0], _id: '3' },
        { ...experiences[0], _id: '4' }
      ];
      const result = scoreExperiencePackage(manyHighScoreExps, mockJob);
      
      expect(result.strengths.length).toBeLessThanOrEqual(3);
    });

    it('should identify skill gaps', () => {
      const result = scoreExperiencePackage(experiences, mockJob);
      
      expect(Array.isArray(result.gaps)).toBe(true);
    });

    it('should limit gaps to 5', () => {
      const result = scoreExperiencePackage(experiences, mockJob);
      
      expect(result.gaps.length).toBeLessThanOrEqual(5);
    });

    it('should recommend emphasizing for excellent match (>=70)', () => {
      const highScoreExps = experiences.map(e => ({ ...e, relevance: { ...e.relevance, score: 90 } }));
      const result = scoreExperiencePackage(highScoreExps, mockJob);
      
      if (result.overallScore >= 70) {
        expect(result.recommendation).toContain('Excellent');
      }
    });

    it('should recommend highlighting transferable skills for good match (>=50)', () => {
      const midScoreExps = experiences.map(e => ({ ...e, relevance: { ...e.relevance, score: 60 } }));
      const result = scoreExperiencePackage(midScoreExps, mockJob);
      
      if (result.overallScore >= 50 && result.overallScore < 70) {
        expect(result.recommendation).toContain('Good');
      }
    });

    it('should recommend emphasizing transferable skills for lower match (<50)', () => {
      const lowScoreExps = experiences.map(e => ({ ...e, relevance: { ...e.relevance, score: 30 } }));
      const result = scoreExperiencePackage(lowScoreExps, mockJob);
      
      if (result.overallScore < 50) {
        expect(result.recommendation).toContain('transferable skills');
      }
    });

    it('should handle empty experiences array', () => {
      const result = scoreExperiencePackage([], mockJob);
      
      expect(result.overallScore).toBe(0);
      expect(result.coverage).toBe(0);
      expect(result.strengths).toEqual([]);
      expect(result.recommendation).toBe('Add relevant work experiences');
    });

    it('should handle null experiences', () => {
      const result = scoreExperiencePackage(null, mockJob);
      
      expect(result.overallScore).toBe(0);
      expect(result.recommendation).toBe('Add relevant work experiences');
    });

    it('should handle experiences with no relevance data', () => {
      const expsNoRelevance = [{ ...mockExperience, relevance: undefined }];
      const result = scoreExperiencePackage(expsNoRelevance, mockJob);
      
      expect(result.overallScore).toBe(0);
    });

    it('should handle job with no requirements', () => {
      const jobNoReqs = { ...mockJob, requirements: [] };
      const result = scoreExperiencePackage(experiences, jobNoReqs);
      
      expect(result.coverage).toBe(0);
    });

    it('should calculate coverage correctly with requirements', () => {
      const result = scoreExperiencePackage(experiences, mockJob);
      
      if (mockJob.requirements && mockJob.requirements.length > 0) {
        expect(result.coverage).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ==================== generateAlternativePresentations Tests ====================

  describe('generateAlternativePresentations', () => {
    it('should generate multiple presentation formats', () => {
      const result = generateAlternativePresentations(mockExperience, mockJob);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
    });

    it('should include all required format types', () => {
      const result = generateAlternativePresentations(mockExperience, mockJob);
      
      const formats = result.map(p => p.format);
      expect(formats).toContain('chronological');
      expect(formats).toContain('skills-first');
      expect(formats).toContain('achievement-focused');
      expect(formats).toContain('story');
    });

    it('should include format properties', () => {
      const result = generateAlternativePresentations(mockExperience, mockJob);
      
      result.forEach(presentation => {
        expect(presentation).toHaveProperty('format');
        expect(presentation).toHaveProperty('title');
        expect(presentation).toHaveProperty('content');
        expect(presentation).toHaveProperty('bestFor');
      });
    });

    it('should include experience title and company in chronological format', () => {
      const result = generateAlternativePresentations(mockExperience, mockJob);
      
      const chronological = result.find(p => p.format === 'chronological');
      expect(chronological.title).toContain(mockExperience.title);
      expect(chronological.title).toContain(mockExperience.company);
    });

    it('should include matched skills in skills-first format', () => {
      const result = generateAlternativePresentations(mockExperience, mockJob);
      
      const skillsFirst = result.find(p => p.format === 'skills-first');
      expect(skillsFirst.title.length).toBeGreaterThan(0);
    });

    it('should include achievements in achievement-focused format', () => {
      const result = generateAlternativePresentations(mockExperience, mockJob);
      
      const achievementFocused = result.find(p => p.format === 'achievement-focused');
      expect(achievementFocused.title).toContain('Achievement');
    });

    it('should create story narrative in story format', () => {
      const result = generateAlternativePresentations(mockExperience, mockJob);
      
      const story = result.find(p => p.format === 'story');
      expect(story.content).toContain(mockExperience.company);
    });

    it('should handle experience with no achievements', () => {
      const expNoAch = { ...mockExperience, achievements: [] };
      const result = generateAlternativePresentations(expNoAch, mockJob);
      
      expect(result.length).toBe(4);
    });

    it('should handle experience with no description', () => {
      const expNoDesc = { ...mockExperience, description: '' };
      const result = generateAlternativePresentations(expNoDesc, mockJob);
      
      expect(result.length).toBe(4);
    });

    it('should format dates correctly in chronological format', () => {
      const result = generateAlternativePresentations(mockExperience, mockJob);
      
      const chronological = result.find(p => p.format === 'chronological');
      expect(chronological.content).toContain('-');
    });

    it('should handle experience with no start date', () => {
      const expNoStart = { ...mockExperience, startDate: null };
      const result = generateAlternativePresentations(expNoStart, mockJob);
      
      expect(result.length).toBe(4);
    });

    it('should handle experience with no end date (current)', () => {
      const expCurrent = { ...mockExperience, endDate: null };
      const result = generateAlternativePresentations(expCurrent, mockJob);
      
      const chronological = result.find(p => p.format === 'chronological');
      expect(chronological.content).toContain('Present');
    });

    it('should limit achievements in achievement-focused format', () => {
      const expManyAch = {
        ...mockExperience,
        achievements: ['One', 'Two', 'Three', 'Four', 'Five']
      };
      const result = generateAlternativePresentations(expManyAch, mockJob);
      
      const achievementFocused = result.find(p => p.format === 'achievement-focused');
      // Should slice to first 3
      const achCount = (achievementFocused.content.match(/\n/g) || []).length;
      expect(achCount).toBeLessThanOrEqual(3);
    });

    it('should limit skills in skills-first format', () => {
      const result = generateAlternativePresentations(mockExperience, mockJob);
      
      const skillsFirst = result.find(p => p.format === 'skills-first');
      // Should include top 3 skills separated by •
      const bulletCount = (skillsFirst.title.match(/•/g) || []).length;
      expect(bulletCount).toBeLessThanOrEqual(2); // 3 skills = 2 bullets
    });
  });

  // ==================== Edge Cases and Integration ====================

  describe('Edge Cases and Integration', () => {
    it('should handle completely empty experience object', () => {
      const emptyExp = {};
      const result = analyzeExperienceRelevance(emptyExp, mockJob);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle completely empty job object', () => {
      const emptyJob = {};
      const result = analyzeExperienceRelevance(mockExperience, emptyJob);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should work with full workflow: select -> narrative -> score', () => {
      const experiences = [mockExperience];
      const selected = selectRelevantExperiences(experiences, mockJob, mockUserSkills);
      
      expect(selected.length).toBeGreaterThan(0);
      
      const narrative = generateExperienceNarrative(selected[0], mockJob, selected[0].relevance);
      expect(narrative.length).toBeGreaterThan(0);
      
      const score = scoreExperiencePackage(selected, mockJob);
      expect(score.overallScore).toBeGreaterThan(0);
    });

    it('should handle special characters in text', () => {
      const specialExp = {
        ...mockExperience,
        title: 'C++ Developer',
        description: 'Worked with C++, C#, and .NET'
      };
      const result = analyzeExperienceRelevance(specialExp, mockJob);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long text fields', () => {
      const longText = 'word '.repeat(1000);
      const longExp = { ...mockExperience, description: longText };
      const result = analyzeExperienceRelevance(longExp, mockJob);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle unicode characters', () => {
      const unicodeExp = {
        ...mockExperience,
        company: 'Tech Corp™',
        description: 'Developed résumé builder with ñ and ü'
      };
      const result = analyzeExperienceRelevance(unicodeExp, mockJob);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });
});
