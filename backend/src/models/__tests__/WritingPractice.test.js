import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { PracticeSession, PerformanceTracking } from '../WritingPractice';

describe('WritingPractice models', () => {
  test('PracticeSession.calculateSessionScore computes average', () => {
    const session = new PracticeSession({
      responses: [
        { feedback: { overallScore: 80 } },
        { feedback: { overallScore: 60 } }
      ]
    });

    const score = session.calculateSessionScore();
    expect(score).toBe(70);
    expect(session.sessionScore).toBe(70);
  });

  test('PracticeSession.completeSession marks completed and sets completedAt', () => {
    const session = new PracticeSession({
      responses: [ { feedback: { overallScore: 90 } } ]
    });

    session.completeSession();
    expect(session.completed).toBe(true);
    expect(session.completedAt).toBeInstanceOf(Date);
    expect(session.sessionScore).toBe(90);
  });

  test('PerformanceTracking.getOrCreate creates when not found', async () => {
    const spyFindOne = jest.spyOn(PerformanceTracking, 'findOne').mockResolvedValue(null);
    const fakeCreated = new PerformanceTracking({ userId: 'u-x' });
    const spyCreate = jest.spyOn(PerformanceTracking, 'create').mockResolvedValue(fakeCreated);

    const result = await PerformanceTracking.getOrCreate('u-x');
    expect(spyFindOne).toHaveBeenCalledWith({ userId: 'u-x' });
    expect(spyCreate).toHaveBeenCalled();
    expect(result).toBe(fakeCreated);

    spyFindOne.mockRestore();
    spyCreate.mockRestore();
  });

  test('PerformanceTracking.updateAfterSession updates metrics and saves', async () => {
    const perf = new PerformanceTracking({ userId: 'u-y' });

    const session = {
      _id: new mongoose.Types.ObjectId(),
      sessionScore: 80,
      responses: [
        { questionId: new mongoose.Types.ObjectId(), feedback: { overallScore: 80 } },
        { questionId: new mongoose.Types.ObjectId(), feedback: { overallScore: 60 } }
      ],
      totalTimeSpent: 120
    };

    const mockFindById = jest.fn().mockResolvedValue({ category: 'Leadership' });
    const spyModel = jest.spyOn(mongoose, 'model').mockImplementation(() => ({ findById: mockFindById }));

    const saveSpy = jest.spyOn(perf, 'save').mockResolvedValue(perf);

    await perf.updateAfterSession(session);

    expect(perf.totalSessions).toBe(1);
    expect(perf.totalQuestionsAnswered).toBe(2);
    expect(perf.improvementTrend.length).toBeGreaterThan(0);
    expect(perf.categoryPerformance.length).toBeGreaterThan(0);

    saveSpy.mockRestore();
    spyModel.mockRestore();
  });
});
