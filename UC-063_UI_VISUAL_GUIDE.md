# UC-063: UI Elements Visual Guide

## Where to Find Job Matching Features

### 1. Job Cards - "Match Score" Button

**Location:** On each individual job card in the pipeline view

**Visual:**
```
┌─────────────────────────────────────────┐
│ ✓ Software Engineer                     │
│   Tech Corp                             │
│   📍 Remote | 💼 Full-time              │
│   💰 $120k - $150k                      │
│   ───────────────────────────────────   │
│   📅 Applied: Nov 1, 2025               │
│   ⏰ Deadline: Nov 30, 2025             │
│   ───────────────────────────────────   │
│   🏷️ react, typescript, nodejs          │
│   ───────────────────────────────────   │
│   [Edit] [📅 Schedule] [💰 Salary]     │
│   [🎯 Skill Gaps] [✨ Match Score] ← NEW│
└─────────────────────────────────────────┘
```

**Button Appearance:**
- Icon: ✨ (sparkles emoji)
- Text: "Match Score"
- Color: Green background (bg-green-100)
- Hover: Slightly darker green (bg-green-200)
- Font: Small, bold, green text

---

### 2. Controls Section - "Compare Matches" Button

**Location:** Top controls bar, between "Auto-Archive" and "Add Job"

**Visual:**
```
┌──────────────────────────────────────────────────────────────────┐
│  Job Application Tracker                                         │
│  Track your job applications through each stage...               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📊 [Stats Cards showing counts for each pipeline stage]        │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│  [Search: _________________________________]                     │
│                                                                   │
│  [Filter by Status ▼] [Sort By ▼] [Order ▼]                    │
│  [More Filters] [Calendar View] [Statistics]                     │
│  [Show Archived] [Auto-Archive] [Compare Matches] [Add Job]     │
│                                         ↑ NEW                    │
└──────────────────────────────────────────────────────────────────┘
```

**Button Appearance:**
- Text: "Compare Matches"
- Color: Gray background (secondary style)
- Only visible when viewing active jobs (not archived)
- Located after "Auto-Archive" button

---

### 3. Match Score Modal

**Triggered by:** Clicking "✨ Match Score" on any job card

**Visual:**
```
════════════════════════════════════════════════════════════
║                                                      ×   ║
║  Job Match Analysis                                     ║
║                                                          ║
║  ┌────────────────────────────────────────────────────┐ ║
║  │ [Overview] [Strengths] [Gaps] [Suggestions]       │ ║
║  └────────────────────────────────────────────────────┘ ║
║                                                          ║
║  ╔════════════════════════════════════════════════╗   ║
║  ║  Overall Match Score                           ║   ║
║  ║  ────────────────────────────────────────      ║   ║
║  ║         78%                                    ║   ║
║  ║         Good Match                             ║   ║
║  ╚════════════════════════════════════════════════╝   ║
║                                                          ║
║  ┌─ Skills (85%) ───────────────────────── 40% ─────┐ ║
║  │ ████████████████████████░░░░░░          85%      │ ║
║  │ Matched: JavaScript, React, Node.js              │ ║
║  │ Missing: Python                                   │ ║
║  └────────────────────────────────────────────────┘ ║
║                                                          ║
║  ┌─ Experience (75%) ──────────────────── 30% ─────┐ ║
║  │ ██████████████████░░░░░░░░░░░░          75%      │ ║
║  │ 3.5 years (3 required) | Industry Match ✓        │ ║
║  └────────────────────────────────────────────────┘ ║
║                                                          ║
║  [... Education and Additional sections ...]            ║
║                                                          ║
║                                     [Close]             ║
════════════════════════════════════════════════════════════
```

**Features:**
- Tabs: Overview, Strengths, Gaps, Suggestions
- Color-coded scores (green for high, yellow for medium, red for low)
- Progress bars for each category
- Detailed breakdowns with matched/missing items
- Scrollable content
- Backdrop blur effect

---

### 4. Compare Matches Modal

**Triggered by:** Clicking "Compare Matches" in controls

**Visual:**
```
══════════════════════════════════════════════════════════════
║                                                        ×   ║
║  Compare Job Matches                                      ║
║                                                            ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │  📊 Summary Statistics                              │ ║
║  │  ──────────────────────────────────────────────     │ ║
║  │  Total Jobs: 5 | Best: 85% | Average: 73%          │ ║
║  │  Good Matches: 3                                    │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                            ║
║  [Sort By: Score ▼]  [Filter: All ▼]                     ║
║                                                            ║
║  ┌─ #1 Software Engineer @ Google ─────────────── 85% ┐ ║
║  │ Excellent Match                                     │ ║
║  │ Skills: 90% | Experience: 80% | Education: 85%     │ ║
║  │ 12 Strengths | 2 Gaps | 3 Suggestions              │ ║
║  │                               [View Details]        │ ║
║  └────────────────────────────────────────────────────┘ ║
║                                                            ║
║  ┌─ #2 Full Stack Developer @ Meta ────────────── 78% ┐ ║
║  │ Good Match                                          │ ║
║  │ Skills: 85% | Experience: 75% | Education: 70%     │ ║
║  │ 10 Strengths | 4 Gaps | 5 Suggestions              │ ║
║  │                               [View Details]        │ ║
║  └────────────────────────────────────────────────────┘ ║
║                                                            ║
║  [... More jobs ...]                                      ║
║                                                            ║
║                                          [Close]          ║
══════════════════════════════════════════════════════════════
```

**Features:**
- Summary statistics at top
- Ranked list of jobs by match score
- Mini category breakdowns for each job
- Quick stats (strengths/gaps/suggestions count)
- Sortable and filterable
- Click to view full details
- Scrollable list

---

## Color Coding

### Match Score Grades:
- **Excellent** (85-100%): 🟢 Green background
- **Good** (70-84%): 🔵 Blue background
- **Fair** (55-69%): 🟡 Yellow background
- **Poor** (0-54%): 🔴 Red background

### Button Colors:
- **Match Score Button**: 🟢 Green (bg-green-100/200)
- **Compare Matches Button**: ⚪ Gray (secondary style)

### Progress Bars:
- Use gradient from green (high) to red (low)
- Show percentage value next to bar
- Color matches score level

---

## Responsive Design

### Desktop (>1024px):
- Modals: Max width 4xl (1024px) for single match, 6xl (1280px) for comparison
- Job cards: Multiple columns in pipeline
- Full feature set visible

### Tablet (768px - 1024px):
- Modals: Max width 90% viewport
- Job cards: 2-3 columns
- Buttons may wrap to multiple rows

### Mobile (<768px):
- Modals: Full width with padding
- Job cards: Single column
- Buttons stack vertically
- Touch-friendly button sizes

---

## Accessibility Features

### Keyboard Navigation:
- All buttons are keyboard accessible
- Modals can be closed with Escape key
- Tab through all interactive elements

### Screen Readers:
- Buttons have descriptive titles
- Progress bars have aria-labels
- Modal roles properly set

### Visual Indicators:
- Hover states on all buttons
- Focus states for keyboard navigation
- High contrast colors for readability

---

## User Flow Examples

### Scenario 1: Quick Match Check
1. User sees job card in pipeline
2. Notices "✨ Match Score" button
3. Clicks button
4. Modal opens showing 78% match (Good)
5. Quickly scans strengths and gaps
6. Closes modal
7. Decides to apply based on good match

### Scenario 2: Comparing Multiple Jobs
1. User has 5 job applications in "Applied" stage
2. Clicks "Compare Matches" in controls
3. Modal opens, automatically calculates all matches
4. Sees ranked list: 85%, 78%, 72%, 65%, 58%
5. Focuses on top 2 jobs
6. Clicks "View Details" on top job
7. Reviews detailed breakdown
8. Decides to prioritize top 2 applications

### Scenario 3: Improving Profile
1. User opens match score for desired job
2. Sees overall score is 65% (Fair)
3. Switches to "Gaps" tab
4. Identifies missing skills: Python, AWS
5. Switches to "Suggestions" tab
6. Sees learning resources for Python and AWS
7. Clicks Coursera link to start learning
8. Plans to update profile and recalculate match

---

## Tips for Best Experience

1. **Ensure profile is complete** - More profile data = better match accuracy
2. **Calculate matches regularly** - After updating profile or adding new jobs
3. **Use comparison for decision making** - Compare 2-5 jobs at once for best insights
4. **Focus on gaps** - Use gap analysis to improve your profile strategically
5. **Check suggestions** - Learning resources can help fill skill gaps
6. **Adjust weights** - Customize what matters most to you (skills vs experience)

---

## What Makes a Good Match?

The algorithm considers:
- **Skills (40% weight)**: How many required skills you have
- **Experience (30% weight)**: Years, relevance, industry, seniority
- **Education (15% weight)**: Degree level, field of study, GPA
- **Additional (15% weight)**: Location, work mode, salary expectations, certifications

**Custom weights can be adjusted per job!**
