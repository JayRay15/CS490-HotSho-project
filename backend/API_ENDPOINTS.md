# API Endpoints Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except health check) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All endpoints return a consistent JSON response format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": null
}
```

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
- **Status Code:** 200 (Success), 400 (Validation error), 404 (User not found), 500 (Server error)
- **Description:** Update current user's profile information
- **Auth Required:** Yes
- **Body:** User profile data (name, bio, location, phone, website, linkedin, github)

### Authentication Endpoints

#### Register New User
- **POST** `/api/auth/register`
- **Status Code:** 201 (Created), 400 (User already exists), 500 (Server error)
- **Description:** Create new user account
- **Auth Required:** Yes (Auth0 token)

#### Login User
- **POST** `/api/auth/login`
- **Status Code:** 200 (Success), 404 (User not found), 500 (Server error)
- **Description:** Authenticate user
- **Auth Required:** Yes (Auth0 token)

#### Logout User
- **POST** `/api/auth/logout`
- **Status Code:** 200 (Success), 500 (Server error)
- **Description:** End user session
- **Auth Required:** Yes (Auth0 token)

### Profile Section Endpoints

#### Employment Management

##### Add Employment
- **POST** `/api/profile/employment`
- **Status Code:** 200 (Success), 404 (User not found), 500 (Server error)
- **Description:** Add new employment record
- **Auth Required:** Yes
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
- **Status Code:** 200 (Success), 404 (User not found), 500 (Server error)
- **Description:** Add new skill
- **Auth Required:** Yes
- **Body:**
```json
{
  "name": "JavaScript",
  "level": "Advanced",
  "category": "Programming"
}
```

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
- **Status Code:** 200 (Success), 404 (User not found), 500 (Server error)
- **Description:** Add new education record
- **Auth Required:** Yes
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
- **Status Code:** 200 (Success), 404 (User not found), 500 (Server error)
- **Description:** Add new project
- **Auth Required:** Yes
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

- **200 OK:** Successful GET, PUT, DELETE operations
- **201 Created:** Successful POST operations (user registration)
- **400 Bad Request:** Validation errors, user already exists
- **401 Unauthorized:** Missing or invalid JWT token
- **404 Not Found:** User or resource not found
- **500 Internal Server Error:** Server-side errors

## Frontend Verification

To verify API responses and status codes:

1. Start the backend server: `npm start` (from backend directory)
2. Use browser dev tools Network tab
3. Make requests to endpoints with proper Authorization headers
4. Verify response format matches documentation
5. Check status codes match expected values
6. Test error scenarios (invalid tokens, missing data, etc.)

## Example Frontend Usage

```javascript
// Example API call with fetch
const response = await fetch('/api/users/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Response:', data);
```
