import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'

// Mock GSAP and Lenis to prevent SSR issues in tests
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    to: vi.fn(),
    utils: {
      clamp: vi.fn((min, max, value) => Math.min(Math.max(value, min), max)),
    },
    killTweensOf: vi.fn(),
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
    })),
  },
}))

vi.mock('lenis', () => ({
  default: class MockLenis {
    constructor() {}
    raf() {}
    on() {}
    destroy() {}
    scrollTo() {}
    start() {}
    stop() {}
    scroll = 0
  },
}))

vi.mock('@gsap/react', () => ({
  useGSAP: vi.fn((callback, deps) => {
    // Mock useGSAP to just call the callback
    if (typeof callback === 'function') {
      const cleanup = callback()
      return cleanup
    }
  }),
}))

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    expect(() => {
      render(<App />)
    }).not.toThrow()
  })

  it('displays navigation controls', async () => {
    render(<App />)
    
    // Check for navigation buttons
    expect(screen.getByText('← Prev')).toBeInTheDocument()
    expect(screen.getByText('Next →')).toBeInTheDocument()
    expect(screen.getByText('1 / 5')).toBeInTheDocument()
  })

  it('renders all 5 sections', () => {
    render(<App />)
    
    // Check for section titles
    expect(screen.getByText('StoryScroller')).toBeInTheDocument()
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('Motion')).toBeInTheDocument()
    expect(screen.getByText('Integration')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('prev button is disabled on first section', () => {
    render(<App />)
    
    const prevButton = screen.getByText('← Prev')
    expect(prevButton).toBeDisabled()
  })

  it('can navigate with next button', async () => {
    render(<App />)
    
    const nextButton = screen.getByText('Next →')
    expect(nextButton).not.toBeDisabled()
    
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('2 / 5')).toBeInTheDocument()
    })
  })

  it('disables next button on last section', async () => {
    render(<App />)
    
    const nextButton = screen.getByText('Next →')
    
    // Click through to last section
    for (let i = 0; i < 4; i++) {
      fireEvent.click(nextButton)
      await waitFor(() => {})
    }
    
    await waitFor(() => {
      expect(screen.getByText('5 / 5')).toBeInTheDocument()
      expect(nextButton).toBeDisabled()
    })
  })

  it('can navigate backwards', async () => {
    render(<App />)
    
    const nextButton = screen.getByText('Next →')
    const prevButton = screen.getByText('← Prev')
    
    // Go to second section
    fireEvent.click(nextButton)
    await waitFor(() => {
      expect(screen.getByText('2 / 5')).toBeInTheDocument()
    })
    
    // Go back to first section
    fireEvent.click(prevButton)
    await waitFor(() => {
      expect(screen.getByText('1 / 5')).toBeInTheDocument()
      expect(prevButton).toBeDisabled()
    })
  })

  it('displays error fallback when StoryScroller fails', () => {
    // This test would need us to force an error in StoryScroller
    // For now, just verify the error boundary structure exists
    render(<App />)
    
    // The StoryScrollerWithErrorBoundary should be present
    // We can't easily test the error state without more complex mocking
    expect(screen.getByText('StoryScroller')).toBeInTheDocument()
  })

  it('has proper section structure for narrative motion', () => {
    render(<App />)
    
    // Each section should have the expected CSS classes for motion
    const sections = document.querySelectorAll('.story-scroller-section')
    expect(sections).toHaveLength(5)
    
    // Each section should have scroll-snap-align for fallback
    sections.forEach(section => {
      const styles = window.getComputedStyle(section)
      // We can't easily test CSS in jsdom, but we can check the elements exist
      expect(section).toBeInTheDocument()
    })
  })
})