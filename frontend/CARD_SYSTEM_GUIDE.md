# Card and Container System Guide (UC-020)

## Overview
This document describes the enhanced Card and Container component system implemented for visual content grouping and hierarchy.

## Components

### 1. Card Component (`src/components/Card.jsx`)

A flexible container for grouping related content with multiple visual variants.

#### Props

- **variant** (string): Visual style variant
  - `default` - Standard white card with shadow
  - `primary` - White card with left sage green border accent
  - `info` - White card with left blue border accent
  - `muted` - Subtle gray background with light shadow
  - `elevated` - Higher shadow for prominence
  - `outlined` - Border-focused with minimal shadow
  - `interactive` - Includes hover/focus effects (lift and shadow)

- **title** (string, optional): Card header title
- **children** (ReactNode): Card content
- **className** (string, optional): Additional CSS classes
- **interactive** (boolean, optional): Enable hover states (deprecated - use `variant="interactive"`)
- **onClick** (function, optional): Makes card clickable and automatically interactive
- **as** (elementType, optional): HTML element to render (default: 'div')

#### Usage Examples

```jsx
// Basic card
<Card title="Section Title">
  <p>Content goes here</p>
</Card>

// Primary variant with accent
<Card variant="primary" title="Welcome">
  <p>Important content with visual emphasis</p>
</Card>

// Interactive card with hover effects
<Card variant="interactive" onClick={() => handleClick()}>
  <p>Clickable card content</p>
</Card>

// Info card
<Card variant="info" title="Notifications">
  <p>Information or status messages</p>
</Card>
```

### 2. Container Component (`src/components/Container.jsx`)

Provides consistent page section layout and max-width constraints.

#### Props

- **level** (number): Container hierarchy level
  - `1` - Widest container (1200px max-width) for main sections
  - `2` - Narrower container (980px max-width) for focused content

- **padded** (boolean, optional): Add visual padding/background styling
- **panel** (boolean, optional): Apply panel styling (background + shadow)
- **children** (ReactNode): Container content
- **className** (string, optional): Additional CSS classes
- **as** (elementType, optional): HTML element to render (default: 'div')

#### Usage Examples

```jsx
// Level 1 container for main page sections
<Container level={1}>
  <h1>Page Title</h1>
  <Card>Content</Card>
</Container>

// Level 2 container for focused content
<Container level={2} className="py-8">
  <Card title="Form">
    <form>...</form>
  </Card>
</Container>

// Panel container with background
<Container level={1} panel>
  <p>Grouped content with visual background</p>
</Container>
```

## CSS Classes

### Card Variants (in `index.css`)

```css
/* Primary accent - sage green left border */
.card--primary {
    border-left: 4px solid var(--color-primary-400);
}

/* Info accent - blue left border */
.card--info {
    border-left: 4px solid var(--color-info-500);
}

/* Muted background */
.card--muted {
    background-color: var(--color-bg-default);
}

/* Interactive hover/focus states */
.card--interactive {
    transition: transform 0.12s ease, box-shadow 0.12s ease;
    cursor: pointer;
}

.card--interactive:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(17, 24, 39, 0.08);
}

/* Focus visible for accessibility */
.card--interactive:focus-visible {
    outline: none;
    box-shadow: 0 10px 20px rgba(17, 24, 39, 0.08), 
                0 0 0 4px rgba(119, 124, 109, 0.12);
}
```

### Container Classes

```css
/* Level 1 - Main sections */
.container-level-1 {
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
    padding: 2rem 1rem;
}

/* Level 2 - Focused content */
.container-level-2 {
    max-width: 980px;
    margin-left: auto;
    margin-right: auto;
    padding: 1.25rem 1rem;
}

/* Panel styling */
.container-panel {
    background: var(--color-bg-light);
    border-radius: 1rem;
    padding: 1.25rem;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
}
```

## Implementation Examples

### Dashboard Page

```jsx
<div className="min-h-screen" style={{ backgroundColor: '#E4E6E0' }}>
  <Container level={1} className="pt-12 pb-12">
    <div className="max-w-2xl mx-auto">
      {/* Primary card for welcome section */}
      <Card variant="primary" className="mb-6">
        <h1>Welcome, {userName}</h1>
        <p>Dashboard content</p>
      </Card>

      {/* Grid of elevated cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Profile Stats" variant="elevated">
          <p>75% complete</p>
        </Card>
        <Card title="Activity" variant="elevated">
          <p>Recent updates</p>
        </Card>
      </div>

      {/* Interactive info card */}
      <Card title="Notifications" variant="info" interactive>
        <p>No new notifications</p>
      </Card>
    </div>
  </Container>
</div>
```

### Profile Page Sections

```jsx
<Container level={1}>
  <div className="max-w-4xl mx-auto">
    {/* Header */}
    <Card variant="primary" className="mb-6">
      <h1>My Profile</h1>
    </Card>

    {/* Content sections */}
    <Card variant="default" title="Basic Information">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Name</label>
          <p>{name}</p>
        </div>
      </div>
    </Card>

    {/* List of interactive items */}
    <Card variant="default" title="Employment History">
      <div className="space-y-4">
        {jobs.map(job => (
          <Card key={job.id} variant="outlined" interactive>
            <h3>{job.title}</h3>
            <p>{job.company}</p>
          </Card>
        ))}
      </div>
    </Card>
  </div>
</Container>
```

## Visual Hierarchy

### Level Structure

1. **Page Background** - Sage green (`#E4E6E0`)
2. **Container** - Centered content area with max-width
3. **Primary Cards** - Major sections with accent borders
4. **Default Cards** - Standard sections  
5. **Nested/Outlined Cards** - Individual items within sections
6. **Interactive Cards** - Clickable items with hover states

### Spacing

- Between major cards: `mb-6` (1.5rem)
- Between nested cards: `space-y-4` (1rem)
- Card padding: `p-6` (1.5rem)
- Container padding: `2rem 1rem` (level 1) or `1.25rem 1rem` (level 2)

## Accessibility

- **Keyboard Navigation**: Interactive cards support Enter/Space key activation
- **Focus Indicators**: Visible focus ring on interactive cards
- **Semantic HTML**: Can render as different elements via `as` prop
- **ARIA**: Role="button" automatically added to clickable cards

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- CSS custom properties (CSS variables)
- CSS transforms and transitions
- Focus-visible pseudo-class

## Migration Guide

### Old Pattern
```jsx
<div className="border rounded-lg p-4 hover:shadow-md transition">
  <h3>Title</h3>
  <p>Content</p>
</div>
```

### New Pattern
```jsx
<Card variant="outlined" interactive title="Title">
  <p>Content</p>
</Card>
```

### Benefits
- Consistent styling across application
- Centralized variant management
- Built-in accessibility features
- Reduced duplication
- Easier maintenance

## Testing

To verify the card system:

1. **Visual Hierarchy**: All major sections should use Cards with appropriate variants
2. **Spacing**: Consistent gaps between cards (4-6 units)
3. **Interactive States**: Hover on employment/education/skill/project cards shows elevation
4. **Keyboard Navigation**: Tab through interactive cards and activate with Enter/Space
5. **Focus Indicators**: Visible focus ring on keyboard navigation
6. **Responsive**: Cards stack properly on mobile devices

## Future Enhancements

Potential additions:
- `success`, `warning`, `error` variant colors
- Collapsible card variant
- Loading state skeleton
- Card footer component
- Card actions slot
- Customizable shadow levels
