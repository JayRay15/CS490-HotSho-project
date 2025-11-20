
# 🧩 ATS for Candidates — Tech Stack

*Current as of Sprint 2 (Fall 2025)*

---


**Framework:** React 19.1.1
**Build Tool:** Vite 7.1.7
**Routing:** React Router 7.9.4
**Styling:** Tailwind CSS 4.1.16
**Authentication:** Clerk React 5.53.3 (primary), Auth0 React SDK (legacy/experimental)
**HTTP Client:** Axios 1.12.2
**Icons:** Lucide React
**Drag & Drop:** @dnd-kit, React DnD
**Rich Text Editor:** Tiptap (for resume/cover letter editing)
**Charts & Visualization:** Recharts
**Popover Positioning:** @floating-ui/dom
**PDF Generation:** jsPDF, jsPDF-autotable, html2canvas
**Classnames:** classnames (conditional CSS)
**Prop Types:** prop-types (runtime type checking)
**Testing:** Vitest 2.1.4, React Testing Library 16.2.0, @testing-library/jest-dom, @testing-library/user-event
**Linting:** ESLint 9.36.0
**Notifications:** Toast notifications (custom/Toastify)
**Typography:** Inter font (@fontsource/inter)


---


**Runtime:** Node.js 20+
**Framework:** Express 5.1.0
**Database ODM:** Mongoose 8.19.2
**Authentication:** Clerk Express 1.7.42 (primary), express-oauth2-jwt-bearer, bcrypt 6.0.0, jsonwebtoken 9.0.2
**Email Service:** Nodemailer 7.0.10
**File Uploads:** Multer 2.0.2
**Unique IDs:** uuid 13.0.0
**CORS:** cors 2.8.5
**Environment:** dotenv 17.2.3
**Document Generation/Parsing:** docx, pdf-lib, pdf-parse, pdfjs-dist, puppeteer
**Scheduling:** node-cron
**Validation:** validator, libphonenumber-js
**HTTP Requests:** node-fetch, axios
**Testing:** Jest 29.7.0, Supertest 6.3.3, @jest/globals, cross-env
**Linting:** ESLint 9.36.0


---

## 🗄️ Database

- **Database:** MongoDB Atlas (cloud-hosted NoSQL)
- **ODM:** Mongoose 8.19.2

---


**AI Resume/Cover Letter:** OpenAI GPT-4 / GPT-4o-mini (API integration), Google Generative AI SDKs (@google/genai, @google/generative-ai)
**Job Import:** LinkedIn, Indeed, Glassdoor (URL parsing)
**Company Research:** (Planned) Clearbit, Crunchbase API
**Calendar/Email Sync:** (Planned) Google Calendar, Outlook, SendGrid


---

## 🧪 Testing & Quality Assurance

- **Backend:** Jest, Supertest (API/integration), 14+ test suites, >90% coverage
- **Frontend:** Vitest, React Testing Library, component and integration tests
- **Coverage:** 90.56% statements, 80.38% branches, 276+ tests passing

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


| Layer           | Technologies                                                                 |
|-----------------|--------------------------------------------------------------------------------|
| Frontend        | React 19 + Vite 7 + Tailwind 4 + Clerk + Auth0 + Axios + Tiptap + Recharts      |
| Backend         | Node.js 20+ + Express 5 + Mongoose 8 + Clerk + express-oauth2-jwt-bearer        |
|                 | + docx + pdf-lib + pdf-parse + puppeteer + node-cron + validator + node-fetch   |
| Database        | MongoDB Atlas + Mongoose ODM                                                     |
| Authentication  | Clerk (OAuth 2.0 + JWT, primary), Auth0 (legacy/experimental), bcrypt           |
| AI Integration  | OpenAI GPT-4, Google Generative AI SDKs                                         |
| Testing         | Jest 29 + Vitest 2 + Supertest 6 + RTL 16 + @jest/globals + cross-env           |
| Development     | ESLint 9 + Git + VS Code                                                        |


---

**Test Coverage:** 90.56% overall, 80.38% branches, 276+ tests passing

---

*Last Updated: November 19, 2025*  
*Sprint 2 - Job Search & AI Resume Complete*
