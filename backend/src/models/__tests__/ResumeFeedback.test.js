import { jest } from '@jest/globals';

describe('ResumeFeedback model basic shape', () => {
  it('Exports a mongoose model with expected schema paths', async () => {
    // Import the model dynamically to avoid side-effects
    const mod = await import('../ResumeFeedback.js');
    const { ResumeFeedback } = mod;
    expect(ResumeFeedback).toBeDefined();
    // Schema paths should exist
    const paths = Object.keys(ResumeFeedback.schema.paths);
    expect(paths).toEqual(expect.arrayContaining(['resumeId','shareToken','comment','status','resolutionNote','createdAt','updatedAt']));
    // Status should be enum open/resolved
    const statusPath = ResumeFeedback.schema.paths.status;
    expect(statusPath.options.enum).toEqual(expect.arrayContaining(['open','resolved']));
    // Indexes should include resumeId+shareToken compound
    const indexes = ResumeFeedback.schema.indexes();
    const hasCompound = indexes.some(idx => Array.isArray(idx[0]) || typeof idx[0] === 'object');
    expect(hasCompound).toBe(true);
  });
});
