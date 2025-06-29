// Main exports
export { StoryScroller } from './components/StoryScroller'
export { StoryScrollerWithErrorBoundary } from './components/StoryScrollerWithErrorBoundary'
export { StoryScrollerErrorBoundary } from './components/StoryScrollerErrorBoundary'

// New scroll management exports
export { useScrollManager } from './hooks/useScrollManager'
export { useScrollState } from './hooks/useScrollState'

// Debouncing exports
export { useDebouncing } from './hooks/useDebouncing'
export type { DebounceConfig, DebounceState, DebugInfo } from './hooks/useDebouncing'

// Type exports
export type {
  StorySection,
  StoryScrollerConfig,
  StoryScrollerProps,
} from './types'

// New scroll system type exports
export type {
  ScrollState,
  NavigationRequest,
  NavigationOptions,
  ScrollManagerAPI,
  ScrollManagerConfig,
} from './types/scroll-state'

export type {
  ScrollState as ScrollManagerState,
  NavigationRequest as ScrollManagerNavigationRequest,
  ScrollManagerAPI as ScrollManager,
} from './types/scroll-manager'

// Constants exports
export {
  TIMING,
  PHYSICS,
  MAGNETIC_SNAP,
  VELOCITY,
  POSITION_TOLERANCE,
  EASING_FUNCTIONS,
} from './constants/scroll-physics'

// Service exports
export {
  BrowserService,
  MockBrowserService,
  createBrowserService,
  type IBrowserService,
} from './services/BrowserService'

// Animation queue export
export { createAnimationQueue } from './utils/animation-queue'

// Style imports - consumers should import separately:
// import '@primeinc/story-scroller/styles'