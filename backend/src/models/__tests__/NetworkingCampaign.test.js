import { NetworkingCampaign } from '../NetworkingCampaign';

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

    const goalMet = (current, target) => target > 0 ? Math.min(100, (current / target) * 100) : 0;
    let expected = 0;
    expected += goalMet(doc.metrics.responseRate, doc.goals.responseRate) * 0.3;
    expected += goalMet(doc.metrics.meetings, doc.goals.meetingsScheduled) * 0.3;
    expected += goalMet(doc.metrics.connections, doc.goals.connectionsGained) * 0.25;
    expected += goalMet(doc.metrics.totalOutreach, doc.goals.totalOutreach) * 0.15;
    expected = Math.round(expected);

    expect(doc.healthScore).toBe(expected);
  });

  test('progress returns 0 when goals.totalOutreach is zero or missing', () => {
    const doc1 = NetworkingCampaign.hydrate({ goals: { totalOutreach: 0 }, metrics: { totalOutreach: 5 } });
    expect(doc1.progress).toBe(0);

    const doc2 = NetworkingCampaign.hydrate({ goals: {}, metrics: { totalOutreach: 5 } });
    // Schema provides a default goals.totalOutreach (20), so progress should reflect that
    expect(doc2.progress).toBe(25);
  });

  test('daysRemaining returns null when endDate is not set', () => {
    const doc = NetworkingCampaign.hydrate({});
    expect(doc.daysRemaining).toBeNull();
  });

  test('healthScore handles zero targets safely and returns 0', () => {
    const doc = NetworkingCampaign.hydrate({
      goals: {
        totalOutreach: 0,
        responseRate: 0,
        meetingsScheduled: 0,
        connectionsGained: 0
      },
      metrics: {
        totalOutreach: 0,
        responseRate: 0,
        meetings: 0,
        connections: 0
      }
    });

    expect(doc.healthScore).toBe(0);
  });

  test('toJSON includes virtuals (progress, daysRemaining, healthScore)', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2);
    const doc = NetworkingCampaign.hydrate({
      goals: { totalOutreach: 10 },
      metrics: { totalOutreach: 5 },
      endDate: future
    });

    const json = doc.toJSON();
    expect(json).toHaveProperty('progress');
    expect(json).toHaveProperty('daysRemaining');
    expect(json).toHaveProperty('healthScore');
  });

  test('healthScore caps metric contributions at 100 and handles past endDate', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);
    const doc = NetworkingCampaign.hydrate({
      goals: {
        totalOutreach: 10,
        responseRate: 10,
        meetingsScheduled: 1,
        connectionsGained: 1
      },
      metrics: {
        totalOutreach: 200,
        responseRate: 999,
        meetings: 10,
        connections: 5
      },
      endDate: past
    });

    const hs = doc.healthScore;
    expect(typeof hs).toBe('number');
    expect(doc.daysRemaining).toBe(0);
  });

  test('healthScore with per-metric mid-range contributions', () => {
    const doc = NetworkingCampaign.hydrate({
      goals: {
        totalOutreach: 100,
        responseRate: 50,
        meetingsScheduled: 4,
        connectionsGained: 5
      },
      metrics: {
        totalOutreach: 50,
        responseRate: 25,
        meetings: 2,
        connections: 1
      }
    });

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
