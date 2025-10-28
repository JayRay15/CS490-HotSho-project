# Typography System Documentation

## Overview
This document outlines the typography system implemented in the HotSho project, ensuring consistent and readable text across all pages.

---

## ✅ Acceptance Criteria Status

### 1. ✅ Primary Font Family
- **Font**: Inter
- **Purpose**: Body text, UI elements, and general content
- **Weights Available**: 400 (normal), 500 (medium), 700 (bold)
- **Tailwind Class**: `font-body`
- **Source**: Google Fonts CDN
- **Fallback**: `sans-serif`

### 2. ✅ Secondary Font for Headings
- **Font**: Poppins
- **Purpose**: All headings (H1-H6), titles, and emphasis text
- **Weights Available**: 600 (semibold), 700 (bold)
- **Tailwind Class**: `font-heading`
- **Source**: Google Fonts CDN
- **Fallback**: `sans-serif`

### 3. ✅ Font Sizes Defined (H1-H6, Body, Captions)

#### Heading Hierarchy
| Element | Tailwind Class | Size | Line Height | Weight | Usage |
|---------|---------------|------|-------------|---------|--------|
| H1 | `text-3xl` | 30px (1.875rem) | 1.3 | 700 (bold) | Page titles, main headings |
| H2 | `text-2xl` | 24px (1.5rem) | 1.4 | 600 (semibold) | Section headings |
| H3 | `text-xl` | 20px (1.25rem) | 1.5 | 600 (semibold) | Subsection headings |
| H4 | `text-lg` | 18px (1.125rem) | 1.6 | 600 (semibold) | Card titles, small headers |
| H5 | `text-base` | 16px (1rem) | 1.6 | 600 (semibold) | Minor headings |
| H6 | `text-sm` | 14px (0.875rem) | 1.5 | 700 (bold) | Labels, uppercase headers |

#### Body Text & UI
| Element | Tailwind Class | Size | Line Height | Usage |
|---------|---------------|------|-------------|--------|
| Body Large | `text-lg` | 18px | 1.6 | Emphasized body text |
| Body (default) | `text-base` | 16px | 1.6 | Standard paragraphs, content |
| Small Text | `text-sm` | 14px | 1.5 | Labels, helper text, UI elements |
| Captions | `text-xs` | 12px | 1.4 | Timestamps, fine print, badges |

### 4. ✅ Line Heights Optimized for Readability
- **Body Text**: `1.6` - Optimized for comfortable reading
- **Headings**: `1.3` - Tighter for visual hierarchy
- **Small Text**: `1.5` - Balanced for UI elements
- **Captions**: `1.4` - Compact but readable

Custom line-height utilities available:
- `leading-tight`: 1.3
- `leading-snug`: 1.4
- `leading-normal`: 1.6
- `leading-relaxed`: 1.7
- `leading-loose`: 1.8

### 5. ✅ Font Weights Available
**Inter (Body Font)**
- 400 - `font-normal` - Default body text
- 500 - `font-medium` - Emphasized text, labels
- 700 - `font-bold` - Strong emphasis

**Poppins (Heading Font)**
- 600 - `font-semibold` - H2-H6 headings
- 700 - `font-bold` - H1, strong headings

### 6. ✅ Text Hierarchy Clearly Distinguishable
**Size Differentiation**: Each heading level has distinct size
**Weight Hierarchy**: Bold > Semibold > Medium > Normal
**Color Hierarchy**:
- Primary text: `text-gray-900`
- Secondary text: `text-gray-700`
- Muted text: `text-gray-600`
- Disabled text: `text-gray-500`

**Font Family Hierarchy**:
- Headings → Poppins (font-heading)
- Body → Inter (font-body)

### 7. ✅ Fonts Load Quickly with Fallbacks
**Loading Strategy**:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
```
- `display=swap` prevents FOIT (Flash of Invisible Text)
- Fonts load asynchronously
- System fonts display during load

**Fallback Chain**:
- Primary: `Inter` → Fallback: `sans-serif`
- Heading: `Poppins` → Fallback: `sans-serif`

---

## Implementation Details

### CSS Configuration (`src/index.css`)
```css
body {
    @apply font-body bg-gray-50 text-gray-900;
    line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
    line-height: 1.3;
    font-weight: 600;
}
```

### Tailwind Configuration (`tailwind.config.js`)
```javascript
fontFamily: {
    heading: ['Poppins', 'sans-serif'],
    body: ['Inter', 'sans-serif'],
},
fontSize: {
    'xs': ['0.75rem', { lineHeight: '1.4' }],
    'sm': ['0.875rem', { lineHeight: '1.5' }],
    'base': ['1rem', { lineHeight: '1.6' }],
    'lg': ['1.125rem', { lineHeight: '1.6' }],
    'xl': ['1.25rem', { lineHeight: '1.5' }],
    '2xl': ['1.5rem', { lineHeight: '1.4' }],
    '3xl': ['1.875rem', { lineHeight: '1.3' }],
}
```

---

## Usage Guidelines

### ✅ DO's
```jsx
// Correct - Using font-heading for headings
<h1 className="text-3xl font-heading font-bold">Main Title</h1>
<h2 className="text-2xl font-heading font-semibold">Section Title</h2>
<p className="text-base">Body text automatically uses Inter font.</p>

// Good - Proper hierarchy
<h1 className="text-3xl font-heading font-bold mb-2">Page Title</h1>
<p className="text-gray-600 mb-6">Subtitle or description</p>
<h2 className="text-2xl font-heading font-semibold mb-4">Section</h2>
```

### ❌ DON'Ts
```jsx
// Wrong - Missing font-heading class
<h1 className="text-3xl font-bold">Title</h1>

// Wrong - Inconsistent sizing
<h2 className="text-3xl">Section</h2>  // Should be text-2xl

// Wrong - Missing line-height consideration
<p style={{ fontSize: '16px' }}>Text</p>  // Use Tailwind classes instead
```

---

## Component Examples

### ProfilePage Headings
```jsx
<h1 className="text-3xl font-heading font-bold mb-2">My Profile</h1>
<h2 className="text-xl font-heading font-semibold text-gray-800">Basic Information</h2>
<h3 className="text-lg font-heading font-semibold text-gray-900">{job.jobTitle}</h3>
```

### Dashboard
```jsx
<h1 className="text-3xl font-heading font-bold mb-2">
  Welcome, {user?.fullName}!
</h1>
```

### Modal Titles
```jsx
<h3 className="text-2xl font-heading font-semibold">Edit Profile</h3>
```

### Card Titles
```jsx
<h3 className="text-lg font-heading font-semibold text-gray-800 mb-3">{title}</h3>
```

---

## Files Updated

### Core Configuration
- ✅ `frontend/src/index.css` - Base typography styles, line heights
- ✅ `frontend/tailwind.config.js` - Font families, size scale with line heights
- ✅ `frontend/index.html` - Google Fonts CDN link

### Pages Updated
- ✅ `frontend/src/pages/auth/ProfilePage.jsx` - All headings (H1, H2, H3)
- ✅ `frontend/src/pages/auth/Dashboard.jsx` - H1
- ✅ `frontend/src/pages/auth/ForgotPassword.jsx` - H2

### Components Updated
- ✅ `frontend/src/components/Navbar.jsx` - Brand text
- ✅ `frontend/src/components/Card.jsx` - Card titles
- ✅ `frontend/src/components/ErrorMessage.jsx` - Error headings
- ✅ `frontend/src/components/ErrorBoundary.jsx` - Error page heading
- ✅ `frontend/src/components/ProfilePictureUpload.jsx` - Modal heading

---

## Testing Checklist

### Visual Testing
- [ ] Check all pages for consistent heading fonts (Poppins)
- [ ] Verify body text uses Inter font
- [ ] Confirm heading hierarchy is visually clear
- [ ] Test readability with various content lengths
- [ ] Check line spacing looks comfortable

### Cross-Browser Testing
- [ ] Chrome - Fonts load correctly
- [ ] Firefox - Fallbacks work
- [ ] Safari - Typography renders well
- [ ] Edge - No font loading issues

### Performance
- [ ] Fonts load without blocking render
- [ ] No FOIT (Flash of Invisible Text)
- [ ] Fallback fonts display during load

---

## Future Enhancements
- Consider adding display font sizes (4xl, 5xl, 6xl) for hero sections
- Add responsive typography scaling for mobile devices
- Implement dark mode typography variants
- Add letter-spacing adjustments for specific use cases

---

## Support
For typography-related issues or questions, refer to:
- Tailwind Typography Docs: https://tailwindcss.com/docs/font-size
- Google Fonts: https://fonts.google.com/
- Web Typography Best Practices: https://web.dev/font-best-practices/
