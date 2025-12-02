import { NetworkingCampaign } from '../../src/models/NetworkingCampaign';

describe('NetworkingCampaign model virtuals', () => {
  test('progress virtual computes percentage correctly', () => {
    const doc = NetworkingCampaign.hydrate({
      goals: { totalOutreach: 20 },
      metrics: { totalOutreach: 10 }
    });

    expect(doc.progress).toBe(50);
  });

  test('daysRemaining returns positive days for future endDate', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5); // 5 days
    const doc = NetworkingCampaign.hydrate({ endDate: future });

    expect(typeof doc.daysRemaining).toBe('number');
    expect(doc.daysRemaining).toBeGreaterThanOrEqual(0);
  });

  test('healthScore computes a reasonable score', () => {
    const doc = NetworkingCampaign.hydrate({
      goals: {
        totalOutreach: 20,
        responseRate: 30,
        meetingsScheduled: 5,
        connectionsGained: 10
      },
      metrics: {
        totalOutreach: 10,
        responseRate: 60,
        meetings: 3,
        connections: 2
      }
    });

    // Manual compute similar to model logic
    const goalMet = (current, target) => target > 0 ? Math.min(100, (current / target) * 100) : 0;
    let expected = 0;
    expected += goalMet(doc.metrics.responseRate, doc.goals.responseRate) * 0.3;
    expected += goalMet(doc.metrics.meetings, doc.goals.meetingsScheduled) * 0.3;
    expected += goalMet(doc.metrics.connections, doc.goals.connectionsGained) * 0.25;
    expected += goalMet(doc.metrics.totalOutreach, doc.goals.totalOutreach) * 0.15;
    expected = Math.round(expected);

    expect(doc.healthScore).toBe(expected);
  });
});
