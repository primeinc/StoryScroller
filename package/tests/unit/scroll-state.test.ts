/**
 * Scroll State Management - Unit Tests
 * 
 * Tests real state transitions, validation logic, and recovery mechanisms.
 * Focus on actual state behavior, not implementation details.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { UnitTestHelpers } from './base-unit-test';
import { useScrollState } from '../../src/hooks/useScrollState';
import type { ScrollManagerConfig, ScrollState } from '../../src/types/scroll-state';

describe('Scroll State Management', () => {
  let mockConfig: ScrollManagerConfig;
  let onStateChangeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onStateChangeMock = vi.fn();
    mockConfig = {
      sections: 5,
      duration: 1.2,
      onStateChange: onStateChangeMock,
    };

    // Mock window properties for consistent testing
    Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      const state = result.current.getState();

      expect(state.currentSection).toBe(0);
      expect(state.targetSection).toBeNull();
      expect(state.scrollPosition).toBe(0);
      expect(state.velocity).toBe(0);
      expect(state.isAnimating).toBe(false);
      expect(state.isScrolling).toBe(false);
      expect(state.canNavigate).toBe(true);
      expect(state.animationDuration).toBe(1.2);
      expect(state.narrativeMode).toBe(false);
      expect(state.errorCount).toBe(0);
      expect(state.recoveryAttempts).toBe(0);
    });

    it('should use config duration in initial state', () => {
      const customConfig = { ...mockConfig, duration: 0.8 };
      const { result } = renderHook(() => useScrollState(customConfig));
      const state = result.current.getState();

      expect(state.animationDuration).toBe(0.8);
    });

    it('should default duration when not provided', () => {
      const configWithoutDuration = { sections: 5, onStateChange: onStateChangeMock };
      const { result } = renderHook(() => useScrollState(configWithoutDuration));
      const state = result.current.getState();

      expect(state.animationDuration).toBe(1.2); // Default fallback
    });
  });

  describe('State Updates', () => {
    it('should update state correctly', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));

      act(() => {
        result.current.updateState({ currentSection: 2, velocity: 100 });
      });

      const state = result.current.getState();
      expect(state.currentSection).toBe(2);
      expect(state.velocity).toBe(100);
      expect(state.lastValidSection).toBe(2); // Should auto-update
    });

    it('should clamp section values to valid bounds', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));

      act(() => {
        result.current.updateState({ currentSection: -1 });
      });
      expect(result.current.getState().currentSection).toBe(0);

      act(() => {
        result.current.updateState({ currentSection: 10 });
      });
      expect(result.current.getState().currentSection).toBe(4); // Max section (5-1)

      act(() => {
        result.current.updateState({ targetSection: -5 });
      });
      expect(result.current.getState().targetSection).toBe(0);

      act(() => {
        result.current.updateState({ targetSection: 20 });
      });
      expect(result.current.getState().targetSection).toBe(4);
    });

    it('should auto-update canNavigate based on animation state', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));

      act(() => {
        result.current.updateState({ isAnimating: true });
      });
      expect(result.current.getState().canNavigate).toBe(false);

      act(() => {
        result.current.updateState({ isAnimating: false });
      });
      expect(result.current.getState().canNavigate).toBe(true);
    });

    it('should track animation timing correctly', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      const startTime = Date.now();

      act(() => {
        result.current.updateState({ isAnimating: true });
      });

      const state = result.current.getState();
      expect(state.animationStartTime).toBeGreaterThanOrEqual(startTime);
      expect(state.animationStartTime).toBeLessThanOrEqual(Date.now());

      act(() => {
        result.current.updateState({ isAnimating: false });
      });

      expect(result.current.getState().animationStartTime).toBeNull();
    });

    it('should notify state change listeners only when state actually changes', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));

      // Clear initial calls
      onStateChangeMock.mockClear();

      act(() => {
        result.current.updateState({ currentSection: 1 });
      });
      expect(onStateChangeMock).toHaveBeenCalledTimes(1);

      // Update with same value - should not trigger callback
      act(() => {
        result.current.updateState({ currentSection: 1 });
      });
      expect(onStateChangeMock).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should maintain state immutability', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      const state1 = result.current.getState();
      const state2 = result.current.getState();
      
      // Should return different objects (immutable)
      expect(state1).not.toBe(state2);
      
      // But with same values
      expect(state1).toEqual(state2);
    });
  });

  describe('State Validation Logic', () => {
    it('should detect section mismatch with scroll position', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      // Set window scroll to section 2 (2000px)
      Object.defineProperty(window, 'scrollY', { value: 2000, writable: true });
      
      // But state thinks we're on section 0
      act(() => {
        result.current.updateState({ currentSection: 0, isAnimating: false });
      });

      const isValid = result.current.verifyState();
      
      expect(isValid).toBe(false);
      expect(result.current.getState().currentSection).toBe(2); // Should be corrected
    });

    it('should detect stuck animations', async () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      // Start animation
      act(() => {
        result.current.updateState({ 
          isAnimating: true,
          animationDuration: 1.0,
        });
      });

      // Mock animation start time to be in the past
      const oldTime = Date.now() - 3000; // 3 seconds ago
      act(() => {
        result.current.updateState({ animationStartTime: oldTime });
      });

      const isValid = result.current.verifyState();
      
      expect(isValid).toBe(false);
      const state = result.current.getState();
      expect(state.isAnimating).toBe(false);
      expect(state.canNavigate).toBe(true);
      expect(state.targetSection).toBeNull();
    });

    it('should clamp invalid target sections during update', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      act(() => {
        result.current.updateState({ targetSection: 10 }); // Will be clamped to 4
      });

      // State should be valid because targetSection was clamped
      const isValid = result.current.verifyState();
      
      expect(isValid).toBe(true);
      expect(result.current.getState().targetSection).toBe(4); // Clamped to sections - 1
    });

    it('should detect scroll position drift', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      // State thinks we're on section 1 (should be at 1000px)
      act(() => {
        result.current.updateState({ 
          currentSection: 1,
          isAnimating: false,
          isScrolling: false,
        });
      });
      
      // But actual scroll is way off (should trigger drift detection)
      Object.defineProperty(window, 'scrollY', { value: 1200, writable: true });

      const isValid = result.current.verifyState();
      
      expect(isValid).toBe(false);
      expect(result.current.getState().scrollPosition).toBe(1200);
    });

    it('should not validate during animations or scrolling', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      // Set up a mismatch but with animation active
      Object.defineProperty(window, 'scrollY', { value: 2000, writable: true });
      act(() => {
        result.current.updateState({ currentSection: 0, isAnimating: true });
      });

      const isValid = result.current.verifyState();
      
      // Should be valid because we don't validate during animations
      expect(isValid).toBe(true);
      expect(result.current.getState().currentSection).toBe(0); // Unchanged
    });
  });

  describe('State Recovery', () => {
    it('should reset state to initial values', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      // Mess up the state
      act(() => {
        result.current.updateState({
          currentSection: 3,
          velocity: 100,
          isAnimating: true,
          errorCount: 5,
        });
      });

      act(() => {
        result.current.resetState();
      });

      const state = result.current.getState();
      expect(state.currentSection).toBe(0);
      expect(state.velocity).toBe(0);
      expect(state.isAnimating).toBe(false);
      expect(state.errorCount).toBe(0);
    });

    it('should perform emergency recovery correctly', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      // Set window scroll to indicate section 2
      Object.defineProperty(window, 'scrollY', { value: 2000, writable: true });
      
      // Mess up the state
      act(() => {
        result.current.updateState({
          currentSection: 0, // Wrong
          isAnimating: true,
          targetSection: 5, // Invalid
          velocity: 999,
          recoveryAttempts: 1,
        });
      });

      act(() => {
        result.current.recoverState();
      });

      const state = result.current.getState();
      expect(state.currentSection).toBe(2); // Calculated from scroll position
      expect(state.targetSection).toBeNull();
      expect(state.isAnimating).toBe(false);
      expect(state.canNavigate).toBe(true);
      expect(state.velocity).toBe(0);
      expect(state.recoveryAttempts).toBe(2); // Incremented
    });

    it('should handle recovery at scroll boundaries', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      // Set scroll beyond valid range
      Object.defineProperty(window, 'scrollY', { value: 6000, writable: true });

      act(() => {
        result.current.recoverState();
      });

      const state = result.current.getState();
      expect(state.currentSection).toBe(4); // Clamped to max section
    });
  });

  describe('State Query Methods', () => {
    it('should provide accurate query methods', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      act(() => {
        result.current.updateState({
          currentSection: 2,
          targetSection: 3,
          isAnimating: true,
          velocity: 50,
          lastInputType: 'keyboard',
          errorCount: 1,
        });
      });

      expect(result.current.queries.getCurrentSection()).toBe(2);
      expect(result.current.queries.getTargetSection()).toBe(3);
      expect(result.current.queries.canNavigate()).toBe(false); // Because animating
      expect(result.current.queries.isAnimating()).toBe(true);
      expect(result.current.queries.getVelocity()).toBe(50);
      expect(result.current.queries.getLastInputType()).toBe('keyboard');
      expect(result.current.queries.getErrorCount()).toBe(1);
    });

    it('should respect canNavigate logic in queries', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      // Not animating and canNavigate is true
      act(() => {
        result.current.updateState({ isAnimating: false, canNavigate: true });
      });
      expect(result.current.queries.canNavigate()).toBe(true);

      // Animating
      act(() => {
        result.current.updateState({ isAnimating: true });
      });
      expect(result.current.queries.canNavigate()).toBe(false);

      // canNavigate is automatically set based on isAnimating
      act(() => {
        result.current.updateState({ isAnimating: false }); // This will set canNavigate to true
      });
      expect(result.current.queries.canNavigate()).toBe(true); // true because not animating
    });
  });

  describe('State Setter Methods', () => {
    it('should provide convenient setter methods', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      act(() => {
        result.current.setters.setCurrentSection(3);
      });
      expect(result.current.getState().currentSection).toBe(3);

      act(() => {
        result.current.setters.setTargetSection(2);
      });
      expect(result.current.getState().targetSection).toBe(2);

      act(() => {
        result.current.setters.setAnimating(true);
      });
      expect(result.current.getState().isAnimating).toBe(true);

      act(() => {
        result.current.setters.setVelocity(75);
      });
      expect(result.current.getState().velocity).toBe(75);
    });

    it('should update input type with timestamp', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      const startTime = Date.now();
      
      act(() => {
        result.current.setters.setInputType('wheel');
      });

      const state = result.current.getState();
      expect(state.lastInputType).toBe('wheel');
      expect(state.lastInputTime).toBeGreaterThanOrEqual(startTime);
    });

    it('should handle magnetic snap state', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      act(() => {
        result.current.setters.setMagneticActive(true, 2);
      });

      const state = result.current.getState();
      expect(state.magneticActive).toBe(true);
      expect(state.magneticTarget).toBe(2);

      act(() => {
        result.current.setters.setMagneticActive(false);
      });

      const newState = result.current.getState();
      expect(newState.magneticActive).toBe(false);
      expect(newState.magneticTarget).toBeNull();
    });

    it('should handle narrative mode transitions', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      act(() => {
        result.current.setters.enterNarrativeMode();
      });
      expect(result.current.getState().narrativeMode).toBe(true);

      act(() => {
        result.current.setters.exitNarrativeMode();
      });
      expect(result.current.getState().narrativeMode).toBe(false);
    });
  });

  describe('Real State Transition Scenarios', () => {
    it('should handle complete navigation cycle', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      // Step 1: Start navigation
      act(() => {
        result.current.updateState({
          targetSection: 2,
          isAnimating: true,
          lastInputType: 'keyboard',
        });
      });

      let state = result.current.getState();
      expect(state.targetSection).toBe(2);
      expect(state.isAnimating).toBe(true);
      expect(state.canNavigate).toBe(false);
      expect(state.animationStartTime).toBeTruthy();

      // Step 2: Complete navigation
      act(() => {
        result.current.updateState({
          currentSection: 2,
          targetSection: null,
          isAnimating: false,
        });
      });

      state = result.current.getState();
      expect(state.currentSection).toBe(2);
      expect(state.targetSection).toBeNull();
      expect(state.isAnimating).toBe(false);
      expect(state.canNavigate).toBe(true);
      expect(state.animationStartTime).toBeNull();
      expect(state.lastValidSection).toBe(2);
    });

    it('should handle magnetic snap activation and deactivation', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      // Activate magnetic snap
      act(() => {
        result.current.updateState({
          magneticActive: true,
          magneticTarget: 1,
          velocity: 25, // Low velocity triggers magnetic
        });
      });

      let state = result.current.getState();
      expect(state.magneticActive).toBe(true);
      expect(state.magneticTarget).toBe(1);

      // Complete magnetic snap
      act(() => {
        result.current.updateState({
          currentSection: 1,
          magneticActive: false,
          magneticTarget: null,
          velocity: 0,
        });
      });

      state = result.current.getState();
      expect(state.currentSection).toBe(1);
      expect(state.magneticActive).toBe(false);
      expect(state.magneticTarget).toBeNull();
    });

    it('should accumulate error count through validation cycles', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      // Create conditions that will trigger validation errors
      Object.defineProperty(window, 'scrollY', { value: 1000, writable: true });
      
      act(() => {
        result.current.updateState({ currentSection: 0, isAnimating: false });
      });

      // First validation failure
      result.current.verifyState();
      expect(result.current.getState().errorCount).toBe(1);

      // Second validation failure
      act(() => {
        result.current.updateState({ currentSection: 0 }); // Force mismatch again
      });
      result.current.verifyState();
      expect(result.current.getState().errorCount).toBe(2);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid state updates efficiently', async () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      const { duration } = await UnitTestHelpers.measureExecutionTime(() => {
        for (let i = 0; i < 1000; i++) {
          act(() => {
            result.current.updateState({ velocity: i, scrollPosition: i * 10 });
          });
        }
      });

      // 1000 state updates should complete quickly
      expect(duration).toBeLessThan(100);
    });

    it('should handle null and undefined values gracefully', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      // These shouldn't crash
      act(() => {
        result.current.updateState({ targetSection: null });
      });
      expect(result.current.getState().targetSection).toBeNull();

      act(() => {
        result.current.updateState({ lastInputType: null });
      });
      expect(result.current.getState().lastInputType).toBeNull();
    });

    it('should validate state transitions are logical', () => {
      const { result } = renderHook(() => useScrollState(mockConfig));
      
      const beforeState = result.current.getState();
      
      act(() => {
        result.current.setters.setCurrentSection(2);
      });
      
      const afterState = result.current.getState();
      
      const isValidTransition = UnitTestHelpers.validateStateTransition(
        beforeState,
        afterState,
        'gotoSection'
      );
      
      expect(isValidTransition).toBe(true);
    });
  });
});