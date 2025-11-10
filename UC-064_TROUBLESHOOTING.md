# UC-064: Company Research - Troubleshooting Guide

## ❌ Common Error: "Failed to fetch company research. Please try again."

### 🔍 Root Cause
This error occurs when the frontend cannot reach the backend API endpoint, usually because:
1. Backend server is not running
2. Backend server is running old code (before routes were added)
3. CORS issues
4. API key not configured

---

## ✅ Solution Steps

### **Step 1: Verify Backend is Running**

```bash
# Check if port 5001 is in use
lsof -ti:5001

# If nothing returns, server is NOT running
# If you get a process ID, server IS running
```

### **Step 2: Restart Backend Server**

The backend needs to be restarted to pick up the new research routes.

```bash
# Kill any existing backend processes
pkill -f "node.*server.js"

# Or kill specific process
kill <PROCESS_ID>

# Start fresh backend server
cd backend
node src/server.js
```

**Expected output:**
```
✅ MongoDB connected successfully!
🚀 Server running on port 5001
```

### **Step 3: Test the Endpoint Manually**

```bash
# Test with curl
curl "http://localhost:5001/api/companies/research?company=Google"

# Expected response:
# {"success":true,"message":"Company research completed successfully",...}
```

**If you get 404:**
```json
{"success":false,"message":"Cannot GET /api/companies/research"}
```
→ Server is running old code. **Restart the backend!**

**If you get connection refused:**
```
curl: (7) Failed to connect to localhost port 5001
```
→ Server is not running. **Start the backend!**

---

## 🔧 Quick Fix Commands

### **Full Server Restart (One Command)**

```bash
# Stop old server and start fresh
pkill -f "node.*server.js" && cd /Users/tirthpatel/CS490-HotSho-project/backend && node src/server.js
```

### **Test API After Restart**

```bash
curl -s "http://localhost:5001/api/companies/research?company=Google" | jq '.success'
# Should return: true
```

---

## 🐛 Other Potential Issues

### **Issue 1: Missing GEMINI_API_KEY**

**Error in backend logs:**
```
Error: API key not found
```

**Solution:**
```bash
# Check if key exists
cat backend/.env | grep GEMINI_API_KEY

# If missing, add it
echo "GEMINI_API_KEY=your_key_here" >> backend/.env
```

### **Issue 2: CORS Error in Browser**

**Error in browser console:**
```
Access to fetch at 'http://localhost:5001/api/companies/research' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution:**
Verify `backend/src/server.js` has CORS configured:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

### **Issue 3: Frontend Using Wrong URL**

**Check frontend environment:**
```bash
# frontend/.env should have:
VITE_API_BASE_URL=http://localhost:5001
```

**Or check the component:**
```jsx
// In CompanyResearchReport.jsx
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
```

### **Issue 4: MongoDB Connection Failed**

**Error in backend logs:**
```
❌ MongoDB connection error
```

**Solution:**
```bash
# Check MongoDB connection string
cat backend/.env | grep MONGODB_URI

# Verify MongoDB is running (if local)
# Or check MongoDB Atlas connection
```

---

## 🧪 Testing Checklist

### ✅ Pre-Flight Checks

- [ ] Backend server is running on port 5001
- [ ] Frontend server is running on port 5173  
- [ ] GEMINI_API_KEY is in backend/.env
- [ ] MongoDB is connected
- [ ] No errors in backend terminal
- [ ] No errors in browser console

### ✅ Test the Flow

1. **Backend API Test:**
   ```bash
   curl "http://localhost:5001/api/companies/research?company=Google"
   ```
   → Should return `"success":true`

2. **Frontend Integration Test:**
   - Open http://localhost:5173/dashboard/jobs
   - Click any job card
   - Scroll to "Comprehensive Company Research"
   - Click "Load Research" button
   - Should see loading spinner, then research data

3. **Browser Console Test:**
   - Open DevTools → Network tab
   - Click "Load Research"
   - Should see request to `/api/companies/research?company=...`
   - Status should be `200 OK`
   - Response should have `success: true`

---

## 🚨 Emergency Debug Mode

If nothing works, run this complete diagnostic:

```bash
#!/bin/bash
echo "=== UC-064 Diagnostic ==="
echo ""
echo "1. Checking backend process..."
ps aux | grep "[n]ode.*server.js"
echo ""
echo "2. Checking port 5001..."
lsof -ti:5001
echo ""
echo "3. Checking .env file..."
grep GEMINI_API_KEY backend/.env | sed 's/=.*/=***HIDDEN***/'
echo ""
echo "4. Testing API endpoint..."
curl -s "http://localhost:5001/api/companies/research?company=Test" | jq '.success'
echo ""
echo "5. Checking route registration..."
grep -A 2 "research" backend/src/routes/companyRoutes.js
echo ""
echo "=== End Diagnostic ==="
```

**Save as `debug-research.sh` and run:**
```bash
chmod +x debug-research.sh
./debug-research.sh
```

---

## 📊 Common Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Failed to fetch company research` | Backend not responding | Restart backend server |
| `Cannot GET /api/companies/research` | Routes not loaded | Restart backend server |
| `Connection refused` | Backend not running | Start backend server |
| `API key not found` | Missing GEMINI_API_KEY | Add to .env file |
| `CORS policy blocked` | CORS misconfiguration | Check CORS settings |
| `Network error` | Wrong API URL | Check VITE_API_BASE_URL |

---

## 🔄 Quick Recovery Steps

### **If Everything is Broken:**

```bash
# 1. Stop everything
pkill -f "node.*server.js"
pkill -f "vite"

# 2. Clean and restart backend
cd backend
npm install
node src/server.js &

# 3. Wait for MongoDB connection
sleep 5

# 4. Test API
curl "http://localhost:5001/api/companies/research?company=Test"

# 5. Start frontend
cd ../frontend
npm run dev
```

### **If Just Frontend is Broken:**

```bash
# 1. Hard refresh browser
# Press: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# 2. Clear browser cache
# Open DevTools → Application → Clear storage

# 3. Restart frontend dev server
cd frontend
pkill -f vite
npm run dev
```

---

## 📞 Still Not Working?

### **Capture Debug Information:**

```bash
# 1. Backend logs
cd backend
node src/server.js > backend.log 2>&1 &
tail -f backend.log

# 2. Frontend console
# Open browser DevTools → Console tab
# Copy all errors

# 3. Network requests
# Open browser DevTools → Network tab
# Filter: XHR
# Look for failed requests to /api/companies/research
```

### **Check These Files:**

1. **Backend Route:** `backend/src/routes/companyRoutes.js`
   - Should have: `router.get("/research", getComprehensiveResearch);`

2. **Backend Controller:** `backend/src/controllers/companyController.js`
   - Should export: `getComprehensiveResearch`

3. **Frontend Component:** `frontend/src/components/CompanyResearchReport.jsx`
   - Should fetch: `${API_URL}/api/companies/research`

4. **Jobs Page:** `frontend/src/pages/auth/Jobs.jsx`
   - Should import: `CompanyResearchReport`
   - Should render: `<CompanyResearchReport .../>`

---

## ✅ Verification Commands

After fixing, run these to verify everything works:

```bash
# 1. Backend health check
curl http://localhost:5001/health

# 2. Research endpoint test
curl -s "http://localhost:5001/api/companies/research?company=Google" | jq '.success'
# Should return: true

# 3. Check response structure
curl -s "http://localhost:5001/api/companies/research?company=Google" | jq '.data.research | keys'
# Should return: ["basicInfo", "companyName", "competitive", ...]

# 4. Test with job description
curl -s "http://localhost:5001/api/companies/research?company=Google&jobDescription=Software%20Engineer" | jq '.data.metadata.dataQuality'
# Should return a number like: 85
```

---

## 🎯 Success Indicators

✅ **Backend is working when:**
- Server logs show: `🚀 Server running on port 5001`
- API test returns: `"success": true`
- Response includes all 11 research keys

✅ **Frontend is working when:**
- Component loads without errors
- "Load Research" button appears
- Clicking button shows loading spinner
- Research data displays in tabs

✅ **Integration is working when:**
- Network request shows 200 OK status
- Response time is < 15 seconds
- All 6 tabs have content
- Quality badge shows percentage
- Export buttons download files

---

**Last Updated:** November 10, 2025  
**Status:** ✅ Tested and Working  
**Backend Server:** Running on port 5001  
**API Endpoint:** http://localhost:5001/api/companies/research
