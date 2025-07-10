import React, { useState, useCallback, useEffect } from 'react';
import { 
  StoryScrollerWithErrorBoundary, 
  type StoryScrollerConfig 
} from '@primeinc/storyscroller';
import { ControlHub } from './components/ControlHub';

// Accessibility helper for reduced motion detection
const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Rich content sections that showcase the package capabilities
const createSections = () => [
  <section key="hero" className="section-content section-1" aria-labelledby="hero-title" data-section-id="section-1" data-testid="section-0">
    <div className="hero-metrics">
      <div className="metric-card">
        <span className="metric-value">47KB</span>
        <span className="metric-label">Bundle Size</span>
      </div>
      <div className="metric-card">
        <span className="metric-value">60Hz</span>
        <span className="metric-label">Performance</span>
      </div>
      <div className="metric-card">
        <span className="metric-value">WCAG AA</span>
        <span className="metric-label">Accessible</span>
      </div>
      <div className="metric-card">
        <span className="metric-value">React 18+</span>
        <span className="metric-label">Modern</span>
      </div>
    </div>
    
    <h1 id="hero-title" className="section-title">StoryScroller</h1>
    <p className="section-subtitle">Production-ready narrative scrolling for React</p>
    <p className="section-description">
      Seamlessly blend storytelling with smooth scrolling animations. 
      Built with GSAP, Lenis, and React 18 for maximum performance.
    </p>
    
    <div className="hero-interactive">
      <div className="scroll-hint">
        <span>Try scrolling, arrow keys, or the controls →</span>
        <div className="scroll-indicator">↓</div>
      </div>
    </div>
    
    <a href="https://github.com/primeinc/StoryScroller" className="section-cta" aria-describedby="hero-title" target="_blank" rel="noopener noreferrer">
      View on GitHub →
    </a>
  </section>,

  <section key="features" className="section-content section-2" aria-labelledby="features-title" data-section-id="section-2" data-testid="section-1">
    <h1 id="features-title" className="section-title">Features</h1>
    <p className="section-subtitle">Everything you need for narrative motion</p>
    <div className="section-description">
      <ul className="feature-list" role="list" aria-label="StoryScroller features">
        <li role="listitem">🎯 Magnetic snap scrolling with physics-based easing</li>
        <li role="listitem">⚡ Optimized performance with debounced state management</li>
        <li role="listitem">🎛️ Comprehensive configuration options</li>
        <li role="listitem">🛡️ Built-in error boundaries and recovery</li>
        <li role="listitem">📱 Touch and keyboard navigation support</li>
        <li role="listitem">🎨 Completely customizable styling</li>
      </ul>
    </div>
  </section>,

  <section key="motion" className="section-content section-3" aria-labelledby="motion-title" data-section-id="section-3" data-testid="section-2">
    <h1 id="motion-title" className="section-title">Motion</h1>
    <p className="section-subtitle">Designed for complex animations</p>
    <p className="section-description">
      Leverage GSAP's powerful animation engine with Lenis smooth scrolling. 
      Perfect for creating immersive storytelling experiences with precise control 
      over timing, easing, and section transitions.
    </p>
    <div className="motion-demo" aria-label="Animated elements demonstration" role="img">
      <div className="floating-element" aria-hidden="true">✨</div>
      <div className="floating-element" aria-hidden="true">🌟</div>
      <div className="floating-element" aria-hidden="true">💫</div>
    </div>
  </section>,

  <section key="integration" className="section-content section-4" aria-labelledby="integration-title" data-section-id="section-4" data-testid="section-3">
    <h1 id="integration-title" className="section-title">Integration</h1>
    <p className="section-subtitle">GSAP + Lenis + React 18</p>
    <p className="section-description">
      Simple integration with existing React applications. 
      Comes with TypeScript support, comprehensive error handling, 
      and optimized performance patterns out of the box.
    </p>
    <div className="code-preview" role="region" aria-label="Code example">
      <code role="code" aria-label="StoryScroller React component example">
        {`<StoryScrollerWithErrorBoundary
  sections={sections}
  duration={1.2}
  enableMagneticSnap={true}
  onSectionChange={(index) => {
    console.log('Section:', index)
  }}
/>`}
      </code>
    </div>
  </section>,

  <section key="demo" className="section-content section-5" aria-labelledby="ready-title" data-section-id="section-5" data-testid="section-4">
    <h1 id="ready-title" className="section-title">Ready</h1>
    <p className="section-subtitle">Start building narrative experiences</p>
    <p className="section-description">
      This demo showcases the full capabilities of StoryScroller. 
      Try the navigation controls, keyboard shortcuts (↑↓), 
      or simply scroll to experience the smooth section snapping.
    </p>
    <a 
      href="https://github.com/primeinc/StoryScroller" 
      className="section-cta"
      aria-describedby="ready-title"
      target="_blank"
      rel="noopener noreferrer"
    >
      Get Started →
    </a>
  </section>,
];

// Enhanced error fallback component
const ErrorFallback = ({ error, resetError }: { error?: Error, resetError?: () => void }) => (
  <div className="error-container">
    <h1 className="error-title">⚠️ Oops!</h1>
    <p className="error-message">Something went wrong with the StoryScroller.</p>
    {error && (
      <details className="error-details">
        <summary>Error Details</summary>
        <pre>{error.message}</pre>
      </details>
    )}
    {resetError && (
      <button onClick={resetError} className="error-reset-btn">
        Try Again
      </button>
    )}
  </div>
);



// Main app component
function App() {
  const sections = createSections();
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion());

  // Listen for reduced motion preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReducedMotion(mediaQuery.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Advanced configuration with accessibility considerations
  const storyScrollerConfig: StoryScrollerConfig = {
    duration: reducedMotion ? 0.1 : 1.2, // Respect reduced motion
    easing: reducedMotion 
      ? (t: number) => t // Linear for reduced motion
      : (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing
    tolerance: 50,
    enableMagneticSnap: !reducedMotion, // Disable magnetic snap for reduced motion
    magneticThreshold: 0.15,
    magneticVelocityThreshold: 5,
    keyboardNavigation: true,
    onSectionChange: (index: number) => {
      console.log(`📍 Section changed to: ${index + 1}`);
      
      // Announce section changes to screen readers
      const announcement = `Section ${index + 1} of ${sections.length}`;
      const ariaLive = document.getElementById('aria-live-region');
      if (ariaLive) {
        ariaLive.textContent = announcement;
      }
    },
    containerClassName: 'story-scroller-container',
    sectionClassName: 'story-scroller-section',
    ariaLabel: 'StoryScroller demo sections',
    sectionLabels: [
      'Introduction and overview',
      'Features and capabilities', 
      'Motion and animation',
      'Integration and setup',
      'Getting started'
    ],
  };

  return (
    <>
      {/* Skip navigation for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* ARIA live region for screen reader announcements */}
      <div 
        id="aria-live-region" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Reduced motion indicator */}
      {reducedMotion && (
        <div className="reduced-motion-notice" role="status" aria-live="polite">
          Reduced motion mode active
        </div>
      )}
      
      <main id="main-content" role="main">
        <StoryScrollerWithErrorBoundary
          sections={sections}
          errorFallback={<ErrorFallback />}
          {...storyScrollerConfig}
        />
      </main>
      
      <ControlHub sectionsCount={sections.length} />
    </>
  );
}

export default App;