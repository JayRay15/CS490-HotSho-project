# 🧩 ATS for Candidates — Tech Stack

# 🧩 ATS for Candidates — MERN Tech Stack (with Auth0)

*Current Implementation - Sprint 1 (Fall 2025)*

## 🖥️ **Frontend (React Layer)**

---

| Category                   | Technology                                       | Purpose                                                                |

## 🖥️ **Frontend Stack**| -------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |

| **Framework**              | **React.js (TypeScript)**                        | Core SPA framework for user interface and routing.                     |

| Category | Technology | Version | Purpose || **UI Library**             | **Material UI (MUI)** / **Chakra UI**            | Responsive, accessible, modern UI components.                          |

|----------|-----------|---------|----------|| **Styling**                | **Tailwind CSS**                                 | Utility-first styling for dashboard and analytics views.               |

| **Framework** | **React** | 19.1.1 | Modern UI library with concurrent features and automatic batching || **Routing**                | **React Router v7**                              | Client-side navigation between pages (Dashboard, Profile, Jobs, etc.). |

| **Build Tool** | **Vite** | 7.1.7 | Lightning-fast dev server and optimized production builds || **State Management**       | **Redux Toolkit** / **React Query (TanStack)**   | Manage global state and async server cache (user, jobs, analytics).    |

| **Routing** | **React Router** | 7.9.4 | Client-side navigation with protected routes || **Forms & Validation**     | **React Hook Form + Zod**                        | Type-safe form handling for profile and application forms.             |

| **Styling** | **Tailwind CSS** | 4.1.16 | Utility-first CSS framework with custom design system || **Auth Integration**       | **Auth0 React SDK (`@auth0/auth0-react`)**       | Secure user login, signup, and profile retrieval.                      |

| **Authentication UI** | **Clerk React** | 5.53.3 | Pre-built auth components and OAuth integration || **Charts & Visualization** | **Recharts** / **Chart.js**                      | Display analytics (e.g., application success rate, activity trends).   |

| **HTTP Client** | **Axios** | 1.12.2 | Promise-based API requests with interceptors || **Notifications**          | **React Toastify** / **SweetAlert2**             | In-app alerts and success/error notifications.                         |

| **Icons** | **Lucide React** | 0.548.0 | Modern, consistent icon library || **Testing (Frontend)**     | **Jest + React Testing Library + Cypress (E2E)** | Unit and end-to-end testing for UI flows.                              |

| **Fonts** | **Inter** (@fontsource) | 5.2.8 | Professional typography |

| **Drag & Drop** | **@dnd-kit** | 6.3.1+ | Accessible drag-and-drop for skill reordering |---

| **PDF Generation** | **jsPDF + html2canvas** | 3.0.3 / 1.4.1 | Export profiles to PDF |

| **Utilities** | **classnames** | 2.5.1 | Conditional CSS class management |## ⚙️ **Backend (Node/Express Layer)**



### **Development & Testing**| Category                | Technology                                               | Purpose                                                           |

| Tool | Version | Purpose || ----------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |

|------|---------|---------|| **Runtime**             | **Node.js (v20+)**                                       | JavaScript runtime for backend API.                               |

| **Testing Framework** | **Vitest** | 2.1.4 | Vite-native unit testing || **Framework**           | **Express.js**                                           | REST API layer for user, job, and analytics endpoints.            |

| **Component Testing** | **React Testing Library** | 16.2.0 | User-centric component tests || **Authentication**      | **Auth0 + express-jwt + jwks-rsa**                       | Secure JWT-based authentication via Auth0.                        |

| **DOM Environment** | **jsdom** | 25.0.1 | Browser environment simulation || **Database ORM**        | **Mongoose**                                             | ODM for MongoDB (users, jobs, resumes, analytics).                |

| **Test Matchers** | **@testing-library/jest-dom** | 6.6.3 | Custom DOM matchers || **Security Middleware** | **Helmet**, **cors**, **express-rate-limit**, **dotenv** | Prevent XSS, CORS, and API abuse.                                 |

| **User Simulation** | **@testing-library/user-event** | 14.6.1 | Realistic user interactions || **Validation**          | **Joi** / **Zod**                                        | Input validation for API requests.                                |

| **Linting** | **ESLint** | 9.36.0 | Code quality and consistency || **File Uploads**        | **Multer + AWS S3 SDK**                                  | Resume and document upload handling.                              |

| **CSS Processing** | **PostCSS + Autoprefixer** | 8.5.6 / 10.4.21 | CSS transformation || **Email & Alerts**      | **Nodemailer + SendGrid API**                            | Send notifications, password reset links, etc.                    |

| **AI Integration**      | **OpenAI GPT-4 / GPT-4o-mini API**                       | Resume tailoring, cover letter generation, job insight summaries. |

---| **Testing (Backend)**   | **Jest + Supertest**                                     | API endpoint and integration testing.                             |



## ⚙️ **Backend Stack**---



| Category | Technology | Version | Purpose |## 🗄️ **Database Layer**

|----------|-----------|---------|---------|

| **Runtime** | **Node.js** | v20+ | JavaScript server runtime || Component                   | Technology                                   | Purpose                                              |

| **Framework** | **Express** | 5.1.0 | Minimalist web framework || --------------------------- | -------------------------------------------- | ---------------------------------------------------- |

| **Database ODM** | **Mongoose** | 8.19.2 | MongoDB object modeling with validation || **Primary Database**        | **MongoDB Atlas (Cloud)**                    | Stores users, applications, analytics, resumes, etc. |

| **Authentication** | **Clerk Express** | 1.7.42 | JWT verification middleware || **ODM**                     | **Mongoose**                                 | Schema modeling and data validation.                 |

| **Password Hashing** | **bcrypt** | 6.0.0 | Secure password hashing || **Search Layer (Optional)** | **MongoDB Atlas Search** / **Elasticsearch** | Enables advanced job filtering and full-text search. |

| **JWT Tokens** | **jsonwebtoken** | 9.0.2 | Token generation and verification || **Cache Layer (Optional)**  | **Redis**                                    | Caching frequent queries, tokens, and AI results.    |

| **Email Service** | **Nodemailer** | 7.0.10 | SMTP email sending |

| **File Uploads** | **Multer** | 2.0.2 | Multipart form data handling |---

| **Unique IDs** | **uuid** | 13.0.0 | UUID generation |

| **CORS** | **cors** | 2.8.5 | Cross-origin resource sharing |## ☁️ **DevOps & Infrastructure**

| **Environment** | **dotenv** | 17.2.3 | Environment variable management |

| Component                | Technology                                             | Purpose                                                 |

### **Testing & Development**| ------------------------ | ------------------------------------------------------ | ------------------------------------------------------- |

| Tool | Version | Purpose || **Containerization**     | **Docker**                                             | Package app and dependencies for consistent deployment. |

|------|---------|---------|| **CI/CD**                | **GitHub Actions**                                     | Automated testing, builds, and deployments.             |

| **Testing Framework** | **Jest** | 29.7.0 | Unit and integration testing || **Hosting (Frontend)**   | **Vercel** / **Netlify**                               | Deploy the React app.                                   |

| **API Testing** | **Supertest** | 6.3.3 | HTTP endpoint testing || **Hosting (Backend)**    | **Render** / **Railway** / **AWS EC2**                 | Host the Express API.                                   |

| **Cross-platform** | **cross-env** | 7.0.3 | Cross-platform environment variables || **Database Hosting**     | **MongoDB Atlas**                                      | Managed NoSQL database.                                 |

| **ES Modules** | **@jest/globals** | 29.7.0 | Jest with ES module support || **File Storage**         | **AWS S3** / **Cloudinary**                            | Resume, portfolio, and image uploads.                   |

| **Monitoring & Logging** | **Sentry**, **LogRocket**, **Prometheus**, **Grafana** | Error tracking and performance analytics.               |

**Current Test Coverage:**| **SSL & Security**       | **Let’s Encrypt / Cloudflare**                         | HTTPS and DDoS protection.                              |

- ✅ 90.56% Statement Coverage

- ✅ 80.38% Branch Coverage  ---

- ✅ 92.22% Function Coverage

- ✅ 92.17% Line Coverage## 🤖 **AI & Integration Layer**

- ✅ 276 Tests Passing

| Feature                   | API / Tool                             | Description                                                     |

---| ------------------------- | -------------------------------------- | --------------------------------------------------------------- |

| **AI Resume Builder**     | **OpenAI GPT-4 / GPT-4o-mini**         | Tailors resumes and cover letters to specific job descriptions. |

## 🗄️ **Database**| **Company Research**      | **Clearbit / Crunchbase API**          | Fetch company data, culture insights, and metrics.              |

| **Job Board Integration** | **LinkedIn / Indeed APIs**             | Retrieve and categorize open job postings.                      |

| Component | Technology | Purpose || **Calendar & Email Sync** | **Google Calendar, Outlook, SendGrid** | Schedule interviews, send reminders, and follow-ups.            |

|-----------|-----------|---------|

| **Database** | **MongoDB Atlas** | Cloud-hosted NoSQL database |---

| **ODM** | **Mongoose 8.19.2** | Schema modeling, validation, type casting |

| **Schema Features** | Subdocuments | Employment, skills, education, projects, certifications |## 🔒 **Authentication & Authorization**

| **Validation** | Built-in Validators | Email format, URL format, date validation, field length |

| **Indexing** | Compound Indexes | Optimized queries for auth0Id and email || Component               | Technology                                 | Purpose                                             |

| ----------------------- | ------------------------------------------ | --------------------------------------------------- |

### **User Schema Structure**| **Identity Provider**   | **Auth0**                                  | Manages signups, logins, and password security.     |

```javascript| **Access Tokens**       | **JWT (RS256)**                            | Used to authorize API requests.                     |

User {| **Verification**        | **express-jwt + jwks-rsa**                 | Verifies tokens using Auth0’s JWKS endpoint.        |

  auth0Id: String (indexed, required, unique)| **User Persistence**    | **MongoDB (User Model)**                   | Stores Auth0 user IDs, emails, and profile info.    |

  email: String (indexed, required, unique, lowercase)| **Roles & Permissions** | **Auth0 Role-Based Access Control (RBAC)** | Limits access to recruiter vs candidate dashboards. |

  password: String (hashed with bcrypt)

  firstName, lastName: String---

  profilePicture, headline, bio, phone: String

  industry, experienceLevel: String (enum)## 🧪 **Testing & Quality Assurance**

  location: { city, state, country }

  | Layer                    | Tools                        |

  // Subdocuments (arrays of objects)| ------------------------ | ---------------------------- |

  employment: [{ jobTitle, company, location, startDate, endDate, ... }]| **Frontend Unit Tests**  | Jest + React Testing Library |

  skills: [{ name, level, category, yearsOfExperience }]| **E2E Tests**            | Cypress                      |

  education: [{ institution, degree, fieldOfStudy, ... }]| **Backend Unit Tests**   | Jest                         |

  projects: [{ name, description, technologies, url, ... }]| **API Tests**            | Supertest + Postman          |

  certifications: [{ name, organization, dateEarned, ... }]| **Linting & Formatting** | ESLint + Prettier            |

  | **Code Review**          | GitHub PR Workflows          |

  socialLinks: { linkedin, github, portfolio, website }

  accountDeletionDate: Date---

  createdAt, updatedAt: Date (automatic)

}## 🚀 **Deployment Workflow**

```

| Stage                     | Tool                   | Description                                |

---| ------------------------- | ---------------------- | ------------------------------------------ |

| **1. Build & Test**       | GitHub Actions         | Runs ESLint, Jest, and Cypress.            |

## 🔒 **Authentication & Authorization**| **2. Containerize**       | Docker                 | Packages app into production-ready images. |

| **3. Deploy Backend**     | Render / Railway / AWS | Deploys Express + MongoDB connection.      |

| Component | Technology | Implementation || **4. Deploy Frontend**    | Vercel / Netlify       | Deploys static React build.                |

|-----------|-----------|----------------|| **5. Monitor & Optimize** | Sentry + LogRocket     | Monitors runtime errors and performance.   |

| **Identity Provider** | **Clerk** | OAuth 2.0 + OpenID Connect |

| **OAuth Providers** | Google | Social login integration |---

| **Token Type** | JWT (RS256) | Public/private key verification |

| **Session Management** | JWT Cookies | Secure, httpOnly cookies |## 🧭 **Example Stack Summary (Short Version)**

| **Middleware** | `checkJwt.js` | Express middleware for route protection |

| **Password Storage** | bcrypt (10 rounds) | Secure password hashing || Layer              | Technologies                                                |

| **Token Verification** | Clerk SDK | Validates JWT signatures and claims || ------------------ | ----------------------------------------------------------- |

| **Frontend**       | React + TypeScript + MUI + Tailwind + Redux Toolkit + Auth0 |

### **Protected Routes**| **Backend**        | Node.js + Express + Mongoose + Auth0 JWT Middleware         |

- All `/api/users/*` endpoints require authentication| **Database**       | MongoDB Atlas                                               |

- All `/api/profile/*` endpoints require authentication| **Authentication** | Auth0 (OAuth 2.0 / JWT RS256)                               |

- `auth0Id` from token used for user identification| **AI Features**    | OpenAI GPT-4 / GPT-4o-mini                                  |

- Automatic redirect to login for unauthorized access| **DevOps**         | Docker + GitHub Actions + Render + Vercel                   |

| **Testing**        | Jest + Cypress + Supertest                                  |

---| **Cloud Services** | AWS S3 + SendGrid + Cloudflare                              |


## 🧪 **Testing & Quality Assurance**

### **Backend Testing** (Jest)
```bash
# 14 Test Suites, 276 Tests Passing
Controllers: 90.85% coverage (auth, user, profile)
Routes: 100% coverage (all API endpoints)
Middleware: 96.07% coverage (JWT verification, error handling)
Models: 66.12% coverage (Mongoose schemas)
Utils: 95.09% coverage (db, email, response formatting)
```

**Test Types:**
- ✅ Unit Tests (individual functions)
- ✅ Integration Tests (API endpoints)
- ✅ Validation Tests (input validation)
- ✅ Authentication Tests (JWT verification)
- ✅ Error Handling Tests (edge cases)

### **Frontend Testing** (Vitest)
- Component rendering tests
- User interaction tests
- API integration tests
- Route navigation tests

### **Test Commands**
```bash
# Backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report

# Frontend  
npm test              # Run all tests
npm run test:run      # Run once (CI mode)
```

---

## 📡 **API Architecture**

### **RESTful Endpoints**

**Authentication:**
- `POST /api/auth/register` - User registration (201 Created)
- `POST /api/auth/login` - User login (200 OK)
- `POST /api/auth/logout` - User logout (200 OK)
- `POST /api/auth/forgot-password` - Password reset request (200 OK)

**User Management:**
- `GET /api/users/me` - Get current user (200 OK)
- `PUT /api/users/me` - Update user profile (200 OK)
- `POST /api/users/profile-picture` - Upload picture (201 Created)
- `DELETE /api/users/profile-picture` - Remove picture (200 OK)
- `DELETE /api/users/delete` - Delete account (200 OK)

**Employment:**
- `POST /api/users/employment` - Add entry (201 Created)
- `PUT /api/users/employment/:id` - Update entry (200 OK)
- `DELETE /api/users/employment/:id` - Delete entry (200 OK)

**Profile Sections:**
- Skills: `POST, PUT, DELETE` (201/200)
- Education: `POST, PUT, DELETE` (201/200)
- Projects: `POST, PUT, DELETE` (201/200)
- Certifications: `POST, PUT, DELETE` (201/200)

### **Response Format**
```json
// Success (200 OK / 201 Created)
{
  "success": true,
  "message": "Operation successful",
  "data": { },
  "timestamp": "2025-10-30T..."
}

// Error (400/401/404/500)
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "errors": [{ "field": "...", "message": "..." }],
  "timestamp": "2025-10-30T..."
}
```

### **HTTP Status Codes**
- `200 OK` - Successful request
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 🛠️ **Development Tools**

| Tool | Purpose |
|------|---------|
| **Git + GitHub** | Version control and collaboration |
| **VS Code** | Primary IDE |
| **Postman** | API testing and documentation |
| **MongoDB Compass** | Database GUI and query tool |
| **Chrome DevTools** | Frontend debugging |
| **ESLint** | Code quality enforcement |
| **Prettier** | Code formatting (via ESLint) |

---

## 🚀 **Deployment (Planned)**

| Component | Platform | Status |
|-----------|----------|--------|
| **Frontend** | Vercel / Netlify | Planned |
| **Backend** | Render / Railway | Planned |
| **Database** | MongoDB Atlas | ✅ Active |
| **CI/CD** | GitHub Actions | Planned |
| **Monitoring** | Sentry | Planned |

---

## 📦 **Package Management**

- **Frontend:** `npm` with `package.json` and `package-lock.json`
- **Backend:** `npm` with `package.json` and `package-lock.json`
- **Node Version:** v20+ (LTS)
- **Module System:** ES Modules (`"type": "module"`)

---

## 🔐 **Security Features**

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | bcrypt with 10 salt rounds |
| **JWT Verification** | Clerk SDK with public key validation |
| **CORS** | Configured for frontend origin |
| **Input Validation** | Mongoose schema validators |
| **XSS Prevention** | React's built-in escaping |
| **CSRF Protection** | SameSite cookies |
| **Rate Limiting** | Planned (express-rate-limit) |
| **Helmet** | Planned (security headers) |

---

## 📈 **Performance Optimizations**

- **Frontend:**
  - Vite's fast HMR (Hot Module Replacement)
  - Code splitting with React.lazy
  - Optimized production builds
  - CDN-hosted fonts

- **Backend:**
  - MongoDB connection pooling
  - Efficient Mongoose queries
  - Response compression (planned)
  - Caching headers (planned)

---

## 🔄 **Planned Enhancements**

**Short Term (Sprint 2):**
- [ ] Job application tracking
- [ ] Resume builder
- [ ] Interview preparation tools
- [ ] Application status dashboard

**Medium Term (Sprint 3+):**
- [ ] AI-powered resume optimization
- [ ] Company research integration
- [ ] Calendar sync (Google/Outlook)
- [ ] Email notification system
- [ ] Analytics dashboard

**Long Term:**
- [ ] Mobile app (React Native)
- [ ] LinkedIn integration
- [ ] Advanced search/filtering
- [ ] Recruiter portal
- [ ] API rate limiting
- [ ] Redis caching
- [ ] WebSocket for real-time updates

---

## 🧭 **Current Stack Summary**

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19 + Vite 7 + Tailwind 4 + Clerk + Axios |
| **Backend** | Node.js 20+ + Express 5 + Mongoose 8 + Clerk |
| **Database** | MongoDB Atlas + Mongoose ODM |
| **Authentication** | Clerk (OAuth 2.0 + JWT) + bcrypt |
| **Testing** | Jest 29 + Vitest 2 + Supertest 6 + RTL 16 |
| **Development** | ESLint 9 + Git + VS Code |

**Test Coverage:** 90.56% overall, 80.38% branches, 276 tests passing

---

*Last Updated: October 30, 2025*  
*Sprint 1 - Foundation Complete*
