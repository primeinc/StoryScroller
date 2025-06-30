import React, { useState } from 'react';

interface DemoConfig {
  duration: number;
  tolerance: number;
  enableMagneticSnap: boolean;
  magneticThreshold: number;
}

/**
 * ConfigurationPanel Component
 * 
 * Provides live configuration controls for the StoryScroller demo,
 * allowing users to experiment with different settings in real-time.
 */
export function ConfigurationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DemoConfig>({
    duration: 1.2,
    tolerance: 50,
    enableMagneticSnap: true,
    magneticThreshold: 0.15,
  });
  
  const applyConfig = () => {
    if ((window as any).storyScrollerAPI?.updateConfig) {
      (window as any).storyScrollerAPI.updateConfig(config);
    }
  };
  
  return (
    <div className={`config-panel ${isOpen ? 'open' : ''}`}>
      <button 
        className="config-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle configuration panel"
        aria-expanded={isOpen}
      >
        ⚙️ Config
      </button>
      
      {isOpen && (
        <div className="config-content">
          <h3>Live Configuration</h3>
          
          <div className="config-group">
            <label htmlFor="duration">Duration: {config.duration}s</label>
            <input
              id="duration"
              type="range"
              min="0.2"
              max="2"
              step="0.1"
              value={config.duration}
              onChange={(e) => setConfig(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
              aria-describedby="duration-help"
            />
            <small id="duration-help" className="config-help">
              Animation duration in seconds
            </small>
          </div>
          
          <div className="config-group">
            <label htmlFor="tolerance">Sensitivity: {config.tolerance}</label>
            <input
              id="tolerance"
              type="range"
              min="10"
              max="100"
              step="5"
              value={config.tolerance}
              onChange={(e) => setConfig(prev => ({ ...prev, tolerance: parseInt(e.target.value) }))}
              aria-describedby="tolerance-help"
            />
            <small id="tolerance-help" className="config-help">
              Input sensitivity threshold
            </small>
          </div>
          
          <div className="config-group">
            <label htmlFor="enableMagneticSnap">
              <input
                id="enableMagneticSnap"
                type="checkbox"
                checked={config.enableMagneticSnap}
                onChange={(e) => setConfig(prev => ({ ...prev, enableMagneticSnap: e.target.checked }))}
              />
              Magnetic Snap
            </label>
            <small className="config-help">
              Automatic snapping to sections
            </small>
          </div>
          
          <div className="config-group">
            <label htmlFor="magneticThreshold">Snap Threshold: {config.magneticThreshold}</label>
            <input
              id="magneticThreshold"
              type="range"
              min="0.05"
              max="0.3"
              step="0.05"
              value={config.magneticThreshold}
              onChange={(e) => setConfig(prev => ({ ...prev, magneticThreshold: parseFloat(e.target.value) }))}
              aria-describedby="threshold-help"
              disabled={!config.enableMagneticSnap}
            />
            <small id="threshold-help" className="config-help">
              Distance threshold for magnetic snap
            </small>
          </div>
          
          <button 
            onClick={applyConfig} 
            className="apply-config"
            disabled={!config.enableMagneticSnap && config.magneticThreshold !== 0.15}
          >
            Apply Changes
          </button>
        </div>
      )}
    </div>
  );
}