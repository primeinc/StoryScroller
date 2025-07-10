import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ControlHubProps {
  sectionsCount: number;
}

interface DemoConfig {
  duration: number; // in milliseconds for UI
  tolerance: number;
  enableMagneticSnap: boolean;
  magneticThreshold: number;
}

type ControlMode = 'minimal' | 'standard' | 'advanced';
type TabType = 'navigation' | 'performance' | 'configuration';

/**
 * Unified Control Hub
 * 
 * Consolidates all demo controls into a single, elegant interface
 * with progressive disclosure to keep the storytelling experience clean.
 */
export function ControlHub({ sectionsCount }: ControlHubProps) {
  const [mode, setMode] = useState<ControlMode>('minimal');
  const [activeTab, setActiveTab] = useState<TabType>('navigation');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  
  // Refs for focus management
  const advancedModeRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  
  // Performance monitoring state
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.67);
  
  // Configuration state
  const [config, setConfig] = useState<DemoConfig>({
    duration: 1200,
    tolerance: 50,
    enableMagneticSnap: true,
    magneticThreshold: 0.15,
  });
  const [previousConfig, setPreviousConfig] = useState<DemoConfig>(config);

  // Listen for immediate state changes from StoryScroller API
  useEffect(() => {
    // Force initial state sync with a slight delay to ensure API is ready
    const initialSync = () => {
      if ((window as any).storyScrollerAPI?.getState) {
        const state = (window as any).storyScrollerAPI.getState();
        console.log('🎯 [ControlHub] Initial state sync:', state);
        setCurrentIndex(state.currentSection);
        setIsAnimating(state.isAnimating);
      } else {
        // Retry if API not ready yet
        setTimeout(initialSync, 50);
      }
    };
    
    initialSync();

    // Listen for immediate state change events
    const handleStateChange = (event: CustomEvent) => {
      const { currentSection, isAnimating } = event.detail;
      console.log('🎯 [ControlHub] Received immediate state change:', event.detail);
      setCurrentIndex(currentSection);
      setIsAnimating(isAnimating);
    };

    window.addEventListener('storyScrollerStateChange', handleStateChange as EventListener);

    // High-frequency polling for reliable test synchronization (16ms = 60fps)
    const interval = setInterval(() => {
      if ((window as any).storyScrollerAPI?.getState) {
        const state = (window as any).storyScrollerAPI.getState();
        // Force update state - use callback form to ensure we're getting latest state
        setCurrentIndex(prevIndex => {
          if (prevIndex !== state.currentSection) {
            console.log('🎯 [ControlHub] Polling update:', { from: prevIndex, to: state.currentSection });
            // Force a re-render to ensure UI updates
            setForceUpdateCounter(prev => prev + 1);
          }
          return state.currentSection;
        });
        setIsAnimating(prevAnimating => {
          if (prevAnimating !== state.isAnimating) {
            console.log('🎯 [ControlHub] Animation state update:', { from: prevAnimating, to: state.isAnimating });
          }
          return state.isAnimating;
        });
      }
    }, 16); // 60fps for smooth updates and reliable test sync

    return () => {
      window.removeEventListener('storyScrollerStateChange', handleStateChange as EventListener);
      clearInterval(interval);
    };
  }, []); // Remove deps to avoid recreating interval unnecessarily

  // Performance monitoring
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        setFrameTime((currentTime - lastTime) / frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      animationId = requestAnimationFrame(measureFPS);
    };

    measureFPS();
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Navigation handlers
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

  const handleSectionClick = (index: number) => {
    if ((window as any).storyScrollerAPI) {
      (window as any).storyScrollerAPI.gotoSection(index);
    }
  };

  const applyConfig = () => {
    if ((window as any).storyScrollerAPI?.updateConfig) {
      // Convert duration from milliseconds to seconds for the API
      const apiConfig = {
        ...config,
        duration: config.duration / 1000
      };
      (window as any).storyScrollerAPI.updateConfig(apiConfig);
      setPreviousConfig(config);
      showSuccessToast('Configuration applied successfully!');
    }
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Focus trap implementation
  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (mode !== 'advanced' || !advancedModeRef.current) return;

    const focusableElements = advancedModeRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const focusableArray = Array.from(focusableElements) as HTMLElement[];
    
    if (focusableArray.length === 0) return;
    
    const firstElement = focusableArray[0];
    const lastElement = focusableArray[focusableArray.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      handleCloseAdvanced();
    }
  }, [mode]);

  // Handle mode transitions with loading state
  const handleModeChange = useCallback((newMode: ControlMode) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setMode(newMode);
      setIsTransitioning(false);
    }, 150);
  }, []);

  const handleOpenAdvanced = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    handleModeChange('advanced');
  };

  const handleCloseAdvanced = () => {
    handleModeChange('standard');
    // Return focus to previous element
    setTimeout(() => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }, 200);
  };

  // Set up focus trap listeners
  useEffect(() => {
    if (mode === 'advanced') {
      document.addEventListener('keydown', trapFocus);
      // Focus first element when modal opens
      setTimeout(() => {
        if (firstFocusableRef.current) {
          firstFocusableRef.current.focus();
        }
      }, 200);
    }

    return () => {
      document.removeEventListener('keydown', trapFocus);
    };
  }, [mode, trapFocus]);

  // Check if config has changed
  const hasConfigChanged = useCallback(() => {
    return JSON.stringify(config) !== JSON.stringify(previousConfig);
  }, [config, previousConfig]);

  // SVG Icons
  const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M10 1.667c.46 0 .833.373.833.833v1.575a5.833 5.833 0 012.3.95l1.117-1.117a.833.833 0 011.179 1.179l-1.117 1.116a5.833 5.833 0 01.95 2.3H16.667a.833.833 0 010 1.667h-1.405a5.833 5.833 0 01-.95 2.3l1.117 1.117a.833.833 0 01-1.179 1.179l-1.116-1.117a5.833 5.833 0 01-2.3.95v1.404a.833.833 0 01-1.667 0v-1.405a5.833 5.833 0 01-2.3-.95l-1.117 1.117a.833.833 0 01-1.179-1.179l1.117-1.116a5.833 5.833 0 01-.95-2.3H3.333a.833.833 0 010-1.667h1.405a5.833 5.833 0 01.95-2.3L4.57 4.571a.833.833 0 011.179-1.179l1.116 1.117a5.833 5.833 0 012.3-.95V2.5c0-.46.374-.833.834-.833zm0 5a3.333 3.333 0 100 6.667 3.333 3.333 0 000-6.667z" fill="currentColor"/>
    </svg>
  );

  const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const ChevronLeftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 15L7.5 10l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const ChevronRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 15l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 4.5L6 12 2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <>
      {/* Loading overlay */}
      {isTransitioning && (
        <div className="control-hub-overlay" aria-hidden="true">
          <div className="control-hub-spinner" />
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <div className="control-hub-toast" role="status" aria-live="polite">
          <CheckIcon />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className={`control-hub control-hub--${mode} ${isTransitioning ? 'transitioning' : ''}`} data-testid="control-hub">
      {/* Minimal Mode: Just progress indicator */}
      {mode === 'minimal' && (
        <div className="hub-minimal">
          <div className="progress-ring" aria-label={`Story progress: section ${currentIndex + 1} of ${sectionsCount}`}>
            <svg className="progress-circle" viewBox="0 0 36 36">
              <defs>
                <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
              <path
                className="progress-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="progress-bar"
                strokeDasharray={`${((currentIndex + 1) / sectionsCount) * 100}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="progress-content">
              <span className="section-number" aria-hidden="true">{currentIndex + 1}</span>
              <span className="section-total" aria-hidden="true">/{sectionsCount}</span>
            </div>
          </div>
          <button 
            className="hub-expand"
            onClick={() => handleModeChange('standard')}
            aria-label="Expand controls"
            tabIndex={0}
          >
            <SettingsIcon />
          </button>
        </div>
      )}

      {/* Standard Mode: Navigation + basic info */}
      {mode === 'standard' && (
        <div className="hub-standard">
          <div className="hub-header">
            <div className="section-info">
              <span className="current-section">Section {currentIndex + 1} of {sectionsCount}</span>
              <div className="status-badges">
                {isAnimating && <span className="badge badge--animating">Animating</span>}
                <span className="badge badge--fps">{fps} FPS</span>
              </div>
            </div>
            <div className="hub-actions">
              <button 
                onClick={() => {
                  if (mode === 'standard') {
                    handleModeChange('minimal');
                  } else if (mode === 'minimal') {
                    handleOpenAdvanced();
                  }
                }}
                className="hub-action"
              >
                Mode: {mode}
              </button>
              <button 
                onClick={handleOpenAdvanced}
                className="hub-action"
                aria-label="Advanced controls"
              >
                <SettingsIcon />
              </button>
              <button 
                onClick={() => handleModeChange('minimal')}
                className="hub-action"
                aria-label="Minimize controls"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="hub-navigation">
            <button 
              className="nav-btn nav-btn--prev"
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              aria-label="Previous section"
            >
              <ChevronLeftIcon />
            </button>
            
            <div className="section-dots">
              {Array.from({ length: sectionsCount }, (_, index) => (
                <button
                  key={index}
                  className={`section-dot demo-nav-dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => handleSectionClick(index)}
                  aria-label={`Go to section ${index + 1}`}
                  aria-current={index === currentIndex ? 'true' : 'false'}
                  data-section-idx={index}
                />
              ))}
            </div>
            
            <button 
              className="nav-btn nav-btn--next"
              onClick={handleNext} 
              disabled={currentIndex === sectionsCount - 1}
              aria-label="Next section"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}

      {/* Advanced Mode: Full configuration */}
      {mode === 'advanced' && (
        <div className="hub-advanced" ref={advancedModeRef} role="dialog" aria-modal="true" aria-labelledby="hub-title">
          <div className="hub-header">
            <h3 className="hub-title" id="hub-title">Demo Controls</h3>
            <button 
              ref={firstFocusableRef}
              onClick={handleCloseAdvanced}
              className="hub-close"
              aria-label="Close advanced controls"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="hub-tabs">
            <div className="tab-nav">
              <button 
                className={`tab-btn ${activeTab === 'navigation' ? 'active' : ''}`}
                onClick={() => setActiveTab('navigation')}
              >
                Navigation
              </button>
              <button 
                className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
                onClick={() => setActiveTab('performance')}
              >
                Performance
              </button>
              <button 
                className={`tab-btn ${activeTab === 'configuration' ? 'active' : ''}`}
                onClick={() => setActiveTab('configuration')}
              >
                Configuration
              </button>
            </div>

            <div className="tab-content">
              {/* Navigation Tab */}
              <div className={`tab-pane ${activeTab === 'navigation' ? 'active' : ''}`}>
                <div className="control-group">
                  <div className="progress-detailed">
                    <div className="progress-bar-full">
                      <div 
                        className="progress-fill"
                        style={{ width: `${((currentIndex + 1) / sectionsCount) * 100}%` }}
                      />
                    </div>
                    <span className="progress-text">{currentIndex + 1} / {sectionsCount}</span>
                  </div>
                  
                  <div className="nav-controls">
                    <button 
                      className="control-btn"
                      onClick={handlePrev}
                      disabled={currentIndex === 0}
                    >
                      <ChevronLeftIcon /> Previous
                    </button>
                    <button 
                      className="control-btn"
                      onClick={handleNext}
                      disabled={currentIndex === sectionsCount - 1}
                    >
                      Next <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              </div>

              {/* Performance Tab */}
              <div className={`tab-pane ${activeTab === 'performance' ? 'active' : ''}`}>
                <div className="control-group">
                  <div className="perf-metrics">
                    <div className="metric">
                      <span className="metric-value">{fps}</span>
                      <span className="metric-label">FPS</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{frameTime.toFixed(1)}</span>
                      <span className="metric-label">Frame Time (ms)</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{isAnimating ? 'Yes' : 'No'}</span>
                      <span className="metric-label">Animating</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration Tab */}
              <div className={`tab-pane ${activeTab === 'configuration' ? 'active' : ''}`} data-testid="config-panel">
                <div className="control-group">
                  <div className="config-controls">
                    <div className="config-item">
                      <label>Duration: {config.duration}ms</label>
                      <div className="config-slider-wrapper">
                        <input
                          type="range"
                          min="500"
                          max="3000"
                          step="100"
                          value={config.duration}
                          onChange={(e) => setConfig(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                          aria-label="Animation duration"
                          aria-valuemin={500}
                          aria-valuemax={3000}
                          aria-valuenow={config.duration}
                          data-testid="duration-slider"
                        />
                        <div className="config-slider-value">{config.duration}ms</div>
                      </div>
                    </div>
                    
                    <div className="config-item">
                      <label>Sensitivity: {config.tolerance}</label>
                      <div className="config-slider-wrapper">
                        <input
                          type="range"
                          min="10"
                          max="200"
                          step="5"
                          value={config.tolerance}
                          onChange={(e) => setConfig(prev => ({ ...prev, tolerance: parseInt(e.target.value) }))}
                          aria-label="Scroll sensitivity"
                          aria-valuemin={10}
                          aria-valuemax={200}
                          aria-valuenow={config.tolerance}
                          data-testid="tolerance-slider"
                        />
                        <div className="config-slider-value">{config.tolerance}</div>
                      </div>
                    </div>
                    
                    <div className="config-item config-item--checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={config.enableMagneticSnap}
                          onChange={(e) => setConfig(prev => ({ ...prev, enableMagneticSnap: e.target.checked }))}
                        />
                        Magnetic Snap
                      </label>
                    </div>
                    
                    <button 
                      ref={lastFocusableRef}
                      onClick={applyConfig}
                      className="apply-btn"
                      disabled={!hasConfigChanged()}
                    >
                      {hasConfigChanged() ? 'Apply Changes' : 'No Changes'}
                    </button>
                    {hasConfigChanged() && (
                      <div className="config-change-indicator" role="status" aria-live="polite">
                        <span className="config-change-dot"></span>
                        <span>Changes pending</span>
                        <span className="sr-only">Configuration has been modified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}