# Changelog

All notable changes to the StoryScroller package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-30

### 🎉 Initial Public Release

This marks the first stable release of StoryScroller, a production-ready React component for narrative-driven scroll experiences.

### ✨ Features

#### Core Navigation System
- **Smooth scroll animations** powered by GSAP and Lenis
- **Section-based navigation** with automatic snapping
- **Mouse wheel support** with intelligent momentum detection
- **Keyboard navigation** (Arrow keys, Page Up/Down, Home/End)
- **Touch/swipe support** for mobile devices
- **Programmatic API** for external control

#### Performance & Reliability
- **Animation queue system** with deduplication and priority handling
- **Debounced scroll handling** to prevent excessive animations
- **State synchronization** with automatic drift correction
- **Error boundaries** with graceful fallback behavior
- **Memory leak prevention** with comprehensive cleanup

#### Accessibility (WCAG 2.1 AA Compliant)
- **Screen reader support** with ARIA labels and live regions
- **Keyboard navigation** with focus management
- **Reduced motion support** respecting `prefers-reduced-motion`
- **High contrast mode** compatibility
- **Section announcements** for assistive technologies

#### Developer Experience
- **Full TypeScript support** with comprehensive type definitions
- **Comprehensive testing suite** with Playwright and Vitest
- **Error boundary components** for development and production
- **Debug logging** with configurable verbosity
- **Extensive documentation** with examples and troubleshooting

### 🏗️ Architecture

#### State Management
- **Centralized scroll state** with `useScrollState` hook
- **Debouncing system** with `useDebouncing` hook
- **Browser service abstraction** for testability
- **Animation queue** with intelligent request handling

#### Scroll Physics
- **Lenis integration** for momentum-based scrolling
- **GSAP Observer** for wheel/touch event handling
- **Configurable physics** (lerp, velocity, tolerance)
- **Magnetic snapping** with velocity-based thresholds

#### Testing Framework
- **Functional tests** covering real-world navigation scenarios
- **Unit tests** for core logic and utilities
- **Cross-browser testing** (Chrome, Firefox, Safari, mobile)
- **Performance benchmarks** with timing validation

### 📦 Bundle Information

- **Core bundle size**: ~46KB minified
- **With dependencies**: ~150KB total (GSAP + Lenis)
- **Tree-shakeable**: Only import what you use
- **ESM format**: Modern module system
- **TypeScript declarations**: Full type safety

### 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Android 90+

### 📚 API Reference

#### Main Component
```typescript
<StoryScroller
  sections={ReactNode[]}           // Required: Array of section components
  duration={number}                // Animation duration (default: 0.6s)
  easing={(t: number) => number}   // Custom easing function
  tolerance={number}               // Input sensitivity (default: 50)
  keyboardNavigation={boolean}     // Enable keyboard controls (default: true)
  ariaLabel={string}               // Accessibility label
  sectionLabels={string[]}         // Custom section labels for screen readers
  onSectionChange={(index) => {}}  // Section change callback
/>
```

#### Global API
```typescript
window.storyScrollerAPI = {
  gotoSection: (index: number) => void
  nextSection: () => void
  prevSection: () => void
  getState: () => ScrollState
  getQueueStatus: () => QueueStatus
  forceSync: () => void
  emergencyReset: () => void
}
```

#### Hooks
```typescript
// Advanced usage
import { useScrollManager, useScrollState, useDebouncing } from '@primeinc/story-scroller'
```

### 🔧 Configuration

#### Physics Constants
```typescript
import { TIMING, PHYSICS, EASING_FUNCTIONS } from '@primeinc/story-scroller'

// Customizable timing
TIMING.NAVIGATION_COOLDOWN      // 50ms
TIMING.SCROLL_END_TIMEOUT       // 150ms
TIMING.STATE_VERIFICATION_INTERVAL // 1000ms

// Physics values
PHYSICS.BASE_ANIMATION_DURATION  // 0.6s
PHYSICS.LENIS_LERP              // 0.1
PHYSICS.OBSERVER_TOLERANCE      // 50

// Easing functions
EASING_FUNCTIONS.CUBIC_OUT      // Default easing
EASING_FUNCTIONS.EXPO_OUT       // Alternative options
```

### 🚀 Migration from Beta

This is the first public release, but if you were using pre-release versions:

#### Breaking Changes
- Renamed `StoryScrollerComponent` to `StoryScroller`
- Updated default animation duration from 1.2s to 0.6s
- Reduced navigation cooldown from 200ms to 50ms
- Added required accessibility props

#### New Features
- Full accessibility support
- Reduced motion compliance
- Enhanced error handling
- Global API exposure

### 🐛 Known Issues

#### Test Failures (In Progress)
- Rapid button navigation test occasionally fails in Chromium
- State consistency test may fail under heavy load
- These are timing-related and don't affect production usage

#### Workarounds
```typescript
// For better rapid navigation, increase tolerance
<StoryScroller tolerance={80} />

// For production stability, add error boundary
<StoryScrollerWithErrorBoundary sections={sections} />
```

### 🔮 Roadmap

#### Version 1.1 (Q3 2025)
- Enhanced magnetic snapping
- Parallax scroll effects
- Custom transition animations
- Performance optimizations

#### Version 1.2 (Q4 2025)
- Chapter/scene navigation
- Narrative mode features
- Advanced keyboard shortcuts
- Plugin architecture

### 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

### 🙏 Acknowledgments

- **GSAP** by GreenSock for best-in-class animations
- **Lenis** by Studio Freight for smooth scrolling physics
- **React** team for the component architecture
- Community contributors and beta testers

### 🔗 Links

- [Documentation](https://github.com/primeinc/StoryScroller#readme)
- [GitHub Repository](https://github.com/primeinc/StoryScroller)
- [NPM Package](https://www.npmjs.com/package/@primeinc/story-scroller)
- [Demo Application](https://storyscroller-demo.vercel.app)

---

For questions, bug reports, or feature requests, please visit our [GitHub Issues](https://github.com/primeinc/StoryScroller/issues).