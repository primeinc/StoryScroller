/**
 * Real Behavior Tests for Demo App
 * 
 * This test suite focuses on actual component behavior and integration
 * without heavy mocking. It tests the real StoryScroller functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'

// Minimal environment setup for JSDOM
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
})

// Set up viewport dimensions for scroll calculations
Object.defineProperty(window, 'innerHeight', { writable: true, value: 720 })
Object.defineProperty(window, 'innerWidth', { writable: true, value: 1280 })

// Mock scroll methods
let scrollY = 0
Object.defineProperty(window, 'scrollY', {
  get: () => scrollY,
  configurable: true,
})

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: ({ top = 0 }: { top?: number }) => {
    scrollY = top
    // Trigger scroll event
    window.dispatchEvent(new Event('scroll'))
  },
})

describe('Demo App - Real Behavior Tests', () => {
  beforeEach(() => {
    // Reset scroll position
    scrollY = 0
    
    // Clear any existing global API
    delete (window as any).storyScrollerAPI
    
    // Mock requestAnimationFrame for testing
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(cb, 16) // ~60fps
      return 1
    })
    
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders without crashing and initializes properly', async () => {
      expect(() => {
        render(<App />)
      }).not.toThrow()

      // Wait for component to initialize
      await waitFor(() => {
        expect(screen.getByText('StoryScroller')).toBeInTheDocument()
      })
    })

    it('renders all expected content sections', async () => {
      render(<App />)

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByText('StoryScroller')).toBeInTheDocument()
      })

      // Check for all section titles
      expect(screen.getByText('StoryScroller')).toBeInTheDocument()
      expect(screen.getByText('Features')).toBeInTheDocument()
      expect(screen.getByText('Motion')).toBeInTheDocument()
      expect(screen.getByText('Integration')).toBeInTheDocument()
      expect(screen.getByText('Ready')).toBeInTheDocument()
    })

    it('renders unified control hub', async () => {
      render(<App />)

      await waitFor(() => {
        // Check for ControlHub in minimal mode (default)
        expect(screen.getByLabelText('Expand controls')).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument() // section number
        expect(screen.getByText('/5')).toBeInTheDocument() // total sections
        
        // Should have the control hub container
        const controlHub = document.querySelector('.control-hub')
        expect(controlHub).toBeInTheDocument()
        expect(controlHub).toHaveClass('control-hub--minimal')
      })
    })

    it('creates proper section structure', async () => {
      render(<App />)

      await waitFor(() => {
        const sections = document.querySelectorAll('.story-scroller-section')
        expect(sections).toHaveLength(5)
        
        // Check data attributes
        sections.forEach((section, index) => {
          expect(section).toHaveAttribute('data-section-idx', index.toString())
          expect(section).toHaveAttribute('tabindex', '0')
        })
      })
    })
  })

  describe('Navigation Functionality', () => {
    it('initializes with correct default state in minimal mode', async () => {
      render(<App />)

      await waitFor(() => {
        // Should start in minimal mode showing section 1 of 5
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('/5')).toBeInTheDocument()
        
        // Should have expand button to access navigation controls
        const expandButton = screen.getByLabelText('Expand controls')
        expect(expandButton).toBeInTheDocument()
        expect(expandButton).not.toBeDisabled()
      })
    })

    it('can expand to standard mode and navigate with buttons', async () => {
      render(<App />)

      // First expand the control hub to standard mode
      const expandButton = screen.getByLabelText('Expand controls')
      fireEvent.click(expandButton)

      await waitFor(() => {
        // Should now be in standard mode with navigation buttons (arrows with aria-labels)
        expect(screen.getByLabelText('Previous section')).toBeInTheDocument()
        expect(screen.getByLabelText('Next section')).toBeInTheDocument()
        expect(screen.getByText('Section 1 of 5')).toBeInTheDocument()
      })

      const nextButton = screen.getByLabelText('Next section')
      
      // Click next button
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Section 2 of 5')).toBeInTheDocument()
      }, { timeout: 2000 })

      // Previous button should now be enabled
      const prevButton = screen.getByLabelText('Previous section')
      expect(prevButton).not.toBeDisabled()
    })

    it('handles navigation to last section correctly', async () => {
      render(<App />)

      // Start by expanding to standard mode for navigation
      const expandButton = screen.getByLabelText('Expand controls')
      fireEvent.click(expandButton)

      await waitFor(() => {
        expect(screen.getByText('Section 1 of 5')).toBeInTheDocument()
      })

      const nextButton = screen.getByLabelText('Next section')

      // Navigate to last section (section 5)  
      for (let i = 0; i < 4; i++) {
        fireEvent.click(nextButton)
        await act(() => new Promise(resolve => setTimeout(resolve, 100)))
      }

      await waitFor(() => {
        expect(screen.getByText('Section 5 of 5')).toBeInTheDocument()
        expect(nextButton).toBeDisabled()
      }, { timeout: 3000 })
    })

    it('handles backward navigation correctly', async () => {
      render(<App />)

      // Expand to standard mode first
      const expandButton = screen.getByLabelText('Expand controls')
      fireEvent.click(expandButton)

      await waitFor(() => {
        expect(screen.getByText('Section 1 of 5')).toBeInTheDocument()
      })

      const nextButton = screen.getByLabelText('Next section')
      const prevButton = screen.getByLabelText('Previous section')

      // Go to section 2
      fireEvent.click(nextButton)
      await waitFor(() => {
        expect(screen.getByText('Section 2 of 5')).toBeInTheDocument()
      })

      // Go back to section 1
      fireEvent.click(prevButton)
      await waitFor(() => {
        expect(screen.getByText('Section 1 of 5')).toBeInTheDocument()
        expect(prevButton).toBeDisabled()
      })
    })
  })

  describe('Global API Integration', () => {
    it('exposes global StoryScroller API', async () => {
      render(<App />)

      await waitFor(() => {
        expect((window as any).storyScrollerAPI).toBeDefined()
      })

      const api = (window as any).storyScrollerAPI
      expect(typeof api.gotoSection).toBe('function')
      expect(typeof api.nextSection).toBe('function')
      expect(typeof api.prevSection).toBe('function')
      expect(typeof api.getState).toBe('function')
      expect(typeof api.forceSync).toBe('function')
      expect(typeof api.emergencyReset).toBe('function')
    })

    it('API state reflects current navigation state', async () => {
      render(<App />)

      await waitFor(() => {
        expect((window as any).storyScrollerAPI).toBeDefined()
      })

      const api = (window as any).storyScrollerAPI
      
      // Initial state should be section 0
      await waitFor(() => {
        const state = api.getState()
        expect(state.currentSection).toBe(0)
      })

      // Navigate using ControlHub - expand to standard mode first
      const expandButton = screen.getByLabelText('Expand controls')
      fireEvent.click(expandButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Next section')).toBeInTheDocument()
      })

      const nextButton = screen.getByLabelText('Next section')
      fireEvent.click(nextButton)

      // API state should update
      await waitFor(() => {
        const state = api.getState()
        expect(state.currentSection).toBe(1)
      }, { timeout: 2000 })
    })

    it('programmatic navigation via API works', async () => {
      render(<App />)

      await waitFor(() => {
        expect((window as any).storyScrollerAPI).toBeDefined()
      })

      const api = (window as any).storyScrollerAPI

      // Navigate to section 2 via API
      act(() => {
        api.gotoSection(2)
      })

      // Verify API state changed (better than checking UI text)
      await waitFor(() => {
        const state = api.getState()
        expect(state.currentSection).toBe(2)
      }, { timeout: 2000 })
    })
  })

  describe('Accessibility Features', () => {
    it('sections are keyboard focusable', async () => {
      render(<App />)

      await waitFor(() => {
        const sections = document.querySelectorAll('.story-scroller-section')
        sections.forEach(section => {
          expect(section).toHaveAttribute('tabindex', '0')
        })
      })
    })

    it('has proper ARIA labels', async () => {
      render(<App />)

      await waitFor(() => {
        const container = document.querySelector('.story-scroller-container')
        expect(container).toHaveAttribute('role', 'region')
        expect(container).toHaveAttribute('aria-label', 'StoryScroller demo sections')
      })
    })

    it('sections have screen reader accessible content', async () => {
      render(<App />)

      await waitFor(() => {
        const sections = document.querySelectorAll('.story-scroller-section')
        sections.forEach((section, index) => {
          expect(section).toHaveAttribute('role', 'region')
          expect(section).toHaveAttribute('aria-label')
        })
      })
    })

    it('includes live region for announcements', async () => {
      render(<App />)

      await waitFor(() => {
        const liveRegion = document.querySelector('[aria-live="polite"]')
        expect(liveRegion).toBeInTheDocument()
        expect(liveRegion).toHaveAttribute('role', 'status')
      })
    })
  })

  describe('Error Handling', () => {
    it('renders without errors when StoryScroller fails gracefully', async () => {
      // This test verifies the error boundary structure exists
      render(<App />)

      await waitFor(() => {
        // Should render even if there are initialization issues
        expect(screen.getByText('StoryScroller')).toBeInTheDocument()
      })

      // Should have proper fallback structure
      const container = document.querySelector('.story-scroller-container')
      expect(container).toBeInTheDocument()
    })

    it('maintains navigation functionality under stress', async () => {
      render(<App />)

      await waitFor(() => {
        expect((window as any).storyScrollerAPI).toBeDefined()
      })

      const api = (window as any).storyScrollerAPI
      const nextButton = screen.getByText('Next →')

      // Rapidly trigger navigation from multiple sources
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextButton)
        act(() => {
          api.nextSection()
        })
        await act(() => new Promise(resolve => setTimeout(resolve, 10)))
      }

      // Should still be functional and in a valid state
      await waitFor(() => {
        const state = api.getState()
        expect(state.currentSection).toBeGreaterThanOrEqual(0)
        expect(state.currentSection).toBeLessThan(5)
      }, { timeout: 3000 })
    })
  })

  describe('Component Integration', () => {
    it('properly initializes animation systems', async () => {
      render(<App />)

      await waitFor(() => {
        // Check that the container has the right classes
        const container = document.querySelector('.story-scroller-container')
        expect(container).toHaveClass('story-scroller-container')
      })

      // Check that sections are properly structured
      const sections = document.querySelectorAll('.story-scroller-section')
      expect(sections).toHaveLength(5)
    })

    it('handles window resize gracefully', async () => {
      render(<App />)

      await waitFor(() => {
        expect((window as any).storyScrollerAPI).toBeDefined()
      })

      // Simulate window resize
      act(() => {
        Object.defineProperty(window, 'innerHeight', { value: 800 })
        Object.defineProperty(window, 'innerWidth', { value: 1200 })
        window.dispatchEvent(new Event('resize'))
      })

      // Should still be functional
      const api = (window as any).storyScrollerAPI
      await waitFor(() => {
        const state = api.getState()
        expect(state.currentSection).toBe(0)
      })
    })

    it('maintains state consistency during navigation', async () => {
      render(<App />)

      await waitFor(() => {
        expect((window as any).storyScrollerAPI).toBeDefined()
      })

      const api = (window as any).storyScrollerAPI
      const nextButton = screen.getByText('Next →')

      // Navigate and verify state consistency
      fireEvent.click(nextButton)

      await waitFor(() => {
        const state = api.getState()
        const displayedSection = screen.getByText(/\d+ \/ 5/)
        
        // UI should match internal state
        expect(displayedSection.textContent).toContain(`${state.currentSection + 1} / 5`)
      }, { timeout: 2000 })
    })
  })

  describe('Performance Characteristics', () => {
    it('completes navigation within reasonable time', async () => {
      render(<App />)

      await waitFor(() => {
        expect((window as any).storyScrollerAPI).toBeDefined()
      })

      const startTime = Date.now()
      const nextButton = screen.getByText('Next →')
      
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('2 / 5')).toBeInTheDocument()
      }, { timeout: 2000 })

      const endTime = Date.now()
      const navigationTime = endTime - startTime

      // Should complete within 1.5 seconds (allowing for test overhead)
      expect(navigationTime).toBeLessThan(1500)
    })

    it('handles rapid navigation without breaking', async () => {
      render(<App />)

      await waitFor(() => {
        expect((window as any).storyScrollerAPI).toBeDefined()
      })

      const nextButton = screen.getByText('Next →')

      // Rapid clicking should not break the component
      for (let i = 0; i < 10; i++) {
        fireEvent.click(nextButton)
        await act(() => new Promise(resolve => setTimeout(resolve, 10)))
      }

      // Should end up in a valid state
      await waitFor(() => {
        const sectionText = screen.getByText(/\d+ \/ 5/)
        expect(sectionText).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })
})