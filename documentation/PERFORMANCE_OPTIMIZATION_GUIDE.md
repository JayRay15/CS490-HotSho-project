# Performance Optimization Guide

This document outlines the performance optimizations implemented in the HotSho application and provides guidance for CDN configuration with Cloudflare.

## Table of Contents

1. [Frontend Optimizations](#frontend-optimizations)
2. [Backend Optimizations](#backend-optimizations)
3. [CDN Configuration (Cloudflare)](#cdn-configuration-cloudflare)
4. [Image Optimization](#image-optimization)
5. [Performance Monitoring](#performance-monitoring)
6. [Lighthouse Audit Guide](#lighthouse-audit-guide)

---

## Frontend Optimizations

### Code Splitting & Lazy Loading

All route components are lazy-loaded using React's `lazy()` and `Suspense`:

```jsx
// Example from App.jsx
const Dashboard = lazy(() => import("./pages/auth/Dashboard"));

// Wrapped in Suspense with loading fallback
<Suspense fallback={<PageLoader />}>
  <Routes>...</Routes>
</Suspense>
```

**Benefits:**
- Initial bundle size reduced by 60-80%
- Users only download code for pages they visit
- Faster Time to Interactive (TTI)

### Bundle Optimization (Vite)

The `vite.config.js` implements:

1. **Manual chunk splitting** - Large dependencies split into separate files:
   - `vendor-react`: React core libraries
   - `vendor-charts`: Recharts
   - `vendor-ui`: Lucide & Heroicons
   - `vendor-pdf`: PDF generation libraries
   - `vendor-editor`: TipTap editor
   - `vendor-maps`: Leaflet mapping
   - `vendor-dnd`: Drag and drop libraries

2. **Tree shaking** - Unused code eliminated automatically

3. **Production optimizations**:
   - Console statements removed in production
   - Source maps disabled for smaller builds
   - ES2020 target for modern browsers

### Asset Optimization

- Assets under 4KB are inlined as base64
- Hashed filenames for cache busting
- Organized output structure (`assets/js/`, `assets/css/`, `assets/images/`)

---

## Backend Optimizations

### Gzip Compression

All server responses are compressed using the `compression` middleware:

```javascript
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
}));
```

**Typical compression ratios:**
- JSON: 70-80% reduction
- HTML: 60-70% reduction
- JavaScript: 60-70% reduction

### Cache Headers

Implemented tiered caching strategy:

| Resource Type | Cache Duration | Header |
|--------------|----------------|--------|
| Static uploads | 7 days | `max-age=604800` |
| Hashed assets | 1 year | `max-age=31536000, immutable` |
| Monitoring data | 5 minutes | `max-age=300` |
| Market/Salary data | 1 hour | `max-age=3600` |
| User-specific data | No cache | `private, no-cache` |

---

## CDN Configuration (Cloudflare)

### Step 1: Sign Up for Cloudflare Free Tier

1. Go to [cloudflare.com](https://cloudflare.com)
2. Create a free account
3. Add your domain

### Step 2: Update DNS Settings

Point your domain's nameservers to Cloudflare:
- `ns1.cloudflare.com`
- `ns2.cloudflare.com`

### Step 3: Configure Cloudflare Settings

#### Caching Rules

Navigate to **Caching** > **Configuration**:

```
Browser Cache TTL: Respect Existing Headers
Edge Cache TTL: 2 hours
```

#### Page Rules (Create in order)

1. **Cache Static Assets**
   - URL: `*yourdomain.com/assets/*`
   - Settings:
     - Cache Level: Cache Everything
     - Edge Cache TTL: 1 month
     - Browser Cache TTL: 1 year

2. **Cache Images**
   - URL: `*yourdomain.com/uploads/*`
   - Settings:
     - Cache Level: Cache Everything
     - Edge Cache TTL: 1 week

3. **Bypass Cache for API**
   - URL: `*yourdomain.com/api/*`
   - Settings:
     - Cache Level: Bypass
     - Disable Performance

#### Speed Settings

Navigate to **Speed** > **Optimization**:

1. **Auto Minify**: Enable for JavaScript, CSS, HTML
2. **Brotli**: Enable (better compression than Gzip)
3. **Early Hints**: Enable
4. **Rocket Loader**: Enable (delays JS until after render)
5. **HTTP/2**: Enabled by default
6. **HTTP/3 (QUIC)**: Enable for faster connections

#### Security Settings (Recommended)

Navigate to **Security** > **Settings**:

1. **Always Use HTTPS**: On
2. **Automatic HTTPS Rewrites**: On
3. **Minimum TLS Version**: 1.2

### Step 4: Verify CDN is Working

Check response headers:
```bash
curl -I https://yourdomain.com/assets/js/main.js
```

Look for:
- `cf-cache-status: HIT` (served from CDN)
- `cf-ray: xxx` (Cloudflare is active)

---

## Image Optimization

### Using OptimizedImage Component

```jsx
import OptimizedImage from './components/OptimizedImage';

// Lazy loaded image with blur placeholder
<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority={false}
  placeholder="blur"
/>

// High-priority above-fold image
<OptimizedImage
  src="/images/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority={true}
/>
```

### Image Best Practices

1. **Use WebP format** - 25-35% smaller than JPEG
2. **Provide multiple sizes** with srcSet:
   ```jsx
   <OptimizedImage
     src="/images/photo.webp"
     sizes="(max-width: 768px) 100vw, 50vw"
     srcSet="/images/photo-320w.webp 320w,
             /images/photo-640w.webp 640w,
             /images/photo-1280w.webp 1280w"
   />
   ```

3. **Lazy load below-fold images** (default behavior)
4. **Set explicit dimensions** to prevent layout shift

---

## Performance Monitoring

### Web Vitals Tracking

The application automatically tracks Core Web Vitals:

- **LCP** (Largest Contentful Paint): Target < 2.5s
- **FID** (First Input Delay): Target < 100ms
- **CLS** (Cumulative Layout Shift): Target < 0.1
- **TTFB** (Time to First Byte): Target < 600ms
- **FCP** (First Contentful Paint): Target < 1.8s

View metrics in browser console (development) or sent to `/api/monitoring/web-vitals` (production).

### Performance Utilities

```javascript
import { 
  preloadResource, 
  prefetchResource,
  preconnect,
  shouldLoadHighQuality 
} from './utils/performance';

// Preload critical resources
preloadResource('/fonts/inter.woff2', 'font', 'font/woff2', 'anonymous');

// Prefetch next page
prefetchResource('/api/dashboard/data');

// Preconnect to third-party origins
preconnect('https://api.example.com');

// Adapt to network conditions
if (shouldLoadHighQuality()) {
  loadHighResImages();
} else {
  loadLowResImages();
}
```

---

## Lighthouse Audit Guide

### Running Lighthouse

1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Select categories: Performance, Accessibility, Best Practices, SEO
4. Click **Analyze page load**

### Target Scores

| Metric | Target | Priority |
|--------|--------|----------|
| Performance | > 90 | High |
| Accessibility | > 90 | High |
| Best Practices | > 90 | Medium |
| SEO | > 90 | Medium |

### Common Fixes

1. **Slow LCP**
   - Preload hero images
   - Use priority loading for above-fold images
   - Optimize server response time

2. **High CLS**
   - Set explicit image dimensions
   - Reserve space for dynamic content
   - Avoid inserting content above existing content

3. **Poor FID/TTI**
   - Break up long tasks
   - Defer non-critical JavaScript
   - Use code splitting

4. **Large Bundle Size**
   - Review chunk analysis: `npx vite build --analyze`
   - Remove unused dependencies
   - Use dynamic imports for large features

### Continuous Monitoring

For production monitoring, consider:
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) for automated checks
- [web.dev/measure](https://web.dev/measure/) for public page testing
- Cloudflare Analytics for CDN performance

---

## TTFB Optimization Checklist

To achieve TTFB under 600ms:

- [x] Enable gzip/brotli compression
- [x] Implement response caching
- [x] Use CDN (Cloudflare)
- [ ] Database query optimization (indexes, projections)
- [ ] Connection pooling for MongoDB
- [ ] Consider Redis for frequently accessed data
- [ ] Use HTTP/2 or HTTP/3
- [ ] Deploy to edge locations (Cloudflare Workers optional)

---

## Quick Start Commands

```bash
# Build with analysis
cd frontend && npm run build

# Check bundle sizes
npx vite-bundle-visualizer

# Run Lighthouse CLI
npx lighthouse https://yourdomain.com --output=html

# Test compression
curl -H "Accept-Encoding: gzip" -I https://yourdomain.com/api/health
```
