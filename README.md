# 🚀 Nirvana ATS

**The Ultimate Career Acceleration Platform**

Nirvana ATS is a comprehensive, AI-powered platform designed to empower job seekers in today's competitive market. Unlike traditional job trackers, this application provides a full suite of tools to manage the entire career advancement lifecycle—from job search and application management to interview preparation and network relationship building.

Built with a modern tech stack and leveraging **Google Gemini AI**, Nirvana ATS acts as a personal career coach, helping candidates optimize their materials, prepare for interviews, and strategically manage their professional network.

---

## ✨ Key Features

### 💼 Smart Job Search & Tracking
- **Kanban Pipeline**: Visualize your job search progress with a drag-and-drop board (Interested, Applied, Interview, Offer, Rejected).
- **Deadline Tracking**: Never miss an application deadline with automated alerts and color-coded urgency indicators.
- **Job Import**: Automatically import job details from URLs to save time.
- **Application Analytics**: Track your success rates and identify bottlenecks in your application funnel.

### 🤖 AI-Powered Content Generation (Powered by Gemini)
- **Tailored Resumes**: Generate ATS-optimized resumes tailored to specific job descriptions using Google Gemini.
- **Smart Cover Letters**: Create personalized, compelling cover letters that highlight relevant experience and company research.
- **Skill Gap Analysis**: Automatically identify missing skills for a target role and get recommendations on how to bridge the gap.
- **Resume Optimization**: Get AI suggestions to improve your resume's impact and ATS score.

### 🎤 Intelligent Interview Preparation
- **Mock Interviews**: Practice with AI-simulated interviews (Behavioral, Technical, Case Study) and get real-time feedback.
- **Technical Prep**: Practice coding challenges, system design questions, and case studies with AI feedback.
- **Question Bank**: Access curated interview questions specific to your target role and industry.
- **Company Research**: Get automated, comprehensive research reports on companies before your interview (Mission, News, Competitors).
- **Response Coaching**: Receive AI feedback on your written answers to improve clarity, impact, and STAR method adherence.
- **Success Predictions**: AI-driven predictions on your interview success probability based on preparation.

### 👥 Network & Mentorship
- **Contact CRM**: Manage professional contacts, track interactions, and set follow-up reminders.
- **Networking ROI**: Analyze the effectiveness of your networking efforts.
- **Mentor Dashboard**: Collaborate with mentors, share progress, and receive feedback on your job search.
- **Peer Support**: Connect with peers for mock interviews and support.

### 📊 Comprehensive Analytics & Goals
- **Performance Dashboard**: View key metrics like application volume, response rates, and interview conversion.
- **Market Intelligence**: Get insights on salary trends, skill demands, and industry outlooks.
- **Productivity Analysis**: Track your time investment and optimize your job search routine.
- **Goal Tracking**: Set and monitor career goals with SMART metrics.

---

## 🛠️ Tech Stack

This project is built with a modern, scalable architecture ensuring high performance and developer experience.

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Authentication**: [Clerk](https://clerk.com/)
- **State Management**: React Context & Custom Hooks
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Rich Text Editor**: [Tiptap](https://tiptap.dev/)
- **Drag & Drop**: @dnd-kit
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: Vitest, React Testing Library

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (v20+)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas)
- **ODM**: [Mongoose](https://mongoosejs.com/)
- **AI Integration**: [Google Gemini API](https://ai.google.dev/) (@google/generative-ai)
- **Authentication**: Clerk Express SDK
- **Document Processing**: PDFKit, Puppeteer, pdf-parse
- **Scheduling**: node-cron
- **External Integrations**: Google APIs, Microsoft Graph
- **Testing**: Jest, Supertest
### DevOps & Tooling
- **Version Control**: Git & GitHub
- **Linting**: ESLint
- **Package Manager**: npm

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- **Node.js** (v20 or higher)
- **npm** (v10 or higher)
- **MongoDB Atlas** account (or local MongoDB instance)
- **Clerk** account for authentication
- **Google Gemini API Key** for AI features

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/JayRay15/CS490-HotSho-project.git
    cd CS490-HotSho-project
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    npm install
    ```
    *   Create a `.env` file in the `backend` directory based on `.env.example`.
    *   Add your `MONGODB_URI`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `GEMINI_API_KEY`.

3.  **Setup Frontend**
    ```bash
    cd ../frontend
    npm install
    ```
    *   Create a `.env` file in the `frontend` directory based on `.env.example`.
    *   Add your `VITE_CLERK_PUBLISHABLE_KEY`.

### Running the Application

1.  **Start the Backend Server**
    ```bash
    # In the backend directory
    npm start
    ```
    The server will start on `http://localhost:5000`.

2.  **Start the Frontend Development Server**
    ```bash
    # In the frontend directory
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.


### Backend `.env`:
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

### Frontend `.env`:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---



## 📂 Project Structure

```
CS490-HotSho-project/
├── backend/                # Express.js API Server
│   ├── src/
│   │   ├── controllers/    # Request handlers (Job, Resume, Interview, etc.)
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helpers (Gemini Service, PDF processing)
│   └── tests/              # Jest unit & integration tests
│
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (Auth, Dashboard, Interviews, etc.)
│   │   ├── contexts/       # React Context providers
│   │   └── services/       # API client services
│   └── public/             # Static assets
│
└── documentation/          # Project documentation & PRDs
```

---

## Original Problem Statement

Job seekers face numerous challenges:
- Scattered application tracking across multiple platforms
- Incomplete or outdated professional profiles
- Difficulty presenting work history, skills, and projects cohesively
- Lack of insights into application status and progress

## Original Solution Description

A centralized platform where candidates can:
- 📝 Build and maintain a comprehensive professional profile
- 💼 Track employment history with rich details and timeline views
- 🎯 Manage skills with proficiency levels and categorization
- 🎓 Document education and certifications
- 🚀 Showcase special projects in a portfolio format
- 📊 Monitor profile completeness and get improvement suggestions
- 🔐 Securely authenticate with OAuth (Google) or email/password

---

## 📅 Development History

- **Sprint 1**: Foundation (Auth, Profile, DB Design)
- **Sprint 2**: Job Search Engine & AI Resume Builder
- **Sprint 3**: Interview Prep Suite, Network Analytics & Advanced Features

---

## 👥 Team

**Hotsho Team - Fall 2025**

*ATS for Candidates Development Team*

**Repository:** [https://github.com/JayRay15/CS490-HotSho-project](https://github.com/JayRay15/CS490-HotSho-project)

--

*Developed for CS 490 Capstone Project - Fall 2025*
