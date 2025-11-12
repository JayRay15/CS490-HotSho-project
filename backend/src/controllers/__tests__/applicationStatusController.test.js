import { jest, beforeEach, describe, it, expect } from '@jest/globals';

jest.resetModules();

// Mocks
const mockApplicationStatus = {
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findOneAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
  getStatusStats: jest.fn(),
};

const mockJob = {
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn()
};

const mockSendStatusChangeNotification = jest.fn();
const mockDetectStatusFromEmail = jest.fn();

// Mock responseFormat utils
const mockSendResponse = jest.fn((res, response, statusCode) => {
  if (res && typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode || 200);
    res.json(response);
  }
});
const mockSuccessResponse = (message, data, statusCode = 200) => ({ response: { success: true, message, data }, statusCode });
const mockErrorResponse = (message, statusCode = 500) => ({ response: { success: false, message }, statusCode });
const mockValidationErrorResponse = (message, errors) => ({ response: { success: false, message, errors }, statusCode: 400 });

jest.unstable_mockModule('../../models/ApplicationStatus.js', () => ({
  ApplicationStatus: mockApplicationStatus
}));

jest.unstable_mockModule('../../models/Job.js', () => ({
  Job: mockJob
}));

jest.unstable_mockModule('../../utils/responseFormat.js', () => ({
  successResponse: mockSuccessResponse,
  errorResponse: mockErrorResponse,
  sendResponse: mockSendResponse,
  validationErrorResponse: mockValidationErrorResponse,
  ERROR_CODES: {
    NOT_FOUND: 'NOT_FOUND'
  }
}));

jest.unstable_mockModule('../../utils/statusNotifications.js', () => ({
  sendStatusChangeNotification: (...args) => mockSendStatusChangeNotification(...args)
}));

jest.unstable_mockModule('../../utils/emailStatusDetector.js', () => ({
  detectStatusFromEmail: (...args) => mockDetectStatusFromEmail(...args)
}));

// Import controller after mocks
const {
  getApplicationStatus,
  getAllApplicationStatuses,
  updateApplicationStatus,
  getStatusTimeline,
  addTimelineEvent,
  bulkUpdateStatuses,
  getStatusStatistics,
  detectStatusFromEmailEndpoint,
  confirmStatusDetection,
  updateAutomationSettings,
  deleteApplicationStatus
} = await import('../applicationStatusController.js');

describe('applicationStatusController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { auth: { payload: { sub: 'user-1' } }, params: {}, query: {}, body: {} };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  it('getApplicationStatus returns existing status', async () => {
    mockReq.params.jobId = 'job-1';

    const found = { _id: 's1', currentStatus: 'Applied', jobId: { title: 'Role' } };
    mockApplicationStatus.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(found) });

    await getApplicationStatus(mockReq, mockRes);

    expect(mockApplicationStatus.findOne).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('getApplicationStatus creates status when missing and job exists', async () => {
    mockReq.params.jobId = 'job-2';
    mockApplicationStatus.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    mockJob.findOne.mockResolvedValue({ _id: 'job-2', status: 'Applied', applicationDate: '2020-01-01' });

    const created = { _id: 's2', populate: jest.fn().mockResolvedValue({ _id: 's2', jobId: { title: 'R' } }) };
    mockApplicationStatus.create.mockResolvedValue(created);

    await getApplicationStatus(mockReq, mockRes);

    expect(mockApplicationStatus.create).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('getApplicationStatus returns 404 when job not found', async () => {
    mockReq.params.jobId = 'job-404';
    mockApplicationStatus.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    mockJob.findOne.mockResolvedValue(null);

    await getApplicationStatus(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  it('updateApplicationStatus validates missing status', async () => {
    mockReq.params.jobId = 'job-x';
    mockReq.body = {};

    await updateApplicationStatus(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('updateApplicationStatus creates new status when none exists and job missing -> 404', async () => {
    mockReq.params.jobId = 'job-missing';
    mockReq.body = { status: 'Interview' };
    mockApplicationStatus.findOne.mockResolvedValue(null);
    mockJob.findOne.mockResolvedValue(null);

    await updateApplicationStatus(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  it('updateApplicationStatus updates existing status and sends notification when enabled', async () => {
    mockReq.params.jobId = 'job-3';
    mockReq.body = { status: 'Phone Screen', notes: 'note' };

    const statusObj = {
      _id: 's3',
      notifications: { statusChangeAlert: true },
      updateStatus: jest.fn(),
      save: jest.fn().mockResolvedValue(true)
    };
    mockApplicationStatus.findOne.mockResolvedValue(statusObj);
    mockApplicationStatus.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(statusObj) });
    mockJob.findByIdAndUpdate.mockResolvedValue({});

    await updateApplicationStatus(mockReq, mockRes);

    expect(statusObj.updateStatus).toHaveBeenCalledWith('Phone Screen', expect.any(Object));
    expect(mockSendStatusChangeNotification).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('getStatusTimeline returns 404 when status missing', async () => {
    mockReq.params.jobId = 'job-tt';
    mockApplicationStatus.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

    await getStatusTimeline(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  it('getStatusTimeline returns timeline when present', async () => {
    mockReq.params.jobId = 'job-tt2';
    const s = {
      currentStatus: 'Applied', appliedAt: new Date(), lastStatusChange: new Date(),
      statusHistory: [{ changedAt: 1 }], timeline: [{ timestamp: 1 }], metrics: {}, jobId: { title: 'T' }
    };
    mockApplicationStatus.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(s) });

    await getStatusTimeline(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getAllApplicationStatuses returns list with filter and sort', async () => {
    mockReq.query = { status: 'Applied', sortBy: 'lastStatusChange', order: 'asc' };
    const results = [{ jobId: { title: 'X' } }];
    mockApplicationStatus.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(results) }) });

    await getAllApplicationStatuses(mockReq, mockRes);

    expect(mockApplicationStatus.find).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('addTimelineEvent validates missing fields', async () => {
    mockReq.params.jobId = 'job-e';
    mockReq.body = { eventType: '', description: '' };

    await addTimelineEvent(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('addTimelineEvent returns 404 when status not found', async () => {
    mockReq.params.jobId = 'job-e2';
    mockReq.body = { eventType: 'Note', description: 'desc' };
    mockApplicationStatus.findOne.mockResolvedValue(null);

    await addTimelineEvent(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  it('addTimelineEvent succeeds when status exists', async () => {
    mockReq.params.jobId = 'job-e3';
    mockReq.body = { eventType: 'Note', description: 'desc', metadata: { a: 1 } };
    const statusObj = { addTimelineEvent: jest.fn(), save: jest.fn().mockResolvedValue(true), timeline: [{}, { id: 't' }] };
    mockApplicationStatus.findOne.mockResolvedValue(statusObj);

    await addTimelineEvent(mockReq, mockRes);

    expect(statusObj.addTimelineEvent).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('bulkUpdateStatuses validates input arrays and status', async () => {
    mockReq.body = {}; // missing jobIds
    await bulkUpdateStatuses(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);

    mockReq.body = { jobIds: ['j1'], status: '' };
    await bulkUpdateStatuses(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('bulkUpdateStatuses processes jobs and handles missing job', async () => {
    mockReq.body = { jobIds: ['j-ok', 'j-missing'], status: 'Applied' };
    // first job - existing status
    const sOk = { updateStatus: jest.fn(), save: jest.fn().mockResolvedValue(true), notifications: { statusChangeAlert: false } };
    // second job - no status and job not found
    mockApplicationStatus.findOne.mockImplementation(({ jobId }) => {
      if (jobId === 'j-ok') return Promise.resolve(sOk);
      return Promise.resolve(null);
    });
    mockJob.findOne.mockImplementation(({ _id }) => Promise.resolve(null));
    mockJob.findByIdAndUpdate.mockResolvedValue({});

    await bulkUpdateStatuses(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('getStatusStatistics returns aggregated stats', async () => {
    mockApplicationStatus.getStatusStats.mockResolvedValue([{ _id: 'Applied', count: 2 }]);
    mockApplicationStatus.countDocuments.mockResolvedValueOnce(5).mockResolvedValueOnce(3).mockResolvedValueOnce(2).mockResolvedValueOnce(1).mockResolvedValueOnce(1);
    mockApplicationStatus.aggregate.mockResolvedValue([{ _id: null, avgResponseTime: 2.5 }]);
  mockApplicationStatus.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([{ _id: 's1', jobId: { title: 'T' } }]) });

    await getStatusStatistics(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('detectStatusFromEmailEndpoint returns detection when no ApplicationStatus exists', async () => {
    mockReq.params.jobId = 'jm1';
    mockReq.body = { emailSubject: 'Sub', emailBody: 'Body' };
    mockDetectStatusFromEmail.mockResolvedValue({ status: 'Interview', confidence: 80, reason: 'match', matchedKeywords: ['kw'] });
    mockApplicationStatus.findOne.mockResolvedValue(null);

    await detectStatusFromEmailEndpoint(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    const sent = mockRes.json.mock.calls[0][0];
    expect(sent.data.applied).toBe(false);
  });

  it('detectStatusFromEmailEndpoint auto-applies when detection confident and auto-apply enabled', async () => {
    mockReq.params.jobId = 'jm2';
    mockReq.body = { emailSubject: 'S', emailBody: 'B', emailFrom: 'a@b.com' };
    mockDetectStatusFromEmail.mockResolvedValue({ status: 'Offer', confidence: 90, reason: 'match', matchedKeywords: [] });

    const statusObj = {
      automation: { autoStatusDetection: { requireConfirmation: false } },
      notifications: { statusChangeAlert: true },
      updateStatus: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
      currentStatus: 'Applied'
    };
    mockApplicationStatus.findOne.mockResolvedValue(statusObj);

    await detectStatusFromEmailEndpoint(mockReq, mockRes);

    expect(statusObj.updateStatus).toHaveBeenCalled();
    expect(mockSendStatusChangeNotification).toHaveBeenCalled();
    const sent = mockRes.json.mock.calls[mockRes.json.mock.calls.length - 1][0];
    expect(sent.success).toBe(true);
    expect(sent.data.applied).toBe(true);
  });

  it('detectStatusFromEmailEndpoint returns no-clear-detection when confidence low', async () => {
    mockReq.params.jobId = 'jm3';
    mockReq.body = { emailSubject: 'S', emailBody: 'B' };
    mockDetectStatusFromEmail.mockResolvedValue({ status: 'Phone Screen', confidence: 30, reason: 'low', matchedKeywords: [] });
    const statusObj = { currentStatus: 'Applied' };
    mockApplicationStatus.findOne.mockResolvedValue(statusObj);

    await detectStatusFromEmailEndpoint(mockReq, mockRes);

    const sent = mockRes.json.mock.calls[mockRes.json.mock.calls.length - 1][0];
    expect(sent.success).toBe(true);
    expect(sent.data.requiresConfirmation).toBe(true);
  });

  it('confirmStatusDetection validates and updates status', async () => {
    mockReq.params.jobId = 'c1';
    mockReq.body = { detectedStatus: 'Offer' };
    const statusObj = { updateStatus: jest.fn(), save: jest.fn().mockResolvedValue(true) };
    mockApplicationStatus.findOne.mockResolvedValue(statusObj);

    await confirmStatusDetection(mockReq, mockRes);

    expect(statusObj.updateStatus).toHaveBeenCalledWith('Offer', expect.any(Object));
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('updateAutomationSettings updates and returns 404 when missing', async () => {
    mockReq.params.jobId = 'a1';
    mockReq.body = { automation: { enabled: true } };
    mockApplicationStatus.findOne.mockResolvedValue(null);

    await updateAutomationSettings(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);

    const statusObj = { automation: {}, save: jest.fn().mockResolvedValue(true) };
    mockApplicationStatus.findOne.mockResolvedValue(statusObj);
    await updateAutomationSettings(mockReq, mockRes);
    expect(statusObj.save).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deleteApplicationStatus handles missing and success', async () => {
    mockReq.params.jobId = 'd1';
    mockApplicationStatus.findOneAndDelete.mockResolvedValue(null);
    await deleteApplicationStatus(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);

    mockApplicationStatus.findOneAndDelete.mockResolvedValue({ _id: 'sdel' });
    await deleteApplicationStatus(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

});
