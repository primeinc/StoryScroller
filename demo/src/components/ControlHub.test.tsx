import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ControlHub } from './ControlHub'

// Mock StoryScroller API
const mockStoryScrollerAPI = {
  getState: vi.fn(() => ({
    currentSection: 0,
    isAnimating: false,
  })),
  nextSection: vi.fn(),
  prevSection: vi.fn(),
  gotoSection: vi.fn(),
  updateConfig: vi.fn(),
}

// Mock performance.now for FPS testing
let mockTime = 0
const originalPerformanceNow = performance.now

describe('ControlHub Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTime = 0
    // Set up StoryScroller API mock
    ;(window as any).storyScrollerAPI = mockStoryScrollerAPI
    
    // Mock performance.now
    performance.now = vi.fn(() => mockTime)
    
    // Mock requestAnimationFrame
    let rafCallbacks: FrameRequestCallback[] = []
    global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      rafCallbacks.push(callback)
      return rafCallbacks.length
    })
    
    global.cancelAnimationFrame = vi.fn()
    
    // Function to simulate frame advancement
    ;(global as any).advanceFrame = (ms = 16.67) => {
      mockTime += ms
      rafCallbacks.forEach(cb => cb(mockTime))
      rafCallbacks = []
    }
  })

  afterEach(() => {
    performance.now = originalPerformanceNow
    delete (window as any).storyScrollerAPI
    delete (global as any).advanceFrame
  })

  describe('Mode Transitions', () => {
    it('should start in minimal mode', () => {
      render(<ControlHub sectionsCount={5} />)
      
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('/5')).toBeInTheDocument()
      expect(screen.getByLabelText('Expand controls')).toBeInTheDocument()
    })

    it('should transition from minimal to standard mode', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      const expandButton = screen.getByLabelText('Expand controls')
      fireEvent.click(expandButton)
      
      // Check loading state appears
      expect(document.querySelector('.control-hub-overlay')).toBeInTheDocument()
      
      // Wait for transition
      await waitFor(() => {
        expect(screen.getByText('Section 1 of 5')).toBeInTheDocument()
        expect(screen.getByLabelText('Advanced controls')).toBeInTheDocument()
        expect(screen.getByLabelText('Minimize controls')).toBeInTheDocument()
      })
      
      // Loading state should be gone
      expect(document.querySelector('.control-hub-overlay')).not.toBeInTheDocument()
    })

    it('should transition from standard to advanced mode', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Go to standard mode first
      fireEvent.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      
      // Click advanced controls
      fireEvent.click(screen.getByLabelText('Advanced controls'))
      
      await waitFor(() => {
        expect(screen.getByText('Demo Controls')).toBeInTheDocument()
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByLabelText('Close advanced controls')).toBeInTheDocument()
      })
    })

    it('should show loading overlay during transitions', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      const expandButton = screen.getByLabelText('Expand controls')
      fireEvent.click(expandButton)
      
      // Should show loading overlay immediately
      const overlay = document.querySelector('.control-hub-overlay')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveAttribute('aria-hidden', 'true')
      
      // Should have spinner
      expect(document.querySelector('.control-hub-spinner')).toBeInTheDocument()
      
      // Wait for transition to complete
      await waitFor(() => {
        expect(document.querySelector('.control-hub-overlay')).not.toBeInTheDocument()
      })
    })
  })

  describe('Focus Trap Behavior', () => {
    it('should trap focus in advanced mode', async () => {
      const user = userEvent.setup()
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to advanced mode
      await user.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByLabelText('Advanced controls'))
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
        expect(dialog).toHaveAttribute('aria-modal', 'true')
      })
      
      // Check first focusable element gets focus
      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByLabelText('Close advanced controls'))
      })
    })

    it('should cycle focus with Tab key', async () => {
      const user = userEvent.setup()
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to advanced mode
      await user.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByLabelText('Advanced controls'))
      
      await waitFor(() => screen.getByRole('dialog'))
      
      // Tab through all focusable elements
      const closeButton = screen.getByLabelText('Close advanced controls')
      const navigationTab = screen.getByText('Navigation')
      const performanceTab = screen.getByText('Performance')
      const configurationTab = screen.getByText('Configuration')
      
      // Should start at close button
      expect(document.activeElement).toBe(closeButton)
      
      // Tab to navigation tab
      await user.keyboard('{Tab}')
      expect(document.activeElement).toBe(navigationTab)
      
      // Tab to performance tab
      await user.keyboard('{Tab}')
      expect(document.activeElement).toBe(performanceTab)
      
      // Tab to configuration tab
      await user.keyboard('{Tab}')
      expect(document.activeElement).toBe(configurationTab)
    })

    it('should return focus to previous element when closing', async () => {
      const user = userEvent.setup()
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to standard mode
      await user.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      
      // Focus the advanced controls button
      const advancedButton = screen.getByLabelText('Advanced controls')
      advancedButton.focus()
      expect(document.activeElement).toBe(advancedButton)
      
      // Open advanced mode
      await user.click(advancedButton)
      await waitFor(() => screen.getByRole('dialog'))
      
      // Close advanced mode
      await user.click(screen.getByLabelText('Close advanced controls'))
      
      // Focus should return to the advanced controls button
      await waitFor(() => {
        expect(document.activeElement).toBe(advancedButton)
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('should close advanced mode with Escape key', async () => {
      const user = userEvent.setup()
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to advanced mode
      await user.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByLabelText('Advanced controls'))
      
      await waitFor(() => screen.getByRole('dialog'))
      
      // Press Escape
      await user.keyboard('{Escape}')
      
      // Should return to standard mode
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(screen.getByText('Section 1 of 5')).toBeInTheDocument()
      })
    })

    it('should handle Shift+Tab for reverse navigation', async () => {
      const user = userEvent.setup()
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to advanced mode
      await user.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByLabelText('Advanced controls'))
      
      await waitFor(() => screen.getByRole('dialog'))
      
      // Tab to navigation tab
      await user.keyboard('{Tab}')
      expect(document.activeElement?.textContent).toBe('Navigation')
      
      // Shift+Tab back to close button
      await user.keyboard('{Shift>}{Tab}{/Shift}')
      expect(document.activeElement).toBe(screen.getByLabelText('Close advanced controls'))
    })
  })

  describe('Configuration Changes and Visual Feedback', () => {
    it('should update configuration values', async () => {
      const user = userEvent.setup()
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to advanced mode and configuration tab
      await user.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByLabelText('Advanced controls'))
      await waitFor(() => screen.getByText('Configuration'))
      await user.click(screen.getByText('Configuration'))
      
      // Get duration slider
      const durationSlider = screen.getByLabelText('Animation duration')
      expect(durationSlider).toHaveValue('1.2')
      
      // Change duration
      fireEvent.change(durationSlider, { target: { value: '1.5' } })
      expect(durationSlider).toHaveValue('1.5')
      expect(screen.getByText('Duration: 1.5s')).toBeInTheDocument()
    })

    it('should show visual feedback when configuration changes', async () => {
      const user = userEvent.setup()
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to configuration tab
      await user.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByText('Configuration'))
      
      // Initially, apply button should be disabled
      const applyButton = screen.getByRole('button', { name: 'No Changes' })
      expect(applyButton).toBeDisabled()
      
      // Change a value
      const durationSlider = screen.getByLabelText('Animation duration')
      fireEvent.change(durationSlider, { target: { value: '1.5' } })
      
      // Apply button should now be enabled with different text
      await waitFor(() => {
        const updatedButton = screen.getByRole('button', { name: 'Apply Changes' })
        expect(updatedButton).toBeEnabled()
      })
      
      // Should show change indicator
      expect(document.querySelector('.config-change-indicator')).toBeInTheDocument()
      expect(screen.getByText('Configuration has been modified')).toBeInTheDocument()
    })

    it('should show toast notification when configuration is applied', async () => {
      const user = userEvent.setup()
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to configuration tab
      await user.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByText('Configuration'))
      
      // Change a value
      const durationSlider = screen.getByLabelText('Animation duration')
      fireEvent.change(durationSlider, { target: { value: '1.5' } })
      
      // Apply changes
      await user.click(screen.getByRole('button', { name: 'Apply Changes' }))
      
      // Check toast appears
      await waitFor(() => {
        const toast = document.querySelector('.control-hub-toast')
        expect(toast).toBeInTheDocument()
        expect(toast).toHaveAttribute('role', 'status')
        expect(toast).toHaveAttribute('aria-live', 'polite')
        expect(screen.getByText('Configuration applied successfully!')).toBeInTheDocument()
      })
      
      // Toast should disappear after 3 seconds
      await waitFor(() => {
        expect(document.querySelector('.control-hub-toast')).not.toBeInTheDocument()
      }, { timeout: 4000 })
    })

    it('should call StoryScroller API when applying configuration', async () => {
      const user = userEvent.setup()
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to configuration tab
      await user.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByText('Configuration'))
      
      // Change configuration
      const durationSlider = screen.getByLabelText('Animation duration')
      fireEvent.change(durationSlider, { target: { value: '1.8' } })
      
      const toleranceSlider = screen.getByLabelText('Scroll sensitivity')
      fireEvent.change(toleranceSlider, { target: { value: '75' } })
      
      const magneticCheckbox = screen.getByRole('checkbox', { name: /Magnetic Snap/i })
      await user.click(magneticCheckbox)
      
      // Apply changes
      await user.click(screen.getByRole('button', { name: 'Apply Changes' }))
      
      // Verify API was called with correct config
      expect(mockStoryScrollerAPI.updateConfig).toHaveBeenCalledWith({
        duration: 1.8,
        tolerance: 75,
        enableMagneticSnap: false,
        magneticThreshold: 0.15,
      })
    })
  })

  describe('Touch Target Sizes', () => {
    it('should have minimum 44px touch targets', () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Check minimal mode button
      const expandButton = screen.getByLabelText('Expand controls')
      const expandButtonRect = expandButton.getBoundingClientRect()
      expect(expandButtonRect.width).toBeGreaterThanOrEqual(44)
      expect(expandButtonRect.height).toBeGreaterThanOrEqual(44)
    })

    it('should have properly sized navigation buttons', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Go to standard mode
      fireEvent.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Previous section'))
      
      // Check navigation buttons
      const prevButton = screen.getByLabelText('Previous section')
      const nextButton = screen.getByLabelText('Next section')
      
      const prevRect = prevButton.getBoundingClientRect()
      const nextRect = nextButton.getBoundingClientRect()
      
      expect(prevRect.width).toBeGreaterThanOrEqual(44)
      expect(prevRect.height).toBeGreaterThanOrEqual(44)
      expect(nextRect.width).toBeGreaterThanOrEqual(44)
      expect(nextRect.height).toBeGreaterThanOrEqual(44)
    })

    it('should have properly sized section dots', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Go to standard mode
      fireEvent.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Go to section 1'))
      
      // Check section dots
      for (let i = 1; i <= 5; i++) {
        const dot = screen.getByLabelText(`Go to section ${i}`)
        const rect = dot.getBoundingClientRect()
        expect(rect.width).toBeGreaterThanOrEqual(44)
        expect(rect.height).toBeGreaterThanOrEqual(44)
      }
    })
  })

  describe('Loading States', () => {
    it('should show transitioning class during mode changes', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      const container = document.querySelector('.control-hub')
      expect(container).not.toHaveClass('transitioning')
      
      // Trigger transition
      fireEvent.click(screen.getByLabelText('Expand controls'))
      
      // Should have transitioning class
      expect(container).toHaveClass('transitioning')
      
      // Wait for transition to complete
      await waitFor(() => {
        expect(container).not.toHaveClass('transitioning')
      })
    })
  })

  describe('ARIA Attributes', () => {
    it('should have proper ARIA attributes in advanced mode', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to advanced mode
      fireEvent.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      fireEvent.click(screen.getByLabelText('Advanced controls'))
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-modal', 'true')
        expect(dialog).toHaveAttribute('aria-labelledby', 'hub-title')
      })
    })

    it('should have proper ARIA attributes for sliders', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to configuration tab
      fireEvent.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      fireEvent.click(screen.getByLabelText('Advanced controls'))
      fireEvent.click(screen.getByText('Configuration'))
      
      const durationSlider = screen.getByLabelText('Animation duration')
      expect(durationSlider).toHaveAttribute('aria-valuemin', '0.2')
      expect(durationSlider).toHaveAttribute('aria-valuemax', '2')
      expect(durationSlider).toHaveAttribute('aria-valuenow', '1.2')
      
      const toleranceSlider = screen.getByLabelText('Scroll sensitivity')
      expect(toleranceSlider).toHaveAttribute('aria-valuemin', '10')
      expect(toleranceSlider).toHaveAttribute('aria-valuemax', '100')
      expect(toleranceSlider).toHaveAttribute('aria-valuenow', '50')
    })

    it('should announce status changes', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to configuration tab
      fireEvent.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      fireEvent.click(screen.getByLabelText('Advanced controls'))
      fireEvent.click(screen.getByText('Configuration'))
      
      // Change a value
      const durationSlider = screen.getByLabelText('Animation duration')
      fireEvent.change(durationSlider, { target: { value: '1.5' } })
      
      // Check for live region
      const liveRegion = screen.getByText('Configuration has been modified')
      expect(liveRegion.closest('[role="status"]')).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Button State Management', () => {
    it('should disable prev button on first section', () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Go to standard mode
      fireEvent.click(screen.getByLabelText('Expand controls'))
      
      waitFor(() => {
        const prevButton = screen.getByLabelText('Previous section')
        expect(prevButton).toBeDisabled()
      })
    })

    it('should disable next button on last section', async () => {
      mockStoryScrollerAPI.getState.mockReturnValue({
        currentSection: 4, // Last section (0-indexed)
        isAnimating: false,
      })
      
      render(<ControlHub sectionsCount={5} />)
      
      // Go to standard mode
      fireEvent.click(screen.getByLabelText('Expand controls'))
      
      await waitFor(() => {
        const nextButton = screen.getByLabelText('Next section')
        expect(nextButton).toBeDisabled()
      })
    })

    it('should enable/disable apply button based on changes', async () => {
      const user = userEvent.setup()
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to configuration tab
      await user.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByText('Configuration'))
      
      // Initially disabled
      expect(screen.getByRole('button', { name: 'No Changes' })).toBeDisabled()
      
      // Change value
      const durationSlider = screen.getByLabelText('Animation duration')
      fireEvent.change(durationSlider, { target: { value: '1.5' } })
      
      // Should be enabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Apply Changes' })).toBeEnabled()
      })
      
      // Apply changes
      await user.click(screen.getByRole('button', { name: 'Apply Changes' }))
      
      // Should be disabled again after applying
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'No Changes' })).toBeDisabled()
      })
    })
  })

  describe('Real-time Value Updates', () => {
    it('should poll and update current section', async () => {
      const { rerender } = render(<ControlHub sectionsCount={5} />)
      
      // Initial state
      expect(screen.getByText('1')).toBeInTheDocument()
      
      // Update mock to return different section
      mockStoryScrollerAPI.getState.mockReturnValue({
        currentSection: 2,
        isAnimating: false,
      })
      
      // Wait for polling interval (100ms)
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument() // Section 3 (0-indexed + 1)
      }, { timeout: 200 })
    })

    it('should update animation status', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Go to standard mode
      fireEvent.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByText('Section 1 of 5'))
      
      // Initially not animating
      expect(screen.queryByText('Animating')).not.toBeInTheDocument()
      
      // Update mock to show animating
      mockStoryScrollerAPI.getState.mockReturnValue({
        currentSection: 0,
        isAnimating: true,
      })
      
      // Wait for update
      await waitFor(() => {
        expect(screen.getByText('Animating')).toBeInTheDocument()
      })
    })

    it('should update FPS counter', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Go to standard mode to see FPS
      fireEvent.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByText('60 FPS'))
      
      // Simulate 30 frames at 60 FPS (16.67ms per frame)
      for (let i = 0; i < 30; i++) {
        ;(global as any).advanceFrame(16.67)
      }
      
      // After 500ms, should still show ~60 FPS
      expect(screen.getByText('60 FPS')).toBeInTheDocument()
      
      // Simulate 30 more frames to complete 1 second
      for (let i = 0; i < 30; i++) {
        ;(global as any).advanceFrame(16.67)
      }
      
      // After ~1 second, FPS should update
      await waitFor(() => {
        const fpsText = screen.getByText(/\d+ FPS/)
        expect(fpsText).toBeInTheDocument()
      })
    })

    it('should update slider values in real-time', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to configuration tab
      fireEvent.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      fireEvent.click(screen.getByLabelText('Advanced controls'))
      fireEvent.click(screen.getByText('Configuration'))
      
      const durationSlider = screen.getByLabelText('Animation duration')
      
      // Change value and verify real-time update
      fireEvent.change(durationSlider, { target: { value: '0.8' } })
      expect(screen.getByText('Duration: 0.8s')).toBeInTheDocument()
      expect(screen.getByText('0.8s')).toBeInTheDocument()
      
      fireEvent.change(durationSlider, { target: { value: '1.9' } })
      expect(screen.getByText('Duration: 1.9s')).toBeInTheDocument()
      expect(screen.getByText('1.9s')).toBeInTheDocument()
    })
  })

  describe('Navigation Functionality', () => {
    it('should call navigation methods on button clicks', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Go to standard mode
      fireEvent.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Next section'))
      
      // Click next
      fireEvent.click(screen.getByLabelText('Next section'))
      expect(mockStoryScrollerAPI.nextSection).toHaveBeenCalledTimes(1)
      
      // Mock being on section 2
      mockStoryScrollerAPI.getState.mockReturnValue({
        currentSection: 1,
        isAnimating: false,
      })
      
      // Click prev
      await waitFor(() => {
        const prevButton = screen.getByLabelText('Previous section')
        expect(prevButton).toBeEnabled()
      })
      
      fireEvent.click(screen.getByLabelText('Previous section'))
      expect(mockStoryScrollerAPI.prevSection).toHaveBeenCalledTimes(1)
    })

    it('should navigate to specific sections via dots', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Go to standard mode
      fireEvent.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Go to section 3'))
      
      // Click section 3
      fireEvent.click(screen.getByLabelText('Go to section 3'))
      expect(mockStoryScrollerAPI.gotoSection).toHaveBeenCalledWith(2) // 0-indexed
      
      // Click section 5
      fireEvent.click(screen.getByLabelText('Go to section 5'))
      expect(mockStoryScrollerAPI.gotoSection).toHaveBeenCalledWith(4) // 0-indexed
    })

    it('should highlight active section dot', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Go to standard mode
      fireEvent.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Go to section 1'))
      
      // First dot should be active
      const firstDot = screen.getByLabelText('Go to section 1')
      expect(firstDot).toHaveClass('active')
      
      // Other dots should not be active
      for (let i = 2; i <= 5; i++) {
        const dot = screen.getByLabelText(`Go to section ${i}`)
        expect(dot).not.toHaveClass('active')
      }
      
      // Update to section 3
      mockStoryScrollerAPI.getState.mockReturnValue({
        currentSection: 2,
        isAnimating: false,
      })
      
      // Wait for update
      await waitFor(() => {
        const thirdDot = screen.getByLabelText('Go to section 3')
        expect(thirdDot).toHaveClass('active')
        expect(firstDot).not.toHaveClass('active')
      })
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between tabs in advanced mode', async () => {
      const user = userEvent.setup()
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to advanced mode
      await user.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByLabelText('Advanced controls'))
      
      // Navigation tab should be active by default
      const navTab = screen.getByRole('button', { name: 'Navigation' })
      const perfTab = screen.getByRole('button', { name: 'Performance' })
      const configTab = screen.getByRole('button', { name: 'Configuration' })
      
      expect(navTab).toHaveClass('active')
      expect(perfTab).not.toHaveClass('active')
      expect(configTab).not.toHaveClass('active')
      
      // Click performance tab
      await user.click(perfTab)
      expect(perfTab).toHaveClass('active')
      expect(navTab).not.toHaveClass('active')
      
      // Verify performance content is shown
      expect(screen.getByText('Frame Time (ms)')).toBeInTheDocument()
      
      // Click configuration tab
      await user.click(configTab)
      expect(configTab).toHaveClass('active')
      expect(perfTab).not.toHaveClass('active')
      
      // Verify configuration content is shown
      expect(screen.getByText(/Duration:/)).toBeInTheDocument()
    })
  })

  describe('Progress Visualization', () => {
    it('should update progress ring in minimal mode', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Check initial progress (1/5 = 20%)
      const progressBar = document.querySelector('.progress-bar')
      expect(progressBar).toHaveAttribute('strokeDasharray', '20, 100')
      
      // Update to section 3
      mockStoryScrollerAPI.getState.mockReturnValue({
        currentSection: 2,
        isAnimating: false,
      })
      
      // Wait for update (3/5 = 60%)
      await waitFor(() => {
        expect(progressBar).toHaveAttribute('strokeDasharray', '60, 100')
      })
    })

    it('should update progress bar in advanced mode', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to advanced mode
      fireEvent.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      fireEvent.click(screen.getByLabelText('Advanced controls'))
      
      // Check progress bar
      const progressFill = document.querySelector('.progress-fill')
      expect(progressFill).toHaveStyle({ width: '20%' }) // 1/5
      
      // Update to last section
      mockStoryScrollerAPI.getState.mockReturnValue({
        currentSection: 4,
        isAnimating: false,
      })
      
      // Wait for update
      await waitFor(() => {
        expect(progressFill).toHaveStyle({ width: '100%' }) // 5/5
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing StoryScroller API gracefully', () => {
      // Remove API
      delete (window as any).storyScrollerAPI
      
      // Should render without crashing
      render(<ControlHub sectionsCount={5} />)
      expect(screen.getByText('1')).toBeInTheDocument()
      
      // Clicking buttons should not throw errors
      fireEvent.click(screen.getByLabelText('Expand controls'))
      
      waitFor(() => {
        const nextButton = screen.getByLabelText('Next section')
        fireEvent.click(nextButton)
        // No error should be thrown
      })
    })

    it('should handle configuration update failures', async () => {
      // Make updateConfig return undefined
      mockStoryScrollerAPI.updateConfig = undefined
      
      const user = userEvent.setup()
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to configuration
      await user.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByText('Configuration'))
      
      // Change value and apply
      const durationSlider = screen.getByLabelText('Animation duration')
      fireEvent.change(durationSlider, { target: { value: '1.5' } })
      
      await user.click(screen.getByRole('button', { name: 'Apply Changes' }))
      
      // Should not crash, but also no toast should appear
      expect(document.querySelector('.control-hub-toast')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle single section gracefully', () => {
      render(<ControlHub sectionsCount={1} />)
      
      // Should show 1/1
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('/1')).toBeInTheDocument()
      
      // Go to standard mode
      fireEvent.click(screen.getByLabelText('Expand controls'))
      
      waitFor(() => {
        // Both navigation buttons should be disabled
        expect(screen.getByLabelText('Previous section')).toBeDisabled()
        expect(screen.getByLabelText('Next section')).toBeDisabled()
        
        // Should have only one dot
        const dots = screen.getAllByRole('button', { name: /Go to section/ })
        expect(dots).toHaveLength(1)
      })
    })

    it('should handle rapid mode transitions', async () => {
      render(<ControlHub sectionsCount={5} />)
      
      // Rapidly click between modes
      const expandButton = screen.getByLabelText('Expand controls')
      
      fireEvent.click(expandButton)
      fireEvent.click(expandButton)
      fireEvent.click(expandButton)
      
      // Should handle gracefully without errors
      await waitFor(() => {
        // Should eventually settle in a stable state
        expect(document.querySelector('.control-hub')).toBeInTheDocument()
      })
    })

    it('should handle maximum configuration values', async () => {
      const user = userEvent.setup()
      render(<ControlHub sectionsCount={5} />)
      
      // Navigate to configuration
      await user.click(screen.getByLabelText('Expand controls'))
      await waitFor(() => screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByLabelText('Advanced controls'))
      await user.click(screen.getByText('Configuration'))
      
      // Set maximum values
      const durationSlider = screen.getByLabelText('Animation duration')
      const toleranceSlider = screen.getByLabelText('Scroll sensitivity')
      
      fireEvent.change(durationSlider, { target: { value: '2' } })
      fireEvent.change(toleranceSlider, { target: { value: '100' } })
      
      expect(screen.getByText('Duration: 2s')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      
      // Apply should work
      await user.click(screen.getByRole('button', { name: 'Apply Changes' }))
      
      expect(mockStoryScrollerAPI.updateConfig).toHaveBeenCalledWith({
        duration: 2,
        tolerance: 100,
        enableMagneticSnap: true,
        magneticThreshold: 0.15,
      })
    })
  })
})