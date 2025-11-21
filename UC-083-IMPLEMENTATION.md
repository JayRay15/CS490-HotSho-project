# UC-083: Salary Negotiation Guidance Implementation

## Overview
Comprehensive salary negotiation guidance system that provides users with personalized tools and strategies to confidently negotiate competitive compensation packages.

## Features Implemented

### 1. Market Data Research ✅
- Integration with existing salary benchmarking system (UC-067)
- Pre-fill negotiation forms with market data for specific job offers
- Display market median, min, and max salary ranges
- Location and company size adjustments

### 2. Personalized Talking Points ✅
- **Automated Generation**: AI-powered talking points based on:
  - Years of experience
  - Unique skills and specializations
  - Professional certifications
  - Key achievements
  - Market data comparison
  - Competing offers
  - Cost of living considerations
- **Confidence Levels**: High, Medium, Low confidence ratings for each point
- **Usage Tracking**: Mark talking points as "used" during negotiations
- **Regeneration**: Ability to regenerate with additional context

### 3. Negotiation Scripts & Scenarios ✅
- **7 Pre-built Scenarios**:
  1. Initial Counter Offer
  2. Total Compensation Focus
  3. Competing Offer Discussion
  4. Benefits Negotiation
  5. Timeline Extension Request
  6. Final Decision (Accept/Decline)
  7. Scenario-specific guidance based on context
- **Practice Tracking**: Mark scenarios as practiced
- **Detailed Guidance**: 
  - When to use each script
  - Expected employer response
  - Next steps and follow-up actions

### 4. Total Compensation Framework ✅
- **Component Weighting**:
  - Base Salary (40%)
  - Performance Bonus (20%)
  - Equity/Stock Options (20%)
  - Benefits Package (20%)
- **Priority Ordering**: Customizable component importance
- **Total Comp Calculator**: Automatic calculation including all components
- **Non-negotiables**: Track deal-breaker requirements

### 5. Timing Strategy ✅
- **Best Practices Timeline**:
  - 24-48 hour acknowledgment window
  - 3-5 day response recommendation
  - Deadline management
- **Follow-up Schedule**:
  - Automated milestone tracking
  - Scheduled action items
  - Completion checkboxes
- **Strategic Recommendations**: When to negotiate, follow up, and make decisions

### 6. Counteroffer Evaluation ✅
- **Structured Tracking**:
  - Requested amounts (salary, bonus, equity)
  - Employer response details
  - Multiple rounds of negotiation
- **Automated Evaluation**:
  - Meets minimum threshold check
  - Gap from desired salary
  - Strengths and weaknesses analysis
  - Accept/decline recommendation
- **Side-by-side Comparison**: Initial vs. final offer with percentage improvements

### 7. Confidence Building Exercises ✅
- **8 Evidence-based Exercises**:
  1. Power Posing
  2. Visualization
  3. Positive Self-Talk
  4. Practice Your Number
  5. Rejection Rehearsal
  6. Success Inventory
  7. Calm Breathing
  8. Mentor Consultation
- **Completion Tracking**: Mark exercises as done
- **Reflection Notes**: Optional journaling for each exercise
- **Confidence Meter**: 1-10 scale tracking throughout negotiation

### 8. Preparation Checklist ✅
- **20+ Checklist Items** organized by category:
  - **Research** (4 items): Market data, company info, industry trends
  - **Documentation** (4 items): Achievements, skills, references, competing offers
  - **Practice** (4 items): Rehearsal, talking points, pushback responses
  - **Mindset** (4 items): Positive framing, walkaway preparation
  - **Logistics** (4 items): Communication setup, scheduling
- **Progress Tracking**: Visual completion percentage
- **Notes Field**: Add context to any checklist item

### 9. Outcome Tracking ✅
- **Status Management**:
  - In Progress
  - Accepted
  - Declined
  - Withdrawn
  - Expired
- **Improvement Metrics**:
  - Absolute salary increase
  - Percentage increase
  - Total compensation improvement
- **Lessons Learned**: Capture what worked and what didn't
- **Satisfaction Rating**: 1-10 scale for overall outcome

### 10. Conversation Logging ✅
- **Detailed Records**:
  - Date and time
  - Communication type (phone, video, email, in-person)
  - Participants
  - Summary of discussion
  - Key points covered
  - Outcomes and next steps
  - Sentiment tracking (positive, neutral, negative)

### 11. Salary Progression Tracking ✅
- **Historical View**: All accepted offers over time
- **Career Growth Metrics**:
  - Average increase per negotiation
  - Total compensation growth percentage
  - Year-over-year progression
- **Visual Timeline**: Company, position, and salary at each step

### 12. Analytics Dashboard ✅
- **Success Metrics**:
  - Total negotiations
  - Success rate (accepted / total)
  - Average confidence level
  - Total salary gained across all negotiations
- **Status Breakdown**: Count by outcome status
- **Trend Analysis**: Performance over time

## Technical Architecture

### Backend Structure

#### Models
**File**: `backend/src/models/Negotiation.js`
- Comprehensive schema with 12 main sections
- Embedded documents for related data (offers, counteroffers, conversations)
- Timestamps and indexing for performance
- Methods for calculating improvement metrics

#### Controllers
**File**: `backend/src/controllers/negotiationController.js`
- 11 controller functions
- Helper functions for:
  - Talking point generation
  - Scenario script creation
  - Timing strategy recommendations
  - Counteroffer evaluation
  - Confidence exercises generation
  - Preparation checklist creation
- Integration with User model for personalization

#### Routes
**File**: `backend/src/routes/negotiationRoutes.js`
- RESTful API endpoints
- All routes protected with JWT authentication
- Proper route ordering (analytics before :id routes)

#### API Endpoints
```
POST   /api/negotiations                        - Create new negotiation
GET    /api/negotiations                        - List all negotiations
GET    /api/negotiations/user/analytics         - Get analytics
GET    /api/negotiations/user/progression       - Get salary progression
GET    /api/negotiations/:id                    - Get specific negotiation
PUT    /api/negotiations/:id                    - Update negotiation
DELETE /api/negotiations/:id                    - Delete negotiation
POST   /api/negotiations/:id/talking-points     - Generate talking points
POST   /api/negotiations/:id/counteroffer       - Add counteroffer
POST   /api/negotiations/:id/conversation       - Log conversation
```

### Frontend Structure

#### Main Component
**File**: `frontend/src/pages/SalaryNegotiation.jsx`
- Tab-based interface (List, Create, Details, Analytics)
- State management for all negotiation data
- Integration with Clerk authentication
- Pre-fill support from job data (via jobId query param)

#### Subcomponents
**File**: `frontend/src/components/SalaryNegotiationComponents.jsx`
1. `NegotiationList` - Grid view with filters
2. `CreateNegotiationForm` - Multi-section form for new negotiations

**File**: `frontend/src/components/SalaryNegotiationDetails.jsx`
1. `NegotiationDetails` - Main workspace for active negotiation
2. `CollapsibleSection` - Reusable expandable section
3. `ExerciseCard` - Confidence exercise card with reflection
4. `AnalyticsView` - Dashboard with metrics and progression

#### API Service
**File**: `frontend/src/api/negotiation.js`
- 15+ API methods
- Helper functions for common operations
- Error handling and retry logic
- Integration with axios interceptors

### Navigation Integration
- **Navbar**: Dropdown menu under "Salary" with two options:
  - Salary Benchmarks (existing)
  - Negotiation Guidance (new)
- **Routing**: `/salary-negotiation` with optional `?jobId=` parameter
- **Mobile Support**: Separate menu items on mobile view

## User Workflows

### Workflow 1: Start Negotiation from Job Offer
1. User receives job offer
2. Clicks "Negotiate" button from Jobs page (passes jobId)
3. Form pre-fills with company, position, location from job data
4. User adds offer details and personal context
5. System generates talking points, scenarios, and checklist
6. User works through preparation and gains confidence
7. User conducts negotiation using scripts and talking points
8. User logs conversations and counteroffers
9. User evaluates final offer and marks outcome
10. System tracks improvement and adds to salary progression

### Workflow 2: General Negotiation Preparation
1. User navigates to Salary → Negotiation Guidance
2. Clicks "New Negotiation" tab
3. Fills out offer details manually
4. Adds personal context (skills, achievements, experience)
5. Reviews generated talking points and selects strongest ones
6. Practices negotiation scenarios
7. Completes confidence building exercises
8. Checks off preparation checklist items
9. Conducts negotiation when ready
10. Tracks outcome for future reference

### Workflow 3: Review Past Negotiations
1. User navigates to Salary → Negotiation Guidance
2. Views "My Negotiations" tab
3. Filters by status (In Progress, Accepted, etc.)
4. Clicks on past negotiation to review
5. Sees what talking points were used
6. Reviews conversation history
7. Analyzes what worked and lessons learned
8. Applies insights to future negotiations

### Workflow 4: Track Career Progression
1. User navigates to "Analytics" tab
2. Views success rate and average increase metrics
3. Explores salary progression timeline
4. Sees total compensation growth over career
5. Identifies patterns in successful negotiations
6. Sets goals for next negotiation

## Acceptance Criteria Verification

✅ **Research market salary data for specific roles and locations**
- Integrated with UC-067 salary benchmarking
- Pre-fills market data when creating from job
- Shows median, min, max with location/size adjustments

✅ **Generate negotiation talking points based on experience and achievements**
- Automated generation using user profile data
- Categories: experience, skills, achievements, market data, competing offers
- Confidence levels and supporting data included
- Regeneration capability with additional context

✅ **Provide framework for total compensation evaluation**
- Component weighting system (salary, bonus, equity, benefits)
- Priority ordering for negotiations
- Total compensation calculator
- Non-negotiables tracking

✅ **Include scripts for different negotiation scenarios**
- 7 pre-built scenario scripts
- Context-aware script generation
- "When to use" guidance for each scenario
- Expected responses and next steps
- Practice tracking

✅ **Suggest timing strategies for salary discussions**
- Best time to negotiate (post-offer, pre-acceptance)
- Response timeline recommendations
- Follow-up schedule with milestones
- Deadline tracking

✅ **Create counteroffer evaluation templates**
- Structured counteroffer tracking
- Automated evaluation engine
- Strengths/weaknesses analysis
- Accept/decline recommendations
- Multiple rounds support

✅ **Provide negotiation confidence building exercises**
- 8 evidence-based exercises
- Completion tracking and reflection notes
- Confidence meter (1-10 scale)
- Progress visualization

✅ **Track negotiation outcomes and salary progression**
- Outcome status tracking (accepted, declined, etc.)
- Improvement metrics (absolute and percentage)
- Historical salary progression view
- Career growth analytics
- Lessons learned capture

✅ **Frontend Verification: Access salary negotiation prep for specific offer**
- Direct link from Jobs page with jobId parameter
- Navigation via Navbar → Salary → Negotiation Guidance
- List view of all negotiations with status filters
- Detail view with all tools and guidance

✅ **Verify market data and talking points**
- Market data displayed in offer details card
- Talking points shown with confidence levels
- Supporting data for each point
- Usage tracking to see which points were effective

## Testing Recommendations

### Manual Testing
1. **Create New Negotiation**
   - Test with jobId parameter (from jobs page)
   - Test manual creation (no jobId)
   - Verify all form fields save correctly
   - Check talking points generation

2. **Work Through Negotiation**
   - Mark talking points as used
   - Practice negotiation scenarios
   - Complete confidence exercises
   - Check off preparation items
   - Add counteroffers
   - Log conversations

3. **Complete Negotiation**
   - Update outcome status
   - Verify improvement calculations
   - Check analytics update
   - Confirm progression tracking

4. **Navigation & Filters**
   - Test tab switching
   - Filter negotiations by status
   - Test mobile menu
   - Verify protected routes

### API Testing
```bash
# Create negotiation
POST http://localhost:5000/api/negotiations

# Get all negotiations
GET http://localhost:5000/api/negotiations

# Get specific negotiation
GET http://localhost:5000/api/negotiations/:id

# Generate talking points
POST http://localhost:5000/api/negotiations/:id/talking-points

# Add counteroffer
POST http://localhost:5000/api/negotiations/:id/counteroffer

# Get analytics
GET http://localhost:5000/api/negotiations/user/analytics

# Get progression
GET http://localhost:5000/api/negotiations/user/progression
```

## Future Enhancements

1. **Email Templates**: Pre-written email templates for each scenario
2. **PDF Export**: Export negotiation plan as shareable PDF
3. **Notifications**: Remind users of upcoming deadlines and follow-ups
4. **AI Coach**: Real-time negotiation coaching via chat interface
5. **Salary Comparison**: Compare offer against multiple data sources
6. **Negotiation Simulations**: Interactive practice with AI responses
7. **Video Recording**: Practice and review negotiation videos
8. **Peer Comparison**: Anonymous comparison with similar professionals
9. **Industry Insights**: Trends and tips specific to user's industry
10. **Integration with Job Applications**: Auto-create negotiation when offer received

## Files Created/Modified

### Created Files
1. `backend/src/models/Negotiation.js` - Database model
2. `backend/src/controllers/negotiationController.js` - Business logic
3. `backend/src/routes/negotiationRoutes.js` - API routes
4. `frontend/src/api/negotiation.js` - API client
5. `frontend/src/pages/SalaryNegotiation.jsx` - Main page component
6. `frontend/src/components/SalaryNegotiationComponents.jsx` - List and form components
7. `frontend/src/components/SalaryNegotiationDetails.jsx` - Detail and analytics components
8. `UC-083-IMPLEMENTATION.md` - This documentation

### Modified Files
1. `backend/src/server.js` - Added negotiation routes
2. `frontend/src/App.jsx` - Added negotiation route and import
3. `frontend/src/components/Navbar.jsx` - Added dropdown menu with negotiation link

## Git Commit Message
```
feat(UC-083): Implement comprehensive salary negotiation guidance system

- Add Negotiation model with 12+ feature areas
- Create 11 controller functions for negotiation management
- Implement RESTful API with protected routes
- Build tabbed UI with 4 views (List, Create, Details, Analytics)
- Generate personalized talking points from user context
- Provide 7 negotiation scenario scripts with guidance
- Track confidence with 8 evidence-based exercises
- Evaluate counteroffers with automated recommendations
- Monitor salary progression and career growth
- Display analytics dashboard with success metrics
- Integrate with existing salary benchmarking (UC-067)
- Support job offer pre-fill via jobId parameter
- Add dropdown menu in navbar for salary tools

Closes UC-083
```

## Support & Documentation
For questions or issues, refer to:
- API documentation: `backend/API_ENDPOINTS.md`
- Salary feature guide: `SALARY_BENCHMARKS.md`
- User guide: README.md
