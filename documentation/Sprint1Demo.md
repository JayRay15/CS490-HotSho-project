# Sprint 1 Demo Script
*ATS for Candidates - CS 490 Capstone Project*

**Duration**: 15-20 minutes

---

## Preparation

Every team member needs to be prepared to run the demo on their device. I will randomly choose someone from your team to run the demo. That person does not have to be the presenter, but their device will be used for the presentation.

The team must be prepared with appropriate account names (email addresses), images, and content for the demo. Have a text file ready with content to paste into forms (i.e. copy-and-paste).

The demo should be bug free.

Scoring for being prepared:
- Running on the proper device, 5 points. Running on another device zero points.
- Being prepared with content, 5 points. Minus one point for when an item is not available.
- The demo is bug free, 5 points. Minus one point for every bug that occurs during the demo.

Scoring for the demo:
- On point for each item below marked as "Demo Action".
---

## Demo Introduction (2 minutes)

**[Team Introduction and Project Overview]**

"Good [morning/afternoon], I'm [Name] and I'll be presenting our Sprint 1 demo for [Team Name]'s ATS for Candidates platform. Today I'll show you the foundational features we've built that transform how job seekers manage their career journey.

In this 15-minute demo, I'll walk you through:
1. Our brand identity and responsive design
2. Complete authentication system
3. Comprehensive profile management
4. And our robust testing approach

Let's dive in!"

---

## Act 1: Brand Identity & Responsive Design (3 minutes)

### 1.1 Brand Showcase
**[Demo Action: Navigate through pages, verify logo consistency and quality]**

"First, let me show you our brand identity. As you can see, we've created a professional, cohesive brand experience with our custom logo displayed consistently across all pages. Notice our favicon in the browser tab, and the branded loading spinner when navigating between sections."

### 1.2 Color Scheme & Typography
**[Demo Action: Browse all pages, verify consistent color usage and adequate contrast]**
**[Demo Action: Review text on various pages, verify hierarchy and readability]**

"We've implemented a comprehensive design system with carefully chosen colors that meet accessibility standards. Our typography hierarchy makes content easy to scan - notice how headers, body text, and captions are clearly distinguishable. Everything follows our documented color palette and typography guidelines."

### 1.3 Responsive Design Showcase
**[Demo Action: Test application on various screen sizes, verify functionality and readability]**

"Now, let me demonstrate our responsive design. Watch as I resize the browser..."
- **Desktop view**: "Full navigation and optimal layout for productivity"
- **Tablet view**: "Adapts beautifully to tablet screens"
- **Mobile view**: "Navigation collapses to a hamburger menu, and all content remains accessible"

"Notice how forms remain usable without horizontal scrolling, and all interactive elements stay touch-friendly."

### 1.4 UI Components
**[Demo Action: Interact with buttons and forms, verify visual feedback and consistency]**
**[Demo Action: Browse interface, verify icon consistency and clarity]**

"Our component library includes consistent button states, form styling, and iconography. See how buttons respond to hover states, and our icons maintain clarity at all sizes."

---

## Act 2: Authentication & Security (4 minutes)

### 2.1 User Registration Journey
**[Demo Action: Navigate to /register, fill form with valid data, verify redirect to dashboard]**

"Let me start the user journey by creating a new account. I'll navigate to our registration page..."
- Fill out form with: first name, last name, email, password
- "Notice our real-time validation - password requirements, email format checking"
- "Upon successful registration, users are automatically redirected to their dashboard"

### 2.2 Login Experience
**[Demo Action: Navigate to /login, enter valid/invalid credentials, verify appropriate responses]**

"Now I'll demonstrate our login system. First, let me try invalid credentials..."
- Show error message: "Invalid email or password"
- "Notice the form clears for security, and we get appropriate feedback"
- "Now with valid credentials..." - successful login and redirect

### 2.3 OAuth Integration
**[Demo Action: Click "Sign in with Google", complete OAuth flow, verify account creation/login]**

"We've implemented OAuth for seamless authentication. Watch as I sign in with Google..."
- Click Google sign-in button
- Complete OAuth flow
- "The system automatically imports profile information and creates the account"

### 2.4 Security Features
**[Demo Action: Log out, try accessing /profile, verify redirect to login]**

"Security is paramount. Let me log out and try to access a protected page..."
- Click logout, verify redirect to homepage
- Try to access /profile directly
- "Unauthorized users are immediately redirected to login - our access control is working perfectly"

### 2.5 Password Recovery
**[Demo Action: Click "Forgot Password", enter email, verify success message]**

"For password recovery, users can reset their passwords securely..."
- Click "Forgot Password" link
- Enter email address
- "Users receive a success message regardless of whether the email exists - this prevents email enumeration attacks"

---

## Act 3: Profile Management System (7 minutes)

### 3.1 Profile Overview Dashboard
**[Demo Action: View profile dashboard, verify all sections are represented and interactive]**

"Now for our comprehensive profile management system. This is where candidates build their professional presence."

"The dashboard gives users a complete overview of their profile with completion indicators and quick-add buttons for each section."

### 3.2 Basic Profile Information
**[Demo Action: Navigate to profile, fill out form, verify data saves and displays correctly]**
**[Demo Action: Upload various image types and sizes, verify preview and error handling]**

"Let me complete the basic profile information..."
- Fill out: name, headline, bio, industry, experience level
- Upload profile picture: "Notice the preview functionality and file size validation"
- "All changes save automatically and display immediately"

### 3.3 Employment History Management
**[Demo Action: Navigate to employment section, add new job entry, verify data saves and displays]**
**[Demo Action: View employment history, edit an entry, verify changes are saved and displayed]**
**[Demo Action: Delete an employment entry, verify confirmation dialog and removal from list]**

"Employment history is core to any professional profile. Let me add a position..."
- Add employment entry with job title, company, dates, description
- "Notice the timeline view showing career progression"
- Edit an existing entry: "Changes are reflected immediately"
- Delete an entry: "Confirmation dialog prevents accidental deletion"

### 3.4 Skills Management
**[Demo Action: Add various skills with different proficiency levels, verify display and management]**
**[Demo Action: Organize skills into categories, verify grouping and reordering functionality]**

"Skills management with proficiency tracking..."
- Add technical skills with different proficiency levels
- Add soft skills and organize by category
- "Visual indicators show skill levels, and autocomplete helps with standardization"
- Demonstrate category organization and reordering

### 3.5 Education & Certifications
**[Demo Action: Add education entries, verify data saves and displays correctly]**
**[Demo Action: Add certifications, verify data saves and displays correctly]**

"Education and certification tracking..."
- Add degree with institution, field of study, graduation date
- Add professional certification with expiration tracking
- "The system tracks ongoing vs. completed education and certification renewals"

### 3.6 Special Projects Portfolio
**[Demo Action: Add project entries, verify all fields save correctly and display properly]**
**[Demo Action: View projects in portfolio format, verify filtering and detailed views]**

"Finally, our special projects portfolio..."
- Add a project with description, technologies used, outcomes
- Switch to portfolio view: "Clean, professional presentation of work"
- Demonstrate filtering by technology and date

### 3.7 Profile Completeness
**[Demo Action: View profile completeness indicators, verify suggestions and scoring]**

"Our profile completeness system guides users to create comprehensive profiles..."
- Show completion percentage and progress indicators
- "Users get specific suggestions for improvement and understand what makes a strong profile"

---

## Act 4: Technical Excellence (2 minutes)

### 4.1 API Integration & Error Handling
**[Demo Action: Use browser dev tools to verify API responses and status codes]**
**[Demo Action: Trigger various API errors, verify consistent error message format]**

"Behind the scenes, we've built a robust API architecture. Let me show you in the developer tools..."
- Open browser dev tools, navigate through features
- "Consistent JSON responses, proper HTTP status codes"
- Trigger a validation error: "Standardized error format helps users understand issues"

### 4.2 Data Persistence
**[Demo Action: Register user, log out, log back in, verify data persistence]**

"Data persistence is rock-solid. Let me refresh the browser and log back in..."
- Refresh page, log back in
- "All profile data persists perfectly - employment history, skills, everything is maintained"

### 4.3 Testing & Quality Assurance
**[Demo Action: Run test suite, verify all tests pass and coverage reports are generated]**

"Quality is ensured through comprehensive testing. Our test suite covers..."
- Show test results: "90%+ code coverage"
- "Unit tests for authentication, API endpoints, form validation, and profile management"
