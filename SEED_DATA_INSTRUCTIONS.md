# How to Add Fake Test Data for Interview Analytics

## Quick Steps

### 1. Get Your User ID

**Option A: From Browser Console (Easiest)**
1. Make sure backend is running: `cd backend && node src/server.js`
2. Make sure frontend is running: `cd frontend && npm run dev`
3. Login to the app at `http://localhost:5173`
4. Open browser dev tools (Press **F12**)
5. Go to **Console** tab
6. Type this command and press Enter:
   ```javascript
   localStorage.getItem("__clerk_db_jwt")
   ```
7. You'll see a long string (JWT token) - copy it
8. Go to https://jwt.io and paste the token in the "Encoded" box
9. In the "Payload" section (middle), find the `"sub"` field
10. Copy that value (looks like: `user_2abc123def456`)

**Option B: From Network Tab**
1. Open dev tools (F12) > Network tab
2. Visit any page in the app (e.g., /interviews)
3. Click any API request
4. Look at the Request Headers
5. Find the Authorization header
6. Copy the token after "Bearer "
7. Decode at jwt.io and get the "sub" field

### 2. Set Your User ID in the Script

Open the file: `backend/test_scripts/seed-interview-data.js`

Find this line near the top:
```javascript
const USER_ID = process.env.TEST_USER_ID || 'YOUR_CLERK_USER_ID_HERE';
```

Replace `'YOUR_CLERK_USER_ID_HERE'` with your actual user ID:
```javascript
const USER_ID = process.env.TEST_USER_ID || 'user_2abc123def456';
```

### 3. Run the Seeder Script

```bash
cd backend
node test_scripts/seed-interview-data.js
```

**Or set as environment variable:**
```bash
cd backend
TEST_USER_ID=user_2abc123def456 node test_scripts/seed-interview-data.js
```

### 4. View Your Analytics

1. Go to: `http://localhost:5173/interviews/analytics`
2. You should now see:
   - **25 interviews** across different companies
   - **18-19 completed** interviews (75%)
   - Mix of successful and unsuccessful outcomes
   - Various interview types (Phone, Video, Technical, etc.)
   - Multiple industries (Technology, Finance, Healthcare, etc.)
   - **8 mock interview sessions**

## What Gets Created

The script creates realistic test data:

### Interviews (25 total)
- **Companies**: Google, Microsoft, Amazon, Meta, Goldman Sachs, McKinsey, etc.
- **Types**: Phone Screen, Video Call, Technical, Behavioral, Panel, Final Round
- **Status**: 75% Completed, 25% Scheduled (upcoming)
- **Outcomes**: 
  - ~30% Offers Extended
  - ~45% Successful (Passed/Next Round)
  - ~25% Unsuccessful
- **Ratings**: 2-5 stars for completed interviews
- **Time Range**: Spread over last 5 months
- **Details**: Interviewer names, locations, meeting links, notes

### Job Postings (18 companies)
- All major industries represented
- Realistic job titles per industry
- Salary ranges
- Work modes (Remote, Hybrid, On-site)
- Application dates and status history

### Mock Interview Sessions (8 sessions)
- Different types: Behavioral, Technical, Case Study
- All marked as completed
- Ratings and feedback
- Spread over last 4 months
- Shows correlation with performance improvement

## Customize the Data

Edit these values in the script to change amounts:

```javascript
const CONFIG = {
  totalInterviews: 25,        // Change to 10, 50, etc.
  completedPercentage: 0.75,  // 0.75 = 75% completed
  successPercentage: 0.45,    // 0.45 = 45% success rate
  offerPercentage: 0.30,      // 0.30 = 30% offer rate
  mockSessions: 8,            // Number of practice sessions
};
```

## Clear Test Data

To remove all test data and start fresh:

The script automatically clears existing data before creating new data. Just run it again!

If you want to manually clear data:
```javascript
// Add this to your script or use MongoDB Compass
await Interview.deleteMany({ userId: USER_ID });
await Job.deleteMany({ userId: USER_ID });
await MockInterviewSession.deleteMany({ userId: USER_ID });
```

## Expected Analytics Output

After running the script, you should see:

### Overview Tab
- Total: 25 interviews
- Completed: ~19 interviews
- Success Rate: ~45%
- Average Rating: 3.5-4.0 stars

### Conversion Tab
- Funnel showing progression from scheduled to offers
- Rates above industry average
- Clear visualization

### Performance Tab
- **Strengths**: Best performing interview types
- **Weaknesses**: Areas needing improvement
- Format comparison showing all types
- Industry breakdown across all sectors

### Insights Tab
- 4-5 strategic insights
- Success patterns identified
- Practice impact shown
- Industry fit recommendations

### Recommendations Tab
- 3-6 personalized action items
- Mix of High/Medium/Low priority
- Specific steps for improvement
- Expected impact statements

## Troubleshooting

### "USER_ID not set" error
- Make sure you replaced `'YOUR_CLERK_USER_ID_HERE'` with your actual user ID
- Or set TEST_USER_ID environment variable

### "MongoDB connection failed"
- Check that MONGO_URI is set in backend/.env
- Make sure MongoDB Atlas cluster is running

### "Cannot find module" error
- Make sure you're in the backend directory: `cd backend`
- Check that node_modules are installed: `npm install`

### No data showing in frontend
- Verify the script completed successfully (look for "🎉 Data seeding completed!")
- Make sure you're logged in with the same user ID you used in the script
- Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for errors

### Data looks wrong or incomplete
- Run the script again (it clears old data first)
- Check the statistics output from the script
- Verify MongoDB connection was successful

## Tips

1. **Run multiple times**: The script clears old data, so you can run it multiple times to get different data distributions

2. **Adjust ratios**: Edit the CONFIG values to test different scenarios (e.g., low success rate, high offer rate)

3. **Check MongoDB**: Use MongoDB Compass or Atlas to verify data was created

4. **Test different views**: After seeding, test all 5 tabs in the analytics dashboard

5. **Compare benchmarks**: With realistic data, you can see how the user compares to industry standards

## Next Steps

After seeding data:
1. ✅ View analytics dashboard
2. ✅ Test all 5 tabs
3. ✅ Review recommendations
4. ✅ Check that insights make sense
5. ✅ Verify funnel visualization works
6. ✅ Test filtering/sorting features

Your interview analytics should now be fully populated and functional! 🎉
