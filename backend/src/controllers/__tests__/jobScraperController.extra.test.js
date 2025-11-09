import { jest } from '@jest/globals';

// Helper to create a fake response object for node-fetch
const makeFetchResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => body,
});

describe('jobScraperController extra parsing cases', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('parses GBP salary range and sets currency to GBP', async () => {
    const html = `<html><body><h1>Engineer</h1><div>£50,000–£60,000</div></body></html>`;
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://example.com/job/gbp-salary' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

  expect(sent.status).toBe(200);
  const jobData = sent.body.data.jobData;
  // allow partial or success depending on extraction confidence
  expect(['success','partial']).toContain(jobData.importStatus);
    expect(jobData.salary).toBeDefined();
    expect(jobData.salary.currency).toBe('GBP');
    expect(jobData.salary.min).toBeGreaterThanOrEqual(50000);
  });

  it('detects Internship job type and On-site work mode', async () => {
    const html = `<html><body><h1>Summer Internship</h1><div>Onsite at HQ</div></body></html>`;
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://example.com/job/intern' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

  expect(sent.status).toBe(200);
  const jobData = sent.body.data.jobData;
  // detection may be partial if company/title confidences are low
  expect(['success','partial']).toContain(jobData.importStatus);
    expect(jobData.jobType).toMatch(/Internship/i);
    expect(jobData.workMode).toMatch(/On-site/i);
  });

  it('extracts requirements list from section heading and appends into description', async () => {
    const html = `<html><body><h2>Requirements</h2><ul><li>Req A</li><li>Req B</li></ul></body></html>`;
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://example.com/job/with-reqs' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

  expect(sent.status).toBe(200);
  const jobData = sent.body.data.jobData;
  // requirements extraction may result in partial import status
  expect(['success','partial']).toContain(jobData.importStatus);
    expect(jobData.requirements).toBeDefined();
    expect(Array.isArray(jobData.requirements)).toBe(true);
    expect(jobData.requirements.length).toBeGreaterThanOrEqual(2);
    expect(jobData.description).toMatch(/Requirements:/i);
  });

  it('reads baseSalary as nested object in JSON-LD and sets salary.min', async () => {
    const jsonLd = JSON.stringify({ '@type':'JobPosting', title:'Lead', hiringOrganization:{ name: 'BaseCo' }, baseSalary: { value: { value: 90000 }, currency: 'USD' } });
    const html = `<html><head><script type="application/ld+json">${jsonLd}</script></head><body></body></html>`;
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://example.com/job/jsonld-salary' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.importStatus).toBe('success');
    expect(jobData.salary).toBeDefined();
    expect(jobData.salary.min).toBeGreaterThanOrEqual(90000);
  });

  it('parses Greenhouse fallback location and content id', async () => {
    const html = `<html><body><div class="location">Boston</div><div id="content"><p>Some opening content</p></div></body></html>`;
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://boards.greenhouse.io/company/jobs/10' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(['success','partial']).toContain(jobData.importStatus);
    expect(jobData.location).toMatch(/Boston/);
    expect(jobData.description).toMatch(/Some opening content/);
  });

  it('parses Lever jobdesc id fallback', async () => {
    const html = `<html><body><div id="jobdesc">Job desc here</div></body></html>`;
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://jobs.lever.co/levercorp/789' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(['success','partial']).toContain(jobData.importStatus);
    expect(jobData.description).toMatch(/Job desc here/);
  });

  it('parses Workday og:title/og:description fallback', async () => {
    const html = `<html><head><meta property="og:title" content="Platform Engineer at WorkdayCorp | Workday" /><meta property="og:description" content="Work on infra" /></head><body></body></html>`;
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://careers.workday.com/job/999' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.title).toMatch(/Platform Engineer/);
    expect(jobData.description).toMatch(/Work on infra/);
  });

  it('parses Glassdoor selectors and extracts fields', async () => {
    const html = `<html><body><h1 class="jobTitle">GD Dev</h1><span class="employerName">GDCo</span><span class="location">NYC</span><div class="jobDescriptionContent">Full description here</div></body></html>`;
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://www.glassdoor.com/job/1' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.title).toMatch(/GD Dev/);
    expect(jobData.company).toMatch(/GDCo/);
    expect(jobData.location).toMatch(/NYC/);
    expect(jobData.description).toMatch(/Full description here/);
  });

});
