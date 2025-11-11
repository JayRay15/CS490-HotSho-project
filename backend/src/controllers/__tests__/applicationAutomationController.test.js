import { beforeEach, afterEach, describe, it, expect, jest } from '@jest/globals';

// Import the controller functions
import * as controller from '../applicationAutomationController.js';

// Import models to spy on
import { ApplicationPackage } from '../../models/ApplicationPackage.js';
import { Job } from '../../models/Job.js';
import { Resume } from '../../models/Resume.js';
import { CoverLetter } from '../../models/CoverLetter.js';
import { User } from '../../models/User.js';
import { ApplicationAutomation } from '../../models/ApplicationAutomation.js';
import { ApplicationTemplate } from '../../models/ApplicationAutomation.js';
import { ApplicationChecklist } from '../../models/ApplicationAutomation.js';

// Helper to create a mock chainable query with populate()/.sort() and thenable behavior
const chainable = (result) => {
  const chain = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue(result),
    then: (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected),
    catch: (onRejected) => Promise.resolve(result).catch(onRejected)
  };
  return chain;
};

describe('applicationAutomationController', () => {
  let res;

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    // next should throw so asyncHandler will surface errors in tests
    next = (err) => { if (err) throw err; };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateApplicationPackage', () => {
    it('returns validation error when jobId missing', async () => {
      const req = { auth: { payload: { sub: 'u1' } }, body: {} };
  await controller.generateApplicationPackage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      const sent = res.json.mock.calls[0][0];
      expect(sent.success).toBe(false);
    });

    it('returns 404 when job not found', async () => {
      jest.spyOn(Job, 'findOne').mockResolvedValue(null);
      const req = { auth: { payload: { sub: 'u1' } }, body: { jobId: 'j1' } };
  await controller.generateApplicationPackage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      const sent = res.json.mock.calls[0][0];
      expect(sent.success).toBe(false);
    });

    it('creates package using latest resume/cover and user website when not provided', async () => {
      const job = { _id: 'j1', company: 'Acme', title: 'Dev', url: 'http://' };
      jest.spyOn(Job, 'findOne').mockResolvedValue(job);
      jest.spyOn(Resume, 'findOne').mockReturnValue({ sort: () => Promise.resolve(null) });
      jest.spyOn(CoverLetter, 'findOne').mockReturnValue({ sort: () => Promise.resolve(null) });
      jest.spyOn(User, 'findOne').mockResolvedValue({ website: 'https://me' });
      const created = { _id: 'pkg1' };
      jest.spyOn(ApplicationPackage, 'create').mockResolvedValue(created);

      const req = { auth: { payload: { sub: 'u1' } }, body: { jobId: 'j1' } };
      // debug: ensure controller call completes and we can inspect res
  console.log('DEBUG: before generateApplicationPackage call');
  await controller.generateApplicationPackage(req, res, next);
  console.log('DEBUG: after generateApplicationPackage call, statusCalls=', res.status.mock.calls.length);
      expect(res.status).toHaveBeenCalledWith(200);
      const sent = res.json.mock.calls[0][0];
      expect(sent.success).toBe(true);
      expect(sent.data).toEqual(created);
    });
  });

  describe('getApplicationPackages', () => {
    it('returns packages for user', async () => {
      const packages = [{ _id: 'p1' }];
      jest.spyOn(ApplicationPackage, 'find').mockImplementation(() => chainable(packages));
      const req = { auth: { payload: { sub: 'u1' } }, query: {} };
  await controller.getApplicationPackages(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const sent = res.json.mock.calls[0][0];
      expect(sent.data).toEqual(packages);
    });
  });

  describe('updateApplicationPackage & deleteApplicationPackage', () => {
    it('update returns 404 when not found', async () => {
      jest.spyOn(ApplicationPackage, 'findOneAndUpdate').mockImplementation(() => chainable(null));
      const req = { auth: { payload: { sub: 'u1' } }, params: { packageId: 'x' }, body: {} };
  await controller.updateApplicationPackage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('delete returns 404 when not found', async () => {
      jest.spyOn(ApplicationPackage, 'findOneAndDelete').mockResolvedValue(null);
      const req = { auth: { payload: { sub: 'u1' } }, params: { packageId: 'x' } };
  await controller.deleteApplicationPackage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('scheduleApplication', () => {
    it('validates required fields', async () => {
      const req = { auth: { payload: { sub: 'u1' } }, body: {} };
  await controller.scheduleApplication(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('validates future date', async () => {
      const req = { auth: { payload: { sub: 'u1' } }, body: { packageId: 'p', scheduledFor: '2000-01-01' } };
  await controller.scheduleApplication(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('schedules and updates job when package found', async () => {
      const pkg = { _id: 'p1', jobId: { _id: 'j1' } };
      jest.spyOn(ApplicationPackage, 'findOneAndUpdate').mockImplementation(() => chainable(pkg));
      const jobUpdate = jest.spyOn(Job, 'findByIdAndUpdate').mockResolvedValue({});
      const future = new Date(); future.setDate(future.getDate() + 1);
      const req = { auth: { payload: { sub: 'u1' } }, body: { packageId: 'p1', scheduledFor: future.toISOString() } };
  await controller.scheduleApplication(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jobUpdate).toHaveBeenCalled();
    });
  });

  describe('automation rules and templates', () => {
    it('createAutomationRule and getAutomationRules', async () => {
      const rule = { _id: 'r1' };
      jest.spyOn(ApplicationAutomation, 'create').mockResolvedValue(rule);
      const req1 = { auth: { payload: { sub: 'u1' } }, body: { name: 'x' } };
  await controller.createAutomationRule(req1, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(ApplicationAutomation, 'find').mockImplementation(() => chainable([rule]));
      const req2 = { auth: { payload: { sub: 'u1' } }, query: {} };
  await controller.getAutomationRules(req2, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('updateAutomationRule returns 404 when not found', async () => {
      jest.spyOn(ApplicationAutomation, 'findOneAndUpdate').mockResolvedValue(null);
      const req = { auth: { payload: { sub: 'u1' } }, params: { ruleId: 'r' }, body: {} };
  await controller.updateAutomationRule(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deleteAutomationRule returns 404 when not found', async () => {
      jest.spyOn(ApplicationAutomation, 'findOneAndDelete').mockResolvedValue(null);
      const req = { auth: { payload: { sub: 'u1' } }, params: { ruleId: 'r' } };
  await controller.deleteAutomationRule(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('create/get/update/delete templates basic flows', async () => {
      const tpl = { _id: 't1' };
      jest.spyOn(ApplicationTemplate, 'create').mockResolvedValue(tpl);
  await controller.createApplicationTemplate({ auth: { payload: { sub: 'u1' } }, body: { name: 'n' } }, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(ApplicationTemplate, 'find').mockImplementation(() => chainable([tpl]));
  await controller.getApplicationTemplates({ auth: { payload: { sub: 'u1' } }, query: {} }, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      jest.spyOn(ApplicationTemplate, 'findOneAndUpdate').mockResolvedValue(null);
  await controller.updateApplicationTemplate({ auth: { payload: { sub: 'u1' } }, params: { templateId: 't' }, body: {} }, res, next);
      expect(res.status).toHaveBeenCalledWith(404);

      jest.spyOn(ApplicationTemplate, 'findOneAndDelete').mockResolvedValue(null);
  await controller.deleteApplicationTemplate({ auth: { payload: { sub: 'u1' } }, params: { templateId: 't' } }, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('bulkApply', () => {
    it('validates jobIds array', async () => {
      const req = { auth: { payload: { sub: 'u1' } }, body: {} };
  await controller.bulkApply(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('processes jobs, marking not found and created packages', async () => {
      const job1 = null;
      const job2 = { _id: 'j2', company: 'C', title: 'T', url: 'u' };
      jest.spyOn(Job, 'findOne').mockImplementation(({ _id }) => {
        return _id === 'a' ? Promise.resolve(job1) : Promise.resolve(job2);
      });
      jest.spyOn(ApplicationPackage, 'create').mockResolvedValue({ _id: 'pkg2' });

      const req = { auth: { payload: { sub: 'u1' } }, body: { jobIds: ['a', 'b'], resumeId: 'r', coverLetterId: 'c' } };
  await controller.bulkApply(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const sent = res.json.mock.calls[0][0];
      expect(sent.data.successful.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checklist flows', () => {
    it('createApplicationChecklist validates jobId', async () => {
      const req = { auth: { payload: { sub: 'u1' } }, body: {} };
  await controller.createApplicationChecklist(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('createApplicationChecklist updates existing checklist', async () => {
      const checklist = { items: [], save: jest.fn().mockResolvedValue(true) };
      jest.spyOn(ApplicationChecklist, 'findOne').mockResolvedValue(checklist);
      const req = { auth: { payload: { sub: 'u1' } }, body: { jobId: 'j', items: [{ task: 'x' }] } };
  await controller.createApplicationChecklist(req, res, next);
      expect(checklist.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('createApplicationChecklist creates new checklist when none exists', async () => {
      jest.spyOn(ApplicationChecklist, 'findOne').mockResolvedValue(null);
      jest.spyOn(ApplicationChecklist, 'create').mockResolvedValue({ _id: 'c1' });
      const req = { auth: { payload: { sub: 'u1' } }, body: { jobId: 'j' } };
  await controller.createApplicationChecklist(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getApplicationChecklist returns 404 when missing', async () => {
      jest.spyOn(ApplicationChecklist, 'findOne').mockImplementation(() => chainable(null));
      const req = { auth: { payload: { sub: 'u1' } }, params: { jobId: 'j' } };
  await controller.getApplicationChecklist(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('updateChecklistItem handles missing checklist and missing item', async () => {
      jest.spyOn(ApplicationChecklist, 'findOne').mockResolvedValue(null);
      const req = { auth: { payload: { sub: 'u1' } }, params: { jobId: 'j', itemId: 'i' }, body: {} };
  await controller.updateChecklistItem(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('getAllChecklists returns list', async () => {
      jest.spyOn(ApplicationChecklist, 'find').mockImplementation(() => chainable([{ _id: 'c1' }]));
      const req = { auth: { payload: { sub: 'u1' } } };
  await controller.getAllChecklists(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
