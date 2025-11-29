# Mentor Dashboard API Documentation (UC-109)

## Overview
This document describes the specialized mentor dashboard endpoints that enable mentors to effectively coach and support their mentees. These endpoints provide comprehensive views of mentee progress, KPIs, engagement metrics, and coaching insights.

## Authentication
All endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

---

## Endpoints

### 1. Get Mentor Dashboard Overview
Retrieves comprehensive dashboard data for all mentees.

**Endpoint:** `GET /api/mentors/dashboard`

**Authorization:** Required (Mentor role)

**Response:**
```json
{
  "success": true,
  "data": {
    "menteeCount": 3,
    "mentees": [
      {
        "_id": "relationship_id",
        "menteeId": {
          "_id": "user_id",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "profilePicture": "url"
        },
        "relationshipType": "mentor",
        "focusAreas": ["resume_review", "interview_prep"],
        "status": "accepted"
      }
    ],
    "recentActivity": [
      {
        "type": "feedback",
        "date": "2025-11-28T10:00:00Z",
        "description": "Provided resume feedback to John",
        "mentee": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "pendingRecommendations": 5,
    "unreadMessages": 2,
    "recentFeedback": []
  }
}
```

---

### 2. Get Mentee Profile with Shared Data
Retrieves detailed profile information for a specific mentee, including shared materials.

**Endpoint:** `GET /api/mentors/mentee/:menteeId/profile`

**Authorization:** Required (Must be mentor of the mentee)

**Response:**
```json
{
  "success": true,
  "data": {
    "mentee": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "profilePicture": "url",
      "headline": "Software Engineer",
      "summary": "Passionate about web development..."
    },
    "relationship": {
      "_id": "relationship_id",
      "status": "accepted",
      "sharedData": {
        "shareResume": true,
        "shareCoverLetters": true,
        "shareApplications": true,
        "shareInterviewPrep": true,
        "shareGoals": true
      },
      "focusAreas": ["resume_review", "interview_prep"]
    },
    "sharedData": {
      "resumes": [],
      "applications": [],
      "goals": [],
      "interviews": []
    },
    "feedbackHistory": [],
    "recommendations": []
  }
}
```

---

### 3. Get Mentee Progress Summary
Retrieves KPIs and progress metrics for a mentee.

**Endpoint:** `GET /api/mentors/mentee/:menteeId/progress`

**Query Parameters:**
- `period` (optional): Number of days to analyze (default: 30)

**Authorization:** Required (Must be mentor of the mentee)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": 30,
    "kpis": {
      "applications": {
        "total": 15,
        "change": 5,
        "trend": "neutral"
      },
      "interviews": {
        "total": 3,
        "change": 2,
        "trend": "neutral"
      },
      "goals": {
        "completed": 4,
        "total": 8,
        "completionRate": 50
      },
      "engagement": {
        "lastActive": "2025-11-28T10:00:00Z",
        "activityScore": 12
      }
    },
    "goalProgressData": [
      {
        "_id": "completed",
        "count": 4
      },
      {
        "_id": "in_progress",
        "count": 3
      },
      {
        "_id": "not_started",
        "count": 1
      }
    ],
    "achievedMilestones": [
      {
        "goalTitle": "Land a Software Engineering Role",
        "milestoneTitle": "Complete 10 applications",
        "completedDate": "2025-11-20T00:00:00Z"
      }
    ],
    "trends": {
      "applications": "up",
      "interviews": "up"
    }
  }
}
```

---

### 4. Get Mentee Coaching Insights
Generates AI-powered coaching insights based on mentee's performance patterns.

**Endpoint:** `GET /api/mentors/mentee/:menteeId/insights`

**Authorization:** Required (Must be mentor of the mentee)

**Response:**
```json
{
  "success": true,
  "data": {
    "strengths": [
      {
        "area": "Application Volume",
        "description": "Submitted 12 applications in the last 30 days",
        "impact": "high"
      }
    ],
    "areasForImprovement": [
      {
        "area": "Interview Conversion",
        "description": "Low interview conversion rate suggests need for application improvements",
        "impact": "high"
      }
    ],
    "actionableRecommendations": [
      {
        "title": "Enhance Resume and Cover Letter Quality",
        "description": "Focus on tailoring applications to specific job requirements",
        "priority": "high",
        "estimatedImpact": "Can double interview callback rate"
      }
    ],
    "achievementPatterns": [
      {
        "pattern": "Goal Completion Time",
        "description": "Average time to complete goals: 25 days",
        "insight": "Quick achiever - setting and completing goals efficiently"
      }
    ]
  }
}
```

---

### 5. Get Mentee Engagement Metrics
Retrieves engagement and activity level metrics for a mentee.

**Endpoint:** `GET /api/mentors/mentee/:menteeId/engagement`

**Authorization:** Required (Must be mentor of the mentee)

**Response:**
```json
{
  "success": true,
  "data": {
    "messageCount": 15,
    "acknowledgmentRate": "85.0",
    "recommendationCompletionRate": "60.0",
    "activityTimeline": [
      {
        "type": "message",
        "date": "2025-11-28T10:00:00Z",
        "description": "Sent message"
      },
      {
        "type": "feedback_acknowledged",
        "date": "2025-11-27T15:30:00Z",
        "description": "Acknowledged feedback on resume"
      }
    ],
    "engagementScore": {
      "score": 78,
      "rating": "Good"
    },
    "lastActive": "2025-11-28T10:00:00Z"
  }
}
```

---

## Engagement Score Calculation

The engagement score is calculated based on three factors:

1. **Message Activity (40 points max)**: Based on number of messages sent (1 message = 4 points, max 10 messages)
2. **Feedback Acknowledgment (30 points max)**: Percentage of feedback acknowledged
3. **Recommendation Completion (30 points max)**: Percentage of recommendations completed

**Rating Scale:**
- **Excellent**: 80-100 points
- **Good**: 60-79 points
- **Fair**: 40-59 points
- **Needs Attention**: 0-39 points

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Not authorized to view this mentee's data"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Mentee not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch mentor dashboard",
  "error": "Error details"
}
```

---

## Usage Examples

### JavaScript/Fetch Example
```javascript
// Get mentor dashboard
const response = await fetch('/api/mentors/dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const dashboard = await response.json();

// Get mentee progress
const progressResponse = await fetch('/api/mentors/mentee/USER_ID/progress?period=30', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const progress = await progressResponse.json();

// Get coaching insights
const insightsResponse = await fetch('/api/mentors/mentee/USER_ID/insights', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const insights = await insightsResponse.json();
```

---

## Feature Requirements Met (UC-109)

✅ **View mentee progress summary and key performance indicators**
- Dashboard endpoint provides comprehensive KPI overview
- Progress endpoint shows detailed metrics (applications, interviews, goals)

✅ **Access mentee job search materials for review and feedback**
- Profile endpoint includes shared resumes, cover letters, applications, and interviews
- Materials organized by type with access based on sharing permissions

✅ **Provide feedback and recommendations on applications and interview preparation**
- Existing feedback endpoints integrate with dashboard
- Insights endpoint generates actionable recommendations

✅ **Track mentee goal progress and achievement patterns**
- Progress endpoint shows goal completion rates and trends
- Achievement patterns identified in insights endpoint

✅ **Generate coaching insights and development recommendations**
- Insights endpoint analyzes performance patterns
- Identifies strengths, areas for improvement, and actionable steps

✅ **Include communication tools for mentee interaction**
- Dashboard shows unread message count
- Recent activity timeline tracks all interactions

✅ **Monitor mentee engagement and activity levels**
- Engagement endpoint provides comprehensive activity metrics
- Engagement score (0-100) with rating system

✅ **Provide accountability tracking and milestone management**
- Progress endpoint tracks milestone achievements
- Timeline of completed milestones with dates

---

## Frontend Integration

The frontend components integrate these endpoints:

1. **MentorDashboard.jsx**: Main dashboard showing overview and mentee list
2. **MenteeDetailView.jsx**: Detailed modal with tabs for:
   - Overview: KPIs and engagement score
   - Progress: Goals, milestones, and trends
   - Insights: Strengths, improvements, and recommendations
   - Materials: Shared resumes, applications, goals, interviews

All components handle loading states, errors, and provide intuitive navigation.
