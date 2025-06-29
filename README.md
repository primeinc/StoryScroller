# StoryScroller

A production-ready React scroll-snapping component using GSAP and Lenis, extracted from the Prime Inc portfolio monorepo.

## Overview

StoryScroller is a comprehensive scroll-based storytelling component that provides smooth scrolling, snap functionality, and advanced navigation features. This project contains both the reusable package and a complete demo implementation.

## Structure

```
storyscroller/
├── package/              # The reusable StoryScroller React component
│   ├── src/             # Component source code
│   ├── dist/            # Built package
│   └── docs/            # Package documentation
├── demo/                # Demo application showcasing StoryScroller
│   ├── src/             # Demo source code
│   ├── tests/           # E2E and integration tests
│   └── playwright-report/ # Test results
├── dev-tools/           # Shared development utilities
└── docs/                # Project documentation
    ├── StoryScroller.md
    ├── StoryScroller-research.md
    ├── StoryScroller-Feedback.md
    └── STORY_SCROLLER_CRITICAL_FIXES.md
```

## Features

### StoryScroller Package
- **Smooth Scrolling**: Powered by Lenis for butter-smooth scroll experiences
- **GSAP Animations**: Professional-grade animations and transitions
- **Scroll Snapping**: Precise section-to-section navigation
- **Keyboard Navigation**: Full accessibility support
- **Mouse/Touch Support**: Multi-input device compatibility
- **Debounced Events**: Optimized performance
- **Error Boundaries**: Production-ready error handling
- **TypeScript**: Full type safety

### Demo Application
- **Real-world Implementation**: Complete working example
- **Interactive Navigation**: Dot navigation and keyboard controls
- **Responsive Design**: Works across all device sizes
- **Test Suite**: Comprehensive Playwright test coverage
- **Performance Monitoring**: Built-in performance baseline tests

## Quick Start

### Prerequisites
- Node.js >= 20.17.0
- pnpm >= 9.12.0

### Installation

```bash
cd storyscroller
pnpm install
```

### Development

```bash
# Start the demo application
pnpm dev

# Build the package
pnpm build:package

# Run tests
pnpm test

# Run linting
pnpm lint
```

### Using the Package

```jsx
import { StoryScroller } from '@primeinc/story-scroller'
import '@primeinc/story-scroller/styles'

function App() {
  const sections = [
    { id: 'intro', title: 'Introduction' },
    { id: 'features', title: 'Features' },
    { id: 'demo', title: 'Demo' }
  ]

  return (
    <StoryScroller 
      sections={sections}
      enableKeyboardNavigation={true}
      enableMouseNavigation={true}
      enableDotNavigation={true}
    >
      <section data-story-section="intro">
        <h1>Introduction</h1>
      </section>
      <section data-story-section="features">
        <h1>Features</h1>
      </section>
      <section data-story-section="demo">
        <h1>Demo</h1>
      </section>
    </StoryScroller>
  )
}
```

## Package Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start demo in development mode |
| `pnpm build` | Build both package and demo |
| `pnpm test` | Run all tests |
| `pnpm lint` | Run linting on all packages |
| `pnpm typecheck` | Run TypeScript checks |

## Documentation

- **[StoryScroller.md](./StoryScroller.md)** - Main component documentation
- **[StoryScroller-research.md](./StoryScroller-research.md)** - Technical research and decisions
- **[StoryScroller-Feedback.md](./StoryScroller-Feedback.md)** - User feedback and improvements
- **[STORY_SCROLLER_CRITICAL_FIXES.md](./STORY_SCROLLER_CRITICAL_FIXES.md)** - Important fixes and updates

### Package Documentation
- **[package/README.md](./package/README.md)** - Package-specific documentation
- **[package/docs/TESTABLE_ARCHITECTURE.md](./package/docs/TESTABLE_ARCHITECTURE.md)** - Testing architecture
- **[package/MIGRATION_CHECKLIST.md](./package/MIGRATION_CHECKLIST.md)** - Migration guide
- **[package/NARRATIVE_READY_CHECKLIST.md](./package/NARRATIVE_READY_CHECKLIST.md)** - Narrative implementation guide

## Testing

The project includes comprehensive testing:

- **Unit Tests**: Component-level testing with Vitest
- **Integration Tests**: Full component integration testing
- **E2E Tests**: Playwright browser automation tests
- **Performance Tests**: Baseline performance monitoring

```bash
# Run package tests
pnpm test:package

# Run demo tests (Playwright)
pnpm test:demo

# Run with UI
cd demo && pnpm test:ui
```

## Architecture

### Package Architecture
- **Component Layer**: React components with error boundaries
- **Hook Layer**: Custom hooks for scroll management and state
- **Service Layer**: Browser service for cross-browser compatibility
- **State Layer**: Redux-style reducer for scroll state management
- **Utils Layer**: Animation queue and scroll synchronization utilities

### Demo Architecture
- **Vite**: Fast development and building
- **React 18**: Latest React with concurrent features
- **Tailwind CSS**: Utility-first styling
- **Playwright**: E2E testing framework

## Contributing

1. Make changes to the package in `package/src/`
2. Test changes using the demo: `pnpm dev`
3. Run tests: `pnpm test`
4. Build the package: `pnpm build:package`

## License

MIT License - see individual package licenses for details.

## Original Source

This project was extracted from the [Prime Inc portfolio monorepo](https://github.com/ryleebrasseur/portfolio) to create a standalone, reusable package.