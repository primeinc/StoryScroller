import { useRef, useCallback, useEffect } from 'react'

/**
 * Configuration options for the useDebouncing hook
 */
export interface DebounceConfig {
  /** Minimum time between navigations in milliseconds (default: 200) */
  navigationCooldown?: number
  /** Expected animation duration in milliseconds (default: 1500) */
  animationDuration?: number
  /** Delay before marking scroll end in milliseconds (default: 150) */
  scrollEndDelay?: number
  /** Prevent overlapping animations (default: true) */
  preventOverlap?: boolean
  /** Track momentum scrolling (default: true) */
  trackMomentum?: boolean
  /** Enable debug logging (default: false) */
  debug?: boolean
  /** Custom log prefix (default: '🎯') */
  logPrefix?: string
}

/**
 * Debug information for troubleshooting
 */
export interface DebugInfo {
  isAnimating: boolean
  isScrolling: boolean
  activeAnimations: string[]
  timeSinceLastNavigation: number
  canNavigate: boolean
}

/**
 * State and control methods returned by useDebouncing
 */
export interface DebounceState {
  // State queries
  canNavigate: () => boolean
  isAnimating: () => boolean
  isScrolling: () => boolean
  isDebouncing: () => boolean
  
  // State transitions
  markAnimationStart: (id?: string) => void
  markAnimationEnd: (id?: string) => void
  markScrollStart: () => void
  markScrollEnd: () => void
  
  // Advanced controls
  forceReset: () => void
  getDebugInfo: () => DebugInfo
}

/**
 * useDebouncing - Manages timing and state for scroll navigation
 * 
 * This hook provides a centralized solution for debouncing navigation,
 * tracking animations, and preventing scroll conflicts. It uses refs
 * throughout to avoid React state closure issues in callbacks.
 * 
 * @param config - Configuration options
 * @returns DebounceState object with methods and state queries
 * 
 * @example
 * ```tsx
 * const debouncing = useDebouncing({
 *   navigationCooldown: 200,
 *   debug: true
 * })
 * 
 * if (debouncing.canNavigate()) {
 *   debouncing.markAnimationStart('section-transition')
 *   // perform navigation
 * }
 * ```
 */
export function useDebouncing(config: DebounceConfig = {}): DebounceState {
  // All state in refs to avoid closure issues
  const animatingRef = useRef(false)
  const scrollingRef = useRef(false)
  const lastNavigationRef = useRef(0)
  const activeAnimationsRef = useRef<Set<string>>(new Set())
  const scrollEndTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Configuration with defaults
  const configRef = useRef({
    navigationCooldown: 200,
    animationDuration: 1500,
    scrollEndDelay: 150,
    preventOverlap: true,
    trackMomentum: true,
    debug: false,
    logPrefix: '🎯',
    ...config
  })
  
  // Update config if it changes
  useEffect(() => {
    configRef.current = {
      ...configRef.current,
      ...config
    }
  }, [config])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current)
      }
    }
  }, [])
  
  /**
   * Check if navigation is currently allowed
   */
  const canNavigate = useCallback(() => {
    const now = Date.now()
    const timeSinceLastNav = now - lastNavigationRef.current
    const cooldownMet = timeSinceLastNav >= configRef.current.navigationCooldown
    const notAnimating = !animatingRef.current || !configRef.current.preventOverlap
    const notScrolling = !scrollingRef.current || !configRef.current.trackMomentum
    
    const result = cooldownMet && notAnimating && notScrolling
    
    if (configRef.current.debug) {
      console.log(`${configRef.current.logPrefix} canNavigate:`, {
        cooldownMet,
        notAnimating,
        notScrolling,
        timeSinceLastNav,
        result
      })
    }
    
    return result
  }, [])
  
  /**
   * Check if currently animating
   */
  const isAnimating = useCallback(() => {
    return animatingRef.current
  }, [])
  
  /**
   * Check if currently scrolling
   */
  const isScrolling = useCallback(() => {
    return scrollingRef.current
  }, [])
  
  /**
   * Check if any debouncing is active
   */
  const isDebouncing = useCallback(() => {
    return animatingRef.current || scrollingRef.current
  }, [])
  
  /**
   * Mark the start of an animation
   * @param id - Optional identifier for the animation
   */
  const markAnimationStart = useCallback((id?: string) => {
    const animId = id || 'default'
    activeAnimationsRef.current.add(animId)
    animatingRef.current = true
    lastNavigationRef.current = Date.now()
    
    if (configRef.current.debug) {
      console.log(`${configRef.current.logPrefix} Animation started:`, animId, {
        activeCount: activeAnimationsRef.current.size
      })
    }
  }, [])
  
  /**
   * Mark the end of an animation
   * @param id - Optional identifier for the animation
   */
  const markAnimationEnd = useCallback((id?: string) => {
    const animId = id || 'default'
    activeAnimationsRef.current.delete(animId)
    
    if (activeAnimationsRef.current.size === 0) {
      animatingRef.current = false
    }
    
    if (configRef.current.debug) {
      console.log(`${configRef.current.logPrefix} Animation ended:`, animId, {
        remainingAnimations: activeAnimationsRef.current.size,
        isAnimating: animatingRef.current
      })
    }
  }, [])
  
  /**
   * Mark the start of scrolling
   */
  const markScrollStart = useCallback(() => {
    scrollingRef.current = true
    
    // Clear any pending scroll end
    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current)
      scrollEndTimeoutRef.current = undefined
    }
    
    if (configRef.current.debug) {
      console.log(`${configRef.current.logPrefix} Scroll started`)
    }
  }, [])
  
  /**
   * Mark the end of scrolling (debounced)
   */
  const markScrollEnd = useCallback(() => {
    // Clear existing timeout
    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current)
    }
    
    // Debounce scroll end to handle momentum
    scrollEndTimeoutRef.current = setTimeout(() => {
      scrollingRef.current = false
      scrollEndTimeoutRef.current = undefined
      
      if (configRef.current.debug) {
        console.log(`${configRef.current.logPrefix} Scroll ended (debounced)`)
      }
    }, configRef.current.scrollEndDelay)
  }, [])
  
  /**
   * Force reset all debouncing state
   */
  const forceReset = useCallback(() => {
    animatingRef.current = false
    scrollingRef.current = false
    activeAnimationsRef.current.clear()
    lastNavigationRef.current = 0
    
    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current)
      scrollEndTimeoutRef.current = undefined
    }
    
    console.warn(`${configRef.current.logPrefix} Force reset executed`)
  }, [])
  
  /**
   * Get debug information about current state
   */
  const getDebugInfo = useCallback((): DebugInfo => {
    const now = Date.now()
    return {
      isAnimating: animatingRef.current,
      isScrolling: scrollingRef.current,
      activeAnimations: Array.from(activeAnimationsRef.current),
      timeSinceLastNavigation: now - lastNavigationRef.current,
      canNavigate: canNavigate()
    }
  }, [canNavigate])
  
  return {
    canNavigate,
    isAnimating,
    isScrolling,
    isDebouncing,
    markAnimationStart,
    markAnimationEnd,
    markScrollStart,
    markScrollEnd,
    forceReset,
    getDebugInfo
  }
}