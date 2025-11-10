# 🔧 Company News Troubleshooting & Quick Fix Guide

## Issue: "No news found" message

### ✅ Solution Applied

I've fixed the API connectivity issue by:
1. ✅ Updated `CompanyNewsSection.jsx` to use correct API base URL
2. ✅ Added console logging for debugging
3. ✅ Fixed environment variable name (`VITE_API_BASE_URL`)

### 📋 How to Verify It's Working

#### Step 1: Check Both Servers Are Running

**Backend (port 5001):**
```bash
lsof -ti:5001
# Should return a process ID
```

**Frontend (port 5173):**
```bash
lsof -ti:5173
# Should return a process ID
```

Both servers are currently running ✅

#### Step 2: Test API Directly

```bash
curl "http://localhost:5001/api/companies/news?company=Google&limit=2"
```

**Expected:** JSON response with 2 news items ✅ (VERIFIED WORKING)

#### Step 3: View News in Application

**IMPORTANT:** To see company news, you need a job with a company name!

1. **Login to the application** at http://localhost:5173
2. **Go to Jobs page** (sidebar navigation)
3. **Option A - View existing job:**
   - Click on any existing job that has a company name
   - Scroll down to see "Company News & Updates" section
   
4. **Option B - Create new job with company:**
   - Click "Create New Job" or "+" button
   - Fill in the job title
   - **IMPORTANT:** Enter a company name (e.g., "Google", "Microsoft", "Apple")
   - Optionally click the auto-fill button (wand icon) to populate company info
   - Save the job
   - View the job details
   - Scroll to "Company News & Updates" section

#### Step 4: Check Browser Console

Open browser DevTools (F12 or right-click → Inspect) and check Console tab for:

```
🎬 CompanyNewsSection mounted/updated: {companyName: "Google", ...}
🔍 Fetching news for company: Google
📡 API URL: http://localhost:5001/api/companies/news
✅ API Response: {success: true, ...}
📰 News items set: 3
```

If you see these logs, the feature is working! ✅

---

## 🚨 Common Issues & Solutions

### Issue 1: "No news found" but job has a company name

**Check:**
- Open browser console (F12)
- Look for error messages
- Check if API is being called

**Solution:**
- Make sure backend is running on port 5001
- Check `.env` file in frontend has: `VITE_API_BASE_URL="http://localhost:5001"`
- Restart frontend dev server after .env changes

### Issue 2: CORS errors in console

**Error looks like:**
```
Access to fetch at 'http://localhost:5001/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solution:**
Backend server.js already has CORS configured for localhost:5173. If you see this:
1. Restart backend server
2. Check backend console for CORS configuration log

### Issue 3: "Failed to fetch" error

**Causes:**
- Backend not running
- Wrong API URL

**Solution:**
```bash
# Check backend is running
lsof -ti:5001

# If not running, start it:
cd /Users/tirthpatel/CS490-HotSho-project/backend
node src/server.js
```

### Issue 4: News loads but shows empty

**Check:**
- Company name is correct
- Look at console logs for API response

**Solution:**
- Try with well-known company names: Google, Microsoft, Apple, Amazon, Tesla
- These have sample data that always returns results

---

## 🧪 Quick Test Script

Create a test job to verify everything works:

1. Login to application
2. Go to Jobs page
3. Click "Create New Job"
4. Fill in:
   - **Title:** Software Engineer
   - **Company:** Google
   - **Location:** Mountain View, CA
   - **Status:** Interested
5. Click auto-fill button (wand icon next to company field)
6. Watch company info populate
7. Save job
8. Click on the job to view details
9. Scroll to "Company News & Updates"
10. **You should see:**
    - Summary banner with highlights
    - Category filter buttons
    - 3 news items about Google
    - Each with category badges, scores, etc.

---

## 📊 What You Should See

When everything is working correctly:

### Summary Banner (Blue box at top)
```
📊 News Summary
Recent developments at Google include product_launch, hiring, partnership. 
3 news items tracked, with focus on product_launch.

Key Highlights:
• Google Announces Major Product Innovation (product_launch)
• Google Expands Global Workforce (hiring)
• Google Strategic Partnership Announced (partnership)
```

### Category Filters
```
[📰 All News] [💰 Funding] [🚀 Products] [👥 Hiring] [🤝 M&A] 
[🔗 Partnerships] [👔 Leadership] [🏆 Awards] [📢 General]
```

### News Items
Each news item shows:
- ✅ Title (clickable link)
- ✅ Category badge (colored: green for products, purple for hiring, etc.)
- ✅ Sentiment emoji (😊 positive, 😐 neutral, 😟 negative)
- ✅ Relevance badge (High 8-10, Medium 6-7, Low 0-5)
- ✅ Date and Source
- ✅ Relevance score (⭐ X/10)
- ✅ Summary text
- ✅ Key Points section (gray box with 🔑)
- ✅ Tags (gray pills)

---

## 🎯 Verification Checklist

- [ ] Backend running on port 5001
- [ ] Frontend running on port 5173
- [ ] Can access http://localhost:5173
- [ ] Can login to application
- [ ] Created/viewing job with company name
- [ ] Company News section visible
- [ ] News items display (at least 1-3 items)
- [ ] Category filters work when clicked
- [ ] Sort dropdown works
- [ ] Export button opens modal
- [ ] Browser console shows no errors

---

## 🔍 Debug Commands

### Check if servers are running
```bash
# Backend
lsof -ti:5001 && echo "✅ Backend running" || echo "❌ Backend not running"

# Frontend  
lsof -ti:5173 && echo "✅ Frontend running" || echo "❌ Frontend not running"
```

### Test API manually
```bash
# Test news fetch
curl -s "http://localhost:5001/api/companies/news?company=Google" | python3 -m json.tool | head -50

# Test with different company
curl -s "http://localhost:5001/api/companies/news?company=Microsoft" | python3 -m json.tool | head -50
```

### Check frontend .env
```bash
cat /Users/tirthpatel/CS490-HotSho-project/frontend/.env
# Should contain: VITE_API_BASE_URL="http://localhost:5001"
```

---

## 💡 Pro Tips

1. **Always test with well-known companies first:** Google, Microsoft, Apple
   - These have guaranteed sample data
   - Will always return news items

2. **Check console logs:**
   - Open DevTools (F12)
   - Look for 🎬 🔍 📡 ✅ 📰 emoji indicators
   - These show the feature is attempting to load

3. **Try the refresh button:**
   - Even if no news loads initially
   - Click "↻ Refresh" button in the news section
   - This forces a new API call

4. **Use auto-fill:**
   - When creating jobs, use the auto-fill button
   - This populates company info AND news
   - Saves to job immediately

---

## 📞 Still Having Issues?

### Check Console Logs

**In backend terminal, look for:**
```
🚀 Server running on port 5001
✅ MongoDB connected successfully!
```

**In browser console (F12), look for:**
```
🎬 CompanyNewsSection mounted
🔍 Fetching news for company: [CompanyName]
```

### If you see errors:

**"Network Error"**
- Backend is not running
- Start with: `cd backend && node src/server.js`

**"404 Not Found"**
- API endpoint not found
- Verify backend has company routes registered

**"500 Internal Server Error"**
- Check backend console for error details
- Might be MongoDB connection issue

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Backend shows no errors
2. ✅ Frontend shows no console errors
3. ✅ Company News section renders
4. ✅ See "Recent developments at [Company]..." in summary
5. ✅ At least 1 news item displays
6. ✅ Category badges are colored
7. ✅ Can click filters and see changes
8. ✅ Export button opens modal

---

**Last Updated:** November 9, 2025 9:15 PM
**Status:** ✅ Both servers running, API verified working
**Next Step:** Navigate to Jobs page and view/create a job with a company name
