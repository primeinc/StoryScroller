import React, { useState, useCallback, useEffect } from 'react';
import { 
  StoryScrollerWithErrorBoundary, 
  type StoryScrollerConfig 
} from '@primeinc/story-scroller';

// Rich content sections that showcase the package capabilities
const createSections = () => [
  <section key="hero" className="section-content section-1">
    <h1 className="section-title">StoryScroller</h1>
    <p className="section-subtitle">Production-ready narrative scrolling for React</p>
    <p className="section-description">
      Seamlessly blend storytelling with smooth scrolling animations. 
      Built with GSAP, Lenis, and React 18 for maximum performance.
    </p>
    <a href="#features" className="section-cta">Explore Features</a>
  </section>,

  <section key="features" className="section-content section-2">
    <h1 className="section-title">Features</h1>
    <p className="section-subtitle">Everything you need for narrative motion</p>
    <div className="section-description">
      <ul className="feature-list">
        <li>🎯 Magnetic snap scrolling with physics-based easing</li>
        <li>⚡ Optimized performance with debounced state management</li>
        <li>🎛️ Comprehensive configuration options</li>
        <li>🛡️ Built-in error boundaries and recovery</li>
        <li>📱 Touch and keyboard navigation support</li>
        <li>🎨 Completely customizable styling</li>
      </ul>
    </div>
  </section>,

  <section key="motion" className="section-content section-3">
    <h1 className="section-title">Motion</h1>
    <p className="section-subtitle">Designed for complex animations</p>
    <p className="section-description">
      Leverage GSAP's powerful animation engine with Lenis smooth scrolling. 
      Perfect for creating immersive storytelling experiences with precise control 
      over timing, easing, and section transitions.
    </p>
    <div className="motion-demo">
      <div className="floating-element">✨</div>
      <div className="floating-element">🌟</div>
      <div className="floating-element">💫</div>
    </div>
  </section>,

  <section key="integration" className="section-content section-4">
    <h1 className="section-title">Integration</h1>
    <p className="section-subtitle">GSAP + Lenis + React 18</p>
    <p className="section-description">
      Simple integration with existing React applications. 
      Comes with TypeScript support, comprehensive error handling, 
      and optimized performance patterns out of the box.
    </p>
    <div className="code-preview">
      <code>
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

  <section key="demo" className="section-content section-5">
    <h1 className="section-title">Ready</h1>
    <p className="section-subtitle">Start building narrative experiences</p>
    <p className="section-description">
      This demo showcases the full capabilities of StoryScroller. 
      Try the navigation controls, keyboard shortcuts (↑↓), 
      or simply scroll to experience the smooth section snapping.
    </p>
    <a href="https://github.com/primeinc/story-scroller" className="section-cta">
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

// Enhanced navigation UI using the global API
function NavigationUI() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const sectionsCount = createSections().length;

  useEffect(() => {
    // Poll the state from the global API
    const interval = setInterval(() => {
      if ((window as any).storyScrollerAPI?.getState) {
        const state = (window as any).storyScrollerAPI.getState();
        setCurrentIndex(state.currentSection);
        setIsAnimating(state.isAnimating);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    if ((window as any).storyScrollerAPI) {
      (window as any).storyScrollerAPI.nextSection();
    }
  };

  const handlePrev = () => {
    if ((window as any).storyScrollerAPI) {
      (window as any).storyScrollerAPI.prevSection();
    }
  };

  return (
    <nav className="nav-ui">
      <div className="nav-controls">
        <button 
          className="nav-button"
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          aria-label="Previous section"
        >
          ← Prev
        </button>
        
        <div className="nav-info">
          <span className="current-section">
            {currentIndex + 1} / {sectionsCount}
          </span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentIndex + 1) / sectionsCount) * 100}%` }}
            />
          </div>
        </div>
        
        <button 
          className="nav-button"
          onClick={handleNext} 
          disabled={currentIndex === sectionsCount - 1}
          aria-label="Next section"
        >
          Next →
        </button>
      </div>
      
      <div className="nav-status">
        {isAnimating && <span className="status-indicator animating">Animating</span>}
      </div>
    </nav>
  );
}

// Section indicators component
function SectionIndicators() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sections = createSections();

  useEffect(() => {
    const interval = setInterval(() => {
      if ((window as any).storyScrollerAPI?.getState) {
        const state = (window as any).storyScrollerAPI.getState();
        setCurrentIndex(state.currentSection);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleSectionClick = (index: number) => {
    if ((window as any).storyScrollerAPI) {
      (window as any).storyScrollerAPI.gotoSection(index);
    }
  };

  return (
    <div className="section-indicators">
      {sections.map((_, index) => (
        <button
          key={index}
          className={`indicator ${index === currentIndex ? 'active' : ''}`}
          onClick={() => handleSectionClick(index)}
          aria-label={`Go to section ${index + 1}`}
        />
      ))}
    </div>
  );
}

// Debug info panel
function DebugPanel() {
  const [state, setState] = useState({
    currentSection: 0,
    isAnimating: false,
    lastNavigationTime: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if ((window as any).storyScrollerAPI?.getState) {
        const apiState = (window as any).storyScrollerAPI.getState();
        setState({
          currentSection: apiState.currentSection,
          isAnimating: apiState.isAnimating,
          lastNavigationTime: apiState.lastNavigationTime
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="debug-panel">
      <h4>Debug Info</h4>
      <div className="debug-info">
        <div>Current: {state.currentSection + 1}</div>
        <div>Animating: {state.isAnimating ? 'Yes' : 'No'}</div>
        <div>Last Navigation: {state.lastNavigationTime ? new Date(state.lastNavigationTime).toLocaleTimeString() : 'N/A'}</div>
      </div>
    </div>
  );
}

// Main app component
function App() {
  const sections = createSections();
  
  // Advanced configuration with all the new features
  const storyScrollerConfig: StoryScrollerConfig = {
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing
    tolerance: 50,
    enableMagneticSnap: true,
    magneticThreshold: 0.15,
    magneticVelocityThreshold: 5,
    keyboardNavigation: true,
    onSectionChange: (index: number) => {
      console.log(`📍 Section changed to: ${index + 1}`);
    },
    containerClassName: 'story-scroller-container',
    sectionClassName: 'story-scroller-section',
  };

  return (
    <>
      <StoryScrollerWithErrorBoundary
        sections={sections}
        errorFallback={<ErrorFallback />}
        {...storyScrollerConfig}
      />
      
      <NavigationUI />
      <SectionIndicators />
      <DebugPanel />
    </>
  );
}

export default App;