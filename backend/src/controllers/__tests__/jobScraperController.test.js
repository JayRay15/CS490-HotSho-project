import { jest } from '@jest/globals';

// Helper to create a fake response object for node-fetch
const makeFetchResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => body,
});

describe('jobScraperController.scrapeJobFromURL', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns 400 when URL missing', async () => {
    // import controller fresh without mocking fetch (not needed)
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: {} };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(400);
    expect(sent.body).toHaveProperty('success', false);
    expect(sent.body).toHaveProperty('errorCode');
    // Missing required field code
    expect(sent.body.errorCode).toBeGreaterThanOrEqual(2000);
  });

  it('returns 400 for invalid URL format', async () => {
    const { scrapeJobFromURL } = await import('../jobScraperController.js');
    const req = { body: { url: 'not-a-url' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(400);
    expect(sent.body.success).toBe(false);
    expect(sent.body.message).toMatch(/Invalid URL format/);
  });

  it('rejects non-job URLs', async () => {
    const { scrapeJobFromURL } = await import('../jobScraperController.js');
    const req = { body: { url: 'https://example.com/about' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(400);
    expect(sent.body.success).toBe(false);
    expect(sent.body.message).toMatch(/doesn't appear to be a job posting URL/i);
  });

  it('handles 403 fetch response (blocked) and sets importStatus failed', async () => {
    // Mock node-fetch to return 403
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(403, 'Forbidden') }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://www.indeed.com/viewjob?jk=123' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.importStatus).toBe('failed');
    expect(jobData.importNotes).toMatch(/blocked the request|403/i);
  });

  it('handles 404 fetch response and sets importStatus failed', async () => {
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(404, 'Not Found') }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://www.indeed.com/viewjob?jk=missing' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.importStatus).toBe('failed');
    expect(jobData.importNotes).toMatch(/not found|404/i);
  });

  it('parses LinkedIn JSON-LD and returns success importStatus', async () => {
    const jsonLd = JSON.stringify({ '@type': 'JobPosting', title: 'Software Engineer', hiringOrganization: { name: 'Acme Corp' }, jobLocation: { address: { addressLocality: 'Remote' } }, description: 'Great job' });
    const html = `<html><head><script type="application/ld+json">${jsonLd}</script></head><body></body></html>`;

    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://www.linkedin.com/jobs/view/123' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.importStatus).toBe('success');
    expect(jobData.title).toMatch(/Software Engineer/i);
    expect(jobData.company).toMatch(/Acme Corp/i);
  });

  it('handles Handshake login-required pages by marking import failed', async () => {
    const html = '<html><head><title>Sign In | Handshake</title></head><body>login</body></html>';
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://joinhandshake.com/jobs/1' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.importStatus).toBe('failed');
    // Accept either the Handshake-specific message or the generic fallback used by the controller
    expect(jobData.importNotes).toMatch(/require login|cannot be automatically imported|Could not extract job details/i);
  });

  it('parses Lever job pages (og:title + data script) and returns success', async () => {
    const leverJson = JSON.stringify({ title: 'Senior Engineer', company: { name: 'LeverCorp' }, descriptionPlain: 'We build stuff', categories: { location: 'Remote' } });
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Senior Engineer - LeverCorp - Lever" />
          <script id="data">${leverJson}</script>
        </head>
        <body><div id="jobdesc">Job desc here</div></body>
      </html>`;

    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://jobs.lever.co/levercorp/123' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.importStatus).toBe('success');
    expect(jobData.title).toMatch(/Senior Engineer/);
    expect(jobData.company).toMatch(/LeverCorp/);
    expect(jobData.location).toMatch(/Remote/);
  });

  it('parses Workday pages and extracts title/description via og tags', async () => {
    const jsonLd = JSON.stringify({ '@type':'JobPosting', title:'Platform Engineer', hiringOrganization:{ name: 'WorkdayCorp' }, description:'Work on infra' });
    const html = `
      <html>
        <head>
          <script type="application/ld+json">${jsonLd}</script>
          <meta property="og:title" content="Platform Engineer at WorkdayCorp | Workday" />
          <meta property="og:description" content="Work on infra" />
        </head>
        <body></body>
      </html>`;

    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://careers.workday.com/job/456' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.importStatus).toBe('success');
    expect(jobData.title).toMatch(/Platform Engineer/);
    expect(jobData.description).toMatch(/Work on infra/);
  });

  it('parses Greenhouse JSON-LD and appends requirements/benefits into description', async () => {
    const jsonLd = JSON.stringify({ '@type':'JobPosting', title:'GH Dev', hiringOrganization:{ name: 'GHCo' }, jobLocation:{ address:{ addressLocality: 'Boston' } }, description: '<h2>Requirements</h2><ul><li>Req A</li><li>Req B</li></ul><h2>Benefits</h2><ul><li>Ben A</li></ul>'});
    const html = `<html><head><script type="application/ld+json">${jsonLd}</script></head><body></body></html>`;

    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://boards.greenhouse.io/company/jobs/1' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.importStatus).toBe('success');
    expect(jobData.company).toMatch(/GHCo/);
    expect(jobData.requirements).toBeDefined();
    expect(jobData.benefits).toBeDefined();
    // merged description should contain 'Requirements:' and 'Benefits:' sections
    expect(jobData.description).toMatch(/Requirements:|Benefits:/);
  });

  it('extracts salary from generic page text and detects job type/work mode', async () => {
    const html = `<html><body><h1>Staff Engineer</h1><div><strong>Company:</strong> BigCo</div><div>$120,000 - $150,000 USD</div><div>Full-time, remote</div></body></html>`;
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://example.com/job/staff-engineer' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.importStatus).toBe('success');
    expect(jobData.salary).toBeDefined();
    expect(jobData.salary.min).toBeGreaterThanOrEqual(120000);
    expect(jobData.jobType).toMatch(/Full-time/);
    expect(jobData.workMode).toMatch(/Remote/);
  });

  it('parses LinkedIn JSON-LD when provided as an array and extracts JobPosting', async () => {
    const arr = JSON.stringify([ { '@type': 'BreadcrumbList' }, { '@type': 'JobPosting', title: 'Array Engineer', hiringOrganization: { name: 'ArrayCo' }, jobLocation: { address: { addressLocality: 'Austin' } }, description: 'Array desc' } ]);
    const html = `<html><head><script type="application/ld+json">${arr}</script></head><body></body></html>`;

    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://www.linkedin.com/jobs/view/999' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.importStatus).toBe('success');
    expect(jobData.title).toMatch(/Array Engineer/);
    expect(jobData.company).toMatch(/ArrayCo/);
  });

  it('parses LinkedIn via og:title alternate pattern', async () => {
    const titleText = 'Acme Corp hiring Junior Dev in Remote, USA | LinkedIn';
    const html = `<html><head><meta property="og:title" content="${titleText}" /></head><body></body></html>`;
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://www.linkedin.com/jobs/view/888' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.importStatus).toBe('success');
    expect(jobData.company).toMatch(/Acme Corp/);
    expect(jobData.title).toMatch(/Junior Dev/);
  });

  it('parses Indeed with various selector fallbacks', async () => {
    const html = `<html><head><meta property="og:title" content="Indeed Title" /><meta property="og:description" content="Indeed Desc" /></head><body><h1 class="jobsearch-JobInfoHeader-title">Indeed H1</h1><span class="companyName">IndeedCo</span><div id="jobDescriptionText">Long description about job that is more than 100 chars. ${'x'.repeat(150)}</div></body></html>`;
    await jest.unstable_mockModule('node-fetch', () => ({ default: async () => makeFetchResponse(200, html) }));
    const { scrapeJobFromURL } = await import('../jobScraperController.js');

    const req = { body: { url: 'https://www.indeed.com/viewjob?jk=indeed123' } };
    const sent = {};
    const res = { status: (code) => { sent.status = code; return { json: (body) => { sent.body = body; return body; } }; } };

    await scrapeJobFromURL(req, res);

    expect(sent.status).toBe(200);
    const jobData = sent.body.data.jobData;
    expect(jobData.importStatus).toBe('success');
    expect(jobData.title).toMatch(/Indeed H1|Indeed Title/);
    expect(jobData.company).toMatch(/IndeedCo/);
    expect(jobData.description && jobData.description.length).toBeGreaterThan(10);
  });

});


