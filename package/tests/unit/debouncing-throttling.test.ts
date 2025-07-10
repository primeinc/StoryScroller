import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TIMING } from '../../src/constants/scroll-physics'

/**
 * Unit tests for debouncing and throttling utilities with real timing
 * Tests actual timing behavior without mocks
 */
describe('Debouncing and Throttling', () => {
  // Helper to wait for a specific amount of time
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  
  // Helper to track function calls
  const createCallTracker = () => {
    const calls: number[] = []
    const fn = () => {
      calls.push(Date.now())
    }
    return { fn, calls }
  }

  describe('Scroll end debouncing', () => {
    it('should debounce rapid scroll end calls', async () => {
      const scrollEndDelay = TIMING.SCROLL_END_TIMEOUT // 150ms
      const { fn: onScrollEnd, calls } = createCallTracker()
      
      // Simulate debounced scroll end
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      
      const markScrollEnd = () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(() => {
          onScrollEnd()
          timeoutId = null
        }, scrollEndDelay)
      }
      
      // Rapid calls
      markScrollEnd()
      await wait(50)
      markScrollEnd()
      await wait(50)
      markScrollEnd()
      await wait(50)
      markScrollEnd()
      
      // Should not have called yet
      expect(calls.length).toBe(0)
      
      // Wait for debounce to complete
      await wait(scrollEndDelay + 10)
      
      // Should have called exactly once
      expect(calls.length).toBe(1)
    })

    it('should cancel pending scroll end on new scroll start', async () => {
      const scrollEndDelay = 150
      const { fn: onScrollEnd, calls } = createCallTracker()
      
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      let isScrolling = false
      
      const markScrollStart = () => {
        isScrolling = true
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
      }
      
      const markScrollEnd = () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(() => {
          isScrolling = false
          onScrollEnd()
          timeoutId = null
        }, scrollEndDelay)
      }
      
      // Start scroll end timer
      markScrollEnd()
      await wait(100)
      
      // Interrupt with new scroll
      markScrollStart()
      
      // Wait past original timeout
      await wait(100)
      
      // Should not have called
      expect(calls.length).toBe(0)
      expect(isScrolling).toBe(true)
    })

    it('should handle configurable scroll end delays', async () => {
      const delays = [50, 100, 150, 200]
      
      for (const delay of delays) {
        const { fn: onScrollEnd, calls } = createCallTracker()
        let timeoutId: ReturnType<typeof setTimeout> | null = null
        
        const markScrollEnd = () => {
          if (timeoutId) clearTimeout(timeoutId)
          timeoutId = setTimeout(onScrollEnd, delay)
        }
        
        const startTime = Date.now()
        markScrollEnd()
        
        // Wait just before delay
        await wait(delay - 10)
        expect(calls.length).toBe(0)
        
        // Wait past delay
        await wait(20)
        expect(calls.length).toBe(1)
        
        const actualDelay = calls[0] - startTime
        // Allow 1ms early firing due to timer precision
        expect(actualDelay).toBeGreaterThanOrEqual(delay - 1)
        expect(actualDelay).toBeLessThan(delay + 30) // Allow some timing variance
      }
    })
  })

  describe('Navigation cooldown throttling', () => {
    it('should enforce cooldown between navigations', async () => {
      const navigationCooldown = TIMING.NAVIGATION_COOLDOWN // 50ms
      let lastNavigationTime = 0
      
      const canNavigate = () => {
        const now = Date.now()
        return now - lastNavigationTime >= navigationCooldown
      }
      
      const navigate = () => {
        if (canNavigate()) {
          lastNavigationTime = Date.now()
          return true
        }
        return false
      }
      
      // First navigation should succeed
      expect(navigate()).toBe(true)
      
      // Immediate second navigation should fail
      expect(navigate()).toBe(false)
      
      // Navigation during cooldown should fail (wait less than cooldown period)
      await wait(30) // Less than 50ms cooldown
      expect(navigate()).toBe(false)
      
      // Navigation after cooldown should succeed
      await wait(30) // Total 60ms > 50ms cooldown
      expect(navigate()).toBe(true)
    })

    it('should track cooldown remaining time', async () => {
      const cooldown = 200
      let lastTime = Date.now()
      
      const getCooldownRemaining = () => {
        const elapsed = Date.now() - lastTime
        return Math.max(0, cooldown - elapsed)
      }
      
      // Check remaining time at intervals (with buffer for timer drift)
      const remaining1 = getCooldownRemaining()
      expect(remaining1).toBeLessThanOrEqual(205) // +5ms buffer for timer drift
      expect(remaining1).toBeGreaterThan(185) // -5ms buffer for timer drift
      
      await wait(50)
      const remaining2 = getCooldownRemaining()
      expect(remaining2).toBeLessThanOrEqual(155) // +5ms buffer for timer drift
      expect(remaining2).toBeGreaterThan(135) // -5ms buffer for timer drift
      
      await wait(100)
      const remaining3 = getCooldownRemaining()
      expect(remaining3).toBeLessThanOrEqual(55) // +5ms buffer for timer drift
      expect(remaining3).toBeGreaterThan(35) // -5ms buffer for timer drift
      
      await wait(60)
      const remaining4 = getCooldownRemaining()
      expect(remaining4).toBe(0)
    })
  })

  describe('Animation state management', () => {
    it('should track concurrent animations', async () => {
      const activeAnimations = new Set<string>()
      
      const markAnimationStart = (id?: string) => {
        const animId = id || `anim_${Date.now()}`
        activeAnimations.add(animId)
        return animId
      }
      
      const markAnimationEnd = (id?: string) => {
        if (id && activeAnimations.has(id)) {
          activeAnimations.delete(id)
          return true
        }
        // If no ID, clear oldest animation
        if (!id && activeAnimations.size > 0) {
          const firstId = activeAnimations.values().next().value
          activeAnimations.delete(firstId)
          return true
        }
        return false
      }
      
      // Start multiple animations
      const id1 = markAnimationStart('nav1')
      const id2 = markAnimationStart('nav2')
      const id3 = markAnimationStart()
      
      expect(activeAnimations.size).toBe(3)
      expect(activeAnimations.has('nav1')).toBe(true)
      expect(activeAnimations.has('nav2')).toBe(true)
      
      // End specific animation
      expect(markAnimationEnd('nav1')).toBe(true)
      expect(activeAnimations.size).toBe(2)
      expect(activeAnimations.has('nav1')).toBe(false)
      
      // End animation without ID
      expect(markAnimationEnd()).toBe(true)
      expect(activeAnimations.size).toBe(1)
      
      // End last animation
      expect(markAnimationEnd(id3)).toBe(true)
      expect(activeAnimations.size).toBe(0)
      
      // Try to end non-existent animation
      expect(markAnimationEnd('fake')).toBe(false)
    })

    it('should prevent navigation during animation', async () => {
      let isAnimating = false
      let animationEndTime = 0
      
      const canNavigate = () => {
        return !isAnimating && Date.now() > animationEndTime
      }
      
      const startAnimation = (duration: number) => {
        isAnimating = true
        animationEndTime = Date.now() + duration
        
        setTimeout(() => {
          isAnimating = false
        }, duration)
      }
      
      // Can navigate initially
      expect(canNavigate()).toBe(true)
      
      // Start animation
      startAnimation(200)
      expect(canNavigate()).toBe(false)
      
      // Still can't navigate during animation
      await wait(100)
      expect(canNavigate()).toBe(false)
      
      // Can navigate after animation
      await wait(110)
      expect(canNavigate()).toBe(true)
    })
  })

  describe('Deduplication throttling', () => {
    it('should prevent duplicate requests within threshold', () => {
      const deduplicationThreshold = TIMING.DEDUPLICATION_THRESHOLD // 100ms
      const requests: Array<{ target: number; timestamp: number }> = []
      
      const addRequest = (target: number) => {
        const now = Date.now()
        
        // Check for duplicates
        const isDuplicate = requests.some(
          r => r.target === target && 
               now - r.timestamp < deduplicationThreshold
        )
        
        if (!isDuplicate) {
          requests.push({ target, timestamp: now })
          return true
        }
        return false
      }
      
      // First request should succeed
      expect(addRequest(2)).toBe(true)
      expect(requests.length).toBe(1)
      
      // Immediate duplicate should fail
      expect(addRequest(2)).toBe(false)
      expect(requests.length).toBe(1)
      
      // Different target should succeed
      expect(addRequest(3)).toBe(true)
      expect(requests.length).toBe(2)
      
      // Same target as first should still fail if within threshold
      expect(addRequest(2)).toBe(false)
      expect(requests.length).toBe(2)
    })

    it('should allow duplicate after threshold', async () => {
      const threshold = 100
      const requests: Array<{ target: number; timestamp: number }> = []
      
      const addRequest = (target: number) => {
        const now = Date.now()
        const isDuplicate = requests.some(
          r => r.target === target && now - r.timestamp < threshold
        )
        
        if (!isDuplicate) {
          requests.push({ target, timestamp: now })
          return true
        }
        return false
      }
      
      // Add initial request
      expect(addRequest(2)).toBe(true)
      
      // Wait just past threshold
      await wait(threshold + 10)
      
      // Same target should now succeed
      expect(addRequest(2)).toBe(true)
      expect(requests.length).toBe(2)
    })
  })

  describe('State transitions with timing', () => {
    it('should manage scroll -> animate -> idle transitions', async () => {
      let state: 'idle' | 'scrolling' | 'animating' = 'idle'
      let scrollTimeout: ReturnType<typeof setTimeout> | null = null
      
      const setState = (newState: typeof state) => {
        state = newState
      }
      
      const handleScrollStart = () => {
        if (scrollTimeout) {
          clearTimeout(scrollTimeout)
        }
        setState('scrolling')
      }
      
      const handleScrollEnd = () => {
        scrollTimeout = setTimeout(() => {
          if (state === 'scrolling') {
            setState('idle')
          }
        }, 150)
      }
      
      const handleAnimationStart = () => {
        if (scrollTimeout) {
          clearTimeout(scrollTimeout)
        }
        setState('animating')
      }
      
      const handleAnimationEnd = () => {
        setState('idle')
      }
      
      // Initial state
      expect(state).toBe('idle')
      
      // Start scrolling
      handleScrollStart()
      expect(state).toBe('scrolling')
      
      // Scroll ends but state persists briefly
      handleScrollEnd()
      expect(state).toBe('scrolling')
      
      // State transitions to idle after timeout
      await wait(160)
      expect(state).toBe('idle')
      
      // Animation interrupts scroll
      handleScrollStart()
      handleScrollEnd()
      await wait(50)
      handleAnimationStart()
      expect(state).toBe('animating')
      
      // Wait past scroll timeout
      await wait(120)
      expect(state).toBe('animating') // Still animating
      
      // Animation ends
      handleAnimationEnd()
      expect(state).toBe('idle')
    })

    it('should handle rapid state changes', async () => {
      const stateHistory: Array<{ state: string; time: number }> = []
      let currentState = 'idle'
      
      const recordState = (newState: string) => {
        currentState = newState
        stateHistory.push({ state: newState, time: Date.now() })
      }
      
      // Rapid state changes
      recordState('scrolling')
      await wait(10)
      recordState('idle')
      await wait(10)
      recordState('scrolling')
      await wait(10)
      recordState('animating')
      await wait(10)
      recordState('idle')
      
      // Verify all states were recorded
      expect(stateHistory.length).toBe(5)
      expect(stateHistory[0].state).toBe('scrolling')
      expect(stateHistory[4].state).toBe('idle')
      
      // Verify timing between states
      for (let i = 1; i < stateHistory.length; i++) {
        const timeDiff = stateHistory[i].time - stateHistory[i - 1].time
        expect(timeDiff).toBeGreaterThanOrEqual(9) // Allow small variance
        expect(timeDiff).toBeLessThan(20)
      }
    })
  })

  describe('Cleanup and edge cases', () => {
    it('should cleanup all timeouts on reset', () => {
      const timeouts = new Set<ReturnType<typeof setTimeout>>()
      
      const createTimeout = (fn: Function, delay: number) => {
        const id = setTimeout(() => {
          fn()
          timeouts.delete(id)
        }, delay)
        timeouts.add(id)
        return id
      }
      
      const clearAllTimeouts = () => {
        timeouts.forEach(id => clearTimeout(id))
        timeouts.clear()
      }
      
      // Create multiple timeouts
      createTimeout(() => {}, 100)
      createTimeout(() => {}, 200)
      createTimeout(() => {}, 300)
      
      expect(timeouts.size).toBe(3)
      
      // Clear all
      clearAllTimeouts()
      expect(timeouts.size).toBe(0)
    })

    it('should handle timeout updates during execution', async () => {
      let value = 0
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      
      const updateValue = (newValue: number, delay: number) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        timeoutId = setTimeout(() => {
          value = newValue
          timeoutId = null
        }, delay)
      }
      
      // Set initial timeout
      updateValue(1, 100)
      
      // Update before it fires
      await wait(50)
      updateValue(2, 100)
      
      // Original timeout should be cancelled
      await wait(60)
      expect(value).toBe(0) // Not 1
      
      // New timeout should fire
      await wait(50)
      expect(value).toBe(2)
    })
  })
})