/**
 * Base Unit Testing Framework
 * 
 * Following the same "test real behavior" philosophy as our Playwright tests,
 * but focused on pure logic, mathematical calculations, and isolated components.
 * 
 * Key principles:
 * - Test actual behavior, not implementation details
 * - Minimal mocking - only mock external APIs/services, not our logic
 * - Use real DOM when testing UI components
 * - Test performance and timing where relevant
 * - Capture actual errors and edge cases
 */

import { vi, expect, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Extend expect with custom matchers for our domain
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toBeValidNavigationRequest(received: any) {
    const pass = (
      typeof received === 'object' &&
      received !== null &&
      typeof received.id === 'string' &&
      typeof received.targetSection === 'number' &&
      ['user_wheel', 'user_keyboard', 'user_touch', 'programmatic', 'recovery', 'narrative'].includes(received.source) &&
      ['low', 'normal', 'high', 'critical'].includes(received.priority) &&
      typeof received.timestamp === 'number'
    );
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid navigation request`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid navigation request`,
        pass: false,
      };
    }
  },

  toHaveValidScrollPhysics(received: any) {
    const pass = (
      typeof received === 'object' &&
      received !== null &&
      typeof received.lerp === 'number' &&
      received.lerp > 0 &&
      received.lerp <= 1 &&
      typeof received.duration === 'number' &&
      received.duration > 0 &&
      received.duration < 10 // Reasonable upper bound
    );
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to have valid scroll physics`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to have valid scroll physics`,
        pass: false,
      };
    }
  }
});

// Type augmentation for custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): T;
    toBeValidNavigationRequest(): T;
    toHaveValidScrollPhysics(): T;
  }
}

/**
 * Test utilities for consistent real-behavior testing
 */
export class UnitTestHelpers {
  /**
   * Create a mock DOM element with real properties
   */
  static createMockElement(tag: string = 'div', properties: Partial<HTMLElement> = {}) {
    const element = document.createElement(tag);
    Object.assign(element, properties);
    return element;
  }

  /**
   * Create a mock scroll container with realistic dimensions
   */
  static createScrollContainer(sections: number = 5, sectionHeight: number = 1000) {
    const container = document.createElement('div');
    container.style.height = `${sections * sectionHeight}px`;
    container.style.overflow = 'auto';
    
    // Add realistic scroll behavior
    Object.defineProperty(container, 'scrollHeight', {
      value: sections * sectionHeight,
      writable: false
    });
    Object.defineProperty(container, 'clientHeight', {
      value: sectionHeight,
      writable: false
    });
    
    for (let i = 0; i < sections; i++) {
      const section = document.createElement('div');
      section.className = 'story-scroller-section';
      section.style.height = `${sectionHeight}px`;
      section.dataset.sectionIndex = i.toString();
      container.appendChild(section);
    }
    
    return container;
  }

  /**
   * Test timing with real intervals (not mocked)
   */
  static async measureExecutionTime<T>(fn: () => T | Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await fn();
    const duration = performance.now() - startTime;
    return { result, duration };
  }

  /**
   * Test debouncing with real timing
   */
  static async testDebounce(fn: (...args: any[]) => any, delay: number, calls: any[][]) {
    const results: any[] = [];
    let callCount = 0;
    
    const wrappedFn = (...args: any[]) => {
      callCount++;
      results.push(fn(...args));
    };
    
    // Make rapid calls
    for (const args of calls) {
      wrappedFn(...args);
      await new Promise(resolve => setTimeout(resolve, delay / 2)); // Call faster than debounce
    }
    
    // Wait for debounce to settle
    await new Promise(resolve => setTimeout(resolve, delay * 2));
    
    return { callCount, results };
  }

  /**
   * Create realistic scroll physics values for testing
   */
  static getTestScrollPhysics() {
    return {
      // Good values that should pass validation
      good: {
        lerp: 0.3,
        duration: 0.8,
        easing: (t: number) => t * t * (3 - 2 * t), // Smoothstep
        tolerance: 10
      },
      // Bad values that should fail validation
      bad: {
        lerp: 0.05, // Too slow
        duration: 5.0, // Too slow
        easing: null,
        tolerance: -1 // Invalid
      },
      // Edge cases
      edge: {
        lerp: 1.0, // Maximum
        duration: 0.1, // Very fast
        easing: (t: number) => t, // Linear
        tolerance: 0 // Minimum
      }
    };
  }

  /**
   * Validate that state transitions are logical
   */
  static validateStateTransition(before: any, after: any, operation: string): boolean {
    // Common sense checks for scroll state transitions
    if (before.currentSection !== undefined && after.currentSection !== undefined) {
      const sectionDiff = Math.abs(after.currentSection - before.currentSection);
      
      // Section changes should be reasonable (not jumping by more than 1 usually)
      if (operation === 'nextSection' || operation === 'prevSection') {
        return sectionDiff <= 1;
      }
      
      // Direct navigation can jump further
      if (operation === 'gotoSection') {
        return sectionDiff >= 0; // Any jump is valid
      }
    }
    
    // Animation state should be consistent
    if (after.isAnimating === true && operation.includes('navigation')) {
      return after.targetSection !== null;
    }
    
    return true;
  }

  /**
   * Mock only external services, not our logic
   */
  static createMinimalMocks() {
    return {
      // Mock browser APIs that don't exist in jsdom
      requestAnimationFrame: vi.fn((cb) => setTimeout(cb, 16)),
      cancelAnimationFrame: vi.fn(),
      
      // Mock ResizeObserver
      ResizeObserver: vi.fn(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      })),
      
      // Mock IntersectionObserver
      IntersectionObserver: vi.fn(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      })),
      
      // Mock performance APIs
      performance: {
        ...performance,
        now: vi.fn(() => Date.now())
      }
    };
  }
}

/**
 * Global test setup
 */
beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = '';
  
  // Apply minimal mocks
  const mocks = UnitTestHelpers.createMinimalMocks();
  Object.assign(global, mocks);
});

afterEach(() => {
  // Clean up React components
  cleanup();
  
  // Clear all timers
  vi.clearAllTimers();
  vi.clearAllMocks();
});

export { vi, expect };