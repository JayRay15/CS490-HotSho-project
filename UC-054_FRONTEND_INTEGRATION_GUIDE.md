# UC-054: Frontend Integration Guide

## Quick Integration - Adding Export Button to Cover Letters

### Step 1: Import the Export Modal Component

At the top of `ResumeTemplates.jsx`, add:

```jsx
import CoverLetterExportModal from '../components/CoverLetterExportModal';
```

### Step 2: Add State for Export Modal

In the component state section (around line 190), add:

```jsx
// UC-054: Cover letter export
const [showCoverLetterExportModal, setShowCoverLetterExportModal] = useState(false);
const [exportingCoverLetter, setExportingCoverLetter] = useState(null);
```

### Step 3: Add Export Button to Cover Letter Cards

Find the section where cover letters are rendered (search for `savedCoverLetters.map`) and add an export button:

```jsx
{/* Existing cover letter card content */}
<div className="flex items-center gap-2 mt-4">
  {/* Existing buttons (edit, delete, etc.) */}
  
  {/* UC-054: Export button */}
  <button
    onClick={() => {
      setExportingCoverLetter(coverLetter);
      setShowCoverLetterExportModal(true);
    }}
    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
    title="Export cover letter"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    Export
  </button>
</div>
```

### Step 4: Add Export Modal at the End of Component

Before the closing `</div>` of the main component, add:

```jsx
{/* UC-054: Cover Letter Export Modal */}
{showCoverLetterExportModal && exportingCoverLetter && (
  <CoverLetterExportModal
    coverLetter={exportingCoverLetter}
    onClose={() => {
      setShowCoverLetterExportModal(false);
      setExportingCoverLetter(null);
    }}
    contactInfo={{
      name: user?.profile?.contactInfo?.name || user?.name || '',
      email: user?.profile?.contactInfo?.email || user?.email || '',
      phone: user?.profile?.contactInfo?.phone || '',
      address: user?.profile?.contactInfo?.address || '',
      website: user?.profile?.contactInfo?.website || ''
    }}
    linkedJob={exportingCoverLetter?.jobId || null}
  />
)}
```

### Step 5: Alternative - Add Export Action to Dropdown Menu

If you prefer a dropdown menu approach:

```jsx
{/* Inside your existing dropdown or action menu */}
<button
  onClick={() => {
    setExportingCoverLetter(coverLetter);
    setShowCoverLetterExportModal(true);
    setShowDropdown(false); // Close dropdown if applicable
  }}
  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
  Export
</button>
```

## Complete Example - Cover Letter Card with Export

```jsx
<div key={coverLetter._id} className="bg-white border border-gray-200 rounded-lg p-4">
  {/* Card Header */}
  <div className="flex items-start justify-between mb-3">
    <div>
      <h3 className="text-lg font-semibold text-gray-900">{coverLetter.name}</h3>
      <p className="text-sm text-gray-600">
        {coverLetter.style ? `${coverLetter.style} style` : 'Cover Letter'}
      </p>
    </div>
    <span className="text-xs text-gray-500">
      {new Date(coverLetter.updatedAt).toLocaleDateString()}
    </span>
  </div>

  {/* Content Preview */}
  <div className="mb-4">
    <p className="text-sm text-gray-700 line-clamp-3">
      {coverLetter.content.substring(0, 200)}...
    </p>
  </div>

  {/* Actions */}
  <div className="flex items-center gap-2 flex-wrap">
    {/* View Button */}
    <button
      onClick={() => handleViewCoverLetter(coverLetter)}
      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      View
    </button>

    {/* Edit Button */}
    <button
      onClick={() => handleEditCoverLetter(coverLetter)}
      className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
    >
      Edit
    </button>

    {/* UC-054: Export Button */}
    <button
      onClick={() => {
        setExportingCoverLetter(coverLetter);
        setShowCoverLetterExportModal(true);
      }}
      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export
    </button>

    {/* Delete Button */}
    <button
      onClick={() => handleDeleteCoverLetter(coverLetter._id)}
      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
    >
      Delete
    </button>
  </div>
</div>
```

## Testing the Integration

### 1. Test Modal Opening
- Click the "Export" button on any cover letter
- Modal should open with export options

### 2. Test Format Selection
- Select different formats (PDF, DOCX, HTML, Text)
- Each format should be highlighted when selected

### 3. Test Letterhead Configuration
- Toggle letterhead on/off
- Change alignment (left, center, right)
- Fill in contact information fields

### 4. Test Recipient Information
- Fill in company details
- Data should persist in the form

### 5. Test Export
- Click "Export as [FORMAT]"
- File should download with correct filename
- Open file to verify content and formatting

### 6. Test Email Template
- Click "Generate Email Template"
- Email preview should appear
- Test copy-to-clipboard for subject and body

### 7. Test Modal Closing
- Click "Cancel" button
- Click "X" button
- Click outside modal (if implemented)

## Styling Tips

### Custom Button Styles
Match your app's design system:

```jsx
// Primary export button
<button
  className="px-4 py-2 bg-[#4F5348] text-white rounded-lg hover:bg-[#3d4039] transition-colors"
>
  Export
</button>

// Icon-only button
<button
  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
  title="Export"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
</button>
```

### Mobile Responsiveness
The modal is already responsive, but ensure buttons work well on mobile:

```jsx
<button
  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md"
>
  Export
</button>
```

## Error Handling

Add error boundaries if needed:

```jsx
const handleExportClick = (coverLetter) => {
  try {
    if (!coverLetter || !coverLetter._id) {
      alert('Invalid cover letter data');
      return;
    }
    
    setExportingCoverLetter(coverLetter);
    setShowCoverLetterExportModal(true);
  } catch (error) {
    console.error('Failed to open export modal:', error);
    alert('Failed to open export dialog');
  }
};
```

## User Profile Integration

If you need to fetch user profile data:

```jsx
const [userProfile, setUserProfile] = useState(null);

useEffect(() => {
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/users/profile');
      setUserProfile(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };
  
  fetchUserProfile();
}, []);

// Then pass to modal
<CoverLetterExportModal
  contactInfo={userProfile?.contactInfo || {}}
  // ... other props
/>
```

## Quick Verification Checklist

- [ ] Import statement added
- [ ] State variables added
- [ ] Export button added to cover letter cards
- [ ] Modal component rendered conditionally
- [ ] User contact info passed correctly
- [ ] Linked job data passed correctly
- [ ] Modal closes on button click
- [ ] Export works for all formats
- [ ] Email template generation works
- [ ] UI matches app design system
- [ ] Mobile responsive
- [ ] Error handling in place

## Need Help?

Check the implementation in:
- **Backend**: `/backend/src/controllers/coverLetterController.js`
- **Frontend Component**: `/frontend/src/components/CoverLetterExportModal.jsx`
- **API Functions**: `/frontend/src/api/coverLetters.js`
- **Full Documentation**: `UC-054_IMPLEMENTATION_SUMMARY.md`

Happy coding! 🚀
