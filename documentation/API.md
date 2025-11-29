# API Endpoints Documentation

*Last Updated: November 29, 2025*

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except health check) require a valid Clerk JWT token in the Authorization header:
```
Authorization: Bearer <your-clerk-jwt-token>
```

---

### API Endpoints Implemented (Sprints 1, 2 & 3)

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
- `GET /api/jobs/:jobId/interview-insights` - Get interview insights for job

**Resume & Cover Letter:**
- `POST /api/resumes` - Create resume
- `PUT /api/resumes/:id` - Update resume
- `DELETE /api/resumes/:id` - Delete resume
- `GET /api/resumes` - List resumes
- `POST /api/coverletters` - Create cover letter
- `PUT /api/coverletters/:id` - Update cover letter
- `DELETE /api/coverletters/:id` - Delete cover letter
- `GET /api/coverletters` - List cover letters
- `GET /api/coverletter-templates` - List cover letter templates
- `POST /api/coverletter-templates` - Create cover letter template

**Interview Preparation (Sprint 3):**
- `GET /api/interviews` - List interviews
- `POST /api/interviews` - Create interview
- `PUT /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Delete interview
- `GET /api/interview-questions` - Get question bank
- `POST /api/interview-questions` - Add question to bank
- `GET /api/mock-interviews` - List mock interviews
- `POST /api/mock-interviews` - Start mock interview session
- `POST /api/mock-interviews/:id/answer` - Submit answer
- `GET /api/mock-interviews/:id/feedback` - Get AI feedback
- `POST /api/interview-coaching/feedback` - Get response coaching
- `GET /api/interview-predictions/:jobId` - Get success predictions
- `GET /api/technical-prep/questions` - Get technical questions
- `POST /api/technical-prep/submit` - Submit technical answer
- `GET /api/writing-practice/prompts` - Get writing prompts
- `POST /api/writing-practice/submit` - Submit writing practice

**Company Research (Sprint 3):**
- `GET /api/company-research/:companyName` - Get company research report
- `GET /api/companies/:id` - Get company details

**Calendar Integration (Sprint 3):**
- `GET /api/calendar/events` - List calendar events
- `POST /api/calendar/events` - Create calendar event
- `PUT /api/calendar/events/:id` - Update calendar event
- `DELETE /api/calendar/events/:id` - Delete calendar event
- `POST /api/calendar/sync/google` - Sync with Google Calendar
- `POST /api/calendar/sync/outlook` - Sync with Microsoft Outlook

**Network & Contacts (Sprint 3):**
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Add contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `GET /api/networking-events` - List networking events
- `POST /api/networking-events` - Create networking event
- `GET /api/referrals` - List referrals
- `POST /api/referrals` - Add referral
- `GET /api/relationship-maintenance` - Get follow-up reminders
- `POST /api/follow-ups` - Create follow-up reminder

**Mentorship (Sprint 3):**
- `GET /api/mentors` - List mentors
- `POST /api/mentors` - Add mentor
- `PUT /api/mentors/:id` - Update mentor
- `DELETE /api/mentors/:id` - Delete mentor

**Analytics & Goals (Sprint 3):**
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/applications` - Get application analytics
- `GET /api/market-intelligence` - Get market insights
- `GET /api/salary/:jobTitle` - Get salary data
- `GET /api/productivity` - Get productivity metrics
- `GET /api/goals` - List goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

**Skill Gap Analysis:**
- `GET /api/skill-gap/:jobId` - Analyze skill gaps for job
- `POST /api/job-match/analyze` - Analyze job match

**Reports:**
- `GET /api/reports` - List reports
- `POST /api/reports/generate` - Generate custom report

**PDF Analysis:**
- `POST /api/pdf-analysis/upload` - Upload and analyze PDF
- `POST /api/pdf-analysis/extract` - Extract text from PDF

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
