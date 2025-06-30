import React, { useState, useEffect } from 'react';

/**
 * PerformanceMonitor Component
 * 
 * Displays real-time performance metrics including FPS and frame timing.
 * Used in the StoryScroller demo to showcase smooth performance.
 */
export function PerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.7);
  
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
  
  return (
    <div className="performance-monitor">
      <div className="perf-metric">
        <span className="perf-value">{fps}</span>
        <span className="perf-label">FPS</span>
      </div>
      <div className="perf-metric">
        <span className="perf-value">{frameTime.toFixed(1)}</span>
        <span className="perf-label">ms</span>
      </div>
    </div>
  );
}