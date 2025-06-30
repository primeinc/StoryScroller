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

import { useRef, useCallback, useMemo } from 'react'
import type { ScrollState, ScrollManagerConfig } from '../types/scroll-state'

/**
 * Hook for managing scroll state with verification and recovery capabilities
 * This is used internally by useScrollManager to maintain state consistency
 */
export function useScrollState(config: ScrollManagerConfig) {
  const { sections, onStateChange } = config
  
  /**
   * Initialize default scroll state
   */
  const getInitialState = (): ScrollState => ({
    // Core position state
    currentSection: 0,
    targetSection: null,
    scrollPosition: 0,
    velocity: 0,
    
    // Animation state
    isAnimating: false,
    isScrolling: false,
    canNavigate: true,
    animationStartTime: null,
    animationDuration: config.duration || 1.2,
    
    // Input state
    lastInputType: null,
    lastInputTime: 0,
    inputVelocity: 0,
    
    // Physics state
    magneticActive: false,
    magneticTarget: null,
    snapInProgress: false,
    
    // Narrative-ready extensions
    narrativeMode: false,
    chapterIndex: 0,
    sceneIndex: 0,
    transitionType: 'none',
    
    // Error recovery state
    lastValidSection: 0,
    errorCount: 0,
    recoveryAttempts: 0,
  })
  
  // Single source of truth for state
  const stateRef = useRef<ScrollState>(getInitialState())
  
  /**
   * Get current state (readonly to prevent external mutations)
   */
  const getState = useCallback((): Readonly<ScrollState> => {
    return { ...stateRef.current }
  }, [])
  
  /**
   * Update state with validation and change notification
   */
  const updateState = useCallback((updates: Partial<ScrollState>) => {
    const previousState = { ...stateRef.current }
    const newState = { ...stateRef.current, ...updates }
    
    // Validate section bounds
    if ('currentSection' in updates && updates.currentSection !== undefined) {
      newState.currentSection = Math.max(0, Math.min(sections - 1, updates.currentSection))
      newState.lastValidSection = newState.currentSection
    }
    
    if ('targetSection' in updates && updates.targetSection !== null && updates.targetSection !== undefined) {
      newState.targetSection = Math.max(0, Math.min(sections - 1, updates.targetSection))
    }
    
    // Auto-update navigation ability based on animation state
    if ('isAnimating' in updates) {
      newState.canNavigate = !updates.isAnimating
    }
    
    // Track animation timing
    if ('isAnimating' in updates && updates.isAnimating) {
      newState.animationStartTime = Date.now()
    } else if ('isAnimating' in updates && !updates.isAnimating) {
      newState.animationStartTime = null
    }
    
    // Apply the new state
    stateRef.current = newState
    
    // Notify listeners if state actually changed
    const hasChanged = Object.keys(updates).some(
      key => previousState[key as keyof ScrollState] !== newState[key as keyof ScrollState]
    )
    
    if (hasChanged && onStateChange) {
      onStateChange(newState)
    }
    
    return newState
  }, [sections, onStateChange])
  
  /**
   * Verify state consistency and fix issues
   * Returns true if state was valid, false if corrections were made
   */
  const verifyState = useCallback((): boolean => {
    const state = stateRef.current
    const viewportHeight = window.innerHeight
    const actualScrollY = window.scrollY
    const calculatedSection = Math.round(actualScrollY / viewportHeight)
    
    let isValid = true
    const corrections: Partial<ScrollState> = {}
    
    // Check 1: Section matches scroll position
    if (Math.abs(calculatedSection - state.currentSection) > 0 && !state.isAnimating) {
      console.warn('🔍 State verification: Section mismatch detected', {
        stateSection: state.currentSection,
        calculatedSection,
        scrollY: actualScrollY,
      })
      corrections.currentSection = calculatedSection
      isValid = false
    }
    
    // Check 2: Animation state consistency
    if (state.isAnimating && state.animationStartTime) {
      const animationAge = Date.now() - state.animationStartTime
      const maxDuration = (state.animationDuration + 0.5) * 1000 // Add 500ms buffer
      
      if (animationAge > maxDuration) {
        console.warn('🔍 State verification: Stuck animation detected', {
          animationAge,
          maxDuration,
        })
        corrections.isAnimating = false
        corrections.canNavigate = true
        corrections.targetSection = null
        isValid = false
      }
    }
    
    // Check 3: Target section validity
    if (state.targetSection !== null && 
        (state.targetSection < 0 || state.targetSection >= sections)) {
      console.warn('🔍 State verification: Invalid target section', {
        targetSection: state.targetSection,
        maxSection: sections - 1,
      })
      corrections.targetSection = null
      isValid = false
    }
    
    // Check 4: Scroll position drift
    const expectedScrollY = state.currentSection * viewportHeight
    const scrollDrift = Math.abs(actualScrollY - expectedScrollY)
    
    if (scrollDrift > viewportHeight * 0.1 && !state.isAnimating && !state.isScrolling) {
      console.warn('🔍 State verification: Scroll position drift', {
        expected: expectedScrollY,
        actual: actualScrollY,
        drift: scrollDrift,
      })
      corrections.scrollPosition = actualScrollY
      isValid = false
    }
    
    // Apply corrections if needed
    if (!isValid) {
      console.log('🔧 Applying state corrections:', corrections)
      updateState({
        ...corrections,
        errorCount: state.errorCount + 1,
      })
    }
    
    return isValid
  }, [sections, updateState])
  
  /**
   * Reset state to initial values
   */
  const resetState = useCallback(() => {
    console.log('🔄 Resetting scroll state to initial values')
    stateRef.current = getInitialState()
    onStateChange?.(stateRef.current)
  }, [onStateChange])
  
  /**
   * Emergency state recovery
   */
  const recoverState = useCallback(() => {
    console.log('🚨 Emergency state recovery initiated')
    
    const viewportHeight = window.innerHeight
    const actualScrollY = window.scrollY
    const calculatedSection = Math.round(actualScrollY / viewportHeight)
    const clampedSection = Math.max(0, Math.min(sections - 1, calculatedSection))
    
    updateState({
      currentSection: clampedSection,
      targetSection: null,
      isAnimating: false,
      isScrolling: false,
      canNavigate: true,
      scrollPosition: actualScrollY,
      velocity: 0,
      magneticActive: false,
      magneticTarget: null,
      snapInProgress: false,
      lastInputType: null,
      recoveryAttempts: stateRef.current.recoveryAttempts + 1,
    })
    
    // TODO: Force window scroll to match state
    // window.scrollTo(0, clampedSection * viewportHeight)
  }, [sections, updateState])
  
  /**
   * State query helpers
   */
  const queries = useMemo(() => ({
    getCurrentSection: () => stateRef.current.currentSection,
    getTargetSection: () => stateRef.current.targetSection,
    canNavigate: () => stateRef.current.canNavigate && !stateRef.current.isAnimating,
    isAnimating: () => stateRef.current.isAnimating,
    isScrolling: () => stateRef.current.isScrolling,
    isInNarrativeMode: () => stateRef.current.narrativeMode,
    getVelocity: () => stateRef.current.velocity,
    getLastInputType: () => stateRef.current.lastInputType,
    getErrorCount: () => stateRef.current.errorCount,
  }), [])
  
  /**
   * State setters for specific properties
   */
  const setters = useMemo(() => ({
    setCurrentSection: (section: number) => updateState({ currentSection: section }),
    setTargetSection: (section: number | null) => updateState({ targetSection: section }),
    setAnimating: (isAnimating: boolean) => updateState({ isAnimating }),
    setScrolling: (isScrolling: boolean) => updateState({ isScrolling }),
    setVelocity: (velocity: number) => updateState({ velocity }),
    setInputType: (type: ScrollState['lastInputType']) => updateState({ 
      lastInputType: type,
      lastInputTime: Date.now(),
    }),
    setMagneticActive: (active: boolean, target?: number) => updateState({
      magneticActive: active,
      magneticTarget: target ?? null,
    }),
    enterNarrativeMode: () => updateState({ narrativeMode: true }),
    exitNarrativeMode: () => updateState({ narrativeMode: false }),
  }), [updateState])
  
  return {
    getState,
    updateState,
    verifyState,
    resetState,
    recoverState,
    queries,
    setters,
  }
}