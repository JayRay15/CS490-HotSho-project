import mongoose from 'mongoose';
import { TechnicalPrep } from '../../src/models/TechnicalPrep';

describe('TechnicalPrep model', () => {
  test('getOrCreate creates when none exists', async () => {
    const spyFindOne = jest.spyOn(TechnicalPrep, 'findOne').mockResolvedValue(null);
    const fake = { userId: 'u1' };
    const spyCreate = jest.spyOn(TechnicalPrep, 'create').mockResolvedValue(fake);

    const res = await TechnicalPrep.getOrCreate('u1');
    expect(spyFindOne).toHaveBeenCalledWith({ userId: 'u1' });
    expect(spyCreate).toHaveBeenCalled();
    expect(res).toBe(fake);

    spyFindOne.mockRestore();
    spyCreate.mockRestore();
  });

  test('updatePerformance computes average and totals', () => {
    const prep = new TechnicalPrep({
      userId: 'u2',
      submissions: [
        { score: 80, timeSpent: 30, testsPassed: 3, totalTests: 3 },
        { score: 60, timeSpent: 45, testsPassed: 2, totalTests: 3 }
      ]
    });

    prep.updatePerformance();

    expect(prep.performance.totalChallengesAttempted).toBe(2);
    expect(prep.performance.totalChallengesCompleted).toBe(1);
    expect(prep.performance.averageScore).toBeCloseTo((80 + 60) / 2);
    expect(prep.performance.totalTimeSpent).toBe(75);
  });
});
