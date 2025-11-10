# UC-064: How to Use Automated Company Research

## 🎯 For Developers

### Backend Integration

**1. Import the service:**
```javascript
import { conductComprehensiveResearch } from './utils/companyResearchService.js';
```

**2. Conduct research:**
```javascript
const research = await conductComprehensiveResearch(
  'Google',                    // Company name (required)
  jobDescription,              // Optional: job context
  'https://google.com'         // Optional: website
);
```

**3. Use the data:**
```javascript
console.log(research.basicInfo.industry);     // "Technology"
console.log(research.metadata.dataQuality);   // 85
console.log(research.leadership.executives);  // Array of execs
```

### Frontend Integration

**1. Import the component:**
```jsx
import CompanyResearchReport from './components/CompanyResearchReport';
```

**2. Add to your page:**
```jsx
function JobDetailsPage({ job }) {
  return (
    <div>
      {/* Other job details */}
      
      <CompanyResearchReport 
        companyName={job.company}
        jobDescription={job.description}
        website={job.companyInfo?.website}
        autoLoad={true}
      />
    </div>
  );
}
```

**3. Handle events (optional):**
```jsx
<CompanyResearchReport 
  companyName={companyName}
  onResearchComplete={(research) => {
    console.log('Research completed!', research);
    // Save to state, update UI, etc.
  }}
/>
```

## 👤 For Users

### Viewing Company Research

**1. Navigate to a job:**
- Go to Jobs page
- Click on any job listing
- Scroll to "Company Research" section

**2. View research tabs:**
- **Overview** - Basic company info
- **Mission & Culture** - Values and culture
- **Products & Services** - What they make
- **Leadership** - Who's in charge
- **Competitive** - Industry position
- **Social Media** - Where to find them

**3. Export the research:**
- Click "Export as Text" for cover letters
- Click "Export as JSON" for programmatic use
- Files download automatically

### Testing with Demo Page

**1. Open the demo:**
```bash
open test-company-research.html
```

**2. Enter company details:**
- Company Name: "Google" (required)
- Job Description: (optional, for better context)
- Website: (optional)

**3. Click "Research Company"**
- Wait 5-10 seconds for comprehensive results
- View all 8 research categories
- Export reports as needed

## 🔍 What Gets Researched

### Overview Tab
```
📊 Basic Information
├── 🏢 Industry
├── 👥 Company Size  
├── 📍 Headquarters
└── 📅 Founded
```

### Mission & Culture Tab
```
🎯 Mission Statement
├── Mission text
├── 💎 Core Values (3-5)
├── 🌟 Company Culture
└── 💼 Work Environment
```

### Products & Services Tab
```
🚀 Main Products
├── Product 1
├── Product 2
└── Product 3

🛠️ Services
⚙️ Technologies
💡 Innovations
```

### Leadership Tab
```
👔 Key Executives
├── CEO - Name & Background
├── CTO - Name & Background
└── CFO - Name & Background

🌟 Other Leaders
📖 Leadership Philosophy
```

### Competitive Tab
```
🏆 Main Competitors
├── Competitor 1
├── Competitor 2
└── Competitor 3

📊 Market Position
✨ Unique Value Proposition
📈 Industry Trends
```

### Social Media Tab
```
📱 Social Profiles
├── 💼 LinkedIn
├── 🐦 Twitter
├── 👥 Facebook
├── 📷 Instagram
├── 📺 YouTube
└── 💻 GitHub
```

## 📊 Understanding Data Quality

### Quality Score Badge
```
🟢 80-100% = Excellent
- All categories have data
- Multiple sources verified
- High confidence

🟡 60-79% = Good
- Most categories covered
- Some minor gaps
- Reliable core data

🔴 0-59% = Limited
- Basic data only
- Many gaps present
- May need manual research
```

## 💡 Tips for Best Results

### 1. Provide Context
```javascript
// ❌ Basic (less accurate)
conductComprehensiveResearch('TechCorp');

// ✅ With context (more accurate)
conductComprehensiveResearch(
  'TechCorp',
  'Senior Software Engineer role working on cloud infrastructure...',
  'https://techcorp.com'
);
```

### 2. Use for Cover Letters
```
1. Export research as text
2. Copy key highlights
3. Reference in cover letter:
   - Recent company achievements
   - Alignment with company values
   - Knowledge of their products
   - Understanding of their mission
```

### 3. Use for Interview Prep
```
Research Areas to Study:
✓ Company mission → Align your goals
✓ Recent news → Show you're informed
✓ Products → Demonstrate interest
✓ Competitors → Show industry knowledge
✓ Leadership → Research interviewer backgrounds
```

## 🚀 Advanced Usage

### Batch Research
```javascript
const companies = ['Google', 'Microsoft', 'Apple'];

const results = await Promise.all(
  companies.map(company => 
    conductComprehensiveResearch(company)
  )
);
```

### Save Research to Database
```javascript
const research = await conductComprehensiveResearch(companyName);

await Job.findByIdAndUpdate(jobId, {
  'companyInfo.research': research,
  'companyInfo.researchDate': new Date()
});
```

### Custom Formatting
```javascript
import { formatComprehensiveResearch } from './utils/companyResearchService.js';

const research = await conductComprehensiveResearch(companyName);
const formatted = formatComprehensiveResearch(research);

// Use formatted.sections for custom display
```

## 🎬 Demo Workflow

### Complete Example
```
1. User creates/views job
2. System automatically fetches research
3. Research displays in tabbed interface
4. User reviews all categories
5. User exports for cover letter
6. User references in application
7. User uses for interview prep
```

## 📱 Mobile Usage

The component is fully responsive:
- **Desktop:** Multi-column layouts
- **Tablet:** Adaptive grids
- **Mobile:** Stacked, scrollable content

## ⚡ Performance Notes

- **Initial Load:** 5-10 seconds
- **Cached Data:** Instant
- **Parallel Requests:** Optimized
- **Quality Scoring:** Real-time

## 🆘 Troubleshooting

### No data displayed?
1. Check company name spelling
2. Add job description for context
3. Verify backend server is running
4. Check API URL configuration

### Low quality score?
1. Provide job description
2. Add company website
3. Use official company name
4. Try alternative name format

### Export not working?
1. Check popup blocker
2. Verify file permissions
3. Try different browser
4. Check backend logs

## 📚 Related Features

- **UC-062:** Company News (integrated)
- **Cover Letters:** Use research for context
- **Interview Prep:** Study from research
- **Job Tracking:** Enhanced company info

---

**Questions?** Check `UC-064_QUICK_REFERENCE.md`  
**Full Details?** See `UC-064_COMPANY_RESEARCH_IMPLEMENTATION.md`
