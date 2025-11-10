# 🔍 UC-064: Automated Company Research

## Quick Start

### 1. Backend API Test
```bash
# Start backend server (if not running)
cd backend && npm start

# Test research endpoint
curl "http://localhost:5001/api/companies/research?company=Google"
```

### 2. Frontend Demo
```bash
# Open demo page in browser
open test-company-research.html
# or visit: file:///path/to/test-company-research.html
```

### 3. Run Test Script
```bash
cd backend
node test_scripts/test-company-research.js
```

## Features

✅ **Basic Information** - Size, industry, headquarters, founded  
✅ **Mission & Culture** - Mission, values, culture, work environment  
✅ **Recent News** - News, press releases, announcements  
✅ **Leadership** - Executives, key leaders, backgrounds  
✅ **Products** - Products, services, technologies, innovations  
✅ **Competitive** - Competitors, market position, unique value  
✅ **Social Media** - 6 platform profiles  
✅ **Summary** - Executive summary with quality score  

## API Endpoints

### Research
```
GET /api/companies/research?company=<name>&jobDescription=<desc>&website=<url>
```

### Export
```
GET /api/companies/research/export?company=<name>&format=<json|text>
```

## Component Usage

```jsx
import CompanyResearchReport from './components/CompanyResearchReport';

<CompanyResearchReport 
  companyName="Google"
  jobDescription="Optional context"
  website="https://google.com"
  autoLoad={true}
/>
```

## Documentation

- 📖 **Full Guide:** `UC-064_COMPANY_RESEARCH_IMPLEMENTATION.md`
- ⚡ **Quick Ref:** `UC-064_QUICK_REFERENCE.md`
- ✅ **Summary:** `UC-064_COMPLETION_SUMMARY.md`

## Files

### Backend
- `backend/src/utils/companyResearchService.js` - Core logic
- `backend/src/controllers/companyController.js` - Endpoints
- `backend/src/routes/companyRoutes.js` - Routes
- `backend/test_scripts/test-company-research.js` - Tests

### Frontend
- `frontend/src/components/CompanyResearchReport.jsx` - UI component

### Demo
- `test-company-research.html` - Standalone demo

## Status

✅ **COMPLETE** - All 9 acceptance criteria met  
🚀 **Production Ready**  
📅 **November 10, 2025**
