/**
 * @fileoverview Core type definitions for the centralized scroll management system.
 * These types form the foundation of the refactored StoryScroller architecture.
 */

import type { IBrowserService } from '../services/BrowserService';

/**
 * The core state managed by the scroll system.
 * This is the single source of truth for all scroll-related state.
 */
export interface ScrollState {
  /** The currently visible section index (0-based). */
  currentSection: number;
  /** The target section during an active animation, null when idle. */
  targetSection: number | null;
  /** Whether an animation is currently in progress. */
  isAnimating: boolean;
  /** Whether the user is actively scrolling (includes momentum). */
  isScrolling: boolean;
  /** Whether new navigation requests should be accepted. */
  canNavigate: boolean;
  /** The current scroll position in pixels. */
  scrollPosition: number;
  /** The current scroll velocity in pixels per second. */
  velocity: number;
  /** Timestamp of the last navigation request. */
  lastNavigationTime: number;
  /** For narrative features: current chapter identifier. */
  currentChapter?: string;
  /** For narrative features: current scene within chapter. */
  currentScene?: string;
  /** Transition phase for advanced motion choreography. */
  transitionPhase?: 'entering' | 'active' | 'exiting';
}

/**
 * A request to navigate to a new section.
 * Priority and metadata support future narrative features.
 */
export interface NavigationRequest {
  /** Unique identifier for this request. */
  id: string;
  /** The target section index. */
  targetSection: number;
  /** The source that triggered this navigation. */
  source: 'user_wheel' | 'user_keyboard' | 'user_touch' | 'programmatic' | 'recovery' | 'narrative';
  /** Priority level for queue processing. */
  priority: 'low' | 'normal' | 'high' | 'critical';
  /** Timestamp when this request was created. */
  timestamp: number;
  /** Optional navigation configuration. */
  options?: NavigationOptions;
}

/**
 * Options to configure a specific navigation animation.
 * Supports both immediate needs and future narrative features.
 */
export interface NavigationOptions {
  /** Custom duration in seconds (overrides default). */
  duration?: number;
  /** Custom easing function (overrides default). */
  easing?: (t: number) => number;
  /** If true, skip animation and jump immediately. */
  immediate?: boolean;
  /** If true, attempt to interrupt ongoing animations. */
  force?: boolean;
  /** Callback when animation completes successfully. */
  onComplete?: () => void;
  /** Callback if animation is interrupted. */
  onInterrupt?: () => void;
  /** Extensible metadata for narrative features. */
  metadata?: {
    /** Transition type for narrative sequences. */
    transitionType?: 'fade' | 'slide' | 'morph' | 'custom';
    /** Motion intensity multiplier. */
    motionIntensity?: number;
    /** Story context for narrative navigation. */
    storyContext?: {
      fromChapter?: string;
      toChapter?: string;
      trigger?: 'user' | 'story' | 'external';
    };
    /** Any additional custom data. */
    [key: string]: any;
  };
}

/**
 * The queue that manages and deduplicates navigation requests.
 */
export interface AnimationQueue {
  /** Current pending requests. */
  requests: NavigationRequest[];
  /** Whether a request is currently being processed. */
  processing: boolean;
  /** ID of the last processed request for debugging. */
  lastProcessedId: string | null;
  /** Add a new request to the queue. Returns the request if accepted, null if rejected. */
  enqueue: (request: Omit<NavigationRequest, 'id' | 'timestamp'>) => NavigationRequest | null;
  /** Get the next request to process. Returns null if queue is empty. */
  dequeue: () => NavigationRequest | null;
  /** Clear all pending requests. */
  clear: () => void;
  /** Get highest priority request without removing it. */
  peek?: () => NavigationRequest | null;
  /** Check if a similar request exists. */
  hasSimilar?: (targetSection: number, withinMs?: number) => boolean;
}

/**
 * The internal instances of the animation controllers.
 * These are the actual GSAP/Lenis/Observer instances.
 */
export interface AnimationControllers {
  /** The Lenis smooth scroll instance. */
  lenis: any | null; // Using 'any' to avoid importing Lenis types
  /** The GSAP Observer instance for input detection. */
  observer: any | null; // Using 'any' to avoid importing Observer types
  /** The active GSAP scroll tween. */
  scrollTween: gsap.core.Tween | null;
  /** The RAF ID from GSAP ticker (not used with new architecture). */
  rafId: number | null;
  /** The interval ID for periodic state verification. */
  verificationIntervalId: NodeJS.Timeout | null;
  /** Cleanup function for keyboard listeners. */
  keyboardCleanup: (() => void) | null;
  /** The GSAP ticker callback for Lenis (for proper cleanup). */
  lenisTickerCallback?: (time: number) => void;
}

/**
 * Configuration options for the scroll manager.
 */
export interface ScrollManagerConfig {
  /** The sections to scroll through. */
  sections: React.ReactNode[];
  /** Base animation duration in seconds. */
  duration?: number;
  /** Default easing function. */
  easing?: (t: number) => number;
  /** Observer tolerance for input sensitivity. */
  tolerance?: number;
  /** Touch gesture multiplier. */
  touchMultiplier?: number;
  /** Whether to prevent default scroll behavior. */
  preventDefault?: boolean;
  /** Whether to invert scroll direction. */
  invertDirection?: boolean;
  /** Enable keyboard navigation. */
  keyboardNavigation?: boolean;
  /** Callback when section changes. */
  onSectionChange?: (index: number) => void;
  /** Optional browser service override for testing. */
  browserService?: IBrowserService;
  /** Enable magnetic snap behavior. */
  magneticSnap?: boolean;
  /** Narrative configuration for future features. */
  narrativeConfig?: {
    /** Enable story progression tracking. */
    trackProgress?: boolean;
    /** Allow non-linear navigation after first view. */
    allowNonLinear?: boolean;
    /** Chapter definitions. */
    chapters?: Array<{
      id: string;
      title: string;
      startSection: number;
      endSection: number;
    }>;
  };
}

/**
 * The public API exposed by the useScrollManager hook.
 * This is what components interact with.
 */
export interface ScrollManagerAPI {
  /** The main container ref to attach to the root element. */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Navigate to a specific section. */
  gotoSection: (index: number, options?: NavigationOptions) => void;
  /** Navigate to the next section. */
  nextSection: () => void;
  /** Navigate to the previous section. */
  prevSection: () => void;
  /** Force all systems to sync to current scroll position. */
  forceSync: () => void;
  /** Nuclear option to reset everything. */
  emergencyReset: () => void;
  /** Clean up all resources. */
  destroy: () => void;
  /** Get current state (for debugging/testing). */
  getState?: () => ScrollState;
  /** Get animation queue status (for debugging). */
  getQueueStatus?: () => { pending: number; processing: boolean };
}

/**
 * Type guards for runtime validation.
 */
export const isNavigationRequest = (value: any): value is NavigationRequest => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.targetSection === 'number' &&
    ['user_wheel', 'user_keyboard', 'user_touch', 'programmatic', 'recovery', 'narrative'].includes(value.source) &&
    ['low', 'normal', 'high', 'critical'].includes(value.priority) &&
    typeof value.timestamp === 'number'
  );
};

export const isScrollState = (value: any): value is ScrollState => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.currentSection === 'number' &&
    typeof value.isAnimating === 'boolean' &&
    typeof value.canNavigate === 'boolean'
  );
};