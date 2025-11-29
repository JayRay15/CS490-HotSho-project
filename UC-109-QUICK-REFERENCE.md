# UC-109: Mentor Dashboard - Quick Reference Card

## 🚀 Quick Start

### Access the Feature
```
URL: /mentors (click "My Mentees" tab)
User Role: Mentor (must have accepted mentor relationships)
```

---

## 📍 API Endpoints Reference

### 1. Dashboard Overview
```http
GET /api/mentors/dashboard
Authorization: Bearer <token>
```
**Returns:** All mentees, statistics, recent activity

### 2. Mentee Profile
```http
GET /api/mentors/mentee/:menteeId/profile
Authorization: Bearer <token>
```
**Returns:** Profile, shared materials, feedback history

### 3. Progress & KPIs
```http
GET /api/mentors/mentee/:menteeId/progress?period=30
Authorization: Bearer <token>
```
**Returns:** Applications, interviews, goals, milestones, trends

### 4. Coaching Insights
```http
GET /api/mentors/mentee/:menteeId/insights
Authorization: Bearer <token>
```
**Returns:** Strengths, improvements, recommendations, patterns

### 5. Engagement Metrics
```http
GET /api/mentors/mentee/:menteeId/engagement
Authorization: Bearer <token>
```
**Returns:** Engagement score (0-100), activity breakdown

---

## 🎨 Frontend Components

### Main Component
```jsx
import { MentorDashboard } from './components/mentors';

// Shows overview + mentee list with "View Progress" buttons
<MentorDashboard />
```

### Detail View Component
```jsx
import { MenteeDetailView } from './components/mentors';

// Modal with 4 tabs: Overview, Progress, Insights, Materials
<MenteeDetailView 
  menteeId="user_id" 
  onClose={() => setOpen(false)} 
/>
```

---

## 📊 Engagement Score Formula

```
Total Score (0-100) =
  Message Activity (max 40) +
  Feedback Acknowledgment Rate (max 30) +
  Recommendation Completion Rate (max 30)

Rating:
  80-100 = Excellent
  60-79  = Good
  40-59  = Fair
  0-39   = Needs Attention
```

---

## 🔒 Authorization Flow

```javascript
1. JWT token required on all endpoints
2. Verify mentor-mentee relationship exists
3. Check relationship status = "accepted"
4. Verify sharing permissions for materials
5. Return filtered data based on permissions
```

---

## 📱 UI Structure

```
MentorDashboard
│
├── My Mentees Tab
│   ├── Statistics Cards (4)
│   │   ├── Total Mentees
│   │   ├── Unread Messages
│   │   ├── Pending Recommendations
│   │   └── Recent Feedback
│   │
│   ├── Recent Activity (last 5)
│   │
│   └── Mentee Cards
│       ├── Profile Info
│       ├── Focus Areas
│       ├── [View Progress] → Opens Modal
│       └── [Message]
│
└── MenteeDetailView Modal
    ├── Overview Tab
    │   ├── 3 KPI Cards
    │   ├── Engagement Score Widget
    │   └── Mentee Bio
    │
    ├── Progress Tab
    │   ├── Goal Progress
    │   ├── Recent Milestones
    │   └── Activity Trends
    │
    ├── Insights Tab
    │   ├── Strengths (green)
    │   ├── Areas for Improvement (yellow)
    │   ├── Recommendations (bordered)
    │   └── Achievement Patterns
    │
    └── Materials Tab
        ├── Resumes
        ├── Applications
        ├── Goals
        └── Interviews
```

---

## 🧪 Testing Quick Check

### Essential Tests
```bash
✅ Dashboard loads with mentee list
✅ View Progress opens modal
✅ All 4 tabs switch correctly
✅ KPIs display accurate data
✅ Engagement score calculates (0-100)
✅ Insights show recommendations
✅ Materials respect permissions
✅ Mobile responsive
```

### Test Data Requirements
```
Mentee account needs:
- 5+ applications
- 3+ goals (mix of completed/in progress)
- 1+ resume
- 1+ interview
- Active mentor relationship (status: accepted)
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Dashboard empty | Check relationship status = "accepted" |
| No materials showing | Verify sharing permissions enabled |
| Engagement score = 0 | Mentee needs activity (messages, acknowledgments) |
| Insights empty | Mentee needs more data (applications, goals) |
| 403 Forbidden | User not mentor of this mentee |
| 404 Not Found | Mentee ID invalid or relationship doesn't exist |

---

## 📝 Key Data Models

### MentorRelationship
```javascript
{
  mentorId: ObjectId,
  menteeId: ObjectId,
  status: "accepted",
  sharedData: {
    shareResume: Boolean,
    shareCoverLetters: Boolean,
    shareApplications: Boolean,
    shareInterviewPrep: Boolean,
    shareGoals: Boolean
  },
  focusAreas: [String]
}
```

### Engagement Score
```javascript
{
  score: Number (0-100),
  rating: String ("Excellent" | "Good" | "Fair" | "Needs Attention"),
  breakdown: {
    messageCount: Number,
    acknowledgmentRate: String,
    recommendationCompletionRate: String
  }
}
```

---

## 🎯 Acceptance Criteria Checklist

- [x] View mentee progress summary and KPIs
- [x] Access mentee job search materials
- [x] Provide feedback and recommendations
- [x] Track mentee goal progress and patterns
- [x] Generate coaching insights
- [x] Communication tools for interaction
- [x] Monitor engagement and activity levels
- [x] Accountability tracking and milestones

---

## 📚 Documentation Files

- `MENTOR_DASHBOARD_API.md` - Full API documentation
- `MENTOR_DASHBOARD_TESTING.md` - Complete testing guide
- `UC-109-IMPLEMENTATION-SUMMARY.md` - Implementation details
- `MENTOR_COLLABORATION_GUIDE.md` - Existing mentor system docs

---

## 🔄 State Management

### Dashboard State
```javascript
const [mentees, setMentees] = useState([]);
const [mentorDashboardData, setMentorDashboardData] = useState(null);
const [selectedMenteeId, setSelectedMenteeId] = useState(null);
```

### Detail View State
```javascript
const [profile, setProfile] = useState(null);
const [progress, setProgress] = useState(null);
const [insights, setInsights] = useState(null);
const [engagement, setEngagement] = useState(null);
const [activeTab, setActiveTab] = useState("overview");
```

---

## 🚦 Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Display data |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Not authorized for this mentee |
| 404 | Not Found | Mentee or relationship doesn't exist |
| 500 | Server Error | Show error message, retry |

---

## ⚡ Performance Tips

1. **Frontend:**
   - Modal prevents full page reloads
   - Lazy load tab data on switch
   - Cache dashboard data for 5-10 mins

2. **Backend:**
   - Limit result sets (e.g., last 10 items)
   - Use MongoDB aggregation pipelines
   - Index on mentorId, menteeId, relationshipId

3. **Loading Times:**
   - Dashboard: <3s
   - Detail Modal: <2s
   - Tab Switch: <500ms

---

## 🎨 Styling Tokens

```javascript
Primary Color: #777C6D
Secondary Color: #656A5C
Background: #E4E6E0
Card Background: #E8EAE5
Text Primary: #4F5348
Text Secondary: #656A5C

Status Colors:
- Success: green-100/green-700
- Warning: yellow-100/yellow-700
- Error: red-100/red-700
- Info: blue-100/blue-700
```

---

## 📞 Support

**Questions?** Check:
1. API documentation (`MENTOR_DASHBOARD_API.md`)
2. Testing guide (`MENTOR_DASHBOARD_TESTING.md`)
3. Implementation summary (`UC-109-IMPLEMENTATION-SUMMARY.md`)
4. Existing mentor docs (`MENTOR_COLLABORATION_GUIDE.md`)

**Report Bugs:**
Use template in `MENTOR_DASHBOARD_TESTING.md`

---

**Version:** 1.0.0  
**Last Updated:** November 29, 2025  
**Status:** ✅ Production Ready
