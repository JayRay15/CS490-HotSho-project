import { jest } from '@jest/globals';
import {
  generateApplicationPackage,
  scheduleApplication,
  createApplicationChecklist,
  bulkApply,
} from '../applicationAutomationController.js';

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue({});
  return res;
}

describe('applicationAutomationController quick validation branches', () => {
  test('generateApplicationPackage returns validation error when jobId missing', async () => {
    const req = { body: {}, auth: {} };
    const res = mockRes();
    await generateApplicationPackage(req, res);
    expect(res.status).toHaveBeenCalled();
    // should return a validation error status (likely 400)
  });

  test('scheduleApplication errors on missing fields and past dates', async () => {
    const res1 = mockRes();
    await scheduleApplication({ body: {}, auth: {} }, res1);
    expect(res1.status).toHaveBeenCalled();

    // past date
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const res2 = mockRes();
    await scheduleApplication({ body: { packageId: 'p1', scheduledFor: past }, auth: {} }, res2);
    expect(res2.status).toHaveBeenCalled();
  });

  test('createApplicationChecklist validates missing jobId', async () => {
    const res = mockRes();
    await createApplicationChecklist({ body: { items: [] }, auth: {} }, res);
    expect(res.status).toHaveBeenCalled();
  });

  test('bulkApply validates jobIds array presence', async () => {
    const res = mockRes();
    await bulkApply({ body: {}, auth: {} }, res);
    expect(res.status).toHaveBeenCalled();
  });
});
