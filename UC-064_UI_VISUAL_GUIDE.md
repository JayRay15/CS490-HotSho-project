# UC-064: Company Research UI/UX Visual Guide

## 🎯 Where to Find the UI Changes

### **Location 1: Jobs Page - Job Detail Modal**
**Path:** `/frontend/src/pages/auth/Jobs.jsx`  
**Integration Line:** ~2950  

When you click on a job in the Jobs page, the detail modal now includes a new section:

```
┌─────────────────────────────────────────────────────────┐
│  Job Details Modal                                      │
├─────────────────────────────────────────────────────────┤
│  [Company Information Card]                             │
│  [Company News Section]                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔍 Comprehensive Company Research               │   │
│  │ ─────────────────────────────────────────────── │   │
│  │ [Load Research Button] [Export] [Refresh]       │   │
│  │                                                  │   │
│  │ [Tab Navigation Bar]                            │   │
│  │  📊 Overview | 🎯 Culture | 🚀 Products | ...  │   │
│  │                                                  │   │
│  │ [Tab Content Area - Dynamic]                    │   │
│  └─────────────────────────────────────────────────┘   │
│  [Job Description]                                      │
│  [Requirements]                                         │
└─────────────────────────────────────────────────────────┘
```

### **Location 2: Standalone Demo Page**
**Path:** `/test-company-research.html` (root directory)

Open directly in browser to test without backend integration needed.

---

## 🎨 Visual Components Breakdown

### **1. Header Section**
```
┌────────────────────────────────────────────────────────┐
│  Google Research Report                                │
│  Quality Score: [85%] 🟢                               │
│  Generated: Nov 10, 2025 at 2:30 PM                   │
│  [📥 Export JSON] [📄 Export TXT] [🔄 Refresh]         │
└────────────────────────────────────────────────────────┘
```

**Quality Badge Colors:**
- 🟢 **Green (80-100%)**: High-quality comprehensive data
- 🟡 **Yellow (60-79%)**: Good data with some gaps
- 🔴 **Red (0-59%)**: Limited data available

---

### **2. Tab Navigation (6 Tabs)**

```
┌────┬────┬────┬────┬────┬────┐
│📊  │🎯  │🚀  │👔  │🏆  │📱  │
│Over│Cul │Prod│Lead│Comp│Soci│
│view│ture│ucts│    │    │al  │
└────┴────┴────┴────┴────┴────┘
```

Each tab has distinct visual styling:
- **Active tab**: Blue bottom border + blue text
- **Inactive tabs**: Gray text + hover effects

---

### **3. Tab Content Examples**

#### **📊 Overview Tab**
```
┌─────────────────────────────────────────┐
│  Basic Information                      │
│  ┌──────────────┬──────────────┐        │
│  │ 🏢 Industry  │ 👥 Size      │        │
│  │ Technology   │ 10,000+      │        │
│  ├──────────────┼──────────────┤        │
│  │ 📍 HQ        │ 📅 Founded   │        │
│  │ CA, USA      │ 1998         │        │
│  └──────────────┴──────────────┘        │
│                                         │
│  Website                                │
│  🔗 https://google.com                  │
└─────────────────────────────────────────┘
```

**Info Card Styling:**
- Light gray background
- Shadow on hover
- Icon + Label + Value format
- Responsive 2-column grid

---

#### **🎯 Mission & Culture Tab**
```
┌─────────────────────────────────────────┐
│  🎯 Mission Statement                   │
│  ┌───────────────────────────────────┐  │
│  │ "To organize the world's          │  │
│  │  information and make it          │  │
│  │  universally accessible..."       │  │
│  └───────────────────────────────────┘  │
│  (Blue left border, light blue bg)      │
│                                         │
│  💎 Core Values                         │
│  ┌──────────────┬──────────────┐        │
│  │ • Innovation │ • Excellence │        │
│  │              │              │        │
│  ├──────────────┼──────────────┤        │
│  │ • Integrity  │ • Teamwork   │        │
│  └──────────────┴──────────────┘        │
│  (Green left border, light green bg)    │
│                                         │
│  🌟 Company Culture                     │
│  ┌───────────────────────────────────┐  │
│  │ Fast-paced, innovative...         │  │
│  └───────────────────────────────────┘  │
│  (Purple left border, light purple bg)  │
└─────────────────────────────────────────┘
```

**Color Scheme:**
- Mission: Blue (`bg-blue-50`, `border-blue-400`)
- Values: Green (`bg-green-50`, `border-green-400`)
- Culture: Purple (`bg-purple-50`, `border-purple-400`)

---

#### **🚀 Products & Services Tab**
```
┌─────────────────────────────────────────┐
│  🚀 Main Products                       │
│  • Google Search                        │
│  • Gmail                                │
│  • Google Cloud                         │
│  • Android                              │
│                                         │
│  ⚙️ Technologies                        │
│  [TensorFlow] [Kubernetes] [Go]        │
│  [Python]     [AI/ML]      [Cloud]     │
│  (Rounded pill badges, indigo color)    │
│                                         │
│  💡 Recent Innovations                  │
│  ✨ Gemini AI launched...               │
│  ✨ Quantum computing breakthrough...   │
└─────────────────────────────────────────┘
```

**Technology Tags:**
- Rounded full badges (`rounded-full`)
- Indigo background (`bg-indigo-100`)
- Indigo text (`text-indigo-700`)
- Flexbox wrap layout

---

#### **👔 Leadership Tab**
```
┌─────────────────────────────────────────┐
│  👔 Key Executives                      │
│  ┌───────────────────────────────────┐  │
│  │ Sundar Pichai                     │  │
│  │ CEO                               │  │
│  │ Former Product Chief, joined...  │  │
│  └───────────────────────────────────┘  │
│  (Blue left border, gray background)    │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Ruth Porat                        │  │
│  │ CFO                               │  │
│  │ Former Morgan Stanley CFO...      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📖 Leadership Philosophy               │
│  ┌───────────────────────────────────┐  │
│  │ Focus on long-term innovation...  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Executive Cards:**
- Name: Bold, large text
- Title: Blue color, smaller text
- Background: Grayed section with border
- Vertical stacking layout

---

#### **🏆 Competitive Landscape Tab**
```
┌─────────────────────────────────────────┐
│  🏆 Main Competitors                    │
│  [Microsoft] [Amazon] [Meta]            │
│  [Apple]     [IBM]                      │
│  (Red background badges)                │
│                                         │
│  📊 Market Position                     │
│  ┌───────────────────────────────────┐  │
│  │ Leading position in search and... │  │
│  └───────────────────────────────────┘  │
│  (Green left border, light green bg)    │
│                                         │
│  ✨ Unique Value Proposition           │
│  ┌───────────────────────────────────┐  │
│  │ Comprehensive ecosystem...        │  │
│  └───────────────────────────────────┘  │
│  (Purple left border, light purple bg)  │
│                                         │
│  📈 Industry Trends                     │
│  📌 Cloud computing growth...           │
│  📌 AI integration...                   │
│  📌 Privacy concerns...                 │
└─────────────────────────────────────────┘
```

**Competitor Badges:**
- Red background (`bg-red-100`)
- Red text (`text-red-700`)
- Rounded corners (`rounded-lg`)
- Bold font weight

---

#### **📱 Social Media Tab**
```
┌─────────────────────────────────────────┐
│  🔗 Official Social Media Links         │
│                                         │
│  [LinkedIn] 🔗 linkedin.com/company/... │
│  [Twitter]  🔗 twitter.com/google       │
│  [Facebook] 🔗 facebook.com/google      │
│  [Instagram] 🔗 instagram.com/google    │
│  [YouTube]  🔗 youtube.com/google       │
│  [GitHub]   🔗 github.com/google        │
│                                         │
│  (Blue clickable links with icons)      │
└─────────────────────────────────────────┘
```

**Platform Links:**
- Icon + Platform name + URL
- Blue text (`text-blue-600`)
- Underline on hover
- Opens in new tab (`target="_blank"`)

---

## 🎬 User Interaction Flow

### **In Jobs Page Modal:**

1. **User opens job details**
   ```
   Click job card → Modal opens
   ```

2. **Scroll to Company Research section**
   ```
   [Company Info] → [News] → [Research 🆕]
   ```

3. **Click "Load Research" button**
   ```
   Button → Loading spinner → Research data loads
   ```

4. **Navigate tabs to explore**
   ```
   Click tabs → Content switches instantly
   ```

5. **Export data if needed**
   ```
   Click "Export JSON" → File downloads
   ```

---

## 📐 Responsive Design

### **Desktop (1024px+)**
```
┌─────────────────────────────────────────┐
│  [Tab 1] [Tab 2] [Tab 3] [Tab 4] ...   │
│  ───────────────────────────────────    │
│  ┌─────────────┬─────────────┐          │
│  │  Card 1     │  Card 2     │          │
│  │             │             │          │
│  └─────────────┴─────────────┘          │
│  (2-column grid)                        │
└─────────────────────────────────────────┘
```

### **Tablet (768px-1023px)**
```
┌──────────────────────────────┐
│  [Tab 1] [Tab 2] [Tab 3]... │
│  ────────────────────────    │
│  ┌────────────────────────┐  │
│  │  Card 1                │  │
│  │                        │  │
│  ├────────────────────────┤  │
│  │  Card 2                │  │
│  └────────────────────────┘  │
│  (Single column)             │
└──────────────────────────────┘
```

### **Mobile (< 768px)**
```
┌──────────────────┐
│ [T1][T2][T3]...  │
│ ────────────     │
│ ┌──────────────┐ │
│ │ Card 1       │ │
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │ Card 2       │ │
│ └──────────────┘ │
│ (Stacked)        │
└──────────────────┘
```

---

## 🎨 Tailwind CSS Classes Used

### **Component Structure:**
```css
/* Container */
.bg-white .rounded-lg .shadow-lg

/* Header */
.flex .items-center .justify-between
.text-2xl .font-bold .text-gray-900

/* Quality Badge */
.px-3 .py-1 .rounded-full .text-sm .font-medium
/* Green: .bg-green-100 .text-green-600 */
/* Yellow: .bg-yellow-100 .text-yellow-600 */
/* Red: .bg-red-100 .text-red-600 */

/* Tabs */
.border-b-2 .px-4 .py-2 .text-sm .font-medium
/* Active: .border-blue-500 .text-blue-600 */
/* Inactive: .border-transparent .text-gray-500 */

/* Info Cards */
.bg-gray-50 .p-4 .rounded-lg .shadow-sm
.hover:shadow-md .transition-shadow

/* Content Boxes */
.p-4 .rounded-lg .border-l-4
/* Blue: .bg-blue-50 .border-blue-400 */
/* Green: .bg-green-50 .border-green-400 */
/* Purple: .bg-purple-50 .border-purple-400 */
```

---

## 🚀 How to Test the UI

### **Option 1: Demo Page (Easiest)**
```bash
# 1. Start backend server
cd backend
npm start

# 2. Open demo page in browser
open test-company-research.html
# or manually navigate to: file:///path/to/test-company-research.html

# 3. Enter company name and test
```

### **Option 2: Jobs Page Integration**
```bash
# 1. Start both servers
cd backend && npm start
cd frontend && npm run dev

# 2. Navigate to Jobs page
http://localhost:5173/dashboard/jobs

# 3. Click any job card
# 4. Scroll to "Comprehensive Company Research"
# 5. Click "Load Research" button
```

### **Option 3: Direct Component Test**
```bash
# Create test page in frontend/src/pages/auth/TestResearch.jsx
import CompanyResearchReport from "../../components/CompanyResearchReport";

export default function TestResearch() {
  return (
    <div className="p-8">
      <CompanyResearchReport 
        companyName="Google" 
        autoLoad={true}
      />
    </div>
  );
}
```

---

## 📊 Component Props

```typescript
interface CompanyResearchReportProps {
  companyName: string;              // Required: Company to research
  jobDescription?: string;          // Optional: Context for research
  website?: string;                 // Optional: Company website
  autoLoad?: boolean;               // Optional: Auto-load on mount (default: true)
}
```

**Usage Examples:**

```jsx
// Minimal - just company name
<CompanyResearchReport companyName="Google" />

// With job context
<CompanyResearchReport 
  companyName="Microsoft"
  jobDescription="Senior Software Engineer - Azure Cloud"
/>

// Full context
<CompanyResearchReport 
  companyName="Amazon"
  jobDescription="ML Engineer"
  website="https://amazon.com"
  autoLoad={false}  // Requires manual "Load" button click
/>
```

---

## 🎯 Integration Status

### ✅ **Completed:**
- Component created: `/frontend/src/components/CompanyResearchReport.jsx`
- Demo page created: `/test-company-research.html`
- **Jobs page integrated**: Added to job detail modal (~line 2950)
- Import statement added
- Card wrapper with proper styling

### 📋 **To Test:**
1. Run frontend: `cd frontend && npm run dev`
2. Run backend: `cd backend && npm start`
3. Open Jobs page
4. Click any job card
5. Scroll down to see the new research section
6. Click "Load Research" button to fetch data

---

## 🔧 Customization Options

### **Change Tab Colors:**
```jsx
// In CompanyResearchReport.jsx, find:
className={`... ${
  activeTab === tab.id
    ? 'border-blue-500 text-blue-600'  // ← Change these
    : 'border-transparent text-gray-500'
}`}
```

### **Change Quality Badge Thresholds:**
```jsx
const getDataQualityColor = (quality) => {
  if (quality >= 80) return 'text-green-600 bg-green-100';  // ← Adjust
  if (quality >= 60) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};
```

### **Disable Auto-load:**
```jsx
<CompanyResearchReport 
  companyName={job.company}
  autoLoad={false}  // ← User must click "Load Research" button
/>
```

---

## 📸 Visual Mockup

```
╔════════════════════════════════════════════════════════════╗
║  Google Research Report                    Quality: 85% 🟢 ║
║  Generated: Nov 10, 2025 at 2:30 PM                       ║
║  [📥 JSON] [📄 TXT] [🔄 Refresh]                          ║
╠════════════════════════════════════════════════════════════╣
║ 📊 Overview | 🎯 Culture | 🚀 Products | 👔 Leadership    ║
║            | 🏆 Competitive | 📱 Social Media              ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Basic Information                                         ║
║  ┏━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━┓                   ║
║  ┃ 🏢 Industry     ┃ 👥 Company Size ┃                   ║
║  ┃ Technology      ┃ 10,000+         ┃                   ║
║  ┣━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━┫                   ║
║  ┃ 📍 Headquarters ┃ 📅 Founded      ┃                   ║
║  ┃ Mountain View   ┃ 1998            ┃                   ║
║  ┗━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━┛                   ║
║                                                            ║
║  Website                                                   ║
║  🔗 https://google.com                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🎓 Learning Resources

**For understanding the code:**
- Read: `/frontend/src/components/CompanyResearchReport.jsx`
- Demo: Open `/test-company-research.html` in browser
- Documentation: `UC-064_HOW_TO_USE.md`

**For modifying styles:**
- Tailwind CSS docs: https://tailwindcss.com/docs
- Component uses Tailwind utility classes
- All styles are inline (no separate CSS file)

---

## 💡 Tips for Developers

1. **Use autoLoad={false}** in production to save API calls
2. **Cache research data** in job object to avoid re-fetching
3. **Customize colors** to match your brand
4. **Add loading skeletons** for better UX
5. **Monitor API usage** - Gemini AI has rate limits

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify backend is running on port 5001
3. Test with demo page first
4. Review `UC-064_TROUBLESHOOTING.md` (if created)
5. Check API endpoints in `backend/src/routes/companyRoutes.js`

---

**Last Updated:** November 10, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
