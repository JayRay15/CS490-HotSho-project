import mongoose from 'mongoose';

describe('CompanyResearch Model', () => {
  let CompanyResearch;

  beforeAll(async () => {
    const module = await import('../../models/CompanyResearch.js');
    CompanyResearch = module.CompanyResearch;
  });

  describe('Schema Definition', () => {
    it('should have required userId field', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.userId).toBeDefined();
      expect(schema.userId.isRequired).toBe(true);
    });

    it('should have required jobId field', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.jobId).toBeDefined();
      expect(schema.jobId.isRequired).toBe(true);
    });

    it('should have required companyName field', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.companyName).toBeDefined();
      expect(schema.companyName.isRequired).toBe(true);
    });

    it('should have optional interviewId field', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.interviewId).toBeDefined();
      expect(schema.interviewId.options.default).toBe(null);
    });
  });

  describe('Profile Subdocument', () => {
    it('should have profile field with correct structure', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema['profile.overview']).toBeDefined();
      expect(schema['profile.history']).toBeDefined();
      expect(schema['profile.mission']).toBeDefined();
      expect(schema['profile.values']).toBeDefined();
      expect(schema['profile.culture']).toBeDefined();
      expect(schema['profile.industry']).toBeDefined();
      expect(schema['profile.workMode']).toBeDefined();
      expect(schema['profile.location']).toBeDefined();
      expect(schema['profile.size']).toBeDefined();
      expect(schema['profile.founded']).toBeDefined();
      expect(schema['profile.headquarters']).toBeDefined();
      expect(schema['profile.website']).toBeDefined();
    });
  });

  describe('Leadership Array', () => {
    it('should have leadership array field', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.leadership).toBeDefined();
    });
  });

  describe('Interviewers Array', () => {
    it('should have interviewers array field', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.interviewers).toBeDefined();
    });
  });

  describe('Competitive Subdocument', () => {
    it('should have competitive field with correct structure', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema['competitive.industry']).toBeDefined();
      expect(schema['competitive.marketPosition']).toBeDefined();
      expect(schema['competitive.competitors']).toBeDefined();
      expect(schema['competitive.differentiators']).toBeDefined();
      expect(schema['competitive.challenges']).toBeDefined();
      expect(schema['competitive.opportunities']).toBeDefined();
    });
  });

  describe('News Array', () => {
    it('should have news array field', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.news).toBeDefined();
    });

    it('should have valid category enum for news', () => {
      const newsSchema = CompanyResearch.schema.path('news');
      const categoryEnum = newsSchema.schema.paths.category.options.enum;
      expect(categoryEnum).toContain('funding');
      expect(categoryEnum).toContain('product');
      expect(categoryEnum).toContain('leadership');
      expect(categoryEnum).toContain('expansion');
      expect(categoryEnum).toContain('partnership');
      expect(categoryEnum).toContain('other');
    });
  });

  describe('Talking Points Array', () => {
    it('should have talkingPoints array field', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.talkingPoints).toBeDefined();
    });
  });

  describe('Intelligent Questions Array', () => {
    it('should have intelligentQuestions array field', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.intelligentQuestions).toBeDefined();
    });

    it('should have valid category enum for questions', () => {
      const questionsSchema = CompanyResearch.schema.path('intelligentQuestions');
      const categoryEnum = questionsSchema.schema.paths.category.options.enum;
      expect(categoryEnum).toContain('company');
      expect(categoryEnum).toContain('role');
      expect(categoryEnum).toContain('team');
      expect(categoryEnum).toContain('culture');
      expect(categoryEnum).toContain('growth');
      expect(categoryEnum).toContain('strategy');
    });
  });

  describe('Metadata Fields', () => {
    it('should have generatedAt with default', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.generatedAt).toBeDefined();
    });

    it('should have lastUpdated with default', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.lastUpdated).toBeDefined();
    });

    it('should have dataSource with valid enum', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.dataSource).toBeDefined();
      expect(schema.dataSource.options.enum).toContain('auto');
      expect(schema.dataSource.options.enum).toContain('manual');
      expect(schema.dataSource.options.enum).toContain('hybrid');
      expect(schema.dataSource.options.default).toBe('auto');
    });

    it('should have completeness with min/max', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.completeness).toBeDefined();
      expect(schema.completeness.options.min).toBe(0);
      expect(schema.completeness.options.max).toBe(100);
      expect(schema.completeness.options.default).toBe(0);
    });

    it('should have exported field with default false', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.exported).toBeDefined();
      expect(schema.exported.options.default).toBe(false);
    });

    it('should have exportedAt date field', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.exportedAt).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have proper indexes defined', () => {
      const indexes = CompanyResearch.schema.indexes();
      expect(indexes.length).toBeGreaterThan(0);
    });

    it('should have userId index', () => {
      const schema = CompanyResearch.schema.paths;
      expect(schema.userId.options.index).toBe(true);
    });
  });

  describe('Document Creation', () => {
    it('should create a valid document instance', () => {
      const doc = new CompanyResearch({
        userId: 'user123',
        jobId: new mongoose.Types.ObjectId(),
        companyName: 'Test Company'
      });

      expect(doc.userId).toBe('user123');
      expect(doc.companyName).toBe('Test Company');
      expect(doc.dataSource).toBe('auto');
      expect(doc.completeness).toBe(0);
      expect(doc.exported).toBe(false);
    });

    it('should trim companyName', () => {
      const doc = new CompanyResearch({
        userId: 'user123',
        jobId: new mongoose.Types.ObjectId(),
        companyName: '  Test Company  '
      });

      expect(doc.companyName).toBe('Test Company');
    });

    it('should support profile subdocument', () => {
      const doc = new CompanyResearch({
        userId: 'user123',
        jobId: new mongoose.Types.ObjectId(),
        companyName: 'Test Company',
        profile: {
          overview: 'Company overview',
          industry: 'Technology',
          values: ['Innovation', 'Excellence']
        }
      });

      expect(doc.profile.overview).toBe('Company overview');
      expect(doc.profile.industry).toBe('Technology');
      expect(doc.profile.values).toHaveLength(2);
    });

    it('should support leadership array', () => {
      const doc = new CompanyResearch({
        userId: 'user123',
        jobId: new mongoose.Types.ObjectId(),
        companyName: 'Test Company',
        leadership: [
          { name: 'John Doe', title: 'CEO', bio: 'Leader bio' }
        ]
      });

      expect(doc.leadership).toHaveLength(1);
      expect(doc.leadership[0].name).toBe('John Doe');
    });

    it('should support news array with category', () => {
      const doc = new CompanyResearch({
        userId: 'user123',
        jobId: new mongoose.Types.ObjectId(),
        companyName: 'Test Company',
        news: [
          { title: 'News Title', summary: 'Summary', category: 'funding', date: new Date() }
        ]
      });

      expect(doc.news).toHaveLength(1);
      expect(doc.news[0].category).toBe('funding');
    });

    it('should support intelligentQuestions with category', () => {
      const doc = new CompanyResearch({
        userId: 'user123',
        jobId: new mongoose.Types.ObjectId(),
        companyName: 'Test Company',
        intelligentQuestions: [
          { question: 'Test question?', category: 'culture', reasoning: 'Reason' }
        ]
      });

      expect(doc.intelligentQuestions).toHaveLength(1);
      expect(doc.intelligentQuestions[0].category).toBe('culture');
    });
  });

  describe('Validation', () => {
    it('should fail without userId', async () => {
      const doc = new CompanyResearch({
        jobId: new mongoose.Types.ObjectId(),
        companyName: 'Test Company'
      });

      await expect(doc.validate()).rejects.toThrow();
    });

    it('should fail without jobId', async () => {
      const doc = new CompanyResearch({
        userId: 'user123',
        companyName: 'Test Company'
      });

      await expect(doc.validate()).rejects.toThrow();
    });

    it('should fail without companyName', async () => {
      const doc = new CompanyResearch({
        userId: 'user123',
        jobId: new mongoose.Types.ObjectId()
      });

      await expect(doc.validate()).rejects.toThrow();
    });

    it('should fail with invalid news category', async () => {
      const doc = new CompanyResearch({
        userId: 'user123',
        jobId: new mongoose.Types.ObjectId(),
        companyName: 'Test Company',
        news: [{ category: 'invalid_category' }]
      });

      await expect(doc.validate()).rejects.toThrow();
    });

    it('should fail with invalid question category', async () => {
      const doc = new CompanyResearch({
        userId: 'user123',
        jobId: new mongoose.Types.ObjectId(),
        companyName: 'Test Company',
        intelligentQuestions: [{ category: 'invalid' }]
      });

      await expect(doc.validate()).rejects.toThrow();
    });

    it('should fail with completeness above max', async () => {
      const doc = new CompanyResearch({
        userId: 'user123',
        jobId: new mongoose.Types.ObjectId(),
        companyName: 'Test Company',
        completeness: 150
      });

      await expect(doc.validate()).rejects.toThrow();
    });

    it('should fail with completeness below min', async () => {
      const doc = new CompanyResearch({
        userId: 'user123',
        jobId: new mongoose.Types.ObjectId(),
        companyName: 'Test Company',
        completeness: -10
      });

      await expect(doc.validate()).rejects.toThrow();
    });

    it('should fail with invalid dataSource', async () => {
      const doc = new CompanyResearch({
        userId: 'user123',
        jobId: new mongoose.Types.ObjectId(),
        companyName: 'Test Company',
        dataSource: 'invalid'
      });

      await expect(doc.validate()).rejects.toThrow();
    });
  });
});
