# Cover Letter Implementation - Following Resume Pattern

## Summary of Changes

This update restructures the cover letter feature to follow the exact same pattern as the resume section, using separate models for templates and actual cover letters.

## Architecture Changes

### 1. Separate Models (Like Resume Section)

#### Before:
- Single `CoverLetterTemplate` model with `isTemplate` flag
- Used `isTemplate: true` for templates, `isTemplate: false` for saved letters

#### After:
- **`CoverLetterTemplate`** model - For reusable templates only
- **`CoverLetter`** model - For actual cover letters (like `Resume` model)

### 2. New Backend Files

#### Models:
- **`backend/src/models/CoverLetter.js`** - New model for cover letters
  - Fields: userId, templateId, name, content, jobId, metadata, isDefault, isArchived
  - Matches `Resume.js` structure

#### Controllers:
- **`backend/src/controllers/coverLetterController.js`** - New controller for cover letters
  - Functions: listCoverLetters, createCoverLetterFromTemplate, getCoverLetterById, updateCoverLetter, deleteCoverLetter, setDefaultCoverLetter, archiveCoverLetter, unarchiveCoverLetter, cloneCoverLetter
  - Matches `resumeController.js` pattern

#### Routes:
- **`backend/src/routes/coverLetterRoutes.js`** - New routes for cover letters
  - `/api/cover-letters` - List, create, update, delete
  - `/api/cover-letters/:id/set-default` - Set as default
  - `/api/cover-letters/:id/archive` - Archive/unarchive
  - `/api/cover-letters/:id/clone` - Clone cover letter

### 3. Updated Backend Files

#### `backend/src/models/CoverLetterTemplate.js`:
- Removed `isTemplate` field
- Templates are now always templates (no dual purpose)
- Made `industry` and `style` default to 'general' and 'formal'

#### `backend/src/controllers/coverLetterTemplateController.js`:
- Removed all `isTemplate` filtering logic
- Simplified `listTemplates()` - no more migration or dual filtering
- Updated `createTemplate()` - removed `isTemplate` parameter

#### `backend/src/server.js`:
- Added import for `coverLetterRoutes`
- Mounted routes at `/api` (like resume routes)

### 4. New Frontend Files

#### API:
- **`frontend/src/api/coverLetters.js`** - API functions for cover letters
  - Matches `frontend/src/api/resumes.js` pattern
  - Functions: fetchCoverLetters, createCoverLetter, updateCoverLetter, deleteCoverLetter, setDefaultCoverLetter, archiveCoverLetter, unarchiveCoverLetter, cloneCoverLetter

### 5. Updated Frontend Files

#### `frontend/src/pages/auth/ResumeTemplates.jsx`:
- Added import for cover letter API functions
- Updated `loadSavedCoverLetters()` - uses `/api/cover-letters` endpoint
- Updated `loadCoverLetterTemplates()` - uses `/api/cover-letter-templates` (no `isTemplate` param)
- Added `isCreatingCoverLetterTemplate` state to track modal mode
- Updated customize modal save button:
  - Creates template (`createCoverLetterTemplate`) when `isCreatingCoverLetterTemplate: true`
  - Creates cover letter (`createCoverLetter`) when `isCreatingCoverLetterTemplate: false`
- Updated all buttons to set the flag correctly:
  - "Create Template" in Manage Templates → sets flag to `true`
  - "Use Template" from browser → sets flag to `false`
  - "Create from Scratch" → sets flag to `false`
  - "Customize" buttons → set flag to `false`
- Updated delete button for saved cover letters to use `apiDeleteCoverLetter`

## User Experience Flow

### Creating a Cover Letter (One-Time Use):
1. Click "Add Cover Letter"
2. Choose:
   - **Use Template** → Browser → Select → Customize → Save
   - **Create from Scratch** → Write → Save
3. Saves to `/api/cover-letters` (CoverLetter model)
4. Appears in "My Cover Letters" section

### Creating a Template (Reusable):
1. Click "Manage Templates"
2. Click "Create Template" button
3. Enter name and content
4. Saves to `/api/cover-letter-templates` (CoverLetterTemplate model)
5. Appears in "Manage Templates" → "Custom & Imported Templates"

### Importing a Template:
1. Click "Add Cover Letter" → "Import from Text"
2. Paste text
3. Saves to `/api/cover-letter-templates` (CoverLetterTemplate model)
4. Appears in "Manage Templates" → "Custom & Imported Templates"

## API Endpoints

### Cover Letter Templates (Reusable):
- `GET /api/cover-letter-templates` - List templates
- `POST /api/cover-letter-templates` - Create template
- `PUT /api/cover-letter-templates/:id` - Update template
- `DELETE /api/cover-letter-templates/:id` - Delete template

### Cover Letters (One-Time Use):
- `GET /api/cover-letters` - List cover letters
- `POST /api/cover-letters` - Create cover letter
- `GET /api/cover-letters/:id` - Get cover letter
- `PUT /api/cover-letters/:id` - Update cover letter
- `DELETE /api/cover-letters/:id` - Delete cover letter
- `PUT /api/cover-letters/:id/set-default` - Set as default
- `PUT /api/cover-letters/:id/archive` - Archive
- `PUT /api/cover-letters/:id/unarchive` - Unarchive
- `POST /api/cover-letters/:id/clone` - Clone

## Benefits of This Architecture

1. **Consistency**: Matches resume section exactly
2. **Clarity**: Clear separation between templates and cover letters
3. **Scalability**: Can add features to cover letters independently (archive, default, clone, job linking)
4. **Data Integrity**: No more dual-purpose records with `isTemplate` flag
5. **User Understanding**: Mirrors familiar resume workflow

## Testing Checklist

- [ ] Create cover letter from template
- [ ] Create cover letter from scratch
- [ ] Create custom template from Manage Templates
- [ ] Import template from text
- [ ] View/Delete saved cover letters from "My Cover Letters"
- [ ] Customize/Delete templates from "Manage Templates"
- [ ] Verify templates appear in "Manage Templates" only
- [ ] Verify cover letters appear in "My Cover Letters" only
- [ ] Test default template selection
- [ ] Test usage tracking when using templates

## Migration Notes

Existing data with `isTemplate` field will still work:
- Records with `isTemplate: true` will continue as templates
- Records with `isTemplate: false` should be migrated to the new `CoverLetter` collection
- No automatic migration script included - manual migration may be needed for existing users
