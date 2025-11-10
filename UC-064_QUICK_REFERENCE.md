# UC-064: Company Research - Quick Reference

## 🚀 Quick Start

### Backend API

```bash
# Basic research
curl "http://localhost:5001/api/companies/research?company=Google"

# With job context
curl "http://localhost:5001/api/companies/research?company=Google&jobDescription=Software%20Engineer"

# Export as text
curl "http://localhost:5001/api/companies/research/export?company=Google&format=text" -o report.txt

# Export as JSON
curl "http://localhost:5001/api/companies/research/export?company=Google&format=json" -o report.json
```

### Frontend Component

```jsx
import CompanyResearchReport from './components/CompanyResearchReport';

<CompanyResearchReport 
  companyName="Google"
  jobDescription="Optional job description"
  website="https://google.com"
  autoLoad={true}
/>
```

## 📊 Research Categories

| Category | Data Provided |
|----------|--------------|
| **Basic Info** | Size, Industry, Headquarters, Founded, Website, Logo |
| **Mission & Culture** | Mission, Values (3-5), Culture, Work Environment |
| **News** | Recent news, Press releases, Major announcements |
| **Leadership** | Executives, Key leaders, Leadership philosophy |
| **Products** | Main products, Services, Technologies, Innovations |
| **Competitive** | Competitors, Market position, Unique value, Trends |
| **Social Media** | LinkedIn, Twitter, Facebook, Instagram, YouTube, GitHub |
| **Summary** | Executive summary, Key highlights, Data quality score |

## 🎯 Data Quality Scores

- **80-100%** 🟢 Excellent - Comprehensive data from multiple sources
- **60-79%** 🟡 Good - Moderate coverage with some gaps
- **0-59%** 🔴 Limited - Basic data only

## 📝 Response Structure

```json
{
  "success": true,
  "data": {
    "research": {
      "companyName": "Google",
      "researchDate": "2025-11-10T...",
      "basicInfo": {
        "name": "Google",
        "size": "10000+",
        "industry": "Technology",
        "headquarters": "Mountain View, CA",
        "founded": 1998,
        "website": "https://google.com",
        "logo": "https://..."
      },
      "missionAndCulture": {
        "mission": "To organize the world's information...",
        "values": ["Innovation", "User focus", ...],
        "culture": "Collaborative, innovation-driven...",
        "workEnvironment": "Hybrid work model..."
      },
      "news": {
        "recentNews": [...],
        "pressReleases": [...],
        "majorAnnouncements": [...]
      },
      "leadership": {
        "executives": [
          {
            "name": "Sundar Pichai",
            "title": "CEO",
            "background": "Leading Google since 2015..."
          }
        ],
        "keyLeaders": ["Name - Title", ...],
        "leadershipInfo": "..."
      },
      "productsAndServices": {
        "mainProducts": ["Search", "Gmail", "Maps", ...],
        "services": [...],
        "technologies": ["ML", "Cloud", ...],
        "innovations": [...]
      },
      "competitive": {
        "mainCompetitors": ["Microsoft", "Amazon", ...],
        "marketPosition": "Global leader in...",
        "uniqueValue": "Comprehensive ecosystem...",
        "industryTrends": [...]
      },
      "socialMedia": {
        "platforms": {
          "linkedin": "https://linkedin.com/company/google",
          "twitter": "https://twitter.com/google",
          ...
        },
        "engagement": "Check their social media..."
      },
      "summary": "Google is a large Technology company...",
      "metadata": {
        "researchSuccess": true,
        "dataQuality": 85,
        "sources": ["AI Analysis", "Public Data", ...],
        "lastUpdated": "2025-11-10T..."
      }
    }
  }
}
```

## 🔧 Testing

```bash
# Run test script
cd backend
node test_scripts/test-company-research.js
```

## 📁 File Locations

```
backend/
  src/
    utils/
      companyResearchService.js    # Core research logic
    controllers/
      companyController.js          # API endpoints
    routes/
      companyRoutes.js              # Route definitions
  test_scripts/
    test-company-research.js        # Test script

frontend/
  src/
    components/
      CompanyResearchReport.jsx     # Main UI component
```

## 🎨 UI Tabs

1. **Overview** 📊 - Basic information and summary
2. **Mission & Culture** 🎯 - Values, mission, culture
3. **Products & Services** 🚀 - Products, tech, innovations
4. **Leadership** 👔 - Executives and leaders
5. **Competitive Landscape** 🏆 - Competition and trends
6. **Social Media** 📱 - Social profiles and links

## ⚡ Performance

- **Parallel Processing:** All data sources queried simultaneously
- **Caching:** Wikipedia responses cached for efficiency
- **Fallback:** Graceful degradation if sources fail
- **Quality Scoring:** Automatic data completeness assessment

## 🔄 Integration

### With Jobs Page
```jsx
// Display research when viewing job details
{viewingJob && (
  <CompanyResearchReport 
    companyName={viewingJob.company}
    jobDescription={viewingJob.description}
  />
)}
```

### With Cover Letter Generation
```javascript
// Use research data for context
import { conductComprehensiveResearch } from './utils/companyResearchService.js';

const research = await conductComprehensiveResearch(companyName, jobDescription);
// Pass research.summary to cover letter generator
```

## 🐛 Troubleshooting

### Backend Not Responding
```bash
# Check if server is running
curl http://localhost:5001/health

# Restart backend
cd backend && npm start
```

### Low Data Quality Score
- Add job description for better context
- Provide company website URL
- Try alternative company name format

### Frontend Not Loading
```bash
# Check API URL in frontend
# Should be: http://localhost:5001
cat frontend/.env
```

## 📚 Documentation

- Full Guide: `UC-064_COMPANY_RESEARCH_IMPLEMENTATION.md`
- API Docs: `backend/API_ENDPOINTS.md`
- Component Props: See `CompanyResearchReport.jsx`

## ✅ Acceptance Criteria

All 9 criteria met:
1. ✅ Basic company information
2. ✅ Mission, values, culture
3. ✅ Recent news
4. ✅ Key executives
5. ✅ Products and services
6. ✅ Competitive landscape
7. ✅ Social media presence
8. ✅ Research summary
9. ✅ Frontend verification

---

**Status:** ✅ Production Ready  
**Date:** November 10, 2025  
**Feature:** UC-064
