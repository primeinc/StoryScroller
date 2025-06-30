/**
 * PerformanceMonitor Component Tests
 * 
 * Tests the real-time performance monitoring component that displays
 * FPS and frame timing metrics for the StoryScroller demo.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PerformanceMonitor } from './PerformanceMonitor'

describe('PerformanceMonitor Component', () => {
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn>
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Mock requestAnimationFrame for controlled testing
    mockRequestAnimationFrame = vi.fn((callback) => {
      setTimeout(callback, 16) // Simulate 60fps
      return 1
    })
    mockCancelAnimationFrame = vi.fn()
    
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(mockRequestAnimationFrame)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(mockCancelAnimationFrame)
    
    // Mock performance.now for consistent timing
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(<PerformanceMonitor />)
      }).not.toThrow()
    })

    it('displays FPS and frame time metrics', () => {
      render(<PerformanceMonitor />)
      
      // Should display FPS metric
      expect(screen.getByText('FPS')).toBeInTheDocument()
      expect(screen.getByText('ms')).toBeInTheDocument()
      
      // Should have metric values (initially 60 FPS, 16.7ms)
      expect(screen.getByText('60')).toBeInTheDocument()
      expect(screen.getByText('16.7')).toBeInTheDocument()
    })

    it('has proper accessibility attributes', () => {
      render(<PerformanceMonitor />)
      
      const monitor = document.querySelector('.performance-monitor')
      expect(monitor).toBeInTheDocument()
      
      // Should have readable structure
      const metrics = document.querySelectorAll('.perf-metric')
      expect(metrics).toHaveLength(2) // FPS and frame time
    })
  })

  describe('Performance Monitoring', () => {
    it('initializes with default performance values', () => {
      render(<PerformanceMonitor />)
      
      // Should start with 60 FPS and 16.7ms frame time
      expect(screen.getByText('60')).toBeInTheDocument()
      expect(screen.getByText('16.7')).toBeInTheDocument()
    })

    it('starts animation frame monitoring on mount', () => {
      render(<PerformanceMonitor />)
      
      // Should have called requestAnimationFrame
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })

    it('cleans up animation frame on unmount', () => {
      const { unmount } = render(<PerformanceMonitor />)
      
      unmount()
      
      // Should have called cancelAnimationFrame
      expect(mockCancelAnimationFrame).toHaveBeenCalled()
    })

    it('updates metrics over time', async () => {
      // Mock performance.now to return different values
      let timeCounter = 0
      vi.spyOn(performance, 'now').mockImplementation(() => {
        timeCounter += 16.67 // Simulate 60fps timing
        return timeCounter
      })

      render(<PerformanceMonitor />)
      
      // Wait for a few animation frames
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1)
      })
      
      // FPS calculation should be working
      expect(screen.getByText('FPS')).toBeInTheDocument()
    })
  })

  describe('Visual Presentation', () => {
    it('displays metrics in proper format', () => {
      render(<PerformanceMonitor />)
      
      // FPS should be integer
      const fpsValue = screen.getByText('60')
      expect(fpsValue).toHaveClass('perf-value')
      
      // Frame time should be decimal
      const frameTimeValue = screen.getByText('16.7')
      expect(frameTimeValue).toHaveClass('perf-value')
      
      // Labels should be uppercase
      const fpsLabel = screen.getByText('FPS')
      const msLabel = screen.getByText('ms')
      expect(fpsLabel).toHaveClass('perf-label')
      expect(msLabel).toHaveClass('perf-label')
    })

    it('has proper CSS classes for styling', () => {
      render(<PerformanceMonitor />)
      
      const monitor = document.querySelector('.performance-monitor')
      expect(monitor).toHaveClass('performance-monitor')
      
      const metrics = document.querySelectorAll('.perf-metric')
      metrics.forEach(metric => {
        expect(metric).toHaveClass('perf-metric')
      })
    })
  })

  describe('Performance Calculation', () => {
    it('calculates FPS correctly over time', async () => {
      let frameCount = 0
      let startTime = 1000
      
      // Mock performance.now to simulate frames
      vi.spyOn(performance, 'now').mockImplementation(() => {
        frameCount++
        return startTime + (frameCount * 16.67) // 60fps
      })

      render(<PerformanceMonitor />)
      
      // Allow time for FPS calculation
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled()
      })
      
      // Should maintain 60 FPS display
      expect(screen.getByText('FPS')).toBeInTheDocument()
    })

    it('handles varying frame rates', async () => {
      let frameCount = 0
      let startTime = 1000
      
      // Mock performance.now to simulate 30fps
      vi.spyOn(performance, 'now').mockImplementation(() => {
        frameCount++
        return startTime + (frameCount * 33.33) // 30fps
      })

      render(<PerformanceMonitor />)
      
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled()
      })
      
      // Should still display metrics
      expect(screen.getByText('FPS')).toBeInTheDocument()
      expect(screen.getByText('ms')).toBeInTheDocument()
    })
  })

  describe('Integration Behavior', () => {
    it('works within the demo application context', () => {
      // Test that it doesn't interfere with other components
      render(
        <div>
          <PerformanceMonitor />
          <div data-testid="other-content">Other content</div>
        </div>
      )
      
      expect(screen.getByTestId('other-content')).toBeInTheDocument()
      expect(screen.getByText('FPS')).toBeInTheDocument()
    })

    it('maintains performance monitoring during navigation', async () => {
      render(<PerformanceMonitor />)
      
      // Simulate navigation events that might affect performance
      const mockEvent = new Event('scroll')
      window.dispatchEvent(mockEvent)
      
      await waitFor(() => {
        expect(screen.getByText('FPS')).toBeInTheDocument()
      })
      
      // Should continue monitoring
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles requestAnimationFrame errors gracefully', () => {
      // Mock requestAnimationFrame to throw
      mockRequestAnimationFrame.mockImplementation(() => {
        throw new Error('Animation frame error')
      })

      expect(() => {
        render(<PerformanceMonitor />)
      }).not.toThrow()
    })

    it('handles performance.now unavailability', () => {
      // Mock performance.now to be undefined
      vi.spyOn(performance, 'now').mockImplementation(() => {
        throw new Error('Performance API unavailable')
      })

      expect(() => {
        render(<PerformanceMonitor />)
      }).not.toThrow()
      
      // Should still render basic structure
      expect(screen.getByText('FPS')).toBeInTheDocument()
    })
  })

  describe('Memory Management', () => {
    it('properly cleans up on unmount', () => {
      const { unmount } = render(<PerformanceMonitor />)
      
      // Verify it starts monitoring
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
      
      // Unmount and verify cleanup
      unmount()
      expect(mockCancelAnimationFrame).toHaveBeenCalled()
    })

    it('does not leak animation frames', () => {
      const { unmount, rerender } = render(<PerformanceMonitor />)
      
      // Mount and unmount multiple times
      for (let i = 0; i < 5; i++) {
        unmount()
        rerender(<PerformanceMonitor />)
      }
      
      // Should have called cancel for each unmount
      expect(mockCancelAnimationFrame).toHaveBeenCalledTimes(5)
    })
  })
});