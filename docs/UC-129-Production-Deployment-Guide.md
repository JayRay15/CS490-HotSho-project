# UC-129: Production Environment Setup (Free-Tier Cloud)

This guide documents a step-by-step process to deploy the ATS-for-Candidates project to free-tier cloud providers, using Vercel (frontend) and Render / Railway / Fly.io (backend), and Supabase or Neon for PostgreSQL. It assumes the repository root contains `frontend/` and `backend/` directories as in this workspace.

## Summary
- Objective: Deploy frontend and backend on free-tier hosting, secure environment variables, provision Postgres, enable HTTPS, configure CORS, and document the process for future updates.
- Outcome: Public URL for frontend and deployed backend API connected to a production Postgres instance.

## Assumptions & Repo-specific notes
- Frontend lives in `frontend/` and builds with `npm run build` (Vite / React typical).
- Backend lives in `backend/` and exposes an HTTP API; there are existing seed scripts such as `seed-interview-outcomes.js` in the `backend/` folder.
- The repo uses GitHub and will integrate with Vercel / Render using repository access.

If your project layout or scripts differ, adapt commands and paths below.

## Prerequisites
- GitHub account and repository access.
- Vercel account (for frontend) and CLI (optional).
- Render, Railway, or Fly.io account (choose one) for backend.
- Supabase or Neon account for Postgres.
- Node.js (LTS) and npm installed locally.
- Optional CLIs: `vercel`, `supabase`, `flyctl`, `psql`.

PowerShell sample installs (Windows):

```powershell
# Install Vercel CLI (optional)
npm i -g vercel

# Install Supabase CLI (optional)
npm i -g supabase

# Install Flyctl (if using Fly) - see Fly docs for the recommended install command for Windows
```

## Environment variables (recommended names)
Set these in the hosting provider secret/env var UI (do NOT commit to git):

- `DATABASE_URL` — full Postgres connection string (e.g., `postgres://user:pass@host:5432/dbname`).
- `NODE_ENV` — `production`.
- `PORT` — optional, usually provided by host.
- `API_BASE_URL` or `VITE_API_URL` — frontend uses this to call the backend (prefix `VITE_` for Vite env vars).
- `JWT_SECRET` — secret for auth tokens.
- `SUPABASE_URL` and `SUPABASE_KEY` — if using Supabase features.
- `CORS_ORIGIN` — allowed origin(s) for the frontend (e.g., `https://ats-candidates.vercel.app`).

Create `.env.example` locally with the keys (no secrets):

```env
# .env.example
DATABASE_URL=
NODE_ENV=production
VITE_API_URL=
JWT_SECRET=
SUPABASE_URL=
SUPABASE_KEY=
CORS_ORIGIN=
```

## Step 1 — Prepare repository for production

1. Ensure frontend has a build script in `frontend/package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

2. Ensure backend has start/build scripts in `backend/package.json`. Example:

```json
"scripts": {
  "dev": "nodemon src/index.js",
  "build": "tsc || echo 'no build step'",
  "start": "node src/index.js",
  "start:prod": "node dist/index.js"
}
```

3. Add a `backend/.env.example` mirroring the root `.env.example` with backend-specific variables.

4. Add any necessary production config (e.g., `vercel.json`) if you want to customize Vercel behavior.

## Step 2 — Deploy Frontend to Vercel (recommended)

1. Push changes to GitHub.
2. In Vercel dashboard, click "New Project" → import your GitHub repo.
3. Set the Project Root to `frontend` (if the frontend is inside that folder).
4. Build & Output settings:
   - Framework Preset: `Vite` (or `Other`)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variables in Vercel project settings:
   - `VITE_API_URL` = `https://<your-backend-domain-or-host>/api` (or Render service URL)
6. Deploy.

PowerShell: link local project with Vercel (optional):

```powershell
cd frontend
vercel login
vercel --prod
```

Notes:
- Vercel provides automatic HTTPS and domain management (choose a subdomain or add custom domain).
- If you need a custom subdomain like `ats-candidates.vercel.app`, set it in Vercel project settings.

## Step 3 — Deploy Backend (Render / Railway / Fly)

Choose one provider. Below are concise instructions for Render and Railway.

### Option A — Render (easy, free tier available)

1. Create a new Web Service in Render and connect your GitHub repo.
2. Set the Root Directory to `backend`.
3. Build Command: `npm install && npm run build` (adjust as needed).
4. Start Command: `npm run start` or `npm run start:prod`.
5. Set Environment Variables in Render settings: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, etc.
6. Deploy and wait for the service URL (e.g., `https://your-backend.onrender.com`).

### Option B — Railway

1. Create a new project on Railway and deploy from GitHub or by connecting a repository.
2. Set the root to `backend` and configure build/start commands.
3. Add environment variables in Railway's Environment tab.

### Option C — Fly.io

1. Initialize with `flyctl launch` inside `backend/` and follow prompts.
2. Configure env vars with `flyctl secrets set DATABASE_URL=... JWT_SECRET=...`.

Notes for all providers:
- Ensure the backend listens on the assigned port (e.g., read from `process.env.PORT`).
- Use `CORS_ORIGIN` to restrict origins.

## Step 4 — PostgreSQL on Supabase or Neon

### Supabase (recommended for ease)

1. Create a new project in Supabase (free tier). Note the `postgres` connection string and API keys.
2. Retrieve the `DATABASE_URL` (connection string) from Supabase project settings and set it as `DATABASE_URL` in the backend service's env vars.
3. Run migrations/seeds:

PowerShell (example using node seed scripts already in repo):

```powershell
cd backend
# If your repo has explicit migration commands:
npm run migrate

# Seed the DB (the repo includes seed scripts)
node seed-interview-outcomes.js
node seed-other-scripts.js
```

If the project uses SQL migration files, use `psql` or Supabase SQL editor to run them.

### Neon

1. Create a project in Neon and get the connection string.
2. Set `DATABASE_URL` in the backend service to the Neon connection string.
3. Run migrations/seeds as above.

### Backups
- Supabase provides automated backups on higher tiers; on free-tier, export SQL dumps periodically using the SQL editor or the `pg_dump` command.

## Step 5 — CORS and Security Configuration

In the backend Express app, enable CORS for the frontend production origin only. Example:

```js
const cors = require('cors');
app.use(cors({ origin: process.env.CORS_ORIGIN }));
```

Other security measures:
- Ensure HTTP security headers (helmet) are enabled.
- Sanitize inputs and use parameterized queries/ORM.
- Use HTTPS (handled by Vercel/Render by default).

## Step 6 — Domain & DNS

1. Custom domain: Add domain in Vercel (frontend) and configure DNS provider to point to Vercel.
   - For Vercel: add CNAME for `www` or an `ALIAS`/A records set as Vercel instructs.
2. Backend domain: Render provides a hostname. For custom backend subdomain, set CNAME to the provided URL or configure a proxy.
3. Wait for DNS propagation and verify HTTPS certificate (auto-managed by providers).

DNS quick checklist:
- Add CNAME for `www` to Vercel alias.
- Add A/ALIAS records as required by the host.
- Add TXT records for domain verification if requested.

## Step 7 — CI/CD (GitHub Actions) sample

Create `.github/workflows/ci-cd.yml` with a workflow that runs tests and deploys.

Example (partial) workflow for tests + Vercel deploy (use provider-specific actions or API tokens):

```yaml
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install & Test Backend
        run: |
          cd backend
          npm ci
          npm test
      - name: Install & Test Frontend
        run: |
          cd frontend
          npm ci
          npm test

  deploy:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Frontend to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Trigger Render Deploy (optional)
        run: |
          curl -X POST -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            https://api.render.com/deploy/srv-<SERVICE-ID>
```

Notes:
- Store `VERCEL_TOKEN`, `RENDER_API_KEY`, and other secrets in GitHub Secrets.
- Configure the deploy job to run only on `main` merges.

## Step 8 — Smoke tests & Verification

After deployment, verify:
- Frontend loads at public URL and can talk to backend.
- Backend health endpoint (e.g., `GET /health`) returns 200.
- DB connectivity works: create a test user and verify persistence.

Quick smoke PowerShell commands:

```powershell
# Frontend
Invoke-WebRequest -UseBasicParsing https://<your-frontend-url>

# Backend health check
Invoke-WebRequest -UseBasicParsing https://<your-backend-url>/health

# API call
Invoke-RestMethod -Method GET -Uri https://<your-backend-url>/api/jobs | ConvertTo-Json
```

## Step 9 — Rollback & Disaster Recovery

- Keep production branch protected; use pull requests for merges.
- For quick rollback, revert the merge commit and redeploy, or use provider UI to rollback to previous deployment.
- Export DB dumps regularly (weekly) using `pg_dump` or Supabase export.

Example `pg_dump` (local machine with access):

```powershell
pg_dump "${env:DATABASE_URL}" -Fc -f backup-$(Get-Date -Format yyyyMMdd).dump
```

## Step 10 — Checklist & Handover

- [ ] Frontend deployed and accessible (HTTPS)
- [ ] Backend deployed and accessible (HTTPS)
- [ ] `DATABASE_URL` set and migrations run
- [ ] Environment variables documented and stored in secrets
- [ ] CORS configured for production origin
- [ ] Custom domain configured and SSL validated
- [ ] CI/CD workflow configured for tests + deploy
- [ ] Backups scheduled (or manual export documented)
- [ ] Runbook created for rollback & incident response

## Appendix — Example `.env.example` (backend)

```env
# backend/.env.example
DATABASE_URL=postgres://user:pass@host:5432/dbname
NODE_ENV=production
PORT=3000
JWT_SECRET=changeme
CORS_ORIGIN=https://ats-candidates.vercel.app
```

## Appendix — Helpful links
- Vercel docs: https://vercel.com/docs
- Render docs: https://render.com/docs
- Railway docs: https://docs.railway.app
- Supabase docs: https://supabase.com/docs
- Fly.io docs: https://fly.io/docs/

---

If you'd like, I can:
- create the `.env.example` files in the repo,
- add a sample GitHub Actions workflow file under `.github/workflows/`,
- or generate a `vercel.json` to customize front-end routing.

Tell me which of those you'd like next.
