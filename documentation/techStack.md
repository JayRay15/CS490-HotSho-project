
# 🧩 ATS for Candidates — Tech Stack

*Current as of Sprint 3 (Fall 2025)*

---

## 🖥️ Frontend

**Framework:** React 19.1.1
**Build Tool:** Vite 7.1.7
**Routing:** React Router 7.9.4
**Styling:** Tailwind CSS 4.1.16, PostCSS 8.5.6, Autoprefixer 10.4.21
**Authentication:** Clerk React 5.53.3 (primary), Auth0 React SDK 2.8.0 (legacy/experimental)
**HTTP Client:** Axios 1.12.2
**Icons:** Lucide React 0.548.0, Heroicons React 2.2.0
**Drag & Drop:** @dnd-kit (core 6.3.1, sortable 10.0.0, utilities 3.2.2), React DnD 16.0.1
**Rich Text Editor:** Tiptap 3.10.5 (react, starter-kit, placeholder extension)
**Charts & Visualization:** Recharts 3.3.0
**Popover Positioning:** @floating-ui/dom 1.7.4
**PDF Generation:** jsPDF 3.0.3, jsPDF-autotable 5.0.2, html2canvas 1.4.1
**CSV Parsing:** PapaParse 5.5.3
**Classnames:** classnames 2.5.1 (conditional CSS)
**Prop Types:** prop-types 15.8.1 (runtime type checking)
**Testing:** Vitest 4.0.7, @vitest/coverage-v8 4.0.8, React Testing Library 16.2.0, @testing-library/jest-dom 6.6.3, @testing-library/user-event 14.6.1, jsdom 25.0.1
**Linting:** ESLint 9.36.0, eslint-plugin-react-hooks 5.2.0, eslint-plugin-react-refresh 0.4.22
**Notifications:** react-hot-toast 2.6.0
**Typography:** Inter font (@fontsource/inter 5.2.8)


---

## ⚙️ Backend

**Runtime:** Node.js 20+
**Framework:** Express 5.1.0
**Database ODM:** Mongoose 8.19.2
**Authentication:** Clerk Express 1.7.42 (primary), express-oauth2-jwt-bearer 1.7.1, bcrypt 6.0.0, jsonwebtoken 9.0.2
**Email Service:** Nodemailer 7.0.10
**File Uploads:** Multer 2.0.2
**Unique IDs:** uuid 13.0.0
**CORS:** cors 2.8.5
**Environment:** dotenv 17.2.3
**Document Generation/Parsing:** docx 9.5.1, pdf-lib 1.17.1, pdf-parse 2.4.5, pdfjs-dist 4.6.82, pdfkit 0.15.2, puppeteer 23.7.0
**Spreadsheet Generation:** exceljs 4.4.0
**Calendar Integration:** ical-generator 10.0.0, googleapis 166.0.0
**Microsoft Graph:** @azure/identity 4.13.0, @microsoft/microsoft-graph-client 3.0.7
**Scheduling:** node-cron 4.2.1
**Validation:** validator 13.15.20, libphonenumber-js 1.12.25
**HTTP Requests:** node-fetch 3.3.2, axios 1.13.2
**Testing:** Jest 29.7.0, Supertest 6.3.3, @jest/globals 29.7.0, cross-env 7.0.3
**Development:** nodemon 3.1.11


---

## 🗄️ Database

- **Database:** MongoDB Atlas (cloud-hosted NoSQL)
- **ODM:** Mongoose 8.19.2

---

## 🔌 External Integrations

**AI Resume/Cover Letter:** Google Generative AI SDKs (@google/genai 1.28.0, @google/generative-ai 0.24.1)
**Job Import:** LinkedIn, Indeed, Glassdoor (URL parsing)
**Company Research:** (Planned) Clearbit, Crunchbase API
**Calendar/Email Sync:** Google Calendar (googleapis), Microsoft Outlook (Microsoft Graph API), ical-generator


---

## 🧪 Testing & Quality Assurance

- **Backend:** Jest 29.7.0, Supertest 6.3.3 (API/integration), 14+ test suites, >90% coverage
- **Frontend:** Vitest 4.0.7, React Testing Library 16.2.0, component and integration tests
- **Coverage:** over 2000 tests

---

## 🛠️ DevOps & Tooling

- **Version Control:** Git + GitHub
- **IDE:** VS Code
- **API Testing:** Postman
- **Database GUI:** MongoDB Compass
- **CI/CD:** (Planned) GitHub Actions
- **Hosting:** (Planned) Vercel/Netlify (frontend), Render/Railway (backend)
- **Monitoring:** (Planned) Sentry, LogRocket

---

## 🔐 Security Features

- **Password Hashing:** bcrypt
- **JWT Verification:** Clerk SDK
- **CORS:** Configured for frontend origin
- **Input Validation:** Mongoose schema validators
- **XSS Prevention:** React built-in escaping
- **CSRF Protection:** SameSite cookies

---

## 📈 Performance Optimizations

- **Frontend:** Vite HMR, code splitting, optimized builds
- **Backend:** MongoDB pooling, efficient queries

---

## 📊 Summary Table

| Layer           | Technologies                                                                 |
|-----------------|--------------------------------------------------------------------------------|
| Frontend        | React 19 + Vite 7 + Tailwind 4 + Clerk + Auth0 + Axios + Tiptap + Recharts + PapaParse |
| Backend         | Node.js 20+ + Express 5 + Mongoose 8 + Clerk + express-oauth2-jwt-bearer        |
|                 | + docx + pdf-lib + pdfkit + puppeteer + exceljs + node-cron + googleapis       |
| Database        | MongoDB Atlas + Mongoose ODM                                                     |
| Authentication  | Clerk (OAuth 2.0 + JWT, primary), Auth0 (legacy/experimental), bcrypt           |
| AI Integration  | Google Generative AI SDKs (@google/genai, @google/generative-ai)                |
| Testing         | Jest 29 + Vitest 4 + Supertest 6 + RTL 16 + @jest/globals + cross-env           |
| Development     | ESLint 9 + nodemon + Git + VS Code                                              |


---

**Test Coverage:** over 2100 unit tests

---

*Last Updated: November 29, 2025*  
*Sprint 3 - Interview Prep & Calendar Integration Complete*
