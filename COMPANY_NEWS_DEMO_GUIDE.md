# Company News Feature - Visual Demo Guide

## 🎬 Quick Demo Walkthrough

This guide shows you exactly how to verify the Company News feature is working correctly.

---

## 🚀 Pre-Demo Setup (5 minutes)

### 1. Verify Services Running
```bash
# Check backend (should be on port 5001)
curl -s http://localhost:5001/api/companies/news?company=Google | head -c 100

# Check frontend (should be on port 5173)
curl -s http://localhost:5173 | grep title
```

**Expected:** Both should respond without errors

### 2. Open Application
```
Open browser: http://localhost:5173
```

---

## 📋 Demo Scenario 1: View Company News (3 minutes)

### Step 1: Navigate to Jobs
1. Login to application
2. Click "Jobs" in sidebar
3. Click on any existing job OR create a new one with company name

### Step 2: View Company News Section
**Look for:**
- ✅ Blue card titled "Company News & Updates"
- ✅ Summary banner at top with key highlights
- ✅ Category filter buttons (💰 Funding, 🚀 Products, etc.)
- ✅ Sort dropdown
- ✅ Refresh and Export buttons

### Step 3: Verify News Items
**Each news item should show:**
- ✅ Title (clickable link)
- ✅ Category badge (colored)
- ✅ Sentiment emoji (😊/😐/😟)
- ✅ Relevance badge (High/Medium/Low)
- ✅ Date (📅 formatted)
- ✅ Source (📰 name)
- ✅ Relevance score (⭐ X/10)
- ✅ Summary text
- ✅ Key Points section (gray box with 🔑)
- ✅ Tags (gray pills at bottom)

**Screenshot:** Take screenshot showing complete news section

---

## 🔍 Demo Scenario 2: Filter and Sort (2 minutes)

### Step 1: Test Category Filtering
1. Click "🚀 Products" button
   - **Expected:** Only product_launch news shows
2. Click "💰 Funding" button
   - **Expected:** Only funding news shows
3. Click "📰 All News" button
   - **Expected:** All categories show again

### Step 2: Test Sorting
1. Select "Sort by Date" from dropdown
   - **Expected:** News reorders by date (newest first)
2. Select "Sort by Relevance" from dropdown
   - **Expected:** News reorders by score (highest first)

**Screenshot:** Take screenshot showing filtered view

---

## 📥 Demo Scenario 3: Export News (2 minutes)

### Step 1: Open Export Modal
1. Click "📥 Export" button
   - **Expected:** Modal appears with two format options

### Step 2: Export as Text
1. Click "📄 Text Format (.txt)" button
   - **Expected:** File downloads to Downloads folder
2. Open downloaded file
   - **Expected:** See formatted text like:
     ```
     COMPANY NEWS SUMMARY - GOOGLE
     Generated: 11/9/2025
     ============================================================
     
     OVERVIEW:
     Recent developments...
     
     KEY HIGHLIGHTS:
     • Item 1
     • Item 2
     
     RECENT NEWS (X items):
     ============================================================
     
     1. Title
        Category: ... | Sentiment: ... | Relevance: X/10
        ...
     ```

### Step 3: Export as JSON
1. Click "📥 Export" again
2. Click "📊 JSON Format (.json)" button
   - **Expected:** JSON file downloads
3. Open in text editor
   - **Expected:** Valid JSON with structure:
     ```json
     {
       "company": "...",
       "exportDate": "...",
       "summary": {...},
       "news": [...],
       "metadata": {...}
     }
     ```

**Screenshot:** Take screenshot of downloaded files

---

## 🔄 Demo Scenario 4: Refresh News (1 minute)

### Step 1: Click Refresh
1. Click "↻ Refresh" button
   - **Expected:** Loading spinner appears briefly
   - **Expected:** News updates (if available)
   - **Expected:** No errors in console

### Step 2: Verify Update
1. Check if dates are current
2. Check if relevance scores updated
3. Check if any new items appeared

---

## 🎨 Demo Scenario 5: Visual Verification (2 minutes)

### Verify Colors
Check that category badges have correct colors:
- ✅ 💰 Funding → Green (`bg-green-100 text-green-800`)
- ✅ 🚀 Products → Blue (`bg-blue-100 text-blue-800`)
- ✅ 👥 Hiring → Purple (`bg-purple-100 text-purple-800`)
- ✅ 🤝 M&A → Orange (`bg-orange-100 text-orange-800`)
- ✅ 🔗 Partnerships → Indigo (`bg-indigo-100 text-indigo-800`)
- ✅ 👔 Leadership → Pink (`bg-pink-100 text-pink-800`)
- ✅ 🏆 Awards → Yellow (`bg-yellow-100 text-yellow-800`)
- ✅ 📢 General → Gray (`bg-gray-100 text-gray-800`)

### Verify Relevance Badges
- ✅ High (8-10) → Green badge
- ✅ Medium (6-7) → Yellow badge
- ✅ Low (0-5) → Gray badge

### Verify Sentiment Indicators
- ✅ 😊 Positive → Green border
- ✅ 😐 Neutral → Gray border
- ✅ 😟 Negative → Red border

**Screenshot:** Take screenshot showing different colored badges

---

## 🔗 Demo Scenario 6: Integration Testing (3 minutes)

### Step 1: Create New Job with Auto-Fill
1. Click "Create New Job"
2. Enter company name: "Google"
3. Click auto-fill icon (wand icon)
   - **Expected:** Company info populates including news
4. Scroll down to see company info fields filled
5. Save job

### Step 2: Verify Saved News
1. Close job form
2. Find and click on newly created job
3. Scroll to Company News section
   - **Expected:** News items from auto-fill are displayed
   - **Expected:** Can still filter, sort, export

### Step 3: Test Manual Edit
1. Click "Edit Job"
2. Modify some fields (not news)
3. Save
4. View job details again
   - **Expected:** News persists unchanged

**Screenshot:** Take screenshot showing auto-filled company news

---

## 📱 Demo Scenario 7: Responsive Design (2 minutes)

### Step 1: Desktop View (≥1024px)
- ✅ Category buttons on one row
- ✅ Controls aligned horizontally
- ✅ News items in optimal layout
- ✅ Modal centered on screen

### Step 2: Tablet View (768-1023px)
1. Resize browser to ~800px width
   - ✅ Category buttons wrap to multiple rows
   - ✅ Single column news layout
   - ✅ All content readable

### Step 3: Mobile View (≤767px)
1. Resize browser to ~375px width OR use Chrome DevTools
   - ✅ Compact layout
   - ✅ Category icons visible
   - ✅ Touch-friendly buttons
   - ✅ Modal full-screen
   - ✅ Text readable without zoom

**Screenshot:** Take screenshots at each breakpoint

---

## 🔧 Demo Scenario 8: API Testing (5 minutes)

### Test 1: Fetch Company News
```bash
curl -s "http://localhost:5001/api/companies/news?company=Google&limit=3" | python3 -m json.tool
```

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "company": "Google",
    "news": [
      {
        "title": "...",
        "category": "...",
        "relevanceScore": 8,
        "sentiment": "positive",
        ...
      }
    ],
    "summary": {
      "summary": "Recent developments...",
      "highlights": ["• ...", "• ..."],
      "totalItems": 3,
      "averageRelevance": "8.7"
    }
  }
}
```

### Test 2: Filter by Category
```bash
curl -s "http://localhost:5001/api/companies/news?company=Google&category=hiring"
```

**Expected:** Only hiring category items returned

### Test 3: Export Text
```bash
curl -s "http://localhost:5001/api/companies/news/export?company=Google&format=text" | head -20
```

**Expected:** Formatted text output with title, overview, highlights

### Test 4: Export JSON
```bash
curl -s "http://localhost:5001/api/companies/news/export?company=Google&format=json" | python3 -m json.tool | head -30
```

**Expected:** Valid JSON structure

### Test 5: Test Multiple Companies
```bash
for company in Google Microsoft Apple Amazon Tesla; do
  echo "=== $company ==="
  curl -s "http://localhost:5001/api/companies/news?company=$company&limit=1" | python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"Found {len(data['data']['news'])} news items\")"
  echo
done
```

**Expected:** All companies return news data

**Screenshot:** Take screenshot of terminal output

---

## ✅ Verification Checklist

### Frontend Verification
- [ ] Company News section renders
- [ ] Summary banner displays
- [ ] Category filters work
- [ ] Sort dropdown works
- [ ] Refresh button functional
- [ ] Export modal opens
- [ ] Export text downloads
- [ ] Export JSON downloads
- [ ] News items show all fields
- [ ] Category badges colored correctly
- [ ] Relevance badges show
- [ ] Sentiment emojis display
- [ ] Key points visible
- [ ] Tags display
- [ ] External links open
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] Loading states work
- [ ] Empty states work
- [ ] Error messages display

### Backend Verification
- [ ] GET /api/companies/news works
- [ ] Category filtering works
- [ ] Relevance filtering works
- [ ] Limit parameter works
- [ ] Export text works
- [ ] Export JSON works
- [ ] Wikipedia API integrates
- [ ] Sample data generates
- [ ] Categorization accurate
- [ ] Relevance scoring logical
- [ ] Sentiment analysis works
- [ ] Key points extracted
- [ ] Tags generated
- [ ] No 500 errors
- [ ] Response times good

### Integration Verification
- [ ] Auto-fill populates news
- [ ] News saves with job
- [ ] News loads on view
- [ ] Can update without losing news
- [ ] Export works from job view
- [ ] Filter persists during session
- [ ] Sort persists during session

---

## 🎓 Demo Script for Presentation

### Introduction (1 min)
"I'll demonstrate the Company News feature which helps users stay informed about companies they're applying to."

### Show News Display (2 min)
"Here you can see recent news about [Company]. Notice:
- News is automatically categorized (Funding, Products, Hiring, etc.)
- Each item has a relevance score from 0-10
- Sentiment analysis shows if news is positive, neutral, or negative
- Key points are extracted for quick reading
- Tags help identify themes"

### Show Filtering (1 min)
"You can filter by category. Let me show you only hiring news... and now only product launches. The 'All News' button resets the filter."

### Show Sorting (1 min)
"Sort by relevance shows the most important news first. Sort by date shows the newest items first."

### Show Export (2 min)
"For job applications, you can export news summaries. The text format is perfect for cover letters - see how it's formatted professionally. The JSON format is great if you want to analyze the data further."

### Show Auto-Fill (1 min)
"When creating a new job, the auto-fill feature fetches news automatically. Watch as I enter 'Google' and click auto-fill... and now we have all the company info including recent news."

### Conclusion (1 min)
"This feature helps job seekers reference current events in applications and interviews, making them more informed candidates."

---

## 📸 Required Screenshots

For complete documentation, capture these screenshots:

1. **Full News Section** - Showing summary banner, filters, and news items
2. **Category Filtering** - Showing one category filtered
3. **Export Modal** - Showing both export options
4. **Exported Text File** - Open .txt file in editor
5. **Exported JSON File** - Open .json file in editor
6. **Auto-Fill Result** - New job form with populated news
7. **Mobile View** - Company news on mobile device
8. **API Response** - Terminal showing curl output
9. **Different Categories** - Multiple news items with different category badges
10. **Key Points Expanded** - News item showing 3 key points

---

## 🎯 Success Criteria

Demo is successful if:
- ✅ All 8 scenarios complete without errors
- ✅ All visual elements display correctly
- ✅ All interactive features work
- ✅ Export generates valid files
- ✅ API responds correctly
- ✅ Mobile view is functional
- ✅ No console errors
- ✅ Performance is good (<2 sec load)

---

## 🆘 Troubleshooting

### Issue: No News Displays
**Solution:** Check that company name is valid and backend is running

### Issue: Export Doesn't Download
**Solution:** Check browser popup blocker and Content-Disposition headers

### Issue: Categories Not Filtering
**Solution:** Check that `selectedCategory` state updates correctly

### Issue: API Returns 500
**Solution:** Check backend logs for errors in newsService.js

### Issue: Styles Look Wrong
**Solution:** Verify Tailwind CSS is loading and classes are correct

---

## 📞 Demo Support

**Files to Reference:**
- Feature Docs: `/COMPANY_NEWS_FEATURE.md`
- Implementation: `/COMPANY_NEWS_IMPLEMENTATION_COMPLETE.md`
- Verification: `/COMPANY_NEWS_VERIFICATION_GUIDE.md`

**Code Locations:**
- Frontend: `/frontend/src/components/CompanyNewsSection.jsx`
- Backend: `/backend/src/utils/newsService.js`
- API: `/backend/src/controllers/companyController.js`

**Quick Test:**
```bash
# Test API is working
curl -s "http://localhost:5001/api/companies/news?company=Google&limit=1"
```

---

**Demo Date:** November 9, 2025  
**Status:** ✅ Ready for Presentation  
**Estimated Demo Time:** 15-20 minutes
