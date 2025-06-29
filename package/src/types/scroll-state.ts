/**
 * Comprehensive type definitions for the centralized scroll manager
 * These types support both current functionality and future narrative features
 */

/**
 * Complete scroll state - single source of truth for all scroll-related data
 */
export interface ScrollState {
  // Core position state
  currentSection: number
  targetSection: number | null
  scrollPosition: number
  velocity: number
  
  // Animation state
  isAnimating: boolean
  isScrolling: boolean
  canNavigate: boolean
  animationStartTime: number | null
  animationDuration: number
  
  // Input state
  lastInputType: 'wheel' | 'touch' | 'keyboard' | 'programmatic' | null
  lastInputTime: number
  inputVelocity: number
  
  // Physics state
  magneticActive: boolean
  magneticTarget: number | null
  snapInProgress: boolean
  
  // Narrative-ready extensions (for future use)
  narrativeMode: boolean
  chapterIndex: number
  sceneIndex: number
  transitionType: 'none' | 'fade' | 'slide' | 'custom'
  
  // Error recovery state
  lastValidSection: number
  errorCount: number
  recoveryAttempts: number
}

/**
 * Navigation request queue for deduplication and priority handling
 */
export interface NavigationQueue {
  requests: NavigationRequest[]
  processing: boolean
  lastProcessedId: string | null
  highPriorityCount: number
}

/**
 * Individual navigation request with metadata
 */
export interface NavigationRequest {
  id: string
  targetSection: number
  timestamp: number
  source: 'user' | 'external' | 'magnetic' | 'recovery' | 'narrative'
  priority: 'low' | 'normal' | 'high' | 'critical'
  options?: NavigationOptions
}

/**
 * Options for navigation requests
 */
export interface NavigationOptions {
  duration?: number
  easing?: (t: number) => number
  immediate?: boolean
  force?: boolean
  onComplete?: () => void
  onInterrupt?: () => void
  metadata?: Record<string, unknown>
}

/**
 * Complete API exposed by the scroll manager
 */
export interface ScrollManagerAPI {
  // Navigation methods
  gotoSection: (index: number, options?: NavigationOptions) => void
  nextSection: (options?: NavigationOptions) => void
  prevSection: (options?: NavigationOptions) => void
  
  // State queries
  getState: () => Readonly<ScrollState>
  getCurrentSection: () => number
  canNavigate: () => boolean
  isAnimating: () => boolean
  
  // Synchronization methods
  forceSync: () => void
  emergency: () => void
  verifyState: () => boolean
  
  // Queue management
  clearNavigationQueue: () => void
  getPendingNavigations: () => NavigationRequest[]
  
  // Physics control
  enableMagneticSnap: (enabled: boolean) => void
  setVelocityThreshold: (threshold: number) => void
  
  // Narrative extensions (for future use)
  enterNarrativeMode: () => void
  exitNarrativeMode: () => void
  setChapter: (chapter: number, scene?: number) => void
  playTransition: (type: string, options?: Record<string, unknown>) => void
}

/**
 * Configuration for the scroll manager
 */
export interface ScrollManagerConfig {
  // Required
  sections: number
  
  // Animation
  duration?: number
  easing?: (t: number) => number
  
  // Input handling
  tolerance?: number
  touchMultiplier?: number
  preventDefault?: boolean
  keyboardNavigation?: boolean
  
  // Physics
  magneticThreshold?: number
  magneticVelocityThreshold?: number
  velocityTrackingRate?: number
  enableMagneticSnap?: boolean
  
  // Callbacks
  onSectionChange?: (index: number, previousIndex: number) => void
  onStateChange?: (state: ScrollState) => void
  onError?: (error: Error, context: string) => void
  
  // Narrative (for future use)
  narrativeConfig?: {
    chapters: number
    scenesPerChapter: number[]
    transitions: Record<string, TransitionConfig>
  }
}

/**
 * Transition configuration for narrative mode
 */
export interface TransitionConfig {
  duration: number
  easing: string | ((t: number) => number)
  beforeStart?: () => void
  onComplete?: () => void
  properties?: Record<string, unknown>
}

/**
 * Internal controller references
 */
export interface ScrollControllers {
  lenis: any | null // Will be typed properly when implementing
  observer: any | null // Will be typed properly when implementing
  scrollTween: any | null // Will be typed properly when implementing
  rafId: number | null
  cleanupFns: (() => void)[]
}

/**
 * Scroll manager internal state (not exposed via API)
 */
export interface ScrollManagerInternalState {
  state: ScrollState
  controllers: ScrollControllers
  navigationQueue: NavigationQueue
  config: Required<ScrollManagerConfig>
  initialized: boolean
  destroyed: boolean
}

/**
 * Events emitted by the scroll manager
 */
export interface ScrollManagerEvents {
  'navigation:start': { from: number; to: number; source: string }
  'navigation:complete': { section: number; duration: number }
  'navigation:interrupt': { reason: string; currentSection: number }
  'state:sync': { previousState: ScrollState; newState: ScrollState }
  'error:recovery': { error: Error; attemptNumber: number }
  'narrative:transition': { type: string; chapter: number; scene: number }
}

/**
 * Type guards for runtime validation
 */
export const isValidSection = (index: number, sections: number): boolean => {
  return Number.isInteger(index) && index >= 0 && index < sections
}

export const isNavigationRequest = (obj: unknown): obj is NavigationRequest => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'targetSection' in obj &&
    'timestamp' in obj &&
    'source' in obj &&
    'priority' in obj
  )
}

export const isScrollState = (obj: unknown): obj is ScrollState => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'currentSection' in obj &&
    'isAnimating' in obj &&
    'canNavigate' in obj
  )
}