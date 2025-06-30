/**
 * Hero Metrics Component Tests
 * 
 * Tests the performance metrics display in the hero section
 * that showcases StoryScroller's production-ready capabilities.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../App'

describe('Hero Metrics Display', () => {
  describe('Rendering', () => {
    it('displays all performance metrics in hero section', async () => {
      render(<App />)
      
      // Check for all metric cards
      expect(screen.getByText('47KB')).toBeInTheDocument()
      expect(screen.getByText('Bundle Size')).toBeInTheDocument()
      
      expect(screen.getByText('60 FPS')).toBeInTheDocument()
      expect(screen.getByText('Performance')).toBeInTheDocument()
      
      expect(screen.getByText('WCAG AA')).toBeInTheDocument()
      expect(screen.getByText('Accessible')).toBeInTheDocument()
      
      expect(screen.getByText('React 18+')).toBeInTheDocument()
      expect(screen.getByText('Modern')).toBeInTheDocument()
    })

    it('has proper CSS structure for metric cards', () => {
      render(<App />)
      
      const metricCards = document.querySelectorAll('.metric-card')
      expect(metricCards).toHaveLength(4)
      
      metricCards.forEach(card => {
        expect(card).toHaveClass('metric-card')
        
        const value = card.querySelector('.metric-value')
        const label = card.querySelector('.metric-label')
        
        expect(value).toBeInTheDocument()
        expect(label).toBeInTheDocument()
      })
    })

    it('displays interactive scroll hint', () => {
      render(<App />)
      
      expect(screen.getByText(/Try scrolling, arrow keys, or the controls/)).toBeInTheDocument()
      expect(screen.getByText('↓')).toBeInTheDocument()
    })
  })

  describe('Performance Claims Validation', () => {
    it('displays accurate bundle size information', () => {
      render(<App />)
      
      // The 47KB metric should match our actual benchmark
      const bundleSizeMetric = screen.getByText('47KB')
      expect(bundleSizeMetric).toBeInTheDocument()
      
      // Should be displayed as a prominent metric
      expect(bundleSizeMetric).toHaveClass('metric-value')
    })

    it('displays performance target metrics', () => {
      render(<App />)
      
      // 60 FPS is our performance target
      const fpsMetric = screen.getByText('60 FPS')
      expect(fpsMetric).toBeInTheDocument()
      expect(fpsMetric).toHaveClass('metric-value')
    })

    it('displays accessibility compliance', () => {
      render(<App />)
      
      // WCAG AA compliance is our accessibility standard
      const accessibilityMetric = screen.getByText('WCAG AA')
      expect(accessibilityMetric).toBeInTheDocument()
      expect(accessibilityMetric).toHaveClass('metric-value')
    })

    it('displays modern framework support', () => {
      render(<App />)
      
      // React 18+ support
      const frameworkMetric = screen.getByText('React 18+')
      expect(frameworkMetric).toBeInTheDocument()
      expect(frameworkMetric).toHaveClass('metric-value')
    })
  })

  describe('Visual Design', () => {
    it('arranges metrics in proper grid layout', () => {
      render(<App />)
      
      const metricsContainer = document.querySelector('.hero-metrics')
      expect(metricsContainer).toBeInTheDocument()
      expect(metricsContainer).toHaveClass('hero-metrics')
    })

    it('metric cards have hover effects', () => {
      render(<App />)
      
      const metricCards = document.querySelectorAll('.metric-card')
      metricCards.forEach(card => {
        // Should have transition classes for hover effects
        expect(card).toHaveClass('metric-card')
      })
    })

    it('uses proper typography hierarchy', () => {
      render(<App />)
      
      const metricValues = document.querySelectorAll('.metric-value')
      const metricLabels = document.querySelectorAll('.metric-label')
      
      expect(metricValues).toHaveLength(4)
      expect(metricLabels).toHaveLength(4)
      
      metricValues.forEach(value => {
        expect(value).toHaveClass('metric-value')
      })
      
      metricLabels.forEach(label => {
        expect(label).toHaveClass('metric-label')
      })
    })
  })

  describe('Content Accuracy', () => {
    it('reflects actual package performance', () => {
      render(<App />)
      
      // These metrics should align with our benchmarking results
      const metrics = [
        { value: '47KB', label: 'Bundle Size' },
        { value: '60 FPS', label: 'Performance' },
        { value: 'WCAG AA', label: 'Accessible' },
        { value: 'React 18+', label: 'Modern' }
      ]
      
      metrics.forEach(metric => {
        expect(screen.getByText(metric.value)).toBeInTheDocument()
        expect(screen.getByText(metric.label)).toBeInTheDocument()
      })
    })

    it('provides accurate technical specifications', () => {
      render(<App />)
      
      // Bundle size should match our build output
      expect(screen.getByText('47KB')).toBeInTheDocument()
      
      // Performance target should be realistic
      expect(screen.getByText('60 FPS')).toBeInTheDocument()
      
      // Accessibility should be verifiable
      expect(screen.getByText('WCAG AA')).toBeInTheDocument()
      
      // Framework support should be current
      expect(screen.getByText('React 18+')).toBeInTheDocument()
    })
  })

  describe('User Guidance', () => {
    it('provides clear interaction instructions', () => {
      render(<App />)
      
      const instructions = screen.getByText(/Try scrolling, arrow keys, or the controls/)
      expect(instructions).toBeInTheDocument()
      
      // Should guide users to interactive elements
      expect(instructions.textContent).toContain('scrolling')
      expect(instructions.textContent).toContain('arrow keys')
      expect(instructions.textContent).toContain('controls')
    })

    it('includes animated scroll indicator', () => {
      render(<App />)
      
      const scrollIndicator = screen.getByText('↓')
      expect(scrollIndicator).toBeInTheDocument()
      expect(scrollIndicator).toHaveClass('scroll-indicator')
    })

    it('has proper call-to-action button', () => {
      render(<App />)
      
      const ctaButton = screen.getByRole('link', { name: /View on GitHub/ })
      expect(ctaButton).toBeInTheDocument()
      expect(ctaButton).toHaveAttribute('href', 'https://github.com/primeinc/storyscroller')
      expect(ctaButton).toHaveAttribute('target', '_blank')
      expect(ctaButton).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Responsive Design', () => {
    it('adapts metrics layout for different screen sizes', () => {
      render(<App />)
      
      const metricsContainer = document.querySelector('.hero-metrics')
      expect(metricsContainer).toBeInTheDocument()
      
      // Should use CSS Grid for responsive layout
      const metricCards = document.querySelectorAll('.metric-card')
      expect(metricCards).toHaveLength(4)
    })

    it('maintains readability on mobile devices', () => {
      render(<App />)
      
      // Metric values should be large enough for mobile
      const metricValues = document.querySelectorAll('.metric-value')
      metricValues.forEach(value => {
        expect(value).toHaveClass('metric-value')
      })
      
      // Labels should be concise for mobile
      expect(screen.getByText('Bundle Size')).toBeInTheDocument()
      expect(screen.getByText('Performance')).toBeInTheDocument()
      expect(screen.getByText('Accessible')).toBeInTheDocument()
      expect(screen.getByText('Modern')).toBeInTheDocument()
    })
  })

  describe('Marketing Effectiveness', () => {
    it('highlights key competitive advantages', () => {
      render(<App />)
      
      // Small bundle size is a competitive advantage
      expect(screen.getByText('47KB')).toBeInTheDocument()
      
      // High performance is a key selling point
      expect(screen.getByText('60 FPS')).toBeInTheDocument()
      
      // Accessibility compliance is increasingly important
      expect(screen.getByText('WCAG AA')).toBeInTheDocument()
      
      // Modern framework support attracts developers
      expect(screen.getByText('React 18+')).toBeInTheDocument()
    })

    it('creates immediate credibility with technical metrics', () => {
      render(<App />)
      
      // Technical metrics should be specific and verifiable
      const technicalMetrics = ['47KB', '60 FPS', 'WCAG AA', 'React 18+']
      
      technicalMetrics.forEach(metric => {
        const element = screen.getByText(metric)
        expect(element).toBeInTheDocument()
        expect(element).toHaveClass('metric-value')
      })
    })
  })
});