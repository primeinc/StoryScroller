/**
 * @fileoverview Physics constants and timing configurations for the scroll system.
 * Centralizes all "magic numbers" for easy tuning and consistency.
 */

/** Timing constants for animations and debouncing */
export const TIMING = {
  /** Base animation duration in seconds */
  BASE_DURATION: 1.2,
  /** Base animation duration in seconds (alias for compatibility) */
  BASE_ANIMATION_DURATION: 1.2,
  /** Minimum animation duration to prevent jarring transitions */
  MIN_DURATION: 0.3,
  /** Maximum animation duration to prevent sluggish feel */
  MAX_DURATION: 2.5,
  /** Debounce threshold for rapid scroll events (ms) */
  DEBOUNCE_THRESHOLD: 100,
  /** Time in ms to ignore duplicate navigation requests for the same target */
  DEDUPLICATION_THRESHOLD: 100,
  /** Time to wait before considering scroll ended (ms) */
  SCROLL_END_TIMEOUT: 150,
  /** Hydration delay for Next.js (ms) */
  HYDRATION_DELAY: 100,
  /** State verification interval (ms) */
  STATE_CHECK_INTERVAL: 500,
  /** Interval in ms for the periodic state verification check */
  STATE_VERIFICATION_INTERVAL: 500,
  /** Threshold in ms to consider an animation "stuck" if it hasn't completed */
  STUCK_ANIMATION_THRESHOLD: 5000,
  /** Navigation cooldown to prevent rapid section changes */
  NAVIGATION_COOLDOWN: 200,
  /** Position check delay after animation */
  POSITION_CHECK_DELAY: 100,
  /** ScrollTrigger config delay to avoid hydration errors */
  SCROLLTRIGGER_INIT_DELAY: 0,
} as const;

/** Physics parameters for smooth scrolling */
export const PHYSICS = {
  /** Base duration in seconds for a single-section scroll animation */
  BASE_ANIMATION_DURATION: 1.2,
  /** Lenis lerp (smoothing) factor (0-1, lower is smoother) */
  LENIS_LERP: 0.1,
  /** Lenis wheel sensitivity multiplier */
  LENIS_WHEEL_MULTIPLIER: 0.8,
  /** Wheel scroll multiplier (reduced for better control) */
  WHEEL_MULTIPLIER: 0.8,
  /** Default easing function */
  DEFAULT_EASING: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  /** Observer tolerance for trackpad debouncing (higher = less sensitive) */
  OBSERVER_TOLERANCE: 50,
  /** Touch gesture multiplier */
  TOUCH_MULTIPLIER: 2,
  /** Wheel speed adjustment */
  WHEEL_SPEED: -1,
  /** Duration multiplier for touch devices */
  TOUCH_DURATION_MULTIPLIER: 0.8,
  /** Lenis duration multiplier (slightly faster for responsiveness) */
  LENIS_DURATION_MULTIPLIER: 0.8,
} as const;

/** Parameters for the magnetic snap effect */
export const MAGNETIC_SNAP = {
  /** If scroll progress is within this distance of a section edge, snapping may occur (0.15 = 15% of viewport height) */
  MAGNETIC_THRESHOLD: 0.15,
  /** The maximum scroll velocity (pixels/second) below which magnetic snap can be triggered */
  MAGNETIC_VELOCITY_THRESHOLD: 10,
  /** The interval in ms to check the scroll velocity */
  VELOCITY_TRACKING_RATE: 20,
  /** Enable magnetic snap by default */
  ENABLED: true,
  /** Snap distance threshold as percentage of viewport */
  SNAP_THRESHOLD: 0.3,
} as const;

/** Velocity tracking for scroll physics */
export const VELOCITY = {
  /** Sampling rate for velocity calculation (ms) */
  SAMPLE_RATE: 16,
  /** Minimum samples for accurate velocity */
  MIN_SAMPLES: 3,
  /** Maximum velocity for snap consideration (px/s) */
  SNAP_THRESHOLD: 50,
  /** Maximum velocity for calculations */
  MAX_VELOCITY: 50,
  /** Velocity decay rate */
  VELOCITY_DECAY: 0.95,
} as const;

/** Scroll position tolerances */
export const POSITION_TOLERANCE = {
  /** Drift tolerance as percentage of viewport height */
  DRIFT_TOLERANCE: 0.1, // 10%
  /** Absolute drift tolerance in pixels */
  DRIFT_TOLERANCE_PX: 50,
  /** Snap distance threshold */
  SNAP_THRESHOLD: 0.3, // 30% of viewport
  /** Position verification tolerance */
  VERIFICATION_TOLERANCE: 1, // 1px
} as const;

/** ScrollTrigger configuration */
export const SCROLLTRIGGER_CONFIG = {
  /** Sync interval for performance */
  SYNC_INTERVAL: 40,
  /** Auto-refresh events */
  AUTO_REFRESH_EVENTS: 'visibilitychange,DOMContentLoaded,load',
  /** Scroller proxy update method */
  PROXY_UPDATE_METHOD: 'scrollTop' as const,
} as const;

/** Easing functions */
export const EASING_FUNCTIONS = {
  /** Default exponential ease-out */
  DEFAULT: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  /** Smooth cubic ease-out for natural deceleration */
  CUBIC_OUT: (t: number) => 1 - Math.pow(1 - t, 3),
  /** Power2 ease in-out (GSAP compatible) */
  POWER2_INOUT: 'power2.inOut',
  /** Linear (no easing) */
  LINEAR: (t: number) => t,
  /** Elastic ease for bounce effects */
  ELASTIC_OUT: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
} as const;

/** Error recovery thresholds */
export const ERROR_RECOVERY = {
  /** Maximum error count before emergency reset */
  MAX_ERROR_COUNT: 5,
  /** Maximum recovery attempts */
  MAX_RECOVERY_ATTEMPTS: 3,
  /** Time window for error counting (ms) */
  ERROR_COUNT_WINDOW: 5000,
  /** Stuck animation timeout (ms) */
  STUCK_ANIMATION_TIMEOUT: 3000,
} as const;

/** Logging and debugging */
export const DEBUG_CONFIG = {
  /** Enable verbose logging */
  VERBOSE: false,
  /** Log prefixes */
  LOG_PREFIX: '🎯 StoryScroller',
  /** Throttle rate for scroll event logs */
  SCROLL_LOG_THROTTLE: 20, // Log every 20th event
  /** Significant scroll change threshold (px) */
  SIGNIFICANT_SCROLL_CHANGE: 20,
} as const;

/** CSS class names for styling */
export const CSS_CLASSES = {
  /** Container classes */
  CONTAINER: 'story-scroller',
  CONTAINER_ANIMATING: 'story-scroller--animating',
  CONTAINER_SCROLLING: 'story-scroller--scrolling',
  /** Section classes */
  SECTION: 'story-scroller__section',
  SECTION_ACTIVE: 'story-scroller__section--active',
  SECTION_PREV: 'story-scroller__section--prev',
  SECTION_NEXT: 'story-scroller__section--next',
  /** State classes */
  NARRATIVE_MODE: 'story-scroller--narrative',
  ERROR_STATE: 'story-scroller--error',
} as const;

/** Data attributes for DOM queries */
export const DATA_ATTRIBUTES = {
  SCROLL_CONTAINER: 'data-scroll-container',
  SECTION_INDEX: 'data-section-index',
  SECTION_ID: 'data-section-id',
  NARRATIVE_CHAPTER: 'data-narrative-chapter',
  NARRATIVE_SCENE: 'data-narrative-scene',
} as const;

/**
 * Calculate dynamic values based on viewport
 */
export function calculateDynamicValues(viewportHeight: number) {
  return {
    /** Minimum swipe distance to trigger navigation */
    minSwipeDistance: viewportHeight * 0.1,
    /** Maximum scroll offset before correction */
    maxScrollOffset: viewportHeight * POSITION_TOLERANCE.DRIFT_TOLERANCE,
    /** Snap activation distance */
    snapActivationDistance: viewportHeight * MAGNETIC_SNAP.MAGNETIC_THRESHOLD,
    /** Section visibility threshold */
    sectionVisibilityThreshold: viewportHeight * 0.5,
  };
}

/**
 * Get platform-specific configuration adjustments
 */
export function getPlatformAdjustments() {
  const isTouchDevice = 'ontouchstart' in window;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  return {
    /** iOS needs special handling for momentum scrolling */
    wheelMultiplier: isIOS ? 0.5 : PHYSICS.WHEEL_MULTIPLIER,
    /** Touch devices need different tolerance */
    observerTolerance: isTouchDevice ? 100 : PHYSICS.OBSERVER_TOLERANCE,
    /** Safari needs different ScrollTrigger config */
    scrollTriggerConfig: isSafari ? {
      ...SCROLLTRIGGER_CONFIG,
      SYNC_INTERVAL: 20, // More frequent updates for Safari
    } : SCROLLTRIGGER_CONFIG,
  };
}