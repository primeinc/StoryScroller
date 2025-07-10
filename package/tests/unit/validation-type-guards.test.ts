/**
 * Navigation Request Validation and Type Guards - Unit Tests
 * 
 * Tests real validation logic for runtime type checking and data validation.
 * Focus on actual type guard behavior and edge case handling.
 */

import { describe, it, expect } from 'vitest';
import { UnitTestHelpers } from './base-unit-test';
import { 
  isValidSection, 
  isNavigationRequest, 
  isScrollState 
} from '../../src/types/scroll-state';
import { 
  isNavigationRequest as isNavigationRequestManager,
  isScrollState as isScrollStateManager 
} from '../../src/types/scroll-manager';
import type { NavigationRequest, ScrollState } from '../../src/types/scroll-state';

describe('Type Guards and Validation', () => {
  describe('isValidSection', () => {
    it('should validate section within bounds', () => {
      const totalSections = 5;
      
      // Valid sections
      expect(isValidSection(0, totalSections)).toBe(true);
      expect(isValidSection(1, totalSections)).toBe(true);
      expect(isValidSection(4, totalSections)).toBe(true); // Max section (totalSections - 1)
      
      // Invalid sections
      expect(isValidSection(-1, totalSections)).toBe(false);
      expect(isValidSection(5, totalSections)).toBe(false); // >= totalSections
      expect(isValidSection(10, totalSections)).toBe(false);
    });

    it('should require integer section indices', () => {
      const totalSections = 5;
      
      // Non-integers should be invalid
      expect(isValidSection(1.5, totalSections)).toBe(false);
      expect(isValidSection(2.1, totalSections)).toBe(false);
      expect(isValidSection(-0.5, totalSections)).toBe(false);
    });

    it('should handle edge cases', () => {
      // Single section
      expect(isValidSection(0, 1)).toBe(true);
      expect(isValidSection(1, 1)).toBe(false);
      
      // Zero sections (edge case)
      expect(isValidSection(0, 0)).toBe(false);
      expect(isValidSection(-1, 0)).toBe(false);
      
      // Large number of sections
      expect(isValidSection(999, 1000)).toBe(true);
      expect(isValidSection(1000, 1000)).toBe(false);
    });

    it('should handle non-numeric inputs gracefully', () => {
      // TypeScript would catch these, but runtime might receive them
      expect(isValidSection('0' as any, 5)).toBe(false);
      expect(isValidSection(null as any, 5)).toBe(false);
      expect(isValidSection(undefined as any, 5)).toBe(false);
      expect(isValidSection({} as any, 5)).toBe(false);
      expect(isValidSection([] as any, 5)).toBe(false);
    });
  });

  describe('isNavigationRequest (scroll-state)', () => {
    const validRequest: NavigationRequest = {
      id: 'nav_123456',
      targetSection: 2,
      timestamp: Date.now(),
      source: 'user',
      priority: 'normal',
    };

    it('should validate complete valid requests', () => {
      expect(isNavigationRequest(validRequest)).toBe(true);
    });

    it('should validate all valid source types', () => {
      const sources = ['user', 'external', 'magnetic', 'recovery', 'narrative'] as const;
      
      sources.forEach(source => {
        const request = { ...validRequest, source };
        expect(isNavigationRequest(request)).toBe(true);
      });
    });

    it('should validate all valid priority levels', () => {
      const priorities = ['low', 'normal', 'high', 'critical'] as const;
      
      priorities.forEach(priority => {
        const request = { ...validRequest, priority };
        expect(isNavigationRequest(request)).toBe(true);
      });
    });

    it('should reject requests with missing required fields', () => {
      // Missing id
      expect(isNavigationRequest({
        targetSection: 2,
        timestamp: Date.now(),
        source: 'user',
        priority: 'normal',
      })).toBe(false);

      // Missing targetSection
      expect(isNavigationRequest({
        id: 'nav_123',
        timestamp: Date.now(),
        source: 'user',
        priority: 'normal',
      })).toBe(false);

      // Missing timestamp
      expect(isNavigationRequest({
        id: 'nav_123',
        targetSection: 2,
        source: 'user',
        priority: 'normal',
      })).toBe(false);

      // Missing source
      expect(isNavigationRequest({
        id: 'nav_123',
        targetSection: 2,
        timestamp: Date.now(),
        priority: 'normal',
      })).toBe(false);

      // Missing priority
      expect(isNavigationRequest({
        id: 'nav_123',
        targetSection: 2,
        timestamp: Date.now(),
        source: 'user',
      })).toBe(false);
    });

    it('should reject non-object inputs', () => {
      expect(isNavigationRequest(null)).toBe(false);
      expect(isNavigationRequest(undefined)).toBe(false);
      expect(isNavigationRequest('string')).toBe(false);
      expect(isNavigationRequest(123)).toBe(false);
      expect(isNavigationRequest([])).toBe(false);
      expect(isNavigationRequest(true)).toBe(false);
    });

    it('should accept requests with optional fields', () => {
      const requestWithOptions = {
        ...validRequest,
        options: {
          duration: 0.5,
          immediate: true,
          onComplete: () => {},
        },
      };

      expect(isNavigationRequest(requestWithOptions)).toBe(true);
    });

    it('should handle extra properties gracefully', () => {
      const requestWithExtra = {
        ...validRequest,
        extraField: 'should not break validation',
        anotherExtra: 123,
      };

      expect(isNavigationRequest(requestWithExtra)).toBe(true);
    });
  });

  describe('isScrollState (scroll-state)', () => {
    const validState: ScrollState = {
      currentSection: 0,
      targetSection: null,
      scrollPosition: 0,
      velocity: 0,
      isAnimating: false,
      isScrolling: false,
      canNavigate: true,
      animationStartTime: null,
      animationDuration: 1.2,
      lastInputType: null,
      lastInputTime: 0,
      inputVelocity: 0,
      magneticActive: false,
      magneticTarget: null,
      snapInProgress: false,
      narrativeMode: false,
      chapterIndex: 0,
      sceneIndex: 0,
      transitionType: 'none',
      lastValidSection: 0,
      errorCount: 0,
      recoveryAttempts: 0,
    };

    it('should validate complete valid state', () => {
      expect(isScrollState(validState)).toBe(true);
    });

    it('should validate minimal valid state', () => {
      const minimalState = {
        currentSection: 1,
        isAnimating: false,
        canNavigate: true,
      };

      expect(isScrollState(minimalState)).toBe(true);
    });

    it('should reject states with missing core fields', () => {
      // Missing currentSection
      expect(isScrollState({
        isAnimating: false,
        canNavigate: true,
      })).toBe(false);

      // Missing isAnimating
      expect(isScrollState({
        currentSection: 1,
        canNavigate: true,
      })).toBe(false);

      // Missing canNavigate
      expect(isScrollState({
        currentSection: 1,
        isAnimating: false,
      })).toBe(false);
    });

    it('should reject non-object inputs', () => {
      expect(isScrollState(null)).toBe(false);
      expect(isScrollState(undefined)).toBe(false);
      expect(isScrollState('string')).toBe(false);
      expect(isScrollState(123)).toBe(false);
      expect(isScrollState([])).toBe(false);
      expect(isScrollState(true)).toBe(false);
    });

    it('should accept state with extra properties', () => {
      const stateWithExtra = {
        ...validState,
        customField: 'extra data',
        debugInfo: { test: true },
      };

      expect(isScrollState(stateWithExtra)).toBe(true);
    });
  });

  describe('isNavigationRequest (scroll-manager)', () => {
    const validManagerRequest = {
      id: 'nav_123456',
      targetSection: 2,
      source: 'user_keyboard' as const,
      priority: 'normal' as const,
      timestamp: Date.now(),
    };

    it('should validate complete valid requests', () => {
      expect(isNavigationRequestManager(validManagerRequest)).toBe(true);
    });

    it('should validate all source types from scroll-manager', () => {
      const sources = ['user_wheel', 'user_keyboard', 'user_touch', 'programmatic', 'recovery', 'narrative'] as const;
      
      sources.forEach(source => {
        const request = { ...validManagerRequest, source };
        expect(isNavigationRequestManager(request)).toBe(true);
      });
    });

    it('should validate all priority levels', () => {
      const priorities = ['low', 'normal', 'high', 'critical'] as const;
      
      priorities.forEach(priority => {
        const request = { ...validManagerRequest, priority };
        expect(isNavigationRequestManager(request)).toBe(true);
      });
    });

    it('should reject invalid source types', () => {
      const invalidRequest = {
        ...validManagerRequest,
        source: 'invalid_source',
      };

      expect(isNavigationRequestManager(invalidRequest)).toBe(false);
    });

    it('should reject invalid priority levels', () => {
      const invalidRequest = {
        ...validManagerRequest,
        priority: 'invalid_priority',
      };

      expect(isNavigationRequestManager(invalidRequest)).toBe(false);
    });
  });

  describe('Real-world Validation Scenarios', () => {
    it('should validate data from queue operations', () => {
      // Simulate data that might come from createAnimationQueue
      const queueRequest = {
        id: `nav_${Date.now()}`,
        targetSection: 3,
        timestamp: Date.now(),
        source: 'user_wheel' as const,
        priority: 'normal' as const,
        options: {
          duration: 0.8,
          easing: (t: number) => t * t,
        },
      };

      expect(isNavigationRequestManager(queueRequest)).toBe(true);
    });

    it('should validate state transitions', () => {
      const initialState = {
        currentSection: 0,
        isAnimating: false,
        canNavigate: true,
        targetSection: null,
        velocity: 0,
      };

      const animatingState = {
        ...initialState,
        isAnimating: true,
        canNavigate: false,
        targetSection: 2,
      };

      const completedState = {
        ...animatingState,
        currentSection: 2,
        isAnimating: false,
        canNavigate: true,
        targetSection: null,
      };

      expect(isScrollState(initialState)).toBe(true);
      expect(isScrollState(animatingState)).toBe(true);
      expect(isScrollState(completedState)).toBe(true);
    });

    it('should handle malformed data gracefully', () => {
      // Simulate data that might come from external sources or be corrupted
      const malformedRequests = [
        { id: 123, targetSection: 'two', source: 'user', priority: 'normal' }, // Wrong types
        { targetSection: 2, source: 'user', priority: 'normal' }, // Missing fields
        { id: null, targetSection: -1, source: null, priority: null }, // Null values
        '', // Not an object
        { id: 'valid', targetSection: Infinity, source: 'user', priority: 'normal' }, // Infinite values
      ];

      malformedRequests.forEach(request => {
        expect(isNavigationRequest(request)).toBe(false);
      });
    });

    it('should validate complex nested options', () => {
      const requestWithComplexOptions = {
        id: 'nav_complex',
        targetSection: 2,
        timestamp: Date.now(),
        source: 'programmatic' as const,
        priority: 'high' as const,
        options: {
          duration: 1.5,
          easing: (t: number) => Math.sin(t * Math.PI / 2),
          immediate: false,
          force: true,
          onComplete: () => console.log('done'),
          onInterrupt: () => console.log('interrupted'),
          metadata: {
            transitionType: 'fade',
            motionIntensity: 0.8,
            storyContext: {
              fromChapter: 'intro',
              toChapter: 'main',
              trigger: 'user',
            },
            customData: {
              analytics: { event: 'navigation', section: 2 },
              performance: { startTime: Date.now() },
            },
          },
        },
      };

      expect(isNavigationRequestManager(requestWithComplexOptions)).toBe(true);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should validate many requests quickly', async () => {
      const requests = Array.from({ length: 1000 }, (_, i) => ({
        id: `nav_${i}`,
        targetSection: i % 5,
        timestamp: Date.now() + i,
        source: 'programmatic' as const,
        priority: 'normal' as const,
      }));

      const { duration } = await UnitTestHelpers.measureExecutionTime(() => {
        requests.forEach(request => {
          expect(isNavigationRequestManager(request)).toBe(true);
        });
      });

      expect(duration).toBeLessThan(50); // Should be very fast
    });

    it('should handle deeply nested objects', () => {
      const deeplyNested = {
        currentSection: 0,
        isAnimating: false,
        canNavigate: true,
        nested: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: 'deep value',
                },
              },
            },
          },
        },
      };

      // Should still validate correctly despite deep nesting
      expect(isScrollState(deeplyNested)).toBe(true);
    });

    it('should handle circular references gracefully', () => {
      const circular: any = {
        currentSection: 0,
        isAnimating: false,
        canNavigate: true,
      };
      circular.self = circular; // Create circular reference

      // Should not throw error or hang
      expect(() => isScrollState(circular)).not.toThrow();
      expect(isScrollState(circular)).toBe(true);
    });

    it('should handle prototype pollution attempts', () => {
      const maliciousObject = JSON.parse('{"__proto__": {"polluted": true}, "currentSection": 0, "isAnimating": false, "canNavigate": true}');
      
      // Should validate the object properties, not be affected by prototype pollution
      expect(isScrollState(maliciousObject)).toBe(true);
      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it('should validate boundary values correctly', () => {
      // Test with extreme but valid values
      const extremeRequest = {
        id: 'nav_' + Number.MAX_SAFE_INTEGER,
        targetSection: Number.MAX_SAFE_INTEGER,
        timestamp: Number.MAX_SAFE_INTEGER,
        source: 'programmatic' as const,
        priority: 'critical' as const,
      };

      expect(isNavigationRequestManager(extremeRequest)).toBe(true);

      // Test with zero values
      const zeroRequest = {
        id: 'nav_0',
        targetSection: 0,
        timestamp: 0,
        source: 'user_keyboard' as const,
        priority: 'low' as const,
      };

      expect(isNavigationRequestManager(zeroRequest)).toBe(true);
    });
  });
});