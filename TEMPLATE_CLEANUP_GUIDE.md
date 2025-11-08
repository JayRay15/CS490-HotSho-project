# Cover Letter Template Cleanup Guide

## Problem
Multiple duplicate templates are being created when users browse templates by style.

## Solution

### 1. Automatic Cleanup (Happens on Next Template Load)
The backend now automatically:
- Detects and removes duplicate templates for each user
- Keeps only the oldest template for each style (formal, modern, creative, technical, executive)
- Only seeds missing templates (won't create duplicates)
- This cleanup runs automatically the first time a user loads their templates after this update

### 2. Manual Cleanup (Run Once to Clean Existing Duplicates)

To immediately clean up all existing duplicate templates in the database:

```bash
cd backend
node cleanup-duplicate-templates.js
```

This script will:
1. Find all users with cover letter templates
2. For each user, identify duplicate default templates
3. Keep only 1 template per style (the oldest one)
4. Delete all duplicates
5. Show a summary of what was cleaned

**Example Output:**
```
Found 5 users with templates

User user_123: Found 15 default templates
  ✓ Deleted 10 duplicate templates
  ✓ Kept 1 formal template: "Formal Professional"
  ✓ Kept 1 modern template: "Modern Professional"
  ✓ Kept 1 creative template: "Creative Expression"
  ✓ Kept 1 technical template: "Technical Professional"
  ✓ Kept 1 executive template: "Executive Leadership"

✅ Cleanup complete! Removed 10 duplicate templates total.
```

## What Changed in the Code

### Backend (`backend/src/controllers/coverLetterTemplateController.js`)

**Before:**
- Seeded templates without proper duplicate checking
- Could create duplicates on each template load

**After:**
- First checks for and removes any duplicate default templates
- Groups templates by style and keeps only the oldest
- Only seeds templates for styles that don't exist
- Properly tracks which styles exist before seeding

### Result
- Each user will have exactly **5 default templates** (one per style)
- Plus any **custom/imported templates** they created
- No more duplicates appearing when browsing by style

## Testing

After running the cleanup:
1. Go to "Add Cover Letter" → "Use a Template"
2. Filter by different styles
3. You should see exactly 1 template per style
4. Custom and imported templates will also appear (as they should)
5. No new duplicates should be created
