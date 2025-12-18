# Accessibility (a11y) Test & Remediation Plan

## Objective
Verify and ensure the application meets WCAG 2.1 AA standards for accessibility, making it usable for people with disabilities.

## Scope
- **Frontend Application**: All user-facing pages (Landing, Auth, Dashboard, Job Tracking, etc.)
- **Key User Flows**: Registration, Login, Job Search, Application Tracking, Profile Management.

## Tools
- **Automated**: Google Lighthouse, axe DevTools (Browser Extension).
- **Manual**: Keyboard, NVDA (Screen Reader), Windows Magnifier / Browser Zoom.
- **Code Analysis**: ESLint (jsx-a11y plugin), `@axe-core/react`.

---

## Audit Results Summary (December 2024)

### ESLint jsx-a11y Audit
| Issue Type | Count | Severity |
|------------|-------|----------|
| `label-has-associated-control` | 633 | Error (Critical) |
| `no-static-element-interactions` | 226 | Warning |
| `click-events-have-key-events` | 223 | Warning |
| `mouse-events-have-key-events` | 234 | Warning |
| **Total** | **1,328** | - |

### Key Findings
1. ✅ **HTML lang attribute**: Present (`<html lang="en">`)
2. ❌ **Form Labels**: 633 form inputs missing proper label associations
3. ❌ **Keyboard Navigation**: 223 click handlers without keyboard equivalents
4. ❌ **Mouse Events**: 234 mouse events without keyboard fallbacks
5. ❌ **Interactive Elements**: 226 non-semantic clickable elements

---

## Phase 1: Automated Audits
1.  **Lighthouse Audit**:
    -   Run Lighthouse "Accessibility" audit on all major routes.
    -   Target score: > 90 (ideally 100).
2.  **axe DevTools Scan**:
    -   Use the browser extension to scan each page state (including modals and dropdowns).
    -   Export or record issues.

## Phase 2: Manual Verification
1.  **Keyboard Navigation**:
    -   Verify all interactive elements are reachable via `Tab`.
    -   Verify focus order is logical (left-to-right, top-to-bottom).
    -   **Focus Indicators**: Ensure the focused element has a visible outline/style.
    -   **No Keyboard Traps**: Ensure user can tab out of all areas (modals, maps).
2.  **Screen Reader (NVDA/VoiceOver)**:
    -   Verify images have `alt` text (or `aria-hidden` if decorative).
    -   Verify buttons and links have descriptive text (not just "Click here").
    -   Verify form inputs have associated labels.
    -   Verify dynamic content updates are announced (using `aria-live`).
3.  **Visual & Cognitive**:
    -   **Color Contrast**: Text vs Background must be at least 4.5:1 (AA). Large text 3:1.
    -   **Zoom**: Page must remain functional at 200% zoom.
    -   **Motion**: Ensure animations can be paused or are minimal.

## Phase 3: Remediation Strategy
1.  **Critical**: Fix blockers (keyboard traps, missing form labels, unreadable text).
2.  **High**: Fix focus management, confusing screen reader announcements.
3.  **Medium**: Fix minor semantic issues, improve ARIA labels.

### Prioritized Fix List

#### Priority 1: Form Labels (633 issues)
**Pattern to fix:**
```jsx
// ❌ Bad
<label>Name</label>
<input type="text" />

// ✅ Good - Option A: htmlFor + id
<label htmlFor="name">Name</label>
<input id="name" type="text" />

// ✅ Good - Option B: Wrap input in label
<label>
  Name
  <input type="text" />
</label>
```

#### Priority 2: Keyboard Events (223 issues)
**Pattern to fix:**
```jsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good - Use button
<button onClick={handleClick}>Click me</button>

// ✅ Good - Add keyboard support if div needed
<div 
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabIndex={0}
>
  Click me
</div>
```

#### Priority 3: Mouse Events (234 issues)
**Pattern to fix:**
```jsx
// ❌ Bad
<div onMouseOver={show} onMouseOut={hide}>Hover me</div>

// ✅ Good
<div 
  onMouseOver={show} 
  onMouseOut={hide}
  onFocus={show}
  onBlur={hide}
>
  Hover me
</div>
```

## Checklist for Developers
- [ ] Semantic HTML used (`<button>` not `<div onClick>`).
- [ ] `alt` attributes on all `<img>`.
- [ ] Forms have `<label>` or `aria-label`.
- [ ] Color contrast checked.
- [ ] Focus ring is not suppressed (`outline: none`) without replacement.
