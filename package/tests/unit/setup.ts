/**
 * Unit Test Setup
 * 
 * Following the "test real behavior" philosophy:
 * - Use real DOM (jsdom)
 * - Minimal mocking of only external APIs
 * - Real timing for performance tests
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock only external libraries that we can't test in jsdom
// Keep our own logic unmocked

// Mock GSAP (external animation library)
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    to: vi.fn().mockImplementation((target, vars) => ({
      kill: vi.fn(),
      progress: vi.fn(),
      duration: vi.fn(() => vars.duration || 1),
      isActive: vi.fn(() => false),
    })),
    utils: {
      clamp: (min: number, max: number, value: number) => Math.min(Math.max(value, min), max),
    },
    killTweensOf: vi.fn(),
    set: vi.fn(),
  },
  ScrollTrigger: {
    config: vi.fn(),
    scrollerProxy: vi.fn(),
    refresh: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    killAll: vi.fn(),
    update: vi.fn(),
  },
  ScrollToPlugin: {},
  Observer: {
    create: vi.fn(() => ({
      kill: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
    })),
  },
}));

// Mock Lenis (external smooth scroll library)
vi.mock('lenis', () => ({
  default: class MockLenis {
    scroll = 0;
    velocity = 0;
    isScrolling = false;
    isStopped = false;
    options = { lerp: 0.1 };
    
    constructor(options: any = {}) {
      this.options = { ...this.options, ...options };
    }
    
    raf(time: number) {
      // Simulate real raf behavior
    }
    
    on(event: string, callback: Function) {}
    
    destroy() {}
    
    scrollTo(target: number | string, options?: any) {
      if (typeof target === 'number') {
        this.scroll = target;
      }
    }
    
    start() {
      this.isStopped = false;
    }
    
    stop() {
      this.isStopped = true;
    }
  },
}));

// Mock @gsap/react
vi.mock('@gsap/react', () => ({
  useGSAP: vi.fn((callback, deps) => {
    if (typeof callback === 'function') {
      const cleanup = callback();
      return cleanup;
    }
  }),
}));

// Mock browser APIs that don't exist in jsdom but preserve timing
Object.defineProperty(window, 'requestAnimationFrame', {
  value: (cb: FrameRequestCallback) => setTimeout(cb, 16),
  writable: true,
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: (id: number) => clearTimeout(id),
  writable: true,
});

Object.defineProperty(window, 'ResizeObserver', {
  value: class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  writable: true,
});

Object.defineProperty(window, 'IntersectionObserver', {
  value: class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  writable: true,
});

// Keep performance.now() real for timing tests
Object.defineProperty(window, 'performance', {
  value: {
    ...performance,
    now: () => Date.now(),
  },
  writable: true,
});

// Add real scroll behavior to jsdom
Object.defineProperty(Element.prototype, 'scrollTo', {
  value: function(options: ScrollToOptions | number, y?: number) {
    if (typeof options === 'number') {
      this.scrollLeft = options;
      this.scrollTop = y || 0;
    } else {
      this.scrollLeft = options.left || 0;
      this.scrollTop = options.top || 0;
    }
    // Trigger scroll event
    this.dispatchEvent(new Event('scroll'));
  },
  writable: true,
});

// Enable real timers for performance testing
vi.stubGlobal('setTimeout', setTimeout);
vi.stubGlobal('clearTimeout', clearTimeout);
vi.stubGlobal('setInterval', setInterval);
vi.stubGlobal('clearInterval', clearInterval);