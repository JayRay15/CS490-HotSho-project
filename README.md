# ATS for Candidates

> **CS 490 Capstone Project - Fall 2025**  
> Transforming how job seekers manage their career journey with a comprehensive applicant tracking and profile management platform.

[![Test Coverage](https://img.shields.io/badge/coverage-90.56%25-brightgreen)]()
[![Branch Coverage](https://img.shields.io/badge/branch--coverage-80.38%25-green)]()
[![Tests](https://img.shields.io/badge/tests-276%20passing-success)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Sprint 1 Accomplishments](#sprint-1-accomplishments)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Team](#team)

---

## 🎯 Overview

**ATS for Candidates** is a full-stack web application that empowers job seekers with tools traditionally only available to recruiters. While most Applicant Tracking Systems (ATS) focus on helping companies manage candidates, our platform flips the script - giving candidates the power to organize their job search, manage their professional profile, and present themselves effectively to potential employers.

### The Problem We Solve

Job seekers face numerous challenges:
- Scattered application tracking across multiple platforms
- Incomplete or outdated professional profiles
- Difficulty presenting work history, skills, and projects cohesively
- Lack of insights into application status and progress

### Our Solution

A centralized platform where candidates can:
- 📝 Build and maintain a comprehensive professional profile
- 💼 Track employment history with rich details and timeline views
- 🎯 Manage skills with proficiency levels and categorization
- 🎓 Document education and certifications
- 🚀 Showcase special projects in a portfolio format
- 📊 Monitor profile completeness and get improvement suggestions
- 🔐 Securely authenticate with OAuth (Google) or email/password

---

## ✨ Features

### 🔐 Authentication & Security
- **Email/Password Registration & Login** with comprehensive validation
- **OAuth Integration** with Google (Clerk authentication)
- **Password Reset** functionality with secure token-based flow
- **Protected Routes** with automatic redirect for unauthorized access
- **Account Deletion** with immediate permanent removal and confirmation email
- **Session Management** with secure JWT tokens

### 👤 Profile Management
- **Basic Profile Information**
  - Professional headline, bio, location
  - Industry and experience level selection
  - Profile picture upload with preview and validation
  
- **Employment History**
  - Add, edit, delete work experience entries
  - Timeline visualization of career progression
  - Current position tracking
  - Rich job descriptions (1000 char limit)
  - Date validation and formatting
  
- **Skills Management**
  - Add skills with proficiency levels (Beginner → Expert)
  - Organize by categories (Technical, Soft Skills, etc.)
  - Drag-and-drop reordering
  - Visual skill badges and indicators
  
- **Education & Certifications**
  - Multiple education entries with GPA tracking
  - Certification management with expiration dates
  - Ongoing education status
  - Honors and achievements
  
- **Special Projects Portfolio**
  - Project showcases with descriptions
  - Technologies and skills tagging
  - Project URLs and repository links
  - Grid/card portfolio view
  - Filtering and sorting capabilities

### 📊 Market Intelligence & Career Insights (UC-102)
- **Job Market Trends**
  - Monitor job postings in target industries and locations
  - Track demand scores and competition levels
  - Historical trend visualization with charts
  
- **Skill Demand Analysis**
  - Track skill demand evolution and growth rates
  - Identify emerging technologies
  - Analyze salary impact of specific skills
  - Get learning resource recommendations
  
- **Salary Trends**
  - View historical salary data for roles
  - Compare compensation across industries/locations
  - Analyze compensation breakdowns (base, bonus, stock, benefits)
  - Track year-over-year growth rates
  
- **Company Growth Monitoring**
  - Track hiring activity and open positions
  - Monitor revenue and employee growth
  - Identify companies with aggressive hiring
  - View company health scores
  
- **Industry Disruption Insights**
  - Understand disruption levels and emerging trends
  - Identify emerging opportunities
  - Get future outlook predictions
  
- **Personalized Recommendations**
  - AI-powered skill development suggestions
  - Career positioning strategies
  - Market opportunity identification
  - Timing optimization for career moves
  
- **Market Opportunities**
  - Track opportunities with optimal timing
  - View requirements and action plans
  - Assess estimated value and growth potential
  
- **Competitive Landscape Analysis**
  - Understand your market position
  - SWOT analysis for career planning
  - Benchmarking against market standards

### 🎨 Design & UX
- **Professional Brand Identity** with custom logo and consistent styling
- **Fully Responsive Design** (Mobile, Tablet, Desktop)
- **Accessible UI** with WCAG-compliant color contrast
- **Comprehensive Component Library** with consistent button states and form styling
- **Icon System** using Lucide React icons
- **Loading States** with branded spinners
- **Toast Notifications** for user feedback

### 🔧 Technical Excellence
- **RESTful API** with standardized JSON responses
- **Consistent Error Handling** with detailed validation messages
- **Data Persistence** with MongoDB Atlas
- **Comprehensive Testing** (90.56% code coverage, 80.38% branch coverage)
- **Type-Safe Validation** with server-side checks
- **Security Best Practices** (password hashing, input sanitization, CORS)

---

## 🛠 Tech Stack

### Frontend
- **React 19.1.1** - Modern UI library with latest features
- **Vite 7.1.7** - Lightning-fast build tool and dev server
- **React Router 7.9.4** - Client-side routing
- **Tailwind CSS 4.1.16** - Utility-first styling
- **Clerk React 5.53.3** - Authentication UI components
- **Axios 1.12.2** - HTTP client for API requests
- **Lucide React** - Modern icon library
- **@dnd-kit** - Drag-and-drop functionality for skill reordering
- **jsPDF + html2canvas** - PDF generation for profile export

### Backend
- **Node.js + Express 5.1.0** - Server framework
- **Mongoose 8.19.2** - MongoDB ODM
- **Clerk Express 1.7.42** - Authentication middleware
- **bcrypt 6.0.0** - Password hashing
- **jsonwebtoken 9.0.2** - JWT token generation
- **Nodemailer 7.0.10** - Email service
- **Multer 2.0.2** - File upload handling
- **uuid 13.0.0** - Unique ID generation

### Database
- **MongoDB Atlas** - Cloud-hosted NoSQL database
- **Mongoose** - Schema modeling and validation

### Testing
- **Jest 29.7.0** - Backend testing framework
- **Vitest 2.1.4** - Frontend testing (Vite-native)
- **Supertest 6.3.3** - API endpoint testing
- **React Testing Library 16.2.0** - Component testing
- **jsdom 25.0.1** - DOM testing environment

### DevOps & Tools
- **Git + GitHub** - Version control
- **ESLint 9.36.0** - Code linting
- **dotenv 17.2.3** - Environment variable management
- **cors 2.8.5** - Cross-origin resource sharing

See [techStack.md](./techStack.md) for detailed breakdown.

---

## 📁 Project Structure

```
CS490-HotSho-project/
├── frontend/                 # React application
│   ├── src/
│   │   ├── api/             # Axios configuration and API calls
│   │   ├── assets/          # Images, fonts, static files
│   │   ├── components/      # Reusable UI components
│   │   │   ├── auth/        # Authentication-related components
│   │   │   ├── profile/     # Profile management components
│   │   │   └── __tests__/   # Component tests
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components (routes)
│   │   │   ├── auth/        # Login, Register, Reset Password
│   │   │   └── profile/     # Profile pages
│   │   ├── utils/           # Helper functions
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── public/              # Static assets
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                  # Express API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── profileController.js
│   │   │   └── __tests__/   # Controller tests (90%+ coverage)
│   │   ├── middleware/      # Express middleware
│   │   │   ├── checkJwt.js  # JWT verification
│   │   │   ├── errorHandler.js
│   │   │   └── __tests__/
│   │   ├── models/          # Mongoose schemas
│   │   │   ├── User.js      # User model with subdocuments
│   │   │   └── __tests__/
│   │   ├── routes/          # API route definitions
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── profileRoutes.js
│   │   │   └── __tests__/   # Route tests (100% coverage)
│   │   ├── utils/           # Utility functions
│   │   │   ├── db.js        # Database connection
│   │   │   ├── email.js     # Email service
│   │   │   ├── responseFormat.js  # Consistent API responses
│   │   │   └── __tests__/
│   │   └── server.js        # Express app setup
│   ├── coverage/            # Test coverage reports
│   ├── package.json
│   └── jest.config.cjs
│
├── Sprint1PRD.md            # Product Requirements Document
├── Sprint1Demo.md           # Demo script and actions
├── techStack.md             # Detailed technology breakdown
└── README.md                # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+ and npm
- **MongoDB Atlas** account (or local MongoDB)
- **Clerk** account for authentication
- **Git** for version control

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend `.env`:**
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ats-candidates

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Email Service (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@ats-candidates.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d
```

**Frontend `.env`:**
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JayRay15/CS490-HotSho-project.git
   cd CS490-HotSho-project
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables** (see above)

5. **Start the development servers**

   **Backend (Terminal 1):**
   ```bash
   cd backend
   npm start
   # Server runs on http://localhost:3000
   ```

   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   # App runs on http://localhost:5173
   ```

6. **Open your browser** and navigate to `http://localhost:5173`

---

## 🧪 Testing

We maintain high test coverage standards to ensure code quality and prevent regressions.

### Current Test Coverage

| Metric | Coverage | Status |
|--------|----------|--------|
| **Statements** | 90.56% | ✅ Excellent |
| **Branches** | 80.38% | ✅ Good |
| **Functions** | 92.22% | ✅ Excellent |
| **Lines** | 92.17% | ✅ Excellent |
| **Tests** | 276 passing | ✅ Comprehensive |

### Running Tests

**Backend Tests:**
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# View HTML coverage report
# Open backend/coverage/lcov-report/index.html in browser
```

**Frontend Tests:**
```bash
cd frontend

# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run
```

### Test Structure

- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints with mocked dependencies
- **Component Tests**: React component behavior and rendering
- **Route Tests**: Express route configurations (100% coverage)

### Testing Best Practices

- All new features require tests
- Minimum 80% branch coverage for new code
- Mock external dependencies (Clerk, MongoDB, Nodemailer)
- Use descriptive test names: `should [action] when [condition]`
- Test both success and error paths

---

## 🏆 Sprint 1 Accomplishments

### Core Features Delivered

✅ **Authentication System** (9 use cases)
- Email/password registration and login
- Google OAuth integration via Clerk
- Password reset flow with email
- Secure logout with session cleanup
- Protected route access control
- Account deletion with permanent removal

✅ **Database Architecture** (3 use cases)
- MongoDB schema design with Mongoose
- RESTful API endpoints with consistent responses
- Comprehensive error handling and validation
- Data persistence across sessions

✅ **Brand Identity** (8 use cases)
- Professional logo and favicon
- Cohesive color scheme (WCAG compliant)
- Typography system with clear hierarchy
- Responsive navigation menu
- Consistent button and form styling
- Full responsive design (mobile/tablet/desktop)
- Icon system with Lucide React
- Card-based layout system

✅ **Profile Management** (14 use cases)
- Basic profile information form
- Profile picture upload with validation
- Employment history (add/edit/delete)
- Skills management with categories
- Education entries with GPA tracking
- Certification management
- Special projects portfolio
- Profile completeness indicators

✅ **Quality Assurance** (1 use case)
- 276 unit and integration tests
- 90.56% statement coverage
- 80.38% branch coverage
- Automated test suite with Jest/Vitest

### Key Metrics

- **35 Use Cases** implemented and verified
- **276 Tests** passing (2 skipped)
- **90.56% Overall Coverage** (exceeds 90% target)
- **80.38% Branch Coverage** (exceeds 80% target)
- **100% Route Coverage** (all API routes tested)
- **14 Test Suites** (all passing)


## 🏆 Accomplishments

### Sprint 1 (Foundational Platform)

**✅ Authentication, Profile, and Brand Foundation**
- Complete authentication system (email/password, Google OAuth, password reset, account deletion)
- MongoDB/Mongoose schema and RESTful API
- Professional brand identity and responsive UI
- Full profile management (basic info, employment, skills, education, certifications, projects)
- 276+ unit/integration tests, >90% code coverage

### Sprint 2 (Job Search & AI Resume)

**✅ Major Features Delivered:**
- Job entry and tracking system (add/edit/delete jobs, pipeline management, drag-and-drop status, deadline tracking)
- Job details view, notes, and contact tracking
- Job search, filtering, and analytics dashboard
- Job import from URL (auto-populate from LinkedIn/Indeed/Glassdoor)
- Resume and cover letter version tracking per application
- Company research and news integration for jobs
- AI-powered resume and cover letter generation (tailored to job, skills, and company)
- Resume template management, section customization, export to PDF/Word/HTML
- Resume/cover letter versioning, preview, validation, and feedback
- Application pipeline automation, status monitoring, and analytics
- 90%+ test coverage for all new Sprint 2 features

### Sprint 3 (In Progress)

**✅ UC-081: Pre-Interview Preparation Checklist**
- Custom, role-specific interview prep checklist for each interview
- Company research, attire, logistics, and confidence-building tasks
- Post-interview follow-up reminders

**✅ UC-082: Interview Follow-Up Templates**
- Automated, personalized thank-you and follow-up email templates
- Status inquiry, feedback request, and networking follow-up templates
- Tracks follow-up completion and response rates

**Sprint 3 Ongoing:**
- Interview coaching, mock interviews, analytics dashboard, network management, multi-user collaboration, and more (see Sprint3PRD.md)

---

### Key Metrics

- **80+ Use Cases** implemented and verified (Sprints 1 & 2, plus Sprint 3 UC-81/82)
- **276+ Tests** passing (2 skipped)
- **90%+ Overall Coverage** (maintained)
- **100% Route Coverage** (all API routes tested)
- **20+ Test Suites** (all passing)

---

### API Endpoints Implemented (Sprints 1 & 2)

**Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request

**User Management:**
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update user profile
- `POST /api/users/profile-picture` - Upload profile picture
- `DELETE /api/users/profile-picture` - Remove profile picture
- `DELETE /api/users/delete` - Delete account

**Employment:**
- `POST /api/users/employment` - Add employment entry
- `PUT /api/users/employment/:id` - Update employment
- `DELETE /api/users/employment/:id` - Delete employment

**Profile Sections:**
- `POST /api/profile/skills` - Add skill
- `PUT /api/profile/skills/reorder` - Reorder skills
- `PUT /api/profile/skills/:id` - Update skill
- `DELETE /api/profile/skills/:id` - Delete skill
- `POST /api/profile/education` - Add education
- `PUT /api/profile/education/:id` - Update education
- `DELETE /api/profile/education/:id` - Delete education
- `POST /api/profile/projects` - Add project
- `PUT /api/profile/projects/:id` - Update project
- `DELETE /api/profile/projects/:id` - Delete project
- `POST /api/profile/certifications` - Add certification
- `PUT /api/profile/certifications/:id` - Update certification
- `DELETE /api/profile/certifications/:id` - Delete certification

**Job Management & Analytics:**
- `POST /api/jobs` - Add job entry
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs` - List/search/filter jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/import` - Import job from URL
- `PUT /api/jobs/:id/status` - Update job status (pipeline)
- `GET /api/jobs/analytics` - Job search statistics

**Resume & Cover Letter:**
- `POST /api/resumes` - Create resume
- `PUT /api/resumes/:id` - Update resume
- `DELETE /api/resumes/:id` - Delete resume
- `GET /api/resumes` - List resumes
- `POST /api/coverletters` - Create cover letter
- `PUT /api/coverletters/:id` - Update cover letter
- `DELETE /api/coverletters/:id` - Delete cover letter
- `GET /api/coverletters` - List cover letters

All endpoints return standardized JSON responses with proper HTTP status codes.
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message",
      "value": "invalidValue"
    }
  ],
  "timestamp": "2025-10-30T12:00:00.000Z"
}
```

### HTTP Status Codes

- `200 OK` - Successful GET/PUT/DELETE request
- `201 Created` - Successful POST request (resource created)
- `400 Bad Request` - Validation error or malformed request
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server-side error

### Authentication

Protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained via Clerk authentication and verified using the `checkJwt` middleware.

---

## 🤝 Contributing

We follow a structured development process with comprehensive testing requirements.

### Development Workflow

1. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement your feature** following existing patterns

3. **Write tests** for your feature
   - Unit tests for functions
   - Integration tests for API endpoints
   - Component tests for React components
   - Aim for >80% branch coverage

4. **Run tests** and ensure they pass
   ```bash
   cd backend && npm run test:coverage
   cd frontend && npm test
   ```

5. **Commit your changes** with descriptive messages
   ```bash
   git commit -m "feat: add skill proficiency filtering"
   ```

6. **Push to your branch** and create a Pull Request
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Standards

- Use ES6+ JavaScript features
- Follow existing file structure and naming conventions
- Write clear, self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable and function names

### Pull Request Requirements

- [ ] All tests passing
- [ ] New tests added for new features
- [ ] Code coverage maintained or improved
- [ ] No console errors in browser
- [ ] Responsive design verified
- [ ] API endpoints documented
- [ ] README updated if needed

---

## 👥 Team

**CS 490 Capstone Team - Fall 2025**

*ATS for Candidates Development Team*

**Repository:** [https://github.com/JayRay15/CS490-HotSho-project](https://github.com/JayRay15/CS490-HotSho-project)

---

## 📄 License

This project is part of the CS 490 Capstone course at NJIT and is intended for educational purposes.

---

## 🔗 Additional Resources

- [Sprint 1 PRD](./Sprint1PRD.md) - Complete product requirements
- [Sprint 1 Demo Script](./Sprint1Demo.md) - Demo presentation guide
- [Tech Stack Details](./techStack.md) - In-depth technology breakdown
- [API Endpoints](./backend/API_ENDPOINTS.md) - Complete API documentation
- [Testing Guide](./backend/TESTING_README.md) - Testing best practices

---

## 📞 Support

For questions or issues:
1. Check existing [GitHub Issues](https://github.com/JayRay15/CS490-HotSho-project/issues)
2. Create a new issue with detailed description
3. Contact the development team

---

**Built with ❤️ by the CS 490 Capstone Team**
