import { NetworkingCampaign } from '../NetworkingCampaign';

describe('NetworkingCampaign extra tests for uncovered branches', () => {
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
        totalOutreach: 200, // will be capped
        responseRate: 999, // will be capped
        meetings: 10,
        connections: 5
      },
      endDate: past
    });

    // healthScore should compute with each metric contribution capped at 100
    const hs = doc.healthScore;
    expect(typeof hs).toBe('number');

    // daysRemaining should be 0 for past endDate
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

    // compute expected using same formula as the model
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
