import { jest, describe, it, expect } from '@jest/globals';
import Referral from '../Referral.js';

describe('Referral model basic behavior', () => {
  it('includes virtual daysSinceRequest when requestedDate is set', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const doc = new Referral({ userId: 'u1', jobId: 'j1', contactId: 'c1', requestContent: 'please', requestedDate: twoDaysAgo });
    const json = doc.toJSON();
    expect(json).toHaveProperty('daysSinceRequest');
    // Should be roughly 2
    expect(json.daysSinceRequest).toBeGreaterThanOrEqual(1);
  });
});
