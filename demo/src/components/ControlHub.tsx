import React, { useState, useEffect } from 'react';

interface ControlHubProps {
  sectionsCount: number;
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
  
  // Performance monitoring state
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.67);
  
  // Configuration state
  const [config, setConfig] = useState({
    duration: 1.2,
    tolerance: 50,
    magneticSnap: true,
    magneticThreshold: 0.15,
  });

  // Poll StoryScroller state
  useEffect(() => {
    const interval = setInterval(() => {
      if ((window as any).storyScrollerAPI?.getState) {
        const state = (window as any).storyScrollerAPI.getState();
        setCurrentIndex(state.currentSection);
        setIsAnimating(state.isAnimating);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

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
      (window as any).storyScrollerAPI.updateConfig(config);
    }
  };

  return (
    <div className={`control-hub control-hub--${mode}`}>
      {/* Minimal Mode: Just progress indicator */}
      {mode === 'minimal' && (
        <div className="hub-minimal">
          <div className="progress-ring">
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
              <span className="section-number">{currentIndex + 1}</span>
              <span className="section-total">/{sectionsCount}</span>
            </div>
          </div>
          <button 
            className="hub-expand"
            onClick={() => setMode('standard')}
            aria-label="Expand controls"
          >
            ⚙️
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
                onClick={() => setMode('advanced')}
                className="hub-action"
                aria-label="Advanced controls"
              >
                ⚙️
              </button>
              <button 
                onClick={() => setMode('minimal')}
                className="hub-action"
                aria-label="Minimize controls"
              >
                ✕
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
              ←
            </button>
            
            <div className="section-dots">
              {Array.from({ length: sectionsCount }, (_, index) => (
                <button
                  key={index}
                  className={`section-dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => handleSectionClick(index)}
                  aria-label={`Go to section ${index + 1}`}
                />
              ))}
            </div>
            
            <button 
              className="nav-btn nav-btn--next"
              onClick={handleNext} 
              disabled={currentIndex === sectionsCount - 1}
              aria-label="Next section"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Advanced Mode: Full configuration */}
      {mode === 'advanced' && (
        <div className="hub-advanced">
          <div className="hub-header">
            <h3 className="hub-title">Demo Controls</h3>
            <button 
              onClick={() => setMode('standard')}
              className="hub-close"
              aria-label="Close advanced controls"
            >
              ✕
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
                      ← Previous
                    </button>
                    <button 
                      className="control-btn"
                      onClick={handleNext}
                      disabled={currentIndex === sectionsCount - 1}
                    >
                      Next →
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
              <div className={`tab-pane ${activeTab === 'configuration' ? 'active' : ''}`}>
                <div className="control-group">
                  <div className="config-controls">
                    <div className="config-item">
                      <label>Duration: {config.duration}s</label>
                      <input
                        type="range"
                        min="0.2"
                        max="2"
                        step="0.1"
                        value={config.duration}
                        onChange={(e) => setConfig(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
                      />
                    </div>
                    
                    <div className="config-item">
                      <label>Sensitivity: {config.tolerance}</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={config.tolerance}
                        onChange={(e) => setConfig(prev => ({ ...prev, tolerance: parseInt(e.target.value) }))}
                      />
                    </div>
                    
                    <div className="config-item config-item--checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={config.magneticSnap}
                          onChange={(e) => setConfig(prev => ({ ...prev, magneticSnap: e.target.checked }))}
                        />
                        Magnetic Snap
                      </label>
                    </div>
                    
                    <button 
                      onClick={applyConfig}
                      className="apply-btn"
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}