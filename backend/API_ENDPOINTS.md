# API Endpoints Documentation

**Last Updated:** November 10, 2025

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except health check) require a valid Auth0 JWT token in the Authorization header:
```
Authorization: Bearer <your-auth0-jwt-token>
```

### Auth0 Integration
- Users register and authenticate through Auth0
- Auth0 provides JWT tokens with user information
- Backend validates tokens using `express-oauth2-jwt-bearer`
- User data is stored in MongoDB with `auth0Id` linking to Auth0

## Response Format
All endpoints return a consistent JSON response format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2025-10-28T00:00:00.000Z",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2025-10-28T00:00:00.000Z",
  "errorCode": 3001,
  "errors": [
    {
      "field": "email",
      "message": "A valid email address is required",
      "value": "invalid-email"
    }
  ]
}
```

**Note:** The `errorCode` field is always present in error responses. The `errors` array is included for validation errors to provide field-specific details.

## Endpoints

### Health Check
- **GET** `/api/health`
- **Status Code:** 200
- **Description:** Check if server is running
- **Auth Required:** No

### User Endpoints

#### Get Current User Profile
- **GET** `/api/users/me`
- **Status Code:** 200 (Success), 404 (User not found), 500 (Server error)
- **Description:** Retrieve current user's profile information
- **Auth Required:** Yes

#### Update Current User Profile
- **PUT** `/api/users/me`
- **Status Code:** 200 (Success), 400 (Validation error), 401 (Invalid token), 404 (User not found), 500 (Server error)
- **Description:** Update current user's profile information
- **Auth Required:** Yes
- **Body:** User profile data
  - **Basic Info**: `name` (required), `email` (required), `phone`, `location`
  - **Professional Info**: `headline` (required, professional title), `bio` (max 500 chars), `industry` (required, enum), `experienceLevel` (required, enum)
  - **Social Links**: `website`, `linkedin`, `github`
- **Validation:**
  - **Required fields**: `name`, `email`, `headline`, `industry`, `experienceLevel`
  - **Optional fields**: `phone`, `location`, `bio`, `website`, `linkedin`, `github`
  - Email format validation
  - Bio limited to 500 characters
  - Industry must be one of: `Technology`, `Healthcare`, `Finance`, `Education`, `Construction`, `Real Estate`
  - Experience level must be one of: `Entry`, `Mid`, `Senior`, `Executive`
  - Cannot update: `auth0Id`, `_id`, `uuid`, `createdAt`, `updatedAt`
  - Empty request body returns 400 error
- **Error Codes:**
  - `1001` - Unauthorized (missing credentials)
  - `2001` - Validation error (invalid fields)
  - `3001` - Not found (user not found)
- **Success Response Example:**
```json
{
  "success": true,
  "message": "User profile updated successfully",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "headline": "Senior Software Engineer | Full Stack Developer",
    "bio": "Experienced developer passionate about building scalable applications...",
    "industry": "Technology",
    "experienceLevel": "Senior",
    "location": "New York, NY",
    "phone": "(555) 123-4567"
  }
}
```


#### Upload Profile Picture
- **POST** `/api/users/profile-picture`
- **Status Code:** 200 (Success), 400 (Validation error), 401 (Unauthorized), 404 (User not found), 500 (Server error)
- **Description:** Upload a profile picture for the current user
- **Auth Required:** Yes
- **Content-Type:** `multipart/form-data`
- **Body:** Form data with `picture` field containing image file
- **Validation:**
  - Accepts: JPG, PNG, GIF
  - Maximum file size: 5MB
  - File is automatically stored as Base64 in database
- **Error Codes:**
  - `1001` - Unauthorized (missing credentials)
  - `3001` - Not found (user not found)
  - `4001` - Invalid file type (not JPG/PNG/GIF)
  - `4002` - File too large (exceeds 5MB)
  - `4003` - Upload failed (server error during processing)
  - `4004` - No file provided
- **Success Response Example:**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "data": {
    "picture": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }
}
```
- **Error Response Examples:**
```json
{
  "success": false,
  "message": "No file provided",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "errorCode": 4004
}
```
```json
{
  "success": false,
  "message": "Invalid file type. Only JPG, PNG, and GIF are allowed.",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "errorCode": 4001
}
```

#### Delete Profile Picture
- **DELETE** `/api/users/profile-picture`
- **Status Code:** 200 (Success), 401 (Unauthorized), 404 (User not found), 500 (Server error)
- **Description:** Remove the current user's profile picture
- **Auth Required:** Yes
- **Error Codes:**
  - `1001` - Unauthorized (missing credentials)
  - `3001` - Not found (user not found)
- **Success Response Example:**
```json
{
  "success": true,
  "message": "Profile picture removed successfully",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "data": {
    "picture": null
  }
}
```


#### Add Employment Entry
- **POST** `/api/users/employment`
- **Status Code:** 200 (Success), 400 (Validation error), 401 (Unauthorized), 404 (User not found), 500 (Server error)
- **Description:** Add a new employment entry to the current user's profile
- **Auth Required:** Yes
- **Body:** Employment entry data
  - **Required fields**: `jobTitle`, `company`, `startDate`
  - **Optional fields**: `location`, `endDate`, `isCurrentPosition`, `description`
- **Validation:**
  - `jobTitle` - Required, trimmed
  - `company` - Required, trimmed
  - `startDate` - Required, valid date (Month/Year format)
  - `endDate` - Optional (not required if `isCurrentPosition` is true), must be after `startDate`
  - `isCurrentPosition` - Boolean, defaults to false
  - `description` - Optional, max 1000 characters
  - `location` - Optional, trimmed
- **Error Codes:**
  - `1001` - Unauthorized (missing credentials)
  - `2001` - Validation error (missing required fields or validation failures)
  - `3001` - Not found (user not found)
- **Success Response Example:**
```json
{
  "success": true,
  "message": "Employment entry added successfully",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "data": {
    "employment": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "jobTitle": "Senior Software Engineer",
        "company": "Tech Corp",
        "location": "New York, NY",
        "startDate": "2023-01-01T00:00:00.000Z",
        "endDate": null,
        "isCurrentPosition": true,
        "description": "Leading development of scalable web applications...",
        "createdAt": "2025-10-28T12:00:00.000Z",
        "updatedAt": "2025-10-28T12:00:00.000Z"
      }
    ]
  }
}
```
- **Error Response Example:**
```json
{
  "success": false,
  "message": "Validation failed for employment entry",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "errorCode": 2001,
  "errors": [
    {
      "field": "jobTitle",
      "message": "Job title is required",
      "value": null
    },
    {
      "field": "endDate",
      "message": "End date must be after start date",
      "value": "2022-12-31"
    }
  ]
}
```


### Authentication Endpoints

#### Register New User
- **POST** `/api/auth/register`
- **Status Code:** 201 (Created), 400 (Validation error), 401 (Invalid token), 409 (Duplicate email), 500 (Server error)
- **Description:** Create new user account linked to Clerk/Auth0
- **Auth Required:** Yes (Clerk/Auth0 token)
- **Behavior:** 
  - Extracts user data from Clerk token payload (`userId`, `fullName`, `email`, `imageUrl`)
  - Validates email format
  - Checks for duplicate email (returns 409 if exists)
  - Creates user in MongoDB with `auth0Id` linking to Clerk
  - Returns user data without password
- **Error Codes:**
  - `1001` - Unauthorized (missing credentials)
  - `2001` - Validation error (invalid email)
  - `3003` - Duplicate entry (email already exists)

#### Login User
- **POST** `/api/auth/login`
- **Status Code:** 200 (Success), 401 (Invalid token), 404 (User not found), 500 (Server error)
- **Description:** Authenticate user and return user data
- **Auth Required:** Yes (Clerk/Auth0 token)
- **Behavior:**
  - Validates Clerk/Auth0 token
  - Finds user by `auth0Id` from token payload
  - Returns user profile data
- **Error Codes:**
  - `1001` - Unauthorized (missing credentials)
  - `3001` - Not found (user not registered)

#### Logout User
- **POST** `/api/auth/logout`
- **Status Code:** 200 (Success), 401 (Invalid token), 500 (Server error)
- **Description:** End user session (server-side cleanup)
- **Auth Required:** Yes (Auth0 token)
- **Behavior:**
  - Validates Auth0 token
  - Performs any server-side cleanup if needed
  - Actual logout handled by Auth0 on frontend

### Profile Section Endpoints

#### Employment Management

##### Add Employment
- **POST** `/api/profile/employment`
- **Status Code:** 200 (Success), 400 (Validation error), 401 (Invalid token), 404 (User not found), 500 (Server error)
- **Description:** Add new employment record to user profile
- **Auth Required:** Yes
- **Required Fields:** `company`, `position`, `startDate`
- **Body:**
```json
{
  "company": "Company Name",
  "position": "Job Title",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "current": false,
  "description": "Job description",
  "location": "City, State"
}
```
- **Error Codes:**
  - `2001` - Validation error (missing required fields)

##### Update Employment
- **PUT** `/api/profile/employment/:employmentId`
- **Status Code:** 200 (Success), 404 (User/Employment not found), 500 (Server error)
- **Description:** Update existing employment record
- **Auth Required:** Yes
- **Body:** Employment data to update

##### Delete Employment
- **DELETE** `/api/profile/employment/:employmentId`
- **Status Code:** 200 (Success), 404 (User/Employment not found), 500 (Server error)
- **Description:** Delete employment record
- **Auth Required:** Yes

#### Skills Management

##### Add Skill
- **POST** `/api/profile/skills`
- **Status Code:** 200 (Success), 400 (Validation error), 401 (Invalid token), 404 (User not found), 500 (Server error)
- **Description:** Add new skill to user profile
- **Auth Required:** Yes
- **Required Fields:** `name`, `level`, `category`
- **Body:**
```json
{
  "name": "JavaScript",
  "level": "Advanced",
  "category": "Programming"
}
```
- **Valid Levels:** "Beginner", "Intermediate", "Advanced", "Expert"
- **Error Codes:**
  - `2001` - Validation error (missing required fields)

##### Update Skill
- **PUT** `/api/profile/skills/:skillId`
- **Status Code:** 200 (Success), 404 (User/Skill not found), 500 (Server error)
- **Description:** Update existing skill
- **Auth Required:** Yes
- **Body:** Skill data to update

##### Delete Skill
- **DELETE** `/api/profile/skills/:skillId`
- **Status Code:** 200 (Success), 404 (User/Skill not found), 500 (Server error)
- **Description:** Delete skill
- **Auth Required:** Yes

#### Education Management

##### Add Education
- **POST** `/api/profile/education`
- **Status Code:** 200 (Success), 400 (Validation error), 401 (Invalid token), 404 (User not found), 500 (Server error)
- **Description:** Add new education record to user profile
- **Auth Required:** Yes
- **Required Fields:** `institution`, `degree`, `fieldOfStudy`, `startDate`
- **Body:**
```json
{
  "institution": "University Name",
  "degree": "Bachelor of Science",
  "fieldOfStudy": "Computer Science",
  "startDate": "2020-09-01",
  "endDate": "2024-05-01",
  "current": false,
  "gpa": 3.8,
  "location": "City, State"
}
```
- **Error Codes:**
  - `2001` - Validation error (missing required fields)

##### Update Education
- **PUT** `/api/profile/education/:educationId`
- **Status Code:** 200 (Success), 404 (User/Education not found), 500 (Server error)
- **Description:** Update existing education record
- **Auth Required:** Yes
- **Body:** Education data to update

##### Delete Education
- **DELETE** `/api/profile/education/:educationId`
- **Status Code:** 200 (Success), 404 (User/Education not found), 500 (Server error)
- **Description:** Delete education record
- **Auth Required:** Yes

#### Projects Management

##### Add Project
- **POST** `/api/profile/projects`
- **Status Code:** 200 (Success), 400 (Validation error), 401 (Invalid token), 404 (User not found), 500 (Server error)
- **Description:** Add new project to user profile
- **Auth Required:** Yes
- **Required Fields:** `name`, `description`, `startDate`
- **Body:**
```json
{
  "name": "Project Name",
  "description": "Project description",
  "technologies": ["React", "Node.js", "MongoDB"],
  "startDate": "2024-01-01",
  "endDate": "2024-06-01",
  "current": false,
  "url": "https://project-url.com",
  "githubUrl": "https://github.com/user/project"
}
```
- **Error Codes:**
  - `2001` - Validation error (missing required fields)

##### Update Project
- **PUT** `/api/profile/projects/:projectId`
- **Status Code:** 200 (Success), 404 (User/Project not found), 500 (Server error)
- **Description:** Update existing project
- **Auth Required:** Yes
- **Body:** Project data to update

##### Delete Project
- **DELETE** `/api/profile/projects/:projectId`
- **Status Code:** 200 (Success), 404 (User/Project not found), 500 (Server error)
- **Description:** Delete project
- **Auth Required:** Yes

## HTTP Status Codes Used

- **200 OK:** Successful GET, PUT, DELETE, POST operations
- **201 Created:** Successful user registration
- **400 Bad Request:** Validation errors, invalid input
- **401 Unauthorized:** Missing or invalid JWT token
- **404 Not Found:** User or resource not found
- **409 Conflict:** Duplicate entry (e.g., email already exists)
- **500 Internal Server Error:** Server-side errors (generic message returned)

## Error Codes Reference

All error responses include an `errorCode` field for programmatic error handling:

### Authentication & Authorization (1xxx)
- **1001** - Unauthorized (missing or invalid token)
- **1002** - Invalid token
- **1003** - Token expired
- **1004** - Forbidden

### Validation Errors (2xxx)
- **2001** - Validation error (field-specific issues)
- **2002** - Invalid input
- **2003** - Missing required field
- **2004** - Invalid format

### Resource Errors (3xxx)
- **3001** - Not found (user or resource)
- **3002** - Already exists
- **3003** - Duplicate entry (e.g., duplicate email)

### Server Errors (5xxx)
- **5001** - Internal error
- **5002** - Database error
- **5003** - External service error

### Network Errors (6xxx)
- **6001** - Network error
- **6002** - Timeout

## Testing

### Automated Testing

**Error Handling Tests:**
```bash
cd backend
node test_scripts/test-error-handling.js
```

This test verifies:
- Standardized error response format
- Proper error codes for different scenarios
- Field-specific validation errors
- Network error handling
- HTTP status code correctness

**Comprehensive Endpoint Tests:**
```bash
cd backend/test_scripts
node test-endpoints.js
```

This test:
1. Gets Clerk/Auth0 token
2. Registers a new user
3. Tests all user profile endpoints
4. Tests all authentication endpoints
5. Tests all profile section endpoints
6. Provides detailed results and status codes

### Frontend Verification

To verify API responses and status codes:

1. Start the backend server: `npm start` (from backend directory)
2. Use browser dev tools Network tab
3. Make requests to endpoints with proper Authorization headers
4. Verify response format matches documentation
5. Check status codes match expected values
6. Test error scenarios (invalid tokens, missing data, etc.)

## Example Frontend Usage

```javascript
// Example using the enhanced axios instance
import api, { getErrorMessage, getValidationErrors, retryRequest } from './api/axios';

// Simple API call
try {
  const response = await api.get('/api/users/me');
  console.log('User data:', response.data.data);
} catch (error) {
  // Error is automatically enhanced by axios interceptor
  const message = getErrorMessage(error); // User-friendly message
  const fieldErrors = getValidationErrors(error); // Field-specific errors
  console.error('Error:', message);
  console.error('Field errors:', fieldErrors);
}

// API call with retry logic
try {
  const response = await retryRequest(() => api.put('/api/users/me', userData));
  console.log('Update successful:', response.data);
} catch (error) {
  // Handle error after retries exhausted
  console.error('Failed after retries:', getErrorMessage(error));
}

// Using fetch directly
const response = await fetch('/api/users/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Success:', data.success);
console.log('Error Code:', data.errorCode); // Present in error responses
console.log('Response:', data);
```

## Error Response Examples

### Validation Error Example
```json
{
  "success": false,
  "message": "Missing required fields",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "errorCode": 2001,
  "errors": [
    {
      "field": "company",
      "message": "company is required",
      "value": null
    },
    {
      "field": "position",
      "message": "position is required",
      "value": null
    }
  ]
}
```

### Duplicate Email Error Example
```json
{
  "success": false,
  "message": "An account with this email already exists",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "errorCode": 3003,
  "errors": [
    {
      "field": "email",
      "message": "This email is already registered",
      "value": "user@example.com"
    }
  ]
}
```

### Unauthorized Error Example
```json
{
  "success": false,
  "message": "Unauthorized: Invalid or missing authentication token",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "errorCode": 1001
}
```

---

## Job Interview Insights (UC-068)

### Get Interview Insights
- **GET** `/api/jobs/:jobId/interview-insights`
- **Status Code:** 200 (Success), 401 (Unauthorized), 404 (Job not found), 500 (Server error)
- **Description:** Retrieve comprehensive interview insights and preparation guidance for a specific job application
- **Auth Required:** Yes
- **Path Parameters:**
  - `jobId` - MongoDB ObjectId of the job
- **Error Codes:**
  - `1001` - Unauthorized (missing credentials)
  - `3001` - Not found (job not found or user doesn't have permission)
  - `5001` - Internal server error
- **Success Response Example:**
```json
{
  "success": true,
  "message": "Interview insights retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "insights": {
      "company": "TechCorp",
      "jobTitle": "Software Engineer",
      "dataSource": {
        "totalApplications": 5,
        "basedOnRealData": true,
        "note": "Insights based on 5 applications to TechCorp."
      },
      "processStages": {
        "stages": [
          {
            "name": "Initial Screening",
            "description": "Resume review and initial assessment",
            "frequency": "100%",
            "avgDuration": "1-3 days",
            "order": 1
          },
          {
            "name": "Phone/Video Screen",
            "description": "Initial conversation with recruiter or hiring manager",
            "frequency": "80%",
            "avgDuration": "30-45 minutes",
            "order": 2
          }
        ],
        "totalStages": "3-5 rounds typically",
        "processType": "Standard multi-stage interview process"
      },
      "timeline": {
        "applicationToFirstResponse": "3-7 days",
        "firstResponseToPhoneScreen": "5-10 days",
        "phoneScreenToTechnical": "7-14 days",
        "technicalToOnsite": "7-14 days",
        "onsiteToFinalDecision": "5-14 days",
        "totalProcessDuration": "30 days (based on data)",
        "note": "Timeline can vary based on role level and hiring urgency"
      },
      "successMetrics": {
        "phoneScreenRate": "60%",
        "interviewRate": "40%",
        "offerRate": "20%",
        "competitiveness": "Moderate",
        "note": "Based on 5 application(s)"
      },
      "commonQuestions": {
        "behavioral": [
          "Tell me about yourself and your background",
          "Why are you interested in this position?",
          "Why do you want to work at TechCorp?"
        ],
        "technical": [
          "Explain your approach to solving complex technical problems",
          "Walk me through a recent project architecture you designed"
        ],
        "roleSpecific": [
          "What's your experience with our tech stack?",
          "How do you approach debugging production issues?"
        ],
        "industrySpecific": [
          "How do you approach learning new technologies?",
          "What tech trends excite you most?"
        ]
      },
      "interviewerInfo": {
        "typicalInterviewers": [
          {
            "role": "Recruiter/HR Representative",
            "stage": "Initial Screen",
            "focus": "Culture fit, basic qualifications, salary expectations",
            "tips": "Be prepared to discuss your background and career goals"
          }
        ],
        "researchTips": [
          "Research TechCorp on LinkedIn to find potential interviewers",
          "Review interviewer backgrounds to find common ground"
        ]
      },
      "interviewFormats": {
        "commonFormats": [
          {
            "format": "Behavioral Interview",
            "description": "Questions about past experiences and situations",
            "preparation": "Use STAR method (Situation, Task, Action, Result)",
            "duration": "30-45 minutes",
            "frequency": "Very Common"
          }
        ],
        "companySpecificNotes": [
          "Research TechCorp's interview process on Glassdoor",
          "Check company career page for interview tips"
        ]
      },
      "preparationRecs": {
        "general": [
          {
            "category": "Company Research",
            "priority": "High",
            "tasks": [
              "Research TechCorp's mission, values, and culture",
              "Review recent company news, press releases, and blog posts"
            ]
          }
        ],
        "roleSpecific": [
          {
            "category": "Technical Preparation",
            "priority": "High",
            "tasks": [
              "Review data structures and algorithms",
              "Practice coding problems on LeetCode/HackerRank"
            ]
          }
        ]
      },
      "successTips": {
        "beforeInterview": [
          {
            "tip": "Research the company thoroughly",
            "importance": "Critical",
            "details": "Understand TechCorp's mission, recent news, products, and culture"
          }
        ],
        "duringInterview": [
          {
            "tip": "Make a strong first impression",
            "importance": "High",
            "details": "Arrive on time, dress professionally, maintain good eye contact"
          }
        ],
        "afterInterview": [
          {
            "tip": "Send thank-you emails",
            "importance": "High",
            "details": "Send within 24 hours, personalize for each interviewer"
          }
        ],
        "commonMistakes": [
          "Not researching the company thoroughly",
          "Speaking negatively about past employers",
          "Failing to provide specific examples"
        ],
        "dataInsights": [
          "Based on data from 5 applications, response times vary",
          "Candidates who reached interview stage typically had strong technical backgrounds"
        ]
      },
      "checklist": {
        "oneWeekBefore": [
          { "task": "Research company thoroughly", "completed": false },
          { "task": "Review job description and requirements", "completed": false }
        ],
        "threeDaysBefore": [
          { "task": "Finalize your 'tell me about yourself' pitch", "completed": false }
        ],
        "oneDayBefore": [
          { "task": "Confirm interview time and format", "completed": false }
        ],
        "dayOf": [
          { "task": "Eat a good breakfast/meal", "completed": false }
        ],
        "afterInterview": [
          { "task": "Send thank-you email within 24 hours", "completed": false }
        ]
      },
      "generatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Features:**
- Aggregates data from company applications (when available)
- Provides industry-standard insights as fallback
- Customizes questions and preparation based on role and industry
- Interactive preparation checklist with progress tracking
- Timeline expectations for interview process
- Success tips organized by interview phase
- Common interview formats and preparation guidance

**Data Quality:**
- Real data used when 3+ applications exist for the company
- Industry standards used when limited company data available
- `basedOnRealData` flag indicates data source reliability


---

## Job Matching (UC-063)

### Calculate Match Score
**POST** `/job-matches/calculate/:jobId`

Calculate how well user matches a specific job opportunity.

**Request Body (optional):**
```json
{
  "customWeights": {
    "skills": 50,
    "experience": 25,
    "education": 15,
    "additional": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Match score calculated",
  "data": {
    "_id": "matchId",
    "userId": "userId",
    "jobId": "jobId",
    "overallScore": 78,
    "matchGrade": "Good",
    "categoryScores": {
      "skills": {
        "score": 85,
        "weight": 40,
        "details": {
          "matched": ["JavaScript", "React", "Node.js"],
          "missing": ["Python"],
          "weak": [],
          "matchedCount": 3,
          "totalRequired": 4
        }
      },
      "experience": {
        "score": 75,
        "weight": 30,
        "details": {
          "yearsExperience": 3.5,
          "yearsRequired": 3,
          "relevantPositions": [...],
          "industryMatch": true,
          "seniorityMatch": true
        }
      },
      "education": {
        "score": 70,
        "weight": 15,
        "details": {
          "degreeMatch": true,
          "fieldMatch": true,
          "gpaMatch": true,
          "hasRequiredDegree": true,
          "educationLevel": "Bachelor"
        }
      },
      "additional": {
        "score": 80,
        "weight": 15,
        "details": {
          "locationMatch": true,
          "workModeMatch": true,
          "salaryExpectationMatch": true,
          "certifications": 1,
          "projects": 2
        }
      }
    },
    "strengths": [
      {
        "category": "skills",
        "description": "Strong skill match with 3 out of 4 required skills",
        "impact": "high"
      }
    ],
    "gaps": [
      {
        "category": "skills",
        "description": "Missing required skills: Python",
        "severity": "important",
        "suggestion": "Consider gaining experience in Python through courses or projects"
      }
    ],
    "suggestions": [
      {
        "type": "skill",
        "priority": "high",
        "title": "Learn Python",
        "description": "Python is a critical skill for this position. Focus on this first.",
        "estimatedImpact": 10,
        "resources": [
          {
            "title": "Python course on Coursera",
            "url": "https://www.coursera.org/search?query=Python",
            "platform": "Coursera"
          }
        ]
      }
    ],
    "metadata": {
      "jobTitle": "Software Engineer",
      "company": "Tech Corp",
      "industry": "Technology",
      "calculatedAt": "2025-11-10T12:00:00Z",
      "algorithVersion": "1.0"
    }
  }
}
```

---

### Get Match Score
**GET** `/job-matches/:jobId`

Retrieve existing match score for a job.

**Response:** Same as Calculate Match Score

---

### Get All Matches
**GET** `/job-matches`

Get all match scores for user's jobs.

**Query Parameters:**
- `sortBy` (optional): Field to sort by (`overallScore`, `createdAt`, `metadata.company`). Default: `overallScore`
- `order` (optional): Sort order (`asc`, `desc`). Default: `desc`
- `minScore` (optional): Filter by minimum score (0-100)
- `maxScore` (optional): Filter by maximum score (0-100)

**Response:**
```json
{
  "success": true,
  "message": "Matches retrieved",
  "data": {
    "matches": [
      {
        "_id": "matchId",
        "overallScore": 85,
        "matchGrade": "Excellent",
        "categoryScores": {...},
        "job": {
          "_id": "jobId",
          "title": "Software Engineer",
          "company": "Tech Corp",
          ...
        }
      }
    ],
    "total": 5
  }
}
```

---

### Compare Job Matches
**POST** `/job-matches/compare`

Compare match scores across multiple jobs.

**Request Body:**
```json
{
  "jobIds": ["jobId1", "jobId2", "jobId3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Jobs compared",
  "data": {
    "totalJobs": 3,
    "averageScore": 72,
    "bestMatch": {
      "job": "Software Engineer at Google",
      "score": 85,
      "id": "jobId1"
    },
    "worstMatch": {
      "job": "Backend Developer at Startup",
      "score": 60,
      "id": "jobId3"
    },
    "recommendations": [
      {
        "type": "action",
        "message": "Software Engineer at Google is your best match (85%). Prioritize this application."
      }
    ],
    "scoreDistribution": {
      "excellent": 1,
      "good": 1,
      "fair": 1,
      "poor": 0
    }
  }
}
```

---

### Update Custom Weights
**PUT** `/job-matches/:jobId/weights`

Update category weights for match calculation.

**Request Body:**
```json
{
  "skills": 50,
  "experience": 25,
  "education": 15,
  "additional": 10
}
```

**Note:** Weights must sum to 100.

**Response:** Updated match record with recalculated score

---

### Get Match History
**GET** `/job-matches/:jobId/history`

Get historical match scores for a job to track improvement over time.

**Response:**
```json
{
  "success": true,
  "message": "Match history retrieved",
  "data": {
    "matches": [
      {
        "_id": "matchId1",
        "overallScore": 65,
        "createdAt": "2025-10-01T12:00:00Z"
      },
      {
        "_id": "matchId2",
        "overallScore": 72,
        "createdAt": "2025-10-15T12:00:00Z"
      },
      {
        "_id": "matchId3",
        "overallScore": 78,
        "createdAt": "2025-11-01T12:00:00Z"
      }
    ],
    "trend": {
      "direction": "improving",
      "change": 13,
      "firstScore": 65,
      "latestScore": 78
    },
    "timeline": [
      {
        "date": "2025-10-01T12:00:00Z",
        "score": 65,
        "skills": 70,
        "experience": 60,
        "education": 65,
        "additional": 70
      }
    ]
  }
}
```

---

### Get Match Trends
**GET** `/job-matches/trends/all`

Analyze match score trends across all jobs.

**Response:**
```json
{
  "success": true,
  "message": "Match trends retrieved",
  "data": {
    "averageScore": 73,
    "categoryAverages": {
      "skills": 78,
      "experience": 70,
      "education": 75,
      "additional": 72
    },
    "weakestCategory": {
      "category": "experience",
      "score": 70
    },
    "trends": [
      {
        "month": "Oct 2025",
        "averageScore": 70,
        "count": 3
      },
      {
        "month": "Nov 2025",
        "averageScore": 76,
        "count": 2
      }
    ],
    "totalMatches": 5,
    "scoreDistribution": {
      "excellent": 1,
      "good": 2,
      "fair": 2,
      "poor": 0
    }
  }
}
```

---

### Export Match Report
**GET** `/job-matches/:jobId/export`

Export detailed match analysis report.

**Query Parameters:**
- `format` (optional): Export format (`json`, `text`). Default: `json`

**Response:** 
- JSON format: Returns match data as downloadable JSON file
- Text format: Returns formatted plain text report

---

### Delete Match
**DELETE** `/job-matches/:jobId`

Delete a match record.

**Response:**
```json
{
  "success": true,
  "message": "Match deleted"
}
```

---

### Calculate All Matches
**POST** `/job-matches/calculate-all`

Batch calculate match scores for all active (non-archived) jobs.

**Response:**
```json
{
  "success": true,
  "message": "All matches calculated",
  "data": {
    "calculatedMatches": 5,
    "topMatch": {
      "jobId": "jobId1",
      "score": 85,
      "job": "Software Engineer at Google"
    },
    "averageScore": 73
  }
}
```

---

**Match Score Grading:**
- **Excellent** (85-100%): Outstanding match, highly recommended
- **Good** (70-84%): Strong match, good candidate
- **Fair** (55-69%): Moderate match, consider with reservations
- **Poor** (0-54%): Weak match, may not be suitable

**Scoring Categories:**
- **Skills** (default 40%): Technical and soft skills alignment
- **Experience** (default 30%): Years of experience, relevant positions, seniority
- **Education** (default 15%): Degree level, field of study, academic performance
- **Additional** (default 15%): Location, work mode, certifications, projects

---

## Interview Response Coaching (UC-076)

### Submit Interview Response and Get AI Feedback
Submit a practice interview response and receive comprehensive AI coaching feedback.

**Endpoint:** `POST /api/interview-coaching/responses`

**Request Body:**
```json
{
  "question": "Tell me about a time when you had to deal with a difficult team member.",
  "response": "In my previous role as a software engineer... (full response text)",
  "category": "Behavioral",
  "difficulty": "Medium",
  "targetDuration": 120,
  "context": {
    "jobTitle": "Senior Software Engineer",
    "company": "Google",
    "industry": "Technology"
  },
  "tags": ["teamwork", "conflict-resolution"],
  "notes": "Practice for Google interview"
}
```

**Parameters:**
- `question` (required): The interview question text
- `response` (required): Your response (minimum 20 words)
- `category` (optional): Question category - Behavioral, Technical, Situational, Leadership, Teamwork, Problem-Solving, Other (default: Behavioral)
- `difficulty` (optional): Easy, Medium, Hard (default: Medium)
- `targetDuration` (optional): Target duration in seconds (default: 120)
- `context` (optional): Job context for tailored feedback
- `tags` (optional): Array of tags for organization
- `notes` (optional): Personal notes

**Response:**
```json
{
  "success": true,
  "message": "Interview response submitted successfully",
  "data": {
    "interviewResponse": {
      "_id": "response123",
      "question": {
        "text": "Tell me about a time...",
        "category": "Behavioral",
        "difficulty": "Medium"
      },
      "response": "Full response text...",
      "feedback": {
        "contentScore": 85,
        "structureScore": 80,
        "clarityScore": 90,
        "relevanceScore": 88,
        "specificityScore": 75,
        "impactScore": 82,
        "overallScore": 83,
        "strengths": [
          "Strong opening that addresses the question directly",
          "Good use of specific metrics and quantifiable results"
        ],
        "weaknesses": [
          "Could provide more context about the situation",
          "Conclusion feels rushed and lacks impact"
        ],
        "suggestions": [
          "Add more details about the initial challenge",
          "Include the broader impact on the team"
        ],
        "weakLanguagePatterns": [
          {
            "pattern": "I just",
            "context": "I just decided to implement a new system",
            "alternative": "I strategically decided to implement a new system",
            "reason": "The word 'just' minimizes your contribution"
          }
        ],
        "lengthAnalysis": {
          "wordCount": 185,
          "estimatedDuration": 95,
          "recommendation": "Slightly Short",
          "idealRange": { "min": 100, "max": 140 },
          "adjustmentSuggestion": "Your response could benefit from 20-30 more seconds..."
        },
        "starAnalysis": {
          "hasStructure": true,
          "components": {
            "situation": {
              "present": true,
              "score": 85,
              "feedback": "Good context provided..."
            },
            "task": {
              "present": true,
              "score": 90,
              "feedback": "Clear description of responsibility..."
            },
            "action": {
              "present": true,
              "score": 80,
              "feedback": "Actions described but could be more specific..."
            },
            "result": {
              "present": true,
              "score": 95,
              "feedback": "Excellent use of quantifiable metrics..."
            }
          },
          "overallAdherence": 87,
          "recommendations": [
            "Strengthen the Situation section",
            "Break down actions into clear steps"
          ]
        },
        "alternativeApproaches": [
          {
            "title": "Results-First Approach",
            "description": "Start with the impressive outcome...",
            "example": "I increased team productivity by 40%...",
            "whenToUse": "When you have strong quantifiable results"
          }
        ]
      },
      "version": 1,
      "improvementTracking": {
        "attempts": 1,
        "firstAttemptScore": 83,
        "bestScore": 83,
        "overallImprovement": 0
      },
      "createdAt": "2025-11-20T10:00:00.000Z"
    },
    "improvementMetrics": {
      "scoreChange": 0,
      "percentageImprovement": 0,
      "attempts": 1,
      "currentScore": 83,
      "firstScore": 83,
      "bestScore": 83
    }
  }
}
```

**Features:**
- AI-powered comprehensive feedback on 6 key dimensions
- STAR method framework adherence analysis
- Length analysis with speaking time estimates
- Weak language pattern identification
- Alternative response approaches
- Automatic improvement tracking across attempts
- Scoring on relevance, specificity, and impact

---

### Get All Interview Responses
Retrieve all practice interview responses with optional filtering.

**Endpoint:** `GET /api/interview-coaching/responses`

**Query Parameters:**
- `category` (optional): Filter by question category
- `includeArchived` (optional): Include archived responses (default: false)
- `limit` (optional): Number of results per page (default: 50)
- `skip` (optional): Number of results to skip (default: 0)
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): asc or desc (default: desc)

**Example:** `GET /api/interview-coaching/responses?category=Behavioral&limit=10`

**Response:**
```json
{
  "success": true,
  "message": "Interview responses retrieved successfully",
  "data": {
    "responses": [
      {
        "_id": "response123",
        "question": {
          "text": "Tell me about a time...",
          "category": "Behavioral",
          "difficulty": "Medium"
        },
        "response": "In my previous role...",
        "feedback": { /* feedback object */ },
        "version": 2,
        "improvementTracking": {
          "attempts": 2,
          "firstAttemptScore": 75,
          "bestScore": 85,
          "overallImprovement": 13.3
        },
        "tags": ["teamwork", "leadership"],
        "createdAt": "2025-11-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

---

### Get Interview Response by ID
Retrieve a specific interview response with previous versions.

**Endpoint:** `GET /api/interview-coaching/responses/:id`

**Response:**
```json
{
  "success": true,
  "message": "Interview response retrieved successfully",
  "data": {
    "interviewResponse": { /* full response object */ },
    "previousVersions": [
      { /* previous attempt 1 */ },
      { /* previous attempt 2 */ }
    ],
    "improvementMetrics": {
      "scoreChange": 10,
      "percentageImprovement": 13.3,
      "attempts": 3,
      "currentScore": 85,
      "firstScore": 75,
      "bestScore": 85
    }
  }
}
```

---

### Update Interview Response
Update notes, tags, or archive status of a response.

**Endpoint:** `PATCH /api/interview-coaching/responses/:id`

**Request Body:**
```json
{
  "notes": "This was a great practice session",
  "tags": ["teamwork", "conflict-resolution", "leadership"],
  "isArchived": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Interview response updated successfully",
  "data": {
    "interviewResponse": { /* updated response */ }
  }
}
```

---

### Delete Interview Response
Delete a practice response.

**Endpoint:** `DELETE /api/interview-coaching/responses/:id`

**Response:**
```json
{
  "success": true,
  "message": "Interview response deleted successfully",
  "data": {
    "deletedId": "response123"
  }
}
```

---

### Get Practice Statistics
Get comprehensive practice statistics and improvement metrics.

**Endpoint:** `GET /api/interview-coaching/stats`

**Response:**
```json
{
  "success": true,
  "message": "Practice statistics retrieved successfully",
  "data": {
    "totalPracticed": 25,
    "averageScore": 82.5,
    "averageImprovement": 15.8,
    "scoresTrend": [
      { "score": 75, "date": "2025-11-15T10:00:00.000Z" },
      { "score": 80, "date": "2025-11-16T10:00:00.000Z" },
      { "score": 85, "date": "2025-11-17T10:00:00.000Z" }
    ],
    "byCategory": [
      {
        "category": "Behavioral",
        "count": 15,
        "avgScore": 85.2,
        "bestScore": 95,
        "avgContentScore": 88,
        "avgStructureScore": 82,
        "avgClarityScore": 87,
        "avgRelevanceScore": 85,
        "avgSpecificityScore": 80,
        "avgImpactScore": 84
      },
      {
        "category": "Technical",
        "count": 10,
        "avgScore": 78.5,
        "bestScore": 90,
        "avgContentScore": 80,
        "avgStructureScore": 75,
        "avgClarityScore": 82,
        "avgRelevanceScore": 78,
        "avgSpecificityScore": 76,
        "avgImpactScore": 77
      }
    ]
  }
}
```

**Features:**
- Overall practice statistics
- Score trends over time (last 10 responses)
- Performance breakdown by question category
- Detailed scoring metrics for each category
- Average improvement tracking

---

### Generate Interview Questions
Generate sample interview questions for practice.

**Endpoint:** `POST /api/interview-coaching/questions/generate`

**Request Body:**
```json
{
  "category": "Leadership",
  "context": {
    "jobTitle": "Engineering Manager",
    "company": "Tech Corp",
    "industry": "Technology"
  },
  "count": 5
}
```

**Parameters:**
- `category` (required): Question category
- `context` (optional): Job context for tailored questions
- `count` (optional): Number of questions to generate (default: 5)

**Response:**
```json
{
  "success": true,
  "message": "Interview questions generated successfully",
  "data": {
    "questions": [
      {
        "text": "Tell me about a time when you had to make a difficult decision that affected your team.",
        "category": "Leadership",
        "difficulty": "Medium",
        "tips": "Focus on your decision-making process and how you considered different perspectives. Use the STAR method."
      },
      {
        "text": "Describe a situation where you had to motivate a demotivated team member.",
        "category": "Leadership",
        "difficulty": "Hard",
        "tips": "Highlight your emotional intelligence and ability to understand individual motivations."
      }
    ]
  }
}
```

---

### Compare Response Versions
Compare multiple versions of the same response to track improvement.

**Endpoint:** `GET /api/interview-coaching/responses/:id/compare`

**Response:**
```json
{
  "success": true,
  "message": "Version comparison retrieved successfully",
  "data": {
    "versions": [
      { /* version 1 */ },
      { /* version 2 */ },
      { /* version 3 */ }
    ],
    "comparison": {
      "question": "Tell me about a time...",
      "totalVersions": 3,
      "scoreProgression": [
        {
          "version": 1,
          "date": "2025-11-15T10:00:00.000Z",
          "overallScore": 75,
          "contentScore": 70,
          "structureScore": 75,
          "clarityScore": 78,
          "relevanceScore": 76,
          "specificityScore": 72,
          "impactScore": 74
        },
        {
          "version": 2,
          "date": "2025-11-16T10:00:00.000Z",
          "overallScore": 82,
          "contentScore": 80,
          "structureScore": 82,
          "clarityScore": 85,
          "relevanceScore": 83,
          "specificityScore": 78,
          "impactScore": 80
        }
      ],
      "improvement": {
        "overall": 7,
        "content": 10,
        "structure": 7,
        "clarity": 7
      },
      "bestVersion": { /* best scoring version */ }
    }
  }
}
```

**Features:**
- Track score progression across multiple attempts
- Identify best performing version
- Measure improvement in each scoring dimension
- Compare different approaches to the same question

---

**Feedback Scoring Criteria:**

1. **Content Score (0-100):** Quality and relevance of information
   - Answer completeness
   - Meaningful and substantive content
   - Specific examples and details

2. **Structure Score (0-100):** Organization and flow
   - Clear beginning, middle, and end
   - Logical progression
   - Easy to follow

3. **Clarity Score (0-100):** Communication effectiveness
   - Clear and concise language
   - Unambiguous expression
   - Easy to understand

4. **Relevance Score (0-100):** Question alignment
   - Stays on topic
   - Directly addresses the question
   - All information is relevant

5. **Specificity Score (0-100):** Detail and concreteness
   - Specific examples vs. generalities
   - Metrics and quantifiable results
   - Sufficient detail for credibility

6. **Impact Score (0-100):** Memorability and impression
   - Demonstrates value and achievement
   - Shows growth or learning
   - Would impress an interviewer

**STAR Method Components:**
- **Situation (20-25%):** Context and background
- **Task (15-20%):** Your responsibility or challenge
- **Action (40-45%):** Specific steps you took
- **Result (20-25%):** Outcomes and impact

