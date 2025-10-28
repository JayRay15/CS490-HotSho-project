# API Endpoints Documentation

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
