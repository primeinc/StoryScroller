import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../src/App'

// Mock GSAP modules
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    to: vi.fn((target, options) => {
      if (options.onComplete) {
        setTimeout(options.onComplete, 0)
      }
      return { kill: vi.fn() }
    }),
    context: {
      add: vi.fn((fn) => fn),
    },
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    utils: {
      clamp: vi.fn((min, max, value) => Math.max(min, Math.min(max, value))),
    },
    killTweensOf: vi.fn(),
  },
}))

vi.mock('gsap/all', () => ({
  ScrollTrigger: {
    config: vi.fn(),
    scrollerProxy: vi.fn(),
    refresh: vi.fn(),
    update: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    killAll: vi.fn(),
  },
  ScrollToPlugin: {},
  Observer: {
    create: vi.fn(() => ({
      kill: vi.fn(),
    })),
  },
}))

vi.mock('@gsap/react', () => ({
  useGSAP: vi.fn((callback, config) => {
    const cleanup = callback()
    if (cleanup && typeof cleanup === 'function') {
      setTimeout(() => cleanup(), 0)
    }
  }),
}))

// Mock Lenis
const mockLenisInstance = {
  raf: vi.fn(),
  on: vi.fn(),
  destroy: vi.fn(),
  scroll: 0,
  scrollTo: vi.fn(),
}

vi.mock('lenis', () => ({
  default: vi.fn(() => mockLenisInstance),
}))

// Mock window methods that GSAP/Lenis might use
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
})

Object.defineProperty(window, 'scrollY', {
  value: 0,
  writable: true,
})

Object.defineProperty(window, 'innerHeight', {
  value: 768,
  writable: true,
})

Object.defineProperty(window, 'innerWidth', {
  value: 1024,
  writable: true,
})

// Mock requestAnimationFrame for tests
let animationFrameId = 0
global.requestAnimationFrame = vi.fn((callback) => {
  animationFrameId++
  setTimeout(() => callback(animationFrameId), 16)
  return animationFrameId
})

global.cancelAnimationFrame = vi.fn()

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(function() {
  return {
    top: 0,
    left: 0,
    bottom: 768,
    right: 1024,
    width: 1024,
    height: 768,
    x: 0,
    y: 0,
    toJSON: () => {},
  }
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

describe('StoryScroller Demo App Content Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the App component without errors', () => {
    expect(() => render(<App />)).not.toThrow()
  })

  it('renders all 5 sections with correct content', () => {
    const { container } = render(<App />)
    
    // Verify we have 5 sections
    const sections = container.querySelectorAll('[data-testid^="section-"]')
    expect(sections).toHaveLength(5)
    
    // Verify each section has the expected data-testid
    expect(container.querySelector('[data-testid="section-0"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="section-1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="section-2"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="section-3"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="section-4"]')).toBeInTheDocument()
  })

  it('displays the hero section content', () => {
    render(<App />)
    
    // Check for main title
    expect(screen.getByText('StoryScroller')).toBeInTheDocument()
    
    // Check for subtitle
    expect(screen.getByText('A production-ready React scroll-snapping component')).toBeInTheDocument()
    
    // Check for action buttons - use getAllByText since "Get Started" appears multiple times
    const getStartedButtons = screen.getAllByText('Get Started')
    expect(getStartedButtons.length).toBeGreaterThan(0)
    expect(screen.getByText('View Docs')).toBeInTheDocument()
  })

  it('displays the features section content', () => {
    render(<App />)
    
    // Check for features heading
    expect(screen.getByText('Features')).toBeInTheDocument()
    
    // Check for feature cards
    expect(screen.getByText('🚀 Smooth')).toBeInTheDocument()
    expect(screen.getByText('Buttery smooth scrolling with Lenis')).toBeInTheDocument()
    
    expect(screen.getByText('🎯 Precise')).toBeInTheDocument()
    expect(screen.getByText('GSAP-powered animations and control')).toBeInTheDocument()
    
    expect(screen.getByText('⚛️ React 18+')).toBeInTheDocument()
    expect(screen.getByText('Built for modern React with TypeScript')).toBeInTheDocument()
  })

  it('displays the interactive demo section content', () => {
    render(<App />)
    
    // Check for demo heading
    expect(screen.getByText('Interactive Demo')).toBeInTheDocument()
    
    // Check for demo instructions
    expect(screen.getByText('Try scrolling with your mouse wheel, trackpad, or keyboard arrows!')).toBeInTheDocument()
    
    // Check for interaction methods
    expect(screen.getByText('Mouse/Trackpad')).toBeInTheDocument()
    expect(screen.getByText('Keyboard')).toBeInTheDocument()
    expect(screen.getByText('Touch')).toBeInTheDocument()
    expect(screen.getByText('Navigation')).toBeInTheDocument()
  })

  it('displays the customization section content', () => {
    render(<App />)
    
    // Check for customization heading
    expect(screen.getByText('Customization')).toBeInTheDocument()
    
    // Check for customization options
    expect(screen.getByText('Animation Duration & Easing')).toBeInTheDocument()
    expect(screen.getByText('Trackpad Tolerance')).toBeInTheDocument()
    expect(screen.getByText('Callbacks & Events')).toBeInTheDocument()
  })

  it('displays the get started section content', () => {
    render(<App />)
    
    // Check for get started heading (appears twice - once in hero, once in final section)
    const getStartedElements = screen.getAllByText('Get Started')
    expect(getStartedElements.length).toBeGreaterThanOrEqual(2)
    
    // Check for installation command
    expect(screen.getByText('pnpm add @primeinc/story-scroller')).toBeInTheDocument()
    
    // Check for final section action buttons
    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Documentation')).toBeInTheDocument()
  })

  it('renders navigation controls', () => {
    render(<App />)
    
    // Check for prev/next buttons
    expect(screen.getByText('← Prev')).toBeInTheDocument()
    expect(screen.getByText('Next →')).toBeInTheDocument()
    
    // Check for section counter
    expect(screen.getByText('1 / 5')).toBeInTheDocument()
    
    // Check for debug toggle
    expect(screen.getByText('Show Debug')).toBeInTheDocument()
  })

  it('renders dot navigation', () => {
    const { container } = render(<App />)
    
    // Check for navigation dots
    const dots = container.querySelectorAll('.demo-nav-dot')
    expect(dots).toHaveLength(5)
    
    // First dot should be active
    expect(dots[0]).toHaveClass('active')
  })

  it('has appropriate CSS classes for styling', () => {
    const { container } = render(<App />)
    
    // Check for story scroller container
    const scrollerContainer = container.querySelector('.story-scroller-container')
    expect(scrollerContainer).toBeInTheDocument()
    
    // Check that sections have background classes
    const firstSection = container.querySelector('[data-testid="section-0"]')
    expect(firstSection).toHaveClass('bg-gradient-to-br', 'from-gray-900', 'via-purple-900', 'to-gray-900')
  })

  it('sections are visible and not hidden by CSS', () => {
    const { container } = render(<App />)
    
    // Get all sections
    const sections = container.querySelectorAll('[data-testid^="section-"]')
    
    sections.forEach((section, index) => {
      // Each section should exist in the DOM
      expect(section).toBeInTheDocument()
      
      // Sections should have proper dimensions (full width/height)
      expect(section).toHaveClass('w-full', 'h-full')
      
      // Sections should not have display: none or visibility: hidden
      const computedStyle = window.getComputedStyle(section)
      expect(computedStyle.display).not.toBe('none')
      expect(computedStyle.visibility).not.toBe('hidden')
    })
  })
})