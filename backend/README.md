# Backend API

RESTful API for the Job Seeker ATS application with Auth0 authentication.

## Tech Stack

- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose**
- **Auth0** for authentication (JWT)
- **CORS** enabled for frontend integration

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `AUTH0_AUDIENCE` - Your Auth0 API audience
- `AUTH0_DOMAIN` - Your Auth0 tenant domain
- `MONGO_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)
- `FRONTEND_ORIGIN` - Frontend URL for CORS (default: http://localhost:5173)

### 3. Set Up MongoDB

You can use either:
- **MongoDB Atlas** (recommended): Free cloud database at https://www.mongodb.com/cloud/atlas
- **Local MongoDB**: Install from https://www.mongodb.com/try/download/community

### 4. Start the Server

```bash
npm start
```

Server will run on `http://localhost:5000` (or your configured PORT).

## API Endpoints

See `API_ENDPOINTS.md` for detailed API documentation.

### Health Check
```
GET /api/health
```

### Authentication (Auth0)
```
POST /api/auth/register  - Register new user
POST /api/auth/login     - Login user
POST /api/auth/logout    - Logout user
```

### User Profile
```
GET  /api/users/me  - Get current user
PUT  /api/users/me  - Update current user
```

### Profile Management
```
POST   /api/profile/employment/:employmentId  - Add employment
PUT    /api/profile/employment/:employmentId  - Update employment
DELETE /api/profile/employment/:employmentId  - Delete employment

POST   /api/profile/skills/:skillId          - Add skill
PUT    /api/profile/skills/:skillId          - Update skill
DELETE /api/profile/skills/:skillId          - Delete skill

POST   /api/profile/education/:educationId   - Add education
PUT    /api/profile/education/:educationId   - Update education
DELETE /api/profile/education/:educationId   - Delete education

POST   /api/profile/projects/:projectId      - Add project
PUT    /api/profile/projects/:projectId      - Update project
DELETE /api/profile/projects/:projectId      - Delete project
```

All endpoints (except `/api/health`) require a valid Auth0 JWT Bearer token.

## Project Structure

```
backend/
├── src/
│   ├── server.js              # Entry point
│   ├── controllers/           # Request handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── profileController.js
│   ├── middleware/            # Custom middleware
│   │   └── checkJwt.js       # Auth0 JWT validation
│   ├── models/                # Mongoose schemas
│   │   └── User.js
│   ├── routes/                # Express routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── profileRoutes.js
│   └── utils/                 # Utility functions
│       ├── db.js             # MongoDB connection
│       └── responseFormat.js # Standardized API responses
├── test_scripts/             # Test utilities
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment template
└── package.json
```

## Development

### Testing Endpoints

Use the test script:
```bash
node test_scripts/test-endpoints.js
```

Or use tools like:
- **Postman**
- **Thunder Client** (VS Code extension)
- **curl**

### Common Issues

1. **MongoDB connection failed**: Check your `MONGO_URI` in `.env`
2. **JWT validation error**: Verify `AUTH0_AUDIENCE` and `AUTH0_DOMAIN` are correct
3. **CORS errors**: Ensure `FRONTEND_ORIGIN` matches your frontend URL

## Authentication Flow

1. User logs in via Auth0 on frontend
2. Frontend receives JWT token from Auth0
3. Frontend sends token in `Authorization: Bearer <token>` header
4. Backend validates token with Auth0
5. Backend extracts user info from token (`req.auth.payload.sub`)
6. Backend performs requested operation
