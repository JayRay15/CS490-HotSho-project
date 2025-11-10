# UC-063: Job Matching - Frontend Integration Guide

## Quick Start: Adding Match Scores to Jobs Page

### Step 1: Import Components

Add to `/frontend/src/pages/auth/Jobs.jsx`:

```javascript
import JobMatchScore from '../../components/JobMatchScore';
import JobMatchComparison from '../../components/JobMatchComparison';
```

### Step 2: Add State Management

```javascript
// Add to existing state
const [showMatchScore, setShowMatchScore] = useState(false);
const [matchJobId, setMatchJobId] = useState(null);
const [showComparison, setShowComparison] = useState(false);
```

### Step 3: Add Match Score Button to Job Cards

In the job card actions section, add:

```jsx
<button
  onClick={() => {
    setMatchJobId(job._id);
    setShowMatchScore(true);
  }}
  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
  View Match Score
</button>
```

### Step 4: Add Match Score Modal

Add near other modals in the Jobs page:

```jsx
{/* Match Score Modal */}
{showMatchScore && matchJobId && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Job Match Analysis</h2>
        <button
          onClick={() => {
            setShowMatchScore(false);
            setMatchJobId(null);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-6">
        <JobMatchScore
          jobId={matchJobId}
          onClose={() => {
            setShowMatchScore(false);
            setMatchJobId(null);
          }}
        />
      </div>
    </div>
  </div>
)}
```

### Step 5: Add Comparison View Toggle

Add a button in the Jobs page header:

```jsx
<div className="flex items-center gap-3">
  <Button
    onClick={() => setShowComparison(!showComparison)}
    variant="secondary"
  >
    {showComparison ? 'Hide' : 'Show'} Match Comparison
  </Button>
  {/* ...existing buttons... */}
</div>
```

### Step 6: Add Comparison Section

Add before or after the job pipeline:

```jsx
{showComparison && (
  <div className="mb-6">
    <JobMatchComparison jobs={jobs} />
  </div>
)}
```

## Optional: Add Match Badge to Job Cards

### Add Match Score Badge

Add this function to fetch match scores:

```javascript
const [matchScores, setMatchScores] = useState({});

useEffect(() => {
  fetchAllMatchScores();
}, [jobs]);

const fetchAllMatchScores = async () => {
  try {
    const token = await window.Clerk?.session?.getToken();
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/job-matches`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (response.ok) {
      const data = await response.json();
      const scores = {};
      data.data.matches.forEach(match => {
        scores[match.jobId] = match.overallScore;
      });
      setMatchScores(scores);
    }
  } catch (err) {
    console.error('Error fetching match scores:', err);
  }
};
```

Add badge to job card:

```jsx
{matchScores[job._id] && (
  <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-semibold ${
    matchScores[job._id] >= 85 ? 'bg-green-100 text-green-800' :
    matchScores[job._id] >= 70 ? 'bg-blue-100 text-blue-800' :
    matchScores[job._id] >= 55 ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800'
  }`}>
    {matchScores[job._id]}% Match
  </div>
)}
```

## API Integration Examples

### Calculate Match on Job Add

```javascript
const handleAddJob = async (jobData) => {
  try {
    // Add job as usual
    const jobResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });

    const job = await jobResponse.json();

    // Calculate match score immediately
    await fetch(`${import.meta.env.VITE_API_URL}/api/job-matches/calculate/${job.data._id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Refresh jobs and match scores
    await fetchJobs();
    await fetchAllMatchScores();
  } catch (err) {
    console.error('Error:', err);
  }
};
```

### Batch Calculate All Matches

```javascript
const calculateAllMatches = async () => {
  try {
    setLoading(true);
    const token = await window.Clerk?.session?.getToken();
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/job-matches/calculate-all`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      alert(`Calculated ${data.data.calculatedMatches} match scores!`);
      await fetchAllMatchScores();
    }
  } catch (err) {
    console.error('Error calculating matches:', err);
  } finally {
    setLoading(false);
  }
};
```

## Styling Tips

### Match Score Colors

Use consistent color coding:
- **85-100%**: Green (Excellent) - `text-green-600`, `bg-green-50`
- **70-84%**: Blue (Good) - `text-blue-600`, `bg-blue-50`
- **55-69%**: Yellow (Fair) - `text-yellow-600`, `bg-yellow-50`
- **0-54%**: Red (Poor) - `text-red-600`, `bg-red-50`

### Icons

Recommended icons for match-related features:
- **Match Score**: Chart/Graph icon
- **Strengths**: Check circle
- **Gaps**: Warning/Alert triangle
- **Suggestions**: Lightbulb/Trending up

## User Experience Best Practices

1. **First-Time Use:**
   - Show a prompt to calculate matches when user first visits
   - Explain what match scores are and how they help

2. **Loading States:**
   - Show spinner while calculating
   - Display "Calculating..." text
   - Don't block other actions

3. **Empty States:**
   - Clear message when no matches calculated
   - Prominent "Calculate" button
   - Brief explanation of benefits

4. **Updates:**
   - Show when match was last calculated
   - Offer to recalculate after profile changes
   - Allow manual recalculation anytime

5. **Sort by Match:**
   - Add "Match Score" as sort option
   - Default to highest matches first
   - Visual indicator for top matches

## Troubleshooting

### Match Score Not Calculating

**Check:**
1. User has profile data (skills, experience, education)
2. Job has description or requirements
3. Authentication token is valid
4. API endpoint is accessible

**Debug:**
```javascript
console.log('Job data:', job);
console.log('User profile:', userProfile);
```

### Scores Seem Inaccurate

**Common Issues:**
1. Skills not properly categorized in user profile
2. Job requirements not parsed correctly
3. Custom weights too extreme

**Solutions:**
- Ensure skills have proper levels (Beginner/Intermediate/Advanced/Expert)
- Add more detail to job descriptions
- Reset custom weights to defaults

### Performance Issues

**If loading slowly:**
1. Calculate matches in background
2. Cache scores in localStorage
3. Paginate match list
4. Debounce recalculation requests

## Testing Checklist

- [ ] Match score calculates correctly
- [ ] Category breakdowns display properly
- [ ] Strengths show relevant information
- [ ] Gaps identify real issues
- [ ] Suggestions are actionable
- [ ] Custom weights update score
- [ ] Comparison view works
- [ ] Export downloads file
- [ ] Mobile responsive
- [ ] Loading states work
- [ ] Error handling graceful
- [ ] Match badge displays correctly
- [ ] Sorting by match works

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API responses in Network tab
3. Review implementation summary (UC-063_IMPLEMENTATION_SUMMARY.md)
4. Check that all dependencies are installed
5. Ensure backend server is running

---

**Quick Reference:**
- Backend API: `/api/job-matches/*`
- Components: `JobMatchScore`, `JobMatchComparison`
- Colors: Green (85+), Blue (70+), Yellow (55+), Red (<55)
