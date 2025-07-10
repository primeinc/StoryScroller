import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia for all tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock requestAnimationFrame for performance monitoring tests
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(Date.now()), 16) as unknown as number;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock GSAP for tests
const mockGSAP = {
  to: () => ({ kill: () => {} }),
  killTweensOf: () => {},
  registerPlugin: () => {},
  ticker: {
    add: () => {},
    remove: () => {},
  },
};

// Mock ScrollTrigger
const mockScrollTrigger = {
  create: () => ({ kill: () => {} }),
  killAll: () => {},
  refresh: () => {},
};

// Mock Observer
const mockObserver = {
  create: () => ({ kill: () => {} }),
};

// Mock the modules
vi.mock('gsap', () => ({ 
  default: mockGSAP,
  gsap: mockGSAP 
}));

vi.mock('gsap/ScrollTrigger', () => ({ 
  ScrollTrigger: mockScrollTrigger 
}));

vi.mock('gsap/ScrollToPlugin', () => ({ 
  ScrollToPlugin: {} 
}));

vi.mock('gsap/Observer', () => ({ 
  Observer: mockObserver 
}));

// Mock Lenis
vi.mock('lenis', () => ({
  default: class MockLenis {
    constructor() {}
    destroy() {}
    stop() {}
    start() {}
    raf() {}
  }
}));