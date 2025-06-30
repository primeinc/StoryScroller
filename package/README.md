# StoryScroller

[![npm version](https://badge.fury.io/js/@primeinc%2Fstory-scroller.svg)](https://badge.fury.io/js/@primeinc%2Fstory-scroller)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@primeinc/story-scroller)](https://bundlephobia.com/package/@primeinc/story-scroller)

A high-performance React component for narrative-driven scroll experiences. Built with GSAP and Lenis for buttery-smooth section-based navigation with full motion control.

## Why StoryScroller?

- **🎬 Narrative-First**: Built specifically for storytelling experiences with chapter/scene support
- **⚡ Blazing Fast**: Hardware-accelerated animations via GSAP
- **🎯 Precise Control**: Frame-perfect scroll physics with customizable easing
- **🔧 Production-Ready**: Battle-tested with comprehensive error recovery
- **📱 Universal**: Works flawlessly on desktop, mobile, and everything in between

## Installation

```bash
pnpm add @primeinc/story-scroller
```

## Quick Start

```tsx
import { StoryScroller } from '@primeinc/story-scroller'
import '@primeinc/story-scroller/styles'

function App() {
  const sections = [
    <section key="intro">
      <h1>Chapter 1</h1>
      <p>Your story begins...</p>
    </section>,
    <section key="conflict">
      <h1>Chapter 2</h1>
      <p>The plot thickens...</p>
    </section>,
    <section key="resolution">
      <h1>Chapter 3</h1>
      <p>And they lived happily ever after.</p>
    </section>
  ]

  return (
    <StoryScroller 
      sections={sections}
      onSectionChange={(index) => console.log(`Section ${index}`)}
    />
  )
}
```

## Core Concepts

### Sections
Each section is a full-viewport container that the scroller will snap to. Sections can contain any React content - from simple text to complex 3D scenes.

### Physics-Based Scrolling
StoryScroller uses Lenis for momentum-based scrolling with configurable lerp values, creating natural-feeling navigation that responds to user intent.

### Animation Queue
Navigation requests are intelligently queued and deduplicated, ensuring smooth transitions even with rapid user input.

## Configuration

```tsx
<StoryScroller
  sections={sections}
  
  // Animation
  duration={0.6}                    // Scroll animation duration (seconds)
  easing={(t) => t * t * t}        // Custom easing function
  
  // Physics
  tolerance={50}                    // Input sensitivity (higher = less sensitive)
  preventDefault={true}             // Prevent native scroll
  invertDirection={false}           // Invert scroll direction
  
  // Features
  keyboardNavigation={true}         // Arrow key support
  enableMagneticSnap={true}        // Magnetic section snapping
  magneticThreshold={0.15}         // Distance to trigger magnetic snap
  magneticVelocityThreshold={5}    // Max velocity for magnetic snap
  
  // Callbacks
  onSectionChange={(index) => {}}  // Section change handler
  
  // Accessibility
  ariaLabel="Story sections"       // Container ARIA label
  sectionLabels={["Intro", "Features", "Conclusion"]} // Custom section labels
  
  // Styling
  containerClassName="my-scroller"
  sectionClassName="my-section"
/>
```

## Advanced Usage

### Programmatic Control

```tsx
function NavigationExample() {
  useEffect(() => {
    // Access the global API
    const api = window.storyScrollerAPI
    
    // Navigate programmatically
    api.gotoSection(2)      // Jump to section 3 (0-indexed)
    api.nextSection()       // Go forward
    api.prevSection()       // Go back
    
    // Get current state
    const state = api.getState()
    console.log(state.currentSection)
    console.log(state.isAnimating)
    
    // Emergency controls
    api.forceSync()         // Force sync scroll position
    api.emergencyReset()    // Nuclear reset
  }, [])

  return <StoryScroller sections={sections} />
}
```

### Custom Navigation UI

```tsx
function CustomNav() {
  const [state, setState] = useState({ 
    current: 0, 
    total: 5,
    isAnimating: false 
  })

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.storyScrollerAPI?.getState) {
        const apiState = window.storyScrollerAPI.getState()
        setState({
          current: apiState.currentSection,
          total: 5,
          isAnimating: apiState.isAnimating
        })
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <nav className="fixed top-4 right-4 z-50">
      <button 
        onClick={() => window.storyScrollerAPI?.prevSection()}
        disabled={state.current === 0 || state.isAnimating}
      >
        Previous
      </button>
      
      <span>{state.current + 1} / {state.total}</span>
      
      <button 
        onClick={() => window.storyScrollerAPI?.nextSection()}
        disabled={state.current === state.total - 1 || state.isAnimating}
      >
        Next
      </button>
    </nav>
  )
}
```

### With GSAP Animations

```tsx
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

function AnimatedSection({ isActive, children }) {
  const containerRef = useRef()
  
  useGSAP(() => {
    if (isActive) {
      gsap.from(containerRef.current.children, {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out"
      })
    }
  }, [isActive])
  
  return <div ref={containerRef}>{children}</div>
}
```

## API Reference

### Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sections` | `ReactNode[]` | required | Array of section components |
| `duration` | `number` | `0.6` | Animation duration in seconds |
| `easing` | `(t: number) => number` | Exponential ease-out | Easing function |
| `tolerance` | `number` | `50` | Input sensitivity threshold |
| `preventDefault` | `boolean` | `true` | Prevent native scroll |
| `invertDirection` | `boolean` | `false` | Invert scroll direction |
| `keyboardNavigation` | `boolean` | `true` | Enable keyboard controls |
| `enableMagneticSnap` | `boolean` | `true` | Enable magnetic snapping |
| `magneticThreshold` | `number` | `0.15` | Magnetic snap distance |
| `magneticVelocityThreshold` | `number` | `5` | Max velocity for snap |
| `onSectionChange` | `(index: number) => void` | - | Section change callback |
| `ariaLabel` | `string` | `"Story sections"` | Container ARIA label |
| `sectionLabels` | `string[]` | - | Custom labels for screen readers |
| `containerClassName` | `string` | - | Container CSS class |
| `sectionClassName` | `string` | - | Section CSS class |

### Global API Methods

Available via `window.storyScrollerAPI`:

| Method | Returns | Description |
|--------|---------|-------------|
| `gotoSection(index)` | `void` | Navigate to specific section |
| `nextSection()` | `void` | Go to next section |
| `prevSection()` | `void` | Go to previous section |
| `getState()` | `ScrollState` | Get current scroll state |
| `getQueueStatus()` | `QueueStatus` | Get animation queue status |
| `forceSync()` | `void` | Force sync to current position |
| `emergencyReset()` | `void` | Reset entire system |

### State Shape

```typescript
interface ScrollState {
  // Position
  currentSection: number        // Current visible section
  targetSection: number | null  // Animation target
  scrollPosition: number        // Scroll position in pixels
  velocity: number              // Current scroll velocity
  
  // Status
  isAnimating: boolean          // Animation in progress
  isScrolling: boolean          // User scrolling
  canNavigate: boolean          // Ready for navigation
  
  // Timing
  lastNavigationTime: number    // Last navigation timestamp
  
  // Narrative (future features)
  narrativeMode: boolean        // Story mode active
  chapterIndex: number          // Current chapter
  sceneIndex: number            // Current scene
  transitionType: string        // Transition style
}
```

## Performance Optimization

### Bundle Size
- Core: ~46KB minified (ESM)
- With dependencies (GSAP + Lenis): ~150KB total
- Tree-shakeable exports
- Full TypeScript declarations included

### Optimization Tips

1. **Lazy Load Sections**: Load section content on-demand
2. **Optimize Images**: Use WebP/AVIF with proper sizing
3. **Debounce Callbacks**: Throttle `onSectionChange` handlers
4. **CSS Containment**: Use `contain: layout style` on sections

## Accessibility

StoryScroller v1.0 is **WCAG 2.1 AA compliant** and built with accessibility as a priority:

- **🎯 Keyboard Navigation**: Full support for arrow keys, Page Up/Down, Home/End
- **📢 Screen Reader Support**: Live announcements with custom section labels
- **🎨 High Contrast**: Works with high contrast and reduced motion preferences  
- **⚡ Reduced Motion**: Automatically disables animations when `prefers-reduced-motion: reduce`
- **🔍 Focus Management**: Proper focus indicators and tabindex management
- **🆔 ARIA Labels**: Comprehensive labeling for assistive technologies
- **📱 CSS Fallback**: Works without JavaScript using native scroll-snap

### Accessibility Configuration

```tsx
<StoryScroller
  sections={sections}
  ariaLabel="Story progression with 5 chapters"
  sectionLabels={[
    "Introduction to our product",
    "Key features overview", 
    "Customer testimonials",
    "Pricing information",
    "Get started today"
  ]}
/>
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Android 90+

## Troubleshooting

### Mac Trackpad Sensitivity
Mac trackpads can be overly sensitive. Increase the `tolerance` prop:
```tsx
<StoryScroller tolerance={80} />
```

### Animation Jank
Ensure GPU acceleration:
```css
.story-scroller-section {
  will-change: transform;
  transform: translateZ(0);
}
```

### Memory Leaks
StoryScroller automatically cleans up, but ensure you're not creating closures in callbacks:
```tsx
// ❌ Bad - creates new function every render
<StoryScroller onSectionChange={(i) => setSection(i)} />

// ✅ Good - stable reference
const handleChange = useCallback((i) => setSection(i), [])
<StoryScroller onSectionChange={handleChange} />
```

## Examples

### Marketing Site
```tsx
<StoryScroller
  sections={[
    <HeroSection />,
    <FeaturesSection />,
    <TestimonialsSection />,
    <CTASection />
  ]}
  duration={0.8}
  enableMagneticSnap={true}
/>
```

### Interactive Story
```tsx
<StoryScroller
  sections={storyChapters}
  duration={1.5}
  easing={(t) => 1 - Math.pow(1 - t, 4)}
  onSectionChange={(chapter) => {
    playChapterMusic(chapter)
    updateProgressBar(chapter)
  }}
/>
```

### Product Showcase
```tsx
<StoryScroller
  sections={products.map(product => 
    <ProductSection key={product.id} {...product} />
  )}
  keyboardNavigation={true}
  tolerance={30}
/>
```

## License

MIT © Prime Inc

---

Built with ❤️ using [GSAP](https://gsap.com) and [Lenis](https://github.com/darkroomengineering/lenis)