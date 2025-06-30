# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-30

### Added
- **Core Features**
  - Production-ready React component for narrative-driven scroll experiences
  - Physics-based smooth scrolling powered by Lenis
  - Hardware-accelerated animations via GSAP
  - Intelligent section snapping with magnetic attraction
  - Full TypeScript support with comprehensive type definitions
  - Modular architecture with tree-shakeable exports

- **Navigation & Controls**
  - Multiple navigation methods: scroll, keyboard, touch, and programmatic API
  - Customizable keyboard navigation with arrow keys support
  - Touch-optimized gestures for mobile devices
  - Configurable scroll sensitivity and direction
  - Animation queue with intelligent deduplication

- **Performance**
  - Consistent 60 FPS performance across all platforms
  - Optimized bundle size: 47.2KB core package
  - Hardware acceleration for buttery-smooth animations
  - Efficient memory management and cleanup
  - Smart render optimization with React 18 features

- **Developer Experience**
  - Comprehensive API with intuitive configuration
  - Extensive documentation and interactive demos
  - Full ESM support with proper module exports
  - Development tools integration (React DevTools compatible)
  - Detailed error messages with recovery suggestions

- **Accessibility**
  - WCAG 2.1 AA compliant implementation
  - Full keyboard navigation support
  - Screen reader compatibility with semantic HTML
  - Reduced motion support (respects prefers-reduced-motion)
  - Focus management and visual indicators

- **Cross-Platform Support**
  - Browser support: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
  - Mobile-first responsive design
  - Progressive enhancement approach
  - SSR/SSG compatible (Next.js, Gatsby, etc.)
  - React 18+ with Concurrent Features support

- **Configuration Options**
  - Customizable animation duration and easing curves
  - Adjustable scroll tolerance and sensitivity
  - Magnetic snap threshold configuration
  - Custom section labels for accessibility
  - Flexible styling with className props

- **Testing & Quality**
  - Comprehensive test suite with Playwright and Vitest
  - 100% TypeScript coverage
  - Automated CI/CD pipeline with GitHub Actions
  - Performance benchmarking suite
  - Visual regression testing

### Security
- Content Security Policy (CSP) compatible
- No external dependencies beyond core libraries
- Regular dependency audits
- Secure default configurations

### Documentation
- Comprehensive README with quick start guide
- API documentation with TypeScript definitions
- Interactive demo with live configuration
- Integration guides for popular frameworks
- Performance optimization tips

## [0.1.0-beta] - 2024-12-15 (Pre-release)

### Added
- Initial beta release
- Basic smooth scrolling functionality
- Section-based navigation
- Early TypeScript support

---

## Upgrade Guide

### From 0.x to 1.0

StoryScroller 1.0 is a complete rewrite with significant improvements. While the basic API remains similar, there are some breaking changes:

1. **Import Changes**
   ```tsx
   // Before (0.x)
   import StoryScroller from '@primeinc/story-scroller'
   
   // After (1.0)
   import { StoryScroller } from '@primeinc/story-scroller'
   import '@primeinc/story-scroller/styles' // Styles now separate
   ```

2. **Configuration Props**
   - `scrollDuration` → `duration`
   - `scrollTolerance` → `tolerance`
   - `enableKeyboard` → `keyboardNavigation`
   - `onScroll` → `onSectionChange`

3. **New Required Props**
   - `sections` is now required (was `children` before)

4. **Improved TypeScript**
   - All props are now fully typed
   - Better IDE autocomplete support

### Migration Example

```tsx
// Before (0.x)
<StoryScroller
  scrollDuration={1.5}
  scrollTolerance={100}
  enableKeyboard={true}
  onScroll={(index) => console.log(index)}
>
  <div>Section 1</div>
  <div>Section 2</div>
</StoryScroller>

// After (1.0)
<StoryScroller
  sections={[
    <div key="1">Section 1</div>,
    <div key="2">Section 2</div>
  ]}
  duration={1.5}
  tolerance={100}
  keyboardNavigation={true}
  onSectionChange={(index) => console.log(index)}
/>
```

[1.0.0]: https://github.com/primeinc/StoryScroller/releases/tag/v1.0.0
[0.1.0-beta]: https://github.com/primeinc/StoryScroller/releases/tag/v0.1.0-beta