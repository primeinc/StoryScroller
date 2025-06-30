/**
 * @license
 * Copyright (c) 2025 Prime Inc
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
// import '@primeinc/storyscroller/styles'